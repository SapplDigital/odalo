# M2 — Services→Work field integrated into the real homepage (local only)

27 Oct 2026. Private, local, unpublished (`docs/review` is untracked and must not be published). Nothing staged, committed, pushed, deployed or unlocked. Live deploy `6ae0e49e…` stays locked; recipients, audit routing, noindex and the private snapshot are untouched.

## Review it
```powershell
# integrated (current working tree) and the pre-M2 baseline, both built with the production env into this folder, served on free ports
powershell -NoProfile -File docs/review/main-site-mosaic/M2/rebuild-after.ps1          # -> M2/after-dist
cd docs/review/main-site-mosaic/M2
node serve.mjs after-dist 4342      # http://127.0.0.1:4342/en/  (also /es/ /de/)
node serve.mjs baseline-dist 4341   # pre-M2 source, built from the verified snapshot copy (NOT the stale dist/)
```
Evidence: `evidence/` (screenshots, `video/*.webm`, `trace-integrated-hover.json`, `clipframes/`), `runs/` (every test/build log, including the failed and the stopped ones).

## What changed (exact paths)
| Path | Change |
|---|---|
| `src/components/WorkMosaic.astro` | new homepage-only prop `joined`. Adds the connected header (peg · title · slate note panel holding the existing explainer + "See all work", moved once, not duplicated), the supporting-card context sentence (≥17 px), the `.grid--field` layout, the shared-edge geometry CSS and one controller `<script>` (guarded by `[data-work-field]`). The legacy 80em rules are scoped `.work:not(.work--joined)`; every other placement is byte-identical in markup and pixel-identical in screenshots (`evidence/variant-*`, sha256 equal). |
| `src/components/ServiceMosaic.astro` | new prop `joined`: no closing gap (`padding-bottom:0`, no empty detail-slot margin), square bottom-right corner on the advertising tile, and the minimal explicit state boundary `data-detail-state="open\|closed"` on `#services`, set in the existing `open()`/`close()`. Controller, hover/Explore/Escape/travel/hash/restore/hero logic untouched. |
| `src/pages/[lang]/index.astro` | passes `joined` to both. |
| `tests/work-field.spec.ts` (new, 28 tests) | seam join measured against the real Services board, detail open/close at the boundary (desktop/phone/resize/deep link), mixed keyboard+pointer, dynamic reduced-motion/resize, stable geometry, one-navigation click/tap, touch scroll, ≥16 px text in EN/ES/DE, enlarged text, other placements unchanged, hero-hold only when the hero is on screen, no JS. |
| `tests/portfolio.spec.ts`, `tests/services-motion.spec.ts`, `tests/qa.spec.ts` | deliberate expectation updates for the intended changes only: homepage Work has 3 cards + header note instead of 4 pieces (explainer lives in `.wj-note`), the field's large top-left curve belongs to the Services board (Work grid top-left square, ads tile bottom-right now small), the focus ring on homepage Work cards is drawn around the whole card. Work-index and service-page expectations unchanged. |
| `docs/review/main-site-mosaic/**` | evidence only. |

No new dependency, framework, image or palette literal (new surfaces use existing tokens; the only `rgb()`s are the translucent tag chips Work already used).

