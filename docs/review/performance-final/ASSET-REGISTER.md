# Consolidated asset register (site images and video)

Generated 2026-10-22 by `docs/review/performance-final/tools/build-register.mjs` from `public/work/concepts/**` and the records in `src/content/projects.ts` / `services.ts`.
It consolidates, and does not replace, the per-concept registers: `docs/review/concept-hotel/ASSET-REGISTER.md`, `concept-clinic/ASSET-REGISTER.md`, `concept-shop/ASSET-REGISTER.md`, `services-mosaic/`.

**Provenance is not a licence.** "Recorded provenance" below is what the project records say about how each file was made. It is **not** an approved usage right, a licence grant or a legal clearance. Nothing here approves any right, font licence or image use.

## Raster images (WebP, responsive variants)
Delivery: `<img srcset>` with `sizes`, intrinsic width/height set (no layout shift); `loading="lazy"` + `decoding="async"` except the case-study lead image and the service-page figure (eager). Alt text is localized (en/es/de) in the record: `src/content/projects.ts`, `alt.{en,es,de}`.

| Project | Record | Role | Placements | Intrinsic (largest) | Variants: width (actual size, KB) | Media-query crop | Language in picture |
|---|---|---|---|---|---|---|---|
| sample-hotel | `hotel-desktop` | card | work card; home work mosaic; case study lead; service tile: web | 1440x900 | 640 (640x400, 17.3); 1024 (1024x640, 31.0); 1440 (1440x900, 46.9) | - | en |
| sample-hotel | `hotel-detail` | screen | case study gallery | 1280x800 | 640 (640x400, 18.5); 960 (960x600, 32.9); 1280 (1280x800, 48.3) | - | en |
| sample-hotel | `hotel-mobile` | screen | case study gallery | 780x2600 | 390 (390x1300, 39.9); 780 (780x2600, 96.9) | - | en |
| sample-hotel | `hotel-card-narrow` | card-narrow | work card (only (max-width: 47.99em)); home work mosaic | 780x1360 | 390 (390x680, 20.7); 780 (780x1360, 48.7) | (max-width: 47.99em) | en |
| sample-clinic | `clinic-card-wide` | card | work card; home work mosaic; case study lead | 1280x801 | 640 (640x400, 20.0); 960 (960x600, 30.7); 1280 (1280x801, 42.9) | - | en |
| sample-clinic | `clinic-card-tall` | card-tall | work card (only (min-width: 80em)); home work mosaic | 1080x1350 | 540 (540x675, 33.2); 1080 (1080x1350, 71.7) | (min-width: 80em) | en |
| sample-clinic | `clinic-desktop` | screen | case study gallery | 1440x900 | 640 (640x400, 18.1); 1024 (1024x640, 30.8); 1440 (1440x900, 45.5) | - | en |
| sample-clinic | `clinic-mobile` | screen | case study gallery | 780x2224 | 390 (390x1112, 34.1); 780 (780x2224, 72.6) | - | en |
| sample-clinic | `clinic-ad-square` | creative | case study gallery; service tile: ads | 1080x1080 | 540 (540x540, 28.5); 1080 (1080x1080, 57.0) | - | en |
| sample-clinic | `clinic-ad-portrait` | creative | case study gallery | 1080x1350 | 540 (540x675, 33.2); 1080 (1080x1350, 71.7) | - | en |
| sample-shop | `shop-card-wide` | card | work card; home work mosaic; case study lead | 1280x800 | 640 (640x400, 19.9); 960 (960x600, 32.1); 1280 (1280x800, 42.7) | - | en |
| sample-shop | `shop-card-tall` | card-tall | work card (only (min-width: 80em)); home work mosaic | 720x1280 | 360 (360x640, 14.8); 720 (720x1280, 33.8) | (min-width: 80em) | en |
| sample-shop | `shop-sheet` | screen | case study gallery | 1280x800 | 640 (640x400, 20.6); 960 (960x600, 35.4); 1280 (1280x800, 48.4) | - | en |
| sample-shop | `shop-ad-square` | creative | case study gallery | 1080x1080 | 540 (540x540, 33.0); 1080 (1080x1080, 70.6) | - | en |

### Recorded provenance per image (as written in the records, English)
| Record | Recorded provenance |
|---|---|
| `hotel-desktop` | Original vector illustration and layout made for this concept with AI assistance. No photographs and no stock images. |
| `hotel-detail` | Original vector illustration and layout made for this concept with AI assistance. No photographs and no stock images. |
| `hotel-mobile` | Original vector illustration and layout made for this concept with AI assistance. No photographs and no stock images. |
| `hotel-card-narrow` | Original vector illustration and layout made for this concept with AI assistance. No photographs and no stock images. |
| `clinic-card-wide` | Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional. |
| `clinic-card-tall` | Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional. |
| `clinic-desktop` | Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional. |
| `clinic-mobile` | Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional. |
| `clinic-ad-square` | Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional. |
| `clinic-ad-portrait` | Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional. |
| `shop-card-wide` | Original vector illustrations, animation, layouts and copy made for this concept with AI assistance. Not filmed footage and not photographs. The shop, its products, hours and web address are fictional. |
| `shop-card-tall` | Original vector illustrations, animation, layouts and copy made for this concept with AI assistance. Not filmed footage and not photographs. The shop, its products, hours and web address are fictional. |
| `shop-sheet` | Original vector illustrations, animation, layouts and copy made for this concept with AI assistance. Not filmed footage and not photographs. The shop, its products, hours and web address are fictional. |
| `shop-ad-square` | Original vector illustrations, animation, layouts and copy made for this concept with AI assistance. Not filmed footage and not photographs. The shop, its products, hours and web address are fictional. |

