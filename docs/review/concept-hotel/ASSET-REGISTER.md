# Asset register: Casa Almina concept (fictional boutique hotel)

Everything here is original work made for this concept, created 2026-10-19 by Odalo with AI assistance (Claude Code). No photographs, no stock, no model-generated pictures, no third-party artwork. No paid service was activated: an image-generation connector exists in this environment but its cost is unknown, so it was not used.

## Source files (docs/review/concept-hotel/)
| File | What | Provenance / licence |
|---|---|---|
| `tools/build-art.mjs` | Node script that draws every illustration (plain SVG, no dependencies). Re-run: `node docs/review/concept-hotel/tools/build-art.mjs` | Original code, same status as the repo |
| `assets/hero-house.svg` (1000x1250) | The whitewashed house at dusk above a harbour | Original vector illustration |
| `assets/room-harbour.svg`, `room-garden.svg`, `room-attic.svg` (1600x1000) | Three room interiors | Original vector illustrations |
| `assets/courtyard-pool.svg`, `terrace-breakfast.svg` (1600x1000) | Courtyard with pool; terrace breakfast | Original vector illustrations |
| `assets/tile-pattern.svg` (800x800) | Encaustic floor-tile pattern | Original vector pattern |
| `index.html` | The responsive prototype (HTML + CSS, one small inline script, no network requests) | Original; fictional name, address and rates |
| `screens/*.png` | Retina masters captured from `index.html` with Edge: `desktop-1440-hero.png` (1440x900 at 2x), `detail-rooms.png` (1280x800 css at 2x), `mobile-390-hero-rooms.png` (390x1300 css at 2x, primary phone view), `mobile-390-card-crop.png` (390x680 css at 2x, narrow-card crop), `mobile-390-booking.png` (390x1000 css at 2x, the date form: secondary evidence, no longer on the site) | Screenshots of the above |

Typography in the prototype is the Windows system fonts Constantia (headings) and Corbel (text); they are rasterised into the screenshots and not distributed. Before the concept is shown outside review, re-capture with licensed web fonts if a font licence matters.

## Site images (public/work/concepts/hotel/), WebP quality 84, resized from the masters with Pillow (Lanczos)
| Record id | Role | Files (width) | Intrinsic (largest) | Screenshot language | Used on |
|---|---|---|---|---|---|
| `hotel-desktop` | card + case-study lead | `hotel-desktop-640/1024/1440.webp` (17/30/46 KB) | 1440x900 | English | home work mosaic, work index, service pages that list the hotel, case-study lead |
| `hotel-detail` | screen | `hotel-detail-640/960/1280.webp` (18/32/48 KB) | 1280x800 | English | case study "Screens designed" |
| `hotel-mobile` | screen | `hotel-mobile-390/780.webp` (39/96 KB) | 780x2600 | English | case study "Screens designed" (primary phone view: header, headline, illustrated house, start of rooms; captured from `index.html` at 390 px, task 05A) |
| `hotel-card-narrow` | card-narrow | `hotel-card-narrow-390/780.webp` (20/48 KB) | 780x1360 | English | work cards below 48em (home, work index, service pages): top 680 css px of the same phone capture, shown in its own shape instead of the desktop picture |

Alt text (en/es/de), captions, the screenshot language and a provenance line are in `src/content/projects.ts` (`images` on `sample-hotel`). The pictures contain English text from the prototype (headline, nav, form labels); the page says so under each image ("Screenshot language: English").

## What the prototype states and does not state
Explicit in the page: footer and booking-panel notes say it is a design concept for a fictional hotel; the form has dates, guests and room only (no name, email or payment fields); the button only reveals an on-page message and sends nothing. Rates (120, 140, 190 euros) and room sizes are sample content.
