import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const exts = ['.js', '.jsx', '.css', '.html'];
let emdash = 0;
let emoji = 0;
const emdashFiles = [];
const emojiFiles = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (exts.some((e) => p.endsWith(e))) check(p);
  }
}

function check(p) {
  const text = readFileSync(p, 'utf8');
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code === 0x2014) {
      emdash++;
      if (!emdashFiles.includes(p)) emdashFiles.push(p);
    }
    const isEmoji =
      (code >= 0x1f000 && code <= 0x1faff) ||
      (code >= 0x2600 && code <= 0x27bf) ||
      code === 0x2b50 ||
      code === 0x2728 ||
      (code >= 0xfe00 && code <= 0xfe0f) ||
      (code >= 0x1f1e6 && code <= 0x1f1ff);
    if (isEmoji) {
      emoji++;
      if (!emojiFiles.includes(p)) emojiFiles.push(p);
    }
  }
}

walk('src');
console.log('EMDASH count:', emdash, emdashFiles);
console.log('EMOJI count:', emoji, emojiFiles);
