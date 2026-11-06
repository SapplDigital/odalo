// Shared page field (all Odalo routes): header / footer elements marked data-fr become irregular tiles on one mosaic, drawn by the home runtime (src/mosaic/home)
// or, on dedicated routes, by mountPageField below. One root-scoped passive pointermove handler (fine mouse only; it never prevents or intercepts anything) and one
// ResizeObserver that only writes SVG attributes (never layout), so nothing can loop.
import { rng, power, pts, area, inside } from './home/geom.js';
import { colorize } from './home/layout.js';

export const PAD = 6;
const NS = 'http://www.w3.org/2000/svg';

/** One octagon tile per element, a little larger than it and never overlapping another element's tile; `origin` = {left, top} of the coordinate system, `k` its scale.
 *  `grow` scales the air round the element; hidden elements give []. A closed disclosure keeps laid-out (but unseen) content: only its summary counts.
 *  The header panel of small screens is its own opaque surface (narrow). */
export function regionPolys(els, origin, k, narrow = false, grow = 1) {
  const info = els.map((el) => {
    const r = el.getBoundingClientRect(), d = el.closest('details');
    return r.width > 0 && r.height > 0 && !(d && !d.open && !el.matches('summary')) && !(narrow && el.closest('.hdr__panel')) ? { x: (r.left - origin.left) / k, y: (r.top - origin.top) / k, w: r.width / k, h: r.height / k } : null;
  });
  const gapX = (a, b) => (a.y < b.y + b.h && b.y < a.y + a.h ? Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)) : Infinity), gapY = (a, b) => (a.x < b.x + b.w && b.x < a.x + a.w ? Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h)) : Infinity);
  const free = (r, side, i) => { // room to the nearest other element on that side
    let f = Infinity;
    info.forEach((o, j) => {
      if (!o || j === i) return;
      const g = side < 2 ? gapX(r, o) : gapY(r, o), toward = side === 0 ? o.x + o.w <= r.x + 0.01 : side === 1 ? o.x >= r.x + r.w - 0.01 : side === 2 ? o.y + o.h <= r.y + 0.01 : o.y >= r.y + r.h - 0.01;
      if (toward && g < f) f = Math.max(0, g);
    });
    return f;
  };
  return info.map((r, i) => {
    if (!r) return [];
    const rnd = rng(31 + i * 7), e = [0, 1, 2, 3].map((side) => Math.max(0, Math.min(((PAD * 1.8 + rnd() * PAD * 2.4) * grow) / k, free(r, side, i) / 2 - 0.5 / k))); // left, right, top, bottom
    const [l, rt, t, b] = e, x0 = r.x - l, x1 = r.x + r.w + rt, y0 = r.y - t, y1 = r.y + r.h + b, ch = (a, d) => (a + d) * (0.45 + rnd() * 0.5); // chamfers always leave the element's corners inside
    return [[x0 + ch(l, t), y0], [x1 - ch(rt, t), y0], [x1, y0 + ch(rt, t)], [x1, y1 - ch(rt, b)], [x1 - ch(rt, b), y1], [x0 + ch(l, b), y1], [x0, y1 - ch(l, b)], [x0, y0 + ch(l, t)]];
  });
}

/** Dedicated routes: header/footer tiles as on the home page, and every top-level section of the page is one large quiet tile in its own colour (full-width sections
 *  get their corners cut inwards, so field pieces show at the joins). The HTML flow is untouched. */
