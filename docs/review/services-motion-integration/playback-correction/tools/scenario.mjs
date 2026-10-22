// The interleaving from task 10A, driven like a visitor and recorded: services pauses the hero automatically, the visitor presses Play, then Pause,
// services finishes and releases. The log says what the control showed at each step; the clip (Edge screencast, assembled with ffmpeg) shows it.
// Usage: node scenario.mjs <baseUrl> <label>      e.g.  node scenario.mjs http://localhost:4324 before-fix
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const [BASE, label = 'run'] = process.argv.slice(2);
const root = path.resolve('docs/review/services-motion-integration/playback-correction');
const tmp = path.join(root, '_tmp', label);
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wheel(page, dist, ms) { const n = Math.round(ms / 16), w = Array.from({ length: n }, (_, i) => Math.sin((Math.PI * (i + 0.5)) / n)), sum = w.reduce((a, b) => a + b, 0); let c = 0; for (let i = 0; i < n; i++) { const d = (w[i] / sum) * dist + c, s = Math.round(d); c = d - s; if (s) await page.mouse.wheel(0, s); await sleep(16); } }

const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
const page = await ctx.newPage();
await page.goto(`${BASE}/en/`, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-art-pause]:not([hidden])');
const btn = page.locator('[data-art-pause]');
const state = async (step) => ({ step, label: (await page.locator('[data-art-pause-label]').textContent()).trim(), pressed: await btn.getAttribute('aria-pressed'), assembling: await page.evaluate(() => document.querySelector('[data-mosaic]').classList.contains('is-assembling')), scrollY: Math.round(await page.evaluate(() => scrollY)) });
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', (f) => { frames.push({ t: f.metadata.timestamp, data: Buffer.from(f.data, 'base64') }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, everyNthFrame: 1 });
const log = [];
await sleep(1200); log.push(await state('1 loaded: hero playing'));
const top = await page.evaluate(() => document.querySelector('[data-mosaic]').getBoundingClientRect().top + scrollY);
await wheel(page, top - 900 * 0.75, 2600); await sleep(1400); log.push(await state('2 pieces travelling: services holds the hero'));
await btn.click(); await sleep(1500); log.push(await state('3 visitor presses Play'));
await btn.click(); await sleep(1500); log.push(await state('4 visitor presses Pause'));
await wheel(page, 900, 2600); await sleep(1500); log.push(await state('5 pieces docked: services releases its hold'));
await wheel(page, -3000, 2600); await sleep(2200); log.push(await state('6 back at the hero: what the visitor sees'));
await cdp.send('Page.stopScreencast');
await ctx.close(); await browser.close();

frames.forEach((f, i) => fs.writeFileSync(path.join(tmp, `f${String(i).padStart(5, '0')}.jpg`), f.data));
const list = [];
frames.forEach((f, i) => { const next = frames[i + 1]; list.push(`file 'f${String(i).padStart(5, '0')}.jpg'`, `duration ${Math.max(0.001, next ? next.t - f.t : 0.04).toFixed(4)}`); });
list.push(`file 'f${String(frames.length - 1).padStart(5, '0')}.jpg'`);
fs.writeFileSync(path.join(tmp, 'list.txt'), list.join(String.fromCharCode(10)));
const dest = path.join(root, `${label}.mp4`);
const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', 'fps=30,scale=1440:900,format=yuv420p', '-c:v', 'libx264', '-crf', '26', '-preset', 'medium', '-movflags', '+faststart', '-an', dest]);
if (r.status !== 0) throw new Error(String(r.stderr));
fs.rmSync(path.join(root, '_tmp'), { recursive: true, force: true });
fs.writeFileSync(path.join(root, `${label}-log.json`), JSON.stringify(log, null, 1));
console.log(`${label}: ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`);
for (const l of log) console.log(`  ${l.step}: control reads "${l.label}", aria-pressed=${l.pressed}, assembling=${l.assembling}`);
const final = log.at(-1);
console.log(final.pressed === 'true' ? '  RESULT: the hero is still paused (the visitor\'s last choice held)' : '  RESULT: the hero is PLAYING again (the visitor\'s last Pause was undone)');
