// Tile geometry for the Odalo logo. Every shape is drawn around its own bounding-box centre (0,0), so a tile's pose is
// {x, y, r}: world position of that centre and a clockwise rotation in degrees about it. Units are abstract "u".

/** @typedef {{ d: string, contains: (x: number, y: number) => boolean, w: number, h: number }} Shape */

/** @type {Record<string, Shape>} */
export const SHAPES = {
  // Half annulus (R=2u, r=1u), bulging up, flat edge at the bottom: an arch. Rotated it makes the halves of every "o".
  ha: {
    w: 4, h: 2,
    d: 'M-2 1A2 2 0 0 1 2 1L1 1A1 1 0 0 0 -1 1Z',
    contains: (x, y) => { const d = Math.hypot(x, y - 1); return y <= 1 && d >= 1 && d <= 2; },
  },
  // 1u square, 1u x 6u and 1u x 4u bars (stems), terminal dot r = 0.6u.
  sq: { w: 1, h: 1, d: 'M-.5-.5h1v1h-1Z', contains: (x, y) => Math.abs(x) <= .5 && Math.abs(y) <= .5 },
  r6: { w: 1, h: 6, d: 'M-.5-3h1v6h-1Z', contains: (x, y) => Math.abs(x) <= .5 && Math.abs(y) <= 3 },
  r4: { w: 1, h: 4, d: 'M-.5-2h1v4h-1Z', contains: (x, y) => Math.abs(x) <= .5 && Math.abs(y) <= 2 },
  dot: { w: 1.2, h: 1.2, d: 'M-.6 0a.6 .6 0 1 0 1.2 0a.6 .6 0 1 0 -1.2 0Z', contains: (x, y) => Math.hypot(x, y) <= .6 },
};

/** World-space containment test for a tile at pose p. */
export function covers(shapeName, p, wx, wy) {
  const a = (-p.r * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const dx = wx - p.x, dy = wy - p.y;
  return SHAPES[shapeName].contains(dx * c - dy * s, dx * s + dy * c);
}
