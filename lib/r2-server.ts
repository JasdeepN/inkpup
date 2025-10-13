// Simple mime/extension detection for fallback paths
export function sniffContentType(buf: Buffer, fallbackName?: string): { contentType: string; ext: string } {
  // Signatures
  const sig = buf.subarray(0, 12);
  const isJPEG = sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff;
  const isPNG = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47;
  const isGIF = sig[0] === 0x47 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x38;
  const isWEBP =
    sig[0] === 0x52 &&
    sig[1] === 0x49 &&
    sig[2] === 0x46 &&
    sig[3] === 0x46 &&
    sig[8] === 0x57 &&
    sig[9] === 0x45 &&
    sig[10] === 0x42 &&
    sig[11] === 0x50;

  if (isWEBP) return { contentType: 'image/webp', ext: 'webp' };
  if (isPNG) return { contentType: 'image/png', ext: 'png' };
  if (isGIF) return { contentType: 'image/gif', ext: 'gif' };
  if (isJPEG) return { contentType: 'image/jpeg', ext: 'jpg' };

  // Fallback: infer from filename extension
  const name = (fallbackName || '').toLowerCase();
  if (name.endsWith('.webp')) return { contentType: 'image/webp', ext: 'webp' };
  if (name.endsWith('.png')) return { contentType: 'image/png', ext: 'png' };
  if (name.endsWith('.gif')) return { contentType: 'image/gif', ext: 'gif' };
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return { contentType: 'image/jpeg', ext: 'jpg' };

  return { contentType: 'application/octet-stream', ext: 'bin' };
}
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { ListObjectsV2CommandOutput, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { toPublicR2Url } from './r2';
import fallbackDataRaw from '../data/gallery.json';
import type { GalleryItem, GalleryCategory } from './gallery-types';
import { GALLERY_CATEGORIES, getCategoryLabel, isGalleryCategory } from './gallery-types';
import { createHash } from 'crypto';

type R2BindingLookup = {
  R2_BUCKET?: R2Bucket | null;
};

type CloudflareContextLookup = {
  env?: R2BindingLookup;
};

const CLOUDFLARE_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__');

type R2BindingProbeSource = 'cloudflare-context' | 'global-property' | 'none';

type R2BindingProbe = {
  binding: R2Bucket | undefined;
  source: R2BindingProbeSource;
  contextSymbolPresent: boolean;
  contextEnvHasBucket: boolean;
  contextBindingNull: boolean;
  directPropertyPresent: boolean;
  directBindingNull: boolean;
  contextAccessAttempted: boolean;
  contextAccessError?: string;
};

type ContextAccessProbe = {
  binding: R2Bucket | undefined;
  envHasBucket: boolean;
  bindingNull: boolean;
  attempted: boolean;
  error?: string;
};

type SymbolAccessProbe = {
  binding: R2Bucket | undefined;
  envHasBucket: boolean;
  bindingNull: boolean;
  symbolPresent: boolean;
};

type GlobalPropertyProbe = {
  binding: R2Bucket | undefined;
  propertyPresent: boolean;
  bindingNull: boolean;
};

async function probeBindingViaContext(): Promise<ContextAccessProbe> {
  let binding: R2Bucket | undefined;
  let envHasBucket = false;
  let bindingNull = false;
  let attempted = false;
  let errorMessage: string | undefined;

  try {
    const { env } = await getCloudflareContext({ async: true });
    attempted = true;
    const lookup = env as CloudflareContextLookup['env'];
    if (lookup && 'R2_BUCKET' in lookup) {
      envHasBucket = true;
      const candidate = lookup.R2_BUCKET;
      bindingNull = candidate === null;
      if (typeof candidate !== 'undefined' && candidate !== null) {
        binding = candidate;
      }
    }
  } catch (error) {
    attempted = true;
    errorMessage = error instanceof Error ? error.message : 'Unknown context error';
  }

  return {
    binding,
    envHasBucket,
    bindingNull,
    attempted,
    error: errorMessage,
  };
}

function probeBindingViaSymbol(
  globalWithContext: typeof globalThis &
    R2BindingLookup &
    Partial<Record<typeof CLOUDFLARE_CONTEXT_SYMBOL, CloudflareContextLookup>>
): SymbolAccessProbe {
  const symbolPresent = CLOUDFLARE_CONTEXT_SYMBOL in globalWithContext;
  let binding: R2Bucket | undefined;
  let envHasBucket = false;
  let bindingNull = false;

  if (symbolPresent) {
    const contextEnv = globalWithContext[CLOUDFLARE_CONTEXT_SYMBOL]?.env;
    if (contextEnv && 'R2_BUCKET' in contextEnv) {
      envHasBucket = true;
      const candidate = contextEnv.R2_BUCKET;
      bindingNull = candidate === null;
      if (typeof candidate !== 'undefined' && candidate !== null) {
        binding = candidate;
      }
    }
  }

  return {
    binding,
    envHasBucket,
    bindingNull,
    symbolPresent,
  };
}

function probeBindingViaGlobalProperty(
  globalWithContext: typeof globalThis & R2BindingLookup
): GlobalPropertyProbe {
  const propertyPresent = 'R2_BUCKET' in globalWithContext;
  const candidate = propertyPresent ? globalWithContext.R2_BUCKET : undefined;
  const bindingNull = candidate === null;
  const binding = typeof candidate !== 'undefined' && candidate !== null ? candidate : undefined;

  return {
    binding,
    propertyPresent,
    bindingNull,
  };
}

async function probeR2Binding(): Promise<R2BindingProbe> {
  try {
    const globalWithContext = globalThis as typeof globalThis &
      R2BindingLookup &
      Partial<Record<typeof CLOUDFLARE_CONTEXT_SYMBOL, CloudflareContextLookup>>;

    const contextProbe = await probeBindingViaContext();
    const symbolProbe = probeBindingViaSymbol(globalWithContext);
    const directProbe = probeBindingViaGlobalProperty(globalWithContext);

    const contextDerivedBinding = contextProbe.binding ?? symbolProbe.binding;
    const binding = typeof contextDerivedBinding !== 'undefined' ? contextDerivedBinding : directProbe.binding;

    let source: R2BindingProbeSource = 'none';
    if (binding) {
      source = typeof contextDerivedBinding !== 'undefined' ? 'cloudflare-context' : 'global-property';
    }

    return {
      binding,
      source,
      contextSymbolPresent: symbolProbe.symbolPresent,
      contextEnvHasBucket: contextProbe.envHasBucket || symbolProbe.envHasBucket,
      contextBindingNull: contextProbe.bindingNull || symbolProbe.bindingNull,
      directPropertyPresent: directProbe.propertyPresent,
      directBindingNull: directProbe.bindingNull,
      contextAccessAttempted: contextProbe.attempted,
      contextAccessError: contextProbe.error,
    };
  } catch {
    return {
      binding: undefined,
      source: 'none',
      contextSymbolPresent: false,
      contextEnvHasBucket: false,
      contextBindingNull: false,
      directPropertyPresent: false,
      directBindingNull: false,
      contextAccessAttempted: false,
    };
  }
}

async function readR2Binding(): Promise<R2Bucket | undefined> {
  const probe = await probeR2Binding();
  return probe.binding;
}

function bindingHasMethod(binding: unknown, method: string): boolean {
  return Boolean(binding && typeof (binding as any)[method] === 'function');
}

async function getR2BindingFor(method: 'put' | 'list' | 'delete'): Promise<R2Bucket | undefined> {
  const probe = await probeR2Binding();
  const binding = probe.binding;
  if (bindingHasMethod(binding, method)) {
    return binding as unknown as R2Bucket;
  }
  if (binding) {
    console.info(
      `R2 binding present but missing required method '${method}'. Falling back to S3-compatible client if configured.`,
      {
        source: probe.source,
        contextSymbolPresent: probe.contextSymbolPresent,
        contextEnvHasBucket: probe.contextEnvHasBucket,
        directPropertyPresent: probe.directPropertyPresent,
      }
    );
  }
  return undefined;
}

const DEFAULT_MAX_IMAGE_WIDTH = 1800;
const MAX_IMAGE_WIDTH = (() => {
  const raw = process.env.R2_MAX_IMAGE_WIDTH;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.round(parsed);
  }
  return DEFAULT_MAX_IMAGE_WIDTH;
})();

