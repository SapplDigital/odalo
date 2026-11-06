// Focused regression for the language-switch / first-paint flash on the home page (see docs/review/main-site-mosaic/LANGUAGE-SWITCH-FLASH-COMPLETION.md).
// Cause: the server HTML is the plain readable stack (the no-JS/failure fallback); it painted before the mosaic runtime mounted, which looked like another site.
// Fix: the home mosaic script is moved into <head> as blocking="render" at build time (astro.config.mjs), so the previous page stays until the mosaic can paint.
// Run against a built site:  HOME_URL=http://127.0.0.1:4343 npx playwright test -c playwright.home.config.ts tests/language-flash.spec.ts
import { test, expect, type Page } from '@playwright/test';

const SCRIPT = /HomeMosaic\.astro_astro_type_script/;
const noClip = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.hm-box')].filter((b) => getComputedStyle(b).display !== 'none')
  .every((b) => b.scrollHeight - b.clientHeight <= 1 && b.scrollWidth - b.clientWidth <= 1));

test('built HTML: the mosaic script is a render-blocking module in <head> (EN/ES/DE), not in body; other routes untouched', async ({ request }) => {
  for (const l of ['en', 'es', 'de']) {
    const html = await (await request.get(`/${l}/`)).text();
    const [head, body] = html.split('</head>');
    expect(head).toMatch(/<script type="module" src="\/_astro\/HomeMosaic[^"]*" blocking="render"><\/script>/);
    expect(body).not.toMatch(SCRIPT);
    expect(head).not.toMatch(/<script[^>]*src="[^"]*HomeMosaic[^>]*async/);
    const plans = await (await request.get(`/${l}/plans/`)).text();
    expect(plans).not.toContain('blocking="render"');
  }
});

test('the mobile menu panel is closed in the server HTML (no open panel before the header script runs)', async ({ request }) => {
  const html = await (await request.get('/de/')).text();
  expect(html).toMatch(/<div class="hdr__panel" id="site-nav" hidden/);
});

test('JS disabled: the readable stack and the open menu links are visible at once', async ({ browser }) => {
  for (const w of [1440, 390]) {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('/en/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.hm-box--hero a.btn')).toBeVisible();
    await expect(page.locator('#site-nav a[href$="/plans/"]').first()).toBeVisible();
    await ctx.close();
  }
});

test('script fails to load: the readable stack is shown at once (nothing blocks, nothing hidden)', async ({ page }) => {
  await page.route(SCRIPT, (route) => route.abort());
  await page.goto('/es/');
  await page.waitForTimeout(300);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.hm-box--hero a.btn')).toBeVisible();
  expect(await page.evaluate(() => !!document.querySelector('.hm-live'))).toBe(false);
});

for (const [name, width, height] of [['desktop 1440', 1440, 900], ['phone 390', 390, 844]] as const) {
  test(`${name}: late web fonts - mosaic is live at first paint, then re-fits with nothing clipped`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.route(/\.woff2$/, async (route) => { await new Promise((r) => setTimeout(r, 1200)); await route.continue(); });
    await page.goto('/de/');
    expect(await page.evaluate(() => !!document.querySelector('.hm-live'))).toBe(true); // already mounted when the load event fires, fonts still pending
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    expect(await noClip(page)).toBe(true);
    expect(await page.evaluate(() => !!document.querySelector('.hm-live'))).toBe(true);
  });
}

test('language links stay on this origin and keep the locale route (EN -> ES -> DE -> EN)', async ({ page, baseURL }) => {
  await page.goto('/en/');
  await page.waitForFunction(() => !!(window as any).__hm?.live);
  for (const to of ['es', 'de', 'en']) {
    const a = page.locator(`header a[data-set-lang="${to}"]`);
    expect(new URL((await a.getAttribute('href'))!, page.url()).origin).toBe(new URL(baseURL!).origin);
    await a.click();
    await page.waitForURL(new RegExp(`/${to}/$`));
    await page.waitForFunction(() => !!(window as any).__hm?.live);
    expect(await page.locator('html').getAttribute('lang')).toBe(to);
    expect(await noClip(page)).toBe(true);
  }
});
