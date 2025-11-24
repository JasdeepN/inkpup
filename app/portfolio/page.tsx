import GalleryView from '../../components/GalleryView';
import { listGalleryImages } from '../../lib/r2-server';
import type { GalleryCategory, GalleryItem } from '../../lib/gallery-types';
import { createPageMetadata } from '../../lib/site-metadata';
import RevealOnScroll from '../../components/animations/RevealOnScroll';

export async function generateMetadata() {
  return createPageMetadata({
    title: `Portfolio — InkPup Tattoos`,
    description: `Browse healed pieces, available designs, flash, and fine art from InkPup Tattoos.`,
  });
}

const DEFAULT_CATEGORY: GalleryCategory = 'healed';
const EXCLUDED_CATEGORIES: GalleryCategory[] = ['hero'];

function filterExcludedCategories(items: GalleryItem[]): GalleryItem[] {
  return items.filter(item => !EXCLUDED_CATEGORIES.includes(item.category));
}

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
          items: filterExcludedCategories(resolved.items),
          fallback: resolved.isFallback,
          fallbackReason: resolved.fallbackReason,
          usedBundledFallback: resolved.usedBundledFallback,
          credentialStatus: resolved.credentialStatus,
        }}
      />
    </section>
  );
}

