# Odalo website (demo)

A runnable, localized demo of the new Odalo site: **a living mosaic — different pieces, one connected result.**
Spanish, English and German; static output; almost no JavaScript.

Design handoff documents live in [`docs/design/`](docs/design/). Implementation notes, editable content,
replacement assets, checks and the pre-launch list are in **[`HANDOFF.md`](HANDOFF.md)**.
Visual review captures are in [`docs/review/`](docs/review/README.md).

## Stack (and why)

**Astro 7 (static) + TypeScript**, vanilla-JS islands, self-hosted Outfit / Instrument Serif via Fontsource.
Chosen because the site is content-led and must hit a ≤200 KB JS budget: pages are fully rendered HTML,
language-prefixed routes come from static paths, and interactivity (mosaic, menu, form) is a few KB of
progressive enhancement. Content lives in typed files, separate from layout. Tests use Playwright + axe.

## Install and run

Requires Node.js 20+ (developed on 22) and npm.

```bash
npm install
npm run dev        # http://localhost:4321  (redirects / to /en/, /es/, /de/)
```

Production build and preview:

```bash
npm run build
npm run preview    # http://localhost:4321 — serves dist/
```

On Windows PowerShell the commands are identical (`cd` into the project, then the same `npm` commands).

## Hosted demo (GitHub Pages)

`.github/workflows/pages.yml` builds and publishes the site on every push to the default branch:
**https://sappldigital.github.io/odalo/** (root redirects to `/en/`, `/es/` or `/de/`).
One-time setup: repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The demo build sets `PUBLIC_NOINDEX=true` (meta `noindex` + `Disallow: /` in `robots.txt`) because the content is placeholder.
Note: the site is public on the internet even though it is unindexed. To build the same way locally:
`SITE_URL=https://sappldigital.github.io SITE_BASE=/odalo/ PUBLIC_NOINDEX=true npm run build`
(PowerShell: `$env:SITE_URL='https://sappldigital.github.io'; $env:SITE_BASE='/odalo/'; $env:PUBLIC_NOINDEX='true'; npm run build`).
Run `preview` with the same variables to serve it under `/odalo/`.

## Checks

```bash
npm run check      # astro check: TypeScript + template diagnostics
npm test           # Playwright: behaviour, responsive, localization, form, axe (needs a build)
npm run verify     # check + build + test
npm run shots      # regenerate docs/review/*.png (needs `npm run preview` running)
npm run perf       # lab performance table (needs `npm run preview` running)
npm run og         # regenerate public/og.png
```

Playwright uses the browser at `/opt/pw-browsers/chromium` when present (cloud sandbox); otherwise run
`npx playwright install chromium` once. Override with `CHROMIUM_PATH`.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SITE_URL` | `https://odalo.example` | Absolute origin for canonical, hreflang, sitemap, OG tags. **Placeholder, not a real domain.** |
| `SITE_BASE` | `/` | Sub-path hosting (e.g. `/odalo/` on GitHub Pages). |
| `PUBLIC_NOINDEX` | unset | `true` adds `noindex` to every page and disallows all crawling in `robots.txt` (used for the demo deployment). |
| `PUBLIC_AUDIT_ENDPOINT` | unset | Audit-form delivery URL. Unset = **simulated** submission (nothing is sent, and the UI says so). |

## Project map

```
src/config/site.ts        contact details (null = "to be confirmed"), endpoint, analytics flag
src/content/              services, plans (+ comparison + open conditions), projects, FAQs  — stable IDs
src/i18n/                 languages, helpers, ui.ts (all interface copy: es / en / de)
src/components/           Header, Footer, Hero, ServiceMosaic, WorkMosaic, Process, Plans*, About, Faq, AuditForm, Art, Logo …
src/pages/[lang]/         home, services/[service], plans, work, work/[project], about, audit, privacy|cookies|legal
src/pages/                / (language redirect), 404, sitemap.xml, robots.txt
src/lib/                  submit.ts (delivery boundary), analytics.ts (consent-gated stub)
src/styles/global.css     brand tokens, type scale, buttons, focus
tests/                    Playwright specs      scripts/   screenshots, perf, og, helpers
```
