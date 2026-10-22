import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { projectById } from '../src/content/projects';

const clinic = projectById('sample-clinic')!;
const hotel = projectById('sample-hotel')!;
const langs = ['en', 'es', 'de'] as const;
const statusRe = {
  en: /Self-initiated work for a fictional practice.*local prototype and two creative designs.*no real client launch.*no client or performance data/s,
  es: /Trabajo por iniciativa propia para una consulta ficticia.*prototipo local y dos diseños creativos.*No hubo lanzamiento con un cliente real.*no hay datos de cliente ni de rendimiento/s,
  de: /Eigeninitiative für eine fiktive Praxis.*lokaler Prototyp und zwei Kreativentwürfe.*keinen echten Kundenstart.*keine Kunden- oder Leistungsdaten/s,
};

test.describe('sample-clinic local campaign concept', () => {
  test('record: stable id, sample flag, services; complete trilingual image records; files exist; hotel wording untouched', () => {
    expect(clinic.sample).toBe(true);
    expect(clinic.concept).toBe(true);
    expect(clinic.services).toEqual(['local', 'ads']);
    expect(clinic.images!.map((i) => i.role).sort()).toEqual(['card', 'card-tall', 'creative', 'creative', 'screen', 'screen']);
    for (const img of clinic.images!) {
      expect(Math.max(...img.widths)).toBe(img.width);
      expect(img.screenshotLang).toBe('en');
      for (const l of langs) { expect(img.alt[l].length).toBeGreaterThan(60); expect(img.caption[l].length).toBeGreaterThan(15); expect(img.provenance[l].length).toBeGreaterThan(40); }
      expect(new Set(langs.map((l) => img.alt[l])).size).toBe(3);
      for (const w of img.widths) expect(fs.existsSync(`public/work/concepts/${img.folder}/${img.file}-${w}.webp`), `${img.file}-${w}`).toBe(true);
    }
    const tall = clinic.images!.find((i) => i.role === 'card-tall')!;
    expect(tall.media).toBe('(min-width: 80em)');
    expect([tall.width, tall.height]).toEqual([1080, 1350]);
    expect(clinic.images!.filter((i) => i.role === 'creative').map((i) => [i.width, i.height])).toEqual([[1080, 1080], [1080, 1350]]);
    expect(clinic.plan!.en).toHaveLength(4);
    // the status note is project-specific: the clinic's differs from the hotel's, and neither mentions the other
    for (const l of langs) { expect(clinic.status![l]).not.toBe(hotel.status![l]); expect(clinic.status![l]).not.toMatch(/hotel/i); expect(hotel.status![l]).not.toMatch(/practice|consulta|Praxis/i); }
    expect(hotel.status!.en).toBe('Self-initiated design for a fictional hotel, built as a local responsive prototype. It is not a client commission or a hotel launch, and there is no client or performance data.');
  });

  for (const lang of langs) {
    test(`${lang}: cards show the clinic pictures with the right source per layout, a visible concept label and live text`, async ({ page }) => {
      for (const [vw, file] of [[1440, 'clinic-ad-portrait'], [834, 'clinic-card-wide'], [390, 'clinic-card-wide'], [320, 'clinic-card-wide']] as const) {
        await page.setViewportSize({ width: vw, height: 900 });
        for (const url of [`/${lang}/`, `/${lang}/work/`]) {
          await page.goto(url);
          const card = page.locator('.proj').nth(1);
          await card.scrollIntoViewIfNeeded();
          const img = card.locator('img');
          await expect(img).toHaveCount(1);
          await expect(img).toHaveAttribute('alt', clinic.images![0].alt[lang]);
          await expect.poll(async () => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
          const m = await img.evaluate((e: HTMLImageElement) => ({ src: e.currentSrc, nw: e.naturalWidth, nh: e.naturalHeight, w: e.getAttribute('width'), h: e.getAttribute('height') }));
          expect(m.src, `${url} at ${vw}`).toContain(file);
          expect([m.w, m.h]).toEqual(['1280', '801']); // default picture's intrinsic size reserves the box
          await expect(card.locator('.proj__badge')).toHaveText(clinic.badge![lang]);
          await expect(card.locator('.proj__title a')).toContainText((clinic.cardTitle ?? clinic.title)[lang]);
          await expect(card.locator('.proj__title a')).toHaveAttribute('href', new RegExp(`/${lang}/work/sample-clinic/$`));
          // pictures are shown in their own shape, not distorted
          const box = (await img.boundingBox())!;
          if (vw >= 1440) expect(Math.abs(m.nw / m.nh - 1080 / 1350)).toBeLessThan(0.02); else expect(Math.abs(m.nw / m.nh - 1280 / 801)).toBeLessThan(0.02);
          void box;
          const shop = page.locator('.proj').nth(2);
          await expect(shop.locator('img')).toHaveCount(1); // the shop has its own concept picture (concept-shop.spec.ts)
        }
      }
    });

    test(`${lang}: the case study has a project-specific status, no results panel, produced and proposed work kept apart, screens, creatives and the plan`, async ({ page }) => {
      await page.goto(`/${lang}/work/sample-clinic/`);
      const text = await page.locator('main').innerText();
      expect(text).toMatch(statusRe[lang]);
      expect(text.split(/Self-initiated work|Trabajo por iniciativa propia|Eigeninitiative/).length - 1).toBe(1);
      expect(await page.locator('.ph').innerText()).not.toMatch(/hotel/i);
      expect(await page.title()).toContain(clinic.badge![lang]);
      await expect(page.locator('.cs__block--coral')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: /^(Results|Resultados|Ergebnisse)$/ })).toHaveCount(0);
      expect(text).not.toMatch(/never built|nunca se construy|nie gebaut/i);
      expect(text).not.toMatch(/testimonial|guarantee|garant[ií]a|Garantie|five-star|cured|curamos|Dr\.|MSc/i);
      const imgs = page.locator('main img');
      await expect(imgs).toHaveCount(5); // lead + 2 screens + 2 creatives
      const shown = clinic.images!.filter((i) => i.role !== 'card-tall');
      for (const [i, img] of shown.entries()) {
        await expect(imgs.nth(i)).toHaveAttribute('alt', img.alt[lang]);
        await expect(imgs.nth(i)).toHaveAttribute('width', String(img.width));
        await expect(imgs.nth(i)).toHaveAttribute('height', String(img.height));
      }
      await expect(page.locator('figcaption').filter({ hasText: lang === 'en' ? 'Screenshot language: English' : lang === 'es' ? 'Idioma de la captura: Inglés' : 'Sprache des Screenshots: Englisch' })).toHaveCount(5);
      await expect(page.locator('.plan__list li')).toHaveCount(4);
      await expect(page.locator('.cs__block--paper')).toContainText(lang === 'en' ? 'Produced here' : lang === 'es' ? 'Producido aquí' : 'Hier erstellt');
      await expect(page.locator('.cs__block--paper')).toContainText(lang === 'en' ? 'Proposed only, not produced' : lang === 'es' ? 'Solo propuestos, no producidos' : 'Nur vorgeschlagen, nicht erstellt');
      for (const sid of clinic.services) await expect(page.locator(`.cs__svc a[href$="/services/${sid}/"]`)).toHaveCount(1);
      await expect(page.locator('.cs__svc a')).toHaveCount(2);
    });
  }

  test('the hotel case study still carries the hotel status and no creatives or plan sections', async ({ page }) => {
    await page.goto('/en/work/sample-hotel/');
    await expect(page.locator('.ph')).toContainText('Self-initiated design for a fictional hotel');
    await expect(page.locator('.creatives, .plan')).toHaveCount(0);
  });

  for (const vw of [1440, 390]) test(`image boxes are reserved before the pictures load (images blocked) at ${vw}px: home, work index, service pages, case study`, async ({ browser }) => {
    const sizes: Record<string, number[]> = {};
    for (const mode of ['loaded', 'blocked']) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
      await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
      if (mode === 'blocked') await ctx.route('**/*.webp', (r) => r.abort());
      const page = await ctx.newPage();
      for (const url of ['/en/', '/en/work/', '/en/services/local/', '/en/services/ads/', '/en/work/sample-clinic/']) {
        await page.goto(url, { waitUntil: mode === 'loaded' ? 'networkidle' : 'domcontentloaded' });
        const imgs = page.locator(url.includes('sample-clinic') ? 'main img' : '.proj img');
        const n = await imgs.count();
        for (let i = 0; i < n; i++) { const b = (await imgs.nth(i).boundingBox())!; (sizes[`${url}#${i}`] ??= []).push(Math.round(b.width), Math.round(b.height)); }
      }
      await ctx.close();
    }
    expect(Object.keys(sizes).length).toBeGreaterThan(8);
    for (const [k, v] of Object.entries(sizes)) { expect(v[0], k).toBeGreaterThan(0); expect(v[1], k).toBeGreaterThan(0); expect(v.slice(0, 2), `${k} same box before and after loading`).toEqual(v.slice(2, 4)); }
  });

  test('related-project placements: service pages show the clinic picture; the hotel case study links to the clinic by its new title only via the related link', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const [url, idx] of [['/en/services/local/', 0], ['/en/services/ads/', 1]] as const) {
      await page.goto(url);
      const card = page.locator('#related-work .proj').nth(idx);
      await card.scrollIntoViewIfNeeded();
      await expect(card.locator('.proj__title a')).toContainText(clinic.cardTitle!.en);
      const img = card.locator('img');
      await expect.poll(async () => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
      expect(await img.evaluate((e: HTMLImageElement) => e.currentSrc)).toContain('clinic-card-wide'); // 2-up layouts use the 16:10 picture
    }
    await page.goto('/en/work/sample-hotel/');
    await expect(page.locator('.next__link')).toHaveAttribute('href', /\/en\/work\/sample-clinic\/$/);
  });
});
