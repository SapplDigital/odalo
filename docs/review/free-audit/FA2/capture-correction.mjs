// FA2A correction evidence. Run with the prototype server up: node docs/review/free-audit/FA2/capture-correction.mjs
// Writes ONLY into ./correction (original ./evidence is preserved). Recordings are CDP screencasts encoded with Playwright's installed
// ffmpeg-1011; each webm is then DECODED again and sampled into a contact sheet (correction/playback/) so the real file is what gets inspected.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'correction'); const rec = join(out, 'recordings'); const pb = join(out, 'playback');
[out, rec, pb].forEach((d) => mkdirSync(d, { recursive: true }));
const BASE = process.env.FA2_BASE || 'http://127.0.0.1:4391/docs/review/free-audit/FA2';
const FFMPEG = join(homedir(), 'AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe');
const browser = await chromium.launch({ channel: 'msedge' });
const log = { browser: browser.version() };
const dot = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:3px solid #fff;background:#e0301e;pointer-events:none;left:-50px;top:-50px;'; addEventListener('DOMContentLoaded', () => document.body.append(d)); addEventListener('mousemove', (e) => { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; }, true); addEventListener('pointerdown', () => { d.style.background = '#1e90e0'; }, true); addEventListener('pointerup', () => { d.style.background = '#e0301e'; }, true); };

async function open(w, h, { file = 'index.html', qs = '', ctx = {}, pointer = false } = {}) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, ...ctx });
  if (pointer) await c.addInitScript(dot);
  const page = await c.newPage();
  page.on('pageerror', (e) => (log.pageErrors ??= []).push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') (log.consoleErrors ??= []).push(m.text()); });
  await page.goto(`${BASE}/${file}${qs}`);
  if (ctx.javaScriptEnabled !== false) await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  return { c, page };
}
const shot = (page, name, opts = {}) => page.screenshot({ path: join(out, `${name}.png`), ...opts });
const R = (page, sel) => page.locator(sel).boundingBox().then((b) => ({ x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }));
const docTop = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { top: Math.round(b.top + scrollY), w: Math.round(b.width), h: Math.round(b.height) }; }, sel);

// ---- EN desktop: compact, hover before/after (+ measurements), open, selected ----
{
  const { c, page } = await open(1440, 900);
  await shot(page, '1440-01-compact');
  const geo = async () => ({ trigger: await R(page, '#b-web'), tile: await R(page, '[data-piece="web"]'), board: await docTop(page, '[data-board]'), form: await docTop(page, '[data-form]'), grow: await R(page, '[data-piece="web"] .tile__grow') });
  log.hoverWeb = { before: await geo() };
  const clip = async (id) => { const b = await R(page, `[data-piece="${id}"]`); return { x: b.x, y: b.y, width: b.w, height: b.h }; };
  await shot(page, '1440-02a-hover-before-web', { clip: await clip('web') });
  await page.hover('[data-piece="web"]'); await page.waitForTimeout(450);
  log.hoverWeb.after = await geo();
  log.hoverWeb.unchanged = JSON.stringify({ ...log.hoverWeb.before, grow: 0 }) === JSON.stringify({ ...log.hoverWeb.after, grow: 0 });
  await shot(page, '1440-02b-hover-after-web', { clip: await clip('web') });
  await shot(page, '1440-02c-hover-after-web-board');
  await page.hover('[data-piece="ads"]'); await page.waitForTimeout(450); await shot(page, '1440-02d-hover-ads-board');
  await page.hover('[data-piece="local"]'); await page.waitForTimeout(450); await shot(page, '1440-02e-hover-local-board');
  await page.hover('[data-piece="video"]'); await page.waitForTimeout(450); await shot(page, '1440-02f-hover-video-board');
  await page.click('#b-web'); await page.mouse.move(2, 2); await page.waitForTimeout(500); await shot(page, '1440-03-open-web');
  await page.click('[data-piece="web"] [data-include]'); await page.waitForTimeout(300); await shot(page, '1440-04-selected-web');
  await page.click('[data-piece="web"] [data-close]'); await page.waitForTimeout(500); await shot(page, '1440-05-closed-selected-rest');
  log.desktopForm = await docTop(page, '[data-form]');
  await c.close();
}
// ---- DE spot checks ----
for (const [w, h] of [[1440, 900], [1280, 800]]) {
  const { c, page } = await open(w, h, { file: 'de.html' });
  await shot(page, `${w}-de-01-compact`);
  await page.click('#b-ads'); await page.waitForTimeout(500); await page.click('[data-piece="ads"] [data-include]'); await page.mouse.move(2, 2); await page.waitForTimeout(300); await shot(page, `${w}-de-02-open-selected`);
  await c.close();
}
// ---- phones ----
for (const [w, h] of [[390, 844], [320, 700]]) {
  for (const file of ['index.html', 'de.html']) {
    const { c, page } = await open(w, h, { file });
    const tag = file === 'de.html' ? '-de' : '';
    if (!tag) await shot(page, `${w}-01-compact`);
    await page.click('#b-local'); await page.waitForTimeout(400);
    if (!tag) await page.locator('[data-piece="local"]').scrollIntoViewIfNeeded();
    if (!tag) await shot(page, `${w}-02-open-local`);
    await page.click('[data-piece="local"] [data-include]'); await page.waitForTimeout(300);
    await shot(page, `${w}${tag}-03-selected-local-full`, { fullPage: true });
    await c.close();
  }
}
// ---- reduced motion, no JS, alternate palette ----
{
  const { c, page } = await open(1440, 900, { ctx: { reducedMotion: 'reduce' } });
  await page.hover('[data-piece="web"]'); await shot(page, '1440-reduced-motion-hover-immediate');
  await page.click('#b-web'); await shot(page, '1440-reduced-motion-open-immediate');
  log.reducedHoverTransition = await page.locator('.tile__grow').first().evaluate((e) => getComputedStyle(e).transitionDuration);
  await c.close();
}
for (const [w, h] of [[1440, 900], [390, 844]]) { const { c, page } = await open(w, h, { ctx: { javaScriptEnabled: false } }); await shot(page, `${w}-nojs-full`, { fullPage: true }); await c.close(); }
{
  const { c, page } = await open(1440, 900, { qs: '?theme=alt&service=local' });
  await page.hover('[data-piece="web"]'); await page.waitForTimeout(450); await shot(page, '1440-alt-hover');
  await page.click('#b-video'); await page.mouse.move(2, 2); await page.waitForTimeout(500); await shot(page, '1440-alt-open-selected-elsewhere');
  await c.close();
}

