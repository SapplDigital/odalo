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
      const sec = await page.locator('[data-home-hero]').boundingBox();
      expect(sec).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(sec!.width * 0.95);
      expect(box!.height).toBeGreaterThanOrEqual(sec!.height * 0.8);
      await page.locator('.hp .h-hero').click({ trial: true });
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

  test(`hero cloud is static with designed offsets /${lang}/`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${lang}/`);
    const res = await page.evaluate(() => {
      const root = document.querySelector('[data-hero-cloud]')!;
      const running = [root, ...Array.from(root.querySelectorAll('*'))]
        .map((el) => getComputedStyle(el).animationName)
        .filter((n) => n && n !== 'none');
      const pos = (s: string) => getComputedStyle(root.querySelector(s)!).backgroundPosition;
      return { running, d1: pos('.cloud__d1'), d2: pos('.cloud__d2'), d3: pos('.cloud__d3') };
    });
    expect(res.running).toEqual([]);
    expect(res.d1).toBe('4px 6px');
    expect(res.d2).toBe('13px 21px');
    expect(res.d3).toBe('40px 9px');
  });

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
