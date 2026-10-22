# Odalo session handoff

Written 2026-10-21 by the outgoing coder session. This is a handoff only: nothing was implemented, installed, committed, pushed or deployed while writing it. No credentials or environment-variable values are recorded here.

## 1. Exact current position

| Item | State |
|---|---|
| Task 16 (consistent demo enquiry wording, FAQs, service disclosure) | Completed in this session and planner-accepted. Last reported result at the time: 540 tests passed. |
| **Task 17 (final responsive, keyboard and motion QA)** | **Started and completed in this session**. Report: `docs/review/final-ui-qa/README.md`. Result: `astro check` 0 errors / 0 warnings, build ok, normal isolated suite **558 passed** (Edge only). Planner review of Task 17 has not been recorded in this session. |
| Task 18 (bounded performance review + asset register) | **Issued, not started.** The request was interrupted before any action: no `docs/review/performance-final/` folder exists, `scripts/perf.mjs` was not read or run, no measurement was taken, no source was changed for it. |
| Source changes after the Task 17 report | None. After the last full suite run (558 passed) the only edits were the Task 17 README text, then this handoff file and a pointer in `HANDOFF.md`. Evidence from Task 17 therefore covers the current source. |

Task 17 work, for orientation (details in its README):
- Completed: responsive sweep (322 route/viewport combinations, repo `auditInPage` bounds audit, root-font simulation at 200%), real 32 px Edge text-setting check (48 combinations, 0 failing after the fix), keyboard sweep (20 runs), restored-scroll test rewritten with real-geometry expectations (12/12 repeats), regression tests in `tests/qa.spec.ts` (18).
- Source fixes made: `.err` in `AuditForm.astro` changed from flex to grid (German form error overflowed to 376 px at 320 px / real 32 px); focus reveal on form controls (`scrollIntoView({block:'nearest'})`) and a global `scroll-margin-block` rule in `src/styles/global.css`; soft hyphens (U+00AD) in long German words (`ui.ts`, `plans.ts`, `services.ts`).
- Not attempted: Safari/WebKit (the cached WebKit build is older than the installed Playwright expects; launching fails without an install), Firefox (absent), screen readers, physical devices, forced-colours, 400% zoom.

## 2. Workspace

- Application: `C:\Users\basti\source\repos\odalo\odalo`; branch `master`; HEAD `4dde90c Deploy GitHub Pages from master`. 73 entries in `git status` (34 modified/deleted tracked files, the rest untracked). **Everything is uncommitted** (previous sessions never committed; none was authorized).
- **Observed server state (verified 2026-10-21):** **nothing is listening on 4321** (nor on 4322-4326). The earlier report that 4321 (pid 22304) vanished is confirmed; the cause is unknown (most likely the session reset; it was not stopped by this session, which only ever stopped ports 4322, 4324 and 4326 by port). It was not restarted for this handoff. If a dev preview is needed: `npm run dev` (Astro dev, host-exposed, default port 4321) or `npm run preview` (production preview on 4321).
- Background jobs: none owned by this session. Running processes seen are the Playwright MCP server (`npx @playwright/mcp`) and shell wrappers, which belong to the tool environment; they were left alone.
- `dist/` exists (last built during Task 17, current source). `dist-baseline` / `dist-configured` were temporary and are deleted.

### Existing uncommitted state versus this session
At the start of this session the tree already contained (earlier sessions): modified `package.json` (adds devDependency `shadcn`; **not** added by this session), `package-lock.json`, `playwright.config.ts`, About/AuditForm/Faq/FinalCta/Footer/Header/Hero/PlanTable/Plans/PlansMosaic/Process/WorkMosaic components, `projects.ts`, `i18n/index.ts`, `ui.ts`, plans/service/work pages, `global.css`, `tests/identity.spec.ts`, `tests/mosaic.spec.ts`; untracked `inbox/`, `public/work/`, `ConceptImage.astro`, `Wordmark.astro`, review folders for audit-baseline, concept-clinic/hotel/shop (shop later in this session), identity-hero, logo-animation, mosaic-system, pricing-mosaic, responsive-reflow, and tests concept*, helpers, pricing*, reflow.

