import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Webhook } from 'svix';
import { getD1Binding } from '@/lib/db/d1';
import { createInboundEmail } from '@/lib/db/inquiry-emails';
import { notifyInquiryUpdate } from '@/lib/services/realtime';

// Lazy initialization to avoid build-time errors when RESEND_API_KEY is not available
let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Resend Webhook Event Types
 */
interface ResendEmailReceivedEvent {
  type: 'email.received';
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    bcc: string[];
    cc: string[];
    message_id: string;
    subject: string;
    attachments: Array<{
      id: string;
      filename: string;
      content_type: string;
      content_disposition: string;
      content_id?: string;
    }>;
  };
}

type ResendWebhookEvent = ResendEmailReceivedEvent | { type: string; data: unknown };

/**
 * Extract email address from "Name <email@example.com>" format
 */
function extractEmail(fromString: string): string {
  const match = fromString.match(/<(.+)>/);
  return (match?.[1] || fromString).toLowerCase().trim();
}

/**
 * POST /api/webhooks/resend
 * Handle Resend webhook events, primarily email.received for inbound emails.
 */
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const headers = {
    'svix-id': request.headers.get('svix-id') ?? '',
    'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
    'svix-signature': request.headers.get('svix-signature') ?? '',
  };

  // Verify webhook signature
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  let event: ResendWebhookEvent;

  // Dev bypass: Allow test signature in development for local testing
  const signature = headers['svix-signature'] || '';
  const isDevBypass = process.env.NODE_ENV === 'development' && signature.includes('dev_bypass_signature');

  if (isDevBypass) {
    console.warn('[Resend Webhook] ⚠️  Dev mode: Bypassing signature verification');
    try {
      event = JSON.parse(payload) as ResendWebhookEvent;
    } catch (parseErr) {
      console.error('[Resend Webhook] Failed to parse payload:', parseErr);
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
  } else if (!webhookSecret) {
    console.error('[Resend Webhook] Missing RESEND_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  } else {
    // Production: Verify signature with Svix
    try {
      const wh = new Webhook(webhookSecret);
      event = wh.verify(payload, headers) as ResendWebhookEvent;
    } catch (err) {
      console.error('[Resend Webhook] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  // Handle email.received event (customer replies)
  if (event.type === 'email.received') {
    const emailEvent = event as ResendEmailReceivedEvent;
    const senderEmail = extractEmail(emailEvent.data.from);

    console.log(`[Resend Webhook] Received inbound email from: ${senderEmail}`);

    // Get full email content from Resend Receiving API (not the outbound emails.get)
    // See: https://resend.com/docs/dashboard/receiving/get-email-content
    let emailContent = { text: '', html: '' };
    
    // In dev mode with bypass, use mock body (Resend API won't have this fake email)
    if (isDevBypass) {
      emailContent = { 
        text: '[DEV TEST] This is a mock email body for local testing.', 
        html: '<p>[DEV TEST] This is a mock email body for local testing.</p>' 
      };
      console.log('[Resend Webhook] Using mock email body for dev testing');
    } else {
      try {
        const { data, error } = await getResend().emails.receiving.get(emailEvent.data.email_id);
        if (error) {
          console.warn('[Resend Webhook] Receiving API error:', error);
        } else if (data) {
          emailContent = {
            text: data.text || '',
            html: data.html || '',
          };
          console.log(`[Resend Webhook] Fetched email body: ${emailContent.text?.length || 0} chars text, ${emailContent.html?.length || 0} chars html`);
        }
      } catch (fetchError) {
        console.warn('[Resend Webhook] Could not fetch email content:', fetchError);
        // Continue with empty body - we still want to record the email
      }
    }

    // Get D1 binding
    const db = getD1Binding();
    if (!db) {
      console.error('[Resend Webhook] D1 not available');
      // Return 200 to acknowledge receipt (don't retry)
      return NextResponse.json({ ok: true, error: 'Database unavailable' });
    }

    // Find matching inquiry by sender email
    const inquiry = await db
      .prepare('SELECT id, status FROM inquiries WHERE LOWER(email) = ?')
      .bind(senderEmail)
      .first<{ id: number; status: string }>();

    if (!inquiry) {
      console.warn(`[Resend Webhook] No inquiry found for email: ${senderEmail}`);
      // Return 200 to acknowledge - we don't want Resend to retry for unknown senders
      return NextResponse.json({ ok: true, matched: false, reason: 'no_matching_inquiry' });
    }

    // Store the inbound email
    const emailBody = emailContent.text || emailContent.html || '(no body)';
    const emailRecord = await createInboundEmail(db, {
      inquiry_id: inquiry.id,
      subject: emailEvent.data.subject,
      body: emailBody,
      from_email: senderEmail,
      resend_email_id: emailEvent.data.email_id,
    });

    if (!emailRecord) {
      console.error(`[Resend Webhook] Failed to store inbound email for inquiry ${inquiry.id}`);
      return NextResponse.json({ ok: true, matched: true, stored: false });
    }

    // Update inquiry status to 'pending' to indicate new customer activity
    // Only update if currently in 'replied' status (admin was waiting for response)
    if (inquiry.status === 'replied') {
      await db
        .prepare(`UPDATE inquiries SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(inquiry.id)
        .run();
      console.log(`[Resend Webhook] Updated inquiry ${inquiry.id} status to pending`);
    }

    console.log(`[Resend Webhook] ✅ Inbound email stored for inquiry ${inquiry.id}`);

    // Notify realtime worker (non-blocking)
    await notifyInquiryUpdate({
      type: 'email_received',
      inquiryId: inquiry.id,
      emailId: emailRecord.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      matched: true,
      stored: true,
      inquiryId: inquiry.id,
      emailId: emailRecord.id,
      notified: true,
    });
  }

  // Acknowledge other event types without processing
  console.log(`[Resend Webhook] Received event type: ${event.type} (not processed)`);
  return NextResponse.json({ ok: true, processed: false });
}
