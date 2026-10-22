// Responsive sweep: every localized route (+ 404) x widths x text modes, all <details> opened, with the repo's auditInPage (text/control bounds,
// not scrollWidth alone) plus two extra checks: (a) mid-word breaks in headings/buttons (a word split across lines without a hyphen) and
// (b) lines that start with an isolated punctuation mark ("." "," ":" ";" "!" "?" ")" alone on a line).
// Usage: node sweep.mjs  (preview on 4322)  ->  evidence/sweep-results.json
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const { auditInPage } = await import(pathToFileURL(path.resolve('tests/helpers/reflow.ts')).href);
const BASE = 'http://localhost:4322';
const out = path.resolve('docs/review/final-ui-qa/evidence');
const services = ['web', 'local', 'video', 'ads'], cases = ['sample-hotel', 'sample-clinic', 'sample-shop'];
const routes = [];
for (const l of ['en', 'es', 'de']) for (const p of ['', 'plans/', 'work/', 'about/', 'audit/', 'privacy/', 'cookies/', 'legal/', ...services.map((s) => `services/${s}/`), ...cases.map((c) => `work/${c}/`)]) routes.push(`/${l}/${p}`);
routes.push('/404.html');
const modes = [[1440, 100], [1024, 100], [834, 100], [390, 100], [320, 100], [390, 200], [320, 200]];
const b = await chromium.launch({ channel: 'msedge' });
const rows = [];
const extra = () => {
  const problems = [];
  // (a) a word split across lines: a text node whose single word has client rects on >1 line and is not hyphenated
  const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode; const p = n.parentElement;
    if (!n.textContent.trim() || !p || p.closest('.sr-only, svg, script, style') || getComputedStyle(p).visibility === 'hidden') continue;
    const txt = n.textContent; const re = /\S+/g; let m;
    while ((m = re.exec(txt))) {
      const w = m[0]; if (w.length < 7) continue;
      const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + w.length);
      const rects = [...r.getClientRects()].filter((x) => x.width > 0);
      if (rects.length > 1 && new Set(rects.map((x) => Math.round(x.top))).size > 1 && !/[-­]/.test(w) && !/­/.test(txt.slice(m.index, m.index + w.length))) {
        // a hyphenated break shows as a trailing hyphen glyph not present in the DOM text: detect via the element's computed hyphens + lang
        problems.push(`word split: "${w.slice(0, 26)}" in ${p.tagName.toLowerCase()}${p.className ? '.' + String(p.className).split(' ')[0] : ''}`);
      }
    }
    // (b) a line made only of punctuation
    const r2 = document.createRange(); r2.selectNodeContents(n);
    const lines = new Map(); for (const x of r2.getClientRects()) { const k = Math.round(x.top); lines.set(k, (lines.get(k) || 0) + x.width); }
    if (/^[\s]*[.,:;!?)»”]+[\s]*$/.test(txt) && txt.trim().length <= 2) problems.push(`isolated punctuation node "${txt.trim()}" in ${p.tagName.toLowerCase()}`);
  }
  // isolated trailing punctuation: a final one-character line after an <em>/<span> (e.g. "Richtung" / ".")
  for (const h of document.querySelectorAll('main h1, main h2, main h3, main a.btn, main button')) {
    const r = document.createRange(); r.selectNodeContents(h);
    const rects = [...r.getClientRects()].filter((x) => x.width > 0); if (rects.length < 2) continue;
    const last = rects.at(-1); const lastLineW = rects.filter((x) => Math.abs(x.top - last.top) < 3).reduce((a, x) => a + x.width, 0);
    if (/[.!?]\s*$/.test(h.textContent.trim()) && lastLineW < 14 * 1) problems.push(`isolated final punctuation in ${h.tagName.toLowerCase()}: "${h.textContent.trim().slice(-30)}"`);
  }
  return problems;
};
for (const route of routes) for (const [w, pct] of modes) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  if (pct !== 100) await page.addStyleTag({ content: `html{font-size:${pct}%!important}` });
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
  await page.waitForTimeout(250);
  const problems = [...await page.evaluate(auditInPage), ...await page.evaluate(extra)];
  rows.push({ route, w, pct, problems });
  await ctx.close();
}
await b.close();
fs.writeFileSync(path.join(out, 'sweep-results.json'), JSON.stringify(rows, null, 1));
const bad = rows.filter((r) => r.problems.length);
console.log(`${rows.length} route/viewport combinations, ${bad.length} with findings`);
const kinds = {};
for (const r of bad) for (const p of r.problems) { const k = p.replace(/"[^"]*"/g, '"…"').replace(/\d+/g, 'N').slice(0, 70); kinds[k] = (kinds[k] || 0) + 1; }
console.log(JSON.stringify(kinds, null, 1));
