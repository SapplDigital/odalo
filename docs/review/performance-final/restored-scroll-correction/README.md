# Correction 18A: the restored-scroll failure

**Verdict: the application behaved as designed; the test fixture's assumption was wrong.** No application source changed. Only `tests/services-motion.spec.ts` changed (not committed).

## The failure
Task 18 suite: 567 passed, 1 failed (`full-suite.txt` in the parent folder, untouched). The test "after a reload that restores the scroll position…" expected the video tile (nominal top 1,044 px in a 900 px window) to stay displaced; it was docked.

## Reproduction (original test, unchanged)
`npx playwright test tests/services-motion.spec.ts -g "after a reload that restores" --repeat-each=8 --workers=4` → **5 failed, 3 passed**, always the same assertion (`repro-original-test-repeat8-workers4.txt`). The same test passes alone. It also failed with the font change reverted (Task 18), so the font optimization is unrelated.

## Cause (from lifecycle timelines, `tools/lifecycle.spec.ts`, `timelines/`)
The tool replays the test's scenario with a timeline injected into every document: scroll position, `scrollHeight`, `readyState`, `load`/`pageshow`/`DOMContentLoaded`, `fonts.ready`, image loads, stylesheet state, per-tile nominal position and docked state. Run under 4 workers, 8 repeats.

1. On reload the browser restores the scroll position **against a layout whose stylesheets have not arrived yet**. Early samples show `readyState=interactive`, 3 to 5 stylesheet links still without a sheet, and a document 14,409 to 16,877 px tall (final: 9,701 px; the services block is 4,083 px unstyled vs 1,608 px styled). The saved 589 px is restored as **1,264 px (once 1,276 px)**.
2. When the stylesheets apply, the document collapses to 9,701 px and the browser corrects the position back to about 595 px, **as an animated scroll over roughly 450 ms** (positions 1264, 1253, 1236, 1203, 1143 … 595), consistent with `html { scroll-behavior: smooth }`; the exact mechanism was not isolated.
3. Under load the stylesheets arrive late enough that the assembly script and the `load` handler run while the position is still 1,264 px. There the mosaic's top is at -175 px, so **all four tiles are inside the window** (video and ads at 369 px). The script docks what is on screen ("a tile that has docked stays docked"), `is-assembling` never appears, and the page then scrolls back to 589 px with every tile docked.
4. With no load (or fast stylesheets) the restoration is at 589 px before the script decides: web/local docked, video/ads displaced at 1,044 px, `is-assembling` on. That is what the test assumed.

Both outcomes occur in the same code. A tile that was below the viewport at the final measurement had legitimately entered it earlier, which is the approved persistence rule. The transient is browser behaviour that depends on stylesheet timing; it is not caused by the mosaic and the mosaic's decision is consistent with what it was shown. I did not change the app: delaying the decision until restoration "settles" is not observable, would fight the approved rule, and would add behaviour for a transient this site does not control.

## Fix (test only)
`tests/services-motion.spec.ts`: the single test is replaced by two, with all the original coverage and more:

1. **Real browser restoration** (non-deterministic by nature): an init script wraps `getBoundingClientRect` and records the tiles' viewport tops at every moment the assembly script reads the mosaic (that is its input for each decision). After restoration and settling it asserts: tiles in the window at rest are docked; a tile that was **never nearer than the window bottom at any observed moment is still displaced**; a tile that was clearly on screen (top < 40 % of the window) is docked; scrolling the lower row in completes the assembly and nothing scatters. No sleeps were added (the existing 350 ms wait for the load handler is unchanged).
2. **Deterministic below-the-fold branch**: with `history.scrollRestoration = 'manual'`, the test itself applies the position at `load` (stylesheets applied), the scenario the app's load-handler comment describes. It asserts top row docked, lower row displaced and `is-assembling`, scrolling back keeps the docked row docked, scrolling to the lower row completes assembly, and a completed mosaic stays docked after scrolling away and back.

Recorded views in 8 runs of test 1 under 4 workers (`after-fix-real-restoration-repeat8-workers4.json`): 5 runs saw the clean positions (web/local 500, video/ads 1,044 px) and 3 saw the transient (-175/369 px); the test passed in both, with consistent assertions. The below-fold branch is exercised in every run by test 2.

**Mutation check** (`mutation-check-load-handler-docks-everything.txt`): temporarily making the load handler dock every tile makes both tests fail ("video … must still be eligible to assemble"); reverted, `ServiceMosaic.astro` is identical to the commit.

## Results
- Focused: both restored-scroll tests, 8 repeats, 4 workers: **16/16 passed**, twice (`after-fix-focused-…`, `final-focused-…`).
- Full isolated suite once: **569 passed, 0 failed** (`full-suite-after-correction.txt`).
- `check`/`build`: not required, no application source changed (the suite builds its own copy).
- Suite count: Task 17 checkpoint 558 → 568 at the Task 18 merge (+10 = `tests/legal.spec.ts`, from the legal-identity branch; its cookie-bar test was dropped with the bar) → 569 now (+1: the restored-scroll test became two).

## Limitations
- `timelines/` holds the final instrumented replay runs; some files come from earlier iterations of the diagnostic (fewer fields). The cause rests on the timelines above (styled/unstyled heights, pending sheets, positions), not on one file.
- My early poller forces layout, so it can influence timing; the same transient was seen without it (first diagnostic version) and in the unmodified original test.
- Test 1 cannot force the transient; test 2 stands in for browser restoration, so a different browser's restoration timing is not covered. Only Edge was used.
- Smooth-scroll correction of a restored position (visitor sees the page move back about 600 px on a slow-stylesheet load) was observed, not judged or changed here.
- Not committed.
