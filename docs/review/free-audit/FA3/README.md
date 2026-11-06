# FA3 — integrated free-audit mosaic

The accepted FA2/FA2A mosaic now lives in the Astro site at `/{en,es,de}/audit/`, using the real Base layout, header (menu, language switch), footer, metadata and the real `AuditForm.astro`. Nothing here was deployed, committed or sent. FA2 evidence under `../FA2/` is unchanged and is historical (see "Superseded FA2 statements").

## Local review

```bash
npm run build
```

```bash
node docs/review/free-audit/FA3/serve.mjs dist 4395
```

Open http://127.0.0.1:4395/en/audit/ (also `/es/audit/`, `/de/audit/`, `?service=ads&plan=captacion`). The build has no `PUBLIC_AUDIT_ENDPOINT`, so the form is in its existing demo mode and simulates submissions. `serve.mjs` answers GET/HEAD only. `npm run dev` also works; do not set `PUBLIC_AUDIT_ENDPOINT` for local review.

## Changed files (all tracked changes are small; no dependency, config, legal or content-data file touched)

| File | Change |
|---|---|
| `src/pages/[lang]/audit/index.astro` | Rewritten: `Base` with `plainWordmark`, `AuditMosaic`, request region (summary, "No preference", approved contact from `site.contact`, `AuditForm`). Old `PageHero`, "what happens next" sidebar and promises removed. |
| `src/components/AuditMosaic.astro` | New: intro + four pieces, all styles (`am-*`) and the mosaic script. |
| `src/components/AuditForm.astro` | Fields regrouped into two `<fieldset>`s (business first, contact second), plan options carry `data-name`, placeholder contrast, `.af__demo`/`.af__result` background moved to paper for the sand panel, retry button `[hidden]` fix. Validation, submit, IDs, names, payload untouched. |
| `src/layouts/Base.astro`, `Header.astro`, `Footer.astro` | New optional `plainWordmark` prop (default false). Only the audit page sets it. |
| `src/i18n/ui.ts` | `audit.*` for EN/ES/DE: new `h1`, `lead`, `scope`, `hint`, `cta`, `mosaic.*`; removed the obsolete `expectH/expect/noPromise` (and their demo overrides). |
| `tests/audit.spec.ts` | New: integration regressions (identity, state, sync, query, restore, form, no-JS, reduced motion, layout matrix EN/ES/DE x 5 widths). |
| `tests/content.spec.ts`, `tests/site.spec.ts`, `tests/identity.spec.ts` | Intentional expectation changes only (see Tests). |
| `docs/review/free-audit/FA3/*` | Evidence and scripts. |

## Integration, data and event map

