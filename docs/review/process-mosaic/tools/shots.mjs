// Process section screenshots. Usage: node shots.mjs <baseUrl> <outDir>   (EN/ES/DE x 1440, 1024, 834, 390, 320; 390 and 320 also at 200% root font)
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
for (const lang of ['en', 'es', 'de']) for (const [w, h, pct] of [[1440, 900, 100], [1024, 768, 100], [834, 1112, 100], [390, 844, 100], [320, 700, 100], [390, 844, 200], [320, 700, 200]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${lang}/`, { waitUntil: 'networkidle' });
  if (pct === 200) await page.addStyleTag({ content: 'html{font-size:200% !important}' });
  await page.evaluate(async () => { const el = document.querySelector('#process'); for (let y = 0; y < el.getBoundingClientRect().height + 200; y += 300) { scrollTo(0, el.getBoundingClientRect().top + scrollY + y - 100); await new Promise((r) => setTimeout(r, 100)); } });
  await sleep(1800);
  const clip = await page.evaluate(() => { const r = document.querySelector('#process').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height }; });
  await page.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-process.png`), fullPage: true, clip });
  await ctx.close();
}
await b.close();
