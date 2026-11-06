// Focused regression for the compact homepage runtime (src/mosaic/home). Not part of the historical suites.
// Run against an already running build, without the webServer step:  HOME_URL=http://127.0.0.1:4343 npx playwright test -c playwright.home.config.ts
import { test, expect, type Page } from '@playwright/test';

// Measured straight from the DOM: no visible piece may have text beyond its own box.
const noClip = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.hm-box')]
  .filter((b) => getComputedStyle(b).display !== 'none')
  .every((b) => b.scrollHeight - b.clientHeight <= 1 && b.scrollWidth - b.clientWidth <= 1));
const isLive = (page: Page) => page.evaluate(() => !!document.querySelector('.hm-live'));
// Stable geometry: every visible piece and the canvas keep the same rectangles over three samples 120 ms apart (bounded at 4 s, then the test fails).
async function settled(page: Page) {
  await page.waitForFunction(() => !!(window as any).__hm, undefined, { timeout: 8000 }); // the runtime has finished mounting (live or fallback); only used as the mount signal
  await expect.poll(async () => {
    const snap = () => page.evaluate(() => JSON.stringify([...document.querySelectorAll('.hm-canvas, .hm-box')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })));
    const a = await snap(); await page.waitForTimeout(120); const b = await snap(); await page.waitForTimeout(120); const c = await snap();
    return a === b && b === c;
  }, { timeout: 4000 }).toBe(true);
}
// The flowing stack must be genuinely readable: names, details and links visible, toggles hidden.
async function stackReadable(page: Page) {
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.hm-box--hero a.btn')).toBeVisible();
  for (const id of ['web', 'local', 'video', 'ads']) {
    await expect(page.locator(`#pc-${id} .hm-name`)).toBeVisible();
    await expect(page.locator(`#pc-${id} .hm-detail`)).toBeVisible();
    await expect(page.locator(`#pc-${id} .hm-link[href*="/services/"]`)).toBeVisible();
    await expect(page.locator(`#pc-${id} .hm-toggle`)).toBeHidden();
  }
}

test('DE 1024: opening and closing Video keeps every text inside its piece (or falls back to the flowing stack)', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/de/');
  await settled(page);
  expect(await noClip(page)).toBe(true);
  const live = await isLive(page);
  if (!live) { await stackReadable(page); return; } // honest fallback: nothing positioned, nothing clipped
  await page.locator('#pc-video .hm-toggle').click();
  await settled(page);
  expect(await noClip(page)).toBe(true);
  if (await isLive(page)) {
    await expect(page.locator('#pc-video')).toHaveClass(/is-open/);
    await page.keyboard.press('Escape');
    await settled(page);
    await expect(page.locator('#pc-video')).not.toHaveClass(/is-open/);
    await expect(page.locator('#pc-video .hm-toggle')).toBeFocused();
    expect(await noClip(page)).toBe(true);
  } else await stackReadable(page); // the open state could not fit and fell back to the stack
});

for (const open of [false, true]) {
  test(`resize 1440 to 1100 (same breakpoint), detail ${open ? 'open' : 'closed'}: text is re-fitted`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await settled(page);
    if (open) { await page.locator('#pc-web .hm-toggle').click(); await settled(page); }
    await page.setViewportSize({ width: 1100, height: 900 });
    await settled(page);
    expect(await noClip(page)).toBe(true);
    if (open) await expect(page.locator('#pc-web')).toHaveClass(/is-open/);
  });
}

