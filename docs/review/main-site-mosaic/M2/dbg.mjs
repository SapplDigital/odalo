import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://127.0.0.1:4342/en/', { waitUntil: 'networkidle' });
const q = () => p.evaluate(() => { const g = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.top + scrollY), Math.round(r.bottom + scrollY)]; }; return { ads: g('#services article[data-service="ads"]'), video: g('#services article[data-service="video"]'), peg: g('#work [data-wj-peg]'), active: document.querySelector('[data-mosaic]').dataset.active, st: document.querySelector('#services').dataset.detailState }; });
const ex = p.locator('#services [data-explore="web"]'); await ex.scrollIntoViewIfNeeded(); await ex.click(); await p.waitForTimeout(600); console.log('open', JSON.stringify(await q()));
await p.keyboard.press('Escape'); await p.waitForTimeout(800); console.log('closed', JSON.stringify(await q()));
await p.mouse.move(5, 5); await p.waitForTimeout(800); console.log('mouse away', JSON.stringify(await q()));
await b.close();
