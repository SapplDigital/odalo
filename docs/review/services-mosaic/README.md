# Task 08: services mosaic with existing concept imagery

## Imagery mapping (same on the home mosaic and the four service pages, EN/ES/DE)
| Service | Picture | Source | Fit |
|---|---|---|---|
| Websites and maintenance (web) | Casa Almina website screen, `hotel-desktop` | existing hotel project image (1440x900) | cover, eases to a right-anchored 1.35x frame while it is the narrow neighbour |
| Local visibility (local) | Tidewell "Five minutes from the market" local-information section, `services-local-info` (new crop, 1440x590) | `#find-us` of `docs/review/concept-clinic/index.html`, via `tools/build-service-images.mjs` | cover |
| Video and content (video) | Five real frames of the Brindle Pantry MP4 on a drawn film strip, `services-video-strip` (new, 2000x800) | `public/work/concepts/shop/*.mp4` at 0.8/3.2/5.6/7.6/9.4 s, ffmpeg + `tools/build-service-images.mjs` | cover |
| Paid advertising (ads) | Tidewell square creative, `clinic-ad-square` | existing clinic creative (1080x1080) | contain (its headline is never cut) |

References, alt text, captions and provenance live with the service content (`src/content/services.ts`: `visual`, `serviceVisual()`); the concept label is the source project's own badge plus a short localized caption. New WebP files: `public/work/concepts/services/` (local 12/24/36 KB, strip 21/45/67 KB). No video file is requested by any tile or service page (tested).

## Composition
Each tile: picture (inset, solid tile surface around it), one-line concept label, title, description, actions. From 48em the tile is a subgrid of its row, so picture, label, title, text and actions line up across neighbours at rest and grow naturally with longer translations. The picture row absorbs height. Row heights are fixed per breakpoint (rem, so they scale with text): 34rem (>=80em), 36rem (48-79.99em); the hover-driven grid, intent delay, tolerance, 380 ms edges, Explore/Escape/focus, links, touch and no-JS behaviour are unchanged. Phones: one connected column, picture box 16/10 (5/4 for local and ads). The intro sentence is replaced in EN/ES/DE.

## Changed files
`src/content/services.ts`, `src/components/ServiceMosaic.astro`, `src/pages/[lang]/services/[service]/index.astro`, `src/i18n/ui.ts` (intro), `tests/services-mosaic.spec.ts` (new), `public/work/concepts/services/*`, `docs/review/services-mosaic/**`.

## Evidence
`before/` and `after/` (EN/ES/DE rest at 1440/1024/834/390/320; EN active state for every tile at 1440 and 1024; service pages), `interaction/` (transition frames, Explore open, keyboard focus, phone Explore, reduced motion), `enlarged-text/` + `real-text-size-results.json` (Edge with its own default text size set to 32 px: 75 combinations, 0 failing). Rebuild crops: `node docs/review/services-mosaic/tools/build-service-images.mjs`.

## Limits
- The mosaic is taller (about 1090 px at 1440): the shrinking neighbour still has to hold its text and a usable picture.
- Pictures contain English text (stated in the captions). The local-information and film-strip pictures are crops: wide boxes show them nearly whole, narrow boxes re-frame them.
- Phones show the local picture as the street illustration only (5/4 box).
- Checked in Edge only.
