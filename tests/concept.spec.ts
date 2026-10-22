import { test, expect } from '@playwright/test';
import { projects, projectById } from '../src/content/projects';

const hotel = projectById('sample-hotel')!;
const shown = hotel.images!.filter((i) => i.role !== 'card-narrow'); // pictures rendered as <img> on the case study
const langs = ['en', 'es', 'de'] as const;

test.describe('sample-hotel concept images and wording', () => {
  test('the project record keeps its id, sample flag and service associations, and carries a complete image record', () => {
    expect(hotel.sample).toBe(true);
    expect(hotel.concept).toBe(true);
    expect(hotel.services).toEqual(['web', 'local', 'video']);
    expect(hotel.images!.length).toBe(4);
    expect(hotel.images!.map((i) => i.role).sort()).toEqual(['card', 'card-narrow', 'screen', 'screen']);
    for (const img of hotel.images!) {
      expect(img.width).toBeGreaterThan(0); expect(img.height).toBeGreaterThan(0);
      expect(Math.max(...img.widths)).toBe(img.width);
      expect(img.screenshotLang).toBe('en');
      for (const l of langs) { expect(img.alt[l].length).toBeGreaterThan(40); expect(img.caption[l].length).toBeGreaterThan(20); expect(img.provenance[l].length).toBeGreaterThan(20); }
      expect(new Set(langs.map((l) => img.alt[l])).size).toBe(3);
    }
    // other projects keep their generic artwork
  });

  for (const lang of langs) {
    test(`${lang}: home and work index show the concept picture with reserved size and a visible concept label; the other cards carry their own concept labels`, async ({ page }) => {
      for (const url of [`/${lang}/`, `/${lang}/work/`]) {
        await page.goto(url);
        const card = page.locator('.proj').first();
        const img = card.locator('img');
        await expect(img).toHaveCount(1);
        await expect(img).toHaveAttribute('width', '1440');
        await expect(img).toHaveAttribute('height', '900');
        expect(await img.getAttribute('srcset')).toMatch(/640w.*1024w.*1440w/);
        expect(await img.getAttribute('alt')).toBe(hotel.images![0].alt[lang]);
        await expect(card.locator('.proj__badge')).toHaveText(hotel.badge![lang]);
        await expect(card.locator('.proj__title a')).toHaveAttribute('href', new RegExp(`/${lang}/work/sample-hotel/$`));
        const others = page.locator('.proj').nth(2); // sample-shop has its own concept pictures (see concept-shop.spec.ts)
        await expect(others.locator('img')).toHaveCount(1);
        await expect(others.locator('.proj__badge')).not.toHaveText(hotel.badge![lang]);
      }
    });

    test(`${lang}: the case study is labelled as a fictional concept, shows three screens with captions and language, and claims no outcomes`, async ({ page }) => {
      await page.goto(`/${lang}/work/sample-hotel/`);
      const imgs = page.locator('main img');
      await expect(imgs).toHaveCount(3);
      const title = await page.title();
      expect(title).toContain(hotel.badge![lang]);
      expect(title).not.toMatch(/relaunch|relanzamiento|Relaunch eines/i);
      const text = await page.locator('main').innerText();
      expect(text).not.toMatch(/relaunch|relanzamiento|Relaunch eines|testimonial|conversion|bookings (rose|grew|increased)/i);
      // accurate status: self-initiated, a local prototype exists, no client, no launch, no data; no empty Results block
      const statusRe = lang === 'en' ? /Self-initiated.*local responsive prototype.*not a client commission.*no client or performance data/s : lang === 'es' ? /por iniciativa propia.*prototipo local.*No es un encargo de cliente.*no hay datos de cliente ni de rendimiento/s : /Eigeninitiative.*lokaler, responsiver Prototyp.*weder ein Kundenauftrag.*keine Kunden- oder Leistungsdaten/s;
      expect(text).toMatch(statusRe);
      expect(text).not.toMatch(/never built|never been built|nunca se construy|nie gebaut|was never/i);
      await expect(page.locator('.cs__block--coral')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: /^(Results|Resultados|Ergebnisse)$/ })).toHaveCount(0);
      expect(text.split(/Self-initiated|por iniciativa propia|Eigeninitiative/i).length - 1).toBe(1); // one concise status note
      for (const [i, img] of shown.entries()) {
        await expect(imgs.nth(i)).toHaveAttribute('alt', img.alt[lang]);
        await expect(imgs.nth(i)).toHaveAttribute('width', String(img.width));
        await expect(imgs.nth(i)).toHaveAttribute('height', String(img.height));
      }
      await expect(page.locator('figcaption').filter({ hasText: lang === 'en' ? 'Screenshot language: English' : lang === 'es' ? 'Idioma de la captura: Inglés' : 'Sprache des Screenshots: Englisch' })).toHaveCount(3);
      for (const sid of hotel.services) await expect(page.locator(`.cs__svc a[href$="/services/${sid}/"]`)).toHaveCount(1);
      await expect(page.locator('.shots__src')).toContainText(hotel.images![0].provenance[lang]);
    });
  }

  for (const vw of [1440, 390]) test(`image boxes are reserved before the pictures load (images blocked) at ${vw}px: home card, work index card, case study`, async ({ browser }) => {
    const sizes: Record<string, number[]> = {};
    for (const mode of ['loaded', 'blocked']) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
      await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
      if (mode === 'blocked') await ctx.route('**/*.webp', (r) => r.abort());
      const page = await ctx.newPage();
      for (const url of ['/en/', '/en/work/', '/en/work/sample-hotel/']) {
        await page.goto(url, { waitUntil: mode === 'loaded' ? 'networkidle' : 'domcontentloaded' });
        const imgs = page.locator(url === '/en/work/sample-hotel/' ? 'main img' : '.proj img');
        const n = await imgs.count();
        for (let i = 0; i < n; i++) { const b = (await imgs.nth(i).boundingBox())!; (sizes[`${url}#${i}`] ??= []).push(Math.round(b.width), Math.round(b.height)); }
      }
      await ctx.close();
    }
    for (const [k, v] of Object.entries(sizes)) { expect(v[0], k).toBeGreaterThan(0); expect(v[1], k).toBeGreaterThan(0); expect(v.slice(0, 2), `${k} same box before and after loading`).toEqual(v.slice(2, 4)); }
  });

  test('the pictures actually load (all widths used) and the old generic hotel artwork is gone from the hotel card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/en/work/sample-hotel/');
    for (const i of [0, 1, 2]) { const el = page.locator('main img').nth(i); await el.scrollIntoViewIfNeeded(); await expect.poll(async () => el.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true); }
    await page.goto('/en/work/');
    await expect(page.locator('.proj').first().locator('svg.art')).toHaveCount(0);
  });

  test('narrow cards use the purpose-made phone crop in its own shape; wider cards keep the desktop picture', async ({ page }) => {
    const narrowRec = hotel.images!.find((i) => i.role === 'card-narrow')!;
    for (const [vw, expectFile] of [[320, 'hotel-card-narrow'], [390, 'hotel-card-narrow'], [834, 'hotel-desktop'], [1440, 'hotel-desktop']] as const) {
      await page.setViewportSize({ width: vw, height: 900 });
      for (const url of ['/en/', '/en/work/']) {
        await page.goto(url);
        const img = page.locator('.proj').first().locator('img');
        await img.scrollIntoViewIfNeeded();
        await expect.poll(async () => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
        const m = await img.evaluate((e: HTMLImageElement) => ({ src: e.currentSrc, nw: e.naturalWidth, nh: e.naturalHeight, bw: e.getBoundingClientRect().width, bh: e.getBoundingClientRect().height }));
        expect(m.src, `${url} at ${vw}`).toContain(expectFile);
        if (vw < 768) {
          // not a stretched desktop picture: the box has the phone crop's shape and the file is not distorted
          expect(Math.abs(m.bw / m.bh - narrowRec.width / narrowRec.height)).toBeLessThan(0.03);
          expect(Math.abs(m.nw / m.nh - narrowRec.width / narrowRec.height)).toBeLessThan(0.02);
        }
      }
    }
  });
});

