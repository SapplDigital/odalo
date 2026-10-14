import { test, expect, type Page } from '@playwright/test';

/** Document 03 desktop table: [A, B] top row, [C, D] bottom row, in twelfths. */
const TABLE = {
  rest: { web: 7, local: 5, video: 5, ads: 7 },
  web: { web: 8, local: 4 },
  local: { web: 5, local: 7 },
  video: { video: 7, ads: 5 },
  ads: { video: 4, ads: 8 },
} as const;

const widths = (page: Page) =>
  page.evaluate(() => Object.fromEntries([...document.querySelectorAll<HTMLElement>('.tile')].map((t) => [t.dataset.service!, t.getBoundingClientRect().width])));
const metrics = (page: Page) =>
  page.evaluate(() => ({ h: document.querySelector('[data-mosaic]')!.getBoundingClientRect().height, doc: document.documentElement.scrollHeight, nextTop: document.querySelector('#work')!.getBoundingClientRect().top + scrollY }));

test.describe('service mosaic — desktop 1440', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('rest state is unequal 7/5 and 5/7', async ({ page }) => {
    await page.goto('/en/');
    const w = await widths(page);
    const rowTop = w.web! + w.local!, rowBot = w.video! + w.ads!;
    expect(Math.round((w.web! / rowTop) * 12)).toBe(7);
    expect(Math.round((w.video! / rowBot) * 12)).toBe(5);
  });

  for (const id of ['web', 'local', 'video', 'ads'] as const) {
    test(`hovering ${id} moves the shared edge per Document 03 and keeps layout stable`, async ({ page }) => {
      await page.goto('/en/');
      await page.locator('[data-mosaic]').scrollIntoViewIfNeeded();
      const before = await metrics(page);
      const box = (await page.locator(`.tile[data-service="${id}"]`).boundingBox())!;
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5, { steps: 5 });
      await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', id);
      await page.waitForTimeout(600);
      const w = await widths(page);
      const exp = TABLE[id] as Record<string, number>;
      for (const [k, twelfths] of Object.entries(exp)) {
        const row = k === 'web' || k === 'local' ? w.web! + w.local! : w.video! + w.ads!;
        expect(Math.round((w[k]! / row) * 12), `${k} width when ${id} active`).toBe(twelfths);
      }
      const after = await metrics(page);
      expect(after.h).toBe(before.h);            // mosaic height stable
      expect(after.doc).toBe(before.doc);        // page height stable
      expect(Math.abs(after.nextTop - before.nextTop)).toBeLessThan(1); // following section does not move
    });
  }

  test('no text clipping in any hover state (en/es/de)', async ({ page }) => {
    for (const lang of ['en', 'es', 'de']) {
      await page.goto(`/${lang}/`);
      await page.locator('[data-mosaic]').scrollIntoViewIfNeeded();
      for (const id of ['web', 'local', 'video', 'ads']) {
        const box = (await page.locator(`.tile[data-service="${id}"]`).boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
        await page.waitForTimeout(650);
        const clipped = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.tile')].filter((t) => {
          const r = t.getBoundingClientRect();
          return [...t.querySelectorAll<HTMLElement>('.tile__title,.tile__text,.tile__actions')].some((k) => k.getBoundingClientRect().bottom > r.bottom - 4 || k.getBoundingClientRect().right > r.right + 1);
        }).map((t) => t.dataset.service));
        expect(clipped, `${lang}/${id}`).toEqual([]);
      }
    }
  });

  test('moving along the rest edge does not flicker (tolerance + intent delay)', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-mosaic]').scrollIntoViewIfNeeded();
    const box = (await page.locator('[data-mosaic]').boundingBox())!;
    const edge = box.x + box.width * 0.5833;
    const y = box.y + box.height * 0.2;
    await page.mouse.move(edge - 80, y, { steps: 4 });
    await page.waitForTimeout(500);
    // Wiggle ±12px around the resting edge faster than the intent delay.
    const seen = new Set<string>();
    for (let i = 0; i < 24; i++) {
      await page.mouse.move(edge + (i % 2 ? 12 : -12), y);
      await page.waitForTimeout(25);
      seen.add((await page.locator('[data-mosaic]').getAttribute('data-active')) ?? '');
    }
    expect([...seen]).toEqual(['web']); // never toggled to local
  });

  test('pointer leaving resets to resting composition', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-mosaic]').scrollIntoViewIfNeeded();
    const box = (await page.locator('.tile[data-service="ads"]').boundingBox())!;
    await page.mouse.move(box.x + 100, box.y + 100, { steps: 4 });
    await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', 'ads');
    await page.mouse.move(5, 5);
    await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', '');
  });

  test('hover alone never opens the detail region', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-mosaic]').scrollIntoViewIfNeeded();
    const box = (await page.locator('.tile[data-service="web"]').boundingBox())!;
    await page.mouse.move(box.x + 50, box.y + 50, { steps: 4 });
    await page.waitForTimeout(500);
    await expect(page.locator('#svc-detail')).toBeHidden();
  });
});

