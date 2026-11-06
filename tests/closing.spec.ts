import { test, expect, type Page } from '@playwright/test';
// eslint-disable-next-line
import fs from 'node:fs';
import { tr } from '../src/i18n/ui';
import { legalCopy } from '../src/content/legal';

const langs = ['en', 'es', 'de'] as const;
const demo = {
  en: { body: 'Explore the example enquiry form. Submissions are simulated and are not sent.', button: 'View example enquiry form', contact: 'Contact details are not published in this demo.', cookieH: 'Managing browser storage' },
  es: { body: 'Explora el formulario de consulta de ejemplo. Los envíos son simulados y no se envían.', button: 'Ver el formulario de consulta de ejemplo', contact: 'Los datos de contacto no se publican en esta demo.', cookieH: 'Cómo gestionar el almacenamiento del navegador' },
  de: { body: 'Sieh dir das Beispiel-Anfrageformular an. Absendungen werden simuliert und nicht gesendet.', button: 'Beispiel-Anfrageformular ansehen', contact: 'Kontaktdaten werden in dieser Demo nicht veröffentlicht.', cookieH: 'Browserspeicher verwalten' },
};
const storage = {
  en: 'This demo remembers your language in this browser. Analytics and marketing tracking are disabled.',
  es: 'Esta demo recuerda tu idioma en este navegador. El seguimiento analítico y de marketing está desactivado.',
  de: 'Diese Demo merkt sich deine Sprache in diesem Browser. Analyse- und Marketing-Tracking sind deaktiviert.',
};
const stale = /use the audit form|usa el formulario de auditoría|Nutze vorerst das Analyse-Formular|Noch zu bestätigen|Por confirmar|To be confirmed\. /i;

const tiles = (page: Page) =>
  page.evaluate(() => {
    const g = document.querySelector('.fin__grid')!;
    const kids = [...g.children].map((e) => e.getBoundingClientRect());
    const gr = { left: Math.min(...kids.map((k) => k.left)), right: Math.max(...kids.map((k) => k.right)), top: Math.min(...kids.map((k) => k.top)), bottom: Math.max(...kids.map((k) => k.bottom)) }; // the wrap's padding is not part of the composition
    return { grid: { l: gr.left, r: gr.right, t: gr.top, b: gr.bottom }, items: [...g.children].map((e) => { const b = e.getBoundingClientRect(), c = getComputedStyle(e); return { l: b.left, r: b.right, t: b.top, b: b.bottom, radii: [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].map(parseFloat), cls: e.className }; }) };
  });

test.describe('closing CTA: honest demo wording', () => {
  for (const l of langs) {
    test(`${l}: with no delivery endpoint the CTA describes the simulated form; href, tracking attributes and heading are kept; no contact instruction pointing at the form`, async ({ page }) => {
      await page.goto(`/${l}/`);
      await expect(page.locator('#fin-h')).toHaveText(`${tr(l).cta.h2.a} ${tr(l).cta.h2.em}`);
      await expect(page.locator('.fin__body')).toHaveText(demo[l].body);
      const btn = page.locator('.fin a.btn');
      await expect(btn).toHaveText(demo[l].button);
      await expect(btn).toHaveAttribute('href', `/${l}/audit/`);
      await expect(btn).toHaveAttribute('data-track', 'audit_cta');
      await expect(btn).toHaveAttribute('data-location', 'final');
      await expect(page.locator('.fin__contact a[href^="mailto:"]')).toBeVisible();
      await expect(page.locator('footer a[href^="mailto:"]')).toBeVisible();
      expect(await page.locator('.fin, footer').allInnerTexts().then((a) => a.join(' '))).not.toMatch(stale);
    });
  }

  test('the wording is selected by the delivery configuration, the configured branch keeps its existing strings, and contact fields render only when set', () => {
    const src = fs.readFileSync('src/components/FinalCta.astro', 'utf8');
    expect(src).toMatch(/const demo = !site\.auditLive/); // any configured delivery mode (endpoint or Netlify) ends the demo wording
    expect(src).toMatch(/demo \? t\.cta\.bodyDemo : t\.cta\.body/);
    expect(src).toMatch(/demo \? t\.cta\.buttonDemo : t\.cta\.button/);
    expect(src).toMatch(/email \|\| phone \?/);
    expect(fs.readFileSync('src/config/site.ts', 'utf8')).toMatch(/auditEndpoint: \(import\.meta\.env\.PUBLIC_AUDIT_ENDPOINT/);
    for (const l of langs) { expect(tr(l).cta.body.length).toBeGreaterThan(10); expect(tr(l).cta.button.length).toBeGreaterThan(5); expect(tr(l).cta.body).not.toBe(demo[l].body); }
    expect(fs.readFileSync('src/components/Footer.astro', 'utf8')).toMatch(/email \|\| phone \|\| address \?/);
  });

  test('viewing the CTA and following its link sends nothing', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => { if (!r.url().startsWith('http://localhost')) requests.push(r.url()); });
    await page.goto('/en/');
    await page.locator('.fin a.btn').click();
    await expect(page).toHaveURL(/\/en\/audit\/$/);
    expect(requests).toEqual([]);
  });
});

