# ITSM doğrulama

7 Ekim 2026: 19 Node HTTP/SQLite/D1 testi geçti. JavaScript kontrolü ve TypeScript kontrolü geçti. Üretim derlemesi başarılı.

Tarayıcı görsel/etkileşim QA bu turda yapılmadı; Niles entegrasyonu ve gerçek SLA kabulü henüz tamamlanmadı. `NILES-ACCEPTANCE.md` açık kabul kaydıdır.

Eski GRC ekran görüntüleri bu ITSM sürümünün doğrulama kanıtı değildir.

## 7 October 2026 — experiential ITSM hardening

- Added role-first three-step briefing and trainer first-five-minute setup guidance.
- State-driven character scenes accompany actual released incidents. Turnstile jam, visitor queue, acknowledged response team and verified recovery are derived from workshop state; no official Niles success is simulated.
- End-of-day park story uses actual decisions, closure state and post-resolution learning questions; evidence JSON and CSV identify LOCAL SIMULATION / unverified Niles acceptance.
- All UI totals follow the editable scenario. Improved readable control text, mobile wrapping, focus outlines and reduced-motion behavior.
- Hardened workshop selection, stale scenario loads, concurrent saves, released-card locking, duplicate decisions and closure races. Scenario validation rejects impossible closure dependency cycles and malformed guide content.
- 26 automated tests passed, JavaScript/scenario check passed, TypeScript passed, production build passed. ESLint has zero errors and two pre-existing unused-variable warnings in the preserved GRC public/app.js.
- Browser visual/interactive acceptance is NOT verified: supported cloud browser could not reach local preview (ERR_BLOCKED_BY_CLIENT), and private published Site needs its normal authenticated session. No alternate browser route or auth bypass was used. Tests of SVG state markup do not establish visual quality or animation smoothness.
- Existing GRC edition and Niles applications/workflows are outside this patch.

## 8 October 2026 — role-gated causal encounter

- Default E05/E06/E07 pump encounter now joins private role evidence, CMDB investigation, resource funding, change/risk approval, technician allocation, time-driven effects and field acceptance. E06/E07 positive acceptance cannot bypass the corresponding verified state. Existing closed records are not retroactively reopened.
- Restart branch: 10 credits, one technician, 45 simulation seconds, dependent network/entrance disruption and recurrence after 180 seconds. Independent supply: 45 credits, two technicians, 120 seconds and explicit field acceptance. Optional 90-second supplier preparation blocks one technician but discounts the kit to 35 credits. All are teaching-model values, not production procedures.
- Simulation clock is server-authoritative, initially paused, 1×/3×/6×; it advances resource work and recurrence, never changes real workshop SLA deadlines. Clock and projected transitions survive reconnection; reads project deterministically, writes persist with atomic revision compare-and-swap.
- Every member action uses authenticated workshop role; body-supplied role/trainer fields do not grant permissions. Record-type ownership gates acknowledge/propose; all members can contribute notes; only R2/trainer can attach a Niles reference. Trainer alone releases/evaluates and controls pacing; trainer can explicitly rehearse every role.
- Role facts and unrevealed diagnostic fields are filtered in server responses, not merely hidden in the UI. Team-shared evidence and causal history become visible after deliberate sharing. Existing roles and live Niles permissions remain unchanged.
- Additive simulation_runtime migration leaves prior records, scores and SLA data intact; new runtime initializes lazily per workshop. Bound to the default pump event IDs; custom scenarios with renamed/deleted E05/E06/E07 retain generic record behavior, not this bespoke causal encounter.
- Automated coverage includes all eight role negative paths, prerequisites, dependency effects, capacity contention, pause/speed/reconnect, recurrence, replay/stale revisions, D1 Worker restart/isolation, markup role controls and escaping. Visual/interactive browser QA remains blocked by the previously documented environment/authentication limitations. No browser or authentication bypass was used; markup tests are not visual acceptance.
- Educational debrief remains available for incomplete workshops. A safe, reasoned partial outcome is valid learning; points are not individual performance ratings. No live Niles integration or SLA acceptance is claimed.
- Final automated run: 38/38 tests pass; JavaScript/scenario and TypeScript checks pass; ESLint zero errors with only the two pre-existing preserved GRC warnings. Production build/deployment status is recorded in the parent delivery, rather than inferred from these checks.
- Independent review fixed a duplicated E06 diagnostic leak in participant record notes/export. Added a whole-response regression. A 35-credit service-owner recovery reserve now prevents repeated restarts from creating an unwinnable budget state; discounted funding uses actual supplier-prepared cost, with an end-to-end six-restarts-then-recovery regression.

