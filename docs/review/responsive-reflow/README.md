# Task 04: page-level enlarged-text reflow

## Environment
- **Port 4321 before work:** running, `astro dev --host`, pid 22304 (it had been restarted during the previous task after being found stopped). Same process afterwards; not touched.
- **Isolated server:** `astro build` + `astro preview --port 4322` (my own processes, stopped by port after use; the Playwright config starts and stops its own on 4322).

## Remeasured before fixing (root font 200 %, `before-measurements.txt/.json`)
Method: per page/language/width, every visible element box and text fragment compared with the viewport; scroll width recorded.

| Page | Width | Scroll width | Offending sections |
|---|---|---|---|
| /en/ | 320 | 380 | hero, work, FAQ |
| /es/ | 320 | 362 | hero, work, FAQ (not in the earlier list) |
| /de/ | 320 | 495 | hero, work, process, FAQ, final CTA |
| /de/ | 390 | 495 | work, final CTA |
| /en/plans/, /es/plans/ | 320 | 363 | commercial-conditions section |
| /de/plans/ | 320 / 390 | 495 | conditions, final CTA |

Everything at 100 % was clean on these two page types. Smoke pages (service, work, case study, about, audit, legal) showed the same class of overflow, and `/de/privacy/` overflowed even at 100 % (320 px: 393).

## Root causes (one family: nothing was allowed to shrink)
1. **Grid tracks sized by min-content.** Single-column grids were declared `display:grid` without a template (implicit `auto` track) or with `1fr` (= `minmax(auto,1fr)`). A track cannot be narrower than its longest unbreakable word, so one long word at 200 % widened the whole section. `overflow-wrap: break-word` (already on `body`) does not reduce min-content, so it never got to wrap. Affected: hero, work, process, FAQ, final CTA, conditions, page hero, about, audit, services, case study, legal, footer.
2. **Flex children with long words** (`.cond__list li`, FAQ `summary`, `.next__link`, checkbox label): flex items keep their min-content width.
3. **Fixed minimum width:** `.af__actions .btn { min-width: 14rem }` = 448 px at 200 %.
4. **Caption clipped:** the case-study picture had a fixed `aspect-ratio` + `overflow:hidden` + an absolutely positioned caption, so the caption was cut off at large text. Found only because the new audit checks clipping ancestors, not just scrollWidth.
5. **Skip-link overlay:** the hidden skip link was parked at `top:-60px`; at 200 % its text wraps to about 144 px tall and it covered the header's menu button, intercepting clicks (the menu could not be opened).

## Fix (changed files)
- `src/styles/global.css`: zero-specificity `:where(...) { grid-auto-columns: minmax(0,1fr) }` so every implicit single-column grid may shrink; the skip link now hides by `transform: translateY(calc(-100% - 24px))` with a limited max-width, and shows on focus.
- Explicit `1fr` changed to `minmax(0,1fr)` or single-column templates added in: `Hero`, `WorkMosaic`, `Process`, `Faq`, `FinalCta`, `About`, `AuditForm`, `Footer`, `plans/index.astro`, `services/[service]/index.astro`.
- `overflow-wrap: anywhere` on flex children with long words: FAQ `summary`, conditions rows, checkbox label, case-study next link and caption.
- `AuditForm`: `min-width: min(14rem, 100%)`.
- `work/[project]/index.astro`: picture and caption share one grid cell (the cell grows with the caption); desktop (64em and up) keeps the previous absolute layout and 24rem minimum.
- Not changed: copy, offers, disclosures, hero/header/animation, pricing composition, service mosaic behaviour, colours. No `overflow:hidden`/clip added, no text size changed, no scaling.
- New tests: `tests/reflow.spec.ts` (+ `tests/helpers/reflow.ts`).

## The audit (tests/helpers/reflow.ts)
Fails on: document scroll width greater than the viewport; any visible box or control outside the viewport; any visible text fragment outside the viewport **or outside any ancestor that clips it** (horizontal: hidden/clip/auto/scroll; vertical: hidden/clip), so clipping cannot make it pass. SVG art, `.sr-only`, the fixed cookie bar and collapsed-`<details>` contents are skipped. All `<details>` (FAQ answers, plan comparisons) are opened first.

