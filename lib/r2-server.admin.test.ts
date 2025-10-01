import { describe, expect, test } from '@jest/globals';

import { generateGalleryObjectKey } from './r2-server';

describe('generateGalleryObjectKey', () => {
  test('builds structured keys with sanitized filenames', () => {
    const timestamp = Date.UTC(2025, 9, 1, 12, 30, 15); // October is month index 9
    const key = generateGalleryObjectKey('healed', 'Crème brûlée!.JPG', timestamp);

    expect(key).toMatch(/^healed\//);
    expect(key).toContain('/2025/10/01/');
    expect(key.endsWith('.webp')).toBe(true);
    expect(key).toContain('-creme-brulee');
  });

  test('throws for unsupported categories', () => {
    expect(() => generateGalleryObjectKey('unknown' as never, 'test.jpg')).toThrow(
      "Unsupported gallery category 'unknown'."
    );
  });
});
