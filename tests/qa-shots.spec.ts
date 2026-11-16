import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { projects } from '../src/content/projects';

const OUT = 'docs/qa/2026-11-24/screens';
// Screenshots only on demand (QA_SHOTS=1), never in the normal verify run (PAOLO 2026-11-15)
test.skip(!process.env.QA_SHOTS, 'set QA_SHOTS=1 to regenerate QA screenshots');
const langs = ['es', 'en', 'de'] as const;
const viewports = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

const pages: { name: string; path: string }[] = [
  { name: 'home', path: '' },
  { name: 'plans', path: 'plans/' },
  ...['web', 'local', 'video', 'ads'].map((s) => ({ name: `services-${s}`, path: `services/${s}/` })),
  { name: 'about', path: 'about/' },
  { name: 'audit', path: 'audit/' },
  { name: 'privacy', path: 'privacy/' },
  { name: 'cookies', path: 'cookies/' },
  { name: 'legal', path: 'legal/' },
  { name: 'work', path: 'work/' },
  ...projects.map((p) => ({ name: `work-${p.id}`, path: `work/${p.id}/` })),
];

async function shoot(page: import('@playwright/test').Page, url: string, file: string) {
  mkdirSync(OUT, { recursive: true });
  await page.addInitScript(() => {
    try {
      localStorage.setItem('odalo.cookies', 'essential');
    } catch {
      /* ignore */
    }
  });
  await page.goto(url);
  await page.waitForLoadState('load');
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 150));
  });
  // Lazy images below the fold must be loaded before a fullPage capture.
  await page.waitForFunction(
    () => Array.from(document.images).filter((img) => img.getClientRects().length > 0).every((img) => img.complete && img.naturalWidth > 0),
    undefined,
    { timeout: 15000 },
  );
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 150));
  });
  await expect(page.locator('h1')).toHaveCount(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: true });
}

test.describe('QA screenshots (M11)', () => {
  test.setTimeout(90_000);
  for (const vp of viewports) {
    test.describe(`${vp.width}px`, () => {
      test.use({ viewport: vp });
      for (const lang of langs) {
        for (const p of pages) {
          test(`${lang} ${p.name} @${vp.width}`, async ({ page }) => {
            await shoot(page, `/${lang}/${p.path}`, `${lang}-${p.name}-${vp.width}.png`);
          });
        }
      }
      test(`404 @${vp.width}`, async ({ page }) => {
        await shoot(page, '/404.html', `404-${vp.width}.png`);
      });
    });
  }
});
