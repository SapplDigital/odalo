# Task 14: connected process mosaic with accurate demo wording

## Changed files
`src/components/Process.astro` (rebuilt), `src/i18n/ui.ts` (process heading, visible note and four steps, EN/ES/DE), `tests/process.spec.ts` (new, 31 tests), `HANDOFF.md` (outstanding owner approval recorded). Tools in `tools/`. Pricing, audit, FAQs, Base.astro/global.css (shared reveal) and all other sections are untouched.

## Changes
- **Copy:** heading "Four steps. One connected approach." (ES "Cuatro pasos. Un enfoque conectado.", DE "Vier Schritte. Ein verbundener Ansatz."), the visible note "Proposed workflow for this demo. Scope, timing and reporting are agreed before work starts." (localized) and the four steps 01-04 as specified. Removed: free audit as a step, fixed price and "no small print", measurement from day one, monthly report. No frequencies, guarantees, outcomes or response times were added.
- **Composition:** the staircase cards, the connector rail and the step offsets are gone. One joined mosaic with sand, coral, slate and navy (the last panel is navy): wide desktop (64 em+) two rows 5/7 then 7/5; 48-64 em equal two-by-two; phones one connected column 01 to 04. No gutters, flat internal edges, curved outer silhouette only (large top left on 01 and bottom right on 04, small corners at the other two). Text sets the height; each number sits directly above its heading. `<ol>` with `h3` per step (heading outline h2, h3 x4), `#process` unchanged.
- **Accent:** a thin bar along the bottom edge of each panel draws once, left to right, in order, when the section first enters (the existing `data-draw` / `is-in` observer in `Base.astro`, unchanged). Panels, numbers and text are fully visible and never move or resize. Reduced motion and no JavaScript show the finished bars; if the observer never fires, all content stays usable and only the accent is not drawn.

## Checks (isolated preview, Edge)
- `astro check` 0 errors, 0 warnings; build ok; normal suite **481 passed** (450 before, 31 new) (`evidence/full-suite.txt`). No existing assertion was changed.
- New tests: copy and order in EN/ES/DE, none of the removed promises; list/heading semantics; `#process` navigation; joined geometry (area sum, square inner corners, curved outer corners, four distinct surfaces, navy last, 5/7 and 7/5 proportions, 2x2, single column) in 3 languages x 5 widths; text bounds inside panels and viewport at 390 and 320 px with 200% root font (simulation); WCAG AA contrast of number, heading and text on every panel; accent: nothing hidden or moving before entry, draws once in order and stays, finished state with reduced motion and without JavaScript, content usable when the observer never fires; no focus stops in the section.
- **Real 32 px browser setting** (separate from the root-font simulation above): Edge launched with a temporary profile whose default text size is 32 px (`tools/real-text-size.mjs`), EN/ES/DE at 320, 390, 834, 1024, 1440: 15 combinations, 0 failing, including a check that every text element stays inside its panel and the viewport (`evidence/real-text-size-results.json`).

## Evidence
- `before/` and `after/`: EN/ES/DE at 1440, 1024, 834, 390, 320 and 390/320 at 200% root font. Viewed: `after/de-1440-100-process.png`, `after/es-390-200-process.png`, `enlarged-text/de-320-process-32px.png`.
- Accent entry sequence (frames at 0, 0.3, 0.7, 1.1, 1.6, 2.3 s after entry): `evidence/accent-sequence-1440.png`, `evidence/accent-sequence-390.png`; measured bar progress per panel in the run: 0 to 0.77/0.80, then 1 / 0.83-0.87, ... all 1 by 2.3 s, in order.

## Limitations
- At 320 px with a real 32 px text setting, long German words break inside the word (`overflow-wrap: anywhere`); nothing is clipped.
- The accent bars remain as thin lines on the panels' bottom edges after completing; they read as light separators, by design.
- Screenshots are section clips; the sticky header can appear over a clip's lower edge.
- Not tested: Safari, Firefox, real devices, screen readers. No performance campaign was run.
