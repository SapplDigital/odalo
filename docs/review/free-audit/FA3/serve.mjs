// Task-owned static server for evidence capture: node docs/review/free-audit/FA3/serve.mjs <dir> [port] [basePath]
// GET/HEAD only (a POST is a 405, so no enquiry can ever be sent through it). basePath e.g. /odalo/ serves <dir> under that prefix.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, resolve } from 'node:path';
const dir = resolve(process.argv[2] || 'dist'); const port = Number(process.argv[3] || 4395); const base = process.argv[4] ? `/${process.argv[4].replace(/^.*?(Git[/\\])?/, '').replace(/^[/\\]+|[/\\]+$/g, '')}/` : '/'; // pass "odalo" (Git Bash rewrites a leading-slash argument)
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml' };
createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!p.startsWith(base)) { res.writeHead(404); return res.end('outside base'); }
  p = normalize(p.slice(base.length)).replace(/^[/\\]+/, '');
  let f = join(dir, p);
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); const body = await readFile(f); res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : body); }
  catch { res.writeHead(404); res.end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`FA3 static: http://127.0.0.1:${port}${base}`));
