// Verifies artifact/dist against evidence/artifact-manifest.sha256.txt (same hashing as build-artifact.mjs). node verify-manifest.mjs
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, 'artifact', 'dist');
const files = []; const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : files.push(p); } }; walk(root); files.sort();
const cur = files.map((f) => `${createHash('sha256').update(readFileSync(f)).digest('hex')}  ${relative(root, f).replace(/\\/g, '/')}`);
const saved = readFileSync(join(here, 'evidence', 'artifact-manifest.sha256.txt'), 'utf8').trim().split('\n');
const match = cur.length === saved.length && cur.every((l, i) => l === saved[i]);
const id = createHash('sha256').update(cur.join('\n')).digest('hex');
const out = `checked ${new Date().toISOString()}\nfiles ${cur.length}\nmanifest match ${match}\ncontent id ${id}\n`;
writeFileSync(join(here, 'evidence', 'manifest-verification-before-deploy.txt'), out);
console.log(out);
