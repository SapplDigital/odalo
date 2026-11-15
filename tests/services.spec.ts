import { test, expect } from '@playwright/test';
import { services } from '../src/content/services';
import { plansFrom, planPriceText } from '../src/content/plans';

const langs = ['es', 'en', 'de'] as const;
const HOOKS = ['data-svc-hero', 'data-svc-deliver', 'data-svc-process', 'data-svc-plan', 'data-svc-faq', 'data-svc-closing'];

for (const lang of langs) for (const s of services) {
  test.describe(`service /${lang}/services/${s.id}/`, () => {
    test('sections in order, exactly one h1, old markup gone', async ({ page }) => {
      await page.goto(`/${lang}/services/${s.id}/`);
      const order = await page.evaluate((hooks) => hooks.map((h) => {
        const el = document.querySelector(`[${h}]`);
        return el ? el.getBoundingClientRect().top + scrollY : -1;
      }), HOOKS);
      expect(order.every((y) => y >= 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('[data-svc-hero] h1')).toHaveCount(1);
      await expect(page.locator('.ph, .relplan, .deliver')).toHaveCount(0);
      await expect(page.locator('[data-svc-closing] [data-home-contact]')).toHaveCount(1);
    });

    test('deliverables and related plans come from data', async ({ page }) => {
      await page.goto(`/${lang}/services/${s.id}/`);
      const cells = page.locator('[data-svc-deliver] [data-svc-deliverables] li');
      await expect(cells).toHaveCount(s.deliverables[lang].length);
      for (const [i, d] of s.deliverables[lang].entries()) await expect(cells.nth(i)).toContainText(d);
      const plans = plansFrom(s.relatedPlan);
      const rows = page.locator('[data-svc-plan] [data-svc-plan-row]');
      await expect(rows).toHaveCount(plans.length);
      for (const [i, p] of plans.entries()) {
        await expect(rows.nth(i).locator('[data-svc-plan-name]')).toHaveText(p.name);
        await expect(rows.nth(i).locator('[data-svc-plan-price]')).toContainText(planPriceText(p, lang, '').trim());
      }
    });

    test('audit and plans links stay in the same language and keep params', async ({ page }) => {
      await page.goto(`/${lang}/services/${s.id}/`);
      await expect(page.locator('[data-svc-hero] a[data-track="audit_cta"]')).toHaveAttribute('href', `/${lang}/audit/?service=${s.id}`);
      await expect(page.locator('[data-svc-plan] [data-svc-plans-link]')).toHaveAttribute('href', `/${lang}/plans/`);
      for (const p of plansFrom(s.relatedPlan)) {
        await expect(page.locator(`[data-svc-plan-row="${p.id}"] a`)).toHaveAttribute('href', `/${lang}/audit/?plan=${p.id}&service=${s.id}`);
      }
      await expect(page.locator('[data-svc-closing] a[href*="/audit/"]')).toHaveAttribute('href', `/${lang}/audit/`);
    });

    for (const width of [390, 1440]) {
      test(`no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${lang}/services/${s.id}/`);
        const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth }));
        expect(r.sw).toBeLessThanOrEqual(r.vw);
      });
    }
  });
}
