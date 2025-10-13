// TODO: Add tests for error handling in fallbackResult
// TODO: Add tests for S3 credential fallback logic
// TODO: Add tests for edge cases in listGalleryImages, uploadGalleryImage, deleteGalleryImage
// TODO: Add tests for fallback to bundled data and error branches

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
import { isGalleryCategory } from './gallery-types';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import fallbackDataRaw from '../data/gallery.json';
import type { GalleryItem, GalleryCategory } from './gallery-types';
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

export async function probeR2Binding(): Promise<R2BindingProbe> {
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

export async function getR2Binding(): Promise<R2Bucket> {
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
  if (caption) metadata.caption = caption;
  return metadata;
}

async function* listGalleryImages(prefix: string, continuationToken?: string) {
  const probe = await probeR2Binding();
  const binding = probe.binding;

  if (!binding) {
    console.warn('R2 binding not available, falling back to bundled data.');
    yield* fallbackData.filter((item) => item.category === prefix);
    return;
  }

  const client = await getClient();
  const bucketWithPrefix = `${bucket}/${prefix.replace(/(^\/+|\/+$)/g, '')}`;
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketWithPrefix,
    ContinuationToken: continuationToken,
    MaxKeys: 1000,
  });

  let hasMore = false;
  // Replace ListObjectsV2CommandOutput with any for now
  let result: any;

  try {
    result = await client.send(listCommand);
  } catch (error) {
    console.error('Error listing objects from R2:', error);
    return;
  }

  if (result.Contents) {
    for (const obj of result.Contents) {
      if (obj.Key) {
        const key = obj.Key;
        const fallbackItem = fallbackData.find((item) => item.src === key);
        if (fallbackItem) {
          console.log('Serving from fallback data:', key);
          // Only yield fallbackItem if it is defined
          yield {
            id: fallbackItem.src,
            src: fallbackItem.src,
            key: fallbackItem.src,
            alt: fallbackItem.alt || '',
            caption: fallbackItem.caption || '',
            category: fallbackItem.category,
          };
        } else {
          // Fix: Check for Metadata property existence and type
          const metadata = obj.Metadata || {};
          const item: GalleryItem = {
            id: obj.Key,
            src: obj.Key,
            key: obj.Key,
            alt: metadata.alt || '',
            caption: metadata.caption || '',
            category: metadata.category as GalleryCategory,
          };
          yield item;
        }
      }
    }
  }

  hasMore = result.IsTruncated || false;

  if (hasMore && result.NextContinuationToken) {
    yield* listGalleryImages(prefix, result.NextContinuationToken);
  }
}

async function deleteGalleryImage(key: string) {
  const probe = await probeR2Binding();
  const binding = probe.binding;

  if (!binding) {
    console.warn('R2 binding not available, cannot delete image.');
    return;
  }

  const client = await getClient();
  const deleteCommand = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    await client.send(deleteCommand);
    console.log('Successfully deleted image:', key);
  } catch (error) {
    console.error('Error deleting image from R2:', error);
  }
}

async function uploadGalleryImage(input: UploadGalleryImageInput): Promise<UploadGalleryImageResult> {
  const { category, originalFilename, buffer, alt, caption } = input;
  const probe = await probeR2Binding();
  const binding = probe.binding;

  if (!binding) {
    console.warn('R2 binding not available, falling back to bundled data.');
    const fallbackItem = {
      src: originalFilename,
      category,
      alt,
      caption,
    };
    // Fix: Ensure fallbackItem includes required id property
    fallbackData.push({ ...fallbackItem, id: fallbackItem.src });
    return {
      key: originalFilename,
      item: { ...fallbackItem, id: fallbackItem.src, alt: fallbackItem.alt || '', caption: fallbackItem.caption || '' },
    };
  }

  const client = await getClient();
  const optimized = await optimizeOrFallback(buffer, originalFilename);
  const objectKey = generateGalleryObjectKey(category, originalFilename);
  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: optimized.buffer,
    ContentType: optimized.contentType,
    Metadata: {
      alt: alt || '',
      caption: caption || '',
      category: category || '',
      // Fix: Check for width/height existence in optimized.info
      width: (optimized.info as any).width?.toString() || '',
      height: (optimized.info as any).height?.toString() || '',
    },
  });

  try {
    await client.send(putCommand);
    console.log('Successfully uploaded image:', objectKey);
  } catch (error) {
    console.error('Error uploading image to R2:', error);
  }

  return {
    key: objectKey,
    item: {
      id: originalFilename,
      src: originalFilename,
      key: originalFilename,
      alt: alt || '',
      caption: caption || '',
      category: category,
    },
  };
}

function getFallbackGalleryItems(category: string) {
  return fallbackData.filter((item) => item.category === category);
}

function fallbackResult(reason: string, category: string = 'flash') {
  return {
    isFallback: true,
    fallbackReason: reason,
    usedBundledFallback: true,
    items: getFallbackGalleryItems(category),
  };
}

export { listGalleryImages, getFallbackGalleryItems, fallbackResult };
