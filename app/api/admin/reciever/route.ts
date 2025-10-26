import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminWebhookConfig, getWebhookHeaders, verifyAdminWebhookSignature, type AdminWebhookEvent } from '../../../../lib/admin-webhooks';

const headers = getWebhookHeaders();

export async function POST(request: Request) {
  const config = getAdminWebhookConfig();
  if (!config) {
    return NextResponse.json({ ok: true, message: 'webhook disabled' }, { status: 200 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get(headers.signature);
  const timestamp = request.headers.get(headers.timestamp);

  const valid = verifyAdminWebhookSignature({
    rawBody,
    signatureHeader: signature,
    timestampHeader: timestamp,
    secret: config.secret,
  });

  if (!valid) {
    return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 401 });
  }

  let event: AdminWebhookEvent | null = null;
  try {
    event = JSON.parse(rawBody) as AdminWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 });
  }

  if (!event || typeof event !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 });
  }

  try {
    await revalidatePath('/admin');
  } catch (error) {
    console.warn('[admin-webhook] revalidate failed', error);
  }

  return NextResponse.json({ ok: true });
}
