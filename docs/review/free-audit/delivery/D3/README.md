# D3 — Netlify activation: artifact ready, activation BLOCKED on Netlify login

**Outcome (27 Oct 2026):** the reviewed production artifact is built, audited and packaged. **Nothing was deployed and nothing was changed in Netlify**, because no authenticated Netlify access exists in this environment. No form is registered, no notification exists, no test submission was made, and inbox receipt is **pending**. Per the task, I stopped at the bounded steps below instead of waiting.

## 1. Access check (what I actually tried)

| Route | Result |
|---|---|
| Claude in Chrome (your signed-in browser) | Extension not connected. |
| Built-in browser pane, `https://app.netlify.com/projects/sappl-odalo/forms` | Netlify **login wall** (no signed-in session). I do not enter credentials or use social login for you. |
| Netlify CLI / `netlify.toml` / linked-site metadata | CLI not installed, no `netlify.toml`; I did not install anything and did not open the CLI config folder under `%APPDATA%` (may hold tokens). |
| Public, read-only | `curl` works (below). |

Forms eligibility, plan, usage/limits and existing notifications are therefore **unknown/unverified**. No paid upgrade or setting was touched.

## 2. Target identity (both names, read-only)

`https://odalo.sappl-digital.de` and `https://sappl-odalo.netlify.app` return the **same ETag** and the same platform marker `data-netlify-site-id="e5fd1e5f-99b7-4bfa-b6d4-f5e49b425098"` (`evidence/live-baseline-and-access.txt`). That site id is the one to compare with Project configuration > General in the dashboard before any change. `sappl-digital-portfolio` is not involved.

**What is live now:** an older build (`<title>` "Request a free audit", mailto `Sebastian.Appl@sappl-digital.de`, no form registration, `noindex`, robots `Disallow: /`, canonical `https://odalo.sappl-digital.de`). From the page content it matches git `master` (`f45dc11`, before the mosaic redesign), i.e. the live site is **not** the branch we reviewed.

## 3. The artifact

- Path: `docs/review/free-audit/delivery/D3/artifact/dist/` (130 files) and `artifact/odalo-dist-netlify-transport.zip` (3,642,574 bytes, SHA-256 `587FF95A6FE62A4340399109859E98AAF3DAF8F18B5F0FA59CEBD0365BEBD07A`; the zip was created after the build, so its hash differs from the content id).
- Content id (SHA-256 over the sorted per-file hashes, `evidence/artifact-manifest.sha256.txt`): `da4339d3f71cd6364259b3cbcb14c9c5e00c460d5b28261ab9e452d10cdb9636`.
- Built from: branch `feature/mosaic-redesign`, HEAD `ff22ee1` **plus the uncommitted working tree** (D2 and earlier audit work), by `node docs/review/free-audit/delivery/D3/build-artifact.mjs` (log: `evidence/build-output.txt`).
- Build environment: `SITE_URL=https://odalo.sappl-digital.de`, `SITE_BASE` unset (root), `PUBLIC_NOINDEX=true` (unchanged policy, matches live), `PUBLIC_AUDIT_TRANSPORT=netlify`, `PUBLIC_AUDIT_ENDPOINT` unset. I inferred `PUBLIC_NOINDEX=true` and `SITE_URL` from the live site; confirm they are the values in Netlify's environment.
- Audit (`evidence/artifact-audit.json`), EN/ES/DE: form `name="audit" data-netlify="true" netlify-honeypot="bot-field"` with hidden `form-name=audit`; all 15 schema names present (`form-name, bot-field, name, email, business, need, website, country, language, service, plan, phone, privacy, marketing, pageLanguage`); `data-transport="netlify"`, `data-netlify-path="/"`, no endpoint attribute; submit disabled in the HTML; the only mailto is `info@sappl-digital.de`; `noindex` kept; canonical on the production origin; no demo notice in the form. **No private recipient address in any HTML/JS/CSS/XML/TXT/JSON file**, and no docs, evidence, markdown or source maps in the artifact. This is a build-output check only: it does not prove Netlify's own processing registers the form.

