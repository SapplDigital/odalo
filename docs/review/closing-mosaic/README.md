# Task 15: connected closing CTA and accurate demo footer

## Changed files
`src/components/FinalCta.astro`, `src/components/Footer.astro`, `src/i18n/ui.ts` (new `cta.bodyDemo/buttonDemo/contactDemo`, obsolete `cta.contactPending` removed, cookie-page heading), `tests/closing.spec.ts` (new, 44 tests), `HANDOFF.md`. Evidence tools in `tools/`.

## Changes
- **Closing CTA:** heading, palette and the decorative SVG kept. Main panel and artwork now join with no gutter and flat shared edge; curved outer top-left (large) and bottom-right (large), small curves at the other two outer corners. 8/4 on desktop, one connected column on phones, the artwork compact (8 rem, 10 rem on tablet; it never sets the height on desktop). Text grows naturally (`overflow-wrap`, no fixed heights). No animation. The button gets `scroll-margin` so keyboard focus scrolls it in with room for its ring.
- **Honest wording:** `site.auditEndpoint` unset selects the demo strings (body and button, EN/ES/DE as specified); the configured branch keeps its existing strings. `href`, `data-track="audit_cta"` and `data-location="final"` unchanged. Missing contact: "Contact details are not published in this demo." in the CTA and footer (the instruction to use the audit form is gone); verified email/phone/address still render when set; nothing invented.
- **Footer:** unchanged structure, continuous navy surface, links, equivalent-page language switch, native Browser storage disclosure (exact approved copy, grows in flow), legal links, demo line, static logo, decorative strip; only the missing-contact text changed.
- **Cookie page:** only the obsolete fourth heading is replaced ("Managing browser storage" / "Cómo gestionar el almacenamiento del navegador" / "Browserspeicher verwalten"); draft banner, `noindex` and pending content kept; no consent controls.

## Checks
- `astro check` 0 errors, 0 warnings; build ok; normal suite **526 passed** (482 before, 44 new) (`evidence/full-suite.txt`).
- Tests: demo wording and attributes in EN/ES/DE; configuration selection (source check) plus **built evidence for both branches**: a throw-away build with `PUBLIC_AUDIT_ENDPOINT` set shows the existing wording, the default build the demo wording (`evidence/configured-vs-unset-wording.txt`; no request was sent, the endpoint was a non-resolving placeholder and the build folder was deleted); viewing the CTA and following it makes no external request; joined geometry (no gaps, flat edge, outer corners, 8/4, compact phone art) on home x 3 languages x 5 widths and plans/about/service/case study at 1440 and 390; text bounds inside areas at 390 and 320 px with 200% root font including an open disclosure; contrast of heading, body, label and button; CTA focus ring in view; footer surface, navigation, equivalent-page language links, legal links, demo line, open disclosure grows in flow, targets at least 44 px; Browser storage with keyboard and without JavaScript; analytics off and legacy `odalo.cookies` inert with no external request; cookie-page heading, banner, noindex.
- **Real 32 px browser text setting** (temporary Edge profile with default font size 32; separate from the root-font simulation): home, plans, About x EN/ES/DE x 320, 390, 834, 1024, 1440 with the disclosure open: 45 combinations, 0 failing, including text-inside-area checks (`evidence/real-text-size-results.json`).
- **True viewport focus evidence** (not stitched): `viewport/` has 27 viewport screenshots (CTA button, Browser storage summary closed and open) in EN/ES/DE at 1440, 390 and 320 at 200% text; all 27 have a visible 3 px ring, the control inside the viewport and below the sticky header (`viewport/_focus-results.json`). A first run failed for the CTA because focus left the ring at the window edge; fixed with `scroll-margin`.

## Screenshots
`before/`, `after/` and `after-open/` (disclosure open): home, plans, About, a service, a case study and the audit page footer, EN at all widths (ES/DE on home and About, and at 1440/390), plus 390/320 at 200% root font. Inspected: `before/de-390-100-home.png`, `after/de-1440-100-home.png`, `viewport/en-1440-100-cta.png`, `viewport/de-390-100-storage-open.png`. Section clips can show the sticky header over their upper part; the viewport set is the true-view evidence.

## Limitations
- The hero's primary button and the audit page still say "free audit" (outside this task); recorded in HANDOFF.md.
- At 320 px with a real 32 px text setting long German words break inside the word; nothing is clipped.
- Not tested: Safari, Firefox, real devices, screen readers. No performance campaign, no real delivery.
