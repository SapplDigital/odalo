# Brindle Pantry (sample-shop) asset register

All artwork is original vector illustration, animation and layout made for this concept with AI assistance (Claude). No photographs, no filmed footage, no stock, no external services, no paid tools. Brand, products, hours (Tuesday to Saturday, 9 to 5) and web address (brindle.example) are fictional. On-screen language: English (media is not localised; alt text, captions and provenance are EN/ES/DE in `src/content/projects.ts`).

Fonts rasterised into the artwork (Windows system fonts, not redistributed): Rockwell 800, Segoe UI, Bahnschrift, Constantia, Corbel.

| Site file (`public/work/concepts/shop/`) | Source | Spec |
|---|---|---|
| `brindle-pantry-concept-1080x1920.webm` | `motion.html` via `tools/export-video.mjs`, ffmpeg 9.0.2 | VP9, yuv420p, 1080x1920, 30 fps, 10.000 s, ~608 kb/s, silent, 759,420 B |
| `brindle-pantry-concept-1080x1920.mp4` | same | H.264 High, yuv420p, 1080x1920, 30 fps, 300 frames, 10.000 s, ~717 kb/s, faststart, silent, 892,664 B |
| `shop-poster-{360,720}.webp` | frame at t=5.6 s | 720x1280 (9:16); 14 / 33 KB. Video poster and narrow desktop card (crop focus 50% 78%) |
| `shop-card-wide-{640,960,1280}.webp` | `creatives/card-wide.html` | 1280x800 (16:10); 19 / 32 / 42 KB. Default card and case-study lead |
| `shop-sheet-{640,960,1280}.webp` | `creatives/sheet.html` | 1280x800; 20 / 35 / 48 KB. Five packaging illustrations + ingredient shapes |
| `shop-ad-square-{540,1080}.webp` | `creatives/square.html` | 1080x1080; 32 / 70 KB. Static square creative |

Sources: `shop-art.js` (products, ingredients), `motion.html` (scene graph, `window.__seek(t)`), `creatives/*.html`, `tools/build-assets.mjs`, `tools/export-video.mjs`. Review artefacts: `review/` (playback contact sheets of the encoded WebM and MP4), `placement/` (page screenshots).

Story (10 s): 0-3 s ingredients drop in, "Small batches."; 3-7 s ingredients become packaged products on a plank, "Jams, salts, oils and crackers."; 7-10 s shelf moves into a shop window, "Come and fill a basket.", opening hours, address; held to the end.
