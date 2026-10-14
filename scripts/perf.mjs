// LAB measurements only (local, unthrottled preview server, headless Chromium).
// These are NOT field data and do not demonstrate Core Web Vitals in production.
import { launch } from './browser.mjs';
import { gzipSync } from 'node:zlib';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const b = await launch();
const rows = [];
for (const [label, vp, mobile] of [['desktop 1440', { width: 1440, height: 900 }, false], ['mobile 390 (4x CPU, 4G-ish)', { width: 390, height: 844 }, true]]) {
  for (const path of ['en/', 'en/plans/', 'en/audit/']) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
    await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    if (mobile) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    }
    const sizes = { html: 0, js: 0, css: 0, font: 0, img: 0, other: 0, jsGzip: 0, total: 0, requests: 0 };
    p.on('response', async (r) => {
      try {
        const body = await r.body(); const t = r.request().resourceType(); const n = body.length;
        sizes.requests++; sizes.total += n;
        if (t === 'document') { sizes.html += n; const inl = [...body.toString().matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join(''); sizes.js += Buffer.byteLength(inl); sizes.jsGzip += gzipSync(Buffer.from(inl)).length; } else if (t === 'script') { sizes.js += n; sizes.jsGzip += gzipSync(body).length; }
        else if (t === 'stylesheet') sizes.css += n; else if (t === 'font') sizes.font += n; else if (t === 'image') sizes.img += n; else sizes.other += n;
      } catch {}
    });
    await p.addInitScript(() => {
      window.__m = { lcp: 0, cls: 0, inp: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.inp = Math.max(window.__m.inp, e.duration); }).observe({ type: 'event', durationThreshold: 16, buffered: true });
    });
    await p.goto(`${BASE}/${path}`, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    // a few real interactions for INP
    if (path === 'en/') { for (const id of ['web', 'ads']) { await p.locator(`[data-explore="${id}"]`).scrollIntoViewIfNeeded(); await p.locator(`[data-explore="${id}"]`).click(); await p.waitForTimeout(300); } }
    const m = await p.evaluate(() => window.__m);
    rows.push({ profile: label, page: path, LCP_ms: Math.round(m.lcp), CLS: +m.cls.toFixed(3), INP_ms: Math.round(m.inp), transferKB: +(sizes.total / 1024).toFixed(0), jsKB_raw: +(sizes.js / 1024).toFixed(1), jsKB_gzip: +(sizes.jsGzip / 1024).toFixed(1), cssKB: +(sizes.css / 1024).toFixed(1), fontKB: +(sizes.font / 1024).toFixed(0), requests: sizes.requests });
    await ctx.close();
  }
}
console.table(rows);
await b.close();
