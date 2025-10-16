#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const pathToFile = process.argv[2] || 'lib/r2-server.ts';

try {
  const s = readFileSync(pathToFile, 'utf8');
  const opens = (s.match(/{/g) || []).length;
  const closes = (s.match(/}/g) || []).length;
  console.log(pathToFile, 'opens', opens, 'closes', closes);

  // Find last unmatched open and final balance
  let balance = 0;
  const stack = [];
  const lines = s.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '{') {
        balance++;
        stack.push({ line: i + 1, col: j + 1 });
      } else if (ch === '}') {
        balance--;
        stack.pop();
      }
    }
  }

  if (balance === 0) {
    console.log('balanced');
  } else {
    const last = stack[stack.length - 1];
    console.log('final balance', balance, 'last unmatched at line', last ? last.line : -1, 'col', last ? last.col : -1);
    if (last) {
      const start = Math.max(0, last.line - 3 - 1);
      const end = Math.min(lines.length, last.line + 3);
      console.log('--- context ---');
      for (let k = start; k < end; k++) {
        const mark = k + 1 === last.line ? '>>' : '  ';
        console.log(`${mark} ${k + 1}: ${lines[k]}`);
      }
      console.log('--- end context ---');
    }
  }
} catch (err) {
  console.error('Error reading file', pathToFile, err && err.message ? err.message : err);
  process.exit(2);
}