## Checks and results
- `astro check`: 0 errors, 0 warnings. Production build: succeeds (47 pages).
- Full regression suite on the isolated server (Edge), final run: **235 passed, 0 failed** = 105 existing + 130 new, all 130 in `tests/reflow.spec.ts`.
- The 130 new tests: homepage and plans × en/es/de × 320/390 px × 100 %/200 % (24); six other page types (service, work index, case study, about, audit, privacy) × 3 languages × {320/200, 390/200, 320/100} (54); 834 and 1440 px regressions on seven page types × 3 languages (42); mobile menu open at 200 % (6); focus indicators on eight key controls at 320 px / 200 % (1); FAQ answer and all four plan comparisons expanded (1); skip link at 1440/100 % and 320/200 % (2).
- **Broken-state proof:** with this task's CSS changes temporarily reverted (grid templates, `anywhere`, skip link, caption grid, button min-width), the first 128 reflow tests fail **48 of 128** (list in `broken-state-proof.txt`: homepage and plans at 320/200 in all three languages, `/de/` at 390/200, many other-page cases including `/de/privacy/` at 320/100, the menu tests, the focus test and the expanded-controls test). The source was restored byte for byte (compared with a snapshot) and rebuilt afterwards. The 2 skip-link tests were added after that run, so they were not part of it.
- **Real browser text size (not a stylesheet):** `real-text-size.mjs` creates a throw-away Edge profile in the OS temp folder with `default_font_size = 32` (200 % of 16 px), audits 3 languages × 8 page types × 320/390/834/1440 px = 96 combinations with details opened, then deletes the profile. Root font computed 32 px in all 96. **Fixed build: 0 failing** (`real-text-size-results.json`). **Broken state: 40 of 96 failing** (`real-text-size-results-BROKEN-STATE.json`). The user's own browser settings were not touched.
- **Enlargement methods, explicit:** the Playwright tests and the screenshots use a root-font-size simulation (`html{font-size:200%!important}`, which scales rem sizes but does not move the em-based breakpoints). The `real-text-size` run uses the browser setting.

## Screenshots (this folder)
- Before (the pre-fix state, reconstructed by reverting this task's CSS; its measurements match the pre-fix ones above): `before-broken-*.png`. After: `after-*.png` (200 % simulation, 320 px unless noted: en/es/de home sections, de 390 px work and final CTA, plans conditions en/de, audit, case study, service). Normal-size 834/1440 sanity: `after-normal-*.png`.
- Side by side, left = before, right = after: `compare-de-320-hero.png`, `compare-de-320-work.png`, `compare-de-320-process.png`, `compare-de-320-final-cta.png`, `compare-de-plans-320-conditions.png`.
- Tightest layouts (200 %, 320 px): `after-{en,es,de}-home-320-*.png`, `after-de-plans_-320-*.png`.
- Expanded controls and focus: FAQ answers are open in the `after-*-faq.png` shots and all plan comparisons are opened inside the audit; menu-open and focus indicators are asserted by tests (no separate image).

## Remaining defects and limits (exact conditions)
- **Mid-word breaks at the extreme size.** At 320 px width with 200 % root font, long German words and display headings break inside the word without a hyphen. Examples: "Kommerz|ielle Bedingungen" and "Einrichtungsgebü|hren" on `/de/plans/`, "bringe|n" in the `/de/` hero headline, "Unterneh|mens zusamm|enfügen" in the `/de/` final CTA. Nothing is lost or clipped, but it is ugly. The test browser has no hyphenation dictionary. Fixing it needs a design decision (a smaller fluid heading size, or soft hyphens in the content); I deliberately did not shrink text.
- **Orphan full stop:** in the `/de/` hero at 320 px / 200 %, the "." after "Kunden" can sit alone on a line.
- **Pages not in the matrix:** `/{lang}/services/{local,video,ads}/` (ads only at 834/1440), `/{lang}/work/{sample-clinic,sample-shop}/` (shop only at 834/1440), `/{lang}/cookies/`, `/{lang}/legal/`, `/404.html`. They share the fixed components. I did not visually review every page; I looked at the before/after pairs listed above.
- **Browsers:** Edge only; no Firefox/Safari, no physical device, no screen reader. The real-text-size run is one profile.
- **Interaction:** the open mobile menu is checked horizontally; its panel scrolls vertically by design and is not asserted beyond link reachability.
- The 4321 dev server is still the same process (pid 22304); it serves the working tree, so it picked up the changed source.

## Left untouched on purpose
Uncommitted work from earlier tasks (header, hero, pricing, wordmark, tests, the `package.json`/lock `shadcn` dependency), `inbox/`, the older `docs/review` folders and `docs/review/audit-baseline/crawl.mjs`. No imagery, copy or dependency changes; no commit, push or deployment.
