import { cache } from 'react';
import { listGalleryImages } from './r2-server';
import type { GalleryCategory } from './gallery-types';

export type HeroGalleryItem = Readonly<{
  src: string;
  alt: string;
  caption?: string;
  key?: string;
}>;

const DEFAULT_CATEGORY: GalleryCategory = 'healed';

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
  return (process.env.HERO_GALLERY_PREFIX ?? process.env.NEXT_PUBLIC_HERO_GALLERY_PREFIX ?? 'Hero') as string;
}

export const getHeroImages = cache(async (): Promise<HeroGalleryItem[]> => {
  const category = resolveHeroCategory();
  const prefix = resolveHeroPrefix();

  try {
    const result = await listGalleryImages(category, { fallback: true }).asPromise();
    const items = Array.isArray(result.items) ? result.items : [];

    // Only use images that live under the configured "Hero" prefix/folder.
    const filtered = items.filter((it) => {
      if (!it.key) return false;
      // Match keys like "<category>/<prefix>/..." or any key containing the prefix folder
      if (it.key.startsWith(`${category}/${prefix}/`)) return true;
      if (it.key.includes(`/${prefix}/`)) return true;
      return false;
    });

    if (filtered.length === 0) {
      // No hero images found in the Hero folder — return a bundled broken image placeholder from /public
      return [
        {
          src: '/hero-broken.svg',
          alt: 'Image not available',
          caption: 'Image not available',
          key: 'hero-broken',
        },
      ];
    }

    return filtered.map((it) => ({
      src: it.src,
      alt: it.alt || it.caption || 'Tattoo artwork',
      caption: it.caption,
      key: it.key,
    }));
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
