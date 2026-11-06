// FA3A correction evidence. Serve the FINAL build first:  npm run build && node docs/review/free-audit/FA3/serve.mjs dist 4395
// Then: node docs/review/free-audit/FA3/correction/capture-fa3a.mjs     Writes ./*.png and ./fa3a-capture-log.json. Older FA3 evidence is not touched.
// Delivery is never real: no endpoint exists in the build; failed/delivered states use a same-origin fake endpoint fulfilled locally by page.route.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.FA3_BASE || 'http://127.0.0.1:4395';
const browser = await chromium.launch({ channel: 'msedge' });
const log = { browser: browser.version(), base: BASE, blockedExternal: [], nonGetRequests: [] };
const FAKE = `${BASE}/__fa3a-fake-endpoint`;

async function open(w, h, { lang = 'en', ctx = {}, preseed = true } = {}) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, ...ctx });
  if (preseed) await c.addInitScript(() => { try { localStorage.setItem('odalo.cookies', 'essential'); } catch {} }); // only to keep the notice out of result shots; the first-visit check sets preseed:false
  await c.route((u) => !u.href.startsWith(BASE), (r) => { log.blockedExternal.push(r.request().url()); return r.abort(); });
  const page = await c.newPage();
  page.on('request', (r) => { if (!['GET', 'HEAD'].includes(r.method())) log.nonGetRequests.push(`${r.method()} ${r.url()}`); });
  page.on('pageerror', (e) => (log.pageErrors ??= []).push(String(e)));
  await page.goto(`${BASE}/${lang}/audit/`);
  if (ctx.javaScriptEnabled !== false) await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  return { c, page };
}
const shot = (page, name, o = {}) => page.screenshot({ path: join(here, `${name}.png`), ...o });
const fill = async (page) => { await page.fill('#f-business', 'Sample Bakery'); await page.fill('#f-need', 'Sample need'); await page.fill('#f-name', 'Sample Name'); await page.fill('#f-email', 'sample@example.com'); await page.check('#f-privacy'); };
const resultState = (page) => page.evaluate(() => { const r = document.querySelector('[data-result]'); const b = document.querySelector('[data-retry]'); return { kind: r.dataset.kind, title: r.querySelector('[data-result-title]').textContent, text: r.querySelector('[data-result-text]').textContent, retryVisible: !!b.getClientRects().length, retryHiddenAttr: b.hidden, retryComputedDisplay: getComputedStyle(b).display }; });
const toResult = async (page) => { await page.locator('[data-result]').waitFor({ state: 'visible' }); await page.locator('[data-result]').scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, 160)); await page.waitForTimeout(500); };

// 1+2. reproduce the "Try again" question and capture final states (1440 + 390, EN); ES/DE simulated wording at 390
for (const [w, h, tag] of [[1440, 900, '1440'], [390, 844, '390']]) {
  const { c, page } = await open(w, h); await fill(page);
  await page.click('[data-submit]'); await toResult(page);
  const sim = await resultState(page); (log.states ??= {})[`${tag}-simulated`] = sim; await shot(page, `${tag}-en-result-simulated`);
  // failed (HTTP 500, intercepted) -> retry visible; then delivered (HTTP 200, intercepted) -> form reset
  await page.evaluate((u) => document.querySelector('[data-audit]').setAttribute('data-endpoint', u), FAKE);
  let status = 500; await page.route(FAKE, (r) => r.fulfill({ status, contentType: 'application/json', body: '{}' }));
  await page.click('[data-submit]'); await page.waitForFunction(() => document.querySelector('[data-result]').dataset.kind === 'failed'); await toResult(page);
  log.states[`${tag}-failed`] = await resultState(page); await shot(page, `${tag}-en-result-failed`);
  status = 200; await page.click('[data-retry]'); await page.waitForFunction(() => document.querySelector('[data-result]').dataset.kind === 'delivered'); await toResult(page);
  log.states[`${tag}-delivered`] = { ...(await resultState(page)), formResetBusiness: await page.inputValue('#f-business') }; await shot(page, `${tag}-en-result-delivered`);
  await c.close();
}
for (const lang of ['es', 'de']) {
  const { c, page } = await open(390, 844, { lang }); await fill(page); await page.click('[data-submit]'); await toResult(page);
  log.states[`390-${lang}-simulated`] = await resultState(page); await shot(page, `390-${lang}-result-simulated`); await c.close();
}

// 3. labels aligned: select after Include (ES, 390) and desktop EN select value vs summary
{
  const { c, page } = await open(1440, 900, { lang: 'de' });
  await page.click('#am-b-video'); await page.waitForTimeout(500); await page.click('[data-piece="video"] [data-include]');
  log.labelsDe = { select: await page.locator('#f-service option:checked').textContent(), summary: await page.locator('[data-am-focus]').textContent(), options: await page.locator('#f-service option').allTextContents() };
  await page.locator('#f-service').scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, -120)); await page.waitForTimeout(500); await shot(page, '1440-de-select-and-summary-labels');
  await c.close();
}

// 4. no JavaScript: desktop + phone (EN), phone ES/DE; plus a negative control showing why the lockout matters
for (const [w, h, lang] of [[1440, 900, 'en'], [390, 844, 'en'], [390, 844, 'es'], [390, 844, 'de']]) {
  const { c, page } = await open(w, h, { lang, ctx: { javaScriptEnabled: false } });
  await page.locator('.af__noscript').scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, -100)); await page.waitForTimeout(400);
  (log.noJs ??= {})[`${w}-${lang}`] = { submitDisabled: await page.locator('[data-submit]').isDisabled(), noscriptText: (await page.locator('.af__noscript').innerText()).slice(0, 160) };
  await shot(page, `${w}-${lang}-nojs-form-guidance`); await c.close();
}
{ // control: the SAME page with `disabled` stripped by a local route. Enter in a field then makes a real POST (fulfilled locally, never leaves the machine).
  const c = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  await c.route((u) => !u.href.startsWith(BASE), (r) => r.abort());
  const posts = []; const page = await c.newPage();
  await page.route(`${BASE}/en/audit/`, async (route) => { if (route.request().method() === 'POST') { posts.push(route.request().postData()?.slice(0, 120)); return route.fulfill({ status: 405, body: 'blocked locally' }); } const res = await route.fetch(); const html = (await res.text()).replace('data-submit disabled', 'data-submit'); return route.fulfill({ response: res, body: html }); });
  await page.goto(`${BASE}/en/audit/`); await page.fill('#f-name', 'Sample Name'); await page.focus('#f-name'); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
  log.negativeControl = { note: 'disabled stripped locally; Enter on a field submits the form natively', postCount: posts.length, firstPostBodyStart: posts[0] };
  await c.close();
}

// 5. fresh first visit, NO odalo.cookies preseed (existing notice; no cookie-policy work): fresh context, nothing stored
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const { c, page } = await open(w, h, { preseed: false });
  (log.firstVisit ??= {})[w] = await page.evaluate(() => ({ storage: Object.keys(localStorage), cookie: document.cookie, bannerPresent: !!document.querySelector('[data-cookie], .ck, #cookie-notice, [aria-label*="ookie"]'), submitEnabled: !document.querySelector('[data-submit]').disabled }));
  await shot(page, `${w}-en-first-visit-no-preseed`); await c.close();
}
writeFileSync(join(here, 'fa3a-capture-log.json'), JSON.stringify(log, null, 2));
await browser.close();
console.log(JSON.stringify(log, null, 1));
