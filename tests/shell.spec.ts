// Shell (header + mobile bottom pill) of the Ale-design port, ES/EN/DE at 390 and 1440 px.
import { test, expect } from '@playwright/test';
import { tr } from '../src/i18n/ui';

const langs = ['es', 'en', 'de'] as const;

for (const lang of langs) {
  const t = tr(lang);

  test.describe(`shell ${lang} desktop 1440`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('floating glass pill: logo, nav, language switch and CTA on /lang/ routes', async ({ page }) => {
      await page.goto(`/${lang}/plans/`);
      expect(await page.locator('html').getAttribute('lang')).toBe(lang);
      await expect(page.locator('header[data-header]')).toHaveCount(1); // other <header>s are section heads inside <main>, not landmarks
      const pill = page.locator('header .hdr__pill');
      await expect(pill).toBeVisible();
      const box = (await pill.boundingBox())!;
      expect(box.width).toBeLessThanOrEqual(1100);
      expect(box.y).toBeLessThanOrEqual(20);
      await expect(page.locator('header .hdr__logo')).toHaveAttribute('href', `/${lang}/`);
      const nav = page.locator('header nav .hdr__links a');
      await expect(nav).toHaveText([t.nav.services, t.nav.plans, t.nav.process, t.nav.about]);
      await expect(page.locator('header .hdr__links a[href$="/plans/"]')).toHaveAttribute('href', `/${lang}/plans/`); // scoped: the language links also end in /plans/
      await expect(page.locator('header .hdr__links a[href$="/about/"]')).toHaveAttribute('href', `/${lang}/about/`);
      await expect(page.locator('header .lang')).toBeVisible();
      const cta = page.locator('header .hdr__cta');
      await expect(cta).toBeVisible();
      await expect(cta).toHaveText(t.nav.audit);
      await expect(cta).toHaveAttribute('href', `/${lang}/audit/`);
      await expect(page.locator('.dock')).toBeHidden();
    });

    test('active link has aria-current=page', async ({ page }) => {
      await page.goto(`/${lang}/plans/`);
      const cur = page.locator('header .hdr__links a[aria-current="page"]');
      await expect(cur).toHaveCount(1);
      await expect(cur).toHaveText(t.nav.plans);
    });

    test('no horizontal overflow', async ({ page }) => {
      for (const p of ['', 'plans/', 'about/']) {
        await page.goto(`/${lang}/${p}`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      }
    });
  });

  test.describe(`shell ${lang} mobile 390`, () => {
    test.use({ viewport: { width: 390, height: 800 } });

    test('top bar (logo + language) and fixed bottom pill (Menu, Plans, CTA)', async ({ page }) => {
      await page.goto(`/${lang}/plans/`);
      expect(await page.locator('html').getAttribute('lang')).toBe(lang);
      await expect(page.locator('header[data-header]')).toHaveCount(1); // other <header>s are section heads inside <main>, not landmarks
      await expect(page.locator('header .hdr__logo')).toBeVisible();
      await expect(page.locator('header .lang')).toBeVisible();
      await expect(page.locator('header .hdr__nav')).toBeHidden();
      await expect(page.locator('header .hdr__cta')).toBeHidden();
      const pill = page.locator('.dock__pill');
      await expect(pill).toBeVisible();
      expect(await page.locator('.dock').evaluate((e) => getComputedStyle(e).position)).toBe('fixed');
      await expect(pill.locator('.hdr__toggle')).toBeVisible();
      await expect(pill.locator('.dock__plans')).toHaveText(t.nav.plans);
      await expect(pill.locator('.dock__plans')).toHaveAttribute('href', `/${lang}/plans/`);
      await expect(pill.locator('.dock__plans')).toHaveAttribute('aria-current', 'page');
      await expect(pill.locator('.dock__cta')).toHaveText(t.nav.audit);
      await expect(pill.locator('.dock__cta')).toHaveAttribute('href', `/${lang}/audit/`);
      const b = (await pill.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(390);
    });

    test('menu: aria-expanded toggles by keyboard, links on /lang/, Esc closes and refocuses', async ({ page }) => {
      await page.goto(`/${lang}/plans/`);
      const btn = page.locator('.hdr__toggle');
      const sheet = page.locator('#site-nav');
      await expect(btn).toHaveAttribute('aria-expanded', 'false');
      await expect(sheet).toBeHidden();
      await btn.focus();
      await page.keyboard.press('Enter');
      await expect(btn).toHaveAttribute('aria-expanded', 'true');
      await expect(btn).toHaveAttribute('aria-label', t.a11y.closeMenu);
      await expect(sheet).toBeVisible();
      await expect(sheet.locator('a')).toHaveText([t.nav.services, t.nav.plans, t.nav.process, t.nav.about]);
      await expect(sheet.locator('a[aria-current="page"]')).toHaveText(t.nav.plans);
      await page.keyboard.press('Escape');
      await expect(btn).toHaveAttribute('aria-expanded', 'false');
      await expect(btn).toHaveAttribute('aria-label', t.a11y.openMenu);
      await expect(sheet).toBeHidden();
      await expect(btn).toBeFocused();
    });

    test('no horizontal overflow, menu open or closed', async ({ page }) => {
      for (const p of ['', 'plans/', 'about/']) {
        await page.goto(`/${lang}/${p}`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      }
      await page.locator('.hdr__toggle').click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  });
}
