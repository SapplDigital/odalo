// Integrated measurements: layout shift, frame behaviour, main-thread work, requests and bytes, and hero/services overlap.
// Conditions: the integrated build (4322) with motion; the same build with reduced motion (control, no travel); the build from before the integration (4324).
// Usage (both servers running): node docs/review/services-motion-integration/tools/measure.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const NEW = 'http://localhost:4322', OLD = 'http://localhost:4324';
const root = path.resolve('docs/review/services-motion-integration');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const pct = (a, p) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

async function wheel(page, dist, ms) {
  const n = Math.round(ms / 16), w = Array.from({ length: n }, (_, i) => Math.sin((Math.PI * (i + 0.5)) / n)), sum = w.reduce((a, b) => a + b, 0);
  let carried = 0;
  for (let i = 0; i < n; i++) { const d = (w[i] / sum) * dist + carried, step = Math.round(d); carried = d - step; if (step) await page.mouse.wheel(0, step); await sleep(16); }
}
async function swipe(cdp, dist, ms) {
  const n = Math.round(ms / 16), w = Array.from({ length: n }, (_, i) => Math.sin((Math.PI * (i + 0.5)) / n)), sum = w.reduce((a, b) => a + b, 0);
  let y = dist > 0 ? 700 : 200; const x = 195;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 0; i < n; i++) { y += ((dist > 0 ? -1 : 1) * Math.abs(dist) * w[i]) / sum; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y) }] }); await sleep(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const INSTRUMENT = () => {
  window.__cls = 0; window.__shifts = []; window.__long = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__cls += e.value; window.__shifts.push(e.value); } }).observe({ type: 'layout-shift', buffered: true });
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ type: 'longtask', buffered: true }); } catch {}
  window.__frames = []; window.__sampling = false; window.__overlap = [];
  const tick = (t) => {
    if (window.__sampling) {
      window.__frames.push(t);
      const art = document.querySelector('[data-hero-art]'), btn = document.querySelector('[data-art-pause]');
      if (art) { const r = art.getBoundingClientRect(); const heroVisible = r.bottom > 0 && r.top < innerHeight; const moving = [...document.querySelectorAll('.tile')].filter((t) => getComputedStyle(t).transform !== 'none').length; window.__overlap.push([heroVisible ? 1 : 0, moving, btn && btn.getAttribute('aria-pressed') === 'true' ? 1 : 0]); }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

async function run(browser, { base, vp, touch, reduced, throttle }) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, isMobile: touch, reducedMotion: reduced ? 'reduce' : 'no-preference', deviceScaleFactor: 1 });
  await ctx.addInitScript(INSTRUMENT);
  await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  const resources = [];
  page.on('response', async (r) => { try { const b = await r.body(); resources.push({ url: r.url().replace(base, ''), bytes: b.length }); } catch {} });
  await page.goto(`${base}/en/`, { waitUntil: 'networkidle' });
  await sleep(1500);
  const loadBytes = resources.reduce((a, r) => a + r.bytes, 0), loadReq = resources.length;
  if (throttle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  const top = await page.evaluate(() => document.querySelector('[data-mosaic]').getBoundingClientRect().top + scrollY);
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const m0 = await metrics();
  await page.evaluate(() => { window.__sampling = true; window.__frames = []; window.__overlap = []; });
  const down = (d, ms) => (touch ? swipe(cdp, d, ms) : wheel(page, d, ms));
  const t0 = Date.now();
  // top of page, through the hero, the pieces arriving and docking, on into Work, back up over the docked mosaic, down again
  await sleep(600);
  await down(top - vp.height * 0.95, touch ? 2600 : 2400); await sleep(400);
  await down(vp.height * 0.7, 2000); await sleep(300);
  await down(vp.height * 0.9, 2200); await sleep(300);
  await down(vp.height * 0.9, 2200); await sleep(500);
  await down(-vp.height * 1.6, 2600); await sleep(300);
  await down(vp.height * 1.4, 2600); await sleep(600);
  const wall = Date.now() - t0;
  const m1 = await metrics();
  const data = await page.evaluate(() => { window.__sampling = false; return { frames: window.__frames, cls: window.__cls, shifts: window.__shifts.length, long: window.__long, overlap: window.__overlap, nodes: document.getElementsByTagName('*').length, heap: performance.memory ? performance.memory.usedJSHeapSize : null }; });
  await ctx.close();
  const f = data.frames, dt = f.slice(1).map((t, i) => t - f[i]).filter((d) => d < 200);
  const ov = data.overlap, n = ov.length || 1;
  return {
    wallMs: wall, intervals: dt.length, frameMs: { median: round(med(dt)), p95: round(pct(dt, 0.95)), p99: round(pct(dt, 0.99)), max: round(Math.max(...dt)) },
    over20: dt.filter((d) => d > 20).length, over33: dt.filter((d) => d > 33.4).length, over50: dt.filter((d) => d > 50).length,
    cls: round(data.cls, 4), shifts: data.shifts, longTasks: data.long.length, longTaskMax: data.long.length ? round(Math.max(...data.long), 1) : 0,
    mainThreadMs: { script: round((m1.ScriptDuration - m0.ScriptDuration) * 1000, 1), layout: round((m1.LayoutDuration - m0.LayoutDuration) * 1000, 1), style: round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000, 1), task: round((m1.TaskDuration - m0.TaskDuration) * 1000, 1) },
    overlap: { samples: ov.length, heroVisible: round(ov.filter((o) => o[0]).length / n, 3), piecesMoving: round(ov.filter((o) => o[1] > 0).length / n, 3), both: round(ov.filter((o) => o[0] && o[1] > 0).length / n, 3), bothAndHeroPaused: round(ov.filter((o) => o[0] && o[1] > 0 && o[2]).length / n, 3) },
    loadReq, loadBytes, domNodes: data.nodes, heapMB: data.heap ? round(data.heap / 1048576, 1) : null,
  };
}

