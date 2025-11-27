import { Metadata } from 'next';
import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import { listGalleryImages } from '@/lib/r2-server';
import { createPageMetadata } from '@/lib/site-metadata';
import RevealOnScroll from '@/components/animations/RevealOnScroll';
import type { GalleryItem } from '@/lib/gallery-types';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'Flash Tattoos — Ready-to-Ink Designs',
    description: 'Browse our available flash tattoo designs. Pre-designed artwork, quick booking, affordable pricing, and same-week availability in Toronto GTA.',
  });
}

async function getFlashDesigns(): Promise<{ items: GalleryItem[]; isFallback: boolean }> {
  try {
    // Fetch flash and available categories in parallel
    const [flashResult, availableResult] = await Promise.all([
      listGalleryImages('flash'),
      listGalleryImages('available'),
    ]);

    // Handle the .asPromise() pattern if needed
    const flashResolved = typeof (flashResult as any)?.asPromise === 'function'
      ? await (flashResult as any).asPromise()
      : flashResult;
    const availableResolved = typeof (availableResult as any)?.asPromise === 'function'
      ? await (availableResult as any).asPromise()
      : availableResult;

    // Combine results, avoiding duplicates by id
    const seenIds = new Set<string>();
    const combinedItems: GalleryItem[] = [];
    
    for (const item of [...flashResolved.items, ...availableResolved.items]) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        combinedItems.push(item);
      }
    }

    return {
      items: combinedItems,
      isFallback: flashResolved.isFallback || availableResolved.isFallback,
    };
  } catch (error) {
    console.error('[Flash] Failed to fetch designs from R2:', error);
    return { items: [], isFallback: true };
  }
}

export default async function FlashPage() {
  const { items: flashDesigns, isFallback } = await getFlashDesigns();

  return (
    <div className="flash-page">
      <section className="flash-hero">
        <div className="container">
          <RevealOnScroll>
          <h1 className="flash-hero__title">Flash Tattoos</h1>
          <p className="flash-hero__subtitle">
            Ready-to-ink designs. Quick booking, affordable pricing.
          </p>
          </RevealOnScroll>
          
          <RevealOnScroll delay={100}>
          <div className="flash-pricing">
            <h2 className="flash-pricing__title">Pricing</h2>
            <p className="flash-pricing__text">
              Flash designs: <strong>$150–$300</strong>
            </p>
            <p className="flash-pricing__note">
              Final price depends on size and placement. Most flash pieces can be booked within 1 week.
            </p>
          </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="flash-gallery-section">
        <div className="container">
          <RevealOnScroll delay={200}>
          <h2 className="flash-gallery__heading">Available Flash Designs</h2>
          {isFallback && (
            <p className="text-sm text-muted mb-4">
              Gallery is temporarily unavailable. Showing cached designs.
            </p>
          )}
          </RevealOnScroll>
          
          {flashDesigns.length === 0 ? (
            <RevealOnScroll delay={250}>
            <p className="flash-gallery__empty">
              No flash designs available at this time. Check back soon or{' '}
              <Link href="/custom-design">request a custom design</Link>.
            </p>
            </RevealOnScroll>
          ) : (
            <RevealOnScroll delay={250}>
            <div className="flash-gallery">
              {flashDesigns.map((design) => (
                <div key={design.id} className="flash-card">
                  <div className="flash-card__image">
                    <SmartImage
                      src={design.src}
                      alt={design.alt}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                  
                  <div className="flash-card__content">
                    <h3 className="flash-card__title">{design.alt}</h3>
                    {design.caption && (
                      <p className="flash-card__caption">{design.caption}</p>
                    )}
                    <p className="flash-card__id">Design ID: {design.id}</p>
                    
                    <Link 
                      href={`/contact?design=${design.id}`}
                      className="btn btn--flash flash-card__cta"
                    >
                      Book This Design
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            </RevealOnScroll>
          )}
        </div>
      </section>

      <RevealOnScroll delay={300}>
      <section className="flash-cta-section">
        <div className="container">
          <div className="flash-cta">
            <h2 className="flash-cta__title">Don&apos;t See What You&apos;re Looking For?</h2>
            <p className="flash-cta__text">
              We also create custom one-of-a-kind tattoos designed specifically for you.
            </p>
            <Link href="/custom-design" className="btn btn--custom">
              Request Custom Design
            </Link>
          </div>
        </div>
      </section>
      </RevealOnScroll>
    </div>
  );
}
