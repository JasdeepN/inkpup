// Script to create a dummy SSR chunk file to avoid ENOENT errors in OpenNext
const fs = require('fs');
const path = require('path');




const buildChunkDir = path.join(__dirname, '../.next/standalone/.next/server/chunks/ssr');
const expectedChunkDir = path.join(__dirname, '../.open-next/server-functions/default/.next/server/chunks/ssr');

// Ensure parent directory exists for build output
if (!fs.existsSync(buildChunkDir)) {
  fs.mkdirSync(buildChunkDir, { recursive: true });
  console.log(`Created SSR chunk directory: ${buildChunkDir}`);
}

// Scan expected chunk files from OpenNext trace directory
let expectedChunks = [];
if (fs.existsSync(expectedChunkDir)) {
  expectedChunks = fs.readdirSync(expectedChunkDir);
} else {
  console.warn(`Expected chunk directory does not exist: ${expectedChunkDir}`);
}

expectedChunks.forEach(chunkFile => {
  const chunkPath = path.join(buildChunkDir, chunkFile);
  if (!fs.existsSync(chunkPath)) {
    fs.writeFileSync(chunkPath, '// dummy SSR chunk file for OpenNext build\n');
    console.log(`Created dummy SSR chunk: ${chunkPath}`);
  } else {
    console.log(`SSR chunk already exists: ${chunkPath}`);
  }
});
