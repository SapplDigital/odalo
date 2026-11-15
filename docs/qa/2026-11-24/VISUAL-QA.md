# Visual QA: Astro port vs Ale's design (2026-11-24 branch)

Ours: `docs/qa/2026-11-24/screens/*.png` (92 shots, es/en/de, 390 + 1440, all pass: 1 h1, no horizontal overflow).
Ale (odalo-web @ f137d06, dev server :3199, now stopped): `docs/qa/2026-11-24/screens/ale/` (es only; home, planes, servicios/video-y-contenido, auditoria, privacidad, aviso-legal; 390 + 1440; no console errors, no overflow).
Limits: I viewed es home/plans/services-video/work (1440) and home/audit (390) of ours, plus Ale's home/planes/video at both widths where listed. en/de, about, cookies/legal, work detail pages and services web/local/ads were NOT viewed (only generated). Ale has no about, work or web/local/ads service pages (only `video-y-contenido` has a page), so no reference exists for those.

## Verdict
1. Structure and copy of home/plans/video are ported (same sections, same order, same palette navy/peach/orange, same serif-italic accents). It reads as the same brand but not the same design.
2. The signature visual layer is missing: Ale's pixel-dot/terrazzo mosaic hero art, dot-matrix price digits, illustrative phone/QR/kit mockups, peach section bands and photographic imagery. Ours is flat typography plus small dot grid.
3. Typography differs: Ale = light Inter Tight display (large, thin) + Instrument Serif italic; ours = heavy Outfit bold headings (font swap is documented in global.css as an owner decision, so confirm it is intended).
4. Layouts are simpler: Ale uses cards, accordions, phone frames, numbered `01 - LABEL` eyebrows; ours uses plain lists/tables, a different eyebrow style, and an orange (not navy) highlighted plan card.
5. No functional layout defects found (no overflow, no broken images, no untranslated es text seen). Fixes are fidelity gaps, not bugs.

## Top 5 fixes
1. High: hero and CTA mosaic art (`Hero.astro`, `HomeMosaic.astro`, `PlansMosaic.astro`, `ServiceMosaic.astro`, `WorkMosaic.astro`, `AuditMosaic.astro`): ours renders a sparse dot grid; Ale's is a large dot/terrazzo composition spanning hero and the navy CTA.
2. High: headline typography scale/weight (`src/styles/global.css`): Ale's H1/H2 are ~64-96 px light with serif italic; ours bold and smaller. Decide Outfit vs Inter Tight deliberately, then match scale.
3. High: home services block: Ale has an accordion + phone mockup ("Encajamos las piezas de tu negocio"); ours is a 4-row link list with different heading text.
4. Medium: plans page (`Plans.astro`, `PlanTable.astro`): Captación card should be navy with orange button and "RECOMENDADO" pill, dot-matrix prices, "No incluye" lists, per-card numbering; ours is orange card, no "No incluye", extra "Condiciones comerciales" and FAQ sections not in Ale's page.
5. Medium: imagery: Ale's kit-QR phone/QR mockup, peach "projects" band with tilted cards, video-page phone/photo cards; ours uses plain QR tiles, light-grey band, concept thumbnails.

## Per page

Severity: H/M/L. "Match" = how close to Ale.

### Home (390 and 1440)
- Match: low-medium. Same section order (services, plans, QR kit, projects, studio, contact) and palette.
- 1440 diffs: hero is left-aligned bold headline "Te llevamos hasta tus clientes" with dot grid at right; Ale's hero is a full-bleed mosaic with small tagline (H). Services list vs accordion+phone (H). Plans strip lacks "Ver todos" style/typography match, cards bold (M). Projects band is blue-grey, Ale's is peach with two tilted placeholder cards, we show 3 real concept thumbnails (L, arguably better). Navbar labels: ours "Servicios / Planes / Proceso / Nosotros", Ale "Servicios / Proyectos / Planes / Estudio" (M, check intent). CTA band: Ale has mosaic art, ours faint circles (M).
- 390: stacks cleanly, no overflow; sections very long single-column; QR tiles wrap to 3 tiny tiles (L); sticky bottom nav pill shows in fullpage shot (artifact).
- Defects: none clear.

### Plans (390/1440)
- See fix 4. Ale's hero is a large display headline with mosaic; ours shows "Precios claros. Elige tus piezas." in a two-column text hero (M). Step labels "PASO 1 / PASO 2" present in both. 360 row similar. Extra sections ours only: Condiciones comerciales, Preguntas (L, content decision).
- 390 for plans not viewed (Medium confidence nothing breaks: overflow test passed).

### Services (web, local, video, ads)
- Only video has an Ale reference. Ours (1440): small hero with filmstrip image, "Qué incluye" 3 boxes, process 4 steps, plans, FAQ, CTA. Ale: phone hero with photo, "Tres formas de contar lo que haces" 3 image cards on peach, format picker 9:16, step timeline with animated dots, calendar card. Match: low (H). Imagery gap is the main item (H).
- Ale's page has a large empty gap under "De la idea a tu perfil" in the fullpage shot: scroll-pinned section, screenshot artifact in his repo, not a defect to copy.
- web/local/ads: no reference; they share our template. Not viewed.

