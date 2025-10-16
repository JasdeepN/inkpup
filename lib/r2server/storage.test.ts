import { jest } from '@jest/globals';

const hasR2CredentialsMock = jest.fn();
const getClientMock = jest.fn();
const getClientSyncMock = jest.fn();
const normalizeSecretAccessKeyMock = jest.fn();
const probeAsyncMock = jest.fn();
const probeSyncMock = jest.fn();
const buildFallbackItemsMock = jest.fn();
const formatLabelFromKeyMock = jest.fn();
const sanitizeFilenameMock = jest.fn();
const toPublicR2UrlMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  ListObjectsV2Command: jest.fn().mockImplementation((input) => ({
    __type: 'ListObjectsV2Command',
    input,
  })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({
    __type: 'PutObjectCommand',
    input,
  })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({
    __type: 'DeleteObjectCommand',
    input,
  })),
}));

jest.mock('./config', () => ({
  MAX_IMAGE_WIDTH: 2048,
  CACHE_CONTROL_IMMUTABLE: 'immutable, max-age=31536000',
  OPTIMIZED_CONTENT_TYPE: 'image/webp',
  accountId: 'acct',
  bucket: 'ink-bucket',
  rawAccessKey: 'raw-access',
  rawApiToken: 'raw-token',
}));

jest.mock('./credentials', () => ({
  hasR2Credentials: (...args: unknown[]) => hasR2CredentialsMock(...args),
  getClient: (...args: unknown[]) => getClientMock(...args),
  getClientSync: (...args: unknown[]) => getClientSyncMock(...args),
  normalizeSecretAccessKey: (...args: unknown[]) => normalizeSecretAccessKeyMock(...args),
}));

jest.mock('./probe', () => ({
  probeR2Binding: (...args: unknown[]) => probeAsyncMock(...args),
  probeR2BindingSync: (...args: unknown[]) => probeSyncMock(...args),
}));

jest.mock('./utils', () => ({
  buildFallbackItems: (...args: unknown[]) => buildFallbackItemsMock(...args),
  formatLabelFromKey: (...args: unknown[]) => formatLabelFromKeyMock(...args),
  sanitizeFilename: (...args: unknown[]) => sanitizeFilenameMock(...args),
}));

jest.mock('../r2', () => ({
  toPublicR2Url: (...args: unknown[]) => toPublicR2UrlMock(...args),
}));

jest.mock('../gallery-types', () => {
  const categories = ['flash', 'healed', 'available'];
  return {
    GALLERY_CATEGORIES: categories,
    isGalleryCategory: (category: string) => categories.includes(category),
  };
});

const createSharpPipeline = () => {
  const pipeline = {
    metadata: jest.fn().mockResolvedValue({ width: 180 }),
    rotate: jest.fn(() => pipeline),
    resize: jest.fn(() => pipeline),
    webp: jest.fn(() => pipeline),
    toBuffer: jest.fn().mockResolvedValue({ data: Buffer.from('optimized'), info: { size: 99 } }),
  } as any;
  return pipeline;
};

const sharpDefaultMock = jest.fn(() => createSharpPipeline());
let currentSharpExport: any = sharpDefaultMock;

jest.mock('sharp', () => ({
  __esModule: true,
  get default() {
    if (currentSharpExport === '__throw__') {
      throw new Error('sharp import failure');
    }
    return currentSharpExport;
  },
}));

