/**
 * KV Caching Helpers for Gallery Metadata
 * Provides a KV-first read strategy with D1/R2 fallback and lightweight metrics.
 * Non-blocking: failures are logged to console (DEBUG only) and never throw.
 */

import type { GalleryItem, GalleryCategory } from '../gallery-types';

// Minimal KVNamespace shape (subset used here)
export interface KVNamespaceMinimal {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export function getKVBinding(): KVNamespaceMinimal | undefined {
  // Cloudflare Workers expose bindings on globalThis; node shim/tests may inject via process.env
  if (typeof globalThis !== 'undefined' && (globalThis as any).CACHE) {
    return (globalThis as any).CACHE as KVNamespaceMinimal;
  }
  if (typeof process !== 'undefined' && (process.env as any).CACHE) {
    return (process.env as any).CACHE as KVNamespaceMinimal; // test shim possibility
  }
  // Development fallback: provide an in-memory KV shim so local `next dev` can exercise caching logic.
  // Disabled automatically in test environments and can be turned off by setting DEV_KV_SHIM=false.
  if (process.env.NODE_ENV === 'development' && process.env.DEV_KV_SHIM !== 'false') {
    const store = new Map<string, { value: string; expires?: number }>();
    const shim: KVNamespaceMinimal = {
      async get(key: string) {
        const entry = store.get(key);
        if (!entry) return null;
        if (entry.expires && Date.now() > entry.expires) { store.delete(key); return null; }
        return entry.value;
      },
      async put(key: string, value: string, options?: { expirationTtl?: number }) {
        const exp = options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : undefined;
        store.set(key, { value, expires: exp });
      },
      async delete(key: string) { store.delete(key); },
    };
    (globalThis as any).CACHE = shim;
    return shim;
  }
  return undefined;
}

type KVMetrics = {
  hits: number;
  misses: number;
  sets: number;
  updates: number;
  deletes: number;
  errors: number;
  hitLatencyMs: number[];
  missLatencyMs: number[];
};

declare global {
  // eslint-disable-next-line no-var
  var __kvMetrics: KVMetrics | undefined;
}

function metrics(): KVMetrics {
  if (!globalThis.__kvMetrics) {
    globalThis.__kvMetrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      updates: 0,
      deletes: 0,
      errors: 0,
      hitLatencyMs: [],
      missLatencyMs: [],
    };
  }
  return globalThis.__kvMetrics;
}

const CATEGORY_PREFIX = 'gallery:category:';
const ALL_KEY = 'gallery:all';
const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour

function categoryKey(category: GalleryCategory): string {
  return `${CATEGORY_PREFIX}${category}`;
}

export function serializeItems(items: GalleryItem[]): string {
  // Reduce payload size by preserving only needed fields
  const slim = items.map((i) => ({
    id: i.id,
    key: i.key ?? i.id,
    src: i.src,
    alt: i.alt,
    caption: i.caption,
    category: i.category,
    size: i.size,
    width: i.width,
    height: i.height,
    lastModified: i.lastModified,
  }));
  return JSON.stringify(slim);
}

export function deserializeItems(raw: string | null): GalleryItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as any[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => ({
      id: row.id,
      key: row.key ?? row.id,
      src: row.src,
      alt: row.alt,
      caption: row.caption,
      category: row.category,
      size: row.size,
      width: row.width,
      height: row.height,
      lastModified: row.lastModified,
    })) as GalleryItem[];
  } catch (e) {
    metrics().errors += 1;
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.warn('[kv] failed to parse cached gallery items', e);
    }
    return [];
  }
}

export async function getCachedGallery(category: GalleryCategory): Promise<GalleryItem[] | null> {
  const kv = getKVBinding();
  if (!kv) return null;
  const start = Date.now();
  try {
    const raw = await kv.get(categoryKey(category));
    if (raw) {
      const m = metrics();
      m.hits += 1;
      m.hitLatencyMs.push(Date.now() - start);
      return deserializeItems(raw);
    } else {
      const m = metrics();
      m.misses += 1;
      m.missLatencyMs.push(Date.now() - start);
      return null;
    }
  } catch (e) {
    metrics().errors += 1;
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.warn('[kv] getCachedGallery error', e);
    }
    return null;
  }
}

export async function setCachedGallery(category: GalleryCategory, items: GalleryItem[], ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
  const kv = getKVBinding();
  if (!kv) return;
  try {
    await kv.put(categoryKey(category), serializeItems(items), { expirationTtl: ttlSeconds });
    await kv.put(ALL_KEY, 'touch', { expirationTtl: ttlSeconds }); // marker key (optional future use)
    metrics().sets += 1;
  } catch (e) {
    metrics().errors += 1;
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.warn('[kv] setCachedGallery error', e);
    }
  }
}

export async function upsertCachedGalleryItem(item: GalleryItem, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
  const kv = getKVBinding();
  if (!kv) return;
  try {
    const existingRaw = await kv.get(categoryKey(item.category));
    let items = existingRaw ? deserializeItems(existingRaw) : [];
    items = [item, ...items.filter((i) => i.key !== item.key)];
    await kv.put(categoryKey(item.category), serializeItems(items), { expirationTtl: ttlSeconds });
    metrics().updates += 1;
  } catch (e) {
    metrics().errors += 1;
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.warn('[kv] upsertCachedGalleryItem error', e);
    }
  }
}

export async function removeCachedGalleryItem(key: string, category: GalleryCategory): Promise<void> {
  const kv = getKVBinding();
  if (!kv) return;
  try {
    const existingRaw = await kv.get(categoryKey(category));
    if (existingRaw) {
      let items = deserializeItems(existingRaw);
      const before = items.length;
      items = items.filter((i) => i.key !== key);
      if (items.length !== before) {
        await kv.put(categoryKey(category), serializeItems(items), { expirationTtl: DEFAULT_TTL_SECONDS });
        metrics().updates += 1;
      }
    }
  } catch (e) {
    metrics().errors += 1;
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.warn('[kv] removeCachedGalleryItem error', e);
    }
  }
}

export async function invalidateGalleryCategory(category: GalleryCategory): Promise<void> {
  const kv = getKVBinding();
  if (!kv) return;
  try {
    await kv.delete(categoryKey(category));
    metrics().deletes += 1;
  } catch (e) {
    metrics().errors += 1;
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.warn('[kv] invalidateGalleryCategory error', e);
    }
  }
}

export function getKVMetrics(): KVMetrics {
  return metrics();
}
