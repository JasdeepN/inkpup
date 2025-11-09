import { cache } from 'react';
import { listGalleryImages } from './r2-server';
import type { GalleryCategory } from './gallery-types';

export type HeroGalleryItem = Readonly<{
  src: string;
  alt: string;
  caption?: string;
  key?: string;
}>;

const DEFAULT_CATEGORY: GalleryCategory = 'hero';

function resolveHeroCategory(): GalleryCategory {
  const raw = process.env.HERO_GALLERY_CATEGORY ?? process.env.NEXT_PUBLIC_HERO_GALLERY_CATEGORY;
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (normalized) {
      return (normalized as GalleryCategory);
    }
  }
  return DEFAULT_CATEGORY;
}

function resolveHeroPrefix(): string {
  return (process.env.HERO_GALLERY_PREFIX ?? process.env.NEXT_PUBLIC_HERO_GALLERY_PREFIX ?? '') as string;
}

export const getHeroImages = cache(async (): Promise<HeroGalleryItem[]> => {
  const category = resolveHeroCategory();
  const prefix = resolveHeroPrefix();

  console.log('[hero-gallery] Fetching hero images...');
  console.log('[hero-gallery] Category:', category);
  console.log('[hero-gallery] Prefix:', prefix || '(empty)');

  try {
    const result = await listGalleryImages(category, { fallback: true }).asPromise();
    const items = Array.isArray(result.items) ? result.items : [];
    
    console.log('[hero-gallery] R2 fetch result:', {
      itemsCount: items.length,
      isFallback: result.isFallback,
      fallbackReason: result.fallbackReason,
      items: items.map(i => ({ key: i.key, src: i.src }))
    });

    // If no prefix is configured, use all images from the category.
    // Otherwise, only use images that live under the configured prefix/folder.
    const filtered = items.filter((it) => {
      if (!it.key) return false;
      if (!prefix) {
        // No prefix: use all images in the category
        return it.key.startsWith(`${category}/`);
      }
      // Match keys like "<category>/<prefix>/..." or any key containing the prefix folder
      if (it.key.startsWith(`${category}/${prefix}/`)) return true;
      if (it.key.includes(`/${prefix}/`)) return true;
      return false;
    });

    console.log('[hero-gallery] Filtered images:', filtered.length);
    
    if (filtered.length === 0) {
      // No hero images found in the Hero folder — return a bundled broken image placeholder from /public
      console.log('[hero-gallery] No images found, returning placeholder');
      return [
        {
          src: '/hero-broken.svg',
          alt: 'Image not available',
          caption: 'Image not available',
          key: 'hero-broken',
        },
      ];
    }

    const heroItems = filtered.map((it) => ({
      src: it.src,
      alt: it.alt || it.caption || 'Tattoo artwork',
      caption: it.caption,
      key: it.key,
    }));
    
    console.log('[hero-gallery] Returning hero items:', heroItems.length);
    return heroItems;
  } catch (err) {
    console.error('getHeroImages failed', err);
    return [
      {
        src: '/hero-broken.svg',
        alt: 'Image not available',
        caption: 'Image not available',
        key: 'hero-broken',
      },
    ];
  }
});
