// Evidence capture for FA2. Run with the prototype server up:  node docs/review/free-audit/FA2/capture.mjs
// Uses the installed Microsoft Edge via Playwright (nothing installed). Writes ./evidence/*.png, ./evidence/capture-log.json and ./recordings/*.webm.
// The pointer dot injected for recordings exists only in the recording context (Playwright videos do not draw the cursor).
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ev = join(here, 'evidence'); const rec = join(here, 'recordings');
mkdirSync(ev, { recursive: true }); mkdirSync(rec, { recursive: true });
const BASE = process.env.FA2_BASE || 'http://127.0.0.1:4391/docs/review/free-audit/FA2';
const browser = await chromium.launch({ channel: 'msedge' });
const log = { browser: browser.version(), steps: {} };
const pointerDot = () => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:3px solid #fff;background:#e0301e;pointer-events:none;left:-50px;top:-50px;';
  addEventListener('DOMContentLoaded', () => document.body.append(d));
  addEventListener('mousemove', (e) => { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; }, true);
  addEventListener('pointerdown', () => { d.style.background = '#1e90e0'; }, true);
  addEventListener('pointerup', () => { d.style.background = '#e0301e'; }, true);
};

async function open(w, h, { file = 'index.html', qs = '', ctxOpts = {}, video = false } = {}) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, ...ctxOpts });
  if (video) await c.addInitScript(pointerDot);
  const page = await c.newPage();
  const reqs = [];
  page.on('request', (r) => reqs.push(`${r.method()} ${r.url()}`));
  page.on('pageerror', (e) => (log.pageErrors ??= []).push(`${file}@${w}: ${e}`));
  page.on('console', (m) => { if (m.type() === 'error') (log.consoleErrors ??= []).push(`${file}@${w}: ${m.text()}`); });
  await page.goto(`${BASE}/${file}${qs}`);
  if (ctxOpts.javaScriptEnabled !== false) await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  return { c, page, reqs };
}
const metrics = (page) => page.evaluate(() => {
  const R = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y + scrollY), w: Math.round(b.width), h: Math.round(b.height) }; };
  const tiles = [...document.querySelectorAll('[data-piece]')];
  const rects = tiles.map((t) => ({ id: t.dataset.piece, ...R(t) }));
  const pcs = document.querySelector('[data-pieces]'); const pr = R(pcs);
  const area = rects.reduce((s, r) => s + r.w * r.h, 0);
  // clipped-text scan: any element with a real overflow clip whose content is larger than its box (decor layers excluded)
  const clipped = [...document.querySelectorAll('body *')].filter((e) => !e.closest('.tile__deco') && e.getClientRects().length && /hidden|clip/.test(getComputedStyle(e).overflowX + getComputedStyle(e).overflowY) && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)).map((e) => e.className || e.tagName);
  return {
    board: R(document.querySelector('[data-board]')), pieces: pr, form: R(document.querySelector('[data-form]')), request: R(document.querySelector('#request')),
    tiles: rects, tileGapArea: Math.max(0, pr.w * pr.h - area), overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, clipped,
    openCount: document.querySelectorAll('[data-piece][data-open="true"]').length, docHeight: document.documentElement.scrollHeight,
  };
});
const shot = (page, name, full = false) => page.screenshot({ path: join(ev, `${name}.png`), fullPage: full });
const wait = (page, ms = 650) => page.waitForTimeout(ms);
const slim = (m) => ({ boardH: m.board.h, formTop: m.form.y, formH: m.form.h, formW: m.form.w, tiles: m.tiles.map((t) => `${t.id}:${t.w}x${t.h}`).join(' '), tileGapArea: m.tileGapArea, overflowX: m.overflowX, clipped: m.clipped, open: m.openCount });
// Real recording: CDP screencast of the live page (frames + timestamps), encoded to VP8 webm with the ffmpeg that Playwright already has
// installed (ffmpeg-1011). Playwright's own recordVideo wants ffmpeg-1013, which is not installed, and nothing may be installed.
const FFMPEG = join(homedir(), 'AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe');
async function startRec(page) {
  const cdp = await page.context().newCDPSession(page); const frames = [];
  cdp.on('Page.screencastFrame', (f) => { frames.push({ t: f.metadata.timestamp, data: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, everyNthFrame: 1 });
  return { cdp, frames };
}
async function saveVideo(c, page, r, name) {
  await page.waitForTimeout(400); await r.cdp.send('Page.stopScreencast');
  // resample the (change-driven) frames onto a constant 25 fps timeline and pipe them to ffmpeg as an MJPEG stream
  const fps = 25, t0 = r.frames[0].t, end = r.frames.at(-1).t + 0.5, out = []; let k = 0;
  for (let t = t0; t < end; t += 1 / fps) { while (k + 1 < r.frames.length && r.frames[k + 1].t <= t) k++; out.push(Buffer.from(r.frames[k].data, 'base64')); }
  mkdirSync(join(here, '_tmpvideo'), { recursive: true }); const raw = join(here, '_tmpvideo', `${name}.mjpeg`); writeFileSync(raw, Buffer.concat(out));
  execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', raw, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libvpx', '-b:v', '2M', '-pix_fmt', 'yuv420p', join(rec, `${name}.webm`)], { maxBuffer: 1 << 28 });
  log.recordings = { ...(log.recordings || {}), [name]: { sourceFrames: r.frames.length, outputFrames: out.length, seconds: +(end - t0).toFixed(1) } };
  await c.close();
}

