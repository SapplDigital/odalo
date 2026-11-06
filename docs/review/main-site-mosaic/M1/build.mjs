// Generates the isolated M1 prototype pages from the app's OWN source of truth:
//   - tokens/base styles: src/styles/global.css (copied verbatim minus @imports into generated/base-from-source.css)
//   - copy, services, projects, image records: src/content/*.ts and src/i18n/ui.ts (loaded through Node type stripping, no bundler)
// Output: en.html / de.html / es.html in this folder. Nothing outside docs/review/main-site-mosaic/M1 is written.
// Run: node --disable-warning=ExperimentalWarning docs/review/main-site-mosaic/M1/build.mjs   (from the app root)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const here = fileURLToPath(new URL('.', import.meta.url));
const app = resolve(here, '../../../..');
const { data } = await import('./src/load-data.mjs');

mkdirSync(resolve(here, 'generated'), { recursive: true });
const globalCss = readFileSync(resolve(app, 'src/styles/global.css'), 'utf8').replace(/^@import[^\n]*\n/gm, '');
const fontCss = `@import '/vendor/outfit/wght.css';\n@import '/vendor/instrument-serif/400-italic.css';\n`;
writeFileSync(resolve(here, 'generated/base-from-source.css'), `/* GENERATED from src/styles/global.css by build.mjs. Do not edit. */\n${fontCss}${globalCss}`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const srcset = (i) => [...i.widths].sort((a, b) => a - b).map((w) => `/work/concepts/${i.folder}/${i.file}-${w}.webp ${w}w`).join(', ');
const mid = (i) => { const w = [...i.widths].sort((a, b) => a - b); return `/work/concepts/${i.folder}/${i.file}-${w[Math.floor(w.length / 2)]}.webp`; };
const picture = (image, variants, lang, sizes) => {
  const img = `<img src="${mid(image)}" srcset="${srcset(image)}" sizes="${sizes}" width="${image.width}" height="${image.height}" alt="${esc(image.alt[lang])}" loading="lazy" decoding="async">`;
  if (!variants.length) return img;
  return `<picture>${variants.map((v) => `<source media="${esc(v.media)}" srcset="${srcset(v)}" sizes="100vw" width="${v.width}" height="${v.height}">`).join('')}${img}</picture>`;
};
const serviceById = (id) => data.services.find((s) => s.id === id);

const tones = ['ink', 'sand', 'coral', 'slate'];
const tileClass = (tone) => `sf-tile sf-tile--${tone}${tone === 'ink' || tone === 'slate' ? ' on-dark' : ''}${tone === 'coral' ? ' on-coral' : ''}`;
const cardClass = (tone) => `wf-card wf-card--${tone}${tone === 'ink' || tone === 'slate' ? ' on-dark' : ''}${tone === 'coral' ? ' on-coral' : ''}`;

function page(lang) {
  const t = data.ui[lang];
  const href = (p) => `/${lang}/${p}`;
  const services = data.services.slice(0, 4).map((s, i) => {
    const v = data.visuals[s.id];
    const img = `<img src="${mid(v.image)}" srcset="${srcset(v.image)}" sizes="(min-width: 64em) 58vw, 100vw" width="${v.image.width}" height="${v.image.height}" alt="${esc(v.image.alt[lang])}" loading="lazy" decoding="async">`;
    return `<article class="${tileClass(tones[i])}" data-service="${s.id}">
          <figure class="sf-fig">
            <div class="sf-img" data-fit="${v.fit}" style="--pos:${v.position}; --pos-tablet:${v.positionTablet ?? v.position}; --ar:${v.ratioMobile}">${img}</div>
            <figcaption class="sf-cap"><span class="sf-num" aria-hidden="true">${s.number}</span><span class="sf-concept"><b>${esc(v.badge[lang])}</b> · ${esc(v.label[lang])}</span></figcaption>
          </figure>
          <h3 class="h-tile">${esc(s.name[lang])}</h3>
          <p class="sf-text">${esc(s.outcome[lang])}</p>
          <a class="sf-link" href="${href(`services/${s.id}/`)}">${esc(t.common.fullService)}<span class="sr-only">: ${esc(s.name[lang])}</span></a>
        </article>`;
  });

  const cards = data.projects.map((p, i) => {
    const feat = i === 0;
    const card = p.images.find((x) => x.role === 'card');
    const narrow = p.images.find((x) => x.role === 'card-narrow');
    const tall = p.images.find((x) => x.role === 'card-tall');
    const variants = narrow ? [narrow] : [];
    const sizes = feat ? '(min-width: 80em) 58vw, (min-width: 48em) 90vw, 100vw' : '(min-width: 80em) 24vw, (min-width: 48em) 45vw, 100vw';
    const ar = [narrow ? `--ar-narrow:${narrow.width} / ${narrow.height}` : '', tall ? `--art-ar:${tall.width} / ${tall.height}` : ''].filter(Boolean).join(';');
    const title = (p.cardTitle ?? p.title)[lang];
    return `<article class="${cardClass(p.tone)} ${feat ? 'wf-card--feat' : 'wf-card--sup'}" data-wf-card="${p.id}" data-p="${p.id}">
          <div class="wf-art" style="${ar}"><span class="wf-pic wf-pic--wide">${picture(card, variants, lang, sizes)}</span>${!feat && tall ? `<span class="wf-pic wf-pic--tall"><img src="${mid(tall)}" srcset="${srcset(tall)}" sizes="24vw" width="${tall.width}" height="${tall.height}" alt="${esc(tall.alt[lang])}" loading="lazy" decoding="async"></span>` : ''}</div>
          <div class="wf-body">
            <p class="wf-meta"><span class="wf-badge">${esc(p.badge ? p.badge[lang] : t.work.sampleBadge)}</span> <span>${esc(p.kind[lang])}</span></p>
            <h3 class="h-tile wf-title"><a href="${href(`work/${p.id}/`)}">${esc(title)}${p.cardTitle ? `<span class="sr-only">: ${esc(p.title[lang])}</span>` : ''}</a></h3>
            <p class="wf-text">${esc(p.context[lang])}</p>
            <ul class="wf-svc" aria-label="${esc(t.work.connected)}">${p.services.map((sid) => `<li>${esc(serviceById(sid).name[lang])}</li>`).join('')}</ul>
            ${feat ? `<p class="wf-more">${esc(t.common.readCase)} <span aria-hidden="true">→</span></p>` : ''}
          </div>
        </article>`;
  });

  return `<!doctype html>
<html lang="${lang}" class="no-js">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>M1 prototype · Services → Work (${lang})</title>
<link rel="stylesheet" href="/generated/base-from-source.css">
<link rel="stylesheet" href="/m1.css">
<script>document.documentElement.className = 'js';</script>
</head>
<body>
<div class="m1-bar" role="note">
  <strong>M1 prototype (not production)</strong>
  <span>Services = settled fixture, not the live controller. Work = real concept content/links.</span>
  <nav aria-label="Prototype review links"><a href="/en.html">EN</a> <a href="/de.html">DE</a> <a href="/es.html">ES</a> <a href="/${lang}/">Current production composition (local dist)</a></nav>
</div>
<main id="main">
  <section class="m1-context" aria-label="Fixture: content above Services">
    <div class="wrap"><p class="eyebrow">Fixture · hero and header sit above this on the real page</p></div>
  </section>

  <section id="services" class="svc" aria-labelledby="svc-h">
    <div class="wrap">
      <header class="svc__head">
        <p class="eyebrow">01 — ${esc(t.services.mosaicLabel)}</p>
        <h2 id="svc-h" class="h-section">${esc(t.services.h2.a)} <em>${esc(t.services.h2.em)}</em></h2>
        <p class="lead svc__intro">${esc(t.services.intro)}</p>
      </header>
      <div class="sf-board" data-fixture="services-settled">
        <div class="sf-row sf-row--top">
        ${services[0]}
        ${services[1]}
        </div>
        <div class="sf-row sf-row--bot">
        ${services[2]}
        ${services[3]}
        </div>
      </div>
    </div>
  </section>

  <section id="work" class="wf" aria-labelledby="work-h" data-wf>
    <div class="wrap">
      <header class="wf-head">
        <i class="wf-peg" aria-hidden="true" data-wf-ledge></i>
        <div class="wf-head__title">
          <p class="eyebrow">02 — ${esc(t.nav.work)}</p>
          <h2 id="work-h" class="h-section">${esc(t.work.h2.a)}${t.work.h2.a ? ' ' : ''}<em>${esc(t.work.h2.em)}</em></h2>
        </div>
        <div class="wf-head__note on-dark" data-wf-note>
          <p>${esc(t.work.explainer)}</p>
          <a class="link-arrow" href="${href('work/')}">${esc(t.common.viewAll)}</a>
        </div>
      </header>
      <div class="wf-board" data-wf-board>
        ${cards.join('\n        ')}
      </div>
    </div>
  </section>

  <section class="m1-context m1-context--next" aria-label="Fixture: next section" data-next-section>
    <div class="wrap">
      <p class="eyebrow">03 — ${esc(t.nav.process)}</p>
      <h2 class="h-section">${esc(t.process.h2.a)} <em>${esc(t.process.h2.em)}</em></h2>
    </div>
  </section>
</main>
<script src="/m1.js"></script>
</body>
</html>
`;
}
for (const lang of ['en', 'de', 'es']) writeFileSync(resolve(here, `${lang}.html`), page(lang));
console.log('written en.html de.html es.html + generated/base-from-source.css');
