import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

const MODULE_PATH = './r2';

describe('resolveR2Url', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('returns original value when src is empty or base url missing', async () => {
    delete process.env.NEXT_PUBLIC_R2_BASE_URL;
    const { resolveR2Url } = await import(MODULE_PATH);

    expect(resolveR2Url('')).toBe('');
    expect(resolveR2Url('/artwork/item.webp')).toBe('/artwork/item.webp');
  });

  test('leaves absolute URLs untouched', async () => {
    const { resolveR2Url } = await import(MODULE_PATH);

    expect(resolveR2Url('https://cdn.example.com/image.webp')).toBe('https://cdn.example.com/image.webp');
    expect(resolveR2Url('http://cdn.example.com/image.webp')).toBe('http://cdn.example.com/image.webp');
  });

  test('prefixes configured base url while avoiding duplicate slashes', async () => {
    process.env.NEXT_PUBLIC_R2_BASE_URL = 'https://static.example.com/';
    const { resolveR2Url } = await import(MODULE_PATH);

    expect(resolveR2Url('/gallery/item.webp')).toBe('https://static.example.com/gallery/item.webp');
    expect(resolveR2Url('gallery/item.webp')).toBe('https://static.example.com/gallery/item.webp');
  });
});
