# QA 2026-11-24

(Full issue list, screenshots: later milestone.)

## Home sections

- The home now includes the Kit QR section (`src/components/home/SeccionKit.astro`): static SVG/CSS illustration ported from `SeccionKit.tsx` @ f137d06 (odalo-web); no assets copied.

## Deleted specs

- `tests/services-motion.spec.ts`: tested the home page's services assembly/travel animation, hero-pause coordination and `[data-mosaic]`/`.tile` tiles, which `ServiceMosaic` no longer renders on the home page since the mosaic redesign (ba8aa35, HomeMosaic). **Status: the automated coder cannot delete files, so per owner decision (2026-11-15) the file content was replaced by a single `test.describe.skip` block titled "retired: ..."; PAOLO deletes the file after the loop.**

## Retired spec files (content replaced by one `test.describe.skip('retired: mosaic replaced by Ale design')`; PAOLO deletes them after the loop)

- `tests/concept.spec.ts`, `tests/concept-clinic.spec.ts`, `tests/concept-shop.spec.ts`: old concept-panel/mosaic structure.
- `tests/mosaic.spec.ts`: old home mosaic tiles.
- `tests/process.spec.ts`: old home process section.
- `tests/storage.spec.ts`: old home first-view/storage overlay structure.
- `tests/closing.spec.ts`: old closing (`.fin`) section.
- `tests/portfolio.spec.ts`: old portfolio tiles.
- `tests/work-field.spec.ts`: old connected work field grid on home.
- `tests/home-runtime.spec.ts`: old HomeMosaic runtime.
- `tests/pricing.spec.ts`, `tests/pricing-enlarged.spec.ts`: old home pricing section.
- `tests/identity.spec.ts`: old identity/wordmark structure.
- `tests/language-flash.spec.ts`: old HomeMosaic render-blocking script, `.hm-box`, old menu panel.

## Skipped cases / groups in mixed specs (valid cases keep running)

- `tests/about.spec.ts`: describe "about: one connected mosaic": old mosaic tiles.
- `tests/audit.spec.ts`: "rapid switching and resizes..." and "compact + one open + selected has no overflow..." (x15): old mosaic tile layout.
- `tests/content.spec.ts`: "free-audit labels stay in navigation, hero..." (old header/.hero/.fin selectors); "the journey from the hero CTA..." (old hero CTA); "homepage and service-page FAQs..." (old home FAQ); "service pages and the homepage detail panels..." (old home panels).
- `tests/qa.spec.ts`: "German form labels...Datenschutzhinweise" and "form error and result states do not overflow..." (old audit form layout).
- `tests/reflow.spec.ts`: home/plans 200% cases and non-legal "other page types" 200% cases (old mosaic content overflows; legal pages stay checked); "open menu stays inside the viewport" (old hamburger header; shell.spec.ts covers the new one); "focus indicators are visible" and "FAQ answers expand" (old home controls).
- `tests/site.spec.ts`: "plans" tests (prices, localized formats, preselect x4: old home `#plan-*`); "200% text enlargement ... mosaic text" (old `.tile`); describe "accessibility (axe...)": colour-contrast fails on the footer headings (`.ftr__h`, coral on the new tokens), re-enabled in M11 (see "Axe (M11)").

## Real defect fixed

- `src/components/Header.astro`: at 200% text the mobile bottom-pill CTA ("Free audit") overflowed the viewport; the pill now wraps (`flex-wrap`) and the CTA may wrap its text (WCAG 1.4.4/1.4.10).

## Skipped tests (old header)

- `tests/audit.spec.ts`, test "typed lowercase wordmark in header and footer...": asserted the old header (`.hdr__word`, five `.hdr__links`). Now `test.skip`; header/shell is covered by `tests/shell.spec.ts`.

## Footer (M3-a)

- `src/components/Footer.astro` rebuilt after Ale's Pie (`footer[data-pie]`); `ftr--field`, `ftr--compact`, `data-fr` removed. New spec: `tests/footer.spec.ts`. No Ale assets reused (logo is our own owner logo). No additional cases newly skipped; the already-skipped `.ftr__word` audit case and the site.spec axe describe was re-enabled in M11.

## Shell cleanup (M3-b)

- `Base.astro`: the `mountPageField` script is gone; the `pg-field` svg renders on home only (home runtime still queries it). Fonts: `--font-mono` added; Hero/Process use it. No specs asserted the old footer field or `.pg-field` on non-home pages, so no further cases were skipped.

## Rewritten specs

- `tests/language-flash.spec.ts`, `tests/reflow.spec.ts`: selector tweaks for the Ale header (desktop nav is `header .hdr__nav`; the mobile menu sheet `#site-nav` lists four links).

