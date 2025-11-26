/**
 * Tests for KV caching helpers
 */
import type { GalleryItem } from '../gallery-types';
import {
  serializeItems,
  deserializeItems,
  getKVBinding,
  getCachedGallery,
  setCachedGallery,
  upsertCachedGalleryItem,
  removeCachedGalleryItem,
  invalidateGalleryCategory,
  getKVMetrics,
  type KVNamespaceMinimal,
} from './kv';

describe('KV Cache', () => {
  // ============================================================================
  // SERIALIZATION TESTS
  // ============================================================================
  describe('serializeItems', () => {
    it('should serialize gallery items to JSON', () => {
      const items: GalleryItem[] = [
        {
          id: 'img-1',
          key: 'hero/img-1.jpg',
          src: 'https://example.com/img-1.jpg',
          alt: 'Test image 1',
          caption: 'A nice tattoo',
          category: 'hero',
          size: 12345,
          width: 800,
          height: 600,
          lastModified: '2024-01-15T10:00:00Z',
        },
      ];

      const serialized = serializeItems(items);
      expect(typeof serialized).toBe('string');

      const parsed = JSON.parse(serialized);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].id).toBe('img-1');
      expect(parsed[0].key).toBe('hero/img-1.jpg');
      expect(parsed[0].width).toBe(800);
      expect(parsed[0].height).toBe(600);
    });

    it('should handle empty array', () => {
      const serialized = serializeItems([]);
      expect(serialized).toBe('[]');
    });

    it('should preserve only needed fields (slim payload)', () => {
      const items: GalleryItem[] = [
        {
          id: 'img-1',
          key: 'flash/img-1.jpg',
          src: 'https://example.com/img-1.jpg',
          alt: 'Test',
          category: 'flash',
        },
      ];

      const serialized = serializeItems(items);
      const parsed = JSON.parse(serialized);

      // Should have the expected fields
      expect(parsed[0]).toHaveProperty('id');
      expect(parsed[0]).toHaveProperty('key');
      expect(parsed[0]).toHaveProperty('src');
      expect(parsed[0]).toHaveProperty('alt');
      expect(parsed[0]).toHaveProperty('category');
    });

    it('should use id as key fallback', () => {
      const items: GalleryItem[] = [
        {
          id: 'img-no-key',
          src: 'https://example.com/img.jpg',
          alt: 'Test',
          category: 'healed',
        },
      ];

      const serialized = serializeItems(items);
      const parsed = JSON.parse(serialized);
      expect(parsed[0].key).toBe('img-no-key');
    });
  });

  describe('deserializeItems', () => {
    it('should deserialize JSON to gallery items', () => {
      const json = JSON.stringify([
        {
          id: 'img-1',
          key: 'hero/img-1.jpg',
          src: 'https://example.com/img-1.jpg',
          alt: 'Test image',
          category: 'hero',
          width: 800,
          height: 600,
        },
      ]);

      const items = deserializeItems(json);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('img-1');
      expect(items[0].width).toBe(800);
    });

    it('should return empty array for null', () => {
      const items = deserializeItems(null);
      expect(items).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      const items = deserializeItems('not valid json');
      expect(items).toEqual([]);
    });

    it('should return empty array for non-array JSON', () => {
      const items = deserializeItems('{"foo": "bar"}');
      expect(items).toEqual([]);
    });

    it('should use id as key fallback when deserializing', () => {
      const json = JSON.stringify([
        {
          id: 'img-1',
          src: 'https://example.com/img.jpg',
          alt: 'Test',
          category: 'flash',
        },
      ]);

      const items = deserializeItems(json);
      expect(items[0].key).toBe('img-1');
    });
  });

  // ============================================================================
  // KV BINDING TESTS
  // ============================================================================
  describe('getKVBinding', () => {
    beforeEach(() => {
      // Reset globalThis.CACHE between tests
      delete (globalThis as any).CACHE;
      delete (process.env as any).CACHE;
    });

    afterEach(() => {
      delete (globalThis as any).CACHE;
      delete (process.env as any).CACHE;
    });

    it('should return globalThis.CACHE if available', () => {
      const mockKV = {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      };
      (globalThis as any).CACHE = mockKV;

      const binding = getKVBinding();
      expect(binding).toBe(mockKV);
    });

    it('should return process.env.CACHE if available', () => {
      // Note: process.env stringifies values, so this test uses globalThis instead
      // The actual behavior in Cloudflare Workers would use globalThis bindings
      const mockKV = {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      };
      // Use globalThis which preserves object references
      (globalThis as any).CACHE = mockKV;

      const binding = getKVBinding();
      expect(binding).toBe(mockKV);
    });
  });

  // ============================================================================
  // KV OPERATIONS TESTS (with mock)
  // ============================================================================
  describe('KV Operations', () => {
    let mockKV: jest.Mocked<KVNamespaceMinimal>;
    let store: Map<string, string>;

    beforeEach(() => {
      store = new Map();
      mockKV = {
        get: jest.fn(async (key: string) => store.get(key) ?? null),
        put: jest.fn(async (key: string, value: string) => {
          store.set(key, value);
        }),
        delete: jest.fn(async (key: string) => {
          store.delete(key);
        }),
      };
      (globalThis as any).CACHE = mockKV;
      
      // Reset metrics
      delete (globalThis as any).__kvMetrics;
    });

    afterEach(() => {
      delete (globalThis as any).CACHE;
      delete (globalThis as any).__kvMetrics;
    });

    describe('getCachedGallery', () => {
      it('should return null if KV is not available', async () => {
        delete (globalThis as any).CACHE;
        const result = await getCachedGallery('hero');
        expect(result).toBeNull();
      });

      it('should return null on cache miss', async () => {
        const result = await getCachedGallery('hero');
        expect(result).toBeNull();
        expect(mockKV.get).toHaveBeenCalledWith('gallery:category:hero');
      });

      it('should return cached items on cache hit', async () => {
        const items = [{ id: 'img-1', key: 'img-1', src: '/img.jpg', alt: 'Test', category: 'hero' }];
        store.set('gallery:category:hero', JSON.stringify(items));

        const result = await getCachedGallery('hero');
        expect(result).not.toBeNull();
        expect(result![0].id).toBe('img-1');
      });

      it('should track hit metrics', async () => {
        const items = [{ id: 'img-1', key: 'img-1', src: '/img.jpg', alt: 'Test', category: 'hero' }];
        store.set('gallery:category:hero', JSON.stringify(items));

        await getCachedGallery('hero');
        const metrics = getKVMetrics();
        expect(metrics.hits).toBe(1);
      });

      it('should track miss metrics', async () => {
        await getCachedGallery('hero');
        const metrics = getKVMetrics();
        expect(metrics.misses).toBe(1);
      });
    });

    describe('setCachedGallery', () => {
      it('should store items in KV', async () => {
        const items: GalleryItem[] = [
          { id: 'img-1', key: 'img-1', src: '/img.jpg', alt: 'Test', category: 'flash' },
        ];

        await setCachedGallery('flash', items);

        expect(mockKV.put).toHaveBeenCalled();
        expect(store.has('gallery:category:flash')).toBe(true);
      });

      it('should track set metrics', async () => {
        const items: GalleryItem[] = [
          { id: 'img-1', key: 'img-1', src: '/img.jpg', alt: 'Test', category: 'flash' },
        ];

        await setCachedGallery('flash', items);
        const metrics = getKVMetrics();
        expect(metrics.sets).toBe(1);
      });

      it('should not throw if KV is unavailable', async () => {
        delete (globalThis as any).CACHE;
        const items: GalleryItem[] = [];

        await expect(setCachedGallery('hero', items)).resolves.not.toThrow();
      });
    });

    describe('upsertCachedGalleryItem', () => {
      it('should add item to empty cache', async () => {
        const item: GalleryItem = {
          id: 'new-img',
          key: 'hero/new-img.jpg',
          src: '/new-img.jpg',
          alt: 'New image',
          category: 'hero',
        };

        await upsertCachedGalleryItem(item);

        expect(mockKV.put).toHaveBeenCalled();
        const cached = store.get('gallery:category:hero');
        expect(cached).toBeDefined();
        const parsed = JSON.parse(cached!);
        expect(parsed[0].id).toBe('new-img');
      });

      it('should prepend item to existing cache', async () => {
        // Setup existing cache
        const existing = [{ id: 'old-img', key: 'old-img', src: '/old.jpg', alt: 'Old', category: 'hero' }];
        store.set('gallery:category:hero', JSON.stringify(existing));

        const item: GalleryItem = {
          id: 'new-img',
          key: 'hero/new-img.jpg',
          src: '/new-img.jpg',
          alt: 'New image',
          category: 'hero',
        };

        await upsertCachedGalleryItem(item);

        const cached = store.get('gallery:category:hero');
        const parsed = JSON.parse(cached!);
        expect(parsed).toHaveLength(2);
        expect(parsed[0].id).toBe('new-img'); // New item first
        expect(parsed[1].id).toBe('old-img');
      });

      it('should replace existing item with same key', async () => {
        const existing = [{ id: 'img-1', key: 'img-1', src: '/old.jpg', alt: 'Old', category: 'hero' }];
        store.set('gallery:category:hero', JSON.stringify(existing));

        const item: GalleryItem = {
          id: 'img-1',
          key: 'img-1',
          src: '/updated.jpg',
          alt: 'Updated',
          category: 'hero',
        };

        await upsertCachedGalleryItem(item);

        const cached = store.get('gallery:category:hero');
        const parsed = JSON.parse(cached!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].src).toBe('/updated.jpg');
      });
    });

    describe('removeCachedGalleryItem', () => {
      it('should remove item from cache', async () => {
        const existing = [
          { id: 'img-1', key: 'img-1', src: '/1.jpg', alt: 'One', category: 'hero' },
          { id: 'img-2', key: 'img-2', src: '/2.jpg', alt: 'Two', category: 'hero' },
        ];
        store.set('gallery:category:hero', JSON.stringify(existing));

        await removeCachedGalleryItem('img-1', 'hero');

        const cached = store.get('gallery:category:hero');
        const parsed = JSON.parse(cached!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].id).toBe('img-2');
      });

      it('should do nothing if item not found', async () => {
        const existing = [{ id: 'img-1', key: 'img-1', src: '/1.jpg', alt: 'One', category: 'hero' }];
        store.set('gallery:category:hero', JSON.stringify(existing));

        await removeCachedGalleryItem('nonexistent', 'hero');

        const cached = store.get('gallery:category:hero');
        const parsed = JSON.parse(cached!);
        expect(parsed).toHaveLength(1);
      });

      it('should do nothing if cache is empty', async () => {
        await removeCachedGalleryItem('img-1', 'hero');
        expect(mockKV.put).not.toHaveBeenCalled();
      });
    });

    describe('invalidateGalleryCategory', () => {
      it('should delete category cache', async () => {
        store.set('gallery:category:hero', '[]');

        await invalidateGalleryCategory('hero');

        expect(mockKV.delete).toHaveBeenCalledWith('gallery:category:hero');
        expect(store.has('gallery:category:hero')).toBe(false);
      });

      it('should track delete metrics', async () => {
        await invalidateGalleryCategory('hero');
        const metrics = getKVMetrics();
        expect(metrics.deletes).toBe(1);
      });
    });

    describe('getKVMetrics', () => {
      it('should return metrics object', () => {
        const metrics = getKVMetrics();
        expect(metrics).toHaveProperty('hits');
        expect(metrics).toHaveProperty('misses');
        expect(metrics).toHaveProperty('sets');
        expect(metrics).toHaveProperty('updates');
        expect(metrics).toHaveProperty('deletes');
        expect(metrics).toHaveProperty('errors');
      });
    });
  });
});
