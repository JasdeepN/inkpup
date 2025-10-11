import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { ListObjectsV2CommandOutput, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { toPublicR2Url } from './r2';
import fallbackDataRaw from '../data/gallery.json';
import type { GalleryItem, GalleryCategory } from './gallery-types';
import { GALLERY_CATEGORIES, getCategoryLabel, isGalleryCategory } from './gallery-types';
import { createHash } from 'crypto';

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
const rawApiToken = process.env.R2_API_TOKEN?.trim();

const HEX_64 = /^[0-9a-f]{64}$/i;
const TOKEN_ID_PATTERN = /^[0-9a-f]{32}$/i;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

let cachedSecretKey: string | null | undefined;
let verifyAccessKeyPromise: Promise<string | null> | null = null;
let clientPromise: Promise<S3Client> | null = null;

function normalizeSecretAccessKey(): string | undefined {
  if (cachedSecretKey !== undefined) {
    return cachedSecretKey ?? undefined;
  }

  if (rawSecretKey) {
    if (HEX_64.test(rawSecretKey)) {
      cachedSecretKey = rawSecretKey;
    } else if (rawApiToken && rawSecretKey === rawApiToken) {
      cachedSecretKey = hashToken(rawApiToken);
    } else {
      cachedSecretKey = rawSecretKey;
    }
  } else if (rawApiToken) {
    cachedSecretKey = HEX_64.test(rawApiToken) ? rawApiToken : hashToken(rawApiToken);
  } else {
    cachedSecretKey = null;
  }

  if (cachedSecretKey && (!rawSecretKey || rawSecretKey === rawApiToken)) {
    process.env.R2_SECRET_ACCESS_KEY = cachedSecretKey;
    rawSecretKey = cachedSecretKey;
  }

  return cachedSecretKey ?? undefined;
}

async function verifyAccessKeyIdFromToken(): Promise<string | null> {
  if (!rawApiToken) {
    return null;
  }

  if (!verifyAccessKeyPromise) {
    verifyAccessKeyPromise = (async () => {
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

        const data = (await response.json()) as {
          result?: { id?: string | null };
        };
        return data.result?.id ?? null;
      } catch (error) {
        console.warn('Unexpected error while verifying R2 API token for access key id.', error);
        return null;
      }
    })();
  }

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

export function hasR2Credentials(): boolean {
  const secret = normalizeSecretAccessKey();
  const hasAccessKey = Boolean(rawAccessKey || rawApiToken);
  return Boolean(accountId && bucket && hasAccessKey && secret);
}

async function getClient(): Promise<S3Client> {
  if (!hasR2Credentials()) {
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

  return { buffer: data, info };
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

export async function uploadGalleryImage({
  category,
  originalFilename,
  buffer,
  alt,
  caption,
}: UploadGalleryImageInput): Promise<UploadGalleryImageResult> {
  if (!hasR2Credentials()) {
    throw new Error('R2 credentials are required to upload images.');
  }

  const clientInstance = await getClient();
  const key = generateGalleryObjectKey(category, originalFilename);

  const optimized = await createOptimizedImage(buffer);

  const metadata: Record<string, string> = {};
  if (alt) metadata.alt = alt.slice(0, 256);
  if (caption) metadata.caption = caption.slice(0, 256);

  const putParams: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: optimized.buffer,
    ContentType: OPTIMIZED_CONTENT_TYPE,
    CacheControl: CACHE_CONTROL_IMMUTABLE,
    Metadata: Object.keys(metadata).length ? metadata : undefined,
  };

  await clientInstance.send(new PutObjectCommand(putParams));

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
  if (!hasR2Credentials()) {
    throw new Error('R2 credentials are required to delete images.');
  }

  if (!key.startsWith(`${category}/`)) {
    throw new Error('The provided key does not belong to the specified category.');
  }

  const clientInstance = await getClient();
  await clientInstance.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
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

  if (!hasR2Credentials()) {
    console.error('R2 credentials are incomplete; skipping remote gallery fetch.', credentialStatus);
    return fallbackResult('missing_credentials');
  }

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
  const prefix = `${category}`.replace(/\/+$/, '');

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
