# Source-publication inventory (planner review before ANY staging) - 27 Oct 2026
Nothing staged, committed or pushed. Private, local-only document. Snapshot: see SESSION-HANDOFF.md.

## Critical finding: history, not just the working tree
The 4 local commits (28bbc6d..ff22ee1) are not on any remote and ALREADY CONTAIN private material in committed files:
HANDOFF.md (recipient address, site ID, deploy/submission IDs in HEAD), docs/review/content-consistency/CONTENT-INVENTORY.md,
docs/review/session-handoff/SESSION-HANDOFF.md, tests/content.spec.ts (asserts against a personal gmail pattern).
=> pushing branch feature/mosaic-redesign as-is would publish those. Publication needs a curated branch (new commit(s) from f45dc11 containing only the public list below), not a push of this history. 295 docs/review files are already tracked in those commits (~15 MB).

## A. Public-source candidates (review each diff first)
| Path | State | Note |
|---|---|---|
| src/** (components, pages, content, i18n, lib, config, styles, layouts, mosaic/odalo) | M + new AuditMosaic.astro | product source. config/site.ts holds public info@ and operator address (legal identity, intentional). src/content/legal.ts is already on master. |
| tests/** (audit.spec.ts, delivery.spec.ts new; others M) | | delivery.spec.ts and content.spec.ts contain the personal-address pattern as a NEGATIVE assertion: rewrite or drop those literals before publishing. |
| public/** (brand, work concepts, favicon, og.png) | tracked | 3.1 MB; needed by build. |
| astro.config.mjs, package.json, package-lock.json, tsconfig.json, playwright.config.ts | tracked, unchanged | |
| scripts/** (og, make-*asset*, perf, shot...) | tracked | make-og.mjs needed by `npm run og`; others dev tools; check none embeds private paths. |
| PRODUCT.md, README.md (M) | | review README diff. |
| inbox/odalo-web-export/** | tracked (198 KB) | NOT imported by src (grep: no references); source of src/mosaic/odalo. Can stay history-only. |
| .github/workflows/pages.yml | tracked | old GitHub Pages demo; decide keep/remove. |
| .gitignore | | |
## B. Private / never publish
- HANDOFF.md (tracked): production block lists recipient, site ID, deploy ID, submission ID, lock history. Publish a sanitized version or omit.
- docs/review/free-audit/** (D3 evidence, hooks-raw-private.json, submissions-raw-private.json, SESSION-HANDOFF, deploy output), docs/review/main-site-mosaic/** (this folder).
- .claude/ (launch.json, local), .mcp.json (harmless; tooling), .netlify/ (CLI state, ignored).
- docs/legal-review/**, docs/legal-open-points.md: operator/legal working notes; review before any publication.
## C. Large / history-only (screenshots, recordings, evidence)
- docs/review/** other than above (~347 MB local, ~460 untracked): historical visual evidence. Keep local + in snapshot; do not publish.
- docs/design/**, docs/brand/**: design docs; publishable only if wanted, low risk, not needed by build.
## D. Needed outside the repo for a release
Netlify build command + env vars (SITE_URL, SITE_BASE, PUBLIC_NOINDEX, PUBLIC_AUDIT_TRANSPORT=netlify) live only in the Netlify UI: no netlify.toml in repo. Form notification recipients also only in Netlify.
## Suggested later mechanics (not executed)
Curated branch from f45dc11 -> `git checkout <ff22ee1> -- <path list A>` (never `git add .`) -> sanitize -> review diff -> build on that commit -> explicit preview configuration -> owner publication decision.
