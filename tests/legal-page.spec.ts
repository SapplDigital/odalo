import { test, expect } from '@playwright/test';
import { legalFor } from '../src/content/legal';
import { tr } from '../src/i18n/ui';

// M9: structure of the legal pages after the port to Ale's [legal] layout.
const langs = ['es', 'en', 'de'] as const;
const slugs = ['legal', 'privacy', 'cookies'] as const;
const EMAIL = 'info@sappl-digital-services.com';

for (const l of langs) {
  for (const slug of slugs) {
    test.describe(`legal page structure (${l}/${slug})`, () => {
      test('hook order, one h1 = title, eyebrow, banner role=note, card with dl and mailto, no PageHero', async ({ page }) => {
        await page.goto(`/${l}/${slug}/`);
        const title = legalFor(l, 'simulated').pages[slug].title;
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('h1')).toHaveText(title);
        await expect(page.locator('[data-legal-intro] h1')).toHaveCount(1);
        await expect(page.locator('[data-legal-intro]')).toContainText(tr(l).footer.legal);
        await expect(page.locator('[data-legal-banner]')).toHaveAttribute('role', 'note');
        await expect(page.locator('[data-legal-card] dl')).toHaveCount(1);
        await expect(page.locator(`[data-legal-card] a[href="mailto:${EMAIL}"]`)).toBeVisible();
        const order = await page.evaluate(() => {
          const sel = ['[data-legal-intro]', '[data-legal-banner]', '[data-legal-card]', '[data-legal-sections]'];
          const els = sel.map((s) => document.querySelector(s));
          if (els.some((e) => !e)) return false;
          return els.every((e, i) => i === 0 || !!(els[i - 1]!.compareDocumentPosition(e!) & Node.DOCUMENT_POSITION_FOLLOWING));
        });
        expect(order).toBe(true);
        expect(await page.locator('[data-legal-sections] > li').count()).toBeGreaterThan(0);
        expect(await page.locator('.lg, .lg__banner, .lg__card, .lg__list, .page-hero, [data-page-hero]').count()).toBe(0);
      });

      for (const [w, h] of [[390, 844], [1440, 900]] as const) {
        test(`no horizontal overflow at ${w}px`, async ({ page }) => {
          await page.setViewportSize({ width: w, height: h });
          await page.goto(`/${l}/${slug}/`);
          const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(over).toBeLessThanOrEqual(0);
        });
      }
    });
  }
}

test.describe('legal pages without JS', () => {
  test.use({ javaScriptEnabled: false });
  for (const l of langs) {
    for (const slug of slugs) {
      test(`${l}/${slug}: content visible`, async ({ page }) => {
        await page.goto(`/${l}/${slug}/`);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('[data-legal-banner]')).toBeVisible();
        await expect(page.locator('[data-legal-card]')).toBeVisible();
        await expect(page.locator('[data-legal-sections] > li').first()).toBeVisible();
      });
    }
  }
});
