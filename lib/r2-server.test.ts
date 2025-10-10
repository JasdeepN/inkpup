import { jest } from '@jest/globals';

describe('r2-server fallback behaviour', () => {
  const modulePath = './r2-server';

  beforeEach(() => {
    jest.resetModules();
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
  });

  test('returns fallback gallery items when credentials are missing', async () => {
    const { hasR2Credentials, listGalleryImages } = await import(modulePath);

    expect(hasR2Credentials()).toBe(false);

    const items = await listGalleryImages('healed');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.category === 'healed')).toBe(true);
    expect(items.every((item) => item.alt && item.alt.length > 0)).toBe(true);
  });

  test('throws for unsupported gallery categories', async () => {
    const { listGalleryImages } = await import(modulePath);

    await expect(listGalleryImages('unknown' as never)).rejects.toThrow(
      "Unsupported gallery category 'unknown'."
    );
  });

  test('getFallbackGalleryItems returns bundled data for valid category', async () => {
    const { getFallbackGalleryItems } = await import(modulePath);

    const items = getFallbackGalleryItems('flash');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.category === 'flash')).toBe(true);
  });
});
