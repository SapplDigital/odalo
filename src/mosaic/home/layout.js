// Deterministic seed layouts for the compact homepage mosaic (same seeds on every load; nothing random per interaction).
// Content pieces come first in the seed list, in the page's box order: hero, web, local, video, ads, plans, about.
import { rng, power } from './geom.js';

const COLORS = ['sand', 'slate', 'coral'];
// open: x the opened piece centres on, grow: weight radius gained per unit of added height. fixed: never shifts down (the tall hero column).
const cfgs = {
  wide: {
    grid: true, W: 1200, H: 1060, ko: 1.1, ws: 0.8, sp: 56, jit: 14, seed: 11, dH: 260,
    content: [
      { k: 'hero', x: 210, y: 320, r: 255, color: 'sand', fixed: true },
      { k: 'web', service: true, x: 610, y: 150, r: 200, color: 'slate', open: 810 },
      { k: 'local', service: true, x: 1020, y: 190, r: 200, color: 'sand', open: 810 },
      { k: 'video', service: true, x: 640, y: 520, r: 200, color: 'coral', open: 810 },
      { k: 'ads', service: true, x: 1005, y: 485, r: 200, color: 'slate', open: 810 },
      { k: 'plans', x: 400, y: 885, r: 215, color: 'sand' },
      { k: 'about', x: 880, y: 885, r: 215, color: 'slate' },
    ],
  },
  narrow: {
    W: 420, H: 1700, ko: 1.6, ws: 0.2, sp: 48, jit: 16, seed: 11, dH: 360,
    content: [
      { k: 'hero', x: 210, y: 235, r: 215, color: 'sand' },
      { k: 'web', service: true, x: 210, y: 640, r: 150, color: 'slate', open: 210 },
      { k: 'local', service: true, x: 210, y: 935, r: 150, color: 'sand', open: 210 },
      { k: 'video', service: true, x: 210, y: 1230, r: 150, color: 'coral', open: 210 },
      { k: 'ads', service: true, x: 210, y: 1525, r: 150, color: 'slate', open: 210 },
    ],
  },
};
const WEIGHTS = [1400, 2600, 2600, 5200, 5200, 9000, 9000, 16000]; // no tiny pieces: the smallest cell is still a calm, readable shape

/** Seeds for the resting mosaic. */
/** Greedy 3-colouring of every seed that has no colour yet, so no two touching pieces share one (seeds with a colour - content - are fixed). */
export function colorize(seeds, polys) {
  const key = (p) => p[0].toFixed(0) + ',' + p[1].toFixed(0), owners = new Map();
  polys.forEach((p, i) => p.forEach((q) => { const k = key(q); (owners.get(k) || owners.set(k, new Set()).get(k)).add(i); }));
  const nb = polys.map(() => new Set()); for (const s of owners.values()) for (const a of s) for (const b of s) if (a !== b) nb[a].add(b);
  seeds.forEach((s, i) => {
    if (s.color) return;
    const used = new Set([...nb[i]].map((j) => seeds[j].color)); const ok = COLORS.filter((x) => !used.has(x)); const pool = ok.length ? ok : COLORS;
    s.color = pool[Math.floor(s.pick * pool.length) % pool.length];
  });
}

/** Small decorative seeds for everything round the canvas (header, side margins, fold, footer): the same grid, jitter and weights as the canvas itself.
 *  `box` is the page rectangle in canvas units [x0,y0,x1,y1]; seeds below the canvas (y > H) are marked so they shift with it. */
export function outerDecor(L, box, H) {
  const c = L.cfg, rnd = rng(c.seed + 101), out = [], [x0, y0, x1, y1] = box;
  for (let gy = Math.floor(y0 / c.sp); gy * c.sp <= y1; gy++) for (let gx = Math.floor(x0 / c.sp); gx * c.sp <= x1; gx++) {
    const x = gx * c.sp + (rnd() - 0.5) * 2 * c.jit, y = gy * c.sp + (rnd() - 0.5) * 2 * c.jit, w = WEIGHTS[Math.floor(rnd() * WEIGHTS.length)] * c.ws, pick = rnd();
    if (x > -c.sp * 0.4 && x < L.W + c.sp * 0.4 && y > -c.sp * 0.4 && y < H + c.sp * 0.4) continue; // inside the canvas: it has its own seeds
    out.push({ x, y, w, pick, content: false, outer: true });
  }
  return out;
}

