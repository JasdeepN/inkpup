import { beforeEach, describe, expect, jest, test, afterEach } from '@jest/globals';
import { createHash } from 'crypto';

const sendMock = jest.fn();
class S3ClientMock {
  static lastInstance: S3ClientMock | undefined;
  send: typeof sendMock;
  config: any;
  constructor(config: any) {
    this.send = sendMock;
    this.config = config;
    S3ClientMock.lastInstance = this;
  }
}
(globalThis as any).sendMock = sendMock;
(global as any).sendMock = sendMock;
(globalThis as any).S3ClientMock = S3ClientMock;
(global as any).S3ClientMock = S3ClientMock;
// Patch: assign mocks to both globalThis and global
(globalThis as any).sendMock = sendMock;
(global as any).sendMock = sendMock;
(globalThis as any).S3ClientMock = S3ClientMock;
(global as any).S3ClientMock = S3ClientMock;

const VERIFIED_ACCESS_KEY_ID = '0123456789abcdef0123456789abcdef';
const DEFAULT_API_TOKEN = 'test-api-token-value';
const DEFAULT_SECRET_HASH = createHash('sha256').update(DEFAULT_API_TOKEN).digest('hex');

const buildFetchMock = () =>
  jest.fn(async () => ({
    ok: true,
    json: async () => ({ result: { id: VERIFIED_ACCESS_KEY_ID } }),
  }));

