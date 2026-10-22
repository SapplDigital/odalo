// Behaviour checks for the prototype. Usage (repo root, preview on 4323): node docs/review/motion-prototype/tools/checks.mjs
// Writes docs/review/motion-prototype/evidence/checks.json and prints a summary. Exit code 1 if any check fails.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const BASE = process.env.BASE || 'http://localhost:4323';
const evid = path.resolve('docs/review/motion-prototype/evidence');
fs.mkdirSync(path.join(evid, 'fallbacks'), { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`); };
const url = (lang = 'en') => `${BASE}/${lang === 'en' ? 'index' : 'index.' + lang}.html`;
const browser = await chromium.launch({ channel: 'msedge' });
const scrollToP = async (page, p) => { const y = await page.evaluate((p) => window.__odaloProto.scrollFor(p), p); await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y); await sleep(120); };
const snapshot = (page) => page.evaluate(() => {
  const g = (sel) => [...document.querySelectorAll(sel)].map((e) => e.style.transform + '|' + e.style.opacity + '|' + e.style.zIndex + '|' + e.style.getPropertyValue('--in') + '|' + e.style.getPropertyValue('--sh'));
  return JSON.stringify([g('[data-piece="plate"]'), g('[data-piece="card"]'), g('[data-piece="label"]'), g('[data-piece="emblem"]'), g('[data-piece="ring"]'), g('[data-seam]'), document.querySelector('[data-board]').style.transform]);
});

/* ---------- 1. natural scrolling, no hijack ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const external = []; page.on('request', (r) => { if (!r.url().startsWith(BASE)) external.push(r.url()); });
  await page.goto(url(), { waitUntil: 'networkidle' });
  const cdp = await ctx.newCDPSession(page);
  const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' });
  const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
  const blocking = listeners.filter((l) => ['wheel', 'mousewheel', 'touchstart', 'touchmove', 'keydown', 'scroll'].includes(l.type) && !l.passive && l.type !== 'keydown');
  const scrollL = listeners.filter((l) => l.type === 'scroll');
  check('no non-passive wheel/touch/scroll listeners on window', blocking.length === 0, `window listeners: ${listeners.map((l) => l.type + (l.passive ? '(passive)' : '')).join(', ')}`);
  check('scroll listener is passive', scrollL.length > 0 && scrollL.every((l) => l.passive));
  const docL = await (async () => { const r = await cdp.send('Runtime.evaluate', { expression: 'document' }); return (await cdp.send('DOMDebugger.getEventListeners', { objectId: r.result.objectId })).listeners.filter((l) => ['wheel', 'touchmove', 'keydown'].includes(l.type)); })();
  check('no wheel/touch/key listeners on document', docL.length === 0);

  await page.mouse.move(700, 450);
  const log = [];
  let y0 = await page.evaluate(() => scrollY);
  for (let i = 0; i < 14; i++) { await page.mouse.wheel(0, 100); await sleep(90); log.push(await page.evaluate(() => [scrollY, window.__odaloProto.p])); }
  const moved = log.map((l, i) => l[0] - (i ? log[i - 1][0] : y0));
  check('page follows the wheel with no resistance or capture', moved.every((d) => d > 0) && Math.abs(log.at(-1)[0] - y0 - 1400) < 60, `scroll ${y0} -> ${log.at(-1)[0]} for 14 x 100px`);
  check('progress rises monotonically with scrolling', log.every((l, i) => !i || l[1] >= log[i - 1][1]), log.map((l) => l[1].toFixed(2)).join(' '));
  const full = await page.evaluate(() => ({ run: document.querySelector('.proto__run').offsetHeight, stage: document.querySelector('.proto__stage').offsetHeight, vh: innerHeight, doc: document.documentElement.scrollHeight }));
  check('runway is short: stuck scroll distance under 1.3 viewport heights', (full.run - full.stage) / full.vh < 1.3, `stage ${full.stage}px, extra scroll while stuck ${full.run - full.stage}px = ${((full.run - full.stage) / full.vh).toFixed(2)} viewports`);
  // the scrolling continues past the stage to the content after it
  await page.mouse.wheel(0, 3000); await sleep(400);
  const end = await page.evaluate(() => ({ y: scrollY, max: document.documentElement.scrollHeight - innerHeight, after: document.querySelector('#after').getBoundingClientRect().top }));
  check('the page scrolls on past the scene to the next content (bottom of the page reached)', end.after < 900 && Math.abs(end.y - end.max) < 2, `after-section top ${Math.round(end.after)}px, scrollY ${end.y} of ${end.max}`);
  check('no page errors, no console errors, no external requests', errors.length === 0 && external.length === 0, [...errors, ...external].join(' | '));

  /* ---------- 2. reverse scrolling is exact ---------- */
  const probes = [0.2, 0.45, 0.6, 0.8];
  const fwd = {}, rev = {};
  await scrollToP(page, 0);
  for (const p of probes) { await scrollToP(page, p); fwd[p] = await snapshot(page); }
  for (const p of [...probes].reverse()) { await scrollToP(page, 1); await scrollToP(page, p); rev[p] = await snapshot(page); }
  check('reverse scrolling reproduces the same state at the same position (4 positions)', probes.every((p) => fwd[p] === rev[p]));
  // via real wheel up from the end
  await scrollToP(page, 1);
  const yTarget = await page.evaluate(() => window.__odaloProto.scrollFor(0.45));
  const before = await snapshot(page);
  await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), yTarget); await sleep(120);
  const viaUp = await snapshot(page);
  check('jumping up from the finished state lands on the forward state', viaUp === fwd[0.45]);
  check('the finished and the p=0.45 states differ (sanity)', before !== viaUp);

  /* ---------- 3. resize while mid-scene ---------- */
  await scrollToP(page, 0.5);
  const sizes = [[1440, 900], [1100, 800], [1024, 768], [834, 1112], [390, 844], [820, 600], [1440, 900]];
  const resizeLog = [];
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h }); await sleep(250);
    const s = await page.evaluate(() => { const b = document.querySelector('[data-board]'), a = document.querySelector('[data-arena]'); const br = b.getBoundingClientRect(), ar = a.getBoundingClientRect(); return { mode: document.documentElement.dataset.proto, p: window.__odaloProto.p, sx: document.documentElement.scrollWidth, vw: innerWidth, boardInArena: br.left >= ar.left - 1 && br.right <= ar.right + 1 && br.top >= ar.top - 1 && br.bottom <= ar.bottom + 1 }; });
    resizeLog.push(`${w}x${h}:${s.mode}:p=${s.p < 0 ? 'n/a' : s.p.toFixed(2)}`);
    if (!(s.sx <= s.vw && s.boardInArena)) check(`resize ${w}x${h} layout`, false, JSON.stringify(s));
  }
  check('resizing across layouts and modes keeps the board inside its area with no sideways scroll', !results.some((r) => /^resize/.test(r.name) && !r.ok), resizeLog.join(' '));
  await scrollToP(page, 1);
  const fin = await page.evaluate(() => [...document.querySelectorAll('[data-piece="plate"]')].map((e) => e.style.transform).concat([...document.querySelectorAll('[data-piece="label"]')].map((e) => e.style.opacity)));
  check('after resizing, scrolling to the end gives the finished mosaic (plates at slot, labels opaque)', fin.slice(0, 4).every((t) => /^translate3d\(0px, 0px, 0px\) rotate\(0deg\) scale\(1\)$/.test(t)) && fin.slice(4).every((o) => o === '1'), fin.join(' / '));
  await ctx.close();
}

/* ---------- 4. pieces vs labels and controls, sampled every 1% ---------- */
for (const [name, vp, lang] of [['desktop en', { width: 1440, height: 900 }, 'en'], ['desktop de', { width: 1440, height: 900 }, 'de'], ['phone de', { width: 390, height: 844 }, 'de'], ['phone en', { width: 390, height: 844 }, 'en']]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 800, isMobile: vp.width < 800 });
  const page = await ctx.newPage();
  await page.goto(url(lang), { waitUntil: 'networkidle' });
  let worstLabel = 0, worstControl = 0, outsideArena = 0; let when = '', outsideWhich = '';
  for (let i = 0; i <= 100; i++) {
    await scrollToP(page, i / 100);
    const r = await page.evaluate(() => {
      const rect = (e) => e.getBoundingClientRect();
      const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const pieces = [...document.querySelectorAll('[data-piece="plate"],[data-piece="card"],[data-piece="emblem"],[data-piece="ring"],[data-seam]')];
      const arena = rect(document.querySelector('[data-arena]'));
      const controls = [...document.querySelectorAll('.head, .eyebrow, .head__h, .cta, .rail, .steps, .replay, .bar')].filter((e) => e.offsetParent !== null).map(rect);
      // what is actually painted: the arena clips pieces (overflow: clip), so only the visible part counts
      const clip = (b) => ({ left: Math.max(b.left, arena.left), right: Math.min(b.right, arena.right), top: Math.max(b.top, arena.top), bottom: Math.min(b.bottom, arena.bottom) });
      let control = 0; for (const p of pieces) for (const c of controls) control = Math.max(control, inter(clip(rect(p)), c));
      // labels: any VISIBLE label text against a picture that has not landed yet, the emblem, the ring
      let label = 0, minOp = 1;
      for (const l of document.querySelectorAll('[data-piece="label"]')) {
        const op = parseFloat(l.style.opacity || '1');
        if (op < 0.04) continue; minOp = Math.min(minOp, op);
        for (const t of [...l.children].filter((c) => c.getBoundingClientRect().height > 0)) for (const p of document.querySelectorAll('[data-piece="card"],[data-piece="emblem"],[data-piece="ring"]')) {
          if ((p.dataset.piece === 'ring' || p.dataset.piece === 'emblem') && parseFloat(p.style.opacity || '0') < 0.04) continue; // not drawn
          const tf = p.style.transform; const landed = p.dataset.piece === 'card' && /^translate3d\(0px, 0px, 0px\) rotate\(0deg\) scale\(1\)$/.test(tf);
          if (!landed) label = Math.max(label, inter(rect(t), rect(p)));
        }
      }
      const arenaBox = arena; let outside = 0;
      const which = [];
      for (const p of document.querySelectorAll('[data-piece="plate"],[data-piece="card"]')) { const b = rect(p); const a = (b.right - b.left) * (b.bottom - b.top); const v = inter(b, arenaBox); if (a - v > a * 0.02) { outside++; which.push(p.dataset.piece + ':' + p.dataset.id); } }
      return { control, label, minOp, outside, which };
    });
    if (r.control > worstControl) { worstControl = r.control; when = `p=${i / 100}`; }
    worstLabel = Math.max(worstLabel, r.label); if (r.outside > outsideArena) { outsideArena = r.outside; outsideWhich = `${r.which.join(',')} at p=${i / 100}`; }
  }
  check(`${name}: no moving piece reaches the title, eyebrow, audit button, progress rail or replay (101 positions)`, worstControl === 0, `worst overlap ${Math.round(worstControl)} px² ${when}`);
  check(`${name}: no visible label is ever covered or crossed by an unlanded picture, the joint or its ring (101 positions)`, worstLabel === 0, `worst overlap ${Math.round(worstLabel)} px²`);
  check(`${name}: pieces never leave the stage area (clip safety margin not used)`, outsideArena === 0, `${outsideArena} pieces partly outside the area at their worst position ${outsideWhich}`);
  await ctx.close();
}

/* ---------- 5. focus and controls ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url('de'), { waitUntil: 'networkidle' });
  await scrollToP(page, 0.5);
  const order = [];
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab'); await sleep(300);
    order.push(await page.evaluate(() => {
      const a = document.activeElement; if (!a || a === document.body) return 'body';
      const r = a.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const ring = getComputedStyle(a).outlineStyle !== 'none';
      return `${a.tagName.toLowerCase()}:${(a.textContent || a.alt || '').trim().slice(0, 22)}:${top === a || a.contains(top) ? 'unobscured' : 'COVERED'}:${r.top >= 0 && r.bottom <= innerHeight ? 'inview' : 'OFFSCREEN'}:${ring ? 'ring' : 'noring'}`;
    }));
  }
  const tabbable = order.filter((o) => o !== 'body');
  check('tab order is skip link, language links, audit button, replay: nothing inside the moving scene', tabbable.slice(0, 6).every((o) => /^a:|^button:/.test(o)) && !tabbable.some((o) => /^img|^div/.test(o)), order.slice(0, 7).join(' > '));
  check('every focusable control is unobscured, in view and shows a focus ring while the scene is stuck', tabbable.slice(0, 6).every((o) => /unobscured/.test(o)) && tabbable.slice(1, 6).every((o) => /inview/.test(o) && /:ring$/.test(o)), '');
  // replay by keyboard
  await scrollToP(page, 1);
  await page.locator('[data-replay]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__odaloProto.p < 0.02, null, { timeout: 6000 }).then(() => check('Replay (keyboard Enter) scrolls back to the start with normal scrolling', true), () => check('Replay (keyboard Enter) scrolls back to the start with normal scrolling', false, 'p stayed ' + 'high'));
  await page.screenshot({ path: path.join(evid, 'fallbacks', 'focus-replay-desktop.png') });
  await page.locator('.cta').focus();
  await page.screenshot({ path: path.join(evid, 'fallbacks', 'focus-cta-desktop.png') });
  await ctx.close();
}

/* ---------- 6. reduced motion and no JavaScript ---------- */
for (const [lang, vp, tag] of [['de', { width: 1440, height: 900 }, 'desktop'], ['de', { width: 390, height: 844 }, 'phone'], ['en', { width: 834, height: 1112 }, 'tablet']]) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce', hasTouch: vp.width < 800, isMobile: vp.width < 800 });
  const page = await ctx.newPage();
  await page.goto(url(lang), { waitUntil: 'networkidle' });
  const s = await page.evaluate(() => ({ mode: document.documentElement.dataset.proto, live: window.__odaloProto.live, inline: [...document.querySelectorAll('[data-piece]')].filter((e) => e.getAttribute('style')).length, rail: getComputedStyle(document.querySelector('.rail')).display, labels: [...document.querySelectorAll('[data-piece="label"]')].map((e) => getComputedStyle(e).opacity), sticky: getComputedStyle(document.querySelector('.proto__stage')).position }));
  check(`reduced motion (${tag}): final composition, no sticky stage, no geometric travel, labels opaque`, s.mode === 'static' && !s.live && s.inline === 0 && s.sticky !== 'sticky' && s.labels.every((o) => o === '1') && s.rail === 'none', JSON.stringify(s));
  await page.locator('[data-board]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evid, 'fallbacks', `reduced-motion-${lang}-${tag}.png`) });
  await ctx.close();
}
for (const [lang, vp, tag] of [['de', { width: 1440, height: 900 }, 'desktop'], ['de', { width: 390, height: 844 }, 'phone'], ['en', { width: 834, height: 1112 }, 'tablet']]) {
  const ctx = await browser.newContext({ viewport: vp, javaScriptEnabled: false, hasTouch: vp.width < 800, isMobile: vp.width < 800 });
  const page = await ctx.newPage();
  await page.goto(url(lang), { waitUntil: 'load' });
  const vis = await Promise.all(['web', 'local', 'video', 'ads'].map((id) => page.locator(`.label--${id}`).isVisible()));
  const imgs = await page.locator('.card img').evaluateAll((els) => els.map((e) => e.complete && e.naturalWidth > 0));
  check(`no JavaScript (${tag}): four labels, four pictures, audit link and headline are present`, vis.every(Boolean) && imgs.every(Boolean) && (await page.locator('.cta').isVisible()) && (await page.locator('.head__h').isVisible()), `labels ${vis.join(',')} images ${imgs.join(',')}`);
  await page.locator('[data-board]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evid, 'fallbacks', `no-js-${lang}-${tag}.png`) });
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(evid, 'checks.json'), JSON.stringify(results, null, 1));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length} checks, ${failed.length} failing`);
process.exitCode = failed.length ? 1 : 0;
