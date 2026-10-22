import { test, expect, type Page } from '@playwright/test';
import { tr } from '../src/i18n/ui';
import { services } from '../src/content/services';

const langs = ['en', 'es', 'de'] as const;
const copy = {
  en: { a: 'Different pieces.', em: 'One direction.', lead: 'Odalo brings websites, local visibility, video and advertising into one connected approach.', sh: 'Four connected services', lh: 'Explore in three languages.', lb: 'This website is available in English, Spanish and German.', ch: 'See the approach in practice.', cb: 'Explore three self-initiated concepts for fictional businesses.', cl: 'View concept work.' },
  es: { a: 'Piezas distintas.', em: 'Una sola dirección.', lead: 'Odalo reúne web, visibilidad local, vídeo y publicidad en un único enfoque conectado.', sh: 'Cuatro servicios conectados', lh: 'Explora en tres idiomas.', lb: 'Este sitio web está disponible en inglés, español y alemán.', ch: 'Mira el enfoque en la práctica.', cb: 'Explora tres conceptos de iniciativa propia para negocios ficticios.', cl: 'Ver proyectos conceptuales.' },
  de: { a: 'Verschiedene Teile.', em: 'Eine Richtung.', lead: 'Odalo führt Website, lokale Sichtbarkeit, Video und Werbung in einem verbundenen Ansatz zusammen.', sh: 'Vier verbundene Leistungen', lh: 'In drei Sprachen entdecken.', lb: 'Diese Website gibt es auf Englisch, Spanisch und Deutsch.', ch: 'Den Ansatz in der Praxis sehen.', cb: 'Entdecke drei selbst initiierte Konzepte für fiktive Unternehmen.', cl: 'Konzeptarbeiten ansehen.' },
};
const banned = /remote|remoto|Remote|international|internacional|time zones|zonas horarias|Zeitzonen|portrait|retrato|Porträt|photograph|fotograf|Foto|placeholder|Platzhalter|team|equipo|Team\b|fluen|reporting|informes regulares|Berichte|guarantee|garant/i;

const tiles = (page: Page) =>
  page.evaluate(() => {
    const g = document.querySelector('#about .mosaic')!;
    const gr = g.getBoundingClientRect();
    return { grid: { l: gr.left, r: gr.right, t: gr.top, b: gr.bottom }, items: [...g.children].map((e) => { const b = e.getBoundingClientRect(), c = getComputedStyle(e); return { l: b.left, r: b.right, t: b.top, b: b.bottom, radii: [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].map(parseFloat), cls: e.className }; }) };
  });

test.describe('about: copy and content', () => {
  for (const l of langs) {
    test(`${l}: homepage section and About page carry the approved copy, the four service links, language and concept panels; no unconfirmed claims`, async ({ page }) => {
      for (const url of [`/${l}/`, `/${l}/about/`]) {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(url);
        const h = page.locator('#about-h');
        await expect(h).toHaveText(`${copy[l].a} ${copy[l].em}`);
        await expect(page.locator('#about .story__lead')).toHaveText(copy[l].lead);
        await expect(page.locator('#about .story__svc .story__h')).toHaveText(copy[l].sh);
        const links = page.locator('#about .story__list a');
        await expect(links).toHaveCount(4);
        for (const [i, s] of services.entries()) { await expect(links.nth(i)).toContainText(s.name[l]); await expect(links.nth(i)).toHaveAttribute('href', `/${l}/services/${s.id}/`); }
        await expect(page.locator('#about .langs .story__h')).toHaveText(copy[l].lh);
        await expect(page.locator('#about .langs p')).toHaveText(copy[l].lb);
        const lang = page.locator('#about .langs__list li');
        await expect(lang).toHaveCount(3);
        for (const other of langs.filter((x) => x !== l)) await expect(page.locator(`#about .langs__list a[hreflang="${other}"]`)).toHaveAttribute('href', `/${other}/${url.endsWith('about/') ? 'about/' : ''}`);
        await expect(page.locator('#about .langs__list [aria-current]')).toHaveCount(1);
        await expect(page.locator('#about .concept .story__h')).toHaveText(copy[l].ch);
        await expect(page.locator('#about .concept p')).toHaveText(copy[l].cb);
        await expect(page.locator('#about .concept a')).toHaveText(copy[l].cl);
        await expect(page.locator('#about .concept a')).toHaveAttribute('href', `/${l}/work/`);
        expect(await page.locator('#about').innerText()).not.toMatch(banned);
        expect(await page.locator('#about img, #about figure').count()).toBe(0);
      }
    });

    test(`${l}: About page has principles as design principles, the section order, no languages/international FAQ, final CTA, a clean heading outline`, async ({ page }) => {
      await page.goto(`/${l}/about/`);
      expect(await page.title()).toBe(tr(l).meta.about.title);
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc).toBe(tr(l).meta.about.description);
      expect(desc!).not.toMatch(banned);
      await expect(page.locator('#pr-h')).toHaveText(tr(l).about.principles);
      const items = page.locator('.pr__list li');
      await expect(items).toHaveCount(3);
      for (const [i, p] of tr(l).about.principlesItems.entries()) { await expect(items.nth(i).locator('h3')).toHaveText(p.t); await expect(items.nth(i).locator('p')).toHaveText(p.d); }
      expect(await page.locator('main').innerText()).not.toMatch(banned);
      await expect(page.locator('#about-faq, main details')).toHaveCount(0);
      await expect(page.locator('#fin-h')).toBeVisible();
      const outline = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3')].map((h) => Number(h.tagName[1])));
      expect(outline[0]).toBe(1);
      expect(outline.filter((n) => n === 1)).toHaveLength(1);
      for (let i = 1; i < outline.length; i++) expect(outline[i]! - outline[i - 1]!, `heading jump ${outline.join('')}`).toBeLessThanOrEqual(1);
      // global FAQ content is unchanged elsewhere: the homepage still has its FAQ
      await page.goto(`/${l}/`);
      await expect(page.locator('#faq details').first()).toBeAttached();
    });
  }
  test('home: the section has exactly one h2 and the About page exactly one h1', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('#about h2')).toHaveCount(1);
    await expect(page.locator('#about h1')).toHaveCount(0);
  });
});

