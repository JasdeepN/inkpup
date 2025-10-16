import * as server from '../lib/r2-server';

test('runtime diagnostic for listGalleryImages', async () => {
  // Inspect module exports
  // eslint-disable-next-line no-console
  console.log('module exports:', Object.keys(server));
  // eslint-disable-next-line no-console
  console.log('typeof listGalleryImages:', typeof (server as any).listGalleryImages);

  const fn = (server as any).listGalleryImages;
  if (typeof fn !== 'function') {
    // eslint-disable-next-line no-console
    console.error('listGalleryImages is not a function or is undefined');
    expect(fn).toBeDefined();
    return;
  }

  const res = fn('flash');
  // Print shape information so we can inspect in CI or terminal
  // eslint-disable-next-line no-console
  // eslint-disable-next-line no-console
  console.log('typeof result:', typeof res, 'isUndefined:', res === undefined, 'isNull:', res === null);
  // eslint-disable-next-line no-console
  console.log('result keys:', Object.keys(res || {}));
  // eslint-disable-next-line no-console
  console.log('own property names:', Object.getOwnPropertyNames(res || {}));
  // eslint-disable-next-line no-console
  console.log('property descriptors:', JSON.stringify(Object.getOwnPropertyDescriptors(res || {}), null, 2));

  // guard access
  if (res && (res as any).asPromise) {
    try {
      const ap = await (res as any).asPromise();
      // eslint-disable-next-line no-console
      console.log('asPromise resolved - items:', ap?.items?.length, 'isFallback:', ap?.isFallback);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('asPromise threw', e);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('no asPromise present on result');
  }

  if (res && (res as any)[Symbol.asyncIterator]) {
    const items: any[] = [];
    try {
      for await (const it of res as any) items.push(it);
      // eslint-disable-next-line no-console
      console.log('iterated items count', items.length);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('async iteration failed', e);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('no async iterator present on result');
  }

  expect(true).toBe(true);
});