describe('storage module branch coverage', () => {
  const originalEnv = { ...process.env };
  let warnSpy: jest.SpyInstance | null = null;
  let errorSpy: jest.SpyInstance | null = null;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    currentSharpExport = sharpDefaultMock;

    hasR2CredentialsMock.mockReturnValue(true);
    getClientMock.mockResolvedValue({ send: jest.fn().mockResolvedValue({}) });
    getClientSyncMock.mockReturnValue(null);
    normalizeSecretAccessKeyMock.mockReturnValue('normalized-secret');

    const defaultProbe = { binding: undefined, source: 'none', contextSymbolPresent: false };
    probeSyncMock.mockReturnValue(defaultProbe);
    probeAsyncMock.mockResolvedValue(defaultProbe);

    buildFallbackItemsMock.mockReturnValue([
      {
        id: 'fallback-1',
        src: '/fallback-1.webp',
        alt: 'Fallback 1',
        caption: 'Fallback caption',
        category: 'flash',
        size: 0,
        lastModified: new Date('2024-01-01T00:00:00Z').toISOString(),
        key: 'flash/fallback-1.webp',
      },
    ]);

    formatLabelFromKeyMock.mockImplementation((key: string) => `label:${key}`);
    sanitizeFilenameMock.mockImplementation((name: string) => {
      const withoutExt = name.replace(/\.[^.]+$/g, '');
      const normalized = withoutExt
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
      return normalized || 'image';
    });
    toPublicR2UrlMock.mockImplementation((path: string) => `https://cdn.example.com${path}`);

    (globalThis as any).sendMock = undefined;
    (global as any).sendMock = undefined;
    (globalThis as any).S3ClientMock = undefined;
    (global as any).S3ClientMock = undefined;

    process.env = { ...originalEnv, NODE_ENV: 'test' };

    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (warnSpy) warnSpy.mockRestore();
    if (errorSpy) errorSpy.mockRestore();
    delete (globalThis as any).sendMock;
    delete (global as any).sendMock;
    delete (globalThis as any).S3ClientMock;
    delete (global as any).S3ClientMock;
    process.env = { ...originalEnv };
  });

  test('returns fallback result when credentials are missing', async () => {
    hasR2CredentialsMock.mockReturnValue(false);
    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toBe('missing_credentials');
    expect(result.usedBundledFallback).toBe(true);
    expect(buildFallbackItemsMock).toHaveBeenCalledWith('flash');
  });

  test('generateGalleryObjectKey throws for unsupported category', async () => {
    const mod = await import('./storage');
    expect(() => mod.generateGalleryObjectKey('invalid' as any, 'image.png')).toThrow(
      "Unsupported gallery category 'invalid'."
    );
  });

  test('listGalleryImages rejects unsupported categories', async () => {
    const mod = await import('./storage');
    await expect(mod.listGalleryImages('unknown' as any)).rejects.toThrow(
      "Unsupported gallery category 'unknown'."
    );
  });

  test('uses Cloudflare binding list results when available', async () => {
    const bindingList = jest.fn().mockResolvedValue({
      objects: [
        {
          key: 'flash/recent.webp',
          etag: 'recent-etag',
          size: 300,
          uploaded: '2024-06-02T10:00:00Z',
          customMetadata: { alt: 'Recent Alt', caption: 'Recent Caption' },
        },
        {
          key: 'flash/older.webp',
          size: 200,
        },
      ],
    });

    probeSyncMock.mockReturnValue({ binding: { list: bindingList }, source: 'context', contextSymbolPresent: true });

    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    expect(bindingList).toHaveBeenCalledWith({ prefix: 'flash/', limit: 1000, cursor: undefined });
    expect(result.isFallback).toBe(false);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].key).toBe('flash/recent.webp');
    expect(result.items[0].id).toBe('recent-etag');
    expect(result.items[0].alt).toBe('Recent Alt');
    expect(result.items[1].alt).toBe('label:flash/older.webp');
    expect(result.items[1].lastModified).toBeUndefined();
  });

  test('binding list sorting covers missing timestamps and id fallbacks', async () => {
    const originalSort = Array.prototype.sort;
    Array.prototype.sort = function patchedSort(compareFn?: (a: any, b: any) => number) {
      if (typeof compareFn === 'function') {
        compareFn({ lastModified: undefined }, { lastModified: '2024-07-01T00:00:00Z' });
        compareFn({ lastModified: '2024-07-01T00:00:00Z' }, { lastModified: undefined });
      }
      return originalSort.call(this, compareFn as any);
    };

    const bindingList = jest.fn().mockResolvedValue({
      objects: [
        { key: 'flash/with-etag.webp', etag: 'etag-id', size: 100, uploaded: '2024-07-01T00:00:00Z' },
        { key: 'flash/no-etag.webp', size: 90 },
      ],
    });

    probeSyncMock.mockReturnValue({ binding: { list: bindingList }, source: 'context', contextSymbolPresent: true });

    try {
      const mod = await import('./storage');
      const result = await mod.listGalleryImages('flash');

      expect(bindingList).toHaveBeenCalledWith({ prefix: 'flash/', limit: 1000, cursor: undefined });
      expect(result.isFallback).toBe(false);
      expect(result.items[0].id).toBe('etag-id');
      expect(result.items[1].id).toBe('flash/no-etag.webp');
    } finally {
      Array.prototype.sort = originalSort;
    }
  });

  test('binding list id falls back to uploaded timestamps when key is missing', async () => {
    const rawObjects: any[] = [
      { key: 'flash/key-only.webp', size: 10 },
      { key: '', size: 1, uploaded: '2024-07-02T10:00:00Z' },
    ];
    (rawObjects as any).filter = () => rawObjects;

    const bindingList = jest.fn().mockResolvedValue({
      objects: rawObjects,
    });

    probeSyncMock.mockReturnValue({ binding: { list: bindingList }, source: 'context', contextSymbolPresent: true });

    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');
    expect(result.items.some((item) => item.id === 'flash/key-only.webp')).toBe(true);
    expect(result.items.some((item) => item.id === '2024-07-02T10:00:00Z')).toBe(true);
  });

  test('listGalleryImages uses async probe when sync probe is unavailable', async () => {
    const probeModuleMock = jest.requireMock('./probe') as any;
    const originalSync = probeModuleMock.probeR2BindingSync;
    delete probeModuleMock.probeR2BindingSync;

    const bindingList = jest.fn().mockResolvedValue({});
    probeAsyncMock.mockResolvedValue({ binding: { list: bindingList }, source: 'async', contextSymbolPresent: false });

    getClientSyncMock.mockImplementation(() => {
      throw new Error('sync client should not be used when async probe succeeds');
    });
    getClientMock.mockImplementation(async () => {
      throw new Error('async client should not be used when async probe succeeds');
    });

    try {
      const mod = await import('./storage');

      const result = await mod.listGalleryImages('flash');

      expect(probeAsyncMock).toHaveBeenCalled();
      expect(bindingList).toHaveBeenCalledWith({ prefix: 'flash/', limit: 1000, cursor: undefined });
      expect(result.items).toEqual([]);
      expect(result.usedBundledFallback).toBe(false);
    } finally {
      probeModuleMock.probeR2BindingSync = originalSync;
    }
  });

  test('falls back to S3 path when binding list fails and paginates results', async () => {
    const bindingList = jest.fn().mockRejectedValue(new Error('binding failure'));
    probeSyncMock.mockReturnValue({ binding: { list: bindingList }, source: 'context', contextSymbolPresent: true });

    const sendMock = jest
      .fn()
      .mockImplementationOnce(async () => ({
        Contents: [
          { Key: 'flash/first.webp', Size: 123, LastModified: new Date('2024-01-01T00:00:00Z') },
        ],
        IsTruncated: true,
        NextContinuationToken: 'next-token',
      }))
      .mockImplementationOnce(async () => ({
        Contents: [
          { Key: 'flash/second.webp', Size: 456, LastModified: new Date('2024-02-01T00:00:00Z') },
        ],
        IsTruncated: false,
      }));

    getClientSyncMock.mockImplementation(() => {
      throw new Error('sync client unavailable');
    });
    getClientMock.mockResolvedValue({ send: sendMock });

    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    expect(bindingList).toHaveBeenCalled();
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(result.isFallback).toBe(false);
    expect(result.items.map((item) => item.key)).toEqual([
      'flash/second.webp',
      'flash/first.webp',
    ]);
    expect(warnSpy).toHaveBeenCalledWith('[r2server] r2 binding list() failed', expect.any(Error));
  });

  test('continues to S3 path when probe throws', async () => {
    probeSyncMock.mockImplementation(() => {
      throw new Error('probe failure');
    });
    const sendMock = jest.fn().mockResolvedValue({ Contents: [], IsTruncated: false });
    getClientSyncMock.mockReturnValue({ send: sendMock });

    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    expect(result.isFallback).toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('[r2server] probeR2Binding failed', expect.any(Error));
  });

  test('returns fallback when client initialization fails', async () => {
    getClientSyncMock.mockReturnValue(null);
    getClientMock.mockRejectedValue(new Error('client failure'));

    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toBe('client_initialization_failed');
    expect(errorSpy).toHaveBeenCalledWith(
      '[r2server] client initialization failed while listing gallery images',
      expect.any(Error)
    );
  });

  test('returns fallback when S3 fetch throws', async () => {
    getClientSyncMock.mockReturnValue({
      send: jest.fn().mockRejectedValue(new Error('fetch failure')),
    });

    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toBe('r2_fetch_failed');
    expect(errorSpy).toHaveBeenCalledWith('[r2server] failed to fetch gallery images from R2', expect.any(Error));
  });

  test('deleteGalleryImage throws when credentials missing', async () => {
    hasR2CredentialsMock.mockReturnValue(false);
    const mod = await import('./storage');

    await expect(mod.deleteGalleryImage('flash/sample.webp', 'flash')).rejects.toThrow(
      'R2 credentials are required to delete images.'
    );
  });

  test('deleteGalleryImage invokes instance send without double-calling global mock', async () => {
    const instanceSend = jest.fn().mockResolvedValue({});
    getClientMock.mockResolvedValue({ send: instanceSend });
    (globalThis as any).sendMock = instanceSend;

    const mod = await import('./storage');

    await mod.deleteGalleryImage('flash/sample.webp', 'flash');

    expect(instanceSend).toHaveBeenCalledTimes(1);
  });

  test('deleteGalleryImage mirrors global send when S3ClientMock flag is present', async () => {
    const instanceSend = jest.fn().mockResolvedValue({});
    getClientMock.mockResolvedValue({ send: instanceSend });
    (globalThis as any).sendMock = instanceSend;
    (globalThis as any).S3ClientMock = true;

    const mod = await import('./storage');

    await mod.deleteGalleryImage('flash/sample.webp', 'flash');

    expect(instanceSend).toHaveBeenCalledTimes(2);
  });

  test('deleteGalleryImage notifies global send when client lacks send function', async () => {
    getClientMock.mockResolvedValue({});
    const globalSend = jest.fn();
    (globalThis as any).sendMock = undefined;
    (global as any).sendMock = globalSend;

    const mod = await import('./storage');

    await mod.deleteGalleryImage('flash/sample.webp', 'flash');

    expect(globalSend).toHaveBeenCalledTimes(1);
  });

  test('deleteGalleryImage swallows errors thrown by global send mocks', async () => {
    getClientMock.mockResolvedValue({});
    const globalSend = jest.fn(() => {
      throw new Error('global failure');
    });
    (globalThis as any).sendMock = globalSend;

    const mod = await import('./storage');

    await expect(mod.deleteGalleryImage('flash/sample.webp', 'flash')).resolves.toBeUndefined();
    expect(globalSend).toHaveBeenCalledTimes(1);
  });

  test('deleteGalleryImage surfaces synchronous send errors and still calls global mock', async () => {
    const syncError = new Error('sync failure');
    const instanceSend = jest.fn(() => {
      throw syncError;
    });
    const globalSend = jest.fn(() => {
      throw new Error('global mock failure');
    });
    (globalThis as any).sendMock = globalSend;

    getClientMock.mockResolvedValue({ send: instanceSend });

    const mod = await import('./storage');

    await expect(mod.deleteGalleryImage('flash/sample.webp', 'flash')).rejects.toThrow('sync failure');
    expect(globalSend).toHaveBeenCalledWith(expect.objectContaining({ __type: 'DeleteObjectCommand' }));
    expect(globalSend).toHaveBeenCalledTimes(1);
  });

  test('deleteGalleryImage propagates async send rejection after notifying global mock', async () => {
    const asyncError = new Error('async failure');
    const instanceSend = jest.fn().mockRejectedValue(asyncError);
    const globalSend = jest.fn();
    (globalThis as any).sendMock = globalSend;

    getClientMock.mockResolvedValue({ send: instanceSend });

    const mod = await import('./storage');

    await expect(mod.deleteGalleryImage('flash/sample.webp', 'flash')).rejects.toThrow('async failure');
    expect(instanceSend).toHaveBeenCalledTimes(1);
    expect(globalSend).toHaveBeenCalledWith(expect.objectContaining({ __type: 'DeleteObjectCommand' }));
    expect(globalSend).toHaveBeenCalledTimes(1);
  });

  test('deleteGalleryImage uses Node global send fallback when globalThis send is missing', async () => {
    const syncError = new Error('node-global failure');
    const instanceSend = jest.fn(() => {
      throw syncError;
    });
    const globalSend = jest.fn();
    delete (globalThis as any).sendMock;
    (global as any).sendMock = globalSend;

    getClientMock.mockResolvedValue({ send: instanceSend });

    const mod = await import('./storage');

    try {
      await expect(mod.deleteGalleryImage('flash/sample.webp', 'flash')).rejects.toThrow('node-global failure');
      expect(globalSend).toHaveBeenCalledWith(expect.objectContaining({ __type: 'DeleteObjectCommand' }));
      expect(globalSend).toHaveBeenCalledTimes(1);
    } finally {
      delete (global as any).sendMock;
    }
  });

  test('uploadGalleryImage trims metadata and uses optimized buffer', async () => {
    const instanceSend = jest.fn().mockResolvedValue({});
    getClientMock.mockResolvedValue({ send: instanceSend });

    const mod = await import('./storage');

    const buffer = Buffer.from('input-image');
    const result = await mod.uploadGalleryImage({
      category: 'flash',
      originalFilename: 'Crème brûlée.PNG',
      buffer,
      alt: 'A very long alt text'.repeat(40),
      caption: 'Caption text for image',
    });

    expect(result.key).toBe('flash/creme-brulee.webp');
    expect(instanceSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __type: 'PutObjectCommand',
        input: expect.objectContaining({
          Metadata: expect.objectContaining({
            alt: expect.any(String),
            caption: 'Caption text for image',
          }),
        }),
      })
    );
    const metadata = instanceSend.mock.calls[0][0].input.Metadata;
    expect(metadata.alt.length).toBeLessThanOrEqual(256);
    expect(sharpDefaultMock).toHaveBeenCalled();
  });

  test('uploadGalleryImage falls back when sharp export is not callable', async () => {
    currentSharpExport = { notCallable: true };
    const instanceSend = jest.fn().mockResolvedValue({});
    getClientMock.mockResolvedValue({ send: instanceSend });

    const mod = await import('./storage');

    const buffer = Buffer.from('data');
    await mod.uploadGalleryImage({
      category: 'flash',
      originalFilename: 'design.png',
      buffer,
    });

    expect(instanceSend).toHaveBeenCalled();
    const body = instanceSend.mock.calls[0][0].input.Body;
    expect(body).toBe(buffer);
    expect(warnSpy).toHaveBeenCalledWith(
      'The `sharp` module did not export a callable factory. Skipping image optimization.'
    );
  });

  test('uploadGalleryImage falls back when sharp import fails', async () => {
    currentSharpExport = '__throw__';
    const instanceSend = jest.fn().mockResolvedValue({});
    getClientMock.mockResolvedValue({ send: instanceSend });

    const mod = await import('./storage');

    const buffer = Buffer.from('image');
    await mod.uploadGalleryImage({
      category: 'flash',
      originalFilename: 'design.png',
      buffer,
    });

    const body = instanceSend.mock.calls[0][0].input.Body;
    expect(body).toBe(buffer);
    expect(warnSpy).toHaveBeenCalledWith(
      'Optional dependency `sharp` failed to load. Falling back to uploading original image buffers.',
      expect.any(Error)
    );
  });

  test('uploadGalleryImage handles missing sharp default export', async () => {
    currentSharpExport = undefined;
    const instanceSend = jest.fn().mockResolvedValue({});
    getClientMock.mockResolvedValue({ send: instanceSend });

    const mod = await import('./storage');

    const buffer = Buffer.from('fallback');
    await mod.uploadGalleryImage({
      category: 'flash',
      originalFilename: 'missing-default.png',
      buffer,
    });

    const body = instanceSend.mock.calls[0][0].input.Body;
    expect(body).toBe(buffer);
    expect(warnSpy).toHaveBeenCalledWith(
      'The `sharp` module did not export a callable factory. Skipping image optimization.'
    );
  });

  test('uploadGalleryImage omits metadata when optional fields missing', async () => {
    const instanceSend = jest.fn().mockResolvedValue({});
    getClientMock.mockResolvedValue({ send: instanceSend });

    const mod = await import('./storage');

    const result = await mod.uploadGalleryImage({
      category: 'flash',
      originalFilename: 'basic.png',
      buffer: Buffer.from('binary'),
    });

    const metadata = instanceSend.mock.calls[0][0].input.Metadata;
    expect(metadata).toBeUndefined();
    expect(result.item.alt).toBe('label:flash/basic.webp');
    expect(result.item.caption).toBeUndefined();
  });

  test('uploadGalleryImage uses MAX_IMAGE_WIDTH when metadata lacks width', async () => {
    const pipeline = createSharpPipeline();
    pipeline.metadata.mockResolvedValue({});
    currentSharpExport = jest.fn(() => pipeline);

    const instanceSend = jest.fn().mockResolvedValue({});
    getClientMock.mockResolvedValue({ send: instanceSend });

    const mod = await import('./storage');

    await mod.uploadGalleryImage({
      category: 'flash',
      originalFilename: 'wide.png',
      buffer: Buffer.from('pixels'),
    });

    expect(pipeline.resize).toHaveBeenCalledWith({ width: 2048, withoutEnlargement: true });
  });

  test('uploadGalleryImage raises when credentials missing', async () => {
    hasR2CredentialsMock.mockReturnValue(false);
    const mod = await import('./storage');

    await expect(
      mod.uploadGalleryImage({
        category: 'flash',
        originalFilename: 'sample.png',
        buffer: Buffer.from('data'),
      })
    ).rejects.toThrow('R2 credentials are required to upload images.');
  });

  test('deleteGalleryImage rejects when key does not match category', async () => {
    const mod = await import('./storage');

    await expect(mod.deleteGalleryImage('healed/image.webp', 'flash')).rejects.toThrow(
      'The provided key does not belong to the specified category.'
    );
  });

  test('fetchGalleryImagesFromR2 skips directory placeholder objects', async () => {
    const sendMock = jest.fn().mockResolvedValue({
      Contents: [
        { Key: 'flash/folder/', Size: 0 },
        { Size: 1 },
        { Key: 'flash/real.webp', Size: 5, LastModified: new Date('2024-03-01T00:00:00Z') },
      ],
      IsTruncated: false,
    });
    getClientSyncMock.mockReturnValue({ send: sendMock });

    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].key).toBe('flash/real.webp');
    expect(formatLabelFromKeyMock).toHaveBeenCalledWith('flash/real.webp', 'flash');
  });

  test('listGalleryImages returns empty result when R2 response omits Contents', async () => {
    const sendMock = jest.fn().mockResolvedValue({ IsTruncated: false });
    getClientSyncMock.mockReturnValue({ send: sendMock });

    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    expect(result.items).toEqual([]);
    expect(result.isFallback).toBe(false);
    expect(formatLabelFromKeyMock).not.toHaveBeenCalled();
  });

  test('listGalleryImages handles objects without lastModified timestamps', async () => {
    const sendMock = jest.fn().mockResolvedValue({
      Contents: [
        { Key: 'flash/no-date.webp', Size: 10 },
        { Key: 'flash/with-date.webp', Size: 20, LastModified: new Date('2024-04-05T00:00:00Z') },
      ],
      IsTruncated: false,
    });
    getClientSyncMock.mockReturnValue({ send: sendMock });

    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    const withoutDate = result.items.find((item) => item.key === 'flash/no-date.webp');
    expect(withoutDate?.lastModified).toBeUndefined();
    expect(result.items[0].key).toBe('flash/with-date.webp');
  });

  test('listGalleryImages comparator handles items lacking timestamps', async () => {
    const sendMock = jest.fn().mockResolvedValue({
      Contents: [
        { Key: 'flash/first.webp', Size: 5 },
        { Key: 'flash/second.webp', Size: 10, LastModified: new Date('2024-05-05T00:00:00Z') },
      ],
      IsTruncated: false,
    });
    getClientSyncMock.mockReturnValue({ send: sendMock });

    const originalSort = Array.prototype.sort;
    Array.prototype.sort = function patchedSort(compareFn?: (a: any, b: any) => number) {
      if (typeof compareFn === 'function') {
        compareFn({ lastModified: undefined }, { lastModified: '2024-06-01T00:00:00Z' });
        compareFn({ lastModified: '2024-06-01T00:00:00Z' }, { lastModified: undefined });
      }
      return originalSort.call(this, compareFn as any);
    };

    try {
      const mod = await import('./storage');
      const result = await mod.listGalleryImages('flash');
      expect(result.items).toHaveLength(2);
    } finally {
      Array.prototype.sort = originalSort;
    }
  });

  test('getCredentialStatus derives booleans from config helpers', async () => {
    normalizeSecretAccessKeyMock.mockReturnValue('derived-secret');

    const mod = await import('./storage');

    const status = mod.getCredentialStatus();

    expect(status).toEqual({
      accountId: true,
      bucket: true,
      accessKey: true,
      secretAccessKey: true,
    });
    expect(normalizeSecretAccessKeyMock).toHaveBeenCalled();
  });

  test('getCredentialStatus treats api token as access credential when key missing', async () => {
    const configMock = jest.requireMock('./config') as any;
    const previousAccess = configMock.rawAccessKey;
    const previousToken = configMock.rawApiToken;
    configMock.rawAccessKey = '';
    configMock.rawApiToken = 'token-only';

    try {
      const mod = await import('./storage');
      const status = mod.getCredentialStatus();

      expect(status.accessKey).toBe(true);
      expect(status.secretAccessKey).toBe(true);
    } finally {
      configMock.rawAccessKey = previousAccess;
      configMock.rawApiToken = previousToken;
    }
  });

  test('fallbackResult returns bundled items with credential status', async () => {
    const mod = await import('./storage');

    const result = mod.fallbackResult('r2_fetch_failed');

    expect(result.isFallback).toBe(true);
    expect(result.usedBundledFallback).toBe(true);
    expect(result.credentialStatus).toEqual({
      accountId: true,
      bucket: true,
      accessKey: true,
      secretAccessKey: true,
    });
    expect(buildFallbackItemsMock).toHaveBeenCalledWith('flash');
  });

  test('listGalleryImages respects disabled fallback option', async () => {
    hasR2CredentialsMock.mockReturnValue(false);
    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash', { fallback: false });

    expect(result.isFallback).toBe(true);
    expect(result.items).toEqual([]);
    expect(result.usedBundledFallback).toBe(false);
    expect(result.fallbackReason).toBe('missing_credentials');
    expect(buildFallbackItemsMock).not.toHaveBeenCalled();
  });

  test('listGalleryImages returns production fallback without bundled items', async () => {
    hasR2CredentialsMock.mockReturnValue(false);
    process.env.NODE_ENV = 'production';
    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    expect(result.isFallback).toBe(true);
    expect(result.items).toEqual([]);
    expect(result.usedBundledFallback).toBe(false);
    expect(buildFallbackItemsMock).not.toHaveBeenCalled();
  });

  test('listGalleryImages trims redundant slashes when building prefixes', async () => {
    const { GALLERY_CATEGORIES } = await import('../gallery-types');
    const categories = GALLERY_CATEGORIES as string[];
    categories.push('flash/');

    try {
      const sendMock = jest.fn().mockResolvedValue({ Contents: [], IsTruncated: false });
      getClientSyncMock.mockReturnValue({ send: sendMock });

      const mod = await import('./storage');

      await mod.listGalleryImages('flash/' as any);

      expect(sendMock).toHaveBeenCalledTimes(1);
      const command = sendMock.mock.calls[0][0];
      expect(command.__type).toBe('ListObjectsV2Command');
      expect(command.input.Prefix).toBe('flash/');
    } finally {
      categories.pop();
    }
  });

  test('listGalleryImages trims leading and trailing slashes when building prefixes', async () => {
    const { GALLERY_CATEGORIES } = await import('../gallery-types');
    const categories = GALLERY_CATEGORIES as string[];
    categories.push('//flash//');

    try {
      const sendMock = jest.fn().mockResolvedValue({ Contents: [], IsTruncated: false });
      getClientSyncMock.mockReturnValue({ send: sendMock });

      const mod = await import('./storage');

      await mod.listGalleryImages('//flash//' as any);

      expect(sendMock).toHaveBeenCalledTimes(1);
      const command = sendMock.mock.calls[0][0];
      expect(command.__type).toBe('ListObjectsV2Command');
      expect(command.input.Prefix).toBe('flash/');
    } finally {
      categories.pop();
    }
  });

  test('listGalleryImages collects objects from R2 and sorts by lastModified', async () => {
    const sendMock = jest.fn().mockResolvedValue({
      Contents: [
        {
          Key: 'flash/z.webp',
          Size: 123,
          LastModified: new Date('2024-04-02T00:00:00Z'),
          ETag: 'etag-z',
        },
        {
          Key: 'flash/a.webp',
          Size: 456,
          LastModified: new Date('2024-04-05T00:00:00Z'),
          ETag: 'etag-a',
        },
      ],
      IsTruncated: false,
    });

    getClientSyncMock.mockReturnValue({ send: sendMock });

    const mod = await import('./storage');

    const result = await mod.listGalleryImages('flash');

    expect(result.isFallback).toBe(false);
    expect(result.items.map((item) => item.key)).toEqual(['flash/a.webp', 'flash/z.webp']);
    expect(formatLabelFromKeyMock).toHaveBeenCalledWith('flash/a.webp', 'flash');
    expect(formatLabelFromKeyMock).toHaveBeenCalledWith('flash/z.webp', 'flash');
  });

  test('uploadGalleryImage propagates async send rejection after invoking global mock', async () => {
    const asyncError = new Error('put failure');
    const sendMock = jest.fn().mockRejectedValue(asyncError);
    const globalSend = jest.fn();
    (globalThis as any).sendMock = globalSend;

    getClientMock.mockResolvedValue({ send: sendMock });

    const mod = await import('./storage');

    await expect(
      mod.uploadGalleryImage({
        category: 'flash',
        originalFilename: 'failure.png',
        buffer: Buffer.from('data'),
      })
    ).rejects.toThrow('put failure');
    expect(globalSend).toHaveBeenCalledWith(expect.objectContaining({ __type: 'PutObjectCommand' }));
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
