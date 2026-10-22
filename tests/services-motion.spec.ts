import { test, expect, type Page } from '@playwright/test';
import { assembleServices } from './helpers/services';
import { services } from '../src/content/services';

const langs = ['en', 'es', 'de'] as const;
const ids = ['web', 'local', 'video', 'ads'] as const;

/** transform of each tile as [rotationDeg, dx, dy] ('none' -> [0,0,0]) and the mosaic state */
const pose = (page: Page) =>
  page.evaluate(() => ({
    assembling: document.querySelector('[data-mosaic]')!.classList.contains('is-assembling'),
    seams: document.querySelectorAll('[data-mosaic] .seam').length,
    tiles: Object.fromEntries([...document.querySelectorAll<HTMLElement>('.tile')].map((t) => {
      const m = getComputedStyle(t).transform;
      if (m === 'none') return [t.dataset.service!, [0, 0, 0]];
      const [a, b, , , e, f] = m.slice(7, -1).split(',').map(Number) as number[];
      return [t.dataset.service!, [Math.atan2(b!, a!) * 180 / Math.PI, e!, f!]];
    })),
  }));
const mosaicTop = (page: Page) => page.evaluate(() => document.querySelector('[data-mosaic]')!.getBoundingClientRect().top + scrollY);
const scrollPage = async (page: Page, y: number) => { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.max(0, y)); await page.waitForTimeout(160); };
const moved = (p: { tiles: Record<string, number[]> }, id: string) => Math.hypot(p.tiles[id]![1]!, p.tiles[id]![2]!) + Math.abs(p.tiles[id]![0]!);

test.describe('services assembly: content first, then travel', () => {
  for (const [vw, vh] of [[1440, 900], [834, 1112], [390, 844]] as const) {
    test(`${vw}px: every name, outcome, concept label, Explore button and link is visible, opaque and inside the viewport width before any travel completes`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: vh });
      for (const lang of langs) {
        await page.goto(`/${lang}/`);
        await page.waitForTimeout(250);
        const r = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.tile')].map((t) => {
          const kids = [...t.querySelectorAll<HTMLElement>('.tile__title,.tile__text,.tile__cap,[data-explore],.tile__link,.tile__img img')];
          const words = ['.tile__title', '.tile__text', '.tile__cap'].map((q) => t.querySelector(q)!.textContent!.trim().length);
          const cs = kids.map((k) => getComputedStyle(k));
          const box = t.getBoundingClientRect();
          return { id: t.dataset.service, hidden: cs.some((c) => c.visibility !== 'visible' || c.display === 'none'), faded: cs.some((c) => parseFloat(c.opacity) < 1), beyond: box.left < -1 || box.right > innerWidth + 1, texts: words };
        }));
        for (const t of r) { expect(t.hidden, `${lang} ${vw} ${t.id} hidden`).toBe(false); expect(t.faded, `${lang} ${vw} ${t.id} faded`).toBe(false); expect(t.beyond, `${lang} ${vw} ${t.id} beyond viewport`).toBe(false); expect(Math.min(...t.texts)).toBeGreaterThan(5); }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await page.locator('[data-explore]').count()).toBe(4);
        expect(await page.locator('#services .tile__link').count()).toBe(4);
      }
    });
  }

  test('desktop: pieces below the fold start apart, dock as they scroll in, stay docked when scrolling back, and the mosaic then behaves as before', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await page.waitForTimeout(300);
    const start = await pose(page);
    expect(start.assembling).toBe(true);
    for (const id of ids) expect(moved(start, id), `${id} starts apart`).toBeGreaterThan(8);
    const top = await mosaicTop(page);
    const seen: number[] = [];
    for (const f of [0.55, 0.45, 0.35, 0.25, 0.15, 0.05, -0.05]) { await scrollPage(page, top - 900 * f - 0); const p = await pose(page); seen.push(Math.round(moved(p, 'web') * 10) / 10); }
    expect(seen.every((v, i) => !i || v <= seen[i - 1]! + 0.01), `web piece travel shrinks monotonically while scrolling down: ${seen}`).toBe(true);
    // every piece docks as it scrolls in: scroll until the bottom row is well inside the viewport
    await scrollPage(page, top + 560);
    await page.waitForFunction(() => !document.querySelector('[data-mosaic]')!.classList.contains('is-assembling'));
    const done = await pose(page);
    for (const id of ids) expect(moved(done, id), `${id} docked`).toBe(0);
    expect(done.seams, 'sparks are removed').toBe(0);
    // reverse: nothing scatters
    await scrollPage(page, 0); await scrollPage(page, top - 700);
    const back = await pose(page);
    for (const id of ids) expect(moved(back, id), `${id} stays docked on reverse`).toBe(0);
  });

  test('reverse scrolling before a piece has docked is decorative and exact; it never touches focus', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    const top = await mosaicTop(page);
    await scrollPage(page, top - 900 * 0.35);
    const a = await pose(page);
    await scrollPage(page, top - 900 * 0.1);
    await scrollPage(page, top - 900 * 0.35);
    const b = await pose(page);
    for (const id of ids) for (let i = 0; i < 3; i++) expect(b.tiles[id]![i]).toBeCloseTo(a.tiles[id]![i]!, 1);
    // focus a control in the (docked) top row, scroll away and back: it keeps focus, nothing re-scatters
    await page.locator('[data-explore="web"]').focus();
    await page.waitForTimeout(450);
    await scrollPage(page, 0); await scrollPage(page, top - 900 * 0.8);
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-explore'))).toBe('web');
    const c = await pose(page);
    expect(c.assembling).toBe(false);
    for (const id of ids) expect(moved(c, id)).toBe(0);
  });
});

