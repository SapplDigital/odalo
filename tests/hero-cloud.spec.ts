import { test, expect } from '@playwright/test';

const langs = ['es', 'en', 'de'] as const;
const widths = [390, 1440] as const;

for (const lang of langs) {
  for (const width of widths) {
    test(`hero cloud /${lang}/ @${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}/`);
      const cloud = page.locator('[data-hero-cloud]');
      await expect(cloud).toHaveCount(1);
      await expect(cloud).toHaveAttribute('aria-hidden', 'true');
      const box = await cloud.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
      expect(await cloud.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw).toBeLessThanOrEqual(width);
      await expect(page.locator('.hp .h-hero')).toBeVisible();
    });

    test(`hero cloud reduced motion /${lang}/ @${width}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}/`);
      const running = await page.evaluate(() => {
        const root = document.querySelector('[data-hero-cloud]')!;
        return [root, ...Array.from(root.querySelectorAll('*'))]
          .map((el) => getComputedStyle(el).animationName)
          .filter((n) => n && n !== 'none');
      });
      expect(running).toEqual([]);
    });
  }

  test(`hero pill does not cover eyebrow /${lang}/ @390`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${lang}/`);
    await page.evaluate(() => window.scrollTo(0, 0));
    const pill = await page.locator('.hdr__pill').boundingBox();
    const eyebrow = await page.locator('.hp__eyebrow').boundingBox();
    expect(pill).not.toBeNull();
    expect(eyebrow).not.toBeNull();
    const intersects =
      pill!.x < eyebrow!.x + eyebrow!.width &&
      eyebrow!.x < pill!.x + pill!.width &&
      pill!.y < eyebrow!.y + eyebrow!.height &&
      eyebrow!.y < pill!.y + pill!.height;
    expect(intersects).toBe(false);
  });
}
