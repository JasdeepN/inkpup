import { verifyAdminWebhookSignature } from './admin-webhooks';
import crypto from 'crypto';

describe('admin webhook signature verification', () => {
  test('accepts valid signature and timestamp', () => {
    const secret = 'unit-test-secret';
    const payload = JSON.stringify({ event: 'job_queued', jobId: 't-unit-1', category: 'hero', createdAt: new Date().toISOString() });
    const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const timestamp = String(Date.now());

    const ok = verifyAdminWebhookSignature({ rawBody: payload, signatureHeader: signature, timestampHeader: timestamp, secret });
    expect(ok).toBe(true);
  });

  test('rejects invalid signature', () => {
    const secret = 'unit-test-secret';
    const payload = JSON.stringify({ event: 'job_queued', jobId: 't-unit-2', category: 'hero', createdAt: new Date().toISOString() });
    const badSignature = 'sha256=deadbeef';
    const timestamp = String(Date.now());

    const ok = verifyAdminWebhookSignature({ rawBody: payload, signatureHeader: badSignature, timestampHeader: timestamp, secret });
    expect(ok).toBe(false);
  });

  test('rejects out-of-tolerance timestamp', () => {
    const secret = 'unit-test-secret';
    const payload = JSON.stringify({ event: 'job_queued', jobId: 't-unit-3', category: 'hero', createdAt: new Date().toISOString() });
    const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const oldTimestamp = String(Date.now() - 10 * 60 * 1000); // 10 minutes old

    const ok = verifyAdminWebhookSignature({ rawBody: payload, signatureHeader: signature, timestampHeader: oldTimestamp, secret, toleranceMs: 5 * 60 * 1000 });
    expect(ok).toBe(false);
  });
});
