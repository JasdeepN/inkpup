#!/usr/bin/env node

// Ensure a Cloudflare R2 custom domain is attached, enabled, and enforcing the desired minimum TLS version.
// Usage:
//   node scripts/configure-r2-custom-domain.js --domain r2.example.com --min-tls 1.3
// Environment variables required:
//   CLOUDFLARE_API_TOKEN (or CF_API_TOKEN)
//   CLOUDFLARE_ACCOUNT_ID (or CF_ACCOUNT_ID)
//   CLOUDFLARE_ZONE_ID (or CF_ZONE_ID)
//   R2_BUCKET
// Optional environment variables:
//   R2_CUSTOM_DOMAIN (fallback for --domain)
//   R2_MIN_TLS (fallback for --min-tls)
//   DRY_RUN (treat any non-empty value as true)

import minimist from 'minimist';

const argv = minimist(process.argv.slice(2), {
  string: ['domain', 'min-tls'],
  boolean: ['dry'],
  alias: {
    d: 'domain',
  },
});

const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const zoneId = process.env.CLOUDFLARE_ZONE_ID || process.env.CF_ZONE_ID;
const bucket = process.env.R2_BUCKET;
const dryRun = argv.dry || Boolean(process.env.DRY_RUN);

function normalizeDomain(input) {
  if (!input) return '';
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .split('/')[0];
}

const desiredDomain = normalizeDomain(
  argv.domain || process.env.R2_CUSTOM_DOMAIN || process.env.R2_PUBLIC_HOSTNAME
);

const desiredMinTls = (argv['min-tls'] || process.env.R2_MIN_TLS || '1.3').toString();

function assert(value, message) {
  if (!value) {
    console.error(message);
    process.exit(1);
  }
}

assert(token, 'Missing CLOUDFLARE_API_TOKEN / CF_API_TOKEN for Cloudflare API access.');
assert(accountId, 'Missing CLOUDFLARE_ACCOUNT_ID / CF_ACCOUNT_ID for Cloudflare API access.');
assert(zoneId, 'Missing CLOUDFLARE_ZONE_ID / CF_ZONE_ID for identifying the custom domain zone.');
assert(bucket, 'Missing R2_BUCKET environment variable.');
assert(desiredDomain, 'A custom domain must be supplied via --domain, R2_CUSTOM_DOMAIN, or R2_PUBLIC_HOSTNAME.');

const apiBase = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/r2/buckets/${encodeURIComponent(bucket)}/domains/custom`;

async function request(method, url, body) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    const message = parsed?.errors?.[0]?.message || parsed?.raw || res.statusText;
    throw new Error(`Cloudflare API ${method} ${url} failed: ${message}`);
  }

  return parsed;
}

async function fetchCurrent() {
  try {
    const url = `${apiBase}/${encodeURIComponent(desiredDomain)}`;
    const response = await request('GET', url);
    return response?.result || null;
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

async function attachDomain() {
  const payload = {
    domain: desiredDomain,
    enabled: true,
    zoneId,
    minTLS: desiredMinTls,
  };
  console.log(`Attaching custom domain ${desiredDomain} to bucket ${bucket} (minTLS=${desiredMinTls})`);
  if (dryRun) return { dryRun: true };
  return request('POST', apiBase, payload);
}

async function updateDomain() {
  const payload = {
    enabled: true,
    minTLS: desiredMinTls,
  };
  console.log(
    `Updating custom domain ${desiredDomain} to enforce TLS >= ${desiredMinTls} and ensure it remains enabled`
  );
  if (dryRun) return { dryRun: true };
  const url = `${apiBase}/${encodeURIComponent(desiredDomain)}`;
  return request('PUT', url, payload);
}

(async () => {
  try {
    console.log(`Checking custom domain ${desiredDomain} for bucket ${bucket}`);
    const existing = await fetchCurrent();

    if (!existing) {
      await attachDomain();
      console.log('Custom domain attached. Activation may take a few minutes.');
      return;
    }

    const currentMinTls = existing.minTLS || existing.min_tls || '1.0';
    const currentlyEnabled = existing.enabled !== false;

    console.log(
      `Current settings: enabled=${currentlyEnabled}, minTLS=${currentMinTls}, status=${existing.status || 'unknown'}`
    );

    if (!currentlyEnabled || currentMinTls !== desiredMinTls) {
      await updateDomain();
      console.log('Custom domain settings updated. TLS changes can take a few minutes to propagate.');
    } else {
      console.log('Custom domain already matches desired configuration.');
    }
  } catch (error) {
    console.error('Failed to ensure custom domain configuration:', error.message || error);
    process.exit(1);
  }
})();
