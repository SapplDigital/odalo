import { test, expect } from '@playwright/test';

const langs = ['es', 'en', 'de'] as const;
const widths = [390, 1440] as const;

// Home hero = Ale's dot-canvas hero (HeroSenal port): dot headline + Canary map on a canvas, no mosaic stones.
for (const lang of langs) {
  for (const width of widths) {
    test(`hero signal /${lang}/ @${width}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}/`);
      const hero = page.locator('[data-home-hero]');
      await expect(hero.locator('canvas.hs__cv')).toHaveCount(1);
      await expect(hero.locator('svg.stones, [data-hero-cloud]')).toHaveCount(0);
      await expect(hero.locator('h1')).toHaveCount(1);
      await expect(hero.getByRole('link').first()).toBeVisible();
      // canvas has painted dots (not just the flat background)
      await page.waitForFunction(() => {
        const c = document.querySelector<HTMLCanvasElement>('.hs__cv')!;
        const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
        for (let i = 0; i < d.length; i += 4) if (d[i] < 40 && d[i + 2] > 80) return true;
        return false;
      });
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw).toBeLessThanOrEqual(width);
    });
  }

  test(`hero pill does not cover the hero text /${lang}/ @390`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${lang}/`);
    const pill = await page.locator('.hdr__pill').boundingBox();
    const title = await page.locator('[data-zona="titular"]').boundingBox();
    expect(pill).not.toBeNull();
    expect(title).not.toBeNull();
    expect(pill!.y + pill!.height).toBeLessThanOrEqual(title!.y);
  });
}