// Targeted render assertions for the approved offer (website build from a one-off price, monthly Base/Local/Captación, 360 on custom quote).
// Small and bounded on purpose; runs against any served build via the baseURL (dev or a package).
import { test, expect } from '@playwright/test';
import { plans, quoteLabel } from '../src/content/plans';
import { websiteBuildFrom } from '../src/content/offer';
import { formatPrice } from '../src/i18n';

test.setTimeout(15_000);
const langs = ['en', 'de', 'es'] as const;
const stale = /1[.,\s]?290|NaN|undefined/;

for (const l of langs) {
  test(`${l}: plans page shows the one-off build price, three monthly prices and a custom-quote 360`, async ({ page }) => {
    await page.goto(`/${l}/plans/`);
    const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    expect(text.replace(/Genannte/g, '')).not.toMatch(stale);
    expect(text).toContain(formatPrice(websiteBuildFrom, l).replace(/\s/g, ' ')); // Intl uses a no-break space; the page text is whitespace-normalised
    for (const p of plans) {
      const card = page.locator(`#plan-${p.id}`);
      if (p.monthly === null) {
        await expect(card.locator('.plan__amount')).toHaveText(quoteLabel[l]);
        await expect(card.locator('.plan__per')).toHaveCount(0);
      } else {
        await expect(card.locator('.plan__amount')).toContainText(String(p.monthly));
        await expect(card.locator('.plan__per')).toHaveCount(1);
      }
    }
    await expect(page.locator('#plan-captacion')).toContainText(l === 'en' ? 'from your footage' : /./);
  });

  test(`${l}: Website page lists all four plans with the build note; 360 shows the quote label`, async ({ page }) => {
    await page.goto(`/${l}/services/web/`);
    await expect(page.locator('[data-svc-plan-row]')).toHaveCount(4);
    await expect(page.locator('.bnote')).toContainText(formatPrice(websiteBuildFrom, l).replace(/\s/g, ' '), { useInnerText: true });
    for (const [i, p] of plans.entries()) {
      await expect(page.locator('[data-svc-plan-row]').nth(i).locator('[data-svc-plan-price]')).toContainText(p.monthly === null ? quoteLabel[l] : String(p.monthly));
      await expect(page.locator('[data-svc-plan-row]').nth(i).locator('a[data-plan]')).toHaveAttribute('href', new RegExp(`\\?plan=${p.id}&service=web$`));
    }
    await page.goto(`/${l}/services/ads/`);
    await expect(page.locator('[data-svc-plan-row]')).toHaveCount(2);
    await expect(page.locator('.bnote')).toHaveCount(0);
  });

  test(`${l}: audit select keeps the same plan values and shows the price text; ?plan=360 preselects`, async ({ page }) => {
    await page.goto(`/${l}/audit/?plan=360`);
    expect(await page.locator('#f-plan option').evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value))).toEqual(['', 'base', 'local', 'captacion', '360']);
    await expect(page.locator('#f-plan')).toHaveValue('360');
    await expect(page.locator('#f-plan option[value="360"]')).toContainText(quoteLabel[l]);
    await expect(page.locator('#f-plan option[value="base"]')).toContainText('59');
  });
}