- `tests/about.spec.ts`: now asserts the About page only (the home page no longer carries `#about`); added a check that home has no `#about`.
- `tests/services-mosaic.spec.ts`: dropped the home picture-tile/hover/phone/no-JS tests (feature removed in ba8aa35); kept the service-visual data test and the 12 service-page tests, plus a single-h1 check.

## Home port, part a (M4-a, T5)

- `src/pages/[lang]/index.astro` now renders `HeroPortada` then `SeccionServicios` (`src/components/home/`); HomeMosaic is no longer used on home (files kept). Hero is a static SVG dot composition after Ale's HeroSenal (CSS pulse only, off under `prefers-reduced-motion`), no canvas and no new dependency.
- New spec: `tests/home.spec.ts` (es/en/de: section order by `data-home-*` hook, one h1, same-language service links, no overflow at 390/1440, static hero under reduced motion). Later tasks extend its `SECTIONS` list.
- `tests/about.spec.ts`: dropped the final assertion that home carries `#faq details` (old HomeMosaic FAQ). The About-page assertions stay.
- Assets reused from Ale's public/: none (odalo-web @ f137d06).

## Home port, part b (M4-b, T6)

- New `src/components/home/SeccionPlanes.astro` (`data-home-plans`, `id="planes"`) renders after SeccionServicios: website build one-off plus Base, Local, Captación, 360 (custom quote label, no number); all cells and the CTA link to `/{lang}/plans/`. Strings in `ui.ts` under `plans.teaser` (es/en/de).
- `tests/home.spec.ts`: `data-home-plans` added to SECTIONS and a plans case added.
- Assets reused from Ale public/: none (odalo-web @ f137d06). Specs newly skipped: none.

## Home port, part d (M4-d, T8)

- New `src/components/home/SeccionProyectos.astro` (`data-home-projects`, `id="proyectos"`) renders after SeccionKit: one card per entry in `src/content/projects.ts` (card picture via the existing `ConceptImage`, title, kind, badge), each linking to `/{lang}/work/{slug}/`, plus a link to `/{lang}/work/`. Strings in `ui.ts` under `projects` (es/en/de).
- `tests/home.spec.ts`: `data-home-projects` added to SECTIONS, plus a same-language work-links case and a no-Spanish case for en/de.
- Assets reused from Ale public/: none copied (our own project pictures from `public/work/concepts/` are used; odalo-web @ f137d06). Specs newly skipped: none.

## Plans port (M5, T10)

- `src/pages/[lang]/plans/index.astro` now renders, in order: `PlansHeader` (`data-plans-header`, the only h1), `PlanStepWeb` (`data-plans-step-web`, bordered 5/7 card, `?plan=web` link: the audit form already preselects from `?plan=`), `PlanStepMonthly` (`data-plans-step-monthly`, 3-column bordered grid from `src/content/plans.ts`, one `data-featured="true"` card, 360 card full width), the home `SeccionKit` (unchanged), our pending conditions + FAQ, and `PlansClosing` (`data-plans-closing`, dark, audit CTA + mailto). `Plans.astro` and `FinalCta.astro` are no longer used on this page (files kept, other pages use them). Strings: `ui.ts` `plans.page` (es/en/de).
- New spec: `tests/plans.spec.ts` (es/en/de: section order, one h1, every plan name/price, 360 full width, single recommended card, same-language audit links, no Spanish in en/de, no overflow at 390/1440).
- Old specs kept valid without edits (card ids `#plan-<id>`, `.plan__amount`, `.plan__per`, `.plan__cta` and the h1 text were preserved): offer, content, qa, site, reflow, pages-i18n, audit. Specs newly skipped: none.
- Assets reused from Ale's public/: none (odalo-web @ f137d06). The dotted "Planes" word art was not ported (canvas, no new dependency).
- Verify: `npm.cmd run verify` exited with 360 passed, 141 skipped, 0 failed.

## Service pages port (M6, T11)

- `src/pages/[lang]/services/[service]/index.astro` is now one template for web/local/video/ads from `src/content/services.ts`. Sections in order (components in `src/components/services/`): `ServiceHero` (`data-svc-hero`, dotted background, 7/5 split, only h1, audit CTA, our `ConceptImage` marked as an example by its badge/caption), `ServiceDeliver` (`data-svc-deliver`, bordered 3-column grid, mono indexes), `ServiceProcess` (`data-svc-process`, steps with a progress line from the existing `process` strings), `ServicePlan` (`data-svc-plan`, rows from `plansFrom(relatedPlan)`, ghost link to plans, BuildNote on web), `ServiceFaq` (`data-svc-faq`, wraps `Faq.astro`), `ServiceClosing` (`data-svc-closing`, wraps home `SeccionContacto`). `PageHero`, `WorkMosaic` and `FinalCta` are no longer rendered there (files kept). No new i18n strings were needed. No animations.
- New spec: `tests/services.spec.ts` (4 services x es/en/de: section order, one h1, deliverables and plans from data, same-language links, no overflow at 390/1440).
- Selector updates: `tests/offer.spec.ts` (`.relplan__*` to `data-svc-plan-*`), `tests/content.spec.ts` (`.ph` CTA to `[data-svc-hero]`; the "service pages ... example/proposed-scope disclosure" case was re-enabled for service pages only, home-panel part dropped), `tests/services-mosaic.spec.ts` (`.ph` to `[data-svc-hero]`).
- Specs newly skipped: none.
- Assets reused from Ale's public/: none (odalo-web @ f137d06).

