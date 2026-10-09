# Animal service acceptance contract

This document concerns the standalone ITSM simulation only. It contains no external-system acceptance evidence.

## Identity and isolation

The hosted Site remains owner-private. Site access and application role login are separate. `/api/auth/platform` binds the configured owner to the application trainer after normal ChatGPT login. `POST /api/demo-accounts` requires a trainer and creates eight actual application accounts with R1–R8 memberships once; it does not reset existing users, passwords, roles, or work. These are not role nicknames or temporary role tokens. Live credential entry stays with the user.

For isolated automated acceptance, use an in-memory `createStore`, `createHandler`, and synthetic fixture identities/sessions as shown in tests. Such local tests are not live Site/browser evidence. Tests may control the simulation clock and record deadlines to observe timing without claiming wall-clock waiting or Niles acceptance.

## Read and mutation contract

GET `/api/workshops/{id}/state`: `itsm.animals` returns role-filtered evidence, decisions and actual visitor/habitat outcome. `itsm.encounter` supplies shared credits, jobs, clock and revision. No raw animal state or other roles’ private evidence is returned in the encounter object.

POST `/api/workshops/{id}/itsm`: every animal command uses `action: "animal"`, unique `requestId`, latest `runtimeRevision`, `operation`, optional `option` and `note`. Authenticated workshop membership supplies role; client role/trainer fields have no authority.

1. In package 1.2.0, the trainer selects “Demeti birlikte gönder” for E02, E09 or E10: all three are released atomically with the same actual start time. E02 need not close first. Older stored packs retain their earlier sequential release rules; do not apply the new bundle retroactively.
2. R3/R4/R7 `animal_share`; R5 `animal_inspect`.
3. R4 `animal_plan`, option `partial`, `delay` or `quiet`; note 20–2000 characters describing scope, test and safe fallback.
4. R2/R8 `animal_share`; R1 `animal_fund`; R6 `animal_approve`.
5. For `quiet`, R7 `animal_keeper`, wait 60 simulation seconds. Then R4 `animal_execute`.
6. Trainer controls the shared clock with `action: "encounter", operation: "pace", option: "1"|"3"|"6"|"pause"`.
7. Wait 30 (`partial`), 180 (`delay`) or 90 (`quiet`) simulation seconds. R3 `animal_validate`, option `pass` or `fail`. Failure leaves the area closed and requires a fresh plan, funding and approval; consumed resources are not refunded.
8. R2 `animal_accept`, note 20–2000 characters with new scope/time and visitor confirmation.
9. Trainer acknowledges and evaluates E02/E09/E10 with matching result: choice suffix `-1` quiet, `-2` partial, `-3` delay. `-4` is an unsafe, non-closing proposal. A mismatched closing result is rejected.

Partial costs 0 credits/0 technicians and keeps Mümtaz observation closed; the accessible 40-person education route is accepted instead. It does not claim PA isolation. Delay costs 0/1 and prepares quiet PA plus Elif’s normal shift. Quiet costs 20/1 plus Elif’s early handover. All pathways preserve fictional animal care; no substitute animal or arbitrary keeper is available. Pump/technical jobs share technician capacity and credits. The 35-credit recovery reserve prevents repeated paid changes from removing the technical recovery route.

## Persistence and legacy

Existing workshop scenario JSON remains authoritative. Old packs do not silently adopt the new model or invent earlier decisions. New workshops use animalModel 1. Runtime fields are added lazily when the first real animal command occurs. Existing pump history and accepted changes are retained. Page reconnection reads the same persisted clock and jobs; no browser timer owns completion.

## Historical verification scope at the animal-model handoff

At that earlier handoff, 46 automated tests passed, including all three outcomes, negative role permissions, resource contention, failed test recovery, replay protection, existing 12-event lifecycle and SQLite/D1 behavior. Syntax and TypeScript checks pass. Live visual/role acceptance is a separate, independently run stage; this document does not claim it passed.

## Current readiness versus historical acceptance (1.1.1)

Historical `animals.accepted`, completed records, decisions and scores are immutable. A separate `animals.current` describes current service readiness. This is a fictional service rule, not an inference about animal welfare: SVC-OBS requires SVC-WATER continuity and its PA→NET dependency. Before any pump card is released there is no asserted current water incident. Once the chain is released, water `degraded`/`repairing`/`test_pending`, or NET down, makes previously accepted quiet/delayed observation `dependency_affected`.

When water is `temporary` or `resilient` and NET is up, a changed dependency generation produces `revalidation_required`. R3 (or trainer rehearsal) sends `operation: "animal_revalidate"`, note 20–2000 characters, latest revision and requestId. This is free. It records a new current field confirmation without editing earlier acceptance or scores. Initial full/delayed field and visitor acceptance cannot bypass a current dependency failure either. A verified but not-yet-accepted plan may be tested again.

The current field stamp includes the first pump-chain release, technical job generation and water/network state; merely closing records does not change it. An outage followed by restoration between browser reads still invalidates the earlier stamp. Temporary restoration can be revalidated, but recurrence affects it again. The accepted partial route excludes observation and remains `alternative_available`; it is the already-confirmed local alternative, not a promise that all park services work.

Older accepted animal runtime with no current stamp is labeled as needing the new model's current confirmation, not as a fabricated earlier failure. Actual current failures take priority. No new cost, points, replacement animal or new event is introduced. Dashboard celebration, map, CMDB, exported state and debrief distinguish closed historical records from current readiness.
