// Ale's nav labels (services/plans/studio) and navy italic accent on the home page, ES/EN/DE.
import { test, expect } from '@playwright/test';

const labels = {
  es: ['Servicios', 'Planes', 'Proceso', 'Estudio'],
  en: ['Services', 'Plans', 'Process', 'Studio'],
  de: ['Leistungen', 'Pakete', 'Ablauf', 'Studio'],
} as const;

for (const lang of ['es', 'en', 'de'] as const) {
  test.describe(`nav labels ${lang}`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('desktop header labels follow Ale, hrefs unchanged', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const nav = page.locator('header nav .hdr__links a');
      await expect(nav).toHaveText([...labels[lang]]);
      await expect(nav.nth(0)).toHaveAttribute('href', '#services');
      await expect(nav.nth(1)).toHaveAttribute('href', `/${lang}/plans/`);
      await expect(nav.nth(2)).toHaveAttribute('href', '#process');
      await expect(nav.nth(3)).toHaveAttribute('href', `/${lang}/about/`);
    });

    test('hero italic accent is Ale navy', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const em = page.locator('.hm-h1 em, .h-hero em').first();
      await expect(em).toBeVisible();
      expect(await em.evaluate((e) => getComputedStyle(e).color)).toBe('rgb(0, 64, 102)');
    });
  });
}