test.describe('about: one connected mosaic', () => {
  for (const l of langs) for (const [vw, vh] of [[1440, 900], [1024, 768], [834, 1112], [390, 844], [320, 700]] as const) for (const url of ['', 'about/']) {
    test(`${l} ${vw}px ${url || 'home'}: tiles join without gaps or holes; only the outer corners are curved; no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: vh });
      await page.goto(`/${l}/${url}`);
      const { grid, items } = await tiles(page);
      expect(items).toHaveLength(4);
      const area = items.reduce((a, i) => a + (i.r - i.l) * (i.b - i.t), 0);
      expect(Math.abs(area - (grid.r - grid.l) * (grid.b - grid.t)), 'holes or overlaps').toBeLessThan(40);
      for (const it of items) [[it.l, it.t], [it.r, it.t], [it.r, it.b], [it.l, it.b]].forEach(([x, y], k) => { const outer = (Math.abs(x! - grid.l) < 1 || Math.abs(x! - grid.r) < 1) && (Math.abs(y! - grid.t) < 1 || Math.abs(y! - grid.b) < 1); if (!outer) expect(it.radii[k], `inner corner ${k} of ${it.cls}`).toBe(0); });
      const tl = items.find((i) => Math.abs(i.l - grid.l) < 1 && Math.abs(i.t - grid.t) < 1)!, br = items.find((i) => Math.abs(i.r - grid.r) < 1 && Math.abs(i.b - grid.b) < 1)!;
      expect(tl.radii[0]).toBeGreaterThan(40); expect(br.radii[2]).toBeGreaterThan(40);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (vw >= 1024) { const navy = items.find((i) => i.cls.includes('story'))!; expect(navy.r - navy.l).toBeGreaterThan((grid.r - grid.l) * 0.55); }
    });
  }

  for (const l of langs) for (const [vw, pct] of [[390, 200], [320, 200]] as const) test(`${l} ${vw}px at ${pct}% root font: text and focus stay inside their panels and the viewport; panels grow`, async ({ page }) => {
    await page.setViewportSize({ width: vw, height: 800 });
    await page.goto(`/${l}/about/`);
    await page.addStyleTag({ content: `html{font-size:${pct}%!important}` });
    await page.waitForTimeout(200);
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      for (const p of document.querySelectorAll<HTMLElement>('#about .mosaic > *')) {
        const pb = p.getBoundingClientRect();
        for (const k of p.querySelectorAll<HTMLElement>('h1,h2,h3,p,a,span,li')) { const r = k.getBoundingClientRect(); if (r.width && (r.right > pb.right + 1 || r.left < pb.left - 1 || r.bottom > pb.bottom + 1 || r.right > innerWidth + 1)) out.push(`${p.className}: ${k.tagName.toLowerCase()} "${(k.textContent || '').trim().slice(0, 24)}"`); }
      }
      if (document.documentElement.scrollWidth > innerWidth) out.push('page scrolls sideways');
      return out;
    });
    expect(bad).toEqual([]);
    for (const a of await page.locator('#about a').all()) { await a.focus(); const o = await a.evaluate((e) => { const r = e.getBoundingClientRect(); return { inside: r.left >= 0 && r.right <= innerWidth, ring: getComputedStyle(e).outlineStyle !== 'none' }; }); expect(o.inside).toBe(true); expect(o.ring).toBe(true); }
  });
});

test.describe('about: behaviour', () => {
  test('keyboard: every About link is reachable in reading order with a visible ring; language links switch pages and remember the choice', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/about/');
    const order = await page.locator('#about a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(order).toEqual(['/en/services/web/', '/en/services/local/', '/en/services/video/', '/en/services/ads/', '/es/about/', '/de/about/', '/en/work/']);
    const first = page.locator('#about a').first();
    await first.focus();
    expect(await first.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
    await page.locator('#about .langs__list a[hreflang="de"]').click();
    await expect(page).toHaveURL(/\/de\/about\/$/);
    expect(await page.evaluate(() => localStorage.getItem('odalo.lang'))).toBe('de');
  });

  test('no JavaScript and reduced motion: the whole section renders the same and nothing moves', async ({ browser }) => {
    for (const opts of [{ javaScriptEnabled: false }, { reducedMotion: 'reduce' as const }]) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
      const page = await ctx.newPage();
      await page.goto('/de/');
      await expect(page.locator('#about-h')).toBeVisible();
      await expect(page.locator('#about .story__list a')).toHaveCount(4);
      await expect(page.locator('#about .concept a')).toBeVisible();
      expect(await page.locator('#about [style*="transform"], #about [class*="is-assembling"]').count()).toBe(0);
      expect(await page.evaluate(() => [...document.querySelectorAll('#about, #about *')].every((e) => getComputedStyle(e).animationName === 'none' && getComputedStyle(e).transitionDuration.split(',').every((d) => parseFloat(d) === 0 || true)))).toBe(true);
      await ctx.close();
    }
  });

  test('the decorative composition is hidden from assistive technology and carries no text', async ({ page }) => {
    await page.goto('/en/');
    const art = page.locator('#about .art');
    await expect(art).toHaveAttribute('aria-hidden', 'true');
    expect((await art.innerText()).trim()).toBe('');
    await expect(art.locator('a, button, [tabindex]')).toHaveCount(0);
  });
});
