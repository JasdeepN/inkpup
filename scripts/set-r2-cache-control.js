// Simple script to set Cache-Control metadata for objects in a Cloudflare R2 bucket.
// Usage:
//   R2_ACCOUNT_ID=<account> R2_BUCKET=<bucket> R2_ACCESS_KEY_ID=<key> R2_SECRET_ACCESS_KEY=<secret> \
//   node scripts/set-r2-cache-control.js --prefix social/ --cache "public, max-age=31536000" --dry
// Set --dry to true to run a dry run.

const { S3Client, ListObjectsV2Command, CopyObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const argv = require('minimist')(process.argv.slice(2));

const { createHash } = require('crypto');

const account = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
let accessKey = process.env.R2_ACCESS_KEY_ID;
const secretKey = process.env.R2_SECRET_ACCESS_KEY;
const apiToken = process.env.R2_API_TOKEN;

// Auto-derive credentials from API token if needed
async function deriveAccessKeyId() {
  if (!apiToken) {
    return null;
  }
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });
    if (!response.ok) {
      console.warn(`Failed to verify API token (HTTP ${response.status}). Unable to auto-derive access key ID.`);
      return null;
    }
    const data = await response.json();
    return data.result?.id ?? null;
  } catch (error) {
    console.warn('Error verifying API token:', error.message);
    return null;
  }
}

async function validateCredentials() {
  if (!account || !bucket) {
    console.error('Missing R2_ACCOUNT_ID or R2_BUCKET. Set these environment variables.');
    process.exit(1);
  }

  if (!accessKey && apiToken) {
    console.log('R2_ACCESS_KEY_ID not provided. Attempting to derive from R2_API_TOKEN...');
    accessKey = await deriveAccessKeyId();
    if (accessKey) {
      console.log(`Successfully derived access key ID: ${accessKey}`);
    } else {
      console.error('Unable to derive access key ID from R2_API_TOKEN. Please set R2_ACCESS_KEY_ID explicitly.');
      process.exit(1);
    }
  }

  if (!accessKey || !secretKey) {
    console.error('Missing R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY. Set these environment variables or provide R2_API_TOKEN.');
    process.exit(1);
  }
}

async function main() {
  await validateCredentials();

  const endpoint = `https://${account}.r2.cloudflarestorage.com`;
  const prefix = argv.prefix || '';
  const cacheControl = argv.cache || 'public, max-age=31536000';
  const dry = Boolean(argv.dry);
  const force = Boolean(argv.force || argv.f);

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: false,
  });

  // Debug: show parsed flags so it's obvious what the script received
  console.log(`Flags: prefix='${prefix}' cache='${cacheControl}' dry=${dry} force=${force}`);

  async function listAllKeys(continuationToken) {
    const cmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken });
    const res = await client.send(cmd);
    const keys = (res.Contents || []).map(o => o.Key).filter(Boolean);
    return { keys, nextToken: res.IsTruncated ? res.NextContinuationToken : null };
  }

  async function run() {
  console.log(`Setting Cache-Control="${cacheControl}" for objects in ${bucket}/${prefix} (dry=${dry})`);
  let token = undefined;
  let total = 0;
  do {
    const { keys, nextToken } = await listAllKeys(token);
    token = nextToken;
    for (const key of keys) {
      total++;
      console.log(`Processing: ${key}`);

      // Check current object's headers
      let head;
      try {
        const headCmd = new HeadObjectCommand({ Bucket: bucket, Key: key });
        head = await client.send(headCmd);
      } catch (err) {
        console.error(`Failed to head ${key}:`, err && err.message ? err.message : err);
        continue;
      }

      const currentCache = head.CacheControl || '';
      if (currentCache === cacheControl && !force) {
        console.log(`Skipping ${key} (Cache-Control already '${cacheControl}')`);
        continue;
      }

      if (dry) {
        if (force) console.log(`Would force-update ${key} (current: '${currentCache || '<none>'}')`);
        else console.log(`Would update ${key} (current: '${currentCache || '<none>'}')`);
        continue;
      }

      const copyParams = {
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: key,
        MetadataDirective: 'REPLACE',
        CacheControl: cacheControl,
        ContentType: head.ContentType,
        Metadata: head.Metadata || {},
      };

      try {
        const copyCmd = new CopyObjectCommand(copyParams);
        await client.send(copyCmd);
        console.log(`Updated ${key}`);
      } catch (err) {
        console.error(`Failed to update ${key}:`, err && err.message ? err.message : err);
      }
    }
  } while (token);
  console.log(`Done. Processed ${total} objects.`);
  }

  await run();
}

main().catch(err => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
