# FA2 — expanding free-audit mosaic (local prototype)

> **Status note (added in FA3):** this README is the historical prototype record. Where it describes the multicolour `word.svg` header, the 10 px hover bar, the 8 px selected frame or the repeated scope caveats, read the "FA2A correction" section below, which supersedes it; the integrated site is documented in `../FA3/README.md`.

Standalone HTML/CSS/vanilla-JS prototype. Not part of the Astro build, no production route, no nav link, no dependency added.
**It can never send anything**: `audit.js` contains no fetch/XHR/beacon, the dev server answers GET/HEAD only, nothing is written to storage.

## Review it

```bash
node docs/review/free-audit/FA2/serve.mjs 4391
```

Then open http://127.0.0.1:4391/docs/review/free-audit/FA2/index.html (EN) or `.../de.html` (DE long copy).
Query tests: `?service=ads&plan=360` (valid), `?service=zzz&plan=gold` (ignored), `?theme=alt` (alternate palette check).
Regenerate HTML/tokens after editing copy: `node docs/review/free-audit/FA2/build.mjs`.

```bash
npx playwright test -c docs/review/free-audit/FA2/playwright.fa2.config.mjs
```

```bash
node docs/review/free-audit/FA2/capture.mjs
```

(tests and capture need the server above running; they use the installed Edge, nothing is downloaded.)

## Changed files (all new, all under `docs/review/free-audit/`; no tracked file modified)

`FA2/`: `index.html` `de.html` (generated) · `build.mjs` · `audit.css` · `alt-theme.css` · `audit.js` · `tokens.generated.css` (generated from `src/styles/global.css`) · `serve.mjs` · `fa2.spec.mjs` · `playwright.fa2.config.mjs` · `capture.mjs` · `README.md` · `evidence/` · `recordings/`; plus `../SESSION-HANDOFF.md`.
Shared app/config files: **none changed**, so no app build/suite was run (and none is needed).

## Design contract → implementation

| Contract | Where |
|---|---|
| Joined mosaic, flat fills, curved OUTER corners only | `audit.css` `.board/.intro/.tile`: no gaps; large radius on intro top-left and Advertising bottom-right |
| Brand tokens as source | `tokens.generated.css` is sliced from `global.css` `:root`; `--au-*` aliases at top of `audit.css`; no colour literals in CSS/JS (only `alt-theme.css`, the documented override, and the recording-only pointer dot in `capture.mjs`) |
| Hover preview | CSS only, `(hover:hover) and (pointer:fine)`: a mosaic-style triangle (`.tile__grow`, behind the text) scales from 0.3 to 0.72 of the tile (transform only, 240 ms); superseded the 10 px bar, see FA2A below |
| Open (click/tap/Enter/Space), one at a time, persists | `audit.js` `setOpen(i)`; trigger = real `<button>` in the `<h3>`; `aria-expanded/controls` |
| Close, Escape, focus recovery | Close button and tile `keydown`: focus returns to the trigger if it was inside the hidden panel |
| Include / one focus / clear | `[data-include]` toggles `#f-service` (production IDs `web, local, video, ads`); `[data-clear]` "No preference"; selected = inset frame **and** "✓ Included in your request" text; summary `<dd>`; polite live region |
| Sync + query | the form `<select>` is the single source; `sync()` mirrors it to tiles/summary; `?service=`/`?plan=` validated against the select's options; plan untouched by tile actions |
| Layout modes | phone: stacked, natural growth · 48em: 2×2 natural flow · 64em: intro beside pieces · ≥75em and ≥46em tall (em, so enlarged text leaves it sooner): reserved board (`--au-board-min: 38rem`) with grid tracks that settle in 240 ms on the board only; neighbours of an open piece drop the teaser line so their height need cannot exceed the reserved row |
| Entrance | one 560 ms clip-path reveal, staggered ≤260 ms, controls usable throughout; skipped for reduced motion |
| No JS | everything in normal flow; JS-only buttons stay `hidden`; submit is `disabled` with a visible "cannot send" notice |

## Reused vs mocked

Reused: production field set, required/optional split, service/plan IDs, error and simulated-result wording (EN/DE copied from `ui.ts`), validation rules **re-implemented** from `AuditForm.astro` (copy, not import).
Mocked: submission (renders "Simulated submission" only), privacy link (inert anchor with a note), plan names (hard-coded). `submit.ts`, analytics and `site.auditEndpoint` are never touched. No production-form coverage is claimed.
Prototype wording that is NOT production copy: focus names ("Local presence", "Content", "Advertising" map to service IDs `local`, `video`, `ads`), tile teasers, scope note, DE strings I wrote for the pieces.

