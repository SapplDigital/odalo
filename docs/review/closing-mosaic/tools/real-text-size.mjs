// Real browser text size (default font 32px = 200%) audit of the homepage services section, in the travelling state (as loaded) and the settled state.
// A throw-away Edge profile in the OS temp folder carries the preference; the user's own browser settings are never touched.
// Usage (built site served): BASE=http://localhost:4322 node docs/review/closing-mosaic/tools/real-text-size.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const { auditInPage } = await import(pathToFileURL(path.resolve('tests/helpers/reflow.ts')).href);
const BASE = process.env.BASE || 'http://localhost:4322';
const root = path.resolve('docs/review/closing-mosaic');
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
for (const lang of ['en', 'es', 'de']) for (const w of widths) for (const p of ['', 'plans/', 'about/']) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(`${BASE}/${lang}/${p}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { const d = document.querySelector('footer details'); if (d) d.open = true; });
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await sleep(500);
  const info = await page.evaluate(() => ({ rootPx: getComputedStyle(document.documentElement).fontSize, narrowLayout: matchMedia('(max-width: 47.99em)').matches }));
  const problems = await page.evaluate(auditInPage);
  const clipped = await page.evaluate(() => { const out = []; for (const root of document.querySelectorAll('.fin__main, footer')) { const pb = root.getBoundingClientRect(); for (const k of root.querySelectorAll('h2,h3,p,a,summary,li')) { const r = k.getBoundingClientRect(); if (r.width && (r.right > pb.right + 1 || r.left < pb.left - 1 || r.right > innerWidth + 1)) out.push((k.textContent || '').trim().slice(0, 20)); } } return out; });
  problems.push(...clipped.map((c) => 'text outside its area: ' + c));
  rows.push({ url: `/${lang}/${p}`, width: w, ...info, problems });
  if (!p && (w === 320 || w === 390)) await page.screenshot({ path: path.join(out, `${lang}-${w}-closing-32px.png`), fullPage: true, clip: await page.evaluate(() => { const r = document.querySelector('.fin').getBoundingClientRect(); const f = document.querySelector('footer').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: f.bottom + scrollY - (r.top + scrollY) }; }) });
}
await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });
const bad = rows.filter((r) => r.problems.length);
const summary = { method: 'Edge persistent context, temporary profile with webkit.webprefs.default_font_size=32', base: BASE, checked: rows.length, rootPxValues: [...new Set(rows.map((r) => r.rootPx))], failing: bad.length };
fs.writeFileSync(path.join(root, 'evidence', 'real-text-size-results.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary));
for (const r of bad) console.log(`${r.url} ${r.width}px (root ${r.rootPx}, narrow=${r.narrowLayout}):\n   ${r.problems.slice(0, 4).join('\n   ')}`);
