// D2 build-level verification. Builds three configurations into temp dirs, proves the Netlify registration in the BUILT html, exercises the
// compiled netlify-mode page in Edge with every request intercepted locally (no real send), and captures screenshots.
//   node docs/review/free-audit/delivery/D2/verify.mjs
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ev = join(here, 'evidence'); mkdirSync(ev, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'odalo-d2-'));
const log = { builds: {}, checks: [] };
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
function build(name, env) {
  const out = join(tmp, name);
  const clean = { ...process.env }; for (const k of Object.keys(clean)) if (k.startsWith('PUBLIC_') || k.startsWith('SITE_')) delete clean[k];
  execFileSync(npx, ['astro', 'build', '--outDir', out], { env: { ...clean, ...env }, stdio: 'pipe', shell: true });
  return out;
}
const dirs = {
  default: build('default', {}),
  netlify: build('netlify', { PUBLIC_AUDIT_TRANSPORT: 'netlify' }),
  netlifySub: build('netlify-sub', { PUBLIC_AUDIT_TRANSPORT: 'netlify', SITE_BASE: '/odalo/', SITE_URL: 'https://example.invalid' }),
};
const html = (d, p) => readFileSync(join(d, p, 'index.html'), 'utf8');
const attr = (h, a) => (h.match(new RegExp(`${a}="([^"]*)"`)) || [])[1];

// ---- registration proof from the BUILT html ----
for (const [k, d] of Object.entries(dirs)) for (const lang of ['en', 'es', 'de']) {
  const h = html(d, `${k === 'netlifySub' ? '' : ''}${lang}/audit`);
  const form = h.match(/<form[^>]*data-form[^>]*>/)?.[0] ?? '';
  const names = [...h.matchAll(/<(?:input|select|textarea)[^>]*\sname="([^"]+)"/g)].map((m) => m[1]);
  (log.builds[k] ??= {})[lang] = {
    formTag: form.replace(/\s+data-astro-cid-\w+/g, ''),
    transport: attr(h, 'data-transport'), netlifyPath: attr(h, 'data-netlify-path'), netlifyName: attr(h, 'data-netlify-name'), hasEndpointAttr: attr(h, 'data-endpoint'),
    demoNoticePresent: /class="af__demo"/.test(h.replace(/<noscript>[\s\S]*?<\/noscript>/g, '')),
    submitDisabledInHtml: /<button[^>]*data-submit[^>]*\sdisabled/.test(h),
    fieldNames: [...new Set(names)],
    mailtoLinks: [...new Set([...h.matchAll(/mailto:([^"]+)"/g)].map((m) => m[1]))],
    oldOrPrivateAddressesInHtml: /Sebastian\.Appl@|bastiappl12|gmail\.com/i.test(h),
  };
}
const need = ['form-name', 'bot-field', 'name', 'email', 'business', 'need', 'website', 'country', 'language', 'service', 'plan', 'phone', 'privacy', 'marketing', 'pageLanguage'];
for (const [k, v] of Object.entries(log.builds)) for (const [lang, r] of Object.entries(v)) {
  const missing = need.filter((n) => !r.fieldNames.includes(n));
  log.checks.push({ build: k, lang, formRegistered: /name="audit"/.test(r.formTag) && /data-netlify="true"/.test(r.formTag) && /netlify-honeypot="bot-field"/.test(r.formTag), missingFields: missing, submitDisabledInHtml: r.submitDisabledInHtml, onlyNewPublicMailto: r.mailtoLinks.every((m) => m === 'info@sappl-digital.de'), noPrivateAddresses: !r.oldOrPrivateAddressesInHtml });
}

// ---- serve the compiled netlify build as a plain static site (a POST gets 405 like any static host without Netlify) ----
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };
const serve = (dir, base = '/') => new Promise((res) => { const s = createServer(async (rq, rs) => { if (rq.method !== 'GET' && rq.method !== 'HEAD') { rs.writeHead(405); return rs.end('static host: no form handler'); } let p = decodeURIComponent(new URL(rq.url, 'http://x').pathname); if (!p.startsWith(base)) { rs.writeHead(404); return rs.end(); } let f = join(dir, p.slice(base.length)); try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); rs.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }); rs.end(await readFile(f)); } catch { rs.writeHead(404); rs.end(); } }).listen(0, '127.0.0.1', () => res(s)); });
const root = await serve(dirs.netlify); const sub = await serve(dirs.netlifySub, '/odalo/');
const R = `http://127.0.0.1:${root.address().port}`, S = `http://127.0.0.1:${sub.address().port}/odalo`;

const browser = await chromium.launch({ channel: 'msedge' });
async function ctx(w, h, base) { const c = await browser.newContext({ viewport: { width: w, height: h } }); await c.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential')); await c.route((u) => !u.href.startsWith(base.split('/odalo')[0]), (r) => { (log.blockedExternal ??= []).push(r.request().url()); return r.abort(); }); return c; }
const fill = async (p) => { await p.fill('#f-business', 'Sample Studio'); await p.fill('#f-need', 'Sample need'); await p.fill('#f-name', 'Sample Name'); await p.fill('#f-email', 'sample@example.com'); await p.check('#f-privacy'); };
const shot = (p, n, o = {}) => p.screenshot({ path: join(ev, `${n}.png`), ...o });
const toResult = async (p) => { await p.locator('[data-result]').waitFor({ state: 'visible' }); await p.locator('[data-result]').scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, 140)); await p.waitForTimeout(500); };