// ---------- 1440 desktop ------------------------------------------------------------------------------------------------------------------
{
  const { c, page, reqs } = await open(1440, 900);
  const g = {};
  g.compact = slim(await metrics(page)); await shot(page, '1440-01-compact');
  await page.hover('[data-piece="web"]'); await wait(page, 400); await shot(page, '1440-02-hover-web'); g.hover = slim(await metrics(page));
  await page.click('#b-web'); await wait(page); await shot(page, '1440-03-open-web'); g.openWeb = slim(await metrics(page));
  await page.click('[data-piece="web"] [data-include]'); await wait(page, 300); await shot(page, '1440-04-selected-web'); g.selected = slim(await metrics(page));
  await page.click('#b-ads'); await wait(page); await shot(page, '1440-05-switch-ads-web-still-selected'); g.switchAds = slim(await metrics(page));
  await page.click('[data-piece="ads"] [data-close]'); await wait(page); await shot(page, '1440-06-closed-selection-kept'); g.closed = slim(await metrics(page));
  await page.evaluate(() => document.querySelector('#request').scrollIntoView({ behavior: 'instant' })); await wait(page, 500); await shot(page, '1440-07-form-visible');
  await page.evaluate(() => scrollTo(0, 0)); await wait(page, 300); await shot(page, '1440-08-full', true);
  g.nonLocalOrNonGetRequests = reqs.filter((r) => !r.startsWith('GET http://127.0.0.1:4391/'));
  log.steps.desktop1440 = g; await c.close();
}

// ---------- DE long copy ------------------------------------------------------------------------------------------------------------------
for (const [w, h] of [[1440, 900], [1280, 800]]) {
  const { c, page } = await open(w, h, { file: 'de.html' });
  const g = {};
  g.compact = slim(await metrics(page)); await shot(page, `${w}-de-01-compact`);
  await page.click('#b-local'); await wait(page); await page.click('[data-piece="local"] [data-include]'); await wait(page, 300);
  await shot(page, `${w}-de-02-open-selected`); g.openSelected = slim(await metrics(page));
  await page.click('#b-video'); await wait(page); g.openVideo = slim(await metrics(page)); await shot(page, `${w}-de-03-open-video`);
  log.steps[`de${w}`] = g; await c.close();
}

