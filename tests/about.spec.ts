import { test, expect } from '@playwright/test';
import { tr } from '../src/i18n/ui';
import { services } from '../src/content/services';

const langs = ['en', 'es', 'de'] as const;
const banned = /remote|remoto|Remote|international|internacional|time zones|zonas horarias|Zeitzonen|portrait|retrato|Porträt|photograph|fotograf|Foto|placeholder|Platzhalter|team|equipo|Team\b|fluen|reporting|informes regulares|Berichte|guarantee|garant/i;
const hooks = ['[data-about-hero]', '[data-about-services]', '[data-about-principles]', '[data-about-studio]', '[data-about-closing]'];

test.describe('about: Ale studio idiom structure', () => {
  for (const l of langs) {
    const t = tr(l);

    test(`${l}: five sections in order, one h1, h2 section headings, title and description`, async ({ page }) => {
      await page.goto(`/${l}/about/`);
      expect(await page.title()).toBe(t.meta.about.title);
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBe(t.meta.about.description);
      const order = await page.evaluate((sel) => {
        const els = sel.map((s) => document.querySelector(s));
        if (els.some((e) => !e)) return null;
        return els.every((e, i) => i === 0 || !!(els[i - 1]!.compareDocumentPosition(e!) & Node.DOCUMENT_POSITION_FOLLOWING));
      }, hooks);
      expect(order, 'hooks present and in document order').toBe(true);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator('[data-about-hero] h1')).toHaveText(`${t.about.h2.a} ${t.about.h2.em}`);
      for (const h of hooks.slice(1)) await expect(page.locator(`${h} h2`)).toHaveCount(1);
      await expect(page.locator('[data-about-hero] h2')).toHaveCount(0);
      // old mosaic, sand principles block and FinalCta are gone
      await expect(page.locator('.mosaic, .story, .pr__list, #fin-h')).toHaveCount(0);
      const outline = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3')].map((h) => Number(h.tagName[1])));
      expect(outline[0]).toBe(1);
      for (let i = 1; i < outline.length; i++) expect(outline[i]! - outline[i - 1]!, `heading jump ${outline.join('')}`).toBeLessThanOrEqual(1);
    });

    test(`${l}: services grid lists the four services from data, same-language links; principles match i18n`, async ({ page }) => {
      await page.goto(`/${l}/about/`);
      await expect(page.locator('[data-about-services] h2')).toHaveText(t.about.servicesH);
      const links = page.locator('[data-about-services] a');
      await expect(links).toHaveCount(services.length);
      for (const [i, s] of services.entries()) {
        await expect(links.nth(i)).toHaveText(s.name[l]);
        await expect(links.nth(i)).toHaveAttribute('href', `/${l}/services/${s.id}/`);
      }
      await expect(page.locator('#pr-h')).toHaveText(t.about.principles);
      const items = page.locator('[data-about-principle]');
      await expect(items).toHaveCount(t.about.principlesItems.length);
      for (const [i, p] of t.about.principlesItems.entries()) {
        await expect(items.nth(i).locator('h3')).toHaveText(p.t);
        await expect(items.nth(i).locator('p')).toHaveText(p.d);
      }
      await expect(page.locator('[data-about-studio] h2')).toHaveText(t.about.languagesH);
      await expect(page.locator('[data-about-studio]')).toContainText(t.about.languagesBody);
      const own = await page.locator('[data-about-hero], [data-about-services], [data-about-principles], [data-about-studio]').allInnerTexts();
      expect(own.join('\n')).not.toMatch(banned);
    });

    test(`${l}: audit links and internal links stay in ${l}`, async ({ page }) => {
      await page.goto(`/${l}/about/`);
      const audit = page.locator('[data-about-hero] a[href*="audit"], [data-about-closing] a[href*="audit"]');
      await expect(audit).toHaveCount(2);
      for (const a of await audit.all()) expect((await a.getAttribute('href'))!.split('?')[0]).toBe(`/${l}/audit/`);
      const hrefs = await page.locator('main a[href^="/"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')!));
      for (const h of hrefs) {
        if (/^\/(es|en|de)\/about\/$/.test(h)) continue; // language switch links
        expect(h.startsWith(`/${l}/`), h).toBe(true);
      }
    });

    for (const vw of [390, 1440]) {
      test(`${l} ${vw}px: no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width: vw, height: 900 });
        await page.goto(`/${l}/about/`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const cols = await page.evaluate(() => getComputedStyle(document.querySelector('[data-about-services] ul')!).gridTemplateColumns.split(' ').length);
        expect(cols).toBe(vw >= 1024 ? 4 : 1);
      });
    }

    test(`${l}: content visible with JS disabled and with reduced motion`, async ({ browser }) => {
      for (const opts of [{ javaScriptEnabled: false }, { reducedMotion: 'reduce' as const }]) {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
        const page = await ctx.newPage();
        await page.goto(`/${l}/about/`);
        await expect(page.locator('main h1')).toBeVisible();
        for (const h of hooks) await expect(page.locator(h)).toBeVisible();
        await expect(page.locator('[data-about-service]')).toHaveCount(services.length);
        for (const el of await page.locator('[data-about-principle]').all()) await expect(el).toBeVisible();
        await ctx.close();
      }
    });
  }

  test('home: the homepage no longer carries the About section (it lives on /about/)', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('#about')).toHaveCount(0);
    await expect(page.locator('[data-about-hero]')).toHaveCount(0);
  });
});

test.describe('about: behaviour', () => {
  test('keyboard: links are reachable in reading order with a visible ring; language links switch pages and remember the choice', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/about/');
    const order = await page.locator('main a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(order.slice(0, 6)).toEqual(['/en/audit/', '/en/services/web/', '/en/services/local/', '/en/services/video/', '/en/services/ads/', '/es/about/']);
    expect(order).toContain('/de/about/');
    const first = page.locator('main a').first();
    await first.focus();
    expect(await first.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
    await page.locator('[data-about-studio] a[hreflang="de"]').click();
    await expect(page).toHaveURL(/\/de\/about\/$/);
    expect(await page.evaluate(() => localStorage.getItem('odalo.lang'))).toBe('de');
  });

  test('the decorative visual is hidden from assistive technology and carries no text', async ({ page }) => {
    await page.goto('/en/about/');
    const art = page.locator('[data-about-hero] [data-illustrative]');
    await expect(art).toHaveAttribute('aria-hidden', 'true');
    expect((await art.innerText()).trim()).toBe('');
    await expect(art.locator('a, button, [tabindex]')).toHaveCount(0);
  });
});

// retired: the old connected mosaic tiles and 200% root-font panel checks that Ale's design replaces
test.describe.skip('retired: mosaic replaced by Ale design', () => {
  test('about mosaic tiles and enlarged-text panels', () => {});
});
