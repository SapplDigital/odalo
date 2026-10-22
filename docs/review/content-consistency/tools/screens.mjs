// Evidence captures (true viewport screenshots): hero CTA, audit page, audit errors, simulated confirmation, revised FAQs. EN/ES/DE at 1440, 390, and 320 at 200% root font.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const out = path.resolve('docs/review/content-consistency/screens');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ channel: 'msedge' });
for (const lang of ['en', 'es', 'de']) for (const [w, h, pct] of [[1440, 900, 100], [390, 844, 100], [320, 700, 200]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  const zoom = () => pct === 200 && page.addStyleTag({ content: 'html{font-size:200% !important}' });
  await page.goto(`http://localhost:4322/${lang}/`, { waitUntil: 'networkidle' }); await zoom(); await sleep(400);
  await page.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-1-hero-cta.png`) });
  await page.goto(`http://localhost:4322/${lang}/audit/`, { waitUntil: 'networkidle' }); await zoom(); await sleep(300);
  await page.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-2-audit-top.png`) });
  await page.locator('[data-submit]').click(); await sleep(500);
  await page.evaluate(() => document.querySelector('[data-summary]').scrollIntoView({ block: 'center' })); await sleep(900);
  await page.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-3-audit-errors.png`) });
  await page.fill('#f-name', 'Sample Name'); await page.fill('#f-email', 'sample@example.com'); await page.fill('#f-business', 'Sample Studio'); await page.fill('#f-need', 'Sample need'); await page.check('#f-privacy');
  await page.locator('[data-submit]').click(); await page.waitForSelector('[data-result]'); await sleep(1500);
  await page.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-4-simulated-confirmation.png`) });
  await page.goto(`http://localhost:4322/${lang}/`, { waitUntil: 'networkidle' }); await zoom();
  await page.evaluate(() => { const f = document.querySelector('#faq'); f.scrollIntoView({ block: 'start' }); f.querySelectorAll('details').forEach((d) => (d.open = true)); }); await sleep(1000);
  await page.screenshot({ path: path.join(out, `${lang}-${w}-${pct}-5-faq-open.png`) });
  await ctx.close();
}
await b.close();
