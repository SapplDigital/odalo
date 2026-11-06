# D2 — public email + Netlify Forms (local preparation)

**Status: ready locally, NOT live.** Nothing was deployed, no Netlify setting was touched, no real request or email was sent. Backend processing exists only after a Netlify deploy that detects the form (steps below). This file names the three private notification recipients: **keep `docs/` out of any public commit/repo until the owner decides.** The recipients appear nowhere in `src/`, `public/` or the built site (checked by the verify script and `tests/delivery.spec.ts`).

## 1. What changed

| Area | Change | Files |
|---|---|---|
| Public contact | `site.contact.email` is now `info@sappl-digital.de`. Footer, audit summary panel, no-JS note, legal contact card and every other place that reads the config show it (EN/ES/DE). No other source file contained the old address; the legal pages read the config, so no policy wording changed. The old/private addresses still appear in the owner's historical root `HANDOFF.md` recipient record and in older review evidence (preserved on purpose). | `src/config/site.ts`, `tests/legal.spec.ts` |
| Transport mode | New explicit config: `PUBLIC_AUDIT_TRANSPORT=netlify`. `site.auditTransport` = `netlify` \| `json` \| `simulated`, `site.auditLive`. Never inferred from hostname or from any local response. `netlify` wins if `PUBLIC_AUDIT_ENDPOINT` is also set; the generic JSON endpoint path is untouched otherwise. | `src/config/site.ts`, `src/components/AuditForm.astro`, `src/i18n/ui.ts`, `src/components/FinalCta.astro` |
| Registration | The real form is the registration: `<form name="audit" method="post" data-netlify="true" netlify-honeypot="bot-field" data-netlify-honeypot="bot-field">` with hidden `form-name=audit`, hidden `pageLanguage`, honeypot `bot-field`, and every visitor field present as a named input. One shared name for EN/ES/DE (three pages, identical schema). No extra registry page: the built audit pages already contain the form. Registration markup is emitted in every build mode; it is inert (submit is disabled without JS). | `AuditForm.astro` |
| Encoding | `encodeNetlify` / `submitNetlify`: `application/x-www-form-urlencoded` POST to `site.netlifyForm.path` (= `BASE_URL`, i.e. `/` in production). `res.ok` = accepted; HTTP errors and network failures = failed (entries kept, Retry). | `src/lib/submit.ts` |
| Wording | Accepted result (all modes with a live transport): "Request received / Your request was submitted and accepted for processing. You can also write to the email address on this page." (ES/DE equivalents). It no longer says "delivered" or promises a reply. Simulation and failure wording unchanged. | `src/i18n/ui.ts` |
| Docs/config | `README.md` configuration table gains `PUBLIC_AUDIT_TRANSPORT`. | `README.md` |
| Tests | `tests/delivery.spec.ts` (new, 20 tests). Intentional expectation changes: the source-pattern guards for the demo condition now read `site.auditLive` (`tests/closing.spec.ts`, `tests/content.spec.ts`). | tests |

## 2. Field schema (registered in HTML = submitted)

`form-name` (`audit`), `bot-field` (honeypot, empty for people), `name`, `email` (**this name makes Netlify use it as Reply-To**), `business`, `need`, `website`, `country`, `language`, `service`, `plan`, `phone`, `privacy`, `marketing`, `pageLanguage`.
Mapping from the existing JSON payload: `privacyAccepted` -> `privacy`, `marketingOptIn` -> `marketing`, everything else keeps its name. **Booleans are text:** `privacy` = `yes` (required, so valid submissions always carry `yes`), `marketing` = `yes` or `no`. `service` is the production id (`web|local|video|ads|''`), `plan` the plan id (`base|local|captacion|360|''`), `language` the preferred language (`es|en|de`), `pageLanguage` the page the visitor used. Optional fields are always present, possibly empty, so the schema is complete. There is no `subject`, `to`, `cc`, `bcc` or sender field, so visitors cannot steer routing (asserted by a test). No visitor confirmation email and no marketing subscription is created; `marketing` is information only.

## 3. Netlify setup (site owner; exact steps)

I could not inspect the Netlify account: there is no `netlify.toml`, the Netlify CLI is not installed, and I did not open the CLI config directory that exists under `%APPDATA%` because it may contain tokens. Everything below therefore comes from the current Netlify docs (read 27 Oct 2026: forms/setup, notifications, spam-filters, troubleshooting) and must be confirmed in the UI. Plan eligibility, submission limits and notification quotas are **not verified**.

1. **Environment variable** (Site configuration > Environment variables, scope: Builds). Astro inlines `PUBLIC_*` at build time:
   - `PUBLIC_AUDIT_TRANSPORT` = `netlify`
   - Do **not** set `PUBLIC_AUDIT_ENDPOINT`.
   - Existing site variables stay as they are: `SITE_URL` (the production origin, `https://odalo.sappl-digital.de` if that is the live domain), `PUBLIC_NOINDEX` (unchanged until the owner approves indexing). Do **not** set `SITE_BASE` (production serves from the root; the form POST path is `/`).
   - Build settings: `npm run build`, publish directory `dist` (confirm they are what the site already uses).
2. **Form detection:** Netlify UI > **Forms** > **Enable form detection** (if previously disabled: Forms > Form detection > Enable). Per the docs it takes effect with the **next deploy**; re-enabling needs a redeploy.
3. **Deploy** the working tree (commit/deploy is a separate, owner-approved step; not done here). After the deploy, Forms should list one form named **`audit`** (a single form even though three language pages contain it). If it does not appear, detection was not active during that deploy: enable it and redeploy.
4. **Notifications** (Forms > Submission notifications > Add notification > Email notification), scope **form `audit`** (or all forms): the docs do not say whether one notification takes several addresses, so create **one notification per recipient**:
   - `info@sappl-digital.de`
   - `sebastian.appl@sappl-digital.de`
   - `bastiappl12@gmail.com`
   Leave the subject in the UI (do not add a `subject` input to the HTML; a visitor-controlled subject is deliberately absent). Replies go to the submitter automatically because the field is named `email`. Notifications are sent for **verified** submissions only; Akismet-flagged ones land in "Spam submissions"; honeypot hits are rejected silently.
