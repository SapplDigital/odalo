# Delivery tests (Netlify transport), 2026-11-24

## Symptom
The "Netlify transport (intercepted)" tests in `tests/delivery.spec.ts` were reported as failing (10 tests). I could not reproduce those 10 per-test messages. With the original config (no `--ignore-lock`) and the owner's preview running on 4321, the run fails before any test starts (reproduced again in this session):

```
[WebServer] Another astro preview server is already running.
[WebServer]   URL:  http://localhost:4321
[WebServer]   PID:  41244
[WebServer] Run `astro preview stop` to stop it, or use `astro preview --force` to replace it.
Error: Process from config.webServer was not able to start. Exit code: 1
```

That is the only failure I observed. It is a plausible cause, not a proven match for the original 10. If the 10 failures show up again on a machine with no other preview running, they have a different cause and need fresh messages.

## Root cause (observed failure)
`playwright.config.ts` starts `astro preview --port 4322`. Astro keeps a per-project preview lock, so while a preview is running on 4321 the second one refuses to start and the test server never comes up. The tests' port was not the problem.

With a working server, all 12 tests in the group pass with no change to the site.

## Changes
- `playwright.config.ts`: added `--ignore-lock` to the preview command. The test server runs next to an existing preview. The owner's server on 4321 is untouched.
- `tests/delivery.spec.ts`: the hard-coded `http://localhost:4322` (route pattern, the decoy `data-endpoint`, and the expected request URL) is now derived from `TEST_PORT` (default 4322), the same way the config does it. The assertion is as strict as before. It no longer breaks when `TEST_PORT` is set.
- Site code: no change.
- Assertions altered or removed: none. Form-name, bot-field, field set, explicit yes/no booleans, absence of routing fields and the no-delivery-guarantee wording are all still asserted.

## Netlify detection markup
The built audit pages (`dist/{en,es,de}/audit/`) contain the static form named `audit` with `data-netlify="true"`, `data-netlify-honeypot="bot-field"` and `netlify-honeypot="bot-field"`, plus the `form-name` hidden input and the `bot-field` honeypot. The test "one shared form name with the complete schema..." covers this.

## Result
Before the test edit: `npm run verify` gave 728 passed, 188 skipped, 0 failed. After the test edit I have not re-run it. The runner's `verify` check covers that.
