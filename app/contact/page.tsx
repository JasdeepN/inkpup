import { isCalendlyBookingEnabled } from '../../lib/featureFlags';

export default function ContactPage() {
  const calendlyEnabled = isCalendlyBookingEnabled();
  return (
    <section className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Contact & Booking</h2>
        <p className="text-gray-700">DM me on Insta or use the contact form below to send me an email directly.</p>
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

      {calendlyEnabled && (
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-semibold">Book Online</h3>
          <p>
            Schedule via Calendly: <a className="text-accent underline" href="https://calendly.com/your-username" target="_blank" rel="noreferrer">Calendly booking</a>
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Form</h3>
        <form method="post" action="/api/contact" className="grid gap-3 max-w-md mx-auto">
          <label className="flex flex-col text-sm">
            <span>Name</span>
            <input name="name" data-testid="contact-name" required className="mt-1 p-2 border rounded" />
          </label>
          <label className="flex flex-col text-sm">
            <span>Email</span>
            <input name="email" data-testid="contact-email" type="email" required className="mt-1 p-2 border rounded" />
          </label>
          <label className="flex flex-col text-sm">
            <span>Message</span>
            <textarea name="message" data-testid="contact-message" rows={6} required className="mt-1 p-2 border rounded" />
          </label>
          <button type="submit" data-testid="contact-submit" className="btn btn--primary">Send</button>
        </form>
      </div>
    </section>
  );
}