const CACHE_CONTROL_IMMUTABLE = 'public, max-age=31536000, immutable';
const OPTIMIZED_CONTENT_TYPE = 'image/webp';

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const bucket = process.env.R2_BUCKET?.trim();
let rawAccessKey = process.env.R2_ACCESS_KEY_ID?.trim();
let rawSecretKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
let rawApiToken = process.env.R2_API_TOKEN?.trim();

const FORCE_S3 = (() => {
  const val = process.env.R2_FORCE_S3?.trim().toLowerCase();
  return val === '1' || val === 'true';
})();

const VERIFY_AFTER_PUT = (() => {
  const val = process.env.R2_VERIFY_AFTER_PUT?.trim().toLowerCase();
  return val === '1' || val === 'true';
})();

const HEX_64 = /^[0-9a-f]{64}$/i;
const TOKEN_ID_PATTERN = /^[0-9a-f]{32}$/i;
const API_TOKEN_VALUE_PATTERN = /^v\d+\.\d+-/i;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

let cachedSecretKey: string | null | undefined;
let verifyAccessKeyPromise: Promise<string | null> | null = null;
let clientPromise: Promise<S3Client> | null = null;

// Check if R2 binding is available
async function hasR2Binding(): Promise<boolean> {
  const probe = await probeR2Binding();
  return typeof probe.binding !== 'undefined';
}

