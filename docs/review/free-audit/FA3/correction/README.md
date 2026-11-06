# FA3A correction (27 October 2026)

Narrow correction after the FA3 planner review. Composition, real-form reuse and the audit-only typed wordmark are unchanged. Older FA3 evidence in `../evidence/` is preserved; the items below supersede it where stated.

## Changes

| # | Change | Where |
|---|---|---|
| 1 | **No-JS submission lockout.** The submit button is `disabled` in the HTML and enabled by the script only after the real submit handler (and retry listener) is installed. A localized `<noscript>` note says submitting needs JavaScript and links the existing contact email from `site.contact` (no mailto serialization of entries, no backend). Fields and explanations stay readable. With the button disabled, implicit Enter submission is also blocked by the browser. | `src/components/AuditForm.astro`, `src/i18n/ui.ts` (`audit.noscript`, `audit.noscriptContact`, EN/ES/DE) |
| 2 | **Focus labels aligned.** The service select options use the same localized audit names as the mosaic and summary (`audit.mosaic.pieces[id].n`). Ids, order (from `services`), payload values and No preference are unchanged; global service names are untouched. `AuditForm` is used only by `src/pages/[lang]/audit/index.astro` (checked with a repo search), so no other presentation changed. | `AuditForm.astro` |
| 3 | **Result wording.** EN now says "Your entries remain in the form." ES ("Tus datos siguen en el formulario.") and DE ("Deine Eingaben bleiben im Formular.") were already location-independent and are unchanged. | `ui.ts` |
| 4 | **"Try again" evidence reconciled.** See below: stale capture, not a runtime defect. No code change was needed. | evidence only |

## Item 4: what was wrong with the screenshot

`../evidence/1440-en-07-simulated-result.png` still shows "Try again". Reproduced against the final build (`1440-simulated`, `390-simulated`, `390-es-simulated`, `390-de-simulated` in `fa3a-capture-log.json`): `data-retry` has `hidden=true`, computed display `none`, not visible. The FA3 `core` capture ran *before* the `.af__result .btn[hidden]` fix, so the screenshot is stale evidence from before that fix, not behavior of the final code. It is kept as a historical file and is superseded by `1440-en-result-simulated.png` here. (Failed results correctly show the button: computed display `flex`; delivered hides it again.)

## Results (actual)

- `astro check`: 0 errors, 0 warnings, 19 hints. `npm run build`: 47 pages (`command-output-check-build.txt`).
- Targeted: `tests/audit.spec.ts` 46 passed (includes the 8 new FA3A tests: JS-disabled button and Enter attempts in EN/ES/DE, JS initialization enables the button, select labels in 3 languages, wording).
- **One normal isolated full suite after the corrections: 615 passed, 0 failed, 0 skipped, no retries, 3.7 min** (`command-output-full-suite.txt`; Edge via `CHROMIUM_PATH`, own build on port 4322). The earlier FA3 count of 607 plus these 8 new tests is 615.
- **No-JS requests:** the test records every request after load with sample values. Button click (forced past the disabled state) and Enter in two fields cause no request and no navigation; the only request the assertion tolerates is the browser's own `favicon.svg` GET.
- **Negative control** (`fa3a-capture-log.json`, `negativeControl`): the same built page with `disabled` stripped by a local route, JS off, one Enter on the name field produced 1 native POST whose body began `business=&need=&website=&service=&plan=&country=&name=Sample+Name&email=&phone=&language=en`. It was fulfilled locally by `page.route` and never left the machine. This confirms the review's concern was real and that the lockout, not the static server, is what prevents it.
- **Delivery states** were captured with a same-origin fake endpoint fulfilled locally (HTTP 500 for failed, 200 for delivered). The four POSTs in `nonGetRequests` all target `/__fa3a-fake-endpoint`; `blockedExternal` is empty. The build itself has no endpoint; no real submission was possible or made.
- **Fresh first visit without the `odalo.cookies` preseed** (`*-en-first-visit-no-preseed.png`): new context, nothing stored. `localStorage` empty, no cookies, no cookie notice displayed on this route at 1440 or 390, submit enabled. No cookie-policy work was done. (`bannerPresent` in the log uses a guessed selector and is not evidence; the screenshots are.)

## Evidence in this folder

Viewed: `1440-en-result-simulated`, `1440-en-result-failed`, `390-de-nojs-form-guidance`, `390-en-first-visit-no-preseed`. Generated, not individually viewed: `390-en-result-{simulated,failed,delivered}`, `1440-en-result-delivered`, `390-{es,de}-result-simulated`, `1440-de-select-and-summary-labels`, `{1440,390}-en-nojs-form-guidance`, `390-es-nojs-form-guidance`, `1440-en-first-visit-no-preseed`. Their text/state values are recorded in `fa3a-capture-log.json` (including `labelsDe`: select, summary and options all use the same German names).

## Limits

ES/DE strings are still implementation translations without native review. The no-JS guidance names only the existing email contact; there is no phone on file. The select label still reads "Service of interest" (production wording) while its options now use audit focus names. No devices, assistive technology, other browsers or real-speed video review.
