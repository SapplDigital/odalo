import { test, expect, type Page } from '@playwright/test';
import { projects } from '../src/content/projects';
import { tr } from '../src/i18n/ui';

const langs = ['en', 'es', 'de'] as const;
const heading = { en: 'Concept work.', es: 'Proyectos conceptuales.', de: 'Konzeptarbeiten.' };
const names = ['Casa Almina', 'Tidewell', 'Brindle Pantry'];

/** The homepage field docks once when it arrives (a short transform); measure geometry only after it has. */
const docked = async (page: Page) => { await page.locator('#work .grid').scrollIntoViewIfNeeded(); await page.waitForFunction(() => (document.querySelector('[data-work-field]') as HTMLElement | null)?.dataset.cards !== 'pending'); await page.waitForTimeout(800); };

const geo = (page: Page, sel: string) =>
  page.evaluate((sel) => {
    const g = document.querySelector(sel)!;
    const gr = g.getBoundingClientRect();
    const items = [...g.querySelectorAll<HTMLElement>(':scope > .proj, :scope > .explain')].map((e) => { const b = e.getBoundingClientRect(), c = getComputedStyle(e); return { l: b.left, r: b.right, t: b.top, b: b.bottom, radii: [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].map(parseFloat), cls: e.className }; });
    return { grid: { l: gr.left, r: gr.right, t: gr.top, b: gr.bottom }, items };
  }, sel);

