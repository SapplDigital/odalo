// FA3 evidence capture on the INTEGRATED site. Serve a build first:  node docs/review/free-audit/FA3/serve.mjs dist 4395
// Then:  node docs/review/free-audit/FA3/capture.mjs      (Edge via Playwright; nothing installed; all non-local requests are aborted)
// Writes ./evidence/*.png, ./evidence/capture-log.json, ./recordings/*.webm and ./playback/*-sheet.png. FA2 evidence is not touched.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ev = join(here, 'evidence'), rec = join(here, 'recordings'), pb = join(here, 'playback');
[ev, rec, pb].forEach((d) => mkdirSync(d, { recursive: true }));
const BASE = process.env.FA3_BASE || 'http://127.0.0.1:4395';
const FFMPEG = join(homedir(), 'AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe');
const { auditInPage } = await import(pathToFileURL(resolve('tests/helpers/reflow.ts')).href);
const browser = await chromium.launch({ channel: 'msedge' });
const log = { browser: browser.version(), base: BASE, blockedExternal: [] };
const only = process.argv[2] || 'all';
const want = (k) => only === 'all' || only === k;
const dot = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:3px solid #fff;background:#e0301e;pointer-events:none;left:-50px;top:-50px;'; addEventListener('DOMContentLoaded', () => document.body.append(d)); addEventListener('mousemove', (e) => { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; }, true); addEventListener('pointerdown', () => { d.style.background = '#1e90e0'; }, true); addEventListener('pointerup', () => { d.style.background = '#e0301e'; }, true); };

async function open(w, h, { lang = 'en', qs = '', ctx = {}, pointer = false, css = '' } = {}) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, ...ctx });
  await c.addInitScript(() => { try { localStorage.setItem('odalo.cookies', 'essential'); } catch {} }); // keep the first-visit notice out of the way
  if (pointer) await c.addInitScript(dot);
  await c.route((u) => !u.href.startsWith(BASE), (r) => { log.blockedExternal.push(r.request().url()); return r.abort(); });
  const page = await c.newPage();
  page.on('pageerror', (e) => (log.pageErrors ??= []).push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') (log.consoleErrors ??= []).push(m.text()); });
  await page.goto(`${BASE}/${lang}/audit/${qs}`);
  if (ctx.javaScriptEnabled !== false) await page.evaluate(() => document.fonts.ready);
  if (css) await page.addStyleTag({ content: css });
  await page.waitForTimeout(1100);
  return { c, page };
}
const shot = (page, name, o = {}) => page.screenshot({ path: join(ev, `${name}.png`), ...o });
const M = (page) => page.evaluate(() => {
  const R = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)]; };
  return { board: R('[data-am]'), form: R('[data-form]'), request: R('#request'), overflowX: document.documentElement.scrollWidth - innerWidth, doc: document.documentElement.scrollHeight };
});
const T = (id) => `#am-b-${id}`;
const openSel = async (page, id) => { await page.click(T(id)); await page.waitForTimeout(550); await page.click(`[data-piece="${id}"] [data-include]`); await page.mouse.move(2, 2); await page.waitForTimeout(350); };

