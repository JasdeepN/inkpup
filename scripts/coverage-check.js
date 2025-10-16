import fs from 'fs';
import path from 'path';

const coveragePath = path.resolve('coverage', 'coverage-final.json');
const data = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.log(Object.keys(data));
  process.exit(0);
}

for (const key of targets) {
  const matchKey = Object.keys(data).find((k) => k.endsWith(key));
  if (!matchKey) {
    console.log(`No entry for ${key}`);
    continue;
  }
  const entry = data[matchKey];
  console.log(`\n== ${matchKey} ==`);
  console.log(JSON.stringify(entry, null, 2));
}