// ---------- 834 tablet, 390 / 320 phones (EN) ---------------------------------------------------------------------------------------------
for (const [w, h] of [[834, 1112], [390, 844], [320, 700]]) {
  const { c, page } = await open(w, h);
  const g = {};
  g.compact = slim(await metrics(page)); await shot(page, `${w}-01-compact`); await shot(page, `${w}-01-compact-full`, true);
  await page.click('#b-local'); await wait(page, 400); await page.locator('[data-piece="local"]').scrollIntoViewIfNeeded(); await shot(page, `${w}-02-open-local`); g.open = slim(await metrics(page));
  await page.click('[data-piece="local"] [data-include]'); await wait(page, 300); await shot(page, `${w}-03-selected-local`); g.selected = slim(await metrics(page));
  await shot(page, `${w}-03-selected-local-full`, true);
  await page.evaluate(() => document.querySelector('#request').scrollIntoView({ behavior: 'instant' })); await wait(page, 500); await shot(page, `${w}-04-form`);
  log.steps[`w${w}`] = g; await c.close();
}

// ---------- DE phone ----------------------------------------------------------------------------------------------------------------------
for (const [w, h] of [[390, 844], [320, 700]]) {
  const { c, page } = await open(w, h, { file: 'de.html' });
  await page.click('#b-local'); await wait(page, 400); await page.click('[data-piece="local"] [data-include]'); await wait(page, 300);
  await shot(page, `${w}-de-open-selected-full`, true); log.steps[`de${w}`] = slim(await metrics(page)); await c.close();
}

// ---------- enlarged text (root-font simulation: html { font-size: 200% }; NOT the browser's own setting) ------------------------------------
for (const [w, h] of [[390, 844], [320, 700], [1440, 900]]) {
  const { c, page } = await open(w, h);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' }); await wait(page, 500);
  const g = { compact: slim(await metrics(page)) };
  await page.click('#b-web'); await wait(page, 500); await page.click('[data-piece="web"] [data-include]'); await wait(page, 300);
  g.openSelected = slim(await metrics(page));
  await shot(page, `${w}-enlarged200-open-selected-full`, true); log.steps[`enlarged${w}`] = g; await c.close();
}

// ---------- reduced motion + no JS --------------------------------------------------------------------------------------------------------
{
  const { c, page } = await open(1440, 900, { ctxOpts: { reducedMotion: 'reduce' } });
  await page.click('#b-web'); await shot(page, '1440-reduced-motion-open-immediately'); // no wait: state must already be final
  const g = slim(await metrics(page)); await wait(page, 300); const g2 = slim(await metrics(page));
  log.steps.reducedMotion = { immediate: g, settled: g2, instant: JSON.stringify(g) === JSON.stringify(g2) }; await c.close();
}
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const { c, page } = await open(w, h, { ctxOpts: { javaScriptEnabled: false } });
  await shot(page, `${w}-nojs-full`, true); log.steps[`nojs${w}`] = slim(await metrics(page).catch(() => ({ board: {}, form: {}, tiles: [], pieces: {} })).then((m) => m)); await c.close();
}

// ---------- alternate palette (?theme=alt): open + selected + error + focus -------------------------------------------------------------------
{
  const { c, page } = await open(1440, 900, { qs: '?theme=alt&service=local' });
  await page.click('#b-video'); await wait(page); await shot(page, '1440-alt-theme-open');
  await page.evaluate(() => document.querySelector('#request').scrollIntoView({ behavior: 'instant' })); await wait(page, 400);
  await page.click('[data-submit]'); await wait(page, 300); await shot(page, '1440-alt-theme-form-errors-focus');
  await c.close();
}

// ---------- keyboard: focus stays clear of the sticky header; focus recovery ----------------------------------------------------------------
{
  const { c, page } = await open(1440, 900);
  const out = [];
  await page.focus('#b-web'); await page.keyboard.press('Enter'); await wait(page, 400);
  await page.keyboard.press('Tab'); await page.keyboard.press('Space'); await wait(page, 200);
  out.push(await page.evaluate(() => document.activeElement.textContent.trim()));
  await page.keyboard.press('Escape'); await wait(page, 300); out.push(await page.evaluate(() => document.activeElement.id));
  await shot(page, '1440-keyboard-after-escape-focus-on-trigger');
  // tab through to the form; every focused control must sit below the sticky header (88px) and above the window bottom
  const rows = [];
  for (let i = 0; i < 34; i++) {
    await page.keyboard.press('Tab'); await page.waitForTimeout(650); // smooth scroll settles
    rows.push(await page.evaluate(() => { const e = document.activeElement; const b = e.getBoundingClientRect(); return { el: (e.id || e.tagName) + '', top: Math.round(b.top), bottom: Math.round(b.bottom), vh: innerHeight, header: Math.round(document.querySelector('.bar').getBoundingClientRect().bottom) }; }));
  }
  const bad = rows.filter((r) => r.el !== 'BODY' && (r.top < r.header || r.bottom > r.vh));
  log.steps.keyboard = { afterIncludeAndEscape: out, tabbedControls: rows.length, hiddenByHeaderOrOffscreen: bad };
  await shot(page, '1440-keyboard-tab-in-form'); await c.close();
}

