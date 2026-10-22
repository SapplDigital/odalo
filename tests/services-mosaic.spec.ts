import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { services, serviceVisual } from '../src/content/services';

const langs = ['en', 'es', 'de'] as const;
const ids = ['web', 'local', 'video', 'ads'] as const;
const intro = {
  en: 'Websites, local visibility, video and advertising, planned together.',
  es: 'Web, visibilidad local, vídeo y publicidad, planificados en conjunto.',
  de: 'Website, lokale Sichtbarkeit, Video und Werbung – gemeinsam geplant.',
};
const expectFile = { web: 'hotel-desktop', local: 'services-local-info', video: 'services-video-strip', ads: 'clinic-ad-square' } as const;

const tilePos = (page: Page) =>
  page.evaluate(() => Object.fromEntries([...document.querySelectorAll<HTMLElement>('.tile')].map((t) => {
    const top = (s: string) => t.querySelector(s)!.getBoundingClientRect().top;
    return [t.dataset.service!, { title: top('.tile__title'), text: top('.tile__text'), actions: top('.tile__actions'), cap: top('.tile__cap'), img: top('.tile__img') }];
  })));

test.describe('services mosaic imagery: content', () => {
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

  for (const l of langs) {
    test(`${l}: the intro is the new sentence and the interaction instruction is gone`, async ({ page }) => {
      await page.goto(`/${l}/`);
      await expect(page.locator('.svc__intro')).toHaveText(intro[l]);
      await expect(page.locator('#services')).not.toContainText(/Hover|Pasa el cursor|Fahre mit der Maus/);
    });
  }
});