- **Authoritative value:** the form's `<select id="f-service">` (production ids `web, local, video, ads`; the audit label "Content" is the `video` service preference). `AuditForm` alone parses `?service=` / `?plan=` (unknown values ignored). The mosaic never reads the URL.
- **Mosaic to form:** *Include* sets `#f-service.value` and dispatches a bubbling `change`; *remove* and *No preference* do the same with `''`. Opening or closing a piece writes nothing.
- **Form to mosaic:** one `render()` reads the two selects and updates tile `data-selected`, the badge, the Include/Remove label, the summary (focus, plan via `data-name`) and the "No preference" pressed state. It runs on: `change` of `#f-service` / `#f-plan` (user, Include, programmatic), form `reset` (after a delivered request), `DOMContentLoaded` (after AuditForm's script has applied the query) and `pageshow` (back/forward restore). No polling, no synthetic clicks.
- **First paint / no JS:** the summary and the JS-only buttons are `hidden` until the script has read the form, so nothing can contradict the form. Every explanation is readable text; the form select works natively.
- **Submission:** unchanged `submitAudit` boundary. Demo mode shows the existing notice and simulated result. The retry button is now hidden unless the result failed (it was previously visible on every result, because `.btn` set `display`).
- **Language switch:** `LangSwitch` links to the same path in the other language without the query or entries; nothing is carried across languages (not implemented deliberately).
- **Entrance:** one 560 ms clip reveal, removed on first focus/keydown or after 900 ms, and not added under reduced motion, so a focused control cannot stay clipped.
- **Shared layout option:** `plainWordmark` only swaps the header word (`.hdr__word`, still inside the home link with its aria-label) and the footer word (`.ftr__word`). `Wordmark.astro`, `Logo.astro`, `public/brand` and `src/mosaic` are untouched; other routes render exactly as before.

## Layout gates (re-measured, not assumed)

Wide+tall board mode applies from 75em width and 46em height, with `--au-board-min: 38rem`. With the real 88 px header the board is 608 px at 1440 and 1280 (EN/ES/DE; German 1280 also 608), and the form top is unchanged through every open/include/switch/close (EN 928 px, ES/DE 954 px at 1440). Below the gates (834, phones, short desktops such as 1440×700 and 1280×680) the pieces flow naturally and nothing is clipped. Fonts settled before every measurement.

## Results (actual, this machine, Edge 156 via Playwright)

- `npx astro check`: 0 errors, 0 warnings (19 existing hints).
- `npm run build`: OK, 47 pages. Sub-path build (`SITE_BASE=/odalo/`): OK.
- `tests/audit.spec.ts` passed on its own before the full run. **Full isolated suite, run once after the last code change: 607 passed, 0 failed, 0 skipped, no retries (4.1 min, Edge via `CHROMIUM_PATH`, own build on port 4322).** The suite includes `tests/audit.spec.ts` and all unrelated hero/identity/mosaic/legal/pricing/reflow tests.
- `basepath.mjs` against the `/odalo/` build: no `/`-rooted internal links, privacy/logo/language links prefixed, query preselect (service, plan, summary), Include, language switch, privacy navigation all work, 0 requests >= 400, 2 fonts loaded.
- Contrast (`evidence/contrast.md`, `contrast.json`): **432 computed pairs, 0 failures** on the integrated page in the approved palette and in a temporary alternate-token fixture (`--ink` resolved #203b57 vs #1d3b2f; the fixture is injected only by the script, never shipped, and the approved palette was re-measured in its own fresh context). Lowest text ratio 4.87 default / 5.88 alt; lowest non-text 4.18 / 5.18. Covers header/footer/page text at rest, every tile's text on its hover surface, open and selected text, accent bar, tile/CTA/clear/submit buttons at rest, hover and focus-ring surroundings, placeholder, field edges, error text/summary/marker. Thresholds 4.5 / 3 (large text and non-text). It does not cover every page or state.
- Enlarged text: CSS root-font 200% at 320 and 390 (EN and DE) with a piece open, selected and validation errors shown: no overflow, no clipped text (`auditInPage`). **Real browser setting:** Edge temporary profile with `default_font_size=32`, all of EN/ES/DE × 320/390/834/1440 with a piece open, selected and errors: root 32 px, 0 problems (12/12). Method: same temporary-profile technique as `docs/review/responsive-reflow/real-text-size.mjs`, with FA3-only results; the user's profile was not touched.
- Keyboard: 40 Tab stops from the skip link through header, mosaic and form at 1440×900: no control under the sticky header or below the window. Mobile: menu opens/closes with Escape; the CTA anchor lands the request region below the header.
- Hover: trigger, tile, board and form rects identical before and after hover; the surface grew from 134×91 to 323×219 px (web tile).
- Trace (brief, unthrottled, headless): 94 layout events / 46.8 ms total (max 11.7 ms), 22 ms style recalc, no task over 50 ms. Not a production or real-device claim.
- Asset delta for `/en/audit/` (`evidence/asset-delta.json`, HEAD build vs now): JS 14.3 kB to 4.4 kB raw (5.3 to 2.0 kB gzip) because the audit route no longer mounts the logo animation module; CSS 21.7 to 29.0 kB raw (6.0 to 7.6 kB gzip); same two fonts; no image or video added.
- External requests during all captures: none (all non-local requests aborted; `blockedExternal` is empty). No real submission was possible or made.

## Evidence personally inspected (`evidence/`, `playback/`)

Viewed: `1440-en-04-selected-web`, `1440-en-06-errors`, `1440-en-07-simulated-result`, `1440-de-02-open-selected`, `834-es-02-open-selected`, `390-es-02-open-selected`, `320-de-02-open-selected`, `1280x680-short-de-02-open-selected`, `320-de-enlarged200-full`, `390-en-nojs-full`, and both playback sheets. Generated but not individually viewed: the other compact/open shots for EN/ES/DE at each width, `1440-en-01..03/05`, `1440x700-short-en`, `1280-de-*`, `390/320-en-enlarged200-full`, `390-de-enlarged`, `1440-en-nojs-full`, reduced-motion shots, `390-en-menu-open`, `390-en-after-request-anchor`, `1440-en-keyboard-in-form`, `320-de-real32-open-errors-full`.
Recordings (`recordings/desktop-1440-integrated.webm` 7.5 s, `phone-390-integrated.webm` 4.2 s): real CDP screencasts encoded to webm, decoded again and reviewed as 2 fps contact sheets, not at real speed (no media player is available to me). Sequence seen: hover growth moving between pieces, open, Include (badge + accent bar + summary), switch, Close, scroll to the form with the summary kept; phone: tap open, Include, switch, Close, scroll. One transient text highlight on a tapped title in the phone sheet led to `user-select: none` on the trigger.

## Tests changed (intentional only)

`tests/content.spec.ts`: the audit page now has the new h1/lead/scope (old PageHero lead, "what happens in this demo" list removed) and the first invalid field is the business field (business group comes first). `tests/site.spec.ts`: same first-focus change. `tests/identity.spec.ts`: `/en/audit/` removed from the "header identical on every page type" list because audit routes intentionally use the typed wordmark (covered in `tests/audit.spec.ts`); all hero/module/identity assertions for other routes are untouched.

## Limitations and remaining launch blockers

- (Resolved in FA3A) The select now uses the audit focus names and the EN result text no longer says "below".
- (Corrected in FA3A) The original FA3 claim that nothing can be sent without JavaScript was inaccurate: the enabled button or Enter would have made the browser POST the named fields to the page URL. The submit button is now disabled in the HTML and enabled by script; see `correction/README.md`. Production delivery plumbing is a separate task.
- Spanish and German strings were written by me as implementation translations; no native review.
- Recordings reviewed by sampling only; tablet 834 checked in EN/ES/DE compact+open only; no real devices, assistive technology, Safari or Firefox.
- Not re-run: the existing `docs/review` scripts that overwrite their own results (to preserve evidence).
- Existing blockers unchanged: real delivery endpoint, privacy/legal review, confirmed scope/format/timing of the audit.

## FA3A correction

See `correction/README.md`. Superseded FA3 evidence: `evidence/1440-en-07-simulated-result.png` (stale: captured before the retry-hidden fix, still shows "Try again"), the "no JavaScript" statements above about nothing being sendable, and the first full-suite count (607; now 615).

## Superseded FA2 statements

FA2 README/handoff text describing the multicolour wordmark, bar hover, 8 px selected frame, repeated caveats and "not production" scripts/copy refers to the prototype before FA2A. FA2A results (31 checks, 364 pairs) belong to the prototype; the current integrated results are the ones above (e.g. 432 pairs).

