# Odalo website demo — implementation handoff

Status: **runnable demo**, built from `docs/design/00–07`. Not production-ready; see [Before production launch](#before-production-launch).
All commercial content (services, prices, inclusions, projects) is **demo content**, labelled as such in the UI.

## 1. Architecture

| Concern | Where | Notes |
|---|---|---|
| Framework | Astro 7, static output, TypeScript | No client framework. Pages are complete HTML before any script runs. |
| Routes | `src/pages/[lang]/…` | `/{es,en,de}/` home, `services/{id}/`, `plans/`, `work/`, `work/{id}/`, `about/`, `audit/`, `privacy/ cookies/ legal/`. Root `/` → client-side redirect (stored choice → browser language if es/de → **English fallback**; `<meta refresh>` covers no-JS). `404.html` is language-neutral with links to all three languages. |
| Content | `src/content/*.ts` | `services`, `plans` (+ comparison `features`, `pendingConditions`), `projects`, `faqs`. Each record has a **stable `id`** and `{es,en,de}` text. Layout components only read these. |
| Interface copy | `src/i18n/ui.ts` | One typed dictionary per language; `es`/`de` must match the `en` shape or `astro check` fails. Includes metadata, validation messages and ARIA labels. |
| Site facts | `src/config/site.ts` | Contact details are `null` → UI shows "to be confirmed". Delivery endpoint + analytics flag. |
| Brand tokens | `src/styles/global.css` (`:root`) | Colours, fonts, spacing scale (4…128), fluid type, breakpoints. |
| Delivery boundary | `src/lib/submit.ts` | The only code that decides what "sent" means. |
| Analytics boundary | `src/lib/analytics.ts` | Consent-gated stub; **sends nothing**. Event names/dimensions from doc 06; never takes PII. |

### The service mosaic (first milestone)

`src/components/ServiceMosaic.astro`.

- Desktop (≥ 64em): two grid rows, each `grid-template-columns` driven by custom properties; the **shared edge animates** (380 ms ease-out) and text is never scaled. Ratios are exactly Document 03's table (rest 7/5·5/7; A 8/4; B 5/7; C 7/5; D 4/8) and are asserted in tests.
- **Stable height:** rows have a fixed height (`--row-h`, in `rem` so it scales with text size), so hovering never moves later sections (asserted: mosaic height, page height and next-section position unchanged).
- **Flicker prevention:** the pointer is resolved against the **resting** edge (not the moving one) with a ±28 px hysteresis band, a 120 ms intent delay and a 180 ms reset delay. Only `pointerType === 'mouse'` drives geometry, so touch scrolling never selects a tile.
- Hover/focus change emphasis only; all titles, descriptions and links are visible at rest. **Explore** buttons (`aria-expanded`/`aria-controls`) open one shared region below the mosaic; full-service links are independent. Esc closes and returns focus to the Explore button.
- Tablet (48–64em): same mechanism with reduced travel (±1fr). Mobile (<48em): single column in reading order; the shared region is **moved to sit directly after the selected tile**. No-JS: Explore buttons are hidden, everything else (and the full links) remains.
- Reduced motion: transitions/animations are neutralised globally; hero pieces render final.

Other motion: hero pieces assemble once (900 ms, transform/opacity only; text is never animated); process connector draws once on entering view; FAQ and detail fades 220 ms. All gated behind `:global(.js)` and disabled under `prefers-reduced-motion`.

### Responsive approach
Breakpoints are in **`em`** (48em/64em/70em/80em), not px, so layouts also respond to larger text sizes. Header collapses to a menu below 70em so longer German labels never crowd. The pricing comparison is a labelled, keyboard-focusable scroll region on narrow screens (page itself never scrolls horizontally).

## 2. Editing content

- **Add/rename a service, plan, FAQ or project:** edit the file in `src/content/`. Never change an `id` (routes, `?plan=`/`?service=` preselection, analytics key off it). The mosaic currently renders the first four services as tiles A–D.
- **Prices:** `plans.ts → price` (numbers, EUR). Formatting is locale-aware (`€1,290` / `1.290 €`).
- **Plan inclusions:** `own` (what a plan adds), `notIncluded`, and the `features` comparison matrix.
- **Open commercial questions:** `pendingConditions` (rendered as "To be confirmed" chips, never as commitments).
- **Interface text, metadata, validation messages, ARIA labels:** `src/i18n/ui.ts`.
- **Contact details:** `src/config/site.ts → contact`. Footer, final CTA and audit page switch from "to be confirmed" to real links automatically.

## 3. Localization

- Every page exists in `es`, `en`, `de`; switcher (**ES · EN · DE**, full language names as accessible labels, no flags) opens the equivalent page and stores the explicit choice. `hreflang`, `x-default` (→ `/en/`), canonical, `<html lang>`, sitemap alternates and `og:locale` are generated.
- Layouts were checked with German (longest copy) at 1440/1024/390/320 and under text enlargement.
- **All Spanish and German copy is a DRAFT needing native review**, in particular: `src/i18n/ui.ts` (es/de), `src/content/{services,plans,projects,faqs}.ts` (es/de) and `pendingConditions`. Open decision: German uses informal **"du"**; confirm the intended tone of address. Spanish hero follows the supplied wording; the English/German hero lines follow doc 05's table.

## 4. Replacement assets

| Item | Current state | Replace by |
|---|---|---|
| Logo | **Temporary** redraw of the reference symbol (`components/Logo.astro`, `public/favicon.svg`); wordmark is live Outfit text with coral dot | Official SVGs (light/dark/symbol) in `Logo.astro` + favicon |
| Fonts | Provisional Outfit + Instrument Serif Italic (Fontsource, self-hosted, preloaded) | Original files: update `@font-face`/`--font-*` in `global.css` and the two preload imports in `layouts/Base.astro` |
| Colours | Provisional hex values | `:root` first block in `global.css`. Derived contrast-safe tokens (`--ink-deep`, `--rust-text`, `--coral-light`, `--slate-text`) exist because the provisional pairs failed AA (ink/coral 3.99:1, rust/paper 4.39:1, coral/ink 3.99:1); re-derive after final colours |
| Imagery | **No photography.** Geometric artwork in `components/Art.astro` (browser, pin, video, chart, studio) and the hero/final-CTA shapes | `<img>` with real width/height, `alt`, `loading` (hero image `fetchpriority="high"`); crop into the mosaic panels, no device mockups |
| Sample projects | 3 fictional, labelled scenarios; **no client names, results or quotes** (`content/projects.ts`) | Verified projects; set `sample: false`; add verified outcomes |
| Team | No people shown (none supplied) | Add a `team.ts` record + About section |
| OG image | `public/og.png` generated by `npm run og` from the temporary logo | Designed share image |
| Legal pages | Structure + "content pending" with a draft banner; `noindex`, not in sitemap | Approved privacy/cookie/legal text |

## 5. Audit form and delivery

`components/AuditForm.astro` + `lib/submit.ts`. Required: name, email, business, short need (+ privacy confirmation). Optional: website (accepts `example.com` or full URL), country/time zone, language, service, plan, phone, separate optional marketing consent. Persistent labels, localized inline errors + summary, focus to first error, `aria-invalid`/`aria-describedby`, retained values.

- **No `PUBLIC_AUDIT_ENDPOINT` (default): submission is explicitly simulated** — notice shown above the form, "Sending…" state, then "Simulated submission… nothing was sent". It is never tracked as a confirmed submission.
- **With an endpoint:** POST JSON; "Request received" is shown **only for a 2xx** response; failure keeps entries and offers Retry; duplicate clicks are ignored while sending.
- **Connecting delivery:** point `PUBLIC_AUDIT_ENDPOINT` at a service that accepts the JSON body (`AuditPayload` in `submit.ts`), stores/emails it, and returns 2xx only after acceptance (serverless function or form provider). Add spam protection, the approved privacy text, and a verified fallback contact. Do not claim a response time until one is agreed.
- Plan/service preselect: links use `?plan={base|local|captacion|360}` and `?service={web|local|video|ads}`; unknown values are ignored.

## 6. Deviations from the design documents (deliberate)

- Mosaic height is **~816 px at ≥1280 (rows 25rem)** rather than the ~560 px suggestion; doc 03 allows more height "when text size or content requires it" — the tiles hold art, outcome text, two controls and the longest German copy without clipping.
- Header height 88/80/72 px (desktop/tablet/mobile); full nav shows from 70em rather than 64em so German labels fit.
- The reference's "El más completo por precio" claim is replaced by the neutral **"Plan destacado"** badge (doc 05); "IGIC" wording is removed in favour of "tax wording to be confirmed"; ad-spend-paid-directly-to-Google/Meta is kept (doc 05) and flagged as needing confirmation.
- Cookie controls: a minimal essential-only/analytics-choice bar; no analytics is loaded in the demo.

## 7. Checks performed and results

Run on the final build (`npm run verify`; Chromium only, headless, Linux container).

| Check | Result |
|---|---|
| `astro check` (TypeScript + templates) | 0 errors, 0 warnings, 0 hints |
| `astro build` | 47 pages generated |
| Playwright suite (`npm test`) | **58 / 58 passed** |
| Mosaic geometry for all four hover states vs doc 03 table; stable mosaic/page height and next-section position | pass |
| No flicker with ±12 px pointer jitter on the resting edge; reset on leave; hover never opens details | pass |
| No text clipping in any hover state, es/en/de, plus 200 % text-size override (en/de) | pass |
| Keyboard: focus emphasis, Enter/Space, one open region, Esc closes and restores focus, focus order A–D, links independent | pass |
| Touch (390 px, touch emulation): Explore opens inline after the tile, geometry unchanged, content visible before any tap | pass |
| Reduced motion; no-JS content availability | pass |
| Language switching, root fallback + stored choice, hreflang/canonical, single `h1`, sitemap-wide link check (all 200), 404 recovery | pass |
| Plan preselection for all four plans; prices/featured badge/"example prices" visible without interaction; locale price formats | pass |
| Form: required/format validation, localized messages, simulated state, delivered state (mocked 2xx), failure + retry (mocked 500), duplicate-click guard, regression test for layout shift on error clearing | pass |
| Horizontal overflow at 320/390/640/720/834/1024/1440 on 9 page types | pass |
| 44 px target size for primary controls (mobile) | pass |
| axe-core (WCAG 2.0/2.1/2.2 A+AA tags), serious/critical on 10 pages (home ×3 languages, plans, audit, work, case study, service, about, privacy) | 0 violations |

**Defects found and fixed during verification:** scoped `.js` selectors never applied (broke mobile menu and caused page overflow); invalid `calc()` with `fr` units; table `sr-only` spans escaping the scroll container (320/390 px overflow); contrast failures on the slate tile number and coral-tile chips; blur-time re-validation shifting layout under the pointer and swallowing a checkbox click; font swap CLS (0.14–0.24 → 0); 30 px-tolerance fix for the narrowest German tile at 1024.

### Lab performance (local, `npm run perf`; **not field data**)

Unthrottled desktop and a 4× CPU / ~1.6 Mbps / 150 ms profile, headless Chromium, local static server, no compression on the server.

| Page | Profile | LCP | CLS | INP* | Transfer | JS (raw / gzip) |
|---|---|---|---|---|---|---|
| `/en/` | desktop | 196 ms | 0 | 56 ms | 178 KB | 4.3 / 1.6 KB |
| `/en/` | throttled mobile | 1080 ms | 0 | 136 ms | 178 KB | 4.3 / 1.6 KB |
| `/en/plans/` | desktop / mobile | 172 / 884 ms | 0 | – | 122 KB | 1.6 / 0.7 KB |
| `/en/audit/` | desktop / mobile | 152 / 880 ms | 0 | – | 111 KB | 5.5 / 2.3 KB |

\*Event-duration proxy from a few scripted clicks, not a field INP. Budgets (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, ≤ 1.5 MB, ≤ 200 KB JS) are met in these lab runs, which says nothing about real devices, networks or CDN behaviour. Fonts are the heaviest asset (≈65 KB, preloaded).

### Not done / limits of this verification
- **Browsers:** Chromium only. Firefox and Safari (including `grid-template-columns` transition support, iOS touch) are untested.
- **No manual assistive-technology testing** (VoiceOver, NVDA, TalkBack, voice control). axe catches only a subset of WCAG issues; do not treat this as a conformance statement.
- No real-device or field performance data; no Lighthouse run.
- Touch was verified with emulation, not a physical device.
- No CI workflow committed.

## 8. Visual review artifacts (doc 06 deliverables)

`docs/review/` (regenerate with `npm run shots`): homepage at 1440/834/390 (+ es/de), service, audit, plans, work, case study and about pages; the service mosaic at rest and in all four desktop expansions; open details; keyboard focus; mobile inline details; mobile menu; 320 px reflow; 200 % text; reduced motion; form error and simulated-success states. See `docs/review/README.md`. Not produced: a standalone component sheet/Figma, brand-asset crop guidance and an inventory spreadsheet (the content files are the inventory).

## Before production launch

1. **Brand:** original vector logo set, fonts and exact colours; re-check contrast; favicon + social image.
2. **Imagery:** real photography/video stills, crop guidance, alt text; remove placeholder art where replaced.
3. **Content:** confirm service names/scope, prices, inclusions, tax wording, ad-spend condition and the open commercial conditions (fees, commitment/cancellation, ownership, revisions, travel, ad-account ownership, reporting measures, timelines, multilingual deliverables).
4. **Real work:** verified projects, outcomes and any testimonials; team names/bios/portraits; flip `sample: false`.
5. **Translations:** native review of all Spanish and German copy; decide German tone of address.
6. **Contact + delivery:** verified email/phone/address; production `PUBLIC_AUDIT_ENDPOINT`, spam protection, monitoring, tested success/failure paths with a real backend.
7. **Legal:** approved privacy, cookie and legal-notice text; cookie/consent configuration matching any analytics chosen; then enable analytics via `lib/analytics.ts`.
8. **Domain/SEO:** real `SITE_URL`, hosting + redirects (`/` language logic), HTTP caching/compression, structured data with verified organization facts only, submit sitemap.
9. **QA:** cross-browser (Safari/Firefox/Edge, iOS/Android devices), manual screen-reader and keyboard audit, field performance monitoring, CI for `npm run verify`.