test.describe('exploration, keyboard', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('keyboard: focus emphasises tile, Enter opens, Escape closes and restores focus', async ({ page }) => {
    await page.goto('/en/');
    const explore = page.locator('[data-explore="local"]');
    await explore.focus();
    await expect(page.locator('[data-mosaic]')).toHaveAttribute('data-active', 'local');
    await page.keyboard.press('Enter');
    await expect(explore).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#svc-detail')).toBeVisible();
    await expect(page.locator('[data-detail-for="local"]')).toBeVisible();
    await expect(page.locator('[data-detail-for="web"]')).toBeHidden();
    await expect(explore).toBeFocused(); // focus stays on the control
    // Tab to the detail close button and press Escape from inside the region.
    await page.locator('[data-detail-for="local"] [data-close]').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#svc-detail')).toBeHidden();
    await expect(explore).toHaveAttribute('aria-expanded', 'false');
    await expect(explore).toBeFocused();
  });

  test('Space activates and only one detail region is open at a time', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-explore="web"]').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-detail-for="web"]')).toBeVisible();
    await page.locator('[data-explore="ads"]').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-detail-for="ads"]')).toBeVisible();
    await expect(page.locator('[data-detail-for="web"]')).toBeHidden();
    await expect(page.locator('[data-explore="web"]')).toHaveAttribute('aria-expanded', 'false');
  });

  test('focus order is A, B, C, D and full service links work independently', async ({ page }) => {
    await page.goto('/en/');
    const order = await page.evaluate(() => [...document.querySelectorAll('.tile')].map((t) => (t as HTMLElement).dataset.service));
    expect(order).toEqual(['web', 'local', 'video', 'ads']);
    const link = page.locator('.tile[data-service="video"] .tile__link');
    await expect(link).toHaveAttribute('href', '/en/services/video/');
    await link.click();
    await expect(page).toHaveURL(/\/en\/services\/video\/$/);
    await expect(page.locator('h1')).toHaveText(/Video and content/);
  });

  test('all four details show heading, deliverables, related plan and full link', async ({ page }) => {
    await page.goto('/en/');
    for (const id of ['web', 'local', 'video', 'ads']) {
      await page.locator(`[data-explore="${id}"]`).click();
      const p = page.locator(`[data-detail-for="${id}"]`);
      await expect(p).toBeVisible();
      await expect(p.locator('h3')).not.toBeEmpty();
      expect(await p.locator('li').count()).toBeGreaterThanOrEqual(3);
      await expect(p.locator('.detail__full')).toHaveAttribute('href', `/en/services/${id}/`);
      await expect(p.locator('.detail__rel a')).toHaveAttribute('href', /\/en\/plans\/#plan-/);
    }
  });

  test('details open below the mosaic on desktop', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('[data-explore="web"]').click();
    const m = (await page.locator('[data-mosaic]').boundingBox())!;
    const d = (await page.locator('#svc-detail').boundingBox())!;
    expect(d.y).toBeGreaterThanOrEqual(m.y + m.height - 1);
  });
});

test.describe('touch and mobile 390', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('tap Explore reveals details inline after the tile; reading order kept', async ({ page }) => {
    await page.goto('/en/');
    const before = await page.evaluate(() => [...document.querySelectorAll('.tile')].map((t) => Math.round(t.getBoundingClientRect().width)));
    await page.locator('[data-explore="video"]').tap();
    await expect(page.locator('[data-detail-for="video"]')).toBeVisible();
    const after = await page.evaluate(() => [...document.querySelectorAll('.tile')].map((t) => Math.round(t.getBoundingClientRect().width)));
    expect(after).toEqual(before); // widths never change in the single-column layout
    const adjacent = await page.evaluate(() => document.querySelector('.tile[data-service="video"]')!.nextElementSibling?.id);
    expect(adjacent).toBe('svc-detail');
  });

  test('touch never changes geometry; essential content is visible before any tap', async ({ page }) => {
    await page.goto('/en/');
    const tile = page.locator('.tile[data-service="local"]');
    await expect(tile.locator('.tile__title')).toBeVisible();
    await expect(tile.locator('.tile__text')).toBeVisible();
    await expect(tile.locator('.tile__link')).toBeVisible();
    const w = await tile.evaluate((e) => e.getBoundingClientRect().width);
    const vw = await page.evaluate(() => innerWidth);
    expect(w).toBeGreaterThan(vw - 60); // single full-width column
  });

  test('closing returns the detail to the slot and focus to the control', async ({ page }) => {
    await page.goto('/en/');
    const b = page.locator('[data-explore="web"]');
    await b.tap();
    await page.locator('[data-detail-for="web"] [data-close]').tap();
    await expect(page.locator('#svc-detail')).toBeHidden();
    await expect(b).toBeFocused();
  });
});

test.describe('reduced motion', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  test('transitions are disabled yet every action still works', async ({ page }) => {
    await page.goto('/en/');
    const dur = await page.locator('.row--top').evaluate((e) => getComputedStyle(e).transitionDuration);
    expect(parseFloat(dur)).toBeLessThan(0.05);
    // hero pieces are final immediately
    const op = await page.locator('.hero .piece').first().evaluate((e) => getComputedStyle(e).opacity);
    expect(op).toBe('1');
    await page.locator('[data-explore="ads"]').click();
    await expect(page.locator('[data-detail-for="ads"]')).toBeVisible();
    // process connector shown without drawing animation
    await page.locator('#process').scrollIntoViewIfNeeded();
    await expect(page.locator('.steps')).toHaveClass(/is-in/);
  });
});

test('essential content is present when JavaScript fails', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('/en/');
  await expect(page.locator('h1')).toContainText('closer to');
  for (const id of ['web', 'local', 'video', 'ads']) {
    await expect(page.locator(`.tile[data-service="${id}"] .tile__title`)).toBeVisible();
    await expect(page.locator(`.tile[data-service="${id}"] .tile__link`)).toBeVisible();
  }
  await expect(page.locator('[data-explore]').first()).toBeHidden(); // inert control hidden without JS
  await expect(page.locator('#plans .plan').first()).toBeVisible();
  await expect(page.locator('.steps .step').first()).toBeVisible();
  await ctx.close();
});
