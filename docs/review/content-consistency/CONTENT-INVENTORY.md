# Content inventory: enquiry journey, FAQs and service disclosures (task 16)

Method: rendered EN/ES/DE pages were crawled (`tests/content.spec.ts`: 3 languages x home, plans, work, about, audit, legal pages, 4 service pages and 3 case studies, with every internal link requested) and the content sources (`src/i18n/ui.ts`, `src/content/*.ts`, components) were read for the strings below. "Visitor-facing" means rendered on a route in the default (no delivery endpoint) build. Owner decision (this task): **the free audit is an approved Odalo offer**, so free-audit labels stay; its detailed scope, format and response time are **unconfirmed** and are not promised anywhere.

## 1. Visitor-facing content

| Route / placement | Key / current wording | Correction made, or reason retained | Outstanding owner approval |
|---|---|---|---|
| Header CTA, footer nav, breadcrumbs, audit eyebrow (all routes) | `nav.audit` "Free audit" / "Auditoría gratis" / "Gratis-Analyse" | Retained (approved offer). Label agrees on every crawled page. | Offer name and wording |
| Home hero primary button; service page hero button | `hero.primary`, `common.requestAudit` "Request your free audit" | Retained (approved offer). Href, `data-track`, `?service=` preselection unchanged. | None |
| Home closing CTA (all pages with FinalCta) | `cta.bodyDemo` / `cta.buttonDemo` "View example enquiry form" (task 15) | Retained: states the form is an example/simulation. Configured delivery keeps `cta.body` / `cta.button`. | CTA wording for live delivery |
| `/audit/` heading | `audit.h1` "Request your free audit." | Retained (approved offer). | None |
| `/audit/` lead | `audit.lead` (demo) "The free audit is an Odalo offer. Until delivery is connected this form only simulates a submission: try it with sample details. Nothing is sent and no reply is requested." (ES/DE equivalents) | **Replaced** the original ("We look at what a customer sees... send you a short, clear review"), which promised a format and a reply. Original kept for the configured branch. | Audit scope, format, response time |
| `/audit/` aside "What happens next" | `audit.expectH`, `audit.expect` (demo): form checks the fields; a simulated confirmation appears; entries stay visible; nothing is delivered and no reply is requested | **Replaced** the three promises ("We read your request / prepare the audit / contact you"). Now 4 items. | Real process once delivery exists |
| `/audit/` note under the steps | `audit.noPromise` (demo) "Please use sample details. The scope, format and timing of the audit are not confirmed yet." | **Replaced** ("We have not set a response time yet..."): now also names scope and format as unconfirmed. | Scope, format, timing |
| `/audit/` form button and progress | `audit.submit` / `audit.sending` (demo) "Try demo submission" / "Simulating…" | **Replaced** "Request audit" / "Sending…" in demo mode only; behaviour, validation, payload, retained entries and result semantics untouched. | None |
| `/audit/` result | `audit.simulatedSuccessH` / `simulatedSuccess` "Simulated submission ... nothing was sent" | Retained (already honest). `successH`/`success` ("Request received... will contact you") stay for the configured branch only. | Success wording for live delivery |
| `/audit/` demo notice | `audit.demoNotice` "Demo mode: no delivery service is connected..." | Retained. | None |
| `/audit/` metadata | `meta.audit.title` "Request a free audit"; description (demo) "Request a free audit. In this demo the enquiry form only simulates a submission: nothing is sent." | Description **replaced**; title retained (approved offer). | None |
| `/audit/` alternative contact | `audit.altPending` | **Replaced** "Contact details will be added once confirmed" with "Contact details are not published in this demo." (all languages). | Public contact details |
| `/audit/` privacy tick | `audit.fields.privacy` "(draft placeholder)" | Retained: honest draft disclosure; privacy wording is outside this task. | Privacy text |
| Home metadata | `meta.home.description` | **Removed** "international digital studio" (unconfirmed claim) in all languages. | Business positioning |
| FAQ (home, plans, service pages) | `one-service` | **Reframed** as the example plan structure ("could start... would be proposed and agreed"). | Real plan structure |
| FAQ | `plan-includes` | Retained: already says examples, to be confirmed. | Plans |
| FAQ | `ad-spend` | **Reframed**: example plans, spend "would be paid directly", proposal to be confirmed. | Ad-spend terms |
| FAQ | `existing-website` | **Reframed** from "in the audit we review..." to a proposed first step (no audit deliverable promised). | None |
| FAQ | `international` "Do you work internationally?" | **Replaced** by `concept-work` "What are the example projects?" (Casa Almina, Tidewell, Brindle Pantry: three self-initiated concepts for fictional businesses, not client work, no client results). ID changed and all references updated (`services.ts` local service). | Operating model, markets |
| FAQ | `languages` "Which languages do you support?" "We work in Spanish, English and German" | **Replaced**: describes the website's three versions only; project language coverage "not yet defined"; no staff-fluency claim. | Delivery languages |
| FAQ | `change-plan` | Light edit ("would be set out in a proposal"); still says conditions are not defined. | Change/cancellation terms |
| FAQ | `audit-includes` | **Replaced**: free audit is an Odalo offer; scope, format and response time not confirmed; the demo form only simulates a submission; sample details; nothing sent. Original-style sentence 1 kept for the configured branch (`aConfigured`). Removed the "short video" and "It is free" promises. | Audit scope, format, response time |
| Service pages: "What you get"; home service detail panels | deliverables (e.g. "Two reels per month (Captación plan)", "Monthly report", "Google posts") | Values **unchanged** (no quantity, price or inclusion edited). **Added** `services.exampleScope` disclosure (all languages): quantities and inclusions come from the example plans and are proposed scope, not confirmed commitments. | Real inclusions |
| Plans page | prices, comparison, "Example prices" note, conditions "not settled" | Retained (honest example disclosures; data not to be changed). | Prices, tax wording, conditions |
| Home "How we work" | process note and four steps (task 14) | Retained (proposed workflow wording). | Real engagement stages |
| Home/About/Work | concept labels, "Concept work", About principles | Retained (approved in earlier tasks). | None |
| Case studies | "No verified results yet..." (`work.outcomesPending`), produced-versus-proposed blocks, provenance | Retained. | None |
| Legal pages | DRAFT banner, "Content pending approval", `noindex` | Retained. Cookie-page heading already corrected (task 15). | Approved legal text |
| Footer, Browser storage disclosure | approved copy | Retained. | Production policy |
| Hero eyebrow/body | "Digital studio for businesses that want to grow"; "One team, one clear strategy." | Retained: positioning copy, no operating claim. Flag for the copy review. | Positioning |