test.describe('portfolio: content', () => {
  test('cards use the short editable names; full titles stay on the records; IDs, badges and services are kept', () => {
    expect(projects.map((p) => p.id)).toEqual(['sample-hotel', 'sample-clinic', 'sample-shop']);
    projects.forEach((p, i) => { for (const l of langs) { expect(p.cardTitle![l]).toBe(names[i]); expect(p.title[l].length).toBeGreaterThan(p.cardTitle![l].length); expect(p.badge![l].length).toBeGreaterThan(8); } expect(p.sample).toBe(true); });
  });
  for (const l of langs) {
    test(`${l}: heading, context panel and view-all link are the new copy; cards keep concept badges, services and working links`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${l}/`);
      await expect(page.locator('#work-h')).toHaveText(heading[l]);
      await expect(page.locator('#work .wj-note p')).toHaveText(tr(l).work.explainer); // homepage: the context sentence now sits in the connected header, once
      await expect(page.locator('#work .explain')).toHaveCount(0);
      expect(tr(l).work.explainer).not.toMatch(/sample|ejemplo|Beispiel/i);
      await expect(page.locator('#work .wj-note a')).toHaveAttribute('href', `/${l}/work/`);
      for (const [i, p] of projects.entries()) {
        const card = page.locator('#work .proj').nth(i);
        await expect(card.locator('.proj__badge')).toHaveText(p.badge![l]);
        await expect(card.locator('.proj__title a')).toContainText(names[i]!);
        await expect(card.locator('.proj__title a .sr-only')).toContainText(p.title[l]); // the full title is still the accessible name
        await expect(card.locator('.proj__title a')).toHaveAttribute('href', `/${l}/work/${p.id}/`);
        expect(await card.locator('.proj__svc li').count()).toBe(p.services.length);
      }
      await page.goto(`/${l}/work/`);
      await expect(page.locator('h1')).toHaveText(heading[l]);
    });
  }
});

test.describe('portfolio: one connected composition', () => {
  for (const l of langs) for (const [vw, sel, url] of [[1440, '#work .grid', ''], [1440, '#projects .grid', 'work/'], [1024, '#work .grid', ''], [834, '#work .grid', ''], [390, '#work .grid', ''], [320, '#work .grid', '']] as const) {
    test(`${l} ${vw}px ${url || 'home'}: no gutters, flat inner edges, curved outer corners only, no holes`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: 900 });
      await page.goto(`/${l}/${url}`);
      if (url === '') await docked(page);
      const { grid, items } = await geo(page, sel);
      const home = url === '';
      expect(items).toHaveLength(home ? 3 : 4); // homepage: three projects (the context panel moved into the connected header); work index keeps four
      // the union of the cards exactly tiles the grid: sum of areas equals the grid area (no overlaps, no holes)
      const area = items.reduce((a, i) => a + (i.r - i.l) * (i.b - i.t), 0);
      expect(Math.abs(area - (grid.r - grid.l) * (grid.b - grid.t)), `${vw}: uncovered or overlapping area`).toBeLessThan(40);
      // internal corners are square: only the grid's corners may be rounded
      for (const it of items) {
        const corners = [[it.l, it.t], [it.r, it.t], [it.r, it.b], [it.l, it.b]];
        corners.forEach(([x, y], k) => { const outer = (Math.abs(x! - grid.l) < 1 || Math.abs(x! - grid.r) < 1) && (Math.abs(y! - grid.t) < 1 || Math.abs(y! - grid.b) < 1); if (!outer) expect(it.radii[k], `${vw}: inner corner ${k} of ${it.cls} is rounded`).toBe(0); });
      }
      // outer silhouette: large top left and bottom right
      const tl = items.find((i) => Math.abs(i.l - grid.l) < 1 && Math.abs(i.t - grid.t) < 1)!, br = items.find((i) => Math.abs(i.r - grid.r) < 1 && Math.abs(i.b - grid.b) < 1)!;
      expect(br.radii[2]).toBeGreaterThan(40);
      // homepage: the field's large top-left curve belongs to the Services board above; the Work grid continues it with a square corner
      if (home) expect(tl.radii[0]).toBe(0); else expect(tl.radii[0]).toBeGreaterThan(40);
    });
  }

  test('wide desktop (homepage): hotel left, clinic over shop right, joined; the hotel has no large empty navy area; the work index keeps its four-piece layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const l of ['en', 'de', 'es']) {
      await page.goto(`/${l}/`); // de is the longest layout
      await docked(page);
      const { grid, items } = await geo(page, '#work .grid');
      const [hotel, clinic, shop] = items as [typeof items[0], typeof items[0], typeof items[0]];
      expect(items).toHaveLength(3);
      expect(Math.abs(hotel.r - clinic.l), l).toBeLessThan(1); expect(Math.abs(clinic.b - shop.t), l).toBeLessThan(1); expect(Math.abs(clinic.l - shop.l), l).toBeLessThan(1);
      expect(Math.abs(hotel.t - grid.t)).toBeLessThan(1); expect(Math.abs(shop.b - grid.b)).toBeLessThan(1); expect(Math.abs(shop.r - grid.r)).toBeLessThan(1);
      const empty = await page.evaluate(() => { const h = document.querySelector('#work .proj--feat')!; const kids = [...h.querySelectorAll<HTMLElement>('.proj__body > *')]; const last = Math.max(...kids.map((k) => k.getBoundingClientRect().bottom)); return h.getBoundingClientRect().bottom - last; });
      expect(empty, `${l}: blank space under the hotel text: ${Math.round(empty)}px`).toBeLessThan(90);
    }
    await page.goto('/de/work/');
    const w = await geo(page, '#projects .grid');
    expect(w.items).toHaveLength(4);
  });

  test('related-work variant keeps two projects side by side on desktop and stacked on phones, joined', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/services/video/');
    const a = await geo(page, '#related-work .grid');
    expect(a.items).toHaveLength(2);
    expect(Math.abs(a.items[0]!.r - a.items[1]!.l)).toBeLessThan(1);
    await page.setViewportSize({ width: 390, height: 844 });
    const b = await geo(page, '#related-work .grid');
    expect(Math.abs(b.items[0]!.b - b.items[1]!.t)).toBeLessThan(1);
    expect(b.items[0]!.t).toBeLessThan(b.items[1]!.t);
  });
});

test.describe('portfolio: pictures', () => {
  for (const [vw, clinicFile, shopFile] of [[1440, 'clinic-ad-portrait', 'shop-poster'], [1024, 'clinic-card-wide', 'shop-card-wide'], [834, 'clinic-card-wide', 'shop-card-wide'], [390, 'clinic-card-wide', 'shop-card-wide']] as const) {
    test(`${vw}px: the right source per layout, undistorted and fully loaded; reserved space with images blocked`, async ({ page, browser }) => {
      await page.setViewportSize({ width: vw, height: 900 });
      await page.goto('/en/', { waitUntil: 'networkidle' });
      await page.evaluate(async () => { const w = document.querySelector('#work')!; for (let y = 0; y <= w.getBoundingClientRect().height; y += 300) { scrollTo(0, w.getBoundingClientRect().top + scrollY + y - 100); await new Promise((r) => setTimeout(r, 120)); } });
      await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>('#work .proj img')].every((i) => i.complete && i.naturalWidth > 0));
      const r = await page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>('#work .proj img')].map((i) => { const b = i.getBoundingClientRect(); return { src: i.currentSrc, ok: i.complete && i.naturalWidth > 0, nw: i.naturalWidth, nh: i.naturalHeight, w: b.width, h: b.height, fit: getComputedStyle(i).objectFit }; }));
      expect(r[1]!.src).toContain(clinicFile); expect(r[2]!.src).toContain(shopFile);
      for (const i of r) { expect(i.ok).toBe(true); expect(i.fit).toBe('cover'); expect(i.w).toBeGreaterThan(150); expect(i.h).toBeGreaterThan(100); }
      // cover with a box taller or wider than the picture: never scaled non-uniformly (object-fit does not stretch); the box shape stays within 2:1 of the picture
      for (const i of r) expect(Math.max((i.w / i.h) / (i.nw / i.nh), (i.nw / i.nh) / (i.w / i.h))).toBeLessThan(2);
      const sizes = async (block: boolean) => { const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } }); if (block) await ctx.route(/\.webp$/, (x) => x.abort()); const p = await ctx.newPage(); await p.goto('/en/', { waitUntil: block ? 'domcontentloaded' : 'networkidle' }); const s = await p.evaluate(() => [...document.querySelectorAll<HTMLElement>('#work .proj__art')].map((e) => [Math.round(e.getBoundingClientRect().width), Math.round(e.getBoundingClientRect().height)])); await ctx.close(); return s; };
      expect(await sizes(true)).toEqual(await sizes(false));
    });
  }

  test('keyboard focus is visible on every card, including at the outer edges (homepage: a ring around the whole card, drawn inside it)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    for (const i of [0, 1, 2]) {
      const a = page.locator('#work .proj__title a').nth(i);
      await a.focus();
      const o = await a.evaluate((e) => { const cardEl = e.closest('.proj')!; const cs = getComputedStyle(cardEl); const card = cardEl.getBoundingClientRect(); const r = e.getBoundingClientRect(); return { style: cs.outlineStyle, offset: parseFloat(cs.outlineOffset), width: parseFloat(cs.outlineWidth), insideX: r.left >= card.left && r.right <= card.right }; });
      expect(o.style).not.toBe('none'); expect(o.width).toBeGreaterThanOrEqual(3); expect(o.offset).toBeLessThan(0);
    }
  });
});
