export default function ContactPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Contact & Booking</h2>
        <p className="text-gray-700">Call us, email, or book online. Use the contact form below to send a message.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Book Online</h3>
        <p>Schedule via Calendly: <a className="text-accent underline" href="https://calendly.com/your-username" target="_blank" rel="noreferrer">Calendly booking</a></p>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Contact Form</h3>
        <form method="post" action="/api/contact" className="grid gap-3 max-w-md">
          <label className="flex flex-col text-sm">
            <span>Name</span>
            <input name="name" required className="mt-1 p-2 border rounded" />
          </label>
          <label className="flex flex-col text-sm">
            <span>Email</span>
            <input name="email" type="email" required className="mt-1 p-2 border rounded" />
          </label>
          <label className="flex flex-col text-sm">
            <span>Message</span>
            <textarea name="message" rows={6} required className="mt-1 p-2 border rounded" />
          </label>
          <button type="submit" className="btn btn--primary">Send</button>
        </form>
      </div>
    </section>
  );
}
