const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const envPath = path.resolve(process.cwd(), '.env');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (err) {
  console.error('.env not found or unreadable, proceeding with current environment');
}

function parseDotEnv(content) {
  const result = {};
  const lines = content.split(/\r?\n/);
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // Remove surrounding quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

const parsed = parseDotEnv(envContent);
// Merge parsed vars into a copy of process.env without overwriting existing real env vars
const childEnv = Object.assign({}, parsed, process.env);

console.log('Launching deploy with environment variables from .env (non-sensitive keys loaded).');

const cmd = 'npm';
const args = ['run', 'opennext:deploy', '--', '--env', 'dev'];
const child = spawn(cmd, args, { stdio: 'inherit', env: childEnv, shell: true });

child.on('exit', (code, signal) => {
  if (code === 0) {
    console.log('\nDeploy process exited successfully with code 0');
    process.exit(0);
  } else {
    console.error('\nDeploy process failed', { code, signal });
    process.exit(code || 1);
  }
});