test('homepage runtime blocked: the server HTML stays readable with links and details', async ({ page }) => {
  await page.route('**/_astro/**', (r) => (r.request().resourceType() === 'script' ? r.abort() : r.continue()));
  await page.goto('/en/');
  expect(await isLive(page)).toBe(false);
  await stackReadable(page);
  await expect(page.locator('#process > summary')).toBeVisible();
  await expect(page.locator('#faq > summary')).toBeVisible();
  expect(await noClip(page)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('EN 390: open, reading the text keeps it open, Escape closes and returns focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/');
  await settled(page);
  await page.locator('#pc-local .hm-toggle').click();
  await settled(page);
  await expect(page.locator('#pc-local')).toHaveClass(/is-open/);
  await page.locator('#pc-local .hm-more p').first().click();
  await expect(page.locator('#pc-local')).toHaveClass(/is-open/);
  expect(await noClip(page)).toBe(true);
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(page.locator('#pc-local')).not.toHaveClass(/is-open/);
  await expect(page.locator('#pc-local .hm-toggle')).toBeFocused();
});

// Switching services from far down the page: the newly opened piece (title + close button) is brought into view once its layout has settled (no yank before that).
for (const v of [{ n: 'desktop 1440', w: 1440, h: 900, first: 'web', next: 'video' }, { n: 'phone 390', w: 390, h: 844, first: 'local', next: 'ads' }]) {
  test(`switching service while scrolled down reveals the new piece (${v.n})`, async ({ page }) => {
    await page.setViewportSize({ width: v.w, height: v.h });
    await page.goto('/en/');
    await settled(page);
    await page.locator(`#pc-${v.first} .hm-toggle`).click();
    await settled(page);
    const toggle = page.locator(`#pc-${v.next} .hm-toggle`);
    await toggle.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 220)); // the next Explore button sits low in the window; the new piece's place is above the fold
    await settled(page);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(300);
    await toggle.click();
    await settled(page); // scroll movement counts as geometry change, so this also waits for the smooth scroll to end
    await expect(page.locator(`#pc-${v.next}`)).toHaveClass(/is-open/);
    const box = await page.locator(`#pc-${v.next}`).boundingBox();
    const name = await page.locator(`#pc-${v.next} .hm-name`).boundingBox();
    const close = await toggle.boundingBox();
    expect(box && name && close).toBeTruthy();
    expect(name!.y).toBeGreaterThanOrEqual(0);
    expect(close!.y + close!.height).toBeLessThanOrEqual(v.h);
    await expect(toggle).toBeFocused();
    await expect(toggle).toBeVisible();
  });
}

// The page scroll goes along with the morph: it starts on the click, before the pieces have finished moving (no scroll after the animation, no yank).
test('switch scroll starts with the morph, before it completes (desktop 1440)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/');
  await settled(page);
  await page.locator('#pc-web .hm-toggle').click();
  await settled(page);
  const toggle = page.locator('#pc-video .hm-toggle');
  await toggle.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 220));
  await settled(page);
  await page.evaluate(() => { // sampler: first frame where the page has scrolled, and first frame where the runtime reports the finished state (__hm.cur is set when the morph ends)
    const y0 = scrollY, t: any = (window as any).__t = { y0, click: 0, scroll: 0, done: 0 };
    document.addEventListener('click', () => { t.click = performance.now(); }, { capture: true, once: true });
    const tick = () => { const n = performance.now(); if (t.click && !t.scroll && Math.abs(scrollY - y0) > 2) t.scroll = n; if (t.click && !t.done && (window as any).__hm.cur === 3) t.done = n; if (!t.done) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await toggle.click();
  await page.waitForFunction(() => (window as any).__t.done > 0, undefined, { timeout: 4000 });
  const t = await page.evaluate(() => (window as any).__t);
  expect(t.scroll).toBeGreaterThan(0);
  expect(t.scroll - t.click).toBeLessThan(400); // starts with the click (the runtime first lays out the final state, ~150 ms of work, then morph and scroll run together)
  expect(t.done - t.scroll).toBeGreaterThan(120); // and is still going while the pieces are moving
  await settled(page);
  expect((await page.locator('#pc-video .hm-name').boundingBox())!.y).toBeGreaterThanOrEqual(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('switching service scrolls at once and the new piece is in view (desktop 1440)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await settled(page);
    expect(await isLive(page)).toBe(true);
    await page.locator('#pc-web .hm-toggle').click();
    await settled(page);
    const toggle = page.locator('#pc-video .hm-toggle');
    await toggle.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 220));
    await toggle.click();
    const name = await page.locator('#pc-video .hm-name').boundingBox(); // no waiting for an animation: it is already in place
    expect(name!.y).toBeGreaterThanOrEqual(0);
    expect(name!.y).toBeLessThan(400);
    await expect(toggle).toBeFocused();
  });
});

