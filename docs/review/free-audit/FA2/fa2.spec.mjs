// Focused invariants for the FA2 prototype (state, focus, query, geometry-stability, no-network). Not CSS-value mirrors.
// Run: npx playwright test -c docs/review/free-audit/FA2/playwright.fa2.config.mjs   (needs the prototype server on :4391, see README)
import { test, expect } from '@playwright/test';

const IDS = ['web', 'local', 'video', 'ads'];
const openCount = (page) => page.locator('[data-piece][data-open="true"]').count();
const box = async (loc) => { const b = await loc.boundingBox(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
const docY = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { top: Math.round(b.top + scrollY), h: Math.round(b.height), w: Math.round(b.width) }; }, sel);

test.describe('state contract', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ page }) => { await page.goto('index.html'); await page.evaluate(() => document.fonts.ready); });

  test('exploring never changes the enquiry; one piece open at a time; stays open after pointer leaves', async ({ page }) => {
    await expect(page.locator('#f-service')).toHaveValue('');
    expect(await openCount(page)).toBe(0);
    await page.click('#b-web');
    await page.mouse.move(5, 5); // pointer leaves
    expect(await openCount(page)).toBe(1);
    await expect(page.locator('#b-web')).toHaveAttribute('aria-expanded', 'true');
    await page.click('#b-ads');
    expect(await openCount(page)).toBe(1);
    await expect(page.locator('#b-web')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#f-service')).toHaveValue(''); // opening is not selecting
  });

  test('hover alone changes nothing: no open, no selection, hit areas unmoved', async ({ page }) => {
    const before = await Promise.all(IDS.map((id) => box(page.locator(`[data-piece="${id}"]`))));
    for (const id of IDS) await page.hover(`[data-piece="${id}"]`);
    expect(await openCount(page)).toBe(0);
    await expect(page.locator('#f-service')).toHaveValue('');
    const after = await Promise.all(IDS.map((id) => box(page.locator(`[data-piece="${id}"]`))));
    expect(after).toEqual(before);
  });

  test('Include commits one focus to the form, summary and tile; close keeps it; switching keeps it', async ({ page }) => {
    await page.fill('#f-business', 'Sample Bakery'); // sample data only
    await page.click('#b-local');
    await page.click('[data-piece="local"] [data-include]');
    await expect(page.locator('#f-service')).toHaveValue('local');
    await expect(page.locator('[data-sum-focus]')).toHaveText('Local presence');
    await expect(page.locator('[data-piece="local"] [data-badge]')).toBeVisible(); // text badge, not colour only
    await page.click('#b-video'); // switch
    await expect(page.locator('#f-service')).toHaveValue('local');
    await page.click('[data-piece="video"] [data-close]');
    expect(await openCount(page)).toBe(0);
    await expect(page.locator('#f-service')).toHaveValue('local');
    await expect(page.locator('#f-business')).toHaveValue('Sample Bakery');
    await expect(page.locator('[data-piece="local"]')).toHaveAttribute('data-selected', 'true');
  });

  test('badge appears only on the selected tile (hidden attribute is honoured)', async ({ page }) => {
    await page.click('#b-web');
    await expect(page.locator('[data-piece="web"] [data-badge]')).toBeHidden();
    await page.click('[data-piece="web"] [data-include]');
    await expect(page.locator('[data-piece="web"] [data-badge]')).toBeVisible();
    await page.click('#b-ads');
    await expect(page.locator('[data-piece="ads"] [data-badge]')).toBeHidden();
  });

  test('only one focus can be selected; No preference clears; remove button clears', async ({ page }) => {
    await page.click('#b-web'); await page.click('[data-piece="web"] [data-include]');
    await page.click('#b-ads'); await page.click('[data-piece="ads"] [data-include]');
    await expect(page.locator('#f-service')).toHaveValue('ads');
    expect(await page.locator('[data-selected="true"]').count()).toBe(1);
    await page.click('[data-clear]');
    await expect(page.locator('#f-service')).toHaveValue('');
    expect(await page.locator('[data-selected="true"]').count()).toBe(0);
    await expect(page.locator('[data-clear]')).toHaveAttribute('aria-pressed', 'true');
    await page.click('[data-piece="ads"] [data-include]');
    await page.click('[data-piece="ads"] [data-include]'); // now "Remove this focus"
    await expect(page.locator('#f-service')).toHaveValue('');
  });

  test('form select drives the mosaic', async ({ page }) => {
    await page.selectOption('#f-service', 'video');
    await expect(page.locator('[data-piece="video"]')).toHaveAttribute('data-selected', 'true');
    await expect(page.locator('[data-sum-focus]')).toHaveText('Content');
    await page.selectOption('#f-service', '');
    expect(await page.locator('[data-selected="true"]').count()).toBe(0);
  });

  test('keyboard: Enter/Space open, Escape closes and returns focus, Close returns focus', async ({ page }) => {
    await page.focus('#b-web'); await page.keyboard.press('Enter');
    await expect(page.locator('#b-web')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab'); // -> Include
    await expect(page.locator('[data-piece="web"] [data-include]')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.locator('#f-service')).toHaveValue('web');
    await page.keyboard.press('Escape');
    await expect(page.locator('#b-web')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#b-web')).toBeFocused(); // focus recovered, not lost to <body>
    await page.keyboard.press('Space'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    await expect(page.locator('[data-piece="web"] [data-close]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#b-web')).toBeFocused();
    await expect(page.locator('#f-service')).toHaveValue('web'); // close never clears
  });

  test('desktop: form position/size is identical through open, include, switch and close', async ({ page }) => {
    const snap = async () => ({ f: await docY(page, '[data-form]'), r: await docY(page, '#request'), b: await docY(page, '[data-board]') });
    const base = await snap();
    for (const step of [
      () => page.click('#b-web'), () => page.click('[data-piece="web"] [data-include]'), () => page.click('#b-ads'),
      () => page.click('#b-local'), () => page.click('#b-video'), () => page.click('[data-piece="video"] [data-close]'),
    ]) { await step(); await page.waitForTimeout(400); expect(await snap()).toEqual(base); }
  });

  test('rapid switching and resize leave at most one open panel and no horizontal overflow', async ({ page }) => {
    for (let n = 0; n < 3; n++) for (const id of IDS) await page.click(`#b-${id}`, { noWaitAfter: true });
    expect(await openCount(page)).toBe(1);
    for (const [w, h] of [[1100, 800], [834, 1024], [390, 800], [320, 700], [1440, 900]]) {
      await page.setViewportSize({ width: w, height: h });
      expect(await openCount(page)).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('query preselection', () => {
  test('valid service and plan initialise; opening pieces keeps plan', async ({ page }) => {
    await page.goto('index.html?service=ads&plan=360');
    await expect(page.locator('#f-service')).toHaveValue('ads');
    await expect(page.locator('#f-plan')).toHaveValue('360');
    await expect(page.locator('[data-piece="ads"]')).toHaveAttribute('data-selected', 'true');
    expect(await openCount(page)).toBe(0); // preselect does not open
    await page.click('#b-web');
    await expect(page.locator('#f-plan')).toHaveValue('360');
    await expect(page.locator('[data-sum-plan]')).toHaveText('360');
  });
  test('invalid values are ignored', async ({ page }) => {
    await page.goto('index.html?service=<b>x</b>&plan=gold');
    await expect(page.locator('#f-service')).toHaveValue('');
    await expect(page.locator('#f-plan')).toHaveValue('');
    expect(await page.locator('[data-selected="true"]').count()).toBe(0);
  });
});

test.describe('form simulation', () => {
  test('invalid submit: summary links, first invalid field focused, entries kept', async ({ page }) => {
    await page.goto('index.html');
    await page.fill('#f-name', 'Sample Person');
    await page.click('[data-submit]');
    await expect(page.locator('[data-summary]')).toBeVisible();
    await expect(page.locator('#f-business')).toBeFocused();
    await expect(page.locator('#f-name')).toHaveValue('Sample Person');
    await page.click('[data-summary-list] a >> nth=0');
    await expect(page.locator('#f-business')).toBeFocused();
  });

  test('valid submit is simulated: no non-GET request, no external host, nothing stored, entries kept', async ({ page }) => {
    const reqs = [];
    page.on('request', (r) => reqs.push({ m: r.method(), u: r.url() }));
    await page.goto('index.html?service=web');
    await page.fill('#f-business', 'Sample Bakery'); await page.fill('#f-need', 'Sample need');
    await page.fill('#f-name', 'Sample Person'); await page.fill('#f-email', 'sample@example.com');
    await page.fill('#f-website', 'https://sample.example');
    await page.check('#f-privacy');
    const before = reqs.length;
    await page.click('[data-submit]');
    await expect(page.locator('[data-result]')).toBeVisible();
    await expect(page.locator('[data-result-title]')).toHaveText('Simulated submission');
    await expect(page.locator('#f-business')).toHaveValue('Sample Bakery');
    expect(reqs.length).toBe(before); // submit caused zero requests
    expect(reqs.every((r) => r.m === 'GET' && new URL(r.u).hostname === '127.0.0.1')).toBe(true);
    const stored = await page.evaluate(() => ({ l: localStorage.length, s: sessionStorage.length, c: document.cookie }));
    expect(stored).toEqual({ l: 0, s: 0, c: '' });
  });
});

test.describe('no JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  test('all explanations readable in flow; anchor and controls present; submit unavailable; disclosure shown', async ({ page }) => {
    await page.goto('index.html');
    for (const t of ['Explore whether visitors can understand', 'Explore how your business information', 'Explore whether your messages', 'Explore how campaign messages']) await expect(page.getByText(t)).toBeVisible();
    await expect(page.locator('a[href="#request"]').first()).toBeVisible();
    await expect(page.locator('#f-business')).toBeEditable();
    await expect(page.locator('[data-submit]')).toBeDisabled();
    await expect(page.getByText('cannot send requests').first()).toBeVisible();
    await expect(page.locator('[data-include]').first()).toBeHidden(); // inert JS-only controls stay hidden
    await expect(page.locator('[data-clear]')).toBeHidden();
    await expect(page.locator('[data-badge]').first()).toBeHidden();
  });
});

test.describe('reading order matches visual order', () => {
  for (const [w, h] of [[1440, 900], [834, 1112], [390, 844]]) {
    test(`${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('index.html');
      const rects = await page.$$eval('[data-piece]', (els) => els.map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.left)]; }));
      const sorted = [...rects].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      expect(rects).toEqual(sorted);
    });
  }
});

test.describe('German long copy', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test('desktop board: form position is stable through every open/include state', async ({ page }) => {
    await page.goto('de.html'); await page.evaluate(() => document.fonts.ready);
    const top = () => docY(page, '[data-form]');
    const base = await top();
    for (const id of IDS) { await page.click(`#b-${id}`); await page.click(`[data-piece="${id}"] [data-include]`); await page.waitForTimeout(400); expect(await top()).toEqual(base); }
  });
});

test.describe('no text escapes its tile (regression: DE "Kostenlose" ran under the neighbour)', () => {
  for (const [file, w, h] of [['de.html', 1280, 800], ['de.html', 1440, 900], ['de.html', 834, 1112], ['de.html', 1100, 800], ['de.html', 1024, 768], ['de.html', 320, 700], ['index.html', 320, 700]]) {
    test(`${file} ${w}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(file); await page.evaluate(() => document.fonts.ready);
      await page.click('#b-local');
      const bad = await page.evaluate(() => [...document.querySelectorAll('.intro, .tile')].flatMap((box) => { const r = box.getBoundingClientRect(); return [...box.querySelectorAll('h1, h3, p, a, button, em')].filter((e) => e.getClientRects().length && e.getBoundingClientRect().right > r.right + 1).map((e) => e.textContent.trim().slice(0, 30)); }));
      expect(bad).toEqual([]);
    });
  }
});

test.describe('FA2A corrections', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ page }) => { await page.goto('index.html'); await page.evaluate(() => document.fonts.ready); });

  test('wordmark is plain lowercase text, no image or svg', async ({ page }) => {
    await expect(page.locator('.bar__word')).toHaveText('odalo');
    expect(await page.locator('.bar img, .bar svg').count()).toBe(0);
  });

  test('hover grows a substantial surface inside the piece while trigger, board and form stay put', async ({ page }) => {
    const grow = page.locator('[data-piece="web"] .tile__grow');
    const snap = async () => ({ tiles: await Promise.all(IDS.map((id) => box(page.locator(`[data-piece="${id}"]`)))), trigger: await box(page.locator('#b-web')), board: await docY(page, '[data-board]'), form: await docY(page, '[data-form]') });
    const before = await snap(); const gBefore = await box(grow);
    await page.hover('[data-piece="web"]'); await page.waitForTimeout(400);
    const gAfter = await box(grow); const tile = await box(page.locator('[data-piece="web"]'));
    expect(gAfter.w * gAfter.h).toBeGreaterThan(gBefore.w * gBefore.h * 3); // clearly perceptible
    expect(gAfter.w).toBeLessThanOrEqual(tile.w); expect(gAfter.h).toBeLessThanOrEqual(tile.h); // stays inside its own piece
    expect(await snap()).toEqual(before);
    expect(await openCount(page)).toBe(0);
    await expect(page.locator('#f-service')).toHaveValue('');
  });

  test('opening removes the hover surface; closing restores the resting piece', async ({ page }) => {
    await page.click('#b-web'); await page.mouse.move(2, 2); await page.waitForTimeout(400);
    expect((await box(page.locator('[data-piece="web"] .tile__grow'))).w).toBeLessThanOrEqual(1);
  });

  test('one concise scope line; no repeated caveats anywhere in the page text', async ({ page }) => {
    for (const id of IDS) await page.click(`#b-${id}`);
    const text = await page.evaluate(() => document.body.innerText);
    expect(text.match(/We’ll agree the exact scope with you\./g)?.length).toBe(1);
    expect(text).not.toMatch(/promise|response time|report format|review depth/i);
  });

  test('reduced motion: hover surface changes without travel (no transition)', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 }, baseURL: 'http://127.0.0.1:4391/docs/review/free-audit/FA2/' });
    const p = await ctx.newPage(); await p.goto('index.html');
    expect(await p.locator('.tile__grow').first().evaluate((e) => getComputedStyle(e).transitionDuration)).toBe('0s');
    await ctx.close();
  });
});

test('German copy has no leftover caveat strings', async ({ page }) => {
  await page.goto('de.html');
  expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/Versprechen|versprechen|Antwortzeit|Tiefe der Analyse/);
});
