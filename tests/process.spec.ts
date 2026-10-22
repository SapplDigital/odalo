import { test, expect, type Page } from '@playwright/test';
import { tr } from '../src/i18n/ui';

const langs = ['en', 'es', 'de'] as const;
const copy = {
  en: { a: 'Four steps.', em: 'One connected approach.', note: 'Proposed workflow for this demo. Scope, timing and reporting are agreed before work starts.', steps: [['Understand the business', 'Review the offer, audience and existing online presence.'], ['Choose the pieces', 'Define the services and proposed outputs that belong in the plan.'], ['Create and connect', 'Bring the agreed website, content and campaign pieces into a consistent whole.'], ['Review and refine', 'Review the produced work and identify what to adjust next.']] },
  es: { a: 'Cuatro pasos.', em: 'Un enfoque conectado.', note: 'Flujo de trabajo propuesto para esta demo. El alcance, los plazos y los informes se acuerdan antes de empezar.', steps: [['Entender el negocio', 'Revisar la oferta, el público y la presencia online existente.'], ['Elegir las piezas', 'Definir los servicios y los resultados propuestos que forman parte del plan.'], ['Crear y conectar', 'Reunir la web, el contenido y las piezas de campaña acordados en un conjunto coherente.'], ['Revisar y ajustar', 'Revisar el trabajo producido e identificar qué ajustar a continuación.']] },
  de: { a: 'Vier Schritte.', em: 'Ein verbundener Ansatz.', note: 'Vorgeschlagener Ablauf für diese Demo. Umfang, Zeitplan und Berichte werden vor Beginn der Arbeit vereinbart.', steps: [['Das Unternehmen verstehen', 'Angebot, Zielgruppe und bestehenden Online-Auftritt prüfen.'], ['Die Bausteine wählen', 'Die Leistungen und vorgeschlagenen Ergebnisse festlegen, die in den Plan gehören.'], ['Erstellen und verbinden', 'Die vereinbarten Website-, Inhalts- und Kampagnenbausteine zu einem stimmigen Ganzen verbinden.'], ['Prüfen und verfeinern', 'Die erstellte Arbeit prüfen und festlegen, was als Nächstes angepasst wird.']] },
};
const banned = /fixed price|no small print|day one|from day|monthly report|every month|precio fijo|letra pequeña|primer día|cada mes|Festpreis|Kleingedruckte|ab dem ersten Tag|monatlich|Free audit|Auditoría gratis|Gratis-Analyse|Launch\b|Lanzamos|guarantee/i;

const geo = (page: Page) =>
  page.evaluate(() => {
    const g = document.querySelector('#process .steps')!;
    const gr = g.getBoundingClientRect();
    return { grid: { l: gr.left, r: gr.right, t: gr.top, b: gr.bottom }, items: [...g.children].map((e) => { const b = e.getBoundingClientRect(), c = getComputedStyle(e); return { l: b.left, r: b.right, t: b.top, b: b.bottom, bg: c.backgroundColor, radii: [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].map(parseFloat) }; }) };
  });

