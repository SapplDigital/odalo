import { test, expect } from '@playwright/test';

const langs = ['es', 'en', 'de'] as const;
const widths = [390, 1440] as const;

for (const lang of langs) {
  for (const width of widths) {
    test(`home /${lang}/ @${width}: every project card image loads and is visible`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}/`);
      const cards = page.locator('[data-project-card]');
      await expect(cards).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        const img = cards.nth(i).locator('img');
        await expect(img).toHaveCount(1);
        await img.scrollIntoViewIfNeeded();
        await expect
          .poll(() => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0), { timeout: 10_000 })
          .toBe(true);
        const box = await img.boundingBox();
        expect(box, 'image has a bounding box').not.toBeNull();
        expect(box!.width).toBeGreaterThan(0);
        expect(box!.height).toBeGreaterThan(0);
        await expect(img).toBeVisible();
        const opacity = await img.evaluate((el) => {
          let o = 1;
          for (let n: Element | null = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
          return o;
        });
        expect(opacity).toBeGreaterThan(0);
      }
    });
  }
}