// ---- recordings + decoded playback contact sheets ----
async function record(name, w, h, ctx, script) {
  const { c, page } = await open(w, h, { pointer: true, ctx });
  const cdp = await c.newCDPSession(page); const frames = [];
  cdp.on('Page.screencastFrame', (f) => { frames.push({ t: f.metadata.timestamp, d: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, everyNthFrame: 1 });
  await script(page);
  await page.waitForTimeout(400); await cdp.send('Page.stopScreencast');
  const fps = 25, t0 = frames[0].t, end = frames.at(-1).t + 0.5, bufs = []; let k = 0;
  for (let t = t0; t < end; t += 1 / fps) { while (k + 1 < frames.length && frames[k + 1].t <= t) k++; bufs.push(Buffer.from(frames[k].d, 'base64')); }
  const tmp = join(here, '_tmpvideo'); mkdirSync(tmp, { recursive: true }); const raw = join(tmp, `${name}.mjpeg`); writeFileSync(raw, Buffer.concat(bufs));
  const webm = join(rec, `${name}.webm`);
  execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', raw, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libvpx', '-b:v', '2M', '-pix_fmt', 'yuv420p', webm], { maxBuffer: 1 << 28 });
  // playback: decode the WEBM itself (vp8 -> png) at 2 frames/s, then lay the decoded frames out as a labelled contact sheet
  const fdir = join(pb, name); rmSync(fdir, { recursive: true, force: true }); mkdirSync(fdir, { recursive: true });
  execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', webm, '-r', '2', '-vf', `scale=${w > 600 ? 480 : 195}:-1`, join(fdir, 'f%03d.png')]);
  const files = readdirSync(fdir).filter((f) => f.endsWith('.png')).sort();
  const sp = await browser.newPage({ viewport: { width: w > 600 ? 1980 : 1650, height: 800 } });
  await sp.setContent(`<body style="margin:8px;background:#222;font:12px sans-serif;color:#fff;display:flex;flex-wrap:wrap;gap:6px">${files.map((f, i) => `<figure style="margin:0"><img src="data:image/png;base64,${readFileSync(join(fdir, f)).toString('base64')}"><figcaption>t=${(i * 0.5).toFixed(1)}s</figcaption></figure>`).join('')}</body>`);
  await sp.screenshot({ path: join(pb, `${name}-sheet.png`), fullPage: true }); await sp.close();
  rmSync(fdir, { recursive: true, force: true });
  log[name + '-decodedFrames'] = files.length;
  log[name] = { frames: frames.length, seconds: +(end - t0).toFixed(1) };
  rmSync(tmp, { recursive: true, force: true }); await c.close();
}
await record('desktop-1440-hover-open-include-switch-close', 1440, 900, {}, async (page) => {
  const m = async (sel, dy = 60) => { const b = await page.locator(sel).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + dy, { steps: 14 }); };
  await m('[data-piece="web"]'); await page.waitForTimeout(800);
  await m('[data-piece="local"]'); await page.waitForTimeout(800);
  await m('[data-piece="video"]'); await page.waitForTimeout(800);
  await m('[data-piece="web"]'); await page.waitForTimeout(400);
  await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(1000);
  await page.click('[data-piece="web"] [data-include]'); await page.waitForTimeout(900);
  await page.click('#b-ads'); await page.waitForTimeout(1100);
  await page.click('[data-piece="ads"] [data-close]'); await page.waitForTimeout(900);
  await page.mouse.wheel(0, 700); await page.waitForTimeout(900);
});
await record('phone-390-tap-open-include-switch-close', 390, 844, { hasTouch: true, isMobile: true }, async (page) => {
  await page.tap('#b-local'); await page.waitForTimeout(900);
  await page.tap('[data-piece="local"] [data-include]'); await page.waitForTimeout(800);
  await page.tap('#b-ads'); await page.waitForTimeout(900);
  await page.tap('[data-piece="ads"] [data-close]'); await page.waitForTimeout(800);
  await page.mouse.wheel(0, 900); await page.waitForTimeout(800);
});
writeFileSync(join(out, 'capture-log.json'), JSON.stringify(log, null, 2));
await browser.close();
console.log(JSON.stringify(log, null, 1));
