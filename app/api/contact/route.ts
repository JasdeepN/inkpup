import { NextRequest, NextResponse } from 'next/server';

// Using Cloudflare Email Workers native send_email binding
// Free tier: 100k Workers requests/day, no external service dependencies

interface CloudflareEnv {
  SEND_EMAIL?: {
    send: (message: {
      to: Array<{ email: string; name?: string }>;
      from: { email: string; name?: string };
      subject: string;
      text?: string;
      html?: string;
      reply_to?: string;
    }) => Promise<void>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    // Validate inputs
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const contactEmail = process.env.CONTACT_EMAIL || 'test@inkpup.ca';
    
    // Get Cloudflare email binding from environment
    const env = process.env as unknown as CloudflareEnv;
    
    try {
      if (!env.SEND_EMAIL) {
        throw new Error('SEND_EMAIL binding not configured - check wrangler.toml');
      }

      await env.SEND_EMAIL.send({
        to: [{ email: contactEmail }],
        from: { email: 'noreply@inkpup.ca', name: 'InkPup Contact Form' },
        reply_to: email,
        subject: `New Contact Form Submission from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      });

      console.log('✅ Email sent successfully via Cloudflare Email Workers:', { name, email });
    } catch (emailError) {
      console.error('❌ Email send error:', emailError);
      console.log('📝 Contact form submission (logging only):', { name, email, message });
    }

    // Always redirect with success - the message is logged even if email fails
    const url = new URL('/contact', request.url);
    url.searchParams.set('success', 'true');
    return NextResponse.redirect(url, 303);
  } catch (error) {
    console.error('Contact form error:', error);
    const url = new URL('/contact', request.url);
    url.searchParams.set('error', 'true');
    return NextResponse.redirect(url, 303);
  }
}
