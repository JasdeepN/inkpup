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
const { createHash } = require('crypto');

const argv = minimist(process.argv.slice(2), {
  boolean: ['dry', 'show', 'clear'],
  string: ['config'],
});

const account = process.env.R2_ACCOUNT_ID?.trim();
const bucket = process.env.R2_BUCKET?.trim();
let accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const rawSecretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
const rawApiToken = process.env.R2_API_TOKEN?.trim();

let credentialSource = 'secret access key';
let secretAccessKey = rawSecretAccessKey;

if (!secretAccessKey && rawApiToken) {
  credentialSource = 'API token';
  const tokenLooksHashed = /^[0-9a-f]{64}$/i.test(rawApiToken);
  secretAccessKey = tokenLooksHashed
    ? rawApiToken
    : createHash('sha256').update(rawApiToken).digest('hex');
  if (!tokenLooksHashed) {
    console.log('Derived R2 secret access key from R2_API_TOKEN via SHA-256 per Cloudflare guidance.');
  }
}

// Auto-derive access key ID from API token if not provided
async function deriveAccessKeyId() {
  if (!rawApiToken) {
    return null;
  }
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: {
        Authorization: `Bearer ${rawApiToken}`,
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
    console.error('Missing R2_ACCOUNT_ID or R2_BUCKET environment variables.');
    process.exit(1);
  }

  if (!secretAccessKey) {
    console.error('Missing R2_SECRET_ACCESS_KEY or R2_API_TOKEN environment variables.');
    process.exit(1);
  }

  if (!accessKeyId && rawApiToken) {
    console.log('R2_ACCESS_KEY_ID not provided. Attempting to derive from R2_API_TOKEN...');
    accessKeyId = await deriveAccessKeyId();
    if (accessKeyId) {
      console.log(`Successfully derived access key ID: ${accessKeyId}`);
    } else {
      console.error('Unable to derive access key ID from R2_API_TOKEN. Please set R2_ACCESS_KEY_ID explicitly.');
      process.exit(1);
    }
  }

  if (!accessKeyId) {
    console.error('Missing R2_ACCESS_KEY_ID. Set it explicitly or provide R2_API_TOKEN with "User Details: Read" permission.');
    process.exit(1);
  }
}

await validateCredentials();

const endpoint = `https://${account}.r2.cloudflarestorage.com`;
const client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

if (credentialSource === 'API token') {
  console.log('Using R2 API token credentials for CORS operations.');
}

const VALID_METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'DELETE']);
const ORIGIN_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/[^/]+$/i;

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

    const normalizedOrigins = AllowedOrigins.map((origin, originIndex) => {
      if (typeof origin !== 'string') {
        console.error(`Rule ${index} origin at position ${originIndex} must be a string.`);
        process.exit(1);
      }
      const trimmed = origin.trim();
      if (!ORIGIN_PATTERN.test(trimmed)) {
        console.error(
          `Rule ${index} origin "${origin}" is not a valid Origin header value. Expected scheme://host[:port] without a path.`
        );
        process.exit(1);
      }
      return trimmed;
    });

    const normalizedMethods = AllowedMethods.map((method, methodIndex) => {
      if (typeof method !== 'string') {
        console.error(`Rule ${index} method at position ${methodIndex} must be a string.`);
        process.exit(1);
      }
      const upper = method.trim().toUpperCase();
      if (!VALID_METHODS.has(upper)) {
        console.error(
          `Rule ${index} method "${method}" is not supported. Allowed values are ${Array.from(VALID_METHODS).join(', ')}.`
        );
        process.exit(1);
      }
      return upper;
    });

    const normalizedHeaders = Array.isArray(AllowedHeaders) && AllowedHeaders.length > 0
      ? AllowedHeaders.map((header, headerIndex) => {
          if (typeof header !== 'string' || !header.trim()) {
            console.error(`Rule ${index} AllowedHeaders entry at position ${headerIndex} must be a non-empty string.`);
            process.exit(1);
          }
          return header.trim();
        })
      : undefined;

    const normalizedExposeHeaders = Array.isArray(ExposeHeaders) && ExposeHeaders.length > 0
      ? ExposeHeaders.map((header, headerIndex) => {
          if (typeof header !== 'string' || !header.trim()) {
            console.error(`Rule ${index} ExposeHeaders entry at position ${headerIndex} must be a non-empty string.`);
            process.exit(1);
          }
          return header.trim();
        })
      : undefined;

    return {
      AllowedOrigins: normalizedOrigins,
      AllowedMethods: normalizedMethods,
      AllowedHeaders: normalizedHeaders,
      ExposeHeaders: normalizedExposeHeaders,
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
    } else if (error?.name === 'MalformedXML' || error?.Code === 'MalformedXML' || error?.message?.includes('not well formed')) {
      console.error(
        'Failed to configure R2 CORS policy: MalformedXML. Confirm that AllowedMethods only include GET, PUT, POST, DELETE, or HEAD and that AllowedOrigins match the scheme://host[:port] format (no trailing slash). See https://developers.cloudflare.com/r2/buckets/cors/ for details.'
      );
      if (error?.$response?.body?.transformToString) {
        try {
          const xml = await error.$response.body.transformToString();
          console.error('Service response:', xml);
        } catch {
          // ignore body parse issues
        }
      }
    } else {
      console.error('Failed to configure R2 CORS policy:', error.message || error);
    }
    process.exit(1);
  }
})();