// netlify build, root: compiled page posts urlencoded to "/" (intercepted + fulfilled locally)
{
  const c = await ctx(1440, 900, R); const p = await c.newPage(); const posts = [];
  await p.route(`${R}/`, async (route) => { const rq = route.request(); if (rq.method() !== 'POST') return route.continue(); posts.push({ url: rq.url(), type: rq.headers()['content-type'], body: rq.postData() }); await route.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }); });
  await p.goto(`${R}/en/audit/`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  log.compiledNetlifyRoot = { demoNoticeVisible: await p.locator('.af__demo:not(.af__noscript)').count(), submitEnabled: await p.locator('[data-submit]').isEnabled(), submitLabel: await p.locator('[data-submit]').textContent() };
  await p.click('#am-b-video'); await p.waitForTimeout(500); await p.click('[data-piece="video"] [data-include]'); await p.selectOption('#f-plan', 'local'); await fill(p);
  await p.click('[data-submit]'); await toResult(p);
  log.compiledNetlifyRoot.post = { count: posts.length, url: posts[0]?.url, type: posts[0]?.type, fields: Object.fromEntries(new URLSearchParams(posts[0]?.body ?? '')) };
  log.compiledNetlifyRoot.result = await p.evaluate(() => ({ kind: document.querySelector('[data-result]').dataset.kind, text: document.querySelector('[data-result]').innerText, retryVisible: !!document.querySelector('[data-retry]').getClientRects().length, business: document.querySelector('#f-business').value, summary: document.querySelector('[data-am-focus]').textContent }));
  await shot(p, '1440-en-netlify-received'); await c.close();
}
// netlify build with NO interception: the static host answers POST 405 -> honest failure, entries kept, retry offered (never inferred as live)
{
  const c = await ctx(1440, 900, R); const p = await c.newPage(); await p.goto(`${R}/en/audit/`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  await fill(p); await p.click('[data-submit]'); await p.waitForFunction(() => document.querySelector('[data-result]').dataset.kind === 'failed'); await toResult(p);
  log.staticHostFailure = await p.evaluate(() => ({ kind: document.querySelector('[data-result]').dataset.kind, retryVisible: !!document.querySelector('[data-retry]').getClientRects().length, business: document.querySelector('#f-business').value }));
  await shot(p, '1440-en-netlify-static-host-405-failed'); await c.close();
}
// phone: ES/DE received (intercepted) and email links in the footer for all three languages
for (const lang of ['es', 'de']) {
  const c = await ctx(390, 844, R); const p = await c.newPage(); await p.route(`${R}/`, (r) => (r.request().method() === 'POST' ? r.fulfill({ status: 200, body: 'ok' }) : r.continue()));
  await p.goto(`${R}/${lang}/audit/`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700); await fill(p); await p.click('[data-submit]'); await toResult(p); await shot(p, `390-${lang}-netlify-received`); await c.close();
}
for (const lang of ['en', 'es', 'de']) {
  const c = await ctx(1440, 900, R); const p = await c.newPage(); await p.goto(`${R}/${lang}/audit/`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  await p.locator('footer').scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await shot(p, `1440-${lang}-footer-contact`);
  (log.emailLinks ??= {})[lang] = await p.evaluate(() => [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href') + ' @ ' + (a.closest('footer') ? 'footer' : a.closest('.am-alt') ? 'summary-panel' : 'other')));
  await c.close();
}
// subpath fixture: the compiled page posts to /odalo/ (production is the root build; this only shows base-path behavior)
{
  const c = await ctx(1440, 900, S); const p = await c.newPage(); const posts = [];
  await p.route(`${S}/`, (route) => { const rq = route.request(); if (rq.method() !== 'POST') return route.continue(); posts.push({ url: rq.url(), type: rq.headers()['content-type'], form: new URLSearchParams(rq.postData() ?? '').get('form-name') }); return route.fulfill({ status: 200, body: 'ok' }); });
  await p.goto(`${S}/en/audit/`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700); await fill(p); await p.click('[data-submit]'); await p.locator('[data-result]').waitFor({ state: 'visible' });
  log.subpathFixture = { posts, internalLinksOutsideBase: await p.evaluate(() => [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')).filter((h) => !h.startsWith('/odalo/'))), mailto: await p.locator('footer a[href^="mailto:"]').first().getAttribute('href') };
  await c.close();
}
await browser.close(); root.close(); sub.close(); rmSync(tmp, { recursive: true, force: true });
writeFileSync(join(ev, 'verify-result.json'), JSON.stringify(log, null, 2));
console.log(JSON.stringify({ checks: log.checks.filter((c) => c.missingFields.length || !c.formRegistered || !c.onlyNewPublicMailto || !c.noPrivateAddresses).length + ' failing of ' + log.checks.length, compiledNetlifyRoot: log.compiledNetlifyRoot, staticHostFailure: log.staticHostFailure, subpathFixture: log.subpathFixture, emailLinks: log.emailLinks, blockedExternal: log.blockedExternal ?? [] }, null, 1));
