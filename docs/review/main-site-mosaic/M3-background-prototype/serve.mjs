// Task-owned static server for this folder only (loopback). Usage: node serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url)); const port = Number(process.argv[2] || 4344);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json' };
createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0]); let f = join(root, normalize(p).replace(/^[\\/]+/, ''));
    if (!resolve(f).startsWith(root)) { res.writeHead(403); return res.end(); }
    if ((await stat(f).catch(() => null))?.isDirectory()) f = join(f, 'index.html');
    if (/(extract|build|serve)\.mjs$/.test(f)) { res.writeHead(404); return res.end(); }
    const body = await readFile(f);
    res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body);
  } catch { if (!res.headersSent) res.writeHead(404); res.end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`M3 prototype on http://127.0.0.1:${port}/`));
