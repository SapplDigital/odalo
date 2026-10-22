// About screenshots (section/viewport captures of rendered content). Usage: node shots.mjs <baseUrl> <outDir>
// Home #about and /about/ in EN/ES/DE at 1440, 1024, 834, 390, 320; plus 390 and 320 at 200% root font.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const [BASE, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ channel: 'msedge' });
const cfgs = [[1440, 900, 100], [1024, 768, 100], [834, 1112, 100], [390, 844, 100], [320, 700, 100], [390, 844, 200], [320, 700, 200]];
for (const lang of ['en', 'es', 'de']) for (const [w, h, pct] of cfgs) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  for (const [name, p, sel] of [['home', '/', '#about'], ['page', '/about/', 'main']]) {
    if (pct === 200 && name === 'page' && lang === 'es') continue;
    await page.goto(`${BASE}/${lang}${p}`, { waitUntil: 'networkidle' });
    if (pct === 200) await page.addStyleTag({ content: 'html{font-size:200% !important}' });
    await page.evaluate(async (sel) => { const el = document.querySelector(sel); for (let y = 0; y < el.getBoundingClientRect().height; y += 400) { scrollTo(0, el.getBoundingClientRect().top + scrollY + y); await new Promise((r) => setTimeout(r, 80)); } }, sel);
    await sleep(400);
    const clip = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: Math.min(r.height, 6000) }; }, sel);
    await page.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-${name}.png`), fullPage: true, clip });
  }
  await ctx.close();
}
await b.close();
