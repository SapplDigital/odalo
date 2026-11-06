# M1 — Services → Work connected-mosaic prototype (isolated)

27 Oct 2026. Private, local, not published (docs/review is untracked and must not be published). Nothing in `src/`, `public/`, `tests/`, config, routes, Services, Work, audit or hero was changed (verified: sha256 of all app source files equals the pre-work snapshot, `git status` outside docs/review identical).

## Run it
```bash
node --disable-warning=ExperimentalWarning docs/review/main-site-mosaic/M1/build.mjs   # regenerates en/de/es.html + generated/base-from-source.css from the app's own source
node docs/review/main-site-mosaic/M1/serve.mjs 4331                                  # task-owned preview, 127.0.0.1 only
```
Open http://127.0.0.1:4331/en.html (or /de.html, /es.html). `/en/` on the same server is the **current production composition from the local `dist/` (built earlier today, not rebuilt)** and its project links are the real case-study pages. Review links sit in the bar at the top of the prototype.

## What it shows
One field spanning the final Services surface, the Work heading and the three real concept projects:
- **Settled Services fixture** (`sf-*`): rest geometry of the production board (7/5 and 5/7 shared edges, row heights as production), real content/images/concept labels, full-service links. No Explore controller, no hero. Its bottom corners are square because the field continues.
- **Connection** (designed, in normal flow, no sticky runway): the Work header is a staircase on the Services seam (41.67 % desktop, 45.83 % tablet). A coral *peg* continues the video tile; a slate *note panel* continues the advertising tile downward (hairline marks the join) and now holds the existing "Three self-initiated concepts…" sentence + "See all work" link, which sat in a slate card at the foot. The heading keeps a calm paper cell. The blank 300 px band between the two sections is gone.
- **One short dock event**: on arrival the peg and then the three cards settle (≤ 450 ms, transform only, content never hidden). Triggered once by a rAF-throttled scroll check, not scroll-linked, no interception. Already-passed content (link, restored scroll, End key) is docked immediately; reduced motion and keyboard focus settle at once.
- **Emphasis (wide desktop only)**: fine-pointer hover or keyboard focus trades shared edges inside a **fixed-height board** (`51.667cqw × 0.625 + 24rem`): featured column 6.2→6.5fr (6.3 below 80rem), clinic/shop rows 1/1 → 1.08/0.92. Pictures: hotel keeps its 16:10 top-anchored crop (+3 % inner scale); supporting pictures keep their own shape (4:5 / 9:16, width follows row height) so ad copy is never side-cropped. Text boxes never scale or move: top card hangs from the board top, bottom card from the board bottom, both from the right edge (measured Δ0,0 for every title in every state).
- Phone/tablet are their own compositions (natural flow, production phone crops `card-narrow`, featured full width on tablet, supporting cards on the Services seam).

## Interaction algorithm (as implemented, not claimed perfect)
`m1.js`: mouse only (`pointerType==='mouse'`); the pointer is resolved against the board's **resting partition** (`--rest-x` 0.51667, `--rest-y` 0.5 read from CSS), never the moving edges; 110 ms intent before a card is emphasised; 24 px dead band around the *rest* boundary of the current card; 180 ms reset on leave; focus (`:focus-visible` only) emphasises immediately and holds while focus is in the board. Touch/pen never select. Geometry exists only where CSS sets `--geo:1`: viewport ≥ 80em, height ≥ 34em, **and** the field ≥ 72rem wide (rem, so enlarged root text drops to natural flow), and JS ignores it under reduced motion.
Each card has exactly **one native link** (title anchor, stretched `::after`); whole-card focus ring via `:has(a:focus-visible)`. No nested controls, no Explore panel, a phone tap is one navigation.

## Files
| File | Role |
|---|---|
| `build.mjs`, `src/*` | generate pages from `src/content/*.ts`, `src/i18n/ui.ts`, `src/styles/global.css` via Node type-stripping + a 12-line resolve hook (no bundler, no dependency) |
| `m1.css`, `m1.js` | the whole prototype (sf-* fixture, wf-* field) |
| `generated/base-from-source.css` | global.css verbatim minus font imports (tokens, buttons, type, corner vocabulary) |
| `serve.mjs` | static preview: M1 → /vendor fonts → app `dist/` → app `public/` |
| `capture.mjs`, `checks.mjs`, `record.mjs`, `compare.mjs` | evidence scripts (Edge via the installed Playwright) |
| `evidence/` | screenshots, `checks-run1..4.log`, `trace-hover.json`, screencast frames |

