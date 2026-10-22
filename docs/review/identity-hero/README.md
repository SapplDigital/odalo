# Task 02: stable header identity + hero animation (evidence)

Before: `before-{1440,834,390,320}-{top,hero-full}.png` (animated header logo, generic hero illustrations).
After: `after-{1440,834,390,320}-en-{top,hero}.png`, `after-{390,320}-de-{top,hero}.png`, `after-1440-reduced-motion.png`, `after-390-menu-open.png`.
Artwork: `after-1440-art-settled-*` and `after-1440-art-mid-after-*` (every arrangement settled and mid-move, in sequence order, numbered), `after-1440-art-contact-sheet.png`; `after-{834,390,320}-art-{settled-word,mid-fish-to-word}.png`.
Layout shift: `cls-measurements.json` (Edge, local static preview, 9 s after load, layout-shift entries without recent input).
Reproduce: `CHROMIUM_PATH=<edge> npx playwright test` (builds and serves its own copy on port 4322, never reuses 4321).
