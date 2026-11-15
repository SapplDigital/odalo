import { test, expect, type Page } from '@playwright/test';

/**
 * GDPR claim "no third-party calls": every request made by the home page and the audit page (including the
 * form submit, whatever transport the build uses) goes to the same origin as the page itself.
 */

const IGNORED = /^(data|blob|about):/i;

/** Collects every request URL of the page; returns the ones whose origin differs from `origin`. */
function recordRequests(page: Page) {
  const urls: string[] = [];
  page.on('request', (req) => { urls.push(req.url()); });
  return {
    urls,
    foreign: (origin: string) => urls.filter((u) => !IGNORED.test(u) && new URL(u).origin !== origin),
  };
}

for (const lang of ['es', 'en', 'de'] as const) {
  test(`/${lang}/ makes only same-origin requests`, async ({ page, baseURL }) => {
    const rec = recordRequests(page);
    await page.goto(`/${lang}/`);
    await page.waitForLoadState('networkidle');
    const origin = new URL(baseURL ?? page.url()).origin;
    expect(rec.urls.length).toBeGreaterThan(0);
    expect(rec.foreign(origin), `third-party requests on /${lang}/:\n${rec.foreign(origin).join('\n')}`).toEqual([]);
  });

  test(`/${lang}/audit/ makes only same-origin requests, including the submit`, async ({ page, baseURL }) => {
    const rec = recordRequests(page);
    await page.goto(`/${lang}/audit/`);
    await page.waitForLoadState('networkidle');
    await page.locator('#f-business').fill('Test Business');
    await page.locator('#f-need').fill('We need a simple website and more reviews.');
    await page.locator('#f-name').fill('Test Person');
    await page.locator('#f-email').fill('test@example.com');
    await page.locator('#f-privacy').check();
    await page.locator('[data-submit]').click(); // enabled once the submit handler is installed
    await expect(page.locator('[data-result]')).toBeVisible();
    await page.waitForLoadState('networkidle');
    const origin = new URL(baseURL ?? page.url()).origin;
    expect(new URL(page.url()).origin).toBe(origin);
    expect(rec.foreign(origin), `third-party requests on /${lang}/audit/:\n${rec.foreign(origin).join('\n')}`).toEqual([]);
  });
}
