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
const url = 'http://localhost:3002/api/admin/reciever';

const payloadObj = { event: 'job_queued', jobId: 'test-' + Date.now(), category: 'hero', createdAt: new Date().toISOString() };
const payload = JSON.stringify(payloadObj);
const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
const ts = Date.now();

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=' + sig,
        'x-hub-timestamp': String(ts),
      },
      body: payload,
    });
    console.log('status', res.status);
    const text = await res.text();
    console.log('body', text);
  } catch (err) {
    console.error('fetch error', err);
    process.exitCode = 2;
  }
})();