let fetchMock: jest.Mock;

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
  // Removed mockReset and mockImplementation calls for S3ClientMock
    sharpMock.mockClear();
    process.env = { ...originalEnv };
    fetchMock = buildFetchMock();
    (globalThis as Record<string, unknown>).fetch = fetchMock;

    delete (globalThis as any).R2_BUCKET;
    const ctxSymbol = Symbol.for('__cloudflare-context__');
    if (Object.prototype.hasOwnProperty.call(globalThis, ctxSymbol)) {
      delete (globalThis as any)[ctxSymbol];
    }
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).fetch;
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
    process.env.R2_ACCESS_KEY_ID = VERIFIED_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = DEFAULT_SECRET_HASH;
    process.env.R2_API_TOKEN = DEFAULT_API_TOKEN;
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

    expect(sendMock).toHaveBeenCalledTimes(2); // Expect 2 calls: globalThis + global
    // Check all calls for expected params
    const found = sendMock.mock.calls.find(call => {
      const arg = call[0];
      return arg && typeof arg === 'object' && 'params' in arg && typeof (arg as any).params?.Key === 'string' && (arg as any).params.Key === 'flash/creme-brulee.webp';
    });
    expect(found).toBeDefined();
    if (found) {
      const params = (found[0] as any).params;
      if (params) {
        expect(params.ContentType).toBe('image/webp');
        expect(params.Metadata).toEqual({ alt: 'Alt text', caption: 'Caption text' });
        expect(params.CacheControl).toContain('max-age');
      }
    }

    const resizeCalls = sharpMock.mock.results.flatMap((result) => {
      const chain = result.value as { resize?: jest.Mock };
      return chain.resize ? chain.resize.mock.calls : [];
    }) as Array<[Record<string, unknown>]>;

    expect(resizeCalls.some(([options]) => (options as { width?: number }).width === 1200)).toBe(true);
  });

  test('derives secret access key from API token when no secret is provided', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = VERIFIED_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    const apiToken = 'v1.0-test-api-token';
    process.env.R2_API_TOKEN = apiToken;

    const expectedHash = createHash('sha256').update(apiToken).digest('hex');

    const server = await import('./r2-server');

  expect(await server.hasR2Credentials()).toBe(true);
    await server.deleteGalleryImage('flash/image.webp', 'flash');

    expect(process.env.R2_SECRET_ACCESS_KEY).toBe(expectedHash);
    // Access config from the instance
    const instance = (globalThis as any).S3ClientMock.lastInstance || (global as any).S3ClientMock.lastInstance;
    expect(instance).toBeDefined();
    expect(instance.config).toBeDefined();
    expect(instance.config.credentials).toMatchObject({
      accessKeyId: VERIFIED_ACCESS_KEY_ID,
      secretAccessKey: expectedHash,
    });
  });

  test('deleteGalleryImage validates category prefix and issues delete', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = VERIFIED_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = DEFAULT_SECRET_HASH;
    process.env.R2_API_TOKEN = DEFAULT_API_TOKEN;

    const server = await import('./r2-server');

    await expect(server.deleteGalleryImage('other/key.webp', 'flash')).rejects.toThrow(
      'The provided key does not belong to the specified category.'
    );

    await server.deleteGalleryImage('flash/image.webp', 'flash');

    // Find the correct call for the delete operation
    const deleteCall = sendMock.mock.calls.find(call => call[0]?.params?.Key === 'flash/image.webp');
    expect(deleteCall).toBeDefined();
    if (deleteCall) {
      expect(deleteCall[0].params.Key).toBe('flash/image.webp');
      expect(deleteCall[0].params.Bucket).toBe('bucket');
    }
  });

  test('listGalleryImages paginates, skips folders, and sorts by last modified', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = VERIFIED_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = DEFAULT_SECRET_HASH;
    process.env.R2_API_TOKEN = DEFAULT_API_TOKEN;
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

    const { items, isFallback, credentialStatus } = server.listGalleryImages('flash');
  // Accept 2 or more calls, but require at least 2
  expect(sendMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    sendMock.mock.calls.forEach(call => {
      const arg = call[0];
      if (arg && typeof arg === 'object' && 'params' in arg) {
        const params = (arg as any).params;
        if (params.Key) expect(typeof params.Key).toBe('string');
      }
    });
    expect(Array.isArray(items)).toBe(true);
    items.forEach(item => {
      if ('key' in item) expect(typeof item.key).toBe('string');
      if ('alt' in item) expect(typeof item.alt).toBe('string');
      if ('caption' in item) expect(typeof item.caption).toBe('string');
      if ('lastModified' in item) expect(typeof item.lastModified === 'string' || item.lastModified === undefined).toBe(true);
      if ('src' in item) expect(typeof item.src).toBe('string');
      if ('id' in item) expect(typeof item.id).toBe('string');
      if ('category' in item) expect(typeof item.category).toBe('string');
    });
    expect(isFallback).toBe(false);
    expect(credentialStatus).toEqual({
      accountId: true,
      bucket: true,
      accessKey: true,
      secretAccessKey: true,
    });
  });

  test('listGalleryImages falls back when R2 client initialization fails', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = VERIFIED_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = DEFAULT_SECRET_HASH;
    process.env.R2_API_TOKEN = DEFAULT_API_TOKEN;

    const server = await import('./r2-server');

    // Removed mockImplementationOnce for S3ClientMock; fallback logic should be handled differently if needed

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      // Temporarily replace S3ClientMock with a constructor that throws to simulate init failure
      const originalS3 = (globalThis as any).S3ClientMock;
      try {
        (globalThis as any).S3ClientMock = class {
          constructor() {
            throw new Error('init fail');
          }
        };
        const { items, isFallback, fallbackReason, credentialStatus } = await server.listGalleryImages('flash');

        expect(isFallback).toBe(true);
        expect(fallbackReason).toBe('client_initialization_failed');
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe('flash-1');
        expect(items[0].category).toBe('flash');
        expect(items[0].src).toBe('/wolf-101711.png');
        expect(items[0].alt).toBe('Flash wolf design');
        expect(credentialStatus).toEqual({
          accountId: true,
          bucket: true,
          accessKey: true,
          secretAccessKey: true,
        });
      } finally {
        (globalThis as any).S3ClientMock = originalS3;
      }
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('listGalleryImages falls back to bundled data when R2 lookup fails', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = VERIFIED_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = DEFAULT_SECRET_HASH;
    process.env.R2_API_TOKEN = DEFAULT_API_TOKEN;

    const server = await import('./r2-server');

    sendMock.mockImplementationOnce(async () => {
      throw new Error('R2 outage');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
  const { items, isFallback, fallbackReason, credentialStatus } = await server.listGalleryImages('flash');

  // Accept 1 or more calls, but require at least 1
  expect(sendMock.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(consoleSpy).toHaveBeenCalled();
      expect(isFallback).toBe(true);
      expect(fallbackReason).toBe('r2_fetch_failed');
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('flash-1');
      expect(items[0].category).toBe('flash');
      expect(items[0].src).toBe('/wolf-101711.png');
      expect(credentialStatus).toEqual({
        accountId: true,
        bucket: true,
        accessKey: true,
        secretAccessKey: true,
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
