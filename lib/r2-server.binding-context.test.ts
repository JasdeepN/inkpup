import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('@opennextjs/cloudflare');

describe('r2-server Cloudflare context binding', () => {
  const modulePath = './r2-server';
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv, R2_PUBLIC_HOSTNAME: 'https://cdn.example.com' };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('listGalleryImages uses binding provided by getCloudflareContext env', async () => {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');

    const listResponse = {
      objects: [
        {
          key: 'available/sample-design.webp',
          size: 2048,
          uploaded: new Date('2024-05-05T00:00:00Z'),
          customMetadata: {
            alt: 'Sample design',
            caption: 'Sample design caption',
          },
        },
      ],
      truncated: false,
      cursor: undefined,
      delimitedPrefixes: [] as string[],
    };

    const listMock: jest.MockedFunction<R2Bucket['list']> = jest.fn();
    listMock.mockResolvedValue(listResponse as unknown as Awaited<ReturnType<R2Bucket['list']>>);

    (getCloudflareContext as jest.Mock).mockReturnValue({
      env: {
        R2_BUCKET: {
          list: listMock,
        },
      },
    });

    const server = await import(modulePath);
    const result = await server.listGalleryImages('available');

    expect(listMock).toHaveBeenCalledWith({
      prefix: 'available/',
      cursor: undefined,
      limit: 1000,
    });
    expect(result.isFallback).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      key: 'available/sample-design.webp',
      alt: 'Sample design',
      caption: 'Sample design caption',
      category: 'available',
    });
  });
});
