// Original, hand-composed SVG illustrations for the fictional "Casa Almina" boutique-hotel concept.
// No photographs, no stock, no generated-model output: every shape below is drawn in code.
// Usage: node docs/review/concept-hotel/tools/build-art.mjs   (writes ../assets/*.svg)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  ink: '#1f3b3f', deep: '#12292c', sea: '#2f6f73', seaLight: '#7fb0ae', lime: '#e9ece7', limeShade: '#cdd3ce', limeDark: '#aeb7b2',
  terra: '#c4552f', terraDark: '#9c3f21', terraLight: '#e07a5a', roof: '#b5502d', shutter: '#2e5e60', wood: '#8d6c4d', woodDark: '#6a4f37',
  linen: '#f4f5f1', leaf: '#4f7a55', leafDark: '#3c6045', glow: '#f7d9a1', glowDeep: '#e8a26a',
};
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const n = (v) => Math.round(v * 10) / 10;
const svg = (w, h, body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">\n<defs>${defs}</defs>\n${body}\n</svg>\n`;
const save = (name, content) => { fs.writeFileSync(path.join(OUT, name), content); console.log('wrote', name, Math.round(content.length / 1024) + ' KB'); };
const arch = (x, y, w, h) => `M${x} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}Z`;
const grad = (id, stops, x2 = 0, y2 = 1, extra = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}" ${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const radial = (id, stops, extra = '') => `<radialGradient id="${id}" ${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a ?? 1}"/>`).join('')}</radialGradient>`;
const plaster = (id, freq = 0.9, alpha = 0.08) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="4" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.16  0 0 0 0 0.16  0 0 0 ${alpha * 4} 0"/></filter>`;

/* ------------------------------------------------------------------ hero: the house at dusk */
function bougainvillea(cx, cy, rx, ry, count) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, r = 5 + rnd() * 9;
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${rnd() > 0.55 ? C.terraLight : C.terra}" opacity="${n(0.75 + rnd() * 0.25)}"/>`;
    if (rnd() > 0.7) s += `<circle cx="${n(x + 6)}" cy="${n(y + 4)}" r="${n(r * 0.5)}" fill="${C.leaf}" opacity="0.9"/>`;
  }
  return s;
}
function litWindow(x, y, w, h, { shutters = true, curtain = true }) {
  const pw = w * 0.5;
  let s = `<path d="${arch(x, y, w, h)}" fill="url(#glow)"/>`;
  s += `<path d="${arch(x, y, w, h)}" fill="url(#winshade)" opacity="0.55"/>`;
  if (curtain) s += `<path d="M${x} ${y + h}V${y + w / 2 + 6}q${w * 0.18} 30 ${w * 0.22} ${h - w / 2 - 6}Z" fill="${C.limeShade}" opacity="0.85"/>`;
  s += `<path d="${arch(x, y, w, h)}" fill="none" stroke="${C.limeDark}" stroke-width="4"/>`;
  s += `<line x1="${x + w / 2}" y1="${y + w / 2 - 4}" x2="${x + w / 2}" y2="${y + h}" stroke="${C.limeDark}" stroke-width="3"/>`;
  s += `<line x1="${x}" y1="${y + h * 0.55}" x2="${x + w}" y2="${y + h * 0.55}" stroke="${C.limeDark}" stroke-width="3"/>`;
  if (shutters) {
    for (const side of [-1, 1]) {
      const sx = side < 0 ? x - pw - 6 : x + w + 6;
      s += `<path d="M${sx} ${y + w / 2}h${pw}v${h - w / 2 + 6}h-${pw}Z" fill="${C.shutter}"/>`;
      for (let k = 0; k < 7; k++) s += `<line x1="${sx + 3}" y1="${y + w / 2 + 14 + k * ((h - w / 2) / 7.2)}" x2="${sx + pw - 3}" y2="${y + w / 2 + 14 + k * ((h - w / 2) / 7.2)}" stroke="${C.deep}" stroke-width="1.6" opacity="0.45"/>`;
    }
  }
  s += `<rect x="${x - 10}" y="${y + h}" width="${w + 20}" height="9" fill="${C.limeDark}"/>`;
  return s;
}
function hero() {
  seed = 11;
  const W = 1000, H = 1250;
  const defs = [
    grad('sky', [[0, '#27465a'], [0.38, '#5d6f80'], [0.62, '#d98f74'], [0.82, '#f0bf92']]),
    radial('sun', [[0, '#ffe2b0', 0.95], [0.45, '#f2a574', 0.35], [1, '#f2a574', 0]], 'cx="0.5" cy="0.5" r="0.5"'),
    grad('sea', [[0, '#e6a07c'], [0.12, '#7d8f94'], [0.5, '#2c5961'], [1, '#183a42']]),
    grad('wall', [[0, '#f1f3ee'], [0.55, '#e3e7e1'], [1, '#c3cbc6']], 1, 0),
    grad('glow', [[0, C.glow], [1, C.glowDeep]]),
    grad('winshade', [[0, '#000', 0.25], [0.5, '#000', 0]]),
    grad('floorshade', [[0, '#12292c', 0], [1, '#12292c', 0.35]]),
    plaster('plasterH', 0.7, 0.07),
  ].join('');
  let b = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  b += `<circle cx="640" cy="760" r="330" fill="url(#sun)"/>`;
  // hills
  b += `<path d="M0 690C120 640 210 650 300 700C420 630 540 640 640 700C760 650 880 650 1000 700V780H0Z" fill="#35525c" opacity="0.9"/>`;
  b += `<path d="M0 730C140 700 260 720 380 748C520 705 700 710 1000 750V800H0Z" fill="#274750"/>`;
  // far village along the harbour
  for (let i = 0; i < 17; i++) { const x = 20 + i * 38 + rnd() * 10, w = 22 + rnd() * 16, h = 18 + rnd() * 22; b += `<rect x="${n(x)}" y="${n(768 - h)}" width="${n(w)}" height="${n(h)}" fill="${i % 3 === 0 ? '#d9b9a2' : '#cfd3cc'}" opacity="0.8"/><path d="M${n(x)} ${n(768 - h)}l${n(w / 2)} -8 ${n(w / 2)} 8Z" fill="${C.roof}" opacity="0.85"/>`; }
  // sea
  b += `<rect y="768" width="${W}" height="190" fill="url(#sea)"/>`;
  for (let i = 0; i < 26; i++) { const y = 778 + rnd() * 165, x = rnd() * 900, w = 40 + rnd() * 180; b += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="2.4" rx="1.2" fill="#ffe6c4" opacity="${n(0.12 + rnd() * 0.3)}"/>`; }
  // boats
  for (const [bx, by, s] of [[110, 880, 1], [250, 920, 0.8], [60, 940, 0.7]]) b += `<g transform="translate(${bx} ${by}) scale(${s})"><path d="M0 0h110l-14 22H18Z" fill="${C.deep}"/><line x1="55" y1="0" x2="55" y2="-90" stroke="${C.deep}" stroke-width="3"/><path d="M58 -86v78l34 -8Z" fill="${C.linen}" opacity="0.92"/><path d="M52 -80v68l-26 -6Z" fill="${C.limeShade}" opacity="0.85"/></g>`;
  // the house
  const hx = 330, hw = 620, top = 300, bottom = 1060;
  b += `<path d="M${hx - 16} ${top + 26}L${hx + hw / 2} ${top - 28}L${hx + hw + 16} ${top + 26}Z" fill="${C.roof}"/>`;
  for (let i = 0; i < 9; i++) b += `<line x1="${hx - 10 + i * 5}" y1="${top + 22 - i * 1.5}" x2="${hx + hw / 2}" y2="${top - 24 + i * 0.4}" stroke="${C.terraDark}" stroke-width="1.4" opacity="0.5"/>`;
  b += `<rect x="${hx}" y="${top + 26}" width="${hw}" height="${bottom - top - 26}" fill="url(#wall)"/>`;
  b += `<rect x="${hx}" y="${top + 26}" width="${hw}" height="${bottom - top - 26}" filter="url(#plasterH)"/>`;
  b += `<rect x="${hx}" y="${top + 26}" width="${hw}" height="26" fill="${C.limeShade}"/><rect x="${hx}" y="${top + 52}" width="${hw}" height="6" fill="#000" opacity="0.08"/>`;
  b += `<line x1="${hx}" y1="${top + 400}" x2="${hx + hw}" y2="${top + 400}" stroke="${C.limeDark}" stroke-width="3"/>`;
  // windows floors 1 and 2
  const cols = [hx + 70, hx + 270, hx + 470];
  for (const [fy, fl] of [[top + 100, 1], [top + 440, 2]]) {
    for (const [i, cx] of cols.entries()) {
      b += litWindow(cx, fy, 80, 200 - (fl === 2 ? 40 : 0), { id: `${fl}${i}` });
      if (fl === 1 && i !== 1) b += `<path d="M${cx - 44} ${fy + 190}h168" stroke="${C.deep}" stroke-width="4"/>${[...Array(13)].map((_, k) => `<line x1="${cx - 40 + k * 13}" y1="${fy + 190}" x2="${cx - 40 + k * 13}" y2="${fy + 232}" stroke="${C.deep}" stroke-width="2.5"/>`).join('')}<path d="M${cx - 44} ${fy + 232}h168" stroke="${C.deep}" stroke-width="4"/>`;
    }
  }
  // ground floor: arched door and two windows
  const dx = hx + 250, dy = top + 700;
  b += `<path d="${arch(dx - 14, dy - 14, 148, 290)}" fill="${C.limeShade}"/>`;
  b += `<path d="${arch(dx, dy, 120, 276)}" fill="url(#glow)"/><path d="${arch(dx, dy, 120, 276)}" fill="url(#winshade)" opacity="0.7"/>`;
  b += `<path d="M${dx + 6} ${dy + 276}V${dy + 66}a54 54 0 0 1 108 0V${dy + 276}Z" fill="none" stroke="${C.shutter}" stroke-width="10"/><line x1="${dx + 60}" y1="${dy + 14}" x2="${dx + 60}" y2="${dy + 276}" stroke="${C.shutter}" stroke-width="8"/>`;
  b += `<rect x="${dx + 98}" y="${dy + 150}" width="10" height="34" rx="4" fill="${C.deep}"/>`;
  b += `<g transform="translate(${dx + 60} ${dy - 40})"><line y1="-14" y2="-6" stroke="${C.deep}" stroke-width="3"/><path d="M-12 -6h24l-4 30h-16Z" fill="${C.deep}"/><path d="M-8 0h16l-3 20h-10Z" fill="${C.glow}"/><circle cy="10" r="46" fill="url(#sun)" opacity="0.75"/></g>`;
  for (const wx of [hx + 70, hx + 470]) { b += litWindow(wx, dy + 40, 80, 210, { id: 'g' + wx }); }
  b += `<rect x="${hx}" y="${bottom - 22}" width="${hw}" height="24" fill="${C.limeDark}"/>`;
  b += bougainvillea(hx + 26, top + 640, 70, 190, 70) + bougainvillea(hx + 540, top + 320, 70, 120, 38) + bougainvillea(dx + 60, dy - 90, 120, 34, 34);
  // pavement, wall and olive
  b += `<path d="M0 1010H${W}V${H}H0Z" fill="#3b4a4b"/>`;
  for (let r = 0; r < 9; r++) for (let c = 0; c < 14; c++) { const x = c * 78 + (r % 2) * 39 - 20, y = 1020 + r * 26; b += `<rect x="${x}" y="${y}" width="72" height="20" rx="5" fill="${(r + c) % 5 === 0 ? '#58696a' : '#4a5a5b'}" opacity="${n(0.7 + rnd() * 0.3)}"/>`; }
  b += `<rect y="1010" width="${W}" height="${H - 1010}" fill="url(#floorshade)"/>`;
  b += `<path d="M0 930H300V1010H0Z" fill="${C.limeShade}"/><path d="M0 930H300V944H0Z" fill="${C.lime}"/>`;
  for (let i = 0; i < 6; i++) b += `<line x1="${i * 60}" y1="944" x2="${i * 60}" y2="1010" stroke="${C.limeDark}" stroke-width="1.5" opacity="0.5"/>`;
  // olive tree in a pot
  b += `<g transform="translate(140 1090)"><path d="M-62 0h124l-16 110h-92Z" fill="${C.terra}"/><path d="M-62 0h124v16h-124Z" fill="${C.terraDark}"/><path d="M0 0C-6 -60 4 -120 -10 -190M0 -80C34 -110 52 -150 48 -200M-4 -110C-40 -140 -60 -170 -64 -210" stroke="#5e4a3a" stroke-width="12" fill="none" stroke-linecap="round"/>${[...Array(64)].map(() => { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 110; return `<ellipse cx="${n(Math.cos(a) * d)}" cy="${n(-220 + Math.sin(a) * d * 0.8)}" rx="22" ry="7" transform="rotate(${n(rnd() * 180)} ${n(Math.cos(a) * d)} ${n(-220 + Math.sin(a) * d * 0.8)})" fill="${rnd() > 0.5 ? C.leaf : '#7b9b74'}" opacity="0.92"/>`; }).join('')}</g>`;
  b += `<rect width="${W}" height="${H}" fill="${C.deep}" opacity="0.08"/>`;
  return svg(W, H, b, defs);
}

/* ------------------------------------------------------------------ rooms */
function room(opts) {
  seed = opts.seed;
  const W = 1600, H = 1000;
  const defs = [
    grad('wallg', [[0, opts.wall[0]], [1, opts.wall[1]]], 1, 0.2),
    grad('floorg', [[0, opts.floor[0]], [1, opts.floor[1]]]),
    grad('viewg', opts.view, 0, 1),
    radial('lampglow', [[0, '#ffe0a8', 0.9], [1, '#ffe0a8', 0]], 'cx="0.5" cy="0.5" r="0.5"'),
    grad('lightpatch', [[0, '#ffe9c4', 0.55], [1, '#ffe9c4', 0]], 0, 1),
    grad('shade', [[0, '#12292c', 0], [1, '#12292c', 0.28]], 1, 0),
    plaster('plasterR', 0.8, 0.06),
  ].join('');
  let b = `<rect width="${W}" height="${H}" fill="url(#wallg)"/><rect width="${W}" height="${H}" filter="url(#plasterR)"/>`;
  const fy = 740;
  // floor planks
  b += `<rect y="${fy}" width="${W}" height="${H - fy}" fill="url(#floorg)"/>`;
  for (let i = 0; i < 14; i++) b += `<line x1="${i * 130 - 40}" y1="${fy}" x2="${(i - 7) * 230 + 800}" y2="${H}" stroke="${opts.floor[1]}" stroke-width="2" opacity="0.45"/>`;
  b += `<rect y="${fy - 14}" width="${W}" height="16" fill="${C.limeShade}"/><rect y="${fy + 2}" width="${W}" height="6" fill="#000" opacity="0.1"/>`;
  // window
  const wx = opts.win.x, wy = opts.win.y, ww = opts.win.w, wh = opts.win.h;
  if (opts.win.kind === 'arch') {
    b += `<path d="${arch(wx - 22, wy - 22, ww + 44, wh + 22)}" fill="${C.limeShade}"/><path d="${arch(wx, wy, ww, wh)}" fill="url(#viewg)"/>`;
    for (let i = 0; i < 12; i++) b += `<rect x="${n(wx + rnd() * (ww - 60))}" y="${n(wy + wh * 0.55 + rnd() * wh * 0.4)}" width="${n(30 + rnd() * 90)}" height="2.5" rx="1" fill="#fff" opacity="${n(0.12 + rnd() * 0.25)}"/>`;
    b += `<path d="M${wx} ${wy + wh}V${wy + ww / 2}a${ww / 2} ${ww / 2} 0 0 1 ${ww} 0V${wy + wh}" fill="none" stroke="${C.shutter}" stroke-width="12"/><line x1="${wx + ww / 2}" y1="${wy}" x2="${wx + ww / 2}" y2="${wy + wh}" stroke="${C.shutter}" stroke-width="9"/><line x1="${wx}" y1="${wy + wh * 0.58}" x2="${wx + ww}" y2="${wy + wh * 0.58}" stroke="${C.shutter}" stroke-width="8"/>`;
    b += `<rect x="${wx - 30}" y="${wy + wh}" width="${ww + 60}" height="18" fill="${C.lime}"/><rect x="${wx - 30}" y="${wy + wh + 18}" width="${ww + 60}" height="8" fill="#000" opacity="0.1"/>`;
    b += `<path d="M${wx - 12} ${wy + 40}q-40 160 -22 ${wh - 20}h60q-20 -140 -38 -${wh - 20}Z" fill="${C.linen}" opacity="0.9"/><path d="M${wx + ww + 12} ${wy + 40}q40 160 22 ${wh - 20}h-60q20 -140 38 -${wh - 20}Z" fill="${C.linen}" opacity="0.9"/>`;
  } else if (opts.win.kind === 'doors') {
    b += `<rect x="${wx - 20}" y="${wy - 20}" width="${ww + 40}" height="${wh + 40}" fill="${C.limeShade}"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#viewg)"/>`;
    for (let i = 0; i < 18; i++) b += `<circle cx="${n(wx + rnd() * ww)}" cy="${n(wy + wh * 0.35 + rnd() * wh * 0.6)}" r="${n(14 + rnd() * 28)}" fill="${rnd() > 0.5 ? C.leaf : C.leafDark}" opacity="0.8"/>`;
    for (let i = 0; i <= 3; i++) b += `<line x1="${wx + i * ww / 3}" y1="${wy}" x2="${wx + i * ww / 3}" y2="${wy + wh}" stroke="${C.ink}" stroke-width="9"/>`;
    for (let i = 0; i <= 2; i++) b += `<line x1="${wx}" y1="${wy + i * wh / 2}" x2="${wx + ww}" y2="${wy + i * wh / 2}" stroke="${C.ink}" stroke-width="8"/>`;
    b += `<path d="M${wx - 10} ${wy}h60v${wh}h-60Z" fill="${C.linen}" opacity="0.8"/>`;
  } else { // round attic window
    const cx = wx + ww / 2, cy = wy + wh / 2, r = ww / 2;
    b += `<circle cx="${cx}" cy="${cy}" r="${r + 20}" fill="${C.limeShade}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#viewg)"/>`;
    b += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.wood}" stroke-width="14"/><line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${C.wood}" stroke-width="8"/><line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}" stroke="${C.wood}" stroke-width="8"/>`;
    for (let i = 0; i < 6; i++) b += `<path d="M${cx - r + 10 + i * 26} ${cy + r * 0.45}h22v${r * 0.5}h-22Z" fill="${C.roof}" opacity="0.8"/>`;
  }
  if (opts.beams) { for (let i = 0; i < 5; i++) b += `<path d="M${i * 380 - 60} 0L${i * 380 + 140} 0L${i * 380 + 60} 280Z" fill="${C.woodDark}" opacity="0.55"/>`; b += `<rect y="0" width="${W}" height="70" fill="${C.woodDark}" opacity="0.5"/>`; }
  // light patch on floor from window
  b += `<path d="M${wx} ${fy}L${wx + ww} ${fy}L${wx + ww + 300} ${H}L${wx - 120} ${H}Z" fill="url(#lightpatch)"/>`;
  // rug
  const rx = opts.bed.x - 160, ry = 870;
  b += `<ellipse cx="${opts.bed.x + opts.bed.w / 2}" cy="${ry + 40}" rx="${opts.bed.w / 2 + 230}" ry="62" fill="${opts.rug}" opacity="0.95"/>`;
  for (let i = 0; i < 5; i++) b += `<ellipse cx="${opts.bed.x + opts.bed.w / 2}" cy="${ry + 40}" rx="${opts.bed.w / 2 + 230 - 24 - i * 30}" ry="${62 - 5 - i * 7}" fill="none" stroke="${C.linen}" stroke-width="3" opacity="0.5"/>`;
  void rx;
  // bed
  const { x: bx, w: bw } = opts.bed;
  b += `<ellipse cx="${bx + bw / 2}" cy="${fy + 150}" rx="${bw / 2 + 40}" ry="26" fill="#000" opacity="0.18"/>`;
  b += `<rect x="${bx - 10}" y="${fy - 330}" width="${bw + 20}" height="400" rx="26" fill="${opts.head}"/>`;
  for (let i = 0; i < 9; i++) b += `<line x1="${bx + 14 + i * ((bw - 28) / 8)}" y1="${fy - 316}" x2="${bx + 14 + i * ((bw - 28) / 8)}" y2="${fy + 52}" stroke="#000" stroke-width="2" opacity="0.1"/>`;
  b += `<rect x="${bx - 24}" y="${fy - 40}" width="${bw + 48}" height="190" rx="16" fill="${C.woodDark}"/>`;
  b += `<rect x="${bx - 16}" y="${fy - 120}" width="${bw + 32}" height="150" rx="40" fill="${C.linen}"/>`;
  for (const [px, pw] of [[bx + 14, bw * 0.46], [bx + bw * 0.52, bw * 0.46]]) b += `<rect x="${n(px)}" y="${fy - 150}" width="${n(pw)}" height="86" rx="26" fill="#fff" opacity="0.96"/><rect x="${n(px + 10)}" y="${fy - 142}" width="${n(pw - 20)}" height="30" rx="14" fill="${C.limeShade}" opacity="0.5"/>`;
  b += `<path d="M${bx - 16} ${fy - 30}h${bw + 32}v130q-${(bw + 32) / 2} 24 -${bw + 32} 0Z" fill="${C.lime}"/>`;
  for (let i = 0; i < 6; i++) b += `<path d="M${bx + i * (bw / 6)} ${fy - 30}q-10 60 14 120" fill="none" stroke="${C.limeShade}" stroke-width="5" opacity="0.7"/>`;
  b += `<path d="M${bx - 16} ${fy + 20}h${bw + 32}v62h-${bw + 32}Z" fill="${opts.throw}"/>`;
  for (let i = 0; i < 14; i++) b += `<line x1="${bx - 10 + i * ((bw + 20) / 13)}" y1="${fy + 20}" x2="${bx - 10 + i * ((bw + 20) / 13)}" y2="${fy + 82}" stroke="#000" stroke-width="2" opacity="0.08"/>`;
  // bedside tables and lamps
  for (const [tx, side] of [[bx - 190, -1], [bx + bw + 60, 1]]) {
    b += `<rect x="${tx}" y="${fy - 40}" width="130" height="14" rx="3" fill="${C.wood}"/><rect x="${tx + 8}" y="${fy - 26}" width="114" height="150" fill="${C.woodDark}"/><rect x="${tx + 18}" y="${fy - 8}" width="94" height="46" fill="${C.wood}"/><circle cx="${tx + 65}" cy="${fy + 15}" r="5" fill="${C.glow}"/>`;
    b += `<circle cx="${tx + 65}" cy="${fy - 150}" r="130" fill="url(#lampglow)"/><rect x="${tx + 60}" y="${fy - 110}" width="10" height="70" fill="${C.deep}"/><path d="M${tx + 28} ${fy - 112}l22 -62h30l22 62Z" fill="${C.glow}"/>`;
    void side;
  }
  // pendant
  b += `<line x1="${bx + bw / 2}" y1="0" x2="${bx + bw / 2}" y2="170" stroke="${C.deep}" stroke-width="3"/><circle cx="${bx + bw / 2}" cy="230" r="150" fill="url(#lampglow)" opacity="0.7"/><path d="M${bx + bw / 2 - 64} 230a64 64 0 0 1 128 0Z" fill="${C.terra}"/><rect x="${bx + bw / 2 - 64}" y="228" width="128" height="8" fill="${C.deep}" opacity="0.5"/>`;
  // wall niche with a vase and a framed print
  const nx = opts.niche;
  b += `<path d="${arch(nx, 250, 150, 230)}" fill="#000" opacity="0.14"/><path d="${arch(nx + 6, 256, 138, 224)}" fill="${C.limeShade}"/><path d="M${nx + 55} 480h40l-6 -86q14 -30 -14 -62q-28 32 -14 62Z" fill="${C.terra}"/><path d="M${nx + 74} 336C${nx + 60} 290 ${nx + 90} 270 ${nx + 98} 250M${nx + 74} 346C${nx + 50} 310 ${nx + 40} 296 ${nx + 36} 280" stroke="${C.leafDark}" stroke-width="4" fill="none" stroke-linecap="round"/>${[...Array(10)].map((_, i) => `<ellipse cx="${nx + 40 + (i % 5) * 14}" cy="${290 - Math.floor(i / 5) * 24 + (i % 3) * 6}" rx="12" ry="5" transform="rotate(${-30 + i * 14} ${nx + 40 + (i % 5) * 14} ${290 - Math.floor(i / 5) * 24})" fill="${C.leaf}"/>`).join('')}`;
  // armchair or plant on the other side
  if (opts.chair) {
    const cx = opts.chair;
    b += `<path d="M${cx} ${fy + 10}q-6 -150 40 -190q60 -44 130 0q46 40 40 190Z" fill="${C.terraLight}"/><rect x="${cx - 12}" y="${fy - 70}" width="64" height="150" rx="26" fill="${C.terra}"/><rect x="${cx + 160}" y="${fy - 70}" width="64" height="150" rx="26" fill="${C.terra}"/><rect x="${cx + 20}" y="${fy - 40}" width="190" height="86" rx="22" fill="${C.terraLight}"/><line x1="${cx + 20}" y1="${fy + 80}" x2="${cx + 4}" y2="${fy + 140}" stroke="${C.woodDark}" stroke-width="9"/><line x1="${cx + 200}" y1="${fy + 80}" x2="${cx + 216}" y2="${fy + 140}" stroke="${C.woodDark}" stroke-width="9"/>`;
  } else {
    const px = W - 90;
    b += `<path d="M${px - 46} ${fy + 120}h92l-12 -110h-68Z" fill="${C.terra}"/>${[...Array(9)].map((_, i) => `<path d="M${px} ${fy + 10}C${px + (i - 4) * 28} ${fy - 90} ${px + (i - 4) * 50} ${fy - 150} ${px + (i - 4) * 62} ${fy - 210}" stroke="${C.leafDark}" stroke-width="5" fill="none"/><ellipse cx="${px + (i - 4) * 62}" cy="${fy - 216}" rx="30" ry="12" transform="rotate(${(i - 4) * 18} ${px + (i - 4) * 62} ${fy - 216})" fill="${C.leaf}"/>`).join('')}`;
  }
  b += `<rect width="${W}" height="${H}" fill="url(#shade)"/>`;
  return svg(W, H, b, defs);
}

