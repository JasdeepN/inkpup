const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function parseEnvVar(envContent, key) {
  const re = new RegExp('^' + key + '=(.*)$', 'm');
  const m = envContent.match(re);
  if (!m) return undefined;
  let val = m[1].trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  return val;
}

const envPath = path.resolve(process.cwd(), '.env');
let env = '';
try {
  env = fs.readFileSync(envPath, 'utf8');
} catch (err) {
  // ignore
}

const secret = parseEnvVar(env, 'ADMIN_WEBHOOK_SECRET') || process.env.ADMIN_WEBHOOK_SECRET || '';

const payload = JSON.stringify({ event: 'job_queued', jobId: 'verify-' + Date.now(), category: 'hero', createdAt: new Date().toISOString() });
const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
const timestamp = String(Date.now());

function timingSafeCompareHex(aHex, bHex) {
  try {
    const a = Buffer.from(aHex, 'hex');
    const b = Buffer.from(bHex, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

function verify({ rawBody, signatureHeader, timestampHeader, secret, toleranceMs = 5 * 60 * 1000 }) {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const sentSignature = signatureHeader.slice('sha256='.length);
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!timingSafeCompareHex(sentSignature, expected)) return false;
  if (timestampHeader) {
    const sentTime = Number(timestampHeader);
    if (Number.isFinite(sentTime)) {
      const now = Date.now();
      if (Math.abs(now - sentTime) > toleranceMs) return false;
    }
  }
  return true;
}

const ok = verify({ rawBody: payload, signatureHeader: signature, timestampHeader: timestamp, secret });
console.log('verify result:', ok);

// also try a bad signature
const bad = verify({ rawBody: payload, signatureHeader: 'sha256=deadbeef', timestampHeader: timestamp, secret });
console.log('verify with bad sig:', bad);
