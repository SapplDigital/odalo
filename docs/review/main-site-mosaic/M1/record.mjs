// Real-time recordings (Playwright video, webm) + SAMPLED frames of the same runs + a short geometry trace. Local Edge, headless.
// Output: evidence/video/*.webm, evidence/seq-*.png, evidence/trace-hover.json. New files only.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = 'http://127.0.0.1:4331';
// ffmpeg is not installed (and installing is out of scope), so Playwright video is unavailable: frames come from the browser's own screencast
// (CDP Page.startScreencast: every composited frame while the page changes, with timestamps). They are real-time captures, reviewed as SAMPLED stills.
async function screencast(ctx, p, dir) {
  mkdirSync(dir, { recursive: true }); const cdp = await ctx.newCDPSession(p); const log = []; let n = 0;
  cdp.on('Page.screencastFrame', async (f) => { const name = `${String(n++).padStart(4, '0')}.jpg`; writeFileSync(`${dir}/${name}`, Buffer.from(f.data, 'base64')); log.push({ f: name, ts: f.metadata.timestamp }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {} });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
  return { stop: async () => { await cdp.send('Page.stopScreencast'); writeFileSync(`${dir}/frames.json`, JSON.stringify(log)); console.log(dir, log.length, 'frames', log.length > 1 ? ((log.at(-1).ts - log[0].ts)).toFixed(1) + 's' : ''); } };
}
const browser = await chromium.launch({ channel: 'msedge' });
const wait = (p, ms) => p.waitForTimeout(ms);

// ---- desktop: natural wheel scroll from Services into Work, then hover and keyboard ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, });
  const p = await ctx.newPage(); await p.goto(base + '/en.html', { waitUntil: 'networkidle' }); const sc = await screencast(ctx, p, 'evidence/screencast-desktop');
  await p.evaluate(() => { const r = document.querySelector('#services .sf-board').getBoundingClientRect(); scrollTo(0, scrollY + r.top - 40); }); await wait(p, 800);
  await p.mouse.move(700, 450);
  const seqAt = new Set([8, 12, 14, 16, 20, 26]); let i = 0;
  for (let s = 0; s < 32; s++) {
    await p.mouse.wheel(0, 90); await wait(p, 90); i++;
    if (seqAt.has(i)) { await wait(p, 120); await p.screenshot({ path: `evidence/seq-scroll-${String(i).padStart(2, '0')}.png` }); }
  }
  await wait(p, 900);
  const bb = await p.locator('[data-wf-board]').boundingBox();
  for (const [fx, fy] of [[0.3, 0.4], [0.8, 0.2], [0.8, 0.8]]) { await p.mouse.move(bb.x + bb.width * fx, bb.y + bb.height * fy, { steps: 12 }); await wait(p, 900); }
  await p.mouse.move(5, 5); await wait(p, 700);
  await p.locator('#work a[href$="/en/work/"]').focus(); for (let k = 0; k < 3; k++) { await p.keyboard.press('Tab'); await wait(p, 800); }
  await sc.stop(); await ctx.close();
}
// ---- phone: native touch scroll (CDP gestures) through Services into Work, then one tap on a project ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, });
  const p = await ctx.newPage(); await p.goto(base + '/en.html', { waitUntil: 'networkidle' }); const sc = await screencast(ctx, p, 'evidence/screencast-phone'); const cdp = await ctx.newCDPSession(p);
  await p.evaluate(() => { const r = document.querySelector('#services .sf-board').getBoundingClientRect(); scrollTo(0, scrollY + r.top - 40); }); await wait(p, 600);
  let n = 0;
  for (let s = 0; s < 24; s++) { await cdp.send('Input.synthesizeScrollGesture', { x: 200, y: 600, yDistance: -420, gestureSourceType: 'touch', speed: 1200 }); await wait(p, 250); n++; if (n % 6 === 0) await p.screenshot({ path: `evidence/seq-phone-${String(n).padStart(2, '0')}.png` }); if (await p.evaluate(() => document.querySelector('[data-p="sample-clinic"]').getBoundingClientRect().top < 500)) break; }
  await wait(p, 700);
  await p.locator('[data-p="sample-clinic"]').scrollIntoViewIfNeeded(); await wait(p, 600);
  const c = await p.locator('[data-p="sample-clinic"]').boundingBox();
  await Promise.all([p.waitForURL('**/work/sample-clinic/'), p.touchscreen.tap(c.x + c.width / 2, Math.max(60, Math.min(c.y + c.height * 0.6, 780)))]); await wait(p, 1200);
  await sc.stop(); await ctx.close();
}
// ---- geometry trace: sample the board every animation frame through a hover transition ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  await p.goto(base + '/en.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => { const r = document.querySelector('[data-wf-board]').getBoundingClientRect(); scrollTo(0, scrollY + r.top - 24); }); await wait(p, 1000);
  await p.evaluate(() => { window.__trace = []; const b = document.querySelector('[data-wf-board]'); const cs = [...document.querySelectorAll('[data-wf-card]')]; const t0 = performance.now(); let last = t0; (function f(t) { window.__trace.push({ t: +(t - t0).toFixed(1), dt: +(t - last).toFixed(1), h: b.getBoundingClientRect().height, w: cs.map((c) => +c.getBoundingClientRect().width.toFixed(1)), hh: cs.map((c) => +c.getBoundingClientRect().height.toFixed(1)) }); last = t; if (t - t0 < 1500) requestAnimationFrame(f); })(t0); });
  const bb = await p.locator('[data-wf-board]').boundingBox();
  await wait(p, 200); await p.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height * 0.4); await wait(p, 600); await p.mouse.move(bb.x + bb.width * 0.8, bb.y + bb.height * 0.2); await wait(p, 800);
  const tr = await p.evaluate(() => window.__trace);
  const dts = tr.slice(1).map((x) => x.dt); const hs = tr.map((x) => x.h);
  const summary = { frames: tr.length, ms: tr.at(-1).t, medianDt: dts.sort((a, b) => a - b)[Math.floor(dts.length / 2)], maxDt: Math.max(...dts), boardHeightMin: Math.min(...hs), boardHeightMax: Math.max(...hs), note: 'local headless Edge on the dev machine; layout-animated grid tracks; not a production or field measurement' };
  writeFileSync('evidence/trace-hover.json', JSON.stringify({ summary, frames: tr }, null, 1)); console.log(JSON.stringify(summary));
  await ctx.close();
}
await browser.close();