export function mountPageField(root) {
  const svg = root.querySelector('.pg-field'), regEls = [...root.querySelectorAll('[data-fr]')];
  const secEls = [...root.querySelectorAll('main > section, main > .wrap > section')];
  if (!svg) return;
  const hdrMq = matchMedia('(max-width: 69.99em)'), SP = 56, JIT = 20, WEIGHTS = [1400, 2600, 2600, 5200, 5200, 9000, 9000, 16000];
  // the section's own colour is read once, before the field takes over its background
  const paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() || '#f8fafa';
  const colors = secEls.map((el) => { const c = getComputedStyle(el).backgroundColor; return !c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent' ? paper : c; });
  const mk = (cls) => { const p = document.createElementNS(NS, 'polygon'); p.setAttribute('class', cls); return p; };
  let raf = 0, last = '', st = null, hov = -1;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');

  function draw() {
    raf = 0;
    const pr = root.getBoundingClientRect(), W = pr.width, H = pr.height, origin = { left: pr.left, top: pr.top };
    const sig = [Math.round(W), Math.round(H), hdrMq.matches, regEls.map((e) => e.getBoundingClientRect().height | 0).join(), secEls.map((e) => e.offsetHeight).join()].join('|');
    if (sig === last) return; last = sig;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const sec = secEls.map((el, i) => { const r = el.getBoundingClientRect(); return { el, i, x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height }; });
    // every section is a full-width band with its corners cut inwards (a section narrower than the page - the audit's wrap - is widened to the page edges and
    // reaches half-way to its neighbours, at most 24px), so field pieces show at the joins and in the corners
    const hdrB = root.querySelector('header')?.getBoundingClientRect().bottom - pr.top || 0, ftrT = root.querySelector('footer')?.getBoundingClientRect().top - pr.top || H;
    const polysSec = sec.map((s, n) => {
      if (!(s.w > 0 && s.h > 0)) return [];
      const prev = n ? sec[n - 1].y + sec[n - 1].h : hdrB, next = n < sec.length - 1 ? sec[n + 1].y : ftrT;
      const rnd = rng(77 + s.i * 13), c = () => Math.min(14 + rnd() * 22, s.h / 3), x0 = 0, x1 = W, y0 = s.y - Math.max(0, Math.min(24, (s.y - prev) / 2)), y1 = s.y + s.h + Math.max(0, Math.min(24, (next - s.y - s.h) / 2));
      return [[x0 + c(), y0], [x1 - c(), y0], [x1, y0 + c()], [x1, y1 - c()], [x1 - c(), y1], [x0 + c(), y1], [x0, y1 - c()], [x0, y0 + c()]];
    });
    const regs = regionPolys(regEls, origin, 1, hdrMq.matches);
    // decoration: the same grid / weights as the home field, only where no section tile covers it (the middle of a tile is never seen)
    const rnd = rng(101), seeds = [], covered = sec.filter((s) => s.w > 0 && s.h > 0).map((s) => ({ x0: 70, y0: s.y + 70, x1: W - 70, y1: s.y + s.h - 70 }));
    for (let gy = 0; gy * SP <= H + SP; gy++) for (let gx = 0; gx * SP <= W + SP; gx++) {
      const x = Math.min(W - 3, Math.max(3, gx * SP + (rnd() - 0.5) * 2 * JIT)), y = Math.min(H - 3, Math.max(3, gy * SP + (rnd() - 0.5) * 2 * JIT)), w = WEIGHTS[Math.floor(rnd() * WEIGHTS.length)] * 0.6, pick = rnd();
      if (covered.some((c) => x > c.x0 && x < c.x1 && y > c.y0 && y < c.y1)) continue;
      seeds.push({ x, y, w, pick });
    }
    const polys = power(seeds, W, H); colorize(seeds, polys);
    const cells = seeds.map((s, i) => { const p = mk(`hm-cell hm-f-${s.color} hm-t${Math.floor(s.pick * 3) % 3}`); p.setAttribute('points', polys[i].length > 2 ? pts(polys[i]) : ''); return p; });
    st = { seeds, polys, cells, prot: [...polysSec, ...regs], W, H }; hov = -1;
    svg.replaceChildren(
      ...cells,
      ...polysSec.map((q, i) => { const p = mk('hm-cell'); p.style.fill = colors[i]; p.setAttribute('points', q.length > 2 ? pts(q) : ''); return p; }),
      ...regs.map((q, i) => { const p = mk(`hm-cell hm-cell--r hm-f-${regEls[i].dataset.fr}`); p.setAttribute('points', q.length > 2 ? pts(q) : ''); return p; }),
    );
  }
  /** Instant ~1.1x growth of an exposed decorative piece (weight + 0.8*rho^2), neighbours yield; hit-testing uses the REST polygons, so the target never moves under the
   *  pointer. Section tiles and header/footer tiles are protected: over them nothing happens. */
  function hover(i) {
    if (i === hov || !st) return; hov = i;
    const polys = i < 0 ? st.polys : (() => { const rho = Math.sqrt(Math.abs(area(st.polys[i])) / Math.PI); return power(st.seeds.map((s, j) => (j === i ? { ...s, w: s.w + 0.8 * rho * rho } : s)), st.W, st.H); })();
    polys.forEach((q, j) => st.cells[j].setAttribute('points', q.length > 2 ? pts(q) : ''));
  }
  root.addEventListener('pointermove', (e) => {
    if (!st || e.pointerType !== 'mouse' || !fine.matches) return;
    const r = root.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    hover(st.prot.some((q) => q.length > 2 && inside(q, x, y)) ? -1 : st.polys.findIndex((q) => q.length > 2 && inside(q, x, y)));
  }, { passive: true });
  root.addEventListener('pointerleave', () => hover(-1), { passive: true });
  const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
  try {
    secEls.forEach((el) => el.classList.add('fld-tile'));
    root.classList.add('fld-live');
    draw();
    const ro = new ResizeObserver(schedule); // draw() only writes SVG attributes, never layout: no feedback
    ro.observe(root); [...regEls, ...secEls].forEach((e) => ro.observe(e)); // a block can change size while the whole page keeps its height
    hdrMq.addEventListener('change', () => { last = ''; schedule(); });
    document.fonts?.ready.then(() => { last = ''; schedule(); });
  } catch { root.classList.remove('fld-live'); secEls.forEach((el) => el.classList.remove('fld-tile')); svg.replaceChildren(); }
}
