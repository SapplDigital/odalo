import { test, expect, type Page } from '@playwright/test';
import { plans, features } from '../src/content/plans';

const ids = plans.map((p) => p.id);
// page coordinates (hover/focus may scroll the viewport)
const box = async (page: Page, id: string) => page.locator(`#plan-${id}`).evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; });
const near = (a: number, b: number, tol = 1) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);

test.describe('pricing: one connected mosaic', () => {
  test('desktop 1440: 3/4/5 over a full-width 360, shared edges, no gutters, square internal corners, no hover movement', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/en/');
    const [b, l, c, f] = [await box(page, 'base'), await box(page, 'local'), await box(page, 'captacion'), await box(page, '360')];
    near(b.x + b.width, l.x); near(l.x + l.width, c.x); // shared vertical edges
    near(b.y, l.y); near(l.y, c.y); near(b.height, l.height); near(l.height, c.height);
    near(c.y + c.height, f.y); // 360 sits directly underneath
    near(f.x, b.x); near(f.x + f.width, c.x + c.width); // and spans the whole group
    const total = b.width + l.width + c.width;
    near(b.width / total, 3 / 12, 0.01); near(l.width / total, 4 / 12, 0.01); near(c.width / total, 5 / 12, 0.01);
    for (const id of ids) expect(await page.locator(`#plan-${id}`).evaluate((e) => getComputedStyle(e).borderRadius)).toBe('0px');
    const r = await page.locator('.plans').evaluate((e) => { const s = getComputedStyle(e); return [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius].map(parseFloat); });
    expect(r[0]).toBeGreaterThan(30); expect(r[2]).toBeGreaterThan(30); expect(r[1]).toBeLessThan(10); expect(r[3]).toBeLessThan(10);
    // names, prices and actions line up across the three top panels
    const tops = async (sel: string) => Promise.all(['base', 'local', 'captacion'].map(async (id) => (await page.locator(`#plan-${id} ${sel}`).boundingBox())!.y));
    for (const sel of ['.plan__name', '.plan__amount', '.plan__cta']) { const t = await tops(sel); near(t[0], t[1], 2); near(t[1], t[2], 2); }
    // adjoining light panels are distinguishable, Captación is navy
    const bg = await Promise.all(ids.map((id) => page.locator(`#plan-${id}`).evaluate((e) => getComputedStyle(e).backgroundColor)));
    expect(new Set(bg).size).toBe(4);
    expect(bg[2]).toBe('rgb(32, 59, 87)');
    // hover never moves or resizes anything
    const before = await Promise.all(ids.map((id) => box(page, id)));
    for (const id of ids) { await page.locator(`#plan-${id}`).hover(); await page.waitForTimeout(450); }
    expect(await Promise.all(ids.map((id) => box(page, id)))).toEqual(before);
  });

  for (const w of [1024, 834]) {
    test(`${w}px: balanced two-by-two, equal cells, no empty cell`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 1000 });
      await page.goto('/en/');
      const [b, l, c, f] = [await box(page, 'base'), await box(page, 'local'), await box(page, 'captacion'), await box(page, '360')];
      near(b.y, l.y); near(c.y, f.y); near(b.x, c.x); near(l.x, f.x);
      near(b.x + b.width, l.x); near(b.y + b.height, c.y);
      near(b.width, l.width); near(c.width, f.width); near(b.width, c.width);
      near(b.height, l.height); near(c.height, f.height);
      expect(b.width).toBeGreaterThan(330);
    });
  }

  test('390px: one connected column in order Base, Local, Captación, 360', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/en/');
    const bs = await Promise.all(ids.map((id) => box(page, id)));
    expect(ids).toEqual(['base', 'local', 'captacion', '360']);
    for (let i = 1; i < 4; i++) { near(bs[i].y, bs[i - 1].y + bs[i - 1].height); near(bs[i].x, bs[0].x); near(bs[i].width, bs[0].width); }
  });

  test('prices, intervals, inclusions and exclusions are unchanged and complete on the plans page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/en/plans/');
    for (const p of plans) {
      const a = page.locator(`#plan-${p.id}`);
      await expect(a.locator('.plan__per')).toHaveText('/month');
      for (const i of p.own.en) await expect(a).toContainText(i);
      for (const i of p.notIncluded.en) await expect(a).toContainText(i);
      await expect(a.locator('.plan__cta')).toHaveAttribute('data-track', 'plan_select');
      await expect(a.locator('.plan__cta')).toHaveAttribute('data-plan', p.id);
      await expect(a.locator('.plan__cta')).toHaveAttribute('href', new RegExp(`/en/audit/\\?plan=${p.id}$`));
    }
  });

  for (const [lang, word] of [['en', 'Example prices'], ['es', 'Precios de ejemplo'], ['de', 'Beispielpreise']] as const) {
    test(`${lang}: the example-price disclosure sits above the group and every plan points to it`, async ({ page }) => {
      await page.goto(`/${lang}/plans/`);
      await expect(page.locator('#plans .plans-sec__ex')).toHaveText(word);
      const note = page.locator('#plans-note');
      await expect(note).toBeVisible();
      expect((await note.boundingBox())!.y).toBeLessThan((await box(page, 'base')).y);
      for (const id of ids) await expect(page.locator(`#plan-${id}`)).toHaveAttribute('aria-describedby', 'plans-note');
    });
  }
});

