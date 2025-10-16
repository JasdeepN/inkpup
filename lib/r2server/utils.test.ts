import { jest } from '@jest/globals';

describe('r2server utils helpers', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('formatLabelFromKey removes prefix and normalizes separators', async () => {
    const mod = await import('./utils');
    expect(mod.formatLabelFromKey('flash/gallery-piece_of-art.webp', 'flash')).toBe('Gallery piece of art');
    expect(mod.formatLabelFromKey('healed/custom-item.webp', '')).toBe('Custom item');
  });

  test('sanitizeFilename strips diacritics and returns fallback when empty', async () => {
    const mod = await import('./utils');
    expect(mod.sanitizeFilename('Crème brûlée!!.PNG')).toBe('creme-brulee');
    expect(mod.sanitizeFilename('')).toBe('image');
    expect(mod.sanitizeFilename('---')).toBe('image');
  });

  test('getFallbackGalleryItems throws for unsupported categories', async () => {
    const mod = await import('./utils');
    expect(() => mod.getFallbackGalleryItems('not-a-category' as any)).toThrow(
      "Unsupported gallery category 'not-a-category'.",
    );
  });

  test('buildFallbackItems filters invalid entries and applies defaults', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('../../data/gallery.json', () => ([
        { src: '/flash/valid.webp', category: 'flash', caption: 'Valid caption' },
        { src: '/flash/missing.webp' },
        { src: '/flash/invalid.webp', category: 'unknown' },
      ]));

      const mod = await import('./utils');
      const items = mod.buildFallbackItems('flash');

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('flash-fallback-0');
      expect(items[0].alt).toBe('Flash');
      expect(items[0].caption).toBe('Valid caption');
    });
  });
});
