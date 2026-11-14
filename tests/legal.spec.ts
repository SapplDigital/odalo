import { test, expect } from '@playwright/test';

import { legalFor } from '../src/content/legal';
import { NETLIFY_FIELDS } from '../src/lib/submit';

const EMAIL = 'info@sappl-digital-services.com';

const AUDIT_H: Record<'en' | 'de' | 'es', string> = { en: 'Audit form', de: 'Analyse-Formular', es: 'Formulario de auditoría' };
const DEMO = /demo|does not transmit|nicht[s]? (?:übertragen|versendet)|versendet nichts|no (?:se )?(?:transmite|envía)/i;
const LEGAL_BASIS: Record<'en' | 'de' | 'es', { b: RegExp; a: RegExp }> = {
  en: { b: /Art\. 6\(1\)\(b\) GDPR/, a: /Art\. 6\(1\)\(a\) GDPR/ },
  de: { b: /Art\. 6 Abs\. 1 lit\. b DSGVO/, a: /Art\. 6 Abs\. 1 lit\. a DSGVO/ },
  es: { b: /art\. 6\.1\.b RGPD/, a: /art\. 6\.1\.a RGPD/ },
};
const auditText = (lang: 'en' | 'de' | 'es', t: 'simulated' | 'json' | 'netlify') =>
  legalFor(lang, t).pages.privacy.sections.find((s) => s.h === AUDIT_H[lang])!.p.join('\n');
const formSentence = (lang: 'en' | 'de' | 'es', t: 'simulated' | 'json' | 'netlify') => legalFor(lang, t).pages.legal.sections[2].p[1];

for (const lang of ['en', 'de', 'es'] as const) {
  test(`${lang}: Netlify variant of audit-form privacy text and Impressum`, () => {
    const t = auditText(lang, 'netlify');
    expect(t).toMatch(/Netlify/);
    expect(t).toMatch(LEGAL_BASIS[lang].b);
    expect(t).toMatch(LEGAL_BASIS[lang].a);
    expect(t).toMatch(/honeypot/i);
    expect(t).not.toMatch(DEMO);
    expect(formSentence(lang, 'netlify')).not.toMatch(DEMO);
    expect(formSentence(lang, 'netlify')).not.toMatch(/Netlify/);
  });
  test(`${lang}: JSON variant names no Netlify and claims no demo mode`, () => {
    const t = auditText(lang, 'json');
    expect(t).not.toMatch(/Netlify/);
    expect(t).not.toMatch(DEMO);
    expect(t).toMatch(LEGAL_BASIS[lang].b);
    expect(formSentence(lang, 'json')).not.toMatch(/Netlify|demo/i);
    expect(formSentence(lang, 'json')).not.toMatch(DEMO);
  });
  test(`${lang}: simulated variant keeps the demo wording`, () => {
    expect(auditText(lang, 'simulated')).toMatch(/demo/i);
    expect(auditText(lang, 'simulated')).not.toMatch(/Netlify/);
  });
  test(`${lang}/privacy: default build shows demo wording and no Netlify Forms claim`, async ({ page }) => {
    await page.goto(`/${lang}/privacy/`);
    const sec = page.locator('li', { has: page.getByRole('heading', { name: AUDIT_H[lang] }) });
    await expect(sec).toContainText(/demo/i);
    await expect(sec).not.toContainText(/Netlify Forms/);
    await expect(sec).not.toContainText(/honeypot/i);
  });
}

test('built /en/audit/ exposes the Netlify registration markup', async ({ page }) => {
  await page.goto('/en/audit/');
  const html = await page.content();
  expect(html).toMatch(/data-netlify/);
  const form = page.locator('form[data-netlify]');
  await expect(form).toHaveCount(1);
  await expect(form.locator('input[name="form-name"]')).toHaveCount(1);
  await expect(form.locator('input[name="bot-field"]')).toHaveCount(1);
  for (const k of NETLIFY_FIELDS) expect(await form.locator(`[name="${k}"]`).count(), k).toBeGreaterThan(0);
});

for (const lang of ['en', 'de', 'es']) {
  for (const slug of ['legal', 'privacy', 'cookies']) {
    test(`${lang}/${slug}: operator, working mailto, noindex, no placeholder`, async ({ page }) => {
      await page.goto(`/${lang}/${slug}/`);
      const main = page.locator('main');
      await expect(main).toContainText('Sebastian Tim Appl');
      await expect(main).toContainText('Sappl Digital Services');
      await expect(main).toContainText('Bachweg 5');
      await expect(main.locator(`a[href="mailto:${EMAIL}"]`)).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await expect(main).not.toContainText(/placeholder|platzhalter|pending approval|wartet auf freigabe|pendiente de contenido/i);
      for (const target of ['privacy', 'cookies', 'legal']) await expect(page.locator(`footer a[href$="/${lang}/${target}/"]`).first()).toBeVisible();
    });
  }
}

const SMALL_BUSINESS: Record<string, RegExp> = {
  de: /§ 19 UStG/,
  en: /§ 19 UStG/,
  es: /§ 19 UStG/,
};
for (const lang of ['de', 'en', 'es']) {
  test(`${lang}/legal: Kleinunternehmer note (§ 19 UStG) and content responsibility`, async ({ page }) => {
    await page.goto(`/${lang}/legal/`);
    const main = page.locator('main');
    await expect(main.locator('[data-kleinunternehmer]')).toContainText(SMALL_BUSINESS[lang]);
    const resp = main.locator('[data-responsible]');
    await expect(resp).toContainText('MStV');
    await expect(resp).toContainText('Sebastian Tim Appl');
    await expect(resp).toContainText('Bachweg 5');
    await expect(resp).toContainText('88690 Uhldingen-Mühlhofen');
  });
}

test('de/legal: Kleinunternehmer wording and § 18 Abs. 2 MStV line', async ({ page }) => {
  await page.goto('/de/legal/');
  const main = page.locator('main');
  await expect(main).toContainText('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet bzw. ausgewiesen');
  await expect(main).toContainText('Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV');
  await expect(main).toContainText('nicht im Handelsregister eingetragen');
  await expect(main).not.toContainText(/geklärt/);
});

for (const lang of ['en', 'de', 'es']) {
  for (const slug of ['legal', 'privacy', 'cookies']) {
    test(`${lang}/${slug}: null phone/VAT-ID rows hidden, no null text, no ODR link`, async ({ page }) => {
      await page.goto(`/${lang}/${slug}/`);
      const main = page.locator('main');
      await expect(main.locator('dt', { hasText: /^\s*(Telefon|Phone|Teléfono|USt-IdNr\.?|VAT ID|NIF-IVA)\s*$/ })).toHaveCount(0);
      expect(await main.locator('dt:empty, dd:empty').count()).toBe(0);
      await expect(main).not.toContainText(/\bnull\b|\bundefined\b/);
      await expect(page.locator('a[href*="ec.europa.eu/consumers/odr"]')).toHaveCount(0);
    });
  }
}

test('audit form stays in demo mode and shows the working email link', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => { if (r.method() === 'POST') requests.push(r.url()); });
  await page.goto('/en/audit/');
  await expect(page.locator('main')).toContainText('no delivery service is connected');
  await expect(page.locator(`main a[href="mailto:${EMAIL}"]`)).toBeVisible();
  expect(requests).toEqual([]);
});
