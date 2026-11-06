// Task-owned static preview of a built dist folder (no dependencies). Usage: node serve.mjs <dist-dir> [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, resolve, sep } from 'node:path';
const root = resolve(process.argv[2]); const port = Number(process.argv[3] || 4341);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.xml': 'application/xml', '.txt': 'text/plain' };
createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0]); let f = join(root, normalize(p).replace(/^[\/]+/, ''));
    if (!resolve(f).startsWith(root + sep) && resolve(f) !== root) { res.writeHead(403); return res.end(); }
    const st = await stat(f).catch(() => null); if (st?.isDirectory()) f = join(f, 'index.html');
    const body = await readFile(f); res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}/`));