Added or changed during this session (tasks 07-17): `ServiceMosaic.astro` (tile assembly, then cookie-panel removal), `Hero.astro` (hold protocol), `WorkMosaic.astro`, `About.astro`, `Process.astro`, `FinalCta.astro`, `Footer.astro`, `AuditForm.astro`, `Faq.astro`, `Base.astro` (cookie bar removed), `analytics.ts` (stored choices inert), `faqs.ts`, `plans.ts`, `services.ts`, `projects.ts`, `ui.ts`, `global.css`, `playwright.config.ts` (stored-choice pre-seed removed), `HANDOFF.md`; **deleted** `src/components/CookieBar.astro`; new tests `about`, `closing`, `concept-shop`, `content`, `portfolio`, `process`, `qa`, `services-mosaic`, `services-motion`, `storage` specs and `tests/helpers/services.ts`; public media `public/work/concepts/{shop,services}/`; review folders for every task (below).

Do not reset, stash, clean or run dependency cleanup (one stash/pop mishap happened and was restored immediately; avoid `git stash` on this tree).

## 3. Reading order
1. `HANDOFF.md` (architecture, mosaic notes, outstanding approvals and delivery recipients; it now has a pointer to this file).
2. `PRODUCT.md` (audience, tone, **JavaScript budget 200 KB or less**, progressive enhancement).
3. `README.md`.
4. `docs/review/final-ui-qa/README.md` (latest QA), then the report of the area you touch (table below).
5. Planner files: `C:\Users\basti\OneDrive\Documentos\ChatGPT\odalo\docs\ODALO-PLANNER.md`, `ODALO-CODER-HANDOFF.md`, `ODALO-MOTION-DIRECTION.md`.

## 4. Architecture, configuration, local verification
- Astro 7 static site, TypeScript, vanilla scripts, no framework. Content in `src/content/*.ts` (records with `{es,en,de}`), UI strings in `src/i18n/ui.ts` (es/de must match the en shape; `tr(lang)` selects demo enquiry wording when `PUBLIC_AUDIT_ENDPOINT` is unset via `demoEnquiry`), concept projects/images in `projects.ts`, service imagery via `serviceVisual()` in `services.ts`.
- Configuration: `src/config/site.ts` (`contact` all null, `auditEndpoint` from `PUBLIC_AUDIT_ENDPOINT`, `analyticsEnabled: false`). Delivery is not implemented; the form simulates and sends nothing.
- Supplied 29-piece animation: `src/mosaic/odalo/**` and `public/brand/odalo/**`. **Never edit.** The hero wrapper (`Hero.astro`) owns playback: visitor intent (`userPaused`) versus automatic holds (`odalo:hero-hold` events from the services section).
- Verification workflow (all supported, all Edge): `npx astro check`; `npx astro build`; `npx playwright test` (config builds and serves its **own** preview on port 4322 with `reuseExistingServer:false`, so port 4322 must be free; override with `TEST_PORT`). Tests: `tests/*.spec.ts`; helpers `tests/helpers/reflow.ts` (`auditInPage` bounds audit) and `tests/helpers/services.ts` (`assembleServices`).

