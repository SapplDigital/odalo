import { expect, test } from '@playwright/test';

const langs = ['es', 'en', 'de'] as const;
const TAG = { es: 'Ejemplo ilustrativo', en: 'Illustrative example', de: 'Beispiel zur Illustration' } as const;
const clips = ['charco', 'hecho', 'probar'];

for (const l of langs) {
  test.describe(`video hero phone (${l})`, () => {
    test(`/${l}/services/video/ has a labelled reel phone, lazy videos, assets 200`, async ({ page, request }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${l}/services/video/`, { waitUntil: 'networkidle' });
      const reel = page.locator('[data-svc-hero] [data-reel]');
      await expect(reel).toHaveCount(1);
      await expect(reel).toHaveAttribute('role', 'img');
      expect(((await reel.getAttribute('aria-label')) ?? '').length).toBeGreaterThan(10);
      const box = await reel.boundingBox();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
      await expect(reel.locator('.rp__tag')).toContainText(TAG[l]);
      // lazy: no video before any interaction
      expect(await reel.locator('video').count()).toBe(0);
      for (const n of clips) {
        for (const f of [`reel-${n}.webp`, `reel-${n}-mini.webp`, `reel-${n}.webm`, `reel-${n}.mp4`]) {
          expect((await request.get(`/services/video/${f}`)).status()).toBe(200);
        }
      }
      await page.mouse.move(100, 100);
      await page.mouse.move(300, 300);
      await expect(reel.locator('video')).toHaveCount(3);
      const info = await reel.locator('video').evaluateAll((vs) =>
        (vs as HTMLVideoElement[]).map((v) => ({ muted: v.muted, loop: v.loop, inline: v.playsInline, sources: Array.from(v.querySelectorAll('source')).map((s) => s.getAttribute('type')) })),
      );
      for (const v of info) {
        expect(v.muted).toBe(true);
        expect(v.loop).toBe(true);
        expect(v.inline).toBe(true);
        expect(v.sources).toEqual(['video/webm', 'video/mp4']);
      }
    });

    test(`/${l}/services/video/ reel pause button, pointerdown stop, preload`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${l}/services/video/`, { waitUntil: 'networkidle' });
      const reel = page.locator('[data-svc-hero] [data-reel]');
      const btn = page.locator('[data-reel-pause]');
      await expect(btn).toBeVisible();
      expect(await reel.locator('[data-reel-pause]').count()).toBe(0);
      expect(((await btn.getAttribute('aria-label')) ?? '').length).toBeGreaterThan(5);
      await expect(btn).toHaveAttribute('aria-pressed', 'false');
      await page.mouse.move(100, 100);
      await page.mouse.move(300, 300);
      await expect(reel.locator('video')).toHaveCount(3);
      await reel.scrollIntoViewIfNeeded();
      const activeIdx = () => reel.locator('.rp__clip').evaluateAll((cs) => cs.findIndex((c) => c.classList.contains('is-active')));
      const preloads = () => reel.locator('.rp__clip').evaluateAll((cs) => cs.map((c) => (c.querySelector('video') as HTMLVideoElement).preload));
      const first = await activeIdx();
      const pl = await preloads();
      if (first === 0) expect(pl).toEqual(['auto', 'metadata', 'metadata']);
      await btn.click();
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      const idx = await activeIdx();
      await page.waitForTimeout(3800);
      expect(await activeIdx()).toBe(idx);
      await btn.click();
      await expect(btn).toHaveAttribute('aria-pressed', 'false');
      await expect.poll(activeIdx, { timeout: 6000 }).not.toBe(idx);
      expect((await preloads()).filter((p) => p === 'auto').length).toBe(1);
      // pointerdown on the phone pauses
      const box = (await reel.locator('.rp__phone').boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.up();
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      const idx2 = await activeIdx();
      await page.waitForTimeout(3800);
      expect(await activeIdx()).toBe(idx2);
    });

    test(`/${l}/services/video/ reduced motion: poster only, no video`, async ({ browser }) => {
      const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`/${l}/services/video/`, { waitUntil: 'networkidle' });
      const reel = page.locator('[data-svc-hero] [data-reel]');
      await page.mouse.move(100, 100);
      await page.mouse.move(300, 300);
      await page.waitForTimeout(400);
      expect(await reel.locator('video').count()).toBe(0);
      const poster = reel.locator('.rp__clip').first().locator('.rp__poster');
      await expect(poster).toBeVisible();
      await expect.poll(() => poster.evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await ctx.close();
    });

    for (const w of [390, 1440]) {
      test(`/${l}/services/video/ shows a loaded reel poster at ${w}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(`/${l}/services/video/`, { waitUntil: 'networkidle' });
        const poster = page.locator('[data-reel] .rp__clip.is-active .rp__poster');
        await expect(poster).toHaveCount(1);
        expect(await poster.evaluate((i) => getComputedStyle(i).display)).not.toBe('none');
        await expect(poster).toBeVisible();
        await expect.poll(() => poster.evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      });

      test(`/${l}/services/video/ has no horizontal overflow at ${w}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(`/${l}/services/video/`, { waitUntil: 'networkidle' });
        const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth }));
        expect(r.sw).toBeLessThanOrEqual(r.vw);
        const box = await page.locator('[data-reel] .rp__phone').boundingBox();
        expect(box!.width).toBeGreaterThan(0);
      });
    }

    for (const id of ['web', 'local', 'ads']) {
      test(`/${l}/services/${id}/ has no reel phone`, async ({ page }) => {
        await page.goto(`/${l}/services/${id}/`, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('[data-reel], .rp, .ph')).toHaveCount(0);
      });
    }
  });
}
