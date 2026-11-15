import { test, expect } from '@playwright/test';

const langs = ['es', 'en', 'de'] as const;
// Later tasks append their hook here (plans, kit, projects, studio, contact), in Ale's order.
const SECTIONS = ['data-home-hero', 'data-home-services', 'data-home-plans', 'data-home-kit', 'data-home-projects', 'data-home-studio', 'data-home-contact'];

for (const lang of langs) {
  test.describe(`home /${lang}/`, () => {
    test('sections exist in order, one h1', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const order = await page.evaluate((hooks) => hooks.map((h) => {
        const el = document.querySelector(`[${h}]`);
        return el ? el.getBoundingClientRect().top + scrollY : -1;
      }), SECTIONS);
      expect(order.every((y) => y >= 0)).toBe(true);
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test('service links stay in the same language', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const hrefs = await page.locator('[data-home-services] a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(hrefs.length).toBeGreaterThanOrEqual(4);
      for (const h of hrefs) expect(h).toMatch(new RegExp(`/${lang}/services/[a-z]+/?$`));
      const res = await page.request.get(hrefs[0]!);
      expect(res.ok()).toBe(true);
    });

    test('plans teaser: five cells, formatted prices, links to plans', async ({ page }) => {
      await page.goto(`/${lang}/`);
      await expect(page.locator('[data-home-plans] [data-plan-cell]')).toHaveCount(5);
      const hrefs = await page.locator('[data-home-plans] a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(hrefs.length).toBe(6);
      for (const h of hrefs) expect(h).toMatch(new RegExp(`/${lang}/plans/?$`));
      const res = await page.request.get(hrefs[0]!);
      expect(res.status()).toBe(200);
      const price = async (id: string) => (await page.locator(`[data-plan-price="${id}"]`).innerText()).trim();
      for (const id of ['base', 'local', 'captacion', 'build']) expect(await price(id)).toMatch(/\d/);
      expect(await price('360')).not.toMatch(/\d/);
      await expect(page.locator('[data-plan-cell="captacion"]')).toHaveAttribute('data-featured', 'true');
    });

    test('kit QR: one audit link, three uses, no h1', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const kit = page.locator('#kit[data-home-kit]');
      await expect(kit.locator('a')).toHaveCount(1);
      await expect(kit.locator('a')).toHaveAttribute('href', `/${lang}/audit/`);
      await expect(kit.locator('[data-kit-use]')).toHaveCount(3);
      await expect(kit.locator('h1')).toHaveCount(0);
      await expect(kit.locator('h2')).toHaveCount(1);
    });

    test('projects: cards link to same-language work routes', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const sec = page.locator('[data-home-projects]');
      await expect(sec.locator('h2')).toHaveCount(1);
      await expect(sec.locator('h1')).toHaveCount(0);
      const cards = sec.locator('[data-project-card]');
      expect(await cards.count()).toBeGreaterThanOrEqual(1);
      const hrefs = await sec.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(hrefs).toContain(`/${lang}/work/`);
      for (const h of hrefs) expect(h).toMatch(new RegExp(`^/${lang}/work/([a-z-]+/)?$`));
      const caseHref = hrefs.find((h) => h !== `/${lang}/work/`)!;
      expect((await page.request.get(caseHref)).status()).toBe(200);
      expect((await page.request.get(`/${lang}/work/`)).status()).toBe(200);
    });

    test('studio: one h2, no h1, at least four sectors', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const sec = page.locator('#estudio[data-home-studio]');
      await expect(sec.locator('h2')).toHaveCount(1);
      await expect(sec.locator('h1')).toHaveCount(0);
      expect(await sec.locator('[data-studio-sector]').count()).toBeGreaterThanOrEqual(4);
    });

    test('contact: one h2, no h1, audit link and mailto', async ({ page }) => {
      await page.goto(`/${lang}/`);
      const sec = page.locator('#contacto[data-home-contact]');
      await expect(sec.locator('h2')).toHaveCount(1);
      await expect(sec.locator('h1')).toHaveCount(0);
      await expect(sec.locator(`a[href="/${lang}/audit/"]`)).toHaveCount(1);
      expect(await sec.locator('a[href^="mailto:"]').count()).toBeGreaterThanOrEqual(1);
    });

    if (lang !== 'es') {
      test('studio and contact have no Spanish copy', async ({ page }) => {
        await page.goto(`/${lang}/`);
        const text = (await page.locator('[data-home-studio]').innerText()) + (await page.locator('[data-home-contact]').innerText());
        for (const w of ['Restaurantes', 'Peluquerías', 'Escríbenos', 'Ubicación', 'auditoría', 'Estudio', 'Contacto negocios']) expect(text).not.toContain(w);
      });
      test('projects has no Spanish copy', async ({ page }) => {
        await page.goto(`/${lang}/`);
        const text = await page.locator('[data-home-projects]').innerText();
        expect(text).not.toContain('Ver todos los proyectos');
        expect(text).not.toContain('Ejemplos de');
        expect(text).not.toContain('Proyectos');
      });
      test('kit QR has no Spanish copy', async ({ page }) => {
        await page.goto(`/${lang}/`);
        const text = await page.locator('#kit').innerText();
        expect(text).not.toContain('Pedir mi kit');
        expect(text).not.toContain('Consultar');
        expect(text).not.toContain('Reseñas');
      });
    }

    for (const width of [390, 1440]) {
      test(`no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/${lang}/`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over).toBeLessThanOrEqual(0);
      });
    }

    test('hero is visible and static under reduced motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${lang}/`);
      await expect(page.locator('[data-home-hero]')).toBeVisible();
      await expect(page.locator('[data-home-hero] svg.stones')).toHaveCount(1);
      const anim = await page.locator('[data-home-hero] svg.stones path').first().evaluate((el) => getComputedStyle(el).animationName);
      expect(anim).toBe('none');
    });
  });
}
