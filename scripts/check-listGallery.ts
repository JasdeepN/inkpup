import * as server from '../lib/r2-server';

(async function run(){
  try {
    const res = server.listGalleryImages('flash');
    console.log('result keys:', Object.keys(res));
    console.log('has asPromise:', typeof (res as any).asPromise);
    console.log('has asyncIterator:', typeof (res as any)[Symbol.asyncIterator]);
    if ((res as any).asPromise) {
      const ap = await (res as any).asPromise();
      console.log('asPromise resolved - items:', ap.items?.length, 'isFallback:', ap.isFallback);
    }
    if ((res as any)[Symbol.asyncIterator]) {
      const items = [] as any[];
      for await (const it of res as any) items.push(it);
      console.log('iterated items count', items.length);
    }
  } catch (err) {
    console.error('check failed', err);
    process.exit(1);
  }
})();