## 4. Two things to decide before publishing

1. **The artifact replaces the whole site**, not just the audit page: it is the redesigned branch (new mosaic identity, legal pages, EN/ES/DE audit) while production is the older `master` build. It stays `noindex`, but every page changes. If you want the audit change on the old design, that needs a different build and is a separate task.
2. **Manual deploy vs Git.** Dragging `dist` onto a Git-linked project is supported by Netlify but, as I understand it, it publishes that one deploy and may pause automatic publishing from Git until you re-enable it ("Start auto publishing"); confirm in the UI. The Git route would require committing the whole uncommitted tree and pushing a production branch, which the planner ruled out here. I did not do either.

## 5. Exact minimal steps for you (about 10 minutes)

1. Sign in at https://app.netlify.com and open the project **sappl-odalo** (check Project configuration > General shows site id `e5fd1e5f-99b7-4bfa-b6d4-f5e49b425098` / domain `odalo.sappl-digital.de`).
2. **Forms > Enable form detection** (must be done before step 4; takes effect with the next deploy). Note the plan/limits shown on the Forms or Usage page and tell me if it asks for an upgrade; do not accept one without deciding.
3. Optional but recommended for future Git builds: Project configuration > Environment variables > add `PUBLIC_AUDIT_TRANSPORT` = `netlify` (scope Builds). Not needed for the artifact (the value is baked into it).
4. **Deploys** tab: drag the folder `docs/review/free-audit/delivery/D3/artifact/dist` (or the zip) onto the drop zone. Copy the new **Deploy ID** (and whether it says published).
5. **Forms** tab: the form **`audit`** should be listed (one form for EN/ES/DE). If not, detection was off during that deploy: confirm step 2 and redeploy the same artifact once.
6. **Forms > Submission notifications > Add notification > Email notification**, form `audit`, **one entry per recipient** (first check the list for existing entries and do not duplicate): `info@sappl-digital.de`, `sebastian.appl@sappl-digital.de`, `bastiappl12@gmail.com`. Leave the subject at the default; no auto-response.
7. Open https://odalo.sappl-digital.de/en/audit/ and submit **once** (below). Then tell me the deploy ID and when you submitted; or let me continue as in the shortcut.

**Shortcut:** the built-in browser pane is open on the Netlify login page. If you sign in there yourself (I never enter credentials), I can perform steps 2, 5, 6 and the verification submission and read the Forms dashboard myself; step 4 still needs you, because I have no file-upload tool in that pane. Alternatively connect the Claude in Chrome extension.

## 6. The single verification submission

Language EN, business `D3 verification - ignore`, name `Odalo owner (test)`, email `info@sappl-digital.de` (the working inbox, so Reply-To is checkable), need: `D3 verification - ignore. Controlled test of the new audit request form; please do not answer.`, website empty, service `Website`, plan `Local`, marketing **unchecked**, privacy checked. Expect "Request received". In Netlify > Forms > `audit` expect one entry (Verified, or in Spam if Akismet flags it: mark verified, do not resubmit) with `form-name=audit, name, email, business, need, language=en, service=web, plan=local, privacy=yes, marketing=no, pageLanguage=en`, empty `website/country/phone/bot-field`. Then confirm in **each** of the three inboxes (check spam) that the notification arrived and that Reply-To is `info@sappl-digital.de`. Do not delete the stored test unless you decide to.

## 7. Status table

| Item | Status |
|---|---|
| Artifact built, audited, hashed | Done, local |
| Target project identified | Partly: same site id on both names; dashboard name/id not confirmed (no login) |
| Forms detection enabled | **Not done** (needs login) |
| Artifact deployed / deploy ID | **Not done** |
| Form `audit` listed by Netlify | **Not verified** |
| Notifications to the 3 recipients | **Not configured / not verified** |
| Verification submission, stored fields | **Not done** |
| Inbox receipt + Reply-To (per inbox) | **Pending** (info@: ; sebastian.appl@: ; bastiappl12@: all pending owner/my verification) |
| Failure/retry behavior | Verified locally in D2 (intercepted); no live failure test (unneeded resubmissions avoided) |
| Forms plan/limits/charges | **Unknown** |