test.describe('closing CTA: one connected composition', () => {
  for (const l of langs) for (const [vw, vh] of [[1440, 900], [1024, 768], [834, 1112], [390, 844], [320, 700]] as const) for (const url of ['', 'plans/', 'about/', 'services/web/', 'work/sample-hotel/']) {
    if (url && !(vw === 1440 || vw === 390) ) continue;
    if (url && l !== 'en') continue;
    test(`${l} ${vw}px /${url}: joined without gutter, flat shared edge, outer top-left and bottom-right curved, no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: vh });
      await page.goto(`/${l}/${url}`);
      const { grid, items } = await tiles(page);
      expect(items).toHaveLength(2);
      const area = items.reduce((a, i) => a + (i.r - i.l) * (i.b - i.t), 0);
      expect(Math.abs(area - (grid.r - grid.l) * (grid.b - grid.t)), 'gap or overlap').toBeLessThan(30);
      const [main, art] = items as [typeof items[0], typeof items[0]];
      for (const it of items) [[it.l, it.t], [it.r, it.t], [it.r, it.b], [it.l, it.b]].forEach(([x, y], k) => { const outer = (Math.abs(x! - grid.l) < 1 || Math.abs(x! - grid.r) < 1) && (Math.abs(y! - grid.t) < 1 || Math.abs(y! - grid.b) < 1); if (!outer) expect(it.radii[k], `inner corner ${k} of ${it.cls}`).toBe(0); });
      expect(main.radii[0]).toBeGreaterThan(40); expect(art.radii[2]).toBeGreaterThan(40);
      if (vw >= 1024) { expect(Math.abs(main.r - art.l)).toBeLessThan(1); expect(Math.abs((main.r - main.l) / (grid.r - grid.l) - 8 / 12)).toBeLessThan(0.01); }
      else { expect(Math.abs(main.b - art.t)).toBeLessThan(1); expect(art.b - art.t, 'phone art stays compact').toBeLessThan(vw < 800 ? 260 : 400); }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  for (const l of langs) for (const [vw, pct] of [[390, 200], [320, 200]] as const) test(`${l} ${vw}px at ${pct}% root font: text, button and footer content stay inside their areas and the viewport; nothing has a fixed text height`, async ({ page }) => {
    await page.setViewportSize({ width: vw, height: 800 });
    await page.goto(`/${l}/`);
    await page.addStyleTag({ content: `html{font-size:${pct}%!important}` });
    await page.locator('footer details summary').click();
    await page.waitForTimeout(250);
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      for (const root of document.querySelectorAll<HTMLElement>('.fin__main, footer')) { const pb = root.getBoundingClientRect(); for (const k of root.querySelectorAll<HTMLElement>('h2,h3,p,a,summary,li')) { const r = k.getBoundingClientRect(); if (r.width && (r.right > pb.right + 1 || r.left < pb.left - 1 || r.right > innerWidth + 1)) out.push((k.textContent || '').trim().slice(0, 24)); } }
      if (document.documentElement.scrollWidth > innerWidth) out.push('page scrolls sideways');
      const main = document.querySelector<HTMLElement>('.fin__main')!; if (getComputedStyle(main).height === getComputedStyle(main).minHeight && getComputedStyle(main).minHeight !== '0px') out.push('fixed height');
      return out;
    });
    expect(bad).toEqual([]);
  });

  test('contrast: heading, body, contact label and button text meet WCAG AA on the navy panel', async ({ page }) => {
    await page.goto('/en/');
    const r = await page.evaluate(() => {
      const lum = (c: string) => { const [R, G, B] = c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * R! + 0.7152 * G! + 0.0722 * B!; };
      const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };
      const bg = getComputedStyle(document.querySelector('.fin__main')!).backgroundColor;
      const out = ['#fin-h', '.fin__body', '.fin__h', '.fin__contact a'].map((q) => ({ q, ratio: ratio(getComputedStyle(document.querySelector(q)!).color, bg), size: parseFloat(getComputedStyle(document.querySelector(q)!).fontSize) }));
      const b = document.querySelector('.fin a.btn')!; out.push({ q: 'button', ratio: ratio(getComputedStyle(b).color, getComputedStyle(b).backgroundColor), size: 16 });
      return out;
    });
    for (const x of r) expect(x.ratio, `${x.q} ${x.ratio.toFixed(2)}`).toBeGreaterThanOrEqual(x.size >= 24 ? 3 : 4.5);
  });

  test('keyboard: the CTA button shows a visible focus ring inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    const btn = page.locator('.fin a.btn');
    await btn.focus();
    await page.waitForTimeout(900); // the page scrolls to the focused control with smooth scrolling
    await expect(btn).toBeFocused();
    expect(await btn.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
    // the page scrolls to the focused control with smooth scrolling: wait for it to settle inside the window, clear of the sticky header
    await expect.poll(() => btn.evaluate((e) => { const b = e.getBoundingClientRect(); return b.top >= document.querySelector('header')!.getBoundingClientRect().bottom && b.bottom <= innerHeight - 8 && b.left >= 0 && b.right <= innerWidth; }), { timeout: 6000 }).toBe(true);
  });
});

test.describe('footer: calm, continuous, and unchanged in function', () => {
  for (const l of langs) {
    test(`${l}: continuous navy surface, navigation, language switching to the equivalent page, legal links, demo line, strip; Browser storage text exact; open disclosure grows in the flow`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${l}/plans/`);
      const f = page.locator('footer');
      expect(await f.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(32, 59, 87)');
      expect(await f.locator('.ftr__grid').evaluate((e) => getComputedStyle(e).borderRadius)).toBe('0px');
      expect(await f.locator('.strip').getAttribute('aria-hidden')).toBe('true');
      await expect(f.getByRole('navigation', { name: tr(l).a11y.footerNav }).locator('a[href$="/plans/"]')).toHaveAttribute('href', `/${l}/plans/`);
      for (const other of langs.filter((x) => x !== l)) await expect(f.locator(`a[hreflang="${other}"]`)).toHaveAttribute('href', `/${other}/plans/`);
      for (const p of ['privacy', 'cookies', 'legal']) await expect(f.locator(`a[href="/${l}/${p}/"]`).first()).toBeVisible();
      await expect(f.locator('.ftr__base')).toContainText(tr(l).footer.demo);
      expect(await f.locator('svg, img').count()).toBeGreaterThan(0); // static logo
      const before = await page.evaluate(() => ({ h: document.querySelector('footer')!.getBoundingClientRect().height, doc: document.documentElement.scrollHeight }));
      await f.locator('details summary').click();
      await expect(f.locator('details p')).toContainText(storage[l]);
      const after = await page.evaluate(() => ({ h: document.querySelector('footer')!.getBoundingClientRect().height, pos: getComputedStyle(document.querySelector('footer details p')!).position }));
      expect(after.h).toBeGreaterThan(before.h); expect(after.pos).toBe('static');
      expect(await f.locator('summary, .ftr a').evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetParent && e.getBoundingClientRect().height < 44).length)).toBe(0);
    });
  }

  test('Browser storage: keyboard (Enter/Space) and no JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/de/');
    await page.locator('footer details summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('footer details p')).toContainText(storage.de);
    await page.keyboard.press('Space');
    await expect(page.locator('footer details')).not.toHaveAttribute('open', '');
    await ctx.close();
  });

  test('analytics stay off and legacy stored choices stay inert and untouched', async ({ browser }) => {
    const ctx = await browser.newContext();
    await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'analytics'));
    const requests: string[] = [];
    const page = await ctx.newPage();
    page.on('request', (r) => { if (!r.url().startsWith('http://localhost')) requests.push(r.url()); });
    await page.goto('/es/', { waitUntil: 'networkidle' });
    expect(await page.evaluate(() => localStorage.getItem('odalo.cookies'))).toBe('analytics');
    expect(requests).toEqual([]);
    await ctx.close();
  });
});

test.describe('cookie page: revised heading, draft status kept', () => {
  for (const l of langs) {
    test(`${l}: heading replaced; draft banner, noindex and pending content kept; no consent controls`, async ({ page }) => {
      await page.goto(`/${l}/cookies/`);
      const heads = await page.locator('main h2').allInnerTexts();
      expect(heads.at(-1)).toBe(legalCopy[l].pages.cookies.sections.at(-1)!.h);
      expect(heads.join(' ')).not.toMatch(/choice|elecci|Auswahl/i);
      await expect(page.locator('main')).toContainText(legalCopy[l].banner);
      expect(await page.locator('meta[name="robots"]').getAttribute('content')).toBe('noindex');
      expect(await page.locator('main button, main input').count()).toBe(0);
    });
  }
});
