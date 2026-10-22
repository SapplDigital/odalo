# Task 11: portfolio as one connected mosaic

## Changed files
`src/components/WorkMosaic.astro`, `src/content/projects.ts` (optional `cardTitle`; card-tall sources now from 80 em), `src/components/ConceptImage.astro` (sizes hint for that breakpoint), `src/i18n/ui.ts` (work heading and context copy, EN/ES/DE), tests: `tests/portfolio.spec.ts` (new), `concept-clinic.spec.ts` / `concept-shop.spec.ts` (card title, 80 em source switch). Evidence tools in `tools/`.

## What changed
- **Connected:** gap 0, every card square-cornered; only the outer silhouette is curved (large top left and bottom right, 6 px top right and bottom left), at every layout. Wide desktop (80 em+): hotel left, clinic, shop and context panel stacked right; the right column rows follow their own pictures (4:5 boxes) and the hotel keeps its 16:10 picture, so the old surplus navy area is gone (about 30 px of padding-level space remains at 1440 in German, tested under 70 px). 64-80 em now uses the tablet arrangement (hotel full width, clinic and shop side by side, context panel full width) because the 5-column right column made pictures too small. Phones: one connected column in the same reading order. Related-work (two projects): 6/6 columns on desktop, stacked on phones.
- **Card titles:** `cardTitle` Casa Almina / Tidewell / Brindle Pantry on cards; the full title is kept as visually hidden text inside the link (accessible name) and as the case-study heading and metadata. IDs, routes, badges, categories and service tags are unchanged.
- **Crops (existing assets only):** clinic uses the full 4:5 portrait creative at wide desktop (headline, illustration, button and address string intact; `before/` cut the address); shop poster anchored at the bottom so the products show with no half-cut text line. Tablet and phones use the 16:10 and phone crops (the tall variants switched from 64 em to 80 em). Hotel desktop and mobile sources untouched.
- **Copy:** heading "Concept work." / "Proyectos conceptuales." / "Konzeptarbeiten."; context panel text as specified; view-all link and status wording kept.

## Checks (isolated preview, Edge)
- `astro check` 0 errors; normal suite **367 passed** (338 before, 29 new) (`evidence/full-suite.txt`).
- New tests: no gutters and no holes (card areas sum to the grid area), flat inner corners and large outer ones, EN/ES/DE x 1440, 1024, 834, 390, 320 and the work index; hotel/clinic/shop order and joins; no big empty area under the hotel (longest German layout); two-project variant; per-layout image sources, loading, no distortion (box within 2:1 of the picture, `object-fit: cover`), reserved space with images blocked; keyboard focus ring drawn inside every card; headings, context copy, links, badges, services.
- Real 32 px browser text size, home page EN/ES/DE x 5 widths: 15 combinations, 0 failing (`evidence/real-text-size-results.json`).
- Hero, services and pricing: not touched; their suites pass.

## Evidence
`before/` and `after/`: home, work index, related-work (video and ads pages, EN at all widths; ES/DE at 1440 and 390) at 1440, 1024, 834, 390, 320. `evidence/crop-comparison-de-1440.png` (left before, right after), `enlarged-text/`.

## Limitations
- The phone and 320 px screenshots show blank picture areas for the clinic and shop cards: a full-page clip of a tall section on a mobile emulation does not paint lazy images. The images load (probe: 350x219 boxes, naturalWidth > 0, `evidence/probe-390.png`) and the tests assert loading and reserved space. Re-shoot on a real device if desired.
- The shop poster crop shows the shelf and a 1-2 line footer note, not its headline; the full poster is on the case-study page.
- The hotel keeps about 30 px of space under its text at 1440; it is content-led, not exactly equal to the right column.
- Between 64 and 80 em the portfolio uses the tablet arrangement, a deliberate change.
- Not tested: Safari, Firefox, real devices. No performance campaign was run (CSS/markup only).
