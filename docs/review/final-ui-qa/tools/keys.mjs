// Keyboard sweep: press Tab through each page and record, for every focus stop: visible ring, clear of the sticky header, inside the viewport,
// reading order (document order), and hidden-content traps (focus on an element that is not rendered or has zero size).
// Usage: node keys.mjs  (preview on 4322) -> evidence/keyboard-results.json
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const out = path.resolve('docs/review/final-ui-qa/evidence');
const b = await chromium.launch({ channel: 'msedge' });
const pages = ['/en/', '/de/', '/es/', '/en/plans/', '/en/about/', '/en/work/', '/en/audit/', '/en/services/video/', '/en/work/sample-clinic/', '/de/cookies/'];
const results = [];
for (const [w, h] of [[1440, 900], [390, 844]]) for (const route of pages) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4322' + route, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.querySelectorAll('details').forEach((d) => (d.open = true)); });
  const stops = [];
  let prev = null; let guard = 0;
  while (guard++ < 160) {
    await page.keyboard.press('Tab');
    // smooth scrolling and the skip link's slide-in must have finished before geometry means anything
    await page.waitForFunction(() => new Promise((res) => { let last = -1, n = 0; const t = () => { const y = scrollY; n = y === last ? n + 1 : 0; last = y; n >= 4 ? res(true) : requestAnimationFrame(t); }; t(); }));
    await page.waitForTimeout(220);
    const s = await page.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return null;
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      const hdr = document.querySelector('header'); const hb = hdr ? hdr.getBoundingClientRect().bottom : 0;
      const fixedCover = (() => { const el = document.elementFromPoint(r.left + r.width / 2, Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1)); return el && el !== e && !e.contains(el) && !el.contains(e) ? (el.tagName + '.' + String(el.className).split(' ')[0]) : ''; })();
      return { inHeader: !!e.closest('header') || e.classList.contains('skip-link'), tag: e.tagName.toLowerCase(), label: (e.getAttribute('aria-label') || e.textContent || e.getAttribute('href') || '').trim().replace(/\s+/g, ' ').slice(0, 40), ringW: parseFloat(cs.outlineWidth), ringStyle: cs.outlineStyle, boxShadow: cs.boxShadow !== 'none', top: r.top, bottom: r.bottom, left: r.left, right: r.right, hb, w: r.width, h: r.height, covered: fixedCover, y: r.top + scrollY, pos: e.getBoundingClientRect().height ? 1 : 0 };
    });
    if (!s) break;
    s.docOrderOk = prev ? await page.evaluate(([a, b]) => true, [0, 0]) : true;
    stops.push(s); prev = s;
    if (stops.length > 2 && stops[0].label === s.label && stops.length > 6) break;
  }
  const problems = [];
  stops.forEach((s, i) => {
    const tag = `${s.tag}:"${s.label}"`;
    if (!(s.ringW >= 2 && s.ringStyle !== 'none') && !s.boxShadow) problems.push(`${tag}: no visible focus ring`);
    if (s.w === 0 || s.h === 0) problems.push(`${tag}: focus on a zero-size element`);
    if (!s.inHeader && s.top < s.hb - 1 && s.hb > 0) problems.push(`${tag}: under the sticky header (top ${Math.round(s.top)} < ${Math.round(s.hb)})`);
    if (s.bottom > innerHeightOf(h) + 1) problems.push(`${tag}: below the window (${Math.round(s.bottom)} > ${h})`);
    if (s.left < -1 || s.right > w + 1) problems.push(`${tag}: outside the viewport horizontally`);
    if (s.covered && !s.inHeader) problems.push(`${tag}: covered by ${s.covered}`);
    if (i > 0 && s.y < stops[i - 1].y - 400 && i < stops.length - 1) problems.push(`${tag}: focus order jumps up the page (${Math.round(stops[i - 1].y)} -> ${Math.round(s.y)})`);
  });
  results.push({ route, w, stops: stops.length, problems: [...new Set(problems)] });
  await ctx.close();
}
function innerHeightOf(h) { return h; }
await b.close();
fs.writeFileSync(path.join(out, 'keyboard-results.json'), JSON.stringify(results, null, 1));
for (const r of results) console.log(`${r.problems.length ? 'FIND' : 'ok  '} ${r.w} ${r.route} ${r.stops} stops${r.problems.length ? ' :: ' + r.problems.slice(0, 5).join(' | ') : ''}`);
