import { launch } from './browser.mjs';
const url = process.argv[2] || 'http://localhost:4321/en/';
const w = +(process.argv[3] || 1440);
const b = await launch();
const ctx = await b.newContext({ viewport: { width: w, height: 1000 } });
await ctx.addInitScript(() => localStorage.setItem('odalo.cookies', 'essential'));
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'networkidle' });
await p.locator('.mosaic').scrollIntoViewIfNeeded();
const snap = () => p.evaluate(() => {
  const m = document.querySelector('.mosaic'); const mr = m.getBoundingClientRect();
  return {
    active: m.dataset.active, h: Math.round(mr.height), pageH: document.documentElement.scrollHeight,
    tiles: [...document.querySelectorAll('.tile')].map((t) => { const r = t.getBoundingClientRect();
      const kids = [...t.querySelectorAll('.tile__title,.tile__text,.tile__actions')];
      const over = kids.some((k) => k.getBoundingClientRect().bottom > r.bottom - 8 || k.scrollWidth > k.clientWidth + 1);
      return { id: t.dataset.service, w: Math.round(r.width), h: Math.round(r.height), clipped: over }; }),
  };
});
const rest = await snap(); console.log('rest', JSON.stringify(rest));
const box = await p.locator('.mosaic').boundingBox();
const targets = { web: [0.2, 0.2], local: [0.9, 0.2], video: [0.1, 0.85], ads: [0.9, 0.85] };
for (const [id, [fx, fy]] of Object.entries(targets)) {
  await p.mouse.move(box.x + box.width * fx, box.y + box.height * fy, { steps: 6 });
  await p.waitForTimeout(700);
  const s = await snap(); console.log(id, JSON.stringify({ active: s.active, h: s.h, pageH: s.pageH, tiles: s.tiles.map(t => `${t.id}:${t.w}${t.clipped ? '!CLIP' : ''}`) }));
}
await p.mouse.move(5, 5); await p.waitForTimeout(700);
console.log('after leave', (await snap()).active === '' ? 'reset ok' : 'NOT reset');
await b.close();
