import { cache } from 'react';
import { listGalleryImages } from './r2-server';
import type { GalleryCategory, GalleryItem } from './gallery-types';
import { isGalleryCategory } from './gallery-types';

export type HeroImagePayload = Pick<GalleryItem, 'src' | 'alt' | 'caption' | 'category'>;

const DEFAULT_CATEGORY: GalleryCategory = 'healed';

function resolveHeroCategory(): GalleryCategory {
  const raw = process.env.HERO_GALLERY_CATEGORY ?? process.env.NEXT_PUBLIC_HERO_GALLERY_CATEGORY;
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (normalized && isGalleryCategory(normalized)) {
      return normalized;
    }
  }
  return DEFAULT_CATEGORY;
}

export const getHeroImage = cache(async (): Promise<HeroImagePayload | null> => {
  const category = resolveHeroCategory();

  try {
    const items = await listGalleryImages(category, { fallback: false });
    const candidate = items.find((item) => Boolean(item.src));
    if (!candidate) {
      return null;
    }
    return {
      src: candidate.src,
      alt: candidate.alt || candidate.caption || 'Tattoo artwork',
      caption: candidate.caption,
      category,
    };
  } catch (error) {
    console.error('Failed to load hero image from R2', error);
    return null;
  }
});
