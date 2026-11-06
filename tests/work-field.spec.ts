import { test, expect, type Page } from '@playwright/test';
import { tr } from '../src/i18n/ui';
import { projects } from '../src/content/projects';

/**
 * The homepage's connected Services -> Work field (M2): seam join against the REAL Services board, behaviour while a Services detail is open,
 * mixed keyboard/pointer input, dynamic mode changes, one-navigation links, readable text, other Work placements unchanged, no-JS.
 */
const langs = ['en', 'es', 'de'] as const;
const BOARD = '#work [data-wj-board]';
const geoLive = (page: Page) => page.evaluate((s) => getComputedStyle(document.querySelector(s)!).getPropertyValue('--geo').trim() === '1', BOARD);
const active = (page: Page) => page.evaluate((s) => (document.querySelector(s) as HTMLElement).dataset.active || '', BOARD);
const toBoard = (page: Page) => page.evaluate((s) => { const r = document.querySelector(s)!.getBoundingClientRect(); scrollTo({ top: scrollY + r.top - 24, behavior: 'instant' }); }, BOARD); // the site scrolls smoothly by default; tests must not measure mid-scroll
const rect = (page: Page, sel: string) => page.evaluate((s) => { const r = document.querySelector(s)!.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + scrollY, b: r.bottom + scrollY }; }, sel);
const at = async (page: Page, fx: number, fy: number) => { const b = (await page.locator(BOARD).boundingBox())!; await page.mouse.move(b.x + b.width * fx, b.y + b.height * fy, { steps: 6 }); };

test.describe('work field: join with the real Services board', () => {
  for (const vw of [1440, 1024, 834]) {
    test(`${vw}px: at rest the header's peg and note panel start on the Services bottom seam (measured, not assumed)`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' }); // everything docked and settled
      await page.setViewportSize({ width: vw, height: 900 });
      await page.goto('/en/');
      const ads = await rect(page, '#services article[data-service="ads"]');
      const peg = await rect(page, '#work [data-wj-peg]');
      const note = await rect(page, '#work .wj-note');
      expect(Math.abs(ads.l - peg.r), 'peg right edge vs the ads tile left edge').toBeLessThan(1.5);
      expect(Math.abs(ads.l - note.l), 'note panel left edge vs the ads tile left edge').toBeLessThan(1.5);
      const board = await rect(page, '#services [data-mosaic]');
      expect(Math.abs(peg.t - board.b) + Math.abs(note.t - board.b), 'no gap between the Services board and the Work header').toBeLessThan(2);
    });
  }
  test('the join is designed for the rest seam: during Services emphasis the real edge moves and the header does not follow (documented behaviour)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/#services');
    await page.waitForTimeout(600);
    const before = await rect(page, '#work .wj-note');
    await page.locator('#services article[data-service="video"]').hover();
    await page.waitForTimeout(700);
    expect(await page.locator('#services [data-mosaic]').getAttribute('data-active')).toBe('video');
    const ads = await rect(page, '#services article[data-service="ads"]');
    const after = await rect(page, '#work .wj-note');
    expect(Math.abs(after.l - before.l), 'header seam is unchanged').toBeLessThan(0.5);
    expect(Math.abs(ads.l - after.l), 'the real Services edge has moved away from it').toBeGreaterThan(40);
    // nothing with content is hidden or overlapped while they differ
    await expect(page.locator('#work-h')).toBeVisible();
    await expect(page.locator('#work .wj-note a')).toBeVisible();
  });
});

