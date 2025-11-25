import { getKVBinding, getCachedGallery, setCachedGallery, upsertCachedGalleryItem, removeCachedGalleryItem, invalidateGalleryCategory, getKVMetrics, serializeItems, deserializeItems } from './kv';
import type { GalleryItem } from '../gallery-types';

// Simple in-memory KV binding mock
class InMemoryKV {
  store: Record<string, string> = {};
  async get(key: string) { return this.store[key] ?? null; }
  async put(key: string, value: string) { this.store[key] = value; }
  async delete(key: string) { delete this.store[key]; }
}

function makeItem(id: string): GalleryItem {
  return {
    id,
    key: id,
    src: `/r2/flash/${id}.jpg`,
    alt: `alt-${id}`,
    caption: `cap-${id}`,
    category: 'flash',
    size: 123 + Number(id),
    width: 100,
    height: 80,
    lastModified: new Date().toISOString(),
  };
}

describe('kv gallery cache helpers', () => {
  beforeEach(() => {
    (globalThis as any).CACHE = new InMemoryKV();
    // Reset metrics between tests by deleting the global variable
    delete (globalThis as any).__kvMetrics;
  });
  afterEach(() => {
    delete (globalThis as any).CACHE;
    delete (globalThis as any).__kvMetrics;
  });

  test('getKVBinding returns the injected binding', () => {
    expect(getKVBinding()).toBeDefined();
  });

  test('setCachedGallery and getCachedGallery record hits', async () => {
    const item = makeItem('1');
    await setCachedGallery('flash', [item]);
    const cached = await getCachedGallery('flash');
    expect(cached).toHaveLength(1);
    expect(cached?.[0].id).toBe('1');
    const m = getKVMetrics();
    expect(m.sets).toBe(1);
    expect(m.hits).toBe(1);
    expect(m.misses).toBe(0);
  });

  test('cache miss increments misses metric', async () => {
    const cached = await getCachedGallery('flash');
    expect(cached).toBeNull();
    const m = getKVMetrics();
    expect(m.hits).toBe(0);
    expect(m.misses).toBe(1);
  });

  test('upsertCachedGalleryItem prepends and updates metrics', async () => {
    const item1 = makeItem('1');
    await setCachedGallery('flash', [item1]);
    const item2 = makeItem('2');
    await upsertCachedGalleryItem(item2);
    const cached = await getCachedGallery('flash');
    expect(cached).toHaveLength(2);
    expect(cached?.[0].id).toBe('2'); // new item first
    const m = getKVMetrics();
    expect(m.updates).toBe(1);
  });

  test('removeCachedGalleryItem removes existing item', async () => {
    const item1 = makeItem('1');
    const item2 = makeItem('2');
    await setCachedGallery('flash', [item1, item2]);
    await removeCachedGalleryItem('1', 'flash');
    const cached = await getCachedGallery('flash');
    expect(cached).toHaveLength(1);
    expect(cached?.[0].id).toBe('2');
    const m = getKVMetrics();
    expect(m.updates).toBe(1); // remove triggers update
  });

  test('invalidateGalleryCategory deletes key and causes subsequent miss', async () => {
    const item1 = makeItem('1');
    await setCachedGallery('flash', [item1]);
    await invalidateGalleryCategory('flash');
    const after = await getCachedGallery('flash');
    expect(after).toBeNull();
    const m = getKVMetrics();
    expect(m.deletes).toBe(1);
    expect(m.misses).toBe(1); // miss after invalidation
  });

  test('deserializeItems handles invalid JSON gracefully', async () => {
    const kv = getKVBinding() as any;
    await kv.put('gallery:category:flash', 'NOT JSON');
    const res = await getCachedGallery('flash');
    expect(res).toEqual([]); // parse failure returns []
    const m = getKVMetrics();
    expect(m.errors).toBe(1);
    expect(m.hits).toBe(1); // raw existed so counted as hit
  });

  test('serialize/deserialize round-trip preserves fields', () => {
    const item = makeItem('9');
    const raw = serializeItems([item]);
    const round = deserializeItems(raw);
    expect(round[0].id).toBe(item.id);
    expect(round[0].width).toBe(item.width);
  });
});