## 2. Strings present in source but not visible in the default build

| Source | Why not visible | Handling |
|---|---|---|
| `cta.body`, `cta.button`; `audit.lead`, `expect`, `noPromise`, `submit`, `sending` originals; `audit.success` | used only when `PUBLIC_AUDIT_ENDPOINT` is set (configured delivery) | Kept unchanged for that branch; owner to approve live wording with the delivery decision |
| `faqs[].aConfigured` (`audit-includes`) | configured branch only | Neutral, no promise |
| `work.imageryNote` ("Geometric placeholder artwork...") | rendered only for a project with no card image; all three projects have images | Left; remove if a no-image project is never added |
| `Art` variant `studio`, `common.sample/sampleNote`, `common.back` | not rendered on current routes | Left (out of scope) |
| Source comments ("DRAFT translations", "DEMO CONTENT", handoff references) | not rendered | Left; they accurately describe status |

## 3. Unresolved owner decisions (recorded, not invented)
1. Scope, format and response time of the free audit.
2. Delivery of live enquiries to **both** sebastian.appl@sappl-digital.de and bastiappl12@gmail.com (recorded in HANDOFF.md; not published, not implemented).
3. Which contact details, if any, to publish.
4. Real plan structure, inclusions (including "Monthly report"), ad-spend and change/cancellation terms.
5. Delivery languages for client work (the site's own three languages are stated as fact).
6. Privacy and legal texts; production consent policy.
7. Business positioning wording in the hero eyebrow/body.