test.describe('services mosaic imagery: tiles', () => {
  for (const l of langs) {
    test(`${l}: every tile shows its concept picture, a visible concept label and live text; no video is requested`, async ({ page }) => {
      const media: string[] = [];
      page.on('request', (r) => { if (/\.(webm|mp4)(\?|$)/.test(r.url())) media.push(r.url()); });
      await page.setViewportSize({ width: 1440, height: 3200 });
      await page.goto(`/${l}/`, { waitUntil: 'networkidle' });
      for (const s of services) {
        const tile = page.locator(`.tile[data-service="${s.id}"]`);
        const v = serviceVisual(s);
        const img = tile.locator('.tile__img img');
        await img.scrollIntoViewIfNeeded();
        await expect.poll(async () => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
        expect(await img.evaluate((e: HTMLImageElement) => e.currentSrc)).toContain(expectFile[s.id]);
        await expect(img).toHaveAttribute('alt', v.image.alt[l]);
        await expect(img).toHaveAttribute('width', String(v.image.width));
        await expect(img).toHaveAttribute('height', String(v.image.height));
        await expect(tile.locator('.tile__cap')).toContainText(v.badge[l]);
        await expect(tile.locator('.tile__cap')).toContainText(v.label[l]);
        await expect(tile.locator('.tile__title')).toHaveText(s.name[l]);
        await expect(tile.locator('.tile__text')).toHaveText(s.outcome[l]);
        await expect(tile.locator('[data-explore]')).toBeVisible();
        await expect(tile.locator('.tile__link')).toHaveAttribute('href', `/${l}/services/${s.id}/`);
        expect(await tile.locator('svg').count(), 'no generic glyph').toBe(0);
        // never stretched: the picture is fitted into its box, not squeezed
        expect(await img.evaluate((e) => getComputedStyle(e).objectFit)).toBe(s.id === 'ads' ? 'contain' : 'cover');
      }
      expect(media, 'no video file is fetched by the service tiles').toEqual([]);
      expect(await page.locator('#services video').count()).toBe(0);
    });
  }

  for (const [vw, row] of [[1440, 'top'], [1440, 'bot'], [1024, 'top'], [1024, 'bot'], [834, 'top'], [834, 'bot']] as const) {
    test(`titles, descriptions and action groups line up across neighbouring tiles at rest, ${row} row, ${vw}px (en/es/de)`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: 3200 });
      for (const l of langs) {
        await page.goto(`/${l}/`);
        const p = await tilePos(page);
        const [a, b] = row === 'top' ? ['web', 'local'] : ['video', 'ads'];
        for (const k of ['img', 'cap', 'title', 'text', 'actions'] as const) expect(Math.abs(p[a]![k] - p[b]![k]), `${l} ${vw} ${row} ${k}`).toBeLessThan(1.5);
      }
    });
  }

  for (const vw of [1440, 1024, 834]) {
    test(`${vw}px: no content is clipped and the picture stays usable in any active state; hover never moves later sections (en/es/de)`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: 3200 });
      for (const l of langs) {
        await page.goto(`/${l}/`);
        const m0 = await page.evaluate(() => ({ h: document.querySelector('[data-mosaic]')!.getBoundingClientRect().height, doc: document.documentElement.scrollHeight, next: document.querySelector('#work')!.getBoundingClientRect().top + scrollY }));
        for (const id of ids) {
          const b = (await page.locator(`.tile[data-service="${id}"]`).boundingBox())!;
          await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
          await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', id);
          await page.waitForTimeout(650);
          const res = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.tile')].map((t) => {
            const tb = t.getBoundingClientRect();
            const clipped = [...t.querySelectorAll<HTMLElement>('.tile__title,.tile__text,.tile__actions,.tile__cap,.tile__explore,.tile__link')].some((k) => { const r = k.getBoundingClientRect(); return r.bottom > tb.bottom - 4 || r.right > tb.right + 1 || r.left < tb.left - 1; });
            const i = t.querySelector('.tile__img')!.getBoundingClientRect();
            return { id: t.dataset.service, clipped, imgH: i.height, imgW: i.width };
          }));
          for (const r of res) { expect(r.clipped, `${l} ${vw} ${id}: ${r.id} clipped`).toBe(false); expect(r.imgH, `${l} ${vw} ${id}: ${r.id} picture height`).toBeGreaterThan(90); expect(r.imgW).toBeGreaterThan(150); }
          const m1 = await page.evaluate(() => ({ h: document.querySelector('[data-mosaic]')!.getBoundingClientRect().height, doc: document.documentElement.scrollHeight, next: document.querySelector('#work')!.getBoundingClientRect().top + scrollY }));
          expect(m1).toEqual(m0);
          await page.mouse.move(5, 5);
          await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', '');
        }
      }
    });
  }

  test('a stationary pointer near the moving edge does not make the active tile flicker; rapid crossing settles on one tile', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 3200 });
    await page.goto('/en/');
    const box = (await page.locator('[data-mosaic]').boundingBox())!;
    const y = box.y + box.height * 0.22;
    await page.mouse.move(box.x + box.width * 0.3, y, { steps: 4 });
    await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', 'web');
    await page.waitForTimeout(600);
    // Zones come from the RESTING edge (7/12), with a tolerance band around it. Parked inside the band: the tile stays. Parked at the
    // moving edge (8.5/12), which is outside the band: it may change once to the tile that owns that zone, then must stay put (no oscillation).
    const run = async (x: number) => {
      await page.mouse.move(x, y, { steps: 3 });
      const seq: string[] = [];
      for (let i = 0; i < 25; i++) { await page.waitForTimeout(60); const a = (await page.locator('[data-mosaic]').getAttribute('data-active')) ?? ''; if (seq[seq.length - 1] !== a) seq.push(a); }
      return seq;
    };
    expect(await run(box.x + box.width * (7 / 12) - 10)).toEqual(['web']);
    expect((await run(box.x + box.width * (8.5 / 12) - 6)).length, 'at most one change at the moving edge').toBeLessThanOrEqual(2);
    const settled = await page.locator('[data-mosaic]').getAttribute('data-active');
    await page.waitForTimeout(800);
    expect(await page.locator('[data-mosaic]').getAttribute('data-active')).toBe(settled);
    // rapid zig-zag across all four tiles: ends on the tile under the pointer, no stuck state
    const pts = [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8], [0.8, 0.2], [0.2, 0.8]];
    for (const [fx, fy] of pts) await page.mouse.move(box.x + box.width * fx!, box.y + box.height * fy!, { steps: 2 });
    await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', 'video');
  });

  test('Explore, Escape and focus still work on the picture tiles; full service links stay independent', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/en/');
    const btn = page.locator('[data-explore="video"]');
    await btn.focus();
    await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', 'video');
    expect(await btn.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-detail-for="video"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#svc-detail')).toBeHidden();
    await expect(btn).toBeFocused();
    await page.locator('.tile[data-service="local"] .tile__link').click();
    await expect(page).toHaveURL(/\/en\/services\/local\/$/);
  });
});

