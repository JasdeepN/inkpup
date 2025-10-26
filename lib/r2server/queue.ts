import { PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { getClient, hasR2Credentials } from './credentials';
import { bucket } from './config';
import { sanitizeFilename } from './utils';
import type { GalleryCategory } from '../gallery-types';
import { generateGalleryObjectKey, uploadGalleryImage } from './storage';
import { getAdminWebhookConfig, sendAdminWebhookEvent, type AdminWebhookEvent } from '../admin-webhooks';

const JOBS_PREFIX = 'jobs/';
const DEAD_LETTER_PREFIX = 'jobs-failed/';
const DEFAULT_MAX_ATTEMPTS = Number(process.env.UPLOAD_JOB_MAX_ATTEMPTS ?? 5);
const BACKOFF_BASE_MS = Number(process.env.UPLOAD_JOB_BACKOFF_BASE_MS ?? 1000);
const BACKOFF_MAX_MS = Number(process.env.UPLOAD_JOB_BACKOFF_MAX_MS ?? 60_000);
const BACKOFF_JITTER_MS = Number(process.env.UPLOAD_JOB_BACKOFF_JITTER_MS ?? 500);

type S3ClientInstance = Awaited<ReturnType<typeof getClient>>;

function nowIso() {
  return new Date().toISOString();
}

async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    if (!stream) return resolve(Buffer.alloc(0));
    stream.on('data', (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))));
    stream.once('end', () => resolve(Buffer.concat(chunks)));
    stream.once('error', (err: any) => reject(err));
  });
}

type UploadJobStatus = 'queued' | 'scheduled' | 'dead_letter';

export type UploadJobRecord = {
  jobId: string;
  category: GalleryCategory;
  originalKey: string;
  originalFilename: string;
  alt?: string;
  caption?: string;
  status: UploadJobStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: number | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EnqueueUploadParams = {
  category: GalleryCategory;
  originalFilename: string;
  buffer: Buffer;
  alt?: string;
  caption?: string;
  contentType?: string;
  maxAttempts?: number;
};

function computeNextAttemptDelay(attempt: number): number {
  const expo = BACKOFF_BASE_MS * Math.pow(2, Math.max(0, attempt - 1));
  const capped = Math.min(BACKOFF_MAX_MS, expo);
  const jitter = BACKOFF_JITTER_MS > 0 ? Math.floor(Math.random() * BACKOFF_JITTER_MS) : 0;
  return capped + jitter;
}

async function writeJson(client: S3ClientInstance, key: string, value: object) {
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(value),
    ContentType: 'application/json',
  }));
}

async function deleteObject(client: S3ClientInstance, key: string) {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

async function readJobRecord(client: S3ClientInstance, key: string): Promise<UploadJobRecord | null> {
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = await streamToBuffer(result.Body);
    const parsed = JSON.parse(body.toString('utf8')) as Partial<UploadJobRecord> & { jobId?: string };
    if (!parsed || typeof parsed.jobId !== 'string') {
      return null;
    }

    return {
      jobId: parsed.jobId,
      category: parsed.category as GalleryCategory,
      originalKey: parsed.originalKey ?? '',
      originalFilename: parsed.originalFilename ?? '',
      alt: parsed.alt ?? undefined,
      caption: parsed.caption ?? undefined,
      status: (parsed.status as UploadJobStatus) ?? 'queued',
      attempts: typeof parsed.attempts === 'number' ? parsed.attempts : 0,
      maxAttempts: typeof parsed.maxAttempts === 'number' ? parsed.maxAttempts : DEFAULT_MAX_ATTEMPTS,
      nextAttemptAt: typeof parsed.nextAttemptAt === 'number' ? parsed.nextAttemptAt : null,
      lastError: parsed.lastError ?? null,
      createdAt: parsed.createdAt ?? nowIso(),
      updatedAt: parsed.updatedAt ?? nowIso(),
    } satisfies UploadJobRecord;
  } catch (error) {
    console.error('Failed to read upload job record', key, error);
    return null;
  }
}

async function moveJobToDeadLetter(client: S3ClientInstance, sourceKey: string, record: UploadJobRecord) {
  const deadKey = `${DEAD_LETTER_PREFIX}${record.jobId}.json`;
  await writeJson(client, deadKey, record);
  await deleteObject(client, sourceKey);
}

async function cleanupSuccess(client: S3ClientInstance, jobKey: string, originalKey: string | undefined, deleteOriginal: boolean) {
  await deleteObject(client, jobKey);
  if (deleteOriginal && originalKey) {
    try {
      await deleteObject(client, originalKey);
    } catch (error) {
      console.warn('Failed to delete pending original after success', originalKey, error);
    }
  }
}

