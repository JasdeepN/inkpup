import { createHmac, timingSafeEqual } from 'crypto';

export type AdminWebhookEvent =
  | {
      event: 'job_queued';
      jobId: string;
      category: string;
      createdAt: string;
    }
  | {
      event: 'job_failed';
      jobId: string;
      category: string;
      attempts: number;
      maxAttempts: number;
      nextAttemptAt?: number | null;
      lastError?: string | null;
      updatedAt: string;
    }
  | {
      event: 'job_dead_lettered';
      jobId: string;
      category: string;
      attempts: number;
      maxAttempts: number;
      lastError?: string | null;
      updatedAt: string;
    }
  | {
      event: 'job_succeeded';
      jobId: string;
      category: string;
      finalKey: string;
      updatedAt: string;
    };

export type AdminWebhookConfig = {
  url: string;
  secret: string;
};

const SIGNATURE_HEADER = 'x-hub-signature-256';
const TIMESTAMP_HEADER = 'x-hub-timestamp';
const DEFAULT_TOLERANCE_MS = 5 * 60 * 1000;

type VerifyOptions = {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
  toleranceMs?: number;
};

type SendOptions = {
  event: AdminWebhookEvent;
  config: AdminWebhookConfig | null;
  now?: number;
};

function getHmacSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function getAdminWebhookConfig(): AdminWebhookConfig | null {
  const url = process.env.ADMIN_WEBHOOK_URL?.trim();
  const secret = process.env.ADMIN_WEBHOOK_SECRET?.trim();
  if (!url || !secret) return null;
  return { url, secret };
}

export function verifyAdminWebhookSignature({ rawBody, signatureHeader, timestampHeader, secret, toleranceMs = DEFAULT_TOLERANCE_MS }: VerifyOptions): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const sentSignature = signatureHeader.slice('sha256='.length);
  const expectedSignature = getHmacSignature(rawBody, secret);
  const sentBuffer = Buffer.from(sentSignature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (sentBuffer.length !== expectedBuffer.length) {
    return false;
  }

  try {
    if (!timingSafeEqual(sentBuffer, expectedBuffer)) {
      return false;
    }
  } catch {
    return false;
  }

  if (timestampHeader) {
    const sentTime = Number(timestampHeader);
    if (Number.isFinite(sentTime)) {
      const now = Date.now();
      if (Math.abs(now - sentTime) > toleranceMs) {
        return false;
      }
    }
  }

  return true;
}

export async function sendAdminWebhookEvent({ event, config, now = Date.now() }: SendOptions): Promise<boolean> {
  if (!config) return false;

  try {
    const payload = JSON.stringify({ ...event, timestamp: new Date(now).toISOString() });
    const signature = getHmacSignature(payload, config.secret);
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [SIGNATURE_HEADER]: `sha256=${signature}`,
        [TIMESTAMP_HEADER]: String(now),
      },
      body: payload,
    });

    if (!response.ok) {
      console.warn('[admin-webhooks] webhook response not ok', { status: response.status });
      return false;
    }

    return true;
  } catch (error) {
    console.warn('[admin-webhooks] failed to send webhook', error);
    return false;
  }
}

export function getWebhookHeaders() {
  return {
    signature: SIGNATURE_HEADER,
    timestamp: TIMESTAMP_HEADER,
  } as const;
}
