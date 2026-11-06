import { test, expect, type Page, type Route } from '@playwright/test';
import { encodeNetlify, NETLIFY_FIELDS, type AuditPayload } from '../src/lib/submit';
import { tr } from '../src/i18n/ui';
import fs from 'node:fs';

// D2: public email + Netlify Forms transport. The suite builds WITHOUT PUBLIC_AUDIT_TRANSPORT / PUBLIC_AUDIT_ENDPOINT, so the default build is the
// simulation. Netlify mode is exercised by switching the form's build-time transport attribute at runtime (the same attribute a netlify build emits)
// and intercepting the POST locally with page.route. Nothing here can send a real request or mail: every non-local request is aborted.
const langs = ['en', 'es', 'de'] as const;
const NEW = 'info@sappl-digital-services.com';
const OLD = /Sebastian\.Appl@|bastiappl12|gmail\.com/i;

test.beforeEach(async ({ page }) => { await page.route(/^(?!http:\/\/localhost)/, (r) => r.abort()); });

const fill = async (page: Page, o: { marketing?: boolean } = {}) => {
  await page.fill('#f-business', 'Sample Studio'); await page.fill('#f-need', 'Sample need'); await page.fill('#f-name', 'Sample Name');
  await page.fill('#f-email', 'sample@example.com'); await page.fill('#f-website', 'https://sample.example'); await page.fill('#f-country', 'Sampleland'); await page.fill('#f-phone', '000');
  await page.check('#f-privacy'); if (o.marketing) await page.check('#f-marketing');
};
const netlifyMode = (page: Page) => page.evaluate(() => document.querySelector('[data-audit]')!.setAttribute('data-transport', 'netlify'));
type Seen = { method: string; url: string; type: string | undefined; body: string };
const intercept = async (page: Page, handler: (r: Route, n: number) => Promise<void> | void) => {
  const seen: Seen[] = []; let n = 0;
  await page.route('http://localhost:4322/', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.continue();
    seen.push({ method: req.method(), url: req.url(), type: req.headers()['content-type'], body: req.postData() ?? '' });
    await handler(route, ++n);
  });
  return seen;
};
const ok = (r: Route) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>ok</p>' });

test.describe('public email', () => {
  test('site config and every language show only the new public address', async ({ page }) => {
    expect(fs.readFileSync('src/config/site.ts', 'utf8')).toMatch(/email: 'info@sappl-digital-services\.com' as string \| null/);
    for (const l of langs) {
      for (const path of ['', 'audit/', 'legal/', 'privacy/']) {
        await page.goto(`/${l}/${path}`);
        const html = await page.content();
        expect(html, `${l}/${path}`).not.toMatch(OLD);
        expect(await page.locator(`footer a[href="mailto:${NEW}"]`).count(), `${l}/${path} footer`).toBeGreaterThan(0);
      }
      await page.goto(`/${l}/audit/`);
      await expect(page.locator(`.am-alt a[href="mailto:${NEW}"]`)).toBeVisible();
      expect(await page.evaluate(() => [...document.querySelectorAll('noscript')].map((n) => n.textContent).join(''))).toContain(`mailto:${NEW}`); // raw <noscript> markup (rendered only with JS off, see the no-JS test)
    }
  });

  test('legal contact card uses the configured address', async ({ page }) => {
    await page.goto('/en/legal/');
    await expect(page.locator(`main a[href="mailto:${NEW}"]`).first()).toBeVisible();
  });
});