// ---- core: EN desktop states + hover geometry ----
if (want('core')) {
  const { c, page } = await open(1440, 900);
  const g = async () => ({ trig: await page.locator(T('web')).boundingBox(), tile: await page.locator('[data-piece="web"]').boundingBox(), grow: await page.locator('[data-piece="web"] .am-tile__grow').boundingBox(), m: await M(page) });
  log.hover = { before: await g() }; await shot(page, '1440-en-01-compact');
  await page.hover('[data-piece="web"]'); await page.waitForTimeout(450); log.hover.after = await g(); await shot(page, '1440-en-02-hover-web');
  log.hover.stable = JSON.stringify({ ...log.hover.before, grow: 0 }) === JSON.stringify({ ...log.hover.after, grow: 0 });
  await page.click(T('web')); await page.mouse.move(2, 2); await page.waitForTimeout(550); await shot(page, '1440-en-03-open-web');
  await page.click('[data-piece="web"] [data-include]'); await page.waitForTimeout(350); await shot(page, '1440-en-04-selected-web');
  log.coreForm = await M(page);
  await page.evaluate(() => document.querySelector('#request').scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(600); await shot(page, '1440-en-05-request');
  await page.click('[data-submit]'); await page.waitForTimeout(400); await shot(page, '1440-en-06-errors');
  await page.fill('#f-business', 'Sample Bakery'); await page.fill('#f-need', 'Sample need'); await page.fill('#f-name', 'Sample Name'); await page.fill('#f-email', 'sample@example.com'); await page.check('#f-privacy');
  await page.click('[data-submit]'); await page.locator('[data-result]').waitFor({ state: 'visible' }); await page.waitForTimeout(400); await shot(page, '1440-en-07-simulated-result');
  await c.close();
}
// ---- every language at the four widths: compact + open + selected ----
if (want('matrix')) for (const lang of ['en', 'es', 'de']) for (const [w, h] of [[1440, 900], [834, 1112], [390, 844], [320, 700]]) {
  if (lang === 'en' && w === 1440) continue; // core
  const { c, page } = await open(w, h, { lang });
  await shot(page, `${w}-${lang}-01-compact`);
  await openSel(page, lang === 'es' ? 'video' : 'local');
  await page.locator(`[data-piece="${lang === 'es' ? 'video' : 'local'}"]`).scrollIntoViewIfNeeded();
  await shot(page, `${w}-${lang}-02-open-selected`);
  (log.matrix ??= {})[`${lang}-${w}`] = { ...(await M(page)), problems: await page.evaluate(auditInPage) };
  await c.close();
}
if (want('extra')) {
  for (const [name, lang, w, h] of [['1280-de', 'de', 1280, 800], ['1440x700-short-en', 'en', 1440, 700], ['1280x680-short-de', 'de', 1280, 680]]) {
    const { c, page } = await open(w, h, { lang });
    await shot(page, `${name}-01-compact`); await openSel(page, 'ads'); await shot(page, `${name}-02-open-selected`);
    (log.extra ??= {})[name] = { ...(await M(page)), problems: await page.evaluate(auditInPage), flowMode: await page.evaluate(() => getComputedStyle(document.querySelector('[data-am-pieces]')).gridTemplateRows) };
    await c.close();
  }
  for (const [w, h] of [[390, 844], [320, 700]]) for (const lang of ['en', 'de']) { // enlarged text, root-font simulation
    const { c, page } = await open(w, h, { lang, css: 'html{font-size:200%!important}' });
    await openSel(page, 'web'); await page.click('[data-submit]'); await page.waitForTimeout(300);
    (log.enlarged ??= {})[`${lang}-${w}`] = { ...(await M(page)), problems: await page.evaluate(auditInPage) };
    await page.evaluate(() => scrollTo(0, 0)); await shot(page, `${w}-${lang}-enlarged200-full`, { fullPage: true });
    await c.close();
  }
  // reduced motion + no JS
  { const { c, page } = await open(1440, 900, { ctx: { reducedMotion: 'reduce' } }); await page.hover('[data-piece="web"]'); await shot(page, '1440-en-reduced-motion-hover'); await page.click(T('web')); await shot(page, '1440-en-reduced-motion-open'); await c.close(); }
  for (const [w, h] of [[1440, 900], [390, 844]]) { const { c, page } = await open(w, h, { ctx: { javaScriptEnabled: false } }); await shot(page, `${w}-en-nojs-full`, { fullPage: true }); await c.close(); }
  // keyboard: tab through header + mosaic + form and keep every focused control clear of the sticky header and the window bottom
  { const { c, page } = await open(1440, 900); const rows = [];
    for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(650); rows.push(await page.evaluate(() => { const e = document.activeElement; const b = e.getBoundingClientRect(); const hb = document.querySelector('.hdr').getBoundingClientRect().bottom; return { el: (e.id || e.className || e.tagName).toString().slice(0, 30), top: Math.round(b.top), bottom: Math.round(b.bottom), hdr: Math.round(hb), vh: innerHeight, inHeader: !!e.closest('.hdr') }; })); }
    log.keyboard = { stops: rows.length, hiddenByHeaderOrOffscreen: rows.filter((r) => !r.inHeader && !/skip/.test(r.el) && (r.top < r.hdr || r.bottom > r.vh)) };
    await shot(page, '1440-en-keyboard-in-form'); await c.close(); }
  // mobile menu then anchor to the request form
  { const { c, page } = await open(390, 844); await page.click('.hdr__toggle'); await page.waitForTimeout(300); await shot(page, '390-en-menu-open');
    await page.keyboard.press('Escape'); await page.click('a.am-btn--cta'); await page.waitForTimeout(900);
    log.anchor = await page.evaluate(() => ({ reqTop: Math.round(document.querySelector('#request').getBoundingClientRect().top), hdr: Math.round(document.querySelector('.hdr').getBoundingClientRect().bottom) })); await shot(page, '390-en-after-request-anchor'); await c.close(); }
}
// ---- real 32px browser setting (own temp profile; the user's profile is never touched) ----
if (want('real32')) {
  const profile = mkdtempSync(join(tmpdir(), 'odalo-fa3-textsize-')); mkdirSync(join(profile, 'Default'), { recursive: true });
  writeFileSync(join(profile, 'Default', 'Preferences'), JSON.stringify({ webkit: { webprefs: { default_font_size: 32, default_fixed_font_size: 26, minimum_font_size: 0 } } }));
  const ctx = await chromium.launchPersistentContext(profile, { channel: 'msedge', viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('odalo.cookies', 'essential'); } catch {} });
  await ctx.route((u) => !u.href.startsWith(BASE), (r) => r.abort());
  const page = ctx.pages()[0] || (await ctx.newPage()); const rows = [];
  for (const lang of ['en', 'es', 'de']) for (const w of [320, 390, 834, 1440]) {
    await page.setViewportSize({ width: w, height: 900 }); await page.goto(`${BASE}/${lang}/audit/`); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const root = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    const before = await page.evaluate(auditInPage);
    await page.click(T('local')); await page.waitForTimeout(500); await page.click('[data-piece="local"] [data-include]'); await page.click('[data-submit]'); await page.waitForTimeout(300);
    rows.push({ lang, w, root, compact: before, openSelectedWithErrors: await page.evaluate(auditInPage) });
    if (lang === 'de' && w === 320) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: join(ev, '320-de-real32-open-errors-full.png'), fullPage: true }); }
  }
  await ctx.close(); rmSync(profile, { recursive: true, force: true });
  log.real32 = { method: 'Edge persistent context, temporary profile webkit.webprefs.default_font_size=32 (existing method from docs/review/responsive-reflow/real-text-size.mjs, FA3-only results)', rows, problems: rows.filter((r) => r.compact.length || r.openSelectedWithErrors.length).length };
}
// ---- recordings: CDP screencast -> ffmpeg-1011 vp8 webm -> decoded again into labelled contact sheets ----
async function record(name, w, h, ctx, script) {
  const { c, page } = await open(w, h, { pointer: true, ctx });
  const cdp = await c.newCDPSession(page); const frames = [];
  cdp.on('Page.screencastFrame', (f) => { frames.push({ t: f.metadata.timestamp, d: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, everyNthFrame: 1 });
  await script(page); await page.waitForTimeout(400); await cdp.send('Page.stopScreencast');
  const fps = 25, t0 = frames[0].t, end = frames.at(-1).t + 0.5, bufs = []; let k = 0;
  for (let t = t0; t < end; t += 1 / fps) { while (k + 1 < frames.length && frames[k + 1].t <= t) k++; bufs.push(Buffer.from(frames[k].d, 'base64')); }
  const tmp = join(here, '_tmpvideo'); mkdirSync(tmp, { recursive: true }); const raw = join(tmp, `${name}.mjpeg`); writeFileSync(raw, Buffer.concat(bufs));
  const webm = join(rec, `${name}.webm`);
  execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', raw, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libvpx', '-b:v', '2M', '-pix_fmt', 'yuv420p', webm], { maxBuffer: 1 << 28 });
  const fdir = join(tmp, name); mkdirSync(fdir, { recursive: true });
  execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', webm, '-r', '2', '-vf', `scale=${w > 600 ? 480 : 195}:-1`, join(fdir, 'f%03d.png')]);
  const files = readdirSync(fdir).filter((f) => f.endsWith('.png')).sort();
  const sp = await browser.newPage({ viewport: { width: w > 600 ? 1980 : 1650, height: 800 } });
  await sp.setContent(`<body style="margin:8px;background:#222;font:12px sans-serif;color:#fff;display:flex;flex-wrap:wrap;gap:6px">${files.map((f, i) => `<figure style="margin:0"><img src="data:image/png;base64,${readFileSync(join(fdir, f)).toString('base64')}"><figcaption>t=${(i * 0.5).toFixed(1)}s</figcaption></figure>`).join('')}</body>`);
  await sp.screenshot({ path: join(pb, `${name}-sheet.png`), fullPage: true }); await sp.close();
  (log.recordings ??= {})[name] = { sourceFrames: frames.length, seconds: +(end - t0).toFixed(1), decodedSheetFrames: files.length };
  rmSync(tmp, { recursive: true, force: true }); await c.close();
}
if (want('rec')) {
  await record('desktop-1440-integrated', 1440, 900, {}, async (page) => {
    const m = async (sel, dy = 60) => { const b = await page.locator(sel).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + dy, { steps: 14 }); };
    await m('[data-piece="web"]'); await page.waitForTimeout(800); await m('[data-piece="local"]'); await page.waitForTimeout(800);
    await m('[data-piece="web"]'); await page.waitForTimeout(400); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(1000);
    await page.click('[data-piece="web"] [data-include]'); await page.waitForTimeout(900);
    await page.click(T('ads')); await page.waitForTimeout(1100); await page.click('[data-piece="ads"] [data-close]'); await page.waitForTimeout(900);
    await page.mouse.wheel(0, 760); await page.waitForTimeout(1200);
  });
  await record('phone-390-integrated', 390, 844, { hasTouch: true, isMobile: true }, async (page) => {
    await page.tap(T('local')); await page.waitForTimeout(900); await page.tap('[data-piece="local"] [data-include]'); await page.waitForTimeout(800);
    await page.tap(T('ads')); await page.waitForTimeout(900); await page.tap('[data-piece="ads"] [data-close]'); await page.waitForTimeout(800);
    await page.mouse.wheel(0, 1000); await page.waitForTimeout(900);
  });
}
// ---- brief trace ----
if (want('trace')) {
  const { c, page } = await open(1440, 900);
  await browser.startTracing(page, { categories: ['devtools.timeline'] });
  for (const id of ['web', 'ads', 'local', 'video', 'web']) { await page.click(T(id)); await page.waitForTimeout(380); }
  await page.click('[data-piece="web"] [data-include]'); await page.waitForTimeout(300);
  const evs = JSON.parse((await browser.stopTracing()).toString()).traceEvents;
  const sum = (n) => { const e = evs.filter((x) => x.name === n && x.ph === 'X'); return { count: e.length, totalMs: +(e.reduce((s, x) => s + x.dur, 0) / 1000).toFixed(1), maxMs: +(Math.max(0, ...e.map((x) => x.dur)) / 1000).toFixed(2) }; };
  log.trace = { conditions: 'Edge (Playwright, headless), 1440x900, unthrottled, 5 opens + 1 include over ~2.5 s', Layout: sum('Layout'), UpdateLayoutTree: sum('UpdateLayoutTree'), Paint: sum('Paint'), FunctionCall: sum('FunctionCall'), longTasksOver50ms: evs.filter((x) => x.name === 'RunTask' && x.dur > 50000).length };
  await c.close();
}
writeFileSync(join(ev, `capture-log${only === 'all' ? '' : '-' + only}.json`), JSON.stringify(log, null, 2));
await browser.close();
console.log(JSON.stringify({ ...log, matrix: undefined, extra: undefined, enlarged: undefined, real32: log.real32 && { problems: log.real32.problems, rows: log.real32.rows.length } }, null, 1).slice(0, 2500));
