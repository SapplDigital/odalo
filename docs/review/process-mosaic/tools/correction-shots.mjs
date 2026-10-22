// 14A evidence. "before" re-creates the previous rectangular ::after bars on the same page (injected CSS); "after" is the shipped background-painted accent.
// Corner crops (top-left of 01, bottom-right of 04) mid-draw and finished; full desktop/phone states; reduced motion; no JavaScript; 320 px at 200% text.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const out = path.resolve('docs/review/process-mosaic/correction');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OLD = `.step{background-image:none!important;transition:none!important}.step::after{content:'';position:absolute;left:0;right:0;bottom:0;height:6px;background:var(--acc);transform-origin:left;transform:scaleX(var(--s,1));pointer-events:none}`;
const b = await chromium.launch({ channel: 'msedge' });
const corner = async (page, tag, n) => { const r = await page.evaluate(() => { const s = [...document.querySelectorAll('#process .step')]; const a = s[0].getBoundingClientRect(), z = s[3].getBoundingClientRect(); return { tl: [a.left, a.top], br: [z.right, z.bottom] }; }); const R = 130;
  await page.screenshot({ path: path.join(out, `${tag}-${n}-corner-bottom-right.png`), clip: { x: r.br[0] - R, y: r.br[1] - R, width: R + 20, height: R + 20 } });
  await page.screenshot({ path: path.join(out, `${tag}-${n}-corner-top-left.png`), clip: { x: r.tl[0] - 10, y: r.tl[1] - 10, width: R + 20, height: R + 20 } }); };
for (const tag of ['before', 'after']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  if (tag === 'before') await page.addInitScript((css) => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = css; document.head.append(st); }); }, OLD);
  await page.goto('http://localhost:4322/en/', { waitUntil: 'networkidle' });
  const top = await page.evaluate(() => document.querySelector('#process .steps').getBoundingClientRect().top + scrollY);
  if (tag === 'before') await page.evaluate(() => { const steps = [...document.querySelectorAll('#process .step')]; steps.forEach((s) => s.style.setProperty('--s', '0')); });
  await page.evaluate((y) => scrollTo({ top: y - 140, behavior: 'instant' }), top);
  if (tag === 'before') { await page.evaluate(() => [...document.querySelectorAll('#process .step')].forEach((s) => s.style.setProperty('--s', '1'))); }
  else await sleep(1150); // mid-draw: panels 1 and 2 done, 3 drawing, 4 not started
  await sleep(tag === 'before' ? 300 : 0);
  await page.screenshot({ path: path.join(out, `${tag}-desktop-mid.png`) });
  await corner(page, tag, 'mid');
  await sleep(2400);
  await page.screenshot({ path: path.join(out, `${tag}-desktop-done.png`) });
  await corner(page, tag, 'done');
  await ctx.close();
}
// phone, reduced motion, no JavaScript, enlarged text (after build only)
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4322/de/', { waitUntil: 'networkidle' });
  const top = await page.evaluate(() => document.querySelector('#process .steps').getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo({ top: y - 100, behavior: 'instant' }), top); await sleep(1300);
  await page.screenshot({ path: path.join(out, 'after-phone-mid.png') });
  await sleep(2600);
  await page.screenshot({ path: path.join(out, 'after-phone-done.png') });
  await ctx.close();
  for (const [name, opts, w, h, pct] of [['reduced-motion', { reducedMotion: 'reduce' }, 1440, 900, 100], ['no-javascript', { javaScriptEnabled: false }, 1440, 900, 100], ['narrow-enlarged-320-200', {}, 320, 700, 200]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, ...opts });
    const pg = await c.newPage();
    await pg.goto('http://localhost:4322/en/', { waitUntil: 'networkidle' });
    if (pct === 200) await pg.addStyleTag({ content: 'html{font-size:200% !important}' });
    await pg.evaluate(() => document.querySelector('#process').scrollIntoView({ block: 'start' })); await sleep(2800);
    const clip = await pg.evaluate(() => { const r = document.querySelector('#process').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height }; });
    await pg.screenshot({ path: path.join(out, `after-${name}.png`), fullPage: true, clip });
    await c.close();
  }
}
await b.close();
