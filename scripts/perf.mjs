// LAB measurements only: one local production preview, installed browser, scripted loads.
// NOT field data. Nothing here is production INP or field Core Web Vitals, and a local preview says
// nothing about real hosting (compression, HTTP version, CDN, caching).
//
//   npm run build && npx astro preview --host 127.0.0.1 --port 4323      (own, isolated preview)
//   BASE_URL=http://127.0.0.1:4323 CHROMIUM_PATH=<edge or chrome> node scripts/perf.mjs
//
// Size bases are kept separate on purpose:
//   decoded   = bytes after content-decoding (CDP Network.dataReceived, summed per request)
//   encoded   = bytes actually on the wire as observed (CDP encodedDataLength; equals decoded, plus headers,
//               when the preview server does not compress; check contentEncoding in the raw output)
//   gzip/brotli = CALCULATED by compressing the identity body; what a host would send is not known from this
// Requests are tagged "initial" (until load + 2.5 s settle) or "interaction" (everything after that).
import { launch } from './browser.mjs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:4323').replace(/\/$/, '');
const RUNS = Math.min(Number(process.env.RUNS || 2), 2); // bounded on purpose: no repeat-until-favourable
const OUT = process.env.OUT || 'docs/review/performance-final/raw';
const ROUTES = { home: 'en/', plans: 'en/plans/', audit: 'en/audit/', brindle: 'en/work/sample-shop/' };
const PROFILES = {
  desktop1440: { viewport: { width: 1440, height: 900 }, mobile: false },
  // Network: 150 ms RTT, 1.6 Mbit/s down, 750 kbit/s up (the common "slow 4G" lab preset); CPU 4x slowdown.
  phone390: { viewport: { width: 390, height: 844 }, mobile: true, cpu: 4, net: { latency: 150, down: (1.6 * 1024 * 1024) / 8, up: (750 * 1024) / 8 } },
};

const typeOf = (mime, rt) => (rt === 'Document' ? 'html' : rt === 'Script' ? 'js' : rt === 'Stylesheet' ? 'css' : rt === 'Font' ? 'font' : rt === 'Image' ? 'image' : rt === 'Media' ? 'media' : /^video|audio/.test(mime || '') ? 'media' : 'other');
const textual = (t, mime) => ['html', 'js', 'css'].includes(t) || /svg|json|xml/.test(mime || '');
const calc = new Map();
async function calculated(url) {
  if (calc.has(url)) return calc.get(url);
  const body = Buffer.from(await (await fetch(url, { headers: { 'accept-encoding': 'identity' } })).arrayBuffer());
  const v = { raw: body.length, gzip: gzipSync(body, { level: 9 }).length, brotli: brotliCompressSync(body).length, body };
  calc.set(url, v);
  return v;
}

