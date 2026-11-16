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

## Round 3 / project cards (text note only, no new screenshots)

- Confirmed root cause (owner decision 2026-11-16): the grey Casa Almina / Brindle Pantry cards were a screenshot artefact, not a product bug. The card images use `loading="lazy"` and sit below the fold; Playwright fullPage captures never scrolled them into view, so they were not loaded and painted grey. The image files, srcset paths and CSP (`img-src 'self' data:`) are fine, and the images load in the live page.
- The earlier `eager` change to `SeccionProyectos.astro` was reverted; the cards are lazy again. Layout, links, alt text and i18n are unchanged.
- `tests/qa-shots.spec.ts` `shoot()` now scrolls to the bottom and waits until every `img` is complete with naturalWidth > 0 before the fullPage screenshot, then scrolls back to the top.
- Guard (kept): `tests/home-project-images.spec.ts` (es/en/de at 390 and 1440) scrolls each card image into view and asserts complete, naturalWidth > 0, non-zero box, visible, and non-zero effective opacity.

## Round 3 / dot-matrix prices (text note only)

- Finding: no defect found in source. `DotText.astro` emits an inline SVG with a `currentColor` path and sizes it by `--dot-h` x `--ar`. The consumers (SeccionPlanes, PlanStepWeb, PlanStepMonthly) set `--dot-h` through `:global()` rules, and glyphs exist for digits, the euro sign, comma and period. No CSS hides the SVG, and inline SVG is not affected by the CSP. No source fix was made, since none was evidenced; the QA observation is treated as a misread unless the new spec fails.
- Guard: `tests/dot-text.spec.ts` (es/en/de at 390 and 1440, home `#planes` and `/{lang}/plans/`) asserts each `.dot-text` svg is visible, has a bounding box width and height > 0, and a non-empty path `d`. netlify.toml and the CSP are unchanged.

## Round 3 / hero cloud + nav overlap (text note only, no new screenshots)

- Hero cloud: new `src/components/home/HeroCloud.astro`, ported from Ale's `VividField` (inbox/ale-ref/src): navy gradient field, four blurred light blobs inside a drifting wrapper (22s alternate), a dot layer masked by `radial-gradient(ellipse at 50% 35%, black, transparent 70%)`, and a light grain layer. CSS only, no canvas. Root has `aria-hidden="true"`, `data-hero-cloud`, `pointer-events: none`, no focusable content, `overflow: hidden`. It fills `.hp__art`, behind the stones. The drift animation is disabled under `prefers-reduced-motion: reduce`. Ale's `.dots`/`.grain` utility rules were not found as plain CSS rules, so equivalents were written as scoped CSS. The field uses navy `--ink` as the accent, since our `--accent` is coral.
- Nav pill vs eyebrow at 390: body already has `padding-top = pill-top + pill-h + 12px`, so the pill does not cover the eyebrow at scroll 0. The overlap in the fullPage shot is treated as an artefact of the fixed header being captured over scrolled content. No Header change. `tests/hero-cloud.spec.ts` guards it.
- Hero copy, i18n keys, hrefs, data-track attributes, netlify.toml and CSP are unchanged.

## Round 3 / Tidewell crop + contact band (text note only, no screenshots regenerated)

- Tidewell crop: cause was `object-fit: cover` with the default centred position on a 16/11 box (home) and a 4/5 portrait box (Work, `50% 0`) for an image of about 1.6 ratio, trimming the left edge where the headline sits. Fix is CSS only: `object-position: left center` for `[data-project-card=sample-clinic]` in SeccionProyectos.astro, and `0% 0` for `sample-clinic` in WorkMosaic.astro (both layouts). No assets changed, `loading=lazy` kept.
- Contact band: cause was `.ctc__path` (terrazzo, aria-hidden) absolutely positioned top right over the eyebrow and h2. Fix: on mobile it is an in-flow 6rem strip above the eyebrow; from 768px it is confined to a 28% right column and `.ctc__h` is capped at 62% width. Copy, i18n, CTA and CSP unchanged.
- Guard: `tests/layout-390.spec.ts` (es/en/de at 390 and 1440) checks h2 vs shapes non-intersection, Tidewell image loaded with left object-position and inside the viewport, and no horizontal overflow.

