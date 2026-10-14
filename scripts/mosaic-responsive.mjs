// Mosaic at tablet/mobile widths, touch tap-to-select, keyboard focus and reduced motion.
// Prereq: server on BASE_URL (default http://localhost:4321). Writes docs/review/mosaic/*.png.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const OUT = fileURLToPath(new URL('../docs/review/mosaic/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'msedge' });
const out = {};

async function open(opts, lang = 'en') {
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(() => { try { localStorage.setItem('odalo.cookies', 'essential'); } catch {} });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/${lang}/`, { waitUntil: 'networkidle' });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('[data-mosaic]').getBoundingClientRect().top + scrollY - 90); });
  await p.waitForTimeout(500);
  return { p, ctx };
}
const clipShot = async (p, name) => {
  const b = await p.locator('[data-mosaic]').boundingBox();
  const sy = await p.evaluate(() => scrollY); // boundingBox is viewport-relative, fullPage clips are page-relative
  await p.screenshot({ path: join(OUT, `${name}.png`), clip: { x: Math.max(0, b.x - 10), y: Math.max(0, b.y + sy - 10), width: b.width + 20, height: Math.min(b.height + 20, 2400) }, fullPage: true });
};

// Tablet 834: hover on tile 3 + German (longest labels)
{
  const { p, ctx } = await open({ viewport: { width: 834, height: 1112 } }, 'de');
  await clipShot(p, 'tablet-834-rest-de');
  const b = await p.locator('.tile[data-service="video"]').boundingBox();
  await p.mouse.move(b.x + 80, b.y + 80, { steps: 6 });
  await p.waitForTimeout(800);
  out.tabletActive = await p.locator('[data-mosaic]').getAttribute('data-active');
  await clipShot(p, 'tablet-834-video-de');
  out.tabletOverflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await ctx.close();
}
// Mobile 390 + 320
for (const w of [390, 320]) {
  const { p, ctx } = await open({ viewport: { width: w, height: 844 }, hasTouch: true, isMobile: true });
  await clipShot(p, `mobile-${w}-rest`);
  out[`overflow${w}`] = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await p.locator('[data-explore="local"]').tap();
  await p.waitForTimeout(500);
  out[`mobile${w}Detail`] = await p.locator('[data-detail-for="local"]').isVisible();
  await clipShot(p, `mobile-${w}-explore`);
  await ctx.close();
}
// Touch on a desktop-width screen (tablet landscape): tap Explore = selected + expanded, scrolling untouched
{
  const { p, ctx } = await open({ viewport: { width: 1280, height: 1000 }, hasTouch: true });
  await p.locator('[data-explore="ads"]').tap();
  await p.waitForTimeout(700);
  out.touchActive = await p.locator('[data-mosaic]').getAttribute('data-active');
  out.touchExpanded = await p.evaluate(() => { const t = [...document.querySelectorAll('[data-tile]')].map((e) => e.getBoundingClientRect().width); return t[3] > t[2]; });
  await clipShot(p, 'touch-1280-ads-selected');
  await p.locator('[data-explore="ads"]').tap();
  await p.waitForTimeout(700);
  out.touchAfterClose = await p.locator('[data-mosaic]').getAttribute('data-active');
  await ctx.close();
}
// Keyboard focus = emphasis
{
  const { p, ctx } = await open({ viewport: { width: 1440, height: 1100 } });
  await p.locator('[data-explore="video"]').focus();
  await p.waitForTimeout(700);
  out.focusActive = await p.locator('[data-mosaic]').getAttribute('data-active');
  await clipShot(p, 'keyboard-focus-video');
  await ctx.close();
}
// Reduced motion: no transition, state still switches and stays tiled
{
  const { p, ctx } = await open({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  out.reducedTransition = await p.evaluate(() => getComputedStyle(document.querySelector('[data-mosaic]')).transitionDuration + ' | ' + getComputedStyle(document.querySelector('.row')).transitionDuration);
  const b = await p.locator('.tile[data-service="local"]').boundingBox();
  await p.mouse.move(b.x + 100, b.y + 100, { steps: 4 });
  await p.waitForTimeout(400);
  out.reducedActive = await p.locator('[data-mosaic]').getAttribute('data-active');
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