test.describe('plan comparison: table wide, native disclosures narrow', () => {
  test('wide: the semantic table is the only presentation', async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 900 });
    await page.goto('/en/plans/');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.locator('.cmpd')).toBeHidden();
    expect(await page.locator('.cmpd summary').first().evaluate((e) => getComputedStyle(e.closest('.cmpd')!).display)).toBe('none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const cmp = page.locator('.cmp');
    expect(await cmp.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  });

  test('narrow: four summaries (name + price), the table is out of the tree, nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/en/plans/');
    await expect(page.getByRole('table')).toHaveCount(0);
    expect(await page.locator('.cmp').evaluate((e) => getComputedStyle(e).display)).toBe('none');
    const sums = page.locator('.cmpd summary');
    await expect(sums).toHaveCount(4);
    for (const p of plans) {
      const s = page.locator(`#compare-${p.id} summary`);
      await expect(s).toContainText(p.name);
      await expect(s).toContainText(String(p.price).replace(/(\d)(?=(\d{3})$)/, '$1,'));
      await expect(s).toContainText('/month');
      expect((await s.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    for (const p of plans) await page.locator(`#compare-${p.id} summary`).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.cmpd').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  });

  for (const lang of ['en', 'es', 'de'] as const) {
    test(`${lang}: both presentations come from the same data (every feature and value, including not-included)`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(`/${lang}/plans/`);
      for (const p of plans) await page.locator(`#compare-${p.id} summary`).click();
      const narrow = await page.evaluate(() => [...document.querySelectorAll('.cmpd__item')].map((d) => [...d.querySelectorAll('.cmpd__row')].map((r) => [r.querySelector('dt')!.textContent!.trim(), r.querySelector('dd')!.textContent!.replace(/\s+/g, ' ').trim()])));
      await page.setViewportSize({ width: 1280, height: 900 });
      const wide = await page.evaluate(() => [...document.querySelectorAll('.cmp tbody tr')].map((r) => [r.querySelector('th')!.textContent!.trim(), [...r.querySelectorAll('td')].map((td) => td.textContent!.replace(/\s+/g, ' ').trim())]));
      expect(narrow).toHaveLength(4); expect(wide).toHaveLength(features.length);
      narrow.forEach((rows, pi) => { expect(rows).toHaveLength(features.length); rows.forEach(([label, val], fi) => { expect(label).toBe(wide[fi][0]); expect(val).toBe((wide[fi][1] as string[])[pi]); }); });
      // not-included values are present, in the language of the page
      const no = (await page.evaluate(() => (document.querySelector('.cmp td .sr-only') as HTMLElement | null)?.textContent)) ?? '';
      expect(no.length).toBeGreaterThan(0);
    });
  }

  test('keyboard: summaries are reachable, Enter and Space toggle them, focus stays', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/en/plans/');
    const s = page.locator('#compare-local summary');
    await s.focus();
    await expect(s).toBeFocused();
    expect(await s.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page.locator('#compare-local')).toHaveAttribute('open', '');
    await expect(page.locator('#compare-local .cmpd__row')).toHaveCount(features.length);
    await page.keyboard.press('Space');
    await expect(page.locator('#compare-local')).not.toHaveAttribute('open', '');
    await expect(s).toBeFocused();
    await page.keyboard.press('Tab'); // next plan's summary is next in tab order
    await expect(page.locator('#compare-captacion summary')).toBeFocused();
  });

  test('without JavaScript the disclosures still open', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('/en/plans/');
    await page.locator('#compare-base summary').click();
    await expect(page.locator('#compare-base .cmpd__row').first()).toBeVisible();
    await expect(page.locator('#compare-base')).toContainText('Not included');
    await ctx.close();
  });

  test('wide: keyboard never lands in the hidden disclosures (and not in the table on narrow)', async ({ page }) => {
    for (const [w, hiddenSel] of [[1280, '.cmpd'], [390, '.cmp']] as const) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto('/en/plans/');
      const stops = await page.evaluate((sel) => {
        const out: boolean[] = [];
        const els = [...document.querySelectorAll<HTMLElement>(`${sel} summary, ${sel} [tabindex], ${sel} a, ${sel} button`)];
        for (const e of els) out.push(e.offsetParent !== null || getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0);
        return out;
      }, hiddenSel);
      expect(stops.every((v) => v === false)).toBe(true);
    }
  });
});
