import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const b = await chromium.launch({ channel: 'msedge' });
for (const [w, h] of [[1024, 440], [390, 460]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
  const page = await ctx.newPage();
  await page.goto('http://localhost:4322/en/', { waitUntil: 'networkidle' });
  const st = await page.evaluate(() => document.querySelector('[data-mosaic]').classList.contains('is-assembling'));
  await page.locator('#services').scrollIntoViewIfNeeded();
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: `docs/review/services-motion-integration/states/short-screen-${w}x${h}.png` });
  console.log(w, h, 'assembling:', st);
  await ctx.close();
}
await b.close();
