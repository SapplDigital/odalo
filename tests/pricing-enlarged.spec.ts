import { test, expect, type Page } from '@playwright/test';
import { plans, features } from '../src/content/plans';
import { formatPrice } from '../src/i18n';
import { tr } from '../src/i18n/ui';

// Enlargement here is a ROOT-FONT-SIZE SIMULATION: an injected `html{font-size:N%!important}` rule. It scales every rem-based size
// but, unlike the browser's own text-size setting, does not move the em-based breakpoints (see docs/review/pricing-mosaic/correction/README.md
// for a run with the real browser setting). Page-level overflow outside pricing (hero, work, FAQ, conditions, final CTA) is recorded as an
// annotation, not asserted: it belongs to the later responsive task.
type Lang = 'en' | 'es' | 'de';

async function pricingBounds(page: Page, lang: Lang) {
  await page.evaluate(() => document.querySelectorAll<HTMLDetailsElement>('.cmpd details').forEach((d) => (d.open = true)));
  await page.waitForTimeout(250);
  const t = tr(lang);
  return page.evaluate(({ expectedPrices, labels, yes, no }) => {
    const bad: string[] = [];
    const W = innerWidth;
    const sec = document.querySelector('#plans')!;
    if (sec.scrollWidth > sec.clientWidth) bad.push(`#plans scrollWidth ${sec.scrollWidth} > ${sec.clientWidth}`);
    const vis = (e: Element) => !!(e as HTMLElement).getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
    // (1) every visible text fragment lies inside its panel / disclosure and inside the viewport
    const walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode as Text;
      if (!n.textContent!.trim() || !n.parentElement || !vis(n.parentElement)) continue;
      const host = n.parentElement.closest('.plan, .cmpd__item');
      if (!host) continue;
      // text must stay inside the panel's CONTENT box (its padding is not available for text), not merely inside its border box
      const hb = host.getBoundingClientRect(), cs = getComputedStyle(host), rg = document.createRange();
      const h = { left: hb.left + parseFloat(cs.paddingLeft), right: hb.right - parseFloat(cs.paddingRight) };
      rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) if (r.width && (r.right > h.right + 0.5 || r.left < h.left - 0.5 || r.right > W + 0.5 || r.left < -0.5)) bad.push(`text "${n.textContent!.trim().slice(0, 24)}" in ${host.id || host.className}`);
    }
    // (2) every visible element box (badges, prices, list markers, buttons) lies inside its panel / disclosure
    for (const e of sec.querySelectorAll('.plan *, .cmpd__item *')) {
      if (!vis(e) || e.closest('svg')) continue;
      const host = e.closest('.plan, .cmpd__item')!, hb = host.getBoundingClientRect(), cs = getComputedStyle(host), r = e.getBoundingClientRect();
      const h = { left: hb.left + parseFloat(cs.paddingLeft), right: hb.right - parseFloat(cs.paddingRight) };
      if (r.width && (r.right > h.right + 0.5 || r.left < h.left - 0.5)) bad.push(`box ${e.tagName}.${(e as HTMLElement).className}`);
    }
    for (const d of sec.querySelectorAll('.cmpd')) if (vis(d) && d.scrollWidth > d.clientWidth + 1) bad.push('.cmpd scrolls sideways');
    // (3) full prices and usable controls
    document.querySelectorAll<HTMLElement>('.plan__amount').forEach((a, i) => {
      if (a.textContent!.replace(/\s/g, '') !== expectedPrices[i].replace(/\s/g, '')) bad.push(`price ${a.textContent} != ${expectedPrices[i]}`);
    });
    document.querySelectorAll<HTMLElement>('.plan__cta, .cmpd summary').forEach((c) => {
      if (!vis(c)) return; // the inactive comparison presentation is display:none
      const r = c.getBoundingClientRect();
      if (r.left < 0 || r.right > W || r.height < 44) bad.push(`control ${c.className || c.tagName} ${Math.round(r.left)}-${Math.round(r.right)} h${Math.round(r.height)}`);
    });
    // (4) every comparison, open: each feature/value pair present, in order, visible and inside its row (only where disclosures are the active presentation)
    const narrow = vis(document.querySelector('.cmpd')!);
    document.querySelectorAll<HTMLElement>(narrow ? '.cmpd__item' : '.nothing').forEach((item, pi) => {
      const rows = [...item.querySelectorAll('.cmpd__row')];
      if (rows.length !== labels.length) bad.push(`${item.id}: ${rows.length} rows`);
      rows.forEach((row, fi) => {
        const dt = row.querySelector('dt')!, dd = row.querySelector('dd')!;
        const v = labels[fi].values[pi];
        const want = v === true ? yes : v === false ? no : v;
        if (dt.textContent!.trim() !== labels[fi].label) bad.push(`${item.id} label ${dt.textContent}`);
        if (dd.textContent!.replace(/\s+/g, ' ').trim() !== want) bad.push(`${item.id} value "${dd.textContent!.trim()}" != "${want}"`);
        const rr = row.getBoundingClientRect();
        for (const x of [dt, dd]) { const r = x.getBoundingClientRect(); if (!r.width || !r.height || r.right > rr.right + 0.5 || r.left < rr.left - 0.5) bad.push(`${item.id} ${x.tagName} outside row`); }
      });
    });
    return bad;
  }, {
    expectedPrices: plans.map((p) => formatPrice(p.price, lang)),
    labels: features.map((f) => ({ label: f.label[lang], values: plans.map((p) => { const v = f.values[p.id]; return typeof v === 'boolean' ? v : v[lang]; }) })),
    yes: t.common.yes, no: t.common.no,
  });
}