## 5. Accepted tasks and evidence
| Task | Evidence folder |
|---|---|
| 01 baseline audit | `docs/review/audit-baseline/` |
| 02-04 header/hero identity, pricing, reflow | `docs/review/identity-hero/`, `logo-animation/`, `pricing-mosaic/`, `responsive-reflow/` |
| 05-07 concepts (hotel, clinic, shop) | `docs/review/concept-hotel/`, `concept-clinic/`, `concept-shop/` (asset registers inside) |
| 08 services imagery | `docs/review/services-mosaic/` |
| 09 motion prototype | `docs/review/motion-prototype/` |
| 10, 10A services motion + hero hold | `docs/review/services-motion-integration/` (and `playback-correction/`) |
| 11 portfolio mosaic | `docs/review/portfolio-mosaic/` |
| 12 demo storage UI | `docs/review/demo-storage-ui/` |
| 13 About mosaic | `docs/review/about-mosaic/` |
| 14, 14A process mosaic | `docs/review/process-mosaic/` (and `correction/`) |
| 15 closing CTA and footer | `docs/review/closing-mosaic/` |
| 16 enquiry wording, FAQs | `docs/review/content-consistency/` (includes `CONTENT-INVENTORY.md`) |
| 17 final QA | `docs/review/final-ui-qa/` |
Earlier mosaic/hero evidence also exists in `docs/review/mosaic*`, `odalo-logo`.

## 6. Latest actual results and conditions
- `astro check`: 0 errors, 0 warnings (102 files) after the final Task 17 change; build ok.
- Normal isolated suite: **558 passed** (Edge, `CHROMIUM_PATH` set, 4 workers, own preview on 4322), 2026-10-21, after the last source change.
- Real browser text setting: 48 combinations, 0 failing (temporary Edge profile with default font 32 px, `docs/review/final-ui-qa/tools/real-text-size.mjs`).
- Conditions: Windows 11, Edge via Playwright (headless), localhost, no GPU measurement. Performance numbers from tasks 09 and 10 are local lab results only, never production.

## 7. Known limitations, unresolved defects, incomplete checks
- Edge only; no Safari, Firefox, screen-reader, physical-device, forced-colours or 400% zoom evidence.
- At 200% root font or a real 32 px setting, long words in large headings still break inside the word at 320/390 px (nothing clipped). Edge here does not hyphenate; soft hyphens were added only to the words the sweep flagged.
- `scripts/perf.mjs` has reporting problems (see section 8, Task 18) and has not been corrected or rerun.
- Production blockers (owner/launch): enquiry delivery to BOTH recipients (below), audit scope/format/response time, approved legal/privacy/cookie text and consent policy, confirmed contact details and business facts, final prices/conditions, translation review, hosting and SEO, final performance review, manual accessibility and device testing.

## 8. Next actions
### Task 18 (issued, not started): bounded performance review and asset register
The planner's brief (to be re-supplied by the planner) is: read `scripts/perf.mjs` and `scripts/browser.mjs` first (45 and 8 lines); fix reporting problems: default port 4321, pre-seeded obsolete `odalo.cookies` choice, decoded body sum labelled as transfer size, calculated gzip versus real encoded transfer, "INP" label for max sampled Event Timing duration (use "sampled lab interaction duration"), and finish response-body collection before reporting. Measure the production build in installed Edge on isolated previews: desktop 1440 and phone 390 (documented network conditions, 4x CPU) on home, plans, audit and the Brindle Pantry case study, at most two cold runs per route/profile (16 loads); LCP and element, CLS contributors, requests and sizes by type with explicit basis, a short home scroll/Explore/playback sequence, user-triggered shop video loading (no initial video download), long tasks. Change code only for measured problems; keep motion, geometry, image quality, reserved dimensions, keyboard/no-JS/reduced-motion behaviour. Consolidate an asset register (path, placements, dimensions, format, size, variants, loading, alt source, provenance, open ownership/font questions; recorded provenance is not legal approval) from `docs/review/concept-*/ASSET-REGISTER.md`, `services-mosaic/` and `public/work/**`. Save under `docs/review/performance-final/`. Run check and build; run the suite once only if application code changes.
Likely files: `scripts/perf.mjs`, `scripts/browser.mjs`, `public/work/concepts/**`, `src/layouts/Base.astro`, `src/styles/global.css`, `src/components/ConceptImage.astro`, `astro.config.mjs`.
### The Task 17 brief (as supplied; completed, kept for the record)
Final responsive, keyboard and motion QA: map routes/templates; 1440/1024/834/390/320 px; enlarged text at 320/390 plus a separate real 32 px setting in EN/ES/DE; real text/control bounds not just scrollWidth; clipping, inaccessible controls and overflow first; improve awkward breaks without truncation, scaling or overflow suppression; skip link, menu, services, pricing comparisons, portfolio, About, form errors/results, footer disclosure; focus order and rings, controls clear of the sticky header, native disclosures, semantics, contrast, reduced motion, no-JavaScript, open states; retain hero Play/Pause intent through automatic holds; services Explore/Escape/focus/deep links/restored scroll/back; add no new motion; use other browser engines only if already available; evidence under `docs/review/final-ui-qa/`; add regression tests only for demonstrated defects or gaps; one normal suite after corrections.