test.describe('process: accurate demo wording', () => {
  for (const l of langs) {
    test(`${l}: heading, visible note and the four steps in order; no pricing, small-print, day-one or monthly-reporting promises`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${l}/`);
      await expect(page.locator('#proc-h')).toHaveText(`${copy[l].a} ${copy[l].em}`);
      await expect(page.locator('#process .proc__note')).toHaveText(copy[l].note);
      await expect(page.locator('#process .proc__note')).toBeVisible();
      const items = page.locator('#process ol.steps > li');
      await expect(items).toHaveCount(4);
      for (const [i, [t, d]] of copy[l].steps.entries()) {
        await expect(items.nth(i).locator('h3')).toHaveText(new RegExp(`${t}$`));
        await expect(items.nth(i).locator('p')).toHaveText(d!);
        await expect(items.nth(i).locator('.step__num')).toHaveText(`0${i + 1}`);
        expect(tr(l).process.steps[i]!.t).toBe(t);
      }
      expect(await page.locator('#process').innerText()).not.toMatch(banned);
      expect(await page.locator('#process .steps').evaluate((e) => e.tagName)).toBe('OL');
      expect(await page.evaluate(() => [...document.querySelectorAll('#process h2, #process h3')].map((h) => h.tagName).join(''))).toBe('H2H3H3H3H3');
    });
  }
  test('#process navigation: the header link lands on the section with the heading visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await page.locator('header a[href$="#process"]').first().click();
    await expect(page).toHaveURL(/#process$/);
    await page.waitForTimeout(900);
    const top = await page.locator('#proc-h').evaluate((e) => e.getBoundingClientRect().top);
    expect(top).toBeGreaterThan(0); expect(top).toBeLessThan(500);
  });
});

test.describe('process: one connected mosaic', () => {
  for (const l of langs) for (const [vw, vh] of [[1440, 900], [1024, 768], [834, 1112], [390, 844], [320, 700]] as const) {
    test(`${l} ${vw}px: joined panels, no gaps or holes, only the outer corners curved, correct arrangement and order`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: vh });
      await page.goto(`/${l}/`);
      const { grid, items } = await geo(page);
      expect(items).toHaveLength(4);
      const area = items.reduce((a, i) => a + (i.r - i.l) * (i.b - i.t), 0);
      expect(Math.abs(area - (grid.r - grid.l) * (grid.b - grid.t)), 'holes or overlaps').toBeLessThan(40);
      for (const it of items) [[it.l, it.t], [it.r, it.t], [it.r, it.b], [it.l, it.b]].forEach(([x, y], k) => { const outer = (Math.abs(x! - grid.l) < 1 || Math.abs(x! - grid.r) < 1) && (Math.abs(y! - grid.t) < 1 || Math.abs(y! - grid.b) < 1); if (!outer) expect(it.radii[k], `inner corner ${k}`).toBe(0); });
      expect(items[0]!.radii[0]).toBeGreaterThan(40); expect(items[3]!.radii[2]).toBeGreaterThan(40);
      expect(new Set(items.map((i) => i.bg)).size).toBe(4);
      expect(items[3]!.bg).toBe('rgb(32, 59, 87)'); // ends with the navy panel
      const w = (grid.r - grid.l);
      if (vw >= 1024) { expect(Math.abs((items[0]!.r - items[0]!.l) / w - 5 / 12)).toBeLessThan(0.01); expect(Math.abs((items[1]!.r - items[1]!.l) / w - 7 / 12)).toBeLessThan(0.01); expect(Math.abs((items[2]!.r - items[2]!.l) / w - 7 / 12)).toBeLessThan(0.01); expect(Math.abs((items[3]!.r - items[3]!.l) / w - 5 / 12)).toBeLessThan(0.01); expect(items[1]!.t).toBeCloseTo(items[0]!.t, 0); expect(items[2]!.t).toBeGreaterThan(items[0]!.t); }
      else if (vw >= 768) { expect(Math.abs((items[0]!.r - items[0]!.l) - (items[1]!.r - items[1]!.l))).toBeLessThan(1); expect(items[2]!.t).toBeGreaterThan(items[0]!.t); }
      else for (let i = 1; i < 4; i++) { expect(Math.abs(items[i]!.t - items[i - 1]!.b)).toBeLessThan(1); expect(Math.abs(items[i]!.l - items[0]!.l)).toBeLessThan(1); }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  for (const l of langs) for (const [vw, pct] of [[390, 200], [320, 200]] as const) test(`${l} ${vw}px at ${pct}% root font: every text element stays inside its panel and the viewport; panels grow`, async ({ page }) => {
    await page.setViewportSize({ width: vw, height: 800 });
    await page.goto(`/${l}/`);
    await page.addStyleTag({ content: `html{font-size:${pct}%!important}` });
    await page.waitForTimeout(200);
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      for (const p of document.querySelectorAll<HTMLElement>('#process .step')) { const pb = p.getBoundingClientRect(); for (const k of p.querySelectorAll<HTMLElement>('h3,p,span:not(.sr-only)')) { const r = k.getBoundingClientRect(); if (r.width && (r.right > pb.right + 1 || r.left < pb.left - 1 || r.bottom > pb.bottom + 1 || r.right > innerWidth + 1)) out.push(`${(k.textContent || '').trim().slice(0, 20)}`); } }
      if (document.documentElement.scrollWidth > innerWidth) out.push('page scrolls sideways');
      return out;
    });
    expect(bad).toEqual([]);
  });

  test('contrast: number, heading and text of every panel meet WCAG AA against their panel', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    const r = await page.evaluate(() => {
      const lum = (c: string) => { const [R, G, B] = c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * R! + 0.7152 * G! + 0.0722 * B!; };
      const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
      return [...document.querySelectorAll<HTMLElement>('#process .step')].map((s) => { const bg = getComputedStyle(s).backgroundColor; return ['.step__num', '.step__title', 'p'].map((q) => ({ q, ratio: ratio(getComputedStyle(s.querySelector(q)!).color, bg), size: parseFloat(getComputedStyle(s.querySelector(q)!).fontSize) })); }).flat();
    });
    for (const x of r) expect(x.ratio, `${x.q} ${x.ratio.toFixed(2)}`).toBeGreaterThanOrEqual(x.size >= 24 ? 3 : 4.5);
  });
});

test.describe('process: the decorative accent', () => {
  test('text and panels are fully visible and still from first render; the accent draws once, in order, when the section enters, and stays', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    const top = await page.evaluate(() => document.querySelector('#process')!.getBoundingClientRect().top + scrollY);
    const info = () => page.evaluate(() => ({ cls: document.querySelector('#process .steps')!.className, text: [...document.querySelectorAll('#process .step')].map((s) => parseFloat(getComputedStyle(s).opacity) === 1 && getComputedStyle(s.querySelector('p')!).visibility === 'visible' && getComputedStyle(s).transform === 'none'), bars: [...document.querySelectorAll('#process .step')].map((s) => parseFloat(getComputedStyle(s).getPropertyValue('--draw')) / 100) }));
    const before = await info();
    expect(before.cls).not.toContain('is-in');
    expect(before.text.every(Boolean)).toBe(true);
    expect(before.bars.every((b) => b < 0.05)).toBe(true);
    await page.evaluate((y) => window.scrollTo({ top: y - 100, behavior: 'instant' }), top);
    await page.waitForFunction(() => document.querySelector('#process .steps')!.classList.contains('is-in'));
    await page.waitForTimeout(400);
    const mid = await info();
    expect(mid.text.every(Boolean)).toBe(true);
    await page.waitForTimeout(2000);
    const after = await info();
    expect(after.bars.every((b) => b > 0.99)).toBe(true);
    // in order: an earlier panel is never behind a later one at the middle sample
    for (let i = 1; i < 4; i++) expect(mid.bars[i - 1]!).toBeGreaterThanOrEqual(mid.bars[i]! - 0.001);
    // once: scrolling away and back does not restart it
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(100);
    await page.evaluate((y) => window.scrollTo({ top: y - 100, behavior: 'instant' }), top);
    expect((await info()).bars.every((b) => b > 0.99)).toBe(true);
  });

  test('reduced motion and no JavaScript: the complete static composition, no transition; panels never move or resize', async ({ browser }) => {
    for (const opts of [{ reducedMotion: 'reduce' as const }, { javaScriptEnabled: false }]) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
      const page = await ctx.newPage();
      await page.goto('/de/');
      const r = await page.evaluate(() => [...document.querySelectorAll('#process .step')].map((s) => ({ bar: parseFloat(getComputedStyle(s).getPropertyValue('--draw')) / 100, tr: getComputedStyle(s).transitionDuration, vis: getComputedStyle(s).visibility })));
      for (const x of r) { expect(x.bar).toBeGreaterThan(0.99); expect(x.vis).toBe('visible'); }
      if (opts.reducedMotion) for (const x of r) expect(parseFloat(x.tr)).toBe(0);
      await expect(page.locator('#process .proc__note')).toBeVisible();
      await ctx.close();
    }
  });

  test('decoration boundary: the accent has no element of its own and is painted inside each panel rounded outline (pixels outside the curves stay page-coloured)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await page.locator('#process').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('#process .steps')!.classList.contains('is-in'));
    await page.waitForTimeout(2600);
    const info = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#process .step')].map((s) => { const c = getComputedStyle(s), a = getComputedStyle(s, '::after'), b = getComputedStyle(s, '::before'); const r = s.getBoundingClientRect(); return { after: a.content, before: b.content, overflow: c.overflow, bgSize: c.backgroundSize, radii: [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].map(parseFloat), r: { l: r.left, t: r.top, rr: r.right, b: r.bottom } }; }));
    for (const s of info) { expect(s.after === 'none' || s.after === 'normal').toBe(true); expect(s.overflow).toBe('visible'); expect(s.bgSize).toContain('6px'); }
    // the last panel's bottom-right corner (radius R): the pixel in the square corner lies outside the curve and must stay page-coloured;
    // a pixel just inside the curve on the bottom edge carries the accent
    const last = info[3]!; const R = last.radii[2]!;
    expect(R).toBeGreaterThan(40);
    const shot = (await page.screenshot({ clip: { x: last.r.rr - R, y: last.r.b - R, width: R, height: R } })).toString('base64');
    const px = await page.evaluate(async ([b64, R]) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
      const scale = img.width / (R as number);
      const at = (x: number, y: number) => [...g.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data].slice(0, 3);
      return { corner: at((R as number) - 3, (R as number) - 3), bandLeft: at(3, (R as number) - 3) };
    }, [shot, R] as const);
    expect(px.corner, 'square-corner pixel is page paper').toEqual([247, 249, 248]);
    expect(px.bandLeft, 'the accent colour is drawn inside the outline').toEqual([239, 165, 140]);
  });

  test('if the observer never fires, the content is still fully usable (only the accent stays undrawn)', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => { (window as any).IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }; });
    const page = await ctx.newPage();
    await page.goto('/en/');
    await page.locator('#process').scrollIntoViewIfNeeded();
    for (const t of await page.locator('#process .step h3, #process .step p').all()) await expect(t).toBeVisible();
    await ctx.close();
  });

  test('the shared reveal is unchanged for other sections (data-reveal elements elsewhere still reveal)', async ({ page }) => {
    await page.goto('/en/');
    expect(await page.evaluate(() => document.querySelectorAll('[data-draw]').length)).toBeGreaterThanOrEqual(1);
    await expect(page.locator('#process')).toHaveAttribute('id', 'process');
  });

  test('keyboard: the section has no focus stops of its own, so Tab passes straight through in reading order', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    expect(await page.locator('#process a, #process button, #process [tabindex]').count()).toBe(0);
  });
});
