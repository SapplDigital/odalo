# Odalo signature motion prototype (task 09)

A standalone, local prototype of one scroll-driven assembly that makes "Different pieces. One connected result." tangible. Nothing in `src/`, `public/` or the production pages was changed; the prototype copies the few existing assets it needs.

## Run it

```bash
node docs/review/motion-prototype/serve.mjs
```

Then open http://localhost:4323/ (English), http://localhost:4323/index.es.html or http://localhost:4323/index.de.html. The pages also open straight from disk (`index.html`). The static server only exists so the checks and measurements use real HTTP; the dev server on 4321 was not touched. Regenerate the three pages after editing text: `node docs/review/motion-prototype/build.mjs`.

| File | What it is |
|---|---|
| `index.html`, `index.es.html`, `index.de.html` | the pages (generated; plain HTML, one stylesheet, one classic script) |
| `proto.css`, `motion.js` | all styling and the whole choreography (no library, no build step) |
| `strings.mjs`, `build.mjs` | text for EN/ES/DE (copied from the site) and the page generator |
| `assets/` | copies of existing site files only: seven WebP pictures, two fonts, the unchanged "odalo" word SVG |
| `tools/` | `states.mjs`, `layout-check.mjs`, `checks.mjs`, `record.mjs`, `measure.mjs` (re-runnable evidence tools) |
| `evidence/` | recordings, states, final layouts, fallbacks, contact sheets, `checks.json`, `measurements.json` |

## The motion idea

Four pieces of work, four tile bodies. The scene is one object lesson in joining:

