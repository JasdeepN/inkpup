import { cache } from 'react';
import { listGalleryImages } from './r2-server';
import type { GalleryCategory } from './gallery-types';
import { getD1Binding, getSetting } from './db/d1';

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

/**
 * Get the hero carousel image IDs from D1 site_settings.
 * Returns null if no selection has been made (show all images).
 */
async function getHeroCarouselIds(): Promise<string[] | null> {
  try {
    const db = getD1Binding();
    if (!db) {
      console.log('[hero-gallery] D1 not available for carousel IDs');
      return null;
    }
    
    const value = await getSetting(db, 'hero_carousel_ids');
    if (!value) {
      console.log('[hero-gallery] No carousel IDs configured, will show all images');
      return null;
    }
    
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.log('[hero-gallery] Invalid or empty carousel IDs');
      return null;
    }
    
    console.log('[hero-gallery] Carousel IDs from D1:', parsed);
    return parsed;
  } catch (error) {
    console.error('[hero-gallery] Error fetching carousel IDs:', error);
    return null;
  }
}

/**
 * Get the active hero ID from D1 site_settings.
 * Returns null if D1 is unavailable or no active hero is set.
 */
async function getActiveHeroId(): Promise<string | null> {
  try {
    const db = getD1Binding();
    if (!db) {
      console.log('[hero-gallery] D1 not available, using default ordering');
      return null;
    }
    
    const activeId = await getSetting(db, 'active_hero_id');
    console.log('[hero-gallery] Active hero ID from D1:', activeId || '(none)');
    return activeId;
  } catch (error) {
    console.error('[hero-gallery] Error fetching active hero ID:', error);
    return null;
  }
}

/**
 * Reorder images to put the active hero first.
 * If activeHeroId matches an image key or ID, that image is moved to index 0.
 */
function prioritizeActiveHero(
  items: HeroGalleryItem[],
  activeHeroId: string | null
): HeroGalleryItem[] {
  if (!activeHeroId || items.length === 0) {
    return items;
  }
  
  // Find the index of the active hero image
  const activeIndex = items.findIndex((item) => {
    // Match by key (R2 path) or by the ID portion of the key
    if (item.key === activeHeroId) return true;
    // Also match if activeHeroId is just the filename portion
    if (item.key?.endsWith(`/${activeHeroId}`)) return true;
    if (item.key?.includes(activeHeroId)) return true;
    return false;
  });
  
  if (activeIndex <= 0) {
    // Not found or already first
    return items;
  }
  
  // Move active image to front
  const reordered = [...items];
  const [activeItem] = reordered.splice(activeIndex, 1);
  reordered.unshift(activeItem);
  
  console.log('[hero-gallery] Reordered to prioritize active hero:', activeHeroId);
  return reordered;
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

    console.log('[hero-gallery] Filtered by prefix:', filtered.length);
    
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
    
    // Fetch carousel selection from D1 - if set, filter to only selected images
    const carouselIds = await getHeroCarouselIds();
    
    let selectedItems: HeroGalleryItem[];
    if (carouselIds && carouselIds.length > 0) {
      // Filter and sort by the order in carouselIds
      const orderedItems: HeroGalleryItem[] = [];
      for (const id of carouselIds) {
        const found = heroItems.find(item => 
          item.key === id || 
          item.key?.endsWith(`/${id}`) || 
          item.key?.includes(id)
        );
        if (found) {
          orderedItems.push(found);
        }
      }
      selectedItems = orderedItems;
      
      console.log('[hero-gallery] Filtered by carousel selection:', selectedItems.length, 'of', heroItems.length);
      
      // If none of the selected IDs match (maybe images were deleted), fall back to all
      if (selectedItems.length === 0) {
        console.log('[hero-gallery] No carousel selection matches found, using all images');
        selectedItems = heroItems;
      }
    } else {
      // No carousel selection - use all images with active hero prioritization (legacy behavior)
      const activeHeroId = await getActiveHeroId();
      selectedItems = prioritizeActiveHero(heroItems, activeHeroId);
      console.log('[hero-gallery] No carousel selection, using all images with active hero first');
    }
    
    console.log('[hero-gallery] Returning hero items:', selectedItems.length);
    return selectedItems;
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
