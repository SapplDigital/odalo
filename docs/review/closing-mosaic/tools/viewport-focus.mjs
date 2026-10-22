// TRUE viewport screenshots (not stitched) with keyboard focus on the CTA button, the Browser storage summary (closed and open) and a footer link.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const out = path.resolve('docs/review/closing-mosaic/viewport');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ channel: 'msedge' });
const rows = [];
for (const lang of ['en', 'es', 'de']) for (const [w, h, pct] of [[1440, 900, 100], [390, 844, 100], [320, 700, 200]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:4322/${lang}/`, { waitUntil: 'networkidle' });
  if (pct === 200) await page.addStyleTag({ content: 'html{font-size:200% !important}' });
  for (const [name, sel, press] of [['cta', '.fin a.btn', null], ['storage-closed', 'footer details summary', null], ['storage-open', 'footer details summary', 'Enter']]) {
    await page.evaluate((s) => document.querySelector(s).focus(), sel); if (press) await page.keyboard.press(press);
    await sleep(1800);
    const m = await page.evaluate((s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); const hdr = document.querySelector('header').getBoundingClientRect().bottom; return { ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 3, inView: r.top >= hdr - 1 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth, focused: document.activeElement === e }; }, sel);
    rows.push({ lang, w, pct, name, ...m });
    await page.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-${name}.png`) });
    if (press) await page.keyboard.press('Space'); // close again
  }
  await ctx.close();
}
await b.close();
fs.writeFileSync(path.join(out, '_focus-results.json'), JSON.stringify(rows, null, 1));
const bad = rows.filter((r) => !r.ring || !r.inView || !r.focused);
console.log(rows.length, 'focus checks,', bad.length, 'failing', JSON.stringify(bad));
