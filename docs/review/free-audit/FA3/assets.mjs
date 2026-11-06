// Asset delta for /en/audit/: bytes (raw + gzip) of the JS/CSS/font files the page references, current build vs a HEAD build. node assets.mjs <distNew> <distBase>
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
const [,, a, b] = process.argv;
const files = (d) => { const html = readFileSync(join(d, 'en/audit/index.html'), 'utf8'); const urls = [...new Set([...html.matchAll(/(?:href|src)="(\/_astro\/[^"]+)"/g)].map((m) => m[1]))];
  const mod = [...html.matchAll(/import\("(\/_astro\/[^"]+)"\)|from"(\/_astro\/[^"]+)"/g)].map((m) => m[1] || m[2]); return [...new Set([...urls, ...mod])]; };
const size = (d) => { const rows = []; const seen = new Set(); const walk = (u) => { if (seen.has(u)) return; seen.add(u); const p = join(d, u); if (!existsSync(p)) return; const buf = readFileSync(p); rows.push({ file: u.split('/').pop(), kind: u.split('.').pop(), raw: buf.length, gz: /woff2/.test(u) ? buf.length : gzipSync(buf).length }); if (u.endsWith('.js')) for (const m of buf.toString().matchAll(/["'`]\.\/([^"'`]+\.js)["'`]/g)) walk('/_astro/' + m[1]); }; files(d).forEach(walk); return rows; };
const sum = (rows, k, kind) => rows.filter((r) => !kind || r.kind === kind).reduce((s, r) => s + r[k], 0);
const A = size(a), B = size(b);
const out = { new: { files: A.length, js: [sum(A, 'raw', 'js'), sum(A, 'gz', 'js')], css: [sum(A, 'raw', 'css'), sum(A, 'gz', 'css')], fonts: sum(A, 'raw', 'woff2') }, base: { files: B.length, js: [sum(B, 'raw', 'js'), sum(B, 'gz', 'js')], css: [sum(B, 'raw', 'css'), sum(B, 'gz', 'css')], fonts: sum(B, 'raw', 'woff2') }, note: '[raw, gzip] bytes; media requests: none added (no img/video on the page)' };
console.log(JSON.stringify(out, null, 1));
