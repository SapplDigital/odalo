# Task 10: assembly motion integrated into the homepage services section

One services composition: the four real tiles are the pieces. Nothing was added next to it, no prototype board, no progress rail, no Replay control, no emblem. Service detail pages, work, pricing, header, hero artwork and module are unchanged.

## What changed (files)

| File | Change |
|---|---|
| `src/components/ServiceMosaic.astro` | tile-level assembly (CSS + script), outer corners moved from the container clip to the tiles, mobile row gap closed, cookie-panel awareness, hero coordination |
| `tests/services-motion.spec.ts` (new) | 24 tests for the integration |
| `tests/helpers/services.ts` (new) | `assembleServices(page)`: scrolls as a visitor does until every piece has docked |
| `tests/mosaic.spec.ts` | the hover/geometry tests call `assembleServices` first; one phone test compares layout widths (`offsetWidth`) instead of transformed boxes |
| `HANDOFF.md` | the mosaic section now describes the tile corners and the assembly |
| `docs/review/services-motion-integration/` | this evidence, plus `tools/` to regenerate it |

## Integration decisions

- **In flow, no sticky stage.** The real mosaic is about 1,090 px tall on desktop and about 2,000 to 2,300 px on a phone with full names, outcomes, concept labels, Explore buttons and links, so it cannot be pinned below the 88 px header without shrinking content. Each tile instead travels while *it* scrolls into view: progress runs from its layout top at 94 % of the window height (of the part the cookie panel leaves visible) to 44 % (phones 52 %), the second tile of a row follows 12 % later. No runway, no extra scroll length, no scroll capture.
- **Destinations come from the real layout.** Every tile ends exactly where the grid puts it; travel is a small relative transform (outward 8 to 24 px horizontally, 12 to 28 px vertically on two columns, 12 px and 20 px from below on phones, at most 2.2 degrees of rotation, scale 0.965, soft shadow, rounded inner corners that square off as it docks). Layout positions (`offsetTop`) drive progress, so the transform never feeds back into it. Offsets stay inside the page margin so nothing leaves the viewport and no page scroll width is added (`overflow-x: clip` on the section as a safeguard).
- **Content first.** Nothing is faded or hidden. Names, outcomes, concept labels, pictures, Explore buttons and links are visible and usable from first render; a tile that is still travelling is simply slightly apart and tilted. Pictures settle a little after their tile (lift 10 px, 1.4 degrees).
- **Kept from the prototype:** separation, deliberate docking order (the second tile of a row lags), inner corners closing and shadow flattening on docking, seam sparks on the edges a piece closes (4 px, over padding only, never over text), layering through travel.
- **Adapted or omitted:** the central joint emblem, its ring and the neighbour recoil are omitted (they would sit over real content); sparks are limited to edges and removed after docking; pictures do not fly between tiles (they would cross other tiles' captions).
- **Settled state is the old mosaic.** `tools/geometry-compare.mjs` compares tile, picture, title, text and action boxes of the settled new build with the build from before this task (EN/ES/DE x 1440, 1024, 834, 390, 320; plus all four hover states at 1440 and 1024): identical to 0.6 px at 1440, 1024 and 834, including every narrow-neighbour state. At 390 and 320 the stack is exactly 16 px shorter: the thin light gap inside each row (8 px twice) is closed so the column is connected.
- **Corners.** The container no longer clips; each tile carries its own outer corner (large top left and bottom right, 6 px top right and bottom left on two columns; on phones the column silhouette is large top left and bottom right, 6 px top right of the first tile and bottom left of the last). Inner corners are 0 once docked. Tested.

## Actions never wait for the travel

- **Settle triggers:** keyboard focus entering any tile control, Explore (click or tap), a link to `#services` (load or hash change), a stored change to reduced motion, a window under 480 px high, and answering the first-visit cookie panel. Settling is a 260 ms eased move of the transforms to nothing; DOM, focus and open panels are untouched. A per-frame sample of the arriving tile in the tests shows the move is spread over frames, not a jump.
- **After settling** the page behaves as it did before: shared-edge hover, Escape, close, inline panels on phones. Hover ignores a tile that is still travelling, so a pointer resting under scrolling content cannot trigger edge movement.
- **Reverse scrolling:** a docked tile stays docked for the visit; pieces that have not docked reverse exactly and decoratively. Focused or selected tiles are always settled, so nothing focused or selected ever scatters.
- **Restored scroll and anchors:** on load, whatever is on screen or above is already docked; only pieces fully below the start line travel. A hash link to the section shows the finished composition.
- **Resize:** offsets and sparks are re-measured; a resize that makes motion unavailable settles at once.
- **Fallbacks:** reduced motion, no JavaScript and windows under 480 px high get the complete static layout from first render (no travelling state exists to settle).
- **Hero:** while a piece is travelling and the hero artwork is on screen, the script presses the hero's own pause control (the hero finishes the arrangement in progress, then stops) and presses it again when the pieces have docked. A visitor's own pause or play always wins (tested).

## Evidence

- `recordings/` (real-time Edge screencast, 30 fps, silent; contact sheets in `contact/`):
  `desktop-scroll.mp4` (EN: hero, pieces arriving and docking, on to Work, back up over the docked mosaic, down again), `desktop-focus-and-explore.mp4` (DE: focus and Enter on a tile that is still arriving, Escape, hover afterwards), `phone-touch.mp4` (EN, first visit with the cookie panel: real swipes), `phone-explore.mp4` (ES: Explore tapped on a tile that is still arriving).
- `states/`: assembly steps by real scrolling (EN at all widths; ES/DE at 1440 and 390), short-screen fallbacks. `after/` and `before/`: the settled section, EN/ES/DE at 1440, 1024, 834, 390, 320, from the new and the previous build. `interaction/`: all four narrow-neighbour states at 1440 and 1024, and each Explore panel opened on a travelling tile at 1440 and 390. `enlarged-text/`: settled section at the browser's own 32 px default text size.
- `evidence/`: `measurements.json`, `measure-output.txt`, `overlap.json`, `geometry-compare.json`, `real-text-size-results.json`, `dist-before.json`, `dist-after.json`.

## Checks run

- `astro check`: 0 errors, 0 warnings. Full Playwright suite on the isolated preview: **329 passed** (305 before, 24 new).
- New tests cover: content opaque, visible and inside the viewport width before travel completes (3 widths x 3 languages); travel shrinks monotonically while scrolling down and ends docked; reverse is exact before docking and docked tiles stay docked; focus settles with an eased move; Explore and tap on a travelling tile; `#services` and hash change; restored scroll; resize mid-assembly; cookie panel; reduced motion; no JavaScript; short window; mobile column with no gaps and unchanged silhouette; desktop shared edges and corners; hover geometry and no movement of following sections at 1440 and 1024; stationary pointer; layout shift 0 through load, scroll, finish and reset (EN/DE, desktop/phone); reserved image space with images blocked; hero pauses while a piece travels, resumes afterwards, and never undoes a visitor's pause.
- Real 32 px browser text size (temporary Edge profile), home page EN/ES/DE x 320, 390, 834, 1024, 1440, audited both as loaded (pieces apart) and settled: 15 combinations, 0 failing; no tile content outside its tile or the viewport; no sideways scroll.

## Measurements (final build)

`tools/measure.mjs`: whole home page from the top, real wheel (1440x900) and touch (390x844) scrolling through the hero, the services section and on into Work, back up over the docked mosaic and down again; about 4,300 frame intervals per run, 3 runs per condition, consent stored. "Before" is the build from before this task served from a separate folder; the control is the new build with reduced motion.

| | Desktop motion | Desktop before | Desktop control | Phone motion | Phone before | Phone control |
|---|---|---|---|---|---|---|
| Frame interval median / p95 / p99 (ms) | 16.7 / 16.8 / 16.9 | 16.7 / 16.8 / 16.9 | 16.7 / 16.8 / 16.8 | 16.7 / 16.8 / 16.8 | 16.7 / 16.8 / 16.9 | 16.7 / 16.8 / 16.9 |
| Frames over 33 ms (3 runs) | 0 | 1 | 1 | 1 | 0 | 0 |
| Layout shift (3 runs) | 0, 0, 0 | 0, 0, 0 | 0, 0, 0 | 0, 0, 0 | 0, 0, 0 | 0, 0, 0 |
| Long tasks (max) | 3 (59 ms) | 1 (55 ms) | 0 | 1 (52 ms) | 0 | 0 |
| Main thread over the run: script / style / layout / all tasks (ms) | 406 / 109 / 30 / 1,687 | 307 / 56 / 29 / 1,328 | 252 / 0 / 0 / 890 | 412 / 125 / 27 / 1,878 | 289 / 64 / 28 / 1,447 | 219 / 0 / 1 / 1,006 |
| CPU x4: frames over 33 ms / worst frame | 0 / 17.3 ms | 0 / 17.3 ms | | 5 / 66.7 ms | 1 / 33.4 ms | |
| CPU x4: main thread all tasks (ms) | 7,319 | 5,681 | | 7,771 | 6,059 | |

- **Layout shift is 0** in every condition. An earlier run of this integration (before the two animated custom properties `--sh` and `--in` were registered as non-inheriting) showed a 200 ms frame and a 136 ms long task on the throttled phone and about 4x the style time of the build before the task; the final build measured here did not reproduce that (style time about 2x, worst frame 66.7 ms). It is one before/after pair of runs, not a controlled experiment.
- **Cost of the motion:** about +100 ms script, +50 ms style and +360 ms in all tasks over a 22 s scripted run on desktop (and about +430 ms on the phone run), i.e. the extra main-thread work is real, mostly paint and compositing of four shadowed, tilted layers during arrival. With the CPU throttled 4x on the phone, 5 frames over 33 ms (one over 50 ms, worst 66.7 ms) against 1 before.
- **Assets and requests (first load of the home page):** HTML 90,105 to 87,438 B (the component script moved into a bundled file), JS 10,924 to 18,022 B in 3 to 4 files (gzip 3.9 to 6.7 KB), CSS 54,116 to 55,706 B (gzip 13.1 to 13.4 KB). Net +6.0 KB raw, +2.1 KB gzip; one extra request (desktop 17 to 18, phone 15 to 16); transferred bytes +6,021 B (373,401 to 379,422 on desktop). No image, font or video was added.
- **Hero against services motion** (`tools/overlap.mjs`, per-frame samples over the scripted scroll): the hero artwork and an on-screen, travelling piece are visible together in about 12 % of samples on desktop and 10 % on a phone if nothing is done. With the coordination as shipped the hero is paused in 99.3 % of those samples (the rest is the hero finishing the arrangement in progress before it stops).
- **Conditions and limits:** Windows 11, Edge (Chromium) driven by Playwright in headless mode, real wheel and touch input over CDP, localhost, 60 Hz virtual display, no GPU measurement. All frame medians are exactly one 60 Hz interval, so these numbers show that the section does not make frames late in this setup; they are not proof of smoothness on a phone. CPU x4 throttling is a rough stand-in. Standalone prototype numbers were not reused.

## Remaining limitations

- The extra main-thread work above is real; on a slow phone the arrival of the first row is the busiest moment. A compositor-only version (scroll-driven CSS animations, shadows as separate layers) would be the next step if it matters.
- The shared-edge hover ignores a tile that is still travelling; with a pointer resting on one, it starts as soon as that tile has docked or any action settles it.
- While the hero is paused by the coordination its button reads "Play animation" for a moment; it returns to "Pause animation" when the pieces have docked. A visitor pressing it in between is respected.
- With the first-visit cookie panel showing (about 40 % of a phone window) pieces arrive in the visible part above it, so the tiles dock higher up than they would without the panel; answering the panel settles whatever is still travelling.
- Tile pictures keep the crops from the services task (the local-information picture is cut at the right at the resting width).
- Seam sparks are faint on the sand tile; they are a small cue, not a feature.
- Not tested: Safari, Firefox, real devices, a screen reader, forced colours. `@property` and `overflow-x: clip` are supported by current evergreen browsers; without them the assembly is simply less smooth or does not clip, never hides content.