## Round 3 / services phones (text note only, no screenshots regenerated)

- Home services demo card (MEDIUM 4a): `src/components/home/SeccionServicios.astro` now shows a framed demo card in the side column at 1024 px and up, styled after Ale's `MarcoDemo` (label and footer). It switches with the open accordion item. Below 1024 px the same demo sits inside the open panel, under its text. Accordion behaviour is unchanged: aria-expanded/aria-controls, ArrowUp/Down/Home/End, copy, i18n keys and service links. Demo animations are disabled under `prefers-reduced-motion`. Guard: `tests/services-demo.spec.ts` (es/en/de at 390 and 1440: 1440 position and switching, 390 in-panel, no overflow).
- Video service page hero phone (MEDIUM 4b): `src/components/services/ServiceHero.astro` renders a phone frame only when `s.id === 'video'`. It is a port of Ale's `MovilReel`: a muted, playsinline, looping clip with a poster, an "illustrative example" tag and an aria-label. Videos load lazily, pause off-screen, and under `prefers-reduced-motion: reduce` only the poster shows and no video plays. Web, local and ads pages get no hero phone.
- Assets: Ale's reel files were copied from `inbox/odalo-web-design/public/servicios/video/` into `public/services/video/`. Each copied file and its source path is listed in `docs/ASSET-SOURCES.md`.
- Guard: `tests/services-video-phone.spec.ts` (es/en/de: phone present with aria-label, poster/video URLs return 200, reduced-motion shows poster only, absent on other services, no overflow at 390 and 1440).
- Existing `.ph` absence checks on services, work and audit pages were not changed.
- Out of scope: Ale's 9:16 format picker and calendar blocks.
- Still open: LOW 6 (navy italic accent like Ale's instead of terracotta; Ale's nav labels where they are only labels, keeping our routes).
- No screenshots were regenerated this round (QA_SHOTS unset). This note is text only.

## Round 3 / LOW 6 (text note only, no screenshots regenerated)