## State map
- **Dock** (`data-ledge`, `data-cards` on the section): `pending` only while the field is below the fold; a rAF-throttled scroll check flips each to `done` once (peg grows from its left edge, cards settle 20 px, ≤450 ms, transform only). Already-passed/hash/focus/reduced-motion/bfcache restore settle immediately. If (and only if) the hero art is on screen at that moment it sends `odalo:hero-hold {source:'work'}` and releases after 800 ms (tested: tall window → `[true,false]`; normal window → none).
- **Geometry** (`--geo:1`): viewport ≥80em and ≥34em tall, motion allowed, field ≥72rem wide (rem: enlarged root text leaves), controller ran (`data-ready`, so no-JS stays in natural flow) and the content fits (`data-flow` otherwise). The board height is **measured from content** at rest (featured picture 16:10 + featured text, or twice the tallest supporting text ÷ 0.92) and re-measured on resize, mode change, `fonts.ready`; if that would exceed the featured need by >20 % the field uses natural flow instead (this is the case for German at 1280 and for long copy: documented, intended). 
- **Natural flow**: ≥80em: the production arrangement but an even 6/6 split (featured picture absorbs height differences by cropping, no empty slab); field <60rem at 80em+ (enlarged root text): single column; 48–80em: featured full width + two supporting cards on the Services seam; phones: single column with the existing `card-narrow` crops.
- **Emphasis**: unchanged algorithm from M1 (rest partition, 110 ms intent, 24 px dead band, 180 ms reset, mouse only) **plus the required fixes**: keyboard focus wins (`pointermove` returns early while a card holds `:focus-visible` focus, and queued intent is cleared on focus; policy when focus leaves: rest, then the next pointer movement selects), and mode changes (reduced motion on/off, resize out of/into eligibility, fit change) cancel timers, reset to rest without travel and never replay old intent; focus, if still inside on re-entry, re-applies.

## Services connection in real states
- **Closed, at rest:** peg and note panel start on the Services board's bottom-row shared edge (5fr/7fr desktop, 5.5/6.5 tablet). `--wj-seam` mirrors those values; `work-field.spec.ts` measures the real board against the header at 1440/1024/834 (±1.5 px) so drift fails a test.
- **While a Services tile is emphasised:** the real edge moves (3.5…8.5/12); the header does **not** follow (no per-frame JS, no hard-coded claim). Nothing is hidden or overlapped; the step simply reads as another staircase. Tested (video tile hover: header unchanged, real edge >40 px away, heading/link visible).
- **Detail open (desktop):** the real detail region is the bridge (header follows it in flow, 16 px gap); only the decorative peg is detached (`visibility:hidden`, no layout change); title, note panel and link stay visible and clickable. Escape/Close restore state, focus returns to Explore, the join is back (tested incl. resize 1440→390→1440). **Phone:** the panel is inside the board after its tile (existing behaviour); header follows.
- Deep links `#work`/`#services`, bfcache restore and restored scroll: settled and joined (tested); the Services travel is never forced.

## Verification
(see `runs/`; commands from the app root with `CHROMIUM_PATH` = installed Edge)
- `npx astro check`: 0 errors, 0 warnings (30 pre-existing hints) — `runs/check-final.log`.
- Targeted: `runs/targeted-run1-no-browser-configured.log` (harness failure: no browser configured, kept), run2 (110/44 → the structural failures below), run3–run8 …
- **Full suite, run once after the last code change** (`runs/full-suite-run2.log`, Edge via `CHROMIUM_PATH`, own build on port 4322, default 8 workers on a loaded machine): **662 passed, 2 failed, 7.4 min** (inherited baseline 635 + 29 new tests). Both failures are 45 s *timeouts*, not assertions: `concept-shop.spec.ts:127` (navigation timed out) and `qa.spec.ts:38 › 390px /de/` (a 90-stop Tab loop). In isolation, one worker, they pass (`runs/diagnose-two-timeouts-alone.log`: 2 passed, the qa one takes 24 s alone, so it has no headroom under load). I did not retry-until-green: the failed run is kept as is and I am reporting it as 662/664, not 'all green'.
- Earlier targeted runs on the final code: `targeted-run7.log` 293 passed / 4 failed (hero-playback x2 and the keyboard test were load/timing and a smooth-scroll measurement bug in my test; the hero tests pass alone, `targeted-run8-hero.log` 11 passed).
- Failed/stopped runs preserved: `targeted-run2/3/4/5/7*.log`, `full-suite-run1-STOPPED-before-final-fixes.log` (stopped after ~550 tests; it found the real defects fixed afterwards: peg translated outside narrow viewports (reflow audit), homepage Work card focus ring checked on the anchor, Work geometry active without JS).

