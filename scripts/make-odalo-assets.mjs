// Static, editable SVGs of the supplied odalo animation (each arrangement) + the favicon, from the module's own data.
// Same geometry, ids and colours as the animation; the layout maths mirrors odalo-mosaic.mjs (shared scale 50, centred per arrangement).
// Usage: node scripts/make-odalo-assets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mosaicData as D } from '../src/mosaic/odalo/odalo-mosaic.mjs';

const ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const OUT = join(ROOT, 'brand/odalo');
mkdirSync(OUT, { recursive: true });
const f = (n) => +n.toFixed(2);

function layout(name) {
  const poses = D.arrangements[name];
  const pts = poses.flatMap((p) => D.tiles[p.id - 1].points.map(([x, y]) => { const a = (p.r * Math.PI) / 180; return [p.x + x * Math.cos(a) - y * Math.sin(a), p.y + x * Math.sin(a) + y * Math.cos(a)]; }));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return poses.map((p) => ({ id: p.id, x: 500 + (p.x - cx) * 50, y: 303 + (p.y - cy) * 50, r: p.r }));
}
/** @param {{ gap?: string, pad?: number, title: string, bg?: string, rx?: number, square?: boolean }} o */
function svg(name, o) {
  const poses = layout(name);
  const pts = poses.flatMap((p) => D.tiles[p.id - 1].points.map(([x, y]) => { const a = (p.r * Math.PI) / 180; return [p.x + x * 50 * Math.cos(a) - y * 50 * Math.sin(a), p.y + x * 50 * Math.sin(a) + y * 50 * Math.cos(a)]; }));
  const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
  const pad = o.pad ?? 10, w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
  const s = o.square ? Math.max(w, h) : null;
  const vx = o.square ? x0 - pad - (s - w) / 2 : x0 - pad, vy = o.square ? y0 - pad - (s - h) / 2 : y0 - pad, vw = s ?? w, vh = s ?? h;
  const g = poses.map((p) => { const t = D.tiles[p.id - 1]; return `    <g id="piece-${p.id}" transform="translate(${f(p.x)} ${f(p.y)}) rotate(${p.r})"><polygon points="${t.points.map(([x, y]) => `${x * 50},${y * 50}`).join(' ')}" fill="${t.color}"/></g>`; }).join('\n');
  const bg = o.bg ? `  <rect x="${f(vx)}" y="${f(vy)}" width="${f(vw)}" height="${f(vh)}" rx="${f(vw * (o.rx ?? 0))}" fill="${o.bg}"/>\n` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(vx)} ${f(vy)} ${f(vw)} ${f(vh)}" role="img" aria-label="${o.title}">\n  <title>${o.title}</title>\n${bg}  <g stroke="${o.gap ?? '#f7f9f8'}" stroke-width="1" stroke-linejoin="miter">\n${g}\n  </g>\n</svg>\n`;
}
const names = Object.keys(D.arrangements);
for (const n of names) { writeFileSync(join(OUT, `${n}.svg`), svg(n, { title: n === 'word' ? 'odalo' : `odalo ${n}` })); console.log('•', `brand/odalo/${n}.svg`); }
writeFileSync(join(OUT, 'word-on-dark.svg'), svg('word', { title: 'odalo', gap: '#203b57', bg: '#203b57' })); console.log('• brand/odalo/word-on-dark.svg');
// Favicon: the hexagon (compact, readable at 16px) on a rounded light square.
writeFileSync(join(ROOT, 'favicon.svg'), svg('hexagon', { title: 'odalo', pad: 14, bg: '#f7f9f8', rx: 0.16, square: true })); console.log('• favicon.svg');
