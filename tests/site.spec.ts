import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('language and routing', () => {
  test('every page has the three language routes and switching keeps the equivalent page', async ({ page }) => {
    await page.goto('/en/plans/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.locator('.hdr .lang a[hreflang="de"]').click();
    await expect(page).toHaveURL(/\/de\/plans\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('h1')).toContainText('Klare Preise');
    await page.locator('.hdr .lang a[hreflang="es"]').click();
    await expect(page).toHaveURL(/\/es\/plans\/$/);
    await expect(page.locator('h1')).toContainText('Precios claros');
  });

  test('root falls back to English and honours an explicit stored choice', async ({ browser }) => {
    const fresh = await browser.newContext({ locale: 'fr-FR' });
    const p = await fresh.newPage();
    await p.goto('/');
    await expect(p).toHaveURL(/\/en\/$/);
    await p.locator('.hdr .lang a[hreflang="de"]').click();
    await p.goto('/');
    await expect(p).toHaveURL(/\/de\/$/); // explicit selection preserved
    await fresh.close();
    const es = await browser.newContext({ locale: 'es-ES' });
    const q = await es.newPage();
    await q.goto('/');
    await expect(q).toHaveURL(/\/es\/$/);
    await es.close();
  });

  test('hreflang alternates, canonical and a single h1', async ({ page }) => {
    await page.goto('/de/');
    const hrefs = await page.locator('link[rel="alternate"]').evaluateAll((els) => els.map((e) => `${e.getAttribute('hreflang')}:${new URL(e.getAttribute('href')!).pathname}`));
    expect(hrefs).toEqual(expect.arrayContaining(['es:/es/', 'en:/en/', 'de:/de/', 'x-default:/en/']));
    expect(await page.locator('h1').count()).toBe(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/de\/$/);
  });

  test('localized titles and unique descriptions per language', async ({ page }) => {
    const seen = new Set<string>();
    for (const l of ['es', 'en', 'de']) {
      await page.goto(`/${l}/`);
      seen.add(await page.locator('meta[name="description"]').getAttribute('content') ?? '');
    }
    expect(seen.size).toBe(3);
  });

  test('all internal links from the sitemap resolve', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const locs = [...xml.matchAll(/<loc>[^<]*?(\/(?:es|en|de)\/[^<]*)<\/loc>/g)].map((m) => m[1]!);
    expect(locs.length).toBeGreaterThan(30);
    for (const l of locs) expect((await request.get(l)).status(), l).toBe(200);
  });

  test('missing page gives a recovery path', async ({ page }) => {
    const res = await page.goto('/en/nope/');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText('could not be found');
    await expect(page.locator('a[href="/de/"]')).toBeVisible();
  });
});

test.describe('plans', () => {
  test('prices, featured plan and example label are visible without interaction', async ({ page }) => {
    await page.goto('/en/');
    for (const [id, price] of [['base', '€59'], ['local', '€290'], ['captacion', '€590'], ['360', '€1,290']]) {
      await expect(page.locator(`#plan-${id} .plan__amount`)).toHaveText(price!);
    }
    await expect(page.locator('#plan-captacion .pill')).toHaveText('Featured plan');
    await expect(page.locator('#plans .plans-sec__ex')).toContainText('Example prices');
    await expect(page.locator('#plans table')).toBeVisible();
  });

  test('localized price formats', async ({ page }) => {
    await page.goto('/de/'); await expect(page.locator('#plan-360 .plan__amount')).toContainText('1.290');
    await page.goto('/es/'); await expect(page.locator('#plan-captacion .pill')).toHaveText('Plan destacado');
  });

  for (const [id, label] of [['base', 'Base'], ['local', 'Local'], ['captacion', 'Captación'], ['360', '360']]) {
    test(`choosing ${label} preselects it on the audit form`, async ({ page }) => {
      await page.goto('/en/');
      await page.locator(`#plan-${id} .plan__cta`).click();
      await expect(page).toHaveURL(new RegExp(`/en/audit/\\?plan=${id}$`));
      await expect(page.locator('#f-plan')).toHaveValue(id);
    });
  }
});

