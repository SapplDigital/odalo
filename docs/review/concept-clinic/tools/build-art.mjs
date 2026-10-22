// Original SVG illustrations for the fictional "Tidewell Physiotherapy" campaign concept.
// Flat, geometric figures and a neighbourhood street, drawn in code. No photographs, no stock, no model-generated pictures.
// Usage: node docs/review/concept-clinic/tools/build-art.mjs   (writes ../assets/*.svg)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  ink: '#1f3a5c', blue: '#3e6fa3', blueLight: '#9fc0de', sky: '#d3e4f1', mist: '#e9eff5', paper: '#f7f9fb', accent: '#0b7f73', accentLight: '#bfe3dc', accentDeep: '#075e55',
  oak: '#d9bd96', oakDark: '#b89870', white: '#ffffff', leaf: '#5b9a73', leafDark: '#3f7656', brick: '#c9d3dc', line: '#b9c7d4',
  skinA: '#edbf9d', skinB: '#c98f6b', skinC: '#8f5c3e', hairA: '#3b2f2a', hairB: '#a8b3bd', hairC: '#1d1b1e', shirt1: '#0b7f73', shirt2: '#3e6fa3', shirt3: '#1f3a5c', shirt4: '#e4c9a4',
};
let seed = 5;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const n = (v) => Math.round(v * 10) / 10;
const svg = (w, h, body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">\n<defs>${defs}</defs>\n${body}\n</svg>\n`;
const save = (name, content) => { fs.writeFileSync(path.join(OUT, name), content); console.log('wrote', name, Math.round(content.length / 1024) + ' KB'); };
const grad = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;

/* ---------------------------------------------------------------- a flat figure built from a few joints (units: pixels at scale 1, hip is the origin, y up is negative) */
const POSES = {
  reach: { sh: [0, -112], head: [0, -158], armL: [[-34, -168], [-22, -236]], armR: [[34, -168], [22, -240]], legL: [[-14, 66], [-16, 134]], legR: [[14, 66], [16, 134]] },
  band: { sh: [0, -112], head: [0, -158], armL: [[-70, -118], [-122, -128]], armR: [[70, -118], [122, -128]], legL: [[-30, 66], [-40, 134]], legR: [[30, 66], [40, 134]], band: [[-122, -128], [122, -128]] },
  stepup: { sh: [8, -112], head: [10, -158], armL: [[-26, -64], [-40, -14]], armR: [[40, -68], [58, -26]], legL: [[-6, 60], [-16, 134]], legR: [[58, -4], [64, 70]], box: true },
  jog: { sh: [26, -108], head: [38, -152], armL: [[-6, -76], [-44, -100]], armR: [[56, -70], [84, -104]], legL: [[-30, 50], [-84, 92]], legR: [[46, 34], [40, 134]] },
  stand: { sh: [0, -112], head: [0, -158], armL: [[-34, -66], [-38, -16]], armR: [[34, -66], [38, -16]], legL: [[-14, 66], [-16, 134]], legR: [[14, 66], [16, 134]] },
  sit: { sh: [0, -112], head: [0, -158], armL: [[-36, -66], [-12, -30]], armR: [[36, -66], [12, -30]], legL: [[70, 4], [78, 100]], legR: [[96, 4], [104, 100]] },
  lunge: { sh: [10, -108], head: [14, -154], armL: [[-26, -76], [-46, -30]], armR: [[40, -80], [60, -40]], legL: [[-56, 36], [-96, 134]], legR: [[62, 30], [60, 134]] },
};
function person({ x, ground, s = 1, pose = 'stand', skin = C.skinA, hair = C.hairA, top = C.shirt1, bottom = C.ink, hairStyle = 'short', id = '' }) {
  const P = POSES[pose], drop = Math.max(...[P.legL, P.legR].map((l) => l[l.length - 1][1])), hipY = ground - drop * s;
  const T = ([px, py]) => `${n(x + px * s)},${n(hipY + py * s)}`;
  const line = (pts, w, col) => `<polyline points="${pts.map(T).join(' ')}" fill="none" stroke="${col}" stroke-width="${n(w * s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  let g = '';
  if (P.box) g += `<rect x="${n(x + 22 * s)}" y="${n(ground - 66 * s)}" width="${n(86 * s)}" height="${n(66 * s)}" rx="${n(8 * s)}" fill="${C.blueLight}"/><rect x="${n(x + 22 * s)}" y="${n(ground - 66 * s)}" width="${n(86 * s)}" height="${n(10 * s)}" rx="${n(5 * s)}" fill="${C.blue}"/>`;
  g += line([[0, 0], ...P.legL], 34, bottom) + line([[0, 0], ...P.legR], 34, bottom);
  for (const leg of [P.legL, P.legR]) { const f = leg[leg.length - 1]; g += `<ellipse cx="${n(x + (f[0] + 12) * s)}" cy="${n(hipY + (f[1] + 4) * s)}" rx="${n(26 * s)}" ry="${n(9 * s)}" fill="${C.white}" stroke="${C.line}" stroke-width="${n(2 * s)}"/>`; }
  g += line([[0, 4], P.sh], 56, top);
  const shL = [P.sh[0] - 24, P.sh[1] + 6], shR = [P.sh[0] + 24, P.sh[1] + 6];
  g += line([shL, ...P.armL], 17, skin) + line([shR, ...P.armR], 17, skin);
  g += `<line x1="${n(x + P.sh[0] * s)}" y1="${n(hipY + P.sh[1] * s)}" x2="${n(x + P.head[0] * s)}" y2="${n(hipY + (P.head[1] + 22) * s)}" stroke="${skin}" stroke-width="${n(15 * s)}" stroke-linecap="round"/>`;
  g += `<circle cx="${n(x + P.head[0] * s)}" cy="${n(hipY + P.head[1] * s)}" r="${n(26 * s)}" fill="${skin}"/>`;
  if (hairStyle === 'short') g += `<path d="M${n(x + (P.head[0] - 27) * s)} ${n(hipY + (P.head[1] - 2) * s)}a${n(27 * s)} ${n(27 * s)} 0 0 1 ${n(54 * s)} 0q${n(-10 * s)} ${n(-12 * s)} ${n(-27 * s)} ${n(-12 * s)}t${n(-27 * s)} ${n(12 * s)}Z" fill="${hair}"/>`;
  if (hairStyle === 'bun') g += `<path d="M${n(x + (P.head[0] - 27) * s)} ${n(hipY + (P.head[1] + 2) * s)}a${n(27 * s)} ${n(27 * s)} 0 0 1 ${n(54 * s)} 0q${n(-12 * s)} ${n(-14 * s)} ${n(-27 * s)} ${n(-14 * s)}t${n(-27 * s)} ${n(14 * s)}Z" fill="${hair}"/><circle cx="${n(x + (P.head[0] - 4) * s)}" cy="${n(hipY + (P.head[1] - 34) * s)}" r="${n(13 * s)}" fill="${hair}"/>`;
  if (hairStyle === 'grey') g += `<path d="M${n(x + (P.head[0] - 28) * s)} ${n(hipY + (P.head[1] + 4) * s)}a${n(28 * s)} ${n(28 * s)} 0 0 1 ${n(56 * s)} 0q${n(-6 * s)} ${n(-18 * s)} ${n(-28 * s)} ${n(-18 * s)}t${n(-28 * s)} ${n(18 * s)}Z" fill="${hair}"/>`;
  if (P.band) g += `<polyline points="${P.band.map(T).join(' ')}" fill="none" stroke="${C.accent}" stroke-width="${n(5 * s)}" stroke-linecap="round" stroke-dasharray="${n(0.1)} ${n(9 * s)}"/><polyline points="${P.band.map(T).join(' ')}" fill="none" stroke="${C.accent}" stroke-width="${n(5 * s)}" stroke-linecap="round" opacity="0.9"/>`;
  return `<g data-figure="${id}">${g}</g>`;
}
const shadow = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${n(rx * 0.12)}" fill="${C.ink}" opacity="0.14"/>`;

/* ---------------------------------------------------------------- the studio */
function studio() {
  seed = 12;
  const W = 1600, H = 1000;
  const defs = [grad('wall', [[0, '#f1f5f9'], [1, '#dfe8f0']], 1, 0.3), grad('floor', [[0, '#e2c8a2'], [1, '#c9a97c']]), grad('win', [[0, '#cfe4f2'], [1, '#eaf4fa']]), grad('light', [[0, '#fff', 0.55], [1, '#fff', 0]], 0.4, 1)].join('');
  let b = `<rect width="${W}" height="${H}" fill="url(#wall)"/>`;
  // window with a tree
  b += `<rect x="110" y="110" width="520" height="560" rx="12" fill="${C.white}"/><rect x="130" y="130" width="480" height="520" fill="url(#win)"/>`;
  for (let i = 0; i < 26; i++) b += `<circle cx="${n(190 + rnd() * 360)}" cy="${n(210 + rnd() * 300)}" r="${n(28 + rnd() * 46)}" fill="${rnd() > 0.5 ? C.leaf : C.leafDark}" opacity="0.85"/>`;
  b += `<rect x="360" y="460" width="22" height="190" fill="#6c5646"/>`;
  b += `<rect x="130" y="130" width="480" height="520" fill="none" stroke="${C.line}" stroke-width="3"/><line x1="370" y1="130" x2="370" y2="650" stroke="${C.white}" stroke-width="12"/><line x1="130" y1="390" x2="610" y2="390" stroke="${C.white}" stroke-width="12"/>`;
  b += `<path d="M130 650L610 650L740 1000L10 1000Z" fill="url(#light)" opacity="0.7"/>`;
  // floor
  b += `<rect y="720" width="${W}" height="280" fill="url(#floor)"/><rect y="712" width="${W}" height="14" fill="${C.mist}"/>`;
  for (let i = 0; i < 16; i++) b += `<line x1="${i * 120 - 30}" y1="726" x2="${(i - 8) * 260 + 800}" y2="${H}" stroke="${C.oakDark}" stroke-width="2" opacity="0.4"/>`;
  // wall bars on the right
  b += `<rect x="1180" y="100" width="300" height="640" rx="8" fill="${C.oakDark}" opacity="0.35"/>`;
  for (let i = 0; i < 12; i++) b += `<rect x="1190" y="${130 + i * 48}" width="280" height="14" rx="7" fill="${C.oak}"/>`;
  b += `<rect x="1180" y="100" width="18" height="640" fill="${C.oakDark}"/><rect x="1462" y="100" width="18" height="640" fill="${C.oakDark}"/>`;
  // wall shelf with towels and a plant
  b += `<rect x="760" y="300" width="300" height="14" rx="4" fill="${C.oakDark}"/>`;
  for (const [tx, col] of [[790, C.accentLight], [850, C.blueLight], [910, C.mist]]) b += `<rect x="${tx}" y="${230}" width="50" height="70" rx="6" fill="${col}"/><line x1="${tx + 4}" y1="${250}" x2="${tx + 46}" y2="${250}" stroke="${C.white}" stroke-width="3"/>`;
  b += `<path d="M990 300h50l-6 -44h-38Z" fill="${C.accent}"/>${[...Array(7)].map((_, i) => `<path d="M1015 256C${1015 + (i - 3) * 14} ${230} ${1015 + (i - 3) * 22} ${200} ${1015 + (i - 3) * 26} ${176}" stroke="${C.leafDark}" stroke-width="4" fill="none"/><ellipse cx="${1015 + (i - 3) * 26}" cy="172" rx="14" ry="26" transform="rotate(${(i - 3) * 14} ${1015 + (i - 3) * 26} 172)" fill="${C.leaf}"/>`).join('')}`;
  // clock
  b += `<circle cx="900" cy="140" r="52" fill="${C.white}" stroke="${C.ink}" stroke-width="6"/><line x1="900" y1="140" x2="900" y2="104" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/><line x1="900" y1="140" x2="926" y2="152" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`;
  // mat, treatment couch
  b += `<rect x="640" y="880" width="420" height="22" rx="11" fill="${C.accent}"/><rect x="640" y="880" width="420" height="8" rx="4" fill="${C.accentLight}" opacity="0.6"/>`;
  b += `<rect x="1070" y="640" width="90" height="12" fill="none"/>`;
  b += shadow(850, 905, 240) + shadow(1330, 905, 180);
  // couch (right) with a seated figure
  b += `<rect x="1210" y="780" width="300" height="40" rx="14" fill="${C.blue}"/><rect x="1226" y="820" width="14" height="110" fill="${C.ink}"/><rect x="1480" y="820" width="14" height="110" fill="${C.ink}"/><rect x="1226" y="770" width="268" height="20" rx="10" fill="${C.blueLight}"/>`;
  // figures
  b += person({ x: 850, ground: 880, s: 1.45, pose: 'reach', skin: C.skinB, hair: C.hairC, top: C.shirt1, bottom: C.ink, hairStyle: 'bun', id: 'reach' });
  b += person({ x: 1350, ground: 780, s: 1.15, pose: 'sit', skin: C.skinA, hair: C.hairB, top: C.shirt3, bottom: C.accentDeep, hairStyle: 'grey', id: 'seated' });
  b += person({ x: 520, ground: 900, s: 1.2, pose: 'band', skin: C.skinC, hair: C.hairC, top: C.shirt2, bottom: C.ink, hairStyle: 'short', id: 'band' });
  // plant pot floor-left
  b += `<path d="M60 900h110l-14 -100h-82Z" fill="${C.accentDeep}"/>${[...Array(9)].map((_, i) => `<path d="M115 800C${115 + (i - 4) * 18} ${740} ${115 + (i - 4) * 30} ${690} ${115 + (i - 4) * 36} ${650}" stroke="${C.leafDark}" stroke-width="5" fill="none"/><ellipse cx="${115 + (i - 4) * 36}" cy="646" rx="16" ry="34" transform="rotate(${(i - 4) * 14} ${115 + (i - 4) * 36} 646)" fill="${C.leaf}"/>`).join('')}`;
  return svg(W, H, b, defs);
}

/* ---------------------------------------------------------------- the street */
function street() {
  seed = 21;
  const W = 1600, H = 1000;
  const defs = [grad('sky', [[0, '#bcd6ea'], [1, '#eaf3f9']]), grad('road', [[0, '#8d9aa6'], [1, '#6f7d8a']])].join('');
  let b = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  // far buildings
  for (let i = 0; i < 9; i++) { const x = i * 190 - 20, h = 260 + (i % 3) * 70; b += `<rect x="${x}" y="${560 - h}" width="170" height="${h}" fill="${i % 2 ? '#c8d5e1' : '#d9e3ec'}"/>${[...Array(3)].map((_, k) => `<rect x="${x + 24 + k * 48}" y="${580 - h + 30}" width="26" height="40" fill="${C.white}" opacity="0.7"/>`).join('')}`; }
  // pavement and road
  b += `<rect y="640" width="${W}" height="120" fill="#cfd8e0"/><rect y="640" width="${W}" height="10" fill="#b9c4ce"/><rect y="760" width="${W}" height="240" fill="url(#road)"/>`;
  for (let i = 0; i < 8; i++) b += `<rect x="${i * 220 + 40}" y="870" width="120" height="14" rx="4" fill="${C.white}" opacity="0.8"/>`;
  // left shop (bakery) with awning
  b += `<rect x="0" y="330" width="440" height="330" fill="#e3d6c3"/><rect x="40" y="440" width="360" height="200" rx="6" fill="#fdf8ef"/><rect x="60" y="460" width="150" height="160" fill="#e9dfcd"/><rect x="230" y="460" width="150" height="160" fill="#e9dfcd"/>`;
  b += `<path d="M20 400h400l-24 70h-352Z" fill="#c8793f"/>${[...Array(9)].map((_, i) => `<rect x="${20 + i * 44}" y="400" width="22" height="70" fill="#f3e7d3" opacity="0.9"/>`).join('')}`;
  b += `<text x="220" y="372" text-anchor="middle" font-family="Bahnschrift, 'Segoe UI', Arial, sans-serif" font-weight="700" font-size="34" fill="#6a4a2d">Millbrook Bakery</text>`;
  // the practice (centre)
  b += `<rect x="470" y="250" width="560" height="410" fill="#f3f7fa"/><rect x="470" y="250" width="560" height="28" fill="${C.blue}"/><rect x="470" y="278" width="560" height="14" fill="#000" opacity="0.06"/>`;
  b += `<rect x="520" y="330" width="460" height="86" rx="10" fill="${C.ink}"/><text x="750" y="383" text-anchor="middle" font-family="Bahnschrift, 'Segoe UI', Arial, sans-serif" font-weight="700" font-size="36" fill="#fff" letter-spacing="1">Tidewell Physiotherapy</text>`;
  b += `<text x="750" y="410" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="18" fill="${C.accentLight}" letter-spacing="3">MILLBROOK</text>`;
  b += `<rect x="520" y="450" width="200" height="210" fill="#dcecf5"/><rect x="520" y="450" width="200" height="210" fill="none" stroke="${C.line}" stroke-width="4"/>`;
  b += `<rect x="760" y="450" width="130" height="210" rx="6" fill="${C.accent}"/><rect x="778" y="470" width="94" height="150" rx="4" fill="#d9f0ec" opacity="0.9"/><rect x="866" y="545" width="10" height="38" rx="5" fill="${C.ink}"/>`;
  b += `<rect x="920" y="450" width="60" height="210" fill="#dcecf5"/>`;
  b += `<text x="620" y="490" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="600" font-size="19" fill="${C.ink}">Step-free entrance</text>`;
  // planters
  for (const px of [500, 990]) b += `<rect x="${px}" y="620" width="50" height="40" rx="6" fill="${C.accentDeep}"/>${[...Array(5)].map((_, i) => `<ellipse cx="${px + 25 + (i - 2) * 9}" cy="${604 - (i % 2) * 10}" rx="12" ry="26" transform="rotate(${(i - 2) * 16} ${px + 25 + (i - 2) * 9} 612)" fill="${C.leaf}"/>`).join('')}`;
  // right: tree and bus stop
  b += `<rect x="1230" y="420" width="24" height="240" fill="#6c5646"/>${[...Array(18)].map(() => `<circle cx="${n(1242 + (rnd() - 0.5) * 220)}" cy="${n(340 + (rnd() - 0.5) * 150)}" r="${n(44 + rnd() * 40)}" fill="${rnd() > 0.5 ? C.leaf : C.leafDark}" opacity="0.9"/>`).join('')}`;
  b += `<rect x="1400" y="360" width="12" height="300" fill="${C.ink}"/><rect x="1352" y="360" width="108" height="70" rx="8" fill="${C.accent}"/><text x="1406" y="412" text-anchor="middle" font-family="Bahnschrift, 'Segoe UI', Arial, sans-serif" font-weight="700" font-size="44" fill="#fff">12</text><rect x="1360" y="440" width="92" height="24" rx="4" fill="${C.white}"/><text x="1406" y="458" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="14" fill="${C.ink}">Millbrook Market</text>`;
  // people on the pavement
  b += shadow(640, 745, 80) + shadow(1130, 745, 70);
  b += person({ x: 1130, ground: 744, s: 0.78, pose: 'stand', skin: C.skinB, hair: C.hairC, top: C.shirt3, bottom: C.blue, hairStyle: 'bun', id: 'p1' });
  b += person({ x: 330, ground: 744, s: 0.7, pose: 'stand', skin: C.skinA, hair: C.hairB, top: C.shirt4, bottom: C.ink, hairStyle: 'grey', id: 'p2' });
  b += `<rect x="0" y="754" width="${W}" height="8" fill="#000" opacity="0.06"/>`;
  return svg(W, H, b, defs);
}

/* ---------------------------------------------------------------- four service glyph scenes (soft panel, one figure each) */
function glyph(name, pose, opts) {
  const W = 800, H = 600;
  let b = `<rect width="${W}" height="${H}" fill="${opts.bg}"/>`;
  b += `<circle cx="${opts.cx}" cy="${opts.cy}" r="${opts.r}" fill="${opts.disc}" opacity="0.9"/>`;
  b += `<rect y="480" width="${W}" height="120" fill="${opts.floor}"/>`;
  b += shadow(400, 492, 130);
  b += person({ x: 400, ground: 490, s: 1.25, pose, skin: opts.skin, hair: opts.hair, top: opts.top, bottom: opts.bottom, hairStyle: opts.hairStyle, id: name });
  return svg(W, H, b);
}

save('studio-scene.svg', studio());
save('street-scene.svg', street());
save('glyph-back-neck.svg', glyph('back-neck', 'reach', { bg: '#e9f2f8', disc: '#cfe4f2', cx: 400, cy: 250, r: 220, floor: '#d9e6ef', skin: C.skinA, hair: C.hairA, top: C.shirt1, bottom: C.ink, hairStyle: 'short' }));
save('glyph-knees-hips.svg', glyph('knees-hips', 'stepup', { bg: '#e6f3f0', disc: '#bfe3dc', cx: 400, cy: 260, r: 215, floor: '#d3e8e3', skin: C.skinB, hair: C.hairC, top: C.shirt2, bottom: C.ink, hairStyle: 'bun' }));
save('glyph-shoulders.svg', glyph('shoulders', 'band', { bg: '#edf1f8', disc: '#d0daee', cx: 400, cy: 255, r: 225, floor: '#dde4f0', skin: C.skinC, hair: C.hairC, top: C.shirt4, bottom: C.blue, hairStyle: 'short' }));
save('glyph-active-life.svg', glyph('active-life', 'jog', { bg: '#eef4ee', disc: '#d4e6d6', cx: 400, cy: 260, r: 215, floor: '#dbe8dc', skin: C.skinA, hair: C.hairB, top: C.shirt3, bottom: C.accent, hairStyle: 'grey' }));
