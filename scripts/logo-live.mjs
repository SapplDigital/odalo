// Live check of the supplied odalo animation in the header: records the real sequence, verifies the 29 pieces never change
// (points, colours, ids), captures a still of every arrangement and the header at four widths, plus controls/reduced motion/no-JS.
// Prereq: server on BASE_URL (default http://localhost:4321). Windows: uses the Edge channel unless CHROMIUM_PATH is set.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mosaicData } from '../src/mosaic/odalo/odalo-mosaic.mjs';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const OUT = fileURLToPath(new URL('../docs/review/odalo-logo/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'msedge' });
const results = {};
const open = async (opts = {}, path = '/en/') => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  await ctx.addInitScript(() => { try { localStorage.setItem('odalo.cookies', 'essential'); } catch {} });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await page.waitForSelector('.hdr__logo .odalo-mosaic-svg');
  return { ctx, page };
};
const pieces = (page) => page.evaluate(() => [...document.querySelectorAll('.hdr__logo [data-piece]')].map((g) => ({ id: +g.dataset.piece, points: g.querySelector('polygon').getAttribute('points'), fill: g.querySelector('polygon').getAttribute('fill') })));
const expected = mosaicData.tiles.map((t) => ({ id: t.id, points: t.points.map(([x, y]) => `${x * 50},${y * 50}`).join(' '), fill: t.color }));

// 1. the real sequence, in real time, with piece integrity checked every state
{
  const { ctx, page } = await open();
  results.pieceCount = (await pieces(page)).length;
  await page.evaluate(() => { window.__states = []; document.querySelector('.hdr__logo [data-odalo-logo]').addEventListener('odalo:statechange', (e) => window.__states.push(e.detail.state)); });
  const hdrBox = await page.locator('[data-header]').boundingBox(), logoBox = await page.locator('.hdr__logo').boundingBox();
  const lb = await page.locator('.hdr__logo [data-odalo-logo]').boundingBox();
  const clip = { x: Math.max(0, lb.x - 20), y: 0, width: lb.width + 60, height: hdrBox.height + 60 };
  let n = 0, last = 0;
  const t0 = Date.now();
  const stills = {};
  while (Date.now() - t0 < 36000 && (await page.evaluate(() => window.__states.length)) < 10) {
    const states = await page.evaluate(() => window.__states);
    if (states.length > last) { last = states.length; const s = states.at(-1); if (!stills[s]) { stills[s] = true; await page.waitForTimeout(150); await page.screenshot({ path: join(OUT, `state-${s}.png`), clip }); } }
    await page.waitForTimeout(100); n++;
  }
  results.sequence = await page.evaluate(() => window.__states);
  const after = await pieces(page);
  results.piecesUnchanged = JSON.stringify(after) === JSON.stringify(expected);
  const hdr2 = await page.locator('[data-header]').boundingBox(), logo2 = await page.locator('.hdr__logo').boundingBox();
  results.headerStable = hdrBox.height === hdr2.height && logoBox.width === logo2.width && logoBox.height === logo2.height;
  await ctx.close();
}
// 2. pause control, navigation
{
  const { ctx, page } = await open({}, '/en/plans/');
  const btn = page.locator('.hdr__pause');
  results.pauseVisible = await btn.isVisible();
  await btn.click();
  results.pausedLabel = await btn.getAttribute('aria-label');
  const s0 = await page.evaluate(() => document.querySelector('.hdr__logo [data-piece="1"]').getAttribute('transform'));
  await page.waitForTimeout(4500);
  results.stayedPut = s0 === (await page.evaluate(() => document.querySelector('.hdr__logo [data-piece="1"]').getAttribute('transform')));
  await btn.click(); results.resumedLabel = await btn.getAttribute('aria-label');
  await page.locator('.hdr__logo').click(); await page.waitForURL('**/en/'); results.navigation = true;
  await ctx.close();
}
// 3. reduced motion, no JS, widths
{
  const { ctx, page } = await open({ reducedMotion: 'reduce' });
  await page.waitForTimeout(5000);
  results.reducedMotion = { pauseHidden: !(await page.locator('.hdr__pause').isVisible()), stillWord: (await page.evaluate(() => document.querySelector('[data-odalo-logo]').getAttribute('class'))).includes('is-mounted') };
  await ctx.close();
  const ctx2 = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage(); await p2.goto(`${BASE}/en/`);
  results.noJsFallbackText = (await p2.locator('.hdr__logo .logo__fallback').innerText()).trim();
  await p2.screenshot({ path: join(OUT, 'header-nojs.png'), clip: { x: 0, y: 0, width: 1440, height: 110 } });
  await ctx2.close();
}
for (const w of [1440, 834, 390, 320]) {
  const { ctx, page } = await open({ viewport: { width: w, height: 700 } });
  const lb = await page.locator('.hdr__logo').boundingBox(), hb = await page.locator('[data-header]').boundingBox();
  results[`header.${w}`] = { logo: `${Math.round(lb.width)}x${Math.round(lb.height)}`, header: Math.round(hb.height), overflowX: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) };
  await page.screenshot({ path: join(OUT, `header-${w}.png`), clip: { x: 0, y: 0, width: w, height: 130 } });
  await ctx.close();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();
