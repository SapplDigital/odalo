// Task-owned static preview for the M1 prototype. No dependencies. Usage: node serve.mjs [port]  (default 4331)
// Lookup order: this folder -> /vendor (installed fontsource css+fonts) -> app dist/ (real case-study pages, "before" composition) -> app public/.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
const app = resolve(here, '../../../..');
const port = Number(process.argv[2] || 4331);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.xml': 'application/xml', '.txt': 'text/plain' };
const vendor = { '/vendor/outfit/': join(app, 'node_modules/@fontsource-variable/outfit/'), '/vendor/instrument-serif/': join(app, 'node_modules/@fontsource/instrument-serif/') };
async function find(url) {
  const p = decodeURIComponent(url.split('?')[0]);
  for (const [pre, dir] of Object.entries(vendor)) if (p.startsWith(pre)) return [join(dir, p.slice(pre.length))];
  const rel = normalize(p).replace(/^[\/]+/, '');
  return [join(here, rel), join(app, 'dist', rel), join(app, 'public', rel)];
}
createServer(async (req, res) => {
  try {
    for (let f of await find(req.url)) {
      const st = await stat(f).catch(() => null);
      if (st?.isDirectory()) { f = join(f, 'index.html'); }
      const ok = await stat(f).then((s) => s.isFile()).catch(() => false);
      if (!ok) continue;
      const base = [here, join(app, 'dist'), join(app, 'public'), ...Object.values(vendor)].map((b) => resolve(b));
      if (!base.some((b) => resolve(f).startsWith(b + sep) || resolve(f) === b)) continue;
      res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(await readFile(f)); return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found');
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(port, '127.0.0.1', () => console.log(`M1 preview http://127.0.0.1:${port}/en.html  (also /de.html, before: /en/)`));
