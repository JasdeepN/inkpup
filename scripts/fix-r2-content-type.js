// Fix incorrect/missing Content-Type metadata for objects in a Cloudflare R2 bucket by key extension.
// Usage:
//   R2_ACCOUNT_ID=<account> R2_BUCKET=<bucket> (R2_ACCESS_KEY_ID=<key> R2_SECRET_ACCESS_KEY=<secret> | R2_API_TOKEN=<token>) \
//   node scripts/fix-r2-content-type.js --prefix available/ --dry
//
// Flags:
//   --prefix   Only process keys with this prefix (optional)
//   --dry      Dry run (do not modify)
//   --force    Rewrite even if Content-Type looks correct

import { S3Client, ListObjectsV2Command, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

const account = process.env.R2_ACCOUNT_ID?.trim();
const bucket = process.env.R2_BUCKET?.trim();
let accessKey = process.env.R2_ACCESS_KEY_ID?.trim();
let secretKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
const apiToken = process.env.R2_API_TOKEN?.trim();

const endpoint = account ? `https://${account}.r2.cloudflarestorage.com` : null;

const EXT_TO_MIME = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  ico: 'image/x-icon',
};

function guessMimeFromKey(key) {
  const m = key.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!m) return 'application/octet-stream';
  const ext = m[1];
  return EXT_TO_MIME[ext] || 'application/octet-stream';
}

async function deriveAccessKeyIdFromToken(token) {
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.result?.id ?? null;
  } catch {
    return null;
  }
}

async function getClient() {
  if (!account || !bucket) {
    console.error('Missing R2_ACCOUNT_ID or R2_BUCKET.');
    process.exit(1);
  }
  if (!accessKey && apiToken) {
    accessKey = await deriveAccessKeyIdFromToken(apiToken);
    if (accessKey && !secretKey) {
      // When using only token, our app hashes it for secret; for scripts assume user provided secret hash in R2_SECRET_ACCESS_KEY
      console.warn('Note: Provide R2_SECRET_ACCESS_KEY (SHA-256 of API token) when using R2_API_TOKEN.');
    }
  }
  if (!accessKey || !secretKey) {
    console.error('Missing credentials. Provide R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY, or R2_API_TOKEN and its hash.');
    process.exit(1);
  }
  return new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: accessKey, secretAccessKey: secretKey } });
}

async function listAll(client, prefix) {
  let token;
  const keys = [];
  do {
    const res = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    (res.Contents || []).forEach((o) => o.Key && keys.push(o.Key));
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function main() {
  const client = await getClient();
  const prefix = argv.prefix || '';
  const dry = Boolean(argv.dry);
  const force = Boolean(argv.force || argv.f);

  console.log(`Scanning ${bucket}/${prefix} (dry=${dry}, force=${force})`);
  const keys = await listAll(client, prefix);
  let fixed = 0;

  for (const key of keys) {
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      const current = head.ContentType || '';
      const expected = guessMimeFromKey(key);
      const needsUpdate = force || !current || current === 'application/octet-stream' || (expected.startsWith('image/') && current !== expected);

      if (!needsUpdate) {
        continue;
      }

      if (dry) {
        console.log(`[DRY] Would update Content-Type for ${key}: '${current}' -> '${expected}'`);
        fixed++;
        continue;
      }

      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${key}`,
          Key: key,
          MetadataDirective: 'REPLACE',
          ContentType: expected,
          CacheControl: head.CacheControl,
          Metadata: head.Metadata || {},
        })
      );
      console.log(`Updated ${key}: '${current}' -> '${expected}'`);
      fixed++;
    } catch (err) {
      console.error(`Failed to inspect/update ${key}:`, err?.message || err);
    }
  }

  console.log(`Done. Processed ${keys.length} objects. Updated ${fixed}.`);
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
