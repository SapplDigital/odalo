# Task 18: bounded performance review and asset register

Branch `feature/mosaic-redesign` (merged with the legal commit `f45dc11`). **Lab measurements only.** Nothing here is production INP, field Core Web Vitals or a production guarantee.

## What was measured, and how
- **Build / server:** production build (`npm run build`), served by its own isolated `astro preview` on `127.0.0.1:4323` (started and stopped for this task; the test suite uses its own server on 4322). The preview server gzips text (`Content-Encoding: gzip` observed); it does not compress fonts or images.
- **Browser:** installed Microsoft Edge (`CHROMIUM_PATH`), Playwright, a **fresh context per load** (cold, no stored state, HTTP cache disabled).
- **Profiles:** Desktop 1440x900, no throttling. Phone 390x844, mobile emulation, **4x CPU slowdown**, network 150 ms RTT / 1.6 Mbit/s down / 750 kbit/s up.
- **Routes (English):** `/en/` (home), `/en/plans/`, `/en/audit/`, `/en/work/sample-shop/` (Brindle Pantry).
- **Runs:** 2 per route/profile = **16 baseline loads**, then the same 16 after the changes. No repeats until a result looked better. Disclosure: three extra single-load smoke runs (desktop, Brindle) were used to debug the script and were discarded.
- **Extra bounded sequences:** home: 4 wheel scrolls, Explore on `web` and `ads`, hero pause + resume. Brindle: user starts the video.
- **Reproduce:** `npm run build`, `npx astro preview --host 127.0.0.1 --port 4323`, then `BASE_URL=http://127.0.0.1:4323 CHROMIUM_PATH=<edge.exe> OUT=<dir> node scripts/perf.mjs` (`ONLY=phone390:brindle` re-measures one condition). Raw per-load JSON (all requests, shifts, long tasks, events): `baseline/`, `after/`. Tables: `comparison.md`.

### Measurement-setup corrections (`scripts/perf.mjs`)
| Problem found | Fix |
|---|---|
| Default port 4321 (collides with a dev server) | Default 4323 via `BASE_URL`; own preview |
| Pre-seeded obsolete `odalo.cookies` choice | Removed; every load is a clean context (the cookie bar no longer exists) |
| "transferKB" was decoded body size | Three separate bases per request: **decoded** (CDP `dataReceived`), **observed encoded** (CDP `encodedDataLength`, includes headers), **calculated** gzip and brotli (identity body compressed locally, text only). Calculated values are not what a host sends |
| Async `response.body()` could race with the report | Sizes now come from CDP events and are post-processed after the page is closed |
| "INP" = max Event Timing duration of a few clicks | Renamed **sampled lab interaction duration** (max over the scripted events; not INP) |
| Only inline-vs-external JS mixed | Initial vs interaction-triggered requests tagged by phase; LCP element/URL, CLS shift sources and long tasks recorded |

## Budgets used (taken from the repo, none invented)
`PRODUCT.md`: **JavaScript ≤ 200 KB.** `HANDOFF.md` (earlier): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, ≤ 1.5 MB. Lab results are compared to these only as a sanity check.

## Baseline results (before changes)
Sizes in KB. "Initial" = until load + 2.5 s. Full before/after table with both runs: `comparison.md`.

| Profile | Route | LCP ms (2 runs) | LCP element | CLS | Initial req | Decoded | Encoded (observed) | JS raw / calc. gzip | Interaction-triggered |
|---|---|---|---|---|---|---|---|---|---|
| Desktop | home | 272 / 88 | h1 (hero heading) | 0 | 18 | 373.7 | 257.4 | 19.1 / 7.3 | 2 req, 48 KB (lazy images after scroll) |
| Desktop | plans | 80 / 92 | h1 | 0 | 10 | 153.2 | 86.1 | 10.8 / 3.9 | none |
| Desktop | audit | 124 / 64 | h1 | 0 | 11 | 127.6 | 85.9 | 15.1 / 5.8 | none |
| Desktop | Brindle | 108 / 136 | image `shop-card-wide-960` | 0 | 13 | 226.6 | 186.6 | 10.8 / 3.9 | 2 req, 812 KB (lazy image + WebM on play) |
| Phone | home | 1256 / 1336 | h1 | 0 | 16 | 247.7 | 130.8 | 19.1 / 7.3 | 4 req, 89 KB |
| Phone | plans | 1112 / 1048 | note paragraph | 0 | 10 | 153.2 | 86.1 | 10.8 / 3.9 | none |
| Phone | audit | 980 / 944 | lead paragraph | 0 | 11 | 127.6 | 85.9 | 15.1 / 5.8 | none |
| Phone | Brindle | 1416 / 1448 | image `shop-card-wide-640` | 0 | 13 | 199.7 | 159.8 | 10.8 / 3.9 | 2 req, 775 KB |

Other baseline facts (raw files):
- **CLS 0** in every load, including after the home scroll/Explore/pause sequence (no shift sources recorded).
- **JavaScript**: initial JS is 10.8 to 19.1 KB raw (home highest: hero script, services mosaic script, logo script, 9.5 KB odalo-mosaic module, plus ~0.8 KB inline) = about 10 % of the 200 KB budget. Brotli (calculated) is lower still.
- **Fonts** 65 KB decoded in 3 requests (see change 1). **CSS** 5 files on home (45 KB raw, 12 KB observed gzip). **HTML** home 90 KB raw / 14 KB gzip (inline SVG).
- **Long tasks:** at most one per load. Desktop ≤ 66 ms; phone (4x CPU) 76 to 202 ms, at load around the first paint. Not investigated further: nothing nearly at a budget and no single script identified as the cause.
- **Sampled lab interaction duration** (home sequence): desktop 32 ms, phone 56 to 72 ms (max of Event Timing durations of scripted pointer/click events). Not INP.
- **Media:** **no video request during initial load** on Brindle (both profiles). A real click on the native `<video controls>` in headless Edge did not start playback, so the script then sends Space to the focused video (also a user gesture). That produced one **206 range request for the WebM, 759,420 B** (decoded 759 KB, observed 759.8 KB), only after the user action; the MP4 was not requested (Edge picked WebM). The poster is the only initial image for the video.
- **Images:** all concept images are WebP with `srcset`, intrinsic width/height and `loading="lazy"`; the phone profile receives the 390/540/640 px variants, desktop the 960 to 1080 px ones.