test.describe('services mosaic imagery: phones, motion, no-JS, blocked images', () => {
  for (const vw of [390, 320]) {
    test(`${vw}px: one connected column in reading order, pictures sized to their shape, no sideways scroll, essential text visible`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: 844 });
      for (const l of langs) {
        await page.goto(`/${l}/`);
        const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: innerWidth, order: [...document.querySelectorAll('.tile')].map((t) => (t as HTMLElement).dataset.service), tiles: [...document.querySelectorAll<HTMLElement>('.tile')].map((t) => { const b = t.getBoundingClientRect(); const i = t.querySelector('.tile__img')!.getBoundingClientRect(); return { w: b.width, top: b.top, iw: i.width, ih: i.height }; }) }));
        expect(r.sw).toBeLessThanOrEqual(r.vw);
        expect(r.order).toEqual([...ids]);
        for (let i = 1; i < r.tiles.length; i++) expect(r.tiles[i]!.top).toBeGreaterThan(r.tiles[i - 1]!.top);
        for (const t of r.tiles) { expect(t.w).toBeGreaterThan(vw - 60); expect(t.ih).toBeGreaterThan(110); expect(t.ih / t.iw).toBeLessThan(0.85); }
        for (const id of ids) { await expect(page.locator(`.tile[data-service="${id}"] .tile__title`)).toBeVisible(); await expect(page.locator(`.tile[data-service="${id}"] .tile__link`)).toBeVisible(); }
      }
    });
  }

  test('reduced motion: the picture and edge transitions are off, every action still works', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1700 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/en/');
    expect(parseFloat(await page.locator('.row--top').evaluate((e) => getComputedStyle(e).transitionDuration))).toBeLessThan(0.05);
    expect(parseFloat(await page.locator('.tile__img img').first().evaluate((e) => getComputedStyle(e).transitionDuration.split(',')[0]!))).toBeLessThan(0.05);
    await page.locator('[data-explore="ads"]').click();
    await expect(page.locator('[data-detail-for="ads"]')).toBeVisible();
    await ctx.close();
  });

  test('without JavaScript the pictures, labels, text and full-service links are all present', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1700 } });
    const page = await ctx.newPage();
    await page.goto('/de/');
    for (const id of ids) {
      const tile = page.locator(`.tile[data-service="${id}"]`);
      await expect(tile.locator('.tile__img img')).toBeVisible();
      await expect(tile.locator('.tile__cap')).toBeVisible();
      await expect(tile.locator('.tile__link')).toBeVisible();
      await expect(tile.locator('.tile__link')).toHaveAttribute('href', `/de/services/${id}/`);
    }
    await expect(page.locator('[data-explore]').first()).toBeHidden();
    await ctx.close();
  });

  for (const vw of [1440, 834, 390]) {
    test(`${vw}px: picture boxes are reserved with images blocked (no layout shift when they load)`, async ({ browser }) => {
      const sizes = async (block: boolean) => {
        const ctx = await browser.newContext({ viewport: { width: vw, height: 2600 } });
        if (block) await ctx.route(/\.webp$/, (r) => r.abort());
        const page = await ctx.newPage();
        await page.goto('/en/', { waitUntil: block ? 'domcontentloaded' : 'networkidle' });
        const r = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.tile__img')].map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; }));
        await ctx.close();
        return r;
      };
      const loaded = await sizes(false), blocked = await sizes(true);
      expect(blocked).toEqual(loaded);
      for (const [w, h] of loaded) { expect(w).toBeGreaterThan(100); expect(h).toBeGreaterThan(90); }
    });
  }
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
      expect(await page.locator('.ph svg.art, .ph .art').count()).toBe(0);
      expect(media).toEqual([]);
      await page.locator('.ph a[data-track="audit_cta"]').click();
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