const browser = await chromium.launch({ channel: 'msedge' });
const D = { width: 1440, height: 900 }, P = { width: 390, height: 844 };
const conds = [
  ['desktop 1440x900 | integrated, motion', { base: NEW, vp: D, touch: false }],
  ['desktop 1440x900 | integrated, reduced motion (control)', { base: NEW, vp: D, touch: false, reduced: true }],
  ['desktop 1440x900 | before the integration', { base: OLD, vp: D, touch: false }],
  ['desktop 1440x900 | integrated, motion, CPU x4', { base: NEW, vp: D, touch: false, throttle: 4 }],
  ['desktop 1440x900 | before the integration, CPU x4', { base: OLD, vp: D, touch: false, throttle: 4 }],
  ['phone 390x844 touch | integrated, motion', { base: NEW, vp: P, touch: true }],
  ['phone 390x844 touch | integrated, reduced motion (control)', { base: NEW, vp: P, touch: true, reduced: true }],
  ['phone 390x844 touch | before the integration', { base: OLD, vp: P, touch: true }],
  ['phone 390x844 touch | integrated, motion, CPU x4', { base: NEW, vp: P, touch: true, throttle: 4 }],
  ['phone 390x844 touch | before the integration, CPU x4', { base: OLD, vp: P, touch: true, throttle: 4 }],
];
const REPEAT = 3;
const out = { measuredAt: new Date().toISOString(), environment: { os: `${os.type()} ${os.release()}`, cpu: os.cpus()[0].model, cores: os.cpus().length, memGB: Math.round(os.totalmem() / 2 ** 30), browser: browser.version(), mode: 'Edge via Playwright (headless), real wheel and touch input over CDP, localhost, consent stored (no cookie panel), whole home page from the top' }, conditions: {} };
for (const [name, cfg] of conds) {
  const runs = [];
  for (let i = 0; i < REPEAT; i++) runs.push(await run(browser, cfg));
  const k = (f) => runs.map(f);
  const sum = {
    runs: REPEAT, frameMs: { median: med(k((r) => r.frameMs.median)), p95: med(k((r) => r.frameMs.p95)), p99: med(k((r) => r.frameMs.p99)), worst: Math.max(...k((r) => r.frameMs.max)) },
    over20Share: round(k((r) => r.over20).reduce((a, b) => a + b, 0) / k((r) => r.intervals).reduce((a, b) => a + b, 0), 4), over33: k((r) => r.over33), over50: k((r) => r.over50), intervals: k((r) => r.intervals),
    cls: k((r) => r.cls), shifts: k((r) => r.shifts), longTasks: k((r) => r.longTasks), longTaskMax: Math.max(...k((r) => r.longTaskMax)),
    mainThreadMs: { script: med(k((r) => r.mainThreadMs.script)), layout: med(k((r) => r.mainThreadMs.layout)), style: med(k((r) => r.mainThreadMs.style)), task: med(k((r) => r.mainThreadMs.task)) },
    overlap: runs[0].overlap, overlapAll: k((r) => r.overlap), load: { requests: runs[0].loadReq, bytes: runs[0].loadBytes }, domNodes: runs[0].domNodes, heapMB: k((r) => r.heapMB),
  };
  out.conditions[name] = sum;
  console.log(`${name}\n  frames median ${sum.frameMs.median} p95 ${sum.frameMs.p95} p99 ${sum.frameMs.p99} worst ${sum.frameMs.worst} | >20ms ${(sum.over20Share * 100).toFixed(2)}% | >33ms ${sum.over33.join(',')} | >50ms ${sum.over50.join(',')}\n  CLS ${sum.cls.join(', ')} | long tasks ${sum.longTasks.join(',')} (max ${sum.longTaskMax} ms) | main thread (median of runs) script ${sum.mainThreadMs.script} layout ${sum.mainThreadMs.layout} style ${sum.mainThreadMs.style} task ${sum.mainThreadMs.task} ms\n  overlap hero visible ${sum.overlap.heroVisible} pieces moving ${sum.overlap.piecesMoving} both ${sum.overlap.both} both+hero paused ${sum.overlap.bothAndHeroPaused} | load ${sum.load.requests} req ${sum.load.bytes} B | DOM ${sum.domNodes} | heap ${sum.heapMB.join(',')} MB`);
}
await browser.close();
fs.writeFileSync(path.join(root, 'evidence', 'measurements.json'), JSON.stringify(out, null, 1));
