import GalleryView from '../../components/GalleryView';
import { listGalleryImages } from '../../lib/r2-server';
import type { GalleryCategory } from '../../lib/gallery-types';

const DEFAULT_CATEGORY: GalleryCategory = 'healed';

export default async function PortfolioPage() {
  const initialData = await listGalleryImages(DEFAULT_CATEGORY);

  return (
    <section className="portfolio-gallery">
      <div className="portfolio-gallery__intro">
        <h2 className="portfolio-gallery__title">Portfolio</h2>
        <p className="portfolio-gallery__subtitle">Browse healed pieces, available designs, flash, and fine art!</p>
      </div>
      <GalleryView
        initialCategory={DEFAULT_CATEGORY}
        initialData={{
          items: initialData.items,
          fallback: initialData.isFallback,
          fallbackReason: initialData.fallbackReason,
        }}
      />
    </section>
  );
}