- Legacy E07 acceptance seeds a clearly labeled inherited result on first runtime migration, without inventing resource consumption. Closed records, scores and SLA timestamps stay untouched. The inherited lab is read-only; new workshops use the new resource model. Old saved G5 guidance is corrected on display to match the new runtime cost model.

## 8 October 2026 — animal-centred service chain (1.1.0)

- New workshops use Mümtaz → named qualified keeper Elif → quiet habitat → visitor experience as their primary E02/E09/E10 chain. Atlas, Mümtaz and Korsan are individual CIs with identities, owners, locations, explicit fictional needs, service associations and actual recorded decision history. No animal suffering, veterinary trivia or interchangeable animals are modelled.
- Sponsor schedule, keeper shift and PA scope create enforced combined impact assessment. R5 verifies evidence; R4 plans/implements; R1 funds scope; R6 approves risk; R7 prepares Elif’s early handover; R3 validates actual field result; R2 records the new visitor promise; R8 supplies measurement evidence. Three distinct accepted outcomes are possible: quiet full observation, delayed observation or humane partial opening.
- Animal and technical work share persistent clock, technician capacity and budget. Failed field tests keep observation closed and require a new approved plan without refunding consumed resources. A zero-cost fallback remains possible after technical recovery has spent the recovery reserve. Mismatched outcome acceptance and changed-payload replay are rejected.
- Existing saved scenario versions remain unchanged. The animal model is explicitly opt-in through the new package version; old workshops advise creating a new workshop rather than fabricating animal history or retroactively changing scores. No schema migration is needed for the additive JSON runtime field.
- Final development checks: **46/46 automated tests passed**, JavaScript/scenario and TypeScript checks passed. Includes full 12-event completion, all three animal outcomes, negative role permissions, shared capacity, failed-test recovery, legacy preservation and free fallback at five credits.
- Production build and exact publication are separate handoff checks. Independent HTTP role-play and live browser acceptance are pending at this source freeze. A normal owner-authenticated browser session has been established for the separate live stage; the earlier authentication blocker is no longer assumed. Automated markup tests do not prove visual quality or real participant sign-ins.
- Endpoint/identity contract: `ANIMAL-ACCEPTANCE-CONTRACT.md`. This increment changes only the standalone simulation; external integration acceptance is not claimed.

### Live review follow-up: presentation corrections

The independently observed baseline completed all 12 events. Two display-only issues were reproduced and corrected: CMDB habitat states now show Turkish labels, and a completed pump encounter retains completion guidance instead of requesting already-completed cards again. Both have regressions; 48 automated tests, syntax, TypeScript and production build pass. These corrections do not change state transitions. Animal observation versus later water-outage availability semantics are under separate review; this patch does not claim cross-branch withdrawal is implemented. Exact-version HTTP rerun and focused live retest belong to the final handoff evidence.

### Cross-service current-readiness correction (1.1.1)

Independent live/source review found that historic quiet observation acceptance remained displayed as currently open during later modeled dependency outages. The bounded correction now declares the fictional SVC-OBS→SVC-WATER prerequisite alongside PA→NET, and separates current readiness from immutable historical acceptance. Actual dependency failure shows affected readiness; restoration requires free R3 field revalidation. Partial opening excludes observation and retains its accepted local alternative. No animal-welfare inference is made.

53 automated tests pass, including release-triggered impact, network outage, temporary restoration, recurrence, permanent recovery, wrong-role/premature revalidation rejection, unchanged historical decisions, legacy missing-stamp handling, unobserved interruption, initial acceptance gates and actual UI/map state labels. Syntax and TypeScript pass. Final independent HTTP and live checks run against the new frozen publication; earlier baseline acceptance does not alone establish this correction.
