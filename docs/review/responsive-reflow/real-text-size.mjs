// Reflow audit with the browser's OWN default text size set to 32px (200% of 16px), not a stylesheet override.
// A throw-away Edge profile is created in the OS temp folder with that preference; the user's real browser profile and settings are never touched.
// Usage (from the repo root, with the built site served, e.g. `npx astro build && npx astro preview --port 4322`):
//   BASE=http://localhost:4322 node docs/review/responsive-reflow/real-text-size.mjs
// Needs Edge (channel "msedge") and Node 24 (imports the TypeScript audit helper with built-in type stripping).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const { auditInPage } = await import(pathToFileURL(path.resolve('tests/helpers/reflow.ts')).href);

const BASE = process.env.BASE || 'http://localhost:4322';
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const widths = [320, 390, 834, 1440];
const pages = ['', 'plans/', 'services/web/', 'work/', 'work/sample-hotel/', 'about/', 'audit/', 'privacy/'];

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
  await page.goto(`${BASE}/${lang}/${p}`);
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  await page.waitForTimeout(200);
  const info = await page.evaluate(() => ({ rootPx: getComputedStyle(document.documentElement).fontSize, narrowLayout: matchMedia('(max-width: 47.99em)').matches }));
  const problems = await page.evaluate(auditInPage);
  rows.push({ url: `/${lang}/${p}`, width: w, ...info, problems });
}
await ctx.close();
fs.rmSync(profile, { recursive: true, force: true });

const bad = rows.filter((r) => r.problems.length);
const summary = { method: 'Edge persistent context, temporary profile with webkit.webprefs.default_font_size=32', base: BASE, checked: rows.length, rootPxValues: [...new Set(rows.map((r) => r.rootPx))], failing: bad.length };
fs.writeFileSync(path.join(here, 'real-text-size-results.json'), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary));
for (const r of bad) console.log(`${r.url} ${r.width}px (root ${r.rootPx}, narrow=${r.narrowLayout}):\n   ${r.problems.slice(0, 4).join('\n   ')}`);
