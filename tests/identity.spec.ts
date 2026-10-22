import { test, expect, type Page } from '@playwright/test';
import { mosaicData } from '../src/mosaic/odalo/odalo-mosaic.mjs';

// Header: the static word (inline SVG, no script). Hero: the supplied animation module, mounted unmodified.
const pieces = (scope: string) => `[...document.querySelectorAll('${scope} [data-piece]')].map((g) => ({ id: +g.dataset.piece, points: g.querySelector('polygon').getAttribute('points'), fill: g.querySelector('polygon').getAttribute('fill') }))`;
const transformList = (scope: string) => `[...document.querySelectorAll('${scope} [data-piece]')].map((g) => g.getAttribute('transform'))`;
const transforms = (scope: string) => `${transformList(scope)}.join('|')`;
const expected = mosaicData.tiles.map((t: any) => ({ id: t.id, points: t.points.map(([x, y]: number[]) => `${x * 50},${y * 50}`).join(' '), fill: t.color }));

/** The module's own centring maths for an arrangement, to compare resting poses without trusting the generated SVG. */
function layout(name: string) {
  const poses = (mosaicData.arrangements as any)[name] as { id: number; x: number; y: number; r: number }[];
  const pts = poses.flatMap((p) => mosaicData.tiles[p.id - 1].points.map(([x, y]: number[]) => { const a = (p.r * Math.PI) / 180; return [p.x + x * Math.cos(a) - y * Math.sin(a), p.y + x * Math.sin(a) + y * Math.cos(a)]; }));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return poses.map((p) => ({ id: p.id, x: 500 + (p.x - cx) * 50, y: 303 + (p.y - cy) * 50, r: p.r })).sort((a, b) => a.id - b.id);
}
const parse = (t: string) => { const m = t.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/)!; return { x: +m[1], y: +m[2], r: +m[3] }; };
const samePose = (a: string, b: { x: number; y: number; r: number }) => { const g = parse(a); expect(Math.abs(g.x - b.x)).toBeLessThan(0.01); expect(Math.abs(g.y - b.y)).toBeLessThan(0.01); expect(g.r).toBe(b.r); };

const stage = '.hero__stage';
const live = `${stage} .odalo-mosaic-svg`; // the mounted module (the hidden static fallback lives beside it)
const events = (page: Page) => page.evaluate((sel) => { (window as any).__s = []; document.querySelector(sel)!.addEventListener('odalo:statechange', (e: any) => (window as any).__s.push(e.detail.state)); }, stage);
const seen = (page: Page): Promise<string[]> => page.evaluate(() => (window as any).__s);

