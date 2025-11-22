import { Metadata } from 'next';
import Link from 'next/link';
import SmartImage from '../../components/SmartImage';
import gallery from '../../data/gallery';
import { createPageMetadata } from '../../lib/site-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'Custom Tattoo Design — Personalized Original Art',
    description: 'Commission a custom tattoo designed exclusively for you. Collaborative design process, original artwork, and expert execution in Toronto GTA.',
  });
}

export default function CustomDesignPage() {
  // Show 2-3 custom work examples from portfolio (healed category as proxy for custom work)
  const customExamples = gallery
    .filter(item => item.category === 'healed')
    .slice(0, 3);

  return (
    <div className="custom-page">
      <section className="custom-hero">
        <div className="container">
          <h1 className="custom-hero__title">Custom Tattoo Design</h1>
          <p className="custom-hero__subtitle">
            Your vision, our expertise. Original art designed exclusively for you.
          </p>
        </div>
      </section>

      <section className="custom-process">
        <div className="container">
          <h2 className="custom-process__title">How It Works</h2>
          
          <div className="custom-process__steps">
            <div className="custom-step">
              <div className="custom-step__number">1</div>
              <h3 className="custom-step__title">Consultation</h3>
              <p className="custom-step__text">
                 Share your concept, style preferences, placement, and reference images. We&apos;ll discuss your vision in detail.
              </p>
            </div>

            <div className="custom-step">
              <div className="custom-step__number">2</div>
              <h3 className="custom-step__title">Design</h3>
              <p className="custom-step__text">
                We create original artwork tailored to your body, style, and story. Design deposit: $100 (applied to final price).
              </p>
            </div>

            <div className="custom-step">
              <div className="custom-step__number">3</div>
              <h3 className="custom-step__title">Review & Revise</h3>
              <p className="custom-step__text">
                 Review your custom design. We&apos;ll work together to refine until it&apos;s perfect—typically 1-2 revision rounds.
              </p>
            </div>

            <div className="custom-step">
              <div className="custom-step__number">4</div>
              <h3 className="custom-step__title">Quote</h3>
              <p className="custom-step__text">
                Receive transparent pricing based on final design size, complexity, and estimated hours. No hidden fees.
              </p>
            </div>

            <div className="custom-step">
              <div className="custom-step__number">5</div>
              <h3 className="custom-step__title">Book & Ink</h3>
              <p className="custom-step__text">
                Schedule your session (typically 2-4 weeks out). Bring your custom art to life with expert execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="custom-pricing">
        <div className="container">
          <h2 className="custom-pricing__title">Pricing Structure</h2>
          
          <div className="custom-pricing__cards">
            <div className="custom-pricing__card">
              <h3 className="custom-pricing__card-title">Design Deposit</h3>
              <div className="custom-pricing__amount">$100</div>
              <p className="custom-pricing__card-text">
                Non-refundable design fee. Applied to your final tattoo price. Covers initial consultation and custom artwork creation.
              </p>
            </div>

            <div className="custom-pricing__card">
              <h3 className="custom-pricing__card-title">Hourly Rate</h3>
              <div className="custom-pricing__amount">$150–$200</div>
              <p className="custom-pricing__card-text">
                Custom tattoo hourly rate based on complexity and detail level. Final quote provided after design review based on estimated hours.
              </p>
            </div>
          </div>

          <p className="custom-pricing__note">
            Timeline: Consultation → Design (1 week) → Revisions (3-5 days) → Booking (2-4 weeks)
          </p>
          
          <div className="text-center mt-6">
            <Link href="/pricing" className="btn btn--secondary">
              View Full Pricing Guide
            </Link>
          </div>
        </div>
      </section>

      {customExamples.length > 0 && (
        <section className="custom-showcase">
          <div className="container">
            <h2 className="custom-showcase__title">Custom Work Gallery</h2>
            <p className="custom-showcase__subtitle">
                Examples of one-of-a-kind designs we&apos;ve created for clients
            </p>
            
            <div className="custom-showcase__grid">
              {customExamples.map((example) => (
                <div key={example.id} className="custom-showcase__item">
                  <div className="custom-showcase__image">
                    <SmartImage
                      src={example.src}
                      alt={example.alt}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                  <p className="custom-showcase__caption">{example.alt}</p>
                </div>
              ))}
            </div>

            <div className="custom-showcase__cta">
              <Link href="/portfolio" className="btn btn--secondary">
                View Full Portfolio
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="custom-cta-section">
        <div className="container">
          <div className="custom-cta">
            <h2 className="custom-cta__title">Ready to Start Your Custom Design?</h2>
            <p className="custom-cta__text">
                Book a consultation to discuss your vision. We&apos;ll guide you through the entire creative process.
            </p>
            <Link href="/contact?type=custom" className="btn btn--custom btn--large">
              Request Consultation
            </Link>
            <p className="custom-cta__note">
              Looking for something quicker? <Link href="/flash" className="custom-cta__link">Browse flash designs</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
