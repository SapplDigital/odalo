import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { services, serviceVisual } from '../src/content/services';

// The homepage is now HomeMosaic (mosaic redesign ba8aa35): the four-tile service picture board with hover/assembly no longer exists on it.
// What remains of this feature is the per-service concept picture data and the 12 service pages (4 services x 3 languages).
const langs = ['en', 'es', 'de'] as const;
const ids = ['web', 'local', 'video', 'ads'] as const;
const expectFile = { web: 'hotel-desktop', local: 'services-local-info', video: 'services-video-strip', ads: 'clinic-ad-square' } as const;

test.describe('service imagery: content', () => {
  test('each service maps to an existing concept output, with files on disk and complete localized text', () => {
    expect(services.map((s) => s.id)).toEqual([...ids]);
    for (const s of services) {
      const v = serviceVisual(s);
      expect(v.image.file, s.id).toBe(expectFile[s.id]);
      for (const w of v.image.widths) expect(fs.existsSync(`public/work/concepts/${v.image.folder}/${v.image.file}-${w}.webp`), `${s.id} ${w}`).toBe(true);
      expect(Math.max(...v.image.widths)).toBe(v.image.width);
      for (const l of langs) { expect(v.image.alt[l].length).toBeGreaterThan(60); expect(v.label[l].length).toBeGreaterThan(8); expect(v.badge[l].length).toBeGreaterThan(8); }
      expect(new Set(langs.map((l) => v.image.alt[l])).size).toBe(3);
    }
    // the two crops exported for this task record their source
    for (const id of ['local', 'video'] as const) { const c = services.find((s) => s.id === id)!.visual.crop!; for (const l of langs) expect(c.provenance[l]).toMatch(/docs\/review|public\/work/); }
  });
});

test.describe('service pages (all 12): artwork, caption, enquiry preselection', () => {
  for (const l of langs) for (const s of services) {
    test(`/${l}/services/${s.id}/ shows the ${s.id} concept picture with its label and keeps the enquiry link`, async ({ page }) => {
      const media: string[] = [];
      page.on('request', (r) => { if (/\.(webm|mp4)(\?|$)/.test(r.url())) media.push(r.url()); });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${l}/services/${s.id}/`, { waitUntil: 'networkidle' });
      const v = serviceVisual(s);
      const img = page.locator('.svc-fig img');
      await expect(img).toHaveCount(1);
      await expect.poll(async () => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
      expect(await img.evaluate((e: HTMLImageElement) => e.currentSrc)).toContain(expectFile[s.id]);
      await expect(img).toHaveAttribute('alt', v.image.alt[l]);
      await expect(img).toHaveAttribute('width', String(v.image.width));
      await expect(page.locator('.svc-fig figcaption')).toContainText(v.badge[l]);
      await expect(page.locator('.svc-fig figcaption')).toContainText(v.label[l]);
      // natural shape: the displayed box keeps the picture's own proportions (nothing cropped or stretched)
      const box = (await img.boundingBox())!;
      expect(Math.abs(box.width / box.height - v.image.width / v.image.height)).toBeLessThan(0.05);
      expect(await page.locator('[data-svc-hero] svg.art, [data-svc-hero] .art').count()).toBe(0);
      expect(media).toEqual([]);
      await expect(page.locator('main h1')).toHaveCount(1);
      await page.locator('[data-svc-hero] a[data-track="audit_cta"]').click();
      await expect(page).toHaveURL(new RegExp(`/${l}/audit/\\?service=${s.id}$`));
      await expect(page.locator('#f-service')).toHaveValue(s.id);
    });
  }

  test('service pages at 390px: picture fits the column, caption visible, no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const s of services) {
      await page.goto(`/de/services/${s.id}/`, { waitUntil: 'networkidle' });
      const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, w: document.querySelector('.svc-fig img')!.getBoundingClientRect().width }));
      expect(r.sw).toBeLessThanOrEqual(r.vw);
      expect(r.w).toBeGreaterThan(300);
      await expect(page.locator('.svc-fig figcaption')).toBeVisible();
    }
  });
});
