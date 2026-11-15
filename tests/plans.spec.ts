import { test, expect } from '@playwright/test';
import { plans, quoteLabel } from '../src/content/plans';
import { tr } from '../src/i18n/ui';

const langs = ['es', 'en', 'de'] as const;
const SECTIONS = ['data-plans-header', 'data-plans-step-web', 'data-plans-step-monthly', 'data-home-kit', 'data-plans-conditions', 'data-plans-closing'];

for (const lang of langs) {
  test.describe(`plans /${lang}/plans/`, () => {
    test('sections exist in order, exactly one h1', async ({ page }) => {
      await page.goto(`/${lang}/plans/`);
      const order = await page.evaluate((hooks) => hooks.map((h) => {
        const el = document.querySelector(`[${h}]`);
        return el ? el.getBoundingClientRect().top + scrollY : -1;
      }), SECTIONS);
      expect(order.every((y) => y >= 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test('every plan is rendered with its name and price label; 360 spans the full width', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${lang}/plans/`);
      for (const p of plans) {
        const card = page.locator(`[data-plans-step-monthly] [data-plan-card="${p.id}"]`);
        await expect(card).toHaveCount(1);
        await expect(card.locator('h3')).toHaveText(p.name);
        const price = card.locator('[data-plan-price]');
        if (p.monthly === null) await expect(price).toHaveText(quoteLabel[lang]);
        else await expect(price).toContainText(String(p.monthly));
      }
      const grid = (await page.locator('.sm__grid').boundingBox())!;
      const wide = (await page.locator('[data-plan-card="360"]').boundingBox())!;
      expect(wide.width).toBeGreaterThan(grid.width * 0.95);
      await expect(page.locator('[data-plans-step-web] [data-plan-price="build"]')).toContainText(/\d/);
    });

    test('exactly one recommended card, marked with data-featured and a visible tag', async ({ page }) => {
      await page.goto(`/${lang}/plans/`);
      const featured = page.locator('[data-plans-step-monthly] [data-featured="true"]');
      await expect(featured).toHaveCount(1);
      await expect(featured).toHaveAttribute('data-plan-card', plans.find((p) => p.featured)!.id);
      await expect(featured).toContainText(tr(lang).common.featured);
    });

    test('audit links resolve to same-language routes', async ({ page }) => {
      await page.goto(`/${lang}/plans/`);
      const hrefs = await page.locator('main a[data-plans-audit-link], [data-home-kit] a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(hrefs.length).toBeGreaterThanOrEqual(plans.length + 3);
      for (const h of hrefs) expect(h).toMatch(new RegExp(`^/${lang}/audit/(\\?plan=[a-z0-9]+)?$`));
      expect((await page.request.get(`/${lang}/audit/`)).status()).toBe(200);
      expect(await page.locator('[data-plans-closing] a[href^="mailto:"]').count()).toBeGreaterThanOrEqual(1);
    });

    if (lang !== 'es') {
      test('no Spanish copy', async ({ page }) => {
        await page.goto(`/${lang}/plans/`);
        const text = await page.locator('[data-plans-header], [data-plans-step-web], [data-plans-step-monthly], [data-plans-closing]').allInnerTexts();
        for (const w of ['Paso 1', 'Paso 2', 'Pedir presupuesto', 'Incluye', 'No sabes', 'Elegir']) expect(text.join(' ')).not.toContain(w);
      });
    }

    for (const width of [390, 1440]) {
      test(`no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${lang}/plans/`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over).toBeLessThanOrEqual(0);
      });
    }
  });
}
