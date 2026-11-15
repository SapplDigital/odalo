import { test, expect } from '@playwright/test';

const langs = ['es', 'en', 'de'] as const;
const pages = ['', 'plans/', 'about/', 'audit/', 'legal/'];

for (const lang of langs) {
  for (const path of pages) {
    const url = `/${lang}/${path}`;
    test(`footer (Ale Pie) ${url}`, async ({ page }) => {
      await page.goto(url);
      await expect(page.locator('footer[data-pie]')).toHaveCount(1);
      await expect(page.locator('footer')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveCount(1);

      for (const target of ['privacy', 'cookies', 'legal']) {
        await expect(page.locator(`footer[data-pie] nav a[href$="/${lang}/${target}/"]`).first()).toBeVisible();
      }
      for (const other of langs.filter((l) => l !== lang)) {
        const link = page.locator(`footer[data-pie] a[hreflang="${other}"]`);
        await expect(link).toHaveCount(1);
        expect(await link.getAttribute('href')).toContain(`/${other}/`);
      }
      await expect(page.locator('footer[data-pie] a[hreflang]')).toHaveCount(2);

      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${url} @${width}`).toBeLessThanOrEqual(0);
      }
    });
  }
}
