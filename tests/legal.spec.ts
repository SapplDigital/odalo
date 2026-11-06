import { test, expect } from '@playwright/test';

const EMAIL = 'info@sappl-digital-services.com';

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

test('audit form stays in demo mode and shows the working email link', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => { if (r.method() === 'POST') requests.push(r.url()); });
  await page.goto('/en/audit/');
  await expect(page.locator('main')).toContainText('no delivery service is connected');
  await expect(page.locator(`main a[href="mailto:${EMAIL}"]`)).toBeVisible();
  expect(requests).toEqual([]);
});
