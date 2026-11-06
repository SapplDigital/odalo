// Real-time clips (Playwright video via the CACHED ffmpeg binary copied to a scratch browsers path; nothing downloaded or installed) + a short integrated hover trace.
// Run: PLAYWRIGHT_BROWSERS_PATH=<scratch with ffmpeg-1013/ffmpeg-win64.exe> node record.mjs   Output: evidence/video/*.webm, evidence/trace-integrated-hover.json
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
mkdirSync('evidence/video', { recursive: true });
const AFTER = 'http://127.0.0.1:4342';
const browser = await chromium.launch({ channel: 'msedge' });
const wait = (p, ms) => p.waitForTimeout(ms);
// Playwright's own recordVideo calls ffmpeg with VP9 options; the cached ffmpeg-1011 build only has VP8 ("Option not found" - see README), so the clips are made
// with the cached binary directly: the browser's screencast frames (real-time, with timestamps) are laid on a constant 25 fps timeline and encoded to VP8/WebM.
const FFMPEG = 'C:/Users/basti/AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe';
async function cast(ctx, p, w, h) {
  const cdp = await ctx.newCDPSession(p); const frames = [];
  cdp.on('Page.screencastFrame', async (f) => { frames.push({ ts: f.metadata.timestamp, buf: Buffer.from(f.data, 'base64') }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {} });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: w, maxHeight: h, everyNthFrame: 1 });
  return { stop: async () => { await cdp.send('Page.stopScreencast'); return frames; } };
}
async function encode(frames, out) {
  const fps = 25; const t0 = frames[0].ts; const total = Math.ceil((frames.at(-1).ts - t0) * fps) + 1;
  const ff = spawn(FFMPEG, ['-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', 'pipe:0', '-an', '-c:v', 'libvpx', '-b:v', '2500k', '-crf', '10', '-deadline', 'realtime', '-cpu-used', '8', '-y', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  let k = 0; for (let i = 0; i < total; i++) { const t = t0 + i / fps; while (k + 1 < frames.length && frames[k + 1].ts <= t) k++; if (!ff.stdin.write(frames[k].buf)) await new Promise((res) => ff.stdin.once('drain', res)); }
  ff.stdin.end(); await new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  console.log('clip', out, frames.length, 'screencast frames ->', total, 'frames @', fps, 'fps =', (total / fps).toFixed(1), 's');
}
{ // desktop: natural wheel scroll from Services into Work, mouse hover on each project, keyboard Tab through them with the mouse parked across the board, Services detail open/close at the boundary
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, });
  const p = await ctx.newPage(); await p.goto(AFTER + '/en/', { waitUntil: 'networkidle' }); const rec = await cast(ctx, p, 1440, 900);
  await p.mouse.move(700, 500); await wait(p, 700);
  for (let i = 0; i < 38; i++) { await p.mouse.wheel(0, 100); await wait(p, 80); }
  await wait(p, 900);
  await p.evaluate(() => { const r = document.querySelector('#work [data-wj-board]').getBoundingClientRect(); scrollBy(0, r.top - 24); }); await wait(p, 900);
  const bb = await p.locator('#work [data-wj-board]').boundingBox();
  for (const [fx, fy] of [[0.3, 0.4], [0.8, 0.2], [0.8, 0.8], [0.3, 0.4]]) { await p.mouse.move(bb.x + bb.width * fx, bb.y + bb.height * fy, { steps: 14 }); await wait(p, 1000); }
  await p.mouse.move(5, 5); await wait(p, 600);
  await p.locator('#work .wj-note a').focus(); for (let k = 0; k < 3; k++) { await p.keyboard.press('Tab'); await wait(p, 800); }
  await p.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height * 0.4, { steps: 10 }); await wait(p, 900); // pointer sweeps while focus is on the shop: focus keeps the emphasis
  await p.evaluate(() => { document.activeElement?.blur(); scrollTo(0, document.querySelector('#services .detail-slot').getBoundingClientRect().top + scrollY - 520); }); await wait(p, 800);
  await p.locator('#services [data-explore="web"]').click(); await wait(p, 1500); await p.keyboard.press('Escape'); await wait(p, 1200);
  await encode(await rec.stop(), 'evidence/video/desktop-1440-en.webm'); await ctx.close();
}
{ // phone: native touch scrolling (CDP gestures) from Services into Work
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, });
  const p = await ctx.newPage(); await p.goto(AFTER + '/en/', { waitUntil: 'networkidle' }); const rec = await cast(ctx, p, 780, 1688); const cdp = await ctx.newCDPSession(p);
  await p.evaluate(() => { const r = document.querySelector('#services [data-mosaic]').getBoundingClientRect(); scrollTo(0, scrollY + r.top - 40); }); await wait(p, 600);
  for (let s = 0; s < 22; s++) { await cdp.send('Input.synthesizeScrollGesture', { x: 200, y: 600, yDistance: -380, gestureSourceType: 'touch', speed: 1000 }); await wait(p, 260); if (await p.evaluate(() => document.querySelector('#work .proj--sup').getBoundingClientRect().top < 420)) break; }
  await wait(p, 800);
  await p.locator('#work .proj--sup').first().scrollIntoViewIfNeeded(); await wait(p, 700);
  const c = await p.locator('#work .proj--sup').first().boundingBox();
  await Promise.all([p.waitForURL('**/work/sample-clinic/'), p.touchscreen.tap(c.x + c.width / 2, Math.max(60, Math.min(c.y + c.height * 0.6, 780)))]); await wait(p, 1200);
  await encode(await rec.stop(), 'evidence/video/phone-390-en.webm'); await ctx.close();
}
{ // trace: every animation frame through hover transitions of the integrated board
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  await p.goto(AFTER + '/en/', { waitUntil: 'networkidle' });
  await p.evaluate(() => { const r = document.querySelector('#work [data-wj-board]').getBoundingClientRect(); scrollTo(0, scrollY + r.top - 24); }); await wait(p, 1200);
  await p.evaluate(() => { window.__trace = []; const b = document.querySelector('#work [data-wj-board]'); const cs = [...b.children]; const nx = document.querySelector('#process'); const t0 = performance.now(); let last = t0; (function f(t) { window.__trace.push({ t: +(t - t0).toFixed(1), dt: +(t - last).toFixed(1), h: b.getBoundingClientRect().height, next: nx.getBoundingClientRect().top + scrollY, w: cs.map((c) => +c.getBoundingClientRect().width.toFixed(1)) }); last = t; if (t - t0 < 2600) requestAnimationFrame(f); })(t0); });
  const bb = await p.locator('#work [data-wj-board]').boundingBox();
  await wait(p, 200); await p.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height * 0.4); await wait(p, 700); await p.mouse.move(bb.x + bb.width * 0.8, bb.y + bb.height * 0.2); await wait(p, 700); await p.mouse.move(bb.x + bb.width * 0.8, bb.y + bb.height * 0.8); await wait(p, 800);
  const tr = await p.evaluate(() => window.__trace); const dts = tr.slice(1).map((x) => x.dt).sort((a, b) => a - b); const hs = tr.map((x) => x.h); const ns = tr.map((x) => x.next);
  const summary = { frames: tr.length, ms: tr.at(-1).t, medianDt: dts[Math.floor(dts.length / 2)], p95Dt: dts[Math.floor(dts.length * 0.95)], maxDt: dts.at(-1), boardHeightMin: Math.min(...hs), boardHeightMax: Math.max(...hs), nextSectionMin: Math.min(...ns), nextSectionMax: Math.max(...ns), condition: 'local headless Edge on the dev machine, layout-animated grid tracks; rAF cadence only, not compositor smoothness, not a field or real-device 60 fps measurement' };
  writeFileSync('evidence/trace-integrated-hover.json', JSON.stringify({ summary, frames: tr }, null, 1)); console.log(JSON.stringify(summary)); await ctx.close();
}
await browser.close();

