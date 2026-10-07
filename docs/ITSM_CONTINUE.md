# Mavi Vadi ITSM — current continuation checkpoint

Updated: 7 October 2026.

## Delivered
- ITSM live: https://mavi-vadi-itsm.gokhan-agingil.chatgpt.site
- Separate ITSM Site: appgprj_6ac62ba86ea48191babde5b3c0d38828. Reuse this ID; do not create another Site.
- Published source commit: 3e4482ff74439bdc313527688c2da5519b0aab8b. Source tree: 50b79ba39781826d3957ed7bceab77ab7494c87b.
- Source PR: https://github.com/Gokhanagingil/simulasyon/pull/4 (ITSM under editions/itsm; original GRC remains at repository root).
- 12 events, 8 roles, 4 services, 10 CIs, animated visitor queue and lion-fence warning.
- Trainer scenario studio: add/copy/remove cards, edit decisions, effects, prerequisites, SLA policies and phases; import/export JSON without code changes. Per-workshop persistence and revision checks. Released event text is immutable; open SLA due dates do not change retroactively.
- Problem closure requires verified permanent change. Local workshop SLA uses real elapsed time, and breach evidence survives resolution.
- 19 Node tests, JS syntax/scenario validation, TypeScript and production build passed. Application and ITSM GitHub checks passed; last code tree is unchanged by these checkpoint edits.
- Published privately to existing owner-only audience. GRC source/database/site unchanged.

## Preserve user intent
GRC and ITSM are separate versions. The zoo story, humor and animation matter. Scenarios must remain configurable without coding. Niles requirement means a REAL Niles record and official SLA breach after real elapsed time, not this app's local timer. Only Niles staging is authorized.

## Niles prerequisite — fixed and deployed
- User securely signed in to https://niles-grc.com; session showed Demo Admin, SYSTEM ADMINISTRATOR.
- Original tenant creation returned Validation failed: the frontend omitted initialOwner.email, initialOwner.temporaryPassword and Idempotency-Key required by the existing backend contract. No Mavi Vadi tenant was created by those attempts.
- Narrow correction: https://github.com/Gokhanagingil/grc/pull/1920, merged as a7341eeeaa17fd904954e54fc2ca486e0c4a04ff.
- Adds owner fields, safe retry key, validation and English/Turkish catalog text. Backend authorization is unchanged.
- Local checks: 9 targeted AdminTenants tests, full frontend hygiene (ESLint + CI=true production build), i18n integrity and no-new-visible-literal-debt checks, architecture guard and tests passed.
- PR checks passed (31 success, 7 expected skips); exact-main gates passed (32 success, 5 expected skips).
- Staging deployment succeeded: https://github.com/Gokhanagingil/grc/actions/runs/37631418306
- Exact-SHA REAL_STACK API and Playwright smoke succeeded: https://github.com/Gokhanagingil/grc/actions/runs/37632025424
- Control Plane reported GREEN: https://github.com/Gokhanagingil/grc/issues/1921#issuecomment-6039506439
- Operational record: https://github.com/Gokhanagingil/grc/issues/1921. Check it before repeating a deployment.
- Reloaded the live tenant page and verified both new owner fields. Prepared Tenant name = Mavi Vadi ITSM and the staging-only workshop description. Email/password remain blank; Create tenant was NOT submitted.
- Screenshot of the prepared form: niles-tenant-setup-1791381359031.jpg.

## Exact stopping point — secure user handoff
The browser is at https://niles-grc.com/admin/tenants with the prepared form. Browser security requires the user to enter a new credential and complete submission themselves. Ask the user to enter the initial owner's email and temporary password in the browser and click Create tenant; never request a password in chat.

No workshop tenant, training users, service/CI records, SLA policy or official breach has been provisioned/accepted in this turn. On resuming after user input, inspect the actual tenant list first; the user may already have completed creation. Do not create a duplicate.

## Remaining after handoff
1. Verify the new tenant identity and switch only to its context.
2. Apply the staging-only setup in editions/itsm/content/niles-itsm-setup.json. Create tenant-scoped park_varligi / Park varlığı CI class as needed; explicitly set workshop CIs to Test (the form defaults to Production).
3. Governed SLA publication requires approval by a different authorized tenant administrator. Prepare the real draft and approval request, then obtain the real approval. Do not fake independence by switching agent-controlled accounts.
4. Follow editions/itsm/docs/NILES-ACCEPTANCE.md: P2 response 4 minutes/resolution 12 minutes, 24x7, no pause. Record official SLA instance/definition IDs and start/due/breached-at timestamps after 12 real minutes; resolve and verify the breach remains.
5. Live Niles synchronization is not implemented; the manual record URL is only a reference.
6. ITSM app visual browser QA remains unverified because the Sites-required control-browser skill was unavailable. Do not confuse the verified Niles form/smoke with ITSM app visual QA.

The initial recovery notes inside editions/itsm/docs/CONTINUE-ITSM.md are historical; this file is the current checkpoint.
