// Final-composition checks across languages and viewports: no label text outside its surface, no label touching a picture, nothing wider than the viewport,
// every picture inside its surface. Runs the live scene scrolled to p=1 where the viewport allows it, and the static composition otherwise.
// Usage (repo root, preview on 4323): node docs/review/motion-prototype/tools/layout-check.mjs [shotDir]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const BASE = process.env.BASE || 'http://localhost:4323';
const shotDir = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });
const sizes = [[1440, 900], [1280, 720], [1024, 768], [834, 1112], [768, 1024], [414, 896], [390, 844], [360, 740], [320, 568], [320, 700]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'msedge' });
const results = [];
for (const lang of ['en', 'es', 'de']) for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/${lang === 'en' ? 'index' : 'index.' + lang}.html`, { waitUntil: 'networkidle' });
  const mode = await page.evaluate(() => document.documentElement.dataset.proto);
  if (mode === 'live') {
    const y = await page.evaluate(() => window.__odaloProto.scrollFor(1));
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
    await sleep(300);
  } else {
    await page.locator('[data-board]').scrollIntoViewIfNeeded();
  }
  const r = await page.evaluate(() => {
    const rect = (e) => e.getBoundingClientRect();
    const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const problems = [];
    const ids = ['web', 'local', 'video', 'ads'];
    const q = (k, i) => document.querySelector(`[data-piece="${k}"][data-id="${i}"]`);
    const board = rect(document.querySelector('[data-board]'));
    if (document.documentElement.scrollWidth > innerWidth) problems.push(`page scrolls sideways (${document.documentElement.scrollWidth} > ${innerWidth})`);
    for (const id of ids) {
      const plate = rect(q('plate', id)), card = rect(q('card', id)), label = q('label', id);
      const textBox = [...label.children].map(rect).filter((b) => b.height > 0);
      const top = Math.min(...textBox.map((b) => b.top)), bottom = Math.max(...textBox.map((b) => b.bottom));
      const left = Math.min(...textBox.map((b) => b.left)), right = Math.max(...textBox.map((b) => b.right));
      const tb = { left, right, top, bottom };
      const pad = 0.5;
      if (card.left < plate.left - pad || card.right > plate.right + pad || card.top < plate.top - pad || card.bottom > plate.bottom + pad) problems.push(`${id}: picture outside its surface`);
      if (tb.left < plate.left - pad || tb.right > plate.right + pad || tb.top < plate.top - pad || tb.bottom > plate.bottom + pad) problems.push(`${id}: label text outside its surface`);
      if (inter(tb, card) > 1) problems.push(`${id}: label overlaps its picture`);
      for (const o of ids) if (o !== id && inter(tb, rect(q('card', o))) > 1) problems.push(`${id}: label overlaps the ${o} picture`);
    }
    const emblem = rect(document.querySelector('[data-piece="emblem"]'));
    for (const id of ids) {
      const label = q('label', id);
      for (const c of [...label.children]) if (c.getBoundingClientRect().height > 0 && inter(rect(c), emblem) > 1) problems.push(`${id}: emblem touches label text`);
      for (const o of ids) if (inter(rect(q('card', o)), emblem) > 1) problems.push(`emblem overlaps the ${o} picture`);
    }
    // text must be readable: smallest rendered label font size
    const fs = Math.min(...[...document.querySelectorAll('.label *')].filter((e) => e.getBoundingClientRect().height > 0).map((e) => parseFloat(getComputedStyle(e).fontSize)));
    if (fs < 11.5) problems.push(`label text too small (${fs.toFixed(1)}px)`);
    return { problems, board: [Math.round(board.width), Math.round(board.height)], minFont: Math.round(fs * 10) / 10 };
  });
  results.push({ lang, w, h, mode, ...r, errors });
  if (shotDir && ['en', 'de'].includes(lang)) await page.screenshot({ path: path.join(shotDir, `final-${lang}-${w}x${h}-${mode}.png`) });
  await ctx.close();
}
await browser.close();
let bad = 0;
for (const r of results) {
  const flag = r.problems.length || r.errors.length ? 'FAIL' : 'ok  ';
  if (flag === 'FAIL') bad++;
  console.log(`${flag} ${r.lang} ${r.w}x${r.h} ${r.mode} board ${r.board.join('x')} minFont ${r.minFont}px ${[...r.problems, ...r.errors].join(' | ')}`);
}
console.log(`${results.length} combinations, ${bad} failing`);
process.exitCode = bad ? 1 : 0;
