# Task 03A: pricing at enlarged text (correction evidence)

## What was wrong (reproduced before fixing, 320 px, root font size 200 %, built site)
- `plan-captacion`: the "Empfohlenes Paket" badge was `flex: none` in a non-wrapping header row, so it ran past the panel (right edge 303 px vs content edge 276 px).
- `plan-360`: the price (`€1,290` / `1.290 €`) is one unbreakable run at 88 px; it ran 6 to 44 px past the panel.
- Earlier measurement used the panel's border box, so text sitting in the panel's padding passed. The test now measures against the **content box**.
- (The comparison disclosures did not overflow on the current CSS; the earlier "cmpd scroll" came before the row-wrapping change. Their price span was still `white-space: nowrap` as a whole, which is now limited to the number.)

## Fix (src/components/PlansMosaic.astro, PlanTable.astro, src/i18n/index.ts)
- Plan header may wrap; the badge is shrinkable, wraps its own text and is limited to the panel width (name and badge stack).
- Price is rendered as currency symbol + number (`priceParts()` in `src/i18n/index.ts`, same text as `formatPrice`, order per locale). At extreme enlargement the symbol may drop to its own line; the digits never split. The billing interval already wraps on its own line.
- Panel lists, labels and `dl` rows are constrained (`minmax(0,1fr)` tracks, `overflow-wrap`), disclosure rows wrap and left-align a wrapped value, the summary wraps price under name, chevron stays right.
- No clipping, no smaller text, no scaling, no removed content; desktop 3/4/5, tablet 2x2, colours, content, disclosures and `?plan=` are unchanged.

## How enlargement is applied
- **Tests and the `sim200-*` screenshots:** a ROOT-FONT-SIZE SIMULATION, `html{font-size:200%!important}` injected after load (via served-HTML rewrite when JavaScript is off). It scales rem-based text but does not move the em-based media-query breakpoints.
- **`real-textsize-*` screenshots and `real-text-size-run.json`:** the browser's own text-size setting (Edge profile preference `default_font_size` = 32 px, i.e. 200 % of 16 px), not a stylesheet. Computed root size 32 px; at 320 px width the page is in the narrow layout (48em = 1536 px), pricing `scrollWidth` = `clientWidth` = 320 in en/es/de. This run was a one-off script, not part of the suite.

## Tests (tests/pricing-enlarged.spec.ts; tests/pricing.spec.ts keeps the normal-size checks)
- en/es/de at 320 px and 390 px with 200 %; en/es/de at 320 px with 100 %; de at 834 and 1440 px with 200 %; focus indicator on every summary; no-JavaScript disclosures at 320 px / 200 %; exclusions placement.
- Every run checks: `#plans` scrollWidth, every visible text fragment (Range rects) and every visible element box against the panel's content box and the viewport, full price strings, 44 px controls, and all four comparisons opened with each feature label and value (including "not included") compared with the data.
- **Proven to catch the defect:** with the fix temporarily reverted (nowrap header/badge/price) the en, es and de 320 px / 200 % tests fail; they pass with the fix (the source was restored and rebuilt afterwards).
- Page-level overflow outside pricing is recorded as a test annotation (not asserted).

## Page-level overflow outside pricing (not fixed here; for the later responsive task)
Root font 200 %, scroll-width over viewport, offending sections (counts of overflowing elements):
- `/en/plans/` 320 px: 363 px, `section.cond` (open conditions list).
- `/de/plans/` 320 px: 495 px, `cond`, final CTA.
- `/de/` 320 px: 495 px, hero, work, process, FAQ, final CTA. `/en/` 320 px: 380 px, hero, work, FAQ. `/de/` 390 px: 495 px, work, final CTA.
Pricing itself is within bounds at every one of these.

## Exclusions, stated precisely
`PlansMosaic` renders the explicit "Not included" lists (`notIncluded`) only when `detailed` is true: they appear in the panels on `/{lang}/plans/`. The homepage panels show inclusions and the "built on" statement only; exclusions on the homepage appear solely as "Not included" values in the comparison. The task 03 report wrongly said the home panels show the lists; a test now asserts the distinction.

## Screenshots
`sim200-{en,es,de}-{320,390}-plans-panels.png` (the pricing group) and `...-compare-{base,local,captacion,360}.png` (each comparison expanded); `real-textsize-{en,es,de}-320-plans-*.png`; `view-*.png` are stitched crops of the tall images for review. Note: an earlier set of these images was captured from a stale build (left over from the revert experiment); it was discarded and everything here was regenerated from the final build.

## Remaining limits
- At 200 % and 320 px, German words such as "Werbebudget", "Aufnahmesession" and "Unternehmensprofil" break mid-word without a hyphen (no hyphenation dictionary in the test browser).
- At that size "€" may sit on its own line above the digits.
- Edge only; the real-setting run was one profile, not Firefox/Safari; no screen reader.