test.describe('Netlify registration in the built HTML (default build)', () => {
  test('one shared form name with the complete schema, honeypot and hidden form-name; default transport is simulation', async ({ page }) => {
    for (const l of langs) {
      await page.goto(`/${l}/audit/`);
      const f = page.locator('form[data-form]');
      await expect(f).toHaveAttribute('name', 'audit');
      await expect(f).toHaveAttribute('data-netlify', 'true');
      await expect(f).toHaveAttribute('data-netlify-honeypot', 'bot-field');
      await expect(f).toHaveAttribute('netlify-honeypot', 'bot-field'); // the attribute name current Netlify docs use; the data- form is kept for older detection
      await expect(f.locator('input[type=hidden][name="form-name"]')).toHaveAttribute('value', 'audit');
      await expect(f.locator('input[name="pageLanguage"]')).toHaveAttribute('value', l);
      const names = await f.locator('input[name], select[name], textarea[name]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name));
      for (const k of [...NETLIFY_FIELDS, 'form-name', 'bot-field']) expect(names, `${l} registers ${k}`).toContain(k);
      await expect(page.locator('[data-audit]')).toHaveAttribute('data-transport', 'simulated');
    }
  });

  test('honeypot is out of the tab order and hidden from assistive technology', async ({ page }) => {
    await page.goto('/en/audit/');
    const hp = page.locator('input[name="bot-field"]');
    await expect(hp).toHaveAttribute('tabindex', '-1');
    expect(await hp.evaluate((e) => !!e.closest('[aria-hidden="true"]'))).toBe(true);
    const box = (await page.locator('.af__hp').boundingBox())!; // the clipping container
    expect(box.width).toBeLessThanOrEqual(1); // clipped to a 1px box by .sr-only, inside the page flow (not display:none, not off-screen)
  });
});

test.describe('default simulation sends nothing', () => {
  test('valid submit makes no non-GET request and no request to the Netlify path', async ({ page }) => {
    const bad: string[] = [];
    page.on('request', (r) => { if (r.method() !== 'GET' && r.method() !== 'HEAD') bad.push(`${r.method()} ${r.url()}`); });
    await page.goto('/en/audit/'); await fill(page);
    await page.click('[data-submit]');
    await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'simulated');
    await expect(page.locator('#f-business')).toHaveValue('Sample Studio');
    expect(bad).toEqual([]);
  });
});