## 8. State

Source files changed in D3: none. Added: this folder only (`build-artifact.mjs`, `artifact/`, `evidence/`). The full suite was not re-run (source unchanged since the 635-pass run). No server of mine is running; the built-in browser pane is open on the Netlify login page and can be closed. Nothing was committed, pushed or deployed; no environment, domain, DNS or mailbox change.

---

## 9. Update after owner sign-in (built-in browser pane, 27 Oct 2026, read-only except one setting)

Signed in as the owner's Netlify account (bastiappl12@gmail.com, team "Sappl12's team"). Nothing was deployed or uploaded.

**Project identity - confirmed.** Project configuration > General: name `sappl-odalo`, Project ID `e5fd1e5f-99b7-4bfa-b6d4-f5e49b425098` (identical to the site id found on both odalo.sappl-digital.de and sappl-odalo.netlify.app), created Oct 22, production domain `odalo.sappl-digital.de`. No domain/DNS setting was opened or changed.

**Change made (the only one):** Forms > **Enable form detection** was clicked. Before: Forms page offered the button (detection was off). After: the page reports "Form detection is enabled" (also under Forms > notifications tab: "Form detection is enabled"). No paywall or upgrade prompt appeared. Forms plan, usage and limits are still not visible to me (no usage/billing page was opened), so eligibility beyond "the button worked" is unverified.

**Existing form notifications:** none. The Forms > Submission notifications list is empty ("No webhooks set up yet"); nothing exists to deduplicate. I have NOT created the three notifications yet, because they are scoped to the form `audit`, which Netlify can only list after a deploy has been processed with detection on.

**Environment variables:** none set for the project ("No environment variables set"). `PUBLIC_AUDIT_TRANSPORT` is not set (I changed nothing).

**Build/deploy configuration (read-only):**
- Repository `github.com/SapplDigital/odalo`; **production branch `releases/2026.1.0`**; branch deploys: production branch only; deploy previews for pull requests against it.
- Build command in Netlify: `SITE_URL=https://odalo.sappl-digital.de SITE_BASE=/ PUBLIC_NOINDEX=true npm run build`; publish `dist`; base `/`; Node 24.x; functions dir `netlify/functions` (none exists in the repo).
- My artifact used exactly those three values (SITE_BASE unset = `/`), plus `PUBLIC_AUDIT_TRANSPORT=netlify`. So the earlier inference about `PUBLIC_NOINDEX` and `SITE_URL` is confirmed by the real build command.
- Enforce deployment methods: "All deployment methods can deploy to production" (CLI, MCP, API, Git).

**Git auto-publishing / lock state (current):** Deploys page: "Published `releases/2026.1.0@f45dc11` ... **Auto publishing is on.** Deploys from releases/2026.1.0 are published automatically." A "Lock to stop auto publishing" button is shown, i.e. the project is **not locked**. Last published deploy: Production `releases/2026.1.0@f45dc11`, "Add operator identity, real legal pages and accurate cookie notice", Oct 22 11:13 AM. Earlier: `releases/2026.1.0@4dde90c` (10:38), `master@4dde90c` (10:32). I did not assume that a manual deploy pauses auto publishing; I did not create one. After any upload, re-read this line.