export function layout(variant) {
  const c = cfgs[variant], rnd = rng(c.seed);
  const seeds = c.content.map((s) => ({ ...s, w: s.r * s.r, content: true }));
  for (let gy = 0; gy * c.sp < c.H + c.sp; gy++) for (let gx = 0; gx * c.sp < c.W + c.sp; gx++) {
    const x = Math.min(c.W - 3, Math.max(3, gx * c.sp + (rnd() - 0.5) * 2 * c.jit)), y = Math.min(c.H - 3, Math.max(3, gy * c.sp + (rnd() - 0.5) * 2 * c.jit));
    const w = WEIGHTS[Math.floor(rnd() * WEIGHTS.length)] * c.ws, pick = rnd();
    if (c.content.some((s) => Math.hypot(s.x - x, s.y - y) < s.r * c.ko + c.sp * 0.3)) continue; // a rim of small pieces round each information piece
    seeds.push({ x, y, w, pick, content: false });
  }
  colorize(seeds, power(seeds, c.W, c.H));
  return { cfg: c, W: c.W, H: c.H, dH: c.dH, seeds, nContent: c.content.length, grid: !!c.grid };
}

// Wide, open: the opened service takes the whole right-hand area (x from X0, height BASE + dH); the other three services form a row of three beneath it;
// the links row and anything below drop by DELTA. The hero column does not move. Narrow: the opened piece grows in place and everything below shifts down.
const GRID = { X0: 420, ZONE_BOTTOM: 700, BASE: 330, ROW_H: 340, REST_BOTTOM: 660, ROW_X: [545, 810, 1075] };

// At narrower canvases the text keeps its readable minimum size while the pieces shrink, so the row of three gets taller (never narrower text): L.k is the canvas scale.
const rowH = (L) => GRID.ROW_H * Math.max(1, 1 / (L.k || 1));

export function stateH(L, o, dH) {
  if (o < 0) return L.H;
  return L.grid ? L.H + (dH + GRID.BASE + rowH(L) - GRID.REST_BOTTOM) : L.H + dH;
}

/** Seeds for "content piece o is open" (o = -1: rest). `bump[i]` (optional) scales a piece's weight when its text needed more room in this state. */
export function stateSeeds(L, o, dH, bump = []) {
  if (o < 0) return L.seeds;
  const sc = (s, i) => (bump[i] ? { ...s, w: s.w * bump[i] } : s);
  if (L.grid) {
    const Hopen = GRID.BASE + dH, delta = stateH(L, o, dH) - L.H;
    let slot = 0;
    return L.seeds.map((s, i) => {
      if (!s.content) {
        if (s.x > GRID.X0 - 10 && s.x <= L.W && s.y > 0 && s.y < GRID.ZONE_BOTTOM) return { ...s, w: -1e7 }; // decorative bits inside the services zone make room
        return s.y >= GRID.ZONE_BOTTOM ? { ...s, y: s.y + delta } : s;
      }
      if (s.k === 'hero') return sc(s, i);
      if (i === o) { const r = 300 + dH * 0.3; return sc({ ...s, x: s.open, y: Hopen / 2, w: r * r }, i); }
      if (s.service) return sc({ ...s, x: GRID.ROW_X[slot++], y: Hopen + rowH(L) / 2, w: 190 * 190 * Math.max(1, 1 / (L.k || 1)) }, i);
      return sc({ ...s, y: s.y + delta }, i);
    });
  }
  const y0 = L.seeds[o].y;
  return L.seeds.map((s, i) => {
    if (i === o) { const r = Math.sqrt(s.w) + dH * 0.55; return sc({ ...s, x: s.open ?? s.x, y: s.y + dH * 0.5, w: r * r }, i); }
    return s.y > y0 + 40 ? sc({ ...s, y: s.y + dH }, i) : sc(s, i);
  });
}
export { power };
