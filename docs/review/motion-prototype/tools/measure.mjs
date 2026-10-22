// Measures layout shift, frame behaviour and sizes. Usage (repo root, preview on 4323): node docs/review/motion-prototype/tools/measure.mjs
// Writes docs/review/motion-prototype/evidence/measurements.json and prints a summary.
// Frame data: page-side requestAnimationFrame timestamps during real wheel / touch scrolling; render cost: performance.now() around the scene update.
// The same scroll is replayed against a control (reduced motion = plain page, no scene) so the cost of the scene can be read against the browser's own cadence.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const BASE = process.env.BASE || 'http://localhost:4323';
const root = path.resolve('docs/review/motion-prototype');
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
  window.__frames = []; window.__sampling = false;
  const tick = (t) => { if (window.__sampling) window.__frames.push(t); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
};

async function run(browser, { vp, touch, reduced, throttle, lang = 'en' }) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, isMobile: touch, reducedMotion: reduced ? 'reduce' : 'no-preference', deviceScaleFactor: 1 });
  await ctx.addInitScript(INSTRUMENT);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const resources = [];
  page.on('response', async (r) => { try { const b = await r.body(); resources.push({ url: r.url().replace(BASE, ''), bytes: b.length, type: r.headers()['content-type'] }); } catch {} });
  await page.goto(`${BASE}/${lang === 'en' ? 'index' : 'index.' + lang}.html`, { waitUntil: 'networkidle' });
  await sleep(600);
  if (throttle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await page.evaluate(() => { window.__protoMeasure = true; window.__protoStats = []; window.__sampling = true; window.__frames = []; });
  const t0 = Date.now();
  const down = (d, ms) => (touch ? swipe(cdp, d, ms) : wheel(page, d, ms));
  // down through the scene in a natural, uneven way, hold, back up, down again
  await down(500, 1800); await sleep(250); await down(560, 1900); await sleep(900); await down(-650, 2000); await sleep(300); await down(-420, 1200); await sleep(500); await down(1150, 3200); await sleep(600);
  const wall = Date.now() - t0;
  const data = await page.evaluate(() => { window.__sampling = false; return { frames: window.__frames, stats: window.__protoStats || [], cls: window.__cls, shifts: window.__shifts, long: window.__long, nodes: document.getElementsByTagName('*').length, heap: performance.memory ? performance.memory.usedJSHeapSize : null, y: scrollY }; });
  await ctx.close();
  const f = data.frames; const dt = f.slice(1).map((t, i) => t - f[i]);
  // only intervals while the page was actually being driven (drop the idle holds, which have no frames to compare)
  const busy = dt.filter((d) => d < 200);
  return {
    wallMs: wall, frames: f.length, intervals: busy.length,
    frameMs: { median: round(med(busy)), p95: round(pct(busy, 0.95)), p99: round(pct(busy, 0.99)), max: round(Math.max(...busy)) },
    over20ms: busy.filter((d) => d > 20).length, over33ms: busy.filter((d) => d > 33.4).length, over50ms: busy.filter((d) => d > 50).length,
    renderMs: data.stats.length ? { calls: data.stats.length, median: round(med(data.stats), 3), p95: round(pct(data.stats, 0.95), 3), max: round(Math.max(...data.stats), 3) } : null,
    cls: round(data.cls, 4), shifts: data.shifts.length, longTasks: data.long.length, longTaskMax: data.long.length ? round(Math.max(...data.long), 1) : 0,
    domNodes: data.nodes, heapMB: data.heap ? round(data.heap / 1048576, 1) : null, resources,
  };
}

