jest.mock('next/cache', () => ({
  revalidatePath: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (payload: unknown, options?: unknown) => ({ payload, options }),
  },
}));

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { POST } from './route';

describe('POST /api/admin/reciever', () => {
  const origEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...origEnv };
    process.env.ADMIN_WEBHOOK_SECRET = 'unit-test-secret';
    process.env.ADMIN_WEBHOOK_URL = 'http://localhost/api/admin/reciever';
  });

  afterAll(() => {
    process.env = origEnv;
  });

  function makeReq(payload: string, signature?: string, timestamp?: string) {
    return {
      text: async () => payload,
      headers: {
        get: (name: string) => {
          if (name === 'x-hub-signature-256') return signature ?? null;
          if (name === 'x-hub-timestamp') return timestamp ?? null;
          return null;
        },
      },
    } as unknown as Request;
  }

  test('revalidates /admin on valid signed job_queued event', async () => {
    const payloadObj = { event: 'job_queued', jobId: 'r-1', category: 'hero', createdAt: new Date().toISOString() };
    const payload = JSON.stringify(payloadObj);
    const sig = crypto.createHmac('sha256', process.env.ADMIN_WEBHOOK_SECRET!).update(payload).digest('hex');
    const signatureHeader = `sha256=${sig}`;
    const ts = String(Date.now());

    const req = makeReq(payload, signatureHeader, ts);
    const res = await POST(req);

    // NextResponse.json mock returns { payload, options }
    expect(res).toHaveProperty('payload');
    expect(res.payload).toEqual({ ok: true });

    // revalidatePath should have been called with '/admin'
    expect((revalidatePath as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(1);
    expect((revalidatePath as jest.Mock).mock.calls[0][0]).toBe('/admin');
  });

  test('returns 401 on invalid signature and does not revalidate', async () => {
    const payloadObj = { event: 'job_queued', jobId: 'r-2', category: 'hero', createdAt: new Date().toISOString() };
    const payload = JSON.stringify(payloadObj);
    const badSignature = 'sha256=deadbeef';
    const ts = String(Date.now());

    const req = makeReq(payload, badSignature, ts);
    const res = await POST(req);

    expect(res.payload).toEqual({ ok: false, error: 'invalid signature' });
    expect(res.options).toMatchObject({ status: 401 });
    expect((revalidatePath as jest.Mock).mock.calls.length).toBe(0);
  });

  test('returns 400 on invalid JSON payload', async () => {
    const payload = 'not a json';
    const sig = crypto.createHmac('sha256', process.env.ADMIN_WEBHOOK_SECRET!).update(payload).digest('hex');
    const signatureHeader = `sha256=${sig}`;
    const ts = String(Date.now());

    const req = makeReq(payload, signatureHeader, ts);
    const res = await POST(req);

    expect(res.payload).toEqual({ ok: false, error: 'invalid payload' });
    expect(res.options).toMatchObject({ status: 400 });
    expect((revalidatePath as jest.Mock).mock.calls.length).toBe(0);
  });
});
