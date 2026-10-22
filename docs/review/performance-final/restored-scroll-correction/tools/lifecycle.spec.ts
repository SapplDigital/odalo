import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

// Replays the restored-scroll scenario of tests/services-motion.spec.ts with a lifecycle timeline injected into every document.
const OUT = 'docs/review/performance-final/restored-scroll-correction/timelines';

const init = () => {
  const t0 = performance.now();
  const log: any[] = [];
  (window as any).__log = log;
  const now = () => Math.round((performance.now() - t0) * 10) / 10;
  const ev = (e: string, extra: any = {}) => log.push({ t: now(), e, y: Math.round(scrollY), ...extra });
  ev('init', { rs: history.scrollRestoration });
  addEventListener('load', () => ev('load'));
  addEventListener('pageshow', (e) => ev('pageshow', { persisted: (e as PageTransitionEvent).persisted }));
  document.addEventListener('DOMContentLoaded', () => ev('DOMContentLoaded'));
  document.fonts.ready.then(() => ev('fonts.ready'));
  document.addEventListener('load', (e) => { const el = e.target as HTMLElement; if (el && el.tagName === 'IMG') ev('img.load', { src: (el as HTMLImageElement).currentSrc.split('/').pop() }); }, true);
  let lastY = -1;
  addEventListener('scroll', () => { if (Math.round(scrollY) !== lastY) { lastY = Math.round(scrollY); ev('scroll'); } }, { passive: true });
  addEventListener('resize', () => ev('resize', { w: innerWidth, h: innerHeight }));
  let prev = '';
  const sample = () => {
    const m = document.querySelector<HTMLElement>('[data-mosaic]');
    if (m) {
      const mt = Math.round(m.getBoundingClientRect().top + scrollY);
      const tiles = [...document.querySelectorAll<HTMLElement>('.tile')].map((t) => ({ id: t.dataset.service, nominalTopInWindow: Math.round(m.getBoundingClientRect().top + t.offsetTop), docked: t.style.transform === '' }));
      const key = JSON.stringify([Math.round(scrollY), mt, document.documentElement.scrollHeight, m.classList.contains('is-assembling'), tiles.map((x) => [x.nominalTopInWindow, x.docked])]);
      if (key !== prev) { prev = key; log.push({ t: now(), e: 'sample', y: Math.round(scrollY), mosaicPageTop: mt, docH: document.documentElement.scrollHeight, assembling: m.classList.contains('is-assembling'), tiles: tiles.map((x) => `${x.id}:${x.nominalTopInWindow}${x.docked ? ':D' : ''}`).join(' ') }); }
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
  // early poller: parse-time scroll position and document height (rAF only starts once the page paints)
  let pk = '';
  const poll = () => { const dk = [...document.querySelectorAll<HTMLElement>('.tile')].map((t) => (t.style.transform === '' ? 'D' : 'm')).join('') + (document.querySelector('[data-mosaic]')?.classList.contains('is-assembling') ? 'A' : '-'); const k = Math.round(scrollY) + '|' + document.documentElement.scrollHeight + '|' + document.readyState + '|' + dk; if (k !== pk) { pk = k; log.push({ t: now(), e: 'poll', dk, y: Math.round(scrollY), docH: document.documentElement.scrollHeight, rs: document.readyState, hasMosaic: !!document.querySelector('[data-mosaic]'), sheets: [...document.styleSheets].length, pendingLinks: [...document.querySelectorAll('link[rel=stylesheet]')].filter((l) => !(l as HTMLLinkElement).sheet).length, blocks: [...document.querySelectorAll('main > *')].map((e) => e.id || e.className.toString().split(' ')[0] || e.tagName).map((n, i) => n + ':' + Math.round(([...document.querySelectorAll('main > *')][i] as HTMLElement).offsetHeight)).join(' ') }); } };
  setInterval(poll, 0);
};

const pose = (page: Page) => page.evaluate(() => Object.fromEntries([...document.querySelectorAll<HTMLElement>('.tile')].map((t) => [t.dataset.service!, t.style.transform === ''])));

test('restored-scroll lifecycle timeline', async ({ page }, info) => {
  await page.addInitScript(init);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/');
  const settle = () => page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter((i) => i.loading !== 'lazy' || i.getBoundingClientRect().top < innerHeight * 1.5).map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); })))); });
  await settle();
  const top = await page.evaluate(() => document.querySelector('[data-mosaic]')!.getBoundingClientRect().top + scrollY);
  const target = Math.round(top - 500);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), target);
  await page.waitForTimeout(160);
  const beforeReload = await page.evaluate(() => (window as any).__log.length);
  await page.evaluate(() => (window as any).__log.push({ e: 'MARK before reload', t: 0, y: Math.round(scrollY) }));
  const firstDoc = await page.evaluate(() => (window as any).__log);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 8000 }).toBeGreaterThan(target - 80);
  await settle();
  await page.waitForTimeout(350);
  const timeline = await page.evaluate(() => (window as any).__log);
  const finalPose = await pose(page);
  const geom = await page.evaluate(() => { const m = document.querySelector<HTMLElement>('[data-mosaic]')!; const mt = m.getBoundingClientRect().top; return { vh: innerHeight, tiles: [...document.querySelectorAll<HTMLElement>('.tile')].map((t) => ({ id: t.dataset.service!, nominalTop: Math.round(mt + t.offsetTop) })) }; });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(`${OUT}/worker${info.parallelIndex}-repeat${info.repeatEachIndex}.json`, JSON.stringify({ target, finalPose, geom, firstDocLength: beforeReload, firstDoc, timeline }, null, 1));
  const video = geom.tiles.find((t) => t.id === 'video')!;
  info.annotations.push({ type: 'result', description: `video nominal ${video.nominalTop}, docked=${finalPose.video}` });
});
