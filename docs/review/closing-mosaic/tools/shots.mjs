// Closing CTA + footer captures. Usage: node shots.mjs <baseUrl> <outDir> [openDisclosure]
// Pages: home, plans, about, a service, a case study, audit (footer only). EN/ES/DE x 1440, 1024, 834, 390, 320; 390/320 also at 200% root font.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const [BASE, out, open] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ channel: 'msedge' });
const pages = [['home', ''], ['plans', 'plans/'], ['about', 'about/'], ['service', 'services/web/'], ['case', 'work/sample-hotel/'], ['audit', 'audit/']];
for (const lang of ['en', 'es', 'de']) for (const [w, h, pct] of [[1440, 900, 100], [1024, 768, 100], [834, 1112, 100], [390, 844, 100], [320, 700, 100], [390, 844, 200], [320, 700, 200]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  for (const [name, p] of pages) {
    if (name !== 'home' && lang !== 'en' && !(name === 'about' || (w === 1440 || w === 390) && pct === 100)) continue;
    if (name !== 'home' && pct === 200 && lang !== 'de') continue;
    await page.goto(`${BASE}/${lang}/${p}`, { waitUntil: 'networkidle' });
    if (pct === 200) await page.addStyleTag({ content: 'html{font-size:200% !important}' });
    if (open) await page.evaluate(() => { document.querySelector('footer details').open = true; });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await sleep(350);
    const clip = await page.evaluate(() => { const s = document.querySelector('.fin') || document.querySelector('footer'); const r = s.getBoundingClientRect(); const f = document.querySelector('footer').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: f.bottom + scrollY - (r.top + scrollY) }; });
    await page.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-${name}.png`), fullPage: true, clip });
  }
  await ctx.close();
}
await b.close();
