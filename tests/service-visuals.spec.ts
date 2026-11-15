import { test, expect } from '@playwright/test';

/** Video service page: "Qué hacemos" photo-card section (data-svc-visuals) exists only there. */

for (const lang of ['es', 'en', 'de'] as const) {
  test(`${lang}: video page has the visuals section between hero and deliver`, async ({ page }) => {
    await page.goto(`/${lang}/services/video/`);
    const sec = page.locator('[data-svc-visuals]');
    await expect(sec).toHaveCount(1);
    await expect(sec.locator('h2')).toHaveCount(1);
    await expect(sec.locator('h1')).toHaveCount(0);
    const order = await page.evaluate(() => {
      const h = document.querySelector('[data-svc-hero]');
      const v = document.querySelector('[data-svc-visuals]');
      const d = document.querySelector('[data-svc-deliver]');
      if (!h || !v || !d) return false;
      return Boolean(h.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING) && Boolean(v.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(order).toBe(true);
    const cells = sec.locator('[data-svc-visual-cell]');
    await expect(cells).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const cell = cells.nth(i);
      await expect(cell.locator('.sv__n')).toHaveText(String(i + 1).padStart(2, '0'));
      await expect(cell.locator('h3')).toHaveCount(1);
      expect(await cell.locator('ul li').count()).toBeGreaterThan(1);
    }
  });

  test(`${lang}: video page visuals images load from same-origin /servicios/video/`, async ({ page }) => {
    await page.goto(`/${lang}/services/video/`);
    const imgs = page.locator('[data-svc-visuals] img');
    const n = await imgs.count();
    expect(n).toBe(8); // 3 reels + 1 spot + 4 photos
    await page.evaluate(() => {
      document.querySelectorAll<HTMLImageElement>('[data-svc-visuals] img').forEach((i) => { i.loading = 'eager'; });
    });
    await page.waitForFunction(() => Array.from(document.querySelectorAll<HTMLImageElement>('[data-svc-visuals] img')).every((i) => i.complete && i.naturalWidth > 0));
    const info = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLImageElement>('[data-svc-visuals] img')).map((i) => ({ src: i.currentSrc || i.src, w: i.naturalWidth, alt: i.getAttribute('alt') })));
    for (const i of info) {
      expect(i.w).toBeGreaterThan(0);
      expect(i.alt).toBe('');
      const u = new URL(i.src);
      expect(u.origin).toBe(new URL(page.url()).origin);
      expect(u.pathname).toContain('/servicios/video/');
    }
  });

  test(`${lang}: video page has no horizontal overflow at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(`/${lang}/services/video/`);
    const o = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(o).toBe(true);
  });

  for (const id of ['web', 'local', 'ads']) {
    test(`${lang}: ${id} page has no visuals section`, async ({ page }) => {
      await page.goto(`/${lang}/services/${id}/`);
      await expect(page.locator('[data-svc-visuals]')).toHaveCount(0);
    });
  }
}
