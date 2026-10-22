# Task 05A: accurate concept status and stronger mobile presentation

## Wording (en / es / de)
- Status note (one, under the page title): self-initiated design for a fictional hotel, built as a local responsive prototype; not a client commission or a hotel launch; no client or performance data. Text in `src/i18n/ui.ts` (`work.concept.note`).
- The "never built" wording and the empty **Results** block are gone for the concept; the page now has: imagined brief, proposed approach, "Produced and proposed" (prototype produced; local profile and video proposed only), and "Screens designed". The concept badge stays on cards, case-study eyebrow and page title.
- Kept: `sample: true`, id `sample-hotel`, routes, services `web / local / video`. Other projects still show their Results block and generic artwork.
- `src/content/projects.ts`: new `connected` and `screens` text; `ProjectImage` role `card-narrow`.

## Mobile
- New primary phone screen: `prototype-mobile-390-hero-rooms.png` (the actual prototype at 390 px: header with date button, headline, illustrated house, start of the rooms), captured from the current `index.html`; the date-form capture remains only as secondary evidence in `screens/mobile-390-booking.png` and is no longer on the site.
- Narrow cards (below 48em): a `<picture>` source with a purpose-made crop of the same phone capture (`hotel-card-narrow`, 780x1360, top 680 css px: brand, headline, buttons, roofline of the house). The card art box takes that crop's shape (`--ar-narrow`), so nothing is stretched. From 48em the desktop picture is used (tablet keeps the 16:10 box). Title, badge, text and the case-study link stay live localized text outside the images.
- The case-study lead stays the labelled desktop screenshot; the phone view is in "Screens designed".
- Assets: `public/work/concepts/hotel/hotel-mobile-{390,780}.webp` (replaced), `hotel-card-narrow-{390,780}.webp` (new); register updated (`ASSET-REGISTER.md`).

## Changed files
`src/content/projects.ts`, `src/i18n/ui.ts`, `src/components/ConceptImage.astro` (optional `narrow` source), `src/components/WorkMosaic.astro` (narrow source, phone-shaped art box), `src/pages/[lang]/work/[project]/index.astro` (no Results block and full-width "Produced and proposed" block for concepts), `tests/concept.spec.ts`, `public/work/concepts/hotel/*.webp`, `docs/review/concept-hotel/{ASSET-REGISTER.md,screens/*}`, this folder. Not touched: prototype `index.html`, illustrations, other projects, mosaic layout beyond the hotel art box.

## Evidence in this folder
- Work cards, targeted at the card section (`section.work`, not the page hero): `before-{en,es,de}-{1440,834,390,320}-work-index.png` and `after-...` (same names), plus `after-de-{390,320}-text200-work-index.png`.
- Case study: `before-en-{1440,390}-case-hotel.png`, `after-en-{1440,834,390,320}-case-hotel.png`, `after-{es,de}-390-case-hotel.png`, `after-de-{390,320}-text200-case-hotel.png`.
- Close view of the mobile work card (2x): `mobile-work-card-close-en-390.png`, `mobile-work-card-close-de-390.png`.
- The actual mobile prototype capture: `prototype-mobile-390-hero-rooms.png`.
- Note: the "before" shots are from the previous build served from the isolated preview; the final "after" shots were taken after the last asset change (the card crop was lengthened from 560 to 680 css px so the house roof shows; earlier 560 px crop is not kept).

## Checks
- `astro check`: 0 errors, 0 warnings. Build succeeds.
- Tests (`tests/concept.spec.ts`, now 11): record has 4 images with roles; status sentence in each language (one occurrence), no "never built" wording, no Results heading or coral block; narrow viewports (320, 390) use `hotel-card-narrow` with the box and the file in the phone crop's shape (not distorted), 834 and 1440 use the desktop picture; image boxes keep their size with images blocked at 1440 and 390; links, services, alt/caption/provenance in all languages.
- Full suite on the isolated build (Edge, port 4322): **246 passed, 0 failed** (244 before, plus 2 new tests). The existing reflow audit covers `/work/sample-hotel/` at 320/390 px, 100 % and 200 %, in en/es/de (captions cannot clip).

## Limits
- At 390 px the lead desktop screenshot in the case study is still small (its text is not readable); the phone and detail screenshots carry legibility.
- The phone crop shows part of the house, not the whole illustration. English text inside all pictures is noted under each image.
- Edge only; no screen reader; evidence images were inspected for English and German, Spanish by test and spot check.
