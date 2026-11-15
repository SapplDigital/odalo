import { test, expect } from '@playwright/test';
import { projects } from '../src/content/projects';

// M10-a: work index and 404 after the port to Ale's design idiom.
const langs = ['es', 'en', 'de'] as const;

for (const l of langs) {
  test.describe(`work index (${l})`, () => {
    test('hook order, one h1, one card per project, no PageHero', async ({ page, request }) => {
      await page.goto(`/${l}/work/`);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('[data-work-intro] h1')).toHaveCount(1);
      const order = await page.evaluate(() => {
        const els = ['[data-work-intro]', '[data-work-list]', '[data-work-closing]'].map((s) => document.querySelector(s));
        if (els.some((e) => !e)) return false;
        return els.every((e, i) => i === 0 || !!(els[i - 1]!.compareDocumentPosition(e!) & Node.DOCUMENT_POSITION_FOLLOWING));
      });
      expect(order).toBe(true);
      const cards = page.locator('[data-work-list] > li');
      await expect(cards).toHaveCount(projects.length);
      const hrefs = await page.locator('[data-work-list] > li a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(hrefs).toHaveLength(projects.length);
      for (const p of projects) expect(hrefs).toContain(`/${l}/work/${p.id}/`);
      for (const h of hrefs) expect((await request.get(h!)).status()).toBe(200);
      expect(await page.locator('.ph, .page-hero, [data-page-hero]').count()).toBe(0);
    });

    for (const [w, h] of [[390, 844], [1440, 900]] as const) {
      test(`no horizontal overflow at ${w}px`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await page.goto(`/${l}/work/`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over).toBeLessThanOrEqual(0);
      });
    }

    if (l !== 'es') {
      test('no Spanish copy', async ({ page }) => {
        await page.goto(`/${l}/work/`);
        const text = await page.locator('[data-work-intro], [data-work-list]').allInnerTexts();
        expect(text.join(' ')).not.toMatch(/Proyectos ilustrativos|Ver todos|Muestra|Ejemplo/);
      });
    }
  });
}

test.describe('work index without JS', () => {
  test.use({ javaScriptEnabled: false });
  for (const l of langs) {
    test(`${l}: content visible`, async ({ page }) => {
      await page.goto(`/${l}/work/`);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-work-list] > li').first()).toBeVisible();
    });
  }
});

for (const l of langs) {
  for (const pr of projects) {
    test.describe(`project page ${pr.id} (${l})`, () => {
      test('structure, one h1, links, no mosaic markup', async ({ page, request }) => {
        await page.goto(`/${l}/work/${pr.id}/`);
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('h1')).toHaveText(pr.title[l]);
        const sels = ['[data-project-intro]', '[data-project-media]', '[data-project-body]', '[data-project-shots]', '[data-project-creatives]', '[data-project-plan]', '[data-project-next]', '[data-project-closing]'];
        const present = await page.evaluate((ss) => ss.map((s) => !!document.querySelector(s)), sels);
        for (const i of [0, 1, 2, 6, 7]) expect(present[i], sels[i]).toBe(true);
        const found = sels.filter((_, i) => present[i]);
        const order = await page.evaluate((ss) => {
          const els = ss.map((s) => document.querySelector(s)!);
          return els.every((e, i) => i === 0 || !!(els[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING));
        }, found);
        expect(order).toBe(true);
        expect(await page.locator('.ph, .page-hero, [data-page-hero], .cs__block').count()).toBe(0);
        const svc = await page.locator('[data-project-body] a[href*="/services/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
        expect(svc.length).toBeGreaterThan(0);
        for (const h of svc) expect(h.startsWith(`/${l}/services/`)).toBe(true);
        await expect(page.locator(`[data-project-intro] a[href="/${l}/work/"]`)).toHaveCount(1);
        const next = await page.locator('[data-project-next] a').getAttribute('href');
        expect(next).toMatch(new RegExp(`^/${l}/work/[a-z0-9-]+/$`));
        expect((await request.get(next!)).status()).toBe(200);
      });
      for (const [w, h] of [[390, 844], [1440, 900]] as const) {
        test(`no horizontal overflow at ${w}px`, async ({ page }) => {
          await page.setViewportSize({ width: w, height: h });
          await page.goto(`/${l}/work/${pr.id}/`);
          const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(over).toBeLessThanOrEqual(0);
        });
      }
    });
  }
}

test.describe('404 page', () => {
  test('one h1, three language links with hreflang, noindex', async ({ page }) => {
    await page.goto('/this-page-does-not-exist/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('[data-nf-intro] h1')).toHaveCount(1);
    for (const l of langs) await expect(page.locator(`[data-nf-intro] a[hreflang="${l}"]`)).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
  for (const [w, h] of [[390, 844], [1440, 900]] as const) {
    test(`no horizontal overflow at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/this-page-does-not-exist/');
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over).toBeLessThanOrEqual(0);
    });
  }
});
