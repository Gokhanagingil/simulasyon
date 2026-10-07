# Mavi Vadi ITSM — current continuation checkpoint

Updated: 7 October 2026, 15:26 Istanbul.

## Delivered
- ITSM live: https://mavi-vadi-itsm.gokhan-agingil.chatgpt.site
- Separate ITSM Site: appgprj_6ac62ba86ea48191babde5b3c0d38828. Reuse this ID; do not create another Site.
- Published source commit: 3e4482ff74439bdc313527688c2da5519b0aab8b. Source tree: 50b79ba39781826d3957ed7bceab77ab7494c87b.
- 12 events, 8 roles, 4 services, 10 CIs, animated visitor queue and lion-fence warning.
- Trainer scenario studio: add/copy/remove cards, edit decisions, effects, prerequisites, SLA policies, phases; import/export full JSON without code changes. Per-workshop persistence and optimistic revision checks. Released event text is immutable; open SLA due dates do not change retroactively.
- Problem closure is gated on verified permanent change. SLA breach evidence survives resolution.
- 19 Node tests passed; JS syntax/scenario validation, TypeScript and production build passed.
- Published privately to existing owner-only audience. GRC source/database/site unchanged.

## Preserve user intent
GRC and ITSM are separate versions. The zoo story, humor and animation matter. Scenarios must remain configurable without coding. Niles requirement means a REAL Niles record and official SLA breach after real elapsed time, not this app's local timer. Only Niles staging is authorized.

## Repository layout
The original GRC app remains at repository root. The ITSM app is under editions/itsm on feat/itsm-operation-day. Each edition has its own Site ID and database. Root GRC files must not be replaced with ITSM.

## Remaining
1. Niles https://niles-grc.com/login currently requires sign-in. No Mavi Vadi domain/users/SLA provisioned in this turn. Use secure browserAuth for sign-in; never request credentials in chat.
2. After sign-in, implement staging-only setup in editions/itsm/content/niles-itsm-setup.json. Follow docs/NILES-ACCEPTANCE.md and obtain official Niles SLA breach evidence after 12 real minutes, then confirm breach remains after resolution.
3. Live Niles synchronization is not implemented. Manual record URL is only a reference.
4. Visual browser QA is unverified in this turn because the Sites-required control-browser skill was unavailable. Do not report screenshots/mobile/browser tests as passed. Existing GRC screenshots are not ITSM evidence.

The initial recovery notes inside editions/itsm/docs/CONTINUE-ITSM.md are historical; this file is the current checkpoint.
