# Task 10A: the visitor's latest hero playback choice wins

## The defect (reproduced first)
Sequence: services pauses the hero automatically during overlapping motion; the visitor presses **Play**; the visitor presses **Pause**; services finishes and releases its hold. The old code kept `heroPausedByUs = true` and, on release, pressed the hero button whenever `aria-pressed` was `true`, which undid the visitor's last Pause: the hero played again.

- `before-fix.mp4` (+ `before-fix-contact.png`, `before-fix-log.json`, `before-fix-result.txt`): driven like a visitor on the build from before the correction. Step 4 (visitor pauses) reads "Play animation", aria-pressed=true; step 5 (services released) reads "Pause animation", aria-pressed=false: **RESULT: the hero is PLAYING again**.
- `reproduction-before-fix.txt`: the new regression tests run against the old code: 6 of 9 failed (the interleaving, plus three the old design could not satisfy: idempotent hold events, no dangling hold after a reduced-motion change, and the three language runs of the same interleaving). Failure line: "the visitor's last choice (Pause) must survive the release: Expected "true", Received "false"". The reduced-motion case also exposed a second defect of the same kind: the old release was skipped while the hero control was hidden, leaving a dangling hold.

## The correction
- `src/components/Hero.astro` (wrapper script only; the supplied 29-piece module is untouched) now owns playback from two separate inputs: `userPaused` (the visitor's latest choice) and `holders`, a set of automatic holds requested through the `odalo:hero-hold` event (`{ source, hold }`). The animation is paused when the visitor paused it, or a hold is active and not overridden. A visitor's press during a hold sets `overridden` for the rest of that hold. Requests are idempotent per source; one release removes it; a release without a hold does nothing. `sync()` applies the result and is safe to call repeatedly. The existing "land the arrangement in progress, then pause" behaviour is kept in `sync()`. Labels (`data-play` / `data-pause`) and `aria-pressed` follow the effective state as before; the button is a normal button and keeps focus.
- `src/components/ServiceMosaic.astro` no longer touches the button or clicks anything: it dispatches `odalo:hero-hold` (source `services`) when "a piece is travelling and the hero is on screen" changes, and re-sends an active hold when the hero announces `odalo:hero-ready` (so script order does not matter, and a back/forward restore re-applies it).

## Result
- `after-fix.mp4` (+ contact sheet, log, result): same sequence on the corrected build. Step 5 reads "Play animation", aria-pressed=true, and so does the final view back at the hero: **the hero is still paused**.
- `focused-after-fix.txt`: the 11 hero tests pass (the 9 new ones and the 2 earlier coordination tests): interleaving, manual Play during a hold not reversed, automatic-only hold resumes, visitor pause before the overlap stays, repeated and two-source holds idempotent, reduced-motion change leaves no dangling hold, navigating away and back leaves none, and EN/ES/DE labels, pressed state and keyboard focus (Space then Enter on the focused control; focus stays on it).
- `astro check`: 0 errors, 0 warnings. Normal isolated suite once: **338 passed** (329 before, 9 new) in `full-suite-after-fix.txt`.

## Limits
- The "pause on a completed arrangement" path is the same code as before, moved into `sync()`; the tests do not time the pause against a transition in progress (the module's internal state is not exposed), so that behaviour is unchanged by construction rather than newly tested.
- A visitor's Play during a hold overrides only that hold; a later, separate hold (for example after reversing the scroll before the pieces have docked) applies again.
- The recordings are Edge screencasts on the local build; the performance campaign was not rerun (no new work per frame: the change is event handling only).
