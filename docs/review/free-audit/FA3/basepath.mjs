// Base-path check for the integrated audit page: build with SITE_BASE=/odalo/ and serve under /odalo/ (see README). Verifies that every
// request resolves (no 404), links/assets are base-prefixed, and the mosaic + form work.  node docs/review/free-audit/FA3/basepath.mjs
import { chromium } from '@playwright/test';
const BASE = process.env.FA3_SUB || 'http://127.0.0.1:4396/odalo';
const b = await chromium.launch({ channel: 'msedge' });
const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); await c.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
await c.route((u) => !u.href.startsWith(BASE.split('/odalo')[0]), (r) => r.abort());
const p = await c.newPage(); const bad = []; const reqs = [];
p.on('response', (r) => { reqs.push(r.url()); if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
p.on('pageerror', (e) => bad.push('pageerror ' + e));
const out = {};
await p.goto(`${BASE}/en/audit/?service=ads&plan=captacion`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
out.hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')).filter((h) => !h.startsWith('/odalo/')));
out.privacyHref = await p.locator('label[for="f-privacy"] a').getAttribute('href');
out.logoHref = await p.locator('.hdr__logo').getAttribute('href');
out.preselect = await p.evaluate(() => ({ svc: document.querySelector('#f-service').value, plan: document.querySelector('#f-plan').value, tile: document.querySelector('[data-piece="ads"]').dataset.selected, sum: document.querySelector('[data-am-plan]').textContent }));
await p.click('#am-b-web'); await p.click('[data-piece="web"] [data-include]'); out.afterInclude = await p.inputValue('#f-service');
out.fonts = reqs.filter((u) => /\.woff2/.test(u)).length;
await p.locator('.hdr .lang a[hreflang="de"]').click(); out.langSwitch = p.url();
await p.goto(`${BASE}/en/audit/`); await p.locator('label[for="f-privacy"] a').click(); out.privacyLands = p.url();
out.bad = bad;
await b.close();
console.log(JSON.stringify(out, null, 1));
