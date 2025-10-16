// Re-export the public API from the modularized implementation.
export * from './r2server/storage';
export * from './r2server/credentials';
export * from './r2server/utils';
export * from './r2server/probe';
export * from './r2server/sniff';

import { listGalleryImages as asyncListGalleryImages } from './r2server/storage';

// Provide the legacy API shape for listGalleryImages: synchronous immediate result
// object with `.asPromise()` and Symbol.asyncIterator while delegating the real
// work to the modular async function.
export const listGalleryImages = (category: any, options?: any) => {
  const result: Record<string, unknown> = {
    items: [],
    isFallback: false,
    usedBundledFallback: false,
    credentialStatus: undefined,
  };

  const backgroundPromise = (async () => {
    try {
      const res = await asyncListGalleryImages(category, options);
      // copy resolved fields onto the immediate result object for synchronous consumers
      (result as any).items = res.items;
      (result as any).isFallback = res.isFallback;
      (result as any).fallbackReason = (res as any).fallbackReason;
      (result as any).usedBundledFallback = res.usedBundledFallback;
      (result as any).credentialStatus = res.credentialStatus ?? (result as any).credentialStatus;
      return res;
    } catch (err) {
      // preserve synchronous behavior: log and return a minimal fallback
      // eslint-disable-next-line no-console
      console.error('listGalleryImages background error', err);
      return { items: [], isFallback: true, usedBundledFallback: false } as any;
    }
  })();

  // legacy helper returning the background promise
  (result as any).asPromise = () => backgroundPromise;
  // assign an async iterator without indexing by the unique symbol type directly
  Object.defineProperty(result, Symbol.asyncIterator, {
    enumerable: false,
    configurable: true,
    value: async function* () {
      const final = await backgroundPromise;
      for (const it of (final.items || []) as any[]) yield it;
    },
  });

  // eslint-disable-next-line no-console
  console.debug('[r2-server] listGalleryImages returning result keys:', Object.keys(result));

  return result;
};