// ---------- performance (stated conditions: Edge via Playwright, headless, 1440x900, no throttling) -----------------------------------------
{
  const { c, page } = await open(1440, 900);
  await browser.startTracing(page, { categories: ['devtools.timeline', 'blink.user_timing'] });
  for (const id of ['web', 'ads', 'local', 'video', 'web']) { await page.click(`#b-${id}`); await page.waitForTimeout(380); }
  await page.click('[data-piece="web"] [data-include]'); await page.waitForTimeout(300);
  const buf = await browser.stopTracing(); const trace = JSON.parse(buf.toString());
  const evs = trace.traceEvents || trace;
  const sum = (n) => { const e = evs.filter((x) => x.name === n && x.ph === 'X'); return { count: e.length, totalMs: +(e.reduce((s, x) => s + x.dur, 0) / 1000).toFixed(1), maxMs: +(Math.max(0, ...e.map((x) => x.dur)) / 1000).toFixed(2) }; };
  log.steps.performance = { conditions: 'Edge (Playwright, headless), 1440x900, no CPU/network throttle, 5 opens + 1 include over ~2.5s', Layout: sum('Layout'), UpdateLayoutTree: sum('UpdateLayoutTree'), Paint: sum('Paint'), FunctionCall: sum('FunctionCall'), longTasksOver50ms: evs.filter((x) => x.name === 'RunTask' && x.dur > 50000).length };
  await c.close();
}

// ---------- recordings (real video) ------------------------------------------------------------------------------------------------------
{
  const { c, page } = await open(1440, 900, { video: true }); const r = await startRec(page);
  const m = async (sel) => { const b = await page.locator(sel).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + 60, { steps: 12 }); };
  await m('[data-piece="web"]'); await page.waitForTimeout(700);               // hover preview
  await m('[data-piece="local"]'); await page.waitForTimeout(600);             // cross a neighbour: no oscillation
  await m('[data-piece="web"]'); await page.waitForTimeout(300);
  await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(1100); // open
  await page.click('[data-piece="web"] [data-include]'); await page.waitForTimeout(1000); // include
  await page.click('#b-ads'); await page.waitForTimeout(1200);                  // switch
  await page.click('[data-piece="ads"] [data-close]'); await page.waitForTimeout(1000); // close
  await page.mouse.wheel(0, 700); await page.waitForTimeout(900);              // form below, summary kept
  await saveVideo(c, page, r, 'desktop-1440-preview-open-include-switch-close');
}
{
  const { c, page } = await open(390, 844, { video: true, ctxOpts: { hasTouch: true, isMobile: true } }); const r = await startRec(page);
  await page.tap('#b-local'); await page.waitForTimeout(1000);
  await page.tap('[data-piece="local"] [data-include]'); await page.waitForTimeout(900);
  await page.tap('#b-ads'); await page.waitForTimeout(1000);
  await page.tap('[data-piece="ads"] [data-close]'); await page.waitForTimeout(900);
  await page.mouse.wheel(0, 900); await page.waitForTimeout(900);
  await saveVideo(c, page, r, 'phone-390-tap-open-select-close');
}
rmSync(join(here, '_tmpvideo'), { recursive: true, force: true });

writeFileSync(join(ev, 'capture-log.json'), JSON.stringify(log, null, 2));
await browser.close();
console.log(JSON.stringify(log.steps.keyboard), JSON.stringify(log.steps.performance), JSON.stringify(log.pageErrors || []), JSON.stringify(log.consoleErrors || []));
console.log(readdirSync(ev).length, 'evidence files;', readdirSync(rec).join(', '));