export async function enqueueUploadJob({ category, originalFilename, buffer, alt, caption, contentType, maxAttempts }: EnqueueUploadParams) {
  if (!hasR2Credentials()) {
    throw new Error('R2 credentials are required to enqueue upload jobs.');
  }

  const client = await getClient();
  const webhookConfig = getAdminWebhookConfig();
  const jobId = randomUUID();
  const sanitized = sanitizeFilename(originalFilename || 'image');
  const extMatch = (originalFilename || '').match(/(\.[a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1] : '';
  const originalKey = `pending/${jobId}/${sanitized}${ext}`;

  const metadata: Record<string, string> = {};
  if (alt) metadata.alt = String(alt);
  if (caption) metadata.caption = String(caption);
  metadata.originalFilename = originalFilename;

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: originalKey,
    Body: buffer,
    ContentType: contentType ?? 'application/octet-stream',
    Metadata: Object.keys(metadata).length ? metadata : undefined,
  }));

  const jobKey = `${JOBS_PREFIX}${jobId}.json`;
  const createdAt = nowIso();
  const record: UploadJobRecord = {
    jobId,
    category,
    originalKey,
    originalFilename,
    alt,
    caption,
    status: 'queued',
    attempts: 0,
    maxAttempts: maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    nextAttemptAt: null,
    lastError: null,
    createdAt,
    updatedAt: createdAt,
  };

  await writeJson(client, jobKey, record);

  const event: AdminWebhookEvent = {
    event: 'job_queued',
    jobId,
    category,
    createdAt,
  };
  await sendAdminWebhookEvent({ event, config: webhookConfig });

  return { jobId, jobKey };
}

function isReadyForProcessing(record: UploadJobRecord, now: number): boolean {
  if (record.status === 'scheduled') {
    if (record.nextAttemptAt && record.nextAttemptAt > now) {
      return false;
    }
    return true;
  }
  if (record.status === 'queued') {
    return true;
  }
  return false;
}

async function ensureFinalObjectAbsent(client: S3ClientInstance, key: string) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return false;
  } catch {
    return true;
  }
}

async function sendWebhook(event: AdminWebhookEvent, config: ReturnType<typeof getAdminWebhookConfig>) {
  if (!config) return;
  await sendAdminWebhookEvent({ event, config });
}

export type ProcessJobsOptions = {
  limit?: number;
  deleteOriginal?: boolean;
};