**Upload route - finding:** the Deploys page of this Git-linked project shows **no drag-and-drop drop zone and no "deploy manually" option** (text and screenshot checked: only Deploy settings, Notifications, Lock to stop auto publishing, the deploy list). So "drag the dist folder onto the project" as written in section 5 is **not available in the dashboard for this project**. Remaining routes for the reviewed code:
1. **Netlify CLI** (`netlify deploy --prod --dir=dist --site e5fd1e5f-99b7-4bfa-b6d4-f5e49b425098`): allowed by "Enforce deployment methods", but the CLI is not installed and logging in needs your authorization; installing it needs your explicit approval (I installed nothing).
2. **Git**: commit the reviewed work and push to `releases/2026.1.0` (production) - this triggers the Netlify build with the build command above, so `PUBLIC_AUDIT_TRANSPORT=netlify` would first have to be added as an environment variable (scope Builds), and the whole uncommitted tree would be committed (the planner ruled this out without a reviewed source-publication scope).
3. **Netlify Drop** (https://app.netlify.com/drop) creates a NEW project: not allowed here.
Pushing anything, uploading anything, or installing the CLI waits for your decision.

**Stop point (as you requested):** before any production upload I need your explicit confirmation that publishing the **whole reviewed redesign** (every page, new identity, `noindex` kept) to odalo.sappl-digital.de is intended, and which upload route (1 or 2) you approve. Notifications and the verification submission follow the deploy.


---

## 10. Deployment and activation (27 Oct 2026, after owner approval and CLI authorization)

**Deployed.** `npx netlify-cli@27.15.0 deploy --prod --no-build --json --site e5fd1e5f-99b7-4bfa-b6d4-f5e49b425098 --dir ...\D3\artifact\dist` (exit 0). No rebuild, commit, push, new project, DNS or Git-auto-publishing change. Before the upload the 130 files were re-verified against the saved manifest (match, content id `da4339d3f71cd6364259b3cbcb14c9c5e00c460d5b28261ab9e452d10cdb9636`; `evidence/manifest-verification-before-deploy.txt`).
- **Production deploy ID: `6ae0e49efa58740f36caccdd`**, site `sappl-odalo` (`e5fd1e5f-...`), published 17:51 (dashboard "Production Published, Today at 5:51 PM"). Unique URL `https://6ae0e49efa58740f36caccdd--sappl-odalo.netlify.app`, logs `https://app.netlify.com/projects/sappl-odalo/deploys/6ae0e49efa58740f36caccdd`. Raw CLI output: `evidence/deploy-output.json`.
- CLI: `netlify-cli@27.15.0` via npx (cache only; no global install, no dependency change). Login was authorized by the owner in the browser pane.

**Live check** (`evidence/live-verification-after-deploy.txt`): EN/ES/DE `/audit/` on odalo.sappl-digital.de (and sappl-odalo.netlify.app for EN) serve `data-transport="netlify"`, `data-netlify-path="/"`, `noindex`, `robots.txt` Disallow, only `mailto:info@sappl-digital.de`, no private address. **Platform-processed HTML:** the served `<form>` no longer carries `data-netlify` / `netlify-honeypot` (Netlify stripped them while processing), which is the sign the deploy was processed as a form.

**Netlify lists the form (API, read-only):** form `audit`, id `6ae0e4a72ef1f1c9a4ce32e7`, detected fields `pageLanguage, bot-field, business, need, website, service, plan, country, name, email, phone, language, privacy, marketing` (the schema from the HTML; `form-name` is Netlify's selector). Dashboard Forms: "1 form collecting data ... Active forms: audit".

**Notifications.** Before: no form notifications (project deploy notifications to bastiappl12@gmail.com pre-existed and were not touched). Now three email notifications, event "New form submission", each scoped to **form `audit`** (verified through the API `form_id` / `form_name`), no duplicates (list re-read afterwards):
1. info@sappl-digital.de (hook `6ae0e5b32da44041671ef0aa`)
2. sebastian.appl@sappl-digital.de (hook `6ae0e59a811fb2480c19deda`)
3. bastiappl12@gmail.com (hook `6ae0e5ad336dd389d64672f1`)

Default subject; no auto-reply. The first notification I created in the dashboard saved as "any form" (the dashboard form picker did not persist the choice and an update call was rejected with 422), so I removed that entry (my own, hook `6ae0e511a17f006b6f823cfd`) and created all three through the Netlify API with the audit form id. Recipient list: `evidence/hooks-raw-private.json` (private; contains addresses).

**Single verification submission** (live, `https://odalo.sappl-digital.de/en/audit/`, 17:56:46Z; fields filled by script in the owner-signed-in browser pane, submit pressed with a real click):
- Business `D3 verification - ignore`; name `Odalo owner (test)`; email `info@sappl-digital.de`; need "D3 verification - ignore. Controlled test of the new audit request form; please do not answer."; service Website (`web`), plan Local (`local`); language en; marketing unchecked; privacy checked.
- **Page:** "Request received - Your request was submitted and accepted for processing. You can also write to the email address on this page." Form reset, summary back to "No preference", no retry button.
- **Stored in Netlify (API, `evidence/submissions-raw-private.json`, IP and user agent removed):** submission `6ae0e5de6a0daec1afbbc7cc`, form `audit`, number 1, `pageLanguage=en, business, need, website="", service=web, plan=local, country="", name, email=info@sappl-digital.de, phone="", language=en, privacy=yes, marketing=no`; referrer the audit page. The empty `bot-field` is not stored (expected). All expected fields present.

## 11. Status after activation

| Item | Status |
|---|---|
| Artifact deployed to production, deploy ID | **Done**: `6ae0e49efa58740f36caccdd` |
| Netlify lists form `audit` with full schema | **Verified** |
| Form detection | Enabled before the deploy |
| Notifications to the 3 recipients, audit-scoped | **Configured, verified in settings** |
| Page "received" state | **Verified** |
| Stored submission with all fields | **Verified** |
| Inbox receipt, info@sappl-digital.de | **PENDING owner confirmation** |
| Inbox receipt, sebastian.appl@sappl-digital.de | **PENDING owner confirmation** |
| Inbox receipt, bastiappl12@gmail.com | **PENDING owner confirmation** |
| Reply-To = info@sappl-digital.de in the received mails | **PENDING owner confirmation** |
| Git auto-publishing | Still shown "on" (not locked) after the manual deploy, so the dashboard did not pause it; unchanged by me |
| Forms plan/limits | Not visible to me; detection, the deploy and one submission worked without any upgrade prompt |

A stored submission and an HTTP success do not prove email delivery: please check each inbox (and spam folders) for the Netlify mail about form "audit" at about 17:56 UTC and its reply-to.

## 12. Risks and remaining owner actions

1. **A Git push to `releases/2026.1.0` would replace this deploy** (auto publishing is still on). That Git build has no `PUBLIC_AUDIT_TRANSPORT`, so it would publish a simulated build and undo this. Owner decision (I changed nothing): lock auto publishing, or add `PUBLIC_AUDIT_TRANSPORT=netlify` as a build variable and publish the reviewed code through Git later.
2. Confirm the three inbox receipts and Reply-To.
3. The test submission is stored in Netlify; I did not delete it (Forms > audit > Verified submissions). Netlify stores submissions: retention, processor and privacy-notice review are still open.
4. The CLI login created an authorization for "Netlify CLI" on your account; the token stays in the local CLI config. Revoke it at app.netlify.com > User settings > Applications, or tell me to run `netlify logout`.
5. The site stays `noindex`; the redesign is now live on the existing domain (owner-approved).
6. `evidence/hooks-raw-private.json` and `submissions-raw-private.json` hold addresses and test data: do not publish `docs/`.


---

## 13. Update: recipient list corrected (owner, 27 Oct 2026)

The owner reports that `sebastian.appl@sappl-digital.de` no longer exists (replaced by `info@sappl-digital.de`). The notification to that address (hook `6ae0e59a811fb2480c19deda`) was deleted through the Netlify API and the list re-read: **two** audit-scoped email notifications remain, `info@sappl-digital.de` (hook `6ae0e5b32da44041671ef0aa`) and `bastiappl12@gmail.com` (hook `6ae0e5ad336dd389d64672f1`). This supersedes the three-recipient list in sections 10-11 and in the planner's D2/D3 prompts (the old "as well" interpretation had listed the removed address).

Owner-reported receipt of the test mail (verification submission 17:56:46Z): **received in bastiappl12@gmail.com and in the sappl-digital.de inbox (info@)**. Reply-To of the received mails was not reported and stays **unconfirmed**. Receipt on `sebastian.appl@` is moot (address removed).

Still open: confirm Reply-To = `info@sappl-digital.de`; the historical root `HANDOFF.md` still lists the removed address as a required recipient (preserved as a historical record, not edited); privacy/retention review; Git auto-publishing risk; CLI authorization; test submission kept in Netlify.


---

## 14. Production deploy locked (27 Oct 2026)

Production deploy locked (27 Oct 2026, owner-approved): published deploy `6ae0e49efa58740f36caccdd` on project `sappl-odalo` (e5fd1e5f-99b7-4bfa-b6d4-f5e49b425098) was verified as the published deploy and locked with the Netlify API (`lockDeploy`); read back: `locked: true`, state `ready`, context production, published 2026-10-27T17:51:38Z. Git pushes to `releases/2026.1.0` may still build, but they are NOT published while the lock is on.

Before locking, `getSite` returned `published_deploy.id = 6ae0e49efa58740f36caccdd` (production, branch field `releases/2026.1.0`, published 17:51:38Z, locked null), so no different deploy was published. No rebuild, redeploy, commit, push, domain or indexing change; no tests were re-run (settings and documentation only).

### Current status summary
- Audit is live: the redesigned site, including the EN/ES/DE free-audit page with the Netlify Forms integration, is published at https://odalo.sappl-digital.de (still `noindex`). Public contact is `info@sappl-digital.de`.
- Notifications: only **`info@sappl-digital.de`** and **`bastiappl12@gmail.com`** receive audit submissions (two Netlify email notifications scoped to form `audit`). `sebastian.appl@sappl-digital.de` no longer exists and its notification was removed.
- Receipt confirmed by the owner for both inboxes (test submission 17:56:46Z, stored in Netlify as submission 6ae0e5de6a0daec1afbbc7cc and kept). **Reply-To remains unconfirmed.**
- **Production deploy is locked** (27 Oct 2026, owner-approved): published deploy `6ae0e49efa58740f36caccdd` on project `sappl-odalo` (e5fd1e5f-99b7-4bfa-b6d4-f5e49b425098) was verified as the published deploy and locked with the Netlify API (`lockDeploy`); read back: `locked: true`, state `ready`, context production, published 2026-10-27T17:51:38Z. Git pushes to `releases/2026.1.0` may still build, but they are NOT published while the lock is on.
- The existing Netlify CLI authorization (netlify-cli@27.15.0 via npx) is unchanged and still active on this machine.
- Open: Reply-To check, Netlify submission storage/retention and privacy-notice review, native ES/DE review, Forms plan/limits (not visible to the coder).

### How to unlock deliberately
**Deliberate unlocking (only after the reviewed source and build configuration are ready):**
1. Commit the reviewed source (owner-approved scope) to the production branch `releases/2026.1.0`, or choose another reviewed deploy.
2. In Netlify > Project configuration > Build & deploy > Environment variables add `PUBLIC_AUDIT_TRANSPORT` = `netlify` (scope Builds). The existing build command already sets `SITE_URL=https://odalo.sappl-digital.de SITE_BASE=/ PUBLIC_NOINDEX=true`; do not set `PUBLIC_AUDIT_ENDPOINT`. Without the variable a Git build publishes the simulated form.
3. Let the Git build finish and check its deploy preview URL (audit page shows `data-transport="netlify"`, form `audit` listed, `info@sappl-digital.de` only, noindex).
4. Netlify > Deploys > the chosen deploy > **Publish deploy**, or on the locked deploy use **Unlock to start auto publishing** (dashboard) / API `unlockDeploy`; then re-check live pages, the Forms list, the two notifications and one controlled submission.
Do not unlock before steps 1-3, or the next Git build will replace the working audit with a build that has no Netlify transport.
