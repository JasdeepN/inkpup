// Script to create a dummy SSR chunk file to avoid ENOENT errors in OpenNext
const fs = require('fs');
const path = require('path');

const chunkDir = path.join(__dirname, '../.next/standalone/.next/server/chunks/ssr');
const chunkFile = '[root-of-the-server]__19dfcc50._.js';
const chunkPath = path.join(chunkDir, chunkFile);

if (!fs.existsSync(chunkPath)) {
  fs.writeFileSync(chunkPath, '// dummy SSR chunk file for OpenNext build\n');
  console.log(`Created dummy SSR chunk: ${chunkPath}`);
} else {
  console.log(`SSR chunk already exists: ${chunkPath}`);
}
