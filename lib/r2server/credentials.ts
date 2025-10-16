import { S3Client } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import { accountId, bucket, rawAccessKey as initialRawAccessKey, rawSecretKey as initialRawSecretKey, rawApiToken as initialRawApiToken, HEX_64, TOKEN_ID_PATTERN, API_TOKEN_VALUE_PATTERN } from './config';

let rawAccessKey = initialRawAccessKey;
let rawSecretKey = initialRawSecretKey;
let rawApiToken = initialRawApiToken;

type S3ClientCtor = new (...args: ConstructorParameters<typeof S3Client>) => S3Client;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

let cachedSecretKey: string | null | undefined;
export let verifyAccessKeyPromise: Promise<string | null> | null = null;
export let clientPromise: Promise<S3Client> | null = null;

// Reset helper for tests to clear cached singletons
export function _resetSingletons(): void {
  verifyAccessKeyPromise = null;
  clientPromise = null;
  cachedSecretKey = undefined;
  // also clear any environment-inferred tokens for a clean slate
  // (tests that manipulate env should set them back explicitly)
}

const ensureApiToken = (token: string) => {
  if (!rawApiToken) {
    rawApiToken = token;
    process.env.R2_API_TOKEN = token;
  }
};

const deriveSecretKey = (value: string): string => {
  if (HEX_64.test(value)) {
    return value;
  }
  if (API_TOKEN_VALUE_PATTERN.test(value)) {
    ensureApiToken(value);
    return hashToken(value);
  }
  if (rawApiToken && value === rawApiToken) {
    return hashToken(rawApiToken);
  }
  return value;
};

export function normalizeSecretAccessKey(): string | undefined {
  if (cachedSecretKey !== undefined) {
    return cachedSecretKey ?? undefined;
  }
  const source = rawSecretKey ?? rawApiToken;
  if (!source) {
    cachedSecretKey = null;
    return undefined;
  }
  const normalized = deriveSecretKey(source);
  cachedSecretKey = normalized;
  process.env.R2_SECRET_ACCESS_KEY = normalized;
  rawSecretKey = normalized;
  return normalized;
}

async function verifyAccessKeyIdFromToken(): Promise<string | null> {
  if (!rawApiToken) return null;
  verifyAccessKeyPromise ??= (async () => {
    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers: { Authorization: `Bearer ${rawApiToken}` } });
      if (!response.ok) return null;
      const data = (await response.json()) as { result?: { id?: string | null } };
      return data.result?.id ?? null;
    } catch (e) {
      return null;
    }
  })();
  return verifyAccessKeyPromise;
}

export async function resolveCredentials(): Promise<{ accessKeyId: string; secretAccessKey: string }> {
  if (!accountId || !bucket) throw new Error('R2 account id or bucket is not configured.');
  const secret = normalizeSecretAccessKey();
  if (!secret) throw new Error('R2 secret access key is not available.');

  let access = rawAccessKey;
  const needsVerification = !access || access === rawApiToken || !TOKEN_ID_PATTERN.test(access);
  if (needsVerification) {
    const verified = await verifyAccessKeyIdFromToken();
    if (!verified) throw new Error('Unable to derive an R2 access key id.');
    access = verified; rawAccessKey = verified; process.env.R2_ACCESS_KEY_ID = verified;
  } else if (rawApiToken) {
    const verified = await verifyAccessKeyIdFromToken();
    if (verified && verified !== access) { access = verified; rawAccessKey = verified; process.env.R2_ACCESS_KEY_ID = verified; }
  }
  if (!access) throw new Error('Unable to resolve an R2 access key id.');
  return { accessKeyId: access, secretAccessKey: secret };
}

export function hasR2Credentials(): boolean {
  const secret = normalizeSecretAccessKey();
  const hasAccessKey = Boolean(rawAccessKey || rawApiToken);
  return Boolean(accountId && bucket && hasAccessKey && secret);
}

export async function getClient(): Promise<S3Client> {
  if (!hasR2Credentials()) throw new Error('R2 credentials are not fully configured.');
  clientPromise ??= resolveCredentials().then(({ accessKeyId, secretAccessKey }) => {
    const scope = globalThis as { S3ClientMock?: S3ClientCtor };
    const ClientCtor: S3ClientCtor = scope.S3ClientMock ?? S3Client;
    return new ClientCtor({ forcePathStyle: true, region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
  }).catch((e) => { clientPromise = null; throw e; });
  return clientPromise;
}

// Synchronous client factory used by tests that expect the S3 client to be
// constructed and used immediately during listGalleryImages without async
// resolution. This attempts to create a client using only environment values.
export function getClientSync(): S3Client | null {
  try {
    if (!hasR2Credentials()) return null;
    // Ensure normalized secret key is computed synchronously
    const secret = normalizeSecretAccessKey();
    if (!secret) return null;
    const access = rawAccessKey ?? process.env.R2_ACCESS_KEY_ID;
    if (!access) return null;
    const scope = globalThis as { S3ClientMock?: S3ClientCtor };
    const ClientCtor: S3ClientCtor = scope.S3ClientMock ?? S3Client;
    return new ClientCtor({ forcePathStyle: true, region: 'auto', endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: access, secretAccessKey: secret } });
  } catch (e) {
    return null;
  }
}

// Debug helper used in tests to inspect the client implementation
export async function _debug_getClientInstance(): Promise<S3Client> {
  const client = await getClient();
  console.debug('[r2server.debug] obtained S3 client instance', { hasSend: typeof client.send === 'function' });
  return client;
}
