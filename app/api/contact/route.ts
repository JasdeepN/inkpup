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
    
    // Optional booking-specific fields
    const designId = formData.get('design_id') as string | null;
    const bookingType = formData.get('booking_type') as string | null;
    const phone = formData.get('phone') as string | null;
    const placement = formData.get('placement') as string | null;
    const concept = formData.get('concept') as string | null;
    const placementSize = formData.get('placement_size') as string | null;
    const budget = formData.get('budget') as string | null;

    // Validate required inputs
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
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

    const contactEmail = process.env.CONTACT_EMAIL || 'jasdeepn4@gmail.com';
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn('⚠️  RESEND_API_KEY not configured - email will not be sent');
      console.log('📝 Contact form submission (logging only):', { 
        name, email, message, designId, bookingType, phone, placement, concept, placementSize, budget 
      });
      // Continue to success redirect even without email service
      const url = new URL('/contact', request.url);
      url.searchParams.set('success', 'true');
      return NextResponse.redirect(url, 303);
    }

    const resend = new Resend(resendApiKey);
    
    // Build email subject based on booking type
    let subject = `New Contact Form Submission from ${name}`;
    if (designId) {
      subject = `🎨 Flash Booking Request - Design #${designId} - ${name}`;
    } else if (bookingType === 'custom') {
      subject = `✨ Custom Consultation Request - ${name}`;
    }
    
    // Build email body with conditional fields
    let textBody = `Name: ${name}\nEmail: ${email}\n`;
    if (phone) textBody += `Phone: ${phone}\n`;
    if (designId) textBody += `\n🎨 FLASH DESIGN: #${designId}\n`;
    if (bookingType) textBody += `Booking Type: ${bookingType}\n`;
    if (placement) textBody += `Placement: ${placement}\n`;
    if (concept) textBody += `\nConcept:\n${concept}\n`;
    if (placementSize) textBody += `Placement & Size: ${placementSize}\n`;
    if (budget) textBody += `Budget Range: ${budget}\n`;
    if (message) textBody += `\nMessage:\n${message}`;
    
    let htmlBody = `<h2>${designId ? '🎨 Flash Booking Request' : bookingType === 'custom' ? '✨ Custom Consultation Request' : 'Contact Form Submission'}</h2>`;
    htmlBody += `<p><strong>Name:</strong> ${name}</p>`;
    htmlBody += `<p><strong>Email:</strong> ${email}</p>`;
    if (phone) htmlBody += `<p><strong>Phone:</strong> ${phone}</p>`;
    if (designId) htmlBody += `<p><strong>Flash Design:</strong> #${designId}</p>`;
    if (bookingType) htmlBody += `<p><strong>Booking Type:</strong> ${bookingType}</p>`;
    if (placement) htmlBody += `<p><strong>Placement:</strong> ${placement}</p>`;
    if (concept) htmlBody += `<p><strong>Concept:</strong></p><p>${concept.replace(/\n/g, '<br>')}</p>`;
    if (placementSize) htmlBody += `<p><strong>Placement & Size:</strong> ${placementSize}</p>`;
    if (budget) htmlBody += `<p><strong>Budget Range:</strong> ${budget}</p>`;
    if (message) htmlBody += `<p><strong>${designId ? 'Additional Notes' : bookingType === 'custom' ? 'Reference Ideas' : 'Message'}:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`;

    try {
      const { data, error } = await resend.emails.send({
        from: 'InkPup Contact Form <contact@mail.inkpup.ca>',
        to: [contactEmail],
        replyTo: email,
        subject,
        text: textBody,
        html: htmlBody,
      });

      if (error) {
        console.error('❌ Resend API error:', error);
        throw error;
      }

      console.log('✅ Email sent successfully via Resend:', { 
        id: data?.id, name, email, type: bookingType || 'general', designId 
      });
    } catch (emailError) {
      console.error('❌ Email send error:', emailError);
      console.log('📝 Contact form submission (logging only):', { 
        name, email, message, designId, bookingType 
      });
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
