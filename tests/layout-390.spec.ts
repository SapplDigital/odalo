import { test, expect } from '@playwright/test';

const langs = ['es', 'en', 'de'] as const;
const sizes = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
] as const;

type Box = { x: number; y: number; width: number; height: number };
const intersects = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const lang of langs) {
  for (const { width, height } of sizes) {
    test.describe(`home /${lang}/ @${width}: layout`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(`/${lang}/`);
      });

      test('contact band h2 does not intersect the terrazzo shapes', async ({ page }) => {
        const band = page.locator('#contacto');
        await band.scrollIntoViewIfNeeded();
        const h2 = await page.locator('#contacto-h').boundingBox();
        expect(h2).not.toBeNull();
        const path = page.locator('.ctc__path');
        await expect(path).toHaveAttribute('aria-hidden', 'true');
        const pathBox = await path.boundingBox();
        expect(pathBox).not.toBeNull();
        expect(intersects(h2!, pathBox!), 'h2 vs .ctc__path').toBe(false);
        const svgs = path.locator('svg');
        const n = await svgs.count();
        for (let i = 0; i < n; i++) {
          const sb = await svgs.nth(i).boundingBox();
          if (sb) expect(intersects(h2!, sb), `h2 vs svg #${i}`).toBe(false);
        }
      });

      test('Tidewell card image keeps its left edge', async ({ page }) => {
        const card = page.locator("[data-project-card='sample-clinic']");
        await card.scrollIntoViewIfNeeded();
        const img = card.locator('img');
        await expect
          .poll(() => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0), { timeout: 10_000 })
          .toBe(true);
        const pos = await img.evaluate((el) => getComputedStyle(el).objectPosition.split(' ')[0]);
        expect(['0%', '0px', 'left']).toContain(pos);
        const box = await card.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(-1);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
      });

      test('no horizontal overflow', async ({ page }) => {
        const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
        expect(sw).toBeLessThanOrEqual(iw);
      });
    });
  }
}