## 9. Windows commands that work
```bash
cd /c/Users/basti/source/repos/odalo/odalo
export CHROMIUM_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"   # Edge for @playwright/test
npx astro check
npx astro build
npx playwright test --reporter=line --workers=4          # builds and serves its own preview on 4322 (must be free)
npx playwright test tests/qa.spec.ts --reporter=list     # one spec
# Edge from a script: chromium.launch({ channel: 'msedge' }); a temporary profile preference webkit.webprefs.default_font_size=32 gives a real 32 px setting
# Task-owned static server for a built folder (stop it afterwards):
node docs/review/services-motion-integration/tools/serve-dist.mjs dist 4322    # then Stop-Process on that port's owner
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4322 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
```
Do not stop 4321. Check ports with `Get-NetTCPConnection -State Listen`.

## 10. Pitfalls
- The Playwright suite starts its own server on 4322: a preview already on 4322 makes it fail ("already used"). Stop yours first.
- Bash heredocs containing apostrophes fail on this machine ("unexpected EOF"); write files with the editor tool or Python patch files. `rm` with globs is blocked; `git stash` is dangerous on this dirty tree (never use it).
- Element screenshots of tall sections on mobile emulation can paint lazy images blank; use full-page clips or true viewport shots. Stitched/section captures show the sticky header over their upper part: use true viewport screenshots for any focus or obstruction claim.
- Chromium reports the first character after a soft-hyphen break on the previous line when measuring Range rects; check hyphenation visually.
- Smooth scrolling (`scroll-behavior: smooth`) means geometry must be read after the scroll settles.
- Never poll for a completion string in a background waiter; bound every command with `timeout`, and do not run repeated measurement campaigns.
- The "planning-with-files: no active planning session" notice is unrelated to application validation: create no dummy files, disable no hooks.
- `docs/review/**` is evidence: delete nothing. `dist/` is a build artifact (last built for Task 17).

## 11. Decisions to preserve
- The planner specifies and reviews; the coder implements one bounded task and stops for review.
- Keep the approved mosaic compositions, palette and typography; keep the supplied 29-piece module unchanged; no new motion without a task.
- Casa Almina, Tidewell and Brindle Pantry are **labelled self-initiated concepts for fictional businesses**: never imply real clients or results; keep produced-versus-proposed distinctions.
- The free audit is an approved offer; its detailed scope, format and response time are **unconfirmed** and must not be promised.
- **Future enquiries must be delivered to BOTH sebastian.appl@sappl-digital.de and bastiappl12@gmail.com.** These are private delivery recipients, not approved public contact details: never publish them in the site. Delivery is not implemented and hosting is not chosen.
- The form says honestly that it simulates a submission and sends nothing. Legal text is draft (`noindex`); analytics is disabled and any stored `odalo.cookies` value is inert.
- Existing tools suffice: install no optional Agent Reach, Exa or social tools, browsers or dependencies; configure no accounts. No deployment, provider, paid service, dependency cleanup, commit or push, and no unrelated redesign is authorized.