async function load(b, profileName, routeName, run) {
  const prof = PROFILES[profileName];
  const ctx = await b.newContext({ viewport: prof.viewport, isMobile: prof.mobile, hasTouch: prof.mobile }); // fresh, cold, no stored state
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (prof.cpu) await cdp.send('Emulation.setCPUThrottlingRate', { rate: prof.cpu });
  if (prof.net) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: prof.net.latency, downloadThroughput: prof.net.down, uploadThroughput: prof.net.up });

  let phase = 'initial';
  const reqs = new Map();
  cdp.on('Network.requestWillBeSent', (e) => { if (!reqs.has(e.requestId)) reqs.set(e.requestId, { url: e.request.url, rt: e.type, phase, decoded: 0, encoded: 0, status: 0, mime: '', encoding: '', range: !!e.request.headers.Range }); });
  cdp.on('Network.responseReceived', (e) => { const r = reqs.get(e.requestId); if (r) { r.status = e.response.status; r.mime = e.response.mimeType; r.encoding = e.response.headers['content-encoding'] || e.response.headers['Content-Encoding'] || ''; } });
  cdp.on('Network.dataReceived', (e) => { const r = reqs.get(e.requestId); if (r) r.decoded += e.dataLength; });
  cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) r.encoded = e.encodedDataLength; });

  await p.addInitScript(() => {
    const sel = (n) => (n && n.nodeType === 1 ? n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : '') : null);
    window.__m = { lcp: null, cls: 0, shifts: [], long: [], events: [] };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = { t: Math.round(e.startTime), el: sel(e.element), url: e.url || null, size: e.size, tag: e.element ? e.element.tagName : null }; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__m.cls += e.value; window.__m.shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), nodes: (e.sources || []).map((s) => sel(s.node)) }); } }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.long.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }); }).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId || e.name === 'click' || e.name === 'keydown') window.__m.events.push({ n: e.name, d: Math.round(e.duration), t: Math.round(e.startTime), el: sel(e.target) }); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  });

  const t0 = Date.now();
  await p.goto(`${BASE}/${ROUTES[routeName]}`, { waitUntil: 'load' });
  const loadMs = Date.now() - t0;
  await p.waitForTimeout(2500);
  const initialMetrics = await p.evaluate(() => JSON.parse(JSON.stringify(window.__m)));
  const nav = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), ttfb: Math.round(n.responseStart) }; });
  phase = 'interaction';
  const steps = [];

  if (routeName === 'home') {
    // Short bounded sequence: scroll down to the services mosaic, Explore twice, pause/resume the hero art.
    for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, prof.viewport.height * 0.8); await p.waitForTimeout(250); }
    steps.push('scroll x4');
    for (const id of ['web', 'ads']) {
      const btn = p.locator(`[data-explore="${id}"]`).first();
      if (await btn.count()) { await btn.scrollIntoViewIfNeeded(); await btn.click(); await p.waitForTimeout(500); steps.push(`explore ${id}`); }
    }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
    const pause = p.locator('[data-art-pause]');
    if (await pause.isVisible()) { await pause.click(); await p.waitForTimeout(300); await pause.click(); await p.waitForTimeout(300); steps.push('hero pause + resume'); }
  }
  if (routeName === 'brindle') {
    const before = [...reqs.values()].filter((r) => r.rt === 'Media' || /video/.test(r.mime)).length;
    const v = p.locator('video').first();
    await v.scrollIntoViewIfNeeded();
    const videoBeforeClick = before;
    let clickError = null;
    await v.click().catch((e) => { clickError = String(e.message).slice(0, 120); }); // real click on the video surface: first user gesture starts the media request
    await p.waitForTimeout(1500);
    if (await v.evaluate((el) => el.paused)) { await v.focus(); await p.keyboard.press('Space'); steps.push('click did not start playback; keyboard Space on the focused video'); } // still a real user gesture
    await p.waitForTimeout(4000);
    const state = await v.evaluate((el) => ({ paused: el.paused, readyState: el.readyState, src: el.currentSrc.split('/').pop() }));
    steps.push(`user clicks video (media requests before click: ${videoBeforeClick}; error: ${clickError}; state: ${JSON.stringify(state)})`);
  }

  const finalMetrics = await p.evaluate(() => JSON.parse(JSON.stringify(window.__m)));
  await ctx.close();

  // Post-process: calculated compression for text resources (outside the measured page).
  const list = [];
  for (const r of reqs.values()) {
    if (!r.url.startsWith(BASE) || r.status === 0) continue;
    const type = typeOf(r.mime, r.rt);
    const row = { url: r.url.replace(BASE, ''), type, phase: r.phase, status: r.status, mime: r.mime, contentEncoding: r.encoding, range: r.range, decoded: r.decoded, encoded: Math.round(r.encoded) };
    if (textual(type, r.mime) && r.status === 200) { const c = await calculated(r.url); row.calcGzip = c.gzip; row.calcBrotli = c.brotli; if (type === 'html') { const inl = [...c.body.toString().matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join(''); row.inlineJsRaw = Buffer.byteLength(inl); row.inlineJsGzip = gzipSync(Buffer.from(inl), { level: 9 }).length; } }
    list.push(row);
  }
  return { profile: profileName, route: routeName, run, setup: { cpu: prof.cpu || 1, net: prof.net || 'none', viewport: prof.viewport }, loadMs, nav, initialMetrics, finalMetrics, steps, requests: list };
}

