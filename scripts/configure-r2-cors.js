#!/usr/bin/env node

// Configure the CORS policy for a Cloudflare R2 bucket using the S3-compatible API.
// Usage examples:
//   node scripts/configure-r2-cors.js --show
//   node scripts/configure-r2-cors.js --config configs/r2-cors.default.json
//   node scripts/configure-r2-cors.js --config custom.json --dry

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const {
  S3Client,
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  DeleteBucketCorsCommand,
} = require('@aws-sdk/client-s3');

const argv = minimist(process.argv.slice(2), {
  boolean: ['dry', 'show', 'clear'],
  string: ['config'],
});

const account = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!account || !bucket || !accessKeyId || !secretAccessKey) {
  console.error(
    'Missing R2 credentials. Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY before running this script.'
  );
  process.exit(1);
}

const endpoint = `https://${account}.r2.cloudflarestorage.com`;
const client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function getCurrentPolicy() {
  try {
    const response = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    return response.CORSRules || [];
  } catch (error) {
    if (error?.name === 'NoSuchCORSConfiguration' || error?.Code === 'NoSuchCORSConfiguration') {
      return [];
    }
    throw error;
  }
}

function resolvePolicyPath() {
  if (argv.config) {
    return path.resolve(process.cwd(), argv.config);
  }
  return path.resolve(process.cwd(), 'configs', 'r2-cors.default.json');
}

function loadPolicyFromDisk(policyPath) {
  if (!fs.existsSync(policyPath)) {
    console.error(`CORS policy file not found: ${policyPath}`);
    process.exit(1);
  }

  let parsed;
  try {
    const raw = fs.readFileSync(policyPath, 'utf8');
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read CORS policy file at ${policyPath}:`, error.message || error);
    process.exit(1);
  }

  const rules = parsed?.rules;
  if (!Array.isArray(rules) || rules.length === 0) {
    console.error('CORS policy file must contain a non-empty "rules" array.');
    process.exit(1);
  }

  const normalizedRules = rules.map((rule, index) => {
    const {
      AllowedOrigins,
      AllowedMethods,
      AllowedHeaders,
      ExposeHeaders,
      MaxAgeSeconds,
    } = rule || {};

    if (!Array.isArray(AllowedOrigins) || AllowedOrigins.length === 0) {
      console.error(`Rule ${index} is missing AllowedOrigins.`);
      process.exit(1);
    }
    if (!Array.isArray(AllowedMethods) || AllowedMethods.length === 0) {
      console.error(`Rule ${index} is missing AllowedMethods.`);
      process.exit(1);
    }

    return {
      AllowedOrigins,
      AllowedMethods,
      AllowedHeaders: Array.isArray(AllowedHeaders) && AllowedHeaders.length > 0 ? AllowedHeaders : undefined,
      ExposeHeaders: Array.isArray(ExposeHeaders) && ExposeHeaders.length > 0 ? ExposeHeaders : undefined,
      MaxAgeSeconds:
        typeof MaxAgeSeconds === 'number' && Number.isFinite(MaxAgeSeconds) && MaxAgeSeconds >= 0
          ? Math.floor(MaxAgeSeconds)
          : undefined,
    };
  });

  return normalizedRules;
}

async function applyPolicy(rules) {
  if (argv.clear) {
    console.log(`Clearing CORS policy for bucket ${bucket} (dry=${argv.dry})`);
    if (argv.dry) return;
    await client.send(new DeleteBucketCorsCommand({ Bucket: bucket }));
    console.log('CORS policy removed.');
    return;
  }

  console.log(`Updating CORS policy for bucket ${bucket} using ${rules.length} rule(s) (dry=${argv.dry})`);
  if (argv.dry) {
    console.log(JSON.stringify({ CORSRules: rules }, null, 2));
    return;
  }

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: rules,
      },
    })
  );
  console.log('CORS policy updated successfully. Changes can take ~30 seconds to propagate.');
}

(async () => {
  try {
    const current = await getCurrentPolicy();
    if (argv.show) {
      console.log(JSON.stringify({ CORSRules: current }, null, 2));
      return;
    }

    const policyPath = resolvePolicyPath();
    const desiredRules = loadPolicyFromDisk(policyPath);

    console.log('Current CORS rules:');
    console.log(JSON.stringify({ CORSRules: current }, null, 2));

    if (argv.clear) {
      await applyPolicy([]);
      return;
    }

    console.log(`Desired CORS rules from ${policyPath}:`);
    console.log(JSON.stringify({ CORSRules: desiredRules }, null, 2));

    await applyPolicy(desiredRules);
  } catch (error) {
    if (error?.name === 'AccessDenied' || error?.Code === 'AccessDenied' || error?.$metadata?.httpStatusCode === 403) {
      console.error(
        'Failed to configure R2 CORS policy: AccessDenied. Ensure the R2 access key was created with "Workers R2 Storage Write" (or Admin Read & Write) permissions so it can edit bucket configuration.'
      );
    } else {
      console.error('Failed to configure R2 CORS policy:', error.message || error);
    }
    process.exit(1);
  }
})();