test.describe('Netlify transport (intercepted)', () => {
  test('encoding: urlencoded POST to the site root with form-name, every field and explicit booleans; Netlify wins over a configured JSON endpoint', async ({ page }) => {
    await page.goto('/en/audit/');
    await page.selectOption('#f-service', 'video'); await page.selectOption('#f-plan', 'captacion'); await page.selectOption('#f-language', 'de');
    await fill(page, { marketing: true });
    await netlifyMode(page);
    await page.evaluate(() => document.querySelector('[data-audit]')!.setAttribute('data-endpoint', 'http://localhost:4322/__json-endpoint-must-not-be-used'));
    let jsonHit = 0; await page.route('**/__json-endpoint-must-not-be-used', (r) => { jsonHit++; return r.abort(); });
    const seen = await intercept(page, ok);
    await page.click('[data-submit]');
    await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'delivered');
    expect(seen).toHaveLength(1); expect(jsonHit).toBe(0);
    const s = seen[0]!; expect(s.url).toBe('http://localhost:4322/'); expect(s.type).toMatch(/^application\/x-www-form-urlencoded/);
    const p = new URLSearchParams(s.body);
    expect(Object.fromEntries(p)).toEqual({
      'form-name': 'audit', 'bot-field': '', name: 'Sample Name', email: 'sample@example.com', business: 'Sample Studio', need: 'Sample need', website: 'https://sample.example', country: 'Sampleland',
      language: 'de', service: 'video', plan: 'captacion', phone: '000', privacy: 'yes', marketing: 'yes', pageLanguage: 'en',
    });
    // no visitor-controlled routing fields
    for (const k of ['subject', 'to', 'cc', 'bcc', 'from', 'reply-to', '_replyto']) expect(p.has(k)).toBe(false);
  });

  test('marketing unchecked is submitted as "no"; the payload encoder is pure and deterministic', async () => {
    const payload: AuditPayload = { name: 'N', email: 'e@x.y', business: 'B', need: 'Q', privacyAccepted: true, marketingOptIn: false, pageLanguage: 'es' };
    const p = encodeNetlify(payload, 'audit');
    expect(p.get('marketing')).toBe('no'); expect(p.get('privacy')).toBe('yes'); expect(p.get('pageLanguage')).toBe('es'); expect(p.get('form-name')).toBe('audit');
    expect(p.get('website')).toBe(''); // optional fields are present but empty so the schema is always complete
    expect([...p.keys()]).toEqual(['form-name', 'bot-field', ...NETLIFY_FIELDS]);
  });

  for (const l of langs) test(`${l}: accepted result uses "received/accepted" wording (no delivery guarantee), resets the form and the summary`, async ({ page }) => {
    await page.goto(`/${l}/audit/`);
    await page.click('#am-b-ads'); await page.click('[data-piece="ads"] [data-include]');
    await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
    await fill(page); await netlifyMode(page); await intercept(page, ok);
    await page.click('[data-submit]');
    const res = page.locator('[data-result]');
    await expect(res).toHaveAttribute('data-kind', 'delivered');
    await expect(res).toContainText(tr(l).audit.successH);
    await expect(res).toContainText(tr(l).audit.success);
    expect(tr(l).audit.success).not.toMatch(/delivered|zugestellt|entregad|inbox|bandeja|Posteingang/i);
    await expect(page.locator('[data-retry]')).toBeHidden();
    await expect(page.locator('#f-business')).toHaveValue('');
    await expect(page.locator('#f-service')).toHaveValue('');
    expect(await page.locator('[data-selected="true"]').count()).toBe(0); // mosaic follows the reset
    await expect(page.locator('[data-am-focus]')).toHaveText(tr(l).audit.mosaic.none);
  });

  test('honeypot: empty for people, a filled value is passed through for Netlify to discard', async ({ page }) => {
    await page.goto('/en/audit/'); await fill(page); await netlifyMode(page);
    const seen = await intercept(page, ok);
    await page.click('[data-submit]'); await expect(page.locator('[data-result]')).toBeVisible();
    expect(new URLSearchParams(seen[0]!.body).get('bot-field')).toBe('');
    await page.evaluate(() => { (document.querySelector('input[name="bot-field"]') as HTMLInputElement).value = 'bot'; });
    await fill(page); await page.click('[data-submit]'); await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'delivered');
    expect(new URLSearchParams(seen[1]!.body).get('bot-field')).toBe('bot');
  });

  for (const [label, status] of [['HTTP 500', 500], ['HTTP 404 (form not detected)', 404], ['HTTP 429', 429]] as const) test(`${label} is a failure: entries kept, retry offered, then retry succeeds`, async ({ page }) => {
    await page.goto('/en/audit/'); await page.selectOption('#f-service', 'web'); await fill(page); await netlifyMode(page);
    const seen = await intercept(page, (r, n) => (n === 1 ? r.fulfill({ status, body: 'nope' }) : ok(r)));
    await page.click('[data-submit]');
    await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'failed');
    await expect(page.locator('[data-retry]')).toBeVisible();
    await expect(page.locator('#f-business')).toHaveValue('Sample Studio');
    await expect(page.locator('#f-service')).toHaveValue('web');
    await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
    await page.click('[data-retry]');
    await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'delivered');
    expect(seen).toHaveLength(2);
    expect(seen[0]!.body).toBe(seen[1]!.body); // retry resubmits the same entries
    await expect(page.locator('#f-business')).toHaveValue('');
  });

  test('network failure is a failure with retry, entries kept', async ({ page }) => {
    await page.goto('/en/audit/'); await fill(page); await netlifyMode(page);
    await intercept(page, (r, n) => (n === 1 ? r.abort('connectionfailed') : ok(r)));
    await page.click('[data-submit]');
    await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'failed');
    await expect(page.locator('#f-email')).toHaveValue('sample@example.com');
    await page.click('[data-retry]');
    await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'delivered');
  });

  test('duplicate clicks while sending produce exactly one POST', async ({ page }) => {
    await page.goto('/en/audit/'); await fill(page); await netlifyMode(page);
    const seen = await intercept(page, async (r) => { await new Promise((res) => setTimeout(res, 400)); await ok(r); });
    await page.click('[data-submit]');
    await page.locator('[data-submit]').click({ force: true }); await page.locator('[data-submit]').click({ force: true });
    await page.focus('#f-name'); await page.keyboard.press('Enter');
    await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'delivered');
    expect(seen).toHaveLength(1);
  });

  test('validation still runs first: an invalid form makes no request', async ({ page }) => {
    await page.goto('/en/audit/'); await netlifyMode(page);
    const seen = await intercept(page, ok);
    await page.click('[data-submit]');
    await expect(page.locator('[data-summary]')).toBeVisible();
    expect(seen).toEqual([]);
  });
});

test.describe('no JavaScript (unchanged lockout with the Netlify registration markup)', () => {
  test.use({ javaScriptEnabled: false });
  for (const l of langs) test(`${l}: submit is disabled, no request on button or Enter, email alternative is the new address`, async ({ page }) => {
    await page.goto(`/${l}/audit/`);
    const requests: string[] = []; page.on('request', (r) => requests.push(`${r.method()} ${r.url()}`));
    await expect(page.locator('[data-submit]')).toBeDisabled();
    await expect(page.locator(`.af__noscript a[href="mailto:${NEW}"]`)).toBeVisible();
    await page.fill('#f-name', 'Sample Name'); await page.focus('#f-name'); await page.keyboard.press('Enter');
    await page.locator('[data-submit]').click({ force: true });
    await page.waitForLoadState('load');
    expect(requests.filter((r) => !/^GET \S+\/favicon\.svg$/.test(r))).toEqual([]);
  });
});