async function getR2Binding(): Promise<R2Bucket> {
  const probe = await probeR2Binding();
  const binding = probe.binding;
  if (!binding) {
    throw new Error('R2_BUCKET binding is not available');
  }
  return binding;
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

function normalizeSecretAccessKey(): string | undefined {
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
  if (!rawApiToken) {
    return null;
  }

  verifyAccessKeyPromise ??= (async () => {
    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: {
          Authorization: `Bearer ${rawApiToken}`,
        },
      });

      if (!response.ok) {
        const bodyText = await response.text();
        console.warn(
          `Failed to verify R2 API token when deriving access key id (HTTP ${response.status}). Response snippet: ${bodyText.slice(0, 300)}`
        );
        return null;
      }

      const data: { result?: { id?: string | null } } = await response.json();
      return data.result?.id ?? null;
    } catch (error) {
      console.warn('Unexpected error while verifying R2 API token for access key id.', error);
      return null;
    }
  })();

  return verifyAccessKeyPromise;
}

async function resolveCredentials(): Promise<{ accessKeyId: string; secretAccessKey: string }> {
  if (!accountId || !bucket) {
    throw new Error('R2 account id or bucket is not configured. Please set R2_ACCOUNT_ID and R2_BUCKET.');
  }

  const secret = normalizeSecretAccessKey();

  if (!secret) {
    throw new Error(
      'R2 secret access key is not available. Provide R2_SECRET_ACCESS_KEY or R2_API_TOKEN so the Worker can sign requests.'
    );
  }

  let access = rawAccessKey;
  const needsVerification = !access || access === rawApiToken || !TOKEN_ID_PATTERN.test(access);

  if (needsVerification) {
    const verified = await verifyAccessKeyIdFromToken();
    if (!verified) {
      throw new Error(
        'Unable to derive an R2 access key id. Grant your API token the "User Details: Read" permission or set R2_ACCESS_KEY_ID to the token id.'
      );
    }
    if (access && access !== verified) {
      console.warn(
        `Provided R2 access key id '${access}' does not match the Cloudflare token id '${verified}'. Using the verified value.`
      );
    }
    access = verified;
    rawAccessKey = verified;
    process.env.R2_ACCESS_KEY_ID = verified;
  } else if (rawApiToken) {
    const verified = await verifyAccessKeyIdFromToken();
    if (verified && verified !== access) {
      console.warn(
        `Provided R2 access key id '${access}' differs from the token id '${verified}'. Updating to the verified value to avoid signature mismatches.`
      );
      access = verified;
      rawAccessKey = verified;
      process.env.R2_ACCESS_KEY_ID = verified;
    }
  }

  if (!access) {
    throw new Error('Unable to resolve an R2 access key id. Verify your token permissions or set R2_ACCESS_KEY_ID explicitly.');
  }

  return {
    accessKeyId: access,
    secretAccessKey: secret,
  };
}

