// Writes the static, editable SVG versions of the logo (name + the three symbols) and the favicon from the same data the
// site animates. Each tile is a <g id="..."> with a transform and one <path>, so the files stay editable in any vector tool.
// Usage: node scripts/make-mosaic-assets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { SHAPES, covers } from '../src/mosaic/shapes.js';
import { PALETTE } from '../src/mosaic/palette.js';
import { LOGO_TILES, LOGO_ARRANGEMENTS, LOGO_SYMBOLS } from '../src/mosaic/logo.js';

const ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const OUT = join(ROOT, 'brand/logo');
mkdirSync(OUT, { recursive: true });
const f = (n) => +n.toFixed(3);

/** Tight bounds of the painted tiles (sampled), plus a margin. */
function tight(arr, margin) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const t of LOGO_TILES) { const p = arr[t.id]; for (let y = p.y - 3.2; y <= p.y + 3.2; y += 0.05) for (let x = p.x - 3.2; x <= p.x + 3.2; x += 0.05) if (covers(t.shape, p, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
  return { x: f(x0 - margin), y: f(y0 - margin), w: f(x1 - x0 + 2 * margin), h: f(y1 - y0 + 2 * margin) };
}
function svg({ arr, title, margin = 0.3, box, recolor = (c) => c, extra = '', wrapOpen = '', wrapClose = '' }) {
  const b = box || tight(arr, margin);
  const g = LOGO_TILES.map((t) => { const p = arr[t.id]; const c = recolor(t.fill);
    return `  <g id="${t.id}" transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.r)})"><path d="${SHAPES[t.shape].d}" fill="${c}" stroke="${c}" stroke-width="0.04" stroke-linejoin="round"/></g>`; }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.w} ${b.h}" role="img" aria-label="${title}">\n  <title>${title}</title>\n${extra}${wrapOpen}${g}\n${wrapClose}</svg>\n`;
}
const dark = (c) => (c === PALETTE.navy ? PALETTE.paper : c); // dark-background treatment: navy tiles turn light
const write = (name, text) => { writeFileSync(join(OUT, name), text); console.log('•', name); };

write('odalo-logo.svg', svg({ arr: LOGO_ARRANGEMENTS.wordmark, title: 'odalo' }));
write('odalo-logo-dark.svg', svg({ arr: LOGO_ARRANGEMENTS.wordmark, title: 'odalo', recolor: dark }));
for (const n of LOGO_SYMBOLS) {
  write(`symbol-${n}.svg`, svg({ arr: LOGO_ARRANGEMENTS[n], title: `Odalo symbol, ${n}` }));
  write(`symbol-${n}-dark.svg`, svg({ arr: LOGO_ARRANGEMENTS[n], title: `Odalo symbol, ${n}`, recolor: dark }));
}
// Favicon: the first symbol on a rounded light square.
const fb = tight(LOGO_ARRANGEMENTS[LOGO_SYMBOLS[0]], 0.7), s = Math.max(fb.w, fb.h), box = { x: f(fb.x - (s - fb.w) / 2), y: f(fb.y - (s - fb.h) / 2), w: f(s), h: f(s) };
writeFileSync(join(ROOT, 'favicon.svg'), svg({ arr: LOGO_ARRANGEMENTS[LOGO_SYMBOLS[0]], title: 'Odalo', box, extra: `  <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="${f(s * 0.18)}" fill="${PALETTE.paper}"/>\n` }));
console.log('• public/favicon.svg');
