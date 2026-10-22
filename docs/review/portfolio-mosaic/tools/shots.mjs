// Portfolio screenshots. Usage: node shots.mjs <baseUrl> <outDir>
// Home work section, work index, and the two-project related-work variant (video and advertising service pages), EN/ES/DE x 1440, 1024, 834, 390, 320.
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
const sizes = [[1440, 900], [1024, 768], [834, 1112], [390, 844], [320, 700]];
const targets = [['home', '/', '#work'], ['index', '/work/', '#projects'], ['related-video', '/services/video/', '#related-work'], ['related-ads', '/services/ads/', '#related-work']];
for (const lang of ['en', 'es', 'de']) for (const [w, h] of sizes) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
  const page = await ctx.newPage();
  for (const [name, p, sel] of targets) {
    if ((name.startsWith('related') && lang !== 'en' && w !== 1440 && w !== 390) ) continue;
    await page.goto(`${BASE}/${lang}${p}`, { waitUntil: 'networkidle' });
    // load every lazy image, then settle
    await page.evaluate(async (sel) => { const el = document.querySelector(sel); el.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 200)); for (let y = 0; y < el.offsetHeight; y += 400) { scrollBy(0, 400); await new Promise((r) => setTimeout(r, 80)); } }, sel);
    await page.waitForFunction((sel) => [...document.querySelectorAll(sel + ' img')].every((i) => i.complete && i.naturalWidth > 0), sel, { timeout: 8000 }).catch(() => {});
    await sleep(400);
    // full-page clip: an element screenshot of a tall section on a phone renders lazy tiles blank
    const bb = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height }; }, sel);
    await page.screenshot({ path: path.join(out, `${lang}-${w}-${name}.png`), fullPage: true, clip: bb });
  }
  await ctx.close();
}
await b.close();
