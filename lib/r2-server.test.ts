import { jest } from '@jest/globals';

describe('r2-server fallback behaviour', () => {
  const modulePath = './r2-server';

  beforeEach(() => {
    jest.resetModules();
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_API_TOKEN;

    delete (globalThis as any).R2_BUCKET;
    const ctxSymbol = Symbol.for('__cloudflare-context__');
    if (Object.prototype.hasOwnProperty.call(globalThis, ctxSymbol)) {
      delete (globalThis as any)[ctxSymbol];
    }
  });

  test('returns fallback gallery items when credentials are missing', async () => {
    const { hasR2Credentials, listGalleryImages, getFallbackGalleryItems } = await import(modulePath);

    expect(await hasR2Credentials()).toBe(false);

    const items: any[] = [];
    for await (const item of listGalleryImages('healed')) {
      items.push(item);
    }

    const fallbackItems = getFallbackGalleryItems('healed');

    expect(items.length).toBe(fallbackItems.length);
    expect(items.every((item) => item.category === 'healed')).toBe(true);
    expect(items.every((item) => item.alt && item.alt.length > 0)).toBe(true);
  });

  test('returns no items for unsupported gallery categories', async () => {
    const { listGalleryImages } = await import(modulePath);
    const items: any[] = [];
    for await (const item of listGalleryImages('unknown' as never)) {
      items.push(item);
    }
    expect(items.length).toBe(0);
  });

  test('getFallbackGalleryItems returns bundled data for valid category', async () => {
    const { getFallbackGalleryItems } = await import(modulePath);

    const items = getFallbackGalleryItems('flash');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.category === 'flash')).toBe(true);
  });

  test('derives secret access key from API token when the values match', async () => {
    const token = 'example-token-value';
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = 'access';
    process.env.R2_SECRET_ACCESS_KEY = token;
    process.env.R2_API_TOKEN = token;

    const { hasR2Credentials } = await import(modulePath);

    expect(await hasR2Credentials()).toBe(true);
    expect(process.env.R2_SECRET_ACCESS_KEY).not.toBe(token);
    expect(process.env.R2_SECRET_ACCESS_KEY).toMatch(/^[0-9a-f]{64}$/i);
  });

  test('normalizes secret access key when only a token-like value is provided', async () => {
    const token = 'v1.0-example-token';
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_ACCESS_KEY_ID = '0123456789abcdef0123456789abcdef';
    process.env.R2_SECRET_ACCESS_KEY = token;
    delete process.env.R2_API_TOKEN;

    const { hasR2Credentials } = await import(modulePath);

    expect(await hasR2Credentials()).toBe(true);
    expect(process.env.R2_SECRET_ACCESS_KEY).toMatch(/^[0-9a-f]{64}$/i);
    expect(process.env.R2_API_TOKEN).toBe(token);
  });

  test('probeR2Binding returns expected structure when no binding', async () => {
    const { probeR2Binding } = await import(modulePath);
    const result = await probeR2Binding();
    expect(result).toHaveProperty('binding', undefined);
    expect(result).toHaveProperty('source', 'none');
    expect(result).toHaveProperty('contextSymbolPresent', false);
  });

  test('getR2Binding throws when no binding', async () => {
    const { getR2Binding } = await import(modulePath);
    await expect(getR2Binding()).rejects.toThrow(/R2_BUCKET binding is not available/);
  });

  test('fallbackResult returns correct structure for error reason', async () => {
    const { fallbackResult } = await import(modulePath);
    const result = fallbackResult('error_reason');
    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toBe('error_reason');
    expect(result.usedBundledFallback).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
  });

  test('listGalleryImages falls back when S3 credentials are incomplete', async () => {
    process.env.R2_ACCOUNT_ID = 'account';
    process.env.R2_BUCKET = '';
    process.env.R2_ACCESS_KEY_ID = 'access';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    const { listGalleryImages, getFallbackGalleryItems } = await import(modulePath);
    const items: any[] = [];
    for await (const item of listGalleryImages('flash')) {
      items.push(item);
    }
    const fallbackItems = getFallbackGalleryItems('flash');
    expect(items.length).toBe(fallbackItems.length);
    expect(items.every((item) => item.category === 'flash')).toBe(true);
  });

  test('listGalleryImages surfaces background errors as fallback', async () => {
    const backgroundError = new Error('background failure');

    await jest.isolateModulesAsync(async () => {
      jest.doMock('./r2server/storage', () => ({
        __esModule: true,
        uploadGalleryImage: jest.fn(),
        deleteGalleryImage: jest.fn(),
        generateGalleryObjectKey: jest.fn(),
        fallbackResult: jest.fn(),
        getClient: jest.fn(),
        getClientSync: jest.fn(),
        hasR2Credentials: jest.fn(),
        normalizeSecretAccessKey: jest.fn(),
        resolveCredentials: jest.fn(),
        listGalleryImages: jest.fn().mockRejectedValue(backgroundError),
        getCredentialStatus: jest.fn().mockReturnValue({
          accountId: false,
          bucket: false,
          accessKey: false,
          secretAccessKey: false,
        }),
      }));

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { listGalleryImages } = await import(modulePath);

      const result = listGalleryImages('flash');
      await expect(result.asPromise()).resolves.toEqual({ items: [], isFallback: true, usedBundledFallback: false });
      expect(errorSpy).toHaveBeenCalledWith('listGalleryImages background error', backgroundError);
      errorSpy.mockRestore();
    });
  });

  test('module export setters reset credential singletons', async () => {
    await jest.isolateModulesAsync(async () => {
      const resetSpy = jest.fn();

      jest.doMock('./r2server/credentials', () => ({
        __esModule: true,
        _resetSingletons: resetSpy,
        verifyAccessKeyPromise: Promise.resolve(),
        clientPromise: Promise.resolve(),
        getClient: jest.fn(),
        getClientSync: jest.fn(),
        hasR2Credentials: jest.fn(),
        normalizeSecretAccessKey: jest.fn(),
        resolveCredentials: jest.fn(),
      }));

      jest.doMock('./r2server/storage', () => ({
        __esModule: true,
        uploadGalleryImage: jest.fn(),
        deleteGalleryImage: jest.fn(),
        generateGalleryObjectKey: jest.fn(),
        fallbackResult: jest.fn(),
        listGalleryImages: jest.fn().mockResolvedValue({ items: [], isFallback: false, usedBundledFallback: false }),
        getCredentialStatus: jest.fn().mockReturnValue(undefined),
      }));

      jest.doMock('./r2server/utils', () => ({
        __esModule: true,
        buildFallbackItems: jest.fn(),
        formatLabelFromKey: jest.fn(),
        getFallbackGalleryItems: jest.fn(),
        sanitizeFilename: jest.fn(),
      }));

      jest.doMock('./r2server/probe', () => ({
        __esModule: true,
        getR2Binding: jest.fn(),
        probeR2Binding: jest.fn(),
        probeR2BindingSync: jest.fn(),
      }));

      jest.doMock('./r2server/sniff', () => ({
        __esModule: true,
        sniffContentType: jest.fn(),
      }));

      const mod = await import(modulePath);
      expect(typeof mod.listGalleryImages).toBe('function');

      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const legacy = require(modulePath);
      const verifyDescriptor = Object.getOwnPropertyDescriptor(legacy, 'verifyAccessKeyPromise');
      const clientDescriptor = Object.getOwnPropertyDescriptor(legacy, 'clientPromise');

      verifyDescriptor?.set?.(null);
      clientDescriptor?.set?.(null);

      expect(resetSpy).toHaveBeenCalledTimes(2);
    });
  });

  test('module export setters swallow reset errors', async () => {
    await jest.isolateModulesAsync(async () => {
      const resetSpy = jest.fn(() => {
        throw new Error('reset failure');
      });

      jest.doMock('./r2server/credentials', () => ({
        __esModule: true,
        _resetSingletons: resetSpy,
        verifyAccessKeyPromise: Promise.resolve(),
        clientPromise: Promise.resolve(),
        getClient: jest.fn(),
        getClientSync: jest.fn(),
        hasR2Credentials: jest.fn(),
        normalizeSecretAccessKey: jest.fn(),
        resolveCredentials: jest.fn(),
      }));

      jest.doMock('./r2server/storage', () => ({
        __esModule: true,
        uploadGalleryImage: jest.fn(),
        deleteGalleryImage: jest.fn(),
        generateGalleryObjectKey: jest.fn(),
        fallbackResult: jest.fn(),
        listGalleryImages: jest.fn().mockResolvedValue({ items: [], isFallback: false, usedBundledFallback: false }),
        getCredentialStatus: jest.fn().mockReturnValue(undefined),
      }));

      jest.doMock('./r2server/utils', () => ({
        __esModule: true,
        buildFallbackItems: jest.fn(),
        formatLabelFromKey: jest.fn(),
        getFallbackGalleryItems: jest.fn(),
        sanitizeFilename: jest.fn(),
      }));

      jest.doMock('./r2server/probe', () => ({
        __esModule: true,
        getR2Binding: jest.fn(),
        probeR2Binding: jest.fn(),
        probeR2BindingSync: jest.fn(),
      }));

      jest.doMock('./r2server/sniff', () => ({
        __esModule: true,
        sniffContentType: jest.fn(),
      }));

      const mod = await import(modulePath);
      expect(typeof mod.listGalleryImages).toBe('function');

      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const legacy = require(modulePath);
      const verifyDescriptor = Object.getOwnPropertyDescriptor(legacy, 'verifyAccessKeyPromise');
      const clientDescriptor = Object.getOwnPropertyDescriptor(legacy, 'clientPromise');

      expect(() => verifyDescriptor?.set?.(null)).not.toThrow();
      expect(() => clientDescriptor?.set?.(null)).not.toThrow();
      expect(resetSpy).toHaveBeenCalledTimes(2);
    });
  });

  test('module export initialization tolerates non-configurable properties', async () => {
    await jest.isolateModulesAsync(async () => {
      const originalModule = (globalThis as any).module;
      const fakeModule = { exports: {} };
      Object.defineProperty(fakeModule.exports, 'verifyAccessKeyPromise', { value: 1, configurable: false });
      Object.defineProperty(fakeModule.exports, 'clientPromise', { value: 1, configurable: false });
      (globalThis as any).module = fakeModule;

      try {
        const mod = await import(modulePath);
        expect(typeof mod.listGalleryImages).toBe('function');
      } finally {
        if (originalModule === undefined) {
          delete (globalThis as any).module;
        } else {
          (globalThis as any).module = originalModule;
        }
      }
    });
  });

  test('listGalleryImages handles missing getCredentialStatus export', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('./r2server/credentials', () => ({
        __esModule: true,
        _resetSingletons: jest.fn(),
        verifyAccessKeyPromise: Promise.resolve(),
        clientPromise: Promise.resolve(),
        getClient: jest.fn(),
        getClientSync: jest.fn(),
        hasR2Credentials: jest.fn(),
        normalizeSecretAccessKey: jest.fn(),
        resolveCredentials: jest.fn(),
      }));

      const asyncResult = {
        items: [{ id: 'a', key: 'flash/a.webp' }],
        isFallback: false,
        usedBundledFallback: false,
        credentialStatus: { accountId: true, bucket: true, accessKey: true, secretAccessKey: true },
      };

      jest.doMock('./r2server/storage', () => ({
        __esModule: true,
        uploadGalleryImage: jest.fn(),
        deleteGalleryImage: jest.fn(),
        generateGalleryObjectKey: jest.fn(),
        fallbackResult: jest.fn(),
        listGalleryImages: jest.fn().mockResolvedValue(asyncResult),
        getCredentialStatus: undefined,
      }));

      jest.doMock('./r2server/utils', () => ({
        __esModule: true,
        buildFallbackItems: jest.fn(),
        formatLabelFromKey: jest.fn(),
        getFallbackGalleryItems: jest.fn(),
        sanitizeFilename: jest.fn(),
      }));

      jest.doMock('./r2server/probe', () => ({
        __esModule: true,
        getR2Binding: jest.fn(),
        probeR2Binding: jest.fn(),
        probeR2BindingSync: jest.fn(),
      }));

      jest.doMock('./r2server/sniff', () => ({
        __esModule: true,
        sniffContentType: jest.fn(),
      }));

      const mod = await import(modulePath);
      const result = mod.listGalleryImages('flash');

      expect(result.credentialStatus).toBeUndefined();
      await expect(result.asPromise()).resolves.toEqual(expect.objectContaining({ credentialStatus: asyncResult.credentialStatus }));
      expect(result.credentialStatus).toEqual(asyncResult.credentialStatus);
    });
  });

  test('initialization tolerates lack of CommonJS module global', async () => {
    await jest.isolateModulesAsync(async () => {
      const originalModule = (globalThis as any).module;
      // Ensure the global is absent to hit the outer catch block.
      delete (globalThis as any).module;

      try {
        const mod = await import(modulePath);
        expect(typeof mod.listGalleryImages).toBe('function');
      } finally {
        if (originalModule === undefined) {
          delete (globalThis as any).module;
        } else {
          (globalThis as any).module = originalModule;
        }
      }
    });
  });
});
