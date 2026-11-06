// Deterministic seed layouts for the M3 prototype (static at rest: the same seeds every load, nothing random per interaction).
import { rng, power, centroid, area } from './geom.mjs';

const COLORS = ['sand', 'slate', 'coral'];
const cfgs = {
  wide: {
    W: 1200, H: 2240, sp: 92, jit: 34, seed: 7, dH: 330,
    content: [
      { k: 'hero', x: 330, y: 340, r: 380, color: 'sand' },
      { k: 'c0', x: 880, y: 800, r: 340, color: 'slate' },
      { k: 'c1', x: 330, y: 1330, r: 345, color: 'sand' },
      { k: 'c2', x: 880, y: 1860, r: 335, color: 'coral' },
    ],
  },
  narrow: {
    W: 420, H: 2800, sp: 70, jit: 20, seed: 11, dH: 420,
    content: [
      { k: 'hero', x: 210, y: 315, r: 305, color: 'sand' },
      { k: 'c0', x: 210, y: 980, r: 295, color: 'slate' },
      { k: 'c1', x: 210, y: 1640, r: 295, color: 'sand' },
      { k: 'c2', x: 210, y: 2300, r: 295, color: 'coral' },
    ],
  },
};
const WEIGHTS = [400, 800, 1400, 2600, 5200, 5200, 9000, 16000];

/** Seeds for the resting mosaic. First entries are the content seeds (hero, c0, c1, c2), the rest decorative. */
export function layout(variant) {
  const c = cfgs[variant], rnd = rng(c.seed);
  const seeds = c.content.map((s) => ({ ...s, w: s.r * s.r, content: true }));
  for (let gy = 0; gy * c.sp < c.H + c.sp; gy++) for (let gx = 0; gx * c.sp < c.W + c.sp; gx++) {
    const x = Math.min(c.W - 3, Math.max(3, gx * c.sp + (rnd() - 0.5) * 2 * c.jit)), y = Math.min(c.H - 3, Math.max(3, gy * c.sp + (rnd() - 0.5) * 2 * c.jit));
    const w = WEIGHTS[Math.floor(rnd() * WEIGHTS.length)], pick = rnd();
    if (c.content.some((s) => Math.hypot(s.x - x, s.y - y) < s.r * 0.8 + c.sp * 0.3)) continue; // keep a rim of small pieces around each information piece
    seeds.push({ x, y, w, pick, content: false });
  }
  // colours: content fixed; decorative greedy-coloured so no two touching pieces share a colour
  const polys = power(seeds, c.W, c.H), key = (p) => p[0].toFixed(0) + ',' + p[1].toFixed(0);
  const owners = new Map(); polys.forEach((p, i) => p.forEach((q) => { const k = key(q); (owners.get(k) || owners.set(k, new Set()).get(k)).add(i); }));
  const nb = polys.map(() => new Set()); for (const s of owners.values()) for (const a of s) for (const b of s) if (a !== b) nb[a].add(b);
  seeds.forEach((s, i) => {
    if (s.content) return;
    const used = new Set([...nb[i]].map((j) => seeds[j].color)); const ok = COLORS.filter((x) => !used.has(x)); const pool = ok.length ? ok : COLORS;
    s.color = pool[Math.floor(s.pick * pool.length) % pool.length];
  });
  return { W: c.W, H: c.H, dH: c.dH, seeds, nContent: c.content.length };
}

/** Seeds for the state "content piece o is open" (o = -1: rest). Everything below the piece shifts down by dH, the piece itself gets a bigger weight and moves down half of it. */
export function stateSeeds(L, o, dH) {
  if (o < 0) return L.seeds;
  const y0 = L.seeds[o + 1].y; // content seeds are [hero, c0, c1, c2]
  return L.seeds.map((s, i) => {
    if (i === o + 1) { const r = Math.sqrt(s.w) + dH * 0.55; return { ...s, y: s.y + dH * 0.5, w: r * r }; }
    return s.y > y0 + 40 ? { ...s, y: s.y + dH } : s;
  });
}
export { power, centroid, area };
