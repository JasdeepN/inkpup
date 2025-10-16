import GalleryView from '../../components/GalleryView';
import { listGalleryImages } from '../../lib/r2-server';
import type { GalleryCategory } from '../../lib/gallery-types';

const DEFAULT_CATEGORY: GalleryCategory = 'healed';

export default async function PortfolioPage() {
  const legacyResult = listGalleryImages(DEFAULT_CATEGORY);
  const resolved = typeof (legacyResult as { asPromise?: () => Promise<any> })?.asPromise === 'function'
    ? await legacyResult.asPromise()
    : await legacyResult;

  return (
    <section className="portfolio-gallery">
      <div className="portfolio-gallery__intro">
        <h2 className="portfolio-gallery__title">Portfolio</h2>
        <p className="portfolio-gallery__subtitle">Browse healed pieces, available designs, flash, and fine art!</p>
      </div>
      <GalleryView
        initialCategory={DEFAULT_CATEGORY}
        initialData={{
          items: resolved.items,
          fallback: resolved.isFallback,
          fallbackReason: resolved.fallbackReason,
          usedBundledFallback: resolved.usedBundledFallback,
          credentialStatus: resolved.credentialStatus,
        }}
      />
    </section>
  );
}
