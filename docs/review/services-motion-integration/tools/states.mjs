// Screenshots: settled mosaic before/after (EN/ES/DE x 5 widths), the assembly steps by real scrolling, every narrow-neighbour state, every Explore panel.
// Usage: node docs/review/services-motion-integration/tools/states.mjs   (new build on 4322, previous build on 4324)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const AFTER = 'http://localhost:4322', BEFORE = 'http://localhost:4324';
const root = path.resolve('docs/review/services-motion-integration');
for (const d of ['before', 'after', 'states', 'interaction']) fs.mkdirSync(path.join(root, d), { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'msedge' });
const sizes = [[1440, 900], [1024, 768], [834, 1112], [390, 844], [320, 700]];

async function open(base, lang, [w, h], tall) {
  const ctx = await browser.newContext({ viewport: { width: w, height: tall ? 3000 : h }, hasTouch: w < 800, isMobile: w < 800 });
  await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
  const page = await ctx.newPage();
  await page.goto(`${base}/${lang}/`, { waitUntil: 'networkidle' });
  return { ctx, page };
}
const mosaicTop = (page) => page.evaluate(() => document.querySelector('[data-mosaic]').getBoundingClientRect().top + scrollY);
async function assemble(page) {
  await page.evaluate(async () => { const m = document.querySelector('[data-mosaic]'); const top = m.getBoundingClientRect().top + scrollY; for (const f of [0.2, 0.5, 0.8, 1.1, 1.4]) { scrollTo(0, top + m.offsetHeight * f - innerHeight * 0.5); await new Promise((r) => setTimeout(r, 150)); } });
  await sleep(450);
}

for (const lang of ['en', 'es', 'de']) for (const sz of sizes) {
  const [w, h] = sz;
  for (const [tag, base] of [['before', BEFORE], ['after', AFTER]]) {
    const { ctx, page } = await open(base, lang, sz, false);
    await assemble(page);
    await page.locator('#services').scrollIntoViewIfNeeded(); await sleep(250);
    await page.locator('#services').screenshot({ path: path.join(root, tag, `${lang}-${w}-settled.png`) });
    await ctx.close();
  }
  // assembly steps on the new build, by real scrolling
  if (lang === 'en' || w === 1440 || w === 390) {
    const { ctx, page } = await open(AFTER, lang, sz, false);
    const top = await mosaicTop(page);
    let i = 0;
    for (const f of [0.9, 0.7, 0.5, 0.3, 0.1]) { await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.max(0, top - h * f)); await sleep(350); await page.screenshot({ path: path.join(root, 'states', `${lang}-${w}-a${i++}.png`) }); }
    await ctx.close();
  }
  console.log('done', lang, w);
}

// every narrow-neighbour state (active tile with each neighbour narrowed) and every Explore panel, English, after settling
for (const sz of [[1440, 900], [1024, 768]]) {
  const { ctx, page } = await open(AFTER, 'en', sz, true);
  await assemble(page);
  await page.locator('#services').scrollIntoViewIfNeeded();
  for (const id of ['web', 'local', 'video', 'ads']) {
    const b = await page.locator(`.tile[data-service="${id}"]`).boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 }); await sleep(700);
    await page.locator('#services').screenshot({ path: path.join(root, 'interaction', `active-${id}-${sz[0]}.png`) });
    await page.mouse.move(2, 2); await sleep(450);
  }
  await ctx.close();
}
for (const sz of [[1440, 900], [390, 844]]) {
  const { ctx, page } = await open(AFTER, 'en', sz, false);
  for (const id of ['web', 'local', 'video', 'ads']) {
    // each panel opened on a tile that is still travelling: the action wins, the pieces settle, focus stays on the button
    await page.goto(`${AFTER}/en/`, { waitUntil: 'networkidle' });
    const btn = page.locator(`[data-explore="${id}"]`);
    await btn.scrollIntoViewIfNeeded(); await btn.click(); await sleep(700);
    await page.screenshot({ path: path.join(root, 'interaction', `explore-${id}-${sz[0]}.png`) });
  }
  await ctx.close();
}
await browser.close();
