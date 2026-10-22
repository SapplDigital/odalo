# Correction 14A: process accent contained in the panels' silhouette

**Cause:** the accent was a rectangular `.step::after` bar, which painted outside the curved bottom-right (and could at the top-left) of the outer panels.
**Fix (`src/components/Process.astro` only):** the bar is no longer an element. It is part of each panel's own background (`background-image` gradient, 6 px high, `background-size: var(--draw) 6px`), so the browser clips it to the panel's rounded border box automatically, while drawing and when finished. `--draw` is a registered percentage (`@property`, non-inheriting); the existing `is-in` reveal sets it from 0% to 100% with the same 0.6 s duration and 0.35 s stagger. Reduced motion and no-JavaScript: 100% from first render, no transition. Observer failure: content untouched, bars stay at 0%. No `overflow` clipping was added to panels or the group; copy, layout, radii, colours and other sections are unchanged.

## Evidence
- `corner-comparison-before-after.png` (3x crops; left before, right after; top row the 04 panel's bottom-right corner, bottom row the 01 panel's top-left corner): before, the bar runs straight across the paper outside the curve; after, it ends exactly on the curve. Individual crops: `before-*/after-*-corner-*.png`. The "before" is the previous rectangular bar re-created on the same page by injected CSS, not a checkout of the old build.
- `after-desktop-mid.png` (intermediate frame: 01 and 02 finished, 03 drawing, 04 starting), `after-desktop-done.png`, `after-phone-mid.png`, `after-phone-done.png`, `after-reduced-motion.png`, `after-no-javascript.png`, `after-narrow-enlarged-320-200.png`. Viewed: the corner comparison and `after-desktop-mid.png`.
- Tests: the existing process tests now read `--draw` instead of the pseudo-element transform (same assertions: nothing hidden or moving before entry, draws once in order and stays, finished with reduced motion and without JavaScript, observer failure). New decoration-boundary test: the panels have no `::after` content, no `overflow` clipping, a 6 px background band, and in a screenshot of the last panel's bottom-right corner the pixel in the square corner (outside the curve) is the page colour while a pixel just inside the curve on the bottom edge is the accent colour. It fails on the old rectangular bar.
- Results: `astro check` 0 errors, 0 warnings; process tests 32 passed; normal suite in `full-suite.txt`.

## Limitations
- `@property` is required for the smooth draw; where unsupported the accent simply appears complete (a registered-property fallback), never clipped or hidden.
- The reduced-motion and no-JavaScript captures show the completed state only.
- Not tested: Safari, Firefox, real devices.
