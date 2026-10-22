# Task 12: demo browser-storage UI

## What the demo actually stores (verified before writing the wording)
Search of `src/`: the only writes are `localStorage['odalo.lang']` on an explicit language choice (`Base.astro`; read by the root redirect in `pages/index.astro`) and, previously, `odalo.cookies` by the cookie panel. No cookies (`document.cookie` is never used), no other keys, no analytics provider (`site.analyticsEnabled = false`, `send()` is empty), no third-party requests. So "remembers your language in this browser. Analytics and marketing tracking are disabled." is accurate.

## Changes
- `src/components/CookieBar.astro` deleted; removed from `Base.astro` (and the `scroll-padding-bottom` rule for it in `global.css`). No fixed panel, no inactive analytics choice, no accept/reject controls.
- Footer (`Footer.astro`): the preferences button is replaced by a native `<details><summary>` "Browser storage / Almacenamiento del navegador / Browserspeicher" in the legal list; body text exactly as specified plus a link to the existing cookie page. It works without JavaScript, opens in the flow of the footer (never fixed), keyboard operable (Tab, Enter, Space).
- `ui.ts`: the `cookies` panel strings and `footer.cookiePrefs` are replaced by `storage: { h, body }` in EN/ES/DE.
- `analytics.ts`: `hasAnalyticsConsent()` no longer reads storage and returns `false`; an old `odalo.cookies` value ("essential", "analytics" or anything else) is inert, never rewritten or cleared, and is not consent for any future tracking. Unrelated keys are untouched.
- `ServiceMosaic.astro`: the cookie-panel viewport compensation and its observer are removed. One related robustness fix: a scroll position restored after the script ran is now docked on `load` (a flaky restored-scroll test showed the pieces could start mid-travel). The settle-on-focus/Explore/hash logic and the hero hold protocol are untouched.
- Cookie page and its draft banner are unchanged; its section titles (for example "How to change your choice") are legacy draft wording and were left for the legal pass. Audit-form marketing consent is untouched.
- Tests: `playwright.config.ts` no longer pre-seeds a stored choice (every test now starts as a first visit), `tests/helpers/reflow.ts` no longer special-cases the panel, `services-motion.spec.ts` replaces the cookie-panel test with a no-overlay test, new `tests/storage.spec.ts` (37 tests).

## Evidence
- `before/`: fresh-storage first views (EN/ES/DE x 1440, 390, 320 at 100% and 200%): a fixed overlay on 18 of 18 (`_overlays.json`). `after/`: the same views, 0 of 18, plus the open footer disclosure (EN/ES/DE x 1440, 390, 320, 320 at 200%) with no overflow.
- New tests: no panel and no leftover wording in EN/ES/DE; disclosure text, label and cookie-page link; native keyboard operation; no JavaScript; old values essential, analytics, garbage and none (x3 languages): no panel, value neither rewritten nor cleared, unrelated key kept, no external request, the analytics source reads no storage; storage denied (the `localStorage` getter throws): pages render, language switch and disclosure work, no page errors; explicit language choice stored as the only key, no cookie, used by the root redirect; first views unobstructed at 1440/390/320 at 100% and 200% with the hero CTA reachable.
- `astro check` 0 errors, 0 warnings; build ok; normal suite **404 passed** (`evidence/full-suite.txt`; an earlier run of the same suite had 1 failure in the restored-scroll test, fixed as described and re-run).

## Limitations
- Wording is for the demo only; no production consent policy is approved or implied. If analytics or marketing is ever enabled, a consent mechanism must be designed first.
- The cookie page's draft section titles still describe "your choice", which no longer exists in the UI.
- Browsers that already hold `odalo.cookies` keep that inert value (deliberately not cleared).
- Hero pause/play and the services assembly were verified by the existing suites (hero coordination tests, assembly tests); no new recording was made. Not tested: Safari, Firefox, real devices, screen reader.
