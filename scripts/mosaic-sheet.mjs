// Contact sheet of every arrangement of a tile system (+ overlap numbers). Usage: node scripts/mosaic-sheet.mjs hero|header
import { chromium } from '@playwright/test';
import { SHAPES, covers } from '../src/mosaic/shapes.js';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const which = process.argv[2] || 'logo';
const mod = await import(`../src/mosaic/${which}.js`);
const tiles = mod[`${which.toUpperCase()}_TILES`], arrs = mod[`${which.toUpperCase()}_ARRANGEMENTS`];
const OUT = fileURLToPath(new URL('../docs/review/mosaic-system/', import.meta.url));
mkdirSync(OUT, { recursive: true });

function overlapArea(poses, step = 0.04) {
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  for (const t of tiles) { const p = poses[t.id]; const R = 3.2; minx = Math.min(minx, p.x - R); maxx = Math.max(maxx, p.x + R); miny = Math.min(miny, p.y - R); maxy = Math.max(maxy, p.y + R); }
  let over = 0, cover = 0;
  for (let y = miny; y < maxy; y += step) for (let x = minx; x < maxx; x += step) {
    let n = 0;
    for (const t of tiles) if (covers(t.shape, poses[t.id], x, y)) n++;
    if (n) cover++;
    if (n > 1) over++;
  }
  return { overlap: +(over * step * step).toFixed(3), area: +(cover * step * step).toFixed(2) };
}
const svg = (poses, vb) => `<svg viewBox="${vb}" width="520" style="background:#efe7d3;border-radius:8px">${tiles.map((t) => { const p = poses[t.id]; return `<g transform="translate(${p.x} ${p.y}) rotate(${p.r})"><path d="${SHAPES[t.shape].d}" fill="${t.fill}"/></g>`; }).join('')}</svg>`;
const vb = process.argv[3] || '0 0 24 11';
const names = Object.keys(arrs);
const stats = Object.fromEntries(names.map((n) => [n, overlapArea(arrs[n])]));
console.log(JSON.stringify(stats));
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'msedge' });
const p = await browser.newPage({ viewport: { width: 1120, height: 140 + 300 * Math.ceil(names.length / 2) } });
await p.setContent(`<body style="margin:0;padding:16px;font:600 14px sans-serif;background:#f7f9f8;display:grid;grid-template-columns:1fr 1fr;gap:16px">${names.map((n) => `<div><div>${n} — overlap ${stats[n].overlap} u² / area ${stats[n].area}</div>${svg(arrs[n], vb)}</div>`).join('')}</body>`);
await p.screenshot({ path: join(OUT, `${which}-sheet.png`), fullPage: true });
await browser.close();
