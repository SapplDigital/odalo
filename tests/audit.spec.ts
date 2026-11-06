import { test, expect, type Page } from '@playwright/test';
import { tr } from '../src/i18n/ui';
import { services } from '../src/content/services';
import { plans } from '../src/content/plans';
import { auditInPage } from './helpers/reflow';

// FA3: the integrated free-audit mosaic. The single authoritative value is the form's #f-service; the mosaic mirrors it.
// Every test blocks all non-local requests; the build under test has no PUBLIC_AUDIT_ENDPOINT, so submissions are simulated.
const langs = ['en', 'es', 'de'] as const;
const IDS = ['web', 'local', 'video', 'ads'] as const;
const trig = (id: string) => `#am-b-${id}`;
const tile = (id: string) => `[data-piece="${id}"]`;
const openCount = (page: Page) => page.locator('[data-piece][data-open="true"]').count();
const box = async (page: Page, sel: string) => { const b = (await page.locator(sel).boundingBox())!; return [b.x, b.y, b.width, b.height].map(Math.round); };
const top = (page: Page, sel: string) => page.evaluate((s) => Math.round(document.querySelector(s)!.getBoundingClientRect().top + scrollY), sel);

test.beforeEach(async ({ page }) => {
  await page.route(/^(?!http:\/\/localhost)/, (r) => r.abort()); // nothing may leave localhost
});

