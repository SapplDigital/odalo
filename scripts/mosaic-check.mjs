// Live check of the service mosaic: screenshots at rest / each tile expanded, plus frame-by-frame tiling,
// flicker and rapid-movement checks. Prereq: dev or preview server on BASE_URL (default http://localhost:4321).
// Windows: CHROMIUM_PATH can point to Edge; falls back to the Edge channel.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const OUT = fileURLToPath(new URL('../docs/review/mosaic/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
await ctx.addInitScript(() => { try { localStorage.setItem('odalo.cookies', 'essential'); } catch {} });
const p = await ctx.newPage();
await p.goto(`${BASE}/en/`, { waitUntil: 'networkidle' });
await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const m = document.querySelector('[data-mosaic]'); scrollTo(0, m.getBoundingClientRect().top + scrollY - 96); });
await p.waitForTimeout(600);
const mosaic = p.locator('[data-mosaic]');
const box = await mosaic.boundingBox();
const shot = (name) => p.screenshot({ path: join(OUT, `${name}.png`), clip: { x: box.x - 10, y: box.y - 10, width: box.width + 20, height: box.height + 20 } });
const ids = ['web', 'local', 'video', 'ads'];
const rest = { web: [0.25, 0.25], local: [0.8, 0.25], video: [0.2, 0.75], ads: [0.8, 0.75] };
const at = ([fx, fy]) => [box.x + box.width * fx, box.y + box.height * fy];

// Samples tile rects every frame; reports the worst coverage error (gap/overlap) in px.
await p.evaluate(() => {
  window.__tiling = { worst: 0, frames: 0, heightDrift: 0 };
  const m = document.querySelector('[data-mosaic]');
  const h0 = m.getBoundingClientRect().height;
  const tick = () => {
    const mr = m.getBoundingClientRect();
    const t = [...m.querySelectorAll('[data-tile]')].map((e) => e.getBoundingClientRect());
    const errs = [
      Math.abs(t[0].right - t[1].left), Math.abs(t[2].right - t[3].left),          // shared vertical edges
      Math.abs(t[0].bottom - t[2].top), Math.abs(t[1].bottom - t[3].top),          // shared horizontal edges (each column)
      Math.abs(t[0].left - mr.left), Math.abs(t[1].right - mr.right), Math.abs(t[2].left - mr.left), Math.abs(t[3].right - mr.right),
      Math.abs(t[0].top - mr.top), Math.abs(t[3].bottom - mr.bottom),
      // top row tiles share one height, bottom row tiles share one height
      Math.abs(t[0].height - t[1].height), Math.abs(t[2].height - t[3].height),
    ];
    window.__tiling.worst = Math.max(window.__tiling.worst, ...errs);
    window.__tiling.heightDrift = Math.max(window.__tiling.heightDrift, Math.abs(mr.height - h0));
    window.__tiling.frames++;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

await p.mouse.move(box.x - 60, box.y + 5);
await p.waitForTimeout(500);
await shot('rest');
const results = {};
for (const id of ids) {
  await p.mouse.move(...at(rest[id]), { steps: 8 });
  await p.waitForTimeout(800);
  results[`active-${id}`] = await mosaic.getAttribute('data-active');
  results[`rects-${id}`] = await p.evaluate(() => [...document.querySelectorAll('[data-mosaic] [data-tile]')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  await shot(`active-${id}`);
}
// direct switching between every pair, fast
for (const a of ids) for (const b of ids) if (a !== b) {
  await p.mouse.move(...at(rest[a]), { steps: 3 });
  await p.waitForTimeout(220);
  await p.mouse.move(...at(rest[b]), { steps: 3 });
  await p.waitForTimeout(220);
}
// rapid zig-zag across all tiles
for (let i = 0; i < 40; i++) await p.mouse.move(...at(rest[ids[i % 4]]), { steps: 2 });
await p.waitForTimeout(700);
// pointer exit
await p.mouse.move(box.x + box.width / 2, box.y - 80, { steps: 5 });
await p.waitForTimeout(900);
results.afterExit = await mosaic.getAttribute('data-active');

// flicker: park the pointer on the resting vertical edge of the top row while a tile is active
let changes = 0;
await p.evaluate(() => { window.__changes = 0; new MutationObserver(() => window.__changes++).observe(document.querySelector('[data-mosaic]'), { attributes: true, attributeFilter: ['data-active'] }); });
await p.mouse.move(...at([0.25, 0.2]), { steps: 6 });
await p.waitForTimeout(600);
const edgeX = box.x + box.width * 0.5833;
for (const dx of [-14, 0, 14, 0, -20, 20, 0]) { await p.mouse.move(edgeX + dx, box.y + box.height * 0.2, { steps: 2 }); await p.waitForTimeout(500); }
await p.waitForTimeout(800);
changes = await p.evaluate(() => window.__changes);
results.edgeChanges = changes;
results.tiling = await p.evaluate(() => window.__tiling);
console.log(JSON.stringify(results, null, 1));
await browser.close();