## Results (actual runs, Edge 156 via Playwright, this machine)

- `playwright test` (FA2 config): **25 passed**. Covers: explore ≠ select; one open; persists after pointer leaves; hover moves nothing; include/switch/close keeps focus choice and entries; single focus; clear/remove; select→mosaic; keyboard Enter/Space/Escape/Close focus recovery; **form top/size identical** through open/include/switch/close (EN 1440, DE 1280); rapid switching + 5 resizes → ≤1 open, no horizontal overflow; valid/invalid query; invalid-submit summary/focus/entries kept; valid submit → zero requests, GET-only same-host, empty storage/cookies; no-JS; DOM order = visual order at 1440/834/390; no text escaping its tile (DE 1024–1440, 834, 320).
- Geometry (`evidence/capture-log.json`): desktop 1440 board 608 px and form top 923 px in every state (compact, hover, open, selected, switch, closed); DE 1440 612/927 and DE 1280 632/947 constant; no gap area between tiles; no horizontal overflow at any viewport; no clipped content.
- Phone/tablet reflow is natural growth (390: board 1219→1313→1356 px, form pushed down as intended).
- Keyboard: Tab through 34 stops from the tiles through the form; only flagged item is the skip link (appears over the header by design). Focus after Include+Escape = `b-web`.
- Performance (trace, 1440×900, no throttling, 5 opens + 1 include in ~2.5 s): Layout 98 events / 48.6 ms total / 5.7 ms max, style recalc 19 ms, paint 38 ms, no task >50 ms. Layout is the animated grid tracks (expected; scoped to the board). This is a local headless trace, not real-device frame rate or Core Web Vitals.
- Console/page errors during capture: none.

## Evidence

Screenshots in `evidence/` (names say the state): `1440-01…08`, `1440-de-*`, `1280-de-*`, `834-*`, `390-*`, `320-*`, `*-de-open-selected-full`, `*-enlarged200-*`, `1440-reduced-motion-*`, `*-nojs-full`, `1440-alt-theme-*`, `1440-keyboard-*`.
Recordings in `recordings/` (real CDP screencast of the live page, encoded to webm with Playwright's installed ffmpeg-1011 because Playwright's own recorder needs the uninstalled ffmpeg-1013; a red dot marks the pointer, drawn only in the recording): desktop preview→open→include→switch→close→scroll (7.3 s) and phone tap→open→select→switch→close (4.6 s, touch emulation).
Enlarged text method: **root-font simulation** (`html{font-size:200%}`), not the browser's own font-size setting.

## Self-critique and the three corrections made

1. **`hidden` was overridden by author display rules**: the "Included" badge showed on every open tile and, without JS, on all four; the JS-only "No preference" button was visible without JS. Fixed with a global `[hidden]` rule; new tests.
2. **German "Kostenlose" ran under the neighbouring tile** at 1280 (h1 too large for the intro column). h1 size reduced/hyphenating, `min-width:0`; tests across DE widths.
3. **Fixed-height header clipped text at enlarged type/narrow widths**, and the no-JS 1440 layout left half of the intro empty. Header now `min-height`; intro sits beside the pieces from 64em also without JS.
Also fixed during build: board height grew 26 px on one open state (neighbour teaser needed more room), which would have moved the form; fixed via the teaser rule and a 75em threshold.

## Limitations / not verified

- The two recordings were produced and measured (frames, duration) but I did not play them back; the stills of the same states were inspected.
- Enlarged text is simulated; real browser font settings, real touch devices, Safari/Firefox, screen readers and real 60 fps were not tested.
- `?theme=alt` was visually inspected only in two screenshots; contrast numbers were not computed for the alt palette.
- (FA2A) The header now shows typed lowercase "odalo" in Outfit. The first FA2 handoff claimed this was already the case; it was not (it used the multicolour `word.svg`). That claim and this limitation are corrected.
- ES not built (EN and DE only). Reduced-motion and tile-join checks are numeric plus screenshots, not pixel diffs.
- (FA2A) Hover growth replaced by the triangle surface; the old bar is gone.
- (FA2A) Selected state is now a 4 px inset accent bar plus the textual badge; the 8 px frame is gone.
- Production integration implications (FA3): reuse real `AuditForm.astro` validation/submit rather than the copy; map focus names to `services` content; move `audit.css` into scoped Astro styles; derive DE/ES strings through `ui.ts`; keep the 75em/46em reserved-board gate and re-measure after copy changes.