test.describe('work field: Services detail open between the sections', () => {
  test('desktop: the real panel is the bridge; the decorative peg detaches, Work copy stays in flow and visible; Escape and Close restore the join and focus', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    const explore = page.locator('#services [data-explore="web"]');
    await explore.scrollIntoViewIfNeeded();
    await explore.click();
    await expect(page.locator('#services')).toHaveAttribute('data-detail-state', 'open');
    const detail = await rect(page, '#svc-detail');
    const head = await rect(page, '#work .wj-head');
    expect(head.t, 'the header starts below the panel (in flow, no overlap)').toBeGreaterThanOrEqual(detail.b - 0.5);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#work [data-wj-peg]')!).visibility)).toBe('hidden');
    for (const sel of ['#work-h', '#work .wj-note p', '#work .wj-note a']) await expect(page.locator(sel)).toBeVisible();
    // keyboard: Escape closes, focus returns to Explore, the join is back
    await page.keyboard.press('Escape');
    await expect(page.locator('#services')).toHaveAttribute('data-detail-state', 'closed');
    await expect(explore).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#work [data-wj-peg]')!).visibility)).toBe('visible');
    await page.mouse.move(5, 5);
    await page.locator('#work-h').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900); // the dock and the shared edge settle
    const ads = await rect(page, '#services article[data-service="ads"]'); const peg = await rect(page, '#work [data-wj-peg]');
    const board = await rect(page, '#services [data-mosaic]');
    expect(Math.abs(ads.l - peg.r)).toBeLessThan(1.5);
    expect(Math.abs(peg.t - board.b)).toBeLessThan(2);
  });
  test('open, then Close button, then resize across the tablet breakpoint: no overlap, state consistent', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await page.locator('#services [data-explore="ads"]').scrollIntoViewIfNeeded();
    await page.locator('#services [data-explore="ads"]').click();
    await page.setViewportSize({ width: 390, height: 844 }); // the panel moves inline after its tile on phones
    await expect(page.locator('#services')).toHaveAttribute('data-detail-state', 'open');
    const d = await rect(page, '#svc-detail'); const h = await rect(page, '#work .wj-head');
    expect(h.t).toBeGreaterThanOrEqual(d.b - 0.5);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('#svc-detail [data-close]:visible').click();
    await expect(page.locator('#services')).toHaveAttribute('data-detail-state', 'closed');
  });
  test('phone: an open service detail sits inside the board; the Work header follows it and keeps every control', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/');
    const b = page.locator('#services [data-explore="web"]');
    await b.scrollIntoViewIfNeeded(); await b.click();
    await expect(page.locator('#services')).toHaveAttribute('data-detail-state', 'open');
    const d = await rect(page, '#svc-detail'); const h = await rect(page, '#work .wj-head');
    expect(h.t).toBeGreaterThan(d.b - 0.5);
    await expect(page.locator('#work .wj-note a')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
  test('a deep link to #work and a deep link to #services both land with a settled, joined field', async ({ page }) => {
    for (const hash of ['#work', '#services']) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/en/${hash}`);
      await page.waitForTimeout(800);
      expect(await page.evaluate(() => (document.querySelector('[data-work-field]') as HTMLElement).dataset.cards), hash).toBe('done');
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('#work [data-wj-peg]')!).transform), hash).toBe('none');
    }
  });
});

test.describe('work field: input and mode changes (wide geometry)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await toBoard(page);
    await page.waitForTimeout(900);
    expect(await geoLive(page), 'English at 1440 has the shared-edge geometry').toBe(true);
  });

  test('keyboard focus wins over incidental pointer movement: focus a project, sweep the pointer across the others past the intent time, the focused one stays emphasised and focused', async ({ page }) => {
    await page.locator('#work .wj-note a').focus();
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); // hotel, then clinic
    const clinic = page.locator('#work .proj__title a').nth(1);
    await expect(clinic).toBeFocused();
    await expect.poll(() => active(page)).toBe('sample-clinic');
    await at(page, 0.25, 0.5); await page.waitForTimeout(400);   // across the hotel, longer than the 110 ms intent
    await at(page, 0.8, 0.8); await page.waitForTimeout(400);    // and the shop
    await at(page, 0.3, 0.2); await page.waitForTimeout(400);
    expect(await active(page)).toBe('sample-clinic');
    await expect(clinic).toBeFocused();
    expect(await page.locator('#work .proj').nth(1).evaluate((e) => e.classList.contains('is-active'))).toBe(true);
    // leaving the card: policy is rest, then the next pointer movement selects again
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    await page.waitForTimeout(400);
    await toBoard(page); await page.waitForTimeout(300);
    await at(page, 0.8, 0.8); await page.waitForTimeout(500);
    expect(await active(page)).toBe('sample-shop');
  });

  test('queued pointer intent is dropped when keyboard focus arrives', async ({ page }) => {
    await page.locator('#work .wj-note a').focus();
    await at(page, 0.8, 0.8);                       // pointer intent for the shop starts (110 ms)
    await page.keyboard.press('Tab');               // focus the hotel before it fires
    await page.waitForTimeout(500);
    expect(await active(page)).toBe('sample-hotel');
  });

  test('reduced motion switched on while hovering: timers cancelled, board back to rest at once, no replay when switched off again', async ({ page }) => {
    const rest = await page.evaluate((s) => document.querySelector(s)!.getBoundingClientRect().height, BOARD);
    await at(page, 0.8, 0.8); await page.waitForTimeout(600);
    expect(await active(page)).toBe('sample-shop');
    await at(page, 0.3, 0.3);                       // intent for the hotel is queued ...
    await page.emulateMedia({ reducedMotion: 'reduce' }); // ... and the setting changes before it can fire
    await page.waitForTimeout(500);
    expect(await active(page)).toBe('');
    expect(await geoLive(page)).toBe(false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(500);
    expect(await active(page), 'old intent is not replayed').toBe('');
    expect(await geoLive(page)).toBe(true);
    expect(Math.abs((await page.evaluate((s) => document.querySelector(s)!.getBoundingClientRect().height, BOARD)) - rest)).toBeLessThan(1);
    // links stay usable and focus still shows its ring in the static mode
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#work .wj-note a').focus(); await page.keyboard.press('Tab');
    expect(await page.locator('#work .proj').first().evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('solid');
    expect(await active(page)).toBe('');
  });

  test('leaving wide mode by resizing clears emphasis; returning does not replay it', async ({ page }) => {
    await at(page, 0.8, 0.2); await page.waitForTimeout(600);
    expect(await active(page)).toBe('sample-clinic');
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.waitForTimeout(500);
    expect(await geoLive(page)).toBe(false);
    expect(await active(page)).toBe('');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.mouse.move(5, 5);
    await page.waitForTimeout(600);
    expect(await active(page)).toBe('');
  });

  for (const [name, fx, fy] of [['hotel', 0.3, 0.4], ['clinic', 0.8, 0.2], ['shop', 0.8, 0.8]] as const) {
    test(`hover ${name}: the Work board, the next section and the page keep their size and position`, async ({ page }) => {
      const m = () => page.evaluate((s) => ({ h: document.querySelector(s)!.getBoundingClientRect().height, next: document.querySelector('#process')!.getBoundingClientRect().top + scrollY, page: document.documentElement.scrollHeight }), BOARD);
      const rest = await m();
      await at(page, fx, fy); await page.waitForTimeout(700);
      expect(await active(page)).toContain(name);
      const now = await m();
      expect(Math.abs(now.h - rest.h)).toBeLessThan(0.5); expect(Math.abs(now.next - rest.next)).toBeLessThan(0.5); expect(now.page).toBe(rest.page);
    });
  }

  test('a click navigates once to the case study; the card stays a single native link', async ({ page }) => {
    let navs = 0; page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs++; });
    await at(page, 0.3, 0.4);
    await Promise.all([page.waitForURL('**/en/work/sample-hotel/'), page.mouse.click(...(await (async () => { const b = (await page.locator(BOARD).boundingBox())!; return [b.x + b.width * 0.3, b.y + b.height * 0.4] as [number, number]; })()))]);
    expect(navs).toBe(1);
  });
});

test.describe('work field: touch, text, other placements, no JS', () => {
  test('phone: one tap on a project card navigates once', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto('/en/');
    const card = page.locator('#work .proj').nth(1);
    await card.scrollIntoViewIfNeeded();
    let navs = 0; page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs++; });
    const b = (await card.boundingBox())!;
    await Promise.all([page.waitForURL('**/en/work/sample-clinic/'), page.touchscreen.tap(b.x + b.width / 2, Math.max(60, Math.min(b.y + b.height * 0.6, 780)))]);
    expect(navs).toBe(1);
    await ctx.close();
  });
  test('a touch scroll gesture across the wide board selects nothing', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('/en/'); await toBoard(page); await page.waitForTimeout(800);
    const b = (await page.locator(BOARD).boundingBox())!; const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.synthesizeScrollGesture', { x: b.x + b.width * 0.8, y: b.y + b.height * 0.6, yDistance: -250, gestureSourceType: 'touch', speed: 800 });
    await page.waitForTimeout(600);
    expect(await active(page)).toBe('');
    await ctx.close();
  });
  for (const l of langs) for (const vw of [1440, 390]) {
    test(`${l} ${vw}px: supporting paragraphs are at least 16px at the default text size and nothing is clipped`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: 900 });
      await page.goto(`/${l}/`);
      await toBoard(page); await page.waitForTimeout(700);
      const r = await page.evaluate(() => [...document.querySelectorAll('#work .proj--sup .proj__text')].map((p) => parseFloat(getComputedStyle(p).fontSize)));
      expect(r).toHaveLength(2); for (const px of r) expect(px).toBeGreaterThanOrEqual(16);
      const clip = await page.evaluate(() => [...document.querySelectorAll('#work .proj__body, #work .wj-note')].some((b) => b.scrollHeight > b.clientHeight + 1));
      expect(clip).toBe(false);
      for (const p of projects) await expect(page.locator(`#work [data-p="${p.id}"] .proj__text`)).toHaveText(p.context[l]); // the full text, not a truncation
    });
  }
  test('enlarged root text: natural flow (no fixed-height board), nothing clipped, no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/de/');
    await page.addStyleTag({ content: 'html{font-size:200%}' });
    await page.waitForTimeout(500);
    expect(await geoLive(page)).toBe(false);
    expect(await page.evaluate(() => ({ clip: [...document.querySelectorAll('#work .proj__body, #work .wj-note')].some((b) => b.scrollHeight > b.clientHeight + 1), over: document.documentElement.scrollWidth - innerWidth }))).toEqual({ clip: false, over: 0 });
  });
  test('the work index and a service page keep their original layout (no connected header, no field grid)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/work/');
    expect(await page.locator('.wj-head, .grid--field').count()).toBe(0);
    expect(await page.locator('#projects .explain').count()).toBe(1);
    await page.goto('/en/services/video/');
    expect(await page.locator('.wj-head, .grid--field, .explain').count()).toBe(0);
    expect(await page.locator('#related-work .proj').count()).toBe(2);
  });
  test('the context sentence and "See all work" exist exactly once on the homepage, in every language', async ({ page }) => {
    for (const l of langs) {
      await page.goto(`/${l}/`);
      await expect(page.getByText(tr(l).work.explainer, { exact: true })).toHaveCount(1);
      await expect(page.locator(`#work a[href="/${l}/work/"]`)).toHaveCount(1);
    }
  });
  test('the dock asks the hero to hold only when the hero is actually on screen, and releases it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => { (window as unknown as { __holds: unknown[] }).__holds = []; document.addEventListener('odalo:hero-hold', (e) => (window as unknown as { __holds: unknown[] }).__holds.push((e as CustomEvent).detail)); });
    await page.setViewportSize({ width: 1440, height: 1900 }); // tall enough that the hero is still visible when the field arrives
    await page.goto('/en/');
    await page.evaluate(() => scrollBy(0, 600));
    await page.waitForTimeout(1500);
    const tall = (await page.evaluate(() => (window as unknown as { __holds: { source: string; hold: boolean }[] }).__holds)).filter((h) => h.source === 'work');
    expect(tall.map((h) => h.hold)).toEqual([true, false]);
    // normal window: the hero is off screen when the field docks, so no hold at all
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/de/#work'); // a different path: a full load with a fresh record
    await page.waitForTimeout(800);
    expect((await page.evaluate(() => (window as unknown as { __holds: { source: string }[] }).__holds)).filter((h) => h.source === 'work')).toEqual([]);
  });
  test('no JS: every Work link and all text is present and laid out; the connected header is plain content', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/en/');
    expect(await page.locator('#work a').count()).toBe(4);
    expect(await page.evaluate(() => [...document.querySelectorAll('#work h2, #work h3, #work p')].every((e) => getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().height > 0))).toBe(true);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#work [data-wj-peg]')!).transform)).toBe('none');
    await ctx.close();
  });
});
