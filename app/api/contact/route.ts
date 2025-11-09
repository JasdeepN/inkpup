import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Using Resend Email API
// Free tier: 3,000 emails/month, 100 emails/day
// No external account setup needed beyond API key

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
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }

    const resend = new Resend(resendApiKey);

    try {
      const { data, error } = await resend.emails.send({
        from: 'InkPup Contact Form <noreply@mail.inkpup.ca>',
        to: [contactEmail],
        replyTo: email,
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

      if (error) {
        console.error('❌ Resend API error:', error);
        throw error;
      }

      console.log('✅ Email sent successfully via Resend:', { id: data?.id, name, email });
    } catch (emailError) {
      console.error('❌ Email send error:', emailError);
      console.log('📝 Contact form submission (logging only):', { name, email, message });
      // Continue to redirect even if email fails
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