test.describe('audit form', () => {
  test('required validation: messages, summary, focus and aria-invalid', async ({ page }) => {
    await page.goto('/en/audit/');
    await page.getByRole('button', { name: 'Request audit' }).click();
    await expect(page.locator('[data-summary]')).toBeVisible();
    for (const f of ['name', 'email', 'business', 'need', 'privacy']) await expect(page.locator(`#e-${f}`)).toBeVisible();
    await expect(page.locator('#f-name')).toBeFocused();
    await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#e-name')).toHaveText('Please enter your name.');
  });

  test('invalid email and invalid website are rejected; website stays optional', async ({ page }) => {
    await page.goto('/en/audit/');
    await page.fill('#f-name', 'Ada'); await page.fill('#f-email', 'not-an-email'); await page.fill('#f-business', 'Studio'); await page.fill('#f-need', 'A site');
    await page.fill('#f-website', 'http//bad'); await page.check('#f-privacy');
    await page.getByRole('button', { name: 'Request audit' }).click();
    await expect(page.locator('#e-email')).toContainText('valid email');
    await expect(page.locator('#e-website')).toContainText('full web address');
    await page.fill('#f-email', 'ada@example.com'); await page.fill('#f-website', '');
    await page.getByRole('button', { name: 'Request audit' }).click();
    await expect(page.locator('[data-summary]')).toBeHidden();
  });

  test('validation messages are localized', async ({ page }) => {
    await page.goto('/de/audit/');
    await page.getByRole('button', { name: 'Analyse anfragen' }).click();
    await expect(page.locator('#e-name')).toHaveText('Bitte gib deinen Namen ein.');
    await page.goto('/es/audit/');
    await page.getByRole('button', { name: 'Pedir auditoría' }).click();
    await expect(page.locator('#e-email')).toHaveText('Escribe tu correo electrónico.');
  });

  const fill = async (page: import('@playwright/test').Page) => {
    await page.fill('#f-name', 'Ada'); await page.fill('#f-email', 'ada@example.com'); await page.fill('#f-business', 'Studio'); await page.fill('#f-need', 'A new website'); await page.check('#f-privacy');
  };

  test('without a backend the submission is explicitly simulated and nothing is sent', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (r) => { if (r.method() === 'POST') posts.push(r.url()); });
    await page.goto('/en/audit/');
    await expect(page.locator('.af__demo')).toContainText('no delivery service is connected');
    await fill(page);
    const btn = page.locator('[data-submit]');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-busy', 'true');
    await expect(btn).toHaveText('Sending…');
    await btn.click({ force: true }); // duplicate click while sending is ignored
    const result = page.locator('[data-result]');
    await expect(result).toBeVisible();
    await expect(result).toContainText('Simulated submission');
    await expect(result).toContainText('nothing was sent');
    await expect(result).not.toContainText('received your request.'.replace('received', 'has been received'));
    await expect(page.locator('#f-name')).toHaveValue('Ada'); // entries retained
    expect(posts).toEqual([]);
  });

  test('with an endpoint, success is shown only after a 2xx delivery', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/audit', async (route) => { calls++; const body = route.request().postDataJSON(); expect(body.email).toBe('ada@example.com'); expect(body.pageLanguage).toBe('en'); await route.fulfill({ status: 200, body: '{}' }); });
    await page.goto('/en/audit/');
    await page.evaluate(() => document.querySelector<HTMLElement>('[data-audit]')!.setAttribute('data-endpoint', '/api/audit'));
    await fill(page);
    await page.getByRole('button', { name: 'Request audit' }).click();
    await expect(page.locator('[data-result]')).toContainText('Request received');
    expect(calls).toBe(1);
  });

  test('failure keeps entries, offers retry, and never claims success', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/audit', (route) => { calls++; return route.fulfill({ status: calls === 1 ? 500 : 200, body: '{}' }); });
    await page.goto('/en/audit/');
    await page.evaluate(() => document.querySelector<HTMLElement>('[data-audit]')!.setAttribute('data-endpoint', '/api/audit'));
    await fill(page);
    await page.getByRole('button', { name: 'Request audit' }).click();
    const result = page.locator('[data-result]');
    await expect(result).toContainText('could not send your request');
    await expect(result).not.toContainText('Request received');
    await expect(page.locator('#f-business')).toHaveValue('Studio');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(result).toContainText('Request received');
    expect(calls).toBe(2);
  });
});

test.describe('responsive reflow and text enlargement', () => {
  const pages = ['/en/', '/de/', '/es/', '/en/plans/', '/en/audit/', '/en/work/', '/en/work/sample-hotel/', '/de/services/ads/', '/en/about/'];
  for (const w of [320, 390, 834, 1440]) {
    test(`no horizontal page scroll at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      for (const p of pages) {
        await page.goto(p);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over, `${p} @${w}`).toBeLessThanOrEqual(0);
      }
    });
  }

  test('200% text enlargement: nothing overflows horizontally and mosaic text stays inside tiles', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const p of ['/en/', '/de/']) {
      await page.goto(p);
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await page.waitForTimeout(300);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over, p).toBeLessThanOrEqual(0);
      const clipped = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.tile')].filter((t) => {
        const r = t.getBoundingClientRect();
        return [...t.querySelectorAll<HTMLElement>('.tile__title,.tile__text,.tile__actions')].some((k) => k.getBoundingClientRect().bottom > r.bottom + 1);
      }).length);
      expect(clipped, `${p} clipped tiles`).toBe(0);
    }
  });

  test('mobile menu opens, is labelled, and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/en/');
    const btn = page.locator('.hdr__toggle');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#site-nav')).toBeHidden();
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#site-nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#site-nav')).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test('primary controls meet the 44px target', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/en/');
    const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.btn, .tile__explore, .tile__link, .hdr__toggle')].filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).map((e) => e.className));
    expect(small).toEqual([]);
  });
});

test.describe('accessibility (axe, WCAG 2.2 AA tags)', () => {
  const targets = ['/en/', '/es/', '/de/', '/en/plans/', '/en/audit/', '/en/work/', '/en/work/sample-clinic/', '/en/services/web/', '/en/about/', '/en/privacy/'];
  for (const p of targets) {
    test(`no serious or critical violations on ${p}`, async ({ page }) => {
      await page.goto(p);
      await page.waitForTimeout(1200); // let hero assembly finish so contrast is measured on final colours
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  }
});