export async function hasR2Credentials(): Promise<boolean> {
  // Prefer a real Cloudflare binding that supports required methods unless forced to S3
  if (!FORCE_S3) {
    const canPut = Boolean(await getR2BindingFor('put'));
    const canDelete = Boolean(await getR2BindingFor('delete'));
    if (canPut && canDelete) {
      return true;
    }
  }
  // Otherwise check for S3-compatible credentials
  const secret = normalizeSecretAccessKey();
  const hasAccessKey = Boolean(rawAccessKey || rawApiToken);
  return Boolean(accountId && bucket && hasAccessKey && secret);
}

async function getClient(): Promise<S3Client> {
  if (!(await hasR2Credentials())) {
    throw new Error(
      'R2 credentials are not fully configured. Please set R2_ACCOUNT_ID, R2_BUCKET, and either (R2_ACCESS_KEY_ID with R2_SECRET_ACCESS_KEY) or an R2_API_TOKEN.'
    );
  }

  clientPromise ??= resolveCredentials()
    .then(({ accessKeyId, secretAccessKey }) =>
      new S3Client({
        forcePathStyle: true,
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    )
    .catch((error) => {
      clientPromise = null;
      throw error;
    });

  return clientPromise;
}

function formatLabelFromKey(key: string, prefix: string): string {
  const withoutPrefix = prefix ? key.replace(new RegExp(`^${prefix}/`), '') : key;
  const raw = withoutPrefix.split('/').pop() || withoutPrefix;
  const withoutExt = raw.replace(/\.[^.]+$/, '');
  const words = withoutExt.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const fallbackData = fallbackDataRaw as Array<Partial<GalleryItem> & { src: string; category?: string }>;

type CredentialStatus = {
  accountId: boolean;
  bucket: boolean;
  accessKey: boolean;
  secretAccessKey: boolean;
};

function getCredentialStatus(): CredentialStatus {
  return {
    accountId: Boolean(accountId),
    bucket: Boolean(bucket),
    accessKey: Boolean(rawAccessKey || rawApiToken),
    secretAccessKey: Boolean(normalizeSecretAccessKey()),
  };
}

function isBundledFallbackAllowed(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }
  const flag = process.env.ALLOW_BUNDLED_GALLERY_FALLBACK?.trim().toLowerCase();
  return flag === 'true' || flag === '1';
}

function sanitizeFilename(originalName: string): string {
  if (!originalName) return 'image';
  const base = originalName.replace(/\.[^.]+$/u, '').toLowerCase();
  const normalized = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(?:^-+)|(?:-+$)/g, '');
  return normalized || 'image';
}

export function generateGalleryObjectKey(
  category: GalleryCategory,
  originalFilename: string
): string {
  if (!isGalleryCategory(category)) {
    throw new Error(`Unsupported gallery category '${category}'.`);
  }
  const slug = sanitizeFilename(originalFilename);
  return `${category}/${slug}.webp`;
}

type SharpFactory = typeof import('sharp');

let sharpFactoryPromise: Promise<SharpFactory | null> | null = null;

async function loadSharpFactory(): Promise<SharpFactory | null> {
  sharpFactoryPromise ??=
    import('sharp')
      .then((mod) => {
        const factory = (mod as unknown as { default?: SharpFactory }).default ?? (mod as unknown as SharpFactory);
        if (typeof factory !== 'function') {
          console.warn('The `sharp` module did not export a callable factory. Skipping image optimization.');
          return null;
        }
        return factory;
      })
      .catch((error) => {
        console.warn('Optional dependency `sharp` failed to load. Falling back to uploading original image buffers.', error);
        return null;
      });

  return sharpFactoryPromise;
}

async function createOptimizedImage(buffer: Buffer) {
  const sharpFactory = await loadSharpFactory();

  if (!sharpFactory) {
    return {
      buffer,
      info: {
        size: buffer.length,
      },
      contentType: undefined as string | undefined,
      ext: undefined as string | undefined,
    };
  }

  const pipeline = sharpFactory(buffer);
  const metadata = await pipeline.metadata();
  const width = metadata.width ?? MAX_IMAGE_WIDTH;
  const targetWidth = Math.min(width, MAX_IMAGE_WIDTH);

  const { data, info } = await sharpFactory(buffer)
    .rotate()
    .resize({ width: targetWidth, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, info, contentType: OPTIMIZED_CONTENT_TYPE, ext: 'webp' };
}

type UploadGalleryImageInput = {
  category: GalleryCategory;
  originalFilename: string;
  buffer: Buffer;
  alt?: string;
  caption?: string;
};

export type UploadGalleryImageResult = {
  key: string;
  item: GalleryItem;
};

async function optimizeOrFallback(buffer: Buffer, originalFilename: string) {
  try {
    return await createOptimizedImage(buffer);
  } catch (err) {
    console.warn('Image optimization failed, uploading original bytes instead.', err);
    const guessed = sniffContentType(buffer, originalFilename);
    return {
      buffer,
      info: { size: buffer.length },
      contentType: guessed.contentType,
      ext: guessed.ext,
    };
  }
}

function buildMetadata(alt?: string, caption?: string) {
  const metadata: Record<string, string> = {};
  if (alt) metadata.alt = alt.slice(0, 256);
  if (caption) metadata.caption = caption.slice(0, 256);
  return metadata;
}

async function uploadToR2Binding(bindingForPut: R2Bucket, key: string, optimized: any, metadata: Record<string, string>) {
  const bodyForBinding: ArrayBuffer | ArrayBufferView | ReadableStream | string =
    optimized.buffer instanceof Buffer ? new Uint8Array(optimized.buffer) : (optimized.buffer as unknown as ArrayBuffer | ArrayBufferView);
  const putResult = await bindingForPut.put(key, bodyForBinding, {
    httpMetadata: {
      contentType: optimized.contentType || OPTIMIZED_CONTENT_TYPE,
      cacheControl: CACHE_CONTROL_IMMUTABLE,
    },
    customMetadata: metadata,
  });
  if (putResult === null) {
    throw new Error(`R2 put() returned null for key '${key}' (precondition failed or storage issue).`);
  }
  if (VERIFY_AFTER_PUT && bindingHasMethod(bindingForPut, 'head')) {
    const headObj = await (bindingForPut as any).head(key);
    if (!headObj) {
      throw new Error(`R2 head() could not find key after put: '${key}'.`);
    }
  }
}

async function uploadToS3(key: string, optimized: any, metadata: Record<string, string>) {
  const clientInstance = await getClient();
  const putParams: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: optimized.buffer,
    ContentType: optimized.contentType || OPTIMIZED_CONTENT_TYPE,
    CacheControl: CACHE_CONTROL_IMMUTABLE,
    Metadata: Object.keys(metadata).length ? metadata : undefined,
  };
  await clientInstance.send(new PutObjectCommand(putParams));
}

export async function uploadGalleryImage({
  category,
  originalFilename,
  buffer,
  alt,
  caption,
}: UploadGalleryImageInput): Promise<UploadGalleryImageResult> {
  if (!(await hasR2Credentials())) {
    throw new Error('R2 credentials are required to upload images.');
  }

  const optimized = await optimizeOrFallback(buffer, originalFilename);
  const slug = sanitizeFilename(originalFilename);
  const ext = optimized.ext || sniffContentType(buffer, originalFilename).ext;
  const key = `${category}/${slug}.${ext}`;
  const metadata = buildMetadata(alt, caption);

  const bindingForPut = FORCE_S3 ? undefined : await getR2BindingFor('put');
  if (bindingForPut) {
    await uploadToR2Binding(bindingForPut, key, optimized, metadata);
  } else {
    await uploadToS3(key, optimized, metadata);
  }

  const item: GalleryItem = {
    id: key,
    src: toPublicR2Url(`/${key}`),
    alt: alt || formatLabelFromKey(key, category),
    caption,
    category,
    size: optimized.info.size,
    lastModified: new Date().toISOString(),
    key,
  };

  return { key, item };
}

export async function deleteGalleryImage(key: string, category: GalleryCategory): Promise<void> {
  if (!(await hasR2Credentials())) {
    throw new Error('R2 credentials are required to delete images.');
  }

  if (!key.startsWith(`${category}/`)) {
    throw new Error('The provided key does not belong to the specified category.');
  }

  // Use R2 binding if available
  const bindingForDelete = FORCE_S3 ? undefined : await getR2BindingFor('delete');
  if (bindingForDelete) {
    await bindingForDelete.delete(key);
    console.info(`Deleted R2 object via binding: ${key}`);
  } else {
    // Fall back to S3-compatible API
    const clientInstance = await getClient();
    await clientInstance.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    console.info(`Deleted R2 object via S3 API: ${key}`);
  }
}

function buildFallbackItems(category: GalleryCategory): GalleryItem[] {
  return fallbackData
    .filter((item) => {
      if (!item.category) return false;
      return isGalleryCategory(item.category) && item.category === category;
    })
    .map((item, idx) => ({
      id: item.id ?? `${category}-fallback-${idx}`,
      src: item.src,
      alt: item.alt ?? getCategoryLabel(category),
      caption: item.caption,
      category,
      size: item.size,
      lastModified: item.lastModified,
    }));
}

export function getFallbackGalleryItems(category: GalleryCategory): GalleryItem[] {
  if (!GALLERY_CATEGORIES.includes(category)) {
    throw new Error(`Unsupported gallery category '${category}'.`);
  }

  return buildFallbackItems(category);
}

// Fetch images using R2 binding (native Cloudflare Workers API)
async function fetchGalleryImagesFromR2Binding(
  bucket: R2Bucket,
  prefix: string,
  category: GalleryCategory
): Promise<GalleryItem[]> {
  const images: GalleryItem[] = [];
  let cursor: string | undefined;

  do {
    const listed = await bucket.list({
      prefix: `${prefix}/`,
      cursor,
      limit: 1000,
    });

    for (const obj of listed.objects) {
      if (!obj.key || obj.key.endsWith('/')) continue;
      const url = toPublicR2Url(`/${obj.key}`);
      const customMetadata = obj.customMetadata || {};
      
      images.push({
        id: obj.etag || obj.key,
        src: url,
        alt: customMetadata.alt || formatLabelFromKey(obj.key, prefix),
        caption: customMetadata.caption || formatLabelFromKey(obj.key, prefix),
        category,
        size: obj.size,
        lastModified: obj.uploaded ? obj.uploaded.toISOString() : undefined,
        key: obj.key,
      });
    }

    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  images.sort((a, b) => {
    const aTime = a.lastModified ? Date.parse(a.lastModified) : 0;
    const bTime = b.lastModified ? Date.parse(b.lastModified) : 0;
    return bTime - aTime;
  });

  return images;
}

// Fetch images using S3-compatible API
async function fetchGalleryImagesFromR2(
  clientInstance: S3Client,
  prefix: string,
  category: GalleryCategory
): Promise<GalleryItem[]> {
  let continuationToken: string | undefined = undefined;
  const images: GalleryItem[] = [];

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${prefix}/`,
      ContinuationToken: continuationToken,
    });

    const response: ListObjectsV2CommandOutput = await clientInstance.send(command);
    for (const obj of response.Contents || []) {
      if (!obj.Key || obj.Key.endsWith('/')) continue;
      const url = toPublicR2Url(`/${obj.Key}`);
      images.push({
        id: obj.ETag || obj.Key,
        src: url,
        alt: formatLabelFromKey(obj.Key, prefix),
        caption: formatLabelFromKey(obj.Key, prefix),
        category,
        size: obj.Size,
        lastModified: obj.LastModified ? obj.LastModified.toISOString() : undefined,
        key: obj.Key,
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  images.sort((a, b) => {
    const aTime = a.lastModified ? Date.parse(a.lastModified) : 0;
    const bTime = b.lastModified ? Date.parse(b.lastModified) : 0;
    return bTime - aTime;
  });

  return images;
}

type ListGalleryImagesOptions = {
  fallback?: boolean;
};

export type GalleryFallbackReason =
  | 'missing_credentials'
  | 'client_initialization_failed'
  | 'r2_fetch_failed';

export type GalleryFetchResult = {
  items: GalleryItem[];
  isFallback: boolean;
  fallbackReason?: GalleryFallbackReason;
  usedBundledFallback: boolean;
  credentialStatus?: CredentialStatus;
};

export async function listGalleryImages(
  category: GalleryCategory,
  options?: ListGalleryImagesOptions
): Promise<GalleryFetchResult> {
  if (!GALLERY_CATEGORIES.includes(category)) {
    throw new Error(`Unsupported gallery category '${category}'.`);
  }

  const fallbackEnabled = options?.fallback !== false;
  const bundledFallbackAllowed = fallbackEnabled && isBundledFallbackAllowed();
  const credentialStatus = getCredentialStatus();
  const fallbackResult = (reason: GalleryFallbackReason): GalleryFetchResult => {
    const items = bundledFallbackAllowed ? buildFallbackItems(category) : [];
    return {
      items,
      isFallback: true,
      fallbackReason: reason,
      usedBundledFallback: items.length > 0,
      credentialStatus,
    };
  };

  const prefix = `${category}`.replace(/\/+$/, '');

  // Use R2 binding if available (faster, no auth needed)
  const bindingProbe = await probeR2Binding();
  const bindingForList = FORCE_S3 ? undefined : await getR2BindingFor('list');
  // Debug: log which binding is used and if it's a mock
  console.info('[DEBUG] R2 binding probe result:', {
    source: bindingProbe.source,
    contextSymbolPresent: bindingProbe.contextSymbolPresent,
    contextEnvHasBucket: bindingProbe.contextEnvHasBucket,
    contextBindingNull: bindingProbe.contextBindingNull,
    globalPropertyPresent: bindingProbe.directPropertyPresent,
    globalBindingNull: bindingProbe.directBindingNull,
    contextAccessAttempted: bindingProbe.contextAccessAttempted,
    contextAccessError: bindingProbe.contextAccessError,
    bindingForListType: typeof bindingForList,
    bindingForListIsMock: (bindingForList?.list as any)?._isMockFunction ?? false,
    bindingForListKeys: bindingForList ? Object.keys(bindingForList) : undefined,
  });

  if (bindingForList) {
    // Debug: log when using R2 binding
    console.info('[DEBUG] Using R2 binding for listGalleryImages. Is mock:', (bindingForList.list as any)?._isMockFunction ?? false);
    try {
      const images = await fetchGalleryImagesFromR2Binding(bindingForList, prefix, category);
      console.info('Fetched gallery listing from R2 binding.', { prefix, count: images.length });
      return {
        items: images,
        isFallback: false,
        usedBundledFallback: false,
        credentialStatus,
      };
    } catch (error) {
      console.error(
        `Failed to list gallery images from R2 binding for category "${category}". Falling back to bundled data.`,
        error
      );
      return fallbackResult('r2_fetch_failed');
    }
  }

  // Check if S3-compatible credentials are available
  if (!(await hasR2Credentials())) {
    console.error('R2 credentials are incomplete; skipping remote gallery fetch.', credentialStatus);
    return fallbackResult('missing_credentials');
  }

  // Fall back to S3-compatible API
  let clientInstance: S3Client;
  try {
    clientInstance = await getClient();
  } catch (error) {
    console.error(
      `Failed to initialize R2 client for category "${category}". Falling back to bundled data.`,
      error
    );
    return fallbackResult('client_initialization_failed');
  }

  try {
    const images = await fetchGalleryImagesFromR2(clientInstance, prefix, category);
    console.info('Fetched gallery listing from Cloudflare R2.', { bucket, prefix, count: images.length });
    return {
      items: images,
      isFallback: false,
      usedBundledFallback: false,
      credentialStatus,
    };
  } catch (error) {
    console.error(
      `Failed to list gallery images from R2 for category "${category}". Falling back to bundled data.`,
      error
    );
    return fallbackResult('r2_fetch_failed');
  }
}