Asset/copy source map: every picture and string comes from the existing records (`public/work/concepts/**` via `projects.ts`/`services.ts`; strings from `ui.ts`). No new asset, so `docs/ASSET-SOURCES.md` is unaffected. **Copy deltas (proposals):** (1) explainer + "See all work" relocated to the header panel, wording unchanged; (2) each supporting card now also shows its existing `context` sentence (production shows it on the featured card only) — it fills the card and informs; drop it if undesired; (3) the fixture omits Explore buttons.
Geometry deltas vs production: featured/support split 6.2/5.8 (production 7/5), featured top-left corner square (production large curve; the field's curve now sits on the Services web tile and the shop card's bottom-right), supporting pictures use their own aspect (production 4:5 box with cover).

## Results
- `checks.mjs` → `evidence/checks-run4.log`: **135 PASS, 0 FAIL** (earlier runs 1–3 kept; run 1–2 failures were real defects fixed + two test-harness errors, see below). Covers, at 1440×900 and 1280×800 in EN and DE: board/next-section/page height identical across rest + 3 hover states; active card grew; its title stationary (Δ0,0 for all titles in all states); no text clipped in any card in any state; supporting pictures never side-cropped; ±14 px jitter on both rest boundaries → 0 state changes (also with a card already active); slow sweep changes target once; leave → rest. Keyboard: DOM = tab order, each Tab emphasises its card, 3 px whole-card ring, leave → rest. One click navigates once (desktop), one tap navigates once (390, 320). Touch scroll gesture across the board selects nothing. 834/390/320 DE: no overflow, no clipped text. Reduced motion: no geometry change, docked. noJS: all links/text present. Root text 200 % (EN/DE): natural flow, nothing clipped, no overflow.
- Trace (`trace-hover.json`, local headless Edge, 60 Hz display): 93 rAF frames over a hover transition, median 16.7 ms, max 17.1 ms, board height constant 818 px. It is a local layout-animated-grid trace, not a production/field/60 fps claim.
- Not run: the 635-test app suite (isolated prototype; app source byte-identical).

## What I actually looked at
Personally inspected (images read): 1440 full + rest + 3 hover states; 1280 hover hotel/clinic/shop; 1440 DE; 1440 short (600 px); 834 EN; 390 DE/EN; 320 DE; 200 % text EN and DE; no-JS; before/after comparison; sampled scroll frames (`seq-scroll-14/20`). **Playback:** ffmpeg is not installed (installing is out of scope), so no video files. I captured real-time CDP screencast frames (`evidence/screencast-desktop` 386 frames/12.2 s natural wheel scroll → hover → Tab; `screencast-phone` 97 frames/21.3 s native touch scrolling → tap) and reviewed **sampled stills only**; I did not watch the motion in real time. The dock transition and edge animation are therefore verified by trace and sampled frames, not by eye at speed.

## Material problems found and corrected in this milestone
1. The first connection was invisible (same-colour strips merged into the board) → peg + slate note panel staircase on the seam.
2. Emphasis cropped the supporting ad creatives' headlines ("Back. Knees." → "ack. Knees.") and scaled them → aspect-locked pictures, no scale, right/top/bottom anchored text.
3. Fixed-height board clipped text when root text was enlarged (media queries ignore a root font-size override) → geometry gated by a rem-based container query, natural flow otherwise.
Also fixed: dock never firing when the section is jumped over (IntersectionObserver) → scroll check; wrong picture variant in flow mode → picture chosen by layout, not viewport.

## Self-critique / limits
- The coral peg is only distinguishable while docking (same colour as the video tile); the continuity reads mainly through the slate panel and the aligned seams.
- Shop card body is bottom-anchored (to keep text stationary), leaving an empty coral top-right; centring would move text ±15 px. Decision for the planner.
- Hotel growth is subtle (+3–5 % width) by design (the support pictures cannot shrink without cropping ad copy); row trades on the right are more visible.
- Edge only; Firefox/Safari untested (`:has`, container queries, `cqw`, grid-track transitions need a check there); no real device; no screen-reader testing; ES only generated, not inspected.
- Geometry animation is layout-based (grid tracks), as in production Services.
- `dist/` used for the "before" is not guaranteed identical to the current source.

## Integration notes for M2 (not done)
- Services detail region opens **between** the sections on desktop: the peg/note panel live in the Work header (normal flow) so the field simply moves down; while the panel is open the colour continuation no longer touches the board, so integration should either hide peg/note colour while `#services` has an open detail or treat the panel as the connector. On phones the panel sits inside the board (no conflict). Never overlay the panel; keep focus return to Explore.
- Real Services tiles dock on scroll: the Work dock is independent and shorter; the hero-hold event is not needed (hero is off screen at that scroll position) but could be sent with source `work` if the dock overlaps the hero on tall windows.
- Strings need ES/DE/EN review (context sentences already exist in all three); the shared-edge pattern could later be extracted once the design is accepted (not now).
