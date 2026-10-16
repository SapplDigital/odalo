// Mosaic animation engine: moves a fixed set of tiles between named arrangements.
// Tiles only translate and rotate (an SVG `transform` attribute); geometry, size and colour never change.
// Interruptible by design: every transition starts from the pose each tile has RIGHT NOW, so rapid input never jumps.
// `planMove` / `sampleMove` are pure, so the offline path optimiser and the browser use exactly the same motion.

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // cubic in-out
const shortest = (from, to) => (((to - from) % 360) + 540) % 360 - 180;

/**
 * @typedef {{x:number,y:number,r:number}} Pose
 * @typedef {{ duration?: number, stagger?: number, spread?: number, delays?: Record<string, number>, rot?: Record<string, [number, number]>, lift?: Record<string, number>, order?: 'x'|'index' }} MoveOptions
 * `delays`: stagger slot 0..1 per tile; `rot`: the share of the move [from,to] during which a tile turns; `lift`: signed multiplier of the mid-flight bulge.
 */

/**
 * Plan one transition. Returns a tween per tile; `start` is an offset in ms from the beginning of the move.
 * @param {Record<string, Pose>} from live poses
 * @param {Record<string, Pose>} target arrangement
 * @param {{id: string}[]} tiles
 * @param {MoveOptions} [o]
 */
export function planMove(from, target, tiles, o = {}) {
  const { duration = 1500, stagger = 500, spread = 0.9, delays, order = 'x', rot, lift } = o;
  // Stagger slot per tile: explicit (optimised) delays win, otherwise by target x (reads left to right) or inventory order.
  const frac = {};
  if (delays) tiles.forEach((t) => { frac[t.id] = delays[t.id] ?? 0; });
  else {
    const ranked = [...tiles].sort((a, b) => (order === 'x' ? target[a.id].x - target[b.id].x : 0));
    ranked.forEach((t, i) => { frac[t.id] = i / Math.max(1, tiles.length - 1); });
  }
  // Mid-flight bulge direction: away from the centroid of the move, so pieces part instead of grinding past each other.
  let cx = 0, cy = 0;
  for (const t of tiles) { cx += (from[t.id].x + target[t.id].x) / 2; cy += (from[t.id].y + target[t.id].y) / 2; }
  cx /= tiles.length; cy /= tiles.length;
  /** @type {Record<string, any>} */
  const out = {};
  for (const t of tiles) {
    const p = from[t.id], to = target[t.id];
    const mx = (p.x + to.x) / 2 - cx, my = (p.y + to.y) / 2 - cy, len = Math.hypot(mx, my) || 1;
    const dr = shortest(p.r, to.r);
    out[t.id] = {
      from: { x: p.x, y: p.y, r: p.r }, to: { x: to.x, y: to.y, r: p.r + dr }, dr,
      start: stagger * frac[t.id], dur: duration,
      nx: mx / len, ny: my / len, spread: (lift?.[t.id] ?? 1) * Math.min(spread, 0.35 * Math.hypot(to.x - p.x, to.y - p.y)),
      rot: rot?.[t.id] ?? [0, 1],
    };
  }
  return out;
}

/** Pose of a planned tween `ms` after the move began. `done` once it has arrived. */
export function sampleMove(tw, ms) {
  const k = (ms - tw.start) / tw.dur;
  if (k <= 0) return { x: tw.from.x, y: tw.from.y, r: tw.from.r, done: false };
  if (k >= 1) return { x: tw.to.x, y: tw.to.y, r: tw.to.r, done: true };
  const e = easeInOut(k), lift = Math.sin(Math.PI * e) * tw.spread;
  // Turning can be confined to part of the move (e.g. while the tile is still in free space).
  const [ra, rb] = tw.rot, er = easeInOut(Math.min(1, Math.max(0, (k - ra) / Math.max(1e-6, rb - ra))));
  return {
    x: tw.from.x + (tw.to.x - tw.from.x) * e + tw.nx * lift,
    y: tw.from.y + (tw.to.y - tw.from.y) * e + tw.ny * lift,
    r: tw.from.r + tw.dr * er, done: false,
  };
}

/**
 * @param {{ svg: SVGElement, tiles: {id:string}[], arrangements: Record<string, Record<string, Pose>>,
 *           initial: string, reduced?: () => boolean, plans?: Record<string, MoveOptions> }} cfg
 *   `plans` optionally holds optimised per-transition options keyed `${from}>${to}` (see the optimiser script).
 */
export function createMosaic(cfg) {
  const { svg, tiles, arrangements } = cfg;
  const els = new Map(tiles.map((t) => [t.id, svg.querySelector(`[data-tile="${t.id}"]`)]));
  for (const [id, el] of els) if (!el) throw new Error(`mosaic: tile ${id} missing from the markup`);

  /** live pose per tile */
  const pose = new Map(tiles.map((t) => [t.id, { ...arrangements[cfg.initial][t.id] }]));
  let move = null;           // { plan, t0 }
  let current = cfg.initial;
  let raf = 0;
  let settleCbs = [];

  const write = (id) => {
    const p = pose.get(id);
    els.get(id).setAttribute('transform', `translate(${p.x.toFixed(3)} ${p.y.toFixed(3)}) rotate(${p.r.toFixed(2)})`);
  };
  const writeAll = () => tiles.forEach((t) => write(t.id));
  writeAll();

  function frame(now) {
    if (!move) { raf = 0; return; }
    const ms = now - move.t0;
    let busy = false;
    for (const t of tiles) {
      const s = sampleMove(move.plan[t.id], ms);
      const p = pose.get(t.id);
      p.x = s.x; p.y = s.y; p.r = s.r;
      if (!s.done) busy = true;
      write(t.id);
    }
    if (busy) raf = requestAnimationFrame(frame);
    else { raf = 0; move = null; const cbs = settleCbs; settleCbs = []; cbs.forEach((cb) => cb(current)); }
  }

  /**
   * Move to an arrangement; resolves when everything has arrived (or the move was replaced - then it resolves on the last arrival).
   * @param {string} name target arrangement
   * @param {MoveOptions} [o]
   */
  function goTo(name, o = {}) {
    const target = arrangements[name];
    if (!target) throw new Error(`mosaic: unknown arrangement ${name}`);
    const plan = cfg.plans?.[`${current}>${name}`];
    if (cfg.reduced?.()) { setNow(name); return Promise.resolve(name); }
    const live = Object.fromEntries([...pose].map(([k, v]) => [k, { ...v }]));
    current = name;
    // Optimised delays belong to a clean start-from-rest; a move interrupted mid-flight falls back to the plain stagger.
    const clean = !move;
    move = { plan: planMove(live, target, tiles, { ...o, ...(clean && plan ? { delays: plan.delays, rot: plan.rot, lift: plan.lift } : {}) }), t0: performance.now() };
    if (!raf) raf = requestAnimationFrame(frame);
    return new Promise((res) => settleCbs.push(res));
  }

  /** Jump straight to an arrangement (initial state, reduced motion, failure recovery). */
  function setNow(name) {
    current = name;
    cancelAnimationFrame(raf); raf = 0; move = null;
    const target = arrangements[name];
    for (const t of tiles) pose.set(t.id, { ...target[t.id] });
    writeAll();
    const cbs = settleCbs; settleCbs = []; cbs.forEach((cb) => cb(name));
  }

  return {
    goTo, setNow,
    get current() { return current; },
    get moving() { return move !== null; },
    /** live poses (for tests/verification) */
    poses: () => Object.fromEntries([...pose].map(([k, v]) => [k, { ...v }])),
    destroy() { cancelAnimationFrame(raf); move = null; },
  };
}
