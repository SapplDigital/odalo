// Sizes of a built site: home pages, JS and CSS files (raw and gzip). Usage: node dist-stats.mjs <distDir> <label>
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const dir = path.resolve(process.argv[2] || 'dist');
const label = process.argv[3] || 'build';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(dir);
const size = (f) => { const b = fs.readFileSync(f); return { file: path.relative(dir, f).split(path.sep).join('/'), bytes: b.length, gzip: zlib.gzipSync(b, { level: 9 }).length }; };
const js = files.filter((f) => f.endsWith('.js') || f.endsWith('.mjs')).map(size);
const css = files.filter((f) => f.endsWith('.css')).map(size);
const home = ['en', 'es', 'de'].map((l) => size(path.join(dir, l, 'index.html')));
const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
const out = { label, home, jsFiles: js.length, jsBytes: sum(js, 'bytes'), jsGzip: sum(js, 'gzip'), cssFiles: css.length, cssBytes: sum(css, 'bytes'), cssGzip: sum(css, 'gzip'), js, css };
fs.writeFileSync(path.resolve('docs/review/services-motion-integration/evidence', `dist-${label}.json`), JSON.stringify(out, null, 1));
console.log(label, JSON.stringify({ home: home.map((h) => `${h.file} ${h.bytes}/${h.gzip}`), js: `${js.length} files ${out.jsBytes}/${out.jsGzip}`, css: `${css.length} files ${out.cssBytes}/${out.cssGzip}` }));
