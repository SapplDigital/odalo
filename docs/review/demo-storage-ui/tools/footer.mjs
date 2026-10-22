// Footer disclosure closed and open, EN/ES/DE at 1440, 390, 320 (200% too at 320). Usage: node footer.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const [BASE, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: 'msedge' });
const bad = [];
for (const lang of ['en', 'es', 'de']) for (const [w, h, pct] of [[1440, 900, 100], [390, 844, 100], [320, 700, 100], [320, 700, 200]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${lang}/`, { waitUntil: 'networkidle' });
  if (pct === 200) await page.addStyleTag({ content: 'html{font-size:200% !important}' });
  const f = page.locator('footer');
  await f.scrollIntoViewIfNeeded();
  await page.locator('footer details summary').click();
  await page.waitForTimeout(300);
  const m = await page.evaluate(() => { const p = document.querySelector('footer details p').getBoundingClientRect(); return { right: p.right <= innerWidth + 1, left: p.left >= -1, sw: document.documentElement.scrollWidth <= innerWidth }; });
  if (!(m.right && m.left && m.sw)) bad.push(`${lang} ${w}/${pct}`);
  await f.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-footer-open.png`) });
  await ctx.close();
}
await b.close();
console.log('overflowing disclosure layouts:', bad.length, bad.join(', '));
