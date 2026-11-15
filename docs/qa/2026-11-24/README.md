# QA 2026-11-24

(Full issue list, screenshots: later milestone.)

## Deleted specs

- `tests/services-motion.spec.ts`: tested the home page's services assembly/travel animation, hero-pause coordination and `[data-mosaic]`/`.tile` tiles, which `ServiceMosaic` no longer renders on the home page since the mosaic redesign (ba8aa35, HomeMosaic). **Status: the automated coder cannot delete files, so per owner decision (2026-11-15) the file content was replaced by a single `test.describe.skip` block titled "retired: ..."; PAOLO deletes the file after the loop.**

## Rewritten specs

- `tests/about.spec.ts`: now asserts the About page only (the home page no longer carries `#about`); added a check that home has no `#about`.
- `tests/services-mosaic.spec.ts`: dropped the home picture-tile/hover/phone/no-JS tests (feature removed in ba8aa35); kept the service-visual data test and the 12 service-page tests, plus a single-h1 check.
