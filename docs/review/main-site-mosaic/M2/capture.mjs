// M2 review captures (Edge via the installed Playwright). Usage: node capture.mjs <set>. New files only, into evidence/.
// AFTER = integrated source built to M2/after-dist (served on 4342); BEFORE = current source before M2 built to M2/baseline-dist (4341).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('evidence', { recursive: true });
const AFTER = 'http://127.0.0.1:4342', BEFORE = 'http://127.0.0.1:4341';
const browser = await chromium.launch({ channel: 'msedge' });
const warm = async (p) => { await p.evaluate(async () => { document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }); for (let y = 0; y < document.body.scrollHeight; y += 450) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); } scrollTo(0, 0); await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); }); await p.waitForTimeout(700); };
async function open(base, w, h, url, o = {}) { const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...o }); const p = await ctx.newPage(); await p.goto(base + url, { waitUntil: 'networkidle' }); return { ctx, p }; }
const clipRegion = async (p, from, to, file) => { const r = await p.evaluate(([a, z]) => { const A = document.querySelector(a).getBoundingClientRect(), Z = document.querySelector(z).getBoundingClientRect(); return { y: A.top + scrollY, h: Z.bottom + scrollY - (A.top + scrollY) }; }, [from, to]); await p.screenshot({ path: `evidence/${file}`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y - 16), width: p.viewportSize().width, height: r.h + 16 } }); console.log(file); };
const set = process.argv[2];
if (set === 'compare') {
  for (const [name, base] of [['before', BEFORE], ['after', AFTER]]) for (const l of ['en', 'es', 'de']) {
    const { ctx, p } = await open(base, 1440, 900, `/${l}/`); await warm(p);
    await clipRegion(p, '#services', '#process', `${name}-1440-${l}-services-to-process.png`); await ctx.close();
  }
}
const workClip = async (p, file, extra = 0) => { const r = await p.evaluate(() => { const A = document.querySelector('#services [data-mosaic]').getBoundingClientRect(), Z = document.querySelector('#process').getBoundingClientRect(); return { y: A.bottom + scrollY - 240, h: Z.top + scrollY - (A.bottom + scrollY) + 240 }; }); await p.screenshot({ path: `evidence/${file}`, fullPage: true, clip: { x: 0, y: r.y, width: p.viewportSize().width, height: r.h + extra } }); console.log(file); };
const settleWork = async (p) => { await p.locator('#work .grid').scrollIntoViewIfNeeded(); await p.waitForTimeout(1000); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200); };
if (set === 'states') {
  for (const [l, w, h] of [['en', 1440, 900], ['de', 1440, 900], ['es', 1440, 900], ['en', 1280, 800], ['de', 1280, 800], ['es', 1280, 800], ['en', 834, 1100], ['de', 834, 1100], ['en', 390, 844], ['de', 390, 844], ['es', 390, 844], ['de', 320, 700], ['en', 1440, 600]]) {
    const mobile = w < 800; const { ctx, p } = await open(AFTER, w, h, `/${l}/`, mobile ? { hasTouch: true, isMobile: true } : {}); await warm(p); await settleWork(p);
    await workClip(p, `after-${w}x${h}-${l}-work.png`); await ctx.close();
  }
  // wide geometry states (EN/DE, 1440 and 1280): rest, hover each, keyboard focus
  for (const [l, w, h] of [['en', 1440, 900], ['de', 1280, 800], ['es', 1440, 900]]) {
    const { ctx, p } = await open(AFTER, w, h, `/${l}/`); await warm(p);
    await p.evaluate(() => { const r = document.querySelector('#work [data-wj-board]').getBoundingClientRect(); scrollTo(0, scrollY + r.top - 24); }); await p.waitForTimeout(1000);
    const live = await p.evaluate(() => getComputedStyle(document.querySelector('#work [data-wj-board]')).getPropertyValue('--geo').trim());
    console.log(l, w, 'geometry live:', live === '1');
    await p.screenshot({ path: `evidence/geo-${w}-${l}-rest.png` });
    const b = await p.locator('#work [data-wj-board]').boundingBox();
    for (const [n, fx, fy] of [['hotel', 0.3, 0.4], ['clinic', 0.8, 0.2], ['shop', 0.8, 0.8]]) { await p.mouse.move(b.x + b.width * fx, b.y + b.height * fy, { steps: 6 }); await p.waitForTimeout(800); await p.screenshot({ path: `evidence/geo-${w}-${l}-hover-${n}.png` }); }
    await p.mouse.move(5, 5); await p.waitForTimeout(500);
    await p.locator('#work .wj-note a').focus(); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(800); await p.screenshot({ path: `evidence/geo-${w}-${l}-keyboard-clinic.png` });
    await ctx.close();
  }
}
if (set === 'modes') {
  for (const [name, o, js] of [['reduced', { reducedMotion: 'reduce' }, true], ['nojs', {}, false]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: js, ...o }); const p = await ctx.newPage(); await p.goto(AFTER + '/en/', { waitUntil: 'networkidle' }); if (js) await warm(p); await workClip(p, `after-1440-en-${name}-work.png`); await ctx.close();
  }
  for (const l of ['en', 'de']) { const { ctx, p } = await open(AFTER, 1440, 900, `/${l}/`); await p.addStyleTag({ content: 'html{font-size:200%}' }); await warm(p); await p.waitForTimeout(600); await workClip(p, `after-1440-${l}-root200-work.png`); await ctx.close(); }
  // Services detail open at the Work boundary (desktop and phone), and after Escape
  { const { ctx, p } = await open(AFTER, 1440, 900, '/en/'); await warm(p); const ex = p.locator('#services [data-explore="web"]'); await ex.scrollIntoViewIfNeeded(); await ex.click(); await p.waitForTimeout(800); await workClip(p, 'after-1440-en-detail-open-work.png'); await p.keyboard.press('Escape'); await p.mouse.move(5, 5); await p.locator('#work-h').scrollIntoViewIfNeeded(); await p.waitForTimeout(1000); await workClip(p, 'after-1440-en-detail-closed-work.png'); await ctx.close(); }
  { const { ctx, p } = await open(AFTER, 390, 844, '/en/', { hasTouch: true, isMobile: true }); await warm(p); const ex = p.locator('#services [data-explore="ads"]'); await ex.scrollIntoViewIfNeeded(); await ex.click(); await p.waitForTimeout(800); await workClip(p, 'after-390-en-detail-open-work.png'); await ctx.close(); }
  // non-homepage Work variants against the baseline
  for (const [name, base] of [['before', BEFORE], ['after', AFTER]]) for (const [tag, url, sel] of [['workindex', '/en/work/', '#projects'], ['service-video', '/en/services/video/', '#related-work']]) {
    const { ctx, p } = await open(base, 1440, 900, url); await warm(p); const el = p.locator(sel); await el.screenshot({ path: `evidence/variant-${name}-${tag}.png` }); console.log('variant', name, tag); await ctx.close();
  }
}
await browser.close();
