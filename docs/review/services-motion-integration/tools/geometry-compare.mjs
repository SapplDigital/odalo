// Settled-geometry comparison: the integrated build (4322) against the build from before the integration (4324, task 08 state).
// After the pieces have docked, the mosaic must be the one it was: same tile boxes, same hover geometry. Differences are listed, not hidden.
// Usage: node docs/review/services-motion-integration/tools/geometry-compare.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const AFTER = process.env.AFTER || 'http://localhost:4322', BEFORE = process.env.BEFORE || 'http://localhost:4324';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: 'msedge' });
const sizes = [[1440, 900], [1024, 768], [834, 1112], [390, 844], [320, 700]];

async function measure(base, lang, [w, h], hover) {
  const ctx = await browser.newContext({ viewport: { width: w, height: hover ? 3000 : h }, hasTouch: w < 800, isMobile: w < 800 });
  await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
  const page = await ctx.newPage();
  await page.goto(`${base}/${lang}/`, { waitUntil: 'networkidle' });
  // assemble by real scrolling where the build has the assembly (harmless on the old build)
  await page.evaluate(async () => { const m = document.querySelector('[data-mosaic]'); const top = m.getBoundingClientRect().top + scrollY; for (const f of [0.2, 0.5, 0.8, 1.1, 1.4]) { scrollTo(0, top + m.offsetHeight * f - innerHeight * 0.5); await new Promise((r) => setTimeout(r, 150)); } });
  await sleep(500);
  await page.evaluate(() => document.querySelector('[data-mosaic]').scrollIntoView({ block: 'start' }));
  await sleep(200);
  const grab = () => page.evaluate(() => { const m = document.querySelector('[data-mosaic]'); const o = m.getBoundingClientRect(); const r = (e) => { const b = e.getBoundingClientRect(); return [Math.round((b.left - o.left) * 10) / 10, Math.round((b.top - o.top) * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10]; };
    return { mosaic: [Math.round(o.width * 10) / 10, Math.round(o.height * 10) / 10], tiles: Object.fromEntries([...document.querySelectorAll('.tile')].map((t) => [t.dataset.service, { box: r(t), img: r(t.querySelector('.tile__img')), title: r(t.querySelector('.tile__title')), text: r(t.querySelector('.tile__text')), actions: r(t.querySelector('.tile__actions')) }])), doc: document.documentElement.scrollHeight }; });
  const rest = await grab();
  let active = null;
  if (hover) {
    active = {};
    for (const id of ['web', 'local', 'video', 'ads']) {
      const b = await page.locator(`.tile[data-service="${id}"]`).boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 }); await sleep(700);
      active[id] = await grab();
      await page.mouse.move(2, 2); await sleep(450);
    }
  }
  await ctx.close();
  return { rest, active };
}
const diff = (a, b, tol = 0.6) => { const out = []; const walk = (x, y, p) => { if (Array.isArray(x)) { x.forEach((v, i) => { if (typeof v === 'number' && Math.abs(v - y[i]) > tol) out.push(`${p}[${i}] ${y[i]} -> ${v}`); }); } else if (x && typeof x === 'object') for (const k of Object.keys(x)) walk(x[k], y[k], p + '/' + k); else if (typeof x === 'number' && Math.abs(x - y) > tol) out.push(`${p} ${y} -> ${x}`); }; walk(a, b, ''); return out; };

const results = [];
for (const lang of ['en', 'es', 'de']) for (const sz of sizes) {
  const hover = sz[0] >= 1024;
  const [a, b] = [await measure(AFTER, lang, sz, hover), await measure(BEFORE, lang, sz, hover)];
  const restDiff = diff(a.rest, b.rest);
  const activeDiff = hover ? Object.entries(a.active).flatMap(([id, g]) => diff(g, b.active[id]).map((d) => `active ${id} ${d}`)) : [];
  results.push({ lang, size: sz.join('x'), restDiff, activeDiff, mosaicAfter: a.rest.mosaic, mosaicBefore: b.rest.mosaic });
  console.log(`${restDiff.length + activeDiff.length ? 'DIFF' : 'same'} ${lang} ${sz.join('x')} mosaic ${b.rest.mosaic.join('x')} -> ${a.rest.mosaic.join('x')}${restDiff.length ? ' | ' + restDiff.slice(0, 4).join('; ') + (restDiff.length > 4 ? ` (+${restDiff.length - 4})` : '') : ''}${activeDiff.length ? ' | ' + activeDiff.slice(0, 3).join('; ') : ''}`);
}
await browser.close();
fs.writeFileSync(path.resolve('docs/review/services-motion-integration/evidence/geometry-compare.json'), JSON.stringify(results, null, 1));