1. **Approach (scroll 0 to 30 %).** Four coloured tile bodies sit apart in the corners, slightly rotated and lifted (soft shadow). The four pieces of concept work (Casa Almina website screen, Tidewell local-information section, a strip of real Brindle Pantry video frames, Tidewell square ad) hover as a fanned stack in the middle, above the bodies. All of them drift a little closer: nothing is faded in, everything is already there.
2. **Assembly (30 to 76 %).** The bodies dock edge to edge, one after another: web, local visibility, video, advertising. Each dock has a cause and an effect: the arriving body flattens (its shadow and its rounded inner corners disappear as it lands), a seam sparks along the shared edge, and the neighbour it touches recoils a few pixels and settles. Then each picture lifts, arcs over the others (layering), turns flat and lands in its own body.
3. **Resolution (76 to 100 %).** A four-quarter disc closes the joint where all four bodies meet (each corner carries a neighbour's colour), a ring pulses once, and the labels appear on the finished surfaces. The last word of the headline, dimmed until now, comes to full strength. The mosaic has the same silhouette as the services mosaic (one large curved corner at top left and bottom right, small ones elsewhere) and the same gapless shared edges.

Why this reads as connection and not as decoration: the only thing that moves is pieces going to their places; every dock produces a visible reaction in a neighbour; rotation is never more than 8 degrees and always unwinds to zero on arrival; nothing spins, loops or fades in. Scale (0.8 to 1) and shadow carry depth. The canonical 29-piece logo module is not used or changed (the plain "odalo" word SVG in the top bar is the unmodified site file).

Scroll mapping: normal scrolling is the only trigger. The stage sticks for 1.15 viewport heights of scrolling (about 1035 px at 900 px tall), the scene completes at 92 % of that and then rests on the finished mosaic. Every frame is a pure function of the scroll position, so reverse scrolling, jumping and resizing land in the right state. The script never prevents or captures wheel/touch input. A "Replay from the start" button (native smooth scroll back to the start) is provided for reviewers; it is not needed to use the scene.

## Equivalent versions

| Version | When | What the visitor gets |
|---|---|---|
| Desktop (>= 64 em, viewport >= 520 px tall) | normal | the scene above on a 2.2:1 board; labels beside or under each picture |
| Phone and portrait tablet (< 64 em, >= 600 px tall) | normal | the same scene on a portrait board designed for it: pieces start at the corners, the stack is larger (1.45x), pictures sit above their labels; normal touch scrolling |
| Reduced motion | `prefers-reduced-motion: reduce` | the finished connected mosaic, no sticky stage, no travel, no rail, labels opaque |
| No JavaScript | scripting off | the same finished mosaic from CSS alone, labels readable, audit link present |
| Too small | viewport too short, or board would be under 270 px wide | the finished mosaic (as reduced motion) |

The live/static decision is made by CSS media queries (the script reads the same queries), so the page is laid out correctly at first paint and nothing below the scene moves when the script starts.

## What was checked

Evidence is in `evidence/`; everything marked "script" can be re-run from `tools/`.

- **States by real scrolling** (`states/`): desktop and phone at about 0, 25, 50, 75 and 100 %.
- **Recordings** (`recordings/*.mp4`, contact sheets in `contact/`): desktop English with forward, reverse, forward again and on past the scene; desktop German; desktop with window resizing across layouts and Replay; phone with real touch swipes; portrait tablet (German); reduced motion. Edge's own screencast frames with their real timing, assembled with ffmpeg; silent, 30 fps. I reviewed the recordings as frame sequences (contact sheets at 1 frame per second), not only the stills.
- **Final layouts** (`final/`): English and German at 1440x900, 1280x720, 1024x768, 834x1112, 768x1024, 414x896, 390x844, 360x740 and 320x568/700. `layout-check.mjs` checks all 30 language and size combinations: no label text outside its surface, no label touching a picture or the joint, every picture inside its surface, no sideways scroll, label text 12 px or more. 30 of 30 pass.
- **Fallbacks** (`fallbacks/`): reduced motion and no JavaScript at 1440, 834 and 390 (German and English), plus focus rings on the audit button and Replay.
- **Behaviour** (`checks.mjs`, 34 checks, all passing): no non-passive wheel/touch listeners and a passive scroll listener; the page follows the wheel exactly; progress rises monotonically; the stuck stage consumes 1.15 viewport heights; scrolling continues to the content after it; reverse scrolling reproduces the forward state exactly at four positions; resizing across layouts and modes mid-scene keeps the board in its area with no sideways scroll, and the finished mosaic is exact afterwards; at 101 scroll positions in four setups (desktop and phone, English and German) no moving piece ever reaches the title, eyebrow, audit button, progress rail or Replay, no visible label is ever crossed by an unlanded picture, the joint or its ring, and no piece leaves the stage area; keyboard tab order is skip link, language links, audit button, Replay with nothing inside the scene, each unobscured and showing a focus ring while the scene is stuck; Enter on Replay returns to the start; no console errors or external requests.
- **Not done:** a screen reader pass, Safari/iOS and Firefox, a real phone, and a long scroll with a mouse wheel on real hardware.

## Remaining weaknesses

- **Main-thread scroll link.** Transforms are written from a scroll listener in `requestAnimationFrame`. Measured cost is small (see below) and the page itself scrolls on the compositor, but on a slow phone the scene could lag a frame behind the scroll position. The same choreography could be generated as CSS scroll-driven animations (`animation-timeline`) to run off the main thread; not done here because support outside Chromium is still uneven.
- **Phones: pictures are small.** In the finished phone mosaic the local-information picture is about 130 x 60 px; it reads as "a web page section", not as content. Portrait tablets (834 px) are sparse: the portrait board has empty lower halves in the top-row bodies because the picture widths are bounded by the body width.
- **Short or narrow screens fall back.** Under 600 px of height on phones, under 520 px on desktop, or when the board would be under 270 px wide, the finished mosaic is shown instead of the scene (320x568 is such a case).
- **Fonts.** `font-display: optional` plus preload keeps layout shift at zero, but on a slow first visit the page would use the system fallback fonts for that view.
- **Corner radii are animated** (four plates, `border-radius`), which repaints; measured cost is small but it is not compositor-only.
- **Picture text is English** in all three languages (the concept work is in English); alt text and labels are localized.
- **Joint emblem.** The four-quarter disc is a quiet motif; it will read better if the final site uses the real service colours and icons.
- **Not run:** Safari/iOS, Firefox, screen reader, real devices, forced-colors mode.

## Recommended integration

Use it as the **entrance to the Services section**, not as a second showpiece: place the sticky stage directly after the hero (the hero scrolls away first, so only one focal animation is ever in view) and let the resolved mosaic hand over to the real, interactive services mosaic (same 58/42 and 56/44 proportions, same four tones, same imagery) instead of repeating it. In practice that means the finished frame of the scene becomes the services mosaic at rest, with its live Explore buttons, full-service links and hover behaviour, and the labels here become the tiles' own text. Keep the hero animation as is: it does not compete, because the two are never on screen together and the scene starts only after the hero has left. Set the stage's sticky offset to the header height (88 px on desktop) and keep the 1.15-viewport runway; do not add a second scene to Work or Pricing until this one has been reviewed. Prices, forms and the audit CTA stay outside any moving surface.

## Measurements

`tools/measure.mjs`, results in `evidence/measurements.json` and `evidence/measure-output.txt`. Each condition: 3 runs of the same real, uneven scroll (down through the scene, hold, back up, down again, on past it; wheel on desktop, touch swipes on the 390 px phone), 4,260 to 4,410 frame intervals per condition. The control is the same page with reduced motion (no scene), so the browser's own cadence in this environment is visible next to the scene's.

| Condition | Frame interval median / p95 / p99 | Frames > 33 ms (of ~4,300) | Scene update median / p95 / worst | Layout shift (3 runs) | Long tasks |
|---|---|---|---|---|---|
| Desktop 1440x900, scene | 16.7 / 16.8 / 16.9 ms | 2 | 0.2 / 0.3 / 0.5 ms (462 updates) | 0, 0, 0 | 0 |
| Desktop, control | 16.7 / 16.8 / 16.8 ms | 1 | n/a | 0, 0, 0 | 0 |
| Desktop, scene, CPU x4 throttle | 16.7 / 16.8 / 16.8 ms | 0 | 0.7 / 1.2 / 1.9 ms | 0, 0, 0 | 0 |
| Desktop, control, CPU x4 | 16.7 / 16.8 / 16.8 ms | 2 | n/a | 0, 0, 0 | 0 |
| Phone 390x844 touch, scene | 16.7 / 16.8 / 16.8 ms | 1 | 0.2 / 0.3 / 0.5 ms (416 updates) | 0, 0, 0 | 0 |
| Phone, control | 16.7 / 16.8 / 16.8 ms | 3 | n/a | 0, 0, 0 | 0 |
| Phone, scene, CPU x4 | 16.7 / 16.8 / 16.9 ms | 3 | 0.8 / 1.2 / 1.7 ms | 0, 0, 0 | 0 |
| Phone, control, CPU x4 | 16.7 / 16.8 / 16.8 ms | 0 | n/a | 0, 0, 0 | 0 |

- **Layout shift: 0** during load and through the whole scroll, in all 24 runs, English. A separate load test (6 fresh loads each of English and German at 1440, 1024, 834 and 390 px) also gave 0.0000. An earlier version had 0.06 to 0.27: the runway height was only applied after the script ran and the web font swapped in after first paint (German headline wrapped differently). Fixed by deciding the live layout in CSS and using `font-display: optional` with preload; kept here because it is the kind of defect this scene could cause.
- **Frame behaviour.** Frame intervals are 16.7 ms (60 Hz) in every condition, scene or control, and the few intervals over 33 ms (one to three in about 4,300) occur in the controls too, so they are the environment, not the scene. The scene's own cost is the number that matters: 0.2 ms median and 0.5 ms worst per update at normal speed, 0.7 to 0.8 ms median and under 2 ms worst with the CPU throttled 4x. No long tasks (over 50 ms) in any run. Memory: about 1.7 to 1.9 MB JS heap with the scene, 1.3 to 1.4 MB without; 90 DOM nodes.
- **Conditions and limits.** Windows 11 on the review machine, Edge (Chromium) driven by Playwright in headless mode with real wheel and touch input over CDP, page served over http://localhost, 60 Hz virtual display, no real GPU measurement. Because the compositor clock is fixed at 60 Hz here, "16.7 ms everywhere" shows the scene does not make frames late in this setup; it does not prove smoothness on a real phone. CPU throttling is a rough stand-in for a slower device, not a measurement of one. The recordings show timing at the screencast's frame rate (median gap 16 to 17 ms), not what a display shows. No Safari, Firefox or real device was measured.
- **Size and requests.** First load, desktop or phone: 10 requests, 166 KiB (HTML 6.7 KB, CSS 13.3 KB, JS 11.8 KB; gzip 1.9, 4.0 and 4.4 KB; the local server sends no compression). Of that, the four pictures are 78 KB (the 640 px variants the browser picks for these box sizes; no video is loaded), fonts 53 KB, the unchanged word SVG 3.7 KB. Sizes are KiB (169,919 bytes in total). `assets/` on disk holds 260 KB because it carries two sizes of three pictures. Runtime: no timers, no network after load, one passive scroll listener, one ResizeObserver on the board, two matchMedia listeners.