## FA2A correction (planner review items 1-4)

Original FA2 evidence in `evidence/` and `recordings/` is preserved untouched and now shows the superseded look (multicolour word, bar hover, 8 px frame, long caveats). Correction evidence is in `correction/`.

| Item | Change |
|---|---|
| 1 Wordmark | `.bar__word`: typed "odalo", Outfit 700, no symbol or dot. `word.svg` and all canonical assets untouched. |
| 2 Hover | `.tile__grow` is a right-triangle surface in the tile's bottom-right, painted behind the text (`isolation:isolate`, `z-index:-1`). Rest 0.3 scale, hover 0.72 (about 2.4x linear, 5.8x area; web tile 134x91 to 323x219 px), transform-only. Each tile has its own grow colour (web coral-light, local sand, content ink-deep, ads slate), all chosen so the tile text keeps at least 4.5:1 on it. Content uses ink-deep, not ink, because an ink triangle merged with the Advertising tile and blurred the join (seen in my first capture). It disappears while a tile is open. Reduced motion: transition is `0s`, the state changes without travel. No libraries. |
| 3 Copy | One scope line: "We\u2019ll agree the exact scope with you." (DE: "Den genauen Umfang stimmen wir mit dir ab."). Removed response-time/format caveats, the per-tile "not a promise of review depth" and the summary qualification. Open tiles add a "Helpful to tell us:" prompt (a question to the visitor, no deliverables). Summary note: "Optional: choose one focus, or none." Disclosure near the form and the "Prototype: nothing is sent" tag are unchanged. DE mirrored. |
| 4 Selected | 4 px accent bar inset beside the text (not on the tile edge) plus the existing "Included in your request" badge. Open-but-unselected tiles have no bar. |

### FA2A results (actual)
- Focused invariants: **31 passed** (25 earlier + 6 new: typed wordmark, hover surface grows 3x+ in area inside its tile with tile/trigger/board/form bounds unchanged and no selection, hover surface removed while open, single scope line and no caveat strings in EN, reduced-motion transition 0s, DE no leftover caveats).
- Hover geometry (`correction/capture-log.json`): trigger 536,153 111x34, tile 496,113 448x304, board top 113 h 608, form top 923 816x1181 are identical before and after hover; only the surface changed.
- Contrast (`correction/contrast.md`, `contrast.json`): 364 computed pairs, **0 failures** in both palettes. Lowest text ratio 4.87 default / 5.88 alt; lowest non-text 4.18 / 5.18. Covers rest text, every tile's text against its grow surface, open and selected text, accent bar, buttons rest/hover/focus ring, CTA/clear/submit hover, placeholder, field edges, error text/summary/invalid border. The audit initially found: placeholder 4.36 (fixed: placeholder uses `--au-muted`), CTA hover text coral on ink 3.99 (fixed: `--coral-light`); focus-ring and CTA-ring flags were an audit mistake (ring measured against the control instead of its surroundings) and were corrected in the script, not waved through. Threshold: 4.5 text, 3 large text and non-text.
- Playback: the real webm files were decoded again (vp8 to png at 2 fps) into `correction/playback/*-sheet.png`, and a 5 fps close-up of the Website/Local hover handover was inspected. Watched: desktop hover on Website, Local, Content then Website (surface grows under the pointer, previous one settles, text stationary), click open, Include (badge and accent bar appear), switch to Advertising, Close (selection kept), scroll to the form with the summary showing Website. Phone: tap open Local, Include, tap Advertising, Close, scroll to the form with summary. Continuous, no overlap or jump seen. Not frame-by-frame, 2 fps sampling plus the one close-up; real playback speed was not viewed in a media player.
- Screenshots inspected: `1440-02c`, `02f`, `03`-`04`, `1280-de-02`, `1440-alt-hover`, `1440-reduced-motion-hover-immediate`, `320-03-selected-local-full`, plus the two playback sheets. Others in `correction/` were generated but not individually viewed: `1440-01`, `02a/b/d/e`, `05`, `1440-de-*`, `1280-de-01`, `390-*`, `*-de-03-*`, `1440-nojs-full`, `390-nojs-full`, `1440-alt-open-selected-elsewhere`, `1440-reduced-motion-open-immediate`.

### FA2A remaining limitations
Hover colours were checked for text contrast, not for how distinct each surface is from its neighbouring tile (ink-deep vs ink is subtle). Tablet 834 was not recaptured (layout code unchanged apart from copy). No real touch/AT/other-browser testing. ES still absent. Enlarged-text captures were not repeated after the copy change.