export async function processPendingUploadJobs(options?: ProcessJobsOptions) {
  if (!hasR2Credentials()) {
    throw new Error('R2 credentials are required to process upload jobs.');
  }

  const { limit = 100, deleteOriginal = true } = options ?? {};
  const client = await getClient();
  const webhookConfig = getAdminWebhookConfig();
  let continuationToken: string | undefined;

  do {
    const listRes = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: JOBS_PREFIX, MaxKeys: limit, ContinuationToken: continuationToken }));
    const objects = listRes.Contents ?? [];
    const now = Date.now();

    for (const obj of objects) {
      const jobKey = obj.Key;
      if (!jobKey || jobKey.endsWith('/')) continue;

      const record = await readJobRecord(client, jobKey);
      if (!record) {
        await cleanupSuccess(client, jobKey, undefined, false);
        continue;
      }

      if (!isReadyForProcessing(record, now)) {
        continue;
      }

      if (record.status === 'scheduled') {
        record.status = 'queued';
        record.nextAttemptAt = null;
        record.updatedAt = nowIso();
        await writeJson(client, jobKey, record);
      }

      const finalKey = generateGalleryObjectKey(record.category, record.originalFilename);
      const finalMissing = await ensureFinalObjectAbsent(client, finalKey);
      if (!finalMissing) {
        await cleanupSuccess(client, jobKey, record.originalKey, deleteOriginal);
        await sendWebhook({ event: 'job_succeeded', jobId: record.jobId, category: record.category, finalKey, updatedAt: nowIso() }, webhookConfig);
        continue;
      }

      let originalBuffer: Buffer;
      try {
        const origGet = await client.send(new GetObjectCommand({ Bucket: bucket, Key: record.originalKey }));
        originalBuffer = await streamToBuffer(origGet.Body);
      } catch (error) {
        record.attempts += 1;
        record.lastError = error instanceof Error ? error.message : String(error);
        record.updatedAt = nowIso();
        const isTerminal = record.attempts >= record.maxAttempts;
        if (isTerminal) {
          record.status = 'dead_letter';
          await moveJobToDeadLetter(client, jobKey, record);
          await sendWebhook({ event: 'job_dead_lettered', jobId: record.jobId, category: record.category, attempts: record.attempts, maxAttempts: record.maxAttempts, lastError: record.lastError, updatedAt: record.updatedAt }, webhookConfig);
        } else {
          record.status = 'scheduled';
          const delay = computeNextAttemptDelay(record.attempts);
          record.nextAttemptAt = Date.now() + delay;
          await writeJson(client, jobKey, record);
          await sendWebhook({ event: 'job_failed', jobId: record.jobId, category: record.category, attempts: record.attempts, maxAttempts: record.maxAttempts, nextAttemptAt: record.nextAttemptAt, lastError: record.lastError, updatedAt: record.updatedAt }, webhookConfig);
        }
        continue;
      }

      try {
        await uploadGalleryImage({
          category: record.category,
          originalFilename: record.originalFilename,
          buffer: originalBuffer,
          alt: record.alt,
          caption: record.caption,
        });
      } catch (error) {
        record.attempts += 1;
        record.lastError = error instanceof Error ? error.message : String(error);
        record.updatedAt = nowIso();
        const isTerminal = record.attempts >= record.maxAttempts;
        if (isTerminal) {
          record.status = 'dead_letter';
          await moveJobToDeadLetter(client, jobKey, record);
          await sendWebhook({ event: 'job_dead_lettered', jobId: record.jobId, category: record.category, attempts: record.attempts, maxAttempts: record.maxAttempts, lastError: record.lastError, updatedAt: record.updatedAt }, webhookConfig);
        } else {
          record.status = 'scheduled';
          const delay = computeNextAttemptDelay(record.attempts);
          record.nextAttemptAt = Date.now() + delay;
          await writeJson(client, jobKey, record);
          await sendWebhook({ event: 'job_failed', jobId: record.jobId, category: record.category, attempts: record.attempts, maxAttempts: record.maxAttempts, nextAttemptAt: record.nextAttemptAt, lastError: record.lastError, updatedAt: record.updatedAt }, webhookConfig);
        }
        continue;
      }

      await cleanupSuccess(client, jobKey, record.originalKey, deleteOriginal);
      await sendWebhook({ event: 'job_succeeded', jobId: record.jobId, category: record.category, finalKey, updatedAt: nowIso() }, webhookConfig);
    }

    continuationToken = (listRes as any).IsTruncated ? (listRes as any).NextContinuationToken : undefined;
  } while (continuationToken);
}

export type UploadJobSummary = {
  queued: number;
  scheduled: number;
  deadLetter: number;
  oldestQueuedAt?: string | null;
  nextReadyAt?: number | null;
};

async function listJobsWithPrefix(client: S3ClientInstance, prefix: string): Promise<UploadJobRecord[]> {
  let continuationToken: string | undefined;
  const records: UploadJobRecord[] = [];

  do {
    const listRes = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: 100, ContinuationToken: continuationToken }));
    const objects = listRes.Contents ?? [];

    for (const obj of objects) {
      const key = obj.Key;
      if (!key || key.endsWith('/')) continue;
      const record = await readJobRecord(client, key);
      if (record) {
        records.push(record);
      }
    }

    continuationToken = (listRes as any).IsTruncated ? (listRes as any).NextContinuationToken : undefined;
  } while (continuationToken);

  return records;
}

export async function getUploadJobSummary(): Promise<UploadJobSummary> {
  if (!hasR2Credentials()) {
    return { queued: 0, scheduled: 0, deadLetter: 0 };
  }

  const client = await getClient();
  const active = await listJobsWithPrefix(client, JOBS_PREFIX);
  const dead = await listJobsWithPrefix(client, DEAD_LETTER_PREFIX);

  let queued = 0;
  let scheduled = 0;
  let oldestQueuedAt: string | null = null;
  let nextReadyAt: number | null = null;

  for (const job of active) {
    if (job.status === 'scheduled') {
      scheduled += 1;
      if (typeof job.nextAttemptAt === 'number') {
        if (nextReadyAt === null || job.nextAttemptAt < nextReadyAt) {
          nextReadyAt = job.nextAttemptAt;
        }
      }
    } else {
      queued += 1;
      if (!oldestQueuedAt || (job.createdAt && job.createdAt < oldestQueuedAt)) {
        oldestQueuedAt = job.createdAt;
      }
    }
  }

  const deadLetter = dead.length;

  return {
    queued,
    scheduled,
    deadLetter,
    oldestQueuedAt,
    nextReadyAt,
  };
}
