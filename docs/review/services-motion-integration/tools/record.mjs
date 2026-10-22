// Real-time recordings of the interaction: Edge's own screencast (CDP Page.startScreencast, every frame the browser paints, with its timestamp),
// driven by ordinary wheel / touch scrolling, then assembled with ffmpeg using the real frame timing. No Playwright video component is needed.
// Usage (repo root, preview on 4323): node docs/review/motion-prototype/tools/record.mjs [scenario ...]
// Scenarios: desktop-scroll, desktop-de-scroll, desktop-resize-replay, phone-touch, tablet-touch, reduced-motion
// Output: docs/review/services-motion-integration/recordings/<scenario>.mp4 (H.264, 30 fps, silent)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const BASE = process.env.BASE || 'http://localhost:4322';
const outDir = path.resolve('docs/review/services-motion-integration/recordings');
const tmp = path.join(outDir, '_tmp');
fs.mkdirSync(tmp, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page_url = (lang) => `${BASE}/${lang}/`;

/** wheel scroll of `dist` px over `ms` with a bell-shaped speed profile (like a hand on a trackpad), in 16 ms frames */
async function wheel(page, dist, ms) {
  const n = Math.max(1, Math.round(ms / 16));
  const w = Array.from({ length: n }, (_, i) => Math.sin((Math.PI * (i + 0.5)) / n));
  const sum = w.reduce((a, b) => a + b, 0);
  let carried = 0;
  for (let i = 0; i < n; i++) {
    const d = (w[i] / sum) * dist + carried; const step = Math.round(d); carried = d - step;
    if (step) await page.mouse.wheel(0, step);
    await sleep(16);
  }
}
/** a real finger swipe: touchStart, eased touchMove steps every 16 ms, touchEnd (dist > 0 scrolls the page down) */
async function touchScroll(cdp, dist, ms) {
  const n = Math.round(ms / 16), w = Array.from({ length: n }, (_, i) => Math.sin((Math.PI * (i + 0.5)) / n)), sum = w.reduce((a, b) => a + b, 0);
  let y = dist > 0 ? 700 : 200; const x = 195;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 0; i < n; i++) { y += ((dist > 0 ? -1 : 1) * Math.abs(dist) * w[i]) / sum; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y) }] }); await sleep(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

const where = null;
const mosaicTop = (page) => page.evaluate(() => document.querySelector('[data-mosaic]').getBoundingClientRect().top + scrollY);
const scenarios = {
  async 'desktop-scroll'(page) { // hero, then the services section assembling, on to Work, back up (nothing scatters), down again
    await sleep(1800);
    const top = await mosaicTop(page);
    await wheel(page, top - 900 + 380, 4200); await sleep(600);          // hero leaves, first pieces start to move
    await wheel(page, 900, 4800); await sleep(900);                      // the pieces dock, row by row
    await wheel(page, 700, 2600); await sleep(900);                      // on to the next section
    await wheel(page, -1500, 4200); await sleep(1000);                   // reverse: the docked mosaic stays
    await wheel(page, 900, 3000); await sleep(800);
  },
  async 'desktop-focus-and-explore'(page) { // an action while pieces are still travelling: focus settles them, Explore opens at once
    await sleep(1200);
    const top = await mosaicTop(page);
    await wheel(page, top - 900 + 520, 3200); await sleep(1100);
    await page.locator('[data-explore="video"]').focus(); await sleep(1300);   // keyboard focus reaches a tile that is still arriving
    await page.keyboard.press('Enter'); await sleep(1500);
    await page.keyboard.press('Escape'); await sleep(900);
    await wheel(page, -700, 2400); await sleep(700);
    await wheel(page, 500, 2000); await sleep(600);
    await page.mouse.move(900, 380, { steps: 12 }); await sleep(900);         // after settling, the shared-edge hover works as before
    await page.mouse.move(1100, 520, { steps: 12 }); await sleep(900);
  },
  async 'phone-touch'(page, ctx) {
    const cdp = await ctx.newCDPSession(page);
    await sleep(1500);
    const top = await mosaicTop(page);
    for (let d = Math.max(0, top - 700); d > 0; d -= 520) { await touchScroll(cdp, Math.min(520, d), 1500); await sleep(300); }
    for (let i = 0; i < 9; i++) { await touchScroll(cdp, 330, 1500); await sleep(450); }   // the stack assembles as it arrives
    await touchScroll(cdp, -900, 2400); await sleep(700);                                    // reverse: docked tiles stay
    await touchScroll(cdp, 700, 1800); await sleep(700);
  },
  async 'phone-explore'(page, ctx) {
    const cdp = await ctx.newCDPSession(page);
    await sleep(1200);
    const top = await mosaicTop(page);
    for (let d = Math.max(0, top + 1100); d > 0; d -= 520) { await touchScroll(cdp, Math.min(520, d), 1400); await sleep(250); }
    await sleep(500);
    await page.locator('[data-explore="ads"]').tap(); await sleep(1600);           // Explore on a tile that is still arriving
    await touchScroll(cdp, 500, 1500); await sleep(800);
  },
};
const cfg = {
  'desktop-scroll': { vp: { width: 1440, height: 900 }, lang: 'en', consent: true },
  'desktop-focus-and-explore': { vp: { width: 1440, height: 900 }, lang: 'de', consent: true },
  'phone-touch': { vp: { width: 390, height: 844 }, lang: 'en', touch: true },
  'phone-explore': { vp: { width: 390, height: 844 }, lang: 'es', touch: true, consent: true },
};
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(scenarios);
const browser = await chromium.launch({ channel: 'msedge' });
for (const name of names) {
  const c = cfg[name];
  const ctx = await browser.newContext({ viewport: c.vp, hasTouch: !!c.touch, isMobile: !!c.touch, reducedMotion: c.reduced ? 'reduce' : 'no-preference', deviceScaleFactor: 1 });
  if (c.consent) await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential')); // the phone-touch recording is a first visit: the cookie panel stays
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(page_url(c.lang), { waitUntil: 'networkidle' });
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', (f) => { frames.push({ t: f.metadata.timestamp, data: Buffer.from(f.data, 'base64') }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, everyNthFrame: 1 });
  const t0 = Date.now();
  await scenarios[name](page, ctx);
  await sleep(300);
  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  const end = await page.evaluate(() => `scrollY ${Math.round(scrollY)}, assembling ${document.querySelector('[data-mosaic]').classList.contains('is-assembling')}`);
  await cdp.send('Page.stopScreencast');
  await ctx.close();
  // assemble with the real inter-frame timing
  const dir = path.join(tmp, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const list = [];
  frames.forEach((f, i) => { const fn = `f${String(i).padStart(5, '0')}.jpg`; fs.writeFileSync(path.join(dir, fn), f.data); const next = frames[i + 1]; list.push(`file '${fn}'`, `duration ${Math.max(0.001, next ? next.t - f.t : 0.04).toFixed(4)}`); });
  list.push(`file 'f${String(frames.length - 1).padStart(5, '0')}.jpg'`);
  fs.writeFileSync(path.join(dir, "list.txt"), list.join(String.fromCharCode(10)));
  const W = c.vp.width % 2 ? c.vp.width + 1 : c.vp.width, H = c.vp.height % 2 ? c.vp.height + 1 : c.vp.height;
  const dest = path.join(outDir, `${name}.mp4`);
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-vf', `fps=30,scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0xdcdcdc,format=yuv420p`, '-c:v', 'libx264', '-crf', '24', '-preset', 'medium', '-movflags', '+faststart', '-an', dest]);
  if (r.status !== 0) throw new Error(String(r.stderr));
  const span = frames.length > 1 ? (frames.at(-1).t - frames[0].t).toFixed(1) : '0';
  const gaps = frames.slice(1).map((f, i) => f.t - frames[i].t);
  const medGap = gaps.length ? [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 0;
  console.log(`${name}: scripted ${dur}s, screencast ${frames.length} frames over ${span}s (median gap ${(medGap * 1000).toFixed(0)} ms), ends at ${end}, ${(fs.statSync(dest).size / 1024).toFixed(0)} KB${errors.length ? ' ERRORS ' + errors.join(' | ') : ''}`);
}
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
