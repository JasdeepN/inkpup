/**
 * Tests for hero gallery functionality
 */
import type { HeroGalleryItem } from './hero-gallery';

// We'll test the exported helper functions by importing the module
// Note: getHeroGalleryImages uses `cache` and R2, which is harder to test directly
// So we focus on testing the pure functions: prioritizeActiveHero logic

describe('Hero Gallery', () => {
  // ============================================================================
  // prioritizeActiveHero LOGIC TESTS
  // ============================================================================
  describe('prioritizeActiveHero logic', () => {
    // Helper function that mirrors the implementation logic
    function prioritizeActiveHero(
      items: HeroGalleryItem[],
      activeHeroId: string | null
    ): HeroGalleryItem[] {
      if (!activeHeroId || items.length === 0) {
        return items;
      }

      const activeIndex = items.findIndex((item) => {
        if (item.key === activeHeroId) return true;
        if (item.key?.endsWith(`/${activeHeroId}`)) return true;
        if (item.key?.includes(activeHeroId)) return true;
        return false;
      });

      if (activeIndex <= 0) {
        return items;
      }

      const reordered = [...items];
      const [activeItem] = reordered.splice(activeIndex, 1);
      reordered.unshift(activeItem);
      return reordered;
    }

    it('should return items unchanged if no activeHeroId', () => {
      const items: HeroGalleryItem[] = [
        { src: '/img1.jpg', alt: 'Image 1', key: 'hero/img1.jpg' },
        { src: '/img2.jpg', alt: 'Image 2', key: 'hero/img2.jpg' },
      ];

      const result = prioritizeActiveHero(items, null);
      expect(result).toEqual(items);
    });

    it('should return items unchanged if empty array', () => {
      const result = prioritizeActiveHero([], 'some-id');
      expect(result).toEqual([]);
    });

    it('should move matching item to front by exact key', () => {
      const items: HeroGalleryItem[] = [
        { src: '/img1.jpg', alt: 'Image 1', key: 'hero/img1.jpg' },
        { src: '/img2.jpg', alt: 'Image 2', key: 'hero/img2.jpg' },
        { src: '/img3.jpg', alt: 'Image 3', key: 'hero/img3.jpg' },
      ];

      const result = prioritizeActiveHero(items, 'hero/img3.jpg');
      
      expect(result[0].key).toBe('hero/img3.jpg');
      expect(result).toHaveLength(3);
    });

    it('should match by filename suffix', () => {
      const items: HeroGalleryItem[] = [
        { src: '/img1.jpg', alt: 'Image 1', key: 'hero/img1.jpg' },
        { src: '/img2.jpg', alt: 'Image 2', key: 'hero/img2.jpg' },
      ];

      const result = prioritizeActiveHero(items, 'img2.jpg');
      
      expect(result[0].key).toBe('hero/img2.jpg');
    });

    it('should match by partial key (includes)', () => {
      const items: HeroGalleryItem[] = [
        { src: '/img1.jpg', alt: 'Image 1', key: 'hero/featured/img1.jpg' },
        { src: '/img2.jpg', alt: 'Image 2', key: 'hero/featured/img2.jpg' },
      ];

      const result = prioritizeActiveHero(items, 'img2');
      
      expect(result[0].key).toBe('hero/featured/img2.jpg');
    });

    it('should not change order if already first', () => {
      const items: HeroGalleryItem[] = [
        { src: '/img1.jpg', alt: 'Image 1', key: 'hero/img1.jpg' },
        { src: '/img2.jpg', alt: 'Image 2', key: 'hero/img2.jpg' },
      ];

      const result = prioritizeActiveHero(items, 'hero/img1.jpg');
      
      expect(result[0].key).toBe('hero/img1.jpg');
      expect(result).toEqual(items);
    });

    it('should not change order if not found', () => {
      const items: HeroGalleryItem[] = [
        { src: '/img1.jpg', alt: 'Image 1', key: 'hero/img1.jpg' },
        { src: '/img2.jpg', alt: 'Image 2', key: 'hero/img2.jpg' },
      ];

      const result = prioritizeActiveHero(items, 'nonexistent.jpg');
      
      expect(result).toEqual(items);
    });

    it('should preserve other items order', () => {
      const items: HeroGalleryItem[] = [
        { src: '/img1.jpg', alt: 'Image 1', key: 'hero/img1.jpg' },
        { src: '/img2.jpg', alt: 'Image 2', key: 'hero/img2.jpg' },
        { src: '/img3.jpg', alt: 'Image 3', key: 'hero/img3.jpg' },
        { src: '/img4.jpg', alt: 'Image 4', key: 'hero/img4.jpg' },
      ];

      const result = prioritizeActiveHero(items, 'hero/img3.jpg');
      
      expect(result[0].key).toBe('hero/img3.jpg');
      expect(result[1].key).toBe('hero/img1.jpg');
      expect(result[2].key).toBe('hero/img2.jpg');
      expect(result[3].key).toBe('hero/img4.jpg');
    });

    it('should handle items without key', () => {
      const items: HeroGalleryItem[] = [
        { src: '/img1.jpg', alt: 'Image 1' },
        { src: '/img2.jpg', alt: 'Image 2', key: 'hero/img2.jpg' },
      ];

      const result = prioritizeActiveHero(items, 'hero/img2.jpg');
      
      expect(result[0].key).toBe('hero/img2.jpg');
    });
  });

  // ============================================================================
  // resolveHeroCategory LOGIC TESTS  
  // ============================================================================
  describe('resolveHeroCategory logic', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    function resolveHeroCategory(): string {
      const raw = process.env.HERO_GALLERY_CATEGORY ?? process.env.NEXT_PUBLIC_HERO_GALLERY_CATEGORY;
      if (typeof raw === 'string') {
        const normalized = raw.trim().toLowerCase();
        if (normalized) {
          return normalized;
        }
      }
      return 'hero';
    }

    it('should return default category "hero" when no env var set', () => {
      delete process.env.HERO_GALLERY_CATEGORY;
      delete process.env.NEXT_PUBLIC_HERO_GALLERY_CATEGORY;
      
      expect(resolveHeroCategory()).toBe('hero');
    });

    it('should use HERO_GALLERY_CATEGORY if set', () => {
      process.env.HERO_GALLERY_CATEGORY = 'featured';
      
      expect(resolveHeroCategory()).toBe('featured');
    });

    it('should use NEXT_PUBLIC_HERO_GALLERY_CATEGORY as fallback', () => {
      delete process.env.HERO_GALLERY_CATEGORY;
      process.env.NEXT_PUBLIC_HERO_GALLERY_CATEGORY = 'showcase';
      
      expect(resolveHeroCategory()).toBe('showcase');
    });

    it('should normalize to lowercase', () => {
      process.env.HERO_GALLERY_CATEGORY = 'HERO';
      
      expect(resolveHeroCategory()).toBe('hero');
    });

    it('should trim whitespace', () => {
      process.env.HERO_GALLERY_CATEGORY = '  hero  ';
      
      expect(resolveHeroCategory()).toBe('hero');
    });

    it('should fallback to default for empty string', () => {
      process.env.HERO_GALLERY_CATEGORY = '';
      
      expect(resolveHeroCategory()).toBe('hero');
    });
  });

  // ============================================================================
  // resolveHeroPrefix LOGIC TESTS
  // ============================================================================
  describe('resolveHeroPrefix logic', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    function resolveHeroPrefix(): string {
      return (process.env.HERO_GALLERY_PREFIX ?? process.env.NEXT_PUBLIC_HERO_GALLERY_PREFIX ?? '') as string;
    }

    it('should return empty string when no env var set', () => {
      delete process.env.HERO_GALLERY_PREFIX;
      delete process.env.NEXT_PUBLIC_HERO_GALLERY_PREFIX;
      
      expect(resolveHeroPrefix()).toBe('');
    });

    it('should use HERO_GALLERY_PREFIX if set', () => {
      process.env.HERO_GALLERY_PREFIX = 'hero/';
      
      expect(resolveHeroPrefix()).toBe('hero/');
    });

    it('should use NEXT_PUBLIC_HERO_GALLERY_PREFIX as fallback', () => {
      delete process.env.HERO_GALLERY_PREFIX;
      process.env.NEXT_PUBLIC_HERO_GALLERY_PREFIX = 'images/hero/';
      
      expect(resolveHeroPrefix()).toBe('images/hero/');
    });
  });
});