### About / Work / Audit / Contact / Legal
- About: not viewed; no Ale page ("Estudio" is a home section there). Flag: our About is an extra page.
- Work (1440): clean 3 cards with concept images, serif italic "conceptuales". No Ale page; fine. Concept images show cropped Tidewell hero text at left edge (L).
- Audit (390): form complete and readable, all labels translated; heading uses small bold + serif italic, fine. Compare to Ale audit not viewed (shots exist in `ale/`). Sticky bottom pill overlaps the "info@..." line in the fullpage shot (artifact of fixed element, verify manually on device: M until confirmed).
- Legal/privacy/cookies: not viewed; generated for es/en/de, h1 count and overflow tests pass.

## Defects (all low-confidence on severity, none blocking)
- M: Mobile sticky bottom bar may cover content at page end/CTAs; verify with real scroll (shows over audit intro text in fullpage shot).
- L: Work thumbnails crop text at the left edge (Tidewell).
- L: Nav labels differ from Ale ("Proyectos/Estudio" vs "Proceso/Nosotros").
- Not tested: en/de visual copy review, hover/animation, cookie banner, form submit, real-device Safari, Lighthouse/contrast measurements.

## Round 2 (7d65ccd)
Method: regenerated screens (92 tests passed), compared es home/plans/services-video at 390+1440 and en/de home at 390 against `screens/ale/`. Full-page PNGs are downscaled when viewed; crops of hero and projects inspected at 1:1. No console/network capture this round.

**Verdict: mostly closer, but not yet Ale's design.** Palette, serif-italic accents, terrazzo shapes, accordion and plan grid now match in structure; the signature image/dot layer and page-specific visuals are still missing.

| Gap (round 1) | Status |
|---|---|
| Image layer (dot field, phone mockups, hero art) | PARTLY. Terrazzo shapes + faint dot grid present. Ale's dotted hero cloud, dot-matrix price numerals, phone mockup in services, 9:16 / calendar / process visuals are absent. |
| Typography | MOSTLY FIXED. Light sans + Instrument-style italic accent in terracotta matches. Ale accents are blue/navy italic, ours are terracotta; hero headline is larger than Ale's. |
| Services accordion | PARTLY. Accordion and numbering match; Ale has the phone mockup card beside it (ours is single column, no visual) and shorter copy. |
| Plan cards / dot prices | PARTLY. Layout, dark Captacion card, 360 row match. Prices are plain mono, not dot-matrix; plans page has no dot hero block; extra "Condiciones" and FAQ sections not in Ale. |
| Imagery | PARTLY. Services-video cards use real photos like Ale; Ale hero phone video is missing (ours has a filmstrip), "Una pieza, cada pantalla" and calendar block missing. Home project cards: 2 of 3 render as empty grey boxes. |

New defects
- High: Home "Ejemplos" cards Casa Almina and Brindle Pantry render blank grey (en/de/es, 390 and 1440). Files exist in public/work/concepts, the spec scrolls the page, so likely lazy/reveal/srcset problem; Tidewell loads. Not verified in a live browser. Check the home project card component and `src/content/projects.ts` card image paths.
- Medium: 390 hero: floating nav pill overlaps the eyebrow label ("ESTUDIO DIGITAL..."). The sticky bottom bar (Menú/Planes/Auditoría) overlaps the "01 SERVICIOS" label in the full-page shot (probably screenshot artifact; verify in real scroll).
- Medium: de home 390: headline "Wir verbinden Websites, Anzeigen und Geschäft..." overlapped by the sticky bar in shot; same artifact check.
- Medium: Tidewell card image is cropped at left edge (text cut) at 1440.
- Low: footer on contact band: terrazzo shapes overlap the "gratuita." headline at 390 and 1440 (Ale places them to the side). Mobile footer brand lockup is large.
- Low: nav labels (Servicios/Planes/Proceso/Nosotros) differ from Ale's (Servicios/Proyectos/Planes/Estudio). Plans page hero shapes sit over the subcopy at 1440.
- Copy: en/de home at 390 are fully translated, no untranslated strings seen. "Consultar" and placeholder tags in mono are consistent. No horizontal overflow visible in any viewed shot.

Remaining gaps ranked
- High: fix blank project cards (home projects component, projects.ts image paths).
- High: dot-matrix price numerals + dotted hero cloud (hero component, plans price cell); this is the brand signature.
- Medium: phone mockup beside services accordion (home services section); hero phone/video visual on services-video; 9:16 format and calendar blocks.
- Medium: terracotta vs navy italic accent; nav labels.
- Low: terrazzo/heading overlap in contact band; remove extra Condiciones/FAQ on plans if Ale's lean layout is the target.
- Not tested: hover/animation, reduced motion, real sticky-bar scrolling, contrast measurement, console/network errors, other pages (work, legal) in detail.
