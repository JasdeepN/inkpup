// Simple script to set Cache-Control metadata for objects in a Cloudflare R2 bucket.
// Usage:
//   R2_ACCOUNT_ID=<account> R2_BUCKET=<bucket> R2_ACCESS_KEY_ID=<key> R2_SECRET_ACCESS_KEY=<secret> \
//   node scripts/set-r2-cache-control.js --prefix social/ --cache "public, max-age=31536000" --dry
// Set --dry to true to run a dry run.

const { S3Client, ListObjectsV2Command, CopyObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const argv = require('minimist')(process.argv.slice(2));

const account = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const accessKey = process.env.R2_ACCESS_KEY_ID;
const secretKey = process.env.R2_SECRET_ACCESS_KEY;

if (!account || !bucket || !accessKey || !secretKey) {
  console.error('Missing R2 credentials. Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

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

run().catch(err => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
