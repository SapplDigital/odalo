// Builds en/es/de pages for the isolated M3 prototype from data.json (real app strings; see extract.mjs). Usage: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(path.join(here, 'data.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const note = {
  en: 'Isolated M3 prototype · behaviour proof only · links point at app routes that are not served here',
  es: 'Prototipo M3 aislado · solo prueba de comportamiento · los enlaces apuntan a rutas de la app que aquí no se sirven',
  de: 'Isolierter M3-Prototyp · nur Verhaltensnachweis · Links zeigen auf App-Routen, die hier nicht ausgeliefert werden',
};
const themes = { web: 'slate', local: 'sand', ads: 'coral' };
function page(l) {
  const d = data[l], h = d.hero;
  const hero = `<article class="box box--hero th-sand" data-i="-1">
    <p class="eyebrow">${esc(h.eyebrow)}</p>
    <h1 class="h1">${esc(h.h1.a)} <em>${esc(h.h1.em)}</em></h1>
    <p class="lead">${esc(h.body)}</p>
    <div class="cta"><a class="btn btn--coral" href="/${l}/audit/">${esc(h.primary)}</a><a class="btn btn--ghost" href="#services">${esc(h.secondary)}</a></div></article>`;
  const pieces = d.pieces.map((p, i) => `<article class="box box--c th-${themes[p.id]}" data-i="${i}" id="pc-${p.id}">
    <div class="pc__img"><img src="../assets/${p.img.file}.webp" width="${p.img.w}" height="${p.img.h}" alt="${esc(p.img.alt)}" style="object-position:${p.img.position}" loading="lazy" decoding="async"></div>
    <div class="pc__txt"><p class="pc__num">${p.number}</p><h2 class="pc__name">${esc(p.name)}</h2><p class="pc__out">${esc(p.outcome)}</p>
      <button class="pc__toggle" type="button" hidden aria-expanded="false" aria-controls="dt-${p.id}" data-open="${esc(d.common.explore)}" data-close="${esc(d.common.closeDetails)}"><span class="pc__tl">${esc(d.common.explore)}</span><span class="sr-only">: ${esc(p.name)}</span><span class="pc__ico" aria-hidden="true"></span></button>
      <div class="pc__detail" id="dt-${p.id}"><p>${esc(p.detail)}</p><ul>${p.deliverables.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><a class="pc__link" href="/${l}/services/${p.id}/">${esc(d.common.fullService)}<span class="sr-only">: ${esc(p.name)}</span></a></div></div></article>`).join('');
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Odalo M3 background prototype (${l})</title>
<script>document.documentElement.className='js'</script><link rel="stylesheet" href="../proto.css"></head><body>
<p class="note">${esc(note[l])} · <a href="../en/">EN</a> <a href="../es/">ES</a> <a href="../de/">DE</a></p>
<main class="m3"><div class="stage"><div class="canvas"><svg class="geo" aria-hidden="true" focusable="false"></svg>${hero}<span id="services"></span>${pieces}</div></div></main><script src="../m3.js" type="module"></script></body></html>`;
}
for (const l of ['en', 'es', 'de']) { mkdirSync(path.join(here, l), { recursive: true }); writeFileSync(path.join(here, l, 'index.html'), page(l)); }
writeFileSync(path.join(here, 'index.html'), '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>M3 prototype</title><p><a href="en/">EN</a> · <a href="es/">ES</a> · <a href="de/">DE</a>');
console.log('built');