- Italic accent: token `--accent-italic` = `var(--ink)` (#004066, Ale's navy) from the earlier T11 change. Light surfaces only; dark surfaces still use `--coral-light`.
- Nav labels (src/i18n/ui.ts, `nav` only; keys, hrefs, Header.astro unchanged):
  - about -> Estudio (es), Studio (en), Studio (de), matching Ale's studio.
  - work (es) -> Proyectos (was Trabajo); en/de already Work/Projekte.
  - services, plans unchanged and already equal to Ale's; process unchanged (no Ale counterpart).
- Spec string updates: none. Existing specs read labels from `t.nav.*`. New guard: `tests/nav-labels.spec.ts` (es/en/de: header labels and hrefs, hero italic accent computes to rgb(0, 64, 102)).
- No screenshots were regenerated. This note is text only.


## Round 3 (68031da) - QA Tester 2026-11-16

Run: `QA_SHOTS=1 playwright test tests/qa-shots.spec.ts` = 86 passed, 6 failed (all `services-video`, es/en/de at 390 and 1440, "every img complete" wait times out). Live check with Edge against `astro preview` (:4340): es/en home, es plans, es services-video at 390 and 1440. Console errors/warnings: none. Request failures / HTTP >= 400: none. Only origin contacted: localhost. The preview does not send the Netlify CSP, so CSP was not enforced; instead `dist/` was grepped for external URLs: only example/legal text links (example.com, odalo.example, odalo.sappl-digital.de, datenschutz.de), no external src/href loads, no external fonts/scripts. Inline scripts/styles are allowed by the CSP (`'unsafe-inline'`); video/media would be blocked by `default-src 'self'` only if cross-origin (they are same-origin).

Verdict: MOSTLY looks like Ale's design.

Checked (evidence: docs/qa/2026-11-24/screens/{es,en,de}-*.png vs screens/ale/):
- Dot-matrix prices (home planes, /plans): visible, PASS.
- Project card images on home (Casa Almina, Tidewell, Brindle Pantry): visible, Tidewell headline no longer cropped, PASS.
- Italic accents: navy on light surfaces, PASS (the plans h1 "Elige tus piezas" and the video "Un enfoque conectado" are terracotta/navy mixed: video process heading still terracotta, LOW).
- 390 home (es/en): no real overlaps. The nav pill drawn mid-page in fullPage shots is a fixed-header capture artifact, not a bug.
- Home services demo frame at 1440: present.

Remaining gaps
- HIGH: services/video hero phone shows only a blurred 24 px placeholder ("mini"), never the reel. Live DOM: all three `.rp__poster` computed `display:none`, `naturalWidth` 0, and no `<video>` element exists in `.rp` after 4 s (1440 and 390). Probable cause: CSS `.rp__clip:first-child .rp__poster {display:block}` does not match (the mini `<img>` is the first child), and video is not injected. This also causes the 6 spec failures (lazy images that are display:none never load). Repro: open /es/services/video/ at 1440 and look at the phone.
- MEDIUM: home hero dot cloud is a small boxed art tile on the right; Ale's is a full-width dot scatter across the hero with stones along the bottom right. Our hero is flatter and text-only on the left.
- MEDIUM: home "Proyectos" has 3 cards on beige; Ale's home shows an honest empty "Trabajo real" state with 2 placeholder cards (content decision, not a defect). Our cards look finished.
- MEDIUM: video service page lacks Ale's sections "Una pieza, cada pantalla" (9:16 picker) and "De la idea a tu perfil" and the calendar block (listed as out of scope earlier).
- LOW: services-video hero has a large empty gap above the h1 at 1440 (h1 bottom-aligned in 100vh); Ale's h1 sits near the top.
- LOW: terracotta italic on /services/video "Un enfoque conectado".
- Not tested: de 1440, forms, reduced-motion, real Netlify CSP headers, video autoplay.


## Round 4 (1cf0a98) - QA Tester 2026-11-16

Run: `QA_SHOTS=1 playwright test tests/qa-shots.spec.ts` = 92 passed, 0 failed (the 6 services-video failures are gone). Live Edge check on `astro preview` :4350: es home/plans/video at 390 + 1440, en/de home at 390: no console errors/warnings, no failed requests or HTTP >= 400, no horizontal overflow. Evidence: %TEMP%\qa4\*.png (es-video-1440-full.png, es-home-1440-full.png, cards.png) vs screens/ale/.

Round-4 items
- Video hero reel: PASS. Three `<video>` in `.rp`, readyState 4, two playing; phone shows the real clip (no blurred mini).
- Full-width hero dot scatter (home): PASS, dots span the hero like Ale's. Denser/less structured than Ale's swoosh, fine.
- Video page format picker (9:16 / 1:1 / 16:9), "De la idea a tu perfil", calendar: PASS, all present at 390 + 1440. Differences: "De la idea" is a plain 4-column list (Ale: step list + dot-animation panel at right, LOW); format picker panel is stacked above a full-width picker instead of Ale's 2-column layout (LOW).
- Gap above video h1: PASS (h1 top 243 px at 1440, 118 px at 390).
- Accents navy: PASS (h1 italic computes rgb(0, 64, 102) on es home/plans/video, en/de home).
- Home project cards: live check shows real previews (Casa Almina, Tidewell, Brindle) - blank in fullPage shots is lazy-load capture artifact, not a bug. Ale shows an empty "Trabajo real" state (content decision).

New defects: none above LOW. Not tested: de 1440, forms, reduced-motion, real Netlify CSP, video behaviour on slow networks.

Verdict: matches Ale's design closely. Ready for owner review: yes.
