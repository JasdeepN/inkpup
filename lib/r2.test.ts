import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

const MODULE_PATH = './r2';

describe('toPublicR2Url', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('returns original value when src is empty or base url missing', async () => {
    delete process.env.R2_PUBLIC_HOSTNAME;
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;

    const { toPublicR2Url } = await import(MODULE_PATH);

    expect(toPublicR2Url('')).toBe('');
    expect(toPublicR2Url('/artwork/item.webp')).toBe('/artwork/item.webp');
    expect(toPublicR2Url('artwork/item.webp')).toBe('/artwork/item.webp');
  });

  test('getR2PublicBaseUrl infers missing scheme', async () => {
    process.env.R2_PUBLIC_HOSTNAME = 'cdn.example.com/gallery';

    const { getR2PublicBaseUrl } = await import(MODULE_PATH);

    expect(getR2PublicBaseUrl()).toBe('https://cdn.example.com/gallery');
  });

  test('leaves absolute URLs untouched', async () => {
    const { toPublicR2Url } = await import(MODULE_PATH);

    expect(toPublicR2Url('https://cdn.example.com/image.webp')).toBe('https://cdn.example.com/image.webp');
    expect(toPublicR2Url('http://cdn.example.com/image.webp')).toBe('http://cdn.example.com/image.webp');
  });

  test('prefixes configured public hostname while avoiding duplicate slashes', async () => {
    process.env.R2_PUBLIC_HOSTNAME = 'https://static.example.com/assets/';
    const { toPublicR2Url } = await import(MODULE_PATH);

    expect(toPublicR2Url('/gallery/item.webp')).toBe('https://static.example.com/assets/gallery/item.webp');
    expect(toPublicR2Url('gallery/item.webp')).toBe('https://static.example.com/assets/gallery/item.webp');
  });

  test('falls back to default R2 endpoint when no hostname is provided', async () => {
    delete process.env.R2_PUBLIC_HOSTNAME;
    process.env.R2_ACCOUNT_ID = 'account123';
    process.env.R2_BUCKET = 'artist-bucket';

    const { toPublicR2Url } = await import(MODULE_PATH);

    expect(toPublicR2Url('/gallery/item.webp')).toBe('https://account123.r2.cloudflarestorage.com/artist-bucket/gallery/item.webp');
    expect(toPublicR2Url('gallery/item.webp')).toBe('https://account123.r2.cloudflarestorage.com/artist-bucket/gallery/item.webp');
  });

  test('getR2PublicBaseUrl returns null when configuration is incomplete', async () => {
    delete process.env.R2_PUBLIC_HOSTNAME;
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;

    const { getR2PublicBaseUrl } = await import(MODULE_PATH);

    expect(getR2PublicBaseUrl()).toBeNull();
  });

  test('getR2PublicBaseUrl normalizes custom hostnames', async () => {
    process.env.R2_PUBLIC_HOSTNAME = ' https://static.example.com/assets/ ';

    const { getR2PublicBaseUrl } = await import(MODULE_PATH);

    expect(getR2PublicBaseUrl()).toBe('https://static.example.com/assets');
  });

  test('getR2PublicBaseUrl falls back to default when hostname is invalid', async () => {
    process.env.R2_PUBLIC_HOSTNAME = '://bad host';
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { getR2PublicBaseUrl } = await import(MODULE_PATH);

    expect(getR2PublicBaseUrl()).toBe('https://acct.r2.cloudflarestorage.com/bucket');
    expect(warnSpy).toHaveBeenCalledWith('R2_PUBLIC_HOSTNAME is not a valid URL:', '://bad host');

    warnSpy.mockRestore();
  });

  test('getR2PublicBaseUrl ignores blank hostname and uses default', async () => {
    process.env.R2_PUBLIC_HOSTNAME = '   ';
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';

    const { getR2PublicBaseUrl } = await import(MODULE_PATH);

    expect(getR2PublicBaseUrl()).toBe('https://acct.r2.cloudflarestorage.com/bucket');
  });
});
