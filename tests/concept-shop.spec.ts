import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { projectById } from '../src/content/projects';

const shop = projectById('sample-shop')!;
const clinic = projectById('sample-clinic')!;
const hotel = projectById('sample-hotel')!;
const langs = ['en', 'es', 'de'] as const;
const statusRe = {
  en: /Self-initiated work for a fictional shop.*product illustrations, a 10-second silent motion piece and a square creative.*no real client launch.*no client or performance data/s,
  es: /Trabajo por iniciativa propia para una tienda ficticia.*ilustraciones de producto, una pieza de movimiento de 10 segundos sin sonido y una creatividad cuadrada.*No hubo lanzamiento con un cliente real.*no hay datos de cliente ni de rendimiento/s,
  de: /Eigeninitiative für einen fiktiven Laden.*Produktillustrationen, ein zehnsekündiges Bewegtbild ohne Ton und ein quadratischer Entwurf.*keinen echten Kundenstart.*keine Kunden- oder Leistungsdaten/s,
};

test.describe('sample-shop content-and-motion campaign concept', () => {
  test('record: stable id, sample flag, services; trilingual records; files on disk; video specs; other projects unchanged', () => {
    expect(shop.sample).toBe(true);
    expect(shop.concept).toBe(true);
    expect(shop.services).toEqual(['video', 'ads']);
    expect(shop.images!.map((i) => i.role).sort()).toEqual(['card', 'card-tall', 'creative', 'screen']);
    for (const img of shop.images!) {
      expect(Math.max(...img.widths)).toBe(img.width);
      for (const l of ['en', 'es', 'de'] as const) { expect(img.alt[l].length).toBeGreaterThan(60); expect(img.caption[l].length).toBeGreaterThan(15); expect(img.provenance[l]).toMatch(/IA|AI|KI/); }
      expect(new Set(langs.map((l) => img.alt[l])).size).toBe(3);
      for (const w of img.widths) expect(fs.existsSync(`public/work/concepts/${img.folder}/${img.file}-${w}.webp`), `${img.file}-${w}`).toBe(true);
    }
    const v = shop.videos![0];
    expect([v.width, v.height, v.seconds]).toEqual([1080, 1920, 10]);
    for (const f of v.formats) { const st = fs.statSync(`public/work/concepts/${v.folder}/${v.file}.${f.ext}`); expect(st.size).toBe(f.bytes); expect(st.size).toBeLessThan(2_000_000); }
    for (const l of langs) { expect(v.label[l].length).toBeGreaterThan(200); expect(shop.status![l]).not.toBe(clinic.status![l]); expect(shop.status![l]).not.toMatch(/hotel|practice|consulta|Praxis/i); }
    expect(shop.plan!.en).toHaveLength(4);
    // the other concepts keep their own wording and pictures
    expect(hotel.status!.en).toContain('fictional hotel');
    expect(clinic.status!.en).toContain('fictional practice');
    expect(clinic.images!.length).toBe(6);
  });

  for (const lang of langs) {
    test(`${lang}: cards use the wide card (portrait still only in the 3-column desktop slot), keep a concept badge and live text, and are not stretched`, async ({ page }) => {
      for (const [vw, file] of [[1440, 'shop-poster'], [834, 'shop-card-wide'], [390, 'shop-card-wide'], [320, 'shop-card-wide']] as const) {
        await page.setViewportSize({ width: vw, height: 900 });
        for (const url of [`/${lang}/`, `/${lang}/work/`]) {
          await page.goto(url);
          const card = page.locator('.proj').nth(2);
          await card.scrollIntoViewIfNeeded();
          const img = card.locator('img');
          await expect(img).toHaveCount(1);
          await expect(img).toHaveAttribute('alt', shop.images![0].alt[lang]);
          await expect.poll(async () => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
          const m = await img.evaluate((e: HTMLImageElement) => ({ src: e.currentSrc, nw: e.naturalWidth, nh: e.naturalHeight, w: e.getAttribute('width'), h: e.getAttribute('height') }));
          expect(m.src, `${url} at ${vw}`).toContain(file);
          expect([m.w, m.h]).toEqual(['1280', '800']);
          if (vw >= 1440) expect(Math.abs(m.nw / m.nh - 720 / 1280)).toBeLessThan(0.02); else expect(Math.abs(m.nw / m.nh - 1.6)).toBeLessThan(0.02);
          await expect(card.locator('.proj__badge')).toHaveText(shop.badge![lang]);
          await expect(card.locator('.proj__title a')).toContainText((shop.cardTitle ?? shop.title)[lang]);
          await expect(card.locator('.proj__title a')).toHaveAttribute('href', new RegExp(`/${lang}/work/sample-shop/$`));
          // a vertical motion piece must not make the card taller than its neighbours: the art box follows the card, not the other way round
          const [cardH, clinicH] = await Promise.all([card.boundingBox().then((b) => b!.height), page.locator('.proj').nth(1).boundingBox().then((b) => b!.height)]);
          if (vw >= 1440) expect(cardH, `${url} at ${vw}: shop card height ${cardH} vs clinic ${clinicH}`).toBeLessThan(clinicH + 140);
        }
      }
    });

    test(`${lang}: the case study has a project-specific status, no results panel, produced and proposed work apart, outputs, a user-triggered silent video and the plan`, async ({ page }) => {
      await page.goto(`/${lang}/work/sample-shop/`);
      const text = await page.locator('main').innerText();
      expect(text).toMatch(statusRe[lang]);
      expect(text.split(/Self-initiated work|Trabajo por iniciativa propia|Eigeninitiative/).length - 1).toBe(1);
      expect(await page.locator('.ph').innerText()).not.toMatch(/hotel|practice|consulta|Praxis/i);
      expect(await page.title()).toContain(shop.badge![lang]);
      await expect(page.locator('.cs__block--coral')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: /^(Results|Resultados|Ergebnisse)$/ })).toHaveCount(0);
      expect(text).not.toMatch(/never built|nunca se construy|nie gebaut|testimonial|guarantee|garant[ií]a|Garantie|award|organic|ecol[óo]gic|bio\b|sourced|locally/i);
      await expect(page.locator('.cs__block--paper')).toContainText(lang === 'en' ? 'Proposed only, not produced' : lang === 'es' ? 'Solo propuestos, no producidos' : 'Nur vorgeschlagen, nicht erstellt');
      await expect(page.locator('.plan__list li')).toHaveCount(4);
      await expect(page.locator('main img')).toHaveCount(3); // lead + sheet + square creative (the video is a <video>)
      // video: native controls, poster, reserved size, no autoplay, nothing downloaded up front
      const video = page.locator('video');
      await expect(video).toHaveCount(1);
      await expect(video).toHaveAttribute('controls', '');
      await expect(video).toHaveAttribute('preload', 'none');
      await expect(video).toHaveAttribute('width', '1080');
      await expect(video).toHaveAttribute('height', '1920');
      await expect(video).toHaveAttribute('poster', /shop-poster-720\.webp$/);
      await expect(video).not.toHaveAttribute('autoplay', /.*/);
      await expect(video).toHaveAttribute('aria-label', shop.videos![0].label[lang]);
      expect(await video.locator('source').count()).toBe(2);
      await expect(page.locator('.shot--video figcaption')).toContainText(lang === 'en' ? 'Silent: there is no audio' : lang === 'es' ? 'Sin sonido' : 'Ohne Ton');
      for (const sid of shop.services) await expect(page.locator(`.cs__svc a[href$="/services/${sid}/"]`)).toHaveCount(1);
    });
  }

  test('video requests: none for the video files on load; playing is user-triggered, works with the keyboard, reaches the end, and a reduced-motion visitor sees a still', async ({ browser }) => {
    for (const reduced of [false, true]) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
      const page = await ctx.newPage();
      const requested: string[] = [];
      page.on('request', (r) => { if (/\.(webm|mp4)(\?|$)/.test(r.url())) requested.push(r.url()); });
      await page.goto('/en/work/sample-shop/', { waitUntil: 'networkidle' });
      const video = page.locator('video');
      await video.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      expect(requested, 'no video bytes before the visitor presses play').toEqual([]);
      expect(await video.evaluate((v: HTMLVideoElement) => ({ paused: v.paused, ready: v.readyState, autoplay: v.autoplay }))).toEqual({ paused: true, ready: 0, autoplay: false });
      const box = (await video.boundingBox())!;
      expect(Math.abs(box.width / box.height - 9 / 16)).toBeLessThan(0.01); // reserved shape before any media loads
      await video.focus();
      await expect(video).toBeFocused();
      expect(await video.evaluate((v) => getComputedStyle(v).outlineStyle)).not.toBe('none');
      if (!reduced) {
        await page.keyboard.press('Space'); // native controls: Space plays when the video is focused
        await expect.poll(async () => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 8000 }).toBeGreaterThan(0.3);
        const info = await video.evaluate((v: HTMLVideoElement) => ({ d: v.duration, w: v.videoWidth, h: v.videoHeight, src: v.currentSrc }));
        expect(Math.round(info.d)).toBe(10);
        expect([info.w, info.h]).toEqual([1080, 1920]);
        expect(requested.length).toBeGreaterThan(0);
        await video.evaluate((v: HTMLVideoElement) => { v.currentTime = 9.5; });
        await expect.poll(async () => video.evaluate((v: HTMLVideoElement) => v.ended), { timeout: 8000 }).toBe(true);
        await page.keyboard.press('Space');
        await video.evaluate((v: HTMLVideoElement) => v.pause());
      }
      await ctx.close();
    }
  });

  test('image boxes are reserved before media loads (images and video blocked) at 1440 and 390 px; service pages show the shop picture', async ({ browser }) => {
    for (const vw of [1440, 390]) {
      const sizes: Record<string, number[]> = {};
      for (const mode of ['loaded', 'blocked']) {
        const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
        await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
        if (mode === 'blocked') await ctx.route(/\.(webp|webm|mp4)$/, (r) => r.abort());
        const page = await ctx.newPage();
        for (const url of ['/en/', '/en/work/', '/en/services/video/', '/en/services/ads/', '/en/work/sample-shop/']) {
          await page.goto(url, { waitUntil: mode === 'loaded' ? 'networkidle' : 'domcontentloaded' });
          const media = page.locator(url.includes('sample-shop') ? 'main img, main video' : '.proj img');
          const n = await media.count();
          for (let i = 0; i < n; i++) { const b = (await media.nth(i).boundingBox())!; (sizes[`${url}#${i}`] ??= []).push(Math.round(b.width), Math.round(b.height)); }
        }
        await ctx.close();
      }
      expect(Object.keys(sizes).length).toBeGreaterThan(10);
      for (const [k, v] of Object.entries(sizes)) { expect(v[0], `${vw} ${k}`).toBeGreaterThan(0); expect(v.slice(0, 2), `${vw} ${k} same box before and after`).toEqual(v.slice(2, 4)); }
    }
  });

  test('related placements: video and advertising service pages show the shop card with its picture and live title', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const [url, idx] of [['/en/services/video/', 0], ['/en/services/ads/', 0]] as const) {
      await page.goto(url);
      const card = page.locator('#related-work .proj').nth(idx);
      await card.scrollIntoViewIfNeeded();
      await expect(card.locator('.proj__title a')).toContainText(shop.cardTitle!.en);
      const img = card.locator('img');
      await expect.poll(async () => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
      expect(await img.evaluate((e: HTMLImageElement) => e.currentSrc)).toContain('shop-card-wide');
    }
    await page.goto('/en/work/sample-hotel/');
    await expect(page.locator('.next__link')).toHaveAttribute('href', /sample-clinic/);
    await page.goto('/en/work/sample-clinic/');
    await expect(page.locator('.next__link')).toHaveAttribute('href', /sample-shop/);
    await expect(page.locator('.next__link')).toHaveText(shop.title.en);
  });
});
