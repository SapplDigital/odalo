// Screenshots through the services section by REAL scrolling. Usage: node shoot.mjs <outDir> <lang> <width>x<height> [touch]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const BASE = process.env.BASE || 'http://localhost:4322';
const [out, lang = 'en', size = '1440x900', touch] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ channel: 'msedge' });
const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: !!touch, isMobile: !!touch });
await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
const page = await ctx.newPage();
await page.goto(`${BASE}/${lang}/`, { waitUntil: 'networkidle' });
const top = await page.evaluate(() => document.querySelector('[data-mosaic]').getBoundingClientRect().top + scrollY);
const steps = touch ? [-0.7, -0.45, -0.2, 0.1, 0.4, 0.8, 1.3, 1.9, 2.5] : [-0.95, -0.7, -0.5, -0.3, -0.1, 0.2, 0.5, 0.8];
let i = 0;
for (const f of steps) {
  await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.max(0, top + f * h));
  await sleep(350);
  await page.screenshot({ path: path.join(out, `${lang}-${w}-s${String(i++).padStart(2, '0')}.png`) });
}
await b.close();
