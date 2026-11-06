// Pure geometry for the M3 prototype (runs in the browser and in node). No dependencies, no randomness except the seeded rng below.
// A "power diagram" (weighted Voronoi): seed i owns every point x with |x-pi|^2 - wi <= |x-pj|^2 - wj for all j. Every cell is a convex polygon,
// the cells tile the rectangle exactly, and a bigger weight gives a bigger cell: content pieces get big weights, decorative pieces small ones.

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Keep the part of a convex polygon where nx*x + ny*y <= c. */
function clip(poly, nx, ny, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = nx * a[0] + ny * a[1] - c, db = nx * b[0] + ny * b[1] - c;
    if (da <= 0) out.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}

/** seeds: [{x, y, w}] -> one convex polygon ([[x,y],...]) per seed, tiling [0,W]x[0,H]. */
export function power(seeds, W, H) {
  return seeds.map((s, i) => {
    let poly = [[0, 0], [W, 0], [W, H], [0, H]];
    let R = Math.max(...poly.map((p) => Math.hypot(p[0] - s.x, p[1] - s.y)));
    for (let j = 0; j < seeds.length; j++) {
      if (j === i) continue;
      const o = seeds[j], dx = o.x - s.x, dy = o.y - s.y, d2 = dx * dx + dy * dy, d = Math.sqrt(d2);
      if ((d2 + s.w - o.w) / (2 * d) > R) continue; // bisector lies beyond the current cell: cannot cut it
      poly = clip(poly, 2 * dx, 2 * dy, o.x * o.x + o.y * o.y - s.x * s.x - s.y * s.y + s.w - o.w);
      if (poly.length < 3) return [];
      R = Math.max(...poly.map((p) => Math.hypot(p[0] - s.x, p[1] - s.y)));
    }
    return poly;
  });
}

export function area(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
export function centroid(p) { let x = 0, y = 0; for (const q of p) { x += q[0]; y += q[1]; } return [x / p.length, y / p.length]; }
export function inside(p, x, y) { // convex or not: even-odd
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
  return c;
}
export const pts = (p) => p.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');

/** Same number of points on every cell, starting where a ray straight up from the centroid meets the outline, so two states of one cell can be blended. */
export function resample(p, N = 24) {
  if (p.length < 3) return Array.from({ length: N }, () => [0, 0]);
  const q = area(p) < 0 ? p.slice().reverse() : p; // consistent winding
  const [cx, cy] = centroid(q);
  let start = 0, sd = Infinity;
  for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; if ((a[0] - cx) * (b[0] - cx) <= 0 && a[0] !== b[0]) { const t = (cx - a[0]) / (b[0] - a[0]), y = a[1] + (b[1] - a[1]) * t; if (y < cy && cy - y < sd) { sd = cy - y; start = i + t; } } }
  const edges = q.map((a, i) => { const b = q[(i + 1) % q.length]; return Math.hypot(b[0] - a[0], b[1] - a[1]); });
  const total = edges.reduce((s, e) => s + e, 0);
  const at = (u) => { // u in [0,total): point on outline measured from the start point
    let i = Math.floor(start), off = (start - i) * edges[i], dist = u + off;
    while (dist >= edges[i % q.length]) { dist -= edges[i % q.length]; i++; }
    const a = q[i % q.length], b = q[(i + 1) % q.length], t = dist / edges[i % q.length];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  return Array.from({ length: N }, (_, n) => at((total * n) / N));
}
export const lerpPoly = (a, b, t) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);

/** Largest axis-aligned rectangle (aspect w/h within [amin,amax]) whose margin-expanded box still lies inside the polygon. Grid search; deterministic. */
export function inscribed(p, margin = 20, amin = 0.3, amax = 2.4) {
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const fits = (cx, cy, hw, hh) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(([sx, sy]) => inside(p, cx + sx * (hw + margin), cy + sy * (hh + margin)));
  let best = null, bestA = 0;
  const step = Math.max(6, Math.min(x1 - x0, y1 - y0) / 40);
  for (let cx = x0; cx <= x1; cx += step) for (let cy = y0; cy <= y1; cy += step) {
    if (!inside(p, cx, cy)) continue;
    for (const a of [0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 1, 1.2, 1.45, 1.75, 2.1, 2.4]) {
      if (a < amin || a > amax) continue;
      let lo = 0, hi = Math.min(x1 - x0, (y1 - y0) * a) / 2; // half-width
      if (!fits(cx, cy, 4, 4 / a)) continue;
      for (let n = 0; n < 12; n++) { const mid = (lo + hi) / 2; if (fits(cx, cy, mid, mid / a)) lo = mid; else hi = mid; }
      const w = lo * 2, h = (lo * 2) / a;
      if (w * h > bestA) { bestA = w * h; best = { x: cx - lo, y: cy - lo / a, w, h }; }
    }
  }
  return best;
}
