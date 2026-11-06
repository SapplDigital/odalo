// M3 prototype, revision 2. One irregular, fitted polygon mosaic (power diagram, see geom.mjs) behind and around large text pieces.
//  - Rest: deterministic seeds (layout.mjs) -> static polygons. Nothing moves on its own.
//  - Decorative hover: INSTANT. The piece under a fine pointer gets ~1.1x linear size (weight bump of 0.8*rho^2), the diagram is recomputed,
//    so neighbours yield and the pattern stays fitted. Hit-testing always uses the REST polygons, so the target never moves under the pointer.
//  - Content: click / Enter / Space opens a piece in place: its cell grows (bigger weight, everything below shifts down), the others keep their text rects.
//    Close or Escape collapses and returns focus to the piece's button. Clicks/selection inside revealed text never close it. Native links stay native.
import { layout, stateSeeds, power } from './layout.mjs';
import { resample, lerpPoly, inside, pts, inscribed, area } from './geom.mjs';

const $ = (s, r = document) => r.querySelector(s);
const stage = $('.stage'), canvas = $('.canvas'), svg = $('.geo');
const boxes = [...canvas.querySelectorAll('.box')]; // hero, then the three service pieces
const wideMq = matchMedia('(min-width: 64em)'), reducedMq = matchMedia('(prefers-reduced-motion: reduce)'), fineMq = matchMedia('(hover: hover) and (pointer: fine)');
const NS = 'http://www.w3.org/2000/svg', MARGIN = 22, MORPH_MS = 380;

let L, V, k = 1, cur = -1, dH = 0, cells = [], rest = null, shown = null, hov = -1, busy = false, raf = 0;

const data = (o) => { // everything that describes the mosaic when piece o is open (-1: at rest)
  const seeds = stateSeeds(L, o, dH), H = L.H + (o >= 0 ? dH : 0), polys = power(seeds, L.W, H);
  const rects = boxes.map((_, b) => {
    if (o < 0 || b === o + 1) return inscribed(polys[b], MARGIN);
    const r0 = rest.rects[b], below = L.seeds[b].y > L.seeds[o + 1].y + 40;
    return { ...r0, y: r0.y + (below ? dH : 0) };
  });
  return { seeds, H, polys, rects };
};

function place(rects, H) {
  boxes.forEach((b, i) => { const r = rects[i]; Object.assign(b.style, { left: r.x * k + 'px', top: r.y * k + 'px', width: r.w * k + 'px', height: r.h * k + 'px' }); });
  canvas.style.height = H * k + 'px'; svg.setAttribute('viewBox', `0 0 ${L.W} ${H}`);
}
const paint = (polys) => polys.forEach((p, i) => cells[i].setAttribute('points', p.length > 2 ? pts(p) : ''));

function build() {
  V = wideMq.matches ? 'wide' : 'narrow'; stage.dataset.v = V; L = layout(V); cur = -1; dH = L.dH; hov = -1;
  svg.replaceChildren(); cells = L.seeds.map((s) => { const p = document.createElementNS(NS, 'polygon'); p.setAttribute('class', `cell f-${s.color}${s.content ? ' cell--c' : ''}`); svg.append(p); return p; });
  boxes.forEach((b) => { b.classList.remove('is-open', 'is-hot'); const t = $('.pc__toggle', b); if (t) { t.hidden = false; setLabel(b, false); } });
  k = canvas.clientWidth / L.W; stage.style.setProperty('--k', k);
  rest = null; rest = { rects: boxes.map(() => null) }; rest = data(-1); // rest rects are the inscribed rectangles of the rest polygons
  shown = { polys: rest.polys, rects: rest.rects, H: L.H };
  paint(rest.polys); place(rest.rects, L.H); report();
}
function setLabel(b, on) { const t = $('.pc__toggle', b); if (!t) return; t.setAttribute('aria-expanded', String(on)); $('.pc__tl', t).textContent = on ? t.dataset.close : t.dataset.open; }

/** Open piece o: grow dH until the full text fits the cell's inscribed rectangle (any language, any font scale), then return that state. */
function fitOpen(o) {
  const b = boxes[o + 1]; b.classList.add('is-open'); dH = L.dH;
  let d, prev = null;
  for (let n = 0; n < 8; n++) {
    d = data(o); const r = d.rects[o + 1];
    Object.assign(b.style, { width: r.w * k + 'px', height: 'auto' });
    const need = b.offsetHeight / k;
    if (need <= r.h) break;
    // secant step: how much the inscribed height grew per unit of dH last time (0.7 on the first pass)
    const slope = prev && Math.abs(dH - prev.dH) > 1 ? Math.max(0.2, (r.h - prev.h) / (dH - prev.dH)) : 0.7;
    prev = { dH, h: r.h }; dH += (need - r.h) / slope + 8;
  }
  return d;
}