5. **Do not** add a reCAPTCHA or paid add-on without owner approval (not needed for this milestone).

Public-facing behavior after step 1-3 on Netlify: the audit form shows no demo notice, the button reads "Request audit" and submissions are POSTed urlencoded to `/`. Without step 1 the same deploy still registers the form but the UI stays a truthful simulation.

## 4. Controlled end-to-end test and inbox verification (D3)

1. Open the live `/en/audit/` in a normal browser. Submit **one** clearly recognizable sample: business `D3 TEST - ignore`, a real-looking name and a mailbox you control as `email`, a full-sentence `need`, service and plan chosen through the mosaic, marketing unchecked. (Akismet may flag unnatural test text; if it lands in Spam, mark it verified rather than assume failure.)
2. Expect the UI result "Request received" and the form to reset. In Netlify > Forms > `audit` > Verified submissions confirm all fields (including `service`, `plan`, `language`, `pageLanguage`, `privacy=yes`, `marketing=no`).
3. Verify arrival in **each** of the three inboxes (check spam folders) and that Reply-To is the sample email. Record time sent/received and a screenshot of headers without personal content. A 2xx response alone does **not** prove notification delivery; only the inbox check does.
4. Failure path: with the browser offline (devtools) submit again; expect "We could not send your request", entries kept, Retry. Re-enable network and Retry.
5. Delete the test submission in Netlify afterwards. Repeat once in `/es/` and `/de/` if wanted.
6. Only then change `PUBLIC_NOINDEX` or advertise the URL (D4).

## 5. Privacy / operations to decide (not changed here)

Netlify **stores every submission** (name, email, phone, free text, consent flags) in addition to sending notifications. Owner review needed: retention period and deletion routine in Netlify, Netlify as a data processor (agreement), whether the existing privacy notice covers storage and the three recipients, and who monitors the inbox. I did not edit any legal text.

## 6. Results (actual)

- `astro check`: 0 errors, 0 warnings, 19 hints. `npm run build`: 47 pages (`evidence/command-output-check-build.txt`).
- Targeted: `tests/delivery.spec.ts` 20 tests (public email EN/ES/DE on 4 page types each, config pin, registration markup + schema + honeypot a11y in 3 languages, default simulation makes no POST, urlencoded Netlify body with every field and booleans, Netlify precedence over a JSON endpoint, pure encoder, accepted wording/reset/summary in 3 languages, honeypot pass-through, HTTP 500/404/429 and network failure with retry, duplicate-click guard = exactly 1 POST, validation first, no-JS lockout in 3 languages). All requests are intercepted by `page.route`; every non-local request is aborted.
- **One normal isolated full suite after the last code change: 635 passed, 0 failed, 0 skipped, no retries, 5.1 min** (`evidence/command-output-full-suite.txt`). An earlier run of the same suite found 40 failures, all caused by my first honeypot implementation (an off-screen box at left:-9999px tripped the repo's reflow audit, which requires every box inside the viewport); I replaced it with the global `.sr-only` clip and re-ran; the 595-pass/40-fail output was overwritten by the final run and is mentioned here for honesty.
- `verify.mjs` (built-HTML proof + compiled-page interception, run after the final change): 0 of 9 registration/field/email checks failing (3 builds x EN/ES/DE); compiled netlify page posts exactly one `application/x-www-form-urlencoded` request to `/` with the full schema, shows "Request received", resets entries and summary; against a plain static host (POST answered 405) it shows the failure state with entries kept and Retry, proving live mode is never inferred; the `/odalo/` fixture posts to `/odalo/`; all mailto links are `info@sappl-digital.de`; no old/private address in any built page; no external request.

## 7. Evidence (`evidence/`)

`verify-result.json` and `verify.mjs`: builds three configurations (default, `PUBLIC_AUDIT_TRANSPORT=netlify`, netlify + `SITE_BASE=/odalo/`), extracts the form tag, field names, transport attributes and mailto links from the BUILT HTML for EN/ES/DE (9 checks), then drives the compiled netlify page in Edge with every request intercepted (urlencoded body, root path, accepted result and reset, static-host 405 shown as failure, `/odalo/` fixture posting to `/odalo/`, email links). Screenshots: `1440-en-netlify-received`, `1440-en-netlify-static-host-405-failed`, `390-{es,de}-netlify-received`, `1440-{en,es,de}-footer-contact`. Viewed: `1440-en-netlify-received`, `390-de-netlify-received`, `1440-es-footer-contact`, `1440-en-netlify-static-host-405-failed`; the others are generated, not individually viewed. Path assumptions: production = root build, POST to `/`; `/odalo/` is only a fixture and would need the same Netlify setup at that sub-path (not planned).

## 8. Limits and remaining Netlify actions

- Not verified: Netlify plan/limits, that detection is enabled, that notifications reach the three inboxes, that `/` accepts the POST on this site (documented behavior, unproven here; a 404 would surface as the failure state). All of that is D3.
- Success wording means "accepted", never "arrived".
- No server-side validation beyond Netlify's built-in handling (Akismet, honeypot); client validation can be bypassed by anyone posting directly, and there is no durable rate limit.
- ES/DE strings are my translations, not natively reviewed.
- The no-JS lockout from FA3A is unchanged: without JavaScript nothing can be submitted and the email link is the alternative.
