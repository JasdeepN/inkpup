import { describe, expect, test } from '@jest/globals';

import { generateGalleryObjectKey } from './r2-server';

describe('generateGalleryObjectKey', () => {
  test('builds keys with sanitized filenames preserving original name', () => {
    const key = generateGalleryObjectKey('healed', 'Crème brûlée!.JPG');

    expect(key).toBe('healed/creme-brulee.webp');
  });

  test('throws for unsupported categories', () => {
    expect(() => generateGalleryObjectKey('unknown' as never, 'test.jpg')).toThrow(
      "Unsupported gallery category 'unknown'."
    );
  });
});
