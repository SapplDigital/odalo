import { test, expect, type Page } from '@playwright/test';

const langs = ['es', 'en', 'de'] as const;
const widths = [390, 1440] as const;

async function assertDots(page: Page, scope: string) {
  const svgs = page.locator(`${scope} svg.dot-text`);
  const n = await svgs.count();
  expect(n, `at least one .dot-text svg in ${scope}`).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const svg = svgs.nth(i);
    await svg.scrollIntoViewIfNeeded();
    await expect(svg).toBeVisible();
    const box = await svg.boundingBox();
    expect(box, 'svg has a bounding box').not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
    const d = await svg.locator('path').first().getAttribute('d');
    expect((d ?? '').length).toBeGreaterThan(0);
  }
}

for (const lang of langs) {
  for (const width of widths) {
    test(`dot-text home plans /${lang}/ @${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}/`);
      await page.locator('#planes').scrollIntoViewIfNeeded();
      await assertDots(page, '#planes');
    });
    test(`dot-text plans page /${lang}/plans/ @${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${lang}/plans/`);
      await assertDots(page, 'main');
    });
  }
}
