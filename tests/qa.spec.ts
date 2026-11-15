import { test, expect, type Page } from '@playwright/test';
import { auditInPage } from './helpers/reflow';

/**
 * Final UI QA regressions. Each test exists because the sweep in docs/review/final-ui-qa/ demonstrated a defect or a coverage gap:
 *  - focus stops partly below the window edge (audit form controls), found by the keyboard sweep;
 *  - German words breaking mid-word without a hyphen at 390/320 px in headings and labels, found by the responsive sweep.
 */

/** Tab through the page; after each stop wait for smooth scrolling to settle, then report stops whose box is hidden by the sticky header or cut by the window. */
async function tabProblems(page: Page, maxStops = 90) {
  const problems: string[] = [];
  let first = '';
  for (let i = 0; i < maxStops; i++) {
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => new Promise((res) => { let last = -1, n = 0; const t = () => { const y = scrollY; n = y === last ? n + 1 : 0; last = y; n >= 4 ? res(true) : requestAnimationFrame(t); }; t(); }));
    await page.waitForTimeout(200);
    const s = await page.evaluate(() => {
      const e = document.activeElement as HTMLElement | null;
      if (!e || e === document.body) return null;
      const r = e.getBoundingClientRect(), hb = document.querySelector('header')!.getBoundingClientRect().bottom;
      return { id: `${e.tagName.toLowerCase()}:${(e.getAttribute('aria-label') || e.textContent || e.getAttribute('id') || '').trim().replace(/\s+/g, ' ').slice(0, 30)}`, inHeader: !!e.closest('header') || e.classList.contains('skip-link'), top: r.top, bottom: r.bottom, hb, vh: innerHeight, ring: ((el: Element) => getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 2)(e) || (!!e.closest('.grid--field .proj') && ((el: Element) => getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 2)(e.closest('.grid--field .proj')!)) /* homepage Work cards show the ring around the whole card (the card is the hit area) */ };
    });
    if (!s) break;
    if (!first) first = s.id; else if (s.id === first) break;
    if (!s.ring) problems.push(`${s.id}: no visible focus ring`);
    if (!s.inHeader && s.top < s.hb - 1) problems.push(`${s.id}: under the sticky header`);
    // the browser's own focus scrolling may leave a tall control a few pixels short of the window edge; more than a quarter of it hidden is a defect
    const visible = Math.min(s.bottom, s.vh) - Math.max(s.top, s.inHeader ? 0 : s.hb);
    if (!s.inHeader && visible < (s.bottom - s.top) * 0.75) problems.push(`${s.id}: mostly outside the window (${Math.round(visible)} of ${Math.round(s.bottom - s.top)} px visible)`);
  }
  return problems;
}

test.describe('keyboard focus is clear of the sticky header and the window edge', () => {
  for (const [vw, vh] of [[1440, 900], [390, 844]] as const) {
    for (const url of ['/en/audit/', '/de/', '/en/plans/']) {
      test(`${vw}px ${url}: every Tab stop is fully in view with a visible ring`, async ({ page }) => {
        await page.setViewportSize({ width: vw, height: vh });
        await page.goto(url);
        expect(await tabProblems(page)).toEqual([]);
      });
    }
  }
});

/** For each text node of the elements, every line break inside a word must fall on a soft hyphen (so a hyphen is drawn); breaks at spaces and explicit hyphens are fine. */
async function barePartialWords(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const out: string[] = [];
    for (const el of document.querySelectorAll(sel)) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode as Text, t = n.textContent!;
        let prevTop: number | null = null;
        for (let i = 0; i < t.length; i++) {
          const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1);
          const rect = r.getClientRects()[0]; if (!rect || !rect.width) continue;
          const top = Math.round(rect.top);
          if (prevTop !== null && top > prevTop + 4) {
            const before = t[i - 1] ?? '';
            if (before && !/[\s\u00ad\-–—]/.test(before) && !/[\s­]/.test(t[i] ?? '') && !/­/.test(t.slice(Math.max(0, i - 3), i))) out.push(`"${t.slice(Math.max(0, i - 8), i + 8)}" breaks mid-word`);
          }
          prevTop = top;
        }
      }
    }
    return out;
  }, selector);
}

test.describe('long German words break at soft hyphens, never bare mid-word', () => {
  test('de legal title, About principles heading and comparison labels at 390px (and 320 for the headings)', async ({ page }) => {
    for (const [vw, url, sel] of [[390, '/de/privacy/', 'main h1'], [320, '/de/privacy/', 'main h1'], [320, '/de/about/', '#pr-h'], [390, '/de/plans/', '.cmp dt, .cmp th, dt']] as const) {
      await page.setViewportSize({ width: vw, height: 800 });
      await page.goto(url);
      await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
      expect(await barePartialWords(page, sel), `${url} at ${vw}`).toEqual([]);
    }
  });

  test('the German form labels and error messages that contain "Datenschutzhinweise" break at soft hyphens at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/de/audit/');
    await page.locator('[data-submit]').click();
    await expect(page.locator('#e-privacy')).toBeVisible();
    expect(await barePartialWords(page, '.check label, #e-privacy')).toEqual([]);
  });

  test('the words carry soft hyphens in the content, so wrapping does not depend on a browser hyphenation dictionary', async ({ page }) => {
    await page.goto('/de/privacy/');
    expect(await page.locator('main h1').innerText()).toContain('\u00ad');
    await page.goto('/de/plans/');
    expect(await page.locator('main').innerHTML()).toContain('Bewertungs­management');
  });
});

test.describe('form error and result states do not overflow at narrow widths with enlarged text', () => {
  // found by the real 32 px browser-setting check: the German checkbox error ("...Datenschutzhinweise gelesen hast.") widened /de/audit/ to 376 px at 320 px
  for (const l of ['en', 'es', 'de'] as const) for (const [vw, pct] of [[320, 200], [390, 200], [320, 100]] as const) {
    test(`${l} ${vw}px at ${pct}% root font: the validation summary and every field error stay inside the viewport`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: 800 });
      await page.goto(`/${l}/audit/`);
      if (pct !== 100) await page.addStyleTag({ content: `html{font-size:${pct}%!important}` });
      await page.locator('[data-submit]').click();
      await expect(page.locator('[data-summary]')).toBeVisible();
      expect(await page.locator('.err:not([hidden])').count()).toBeGreaterThanOrEqual(5);
      expect(await page.evaluate(auditInPage)).toEqual([]);
    });
  }
});
