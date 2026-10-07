# Mavi Vadi ITSM — current continuation checkpoint

Updated: 7 October 2026.

## Delivered
- ITSM live: https://mavi-vadi-itsm.gokhan-agingil.chatgpt.site
- Separate ITSM Site: appgprj_6ac62ba86ea48191babde5b3c0d38828. Reuse this ID; do not create another Site.
- Published source commit: 3e4482ff74439bdc313527688c2da5519b0aab8b. Source tree: 50b79ba39781826d3957ed7bceab77ab7494c87b.
- Source PR: https://github.com/Gokhanagingil/simulasyon/pull/4 (ITSM under editions/itsm; root GRC remains unchanged).
- 12 events, 8 roles, 4 services, 10 CIs, animated visitor queue and lion-fence warning.
- Trainer scenario studio: add/copy/remove cards, edit decisions, effects, prerequisites, SLA policies and phases; import/export JSON without code changes. Per-workshop persistence and revision checks. Released event text is immutable; open SLA due dates do not change retroactively.
- Problem closure requires verified permanent change. Local workshop SLA uses real elapsed time, and breach evidence survives resolution.
- 19 Node tests, JS syntax/scenario validation, TypeScript and production build passed. Application and ITSM GitHub checks passed on 654b841cd06b5f1152845b2e0cff9bb8f6256b0b.
- Published privately to existing owner-only audience. GRC source/database/site unchanged.

## Preserve user intent
GRC and ITSM are separate versions. The zoo story, humor and animation matter. Scenarios must remain configurable without coding. Niles requirement means a REAL Niles record and official SLA breach after real elapsed time, not this app's local timer. Only Niles staging is authorized.

## Niles blocker and correction
- User securely signed in to https://niles-grc.com; session showed Demo Admin, SYSTEM ADMINISTRATOR.
- Tried creating a separate Mavi Vadi ITSM tenant through Admin > Tenants. The form returned Validation failed for both Turkish and ASCII names. No new tenant, users or SLA policies were created.
- Root cause: frontend submitted only name/description, while the existing backend provisioning contract requires initialOwner.email, initialOwner.temporaryPassword and Idempotency-Key.
- Correction is PR https://github.com/Gokhanagingil/grc/pull/1920, branch fix/tenant-provisioning-form-20261007.
- Latest correction head: 329b0bddda65746c8f2388b7994f2924eb331a56.
- Adds initial owner fields, safe retry key, validation and English/Turkish catalog text. Backend authorization remains unchanged.
- Local validation: 9 targeted AdminTenants tests, full frontend:hygiene (ESLint + CI=true production build), i18n integrity and no-new-visible-literal-debt checks passed. Architecture guard and its tests passed.
- Initial PR CI failed because separate translation files were not in the governed catalog; the corrected commit moves the texts into common.json.
- PR #1920 passed 31 checks (7 expected skips) and merged as a7341eeeaa17fd904954e54fc2ca486e0c4a04ff. Main CI and supply-chain certification are running; staging has NOT been deployed yet.
- Operational state and deployment result are tracked in https://github.com/Gokhanagingil/grc/issues/1921. Check that issue before repeating any deployment or creating any tenant.

## Remaining
1. Finish the exact-main GitHub gates after the merged Niles correction. Use docs/operations/NILES-CONTROL-PLANE.md for exact-main certified staging deployment; never bypass a gate or deploy production.
2. After staging deployment, create only the separate workshop tenant with its tenant-bound initial owner. If credential entry requires secure user handoff, request it then; never collect passwords in chat.
3. Implement staging-only setup in editions/itsm/content/niles-itsm-setup.json. Follow docs/NILES-ACCEPTANCE.md and obtain official Niles SLA breach evidence after 12 real minutes, then confirm breach remains after resolution.
4. Live Niles synchronization is not implemented. The manual record URL is only a reference.
5. Visual browser QA remains unverified because the Sites-required control-browser skill was unavailable. Do not report screenshots/mobile/browser tests as passed.

The initial recovery notes inside editions/itsm/docs/CONTINUE-ITSM.md are historical; this file is the current checkpoint.