## M8 audit page (T13)
- `src/pages/[lang]/audit/index.astro` now follows Ale's `/auditoria` (odalo-web @ f137d06; read from the local design copy): a paper section with a decorative line grid (`data-audit-decor`, aria-hidden, pointer-events none); `data-audit-intro` (5 cols at 1440: mono tag with the arrow marker, the only h1, lead, bordered numbered review list `data-audit-review` from the existing `audit.mosaic.pieces` n/s copy, email/phone alternative `data-audit-alt` with the altPending fallback), then `data-audit-form-card` (7 cols, rounded bordered surface card with soft shadow, `id="request"`) wrapping the unchanged `AuditForm.astro`. One column at 390. `AuditMosaic` and the dark/sand `am-req` block are no longer rendered (files kept). The stone-path visual was not ported (optional).
- New strings: `audit.eyebrow` and `audit.reviewLabel` (es/en/de).
- `AuditForm.astro`: only visual tokens changed (field radius, border weight, legend rule); Netlify attributes, field names, validation, transport and states are untouched.
- New spec: `tests/audit-page.spec.ts` (es/en/de: hook order, one h1, review list, Netlify attributes and pageLanguage, email alternative, aria-hidden decoration, no overflow at 390/1440, no-JS and reduced-motion visibility).
- Dropped AuditMosaic preselection: the focus/plan summary, "No preference" clear button and tile selection UI are gone. `?service=` and `?plan=` still preselect the form selects (that logic lives in `AuditForm.astro`); the services/plans links keep working.
- Newly skipped in `tests/audit.spec.ts` (all assert AuditMosaic or the am-req summary): "one scope line..."; describe "state contract (desktop)" (6 cases incl. entrance reveal); no-JS "all explanations readable in flow..."; "reduced motion: no hover or open transitions...". Still-valid cases there were updated to form-only selectors (query init, back navigation, simulated submit, boundary, service select).
- `tests/delivery.spec.ts`: selectors only (`.am-alt` to `[data-audit-intro]`, mosaic include replaced by `selectOption('#f-service')`); nothing skipped. No change needed in site, content, qa, offer, legal, services-mosaic, reflow.
- Assets reused from Ale's public/: none (odalo-web @ f137d06).

## M7 about page (T12)
- `src/pages/[lang]/about/index.astro` now renders five sections from `src/components/about/`: `AboutHero` (`data-about-hero`, dotted background, mono tag, only h1, audit CTA, aria-hidden illustrative SVG), `AboutServices` (`data-about-services`, bordered grid 4 cols at 1440 / 1 col at 390, services from `src/content/services.ts`), `AboutPrinciples` (`data-about-principles`, `#pr-h`, numbered grid from `t.about.principlesItems`), `AboutStudio` (`data-about-studio`, studio eyebrow/intro and the language links), `AboutClosing` (`data-about-closing`, wraps home `SeccionContacto`). `About.astro`, the sand principles block and `FinalCta` are no longer rendered there (files kept). No new i18n strings. No animations.
- `tests/about.spec.ts` rewritten as the new structure spec (es/en/de: section order, one h1, service links, principles count, same-language audit links, no overflow at 390/1440, no-JS/reduced-motion visibility, keyboard and language switch, decorative visual hidden).
- Newly skipped: `tests/about.spec.ts` old "about: one connected mosaic" group, now the single `test.describe.skip('retired: mosaic replaced by Ale design')` block (asserted the old mosaic tiles and 200% panels). No other spec cases skipped; other specs touching `/about/` (qa `#pr-h`, reflow, site, footer, shell, pages-i18n) needed no selector change.
- Assets reused from Ale's public/: none (odalo-web @ f137d06); the illustrative SVG is our own.

## M10-a work index and 404 (T15)
- `src/pages/[lang]/work/index.astro` now renders `data-work-intro` (mono tag with the arrow marker, the only h1, lead), `data-work-list` (one card per project in `src/content/projects.ts`, ConceptImage, title, kind, badge, link to `/{lang}/work/{id}/`) and `data-work-closing` (home `SeccionContacto`). `PageHero`, `WorkMosaic` and `FinalCta` are no longer rendered there (files kept).
- `src/pages/404.astro`: `data-nf-intro` with a mono 404 tag, one h1, body text and one hreflang home link per language; noindex and English shell kept.
- New spec: `tests/work.spec.ts` (work index es/en/de and the 404 page). Project pages are the next task (M10-b).
- Specs newly skipped: none. Existing specs were not edited.
- Assets reused from Ale's public/: none (odalo-web @ f137d06).

