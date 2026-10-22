// Generates index.html (en), index.es.html and index.de.html from strings.mjs.  Usage (repo root): node docs/review/motion-prototype/build.mjs
// The pages are plain HTML + one stylesheet + one classic script (no build step, no dependencies); they also open from file://.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { T, pics, langs } from './strings.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = (l) => (l === 'en' ? 'index.html' : `index.${l}.html`);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function page(lang) {
  const t = T[lang];
  const tone = { web: 'ink', local: 'sand', video: 'coral', ads: 'slate' };
  const plates = t.services.map((s) => `<div class="plate plate--${s.id}" data-tone="${tone[s.id]}" data-piece="plate" data-id="${s.id}" aria-hidden="true"></div>`).join('\n        ');
  const cards = t.services.map((s) => {
    const p = pics[s.id];
    const srcset = p.widths.map((w) => `assets/img/${p.file}-${w}.webp ${w}w`).join(', ');
    return `<div class="card card--${s.id}" data-piece="card" data-id="${s.id}"><img src="assets/img/${p.file}-${p.widths.at(-1)}.webp" srcset="${srcset}" sizes="(min-width: 64em) 34vw, 46vw" width="${p.w}" height="${p.h}" alt="${esc(s.alt)}" decoding="async"></div>`;
  }).join('\n        ');
  const labels = t.services.map((s) => `<div class="label label--${s.id}" data-tone="${tone[s.id]}" data-piece="label" data-id="${s.id}">
          <h3 class="label__h"><span class="label__n" aria-hidden="true">${s.n}</span> ${esc(s.name)}</h3>
          <p class="label__badge">${esc(s.badge)}</p>
          <p class="label__cap">${esc(s.cap)}</p>
        </div>`).join('\n        ');
  const steps = t.stages.map((n, i) => `<li class="step" data-step="${i}"><span class="step__n" aria-hidden="true">0${i + 1}</span><span class="step__t">${esc(n)}</span><span class="step__note">${esc(t.stageNotes[i])}</span></li>`).join('\n        ');
  const switcher = langs.map((l) => `<a href="${file(l)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="page"' : ''}>${l.toUpperCase()}</a>`).join('');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.title)}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="data:,">
<link rel="preload" href="assets/fonts/outfit-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/instrument-serif-latin-400-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="proto.css">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<a class="skip" href="#after">${esc(t.skip)}</a>
<header class="bar">
  <img class="bar__logo" src="assets/odalo-word.svg" width="840" height="320" alt="odalo">
  <nav class="bar__lang" aria-label="Language">${switcher}</nav>
</header>
<main>
<section class="proto" id="proto" aria-labelledby="proto-h" data-proto>
  <div class="proto__run">
    <div class="proto__stage">
      <div class="head">
        <div class="head__text">
          <p class="eyebrow">${esc(t.eyebrow)}</p>
          <h2 id="proto-h" class="head__h"><span class="head__a">${esc(t.a)}</span> <em class="head__b" data-em>${esc(t.b)}</em></h2>
        </div>
        <a class="cta" href="#after">${esc(t.audit)}</a>
      </div>

      <div class="arena" data-arena>
        <div class="board" data-board>
        ${plates}
        <i class="seam seam--a" data-seam="a" aria-hidden="true"></i>
        <i class="seam seam--b" data-seam="b" aria-hidden="true"></i>
        <i class="seam seam--c" data-seam="c" aria-hidden="true"></i>
        <i class="seam seam--d" data-seam="d" aria-hidden="true"></i>
        ${cards}
        <i class="ring" data-piece="ring" aria-hidden="true"></i>
        <i class="emblem" data-piece="emblem" aria-hidden="true"></i>
        ${labels}
        </div>
      </div>

      <div class="rail">
        <ol class="steps" aria-label="${esc(t.stageLabel)}">
        ${steps}
        </ol>
        <button class="replay" type="button" data-replay>${esc(t.replay)}</button>
      </div>
    </div>
  </div>
</section>
<section class="after" id="after" tabindex="-1" aria-labelledby="after-h">
  <h2 id="after-h" class="after__h">${esc(t.afterH)}</h2>
  <p class="after__p">${esc(t.afterP)}</p>
  <p class="after__note">${esc(t.note)}</p>
</section>
</main>
<script src="motion.js"></script>
</body>
</html>
`;
}

for (const l of langs) fs.writeFileSync(path.join(here, file(l)), page(l));
console.log('written:', langs.map(file).join(', '));
