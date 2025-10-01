import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import type { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { resolveR2Url } from './r2';
import fallbackDataRaw from '../data/gallery.json';
import type { GalleryItem, GalleryCategory } from './gallery-types';
import { GALLERY_CATEGORIES, getCategoryLabel, isGalleryCategory } from './gallery-types';

const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const accessKey = process.env.R2_ACCESS_KEY_ID;
const secretKey = process.env.R2_SECRET_ACCESS_KEY;

let client: S3Client | null = null;

export function hasR2Credentials(): boolean {
  return Boolean(accountId && bucket && accessKey && secretKey);
}

function getClient(): S3Client {
  if (!hasR2Credentials()) {
    throw new Error('R2 credentials are not fully configured. Please set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.');
  }

  client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey!,
      secretAccessKey: secretKey!,
    },
  });

  return client;
}

function formatLabelFromKey(key: string, prefix: string): string {
  const withoutPrefix = prefix ? key.replace(new RegExp(`^${prefix}/`), '') : key;
  const raw = withoutPrefix.split('/').pop() || withoutPrefix;
  const withoutExt = raw.replace(/\.[^.]+$/, '');
  const words = withoutExt.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const fallbackData = fallbackDataRaw as Array<Partial<GalleryItem> & { src: string; category?: string }>;

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

export async function listGalleryImages(category: GalleryCategory): Promise<GalleryItem[]> {
  if (!GALLERY_CATEGORIES.includes(category)) {
    throw new Error(`Unsupported gallery category '${category}'.`);
  }

  if (!hasR2Credentials()) {
    return buildFallbackItems(category);
  }

  const clientInstance = getClient();
  const prefix = `${category}`.replace(/\/+$/, '');

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
      const url = resolveR2Url(`/${obj.Key}`);
      images.push({
        id: obj.ETag || obj.Key,
        src: url,
        alt: formatLabelFromKey(obj.Key, prefix),
        caption: formatLabelFromKey(obj.Key, prefix),
        category,
        size: obj.Size,
        lastModified: obj.LastModified ? obj.LastModified.toISOString() : undefined,
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