test.describe('services assembly: actions never wait for the travel', () => {
  test('keyboard focus entering the section settles every piece, with an eased move and no lost focus', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await page.waitForTimeout(300);
    const before = await pose(page);
    expect(moved(before, 'ads')).toBeGreaterThan(8);
    // sample the ads tile every frame around the focus: the move must be distributed over frames, not a jump
    await page.evaluate(() => { (window as any).__s = []; const t = document.querySelector<HTMLElement>('.tile[data-service="ads"]')!; const loop = () => { const r = t.getBoundingClientRect(); (window as any).__s.push([r.left, r.top]); (window as any).__raf = requestAnimationFrame(loop); }; loop(); });
    await page.locator('[data-explore="ads"]').focus();
    await page.waitForTimeout(600);
    const samples: number[][] = await page.evaluate(() => { cancelAnimationFrame((window as any).__raf); return (window as any).__s; });
    const after = await pose(page);
    expect(after.assembling).toBe(false);
    for (const id of ids) expect(moved(after, id)).toBe(0);
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-explore'))).toBe('ads');
    await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', 'ads');
    // largest single-frame jump of the tile origin
    let maxStep = 0, total = 0;
    for (let i = 1; i < samples.length; i++) { const d = Math.hypot(samples[i]![0]! - samples[i - 1]![0]!, samples[i]![1]! - samples[i - 1]![1]!); maxStep = Math.max(maxStep, d); }
    total = Math.hypot(samples[0]![0]! - samples.at(-1)![0]!, samples[0]![1]! - samples.at(-1)![1]!);
    expect(maxStep, `largest per-frame step ${maxStep.toFixed(1)}px of ${total.toFixed(1)}px total (the grid also widens the active tile)`).toBeLessThan(Math.max(18, total * 0.5));
  });

  test('Explore on a tile that is still travelling opens its panel at once, keeps focus on the button, and Escape closes as before', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    const btn = page.locator('[data-explore="video"]');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(page.locator('[data-detail-for="video"]')).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(btn).toBeFocused();
    await page.waitForTimeout(450);
    for (const id of ids) expect(moved(await pose(page), id)).toBe(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#svc-detail')).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test('phone: tapping Explore on a tile that is still arriving opens the panel inline and settles the stack', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto('/en/');
    const btn = page.locator('[data-explore="ads"]');
    await btn.scrollIntoViewIfNeeded();
    await btn.tap();
    await expect(page.locator('[data-detail-for="ads"]')).toBeVisible();
    await page.waitForTimeout(450);
    for (const id of ids) expect(moved(await pose(page), id)).toBe(0);
    expect(await page.evaluate(() => document.querySelector('.tile[data-service="ads"]')!.nextElementSibling?.id)).toBe('svc-detail');
    await ctx.close();
  });

  test('a link to the section settles it: /#services, and a hashchange from the page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/#services');
    await page.waitForTimeout(500);
    const p = await pose(page);
    expect(p.assembling).toBe(false);
    for (const id of ids) expect(moved(p, id)).toBe(0);
    // the same from a plain load: the header link to the section
    await page.goto('/en/');
    await page.waitForTimeout(300);
    expect((await pose(page)).assembling).toBe(true);
    await page.locator('header a[href$="#services"]').first().click();
    await page.waitForTimeout(700);
    const q = await pose(page);
    expect(q.assembling).toBe(false);
    for (const id of ids) expect(moved(q, id)).toBe(0);
  });

  // ---- restored scroll -------------------------------------------------------------------------------------------------------------
  // What the browser's restoration does is NOT deterministic under load: it can restore against a layout whose stylesheets have not arrived
  // yet (a much taller, unstyled document; 4 concurrent workers reproduce it, see docs/review/performance-final/restored-scroll-correction/),
  // then correct the position a moment later. The assembly rightly docks whatever is on screen when it decides ("a tile that has docked stays
  // docked"). So the real-browser test below asserts what the app SAW, not only where the page ends up, and the below-the-fold branch is
  // covered deterministically by a second test in which the test, not the browser, places the restored position.
  const settlePictures = (page: Page) => page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter((i) => i.loading !== 'lazy' || i.getBoundingClientRect().top < innerHeight * 1.5).map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); })))); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); });
  const tileGeometry = (page: Page) => page.evaluate(() => { const m = document.querySelector<HTMLElement>('[data-mosaic]')!; const mt = m.getBoundingClientRect().top; return { vh: innerHeight, tiles: [...document.querySelectorAll<HTMLElement>('.tile')].map((t) => ({ id: t.dataset.service!, nominalTop: mt + t.offsetTop })) }; });
  /** Records every position of the mosaic the assembly script reads (it reads the root's rect for each decision) with the tiles' viewport tops at that moment. */
  const recordWhatTheAssemblySees = (page: Page) => page.addInitScript(() => {
    const w = window as unknown as { __seen: { id: string; top: number }[][]; __seeing: boolean };
    w.__seen = []; w.__seeing = true;
    const orig = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const r = orig.call(this);
      if (w.__seeing && this.matches('[data-mosaic]')) w.__seen.push([...this.querySelectorAll<HTMLElement>('.tile')].map((t) => ({ id: t.dataset.service!, top: r.top + t.offsetTop })));
      return r;
    };
  });
  const lowestReach = (page: Page) => page.evaluate(() => {
    const w = window as unknown as { __seen: { id: string; top: number }[][]; __seeing: boolean };
    w.__seeing = false;
    const min: Record<string, number> = {};
    for (const rec of w.__seen) for (const t of rec) min[t.id] = Math.min(min[t.id] ?? Infinity, t.top);
    return { min, observations: w.__seen.length };
  });

  test('after a reload that restores the scroll position (real browser restoration), a tile is docked exactly when it was on screen when the assembly looked, and the lower row can still assemble', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await recordWhatTheAssemblySees(page);
    await page.goto('/en/');
    await settlePictures(page);
    const top = await mosaicTop(page);
    const target = Math.round(top - 500); // nominally the top row is 500 px down in the window, the bottom row about 1,040 px down
    await scrollPage(page, target);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Math.round(scrollY)), { message: 'the browser restored the scroll position', timeout: 8000 }).toBeGreaterThan(target - 80);
    await settlePictures(page);
    await page.waitForTimeout(350); // the assembly's own load handler runs one frame after load
    // the transient restored position may have been far from the final one: only what the assembly itself saw counts
    const { min, observations } = await lowestReach(page);
    expect(observations, 'the assembly looked at the mosaic at least once').toBeGreaterThan(0);
    test.info().annotations.push({ type: 'lowest viewport top the assembly saw, per tile', description: JSON.stringify(min) });
    const geom = await tileGeometry(page);
    const p = await pose(page);
    // 1. at rest, the tiles in the window are docked (the position has settled by now)
    for (const t of geom.tiles.filter((t) => t.nominalTop < geom.vh * 0.9)) expect(moved(p, t.id), `${t.id} (top ${Math.round(t.nominalTop)} of ${geom.vh}) is in the window at rest, so docked`).toBe(0);
    // 2. never on screen at any moment the assembly looked => still displaced (eligible); clearly on screen => docked. The band between is not asserted.
    for (const t of geom.tiles) {
      const lowest = min[t.id]!;
      if (lowest > geom.vh) expect(moved(p, t.id), `${t.id}: never nearer than ${Math.round(lowest)} px of ${geom.vh}, so it must still be eligible to assemble`).toBeGreaterThan(5);
      if (lowest < geom.vh * 0.4) expect(moved(p, t.id), `${t.id}: was ${Math.round(lowest)} px down at some moment, so docking it was correct and it must stay docked`).toBe(0);
    }
    // 3. wherever it stands, scrolling the lower row into the window completes the assembly, and nothing scatters again
    await scrollPage(page, Math.round(top + 560));
    await page.waitForFunction(() => !document.querySelector('[data-mosaic]')!.classList.contains('is-assembling'));
    for (const id of ids) expect(moved(await pose(page), id)).toBe(0);
  });

  test('restoration that lands after the script ran and before load: the top row is docked, the lower row stays eligible, scrolling completes it, and docked tiles never scatter again', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await settlePictures(page);
    const top = await mosaicTop(page);
    const target = Math.round(top - 500);
    // deterministic stand-in for the browser's restoration: the test applies the position itself, at load, with every stylesheet applied
    await page.addInitScript((y) => { history.scrollRestoration = 'manual'; addEventListener('load', () => scrollTo({ top: y, behavior: 'instant' }), { once: true }); }, target);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(target);
    await settlePictures(page);
    const geom = await tileGeometry(page);
    const p = await pose(page);
    const inside = geom.tiles.filter((t) => t.nominalTop < geom.vh * 0.9), below = geom.tiles.filter((t) => t.nominalTop > geom.vh * 1.05);
    expect(inside.map((t) => t.id), 'the top row is in the window after restoration').toEqual(['web', 'local']);
    expect(below.map((t) => t.id), 'the bottom row is clearly below it').toEqual(['video', 'ads']);
    for (const t of inside) expect(moved(p, t.id), `${t.id} (top ${Math.round(t.nominalTop)} of ${geom.vh}) must be docked`).toBe(0);
    for (const t of below) expect(moved(p, t.id), `${t.id} (top ${Math.round(t.nominalTop)} of ${geom.vh}) must still be eligible to assemble`).toBeGreaterThan(5);
    expect(p.assembling).toBe(true);
    // the docked top row does not scatter when scrolling back up past it
    await scrollPage(page, Math.max(0, Math.round(top - 900)));
    const up = await pose(page);
    for (const t of inside) expect(moved(up, t.id), `${t.id} stays docked when scrolled back`).toBe(0);
    // scrolling the lower row into the window assembles it, as for a first visit
    await scrollPage(page, Math.round(top + 560));
    await page.waitForFunction(() => !document.querySelector('[data-mosaic]')!.classList.contains('is-assembling'));
    for (const id of ids) expect(moved(await pose(page), id)).toBe(0);
    // and a completed assembly stays complete when scrolling away and back
    await scrollPage(page, 0); await scrollPage(page, Math.round(top - 300));
    for (const id of ids) expect(moved(await pose(page), id), `${id} stays docked after completion`).toBe(0);
  });

  test('resizing mid-assembly keeps a coherent state: no sideways scroll, nothing outside the viewport, and docking still completes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    const top = await mosaicTop(page);
    await scrollPage(page, top - 900 * 0.3);
    const errors: string[] = []; page.on('pageerror', (e) => errors.push(String(e)));
    for (const [w, h] of [[1024, 768], [834, 1112], [390, 844], [1440, 900]] as const) {
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(250);
      const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth <= innerWidth, beyond: [...document.querySelectorAll<HTMLElement>('.tile')].some((t) => { const b = t.getBoundingClientRect(); return b.left < -1 || b.right > innerWidth + 1; }) }));
      expect(r.sw, `${w}: scroll width`).toBe(true); expect(r.beyond, `${w}: tile beyond viewport`).toBe(false);
    }
    const t2 = await mosaicTop(page);
    await scrollPage(page, t2 + 560);
    await page.waitForFunction(() => !document.querySelector('[data-mosaic]')!.classList.contains('is-assembling'));
    expect(errors).toEqual([]);
  });
});