Service-tile crops (`services-local-info`, `services-video-strip`) are exported from the concept outputs; sources in `docs/review/services-mosaic/`.

## Video
| Project | File | Formats (bytes) | Size | Duration/fps | Poster | Loading | Alt/label source |
|---|---|---|---|---|---|---|---|
| sample-shop | `public/work/concepts/shop/brindle-pantry-concept-1080x1920.*` | webm (759,420); mp4 (892,664) | 1080x1920 | 10 s, 30 fps, silent | `shop-poster-*.webp` 720x1280 | `preload="none"`, no autoplay: bytes are requested only after a user starts playback | `label`/`caption` in the record (silent, so the label is the text equivalent) |

Recorded provenance (video): Original vector illustrations, animation, layouts and copy made for this concept with AI assistance. Not filmed footage and not photographs. The shop, its products, hours and web address are fictional.

## Vector and brand files (public/)
| Path | Bytes | Use | Recorded provenance |
|---|---|---|---|
| `public/brand/legacy/favicon-legacy.svg` | 649 | superseded legacy mark | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/legacy/odalo-symbol-legacy.svg` | 549 | superseded legacy mark | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/logo/odalo-logo-dark.svg` | 2,609 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/logo/odalo-logo.svg` | 2,609 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/logo/symbol-bloom-dark.svg` | 2,622 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/logo/symbol-bloom.svg` | 2,622 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/logo/symbol-trefoil-dark.svg` | 2,658 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/logo/symbol-trefoil.svg` | 2,658 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/logo/symbol-windmill-dark.svg` | 2,629 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/logo/symbol-windmill.svg` | 2,629 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo/bird.svg` | 3,753 | animation / wordmark pieces (supplied canonical set; do not edit) | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo/fish.svg` | 3,760 | animation / wordmark pieces (supplied canonical set; do not edit) | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo/fox.svg` | 3,763 | animation / wordmark pieces (supplied canonical set; do not edit) | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo/hexagon.svg` | 3,761 | animation / wordmark pieces (supplied canonical set; do not edit) | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo/sailboat.svg` | 3,764 | animation / wordmark pieces (supplied canonical set; do not edit) | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo/word-on-dark.svg` | 3,839 | animation / wordmark pieces (supplied canonical set; do not edit) | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo/word.svg` | 3,767 | animation / wordmark pieces (supplied canonical set; do not edit) | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo-logo-dark.svg` | 1,470 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo-logo.svg` | 1,464 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo-symbol-dark.svg` | 1,476 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/brand/odalo-symbol.svg` | 1,447 | logo / symbol variants | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/favicon.svg` | 3,820 | favicon | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |
| `public/og.png` | 48,115 | Open Graph image (not indexed while noindex is on) | Odalo brand assets and the supplied 29-piece animation set; see `HANDOFF.md` and `docs/review/logo-animation/`. Authorship and rights are not restated here. |

## Fonts (self-hosted via Fontsource npm packages `@fontsource-variable/outfit`, `@fontsource/instrument-serif`)
| Font | Files requested | Notes |
|---|---|---|
| Outfit (variable, latin) | `outfit-latin-wght-normal.*.woff2` about 32 KB, preloaded | Distributed by Fontsource; licence text not re-verified in this task. |
| Instrument Serif Italic 400, latin | `instrument-serif-latin-400-italic.*.woff2` about 22 KB, preloaded | Same. |
| Instrument Serif Italic 400, latin-ext | about 12 KB | After Task 18 it loads only when a page needs a glyph in its unicode-range (none in the current en/es/de copy). |

HANDOFF.md records both fonts as **provisional**; the brand's own final fonts were not supplied. Whether these are approved as the final brand fonts is an **owner decision, not made here**.

## Fonts rasterised inside concept images
The concept screenshots/creatives contain text rendered in Windows system fonts (Bahnschrift, Segoe UI, Rockwell, Constantia, Corbel); the per-concept registers state they are not redistributed as font files and recommend re-rendering with licensed fonts before any use outside this demo.

## Unresolved ownership, rights and approval questions (owner)
1. **Usage rights**: no licence or rights approval is recorded for any image. The registers say the concept art was made with AI assistance (Claude); confirm that commercial use of it is acceptable to you under the applicable terms.
2. **Fictional businesses**: Casa Almina, Tidewell and Brindle Pantry are fictional; confirm none collides with a real business or trademark (not checked here).
3. **Brand/animation files**: the supplied 29-piece animation and `public/brand/` marks: confirm authorship and that you hold the rights to publish them.
4. **Final fonts**: approve Outfit and Instrument Serif as final, or supply the brand fonts (HANDOFF "Fonts" row), and verify the licences you rely on.
5. **System fonts in raster images**: see above.
6. **Open Graph image**: the provenance of `public/og.png` is not stated in a register.
7. **Alt text**: Spanish and German alt text and captions are drafts needing native review.
