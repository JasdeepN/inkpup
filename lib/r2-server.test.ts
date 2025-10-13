import { jest } from '@jest/globals';

describe('r2-server fallback behaviour', () => {
  const modulePath = './r2-server';

  beforeEach(() => {
    jest.resetModules();
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_API_TOKEN;
  });

  test('returns fallback gallery items when credentials are missing', async () => {
    const { hasR2Credentials, listGalleryImages } = await import(modulePath);

  expect(await hasR2Credentials()).toBe(false);

    const result = await listGalleryImages('healed');
    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toBe('missing_credentials');
    expect(result.usedBundledFallback).toBe(true);
    expect(result.credentialStatus).toEqual({
      accountId: false,
      bucket: false,
      accessKey: false,
      secretAccessKey: false,
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.category === 'healed')).toBe(true);
    expect(result.items.every((item) => item.alt && item.alt.length > 0)).toBe(true);
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

  test('derives secret access key from API token when the values match', async () => {
    const token = 'example-token-value';
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = 'access';
    process.env.R2_SECRET_ACCESS_KEY = token;
    process.env.R2_API_TOKEN = token;

    const { hasR2Credentials } = await import(modulePath);

  expect(await hasR2Credentials()).toBe(true);
    expect(process.env.R2_SECRET_ACCESS_KEY).not.toBe(token);
    expect(process.env.R2_SECRET_ACCESS_KEY).toMatch(/^[0-9a-f]{64}$/i);
  });

  test('normalizes secret access key when only a token-like value is provided', async () => {
    const token = 'v1.0-example-token';
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = '0123456789abcdef0123456789abcdef';
    process.env.R2_SECRET_ACCESS_KEY = token;
    delete process.env.R2_API_TOKEN;

    const { hasR2Credentials } = await import(modulePath);

  expect(await hasR2Credentials()).toBe(true);
    expect(process.env.R2_SECRET_ACCESS_KEY).toMatch(/^[0-9a-f]{64}$/i);
    expect(process.env.R2_API_TOKEN).toBe(token);
  });
  
    test('probeR2Binding returns expected structure when no binding', async () => {
      const { probeR2Binding } = await import(modulePath);
      const result = await probeR2Binding();
      expect(result).toHaveProperty('binding', undefined);
      expect(result).toHaveProperty('source', 'none');
      expect(result).toHaveProperty('contextSymbolPresent', false);
    });
  
    test('getR2Binding throws when no binding', async () => {
      const { getR2Binding } = await import(modulePath);
      await expect(getR2Binding()).rejects.toThrow(/R2_BUCKET binding is not available/);
    });
});
