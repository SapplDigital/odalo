// First views with FRESH storage (a first visit): EN/ES/DE x 1440, 390, 320, at 100% and 200% root font. Usage: node firstviews.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const [BASE, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: 'msedge' });
const rows = [];
for (const lang of ['en', 'es', 'de']) for (const [w, h] of [[1440, 900], [390, 844], [320, 700]]) for (const pct of [100, 200]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${lang}/`, { waitUntil: 'networkidle' });
  if (pct === 200) await page.addStyleTag({ content: 'html{font-size:200% !important}' });
  await page.waitForTimeout(600);
  // anything fixed or sticky that covers part of the first view (other than the header)?
  const covers = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 40 && r.height > 40 && !e.closest('header'); }).map((e) => `${e.tagName.toLowerCase()}.${e.className}`.slice(0, 40)));
  rows.push({ lang, w, pct, fixedOverlays: covers });
  await page.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-first-view.png`) });
  await ctx.close();
}
await b.close();
fs.writeFileSync(path.join(out, '_overlays.json'), JSON.stringify(rows, null, 1));
console.log('with a fixed overlay:', rows.filter((r) => r.fixedOverlays.length).length, 'of', rows.length);
