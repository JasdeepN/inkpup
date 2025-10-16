import { jest } from '@jest/globals';

describe('probeR2Binding detection paths', () => {
  const ctxSymbol = Symbol.for('__cloudflare-context__');
  const originalEnv = { ...process.env };
  const originalReq = globalThis.__R2_WORKER_REQUEST__ as any;

  beforeEach(() => {
    // Preserve cumulative coverage by resetting only globals, not module registry.
    process.env = { ...originalEnv };
    delete process.env.R2_BUCKET;
    delete (globalThis as any).R2_BUCKET;
    delete (globalThis as any)[ctxSymbol];
    delete (globalThis as any).__R2_WORKER_REQUEST__;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    delete process.env.R2_BUCKET;
    delete (globalThis as any).R2_BUCKET;
    delete (globalThis as any)[ctxSymbol];
    if (originalReq !== undefined) {
      (globalThis as any).__R2_WORKER_REQUEST__ = originalReq;
    }
  });

  test('detects binding via globalThis.R2_BUCKET', async () => {
    const binding = { list: jest.fn() };
    (globalThis as any).R2_BUCKET = binding;
    const mod = await import('./probe');
    const asyncResult = await mod.probeR2Binding();
    const syncResult = mod.probeR2BindingSync();
    expect(asyncResult.binding).toBe(binding);
    expect(asyncResult.source).toBe('env');
    expect(asyncResult.contextSymbolPresent).toBe(false);
    expect(syncResult.binding).toBe(binding);
    expect(syncResult.source).toBe('env');
  });

  test('returns default when global binding is falsy', async () => {
    (globalThis as any).R2_BUCKET = null;
    const mod = await import('./probe');
    const result = await mod.probeR2Binding();
    expect(result.binding).toBeUndefined();
    expect(result.source).toBe('none');
  });

  test('returns default when global binding lacks methods', async () => {
    (globalThis as any).R2_BUCKET = { list: 'not-a-function' };
    const mod = await import('./probe');
    const result = await mod.probeR2Binding();
    expect(result.binding).toBeUndefined();
    expect(result.source).toBe('none');
  });

  test('detects binding via Cloudflare context symbol', async () => {
    const binding = { list: jest.fn() };
    (globalThis as any)[ctxSymbol] = { env: { R2_BUCKET: binding } };
    const mod = await import('./probe');
    const asyncResult = await mod.probeR2Binding();
    const syncResult = mod.probeR2BindingSync();
    expect(asyncResult.binding).toBe(binding);
    expect(asyncResult.source).toBe('context');
    expect(asyncResult.contextSymbolPresent).toBe(true);
    expect(syncResult.binding).toBe(binding);
    expect(syncResult.source).toBe('context');
    expect(syncResult.contextSymbolPresent).toBe(true);
  });

  test('detects binding via legacy __R2_WORKER_REQUEST__ request context', async () => {
    const binding = { delete: jest.fn() };
    (globalThis as any).__R2_WORKER_REQUEST__ = { cf: { env: { R2_BUCKET: binding } } };
    const mod = await import('./probe');
    const asyncResult = await mod.probeR2Binding();
    const syncResult = mod.probeR2BindingSync();
    expect(asyncResult.binding).toBe(binding);
    expect(asyncResult.source).toBe('context');
    expect(asyncResult.contextSymbolPresent).toBe(false);
    expect(syncResult.binding).toBe(binding);
    expect(syncResult.source).toBe('context');
    expect(syncResult.contextSymbolPresent).toBe(false);
  });

  test('ignores Cloudflare context symbol without usable binding', async () => {
    (globalThis as any)[ctxSymbol] = { env: {} };
    const mod = await import('./probe');
    const result = await mod.probeR2Binding();
    expect(result.binding).toBeUndefined();
    expect(result.source).toBe('none');
  });

  test('detects binding via process.env when present', async () => {
    process.env.R2_BUCKET = 'env-bucket-value';
    const mod = await import('./probe');
    const asyncResult = await mod.probeR2Binding();
    const syncResult = mod.probeR2BindingSync();
    expect(asyncResult.binding).toBe('env-bucket-value');
    expect(asyncResult.source).toBe('env');
    expect(asyncResult.contextSymbolPresent).toBe(false);
    expect(syncResult.binding).toBe('env-bucket-value');
    expect(syncResult.source).toBe('env');
    expect(syncResult.contextSymbolPresent).toBe(false);
  });

  test('loads binding from @opennextjs/cloudflare helper when available', async () => {
    const binding = { list: jest.fn() };
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@opennextjs/cloudflare', () => ({
        __esModule: true,
        getCloudflareContext: jest.fn(() => ({ env: { R2_BUCKET: binding } })),
      }));
      const mod = await import('./probe');
      const asyncResult = await mod.probeR2Binding();
      expect(asyncResult.binding).toBe(binding);
      expect(asyncResult.source).toBe('context');
      expect(asyncResult.contextSymbolPresent).toBe(false);
    });
  });

  test('ignores non-binding values returned by helper module', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@opennextjs/cloudflare', () => ({
        __esModule: true,
        getCloudflareContext: jest.fn(() => ({ env: { R2_BUCKET: 'not-a-binding' } })),
      }));
      const mod = await import('./probe');
      const asyncResult = await mod.probeR2Binding();
      expect(asyncResult.binding).toBeUndefined();
      expect(asyncResult.source).toBe('none');
    });
  });

  test('ignores non-object global binding values', async () => {
    (globalThis as any).R2_BUCKET = 'binding-as-string';
    const mod = await import('./probe');
    const asyncResult = await mod.probeR2Binding();
    expect(asyncResult.binding).toBeUndefined();
    expect(asyncResult.source).toBe('none');
  });

  test('detects bindings that only expose get()', async () => {
    const binding = { get: jest.fn() };
    (globalThis as any).R2_BUCKET = binding;
    const mod = await import('./probe');
    const asyncResult = await mod.probeR2Binding();
    expect(asyncResult.binding).toBe(binding);
    expect(asyncResult.source).toBe('env');
  });

  test('detects bindings that only expose put()', async () => {
    const binding = { put: jest.fn() };
    (globalThis as any).R2_BUCKET = binding;
    const mod = await import('./probe');
    const asyncResult = await mod.probeR2Binding();
    expect(asyncResult.binding).toBe(binding);
    expect(asyncResult.source).toBe('env');
  });

  test('detects bindings that only expose delete()', async () => {
    const binding = { delete: jest.fn() };
    (globalThis as any).R2_BUCKET = binding;
    const mod = await import('./probe');
    const asyncResult = await mod.probeR2Binding();
    expect(asyncResult.binding).toBe(binding);
    expect(asyncResult.source).toBe('env');
  });

  test('getR2Binding resolves when a binding is available', async () => {
    const binding = { list: jest.fn() };
    (globalThis as any).R2_BUCKET = binding;
    const mod = await import('./probe');
    await expect(mod.getR2Binding()).resolves.toBe(binding);
  });

  test('helper module errors do not surface to callers', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@opennextjs/cloudflare', () => ({
        __esModule: true,
        getCloudflareContext: jest.fn(() => {
          throw new Error('context failure');
        }),
      }));
      const mod = await import('./probe');
      const asyncResult = await mod.probeR2Binding();
      expect(asyncResult.binding).toBeUndefined();
      expect(asyncResult.source).toBe('none');
    });
  });

  test('ignores helper module when getCloudflareContext is unavailable', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@opennextjs/cloudflare', () => ({
        __esModule: true,
        getCloudflareContext: undefined,
      }));
      const mod = await import('./probe');
      const asyncResult = await mod.probeR2Binding();
      expect(asyncResult.binding).toBeUndefined();
      expect(asyncResult.source).toBe('none');
    });
  });

  test('getR2Binding throws when no binding is available', async () => {
    const mod = await import('./probe');
    await expect(mod.getR2Binding()).rejects.toThrow('R2_BUCKET binding is not available');
  });

  test('probe functions return default result when Symbol.for throws', async () => {
    await jest.isolateModulesAsync(async () => {
      const originalSymbolFor = Symbol.for;
      (Symbol as any).for = jest.fn(() => {
        throw new Error('symbol failure');
      });

      try {
        const mod = await import('./probe');
        const asyncResult = await mod.probeR2Binding();
        const syncResult = mod.probeR2BindingSync();
        expect(asyncResult.binding).toBeUndefined();
        expect(asyncResult.source).toBe('none');
        expect(syncResult.binding).toBeUndefined();
        expect(syncResult.source).toBe('none');
      } finally {
        (Symbol as any).for = originalSymbolFor;
      }
    });
  });
});
