# Task 07: sample-shop as a labelled fictional motion campaign

Produced: five packaging illustrations + ingredient shapes, one 9:16 silent 10 s motion piece (WebM + MP4 + poster), one square creative, card picture. Not produced: filming, publishing, campaign, any client or results data (stated in EN/ES/DE on the case study).

Changed: `src/content/projects.ts` (sample-shop record, `ProjectVideo`, `planTitle/planNote/outputsTitle/videos`), `src/i18n/ui.ts` (videoNote, videoFallback), `src/pages/[lang]/work/[project]/index.astro` (video figure, outputs heading, plan headings), `src/components/WorkMosaic.astro` (`data-p`, crop focus for the shop poster), tests: `concept-shop.spec.ts` (new), `concept.spec.ts` and `concept-clinic.spec.ts` (no longer assume the shop has no pictures). Hotel and clinic presentation unchanged.

Rebuild media: `node docs/review/concept-shop/tools/build-assets.mjs` and `node docs/review/concept-shop/tools/export-video.mjs`.
Details: `ASSET-REGISTER.md`. Screenshots: `placement/`.

Limits: video text is English only; fonts are Windows system fonts; the vertical poster is cropped to the product shelf in the short desktop supporting card; video playback was verified in Edge (Chromium) only.
