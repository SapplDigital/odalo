// Focused M1 checks (Edge via Playwright). Plain assertions, one log line each; exits non-zero on failure.
// Run: node checks.mjs > evidence/checks-<run>.log   (needs the preview from `node serve.mjs 4331`)
import { chromium } from '@playwright/test';
const base = 'http://127.0.0.1:4331';
const browser = await chromium.launch({ channel: 'msedge' });
let fails = 0;
const ok = (name, cond, detail = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); if (!cond) fails++; };
const open = async (w, h, url, o = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...o });
  const p = await ctx.newPage(); await p.goto(base + url, { waitUntil: 'networkidle' });
  await p.evaluate(async () => { document.querySelectorAll('img').forEach((i) => (i.loading = 'eager')); await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  return { ctx, p };
};
const toWork = (p) => p.evaluate(() => { const r = document.querySelector('[data-wf-board]').getBoundingClientRect(); scrollTo(0, scrollY + r.top - 24); });
const metrics = (p) => p.evaluate(() => {
  const board = document.querySelector('[data-wf-board]');
  const b = board.getBoundingClientRect();
  const nx = document.querySelector('[data-next-section]').getBoundingClientRect();
  const cards = [...document.querySelectorAll('[data-wf-card]')].map((c) => {
    const r = c.getBoundingClientRect(), t = c.querySelector('.wf-title a').getBoundingClientRect(), a = c.querySelector('.wf-art').getBoundingClientRect();
    const vis = [...c.querySelectorAll('.wf-art img')].find((i) => i.getBoundingClientRect().width > 0);
    const body = c.querySelector('.wf-body');
    return { id: c.dataset.p, x: r.x, y: r.y, w: r.width, h: r.height, tx: t.x, ty: t.y, art: [a.width, a.height], nat: vis ? vis.naturalWidth / vis.naturalHeight : 0,
      bodyClip: body.scrollHeight - body.clientHeight, textClip: [...c.querySelectorAll('.wf-body *:not(.sr-only)')].some((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline') };
  });
  return { boardH: b.height, next: nx.top + scrollY, page: document.documentElement.scrollHeight, active: board.dataset.active || '', cards };
});
const activeNow = (p) => p.evaluate(() => document.querySelector('[data-wf-board]').dataset.active || '');
const hoverAt = async (p, fx, fy) => { const bb = await p.locator('[data-wf-board]').boundingBox(); await p.mouse.move(bb.x + bb.width * fx, bb.y + bb.height * fy, { steps: 5 }); await p.waitForTimeout(750); };

for (const lang of ['en', 'de']) for (const [w, h] of [[1440, 900], [1280, 800]]) {
  const tag = `${w}x${h} ${lang}`;
  const { ctx, p } = await open(w, h, `/${lang}.html`); await toWork(p); await p.waitForTimeout(900);
  const rest = await metrics(p);
  ok(`${tag}: shared-edge geometry live`, await p.evaluate(() => getComputedStyle(document.querySelector('[data-wf-board]')).getPropertyValue('--geo').trim() === '1'));
  ok(`${tag} rest: no text clipped`, rest.cards.every((c) => c.bodyClip <= 1 && !c.textClip), rest.cards.map((c) => c.bodyClip).join('/'));
  const states = { hotel: [0.3, 0.4], clinic: [0.8, 0.2], shop: [0.8, 0.8] };
  for (const [name, [fx, fy]] of Object.entries(states)) {
    await hoverAt(p, fx, fy); const m = await metrics(p);
    ok(`${tag} hover ${name}: active=${m.active}`, m.active.includes(name));
    ok(`${tag} hover ${name}: board, next section and page height unchanged`, Math.abs(m.boardH - rest.boardH) < 0.5 && Math.abs(m.next - rest.next) < 0.5 && m.page === rest.page, `board ${rest.boardH.toFixed(0)}→${m.boardH.toFixed(0)} next ${rest.next.toFixed(0)}→${m.next.toFixed(0)}`);
    const act = m.cards.find((c) => c.id.includes(name)), r0 = rest.cards.find((c) => c.id.includes(name));
    ok(`${tag} hover ${name}: active card grew`, act.w * act.h > r0.w * r0.h * 1.005, `${(r0.w * r0.h / 1000).toFixed(0)}k → ${(act.w * act.h / 1000).toFixed(0)}k px²`);
    ok(`${tag} hover ${name}: active card's own title stationary on screen`, Math.abs(act.tx - r0.tx) < 1 && Math.abs(act.ty - r0.ty) < 1, `Δ${(act.tx - r0.tx).toFixed(1)},${(act.ty - r0.ty).toFixed(1)}`);
    console.log(`INFO  ${tag} hover ${name}: title shifts ${m.cards.map((c) => { const q = rest.cards.find((z) => z.id === c.id); return `${c.id.replace('sample-', '')} Δ${(c.tx - q.tx).toFixed(0)},${(c.ty - q.ty).toFixed(0)}`; }).join(' | ')}`);
    ok(`${tag} hover ${name}: no text clipped in any card`, m.cards.every((c) => c.bodyClip <= 1 && !c.textClip), m.cards.map((c) => c.bodyClip).join('/'));
    for (const c of m.cards.filter((q) => q.id !== 'sample-hotel')) { const ar = c.art[0] / c.art[1]; ok(`${tag} hover ${name}: ${c.id} picture box = image shape (no side crop)`, Math.abs(ar / c.nat - 1) < 0.04, `box ${ar.toFixed(3)} image ${c.nat.toFixed(3)}`); }
  }
  const bb = await p.locator('[data-wf-board]').boundingBox();
  for (const [label, pt] of [['hotel|support edge', (d) => [bb.x + bb.width * 0.51667 + d, bb.y + bb.height * 0.25]], ['clinic|shop edge', (d) => [bb.x + bb.width * 0.8, bb.y + bb.height * 0.5 + d]]]) {
    await p.mouse.move(5, 5); await p.waitForTimeout(500); let changes = 0, last = '';
    for (let i = 0; i < 60; i++) { const d = (i % 2 ? 14 : -14) * (1 + (i % 3) * 0.1); const [x, y] = pt(d); await p.mouse.move(x, y); await p.waitForTimeout(30); const a = await activeNow(p); if (a !== last) { changes++; last = a; } }
    await p.waitForTimeout(600);
    ok(`${tag}: ±14px jitter on the ${label} → at most 2 state changes in 60 moves`, changes <= 2, `changes=${changes}`);
  }
  for (const [label, start, pt] of [['clinic|shop edge (clinic active first)', [0.8, 0.2], (d) => [bb.x + bb.width * 0.8, bb.y + bb.height * 0.5 + d]], ['hotel|support edge (hotel active first)', [0.3, 0.4], (d) => [bb.x + bb.width * 0.51667 + d, bb.y + bb.height * 0.3]]]) {
    await p.mouse.move(5, 5); await p.waitForTimeout(500); await hoverAt(p, start[0], start[1]); const first = await activeNow(p); let changes = 0, last = first;
    for (let i = 0; i < 60; i++) { const d = (i % 2 ? 14 : -14) * (1 + (i % 3) * 0.1); const [x, y] = pt(d); await p.mouse.move(x, y); await p.waitForTimeout(30); const a = await activeNow(p); if (a !== last) { changes++; last = a; } }
    await p.waitForTimeout(500);
    ok(`${tag}: with ${first.replace('sample-', '')} active, ±14px jitter on the ${label} → no state change`, changes === 0 && (await activeNow(p)) === first, `changes=${changes}`);
  }
  await p.mouse.move(5, 5); await p.waitForTimeout(500); const seq = [];
  for (let y = 0.3; y <= 0.75; y += 0.01) { await p.mouse.move(bb.x + bb.width * 0.8, bb.y + bb.height * y); await p.waitForTimeout(25); const a = await activeNow(p); if (seq[seq.length - 1] !== a) seq.push(a); }
  ok(`${tag}: slow sweep down the support column changes target at most once after the first`, seq.filter(Boolean).length <= 2, seq.join(' > '));
  await p.mouse.move(5, 5); await p.waitForTimeout(700);
  ok(`${tag}: pointer leaves → board back to rest`, (await activeNow(p)) === '');
  await ctx.close();
}

{
  const { ctx, p } = await open(1440, 900, '/en.html'); await toWork(p); await p.waitForTimeout(900);
  const rest = await metrics(p);
  const order = await p.evaluate(() => [...document.querySelectorAll('#work a')].map((a) => a.getAttribute('href')));
  ok('keyboard: Work links in DOM order = note link, hotel, clinic, shop', order.join('|') === ['/en/work/', '/en/work/sample-hotel/', '/en/work/sample-clinic/', '/en/work/sample-shop/'].join('|'), order.join(' '));
  await p.locator('#work a[href$="/en/work/"]').focus(); await p.keyboard.press('Tab'); await p.waitForTimeout(700);
  let m = await metrics(p); ok('keyboard: Tab to hotel → hotel emphasised', m.active === 'sample-hotel', m.active);
  const ring = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.wf-card--feat')); return `${s.outlineStyle} ${s.outlineWidth}`; });
  ok('keyboard: visible whole-card focus ring', /solid 3px/.test(ring), ring);
  await p.keyboard.press('Tab'); await p.waitForTimeout(700); m = await metrics(p); ok('keyboard: Tab → clinic emphasised', m.active === 'sample-clinic', m.active);
  await p.keyboard.press('Tab'); await p.waitForTimeout(700); m = await metrics(p); ok('keyboard: Tab → shop emphasised', m.active === 'sample-shop', m.active);
  ok('keyboard: board and next section unchanged', Math.abs(m.boardH - rest.boardH) < 0.5 && Math.abs(m.next - rest.next) < 0.5);
  await p.keyboard.press('Tab'); await p.waitForTimeout(900); m = await metrics(p); ok('keyboard: focus leaves → rest', m.active === '', m.active);
  await toWork(p); await p.waitForTimeout(400); let navs = 0; p.on('framenavigated', (f) => { if (f === p.mainFrame()) navs++; });
  const bb = await p.locator('[data-wf-board]').boundingBox(); await Promise.all([p.waitForURL('**/work/sample-hotel/'), p.mouse.click(bb.x + bb.width * 0.3, bb.y + bb.height * 0.3)]); await p.waitForTimeout(400);
  ok('click on the featured card → exactly one native navigation to its case study', navs === 1 && p.url().endsWith('/en/work/sample-hotel/'), `${navs} navigation → ${p.url()}`);
  await ctx.close();
}
{
  const { ctx, p } = await open(1440, 900, '/en.html', { hasTouch: true }); await toWork(p); await p.waitForTimeout(900);
  const bb = await p.locator('[data-wf-board]').boundingBox(); const cdp = await ctx.newCDPSession(p);
  await cdp.send('Input.synthesizeScrollGesture', { x: bb.x + bb.width * 0.8, y: bb.y + bb.height * 0.6, yDistance: -250, gestureSourceType: 'touch', speed: 800 }); await p.waitForTimeout(700);
  ok('touch: a scroll gesture across the board selects nothing', (await activeNow(p)) === '');
  await ctx.close();
}
for (const [w, h] of [[390, 844], [320, 700]]) {
  const { ctx, p } = await open(w, h, '/en.html', { hasTouch: true, isMobile: true });
  await toWork(p); await p.waitForTimeout(800); let navs = 0; p.on('framenavigated', (f) => { if (f === p.mainFrame()) navs++; });
  const card = p.locator('[data-p="sample-clinic"]'); await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(500); const bb = await card.boundingBox();
  await Promise.all([p.waitForURL('**/work/sample-clinic/'), p.touchscreen.tap(bb.x + bb.width / 2, Math.min(bb.y + bb.height * 0.75, h - 24))]); await p.waitForTimeout(400);
  ok(`${w}px phone: one tap on a project card navigates once`, navs === 1 && p.url().endsWith('/en/work/sample-clinic/'), `${navs} navigation → ${p.url()}`);
  await ctx.close();
}
for (const [w, h] of [[390, 844], [320, 700], [834, 1100]]) {
  const { ctx, p } = await open(w, h, '/de.html', { hasTouch: true, isMobile: w < 800 });
  const r = await p.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, clip: [...document.querySelectorAll('#work .wf-body, #work .wf-head__note')].some((b) => b.scrollHeight > b.clientHeight + 1) }));
  ok(`${w}px DE: no horizontal overflow, no clipped card text`, r.over <= 0 && !r.clip, JSON.stringify(r));
  await ctx.close();
}
{
  const { ctx, p } = await open(1440, 900, '/en.html', { reducedMotion: 'reduce' }); await toWork(p); await p.waitForTimeout(500); const rest = await metrics(p);
  await hoverAt(p, 0.8, 0.8); const m = await metrics(p);
  ok('reduced motion: hover changes no geometry', m.active === '' && JSON.stringify(m.cards.map((c) => [c.x, c.y, c.w, c.h])) === JSON.stringify(rest.cards.map((c) => [c.x, c.y, c.w, c.h])));
  ok('reduced motion: peg and cards docked (no pending transform)', await p.evaluate(() => getComputedStyle(document.querySelector('.wf-peg')).transform === 'none' && [...document.querySelectorAll('.wf-card')].every((c) => getComputedStyle(c).transform === 'none')));
  await ctx.close();
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }); const q = await c2.newPage(); await q.goto(base + '/en.html', { waitUntil: 'networkidle' });
  const links = await q.$$eval('#work a', (a) => a.map((x) => x.getAttribute('href')));
  ok('no JS: all 4 Work links and all text are present and laid out', links.length === 4 && await q.evaluate(() => [...document.querySelectorAll('#work h2, #work h3, #work p')].every((e) => getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().height > 0)), links.join(' '));
  await c2.close();
}
for (const lang of ['en', 'de']) {
  const { ctx, p } = await open(1440, 900, `/${lang}.html`); await p.addStyleTag({ content: 'html{font-size:200%}' }); await p.waitForTimeout(400); await toWork(p); await p.waitForTimeout(800);
  const r = await p.evaluate(() => ({ geo: getComputedStyle(document.querySelector('[data-wf-board]')).getPropertyValue('--geo').trim(), clip: [...document.querySelectorAll('#work .wf-body, #work .wf-head__note')].some((b) => b.scrollHeight > b.clientHeight + 1), over: document.documentElement.scrollWidth - innerWidth }));
  ok(`200% text ${lang}: natural flow (no fixed-height board), nothing clipped, no overflow`, r.geo !== '1' && !r.clip && r.over <= 0, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
