// True-viewport screenshots of important corrected and worst-case states.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const out = path.resolve('docs/review/final-ui-qa/screens');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ channel: 'msedge' });
const mk = async (w, h, pct = 100) => { const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 }); const page = await ctx.newPage(); page._pct = pct; return { ctx, page }; };
const go = async (page, url) => { await page.goto('http://localhost:4322' + url, { waitUntil: 'networkidle' }); if (page._pct === 200) await page.addStyleTag({ content: 'html{font-size:200% !important}' }); await sleep(300); };
// 1. German audit error state at 320 / 200% (the corrected overflow)
{ const { ctx, page } = await mk(320, 700, 200); await go(page, '/de/audit/'); await page.locator('[data-submit]').click(); await sleep(500); await page.evaluate(() => document.querySelector('#e-privacy').scrollIntoView({ block: 'center' })); await sleep(900); await page.screenshot({ path: path.join(out, 'de-320-200-audit-errors-corrected.png') }); await ctx.close(); }
// 2. form focus: email field focused by keyboard at 390 (whole control in view)
{ const { ctx, page } = await mk(390, 844); await go(page, '/en/audit/'); for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); await sleep(400); } await sleep(900); await page.screenshot({ path: path.join(out, 'en-390-audit-keyboard-focus-email.png') }); await ctx.close(); }
// 3. German legal title wrapping at 390 and 320
for (const w of [390, 320]) { const { ctx, page } = await mk(w, 420); await go(page, '/de/privacy/'); await page.screenshot({ path: path.join(out, `de-${w}-privacy-title-hyphen.png`) }); await ctx.close(); }
// 4. open states: mobile menu, pricing comparison, services Explore panel with focus, footer disclosure (390)
{ const { ctx, page } = await mk(390, 844); await go(page, '/en/'); await page.locator('.hdr__toggle').click(); await sleep(500); await page.screenshot({ path: path.join(out, 'en-390-menu-open.png') });
  await page.keyboard.press('Escape'); await sleep(300);
  await page.locator('[data-explore="video"]').scrollIntoViewIfNeeded(); await page.locator('[data-explore="video"]').focus(); await page.keyboard.press('Enter'); await sleep(1200); await page.screenshot({ path: path.join(out, 'en-390-services-explore-open-focus.png') });
  await page.evaluate(() => { const d = document.querySelector('footer details'); d.open = true; d.scrollIntoView({ block: 'center' }); }); await sleep(900); await page.screenshot({ path: path.join(out, 'en-390-footer-storage-open.png') });
  await go(page, '/de/plans/'); await page.evaluate(() => { const d = document.querySelector('#plans details, details'); d.open = true; d.scrollIntoView({ block: 'start' }); }); await sleep(1000); await page.screenshot({ path: path.join(out, 'de-390-plans-comparison-open.png') });
  await ctx.close(); }
// 5. worst-case enlarged text: DE home hero at 320 / 200%
{ const { ctx, page } = await mk(320, 700, 200); await go(page, '/de/'); await page.screenshot({ path: path.join(out, 'de-320-200-home-worst-case.png') }); await ctx.close(); }
await b.close();