## Changes (measured, minimal)
1. **`src/styles/global.css`: Instrument Serif italic faces.** The previous code imported the two Fontsource *subset* stylesheets (`latin-400-italic.css`, `latin-ext-400-italic.css`), which carry **no `unicode-range`**. Both faces therefore matched every character and the 12 KB latin-ext file was fetched, un-preloaded, on **every page** although no text needs it. Now one import of `@fontsource/instrument-serif/400-italic.css`, which includes the Google-style `unicode-range` for each subset. Result: **-1 request, -12.1 KB decoded font (12,384 B), about -12.4 KB observed on every route and both profiles** (e.g. home page total 373.7 → 362.0 KB decoded, 257.4 → 245.0 KB encoded; plans 153.2 → 141.5 KB). The preloaded latin file is unchanged; CLS stays 0.
2. **`src/pages/[lang]/work/[project]/index.astro`: case-study lead image `eager`.** In the baseline the LCP element on Brindle was the lead image, which carried `loading="lazy"`. Making it eager removes an avoidable lazy-load delay. **Effect on timing is not demonstrated:** phone Brindle LCP was 1416/1448 ms before and 1072/1832 ms after; with two runs the spread between identical runs (e.g. phone audit 1000 vs 1568 ms, with no change to that page except the font) is larger than any difference. This change is justified structurally, not by these numbers.

**Not changed (and why):** JS (about 10 % of budget), CSS, HTML size, image formats/sizes (already responsive WebP, lazy, reserved boxes), animation code and geometry, the video (already `preload="none"`). The home phone LCP/long-task numbers after the change (1420/1388 ms; long tasks 195/226 ms vs 124/183 before) differ from the baseline by about the same amount as run-to-run noise elsewhere; I do **not** claim a regression or an improvement from them. Single-process lab runs on a shared desktop are noisy.

## Validation
- `npm run check`: 0 errors, 0 warnings. `npm run build`: 47 pages.
- Full regression suite once after the changes (isolated server, Edge): **567 passed, 1 failed** (`full-suite.txt`). The failure is `services-motion.spec.ts:162` (reload restores scroll position). It also failed once in the run before any Task 18 change, passes when the file runs alone, and fails 3 of 4 when repeated in parallel **with the font change reverted** too. It is a pre-existing timing-sensitive test, not caused by these changes; it is not fixed here.
- No visual change was made (font file used for all current glyphs is the same latin file; lead image only changes when it loads), so no new screenshots were taken. Layout shift remained 0 in all 16 after-loads.

## Hosting-dependent facts (production, not tested locally)
Read-only header check of the live site `odalo.sappl-digital.de` (Netlify) on 2026-10-22:
- Text assets are served **brotli-compressed** (`Content-Encoding: br`), fonts are not compressed.
- Hashed assets such as `/_astro/*.css` and `*.woff2` are served with `Cache-Control: public,max-age=0,must-revalidate`, i.e. **no long-lived caching**: repeat visits revalidate every file. Hashed `/_astro/*` files are safe to cache immutably; a Netlify `_headers` rule (`/_astro/*  Cache-Control: public, max-age=31536000, immutable`) would do it. I did **not** add it: it is hosting configuration and hosting is not decided here. Recommendation for the owner.
- HTTP version, CDN edge behaviour, TLS cost, real latency and caching of repeat views are untested.

## Not tested
Real devices and networks; field data or production INP; Safari/Firefox; the Spanish and German pages' performance (English only); reduced-motion and no-JS load profiles; repeat (warm-cache) loads; the MP4 transfer; long idle behaviour of the hero animation; GitHub Pages hosting; any other route.

## Asset register
`ASSET-REGISTER.md` (generated by `tools/build-register.mjs` from `public/` and the content records; consolidates the concept registers): paths, placements, dimensions/formats/sizes, responsive variants and crops, loading behaviour, alt-text source, recorded provenance, fonts and a list of unresolved ownership/rights/font-approval questions. **Recorded provenance is not an approved usage right**; nothing was approved or licensed here.

## Remaining production and owner blockers
- Hosting/caching decision (immutable asset caching, compression of fonts), form delivery (must reach both private recipients, not implemented), analytics stays off.
- Image/animation/font rights and final font approval; fictional-business name clearance (see register).
- Legal drafts (`docs/legal-open-points.md`): second contact channel, VAT ID, registrations, Netlify DPA and log retention, retention periods, native-language review of es/de.
- The pre-existing flaky motion test.

## Files
`README.md`, `ASSET-REGISTER.md`, `comparison.md`, `baseline/` and `after/` (raw JSON per load + `_summary.json`), `baseline-console.txt`, `after-console.txt`, `full-suite.txt`, `tools/`. Application files changed: `scripts/perf.mjs`, `src/styles/global.css`, `src/pages/[lang]/work/[project]/index.astro`, `HANDOFF.md` (stale performance table replaced by a pointer).