// Process and FAQ are native disclosures that may both stay open. Each open panel must sit wholly on its own opaque region tile (measured from the real SVG polygons,
// not from a class), whichever is opened first, with an FAQ answer expanded or not, and after collapsing again.
const tileCovers = (page: Page, selector: string) => page.evaluate((sel) => {
  const el = document.querySelector(sel)!, r = el.getBoundingClientRect(), svg = document.querySelector('.pg-field') as SVGSVGElement, sr = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  const toView = (x: number, y: number) => [vb.x + ((x - sr.left) / sr.width) * vb.width, vb.y + ((y - sr.top) / sr.height) * vb.height];
  const inside = (p: number[][], x: number, y: number) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };
  const polys = [...svg.querySelectorAll('polygon.hm-cell--r')].map((q) => (q.getAttribute('points') || '').trim().split(/\s+/).filter(Boolean).map((s) => s.split(',').map(Number)));
  const d = 6, corners = [[r.left + d, r.top + d], [r.right - d, r.top + d], [r.left + d, r.bottom - d], [r.right - d, r.bottom - d], [(r.left + r.right) / 2, (r.top + r.bottom) / 2]].map(([x, y]) => toView(x, y));
  return r.height > 0 && polys.some((p) => p.length > 2 && corners.every(([x, y]) => inside(p, x, y)));
}, selector);
async function openDisclosures(page: Page, order: ('process' | 'faq')[]) {
  for (const id of order) {
    await page.locator(`#${id} > summary`).scrollIntoViewIfNeeded();
    await page.locator(`#${id} > summary`).click();
    if (id === 'faq') await page.locator('#faq .hm-qa > summary').first().click(); // an answer opened inside the FAQ
    await page.waitForTimeout(250);
  }
}
for (const v of [{ n: 'desktop 1440', w: 1440, h: 900 }, { n: 'phone 390', w: 390, h: 844 }]) {
  for (const order of [['faq', 'process'], ['process', 'faq']] as ('process' | 'faq')[][]) {
    test(`Process and FAQ both open (${order.join(' then ')}, ${v.n}): each panel keeps its own tile`, async ({ page }) => {
      await page.setViewportSize({ width: v.w, height: v.h });
      await page.goto('/en/');
      await settled(page);
      expect(await isLive(page)).toBe(true);
      await openDisclosures(page, order);
      await expect(page.locator('#process')).toHaveAttribute('open', '');
      await expect(page.locator('#faq')).toHaveAttribute('open', '');
      expect(await tileCovers(page, '#process .hm-panel')).toBe(true);
      expect(await tileCovers(page, '#faq .hm-panel')).toBe(true);
      await page.locator('#faq .hm-qa > summary').first().click(); // answer collapses again
      await page.waitForTimeout(250);
      expect(await tileCovers(page, '#process .hm-panel')).toBe(true);
      expect(await tileCovers(page, '#faq .hm-panel')).toBe(true);
      await page.locator('#faq > summary').click(); await page.waitForTimeout(250); // closing one leaves the other covered
      expect(await tileCovers(page, '#process .hm-panel')).toBe(true);
    });
  }
}

// First visible frame: the readable opaque backing is plain CSS on the panel itself, so it is painted with the text in the very frame the disclosure opens,
// not after the (asynchronous) SVG tile has been recomputed. Proven synchronously, in the same task as the click, before any frame or observer callback can run.
for (const v of [{ n: 'desktop 1440', w: 1440, h: 900 }, { n: 'phone 390', w: 390, h: 844 }]) {
  test(`opening a disclosure shows its opaque sand backing in the first frame (${v.n})`, async ({ page }) => {
    await page.setViewportSize({ width: v.w, height: v.h });
    await page.goto('/en/');
    await settled(page);
    expect(await isLive(page)).toBe(true);
    const probe = (sel: string, panel: string) => page.evaluate(([s, p]) => {
      (document.querySelector(s) as HTMLElement).click(); // native details toggle, synchronous
      const el = document.querySelector(p) as HTMLElement, cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return { bg: cs.backgroundColor, opacity: cs.opacity, visibility: cs.visibility, transition: cs.transitionDuration, h: r.height, text: (el.textContent || '').trim().length > 20 };
    }, [sel, panel]);
    const sand = 'rgb(239, 232, 213)';
    for (const [sum, panel] of [['#faq > summary', '#faq .hm-panel'], ['#process > summary', '#process .hm-panel']]) {
      await page.locator(sum).scrollIntoViewIfNeeded();
      const a = await probe(sum, panel);
      expect(a).toMatchObject({ bg: sand, opacity: '1', visibility: 'visible', text: true });
      expect(a.h).toBeGreaterThan(40);
      await page.waitForTimeout(300);
    }
    // a nested FAQ answer opens on the same panel backing; the footer storage note sits on its block's own backing
    await page.locator('#faq .hm-qa > summary').first().click();
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#faq .hm-panel')!).backgroundColor)).toBe(sand);
    await page.locator('footer .ftr__store summary').scrollIntoViewIfNeeded();
    const st = await page.evaluate(() => { (document.querySelector('footer .ftr__store summary') as HTMLElement).click(); return getComputedStyle(document.querySelector('footer .ftr__store')!.closest('[data-fr]')!).backgroundColor; });
    expect(st).not.toBe('rgba(0, 0, 0, 0)');
  });
}
