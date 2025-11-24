import Link from 'next/link';
import { createPageMetadata } from '../../lib/site-metadata';
import RevealOnScroll from '../../components/animations/RevealOnScroll';

export async function generateMetadata() {
  return createPageMetadata({
    title: `About — InkPup Tattoos`,
    description: `About InkPup Tattoos — hand-drawn custom tattoos and consults in Toronto.`,
  });
}

export default function AboutPage() {
  return (
    <section className="container max-w-3xl mx-auto space-y-8 py-8">
      <header className="space-y-3">
        <p className="text-accent font-semibold uppercase tracking-wide">Meet the artist</p>
        <h1 className="text-4xl font-bold">About InkPup Tattoos</h1>
        <p className="text-muted text-lg">
          I&apos;m Devin, the dog-dad and illustrator behind InkPup Tattoos. Every piece is drawn by hand
          and customized to celebrate the stories, pets, and people you love. Whether it&apos;s a delicate
          fine-line portrait or bold neo-traditional flash, I approach each project with curiosity and
          care so the final tattoo feels personal and expressive.
        </p>
      </header>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">What to expect</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted">
          <li>Collaborative consultations that translate your ideas into thoughtful designs.</li>
          <li>Single-use needles, welcoming atmosphere, and a sanitized studio set up for comfort.</li>
          <li>Detailed aftercare guidance so your tattoo heals clean and brilliant.</li>
        </ul>
      </div>

      <RevealOnScroll delay={200}>
        <div className="glass-panel glass-panel--interactive p-6">
          <h3 className="text-xl font-semibold">Studio details</h3>
          <dl className="grid gap-3 text-muted">
            <div>
              <dt className="font-semibold">Location</dt>
              <dd>Private studio near Ossington &amp; Dundas West, Toronto (exact address shared when booked).</dd>
            </div>
            <div>
              <dt className="font-semibold">Hours</dt>
              <dd>By appointment Only – Sunday. Evenings available for larger projects.</dd>
            </div>
            <div>
              <dt className="font-semibold">Contact</dt>
              <dd>Email via the <Link className="text-accent underline" href="/contact">contact form</Link> or DM <a className="text-accent underline" href="https://www.instagram.com/inkpup.tattoos/" target="_blank" rel="noreferrer">@inkpup.tattoos</a>.</dd>
            </div>
          </dl>
        </div>
      </RevealOnScroll>

      <RevealOnScroll delay={250}>
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Ready when you are</h3>
        <p className="text-muted">
          If you&apos;re exploring your first tattoo or planning your next sleeve, let&apos;s start with a chat.
          Share your references, your inspiration, and the story behind the piece—we&apos;ll design something
          that feels unmistakably you.
        </p>
        <Link className="btn btn--primary" href="/contact" data-testid="about-book">Book a consultation</Link>
      </div>
      </RevealOnScroll>
    </section>
  );
}