const sum = (a, k) => a.reduce((s, r) => s + (r[k] || 0), 0);
function summarize(res) {
  const out = {};
  for (const phase of ['initial', 'interaction']) {
    const rs = res.requests.filter((r) => r.phase === phase);
    const by = {};
    for (const t of ['html', 'js', 'css', 'font', 'image', 'media', 'other']) {
      const x = rs.filter((r) => r.type === t);
      by[t] = { n: x.length, decoded: sum(x, 'decoded'), encoded: sum(x, 'encoded'), calcGzip: sum(x, 'calcGzip') || null, calcBrotli: sum(x, 'calcBrotli') || null };
    }
    out[phase] = { requests: rs.length, decoded: sum(rs, 'decoded'), encoded: sum(rs, 'encoded'), byType: by };
  }
  const html = res.requests.find((r) => r.type === 'html' && r.phase === 'initial');
  const js = res.requests.filter((r) => r.type === 'js' && r.phase === 'initial');
  out.jsInitial = { externalDecoded: sum(js, 'decoded'), inlineRaw: html?.inlineJsRaw || 0, totalRaw: sum(js, 'decoded') + (html?.inlineJsRaw || 0), totalCalcGzip: sum(js, 'calcGzip') + (html?.inlineJsGzip || 0) };
  const m = res.finalMetrics;
  out.vitals = { lcpMs: res.initialMetrics.lcp?.t ?? null, lcpElement: res.initialMetrics.lcp?.el ?? null, lcpUrl: res.initialMetrics.lcp?.url ?? null, clsInitial: +res.initialMetrics.cls.toFixed(4), clsAfterInteraction: +m.cls.toFixed(4), shiftNodes: [...new Set(m.shifts.flatMap((s) => s.nodes))], longTasksInitial: res.initialMetrics.long.length, longTaskMaxInitialMs: Math.max(0, ...res.initialMetrics.long.map((l) => l.d)), longTasksAfter: m.long.length - res.initialMetrics.long.length, sampledInteractionMaxMs: Math.max(0, ...m.events.map((e) => e.d)), sampledInteractionCount: m.events.length };
  return out;
}

mkdirSync(OUT, { recursive: true });
const b = await launch();
const all = [];
const only = process.env.ONLY; // e.g. ONLY=phone390:brindle re-measures one condition
for (const profile of Object.keys(PROFILES)) for (const route of Object.keys(ROUTES)) for (let run = 1; run <= RUNS; run++) {
  if (only && only !== `${profile}:${route}`) continue;
  const res = await load(b, profile, route, run);
  res.summary = summarize(res);
  writeFileSync(`${OUT}/${profile}-${route}-run${run}.json`, JSON.stringify(res, null, 2));
  all.push(res);
  const s = res.summary;
  console.log(`${profile} ${route} #${run}: LCP ${s.vitals.lcpMs} ms (${s.vitals.lcpElement}) CLS ${s.vitals.clsInitial}/${s.vitals.clsAfterInteraction} initial ${s.initial.requests} req ${(s.initial.decoded / 1024).toFixed(0)} KB decoded / ${(s.initial.encoded / 1024).toFixed(0)} KB encoded; JS raw ${(s.jsInitial.totalRaw / 1024).toFixed(1)} KB gzip(calc) ${(s.jsInitial.totalCalcGzip / 1024).toFixed(1)} KB; interaction ${s.interaction.requests} req ${(s.interaction.decoded / 1024).toFixed(0)} KB; long tasks ${s.vitals.longTasksInitial}; sampled interaction max ${s.vitals.sampledInteractionMaxMs} ms`);
}
await b.close();
writeFileSync(`${OUT}/_summary.json`, JSON.stringify(all.map((r) => ({ profile: r.profile, route: r.route, run: r.run, loadMs: r.loadMs, nav: r.nav, steps: r.steps, ...r.summary })), null, 2));
