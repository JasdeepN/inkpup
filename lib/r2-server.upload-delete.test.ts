import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const sendMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  class PutObjectCommand {
    params: any;
    constructor(params: any) {
      this.params = params;
    }
  }

  class DeleteObjectCommand {
    params: any;
    constructor(params: any) {
      this.params = params;
    }
  }

  const ListObjectsV2Command = jest.fn((params) => ({ params }));
  const S3Client = jest.fn(() => ({ send: sendMock }));

  return {
    __esModule: true,
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
  };
});

const createSharpChain = () => {
  const chain: any = {};
  chain.metadata = jest.fn().mockResolvedValue({ width: 2400 }) as any;
  chain.rotate = jest.fn().mockReturnValue(chain);
  chain.resize = jest.fn().mockReturnValue(chain);
  chain.webp = jest.fn().mockReturnValue(chain);
  chain.toBuffer = jest
    .fn()
    .mockResolvedValue({ data: Buffer.from('optimized'), info: { size: 123456 } }) as any;
  return chain;
};

const sharpMock = jest.fn(() => createSharpChain());

jest.mock('sharp', () => ({
  __esModule: true,
  default: sharpMock,
}));

describe('upload and delete gallery images', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    sendMock.mockReset();
    sharpMock.mockClear();
    process.env = { ...originalEnv };
  });

  test('uploadGalleryImage throws when credentials missing', async () => {
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_BUCKET;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;

  const module = await import('./r2-server');
    await expect(
      module.uploadGalleryImage({
        category: 'healed',
        originalFilename: 'sample.jpg',
        buffer: Buffer.from('mock'),
      })
    ).rejects.toThrow('R2 credentials are required to upload images.');
  });

  test('uploadGalleryImage optimizes asset and calls S3', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = 'access';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.NEXT_PUBLIC_R2_BASE_URL = 'https://cdn.example.com';
    process.env.R2_MAX_IMAGE_WIDTH = '1200';

    const module = await import('./r2-server');

    await module.uploadGalleryImage({
      category: 'flash',
      originalFilename: 'Crème brûlée.png',
      buffer: Buffer.from('mock'),
      alt: 'Alt text',
      caption: 'Caption text',
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const commandInstance = sendMock.mock.calls[0][0] as { params: Record<string, unknown> };
    expect(commandInstance.params.Key).toMatch(/^flash\//);
    expect(commandInstance.params.ContentType).toBe('image/webp');
    expect(commandInstance.params.Metadata).toEqual({ alt: 'Alt text', caption: 'Caption text' });
    expect(commandInstance.params.CacheControl).toContain('max-age');

    const resizeCalls = sharpMock.mock.results.flatMap((result) => {
      const chain = result.value as { resize?: jest.Mock };
      return chain.resize ? chain.resize.mock.calls : [];
    }) as Array<[Record<string, unknown>]>;

    expect(resizeCalls.some(([options]) => (options as { width?: number }).width === 1200)).toBe(true);
  });

  test('deleteGalleryImage validates category prefix and issues delete', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = 'access';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';

    const module = await import('./r2-server');

    await expect(module.deleteGalleryImage('other/key.webp', 'flash')).rejects.toThrow(
      'The provided key does not belong to the specified category.'
    );

    await module.deleteGalleryImage('flash/image.webp', 'flash');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const deleteCommand = sendMock.mock.calls[0][0] as { params: Record<string, unknown> };
    expect(deleteCommand.params.Key).toBe('flash/image.webp');
    expect(deleteCommand.params.Bucket).toBe('bucket');
  });

  test('listGalleryImages paginates, skips folders, and sorts by last modified', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = 'access';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.NEXT_PUBLIC_R2_BASE_URL = 'https://cdn.example.com';

    const module = await import('./r2-server');

    const firstPage = {
      Contents: [
        { Key: 'flash/', Size: undefined },
        {
          Key: 'flash/2024/02/01/demo-piece.webp',
          Size: 1111,
          LastModified: new Date('2024-02-01T00:00:00Z'),
          ETag: 'demo-tag',
        },
      ],
      IsTruncated: true,
      NextContinuationToken: 'next-token',
    };

    const secondPage = {
      Contents: [
        { Key: 'flash/2023/12/older-piece.webp', Size: 777 },
        { Key: 'flash/2023/12/folder/', Size: undefined },
      ],
      IsTruncated: false,
    };

    sendMock
      .mockImplementationOnce(async () => firstPage)
      .mockImplementationOnce(async () => secondPage);

    const items = await module.listGalleryImages('flash');

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect((sendMock.mock.calls[0][0] as { params: Record<string, unknown> }).params).toMatchObject({
      Bucket: 'bucket',
      Prefix: 'flash/',
      ContinuationToken: undefined,
    });
    expect((sendMock.mock.calls[1][0] as { params: Record<string, unknown> }).params).toMatchObject({
      ContinuationToken: 'next-token',
    });

    expect(items).toHaveLength(2);
    expect(items[0].key).toBe('flash/2024/02/01/demo-piece.webp');
    expect(items[0].alt).toBe('Demo piece');
    expect(items[0].caption).toBe('Demo piece');
    expect(items[0].lastModified).toBe('2024-02-01T00:00:00.000Z');
    expect(items[1].key).toBe('flash/2023/12/older-piece.webp');
    expect(items[1].lastModified).toBeUndefined();
  });
});