/* ------------------------------------------------------------------ courtyard with pool */
function courtyard() {
  seed = 23;
  const W = 1600, H = 1000;
  const defs = [
    grad('csky', [[0, '#3a6178'], [1, '#e8b48f']]),
    grad('cwall', [[0, '#eef0ea'], [1, '#d3d9d3']], 1, 0),
    grad('pool', [[0, '#2f9aa3'], [1, '#146a76']]),
    grad('glow', [[0, C.glow], [1, C.glowDeep]]),
    plaster('plasterC', 0.75, 0.07),
  ].join('');
  let b = `<rect width="${W}" height="${H}" fill="url(#csky)"/>`;
  // enclosing house with three arches
  b += `<rect y="120" width="${W}" height="520" fill="url(#cwall)"/><rect y="120" width="${W}" height="520" filter="url(#plasterC)"/>`;
  b += `<path d="M0 120L0 60L${W} 60L${W} 120Z" fill="${C.roof}"/><rect y="120" width="${W}" height="18" fill="${C.limeShade}"/>`;
  for (let i = 0; i < 4; i++) {
    const ax = 120 + i * 370, aw = 230, ah = 360, ay = 300;
    b += `<path d="${arch(ax - 14, ay - 14, aw + 28, ah + 14)}" fill="${C.limeShade}"/><path d="${arch(ax, ay, aw, ah)}" fill="${i % 2 ? 'url(#glow)' : '#1b3a42'}"/>`;
    if (i % 2) b += `<line x1="${ax + aw / 2}" y1="${ay + 20}" x2="${ax + aw / 2}" y2="${ay + ah}" stroke="${C.shutter}" stroke-width="9"/><path d="M${ax} ${ay + ah}V${ay + aw / 2}a${aw / 2} ${aw / 2} 0 0 1 ${aw} 0V${ay + ah}" fill="none" stroke="${C.shutter}" stroke-width="12"/>`;
    else b += `<path d="M${ax + 30} ${ay + ah}V${ay + 150}q85 -80 170 0V${ay + ah}Z" fill="#0f2b30" opacity="0.5"/>`;
  }
  b += bougainvillea(190, 360, 120, 150, 60) + bougainvillea(1330, 340, 140, 120, 48);
  // string lights
  b += `<path d="M0 170Q400 250 800 170T1600 170" fill="none" stroke="${C.deep}" stroke-width="2.5"/>`;
  for (let i = 0; i < 26; i++) { const t = i / 25, x = t * W, y = 170 + Math.sin(t * Math.PI * 2) * 40 + (1 - Math.abs(0.5 - (t % 0.5) * 2)) * 0 + 16; b += `<circle cx="${n(x)}" cy="${n(y + 18)}" r="26" fill="${C.glow}" opacity="0.18"/><circle cx="${n(x)}" cy="${n(y + 18)}" r="6" fill="${C.glow}"/>`; }
  // floor / coping / pool
  b += `<rect y="640" width="${W}" height="360" fill="#c8c0b3"/>`;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 22; c++) { const x = c * 90 + (r % 2) * 45 - 30, y = 650 + r * 44; b += `<rect x="${x}" y="${y}" width="84" height="38" rx="3" fill="${(r + c) % 4 === 0 ? '#b9b0a2' : '#cfc8bb'}" opacity="0.85"/>`; }
  b += `<path d="M180 700H1420L1500 960H100Z" fill="${C.lime}"/><path d="M220 726H1380L1440 930H160Z" fill="url(#pool)"/>`;
  for (let i = 0; i < 30; i++) { const y = 740 + rnd() * 180, x = 240 + rnd() * 1000, w = 60 + rnd() * 220; b += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="3" rx="1.5" fill="#d8fbf6" opacity="${n(0.15 + rnd() * 0.35)}"/>`; }
  b += `<path d="M520 726L940 726L1010 930H400Z" fill="#9de3dc" opacity="0.13"/>`;
  for (let i = 0; i < 3; i++) b += `<path d="M${420 + i * 360} 726Q${440 + i * 360} 840 ${340 + i * 380} 930" fill="none" stroke="#fff" stroke-width="2" opacity="0.18"/>`;
  // loungers
  for (const [lx, ly, s] of [[40, 760, 1], [1340, 790, 1.05]]) b += `<g transform="translate(${lx} ${ly}) scale(${s})"><path d="M0 120L190 120L250 40L286 56L216 150L0 150Z" fill="${C.linen}"/><rect y="150" width="226" height="12" fill="${C.wood}"/><rect x="10" y="162" width="10" height="46" fill="${C.woodDark}"/><rect x="196" y="162" width="10" height="46" fill="${C.woodDark}"/><path d="M0 116h200l-6 14H0Z" fill="${C.terra}"/></g>`;
  // olive trees in pots
  for (const [ox, oy, sc] of [[130, 860, 1.1], [1470, 880, 1]]) b += `<g transform="translate(${ox} ${oy}) scale(${sc})"><path d="M-60 0h120l-14 120h-92Z" fill="${C.terra}"/><path d="M0 0C-8 -70 10 -130 -4 -210M0 -70C40 -100 60 -150 54 -210" stroke="#5e4a3a" stroke-width="12" fill="none" stroke-linecap="round"/>${[...Array(60)].map(() => { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 105, x = Math.cos(a) * d, y = -230 + Math.sin(a) * d * 0.8; return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="22" ry="7" transform="rotate(${n(rnd() * 180)} ${n(x)} ${n(y)})" fill="${rnd() > 0.5 ? C.leaf : '#7b9b74'}" opacity="0.92"/>`; }).join('')}</g>`;
  b += `<rect width="${W}" height="${H}" fill="${C.deep}" opacity="0.06"/>`;
  return svg(W, H, b, defs);
}

/* ------------------------------------------------------------------ breakfast terrace */
function terrace() {
  seed = 31;
  const W = 1600, H = 1000;
  const defs = [
    grad('tsky', [[0, '#9cc3cf'], [0.5, '#f4d8bd'], [1, '#f2c8a4']]),
    grad('tsea', [[0, '#5aa0a6'], [1, '#245f6a']]),
    grad('beam', [[0, '#12292c', 0.38], [1, '#12292c', 0]], 0, 1),
    plaster('plasterT', 0.8, 0.07),
  ].join('');
  let b = `<rect width="${W}" height="${H}" fill="url(#tsky)"/>`;
  b += `<path d="M0 470C200 430 360 450 520 480C700 420 900 440 1100 470C1300 430 1450 440 1600 460V560H0Z" fill="#7d9ea0" opacity="0.6"/>`;
  b += `<rect y="520" width="${W}" height="150" fill="url(#tsea)"/>`;
  for (let i = 0; i < 34; i++) { const y = 530 + rnd() * 130, x = rnd() * 1500, w = 40 + rnd() * 200; b += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="2.5" rx="1.2" fill="#fff" opacity="${n(0.12 + rnd() * 0.3)}"/>`; }
  for (const [bx, by, s] of [[1180, 560, 0.9], [420, 600, 0.7]]) b += `<g transform="translate(${bx} ${by}) scale(${s})"><path d="M0 0h110l-14 22H18Z" fill="${C.deep}"/><line x1="55" y1="0" x2="55" y2="-90" stroke="${C.deep}" stroke-width="3"/><path d="M58 -86v78l34 -8Z" fill="${C.linen}"/></g>`;
  // terrace wall
  b += `<rect y="660" width="${W}" height="${H - 660}" fill="#d7cdbd"/>`;
  b += `<rect y="660" width="${W}" height="70" fill="${C.limeShade}"/><rect y="660" width="${W}" height="14" fill="${C.lime}"/>`;
  for (let i = 0; i < 14; i++) b += `<line x1="${i * 124}" y1="674" x2="${i * 124}" y2="730" stroke="${C.limeDark}" stroke-width="2" opacity="0.5"/>`;
  b += `<rect y="730" width="${W}" height="${H - 730}" fill="#bcae98"/>`;
  for (let r = 0; r < 6; r++) for (let c = 0; c < 15; c++) b += `<rect x="${c * 120 + (r % 2) * 60 - 40}" y="${742 + r * 46}" width="112" height="40" rx="3" fill="${(r + c) % 3 === 0 ? '#a99a84' : '#c4b6a0'}" opacity="0.8"/>`;
  // pergola beams with light stripes
  b += `<rect y="0" width="${W}" height="96" fill="${C.woodDark}"/>`;
  for (let i = 0; i < 9; i++) b += `<rect x="${i * 190 - 20}" y="96" width="36" height="14" fill="${C.wood}"/>`;
  b += `<rect y="96" width="${W}" height="500" fill="url(#beam)"/>`;
  for (let i = 0; i < 8; i++) b += `<path d="M${i * 220 + 40} 110L${i * 220 + 100} 110L${i * 220 + 260} 940L${i * 220 + 120} 940Z" fill="#ffe2b5" opacity="0.13"/>`;
  b += `<rect x="60" y="96" width="40" height="640" fill="${C.woodDark}"/><rect x="1500" y="96" width="40" height="640" fill="${C.woodDark}"/>`;
  b += bougainvillea(130, 190, 110, 70, 40);
  // table
  const tx = 330, ty = 760, tw = 940;
  b += `<ellipse cx="${tx + tw / 2}" cy="${ty + 200}" rx="${tw / 2 + 40}" ry="46" fill="#000" opacity="0.15"/>`;
  b += `<path d="M${tx} ${ty}h${tw}l60 150h-${tw + 120}Z" fill="${C.linen}"/>`;
  for (let i = 0; i < 12; i++) b += `<line x1="${tx + i * 80}" y1="${ty}" x2="${tx + i * 80 - 6 + (i - 6) * 3}" y2="${ty + 150}" stroke="${C.limeShade}" stroke-width="3" opacity="0.7"/>`;
  b += `<path d="M${tx - 60} ${ty + 150}h${tw + 120}v54h-${tw + 120}Z" fill="${C.lime}"/><rect x="${tx + 40}" y="${ty + 204}" width="22" height="120" fill="${C.woodDark}"/><rect x="${tx + tw - 62}" y="${ty + 204}" width="22" height="120" fill="${C.woodDark}"/>`;
  // objects on table: jug, bowls, bread, coffee pot, citrus, cups
  const obj = (x, y) => `translate(${tx + x} ${ty + y})`;
  b += `<g transform="${obj(70, 20)}"><path d="M0 0q-14 -40 4 -86h70q18 46 4 86Z" fill="${C.terra}"/><path d="M74 -70q34 6 28 44q-4 16 -26 12" fill="none" stroke="${C.terra}" stroke-width="10"/><ellipse cx="39" cy="-86" rx="35" ry="9" fill="${C.terraDark}"/></g>`;
  b += `<g transform="${obj(250, 28)}"><ellipse cx="80" cy="6" rx="104" ry="20" fill="${C.limeShade}"/><path d="M-6 0h172q-10 46 -86 46t-86 -46Z" fill="${C.linen}" stroke="${C.limeDark}" stroke-width="4"/><circle cx="50" cy="-10" r="26" fill="#f0a64d"/><circle cx="50" cy="-10" r="18" fill="#f7c978"/><circle cx="104" cy="-12" r="26" fill="#f0a64d"/><circle cx="104" cy="-12" r="18" fill="#f7c978"/><circle cx="76" cy="-32" r="24" fill="#d9ab45"/></g>`;
  b += `<g transform="${obj(500, 24)}"><path d="M0 0q-6 -80 40 -88q46 8 40 88Z" fill="${C.ink}"/><path d="M-10 0h100v12h-100Z" fill="${C.deep}"/><path d="M80 -62q36 -10 38 -48" stroke="${C.ink}" stroke-width="9" fill="none"/><rect x="26" y="-110" width="28" height="20" rx="8" fill="${C.deep}"/></g>`;
  b += `<g transform="${obj(680, 36)}"><ellipse cx="90" cy="4" rx="120" ry="22" fill="${C.limeShade}"/><path d="M-20 0Q90 -90 200 0Z" fill="#d6a66a"/><path d="M20 -14Q90 -66 160 -14" fill="none" stroke="#b9854a" stroke-width="4"/><path d="M50 -24l60 -22M96 -24l50 -16" stroke="#b9854a" stroke-width="4"/></g>`;
  for (const [cx2, col] of [[120, C.linen], [820, C.linen]]) b += `<g transform="${obj(cx2, 118)}"><ellipse cx="50" cy="8" rx="70" ry="14" fill="${C.limeShade}"/><path d="M0 0h100q-6 42 -50 42t-50 -42Z" fill="${col}" stroke="${C.limeDark}" stroke-width="3"/><ellipse cx="50" cy="0" rx="50" ry="9" fill="#6b4a36"/></g>`;
  // chairs
  for (const cx3 of [200, 1280]) b += `<g transform="translate(${cx3} 800)"><rect x="0" y="0" width="14" height="260" fill="${C.woodDark}"/><rect x="130" y="110" width="14" height="150" fill="${C.woodDark}"/><rect y="110" width="144" height="24" rx="8" fill="${C.wood}"/><path d="M-4 -20h28v140h-28Z" fill="${C.wood}"/></g>`;
  // olive branch in foreground
  b += `<path d="M1600 180C1500 200 1400 250 1330 360" stroke="#5e4a3a" stroke-width="10" fill="none" stroke-linecap="round"/>${[...Array(22)].map((_, i) => { const t = i / 21, x = 1600 - t * 270, y = 180 + t * 180 + (i % 2 ? 16 : -16); return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="38" ry="10" transform="rotate(${n(20 + (i % 2) * 50 + t * 20)} ${n(x)} ${n(y)})" fill="${i % 3 ? C.leaf : '#7b9b74'}"/>`; }).join('')}`;
  return svg(W, H, b, defs);
}

/* ------------------------------------------------------------------ encaustic tile pattern */
function tiles() {
  const S = 800, t = 200;
  const tile = (x, y, flip) => {
    const a = flip ? C.terra : C.sea, bcol = flip ? C.sea : C.terra;
    return `<g transform="translate(${x} ${y})"><rect width="${t}" height="${t}" fill="${C.lime}"/><circle cx="${t / 2}" cy="${t / 2}" r="${t * 0.42}" fill="${a}"/><circle cx="${t / 2}" cy="${t / 2}" r="${t * 0.3}" fill="${C.lime}"/><circle cx="${t / 2}" cy="${t / 2}" r="${t * 0.17}" fill="${bcol}"/>${[[0, 0], [t, 0], [0, t], [t, t]].map(([cx, cy]) => `<path d="M${cx} ${cy}m-${t * 0.32} 0a${t * 0.32} ${t * 0.32} 0 0 1 ${t * 0.32} -${t * 0.32}a${t * 0.32} ${t * 0.32} 0 0 1 ${t * 0.32} ${t * 0.32}a${t * 0.32} ${t * 0.32} 0 0 1 -${t * 0.32} ${t * 0.32}a${t * 0.32} ${t * 0.32} 0 0 1 -${t * 0.32} -${t * 0.32}Z" fill="${bcol}" opacity="0.9"/>`).join('')}<rect width="${t}" height="${t}" fill="none" stroke="${C.limeDark}" stroke-width="3"/></g>`;
  };
  let b = `<rect width="${S}" height="${S}" fill="${C.lime}"/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) b += tile(c * t, r * t, (r + c) % 2 === 0);
  return svg(S, S, b);
}

save('hero-house.svg', hero());
save('room-harbour.svg', room({ seed: 41, wall: ['#e8ece7', '#cdd5d0'], floor: ['#a37f5b', '#6e5239'], view: [[0, '#2a4a60'], [0.5, '#e7a07c'], [1, '#2f6a74']], win: { kind: 'arch', x: 990, y: 150, w: 300, h: 520 }, bed: { x: 420, w: 560 }, head: '#c9b79a', throw: C.terra, rug: '#d8d2c4', niche: 160, chair: 1330, beams: false }));
save('room-garden.svg', room({ seed: 53, wall: ['#e3eadf', '#c6d2c4'], floor: ['#b08a63', '#76593c'], view: [[0, '#cfe3c8'], [0.5, '#8cba82'], [1, '#4f7a55']], win: { kind: 'doors', x: 160, y: 150, w: 420, h: 540 }, bed: { x: 640, w: 560 }, head: '#6f8d83', throw: '#2f6f73', rug: '#d6c7b0', niche: 1380, chair: 0, beams: false }));
save('room-attic.svg', room({ seed: 67, wall: ['#e9e4dc', '#cfc8bd'], floor: ['#9a7752', '#664b32'], view: [[0, '#3a5f78'], [0.55, '#e9a98a'], [1, '#e9d0ae']], win: { kind: 'round', x: 1130, y: 130, w: 300, h: 300 }, bed: { x: 360, w: 540 }, head: '#a4553a', throw: '#1f3b3f', rug: '#cdbfa8', niche: 860, chair: 0, beams: true }));
save('courtyard-pool.svg', courtyard());
save('terrace-breakfast.svg', terrace());
save('tile-pattern.svg', tiles());
