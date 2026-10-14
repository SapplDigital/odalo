# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Owners of small businesses who need a website, local visibility, video or advertising and want clear services and prices.
- Marketing leads at mid-size companies who compare agencies and prefer one coordinated offer over several vendors.
- Worldwide audience; the site is in Spanish, English and German.

## Product Purpose
Odalo's website explains what the agency offers, shows how the services work together, and gives visitors an easy way to start a conversation.
Primary conversion: request a free audit. Secondary: explore services and plans.

## Positioning
Different pieces, one connected result. Websites and maintenance, local SEO and Google presence, video and content, and paid advertising are sold as coordinated services with published monthly plans.

## Operating Context
Static, content-led marketing site built with Astro and TypeScript. Content lives in typed files (`src/content/`, `src/i18n/ui.ts`) so services and prices can be edited later. Hosted as a GitHub Pages demo (noindex).

## Capabilities and Constraints
- Three languages (es, en, de) with language-prefixed routes.
- Four service families inferred from the reference plans; final names and scope can change.
- JavaScript budget of 200 KB or less; interactivity is progressive enhancement.
- Undecided: German tone of address (currently informal "du"), final contact details, delivery endpoint for forms.

## Brand Commitments
Existing navy, coral and cream palette, geometric typography with expressive italics, and the mosaic logo. Personality: creative, approachable, confident, warm, organized, international.

## Evidence on Hand
All commercial content (services, prices, inclusions, projects) is demo content and is labelled as such. No real testimonials, client names, benchmarks or contact details exist; future work must not invent them. Spanish and German copy are drafts needing native review.

## Product Principles
1. Show how the pieces connect: every page should make the combined result clear, not just individual services.
2. Clear prices and services: no hidden conditions; open commercial questions are shown as "to be confirmed".
3. One obvious next step: the free audit.
4. Never fabricate proof or commitments while content is placeholder.

## Accessibility & Inclusion
Responsive layouts that survive larger text and the longest (German) copy; axe checks run in the test suite.
