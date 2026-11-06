# Mosaic polish diagnosis (2026-10-29) - diagnosis only, no source/build/deploy/test changes
Lead: fresh `independent-reviewer` (self-reported Sonnet 5.5). Viewed: home-en-1440, plans (mobile-layout capture), web-work-scrolled-1440, audit-en-1440, crops home-en-390-0/1, plans-en-390-2. Not viewed: web-en-1440, plans-768, DE phone crops, other plans crops, hover/motion. Judged from static screenshots; stroke weights measured from images (reviewer did not read global.css/layout code). Lazy-load blanks in full-page captures were not counted as defects.

## Visible observations
- Home desktop: one ~2-3 px navy outline on every cell, 3 flat fills (slate/sand/coral), no tonal steps. Decorative cells are as saturated as content pieces, so scraps compete with content.
- Geometry mixes spiky shards (decorative), smooth heptagon/octagon content pieces and chamfered header/footer; cell sizes look scattered; Process/FAQ pills float while Hero/Plans sit on cell edges.
- Inner pages (Plans, Audit): only a thin tessellation strip frames flat rectangular sections; Audit focus tiles and Work tiles are rectangles with arbitrary wedges/one curve - a different language from the home.
- Phone: hero and services are full-width rectangular bands (read as stacked cards); tessellation returns only at Plans/About/Process pills, which are ~60 px tall next to ~280 px bands (abrupt rhythm; Plans pill small); tall piece 04 has empty space under its button.
## Strongest cause
No material/hierarchy system: one uniform dark outline on three flat fills makes every cell equally loud, so it reads as a diagram/prototype.
## Prioritised refinements (suggestions)
1. Outline hierarchy: content pieces keep a 2 px navy outline; decorative cells get a 1 px low-contrast/sand grout. Before: all cells equal; after: content forward, field = texture.
2. Decorative tonal steps (2-3 per hue, low contrast) for decorative cells only; saturated flats stay on content pieces.
3. One corner treatment (small radius or uniform chamfer) for pieces/header/footer; cap decorative cell size variance and aspect ratio (<3:1) to remove shards.
4. Inner pages: carry 2-3 cell rows of the field at section boundaries; restyle Audit focus tiles and Work tiles with the same outline/radius/tone (tessellation shapes only).
5. Phone: polygonal top/bottom edges instead of rectangular bands; make Plans/About full-size pieces (not pills); use min-height so tall pieces do not leave empty space.
## Proposed small first coder task
Tokens only: add decorative tone + stroke tokens (`src/mosaic/palette.js`, `src/mosaic/odalo/odalo-mosaic.css`, home cell stroke in the home runtime/styles - locate before editing; the reviewer's CSS path is partly assumed). No change to hover/scroll behaviour, approved prices or legal wording. Verify with before/after screenshots at 1440 and 390 and owner look before any wider redesign.
## Open
Planner to discuss direction with the owner before broad visual redesign. Items 3-5 are larger and need owner view first.
