// Entry sequence of the decorative accent: frames at 0, 0.3, 0.7, 1.1, 1.6, 2.2 s after the section enters (EN, 1440 and 390), assembled into a contact sheet.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const out = path.resolve('docs/review/process-mosaic/evidence');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ channel: 'msedge' });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4322/en/', { waitUntil: 'networkidle' });
  const top = await page.evaluate(() => document.querySelector('#process .steps').getBoundingClientRect().top + scrollY);
  const t0 = Date.now(); const bars = [];
  await page.evaluate(([y, hh]) => scrollTo({ top: y - hh * 0.15, behavior: 'instant' }), [top, h]);
  let i = 0;
  for (const t of [0, 300, 700, 1100, 1600, 2300]) {
    await sleep(Math.max(0, t - (Date.now() - t0)));
    bars.push(await page.evaluate(() => [...document.querySelectorAll('#process .step')].map((s) => Math.round(new DOMMatrix(getComputedStyle(s, '::after').transform).a * 100) / 100)));
    await page.screenshot({ path: path.join(out, `_accent-${w}-${i++}.png`) });
  }
  console.log(w, JSON.stringify(bars));
  await ctx.close();
}
await b.close();
