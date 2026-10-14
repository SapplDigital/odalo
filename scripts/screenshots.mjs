// Captures the visual review set (Document 06 deliverables) into docs/review/.
// Prereq: `npm run build && npm run preview` (http://localhost:4321).
import { launch } from './browser.mjs';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const OUT = fileURLToPath(new URL('../docs/review/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const b = await launch();

async function page(w, h, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, ...opts });
  await ctx.addInitScript(() => { try { localStorage.setItem('odalo.cookies', 'essential'); } catch {} });
  const p = await ctx.newPage();
  return { p, ctx };
}
const shot = async (p, name, o = {}) => { await p.screenshot({ path: join(OUT, `${name}.png`), ...o }); console.log('•', name); };
const settle = (p) => p.waitForTimeout(1300);

// 1. Page layouts at 1440 / 834 / 390 (full page; sections scrolled into view so reveals have run)
for (const [w, h] of [[1440, 900], [834, 1112], [390, 844]]) {
  const { p, ctx } = await page(w, h);
  for (const path of ['en/', 'en/plans/', 'en/audit/', 'en/services/web/', 'en/work/', 'en/work/sample-hotel/', 'en/about/']) {
    await p.goto(`${BASE}/${path}`, { waitUntil: 'networkidle' });
    await settle(p);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
    await p.waitForTimeout(500);
    await shot(p, `${w}-${path.replace(/\/$/, '').replace(/\//g, '_') || 'home'}`.replace(/^(\d+)-$/, '$1-home'), { fullPage: true });
  }
  await ctx.close();
}

// 2. Language layouts (longest copy)
{
  const { p, ctx } = await page(1440, 900);
  for (const l of ['es', 'de']) { await p.goto(`${BASE}/${l}/`, { waitUntil: 'networkidle' }); await settle(p); await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); }); await shot(p, `1440-home-${l}`, { fullPage: true }); }
  await ctx.close();
}

// 3. Mosaic: rest + four desktop expansions (viewport crops of the section) + detail open
{
  const { p, ctx } = await page(1440, 1000);
  await p.goto(`${BASE}/en/`, { waitUntil: 'networkidle' });
  const m = p.locator('[data-mosaic]');
  await m.scrollIntoViewIfNeeded();
  await p.evaluate(() => scrollBy(0, -140));
  await shot(p, 'mosaic-rest');
  const box = await m.boundingBox();
  const spots = { web: [0.2, 0.2], local: [0.9, 0.2], video: [0.1, 0.85], ads: [0.9, 0.85] };
  for (const [id, [fx, fy]] of Object.entries(spots)) {
    await p.mouse.move(box.x + box.width * fx, box.y + box.height * fy, { steps: 6 });
    await p.waitForTimeout(700);
    await shot(p, `mosaic-hover-${id}`);
  }
  await p.mouse.move(5, 5); await p.waitForTimeout(500);
  await p.locator('[data-explore="video"]').click();
  await p.waitForTimeout(400);
  await shot(p, 'mosaic-details-open');
  await p.locator('[data-detail-for="video"] [data-close]').focus();
  await p.keyboard.press('Escape');
  await p.keyboard.press('Tab'); // visible focus ring on the next control
  await shot(p, 'mosaic-keyboard-focus');
  await ctx.close();
}

// 4. Mobile: mosaic details inline, menu open, 320px reflow
{
  const { p, ctx } = await page(390, 844, { hasTouch: true, isMobile: true });
  await p.goto(`${BASE}/en/`, { waitUntil: 'networkidle' });
  await p.locator('[data-explore="local"]').scrollIntoViewIfNeeded();
  await p.locator('[data-explore="local"]').tap();
  await p.waitForTimeout(400);
  await p.evaluate(() => scrollBy(0, 360));
  await shot(p, 'mosaic-mobile-details-open');
  await p.evaluate(() => scrollTo(0, 0));
  await p.locator('.hdr__toggle').tap();
  await shot(p, 'mobile-menu-open');
  await ctx.close();
  const c2 = await page(320, 700);
  await c2.p.goto(`${BASE}/de/`, { waitUntil: 'networkidle' });
  await settle(c2.p);
  await shot(c2.p, '320-home-de-top');
  await c2.p.goto(`${BASE}/en/plans/`, { waitUntil: 'networkidle' });
  await c2.p.locator('#plan-captacion').scrollIntoViewIfNeeded();
  await shot(c2.p, '320-plans');
  await c2.ctx.close();
}

// 5. 200% text enlargement
{
  const { p, ctx } = await page(1440, 900);
  await p.goto(`${BASE}/de/`, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: 'html{font-size:200% !important}' });
  await p.waitForTimeout(400);
  await shot(p, 'text-200-home-de-top');
  await p.locator('[data-mosaic]').scrollIntoViewIfNeeded();
  await shot(p, 'text-200-mosaic-de');
  await ctx.close();
}

// 6. Reduced motion + form states
{
  const { p, ctx } = await page(1440, 900, { reducedMotion: 'reduce' });
  await p.goto(`${BASE}/en/`, { waitUntil: 'networkidle' });
  await shot(p, 'reduced-motion-hero');
  await ctx.close();
  const f = await page(1440, 900);
  await f.p.goto(`${BASE}/en/audit/?plan=captacion`, { waitUntil: 'networkidle' });
  await f.p.getByRole('button', { name: 'Request audit' }).click();
  await f.p.waitForTimeout(300);
  await shot(f.p, 'form-errors', { fullPage: true });
  await f.p.fill('#f-name', 'Sample Person'); await f.p.fill('#f-email', 'sample@example.com'); await f.p.fill('#f-business', 'Sample Business'); await f.p.fill('#f-need', 'Sample text for the demo.'); await f.p.check('#f-privacy');
  await f.p.getByRole('button', { name: 'Request audit' }).click();
  await f.p.waitForSelector('[data-result]:not([hidden])');
  await shot(f.p, 'form-simulated-success', { fullPage: true });
  await f.ctx.close();
}
await b.close();
