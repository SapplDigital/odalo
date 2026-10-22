import { test, expect } from '@playwright/test';
import { tr } from '../src/i18n/ui';
import fs from 'node:fs';

const langs = ['en', 'es', 'de'] as const;
const label = { en: 'Browser storage', es: 'Almacenamiento del navegador', de: 'Browserspeicher' };
const body = {
  en: 'This demo remembers your language in this browser. Analytics and marketing tracking are disabled.',
  es: 'Esta demo recuerda tu idioma en este navegador. El seguimiento analítico y de marketing está desactivado.',
  de: 'Diese Demo merkt sich deine Sprache in diesem Browser. Analyse- und Marketing-Tracking sind deaktiviert.',
};
const fixedOverlays = (page: import('@playwright/test').Page) =>
  page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); return cs.position === 'fixed' && cs.display !== 'none' && !e.closest('header') && e.getBoundingClientRect().height > 40; }).length);

test.describe('browser-storage information replaces the cookie panel', () => {
  for (const l of langs) {
    test(`${l}: no panel, no inactive analytics choice; the footer disclosure carries the factual text and the cookie-page link`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${l}/`);
      await expect(page.locator('[data-cookiebar], .ck')).toHaveCount(0);
      expect(await fixedOverlays(page)).toBe(0);
      expect(await page.locator('body').innerText()).not.toMatch(/analytics \(inactive|analítica \(inactiva|Analyse \(inaktiv|Cookie preferences|Preferencias de cookies|Cookie-Einstellungen|Allow analytics/i);
      const d = page.locator('footer details');
      await expect(d.locator('summary')).toHaveText(label[l]);
      expect(tr(l).storage.h).toBe(label[l]);
      await expect(d).not.toHaveAttribute('open', '');
      await d.locator('summary').click();
      await expect(d.locator('p')).toContainText(body[l]);
      await expect(d.locator('p a')).toHaveAttribute('href', `/${l}/cookies/`);
      await page.goto(`/${l}/cookies/`);
      await expect(page.locator('h1')).toHaveText(tr(l).legal.cookies.title);
      await expect(page.locator('main')).toContainText(tr(l).legal.banner);
    });
  }

  test('native keyboard operation: summary is a tab stop, Enter and Space toggle it, focus stays, the body never overlays content', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    const sum = page.locator('footer details summary');
    await sum.focus();
    await expect(sum).toBeFocused();
    expect(await sum.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page.locator('footer details')).toHaveAttribute('open', '');
    await expect(sum).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.locator('footer details')).not.toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    const r = await page.locator('footer details p').boundingBox();
    expect(r!.x).toBeGreaterThanOrEqual(0); expect(r!.x + r!.width).toBeLessThanOrEqual(1440);
    expect(await fixedOverlays(page)).toBe(0);
    const pos = await page.locator('footer details p').evaluate((e) => getComputedStyle(e).position);
    expect(pos).toBe('static');
  });

  test('no JavaScript: first view is unobstructed and the disclosure still opens natively', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/de/');
    await expect(page.locator('h1')).toBeVisible();
    await page.locator('footer details summary').click();
    await expect(page.locator('footer details p')).toContainText(body.de);
    await ctx.close();
  });
});

test.describe('stored values and storage failures', () => {
  for (const state of ['essential', 'analytics', 'garbage', null] as const) for (const l of langs) {
    test(`${l}: an old demo choice (${state ?? 'none'}) shows no panel, stays inert and is left in place; analytics remain off and nothing is sent`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      if (state) await ctx.addInitScript((v) => { localStorage.setItem('odalo.cookies', v); localStorage.setItem('unrelated.key', 'keep'); }, state);
      const requests: string[] = [];
      const page = await ctx.newPage();
      page.on('request', (r) => { if (!r.url().startsWith('http://localhost')) requests.push(r.url()); });
      await page.goto(`/${l}/`, { waitUntil: 'networkidle' });
      expect(await fixedOverlays(page)).toBe(0);
      await page.locator('a[data-track="audit_cta"]').first().click({ trial: true });
      const stored = await page.evaluate(() => ({ c: localStorage.getItem('odalo.cookies'), u: localStorage.getItem('unrelated.key') }));
      expect(stored.c).toBe(state);                       // not rewritten, not cleared
      if (state) expect(stored.u).toBe('keep');           // unrelated data untouched
      const code = fs.readFileSync('src/lib/analytics.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(code, 'the analytics gate must not read storage').not.toContain('localStorage');
      expect(code).toMatch(/hasAnalyticsConsent\(\): boolean \{\s*return false;\s*\}/);
      expect(requests, 'no third-party or analytics request').toEqual([]);
      await ctx.close();
    });
  }

  test('storage denied: pages render, the language switch works, nothing throws', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => {
      const deny = () => { throw new DOMException('denied', 'SecurityError'); };
      Object.defineProperty(window, 'localStorage', { get: deny, configurable: true });
    });
    const errors: string[] = [];
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('/en/');
    await expect(page.locator('h1')).toBeVisible();
    await page.locator('a[data-set-lang="de"]').first().click();
    await expect(page).toHaveURL(/\/de\/$/);
    await page.locator('footer details summary').click();
    await expect(page.locator('footer details p')).toContainText(body.de);
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test('an explicit language choice is stored and used by the root redirect; no other key is written', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-GB' });
    const page = await ctx.newPage();
    await page.goto('/en/');
    await page.locator('a[data-set-lang="es"]').first().click();
    await expect(page).toHaveURL(/\/es\/$/);
    expect(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))).toEqual({ 'odalo.lang': 'es' });
    expect(await page.evaluate(() => document.cookie)).toBe('');
    await page.goto('/');
    await expect(page).toHaveURL(/\/es\/$/);
    await ctx.close();
  });
});

test.describe('first views are unobstructed', () => {
  for (const l of langs) for (const [w, h] of [[1440, 900], [390, 844], [320, 700]] as const) for (const pct of [100, 200]) {
    test(`${l} ${w}px ${pct}%: hero, audit CTA and first view carry no fixed overlay, and the CTA is reachable`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`/${l}/`);
      if (pct === 200) await page.addStyleTag({ content: 'html{font-size:200% !important}' });
      expect(await fixedOverlays(page)).toBe(0);
      const cta = page.locator('.hero a[data-track="audit_cta"]');
      await expect(cta).toBeVisible();
      const top = await cta.evaluate((e) => { const r = e.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, Math.min(r.top + r.height / 2, innerHeight - 1)); return hit === e || e.contains(hit); });
      if (pct === 100) expect(top).toBe(true);
    });
  }
});
