import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Minimal S3 client & command mocks with in-memory store
const store: Record<string, any> = {};

class PutObjectCommand { constructor(public params: any) {} }
class ListObjectsV2Command { constructor(public params: any) {} }
class GetObjectCommand { constructor(public params: any) {} }
class DeleteObjectCommand { constructor(public params: any) {} }
class HeadObjectCommand { constructor(public params: any) {} }

class MockStream {
  private ended = false;
  constructor(private data: Buffer) {}
  on(event: string, fn: any) {
    if (event === 'data') fn(this.data);
    if (event === 'end') fn();
    return this;
  }
  once(event: string, fn: any) { return this.on(event, fn); }
}

const send = jest.fn(async (cmd: any) => {
  const name = cmd?.constructor?.name;
  if (name === 'PutObjectCommand') {
    store[cmd.params.Key] = cmd.params.Body; return {}; }
  if (name === 'ListObjectsV2Command') {
    const prefix = cmd.params.Prefix;
    const keys = Object.keys(store).filter(k => k.startsWith(prefix));
    return { Contents: keys.map(k => ({ Key: k })) };
  }
  if (name === 'GetObjectCommand') {
    const body = store[cmd.params.Key];
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
    return { Body: new MockStream(buf) };
  }
  if (name === 'DeleteObjectCommand') { delete store[cmd.params.Key]; return {}; }
  if (name === 'HeadObjectCommand') { throw new Error('NotFound'); }
  return {};
});

class S3ClientMock { constructor(public config: any) {} send = send; }

jest.mock('@aws-sdk/client-s3', () => ({
  __esModule: true,
  S3Client: S3ClientMock,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
}));

describe('upload job queue', () => {
  const originalEnv = { ...process.env };
  beforeEach(() => {
    jest.resetModules();
    Object.keys(store).forEach(k => delete store[k]);
    process.env = { ...originalEnv };
    (globalThis as any).fetch = jest.fn(async () => ({ ok: true, json: async () => ({ result: { id: 'verified-access-key' } }) }));
  });

  test('enqueueUploadJob throws without credentials', async () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_BUCKET;
    delete process.env.R2_API_TOKEN;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    const { enqueueUploadJob } = await import('./queue');
    await expect(enqueueUploadJob({ category: 'flash', originalFilename: 'a.jpg', buffer: Buffer.from('x') })).rejects.toThrow('R2 credentials are required');
  });

  test('enqueueUploadJob + getUploadJobSummary happy path', async () => {
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_BUCKET = 'bucket';
    process.env.R2_API_TOKEN = 'test-api-token-value';
    // Secret derived from token (sha256) intentionally left unset to exercise derive logic
    const { enqueueUploadJob, getUploadJobSummary } = await import('./queue');
    const { jobId, jobKey } = await enqueueUploadJob({ category: 'flash', originalFilename: 'sample.jpg', buffer: Buffer.from('img'), alt: 'alt', caption: 'cap' });
    expect(jobId).toBeDefined();
    expect(typeof jobKey).toBe('string');
    const summary = await getUploadJobSummary();
    expect(summary.queued).toBe(1);
    expect(summary.scheduled).toBe(0);
    expect(summary.deadLetter).toBe(0);
  });
});
