# Odalo baseline audit (checklist 04 + 05, with inputs for 06, 07, 14, 15, 16, 19)

Date: 16 Oct 2026. Audit only: no application code changed, no packages installed, nothing deployed, no message sent.
Screenshots: `docs/review/audit-baseline/` (see section 5). Scripts used: `crawl.mjs` (in that folder); interaction scripts were run from the session scratchpad (not saved in the repo; ask if you want them kept).

## 1. Application, repository, tools

| Item | Finding |
|---|---|
| App path | `C:\Users\basti\source\repos\odalo\odalo` (confirmed: PID on port 4321 runs `astro dev --host` from `node_modules\astro` in this folder) |
| Planning workspace | `C:\Users\basti\OneDrive\Documentos\ChatGPT\odalo`: specs/assets only, no app. Its docs say "implement in" that folder (doc 07/08): **wrong for the real repo** (see conflicts). |
| Stack | Astro 7 static, TypeScript 6, no UI framework, self-hosted Outfit + Instrument Serif, Playwright + axe tests. Tailwind/shadcn/React **not used** (differs from the global default stack; the project's own choice, stay with it). |
| Instructions | `HANDOFF.md` (architecture, editing, checks), `PRODUCT.md`, `README.md`. No `CLAUDE.md`/`AGENTS.md` in the repo. |
| Git | branch `master` (HEAD `4dde90c`), clean except: `package.json`/`package-lock.json` modified (adds `shadcn` devDependency, +3,900 lock lines), untracked `inbox/` (supplied export, byte-identical to `src/mosaic/odalo/` and to the planning copy: md5 match on data, mjs, css, validation), untracked `docs/review/logo-animation/`, `docs/review/mosaic-system/`. Default remote HEAD is `claude/stoic-faraday-9thz8d`, not master. |
| Deployment | GitHub Pages workflow builds with `PUBLIC_NOINDEX=true`, **no `PUBLIC_AUDIT_ENDPOINT`**. |
| Tools present | Built-in browser pane, Playwright MCP, Chrome DevTools MCP (has Lighthouse + performance trace), Claude-in-Chrome, repo's `@playwright/test` + axe, Edge 154 (used for this audit), Playwright WebKit build in `%LOCALAPPDATA%\ms-playwright`. Skills: impeccable, design-taste-frontend, playwright-cli, browser-testing-with-devtools, motion (+ motion MCP), frontend-ui-engineering. |
| Tools missing/failed | shadcn MCP timed out (connect), aseprite MCP closed, godot-docs closed (irrelevant here). Not installed: Vercel `web-design-guidelines`, Firefox for Playwright, a real-device/BrowserStack path, screen reader. |
| Recommendations (not installed) | (1) Nothing more for browser testing: Playwright MCP + DevTools Lighthouse already cover it. (2) Add Playwright Firefox when cross-browser matters (`npx playwright install firefox`); WebKit already present. (3) Optional: Vercel web-design-guidelines skill for review. (4) Fix `playwright.config.ts`: it only knows Linux Chromium paths; on this Windows machine `npm test` needs `CHROMIUM_PATH` (Edge) or `npx playwright install chromium`. **`npm run verify` was NOT run** (it would build). |

## 2. Findings, ordered by impact

Severity: **Blocker** = cannot launch; **High** = harms the brief's main goals; **Medium**; **Low**. "Fact" = observed; "Assumption" = inferred.

| # | Sev | Finding | URL / section | Source | Action |
|---|---|---|---|---|---|
| F1 | Blocker | **Enquiry cannot be delivered.** No endpoint configured; submit runs `simulated` (700 ms delay, no network request, verified: zero non-GET requests; page says "nothing was sent and nobody has received your request"). Honest, but the primary conversion is dead. No `.env*` in repo; Pages workflow sets none. | `/{en,es,de}/audit/`, all "Request audit" CTAs | `src/config/site.ts`, `src/lib/submit.ts`, `src/components/AuditForm.astro`, `.github/workflows/pages.yml` | Owner picks destination (D3), then connect (checklist 23). Success only on 2xx already coded. Needs spam protection + fallback contact. |
| F2 | Blocker | **No real contact details anywhere**: email/phone/address `null`; footer shows "To be confirmed", final CTA and audit alt say "will be added". | footer + final CTA on every page, audit | `src/config/site.ts`, `Footer.astro`, `FinalCta.astro` | Owner input D2. |
| F3 | Blocker | **Legal pages are draft placeholders** (`noindex`, every section "Content pending approval"). Audit checkbox reads "privacy notice (draft placeholder)". Not in sitemap, no hreflang alternates (fact: `alts: []`). | `/{lang}/privacy|cookies|legal/`, audit form | `src/pages/[lang]/[legal].astro`, `src/i18n/ui.ts` (legal, audit.consent) | Owner supplies text D4; until then they are correctly labelled. |
| F4 | High | **Imagery is 100% generic vector art; zero `<img>` elements on any of 48 routes** (fact, crawl). The same four glyphs (browser, pin, video, chart) recur in hero, service tiles, work panels, service pages and case studies; case studies show one repeated illustration. Work "proof" shows no deliverables. | home hero/services/work, `/work/`, `/work/sample-*/`, `/services/*/` | `src/components/Art.astro` (used by Hero, ServiceMosaic, WorkMosaic, About, services & project pages), `src/content/projects.ts` (`art`, `tone`) | Replace with real or clearly-labelled concept imagery (D1); see section 6. |
| F5 | High | **Sample work is fictional** (hotel, physio, food shop) but labelled "Sample project · illustrative" consistently incl. titles/metadata (good). No outcomes. Risk is only that the page reads as a portfolio. | `/work/`, `/work/sample-*/`, home Work | `src/content/projects.ts` | Keep labels; replace when real projects exist (D1). |
| F6 | High | **Header logo is unreadable as a name for ~74% of the cycle** (derived from supplied timings: word at rest 5×1.8 s = 9 s of a 35 s loop; 10 transitions × 1.9 s = 19 s; shapes 7 s). Screenshots show mid-transition tangles at 1440 (`1440-work-full.png`, `1440-home-about.png`) and 834. Header box is 190×57 px, so the word is small even at rest. Pause control exists, works (verified frozen after click) and is hidden under reduced motion. | all pages, header | `src/components/Logo.astro`, `Header.astro`, `src/mosaic/odalo/*` | See section 7. |
| F7 | High | **Pricing is not "connected"**: panels have gutters and independent rounded corners, unlike the gapless services mosaic. Base/Local share a visual weight; 360 spans full width (good); the comparison table is separate (good). Mobile: table scrolls horizontally and shows only Base + part of Local at 390 px; 360 and Captación columns hidden until scrolled. Plan-level "Example prices" pill repeated 4× plus heading pill (noise). | `/{lang}/plans/`, home `#plans` | `src/components/PlansMosaic.astro`, `PlanTable.astro`, `Plans.astro` | Section 6.2. |
| F8 | High | **Unconfirmed commercial claims** presented as fact: "a fixed price… with no small print", "Monthly report… calls, bookings and sales you can understand, shared every month", "measurement set up from day one", "One recording session per month" (location/travel unknown, worldwide positioning), "SEO in 2–3 languages", "Regular reporting", "remote-first studio" (identity claim), FAQ "Usually, yes" etc. Prices/tax flagged "to be confirmed" (good). FAQ already says change/cancellation not defined. | home Process/About/Plans, `/services/*`, `/about/`, FAQ | `src/i18n/ui.ts` (process.steps, about.*), `src/content/{plans,services,faqs}.ts` | Owner D4/D5; soften or confirm. |
| F9 | Medium | **Instruction/layout copy shown to visitors**: services intro "Hover, focus or tap a piece to see how it connects"; work page "shown as connected pieces"; about image caption "Studio photography placeholder"; case study "Geometric placeholder artwork. Project photography replaces this…" (imageryNote). | home Services, `/work/`, About, case studies | `ui.ts` (services.intro, work.h2, about.imageNote, work.imageryNote) in en/es/de | Rewrite as visitor benefit; hide placeholder captions from visitors (keep in dev notes). |
| F10 | Medium | **First-visit cookie panel**: at 390 px it covers ~1/3 of the hero and the mosaic start; offers "Allow analytics (inactive in demo)" while saying no analytics loads. Choice stored in `localStorage` only. Copy is honest but the second button is meaningless. | `390-cookie-first-visit.png` | `src/components/CookieBar.astro`, `ui.ts` cookies | Until analytics is approved: single dismissible "OK" notice (or none: only language/choice in localStorage); decision D4. |
| F11 | Medium | **Marketing opt-in checkbox** exists with no marketing system; purpose unconfirmed. | audit form | `AuditForm.astro` | Remove until D4. |
| F12 | Medium | **Services tiles**: large dead space; art is a small 130 px glyph; heading/body baseline differs between neighbouring tiles at 834 px (e.g. tile 1 heading lower than tile 2). Four service pages share one template. | home services at 1440/834 | `ServiceMosaic.astro`, `src/content/services.ts` | Section 6.1. |
| F13 | Medium | **Spec conflicts** (section 8). | docs | docs | Resolve D6. |
| F14 | Low | Only German "Launch" step title equals English; ES/DE UI strings otherwise translated (233 keys each, identical-to-English strings are legitimate: Name, Video, Website, Cookies). All ES/DE are drafts; "du" tone unconfirmed. | all `/es/` `/de/` | `ui.ts`, content files | Native review. |
| F15 | Low | Uncommitted `shadcn` devDependency (+3,900 lock lines) is unused by the Astro site (no components.json). | repo | `package.json` | Commit or revert deliberately; do not mix into a design commit. |
| F16 | Low | 404 correctly noindex, English-only text with links to all three languages (by design); legal pages have no hreflang. | `/404.html`, legal | `404.astro`, `[legal].astro` | Optional. |

Not found (good): no broken internal link (81 distinct internal hrefs, all 200), one `h1` on all 48 routes, correct `<html lang>`, titles/descriptions/canonical/hreflang/x-default on indexable pages, no horizontal overflow, no console errors other than the intended 404 on the 404 page.

## 3. Route inventory (all loaded in Edge, status 200 unless noted)

`/` (client redirect to stored/browser language; fell to `/de/` here because the browser language was German; English fallback otherwise) and `/404.html`, any unknown path -> 404.

Per language `es`, `en`, `de` (15 routes each = 45):
`/{l}/`, `/{l}/plans/`, `/{l}/work/`, `/{l}/about/`, `/{l}/audit/`, `/{l}/services/{web|local|video|ads}/`, `/{l}/work/{sample-hotel|sample-clinic|sample-shop}/`, `/{l}/{privacy|cookies|legal}/` (noindex, excluded from sitemap). Sitemap: 36 URLs. Query preselection: `/audit/?plan={base|local|captacion|360}`, `?service={web|local|video|ads}`.
Sources: `src/pages/**` (8 templates), content in `src/content/*.ts`, copy in `src/i18n/ui.ts`.

## 4. Asset inventory

| Asset | Location | Used by | Status |
|---|---|---|---|
| Supplied 29-piece animation (data, mjs, css, validation) | `src/mosaic/odalo/` (= `inbox/odalo-web-export/` = planning `assets/odalo-web-export/`) | `Logo.astro` in header (animated), footer and 404 (static word) | Identical to supplied (md5). Viewbox 1000x606. |
| Static SVG of the six states | `public/brand/odalo/{word,fish,bird,sailboat,fox,hexagon,word-on-dark}.svg` | OG image, favicon (hexagon) | Generated by `scripts/make-odalo-assets.mjs` |
| Older 3x3 symbol + horizontal logos | `public/brand/odalo-*.svg`, `legacy/`, `logo/` | Not referenced by the pages (superseded) | Cleanup candidate |
| Superseded 14-tile engine | `src/mosaic/{engine,logo*,palette}.js`, `scripts/mosaic-*.mjs` | Unused (HANDOFF) | Delete when approved |
| Geometric art | `src/components/Art.astro` variants: hero-web, hero-video, browser, pin, video, chart, studio | Hero (2), service tiles (4), work panels (3), About (1), service pages (4), case studies (3) | Placeholder |
| OG image | `public/og.png` | all pages | From word.svg; not a designed share image |
| Fonts | `@fontsource-variable/outfit`, `@fontsource/instrument-serif` | global | Provisional, self-hosted |
| Photography / video | none | n/a | Missing |

## 5. Screenshots

All in `docs/review/audit-baseline/`; prefix = width. Full-page: `{1440,834,390,320}-{home,plans,work,about,audit,service-web,case-hotel}-full.png`. Home sections: `{1440,834,390}-home-{services,plans,process,about,heroheadermainfirstchild}.png`. First-visit cookie panel: `1440-cookie-first-visit.png`, `390-cookie-first-visit.png`. Mobile menu: `390-mobile-nav-open.png`. Services states: `1440-services-hover-{1..4}.png`, `1440-services-details-open.png`, `1440-services-keyboard-focus.png`, `390-services-details-open.png`. Other: `1440-reduced-motion-home.png`, `1440-audit-simulated-result.png`, `1280-de-text200.png`, `{1440,390}-home-{es,de}-full.png`. (Sticky header appears mid-image in element screenshots; that is a capture artefact, not a layout defect. Full-page shots were taken after scroll-settling with smooth-scroll disabled.)
Existing earlier review set (not mine): `docs/review/*.png`.

## 6. Checks performed and results

| Check | Result |
|---|---|
| 48 routes load, titles/h1/lang/canonical/hreflang, 81 internal links | pass (see above) |
| Viewports 1440 / 834 / 390 / 320 for 7 page types; overflow measured at load | 0 px overflow on all 48 routes at the crawl default viewport (1280 px, not 1440); 320 captured, visually checked on home/plans only (pricing table is an intentional scroll region) |
| Services hover geometry (1440, page tall enough for all tiles) | rest 784/560 top, 560/784 bottom, rows 432 px. Active tile 952 px = 70.8 % of row (8.5/12), neighbour 392 px; rows 501/363 px. **All four tiles verified.** Page height delta 0 px (no layout shift below). Matches HANDOFF; differs from doc 03's 8/4 and 7/5 table. |
| Explore / details | opens shared region below mosaic, `aria-expanded=true`; Esc closes and returns focus to the Explore button |
| Keyboard order | Explore -> Full service link per tile, A-D order, logical |
| Touch (390, emulated) | tap on Explore opens details, tile geometry unchanged, target 120x44 px |
| Reduced motion | pause button and animation hidden; tile width unchanged 150 ms after hover (0 px) |
| Logo pause | animates (DOM changes in 2.2 s), frozen after pause click |
| Language switching | `/en/services/ads/` -> `/de/services/ads/`; case study and legal pages keep equivalent route; choice stored (`odalo.lang`). (My first ES click hit "Services" by substring: test error, re-run with exact links.) |
| Plan preselect | Base, Local, Captación, 360 -> `?plan=` + `#f-plan` value correct; `?service=ads` preselects service |
| Form | validation not re-tested; simulated submit confirmed, no network write; checkboxes: `privacy` (required), `marketing` |
| 200 % text (DE, 1280) | 0 px horizontal overflow; screenshot captured, not read closely |

**Not tested:** `npm run verify` / Playwright suite (config lacks Windows browser path), real delivery (no endpoint, by design), Firefox/Safari, physical touch devices, screen readers, Lighthouse/field performance, form error states in ES/DE, all six logo states' pixel geometry (relied on identical md5 + `validation.json`), 320 px on every route, print, JS-disabled rendering, long-session logo cleanup, hover geometry at 834 (not measured, tablet uses reduced travel by HANDOFF).

## 7. Enquiry delivery configuration (no secrets exposed)

`site.auditEndpoint = import.meta.env.PUBLIC_AUDIT_ENDPOINT || null` (client-exposed `PUBLIC_` variable, so any provider URL will be public: use a provider/function that rate-limits and validates). Unset today. Behaviour: null -> **simulated** (UI says so; never counted as submission). Set -> POST JSON (`AuditPayload` incl. name, email, phone, free text); "received" only for HTTP 2xx; failure keeps entries with retry; double-click guard. Gaps for real delivery: spam protection, privacy text, fallback contact, no timeout/abort wired in submit, no idempotency key (duplicate-on-retry possible).

## 8. Mosaic assessment

**Two different systems; do not merge their rules.**
- Header logo = supplied **rigid-piece animation**: 29 polygons, fixed ids/points/colours/common scale; only translation + rotation; pieces cross during transit; arrangements tile exactly at rest. Sequence word, fish, word, bird, word, sailboat, word, fox, word, hexagon. (Palette is richer than the site palette: green, yellow, blue, pink; keep.)
- Service tiles = **shared-edge resizing** of a gapless rectangular grid (grid-template tracks animate, text never scaled, only the outer silhouette is curved, hysteresis ±28 px, 120 ms intent, 180 ms reset, mouse only).

### 8.1 Services (build on current)
Keep the gapless grid and expansion behaviour. Improve content, not mechanics: (a) replace the 130 px glyph with a large cropped image/illustration that occupies the tile's free half; (b) align heading/body baselines across a row (fix tile text anchoring so rows read straight); (c) add one concrete deliverable line per tile (from `services.ts`); (d) remove the hover instruction sentence.

```
Desktop 1440 (rest, 12 col)                    Mobile 390
+--------------------------+-----------+       +-------------------+
| 01 Websites   [image     |02 Local   |       | 01 Websites       |
|  big crop, right 40 %]   |  [image]  |       | [wide image 16:9] |
| outcome + 1 deliverable  |           |       | text, Explore,link|
| Explore  Full page       |           |       +-------------------+
+-------------+------------+-----------+       | 02 Local  (flip   |
|03 Video     | 04 Ads                 |       |  corner/colour)   |
| [image]     | [image]                |       +-------------------+
+-------------+------------------------+       | 03 / 04 same      |
 (hover/focus: shared edge moves 7/5 -> 8.5/3.5; page height fixed)
```
Image needs: 4 images, ~1200x800 (tile max 952x501 @1x; deliver 2x = 1900 px wide, WebP/AVIF + JPEG), safe area on the left 55 % for text if overlaid, otherwise keep text panel solid. Real work screens / production stills only; else labelled concept renders. `alt` text per language, no baked-in text.

### 8.2 Pricing (build on unequal layout)
Make the four plans one connected surface like the services: remove inter-panel gutters inside the group, keep unequal widths (Base narrow, Local mid, Captación wide navy, 360 full-width beneath), use shared edges and alternate outer-corner curves only on the group's silhouette. Same internal slots in each panel (name / price / 3 key inclusions / CTA at the bottom) so rows align; show "Example prices" once per section, not per panel. No hover resizing. Mobile: stack Base, Local, Captación, 360 as one joined column; comparison table becomes per-plan stacked lists or a 2-column feature table with a plan picker rather than a horizontal scroll.
```
Desktop                                   Mobile
+------+-------------+-----------------+  +-----------+
| Base | Local       | CAPTACION (navy)|  | Base      |
| name | name        | badge name      |  +-----------+
| €59  | €290        | €590            |  | Local     |
| 3 pts| 4 pts       | 5 pts           |  +-----------+
| [CTA]| [CTA]       | [CTA]           |  | Captación |
+------+-------------+-----------------+  +-----------+
| 360   €1,290   (full width, 2-col list)|  | 360       |
+----------------------------------------+  +-----------+
        Compare plans (separate table)       Compare (stacked)
```
No new imagery required (optional: small plan glyphs reusing logo shapes).

### 8.3 Portfolio
One large project + two crops + one context panel exists. Add: a real screen capture or production still in the large panel; two supporting crops showing different deliverable types (a page, a reel frame, a campaign); a text panel with context. Never stock. Requirements: large 1500x1000 @2x, crops 800x800, `sample` label kept until verified; permission record per image (checklist 08/09).
```
+-----------------------+---------+
| LARGE: real screen /  | crop A  |
| still (project 1)     +---------+
| title, services, link | crop B  |
+-----------+-----------+---------+
| context text panel (navy)       |
+---------------------------------+
```

### 8.4 Stable name in header + artwork elsewhere
Recommended. Facts: word is at rest 26 % of the loop; header box 190x57; pause control needed (WCAG 2.2.2) today because it auto-moves in a persistent area. Proposal: header shows the stable wordmark (use `public/brand/odalo/word.svg` or the module resting on `word`, `autoplay:false`); show the full transforming animation in a generous spot (hero visual slot or a dedicated band near the final CTA, width ~480-720 px desktop, full-width ~300 px mobile) using the same unmodified module (`mount(el,{autoplay:true})`). Then the pause button moves with the animation. The mosaic module already pauses off-screen/hidden and rests with reduced motion. Geometry, colours, sequence untouched. Caveat: the animation's palette (green/yellow/pink) will sit against the navy/coral site; set `--odalo-gap` to the surface colour; decide D6.

Image requirements for the hero swap: no raster needed; module SVG scales (1000:606). Reserve aspect-ratio 1000/606 to avoid layout shift.

## 9. Conflicting specifications

1. Gutters: doc 01 says mosaic gutters 12-16 px; doc 08 says gapless shared edges. Code: services gapless, pricing/work/hero have gaps. Proposed (planner): gapless inside interactive/connected groups, gaps between unrelated sections; decide for pricing/work (D6).
2. Doc 03 service ratios (7/5, 8/4, B 5/7...) vs code (8.5/3.5, row heights 1.16/0.84): intentional (HANDOFF), keep, update doc.
3. Doc 03 desktop height ~560 px vs code ~864 px (rows 25 rem; HANDOFF 816 px at 1280): allowed by "more when content requires".
4. Docs 07/08 name the planning folder as the implementation workspace and `C:\Vault\Projects\odalo\Website Design` as source; app really lives in `source\repos\odalo\odalo`. `docs/design/` copy contains docs 00-07 only (08 missing), plus `Website Design/References` is empty in both places (reference PNGs not available locally).
5. Doc 01 "logo stable, decorative shapes animate" vs doc 08 / current header (animated logo). Resolved by 8.4.
6. Doc 02 header "logo left": fine; doc 04 minimum nav collapse 64 em vs code 70 em (deliberate).
7. Brief colours "provisional" vs supplied 29-piece palette (extra green/yellow/pink): keep supplied, owner to approve broader palette.
8. Global CLAUDE.md default stack (React/Tailwind/shadcn) vs project (Astro, hand CSS): project wins; stray `shadcn` dependency suggests drift.
9. Planner says the preview "may not be this directory": confirmed it is.

## 10. Likely source files for the next task

Header/logo: `src/components/Logo.astro`, `Header.astro`, `Hero.astro` (+ `src/styles/global.css` tokens), `src/mosaic/odalo/*` (do **not** edit), `tests/identity.spec.ts` (header-at-four-widths and pause tests will change), `scripts/make-odalo-assets.mjs`.
Services: `ServiceMosaic.astro`, `src/content/services.ts`, `tests/mosaic.spec.ts`.
Pricing: `PlansMosaic.astro`, `PlanTable.astro`, `Plans.astro`, `src/content/plans.ts`.
Work: `WorkMosaic.astro`, `src/content/projects.ts`, `Art.astro`, `src/pages/[lang]/work/**`.
Copy: `src/i18n/ui.ts`. Delivery: `src/lib/submit.ts`, `src/config/site.ts`, `AuditForm.astro`, `.github/workflows/pages.yml`. Cookie: `CookieBar.astro`.

## 11. Business decisions needed

- D1 Real projects + permission to show them; photography/video available? Otherwise approve labelled concept imagery.
- D2 Business identity, contact email/phone/address, team facts/portraits ("remote-first studio" claim).
- D3 Enquiry destination (email inbox vs form service vs CRM) and what happens next; any response-time promise (none now).
- D4 Privacy/cookie/legal text; whether marketing consent and analytics are wanted at all.
- D5 Prices, setup fees, ad-spend wording, tax wording, cancellation, ownership, revisions, recording location/travel, multilingual scope; whether "no small print" and monthly report claims stand.
- D6 Design precedence: gapless vs gutters per section; keep supplied 29-piece palette beside site palette; stable header wordmark; where the animation lives.
- D7 German tone (du/Sie) and native review of ES/DE.

## 12. Recommended smallest first implementation task

**Task 06-A: stable header name + relocated animation.** Highest visible impact, smallest blast radius, resolves the logo/identity conflict (F6, conflict 5) and unblocks later composition decisions; touches no content, no commercial claims, no delivery.

Scope: in `Logo.astro`/`Header.astro` render the header wordmark non-animated (module at rest on `word`, no pause button there); mount the unmodified module with autoplay in one new generously sized hero slot on the homepage only (replace the lower-right "ES EN DE / brand shape" pieces or sit below the hero visual), with its own visible pause control; footer/404 unchanged.

Acceptance criteria:
1. Header shows the readable lowercase "odalo" at 1440/834/390/320, never mid-transition; header height unchanged (88/80/72).
2. `src/mosaic/odalo/*` unchanged (md5 same as `inbox/odalo-web-export`); `odalo-data.json` points/colours/ids/sequence untouched; sequence verified by `statechange` events: word, fish, word, bird, word, sailboat, word, fox, word, hexagon, repeat.
3. Homepage artwork container has `aspect-ratio 1000/606`, no CLS (measured 0), no horizontal overflow at 320 px.
4. Visible, keyboard-operable pause/play (44x44 px, localized en/es/de) next to the artwork; with `prefers-reduced-motion` the artwork rests on the word and no pause control shows.
5. Pauses off-screen/hidden tab (module behaviour) and `destroy()` on navigation; no console errors.
6. Screenshots at 1440/834/390/320 of rest and one mid-transition frame; existing `tests/identity.spec.ts` updated and passing; `astro check` clean.
7. No other page content changed; legal/commercial copy untouched.

After that, suggested order: services imagery + baseline alignment (14), pricing joined composition + mobile comparison (15), cookie/consent simplification (25, after D4), delivery (23, after D3).

Suggested commit for this audit: `Add baseline audit report and screenshots (docs/review/audit-baseline)`
