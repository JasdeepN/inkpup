"use client";
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isCalendlyBookingEnabled } from '../../lib/featureFlags';
import RevealOnScroll from '../../components/animations/RevealOnScroll';

function ContactFormAlerts() {
  const searchParams = useSearchParams();
  const success = searchParams?.get('success');
  const error = searchParams?.get('error');

  if (success) {
    return (
      <div className="admin-alert admin-alert--success p-4 rounded-lg">
        ✓ Message sent successfully! I&apos;ll get back to you soon.
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-alert admin-alert--error p-4 rounded-lg">
        ✗ Failed to send message. Please try again or DM me on Instagram.
      </div>
    );
  }

  return null;
}

function ContactFormContent() {
  const searchParams = useSearchParams();
  const urlDesign = searchParams?.get('design');
  const urlType = searchParams?.get('type');
  
  // Determine initial form type from URL params
  const getInitialFormType = () => {
    if (urlDesign) return 'flash';
    if (urlType === 'custom') return 'custom';
    return 'contact';
  };
  
  const [formType, setFormType] = useState<'contact' | 'flash' | 'custom'>(getInitialFormType());
  
  const isFlashBooking = formType === 'flash';
  const isCustomConsultation = formType === 'custom';
  
  let formTitle = "Contact Form";
  let formDescription = "";
  
  if (isFlashBooking) {
    formTitle = "Book Flash Design";
    formDescription = urlDesign 
      ? `You're booking design #${urlDesign}. Fill out the form below and I'll confirm availability within 24 hours.`
      : "Fill out the form below and I'll confirm availability within 24 hours.";
  } else if (isCustomConsultation) {
    formTitle = "Request Custom Consultation";
    formDescription = "Tell me about your custom tattoo vision. I'll review your request and respond within 48 hours with next steps.";
  }
  
  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{formTitle}</h1>
        {formDescription && <p className="text-muted">{formDescription}</p>}
      </div>
      
      <Suspense fallback={null}>
        <ContactFormAlerts />
      </Suspense>
      
      <form method="post" action="/api/contact" className="grid gap-3 w-full">
        {/* Form Type Selection */}
        <fieldset className="border border-border-glass rounded-lg p-4 space-y-2">
          <legend className="text-sm font-semibold px-2">I want to...</legend>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="form_type"
                value="contact"
                checked={formType === 'contact'}
                onChange={() => setFormType('contact')}
                className="cursor-pointer"
              />
              <span className="text-sm">Send a message</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="form_type"
                value="flash"
                checked={formType === 'flash'}
                onChange={() => setFormType('flash')}
                className="cursor-pointer"
              />
              <span className="text-sm">Book a flash design</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="form_type"
                value="custom"
                checked={formType === 'custom'}
                onChange={() => setFormType('custom')}
                className="cursor-pointer"
              />
              <span className="text-sm">Request custom consultation</span>
            </label>
          </div>
        </fieldset>

        {/* Hidden fields for context */}
        {urlDesign && <input type="hidden" name="design_id" value={urlDesign} />}
        <input type="hidden" name="booking_type" value={formType} />
        
        <label className="flex flex-col text-sm">
          <span>Name</span>
          <input 
            name="name" 
            data-testid="contact-name" 
            required 
            className="mt-1 p-2 border rounded bg-surface text-primary" 
          />
        </label>
        <label className="flex flex-col text-sm">
          <span>Email</span>
          <input 
            name="email" 
            data-testid="contact-email" 
            type="email" 
            required 
            className="mt-1 p-2 border rounded bg-surface text-primary" 
          />
        </label>
        
        {(isFlashBooking || isCustomConsultation) && (
          <label className="flex flex-col text-sm">
            <span>Phone (optional)</span>
            <input 
              name="phone" 
              type="tel"
              className="mt-1 p-2 border rounded bg-surface text-primary" 
              placeholder={isFlashBooking ? "For quick confirmation" : ""}
            />
          </label>
        )}
        
        {isFlashBooking && (
          <label className="flex flex-col text-sm">
            <span>Preferred Placement</span>
            <input 
              name="placement" 
              data-testid="contact-placement"
              required
              className="mt-1 p-2 border rounded bg-surface text-primary" 
              placeholder="e.g., forearm, ankle, shoulder"
            />
          </label>
        )}
        
        {isCustomConsultation && (
          <>
            <label className="flex flex-col text-sm">
              <span>Tattoo Concept</span>
              <textarea 
                name="concept" 
                data-testid="contact-concept"
                rows={4}
                required
                className="mt-1 p-2 border rounded bg-surface text-primary" 
                placeholder="Describe your vision, style preferences, and what this tattoo means to you"
              />
            </label>
            <label className="flex flex-col text-sm">
              <span>Placement & Size</span>
              <input 
                name="placement_size" 
                data-testid="contact-placement-size"
                required
                className="mt-1 p-2 border rounded bg-surface text-primary" 
                placeholder="e.g., full sleeve, small wrist piece (2 inches)"
              />
            </label>
            <label className="flex flex-col text-sm">
              <span>Budget Guidance (optional)</span>
              <select
                name="budget"
                className="mt-1 p-2 border rounded bg-surface text-primary"
              >
                <option value="">Select a range…</option>
                <option value="Under $300 · Micro / Small (≤3″)">Under $300 · Micro / Small (≤3″)</option>
                <option value="$300–$500 · Small Detailed (2–4″)">$300–$500 · Small Detailed (2–4″)</option>
                <option value="$500–$800 · Medium (4–6″)">$500–$800 · Medium (4–6″)</option>
                <option value="$800–$1200 · Large Single Session (6–8″)">$800–$1200 · Large Single Session (6–8″)</option>
                <option value="$1200–$2000 · Half Sleeve / Multi (10–18 hrs)">$1200–$2000 · Half Sleeve / Multi (10–18 hrs)</option>
                <option value="$2000+ · Sleeve / Back / Large Project">$2000+ · Sleeve / Back / Large Project</option>
              </select>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Typical Toronto custom hourly rate $150–$200. Multi-session sleeves often take 10–18+ hours. Final quote depends on detail, colour, placement & healed size.
              </p>
            </label>
          </>
        )}
        
        <label className="flex flex-col text-sm">
          <span>{isFlashBooking ? "Additional Notes (optional)" : isCustomConsultation ? "Reference Ideas or Additional Details" : "Message"}</span>
          <textarea 
            name="message" 
            data-testid="contact-message" 
            rows={isFlashBooking || isCustomConsultation ? 4 : 6} 
            required={!isFlashBooking && !isCustomConsultation}
            className="mt-1 p-2 border rounded bg-surface text-primary" 
            placeholder={isCustomConsultation ? "Mention any reference images, artists you admire, or specific style notes" : ""}
          />
        </label>
        <button type="submit" data-testid="contact-submit" className="btn btn--primary">
          {isFlashBooking ? "Request Booking" : isCustomConsultation ? "Submit Consultation Request" : "Send"}
        </button>
      </form>
    </div>
  );
}

export default function ContactPage() {
  const calendlyEnabled = isCalendlyBookingEnabled();
  
  return (
    <section className="max-w-3xl mx-auto space-y-8">
      <RevealOnScroll>
      <div>
        <h2 className="text-2xl font-bold">Contact & Booking</h2>
        <p className="text-muted">DM me on Insta or use the contact form below to send me an email directly.</p>
        <div className="mt-4 flex justify-center sm:justify-start">
          <a
            href="https://ig.me/m/inkpup.tattoos"
            target="_blank"
            rel="noreferrer"
            className="btn btn--secondary"
            data-testid="contact-instagram"
          >
            Send me a message on Instagram
          </a>
        </div>
      </div>
      </RevealOnScroll>

      {calendlyEnabled && (
        <RevealOnScroll delay={100}>
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-semibold">Book Online</h3>
          <p>
            Schedule via Calendly: <a className="text-accent underline" href="https://calendly.com/your-username" target="_blank" rel="noreferrer">Calendly booking</a>
          </p>
        </div>
        </RevealOnScroll>
      )}

      <RevealOnScroll delay={150}>
      <Suspense fallback={<div>Loading form...</div>}>
        <ContactFormContent />
      </Suspense>
      </RevealOnScroll>
    </section>
  );
}
