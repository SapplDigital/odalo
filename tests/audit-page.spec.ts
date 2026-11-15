import { test, expect } from '@playwright/test';
import { tr } from '../src/i18n/ui';
import { auditInPage } from './helpers/reflow';

// M8: structure of /[lang]/audit/ after the port to Ale's /auditoria layout.
const langs = ['es', 'en', 'de'] as const;
const FORM_NAME = 'audit'; // = site.netlifyForm.name

test.beforeEach(async ({ page }) => {
  await page.route(/^(?!http:\/\/localhost)/, (r) => r.abort());
});

for (const l of langs) {
  test.describe(`audit page structure (${l})`, () => {
    test('intro then form card in DOM order, one h1, review list from i18n, old mosaic gone', async ({ page }) => {
      await page.goto(`/${l}/audit/`);
      const t = tr(l).audit;
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(`${t.h1.a} ${t.h1.em}`);
      await expect(page.locator('[data-audit-intro] h1')).toHaveCount(1);
      await expect(page.locator('[data-audit-intro]')).toContainText(t.eyebrow);
      await expect(page.locator('[data-audit-intro]')).toContainText(t.lead);
      const order = await page.evaluate(() => {
        const a = document.querySelector('[data-audit-intro]')!, b = document.querySelector('[data-audit-form-card]')!;
        return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      expect(order).toBe(true);
      await expect(page.locator('[data-audit-form-card] form[data-form]')).toHaveCount(1);
      const items = page.locator('[data-audit-review] ol > li');
      await expect(items).toHaveCount(4);
      const p = t.mosaic.pieces;
      const expected = [p.web, p.local, p.video, p.ads];
      for (let i = 0; i < 4; i++) {
        await expect(items.nth(i)).toContainText(expected[i]!.n);
        await expect(items.nth(i)).toContainText(expected[i]!.s);
      }
      await expect(page.locator('[data-audit-review]')).toContainText(t.reviewLabel);
      expect(await page.locator('[data-am], .am-req, .am-intro').count()).toBe(0);
    });

    test('Netlify form attributes, form-name and pageLanguage; email alternative present', async ({ page }) => {
      await page.goto(`/${l}/audit/`);
      const form = page.locator('[data-audit-form-card] form[data-netlify="true"]');
      await expect(form).toHaveCount(1);
      await expect(form).toHaveAttribute('name', FORM_NAME);
      await expect(form).toHaveAttribute('netlify-honeypot', 'bot-field');
      await expect(form.locator('input[name="form-name"]')).toHaveValue(FORM_NAME);
      await expect(form.locator('input[name="pageLanguage"]')).toHaveValue(l);
      await expect(page.locator('[data-audit-intro] [data-audit-alt] a[href^="mailto:"]')).toBeVisible();
      await expect(page.locator('[data-audit-alt]')).toContainText(tr(l).audit.altH);
    });

    test('decoration is aria-hidden and does not intercept form controls', async ({ page }) => {
      await page.goto(`/${l}/audit/`);
      const decor = page.locator('[data-audit-decor]');
      await expect(decor).toHaveAttribute('aria-hidden', 'true');
      expect(await decor.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe('none');
      await page.locator('#f-business').click(); // would fail if something covered it
      await expect(page.locator('#f-business')).toBeFocused();
    });

    for (const [w, h] of [[390, 844], [1440, 900]] as const) {
      test(`no horizontal overflow at ${w}px; stacks at 390`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await page.goto(`/${l}/audit/`);
        await page.evaluate(() => document.fonts.ready);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over).toBeLessThanOrEqual(0);
        expect(await page.evaluate(auditInPage)).toEqual([]);
        const [a, b] = await page.evaluate(() => ['[data-audit-intro]', '[data-audit-form-card]'].map((s) => { const r = document.querySelector(s)!.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width }; }));
        if (w === 390) expect(b!.y).toBeGreaterThan(a!.y); // one column: card below the intro
        else expect(b!.x).toBeGreaterThan(a!.x); // two columns: card to the right
      });
    }
  });
}

test.describe('no JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  for (const l of langs) test(`${l}: intro and form stay visible`, async ({ page }) => {
    await page.goto(`/${l}/audit/`);
    await expect(page.locator('[data-audit-intro] h1')).toBeVisible();
    await expect(page.locator('[data-audit-review]')).toBeVisible();
    await expect(page.locator('[data-audit-form-card]')).toBeVisible();
    await expect(page.locator('#f-business')).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  for (const l of langs) test(`${l}: intro and form stay visible`, async ({ page }) => {
    await page.goto(`/${l}/audit/`);
    await expect(page.locator('[data-audit-intro] h1')).toBeVisible();
    await expect(page.locator('[data-audit-form-card]')).toBeVisible();
    await expect(page.locator('#f-business')).toBeVisible();
  });
});
