# Odalo — Developer Handoff and Acceptance Criteria

## Content architecture

Keep content separate from layout.

Editable records should cover:

- Services.
- Plans and inclusions.
- Projects.
- Team members.
- FAQs.
- Contact information.
- Localized page copy.
- Commercial conditions.
- Legal content.

Use stable internal IDs so renaming a service or plan does not break links, form selections, or analytics.

The mosaic should tolerate longer titles, different prices, and revised descriptions without requiring a complete redesign.

## Localization

- Every published page has Spanish, English, and German content.
- Include translated navigation, form errors, confirmation messages, metadata, accessibility labels, and legal content.
- Language switching opens the equivalent page where available.
- If an equivalent translation is unavailable, offer a clearly identified fallback.
- Allow approximately 30–40% extra space for longer translations.
- Format prices and dates for the selected language.
- Do not bake text into images.

## SEO

- Unique page titles and descriptions.
- One descriptive H1 per page.
- Indexable service content.
- Correct canonical and language-alternate relationships.
- Sitemap covering published localized routes.
- Share images and descriptions.
- Verified organization information only.
- Useful missing-page experience.

Do not fabricate review ratings or client outcomes in structured data.

## Performance budgets

Proposed launch targets:

- LCP: at most 2.5 seconds.
- INP: at most 200 ms.
- CLS: at most 0.1.
- Initial homepage transfer: approximately 1.5 MB or less, excluding user-requested video.
- Initial compressed JavaScript: target 200 KB or less.

Reserve image dimensions, load below-fold media progressively, and prioritize the hero image.

Render useful content before animation initializes. Avoid background video as a dependency for the first impression.

Confirm performance in representative device testing; validate field performance when sufficient traffic exists.

## Analytics

Track:

- Audit CTA selection.
- Service exploration.
- Full service visits.
- Plan selection.
- Form start.
- Confirmed submission.
- Submission failure.

Useful dimensions: language, service ID, plan ID, and CTA location.

Do not include names, emails, phone numbers, or free-text form content in analytics.

Analytics behavior must follow the approved privacy and consent configuration.

## Required design deliverables

Before implementation sign-off, prepare:

1. Homepage layouts at 1440, 834, and 390 px.
2. Service page and audit page layouts.
3. Plans and case-study templates.
4. Component sheet with interaction states.
5. Service mosaic prototype showing all four expansions.
6. Touch and keyboard interaction demonstrations.
7. Reduced-motion behavior.
8. Brand assets and image crop guidance.
9. Localized content inventory.

These are required follow-on deliverables; this written specification is not a substitute for a tested visual prototype.

## Implementation order

1. Establish brand tokens and semantic content structure.
2. Build static responsive page layouts.
3. Add service exploration and navigation.
4. Add coordinated mosaic motion.
5. Add editable content and localization.
6. Connect and verify forms.
7. Complete accessibility, performance, and launch checks.

## Acceptance criteria

The website is ready when:

- Odalo’s logo, palette, and typography personality are recognizable.
- Mosaic geometry shapes the hero, services, work, process, and pricing.
- Service tiles enlarge by moving shared boundaries.
- Neighboring tiles remain readable and operable.
- Hovering does not shift sections below the service mosaic.
- Touch and keyboard users can access every service detail.
- Reduced-motion settings preserve full functionality.
- Essential content remains available if animation fails.
- Spanish, English, and German layouts handle longer copy.
- No content clips at narrow widths or enlarged text.
- Pricing inclusions match the approved content.
- Demo work and prices are identified clearly.
- Forms distinguish simulated and real delivery.
- Real submission success is backed by confirmed delivery.
- No client claims, team identities, or commercial conditions are invented.
- Performance and accessibility checks meet the agreed targets.

## Outstanding inputs

| Input | Current status |
|---|---|
| Original font names/files | Unconfirmed |
| Original vector logo | Required |
| Exact brand colors | Provisional |
| Final service wording | Demo |
| Final prices and conditions | Demo |
| Real projects and outcomes | Required for production |
| Team details and photography | Required for production |
| Contact details and enquiry destination | Required |
| Approved privacy and legal content | Required |
| Final translations | Review required |

**The central design requirement:** the mosaic must behave as one connected composition. Its pieces change emphasis as visitors explore, while the content remains clear, accessible, and easy to act on.
