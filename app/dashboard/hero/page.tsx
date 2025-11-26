import { getD1Binding, getSetting } from '../../../lib/db/d1';
import { listGalleryImages } from '../../../lib/r2-server';
import HeroClient from './HeroClient';
import { D1UnavailableNotice } from '../../../components/admin/D1UnavailableNotice';

export const metadata = {
  title: 'Hero Carousel | Admin',
  description: 'Select images for the homepage hero carousel',
};

export default async function HeroPage() {
  const db = getD1Binding();
  const isD1Available = !!db;
  
  // Get hero images directly from R2 (source of truth for images)
  const gallery = await listGalleryImages('hero').asPromise();
  const heroImages = gallery.items.map((item) => ({
    id: item.id,
    src: item.src,
    alt: item.alt || item.caption || 'Hero image',
    caption: item.caption,
    category: 'hero' as const,
    size: item.size,
    width: item.width,
    height: item.height,
    lastModified: item.lastModified,
    key: item.key,
  }));
  
  // Get current carousel selection from D1
  let carouselIds: string[] | null = null;
  if (db) {
    try {
      const value = await getSetting(db, 'hero_carousel_ids');
      if (value) {
        const parsed = JSON.parse(value);
        carouselIds = Array.isArray(parsed) ? parsed : null;
      }
    } catch {
      carouselIds = null;
    }
  }

  return (
    <div className="space-y-6">
      <D1UnavailableNotice 
        isAvailable={isD1Available}
        affectedFeatures={[
          'Hero carousel selection persistence',
          'Image order saving'
        ]}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hero Carousel</h1>
          <p className="text-gray-400 mt-1">
            Select which images appear in the homepage hero carousel and their display order
          </p>
        </div>
      </div>

      <HeroClient images={heroImages} carouselIds={carouselIds} />
    </div>
  );
}
