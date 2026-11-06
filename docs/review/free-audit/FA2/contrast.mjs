// Computed-colour contrast audit for FA2 (both palettes). Run with the prototype server up:
//   node docs/review/free-audit/FA2/contrast.mjs
// Resolves the REAL foreground/background pairs from the rendered page (computed styles, effective ancestor backgrounds) in these states:
// rest, tile hover (text against the growing surface too), button hover, keyboard focus ring, selected marker, open panels, errors.
// Thresholds: text 4.5 (3 for large text: >=24px, or >=18.66px bold); non-text (focus ring, accent bar, field edge, error marker) 3.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), 'correction');
mkdirSync(out, { recursive: true });
const BASE = process.env.FA2_BASE || 'http://127.0.0.1:4391/docs/review/free-audit/FA2';
const browser = await chromium.launch({ channel: 'msedge' });

// runs in the page: returns [{what, state, fg, bg, kind, size, bold}]
const collect = () => {
  const parse = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0.99) return c; } return parse(getComputedStyle(document.body).backgroundColor); };
  const vis = (e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
  const rows = [];
  const id = (e) => (e.id ? '#' + e.id : e.className ? e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] : e.tagName.toLowerCase()) + ':' + (e.textContent || e.placeholder || '').trim().slice(0, 28);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n; (n = walker.nextNode()); ) {
    const e = n.parentElement; if (!n.textContent.trim() || seen.has(e) || !vis(e) || e.closest('.sr-only, script, noscript')) continue;
    seen.add(e); const cs = getComputedStyle(e);
    rows.push({ what: id(e), kind: 'text', fg: hex(parse(cs.color)), bg: hex(bgOf(e)), size: parseFloat(cs.fontSize), bold: parseInt(cs.fontWeight) >= 700, tile: e.closest('.tile')?.dataset.piece || '' });
  }
  for (const e of document.querySelectorAll('input[type=text], input[type=email], input[type=url], input[type=tel], textarea')) {
    if (!vis(e)) continue; const cs = getComputedStyle(e, '::placeholder');
    if (e.placeholder) rows.push({ what: id(e) + '::placeholder', kind: 'text', fg: hex(parse(cs.color)), bg: hex(parse(getComputedStyle(e).backgroundColor)), size: 17, bold: false });
    rows.push({ what: id(e) + ' edge', kind: 'ui', fg: hex(parse(getComputedStyle(e).borderTopColor)), bg: hex(bgOf(e.parentElement)), size: 0 });
  }
  return rows;
};
const ratio = (a, b) => { const L = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }; const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const need = (r) => (r.kind === 'ui' ? 3 : r.size >= 24 || (r.size >= 18.66 && r.bold) ? 3 : 4.5);

const results = [];
const add = (palette, state, rows) => rows.forEach((r) => { const c = ratio(r.fg, r.bg); results.push({ palette, state, ...r, ratio: +c.toFixed(2), need: need(r), pass: c >= need(r) }); });

