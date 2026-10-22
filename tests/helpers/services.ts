import type { Page } from '@playwright/test';

/**
 * The services pieces join as they scroll into view (see ServiceMosaic.astro) and the shared-edge hover waits until a tile has docked.
 * Tests that exercise the settled mosaic (hover, geometry) call this first: it scrolls the way a visitor does until every piece has docked,
 * then brings the mosaic back into view. A docked tile stays docked, so scrolling back is safe.
 */
export async function assembleServices(page: Page) {
  await page.evaluate(async () => {
    const m = document.querySelector<HTMLElement>('[data-mosaic]')!;
    const to = (y: number) => window.scrollTo({ top: y, behavior: 'instant' });
    const top = () => m.getBoundingClientRect().top + scrollY;
    for (const f of [0.2, 0.5, 0.8, 1.1, 1.4]) { to(top() + m.offsetHeight * f - innerHeight * 0.5); await new Promise((r) => setTimeout(r, 120)); }
  });
  await page.waitForFunction(() => !document.querySelector('[data-mosaic]')!.classList.contains('is-assembling'));
  await page.evaluate(() => document.querySelector('[data-mosaic]')!.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(150);
}
