import { test, expect } from '@playwright/test';

const langs = ['es', 'en', 'de'] as const;

for (const lang of langs) {
  test(`italic headline accent is navy on light surfaces /${lang}/`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    const colors = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.hm-h1 em, .h-hero em, .h-section em'))
        .filter((el) => !el.closest('.on-dark'))
        .map((el) => getComputedStyle(el).color),
    );
    expect(colors.length).toBeGreaterThan(0);
    for (const c of colors) {
      expect(c).toBe('rgb(0, 64, 102)');
    }
  });
}