test.describe('services assembly: nothing covers the section on a first visit', () => {
  test('with fresh storage no fixed overlay exists, and pieces start from the whole window', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto('/en/');
    expect(await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).position === 'fixed' && !e.closest('header') && e.getBoundingClientRect().height > 40).length)).toBe(0);
    const top = await mosaicTop(page);
    await scrollPage(page, top - 844 * 0.8);
    expect(await pose(page).then((p) => p.assembling)).toBe(true);
    await ctx.close();
  });
});

test.describe('services assembly: fallbacks', () => {
  test('reduced motion: the complete composition from first render, no travel at any scroll position', async ({ browser }) => {
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto('/de/');
      const top = await mosaicTop(page);
      for (const f of [-0.9, -0.4, 0.2]) { await scrollPage(page, top + vp.height * f); const p = await pose(page); expect(p.assembling).toBe(false); for (const id of ids) expect(moved(p, id)).toBe(0); }
      await ctx.close();
    }
  });

  test('no JavaScript: the same complete composition, every link present', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/es/');
    for (const s of services) {
      await expect(page.locator(`.tile[data-service="${s.id}"] .tile__title`)).toBeVisible();
      await expect(page.locator(`.tile[data-service="${s.id}"] .tile__link`)).toHaveAttribute('href', `/es/services/${s.id}/`);
    }
    await expect(page.locator('[data-mosaic]')).not.toHaveClass(/is-assembling/);
    expect(await page.locator('.tile[style]').count()).toBe(0);
    await ctx.close();
  });

  test('a short window (under 480px high) is shown complete, without travel', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 440 });
    await page.goto('/en/');
    await page.waitForTimeout(300);
    const p = await pose(page);
    expect(p.assembling).toBe(false);
    for (const id of ids) expect(moved(p, id)).toBe(0);
  });
});

