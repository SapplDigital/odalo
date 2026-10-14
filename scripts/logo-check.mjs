// Logo QA: (1) seam scan — renders the symbol at many sizes / device scale factors on magenta and counts
// any magenta pixel inside the silhouette; (2) writes docs/brand/before-after.png and light/dark/favicon previews.
// CONTROL=1 scans the legacy symbol instead (proves the scan detects gaps). Windows: uses the Edge channel unless CHROMIUM_PATH is set.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUT = join(ROOT, 'docs/brand');
mkdirSync(OUT, { recursive: true });
const read = (f) => readFileSync(join(ROOT, 'public', f), 'utf8');
const sym = read(process.env.CONTROL ? 'brand/legacy/odalo-symbol-legacy.svg' : 'brand/odalo-symbol.svg');
const fav = read('favicon.svg');
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'msedge' });

// ---- 1. seam scan ----
const sizes = [16, 24, 32, 38, 44, 48, 63, 64, 100.7, 128, 333.3];
const scales = [1, 1.25, 1.5, 2, 3];
let worst = 0; const rows = [];
for (const dsf of scales) {
  const ctx = await browser.newContext({ deviceScaleFactor: dsf, viewport: { width: 500, height: 500 } });
  const p = await ctx.newPage();
  for (const [name, svg] of [['symbol', sym], ['favicon(rounded corners excluded)', fav]]) {
    for (const s of sizes) {
      await p.setContent(`<body style="margin:0;background:#ff00ff"><div style="position:absolute;left:10.3px;top:10.7px;width:${s}px;height:${s}px">${svg.replace('<svg ', `<svg width="${s}" height="${s}" `)}</div></body>`);
      const buf = await p.screenshot({ clip: { x: 0, y: 0, width: Math.ceil(s) + 24, height: Math.ceil(s) + 24 }, type: 'png' });
      const r = await p.evaluate(async ({ b64, s, dsf }) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        const inset = Math.max(1, Math.round(s * dsf * 0.12));
        const x0 = Math.round(10.3 * dsf) + inset, y0 = Math.round(10.7 * dsf) + inset, x1 = Math.round((10.3 + s) * dsf) - inset, y1 = Math.round((10.7 + s) * dsf) - inset;
        let n = 0;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * c.width + x) * 4; if (d[i] > 200 && d[i + 1] < 120 && d[i + 2] > 200) n++; } // magenta-ish
        return n;
      }, { b64: buf.toString('base64'), s, dsf });
      worst = Math.max(worst, r);
      if (r) rows.push(`${name} ${s}px @${dsf}x: ${r} magenta px`);
    }
  }
  await ctx.close();
}
console.log(rows.length ? rows.join('\n') : 'seam scan: 0 magenta pixels inside the silhouette at all sizes/scales');

// ---- 2. before/after + treatments ----
const legacy = readFileSync(join(ROOT, 'public/brand/legacy/odalo-symbol-legacy.svg'), 'utf8');
const logoL = read('brand/odalo-logo.svg'), logoD = read('brand/odalo-logo-dark.svg'), symD = read('brand/odalo-symbol-dark.svg');
const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: 1100, height: 700 } });
const p = await ctx.newPage();
const font = readFileSync(join(ROOT, 'node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2')).toString('base64');
const wm = (svg) => svg.replace('<svg ', '<svg width="440" ');
await p.setContent(`<style>@font-face{font-family:Outfit;font-weight:100 900;src:url(data:font/woff2;base64,${font})}
body{margin:0;font:600 14px Outfit,sans-serif;color:#203b57;background:#f7f9f8}
.g{display:grid;grid-template-columns:1fr 1fr;gap:0}.c{padding:28px 36px;display:grid;gap:14px;align-content:start}.dark{background:#203b57;color:#f7f9f8}
.row{display:flex;gap:28px;align-items:center}h2{margin:0;font:700 12px Outfit;letter-spacing:.14em;text-transform:uppercase;opacity:.7}
.sm{display:flex;gap:18px;align-items:end}</style>
<div class=g>
 <div class=c><h2>Before</h2><div class=row><div style="width:190px">${legacy.replace('<svg ', '<svg width="190" ')}</div></div><div class=sm>${[16,24,32,48].map((n)=>`<div>${legacy.replace('<svg ', `<svg width="${n}" `)}</div>`).join('')}</div></div>
 <div class=c><h2>After — connected mosaic</h2><div class=row><div style="width:190px">${sym.replace('<svg ', '<svg width="190" ')}</div></div><div class=sm>${[16,24,32,48].map((n)=>`<div>${sym.replace('<svg ', `<svg width="${n}" `)}</div>`).join('')}</div></div>
 <div class=c><h2>Horizontal — light</h2>${wm(logoL)}</div>
 <div class="c dark"><h2>Horizontal — dark</h2>${wm(logoD)}<div class=sm>${[24,48,96].map((n)=>`<div>${symD.replace('<svg ', `<svg width="${n}" `)}</div>`).join('')}</div></div>
 <div class=c><h2>Favicon 16 / 32 / 64</h2><div class=sm>${[16,32,64].map((n)=>`<div>${fav.replace('<svg ', `<svg width="${n}" `)}</div>`).join('')}</div></div>
</div>`);
await p.waitForTimeout(400);
await p.screenshot({ path: join(OUT, 'before-after.png'), fullPage: true });
await browser.close();
console.log('wrote docs/brand/before-after.png; worst seam count =', worst);
process.exit(worst ? 1 : 0);
