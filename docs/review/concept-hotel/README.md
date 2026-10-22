# Task 05: sample-hotel becomes a labelled concept (Casa Almina, fictional)

## Prototype
`docs/review/concept-hotel/index.html` (open the file in a browser; no server, no network). Sections: hero (arch-framed house illustration, headline, two actions), three rooms (one lead suite and two stacked rooms), facilities as four unequal cells (courtyard pool, terrace breakfast, text cell, tile pattern), date-request panel (dates, guests, room; sends nothing), footer. Illustrations are drawn in code (`tools/build-art.mjs`) and written to `assets/`. Register: `ASSET-REGISTER.md`.

## Captures (docs/review/concept-hotel/screens/, Retina masters)
- `desktop-1440-hero.png`: hero at 1440x900.
- `detail-rooms.png`: close-up of the rooms presentation.
- `mobile-390-booking.png`: phone view of the date request with its concept notice.

## Placement screenshots (docs/review/concept-hotel/placement/)
`before-en-{1440,834,390}-{home-work,work-index,case-hotel}.png` and `after-{en,es,de}-{1440,834,390}-{home-work,work-index,case-hotel}.png`, plus `after-de-{390,320}-text200-*.png` at 200 % root font. Caveat: the "before" work-index images were captured with a selector that hit the page hero, not the cards; the same hotel card appears in `before-*-home-work.png` (both pages use the same component).

## Changed files
- `src/content/projects.ts`: `ProjectImage` type; hotel record: new title, `badge`, `concept: true`, brief / approach / produced-and-proposed text and `screens` in en/es/de, three `images` (dimensions, widths, alt, caption, `screenshotLang`, provenance). Kept: `id: 'sample-hotel'`, `sample: true`, routes, `services: web, local, video`.
- `src/components/ConceptImage.astro` (new): `<img>` with srcset/sizes, intrinsic width/height, lazy/async.
- `src/components/WorkMosaic.astro`: card shows the concept picture when the project has one (other projects keep their artwork); badge from the project; tablet-only 16:10 art box for a screenshot.
- `src/pages/[lang]/work/[project]/index.astro`: lead screenshot with caption below it (grows, never clipped), concept wording for brief / approach / produced-and-proposed / results, "Screens designed" section (detail + mobile) with captions, screenshot language and image source; metadata uses the concept badge.
- `src/i18n/ui.ts`: `work.concept.*` in en/es/de.
- `public/work/concepts/hotel/*.webp` (8 files, 17 to 50 KB each).
- `tests/concept.spec.ts` (new, 9 tests).
- Not touched: header, hero, pricing, services behaviour, other projects, work-mosaic layout.

## Story accuracy
Title "Boutique hotel website concept"; badge "Fictional hotel concept" (cards, case study eyebrow, page title). The case study says it is an imagined brief, a proposed approach, what was produced here (the website concept with original illustrations) and what is only proposed (local profile, video). Results: "There are no results. This concept was never built or launched." No client, testimonial, figure, launch history or campaign appears. The earlier "relaunch" wording is gone (a test fails if it returns).

## Checks
- `astro check`: 0 errors, 0 warnings. Build: succeeds.
- Full suite on the isolated build (Edge, port 4322): **244 passed** (235 before + 9 new). Includes axe on the hotel case study and the existing reflow audit (320/390 px, 100 % and 200 %, en/es/de) on `/work/sample-hotel/`, which checks that captions are not clipped.
- New tests cover: record integrity (id, sample, services, three-language alt/caption/provenance, other projects unchanged); card and case-study markup in en/es/de (dimensions, srcset, alt, badge, links, three screens, language note, no outcome claims, services links); boxes keep the same size with images blocked (space reserved); images load.
- Port 4321 dev server: running before and after (pid 22304); my preview servers on 4322 were stopped.

## Limits
- The concept pictures contain English text; the site marks this under each image but does not translate the pictures.
- On a 390 px screen the desktop screenshot on the card is small and its text is not readable; the case study's detail and phone screenshots carry the legible views.
- Fonts in the prototype (Constantia, Corbel) are Windows system fonts rendered into the screenshots.
- Illustrations are original vector drawings, not photography; their quality is stylised and unreviewed by a designer.
- Only the hotel was done; the clinic and shop keep generic artwork. No other languages or screens of the prototype (single page, English only).
- Visual review: I looked at English, Spanish and German placement captures at 1440/834/390 and the 200 % German mobile page; not every capture was opened individually. Edge only.