## M10-b project pages (T16)
- `src/pages/[lang]/work/[project]/index.astro` now renders `data-project-intro` (mono tag `kind · badge`, the only h1, lead, back link to `/{lang}/work/`), `data-project-media`, `data-project-body` (bordered surface cards, service chips, outcomes for non-concept), optional `data-project-shots` / `data-project-creatives` / `data-project-plan`, `data-project-next` and `data-project-closing` (home `SeccionContacto`). PageHero, FinalCta and the `.cs__block` tiles are gone from these pages (component files kept).
- `tests/work.spec.ts` extended with project-page cases for es/en/de.
- Specs newly skipped: none. Existing specs were not edited.
- Assets reused from Ale's public/: none (odalo-web @ f137d06).

## Axe (M11)
- `tests/site.spec.ts` describe "accessibility (axe, WCAG 2.2 AA tags)" is re-enabled (no longer skipped). Routes: es/en/de × `/`, `/plans/`, `/services/{web,local,video,ads}/`, `/about/`, `/audit/`, `/privacy/`, `/cookies/`, `/legal/`, `/work/`, `/work/sample-clinic/`, plus `/404.html`. Filter: serious/critical, tags wcag2a/wcag2aa/wcag21aa/wcag22aa.
- First run found two real colour-contrast defects, both fixed in `src/styles/global.css` with existing tokens: (1) the footer language links (`.on-dark a.lang__item`) were at 0.72 opacity on ink, now opacity 1; (2) the home `.pg--home` wrapper still painted the retired mosaic's ink backdrop (field.css) behind the paper sections, so rust text failed; it is now `var(--paper)`.
- No rules disabled, no exclusions, no token value changes (fixes not confirmed by a local run: the coder could not execute Playwright; the runner's verify decides).

## Final QA (M11)
Screenshots are written by `tests/qa-shots.spec.ts` (runs inside `npm.cmd run verify`) to `docs/qa/2026-11-24/screens/{lang}-{page}-{width}.png`, full page, viewports 390x844 and 1440x900, languages es/en/de, cookie banner suppressed via localStorage `odalo.cookies=essential`. Each case also asserts exactly one h1 and no horizontal overflow. The 404 page is shot once per width as `404-{width}.png`. Project pages come from `src/content/projects.ts` (sample-hotel, sample-clinic, sample-shop).

| Page | Languages | Widths | Screenshot path | Ale source (inbox/odalo-web-design/src/app/...) |
|---|---|---|---|---|
| home | es, en, de | 390, 1440 | `screens/{lang}-home-{width}.png` | `[lang]/page.tsx` |
| plans | es, en, de | 390, 1440 | `screens/{lang}-plans-{width}.png` | `[lang]/planes/page.tsx` |
| services web/local/video/ads | es, en, de | 390, 1440 | `screens/{lang}-services-{id}-{width}.png` | `[lang]/servicios/[servicio]/page.tsx` |
| about | es, en, de | 390, 1440 | `screens/{lang}-about-{width}.png` | studio idiom of `[lang]/page.tsx` (no separate about page in Ale's app) |
| audit | es, en, de | 390, 1440 | `screens/{lang}-audit-{width}.png` | `[lang]/auditoria/page.tsx` |
| privacy, cookies, legal | es, en, de | 390, 1440 | `screens/{lang}-{privacy,cookies,legal}-{width}.png` | `[lang]/[legal]/page.tsx` |
| work index | es, en, de | 390, 1440 | `screens/{lang}-work-{width}.png` | no counterpart in Ale's design |
| projects (sample-hotel, sample-clinic, sample-shop) | es, en, de | 390, 1440 | `screens/{lang}-work-{id}-{width}.png` | no counterpart in Ale's design |
| 404 | n/a | 390, 1440 | `screens/404-{width}.png` | no counterpart in Ale's design |

- Reference screenshots of Ale's Next.js site could not be rendered: that needs his dependencies installed, which would touch odalo-web or add packages here, both forbidden. Ale's `public/lab` images are not used as references.
- Verify counts: the final runner verify exited 0 with 654 passed, 120 skipped, 0 failed (562 earlier + 92 qa-shots cases = 3 langs x 15 pages x 2 widths, with 404 included at each width; runner verify 2026-11-15T21:01Z).
- Axe: green on all routes (see "Axe (M11)"), no rules disabled, no exclusions.
