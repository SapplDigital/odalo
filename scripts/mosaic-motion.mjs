// Live verification of the animated logo (header). Deterministic 30 fps run on Playwright's fake clock: samples real tile poses
// every frame, measures overlap along the paths, checks geometry/colour never change, and writes a video + contact sheet + stills.
// Prereq: server on BASE_URL (default http://localhost:4321). Windows: uses the Edge channel unless CHROMIUM_PATH is set.
import { chromium } from '@playwright/test';
import { mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { covers } from '../src/mosaic/shapes.js';
import { LOGO_TILES, LOGO_ARRANGEMENTS, LOGO_SYMBOLS } from '../src/mosaic/logo.js';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const OUT = fileURLToPath(new URL('../docs/review/logo-animation/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'msedge' });
const results = {};
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  await ctx.addInitScript(() => { try { localStorage.setItem('odalo.cookies', 'essential'); } catch {} });
  return { ctx, page: await ctx.newPage() };
};
const overlapOf = (poses, step = 0.08) => {
  let n = 0;
  for (let y = 0; y < 11; y += step) for (let x = 0; x < 24; x += step) { let c = 0; for (const t of LOGO_TILES) if (covers(t.shape, poses[t.id], x, y) && ++c > 1) { n++; break; } }
  return n * step * step;
};
const HANDLE = `document.querySelector('.hdr__logo [data-logo-svg]').__mosaic`;

// 1. inventory / resting overlap, from the same data the page uses
{
  const ids = LOGO_TILES.map((t) => t.id).sort().join();
  results['tiles'] = LOGO_TILES.length;
  results['sameInventoryEveryArrangement'] = Object.fromEntries(Object.entries(LOGO_ARRANGEMENTS).map(([n, a]) => [n, Object.keys(a).sort().join() === ids]));
  results['restOverlap_u2'] = Object.fromEntries(Object.entries(LOGO_ARRANGEMENTS).map(([n, a]) => [n, +overlapOf(a, 0.04).toFixed(3)]));
}

// 2. three full cycles on a fake clock, 30 fps, 4x zoom on the logo
{
  const FPS = 30, STEP = 1000 / FPS;
  const { ctx, page } = await newPage({ deviceScaleFactor: 4 });
  await page.clock.install({ time: 0 });
  await page.goto(`${BASE}/en/`, { waitUntil: 'load' });
  await page.waitForFunction(`${HANDLE}`);
  await page.clock.pauseAt(1000);
  const link = page.locator('.hdr__logo');
  const lb = await link.boundingBox();
  const clip = { x: lb.x - 6, y: lb.y - 6, width: lb.width + 12, height: lb.height + 12 };
  const fp = () => page.evaluate(() => [...document.querySelectorAll('.hdr__logo [data-tile]')].map((g) => g.dataset.tile + g.querySelector('path').getAttribute('d') + g.querySelector('path').getAttribute('fill')).join('|'));
  const fp0 = await fp();
  const jpegs = [], poses = [];
  const grab = async () => { poses.push(await page.evaluate(`(() => { const m = ${HANDLE}; return { cur: m.current, moving: m.moving, poses: m.poses() }; })()`)); jpegs.push(await page.screenshot({ type: 'jpeg', quality: 92, clip })); };
  const run = async (ms) => { for (let t = 0; t < ms; t += STEP) { await page.clock.runFor(STEP); await grab(); } };
  const seenSymbols = [], marks = [];
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(700, 500); await page.clock.runFor(50);
    marks.push(jpegs.length);
    await link.hover();
    await run(4600);                       // out (0.9 + 0.45 s), hold 1.6 s, back (0.9 + 0.45 s)
    seenSymbols.push(poses.slice(marks[i]).map((f) => f.cur).filter((c) => c !== 'wordmark')[0]);
  }
  results['cycleSymbolsInOrder'] = seenSymbols;
  results['endsOnName'] = poses.at(-1).cur === 'wordmark' && !poses.at(-1).moving;
  results['geometryColourUnchanged'] = fp0 === (await fp());
  results['sameTileIdsEveryFrame'] = poses.every((f) => Object.keys(f.poses).length === LOGO_TILES.length);
  results['pathOverlap'] = marks.map((m, i) => { let worst = 0; for (let k = m; k < (marks[i + 1] ?? poses.length); k += 2) worst = Math.max(worst, overlapOf(poses[k].poses)); return { symbol: seenSymbols[i], worstArea_u2: +worst.toFixed(2), pctOfTileArea: +(worst / 49.5 * 100).toFixed(1) }; });
  const FF = process.env.FFMPEG || join(homedir(), 'AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe');
  if (existsSync(FF)) { execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0', '-c:v', 'vp8', '-qmin', '0', '-qmax', '40', '-b:v', '3M', join(OUT, 'logo-animation.webm')], { input: Buffer.concat(jpegs), maxBuffer: 1 << 29 }); results['video'] = 'docs/review/logo-animation/logo-animation.webm'; }
  const sheet = await ctx.newPage(); await sheet.setViewportSize({ width: 1400, height: 800 });
  const picks = []; for (let i = marks[0]; i < marks[0] + 140; i += 7) picks.push(i);
  await sheet.setContent(`<body style="margin:0;background:#f7f9f8;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px">${picks.map((i) => `<div style="font:600 12px sans-serif;color:#203b57">t = ${((i - marks[0]) / FPS).toFixed(2)} s<img style="width:100%;display:block;border:1px solid #ddd" src="data:image/jpeg;base64,${jpegs[i].toString('base64')}"></div>`).join('')}</body>`);
  await sheet.screenshot({ path: join(OUT, 'cycle-sheet.png'), fullPage: true });
  await ctx.close();
}

// 3. every arrangement, in the real header (4x)
{
  const { ctx, page } = await newPage({ deviceScaleFactor: 4 });
  await page.goto(`${BASE}/en/`, { waitUntil: 'load' });
  await page.waitForFunction(`${HANDLE}`);
  const lb = await page.locator('.hdr__logo').boundingBox();
  for (const name of ['wordmark', ...LOGO_SYMBOLS]) {
    await page.evaluate(`${HANDLE}.setNow('${name}')`);
    await page.screenshot({ path: join(OUT, `state-${name}.png`), clip: { x: lb.x - 8, y: lb.y - 8, width: lb.width + 16, height: lb.height + 16 } });
  }
  await ctx.close();
}

// 4. interactions, reduced motion, responsive
{
  const { ctx, page } = await newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`${BASE}/en/plans/`, { waitUntil: 'load' });
  await page.waitForFunction(`${HANDLE}`);
  const link = page.locator('.hdr__logo'), lb = await link.boundingBox(), hb = await page.locator('[data-header]').boundingBox();
  for (let i = 0; i < 16; i++) { await page.mouse.move(700, 500); await page.mouse.move(lb.x + 30, lb.y + 20); await page.waitForTimeout(50); }
  await page.waitForFunction(`${HANDLE}.current === 'wordmark' && !${HANDLE}.moving`, null, { timeout: 10000 });
  results['rapidHover'] = { errors: errs, endedOnName: true };
  const lb2 = await link.boundingBox(), hb2 = await page.locator('[data-header]').boundingBox();
  results['dimensionsStable'] = lb.width === lb2.width && lb.height === lb2.height && hb.height === hb2.height;
  await link.click(); await page.waitForURL('**/en/'); results['navigation'] = true;
  await ctx.close();
}
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' });
  await page.goto(`${BASE}/en/`, { waitUntil: 'load' });
  await page.waitForFunction(`${HANDLE}`);
  const lb = await page.locator('.hdr__logo').boundingBox();
  await page.mouse.move(lb.x + 30, lb.y + 20); await page.waitForTimeout(500);
  results['reducedMotionStaysName'] = (await page.evaluate(`${HANDLE}.current`)) === 'wordmark';
  await ctx.close();
}
for (const w of [1440, 834, 390, 320]) {
  const { ctx, page } = await newPage({ viewport: { width: w, height: 700 } });
  await page.goto(`${BASE}/en/`, { waitUntil: 'load' });
  await page.waitForFunction(`${HANDLE}`);
  const lb = await page.locator('.hdr__logo').boundingBox();
  results[`header.${w}`] = { logo: `${Math.round(lb.width)}x${Math.round(lb.height)}`, horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) };
  await page.screenshot({ path: join(OUT, `header-${w}.png`), clip: { x: 0, y: 0, width: w, height: 110 } });
  await ctx.close();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();
