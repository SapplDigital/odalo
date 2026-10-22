// Real browser text size (default font 32px = 200%) audit of the home page (service mosaic) and the four service pages, plus mosaic screenshots.
// A throw-away Edge profile in the OS temp folder carries the preference; the user's own browser settings are never touched.
// Usage (repo root, built site served): BASE=http://localhost:4322 node docs/review/services-mosaic/tools/real-text-size.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const { auditInPage } = await import(pathToFileURL(path.resolve('tests/helpers/reflow.ts')).href);
const BASE = process.env.BASE || 'http://localhost:4322';
const out = path.resolve('docs/review/services-mosaic/enlarged-text');
fs.mkdirSync(out, { recursive: true });
const widths = [320, 390, 834, 1024, 1440];
const pages = ['', 'services/web/', 'services/local/', 'services/video/', 'services/ads/'];

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'odalo-textsize-'));
fs.mkdirSync(path.join(profile, 'Default'), { recursive: true });
fs.writeFileSync(path.join(profile, 'Default', 'Preferences'), JSON.stringify({ webkit: { webprefs: { default_font_size: 32, default_fixed_font_size: 26, minimum_font_size: 0 } } }));
const ctx = await chromium.launchPersistentContext(profile, { channel: 'msedge', viewport: { width: 1280, height: 900 } });
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto(BASE + '/en/');
await page.evaluate(() => localStorage.setItem('odalo.cookies', 'essential'));

const rows = [];
for (const lang of ['en', 'es', 'de']) for (const p of pages) for (const w of widths) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(`${BASE}/${lang}/${p}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  await page.waitForTimeout(150);
  const info = await page.evaluate(() => ({ rootPx: getComputedStyle(document.documentElement).fontSize, narrowLayout: matchMedia('(max-width: 47.99em)').matches }));
  const problems = await page.evaluate(auditInPage);
  const clipped = p === '' ? await page.evaluate(() => [...document.querySelectorAll('.tile')].filter((t) => { const tb = t.getBoundingClientRect(); return [...t.querySelectorAll('.tile__title,.tile__text,.tile__actions,.tile__cap,.tile__img')].some((k) => { const r = k.getBoundingClientRect(); return r.right > tb.right + 1 || r.left < tb.left - 1 || r.bottom > tb.bottom + 1; }); }).map((t) => t.dataset.service)) : [];
  if (clipped.length) problems.push('clipped tiles: ' + clipped.join(','));
  rows.push({ url: `/${lang}/${p}`, width: w, ...info, problems });
  if (lang !== 'es' && (p === '' || p === 'services/video/') && (w === 320 || w === 390 || w === 1440 || w === 834)) {
    const el = p === '' ? page.locator('#services') : page.locator('.ph');
    await el.screenshot({ path: path.join(out, `${lang}-${p ? 'video' : 'home-mosaic'}-${w}.png`) });
  }
}
await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });
const bad = rows.filter((r) => r.problems.length);
const summary = { method: 'Edge persistent context, temporary profile with webkit.webprefs.default_font_size=32', base: BASE, checked: rows.length, rootPxValues: [...new Set(rows.map((r) => r.rootPx))], failing: bad.length };
fs.writeFileSync(path.resolve('docs/review/services-mosaic/real-text-size-results.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary));
for (const r of bad) console.log(`${r.url} ${r.width}px (root ${r.rootPx}, narrow=${r.narrowLayout}):\n   ${r.problems.slice(0, 4).join('\n   ')}`);
