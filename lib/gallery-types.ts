export const GALLERY_CATEGORIES = ['healed', 'available', 'flash', 'art'] as const;

export type GalleryCategory = typeof GALLERY_CATEGORIES[number];

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  category: GalleryCategory;
  size?: number;
  lastModified?: string;
}

export function isGalleryCategory(value: string): value is GalleryCategory {
  return (GALLERY_CATEGORIES as readonly string[]).includes(value);
}

export function getCategoryLabel(category: GalleryCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