for (const palette of ['default', 'alt']) {
  const qs = palette === 'alt' ? '?theme=alt&still' : '?still';
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await c.newPage();
  await page.goto(`${BASE}/index.html${qs}`); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);

  add(palette, 'rest', await page.evaluate(collect));

  // hover: every tile's text against its growing surface too (worst case: text sits on the triangle)
  for (const id of ['web', 'local', 'video', 'ads']) {
    await page.hover(`[data-piece="${id}"]`); await page.waitForTimeout(350);
    const grow = await page.evaluate((id) => { const g = document.querySelector(`[data-piece="${id}"] .tile__grow`); const m = getComputedStyle(g).backgroundColor.match(/\d+/g).map(Number); return '#' + m.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join(''); }, id);
    const rows = (await page.evaluate(collect)).filter((r) => r.tile === id && r.kind === 'text');
    add(palette, `hover-surface ${id}`, rows.map((r) => ({ ...r, bg: grow })));
    // the accent/outline used by the hover surface itself against the tile base (it must be distinguishable: non-text 1.5 minimum is reported, not enforced)
    const base = rows[0]?.bg;
    results.push({ palette, state: `hover-surface ${id}`, what: 'surface vs tile (information only, decorative)', kind: 'info', fg: grow, bg: base, ratio: +ratio(grow, base).toFixed(2), need: 0, pass: true });
  }
  await page.mouse.move(2, 2);

  // open + selected: all text in open panels, badge, accent bar
  for (const id of ['web', 'local', 'video', 'ads']) {
    await page.click(`#b-${id}`); await page.waitForTimeout(450);
    await page.click(`[data-piece="${id}"] [data-include]`); await page.waitForTimeout(250);
    add(palette, `open+selected ${id}`, (await page.evaluate(collect)).filter((r) => r.tile === id));
    const bar = await page.evaluate((id) => { const t = document.querySelector(`[data-piece="${id}"]`); const cs = getComputedStyle(t.querySelector('.tile__deco'), '::after'); const m = (s) => '#' + s.match(/\d+/g).slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join(''); return { fg: m(cs.backgroundColor), bg: m(getComputedStyle(t).backgroundColor) }; }, id);
    add(palette, `selected-marker ${id}`, [{ what: `accent bar ${id}`, kind: 'ui', ...bar, size: 0 }]);
    // button states inside the open tile: rest, hover, focus ring
    for (const sel of ['[data-include]', '[data-close]']) {
      const loc = page.locator(`[data-piece="${id}"] ${sel}`);
      for (const st of ['rest', 'hover']) {
        if (st === 'hover') await loc.hover(); else await page.mouse.move(2, 2);
        await page.waitForTimeout(220);
        const r = await loc.evaluate((e) => { const cs = getComputedStyle(e); const p = (c) => '#' + c.match(/\d+/g).slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join(''); const tb = p(getComputedStyle(e.closest('.tile')).backgroundColor); const bgc = getComputedStyle(e).backgroundColor; const bg = /rgba\(.*, 0\)|transparent/.test(bgc) ? tb : p(bgc); return { what: e.textContent.trim(), fg: p(cs.color), bg, border: p(cs.borderTopColor), tb }; });
        add(palette, `button ${st} ${id}`, [{ what: `${r.what} text`, kind: 'text', fg: r.fg, bg: r.bg, size: 17, bold: true }, { what: `${r.what} edge vs tile`, kind: 'ui', fg: r.border, bg: r.tb, size: 0 }]);
      }
      await loc.focus(); await page.keyboard.press('Shift+Tab'); await loc.focus(); // keyboard modality -> :focus-visible
      const ring = await loc.evaluate((e) => { const cs = getComputedStyle(e); const p = (c) => '#' + c.match(/\d+/g).slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join(''); return { fg: p(cs.outlineColor), bg: p(getComputedStyle(e.closest('.tile')).backgroundColor), w: cs.outlineWidth }; });
      add(palette, `focus ring ${id}`, [{ what: `${sel} outline ${ring.w}`, kind: 'ui', fg: ring.fg, bg: ring.bg, size: 0 }]);
    }
    await page.click(`[data-piece="${id}"] [data-include]`); // remove again
    await page.click(`[data-piece="${id}"] [data-close]`);
  }
  // trigger focus ring in each tile + CTA + form controls
  await page.keyboard.press('Tab');
  for (const sel of ['#b-web', '#b-local', '#b-video', '#b-ads', '.btn--cta', '[data-clear]', '#f-business', '#f-need', '#f-service', '[data-submit]', '#f-privacy']) {
    await page.focus(sel); await page.keyboard.press('Shift+Tab'); await page.focus(sel);
    const ring = await page.evaluate((s) => { const e = document.querySelector(s); const cs = getComputedStyle(e); const p = (c) => '#' + c.match(/\d+/g).slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join(''); let b = e.parentElement; let bg = 'rgba(0, 0, 0, 0)'; /* outline sits outside the control (offset > 0): measure against what surrounds it */ for (; b; b = b.parentElement) { bg = getComputedStyle(b).backgroundColor; if (!/, 0\)|transparent/.test(bg)) break; } return { fg: p(cs.outlineColor), bg: p(bg), w: cs.outlineWidth, style: cs.outlineStyle }; }, sel);
    add(palette, 'focus ring', [{ what: `${sel} outline ${ring.w} ${ring.style}`, kind: 'ui', fg: ring.fg, bg: ring.bg, size: 0 }]);
  }
  // CTA/clear/submit hover
  for (const sel of ['.btn--cta', '[data-clear]', '[data-submit]']) {
    await page.hover(sel); await page.waitForTimeout(250);
    const r = await page.evaluate((s) => { const e = document.querySelector(s); const cs = getComputedStyle(e); const p = (c) => '#' + c.match(/\d+/g).slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join(''); return { fg: p(cs.color), bg: p(cs.backgroundColor) }; }, sel);
    add(palette, 'button hover', [{ what: `${sel} text`, kind: 'text', ...r, size: 17, bold: true }]);
  }
  // errors
  await page.click('[data-submit]'); await page.waitForTimeout(250);
  add(palette, 'errors', (await page.evaluate(collect)).filter((r) => /err|summary|Please/i.test(r.what)));
  const inv = await page.evaluate(() => { const e = document.querySelector('[aria-invalid=true]'); const cs = getComputedStyle(e); const p = (c) => '#' + c.match(/\d+/g).slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join(''); return { fg: p(cs.borderTopColor), bg: p(getComputedStyle(e.closest('.req-form')).backgroundColor) }; });
  add(palette, 'errors', [{ what: 'invalid field border vs panel', kind: 'ui', ...inv, size: 0 }]);
  await c.close();
}

