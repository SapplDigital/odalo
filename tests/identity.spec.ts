import { test, expect } from '@playwright/test';
import { mosaicData } from '../src/mosaic/odalo/odalo-mosaic.mjs';

const pieces = `[...document.querySelectorAll('.hdr__logo [data-piece]')].map((g) => ({ id: +g.dataset.piece, points: g.querySelector('polygon').getAttribute('points'), fill: g.querySelector('polygon').getAttribute('fill') }))`;
const expected = mosaicData.tiles.map((t: any) => ({ id: t.id, points: t.points.map(([x, y]: number[]) => `${x * 50},${y * 50}`).join(' '), fill: t.color }));

test.describe('odalo logo (supplied animation module)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the data has 29 pieces, six arrangements and the requested sequence', () => {
    expect(mosaicData.tiles).toHaveLength(29);
    expect(Object.keys(mosaicData.arrangements).sort()).toEqual(['bird', 'fish', 'fox', 'hexagon', 'sailboat', 'word']);
    expect(mosaicData.sequence).toEqual(['word', 'fish', 'word', 'bird', 'word', 'sailboat', 'word', 'fox', 'word', 'hexagon']);
    for (const poses of Object.values(mosaicData.arrangements) as any[]) expect(poses.map((p: any) => p.id).sort((a: number, b: number) => a - b)).toEqual(mosaicData.tiles.map((t: any) => t.id));
  });

  test('renders the word from the 29 pieces with exact points and colours, and has an accessible name', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('.hdr__logo .odalo-mosaic-svg')).toBeVisible();
    expect(await page.evaluate(pieces)).toEqual(expected);
    await expect(page.locator('.hdr__logo')).toHaveAttribute('aria-label', /Odalo/);
  });

  test('plays odalo, fish, odalo, bird, odalo ... on its own; pieces never change; the header never changes size', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForSelector('.hdr__logo .odalo-mosaic-svg');
    const hdr0 = await page.locator('[data-header]').boundingBox(), logo0 = await page.locator('.hdr__logo').boundingBox();
    await page.evaluate(() => { (window as any).__s = []; document.querySelector('[data-odalo-logo]')!.addEventListener('odalo:statechange', (e: any) => (window as any).__s.push(e.detail.state)); });
    await page.waitForFunction(() => (window as any).__s.length >= 5, null, { timeout: 25000 });
    expect(await page.evaluate(() => (window as any).__s.slice(0, 5))).toEqual(['fish', 'word', 'bird', 'word', 'sailboat']);
    expect(await page.evaluate(pieces)).toEqual(expected);
    expect(await page.locator('[data-header]').boundingBox()).toEqual(hdr0);
    expect(await page.locator('.hdr__logo').boundingBox()).toEqual(logo0);
  });

  test('the pause control stops and resumes it, with a localized label and aria-pressed', async ({ page }) => {
    await page.goto('/en/');
    const btn = page.locator('.hdr__pause');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-label', 'Pause the logo animation');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(btn).toHaveAttribute('aria-label', 'Play the logo animation');
    const t0 = await page.evaluate(() => document.querySelector('.hdr__logo [data-piece="1"]')!.getAttribute('transform'));
    await page.waitForTimeout(4000);
    expect(await page.evaluate(() => document.querySelector('.hdr__logo [data-piece="1"]')!.getAttribute('transform'))).toBe(t0);
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await page.goto('/de/');
    await expect(page.locator('.hdr__pause')).toHaveAttribute('aria-label', 'Logo-Animation anhalten');
  });

  test('the logo still navigates home (mouse and keyboard) and is keyboard reachable', async ({ page }) => {
    await page.goto('/en/plans/');
    await page.locator('.hdr__logo').focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/en/');
    await page.goto('/en/plans/');
    await page.locator('.hdr__logo').click();
    await page.waitForURL('**/en/');
  });

  test('reduced motion: stays on the word, no pause control needed, still navigates', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
    const page = await ctx.newPage();
    await page.goto('http://localhost:4321/en/plans/');
    await page.waitForSelector('.hdr__logo .odalo-mosaic-svg');
    const before = await page.evaluate(() => document.querySelector('.hdr__logo [data-piece="1"]')!.getAttribute('transform'));
    await page.waitForTimeout(4500);
    expect(await page.evaluate(() => document.querySelector('.hdr__logo [data-piece="1"]')!.getAttribute('transform'))).toBe(before);
    await expect(page.locator('.hdr__pause')).toBeHidden();
    await page.locator('.hdr__logo').click();
    await page.waitForURL('**/en/');
    await ctx.close();
  });

  test('without JavaScript the plain wordmark is shown', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4321/en/');
    await expect(page.locator('.hdr__logo .logo__fallback')).toBeVisible();
    await expect(page.locator('.hdr__pause')).toBeHidden();
    await ctx.close();
  });

  for (const w of [1440, 834, 390, 320]) {
    test(`header fits at ${w}px without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto('/en/');
      await page.waitForSelector('.hdr__logo .odalo-mosaic-svg');
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      const logo = (await page.locator('.hdr__logo').boundingBox())!, toggle = await page.locator('.hdr__toggle').boundingBox();
      if (toggle) expect(logo.x + logo.width).toBeLessThanOrEqual(toggle.x);
    });
  }
});
