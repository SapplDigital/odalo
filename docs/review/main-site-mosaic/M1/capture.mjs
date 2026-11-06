// Review captures for M1 (Edge via Playwright). Usage: node capture.mjs <set>. Writes only new files into evidence/.
import { chromium } from '@playwright/test';
const base = 'http://127.0.0.1:4331';
const browser = await chromium.launch({ channel: 'msedge' });
const shot = async (p, file, opts = {}) => { await p.screenshot({ path: `evidence/${file}`, ...opts }); console.log('saved', file); };
const warm = async (p) => { await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }); await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); }); await p.waitForTimeout(600); };
async function open(w, h, url, o = {}) { const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...o }); const p = await ctx.newPage(); await p.goto(base + url, { waitUntil: 'networkidle' }); return { ctx, p }; }
const toWork = (p, off = 0) => p.evaluate((o) => { const r = document.querySelector('.wf-head').getBoundingClientRect(); scrollTo(0, scrollY + r.top - o); }, off);
const set = process.argv[2];
if (set === 'desk') {
  for (const [w, h] of [[1440, 900], [1280, 800]]) {
    const { ctx, p } = await open(w, h, '/en.html'); await warm(p);
    await shot(p, `${w}-full.png`, { fullPage: true });
    await toWork(p, 120); await p.waitForTimeout(900);
    await shot(p, `${w}-work-rest.png`);
    const box = await p.locator('[data-wf-board]').boundingBox();
    for (const [name, fx, fy] of [['hotel', 0.3, 0.4], ['clinic', 0.8, 0.2], ['shop', 0.8, 0.8]]) {
      await p.mouse.move(box.x + box.width * fx, box.y + box.height * fy, { steps: 6 }); await p.waitForTimeout(800);
      await shot(p, `${w}-work-hover-${name}.png`);
    }
    await p.mouse.move(5, 5); await p.waitForTimeout(500);
    await ctx.close();
  }
}
if (set === 'resp') {
  const cases = [['834-en', 834, 1100, '/en.html', {}], ['834-de', 834, 1100, '/de.html', {}], ['390-en', 390, 844, '/en.html', { hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['390-de', 390, 844, '/de.html', { hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['320-en', 320, 700, '/en.html', { hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['320-de', 320, 700, '/de.html', { hasTouch: true, isMobile: true, deviceScaleFactor: 2 }], ['1440-de', 1440, 900, '/de.html', {}], ['1440-short-en', 1440, 600, '/en.html', {}], ['1280-de', 1280, 800, '/de.html', {}]];
  for (const [n, w, h, url, o] of cases) {
    const { ctx, p } = await open(w, h, url, o); await warm(p);
    await shot(p, `${n}-full.png`, { fullPage: true }); await ctx.close();
  }
}
if (set === 'text') {
  for (const [n, url] of [['en', '/en.html'], ['de', '/de.html']]) {
    const { ctx, p } = await open(1440, 900, url); await p.addStyleTag({ content: 'html{font-size:200%}' }); await warm(p);
    await shot(p, `1440-text200-${n}-full.png`, { fullPage: true }); await ctx.close();
  }
}
if (set === 'modes') {
  { const { ctx, p } = await open(1440, 900, '/en.html', { reducedMotion: 'reduce' }); await warm(p); await shot(p, '1440-reduced-full.png', { fullPage: true }); await ctx.close(); }
  { const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }); const p = await ctx.newPage(); await p.goto(base + '/en.html', { waitUntil: 'networkidle' }); await shot(p, '1440-nojs-full.png', { fullPage: true }); await ctx.close(); }
}
if (set === 'work') {
  const cases = [['834-en', 834, 1100, '/en.html', {}], ['834-de', 834, 1100, '/de.html', {}], ['390-en', 390, 844, '/en.html', { hasTouch: true, isMobile: true, deviceScaleFactor: 1 }], ['390-de', 390, 844, '/de.html', { hasTouch: true, isMobile: true, deviceScaleFactor: 1 }], ['320-de', 320, 700, '/de.html', { hasTouch: true, isMobile: true, deviceScaleFactor: 1 }], ['1440-de', 1440, 900, '/de.html', {}], ['1440-short', 1440, 600, '/en.html', {}], ['1440-reduced', 1440, 900, '/en.html', { reducedMotion: 'reduce' }]];
  for (const [n, w, h, url, o] of cases) { const { ctx, p } = await open(w, h, url, o); await warm(p); await p.waitForTimeout(700); await p.locator('#work').screenshot({ path: `evidence/work-${n}.png` }); console.log('work', n); await ctx.close(); }
  for (const [n, url] of [['en', '/en.html'], ['de', '/de.html']]) { const { ctx, p } = await open(1440, 900, url); await p.addStyleTag({ content: 'html{font-size:200%}' }); await warm(p); await p.waitForTimeout(700); await p.locator('#work').screenshot({ path: `evidence/work-text200-${n}.png` }); console.log('work text200', n); await ctx.close(); }
  { const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }); const p = await ctx.newPage(); await p.goto(base + '/en.html', { waitUntil: 'networkidle' }); await p.locator('#work').screenshot({ path: 'evidence/work-nojs.png' }); console.log('work nojs'); await ctx.close(); }
}
await browser.close();