const real = results.filter((r) => r.kind !== 'info');
const fails = real.filter((r) => !r.pass);
const min = (p, f) => { const r = real.filter((x) => x.palette === p && f(x)); return r.length ? Math.min(...r.map((x) => x.ratio)) : null; };
const md = ['# FA2A contrast audit (computed pairs, Edge 1440×900)', '', `Pairs checked: ${real.length}. Failures: ${fails.length}.`, '', '| palette | lowest text ratio | lowest non-text ratio |', '|---|---|---|', ...['default', 'alt'].map((p) => `| ${p} | ${min(p, (x) => x.kind === 'text')} | ${min(p, (x) => x.kind === 'ui')} |`), '', '## Failures', fails.length ? '| palette | state | element | fg | bg | ratio | needs |\n|---|---|---|---|---|---|---|\n' + fails.map((r) => `| ${r.palette} | ${r.state} | ${r.what.replace(/\|/g, '/')} | ${r.fg} | ${r.bg} | ${r.ratio} | ${r.need} |`).join('\n') : 'None.', '', '## Ten lowest-margin passing pairs per palette', ...['default', 'alt'].flatMap((p) => ['', `### ${p}`, '| state | element | fg | bg | ratio | needs |', '|---|---|---|---|---|---|', ...real.filter((r) => r.palette === p && r.pass).sort((a, b) => a.ratio - a.need - (b.ratio - b.need)).slice(0, 10).map((r) => `| ${r.state} | ${r.what.replace(/\|/g, '/')} | ${r.fg} | ${r.bg} | ${r.ratio} | ${r.need} |`)])];
writeFileSync(join(out, 'contrast.md'), md.join('\n') + '\n');
writeFileSync(join(out, 'contrast.json'), JSON.stringify(results, null, 1));
await browser.close();
console.log(md.slice(0, 8).join('\n')); console.log(fails.map((r) => `${r.palette} | ${r.state} | ${r.what} | ${r.fg} on ${r.bg} = ${r.ratio} (<${r.need})`).join('\n'));
