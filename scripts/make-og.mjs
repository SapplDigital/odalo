// Generates public/og.png (1200x630) from the temporary logo. Replace with the designed share image.
import { launch } from './browser.mjs';
import { readdirSync, readFileSync } from 'node:fs';
const dir = new URL('../node_modules/@fontsource-variable/outfit/files/', import.meta.url).pathname;
const f = readdirSync(dir).find((x) => x.includes('latin-wght-normal') && x.endsWith('.woff2'));
const font = readFileSync(dir + f).toString('base64');
const sdir = new URL('../node_modules/@fontsource/instrument-serif/files/', import.meta.url).pathname;
const sf = readdirSync(sdir).find((x) => x.includes('latin-400-italic') && x.endsWith('.woff2'));
const serif = readFileSync(sdir + sf).toString('base64');
const html = `<style>
@font-face{font-family:O;src:url(data:font/woff2;base64,${font});font-weight:100 900}
@font-face{font-family:S;font-style:italic;src:url(data:font/woff2;base64,${serif})}
body{margin:0;width:1200px;height:630px;background:#f7f9f8;font-family:O;color:#203b57;display:grid;grid-template-columns:1.25fr 1fr;overflow:hidden}
.l{padding:72px;display:flex;flex-direction:column;justify-content:space-between}
.w{font-weight:700;font-size:64px;letter-spacing:-.045em;display:flex;align-items:center;gap:18px}.w i{color:#d98165;font-style:normal}
h1{font-size:84px;line-height:.98;letter-spacing:-.035em;margin:0;font-weight:800}h1 em{font-family:S;font-weight:400;color:#9a4630;font-size:1.1em}
.r{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1.2fr 1fr 1fr;gap:12px;padding:12px 12px 12px 0}
.r div{border-radius:6px}</style>
<div class=l><div class=w><svg width=64 height=64 viewBox="0 0 64 64"><path d="M0 0H20A20 20 0 0 1 0 20Z" fill="#203b57"/><circle cx="32" cy="10" r="10" fill="#50718b"/><path d="M44 20a10 10 0 0 1 20 0Z" fill="#203b57"/><path d="M20 22A10 10 0 0 0 20 42Z" fill="#d98165"/><path d="M22 22H42V42H32A10 10 0 0 1 22 32Z" fill="#203b57"/><path d="M64 42H44A20 20 0 0 1 64 22Z" fill="#50718b"/><circle cx="10" cy="54" r="10" fill="#d98165"/><path d="M22 64V44A20 20 0 0 1 42 64Z" fill="#203b57"/><path d="M44 54A10 10 0 0 1 54 44H64V64H44Z" fill="#d98165"/></svg><span>odalo<i>.</i></span></div>
<h1>Different pieces. <em>One connected result.</em></h1></div>
<div class=r><div style="background:#203b57;border-top-left-radius:120px;grid-column:1/3"></div><div style="background:#d98165"></div><div style="background:#50718b;border-bottom-right-radius:60px"></div><div style="background:#efe7d3;border-bottom-left-radius:60px"></div><div style="background:#203b57"></div></div>`;
const b = await launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html); await p.waitForTimeout(400);
await p.screenshot({ path: new URL('../public/og.png', import.meta.url).pathname });
await b.close(); console.log('og.png written');