test.describe('integrated audit page: composition and identity', () => {
  for (const l of langs) test(`${l}: typed lowercase wordmark in header and footer, real site navigation kept, old hero/sidebar gone`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${l}/audit/`);
    await expect(page.locator('.hdr__word')).toHaveText('odalo');
    await expect(page.locator('.hdr__logo')).toHaveAttribute('aria-label', /Odalo/);
    await expect(page.locator('.hdr__logo')).toHaveAttribute('href', `/${l}/`);
    await expect(page.locator('.ftr__word')).toHaveText('odalo');
    expect(await page.locator('.hdr .wordmark, .ftr [data-odalo-logo]').count()).toBe(0);
    await expect(page.locator('.hdr__links a')).toHaveCount(5);
    await expect(page.locator('.hdr .lang')).toBeVisible();
    expect(await page.locator('.ph, .au__next, .au__alt').count()).toBe(0);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('a[href="#request"]').first()).toBeVisible();
    // other routes keep the canonical artwork wordmark
    await page.goto(`/${l}/plans/`);
    expect(await page.locator('.hdr__word').count()).toBe(0);
    expect(await page.locator('.hdr .wordmark').count()).toBe(1);
  });

  test('one scope line, no unapproved promises, in every language', async ({ page }) => {
    for (const l of langs) {
      await page.goto(`/${l}/audit/`);
      for (const id of IDS) await page.click(trig(id));
      const text = await page.locator('main').innerText();
      expect(text.split(tr(l).audit.scope).length - 1).toBe(1);
      expect(text).not.toMatch(/promise|prometemos|versprechen|response time|plazo de respuesta|Antwortzeit|review depth|within \d|\d+ ?(hours|days|horas|d[ií]as|Stunden|Tage)/i);
    }
  });

  test('piece ids are the production service ids; every audit string exists in all three languages', async () => {
    for (const id of IDS) expect(services.map((s) => s.id)).toContain(id);
    for (const l of langs) {
      const m = tr(l).audit.mosaic;
      for (const id of IDS) for (const k of ['n', 's', 'l', 't'] as const) expect(m.pieces[id][k].length).toBeGreaterThan(3);
      expect(Object.values(m).filter((v) => v === '').length).toBe(0);
    }
    expect(tr('es').audit.mosaic.pieces.web.l).not.toBe(tr('en').audit.mosaic.pieces.web.l);
    expect(tr('de').audit.mosaic.pieces.web.l).not.toBe(tr('en').audit.mosaic.pieces.web.l);
  });
});

test.describe('state contract (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ page }) => { await page.goto('/en/audit/'); await page.evaluate(() => document.fonts.ready); });

  test('exploring never changes the enquiry; one piece open at a time; stays open after the pointer leaves', async ({ page }) => {
    await expect(page.locator('#f-service')).toHaveValue('');
    expect(await openCount(page)).toBe(0);
    await page.click(trig('web')); await page.mouse.move(5, 5);
    expect(await openCount(page)).toBe(1);
    await page.click(trig('ads'));
    expect(await openCount(page)).toBe(1);
    await expect(page.locator(trig('web'))).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#f-service')).toHaveValue('');
  });

  test('Include / remove / No preference drive the real form select, the summary and the tile marker', async ({ page }) => {
    await page.fill('#f-business', 'Sample Bakery');
    await page.click(trig('video')); await page.click(`${tile('video')} [data-include]`);
    await expect(page.locator('#f-service')).toHaveValue('video'); // production id, "Content" label
    await expect(page.locator('[data-am-focus]')).toHaveText('Content');
    await expect(page.locator(`${tile('video')} [data-badge]`)).toBeVisible();
    await expect(page.locator(`${tile('web')} [data-badge]`)).toBeHidden();
    await page.click(trig('ads')); // switching keeps the selection
    await expect(page.locator('#f-service')).toHaveValue('video');
    await page.click(`${tile('ads')} [data-close]`);
    expect(await openCount(page)).toBe(0);
    await expect(page.locator('#f-service')).toHaveValue('video');
    await expect(page.locator('#f-business')).toHaveValue('Sample Bakery');
    await page.click('[data-am-clear]');
    await expect(page.locator('#f-service')).toHaveValue('');
    expect(await page.locator('[data-selected="true"]').count()).toBe(0);
    await expect(page.locator('[data-am-clear]')).toHaveAttribute('aria-pressed', 'true');
    await page.click(trig('web')); await page.click(`${tile('web')} [data-include]`); await page.click(`${tile('web')} [data-include]`); // second press = remove
    await expect(page.locator('#f-service')).toHaveValue('');
  });

  test('the form select drives the mosaic and summary (user change)', async ({ page }) => {
    await page.selectOption('#f-service', 'local');
    await expect(page.locator(tile('local'))).toHaveAttribute('data-selected', 'true');
    await expect(page.locator('[data-am-focus]')).toHaveText('Local presence');
    await page.selectOption('#f-plan', '360');
    await expect(page.locator('[data-am-plan]')).toHaveText('360');
    await page.selectOption('#f-service', '');
    expect(await page.locator('[data-selected="true"]').count()).toBe(0);
  });

  test('keyboard: Enter/Space open, Escape closes and returns focus, Close returns focus, nothing is trapped', async ({ page }) => {
    await page.focus(trig('web')); await page.keyboard.press('Enter');
    await expect(page.locator(trig('web'))).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(page.locator(`${tile('web')} [data-include]`)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.locator('#f-service')).toHaveValue('web');
    await page.keyboard.press('Escape');
    await expect(page.locator(trig('web'))).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(trig('web'))).toBeFocused();
    await page.keyboard.press('Space'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    await expect(page.locator(`${tile('web')} [data-close]`)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator(trig('web'))).toBeFocused();
    await expect(page.locator('#f-service')).toHaveValue('web');
    await page.keyboard.press('Tab'); // moves on to the next piece: not trapped
    await expect(page.locator(trig('local'))).toBeFocused();
  });

  test('hover changes nothing but the decorative surface; trigger, tiles, board and form bounds stay put', async ({ page }) => {
    const snap = async () => ({ tiles: await Promise.all(IDS.map((id) => box(page, tile(id)))), trig: await box(page, trig('web')), form: await top(page, '[data-form]'), board: await box(page, '[data-am]') });
    const before = await snap();
    const g0 = await box(page, `${tile('web')} .am-tile__grow`);
    await page.hover(tile('web')); await page.waitForTimeout(450);
    const g1 = await box(page, `${tile('web')} .am-tile__grow`);
    expect(g1[2]! * g1[3]!).toBeGreaterThan(g0[2]! * g0[3]! * 3);
    expect(await snap()).toEqual(before);
    expect(await openCount(page)).toBe(0);
    await expect(page.locator('#f-service')).toHaveValue('');
  });

  test('desktop form top and size are identical through open / include / switch / close (real header, fonts settled)', async ({ page }) => {
    const doc = (sel: string) => page.evaluate((q) => { const b = document.querySelector(q)!.getBoundingClientRect(); return [b.left, b.top + scrollY, b.width, b.height].map(Math.round); }, sel); // page coordinates: clicks may scroll
    const snap = async () => ({ form: await doc('[data-form]'), req: await doc('#request'), board: await doc('[data-am]') });
    const base = await snap();
    for (const step of [() => page.click(trig('web')), () => page.click(`${tile('web')} [data-include]`), () => page.click(trig('ads')), () => page.click(trig('local')), () => page.click(trig('video')), () => page.click(`${tile('video')} [data-close]`)]) {
      await step(); await page.waitForTimeout(450); expect(await snap()).toEqual(base);
    }
  });

  test('rapid switching and resizes leave one open piece and no overflow or clipped text', async ({ page }) => {
    for (let n = 0; n < 3; n++) for (const id of IDS) await page.click(trig(id), { noWaitAfter: true });
    expect(await openCount(page)).toBe(1);
    for (const [w, h] of [[1100, 800], [834, 1112], [390, 844], [320, 700], [1440, 900]]) {
      await page.setViewportSize({ width: w!, height: h! });
      expect(await openCount(page)).toBe(1);
      expect(await page.evaluate(auditInPage)).toEqual([]);
    }
  });

  test('entrance reveal never clips a focused control: focusing ends it immediately', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage(); await p.route(/^(?!http:\/\/localhost)/, (r) => r.abort());
    await p.goto('/en/audit/'); // assemble is running right now
    expect(await p.locator('.am--assemble').count()).toBe(1); // reveal is genuinely running
    await p.locator(trig('web')).focus();
    await expect(p.locator(trig('web'))).toBeFocused();
    expect(await p.locator('.am--assemble').count()).toBe(0);
    await ctx.close();
  });
});

test.describe('query initialisation, plan context, restore', () => {
  test('valid ?service=&plan= initialise the form, mosaic and summary together; opening pieces keeps the plan', async ({ page }) => {
    const s = services[2]!.id, p = plans[3]!.id;
    await page.goto(`/en/audit/?service=${s}&plan=${p}`);
    await expect(page.locator('#f-service')).toHaveValue(s);
    await expect(page.locator('#f-plan')).toHaveValue(p);
    await expect(page.locator(tile(s))).toHaveAttribute('data-selected', 'true');
    await expect(page.locator('[data-am-plan]')).toHaveText('360');
    expect(await openCount(page)).toBe(0);
    await page.click(trig('web')); await page.click(trig('ads'));
    await expect(page.locator('#f-plan')).toHaveValue(p);
    await expect(page.locator('#f-service')).toHaveValue(s);
  });

  test('invalid values are ignored (no selection, no summary contradiction)', async ({ page }) => {
    await page.goto('/en/audit/?service=%3Cb%3Ex%3C%2Fb%3E&plan=gold');
    await expect(page.locator('#f-service')).toHaveValue('');
    await expect(page.locator('#f-plan')).toHaveValue('');
    await expect(page.locator('[data-am-focus]')).toHaveText('No preference');
    expect(await page.locator('[data-selected="true"]').count()).toBe(0);
  });

  test('back navigation: restored form values are kept and the mosaic/summary match them', async ({ page }) => {
    await page.goto('/en/audit/');
    await page.fill('#f-business', 'Sample Bakery'); await page.selectOption('#f-service', 'ads'); await page.selectOption('#f-plan', 'local');
    await page.goto('/en/privacy/');
    await page.goBack();
    await expect(page.locator('#f-business')).toHaveValue('Sample Bakery');
    await expect(page.locator('#f-service')).toHaveValue('ads');
    await expect(page.locator(tile('ads'))).toHaveAttribute('data-selected', 'true');
    await expect(page.locator('[data-am-focus]')).toHaveText('Advertising');
    await expect(page.locator('[data-am-plan]')).toHaveText('Local');
  });

  test('language switch goes to the same page in the other language (no draft carried across)', async ({ page }) => {
    await page.goto('/en/audit/?service=web');
    await page.locator('.hdr .lang a[hreflang="de"]').click();
    await expect(page).toHaveURL(/\/de\/audit\/$/);
    await expect(page.locator('h1')).toHaveText('Kostenlose Analyse');
  });
});

test.describe('real form: validation, submission boundary, results (simulated, nothing sent)', () => {
  const fill = async (page: Page) => { await page.fill('#f-name', 'Sample Name'); await page.fill('#f-email', 'sample@example.com'); await page.fill('#f-business', 'Sample Studio'); await page.fill('#f-need', 'Sample need'); await page.check('#f-privacy'); };

  test('error summary links focus their fields; website stays optional; entries survive errors', async ({ page }) => {
    await page.goto('/en/audit/');
    await page.fill('#f-name', 'Sample Name');
    await page.click('[data-submit]');
    await expect(page.locator('[data-summary]')).toBeVisible();
    await expect(page.locator('#f-business')).toBeFocused();
    await page.locator('[data-summary-list] a').filter({ hasText: 'email' }).click();
    await expect(page.locator('#f-email')).toBeFocused();
    await expect(page.locator('#f-name')).toHaveValue('Sample Name');
    await expect(page.locator('#f-website')).not.toHaveAttribute('required', '');
  });

  test('selecting a focus then submitting: payload service is the chosen production id; simulated result; no request leaves; entries and selection kept', async ({ page }) => {
    const sent: string[] = [];
    page.on('request', (r) => { if (r.method() !== 'GET' && r.method() !== 'HEAD') sent.push(`${r.method()} ${r.url()}`); });
    await page.goto('/en/audit/');
    await page.click(trig('local')); await page.click(`${tile('local')} [data-include]`);
    await fill(page);
    await page.click('[data-submit]');
    await expect(page.locator('[data-submit]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'simulated');
    await expect(page.locator('[data-retry]')).toBeHidden(); // retry belongs to failed results only (regression: .btn display overrode hidden)
    await expect(page.locator('#f-business')).toHaveValue('Sample Studio');
    await expect(page.locator('#f-service')).toHaveValue('local');
    await expect(page.locator(tile('local'))).toHaveAttribute('data-selected', 'true');
    expect(sent).toEqual([]);
    expect(await page.evaluate(() => ({ l: Object.keys(localStorage).filter((k) => k !== 'odalo.lang'), s: sessionStorage.length }))).toEqual({ l: [], s: 0 });
  });

  test('privacy link works and the legal wording is the existing one', async ({ page }) => {
    await page.goto('/en/audit/');
    const a = page.locator('label[for="f-privacy"] a');
    await expect(a).toHaveAttribute('href', '/en/privacy/');
    await expect(page.locator('label[for="f-privacy"]')).toContainText(tr('en').audit.fields.privacy);
  });

  test('the production submit boundary still decides delivered/failed (intercepted, no real endpoint)', async ({ page }) => {
    await page.goto('/en/audit/');
    // Simulate a configured endpoint at the DOM level: the form reads data-endpoint at submit time. The request is fulfilled locally and never leaves.
    await page.evaluate(() => document.querySelector('[data-audit]')!.setAttribute('data-endpoint', 'http://localhost/__fa3-fake-endpoint'));
    let n = 0; let status = 200;
    await page.route('http://localhost/__fa3-fake-endpoint', (r) => { n++; return r.fulfill({ status, contentType: 'application/json', body: '{}' }); });
    await fill(page);
    status = 500; await page.click('[data-submit]');
    await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'failed');
    await expect(page.locator('[data-retry]')).toBeVisible();
    await expect(page.locator('#f-business')).toHaveValue('Sample Studio'); // entries kept on failure
    status = 200; await page.click('[data-retry]');
    await expect(page.locator('[data-result]')).toHaveAttribute('data-kind', 'delivered');
    await expect(page.locator('#f-business')).toHaveValue(''); // reset on delivery
    await expect(page.locator('[data-am-focus]')).toHaveText('No preference'); // mosaic/summary follow the reset
    expect(n).toBe(2);
  });
});

test.describe('layouts and no-JS', () => {
  for (const [w, h] of [[1440, 900], [1280, 800], [834, 1112], [390, 844], [320, 700]]) for (const l of langs) {
    test(`${l} ${w}px: compact + one open + selected has no overflow, clipped text or text outside its tile`, async ({ page }) => {
      await page.setViewportSize({ width: w!, height: h! });
      await page.goto(`/${l}/audit/`); await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(auditInPage)).toEqual([]);
      await page.click(trig('local')); await page.click(`${tile('local')} [data-include]`);
      expect(await page.evaluate(auditInPage)).toEqual([]);
      const bad = await page.evaluate(() => [...document.querySelectorAll('.am-intro, .am-tile')].flatMap((b) => { const r = b.getBoundingClientRect(); return [...b.querySelectorAll('h1, h2, p, a, button, em')].filter((e) => e.getClientRects().length && e.getBoundingClientRect().right > r.right + 1).map((e) => e.textContent!.trim().slice(0, 24)); }));
      expect(bad).toEqual([]);
    });
  }

  test.describe('no JavaScript', () => {
    test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    test('all explanations readable in flow; JS-only controls and summary stay hidden; form fields and anchor work', async ({ page }) => {
      await page.goto('/en/audit/');
      for (const id of IDS) await expect(page.getByText(tr('en').audit.mosaic.pieces[id].l)).toBeVisible();
      await expect(page.locator('a[href="#request"]').first()).toBeVisible();
      await expect(page.locator('[data-include]').first()).toBeHidden();
      await expect(page.locator('[data-am-summary]')).toBeHidden(); // no summary that could contradict the form
      await expect(page.locator('#f-service')).toBeEnabled();
      await expect(page.locator('main')).toContainText('no delivery service is connected');
    });
  });

  test('reduced motion: no hover or open transitions, no entrance', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage(); await p.route(/^(?!http:\/\/localhost)/, (r) => r.abort());
    await p.goto('/en/audit/');
    expect(await p.locator('.am-tile__grow').first().evaluate((e) => getComputedStyle(e).transitionDuration)).toBe('0s');
    expect(await p.locator('.am--assemble').count()).toBe(0);
    await ctx.close();
  });
});

// FA3A: no-JavaScript submission must be impossible (a native POST would transmit the named fields to this URL), labels aligned, result wording.
test.describe('FA3A: no-JS submission lockout', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  for (const l of langs) test(`${l}: submit is disabled in the HTML; button and Enter attempts cause no request; guidance and contact link shown`, async ({ page }) => {
    await page.goto(`/${l}/audit/`);
    const requests: string[] = [];
    page.on('request', (r) => requests.push(`${r.method()} ${r.url()}`));
    await expect(page.locator('[data-submit]')).toBeDisabled();
    await expect(page.locator('.af__noscript')).toContainText(tr(l).audit.noscript);
    await expect(page.locator('.af__noscript a[href^="mailto:"]')).toBeVisible();
    await expect(page.locator('#f-business')).toBeEditable(); // fields stay usable/readable
    // sample values only
    await page.fill('#f-business', 'Sample Studio'); await page.fill('#f-need', 'Sample need'); await page.fill('#f-name', 'Sample Name'); await page.fill('#f-email', 'sample@example.com'); await page.check('#f-privacy');
    const url = page.url();
    await page.locator('[data-submit]').click({ force: true }); // a disabled button must do nothing
    await page.focus('#f-name'); await page.keyboard.press('Enter'); // implicit submission: the default button is disabled, so the browser must not submit
    await page.focus('#f-email'); await page.keyboard.press('Enter');
    await page.waitForLoadState('load');
    expect(page.url()).toBe(url);
    await expect(page.locator('#f-business')).toHaveValue('Sample Studio'); // no navigation happened
    expect(requests.filter((r) => !/^GET \S+\/favicon\.svg$/.test(r))).toEqual([]); // nothing, in particular no POST or navigation, after the attempts (the browser's own favicon GET is not a submission)
  });
});

test.describe('FA3A: initialisation, labels, wording (JS on)', () => {
  test('normal JS initialisation enables the real submit button', async ({ page }) => {
    await page.goto('/en/audit/');
    await expect(page.locator('[data-submit]')).toBeEnabled();
    await expect(page.locator('.af__noscript')).toBeHidden(); // <noscript> content is not rendered with JS
  });

  for (const l of langs) test(`${l}: the service select shows the same localized focus names as the mosaic and summary; ids, order and No preference are unchanged`, async ({ page }) => {
    await page.goto(`/${l}/audit/`);
    const opts = await page.locator('#f-service option').evaluateAll((o) => o.map((x) => [(x as HTMLOptionElement).value, x.textContent]));
    expect(opts).toEqual([['', tr(l).audit.fields.noPref], ...services.map((s) => [s.id, tr(l).audit.mosaic.pieces[s.id as (typeof IDS)[number]].n])]);
    await page.selectOption('#f-service', 'video');
    await expect(page.locator('[data-am-focus]')).toHaveText(tr(l).audit.mosaic.pieces.video.n);
    await expect(page.locator(`${tile('video')} .am-tile__title`)).toHaveText(tr(l).audit.mosaic.pieces.video.n);
  });

  test('result wording is location-independent in every language', async () => {
    expect(tr('en').audit.simulatedSuccess).toContain('Your entries remain in the form.');
    for (const l of langs) expect(tr(l).audit.simulatedSuccess).not.toMatch(/below|abajo|unten/i);
  });
});
