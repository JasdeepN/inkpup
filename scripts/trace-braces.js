import { readFileSync } from 'node:fs';
const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/trace-braces.js <file>');
  process.exit(2);
}
const text = readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/);
let open = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/\{/g) || []).length;
  const closes = (line.match(/\}/g) || []).length;
  open += opens - closes;
  if (opens || closes || open !== 0) {
    console.log(`${String(i+1).padStart(4)} | ${String(open).padStart(4)} | +${opens} -${closes} | ${line}`);
  }
}
console.log('final balance', open);