test.describe('services assembly: the settled mosaic is the one it was', () => {
  test('connected single column on phones: no gap between any two stacked tiles; outer silhouette corners as before', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const lang of langs) {
      await page.goto(`/${lang}/`);
      await assembleServices(page);
      const r = await page.evaluate(() => {
        const t = [...document.querySelectorAll<HTMLElement>('.tile')].map((e) => { const b = e.getBoundingClientRect(), c = getComputedStyle(e); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, radii: [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].map(parseFloat) }; });
        return t;
      });
      for (let i = 1; i < r.length; i++) { expect(Math.abs(r[i]!.top - r[i - 1]!.bottom), `${lang}: gap between tile ${i} and ${i + 1}`).toBeLessThan(0.6); expect(Math.abs(r[i]!.left - r[0]!.left)).toBeLessThan(0.6); expect(Math.abs(r[i]!.right - r[0]!.right)).toBeLessThan(0.6); }
      expect(r[0]!.radii[0]).toBeGreaterThan(40); expect(r[0]!.radii[1]).toBe(6); expect(r[3]!.radii[2]).toBeGreaterThan(40); expect(r[3]!.radii[3]).toBe(6);
      expect(r[1]!.radii.every((v) => v === 0)).toBe(true); expect(r[2]!.radii.every((v) => v === 0)).toBe(true);
    }
  });

  test('desktop: tiles share edges exactly again after docking; only the outer corners are curved', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await assembleServices(page);
    const r = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.tile')].map((e) => { const b = e.getBoundingClientRect(), c = getComputedStyle(e); return { l: b.left, r: b.right, t: b.top, b: b.bottom, radii: [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].map(parseFloat), shadow: c.boxShadow }; }));
    const [web, local, video, ads] = r as [typeof r[0], typeof r[0], typeof r[0], typeof r[0]];
    expect(Math.abs(web.r - local.l)).toBeLessThan(0.6); expect(Math.abs(video.r - ads.l)).toBeLessThan(0.6);
    expect(Math.abs(web.b - video.t)).toBeLessThan(0.6); expect(Math.abs(local.b - ads.t)).toBeLessThan(0.6);
    expect(web.radii[0]).toBeGreaterThan(80); expect(local.radii[1]).toBe(6); expect(video.radii[3]).toBe(6); expect(ads.radii[2]).toBeGreaterThan(80);
    expect([web.radii[1], web.radii[2], web.radii[3], local.radii[0], local.radii[2], local.radii[3], video.radii[0], video.radii[1], video.radii[2], ads.radii[0], ads.radii[1], ads.radii[3]].every((v) => v === 0)).toBe(true);
    for (const t of r) expect(t.shadow).toBe('none');
  });

  for (const vw of [1440, 1024]) {
    test(`${vw}px: after docking, hovering moves the shared edge and never moves the sections below`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: 900 });
      await page.goto('/en/');
      await assembleServices(page);
      const m0 = await page.evaluate(() => ({ h: document.querySelector('[data-mosaic]')!.getBoundingClientRect().height, doc: document.documentElement.scrollHeight, next: document.querySelector('#work')!.getBoundingClientRect().top + scrollY }));
      for (const id of ids) {
        const b = (await page.locator(`.tile[data-service="${id}"]`).boundingBox())!;
        await page.mouse.move(b.x + b.width / 2, Math.min(850, b.y + b.height / 2), { steps: 4 });
        if (b.y + b.height / 2 > 850) continue; // the lower row is checked by mosaic.spec at tall viewports
        await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', id);
        await page.waitForTimeout(500);
        expect(await page.evaluate(() => ({ h: document.querySelector('[data-mosaic]')!.getBoundingClientRect().height, doc: document.documentElement.scrollHeight, next: document.querySelector('#work')!.getBoundingClientRect().top + scrollY }))).toEqual(m0);
      }
    });
  }

  test('hover does not resize a tile that is still travelling, and a stationary pointer under the scrolling content cannot trigger it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    const top = await mosaicTop(page);
    await scrollPage(page, top - 900 * 0.55);
    await page.mouse.move(1100, 450, { steps: 3 });
    await page.mouse.wheel(0, 120); await page.waitForTimeout(500);
    expect(await page.locator('[data-mosaic]').getAttribute('data-active')).toBe('');
  });

  test('no layout shift from load through the whole scroll, the finish and a reset (EN/DE, desktop and phone)', async ({ browser }) => {
    for (const [vp, lang, touch] of [[{ width: 1440, height: 900 }, 'en', false], [{ width: 1440, height: 900 }, 'de', false], [{ width: 390, height: 844 }, 'en', true], [{ width: 390, height: 844 }, 'de', true]] as const) {
      const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, isMobile: touch });
      await ctx.addInitScript(() => { (window as any).__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries() as any[]) (window as any).__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
      const page = await ctx.newPage();
      await page.goto(`/${lang}/`, { waitUntil: 'networkidle' });
      const top = await mosaicTop(page);
      for (let y = top - vp.height; y < top + 2400; y += 120) { await page.mouse.wheel(0, 0).catch(() => {}); await scrollPage(page, y); }
      await scrollPage(page, 0); await scrollPage(page, top - vp.height * 0.5);
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => (window as any).__cls), `${lang} ${vp.width}`).toBeLessThan(0.01);
      await ctx.close();
    }
  });

  test('image space is reserved: with images blocked the tile picture boxes keep their layout size while pieces travel (1440 and 390)', async ({ browser }) => {
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const sizes = async (block: boolean) => {
        const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 800, isMobile: vp.width < 800 });
        if (block) await ctx.route(/\.webp$/, (r) => r.abort());
        const page = await ctx.newPage();
        await page.goto('/en/', { waitUntil: block ? 'domcontentloaded' : 'networkidle' });
        const r = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.tile__img')].map((e) => [e.offsetWidth, e.offsetHeight]));
        await ctx.close();
        return r;
      };
      expect(await sizes(true)).toEqual(await sizes(false));
    }
  });
});

