// Script to create a dummy SSR chunk file to avoid ENOENT errors in OpenNext
const fs = require('fs');
const path = require('path');





const buildChunkDir = path.join(__dirname, '../.next/standalone/.next/server/chunks/ssr');
const errorLogPath = path.join(__dirname, '../opennext-error.log');

// Ensure parent directory exists for build output
if (!fs.existsSync(buildChunkDir)) {
  fs.mkdirSync(buildChunkDir, { recursive: true });
  console.log(`Created SSR chunk directory: ${buildChunkDir}`);
}

// Scan error log for missing chunk filenames
let missingChunks = [];
if (fs.existsSync(errorLogPath)) {
  const logContent = fs.readFileSync(errorLogPath, 'utf-8');
  const regex = /ENOENT: no such file or directory, copyfile '.*?\/([\w\-\[\]\.]+\.js)'/g;
  let match;
  while ((match = regex.exec(logContent)) !== null) {
    missingChunks.push(match[1]);
  }
} else {
  console.warn(`Error log not found: ${errorLogPath}`);
}

// Create dummy files for each missing chunk
missingChunks.forEach(chunkFile => {
  const chunkPath = path.join(buildChunkDir, chunkFile);
  if (!fs.existsSync(chunkPath)) {
    fs.writeFileSync(chunkPath, '// dummy SSR chunk file for OpenNext build\n');
    console.log(`Created dummy SSR chunk: ${chunkPath}`);
  } else {
    console.log(`SSR chunk already exists: ${chunkPath}`);
  }
});
