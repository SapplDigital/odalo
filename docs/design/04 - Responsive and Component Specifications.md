# Odalo — Responsive and Component Specifications

## Breakpoints

| Range | Layout |
|---|---|
| Below 768 px | Mobile |
| 768–1023 px | Tablet |
| 1024 px and above | Desktop |

The layout must also adapt to text enlargement and available content width. Do not rely only on device categories.

## Desktop

- Twelve-column underlying grid.
- Asymmetric hero and service composition.
- Full navigation when it fits.
- Unequal pricing and portfolio panels.
- Animated service boundaries.

## Tablet

- Eight-column underlying grid.
- Earlier navigation collapse if labels become crowded.
- Hero text above or beside a simplified visual mosaic.
- Services in two columns.
- Exploration details below the service group.
- Reduced panel movement.

## Mobile

- Four-column underlying grid.
- Hero text first, visual mosaic second.
- Services in a single readable column.
- Alternate wide photographs, curved decorative edges, and color treatments to retain the mosaic personality.
- Plan panels stacked in the order Base, Local, Captación, 360.
- Process displayed vertically.
- Portfolio featured image followed by smaller project panels.

The composition should be designed for mobile rather than compressed from desktop.

## Component inventory

| Component | Required states |
|---|---|
| Header | Desktop, mobile, menu open, scrolled |
| Language selector | Current language, alternate language |
| Primary button | Rest, hover, focus, pressed, disabled, loading |
| Secondary button | Rest, hover, focus, pressed |
| Service tile | Rest, hover, focus, selected |
| Service details | Closed, open |
| Plan panel | Standard, recommended |
| Project panel | Rest, hover, focus |
| FAQ item | Collapsed, expanded |
| Form field | Empty, filled, focus, invalid, disabled |
| Submission feedback | Sending, success, failure |
| Cookie controls | Initial choice, preferences, saved choice |
| Error page | Missing page, navigation recovery |

## Accessibility target

Target WCAG 2.2 AA, including keyboard access, visible focus, meaningful reading order, contrast, and reflow. Follow the [W3C requirements](https://www.w3.org/WAI/WCAG22/quickref/).

Project specifications:

- Minimum 44 × 44 px intended touch area for primary controls.
- Text contrast of at least 4.5:1 for normal text.
- Required interface boundaries and focus indicators remain distinguishable.
- Decorative mosaic shapes are ignored by screen readers.
- Informative images have useful alternative text.
- Heading levels follow content hierarchy.
- Panels do not communicate selection through color alone.
- No information requires hovering.
- No clipping at 200% text enlargement.
- No horizontal page scrolling at a 320 px viewport.
