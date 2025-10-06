import { jest } from '@jest/globals';

describe('r2-server branch coverage helpers', () => {
  const MODULE = './r2-server';
  const originalEnv = { ...process.env };

  afterEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  test('hasR2Credentials reflects env vars presence', async () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;

    let mod = await import(MODULE);
    expect(mod.hasR2Credentials()).toBe(false);

    process.env.R2_ACCOUNT_ID = 'a';
    process.env.R2_BUCKET = 'b';
    process.env.R2_ACCESS_KEY_ID = 'c';
    process.env.R2_SECRET_ACCESS_KEY = 'd';

    jest.resetModules();
    mod = await import(MODULE);
    expect(mod.hasR2Credentials()).toBe(true);
  });

  test('generateGalleryObjectKey normalizes filenames with diacritics and spaces', async () => {
    const { generateGalleryObjectKey } = await import(MODULE);
    const result = generateGalleryObjectKey('flash' as any, 'Crème brûlée.png');
    expect(result).toBe('flash/creme-brulee.webp');
  });

  test('generateGalleryObjectKey throws for unsupported category', async () => {
    const { generateGalleryObjectKey } = await import(MODULE);
    expect(() => generateGalleryObjectKey('unknown' as any, 'a.png')).toThrow(
      "Unsupported gallery category 'unknown'."
    );
  });

  test('deleteGalleryImage throws when credentials missing', async () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;

    const { deleteGalleryImage } = await import(MODULE);
    await expect(deleteGalleryImage('flash/image.webp', 'flash')).rejects.toThrow(
      'R2 credentials are required to delete images.'
    );
  });

  test('generateGalleryObjectKey falls back to image when filename normalizes empty', async () => {
    const { generateGalleryObjectKey } = await import(MODULE);
    const result = generateGalleryObjectKey('flash' as any, '....PNG');
    expect(result).toBe('flash/image.webp');
  });
});
