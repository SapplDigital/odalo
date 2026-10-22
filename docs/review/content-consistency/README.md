# Task 16: consistent demo enquiry wording and content cleanup

Owner decision applied: the free audit is an approved Odalo offer (labels stay in navigation, hero and the audit heading); its scope, format and response time are unconfirmed and not promised; the form is described as a simulation until delivery is connected.

## Changed files
`src/i18n/ui.ts` (demo enquiry overrides, applied by `tr()` when `PUBLIC_AUDIT_ENDPOINT` is unset; home description; audit contact fallback; `services.exampleScope`), `src/content/faqs.ts`, `src/content/services.ts` (FAQ id), `src/components/Faq.astro`, `src/components/ServiceMosaic.astro` and `src/pages/[lang]/services/[service]/index.astro` (example-scope disclosure), `HANDOFF.md` (delivery recipients), `tests/content.spec.ts` (new, 14), `tests/site.spec.ts` (audit-form tests now locate the submit button by `[data-submit]` and expect "Simulating…"; every behaviour assertion unchanged). Inventory: `CONTENT-INVENTORY.md`.

## Results
- `astro check` 0 errors, 0 warnings; build ok; normal suite **540 passed** (526 before, 14 new) (`evidence/full-suite.txt`).
- Tests: free-audit labels and hrefs/tracking in EN/ES/DE; audit lead, steps, button; journey hero CTA to form, localized errors with focus, simulated confirmation, entries retained, no write requests and no external requests; service and plan preselection; configured branch intact (source checks plus a throw-away build with an endpoint set, `evidence/configured-vs-unset.txt`: original "Request audit / Pedir auditoría / Analyse anfragen" and titles kept; no request was sent and the build folder was deleted); FAQ records and references, revised answers, native details with keyboard and without JavaScript; example-scope disclosure with prices/quantities unchanged; crawl of 3 languages x 17 routes with every internal link requested, no unsupported claims, no published recipients, consistent header label.
- Real 32 px browser setting on the changed pages (audit, home with FAQs open, a service page) in EN/ES/DE at 320, 390, 834, 1440: 36 combinations, 0 failing (`evidence/real-text-size-results.json`).
- Screens (true viewport): `screens/` hero CTA, audit top, audit errors, simulated confirmation and open FAQs for EN/ES/DE at 1440, 390 and 320 at 200% text. Inspected: `screens/en-1440-100-2-audit-top.png`, `screens/de-390-100-4-simulated-confirmation.png`.

## Notes and limitations
- The FAQ has no structured data in the demo (checked), so there is nothing to keep in sync.
- "Monthly report" and similar plan inclusions stay as example plan values under the new disclosure.
- The configured branch keeps the original audit text; its wording needs owner approval together with delivery.
- Delivery recipients (two addresses) are recorded in HANDOFF.md only; not published, not implemented.
- Not tested: Safari, Firefox, real devices, screen readers.
