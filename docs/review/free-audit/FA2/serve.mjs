// Tiny task-owned static server for the FA2 prototype. Serves the REPOSITORY ROOT read-only (fonts + brand svg live there).
// Usage: node docs/review/free-audit/FA2/serve.mjs [port]   (default 4391). Logs every request; answers GET/HEAD only (POST => 405, so a
// real submission is impossible even by accident). Stop with Ctrl+C / by killing the process you started.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const port = Number(process.argv[2] || 4391);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' };

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { allow: 'GET, HEAD' }); return res.end('Prototype is read-only'); }
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const file = join(repo, p);
  if (!file.startsWith(repo)) { res.writeHead(403); return res.end(); }
  try {
    if (!(await stat(file)).isFile()) throw 0;
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`FA2 prototype: http://127.0.0.1:${port}/docs/review/free-audit/FA2/index.html`));
