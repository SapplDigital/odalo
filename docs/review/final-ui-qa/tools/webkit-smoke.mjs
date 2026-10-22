// WebKit (already present in the local Playwright cache; nothing installed): bounds audit and keyboard-open states on a handful of pages.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { webkit } = require('@playwright/test');
const { auditInPage } = await import(pathToFileURL(path.resolve('tests/helpers/reflow.ts')).href);
let b;
try { b = await webkit.launch(); } catch (e) { console.log('WEBKIT UNAVAILABLE:', String(e).split('\n')[0]); fs.writeFileSync('docs/review/final-ui-qa/evidence/webkit-results.json', JSON.stringify({ available: false, error: String(e).split('\n')[0] })); process.exit(0); }
const rows = [];
for (const route of ['/en/', '/de/', '/es/plans/', '/de/about/', '/en/audit/', '/de/privacy/', '/en/work/sample-hotel/']) for (const [w, h, pct] of [[1440, 900, 100], [834, 1112, 100], [390, 844, 100], [320, 700, 200]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4322' + route, { waitUntil: 'networkidle' });
  if (pct === 200) await page.addStyleTag({ content: 'html{font-size:200% !important}' });
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  await page.waitForTimeout(300);
  const problems = await page.evaluate(auditInPage);
  rows.push({ route, w, pct, problems });
  if (route === '/de/privacy/' && w === 390) await page.screenshot({ path: 'docs/review/final-ui-qa/screens/webkit-de-390-privacy.png' });
  await ctx.close();
}
await b.close();
fs.writeFileSync('docs/review/final-ui-qa/evidence/webkit-results.json', JSON.stringify({ available: true, rows }, null, 1));
const bad = rows.filter((r) => r.problems.length);
console.log(`webkit: ${rows.length} combinations, ${bad.length} with bounds findings`);
for (const r of bad) console.log(r.route, r.w, r.pct, r.problems.slice(0, 3).join(' | '));