### Defects found by tests/inspection and fixed in M2
1. Dock peg translated outside the viewport at 320 px and 200 % text (reflow audit) → scales from its left edge instead.
2. Geometry applied without JS and before measurement (hotel picture cropped) → needs `data-ready`; height measured from content; re-measured on `fonts.ready`.
3. Supporting copy at ≥16 px forced an uneven right column (empty navy slab / crushed ad pictures) → even 6/6 flow split and fit guard.
4. Last card's tags cut by the outer curve → extra bottom padding.
5. Enlarged root text at an 80em+ window kept the wide arrangement and destroyed picture crops → stacks below 60rem field width.
6. Wrong picture variant was avoided by returning to the existing single `<picture>` (tall source at ≥80em) after a duplicate-image attempt hung the existing image-settling helpers.
7. Test-side: smooth-scroll helper measured mid-scroll; hero-hold test reused a same-document page.

## Baselines and methods
- **Baseline** = current source before M2, built from the verified snapshot copy (`M2/baseline-dist`, same production env). The old `dist/` is historical and was not used. Non-homepage Work variants (work index, service page related work): element screenshots before/after byte-identical.
- `SITE_BASE=/` under Git Bash is path-converted to `C:/Program Files/Git/` (broke my first two builds: kept in `baseline-build.log`); builds now run through PowerShell.
- Runtime/asset delta (homepage `/en/`, raw bytes): JS referenced files 8,798 → 8,881; inline controller adds ≈ 4.2 KB to the HTML (89,255 → 93,426); CSS 45,479 → 54,636. No new request, image or font.
- Trace (`trace-integrated-hover.json`, local headless Edge, 3 hover transitions): 152 rAF frames over 2.49 s, median 16.7 ms, p95 16.8 ms, max 17.1 ms; board height constant (771 px) and next section constant (3270.5 px). rAF cadence only: not compositor smoothness, not a field or real-device 60 fps claim.
- **Clips**: Playwright's own `recordVideo` calls ffmpeg with VP9 options; the cached `ffmpeg-1011` (n7.0.1, VP8-only build) rejects them ("Error splitting the argument list: Option not found"). The clips are therefore encoded from the browser's own screencast frames (real-time, timestamped, laid on a 25 fps timeline) with that cached binary, directly: `evidence/video/desktop-1440-en.webm`, `phone-390-en.webm`. I could decode them (frames in `evidence/clipframes/`) and reviewed **sampled stills from them**; I cannot watch playback in real time, so the owner should. Nothing was installed (a scratch copy of the cached binary was only used for the failed native attempt).

## Inspected (images read)
Before/after Services→Process at 1440 EN/ES/DE; Work at 1440/1280/834/390/320 (EN/ES/DE as listed in `evidence/after-*`); geometry rest/hover/keyboard states `geo-*` (EN/ES 1440, DE 1280 = natural flow); root-200 % EN/DE; reduced motion; no JS; Services detail open desktop/phone and after Escape; non-homepage variants; frames from both clips.

## Visual critique and limits
- **Measured on the final build, the shared-edge emphasis is live for English at 1440 only** (EN 1440: yes; ES 1440: no; DE 1280/1440: no): longer ES/DE copy at ≥16 px would force a much taller board than the featured card needs, so the fit guard (threshold 1.2) chooses natural flow there (no empty slab, no clipped text, links and focus ring still work). The ES screenshot that showed geometry earlier predates the curve padding and ≥16 px text. This is the main open design decision: shorten/restructure the supporting copy, widen the threshold (more hotel-picture cropping), or accept English-first emphasis.
- Hotel growth is small (+3–5 %); right-hand trades are the visible part.
- The peg is visible only as a 24 px coral step (and hidden while a detail is open).
- Edge only; Firefox/Safari, real devices, assistive technology untested; ES/DE text not natively reviewed; no field performance.
- Services section still has its own large top padding and the Work→Process gap is the unchanged 128 px (later milestones).
