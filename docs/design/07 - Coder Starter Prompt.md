# Odalo — Coder Starter Prompt

Copy the prompt below into the coding agent’s chat. It authorizes implementation of the demo described in the design handoff.

---

You are the developer building the new website for **Odalo**, an international digital agency. Start implementing a polished, runnable demo using the design documents below. Continue through a working, reviewable result; do not stop after proposing a plan or creating an empty scaffold.

## Workspace and source documents

Implement the website in:

`C:\Users\basti\OneDrive\Documentos\ChatGPT\odalo`

The authoritative design handoff is in:

`C:\Vault\Projects\odalo\Website Design`

Read these documents in order before implementation:

1. `00 - Project Brief.md`
2. `01 - Brand and Visual System.md`
3. `02 - Site Structure and Page Layouts.md`
4. `03 - Mosaic Interaction and Motion.md`
5. `04 - Responsive and Component Specifications.md`
6. `05 - Content, Plans, and Forms.md`
7. `06 - Developer Handoff and Acceptance Criteria.md`

Inspect all three images in the `References` subfolder. They establish the existing brand personality, logo, typography, colors, and demo plans. They are references, not an instruction to duplicate their old layouts.

The brief’s “planning and specifications only” statement describes the earlier planning task. This prompt now authorizes website implementation. Worldwide positioning overrides the screenshots’ Canary Islands positioning. The current task is a demo, with the existing services and plans editable later.

Inspect repository instructions and existing files first. Preserve any existing work. Use the established stack if present. If the repository is empty, choose a straightforward, maintained stack suitable for an accessible, localized agency website, briefly explain the choice, and proceed. Keep application source separate from the design documents.

## Creative direction

The central concept is **a living mosaic: different pieces, one connected result**.

Build a distinct website where the logo’s squares, circles, semicircles, quarter-circles, and shared edges shape the composition. Use asymmetric panel sizes, warm whitespace, navy structure, coral emphasis, and carefully placed imagery.

Preserve the recognizable lowercase Odalo wordmark and coral dot. Use original brand assets if available. Otherwise, use a clearly documented temporary asset based on the reference rather than inventing a different identity. The specified colors and Outfit / Instrument Serif pairing are provisional matches; make replacement with the original assets easy.

The mosaic must structure the hero, services, work, process, and plans. Avoid a generic template made of equal rounded cards. Keep text in readable regions, even when decorative shapes move.

## Main interaction

Implement the service mosaic exactly around the behavior in Document 03:

- Four service panels: web and maintenance, local visibility, video and content, paid advertising.
- Unequal resting proportions.
- Hovering or focusing a service enlarges its panel by moving its shared edge and contracting its neighbor.
- Keep neighboring titles, descriptions, and actions readable.
- Animate the panel boundaries, without scaling the text.
- Keep the mosaic container height stable during desktop hover so subsequent sections do not jump.
- Prevent flickering near moving boundaries.
- Explicit exploration buttons reveal a shared detail region. Full service links remain independent.
- Support keyboard, touch, and reduced motion from the start.
- On mobile, use deliberate vertical expansion and maintain reading order.

Treat this interaction as the first visual milestone. Test it at desktop and mobile sizes, then use its visual language throughout the site. Do not pause the implementation just to request approval for routine design choices.

## Demo scope

Deliver the complete homepage and working routes/templates for services, plans, work, case studies, about, and audit requests, as described in Document 02.

The homepage includes navigation, hero, interactive services, sample work, four-step process, pricing mosaic, about, FAQ, final CTA, and footer.

Support Spanish, English, and German with language-prefixed routes. Use English as the demo root fallback and preserve explicit language selection. Translate visible interface copy, validation messages, metadata, and accessibility labels. Keep translations in editable content files and identify drafts needing native review in the handoff.

Retain the demo plans and inclusions from Document 05:

- Base: €59/month.
- Local: €290/month.
- Captación: €590/month.
- 360: €1,290/month.

Highlight Captación and show that prices are examples. Selecting a plan preselects it on the audit form. Keep services, plans, prices, FAQs, and copy separate from layout, with stable IDs.

Use clearly labeled sample projects where real work is missing. Do not invent client results, testimonials, team identities, contact details, or commercial commitments. Use geometric artwork and approved available imagery where assets are missing; document replacement points.

The audit form should have useful validation and accurate submission states. Without a configured delivery backend, make submission explicitly simulated and do not claim an email was sent. Keep the eventual delivery integration isolated and documented. Prepare legal-content placeholders without presenting draft text as an approved policy.

## Quality and validation

Follow the accessibility and performance targets in the handoff. Use semantic content, visible keyboard focus, adequate contrast, stable reading order, and appropriately sized controls. Essential content must remain available when motion is disabled or fails.

Run relevant build, lint, and behavioral checks. Verify in a browser at 1440, 834, and 390 px, and check 320 px reflow and enlarged text. Capture screenshots and inspect the actual composition; correct clipping, collisions, weak hierarchy, and awkward translated layouts.

Verify all four service expansions, boundary stability, keyboard operation, touch behavior, reduced motion, language switching, plan preselection, and form validation. Report measured performance honestly; do not claim field performance from local testing.

Use the running demo and screenshots to supply the visual review artifacts described in Document 06. Record remaining brand, copy, backend, and legal inputs without allowing those production dependencies to block the demo.

## Deliverables

Finish with:

1. A runnable website with clear installation and local-development instructions.
2. A browser-accessible local preview and inspected screenshots.
3. An implementation handoff describing the architecture, editable content, localization, and replacement assets.
4. The checks performed, their results, and any unresolved issues.
5. A concise list of what remains before production launch.

Work autonomously on reversible implementation decisions. Ask only when a missing answer materially blocks progress. Keep the work local; this prompt does not request public deployment.
