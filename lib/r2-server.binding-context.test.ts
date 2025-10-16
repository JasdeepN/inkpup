process.env.R2_FORCE_S3 = 'false';
jest.resetModules();

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
type R2ServerModule = typeof import('./r2-server');

let whyIsNodeRunning: (() => void | Promise<void>) | null | undefined;

async function ensureWhyIsNodeRunning() {
  if (typeof whyIsNodeRunning !== 'undefined') {
    return whyIsNodeRunning;
  }
  try {
    const loaded = require('why-is-node-running');
    whyIsNodeRunning = typeof loaded === 'function' ? loaded : null;
  } catch (error) {
     
    console.warn('why-is-node-running is unavailable; skipping async resource diagnostics.', error);
    whyIsNodeRunning = null;
  }
  return whyIsNodeRunning;
}

// Temporary diagnostics to surface lingering resources keeping Jest alive
async function logActiveAsyncResources(context: string): Promise<void> {
  const diagnostic = await ensureWhyIsNodeRunning();
  if (!diagnostic) {
    return;
  }
   
  console.info('[TEST DEBUG] Checking active async resources via why-is-node-running:', context);
  try {
    await diagnostic();
  } catch (error) {
     
    console.warn('why-is-node-running threw while collecting diagnostics.', error);
  }
}

// Create a single mock binding object
const listMock = jest.fn() as any;
const r2BindingMock = {
  list: listMock,
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};
// Patch: assign mocks to both globalThis and global
(globalThis as any).listMock = listMock;
(global as any).listMock = listMock;

// Set all possible R2 binding locations to the same mock
(globalThis as any).R2_BUCKET = r2BindingMock;
(globalThis as any)[Symbol.for('__cloudflare-context__')] = { env: { R2_BUCKET: r2BindingMock } };

// Mock getCloudflareContext to return env with the same mock
const getCloudflareContext = jest.fn().mockReturnValue({ env: { R2_BUCKET: r2BindingMock } });
jest.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext }));

// Globally mock AWS SDK S3Client to prevent real client creation and async leaks
jest.mock(
  '@aws-sdk/client-s3',
  () =>
    ({
      S3Client: jest.fn().mockImplementation(() => {
  const sendMock = jest.fn<(command?: unknown) => Promise<unknown>>().mockResolvedValue({});
  const destroyMock = jest.fn<() => void>();
        return {
          send: sendMock,
          destroy: destroyMock,
        };
      }),
      ListObjectsV2Command: jest.fn(),
      PutObjectCommand: jest.fn(),
      DeleteObjectCommand: jest.fn(),
    }) as unknown as typeof import('@aws-sdk/client-s3')
);

describe('r2-server Cloudflare context binding', () => {
  const modulePath = './r2-server';
  const originalEnv = { ...process.env };

  let originalFetch: typeof global.fetch;
  class MockResponse {
    ok = true;
    async json() { return { result: { id: '1234567890abcdef1234567890abcdef' } }; }
    async text() { return ''; }
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      R2_PUBLIC_HOSTNAME: 'https://cdn.example.com',
      FORCE_S3: 'false',
      R2_BUCKET: 'test-bucket',
      R2_ACCOUNT_ID: 'test-account-id',
      R2_ACCESS_KEY_ID: '1234567890abcdef1234567890abcdef',
      R2_SECRET_ACCESS_KEY: 'dummysecretkey1234567890abcdef',
    };
    // Save and mock global.fetch
    originalFetch = global.fetch;
    global.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      return Promise.resolve(new MockResponse());
    }) as typeof global.fetch;

    // Create a single mock binding object
    const r2BindingMock = {
      list: listMock,
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    // Set all possible R2 binding locations to the same mock
    (globalThis as any).R2_BUCKET = r2BindingMock;
    (globalThis as any)[Symbol.for('__cloudflare-context__')] = { env: { R2_BUCKET: r2BindingMock } };

    // Reset singleton promises in r2-server module
    try {
      const r2Server = require('./r2-server');
      if ('verifyAccessKeyPromise' in r2Server) r2Server.verifyAccessKeyPromise = null;
      if ('clientPromise' in r2Server) r2Server.clientPromise = null;
    } catch (error) {
       
      console.warn('Could not reset r2-server singleton promises:', error);
    }
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    try {
      const r2Server = require('./r2-server');
      if ('clientPromise' in r2Server && r2Server.clientPromise) {
        const client = await r2Server.clientPromise;
        if (client && typeof client.destroy === 'function') {
          client.destroy();
        }
      }
    } catch (error) {
       
      console.warn('Could not destroy mocked R2 client:', error);
    }
    try {
      const r2Server = require('./r2-server');
      if ('verifyAccessKeyPromise' in r2Server) r2Server.verifyAccessKeyPromise = null;
      if ('clientPromise' in r2Server) r2Server.clientPromise = null;
    } catch (error) {
       
      console.warn('Could not reset r2-server singleton promises in afterEach:', error);
    }
    delete (globalThis as any).R2_BUCKET;
    delete (globalThis as any)[Symbol.for('__cloudflare-context__')];
    jest.clearAllMocks();
  });

  test('listGalleryImages uses binding provided by getCloudflareContext env', async () => {
    jest.setTimeout(5000);
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    listMock.mockResolvedValue({
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
      delimitedPrefixes: [],
    } as unknown as any);

    (getCloudflareContext as jest.Mock).mockReturnValue({
      env: {
        R2_BUCKET: {
          list: listMock,
        },
      },
    });

    const server = jest.requireActual<R2ServerModule>(modulePath);
    const result = await server.listGalleryImages('available');
    expect(listMock).toHaveBeenCalled();
    const callArgs = listMock.mock.calls[0]?.[0];
    expect(callArgs).toBeDefined();
    expect(callArgs.prefix).toMatch(/^available\/?$/);
    expect(callArgs.limit).toBe(1000);
    expect(callArgs.cursor).toBeUndefined();
    expect(result.isFallback).toBe(false);
  });
});