function go(o) { // o: piece to show open (-1 = none)
  if (busy || o === cur) return;
  const prev = cur, from = { polys: shown.polys.map((p) => resample(p)), rects: shown.rects.map((r) => ({ ...r })), H: shown.H };
  if (prev >= 0) { boxes[prev + 1].classList.remove('is-open'); setLabel(boxes[prev + 1], false); }
  let to;
  if (o >= 0) { to = fitOpen(o); setLabel(boxes[o + 1], true); } else to = rest;
  cur = o; hov = -1; $('[data-hot]', canvas)?.removeAttribute('data-hot');
  const toR = to.polys.map((p) => resample(p));
  const finish = () => { shown = { polys: to.polys, rects: to.rects, H: to.H }; paint(to.polys); place(to.rects, to.H); busy = false; report(); };
  if (reducedMq.matches) { finish(); return; }
  busy = true; const t0 = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - t0) / MORPH_MS), e = 1 - Math.pow(1 - t, 3);
    paint(from.polys.map((p, i) => lerpPoly(p, toR[i], e)));
    place(from.rects.map((r, i) => ({ x: r.x + (to.rects[i].x - r.x) * e, y: r.y + (to.rects[i].y - r.y) * e, w: r.w + (to.rects[i].w - r.w) * e, h: r.h + (to.rects[i].h - r.h) * e })), from.H + (to.H - from.H) * e);
    if (t < 1) raf = requestAnimationFrame(step); else finish();
  };
  raf = requestAnimationFrame(step);
}

// ---- pointer: instant decorative hover on REST polygons ----
const hit = (e) => { const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k; return shown.polys.findIndex((p) => p.length > 2 && inside(p, x, y)); };
const hotOff = () => { svg.querySelector('.is-hot')?.classList.remove('is-hot'); boxes.forEach((b) => b.classList.remove('is-hot')); };
function hover(i) {
  if (i === hov) return; hov = i;
  if (i < 0) { paint(shown.polys); return; }
  const rho = Math.sqrt(Math.abs(area(shown.polys[i])) / Math.PI);
  const seeds = (cur < 0 ? L.seeds : stateSeeds(L, cur, dH)).map((s, j) => (j === i ? { ...s, w: s.w + 0.8 * rho * rho } : s));
  paint(power(seeds, L.W, shown.H));
}
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || !fineMq.matches || busy) return;
  const i = hit(e);
  hotOff();
  if (i >= 1 && i <= 3 && cur !== i - 1) { cells[i].classList.add('is-hot'); boxes[i].classList.add('is-hot'); canvas.style.cursor = 'pointer'; } else canvas.style.cursor = '';
  if (cur >= 0) { hover(-1); return; } // calm while a piece is open
  hover(i > 3 ? i : -1);
});
canvas.addEventListener('pointerleave', () => { hotOff(); hover(-1); canvas.style.cursor = ''; });

canvas.addEventListener('click', (e) => {
  if (e.target.closest('a')) return; // native links
  const tg = e.target.closest('.pc__toggle');
  if (tg) { const o = +tg.closest('.box').dataset.i; go(cur === o ? -1 : o); tg.focus({ preventScroll: true }); reveal(); return; }
  if (busy) return;
  const i = hit(e);
  if (i >= 1 && i <= 3 && cur !== i - 1) { go(i - 1); $('.pc__toggle', boxes[i]).focus({ preventScroll: true }); reveal(); } // closed piece opens from anywhere on it; an open piece ignores body clicks
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cur >= 0 && !busy) { const b = boxes[cur + 1]; go(-1); $('.pc__toggle', b).focus({ preventScroll: true }); } });
function reveal() { requestAnimationFrame(() => { if (cur < 0) return; const r = boxes[cur + 1].getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) boxes[cur + 1].scrollIntoView({ block: 'nearest', behavior: reducedMq.matches ? 'auto' : 'smooth' }); }); }

// ---- sizing ----
new ResizeObserver(() => { const nk = canvas.clientWidth / L.W; if (Math.abs(nk - k) < 1e-4) return; k = nk; stage.style.setProperty('--k', k); if (!busy) place(shown.rects, shown.H); }).observe(stage);
wideMq.addEventListener('change', () => { cancelAnimationFrame(raf); busy = false; build(); });

/** Dev aid: which text boxes overflow their polygon rectangle (window.__fit after each state). */
function report() { window.__fit = boxes.map((b, i) => ({ i, over: Math.round(b.scrollHeight - b.clientHeight), overW: Math.round(b.scrollWidth - b.clientWidth) })); }
window.__m3 = { go, get cur() { return cur; }, get dH() { return dH; }, get shown() { return shown; } };
build();
