// Do hero and services motion compete? Samples every frame while the page is scrolled from the top through the services section:
// hero artwork on screen, at least one tile on screen and still travelling (transform not identity), and the hero's own pause state.
// Also repeats the scroll with the coordination disabled in the page (the hero's pause control is made inert) to show what the visitor would otherwise see.
// Usage (new build on 4322): node docs/review/services-motion-integration/tools/overlap.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const BASE = 'http://localhost:4322';
const root = path.resolve('docs/review/services-motion-integration');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wheel(page, dist, ms) { const n = Math.round(ms / 16), w = Array.from({ length: n }, (_, i) => Math.sin((Math.PI * (i + 0.5)) / n)), sum = w.reduce((a, b) => a + b, 0); let c = 0; for (let i = 0; i < n; i++) { const d = (w[i] / sum) * dist + c, s = Math.round(d); c = d - s; if (s) await page.mouse.wheel(0, s); await sleep(16); } }
async function swipe(cdp, dist, ms) { const n = Math.round(ms / 16), w = Array.from({ length: n }, (_, i) => Math.sin((Math.PI * (i + 0.5)) / n)), sum = w.reduce((a, b) => a + b, 0); let y = dist > 0 ? 700 : 200; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y }] }); for (let i = 0; i < n; i++) { y += ((dist > 0 ? -1 : 1) * Math.abs(dist) * w[i]) / sum; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: Math.round(y) }] }); await sleep(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
const browser = await chromium.launch({ channel: 'msedge' });
const out = {};
for (const [name, vp, touch] of [['desktop 1440x900', { width: 1440, height: 900 }, false], ['phone 390x844', { width: 390, height: 844 }, true]]) for (const coordinated of [true, false]) {
  const runs = [];
  for (let r = 0; r < 3; r++) {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, isMobile: touch });
    await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(`${BASE}/en/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-art-pause]:not([hidden])');
    if (!coordinated) await page.evaluate(() => { document.querySelector('[data-art-pause]').click = () => {}; }); // the page's own coordination calls click(); make it a no-op (no visitor clicks happen in this scenario)
    await page.evaluate(() => { window.__s = []; window.__on = true; const f = () => { if (!window.__on) return; const art = document.querySelector('[data-hero-art]').getBoundingClientRect(); const hero = art.bottom > 0 && art.top < innerHeight; const mTop = document.querySelector('[data-mosaic]').getBoundingClientRect().top; const moving = [...document.querySelectorAll('.tile')].filter((t) => { const b = t.getBoundingClientRect(); const nominalTop = mTop + t.offsetTop; return b.bottom > 0 && b.top < innerHeight && nominalTop < innerHeight * 0.94 && getComputedStyle(t).transform !== 'none'; }).length; window.__s.push([hero ? 1 : 0, moving, document.querySelector('[data-art-pause]').getAttribute('aria-pressed') === 'true' ? 1 : 0]); requestAnimationFrame(f); }; f(); });
    const top = await page.evaluate(() => document.querySelector('[data-mosaic]').getBoundingClientRect().top + scrollY);
    const go = (d, ms) => (touch ? swipe(cdp, d, ms) : wheel(page, d, ms));
    await sleep(500); await go(top - vp.height * 0.95, 2400); await sleep(300); await go(vp.height * 0.7, 2000); await sleep(300); await go(vp.height * 0.9, 2200); await sleep(300); await go(vp.height * 0.9, 2200); await sleep(400);
    const s = await page.evaluate(() => { window.__on = false; return window.__s; });
    await ctx.close();
    const n = s.length;
    const both = s.filter((x) => x[0] && x[1] > 0);
    runs.push({ frames: n, heroVisible: s.filter((x) => x[0]).length / n, tilesTravelling: s.filter((x) => x[1] > 0).length / n, bothVisibleAndTravelling: both.length / n, ofWhichHeroPaused: both.length ? both.filter((x) => x[2]).length / both.length : 1 });
  }
  const k = (f) => runs.map(f).map((v) => Math.round(v * 1000) / 1000);
  out[`${name} | coordination ${coordinated ? 'on (as shipped)' : 'off'}`] = { heroVisibleShare: k((r) => r.heroVisible), tilesTravellingOnScreenShare: k((r) => r.tilesTravelling), bothShare: k((r) => r.bothVisibleAndTravelling), heroPausedWhileBoth: k((r) => r.ofWhichHeroPaused) };
  console.log(name, 'coordination', coordinated ? 'on' : 'off', JSON.stringify(out[`${name} | coordination ${coordinated ? 'on (as shipped)' : 'off'}`]));
}
await browser.close();
fs.writeFileSync(path.join(root, 'evidence', 'overlap.json'), JSON.stringify(out, null, 1));
