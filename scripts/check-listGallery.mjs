import { listGalleryImages } from '../lib/r2-server.js';

(async () => {
  const res = listGalleryImages('flash');
  console.log('result keys:', Object.keys(res));
  console.log('has asPromise:', typeof res.asPromise);
  console.log('has asyncIterator:', typeof res[Symbol.asyncIterator]);
  try {
    const ap = res.asPromise ? await res.asPromise() : undefined;
    console.log('asPromise resolved:', ap ? { items: ap.items?.length, isFallback: ap.isFallback } : ap);
  } catch (err) {
    console.error('asPromise error', err);
  }
  // try iterating
  try {
    const items = [];
    if (res[Symbol.asyncIterator]) {
      for await (const it of res) items.push(it);
      console.log('iterated items count', items.length);
    } else {
      console.log('no async iterator');
    }
  } catch (err) {
    console.error('iterate error', err);
  }
})();
