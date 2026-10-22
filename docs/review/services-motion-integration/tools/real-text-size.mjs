// Real browser text size (default font 32px = 200%) audit of the homepage services section, in the travelling state (as loaded) and the settled state.
// A throw-away Edge profile in the OS temp folder carries the preference; the user's own browser settings are never touched.
// Usage (built site served): BASE=http://localhost:4322 node docs/review/services-motion-integration/tools/real-text-size.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const { auditInPage } = await import(pathToFileURL(path.resolve('tests/helpers/reflow.ts')).href);
const BASE = process.env.BASE || 'http://localhost:4322';
const root = path.resolve('docs/review/services-motion-integration');
const out = path.join(root, 'enlarged-text');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const widths = [320, 390, 834, 1024, 1440];

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'odalo-textsize-'));
fs.mkdirSync(path.join(profile, 'Default'), { recursive: true });
fs.writeFileSync(path.join(profile, 'Default', 'Preferences'), JSON.stringify({ webkit: { webprefs: { default_font_size: 32, default_fixed_font_size: 26, minimum_font_size: 0 } } }));
const ctx = await chromium.launchPersistentContext(profile, { channel: 'msedge', viewport: { width: 1280, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto(BASE + '/en/');
await page.evaluate(() => localStorage.setItem('odalo.cookies', 'essential'));

const rows = [];
for (const lang of ['en', 'es', 'de']) for (const w of widths) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(`${BASE}/${lang}/`, { waitUntil: 'networkidle' });
  await sleep(250);
  const info = await page.evaluate(() => ({ rootPx: getComputedStyle(document.documentElement).fontSize, narrowLayout: matchMedia('(max-width: 47.99em)').matches, assembling: document.querySelector('[data-mosaic]').classList.contains('is-assembling') }));
  const travelling = await page.evaluate(auditInPage); // as loaded: pieces still apart
  // settle by real scrolling, then audit the finished mosaic and check every control sits inside its tile and the viewport
  await page.evaluate(async () => { const m = document.querySelector('[data-mosaic]'); const top = m.getBoundingClientRect().top + scrollY; for (const f of [0.2, 0.5, 0.8, 1.1, 1.4, 1.8, 2.2]) { scrollTo(0, top + m.offsetHeight * f - innerHeight * 0.5); await new Promise((r) => setTimeout(r, 140)); } });
  await sleep(500);
  const settled = await page.evaluate(auditInPage);
  const clipped = await page.evaluate(() => [...document.querySelectorAll('.tile')].filter((t) => { const tb = t.getBoundingClientRect(); return [...t.querySelectorAll('.tile__title,.tile__text,.tile__cap,.tile__actions,[data-explore],.tile__link')].some((k) => { const r = k.getBoundingClientRect(); return r.right > tb.right + 1 || r.left < tb.left - 1 || r.bottom > tb.bottom + 1 || r.right > innerWidth + 1; }); }).map((t) => t.dataset.service));
  const after = await page.evaluate(() => ({ assembling: document.querySelector('[data-mosaic]').classList.contains('is-assembling'), sw: document.documentElement.scrollWidth, vw: innerWidth }));
  const problems = [...travelling.map((p) => 'travelling: ' + p), ...settled.map((p) => 'settled: ' + p), ...(clipped.length ? ['clipped tiles: ' + clipped.join(',')] : []), ...(after.assembling ? ['still assembling after scrolling through'] : []), ...(after.sw > after.vw ? [`sideways scroll ${after.sw} > ${after.vw}`] : [])];
  rows.push({ url: `/${lang}/`, width: w, ...info, problems });
  if (lang !== 'es') { await page.locator('#services').scrollIntoViewIfNeeded(); await sleep(250); await page.locator('#services').screenshot({ path: path.join(out, `${lang}-${w}-settled-32px.png`) }); }
}
await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });
const bad = rows.filter((r) => r.problems.length);
const summary = { method: 'Edge persistent context, temporary profile with webkit.webprefs.default_font_size=32', base: BASE, checked: rows.length, rootPxValues: [...new Set(rows.map((r) => r.rootPx))], failing: bad.length };
fs.writeFileSync(path.join(root, 'evidence', 'real-text-size-results.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary));
for (const r of bad) console.log(`${r.url} ${r.width}px (root ${r.rootPx}, narrow=${r.narrowLayout}):\n   ${r.problems.slice(0, 4).join('\n   ')}`);