test.describe('enlarged text keeps pricing readable and inside its panels (root-font-size simulation)', () => {
  const cases: [number, Lang, number][] = [];
  for (const lang of ['en', 'es', 'de'] as const) cases.push([320, lang, 200], [390, lang, 200], [320, lang, 100]);
  cases.push([834, 'de', 200], [1440, 'de', 200]);
  for (const [w, lang, pct] of cases) {
    test(`${lang} ${w}px at ${pct}% text`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`/${lang}/plans/`);
      if (pct !== 100) await page.addStyleTag({ content: `html{font-size:${pct}%!important}` });
      await page.waitForTimeout(250);
      expect(await pricingBounds(page, lang)).toEqual([]);
      const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      test.info().annotations.push({ type: 'page-level overflow outside pricing (px)', description: String(docOverflow) });
    });
  }

  test('320px at 200%: focus indicator on every summary is visible and inside the viewport; keyboard still toggles', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/de/plans/');
    await page.addStyleTag({ content: 'html{font-size:200%!important}' });
    for (const p of plans) {
      const s = page.locator(`#compare-${p.id} summary`);
      await s.focus();
      const o = await s.evaluate((e) => { const c = getComputedStyle(e), r = e.getBoundingClientRect(); return { w: parseFloat(c.outlineWidth), style: c.outlineStyle, left: r.left, right: r.right }; });
      expect(o.style).not.toBe('none');
      expect(o.w).toBeGreaterThanOrEqual(2);
      expect(o.left).toBeGreaterThanOrEqual(0);
      expect(o.right).toBeLessThanOrEqual(320);
      await page.keyboard.press('Enter');
      await expect(page.locator(`#compare-${p.id}`)).toHaveAttribute('open', '');
    }
  });

  test('320px at 200% without JavaScript: disclosures open and nothing overflows', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
    const page = await ctx.newPage();
    // scripting is off, so enlarge by rewriting the served HTML instead of injecting a style
    await page.route('**/de/plans/', async (route) => {
      const res = await route.fetch();
      await route.fulfill({ response: res, body: (await res.text()).replace('</head>', '<style>html{font-size:200%!important}</style></head>') });
    });
    await page.goto('/de/plans/');
    await page.locator('#compare-360 summary').click();
    await expect(page.locator('#compare-360 .cmpd__row')).toHaveCount(features.length);
    expect(await page.evaluate(() => { const s = document.querySelector('#plans')!; return s.scrollWidth <= s.clientWidth; })).toBe(true);
    await ctx.close();
  });

  test('exclusions: explicit lists only on the plans page; the homepage shows inclusions and the comparison', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await expect(page.locator('#plans .plan__not')).toHaveCount(0);
    await expect(page.locator('#plans .plan__list')).toHaveCount(4);
    await page.goto('/en/plans/');
    await expect(page.locator('#plans .plan__not')).toHaveCount(4);
    for (const p of plans) for (const x of p.notIncluded.en) await expect(page.locator(`#plan-${p.id} .plan__not`)).toContainText(x);
  });
});
