# Task 06: sample-clinic becomes a labelled local-advertising concept (Tidewell Physiotherapy, fictional)

## Outputs
- **Prototype:** `index.html` (open in a browser; no server, no network). Sans-serif identity (Bahnschrift / Segoe UI), calm blue with one teal accent, 6 px corners, thin rules: deliberately unlike Casa Almina. Sections: introduction, "five minutes from the market" (address, getting here, access, hours), four service areas with one-tap "Choose this service", first-visit enquiry (area, day, time only; the demo note and the result message say nothing is submitted). No practitioner credentials, testimonials, guarantees or outcome claims; no personal or clinical fields.
- **Creatives:** `creatives/tidewell-concept-square-1080x1080.png` and `creatives/tidewell-concept-portrait-1080x1350.png` (sources `square.html`, `portrait.html`). Each carries the line "Concept creative for a fictional practice. Not a published ad." and the fictional address `tidewell.example/millbrook`; no ad-account, spend or result mock-ups.
- **Local-presence plan:** `LOCAL-PRESENCE-PLAN.md` (proposed only; no profile, listing, rankings, reviews or search screenshots).
- **Register:** `ASSET-REGISTER.md` (files, crops, dimensions, provenance). Illustrations: `tools/build-art.mjs` -> `assets/*.svg`.

## Site integration (sample-clinic only)
- `src/content/projects.ts`: clinic record rewritten (title, `badge` "Fictional practice concept", `concept: true`, project-specific `status`, brief / approach / produced-and-proposed, `screens`, `plan` in en/es/de) and six image records (dimensions, widths, trilingual alt and caption, `screenshotLang`, provenance). Kept: id `sample-clinic`, `sample: true`, services `local` + `ads`, routes, `related`. The hotel's status sentence moved from the shared UI strings into its own record (text unchanged); the shared `work.concept.note` was removed.
- Image variants (generic, reused by the hotel): `ProjectImage` roles `card` (default), `card-narrow` (hotel phone crop), `card-tall` (clinic), `screen`, `creative`; optional `media` per variant. `ConceptImage.astro` renders `<picture>` sources from `variants`.
- Cards (`WorkMosaic.astro`): the clinic card uses the 16:10 `clinic-card-wide` crop by default (tablet, phone, 2-up service layouts, featured), and the portrait creative only in the supporting card of the 3-column desktop layout, anchored left so the headline stays whole. Hotel `card-narrow` unchanged.
- Case study (`work/[project]/index.astro`): no Results block for concepts (the "Produced and proposed" block spans the width), "Screens designed" (desktop, phone), new "Concept ad creatives" section (square, portrait) and "Proposed local-presence plan" (4 steps, marked proposed). The hotel page is unchanged apart from sharing code (no creatives or plan sections).
- `src/i18n/ui.ts`: `work.concept.{creativesH,creativesNote,planH,planNote}` in en/es/de.
- Pictures: `public/work/concepts/clinic/*.webp` (12 files, 18 to 72 KB).
- Tests: `tests/concept-clinic.spec.ts` (new, 11), `tests/concept.spec.ts` (two lines changed: the shop is now the "unchanged artwork" card).
- Not touched: `sample-shop`, header, hero, pricing, services behaviour, the work-mosaic grid.

## Two layout fixes found while verifying (affect the hotel card, appearance only)
- Tablet (48em to 64em): a featured screenshot card now really keeps a 16:10 art box. The rule added in task 05 lost on specificity, so the hotel picture was still shown as a 21:8 band.
- Desktop (64em and up): a featured screenshot card keeps 16:10 too. With a longer neighbouring title (German clinic title) the card became taller and the hotel picture was cropped on the sides; now the extra height stays below the picture as card background.

## Checks
- `astro check`: 0 errors, 0 warnings. Production build succeeds.
- Full suite on the isolated preview (Edge, port 4322): **257 passed, 0 failed** (246 before + 11 new). Includes axe on `/en/work/sample-clinic/`, the reflow audits for `/work/` and the case studies at 320/390 px, 100 % and 200 %, and the hotel tests.
- New tests cover: record integrity and files on disk; status text per language, once, project-specific (clinic text never mentions a hotel, hotel text never mentions a practice, hotel sentence unchanged); no Results panel and no "never built" wording; produced vs proposed wording; 5 pictures with exact alt/size/caption; creatives and plan present; cards use the right source per width (portrait creative at 1440, wide crop at 834/390/320, shape not distorted); shop card unchanged; service pages (local, ads) show the clinic picture; image boxes keep the same size with images blocked at 1440 and 390 px.
- Port 4321 dev server: running before and after (pid 22304); my 4322 previews were stopped.

## Evidence (this folder)
- `placement/after-{en,es,de}-{1440,834,390,320}-{work-index,case-clinic}.png` (work-index shots target `section.work`, not the page hero), `after-{en,es,de}-{1440,834,390}-home-work.png`, `after-{en,de}-{390,320}-text200-{work-index,case-clinic}.png` (200 % root-font simulation), `related-{en,de}-{1440,834,390}-service-{local,ads}.png` (related-project placements), `clinic-card-close-en-{1440,390}.png`.
- Before: the old generic map-pin clinic card is visible in `../concept-hotel/correction/before-*-work-index.png` (second card).
- Creatives and prototype captures: `creatives/*.png`, `screens/*.png`.

## Limits
- The 200 % cases are a root-font-size simulation (as in task 04); no real browser text-size run was repeated for these pages.
- On a phone the clinic card shows a crop of the page (headline and buttons readable, the illustration partly); on desktop the supporting card shows the left 70 % of the portrait creative.
- The hotel card can show an empty navy area below its picture on desktop when the clinic title wraps to many lines (German).
- Pictures contain English text (noted under each image). Fonts are Windows system fonts rendered into the images.
- Illustrations are stylised flat drawings made in code, not reviewed by a designer; figures are simple and generic by design.
- Edge only; no screen reader. I looked at English and German captures and a sample of Spanish; not every capture was opened.