test.describe('hero playback: the visitor\'s latest choice always wins over the automatic hold (task 10A)', () => {
  const heroBtn = '[data-art-pause]:not([hidden])';
  const pressed = (page: Page) => page.locator(heroBtn).getAttribute('aria-pressed');
  const label = (page: Page) => page.locator('[data-art-pause-label]').textContent();
  const toHeroTop = (page: Page) => page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const startOverlap = async (page: Page) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await expect(page.locator(heroBtn)).toBeVisible();
    const top = await mosaicTop(page);
    await scrollPage(page, top - 900 * 0.75); // a piece is travelling, the hero is on screen: the automatic hold applies
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'true');
    return top;
  };
  const finish = async (page: Page, top: number) => {
    await scrollPage(page, top + 560);
    await page.waitForFunction(() => !document.querySelector('[data-mosaic]')!.classList.contains('is-assembling'));
    await page.waitForTimeout(300);
  };

  test('REGRESSION: Play then Pause during the automatic hold stays paused after the hold is released', async ({ page }) => {
    const top = await startOverlap(page);
    await page.locator(heroBtn).click();                       // visitor: Play
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'false');
    await page.locator(heroBtn).click();                       // visitor: Pause
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'true');
    await finish(page, top);                                   // services finishes and releases its hold
    await toHeroTop(page);
    await page.waitForTimeout(400);
    expect(await pressed(page), 'the visitor\'s last choice (Pause) must survive the release').toBe('true');
    expect(await label(page)).toBe(await page.locator(heroBtn).getAttribute('data-play'));
  });

  test('manual Play during the hold is not reversed by stale automatic ownership', async ({ page }) => {
    const top = await startOverlap(page);
    await page.locator(heroBtn).click();                       // visitor: Play (overrides the hold)
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'false');
    await finish(page, top);
    await toHeroTop(page);
    await page.waitForTimeout(400);
    expect(await pressed(page)).toBe('false');
  });

  test('automatic-only hold releases and resumes; a visitor pause made before the overlap stays', async ({ page }) => {
    const top = await startOverlap(page);
    await finish(page, top);
    expect(await pressed(page)).toBe('false');
    await page.goto('/en/');
    await expect(page.locator(heroBtn)).toBeVisible();
    await page.locator(heroBtn).click();
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'true');
    const t2 = await mosaicTop(page);
    await scrollPage(page, t2 - 900 * 0.75);
    await finish(page, t2);
    expect(await pressed(page)).toBe('true');
  });

  test('repeated and overlapping hold requests are idempotent and leave no dangling hold', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await expect(page.locator(heroBtn)).toBeVisible();
    const send = (hold: boolean, source: string) => page.evaluate(([h, s]) => document.dispatchEvent(new CustomEvent('odalo:hero-hold', { detail: { hold: h, source: s } })), [hold, source] as const);
    await send(true, 'a'); await send(true, 'a'); await send(true, 'a');
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'true');
    await send(false, 'a');                                    // one release undoes any number of identical requests
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'false');
    await send(true, 'a'); await send(true, 'b');              // two independent holders
    await send(false, 'a');
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'true');
    await send(false, 'b'); await send(false, 'b');
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'false');
    await send(false, 'never-held');                           // a release without a hold does nothing
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'false');
  });

  test('a reduced-motion change during the hold leaves no dangling hold', async ({ page }) => {
    await startOverlap(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });      // services settles and releases; the hero control hides
    await page.waitForFunction(() => !document.querySelector('[data-mosaic]')!.classList.contains('is-assembling'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator(heroBtn)).toBeVisible();
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'false');
  });

  test('navigating away and back leaves no dangling hold', async ({ page }) => {
    const top = await startOverlap(page);
    await page.goto('/en/plans/');
    await page.goBack();
    await expect(page.locator(heroBtn)).toBeVisible();
    await page.waitForTimeout(500);
    await finish(page, top);
    await toHeroTop(page);
    await page.waitForTimeout(300);
    expect(await pressed(page)).toBe('false');
  });

  for (const lang of langs) {
    test(`${lang}: labels, pressed state and keyboard focus stay correct through hold, Play, Pause and release`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${lang}/`);
      await expect(page.locator(heroBtn)).toBeVisible();
      const play = (await page.locator(heroBtn).getAttribute('data-play'))!, pause = (await page.locator(heroBtn).getAttribute('data-pause'))!;
      expect(play).not.toBe(pause);
      expect(await label(page)).toBe(pause);
      const top = await mosaicTop(page);
      await scrollPage(page, top - 900 * 0.75);
      await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'true');
      expect(await label(page)).toBe(play);
      await page.locator(heroBtn).focus();
      await page.keyboard.press('Space');                       // visitor: Play
      await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'false');
      expect(await label(page)).toBe(pause);
      await expect(page.locator(heroBtn)).toBeFocused();
      await page.keyboard.press('Enter');                       // visitor: Pause
      await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'true');
      expect(await label(page)).toBe(play);
      await expect(page.locator(heroBtn)).toBeFocused();
      await finish(page, top);
      await toHeroTop(page);
      await page.waitForTimeout(300);
      expect(await pressed(page)).toBe('true');
      expect(await label(page)).toBe(play);
    });
  }
});

test.describe('hero and services motion are coordinated through the hero\'s own pause control', () => {
  const heroBtn = '[data-art-pause]:not([hidden])';

  test('while a piece is travelling and the hero is on screen the hero pauses itself, then resumes when the pieces have docked', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await expect(page.locator(heroBtn)).toBeVisible();
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'false');
    const top = await mosaicTop(page);
    await scrollPage(page, top - 900 * 0.75); // first pieces are moving; the hero art is still in view
    expect(await page.evaluate(() => { const r = document.querySelector('[data-hero-art]')!.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; })).toBe(true);
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'true');
    await scrollPage(page, top + 560);
    await page.waitForFunction(() => !document.querySelector('[data-mosaic]')!.classList.contains('is-assembling'));
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'false');
  });

  test('a visitor\'s own pause is never undone', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await expect(page.locator(heroBtn)).toBeVisible();
    await page.locator(heroBtn).click();
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'true');
    const top = await mosaicTop(page);
    await scrollPage(page, top - 900 * 0.75); await scrollPage(page, top + 560);
    await page.waitForFunction(() => !document.querySelector('[data-mosaic]')!.classList.contains('is-assembling'));
    await expect(page.locator(heroBtn)).toHaveAttribute('aria-pressed', 'true');
  });
});
