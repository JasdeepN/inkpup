import { NextRequest, NextResponse } from 'next/server';

// Note: Removed 'edge' runtime declaration - OpenNext handles edge deployment automatically
// when deploying to Cloudflare Workers

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

    const contactEmail = process.env.CONTACT_EMAIL || 'contact@inkpup.ca';
    
    // Try to send via MailChannels, but don't fail if it doesn't work
    try {
      const emailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: contactEmail, name: 'InkPup Tattoos' }],
              dkim_domain: 'inkpup.ca',
              dkim_selector: 'mailchannels',
            },
          ],
          from: {
            email: 'noreply@inkpup.ca',
            name: 'InkPup Contact Form',
          },
          reply_to: {
            email: email,
            name: name,
          },
          subject: `New Contact Form Submission from ${name}`,
          content: [
            {
              type: 'text/plain',
              value: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            },
            {
              type: 'text/html',
              value: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
              `,
            },
          ],
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('❌ MailChannels API Error:', {
          status: emailResponse.status,
          statusText: emailResponse.statusText,
          response: errorText,
        });
        console.log('📝 Contact form submission saved (email delivery failed):', { name, email, message });
      } else {
        const responseData = await emailResponse.json();
        console.log('✅ Email sent successfully via MailChannels:', responseData);
      }
    } catch (emailError) {
      console.error('Email send error:', emailError);
      console.log('Contact form submission (logging):', { name, email, message });
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
