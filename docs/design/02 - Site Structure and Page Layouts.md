# Odalo — Site Structure and Page Layouts

## Navigation and routes

Use language-prefixed routes:

| Page | Route pattern |
|---|---|
| Homepage | `/{language}/` |
| Service detail | `/{language}/services/{service}` |
| Plans | `/{language}/plans/` |
| Work index | `/{language}/work/` |
| Case study | `/{language}/work/{project}/` |
| About | `/{language}/about/` |
| Audit request | `/{language}/audit/` |
| Privacy, cookies, legal | Localized supporting routes |

Supported language codes: `es`, `en`, `de`.

For the demo, use English as the root fallback for the worldwide audience. Preserve the visitor’s explicit language choice.

Homepage navigation:

**Services · Plans · How we work · Work · About · Free audit**

On the homepage, appropriate items can scroll to sections. From other pages, they should lead to the corresponding destination.

Language controls use **ES / EN / DE**, with accessible full language names. Do not use national flags to represent languages.

## Homepage composition

### 1. Header

Paper background, logo left, navigation center/right, language control, navy audit button.

- Desktop height: approximately 88 px.
- Mobile height: approximately 72 px.
- Sticky during scrolling.
- Mobile menu opens through a clearly labeled button.
- Sticky navigation must leave anchor headings and keyboard focus visible.

### 2. Hero — the first mosaic

A large editorial text panel joins a smaller visual mosaic.

```text
┌─────────────────────────┬────────────┬────────────┐
│                         │ Work image │ Geometric  │
│ Headline                │            │ panel      │
│ Description             ├────────────┴────────────┤
│ Primary + secondary CTA │ Video / content image   │
│                         ├────────────┬────────────┤
│                         │ ES EN DE   │ Brand shape│
└─────────────────────────┴────────────┴────────────┘
```

Desktop: text occupies roughly seven of twelve columns; imagery occupies five.

The visual mosaic should show how Odalo connects creative work and business outcomes. Avoid filling it entirely with abstract shapes.

**Proposed Spanish copy**

Eyebrow: “ESTUDIO DIGITAL PARA NEGOCIOS QUE QUIEREN CRECER”

Headline: “Te llevamos hasta *tus clientes.*”

Body: “Web, vídeo y anuncios que trabajan juntos para acercar tu negocio a las personas adecuadas. Un solo equipo, una estrategia clara.”

Primary CTA: “Pide tu auditoría gratis”

Secondary CTA: “Explora nuestros servicios”

The headline and actions remain visible from the first render. Hero animation applies to supporting visual pieces.

### 3. Services — the main interactive mosaic

Heading: “Cada pieza cuenta. *Juntas llegan más lejos.*”

Four unequal, interlocking panels:

```text
┌──────────────────────────┬───────────────────┐
│ A — Web                  │ B — Visibilidad   │
│ Larger landscape panel   │ local             │
├───────────────────┬──────┴───────────────────┤
│ C — Vídeo         │ D — Publicidad            │
│                   │ Larger landscape panel   │
└───────────────────┴──────────────────────────┘
```

Every tile contains:

- Service number.
- Service name.
- One-sentence outcome.
- Distinct geometric or photographic visual.
- “Explore” button.
- Persistent link to the full service page.

Detailed behavior is defined in [[03 - Mosaic Interaction and Motion]].

### 4. Work — evidence mosaic

One featured project, two supporting projects, and one short explanatory panel.

Featured project content:

- Project title.
- Business context.
- Services used.
- One verified result, where available.
- Link to case study.

For the demo, use clearly labeled example projects. Omit invented performance figures and testimonials.

### 5. How we work — four connected pieces

Retain the reference process:

1. Free audit.
2. Fixed proposal.
3. Launch.
4. Monthly report.

Arrange the four panels in a stepped composition. Use a subtle connector that visually joins them.

Each panel has a number, title, and short description. The order remains clear without animation.

Heading: “Cuatro pasos. *Todo conectado.*”

### 6. Plans — a structured pricing mosaic

Sand section background with unequal panel proportions.

Suggested desktop composition:

- Base: narrow, simple panel.
- Local: slightly larger panel.
- Captación: prominent navy panel.
- 360: broad panel spanning beneath the first row.

Include a separate, readable comparison below the mosaic so visitors can compare inclusions directly.

All prices and key inclusions remain visible without hover.

Heading: “Precios claros. *Elige tus piezas.*”

### 7. About — the people behind the pieces

Use a studio or team image beside a navy story panel and a smaller language panel.

Communicate:

- How Odalo collaborates.
- What clients can expect.
- Remote, international working.
- Available languages.

Names, biographies, locations, and portraits remain pending until supplied. Avoid fictional team members.

### 8. FAQ

Six to eight plain accordion questions:

- Can I hire one service?
- What is included in each plan?
- Is advertising spend included?
- Can you work with my existing website?
- Do you work internationally?
- Which languages do you support?
- Can I change my plan?
- What does the free audit include?

Answers must match the confirmed offer.

### 9. Final conversion mosaic

Large navy text panel joined to a coral geometric panel.

Heading: “Vamos a encajar *las piezas de tu negocio.*”

Supporting line: “Cuéntanos qué necesitas y empezamos por una auditoría.”

Audit CTA plus verified contact details.

### 10. Footer

Logo, navigation, language selector, contact details, legal links, and cookie preferences where applicable.

Use one decorative mosaic strip to close the page.

## Secondary page templates

**Service page:** outcome-led hero → deliverables → working process → relevant work → related plans → FAQ → audit CTA.

**Plans page:** pricing mosaic → full comparison → inclusions and exclusions → confirmed commercial conditions → FAQ → enquiry CTA.

**Case study:** context → challenge → connected services → work imagery → verified outcomes → related project → CTA.

**About page:** studio story → people → working principles → international collaboration → CTA.

**Audit page:** clear explanation of the audit → short form → expectations → contact alternative.
