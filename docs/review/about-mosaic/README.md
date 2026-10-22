# Task 13: honest About section and connected mosaic

## Changed files
`src/components/About.astro` (rebuilt), `src/pages/[lang]/about/index.astro` (principles composition, FAQ instance removed), `src/i18n/ui.ts` (about copy and About metadata, EN/ES/DE), `tests/about.spec.ts` (new, 46 tests), `tests/services-motion.spec.ts` (one assertion made layout-timing independent, see Limitations), `HANDOFF.md` (missing business facts recorded). Evidence tools in `tools/`.

## What changed
- **Mosaic (homepage and About page):** one joined asymmetric composition. Navy approach panel (headline "Different pieces. One direction.", lead, four service links with numbers), a sand panel with a static geometric brand composition (inline SVG, palette only, `aria-hidden`, no text, never sets the height), a coral language panel ("Explore in three languages." plus links to the same page in the other languages, current one marked, explicit choice stored as before) and a slate concept panel ("See the approach in practice." plus "View concept work." to the work index). No gutters, flat shared edges, only the outer silhouette curved (large top left and bottom right). Layouts: desktop 7/5 columns (navy left, three panels stacked right), tablet navy full width then sand and language side by side then concept full width, phone one connected column. Panels grow with text.
- **Removed from the visitor-facing site:** the photography placeholder and its caption, the "remote-first"/"remote and international" and languages-of-work claims, team size/people wording, the future team introductions promise, the "regular reporting" bullet. Copy is the supplied English with natural Spanish and German; the language panel describes the website only.
- **About page:** metadata describes the connected approach (all three languages); three design principles (Plan the whole picture, Make the scope clear, Show the work honestly) as a quiet connected block: one sand surface, shared 2 px dividers, curved outer corners; the international/languages FAQ instance is removed (global FAQ content untouched; homepage FAQ still tested); final CTA, navigation and language switching unchanged. Heading outline: one h1; panel headings are h2 on the About page and h3 on the homepage (under the section h2).
- Not touched: the 29-piece artwork, animation (none added), photographs, generated assets, dependencies.

## Checks
- `astro check` 0 errors, 0 warnings; build ok; normal suite on the isolated preview: **450 passed** (404 before, 46 new) (`evidence/full-suite.txt`).
- New tests: approved copy, service links, language links and the current-language marker in EN/ES/DE on home and About page; none of the removed claims appear (pattern check on the section, page and meta description); principles text; no FAQ or `<details>` in main on the About page and the homepage FAQ still present; heading outline; tile geometry (area sum = grid area, inner corners square, outer large) for 3 languages x 5 widths x 2 pages; no sideways scroll; text and focus bounds inside panels at 390 and 320 px with 200% root font (simulation); keyboard order and visible ring; language switch stores `odalo.lang`; no JavaScript and reduced motion render the same, nothing moves; decorative art hidden from assistive technology.
- **Real browser text size (not a root-font simulation):** Edge with its own default text size set to 32 px (temporary profile), home and About page, EN/ES/DE at 320, 390, 834, 1024, 1440: 30 combinations, 0 failing, including a check that every text element stays inside its panel and the viewport (`evidence/real-text-size-results.json`).

## Inspected screenshots
`after/` (home section and About page, EN/ES/DE at 1440, 1024, 834, 390, 320, plus 390 and 320 at 200% root font; `before/` has the same set for comparison). Viewed: `after/de-1440-100-home.png`, `after/en-1440-100-page.png`, `after/de-320-200-home.png`, `enlarged-text/de-320-home-32px.png`. Real 32 px captures: `enlarged-text/`.

## Limitations
- At 320 px with 32 px real text (or 200% root font) long German words in the headline and links break inside the word (`overflow-wrap: anywhere`) rather than overflow; no clipping, but it is not elegant. This is the extreme end of the supported range.
- Panel headings on the About page are h2 siblings of the "Design principles" h2: acceptable outline, but the principles are not nested under the mosaic.
- The sand composition is original static geometry in the brand's colours and shapes (not the logo module); it is decorative and can be replaced by approved brand artwork.
- A previously flaky test (restored scroll position) was made independent of late lazy-image layout; the behaviour it protects (what is on screen at restore is docked) is still asserted for the top row.
- Not tested: Safari, Firefox, real devices, screen readers. No performance campaign was run.
