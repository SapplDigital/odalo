// States at p = 0, .25, .5, .75, 1 by REAL scrolling (not by calling the renderer), plus final layouts, reduced-motion and no-JS views.
// Usage (repo root, preview running on 4323): node docs/review/motion-prototype/tools/states.mjs [outDir] [only]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const BASE = process.env.BASE || 'http://localhost:4323';
const out = path.resolve(process.argv[2] || 'docs/review/motion-prototype/evidence/states');
const only = process.argv[3];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const want = (n) => !only || n.includes(only);

async function scrollTo(page, p) {
  const y = await page.evaluate((p) => window.__odaloProto.scrollFor(p), p);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  await sleep(250);
  return page.evaluate(() => window.__odaloProto.p);
}
for (const [name, vp, mobile] of [['desktop', { width: 1440, height: 900 }, false], ['phone', { width: 390, height: 844 }, true]]) {
  if (!want(name)) continue;
  const ctx = await browser.newContext({ viewport: vp, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const got = await scrollTo(page, p);
    await page.screenshot({ path: path.join(out, `${name}-p${String(Math.round(p * 100)).padStart(3, '0')}.png`) });
    console.log(name, p, '->', got.toFixed(3));
  }
  await ctx.close();
}
await browser.close();
