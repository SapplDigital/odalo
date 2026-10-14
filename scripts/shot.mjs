import { launch } from './browser.mjs';
// usage: shot.mjs url out [width height full selector]
const [,, url, out, w = '1440', h = '900', full = '1', sel = ''] = process.argv;
const b = await launch();
const ctx = await b.newContext({ viewport: { width: +w, height: +h } });
await ctx.addInitScript(() => { try { localStorage.setItem('odalo.cookies', 'essential'); } catch {} });
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
if (sel) await p.locator(sel).first().screenshot({ path: out });
else await p.screenshot({ path: out, fullPage: full === '1' });
await b.close();
