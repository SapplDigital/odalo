// Path optimiser for the Odalo logo tile system.
// Searches (a) which identical-shape tile takes which slot of each abstract arrangement and (b) each tile's stagger slot,
// minimising how much tiles overlap while travelling (wordmark -> symbol and back). Writes src/mosaic/logo-plan.js.
// Same motion maths as the browser (engine.js planMove/sampleMove). Deterministic: seeded RNG.
// Usage: node scripts/mosaic-optimize.mjs [iterations=4000]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { planMove, sampleMove } from '../src/mosaic/engine.js';
import { covers } from '../src/mosaic/shapes.js';
import { LOGO_TILES as HERO_TILES, LOGO_RAW as HERO_RAW, LOGO_SYMBOLS as HERO_STARTS, centred } from '../src/mosaic/logo-base.js';

const ITER = +(process.argv[2] || 4000);
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
const CELL = 0.2, W = 24, H = 11, GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL);
const grid = new Uint8Array(GW * GH);
const R = { ha: 2.3, sq: 0.8, r6: 3.1, r4: 2.1, dot: 0.7 }; // bounding radius per shape (generous)

/** Overlapping area (u^2) of all tiles at the given poses. */
function overlap(poses) {
  grid.fill(0);
  let n = 0;
  for (const t of HERO_TILES) {
    const p = poses[t.id], r = R[t.shape];
    const x0 = Math.max(0, Math.floor((p.x - r) / CELL)), x1 = Math.min(GW - 1, Math.ceil((p.x + r) / CELL));
    const y0 = Math.max(0, Math.floor((p.y - r) / CELL)), y1 = Math.min(GH - 1, Math.ceil((p.y + r) / CELL));
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++)
      if (covers(t.shape, p, (gx + 0.5) * CELL, (gy + 0.5) * CELL) && ++grid[gy * GW + gx] === 2) n++;
  }
  return n * CELL * CELL;
}
/** Time-integral of overlap (u^2 * s) for a planned move. */
function pathCost(from, to, opts, v) {
  const plan = planMove(from, to, HERO_TILES, { ...opts, delays: v.delays, rot: v.rot, lift: v.lift });
  const total = opts.stagger + opts.duration, dt = 50;
  let sum = 0, worst = 0;
  for (let ms = 0; ms <= total; ms += dt) {
    const poses = {};
    for (const t of HERO_TILES) { const s = sampleMove(plan[t.id], ms); poses[t.id] = { x: s.x, y: s.y, r: s.r }; }
    const o = overlap(poses);
    sum += o * (dt / 1000); worst = Math.max(worst, o);
  }
  return { sum, worst };
}

const TO = { duration: 900, stagger: 450, spread: 0.6 };    // symbol -> name; must match Header.astro
const FROM = { duration: 900, stagger: 450, spread: 0.6 };  // name -> symbol
const ROT = [[0, 1], [0, 0.5], [0.5, 1], [0, 0.7], [0.3, 1]];   // when a tile may turn during its move
const LIFT = [1, 0, -1, 1.7];                                      // signed bulge multipliers
const wordmark = centred(HERO_RAW.wordmark);
const groups = {};
for (const t of HERO_TILES) (groups[t.shape] ||= []).push(t.id);
const swappable = Object.values(groups).filter((g) => g.length > 1);

