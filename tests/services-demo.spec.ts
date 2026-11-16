import { test, expect } from '@playwright/test';

const langs = ['es', 'en', 'de'] as const;

for (const lang of langs) {
  test.describe(`home /${lang}/ services demo @1440`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('framed side demo is visible, right of accordion, switches with the open item', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const sec = page.locator('[data-home-services]');
      await sec.scrollIntoViewIfNeeded();
      const frame = sec.locator('[data-sv-frame]');
      await expect(frame).toBeVisible();
      const fb = await frame.boundingBox();
      const ab = await sec.locator('[data-sv-acc]').boundingBox();
      expect(fb && fb.width > 0 && fb.height > 0).toBeTruthy();
      expect(fb!.x).toBeGreaterThanOrEqual(ab!.x + ab!.width - 1);

      const buttons = sec.locator('[data-sv-btn]');
      const n = await buttons.count();
      expect(n).toBeGreaterThan(1);
      const first = await sec.getAttribute('data-active');
      await expect(sec.locator(`.sv__demo[data-demo="${first}"]`)).toBeVisible();
      await buttons.nth(1).click();
      const second = await sec.getAttribute('data-active');
      expect(second).not.toBe(first);
      await expect(sec.locator(`.sv__demo[data-demo="${second}"]`)).toBeVisible();
      await expect(sec.locator(`.sv__demo[data-demo="${first}"]`)).toBeHidden();
      const demoBox = await sec.locator(`.sv__demo[data-demo="${second}"]`).boundingBox();
      expect(demoBox!.width).toBeGreaterThan(0);
    });

    test('no horizontal overflow', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(ok).toBe(true);
    });
  });

  test.describe(`home /${lang}/ services demo @390`, () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('demo shows inside the open panel below the text; no overflow', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const sec = page.locator('[data-home-services]');
      await sec.scrollIntoViewIfNeeded();
      await expect(sec.locator('[data-sv-frame]')).toBeHidden();
      const buttons = sec.locator('[data-sv-btn]');
      await buttons.nth(1).click();
      const panel = sec.locator('[data-sv-panel]:not([hidden])');
      await expect(panel).toHaveCount(1);
      const pp = panel.locator('.sv__pp .ph');
      await expect(pp).toBeVisible();
      const link = await panel.locator('.sv__link').boundingBox();
      const box = await pp.boundingBox();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.y).toBeGreaterThanOrEqual(link!.y + link!.height - 1);
      const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(ok).toBe(true);
    });
  });
}
