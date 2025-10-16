import { jest } from '@jest/globals';

function createMockS3Client(options: any) {
  const instance = { options, send: jest.fn(), destroy: jest.fn() };
  (globalThis as any).__jest_last_s3_client__ = instance;
  return instance;
}

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn((options) => createMockS3Client(options)),
}));

describe('r2server credentials', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_API_TOKEN;
    (globalThis as any).__jest_last_s3_client__ = undefined;
    delete (globalThis as any).S3ClientMock;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  test('normalizeSecretAccessKey caches hashed value derived from token pattern', async () => {
    process.env.R2_SECRET_ACCESS_KEY = 'v1.0-cache-token';
    const mod = await import('./credentials');

    const first = mod.normalizeSecretAccessKey();
    const second = mod.normalizeSecretAccessKey();

    expect(first).toMatch(/^[0-9a-f]{64}$/i);
    expect(second).toBe(first);
    expect(process.env.R2_API_TOKEN).toBe('v1.0-cache-token');
  });

  test('normalizeSecretAccessKey hashes when token is provided without secret', async () => {
    process.env.R2_API_TOKEN = 'v1.0-inline-token';
    const mod = await import('./credentials');

    const normalized = mod.normalizeSecretAccessKey();

    expect(normalized).toMatch(/^[0-9a-f]{64}$/i);
    expect(process.env.R2_SECRET_ACCESS_KEY).toBe(normalized);
  });

  test('normalizeSecretAccessKey returns secret when already hex formatted', async () => {
    const hexSecret = 'a'.repeat(64);
    process.env.R2_SECRET_ACCESS_KEY = hexSecret;
    const mod = await import('./credentials');

    expect(mod.normalizeSecretAccessKey()).toBe(hexSecret);
  });

  test('normalizeSecretAccessKey returns undefined when no secret or token present', async () => {
    const mod = await import('./credentials');

    expect(mod.normalizeSecretAccessKey()).toBeUndefined();
  });

  test('resolveCredentials derives access key via verification when missing', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_SECRET_ACCESS_KEY = 'v1.0-resolve-token';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ result: { id: '0123456789abcdef0123456789abcdef' } }),
    });

    const mod = await import('./credentials');

    const creds = await mod.resolveCredentials();

    expect(creds.accessKeyId).toBe('0123456789abcdef0123456789abcdef');
    expect(creds.secretAccessKey).toMatch(/^[0-9a-f]{64}$/i);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/user/tokens/verify',
      expect.objectContaining({ headers: { Authorization: expect.stringContaining('Bearer') } })
    );
  });

  test('resolveCredentials throws when verification fails to provide access key', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_SECRET_ACCESS_KEY = 'v1.0-error-token';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ result: {} }),
    });

    const mod = await import('./credentials');

    await expect(mod.resolveCredentials()).rejects.toThrow('Unable to derive an R2 access key id.');
  });

  test('hasR2Credentials returns false when secret cannot be normalized', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    const mod = await import('./credentials');

    expect(mod.hasR2Credentials()).toBe(false);
  });

  test('getClient uses injected S3 client mock', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_SECRET_ACCESS_KEY = 'a'.repeat(64);
    process.env.R2_ACCESS_KEY_ID = '0123456789abcdef0123456789abcdef';

    const mockCtor = jest.fn(() => ({ send: jest.fn(), destroy: jest.fn() }));
    (globalThis as any).S3ClientMock = mockCtor;

    const mod = await import('./credentials');

    const client = await mod.getClient();

    expect(mockCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://acct.r2.cloudflarestorage.com',
        credentials: expect.objectContaining({
          accessKeyId: '0123456789abcdef0123456789abcdef',
          secretAccessKey: 'a'.repeat(64),
        }),
      })
    );
    expect(client).toHaveProperty('send');
  });

  test('getClient throws when credentials are incomplete', async () => {
    const mod = await import('./credentials');

    await expect(mod.getClient()).rejects.toThrow('R2 credentials are not fully configured.');
  });

  test('getClientSync returns null when access key missing', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_SECRET_ACCESS_KEY = 'a'.repeat(64);
    const mod = await import('./credentials');

    expect(mod.getClientSync()).toBeNull();
  });

  test('getClientSync constructs client synchronously when credentials available', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_SECRET_ACCESS_KEY = 'a'.repeat(64);
    process.env.R2_ACCESS_KEY_ID = '0123456789abcdef0123456789abcdef';
    const mod = await import('./credentials');

    const client = mod.getClientSync();

    expect(client).not.toBeNull();
    const last = (globalThis as any).__jest_last_s3_client__;
    expect(last?.options?.credentials?.accessKeyId).toBe('0123456789abcdef0123456789abcdef');
  });

  test('_resetSingletons clears cached promises', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_SECRET_ACCESS_KEY = 'v1.0-reset-token';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ result: { id: '0123456789abcdef0123456789abcdef' } }),
    });

    const mod = await import('./credentials');

    await mod.resolveCredentials();
    expect(mod.verifyAccessKeyPromise).not.toBeNull();

    mod._resetSingletons();
    expect(mod.verifyAccessKeyPromise).toBeNull();
    expect(mod.clientPromise).toBeNull();
  });

  test('normalizeSecretAccessKey hashes plain tokens when matching api token', async () => {
    process.env.R2_API_TOKEN = 'plain-token';
    process.env.R2_SECRET_ACCESS_KEY = 'plain-token';

    const mod = await import('./credentials');

    const normalized = mod.normalizeSecretAccessKey();

    expect(normalized).toMatch(/^[0-9a-f]{64}$/i);
    expect(process.env.R2_SECRET_ACCESS_KEY).toBe(normalized);
  });

  test('resolveCredentials refreshes access key when verification returns new id', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_SECRET_ACCESS_KEY = 'a'.repeat(64);
    process.env.R2_ACCESS_KEY_ID = '0123456789abcdef0123456789abcdef';
    process.env.R2_API_TOKEN = 'v1.0-refresh-token';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ result: { id: 'fedcba9876543210fedcba9876543210' } }),
    });

    const mod = await import('./credentials');

    const creds = await mod.resolveCredentials();

    expect(creds.accessKeyId).toBe('fedcba9876543210fedcba9876543210');
    expect(process.env.R2_ACCESS_KEY_ID).toBe('fedcba9876543210fedcba9876543210');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('resolveCredentials handles verification fetch rejection', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_SECRET_ACCESS_KEY = 'v1.0-reject-token';

    (global.fetch as jest.Mock).mockRejectedValue(new Error('network failure'));

    const mod = await import('./credentials');

    await expect(mod.resolveCredentials()).rejects.toThrow('Unable to derive an R2 access key id.');
  });

  test('_debug_getClientInstance logs returned client', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_SECRET_ACCESS_KEY = 'a'.repeat(64);
    process.env.R2_ACCESS_KEY_ID = '0123456789abcdef0123456789abcdef';

    const mod = await import('./credentials');

    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    const client = await mod._debug_getClientInstance();

    expect(client).toBeDefined();
    expect(debugSpy).toHaveBeenCalledWith(
      '[r2server.debug] obtained S3 client instance',
      expect.objectContaining({ hasSend: expect.any(Boolean) })
    );

    debugSpy.mockRestore();
  });
});
