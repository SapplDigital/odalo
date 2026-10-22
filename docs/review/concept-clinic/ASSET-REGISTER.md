# Asset register: Tidewell Physiotherapy concept (fictional local campaign)

Everything here is original work made for this concept on 2026-10-20 by Odalo with AI assistance (Claude Code). No photographs, no stock, no model-generated pictures, no third-party artwork, no real practice, practitioner, patient, review or listing. No paid service or account was used and nothing was published or sent.

## Source files (docs/review/concept-clinic/)
| File | What | Provenance |
|---|---|---|
| `tools/build-art.mjs` | Node script that draws the illustrations as plain SVG (re-run: `node docs/review/concept-clinic/tools/build-art.mjs`) | Original code |
| `assets/studio-scene.svg` (1600x1000) | Treatment studio with three figures | Original vector illustration |
| `assets/street-scene.svg` (1600x1000) | The practice on its street, bakery, bus stop 12 | Original vector illustration |
| `assets/glyph-{back-neck,knees-hips,shoulders,active-life}.svg` (800x600) | One figure per service area | Original vector illustrations |
| `index.html` | Responsive campaign destination page; one small inline script; nothing is submitted; no network requests | Original; fictional name, address, hours, web address |
| `creatives/square.html`, `portrait.html` | Layout sources of the two ad creatives | Original |
| `creatives/tidewell-concept-square-1080x1080.png`, `...-portrait-1080x1350.png` | The two creatives at exact size, with a baked-in "Concept creative for a fictional practice. Not a published ad." line | Rendered from the HTML with Edge |
| `screens/*.png` | Retina masters: `desktop-1440-top.png` (1440x900 at 2x), `card-wide-crop.png` (css crop x60 y100 1100x688 at 2x), `mobile-390-top.png` (390x1112 css at 2x) | Screenshots of `index.html` |
| `LOCAL-PRESENCE-PLAN.md` | The proposed plan | Written here |

Typography: Bahnschrift (headings) and Segoe UI (text), Windows system fonts, rasterised into the screenshots and creatives and not distributed. Re-render with licensed web fonts before any outside use.

## Site images (public/work/concepts/clinic/), WebP, resized with Pillow (Lanczos), quality 84 (creatives 88)
| Record id | Role | Files (width, KB) | Intrinsic (largest) | Crop / use | Language in picture |
|---|---|---|---|---|---|
| `clinic-card-wide` | card (default) + case-study lead | 640 (20), 960 (30), 1280 (42) | 1280x801 | 1100x688 css crop of the page's top section (headline, intro, buttons, part of the studio illustration); used for 16:10 card slots (tablet, phone, 2-up service layouts, featured cards) and as the case-study lead | English |
| `clinic-card-tall` | card-tall (source under `min-width: 64em`) | 540 (33), 1080 (71) | 1080x1350 | the portrait creative, anchored left (`object-position: 6% top`) so its headline stays whole in the narrow supporting-card slot of the 3-column desktop layout | English |
| `clinic-desktop` | screen | 640 (18), 1024 (30), 1440 (45) | 1440x900 | full desktop viewport of the page | English |
| `clinic-mobile` | screen | 390 (34), 780 (72) | 780x2224 | phone view (390 css px wide): header, intro, buttons, studio and the start of the local section | English |
| `clinic-ad-square` | creative | 540 (28), 1080 (56) | 1080x1080 | the square creative | English |
| `clinic-ad-portrait` | creative | 540 (33), 1080 (71) | 1080x1350 | the portrait creative | English |

Alt text (en/es/de), captions, the screenshot language and a provenance line for every record are in `src/content/projects.ts` (`images` on `sample-clinic`). Pictures contain English text; the page says so under each image ("Screenshot language: English").

## What the prototype and creatives state and do not state
The page states it is a fictional practice and a concept; its enquiry panel says nothing is submitted and asks only for an area, a preferred day and a time (no name, contact or health information). The creatives label themselves concept creatives. Nothing claims treatment outcomes, guarantees, credentials, testimonials, ratings or rankings.