const browser = await chromium.launch({ channel: 'msedge' });
const conds = [
  ['desktop 1440x900, scene', { vp: { width: 1440, height: 900 }, touch: false }],
  ['desktop 1440x900, control (reduced motion, no scene)', { vp: { width: 1440, height: 900 }, touch: false, reduced: true }],
  ['desktop 1440x900, scene, CPU x4 throttle', { vp: { width: 1440, height: 900 }, touch: false, throttle: 4 }],
  ['desktop 1440x900, control, CPU x4 throttle', { vp: { width: 1440, height: 900 }, touch: false, reduced: true, throttle: 4 }],
  ['phone 390x844 touch, scene', { vp: { width: 390, height: 844 }, touch: true }],
  ['phone 390x844 touch, control (reduced motion)', { vp: { width: 390, height: 844 }, touch: true, reduced: true }],
  ['phone 390x844 touch, scene, CPU x4 throttle', { vp: { width: 390, height: 844 }, touch: true, throttle: 4 }],
  ['phone 390x844 touch, control, CPU x4 throttle', { vp: { width: 390, height: 844 }, touch: true, reduced: true, throttle: 4 }],
];
const REPEAT = 3;
const out = { measuredAt: new Date().toISOString(), environment: { os: `${os.type()} ${os.release()}`, cpu: os.cpus()[0].model, cores: os.cpus().length, memGB: Math.round(os.totalmem() / 2 ** 30), browser: browser.version(), mode: 'Edge via Playwright (headless), software/virtual display, real wheel and touch input over CDP, page served over http://localhost' }, conditions: {} };
for (const [name, cfg] of conds) {
  const runs = [];
  for (let i = 0; i < REPEAT; i++) runs.push(await run(browser, cfg));
  const pick = (k) => runs.map((r) => r.frameMs[k]);
  const sum = {
    runs: REPEAT,
    frameMsMedianOfRuns: { median: med(pick('median')), p95: med(pick('p95')), p99: med(pick('p99')), maxWorst: Math.max(...pick('max')) },
    over33msTotal: runs.reduce((a, r) => a + r.over33ms, 0), over50msTotal: runs.reduce((a, r) => a + r.over50ms, 0), intervalsTotal: runs.reduce((a, r) => a + r.intervals, 0),
    over20msShare: round(runs.reduce((a, r) => a + r.over20ms, 0) / runs.reduce((a, r) => a + r.intervals, 0), 4),
    renderMs: runs[0].renderMs ? { median: med(runs.map((r) => r.renderMs.median)), p95: med(runs.map((r) => r.renderMs.p95)), maxWorst: Math.max(...runs.map((r) => r.renderMs.max)), callsPerRun: Math.round(med(runs.map((r) => r.renderMs.calls))) } : null,
    cls: runs.map((r) => r.cls), layoutShiftEntries: runs.map((r) => r.shifts), longTasks: runs.map((r) => r.longTasks), longTaskMaxMs: Math.max(...runs.map((r) => r.longTaskMax)),
    domNodes: runs[0].domNodes, heapMB: runs.map((r) => r.heapMB),
  };
  out.conditions[name] = sum;
  console.log(`${name}\n  frames: median ${sum.frameMsMedianOfRuns.median} ms, p95 ${sum.frameMsMedianOfRuns.p95}, p99 ${sum.frameMsMedianOfRuns.p99}, worst ${sum.frameMsMedianOfRuns.maxWorst}; >20ms ${(sum.over20msShare * 100).toFixed(1)}% of ${sum.intervalsTotal}; >33ms ${sum.over33msTotal}; >50ms ${sum.over50msTotal}\n  scene update: ${sum.renderMs ? `median ${sum.renderMs.median} ms, p95 ${sum.renderMs.p95}, worst ${sum.renderMs.maxWorst} (${sum.renderMs.callsPerRun} calls)` : 'n/a'}\n  CLS ${sum.cls.join(', ')} (entries ${sum.layoutShiftEntries.join(', ')}); long tasks ${sum.longTasks.join(', ')} (max ${sum.longTaskMaxMs} ms); DOM ${sum.domNodes}; heap ${sum.heapMB.join(', ')} MB`);
}

// sizes: what the page loads (live scene, desktop and phone) and the files on disk
const load = async (vp, touch) => { const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, isMobile: touch }); const page = await ctx.newPage(); const res = []; page.on('response', async (r) => { try { const b = await r.body(); res.push({ url: r.url().replace(BASE, ''), bytes: b.length }); } catch {} }); await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' }); await sleep(500); await ctx.close(); return res; };
const gz = (f) => zlib.gzipSync(fs.readFileSync(path.join(root, f)), { level: 9 }).length;
const files = ['index.html', 'proto.css', 'motion.js'].map((f) => ({ file: f, bytes: fs.statSync(path.join(root, f)).size, gzip: gz(f) }));
const assetFiles = fs.readdirSync(path.join(root, 'assets', 'img')).map((f) => ({ file: 'assets/img/' + f, bytes: fs.statSync(path.join(root, 'assets', 'img', f)).size }))
  .concat(fs.readdirSync(path.join(root, 'assets', 'fonts')).map((f) => ({ file: 'assets/fonts/' + f, bytes: fs.statSync(path.join(root, 'assets', 'fonts', f)).size })))
  .concat([{ file: 'assets/odalo-word.svg', bytes: fs.statSync(path.join(root, 'assets', 'odalo-word.svg')).size }]);
const desk = await load({ width: 1440, height: 900 }, false), phone = await load({ width: 390, height: 844 }, true);
const total = (r) => r.reduce((a, x) => a + x.bytes, 0);
out.sizes = {
  sourceFiles: files, assetFiles,
  loadedDesktop1440: { requests: desk.length, bytes: total(desk), list: desk }, loadedPhone390: { requests: phone.length, bytes: total(phone), list: phone },
  note: 'bytes are response body sizes after decoding; the local server sends no compression, so gzip is reported per source file as the realistic transfer size for html/css/js',
};
console.log(`\nloaded at 1440: ${desk.length} requests, ${(total(desk) / 1024).toFixed(0)} KB; at 390: ${phone.length} requests, ${(total(phone) / 1024).toFixed(0)} KB`);
console.log('source:', files.map((f) => `${f.file} ${f.bytes} B (gzip ${f.gzip})`).join('; '));
await browser.close();
fs.writeFileSync(path.join(root, 'evidence', 'measurements.json'), JSON.stringify(out, null, 1));