test.describe('odalo identity', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the data has 29 pieces, six arrangements and the requested sequence', () => {
    expect(mosaicData.tiles).toHaveLength(29);
    expect(Object.keys(mosaicData.arrangements).sort()).toEqual(['bird', 'fish', 'fox', 'hexagon', 'sailboat', 'word']);
    expect(mosaicData.sequence).toEqual(['word', 'fish', 'word', 'bird', 'word', 'sailboat', 'word', 'fox', 'word', 'hexagon']);
    for (const poses of Object.values(mosaicData.arrangements) as any[]) expect(poses.map((p: any) => p.id).sort((a: number, b: number) => a - b)).toEqual(mosaicData.tiles.map((t: any) => t.id));
  });

  test('header: static word with the 29 exact pieces at the module resting poses, no script and no control', async ({ page }) => {
    await page.goto('/en/');
    const hdr = page.locator('.hdr__logo');
    await expect(hdr.locator('svg.wordmark')).toBeVisible();
    expect(await page.evaluate(pieces('.hdr__logo'))).toEqual(expected);
    const got = (await page.evaluate(transformList('.hdr__logo'))) as string[];
    layout('word').forEach((p, i) => samePose(got[i], p));
    await expect(hdr).toHaveAttribute('aria-label', /Odalo/);
    await expect(page.locator('.hdr__pause, .hdr [data-odalo-logo]')).toHaveCount(0);
    expect(await hdr.locator('svg').getAttribute('aria-hidden')).toBe('true');
  });

  test('header stays identical on every page type and while the hero animation runs', async ({ page }) => {
    await page.goto('/en/');
    const base = await page.evaluate(transforms('.hdr__logo'));
    const box = await page.locator('.hdr__logo').boundingBox();
    await events(page);
    await page.waitForFunction(() => (window as any).__s.length >= 2, null, { timeout: 15000 });
    expect(await page.evaluate(transforms('.hdr__logo'))).toBe(base);
    expect(await page.locator('.hdr__logo').boundingBox()).toEqual(box);
    for (const u of ['/en/plans/', '/de/work/', '/es/about/', '/en/audit/', '/en/services/web/', '/en/privacy/']) {
      await page.goto(u);
      expect(await page.evaluate(transforms('.hdr__logo'))).toBe(base);
    }
  });

  test('hero: plays word, fish, word, bird ... through a full repeat; pieces never change; no layout movement', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/en/');
    await page.waitForSelector(`${stage} .odalo-mosaic-svg`);
    await expect(page.locator('.hero__fallback')).toBeHidden();
    expect(await page.evaluate(pieces(live))).toEqual(expected);
    const art0 = await page.locator('.hero__art').boundingBox(), text0 = await page.locator('.hero__text').boundingBox(), page0 = await page.evaluate(() => document.documentElement.scrollHeight);
    await events(page);
    await page.waitForFunction(() => (window as any).__s.length >= 12, null, { timeout: 90_000 });
    expect((await seen(page)).slice(0, 12)).toEqual(['fish', 'word', 'bird', 'word', 'sailboat', 'word', 'fox', 'word', 'hexagon', 'word', 'fish', 'word']);
    expect(await page.evaluate(pieces(live))).toEqual(expected);
    expect(await page.locator('.hero__art').boundingBox()).toEqual(art0);
    expect(await page.locator('.hero__text').boundingBox()).toEqual(text0);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(page0);
    await expect(page.locator(`${stage} .odalo-mosaic-svg`)).toHaveCount(1);
  });

  test('hero: the frame keeps 1000:606 and the static word is visible before JavaScript (same box, same poses)', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('/en/');
    await expect(page.locator('.hero__fallback svg')).toBeVisible();
    await expect(page.locator('.hero__pause')).toBeHidden();
    const b = (await page.locator(stage).boundingBox())!;
    expect(Math.abs(b.width / b.height - 1000 / 606)).toBeLessThan(0.01);
    const staticPoses = (await page.evaluate(transformList('.hero__fallback'))) as string[];
    await ctx.close();
    const js = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const p2 = await js.newPage();
    await p2.goto('/en/');
    await p2.waitForSelector(`${stage} .odalo-mosaic-svg`);
    expect(await p2.locator(stage).boundingBox()).toEqual(b);
    const live = (await p2.evaluate(transformList(`${stage} .odalo-mosaic-svg`))) as string[];
    live.forEach((t, i) => samePose(t, parse(staticPoses[i])));
    await js.close();
  });

  test('initialisation failure keeps the static word and hides the control', async ({ page }) => {
    await page.addInitScript(() => { const o = Element.prototype.append; Element.prototype.append = function (...a: any[]) { if (this.hasAttribute && this.hasAttribute('data-art-stage')) throw new Error('simulated'); return o.apply(this, a as any); }; });
    await page.goto('/en/');
    await page.waitForTimeout(800);
    await expect(page.locator('.hero__fallback svg')).toBeVisible();
    await expect(page.locator('.hero__pause')).toBeHidden();
    await expect(page.locator(`${stage} .odalo-mosaic-svg`)).toHaveCount(0);
  });

  test('pause lands on a completed arrangement, resume continues; labels, size, focus and keyboard', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/en/');
    const btn = page.locator('.hero__pause');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAccessibleName('Pause animation');
    const b = (await btn.boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44);
    expect(await btn.evaluate((e) => !e.closest('[aria-hidden="true"]'))).toBe(true);
    await events(page);
    await page.locator('.hero__cta .btn--ghost').focus();
    await page.keyboard.press('Tab'); // the control follows the hero actions in tab order
    await expect(btn).toBeFocused();
    expect(await btn.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Space');
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(btn).toHaveAccessibleName('Play animation');
    await page.waitForTimeout(2500); // a move in progress lands first, then everything is still
    const t0 = await page.evaluate(transforms(live)), n0 = (await seen(page)).length;
    await page.waitForTimeout(4500);
    expect(await page.evaluate(transforms(live))).toBe(t0);
    expect((await seen(page)).length).toBe(n0);
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await page.waitForFunction((n) => (window as any).__s.length > n, n0, { timeout: 8000 });
    await page.goto('/de/'); await expect(page.locator('.hero__pause')).toHaveAccessibleName('Animation anhalten');
    await page.goto('/es/'); await expect(page.locator('.hero__pause')).toHaveAccessibleName('Pausar animación');
  });

  test('suspends off screen and while the tab is hidden, and resumes', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/en/');
    await page.waitForSelector(`${stage} .odalo-mosaic-svg`);
    await events(page);
    await page.evaluate(() => document.querySelector('#services')!.scrollIntoView({ behavior: 'instant' as any }));
    await page.waitForTimeout(2200); // let any move in flight land
    const n0 = (await seen(page)).length;
    await page.waitForTimeout(5500);
    expect((await seen(page)).length).toBe(n0);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as any }));
    await page.waitForFunction((n) => (window as any).__s.length > n, n0, { timeout: 8000 });
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(2200);
    const n2 = (await seen(page)).length;
    await page.waitForTimeout(5500);
    expect((await seen(page)).length).toBe(n2);
    await page.evaluate(() => { delete (document as any).hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForFunction((n) => (window as any).__s.length > n, n2, { timeout: 8000 });
  });

  test('navigation and back: one instance, working control; a released page restored from cache is re-mounted', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForSelector(`${stage} .odalo-mosaic-svg`);
    await page.goto('/en/plans/');
    await page.goBack();
    await page.waitForSelector(`${stage} .odalo-mosaic-svg`);
    await expect(page.locator(`${stage} .odalo-mosaic-svg`)).toHaveCount(1);
    const btn = page.locator('.hero__pause');
    await expect(btn).toBeVisible();
    await btn.click(); await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await btn.click(); await expect(btn).toHaveAttribute('aria-pressed', 'false');
    // simulate the back/forward cache: pagehide releases the instance, pageshow(persisted) must restore exactly one
    await page.evaluate(() => { window.dispatchEvent(new Event('pagehide')); });
    await expect(page.locator(`${stage} .odalo-mosaic-svg`)).toHaveCount(0);
    await expect(page.locator('.hero__fallback svg')).toBeVisible();
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
    await expect(page.locator(`${stage} .odalo-mosaic-svg`)).toHaveCount(1);
    await expect(page.locator('.hero__fallback')).toBeHidden();
    await expect(btn).toBeVisible(); await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await events(page);
    await page.waitForFunction(() => (window as any).__s.length >= 1, null, { timeout: 8000 });
  });

  test('the name links home (mouse and keyboard) from other pages', async ({ page }) => {
    await page.goto('/en/plans/');
    await page.locator('.hdr__logo').focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/en/');
    await page.goto('/en/plans/');
    await page.locator('.hdr__logo').click();
    await page.waitForURL('**/en/');
  });

  test('reduced motion: static word in the hero, no control', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
    const page = await ctx.newPage();
    await page.goto('/en/');
    await page.waitForSelector(`${stage} .odalo-mosaic-svg`);
    const before = await page.evaluate(transforms(live));
    await page.waitForTimeout(4500);
    expect(await page.evaluate(transforms(live))).toBe(before);
    await expect(page.locator('.hero__pause')).toBeHidden();
    await ctx.close();
  });

  test('layout shift while the hero loads and animates stays negligible (measured, local, unthrottled)', async ({ page }) => {
    await page.addInitScript(() => { (window as any).__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) (window as any).__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await page.goto('/en/');
    await page.waitForTimeout(6000);
    const cls = await page.evaluate(() => (window as any).__cls);
    console.log('CLS 1440 home, 6 s:', cls);
    expect(cls).toBeLessThan(0.01);
  });

  for (const [w, lang] of [[1440, 'en'], [834, 'en'], [390, 'en'], [320, 'de'], [390, 'de']] as const) {
    test(`${w}px ${lang}: no horizontal overflow, header fits, artwork inside the viewport and after the text on narrow screens`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`/${lang}/`);
      await page.waitForSelector(`${stage} .odalo-mosaic-svg`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      const logo = (await page.locator('.hdr__logo').boundingBox())!, toggle = await page.locator('.hdr__toggle').boundingBox();
      if (toggle) expect(logo.x + logo.width).toBeLessThanOrEqual(toggle.x);
      const art = (await page.locator('.hero__art').boundingBox())!, st = (await page.locator(stage).boundingBox())!;
      expect(art.x).toBeGreaterThanOrEqual(0); expect(art.x + art.width).toBeLessThanOrEqual(w);
      expect(Math.abs(st.width / st.height - 1000 / 606)).toBeLessThan(0.01);
      const btn = (await page.locator('.hero__pause').boundingBox())!;
      expect(btn.x + btn.width).toBeLessThanOrEqual(art.x + art.width);
      if (w < 1024) { const cta = (await page.locator('.hero__cta').boundingBox())!; expect(art.y).toBeGreaterThanOrEqual(cta.y + cta.height); }
    });
  }
});