const perms = {}, plans = {};
for (const start of HERO_STARTS) {
  const raw = HERO_RAW[start];
  let perm = Object.fromEntries(HERO_TILES.map((t) => [t.id, t.id]));
  const arrangement = (pm) => centred(Object.fromEntries(HERO_TILES.map((t) => [t.id, raw[pm[t.id]]])));
  const zero = Object.fromEntries(HERO_TILES.map((t) => [t.id, 0]));
  const fresh = () => ({ delays: { ...zero }, rot: Object.fromEntries(HERO_TILES.map((t) => [t.id, 0])), lift: Object.fromEntries(HERO_TILES.map((t) => [t.id, 0])) });
  let vTo = fresh(), vFrom = fresh();
  // start from the plain left-to-right stagger
  const order = [...HERO_TILES].sort((a, b) => wordmark[a.id].x - wordmark[b.id].x);
  order.forEach((t, i) => { vTo.delays[t.id] = vFrom.delays[t.id] = i / (HERO_TILES.length - 1); });
  const expand = (v) => ({ delays: v.delays, rot: Object.fromEntries(Object.entries(v.rot).map(([k, i]) => [k, ROT[i]])), lift: Object.fromEntries(Object.entries(v.lift).map(([k, i]) => [k, LIFT[i]])) });
  const cost = (pm, a, b) => {
    const arr = arrangement(pm);
    const c1 = pathCost(arr, wordmark, TO, expand(a)), c2 = pathCost(wordmark, arr, FROM, expand(b));
    return { total: c1.sum + c2.sum, worst: Math.max(c1.worst, c2.worst) };
  };
  const cl = (v) => JSON.parse(JSON.stringify(v));
  let cur = cost(perm, vTo, vFrom), best = { ...cur, perm: { ...perm }, vTo: cl(vTo), vFrom: cl(vFrom) };
  const t0 = Date.now();
  for (let i = 0; i < ITER; i++) {
    const T = 0.25 * (1 - i / ITER) + 0.002; // temperature (u^2*s scale)
    const np = { ...perm }, na = cl(vTo), nb = cl(vFrom);
    const kind = rnd(), pick = () => HERO_TILES[Math.floor(rnd() * HERO_TILES.length)].id;
    const which = rnd() < 0.5 ? na : nb;
    if (kind < 0.3) { // swap two same-shape tiles between slots
      const g = swappable[Math.floor(rnd() * swappable.length)];
      const a = g[Math.floor(rnd() * g.length)], b = g[Math.floor(rnd() * g.length)];
      [np[a], np[b]] = [np[b], np[a]];
    } else if (kind < 0.6) which.delays[pick()] = rnd();
    else if (kind < 0.8) which.rot[pick()] = Math.floor(rnd() * ROT.length);
    else if (kind < 0.92) which.lift[pick()] = Math.floor(rnd() * LIFT.length);
    else { const a = pick(), b = pick(); [which.delays[a], which.delays[b]] = [which.delays[b], which.delays[a]]; }
    const c = cost(np, na, nb);
    if (c.total < cur.total || rnd() < Math.exp((cur.total - c.total) / T)) {
      perm = np; vTo = na; vFrom = nb; cur = c;
      if (c.total < best.total) best = { ...c, perm: { ...np }, vTo: cl(na), vFrom: cl(nb) };
    }
    if (i % 500 === 0) console.log(start, i, 'cur', cur.total.toFixed(3), 'best', best.total.toFixed(3), 'worst', best.worst.toFixed(2), `${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  console.log(`== ${start}: best integral ${best.total.toFixed(3)} u^2*s, worst instant ${best.worst.toFixed(2)} u^2`);
  perms[start] = best.perm;
  const pack = (v) => ({ delays: Object.fromEntries(Object.entries(v.delays).map(([k, d]) => [k, +d.toFixed(3)])), rot: Object.fromEntries(Object.entries(v.rot).map(([k, i]) => [k, ROT[i]])), lift: Object.fromEntries(Object.entries(v.lift).map(([k, i]) => [k, LIFT[i]])) });
  plans[`${start}>wordmark`] = pack(best.vTo);
  plans[`wordmark>${start}`] = pack(best.vFrom);
}
writeFileSync(fileURLToPath(new URL('../src/mosaic/logo-plan.js', import.meta.url)), `// GENERATED by scripts/mosaic-optimize.mjs - do not edit by hand.
// perms: which tile sits in which slot of each abstract arrangement (tile id -> slot id); plans: stagger slots per move.
/** @type {Record<string, Record<string, string>>} */
export const LOGO_PERMS = ${JSON.stringify(perms, null, 1)};
/** @type {Record<string, { delays: Record<string, number>, rot: Record<string, [number, number]>, lift: Record<string, number> }>} */
export const LOGO_PLANS = ${JSON.stringify(plans, null, 1)};
`);
console.log('wrote src/mosaic/logo-plan.js');
