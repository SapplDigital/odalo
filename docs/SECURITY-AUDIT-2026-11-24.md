# Security audit odalo, 2026-11-24 (branch deadline/2026-11-24)

Verdict: **SHIP** (noindex staging/live under the conditions below). No Critical/High.

Method: file read only (Bash was denied in this run). Not verified: git history scan, `npm audit`, built `dist` output, live Netlify headers.

## Findings
- Medium: src/content/legal.ts:64 (EN), :146 (DE), :228 (ES): privacy text says Netlify Forms is "our processor", but admits no data processing agreement (DPA) was verified. Fix before public launch: accept Netlify's DPA in the Netlify account, then reword.
- Medium: legal.ts:277 (and DE/ES): no deletion period for form submissions. Define one (e.g. 6-12 months) and delete in Netlify Forms; the text must name it.
- Low: netlify.toml:19 CSP uses 'unsafe-inline' for script/style. Acceptable for a static site with no user-generated HTML, no third-party scripts, form data only goes to same origin. Better: hash-based CSP (Astro 5+ supports it) later. Missing `base-uri 'self'`, `object-src 'none'`, `connect-src` (falls back to default-src 'self', fine).
- Low: no HSTS header in netlify.toml (Netlify sets HSTS on its default domains/managed certs; to verify on the custom domain).
- Low: .github/workflows/pages.yml publishes a second demo copy to GitHub Pages on push to master (noindex set, form simulated). Actions not pinned to SHAs. Disable it if not wanted.
- Info: Netlify honeypot `bot-field` OK (AuditForm.astro:24-27); submit is POST body, no PII in URLs; analytics is hard-disabled (analytics.ts:21-31), no tracking events carry PII. Query params ?plan/?service are validated against option lists (AuditForm.astro:204-208).
- Info: no external requests found (fonts via @fontsource, font-src 'self', no OSM/tiles/CDN links in src). Secret-pattern grep over the working tree: no hits; .env* is gitignored (.gitignore:14-16). Owner address in legal pages is intended.
- Info: X-Robots-Tag noindex plus PUBLIC_NOINDEX set (netlify.toml:7,14), as intended for pre-launch. Remove both at go-live.

## Accepted risks
'unsafe-inline' CSP; US transfer relies on Netlify's DPF/SCC statement.

## To verify
Run `npm audit --omit=dev`; run gitleaks over full history; check live response headers after deploy; confirm Netlify form notification email goes to the owner.
