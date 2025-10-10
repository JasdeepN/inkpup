import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const sendMock = jest.fn();
const S3ClientMock = jest.fn(() => ({ send: sendMock }));

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

  return {
    __esModule: true,
    S3Client: S3ClientMock,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
  };
});

type SharpChain = {
  metadata: () => Promise<{ width: number }>;
  rotate: (...args: any[]) => SharpChain;
  resize: (...args: any[]) => SharpChain;
  webp: (...args: any[]) => SharpChain;
  toBuffer: () => Promise<{ data: Buffer; info: { size: number } }>;
};

const createSharpChain = (): SharpChain => {
  const chain = {} as unknown as SharpChain;

  const metadataMock = jest.fn(() => Promise.resolve({ width: 2400 }));
  const toBufferMock = jest.fn(() => Promise.resolve({ data: Buffer.from('optimized'), info: { size: 123456 } }));

  chain.metadata = metadataMock as unknown as () => Promise<{ width: number }>;
  chain.rotate = jest.fn().mockReturnValue(chain) as unknown as (...args: any[]) => SharpChain;
  chain.resize = jest.fn().mockReturnValue(chain) as unknown as (...args: any[]) => SharpChain;
  chain.webp = jest.fn().mockReturnValue(chain) as unknown as (...args: any[]) => SharpChain;
  chain.toBuffer = toBufferMock as unknown as () => Promise<{ data: Buffer; info: { size: number } }>;

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
    S3ClientMock.mockReset();
    S3ClientMock.mockImplementation(() => ({ send: sendMock }));
    sharpMock.mockClear();
    process.env = { ...originalEnv };
  });

  test('uploadGalleryImage throws when credentials missing', async () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;

    const server = await import('./r2-server');
    await expect(
      server.uploadGalleryImage({
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
    process.env.R2_PUBLIC_HOSTNAME = 'https://cdn.example.com';
    process.env.R2_MAX_IMAGE_WIDTH = '1200';

    const server = await import('./r2-server');

    await server.uploadGalleryImage({
      category: 'flash',
      originalFilename: 'Crème brûlée.png',
      buffer: Buffer.from('mock'),
      alt: 'Alt text',
      caption: 'Caption text',
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const commandInstance = sendMock.mock.calls[0][0] as { params: Record<string, unknown> };
    expect(commandInstance.params.Key).toBe('flash/creme-brulee.webp');
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

    const server = await import('./r2-server');

    await expect(server.deleteGalleryImage('other/key.webp', 'flash')).rejects.toThrow(
      'The provided key does not belong to the specified category.'
    );

    await server.deleteGalleryImage('flash/image.webp', 'flash');

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
    process.env.R2_PUBLIC_HOSTNAME = 'https://cdn.example.com';

    const server = await import('./r2-server');

    const firstPage = {
      Contents: [
        { Key: 'flash/', Size: undefined },
        {
          Key: 'flash/demo-piece.webp',
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
        { Key: 'flash/older-piece.webp', Size: 777 },
        { Key: 'flash/folder/', Size: undefined },
      ],
      IsTruncated: false,
    };

    sendMock
      .mockImplementationOnce(async () => firstPage)
      .mockImplementationOnce(async () => secondPage);

    const items = await server.listGalleryImages('flash');

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
    expect(items[0].key).toBe('flash/demo-piece.webp');
    expect(items[0].alt).toBe('Demo piece');
    expect(items[0].caption).toBe('Demo piece');
    expect(items[0].lastModified).toBe('2024-02-01T00:00:00.000Z');
    expect(items[1].key).toBe('flash/older-piece.webp');
    expect(items[1].lastModified).toBeUndefined();

    expect(items[0].src).toBe('https://cdn.example.com/flash/demo-piece.webp');
    expect(items[1].src).toBe('https://cdn.example.com/flash/older-piece.webp');
  });

  test('listGalleryImages falls back when R2 client initialization fails', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = 'access';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';

    const server = await import('./r2-server');

    S3ClientMock.mockImplementationOnce(() => {
      throw new Error('init fail');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const items = await server.listGalleryImages('flash');

      expect(S3ClientMock).toHaveBeenCalled();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('flash-1');
      expect(items[0].category).toBe('flash');
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('listGalleryImages falls back to bundled data when R2 lookup fails', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = 'access';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';

    const server = await import('./r2-server');

    sendMock.mockImplementationOnce(async () => {
      throw new Error('R2 outage');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const items = await server.listGalleryImages('flash');

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalled();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('flash-1');
      expect(items[0].category).toBe('flash');
      expect(items[0].src).toContain('Flash');
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
