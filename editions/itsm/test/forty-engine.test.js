import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, ACTIONS, createEpisode, dispatch, advance, getOutcome, getAvailableActions } from '../public/forty-engine.js';
const act = (s, type, role, payload = {}) => dispatch(s, { type, role, ...payload });
const run = () => act(createEpisode(), 'RESUME', 'trainer');
const objective = s => act(s, 'CONFIRM_OBJECTIVE', 'R2', { objective: 'Hayvanı zorlamadan iki dakika gözlem yapmak.' });
const at = (s, time) => advance(s, time - s.clock);
const authorize = (s, job) => act(s, 'AUTHORIZE_JOB', 'R1', { job });
const queue = (s, job) => act(s, 'QUEUE_JOB', ({ pa: 'R4', keeper: 'R7', alternative: 'R5', workshop: 'R5' })[job], { job });
const field = (s, target) => act(s, 'START_FIELD_CHECK', 'R3', { target });
const observe = (s, target, count = 40) => act(s, 'START_OBSERVATION', 'R8', { target, count });
const accept = (s, target) => act(act(s, 'ACCEPT_OBSERVATION', 'R8', { target }), 'ACCEPT_OUTCOME', 'R2', { target });
function addon(s) { s = act(s, 'OFFER_ADDON', 'R1'); s = act(s, 'ACCEPT_ADDON', 'R2'); return queue(authorize(s, 'workshop'), 'workshop'); }
function pa(s) { s = act(s, 'PROPOSE_PA_CHANGE', 'R6'); s = act(s, 'APPROVE_PA_CHANGE', 'trainer'); return queue(authorize(s, 'pa'), 'pa'); }
function early(start = 180) { let s = objective(run()); s = act(s, 'ACCEPT_EARLY_WINDOW', 'R2'); s = at(s, start); s = pa(s); s = queue(authorize(s, 'keeper'), 'keeper'); return s; }
function earlyReady(start = 180) { let s = early(start); s = at(s, start + 180); s = field(s, 'mumtaz'); return advance(s, 30); }
function alternative(mode = 'substitute', start = 180) { let s = objective(run()); s = act(s, 'ACCEPT_ALTERNATIVE', 'R2', { mode }); s = at(s, start); s = queue(authorize(s, 'alternative'), 'alternative'); s = advance(s, 120); s = field(s, 'korsan'); return advance(s, 30); }
function normal() { let s = objective(run()); s = at(s, 570); s = advance(field(s, 'mumtaz'), 30); s = observe(s, 'mumtaz'); return advance(s, 120); }
const no = (fn, pattern) => assert.throws(fn, pattern);
test('isolated initial episode has exact truthful budget, promises and local role boundary', () => {
    const a = createEpisode(), b = createEpisode();
    assert.deepEqual(a, b);
    a.budget.remaining = 0;
    assert.equal(b.budget.remaining, 20);
    assert.equal(b.paused, true);
    assert.equal(b.clock, 0);
    assert.equal(b.scope.firstCount, 40);
    assert.equal(b.scope.totalVisitors, 120);
    assert.equal(b.scope.addonAccepted, false);
    assert.equal(b.sponsor.status, 'pending');
    assert.equal(ROLES.length, 9);
    assert.match(getOutcome(b).disclaimer, /çok kullanıcılı/);
    assert.equal('score' in getOutcome(b), false);
});
test('normal T9:30 + field T10 + observation T10–T12 completes at exact deadline', () => {
    let s = normal();
    assert.equal(s.clock, 720);
    assert.equal(s.phase, 'debrief');
    assert.equal(s.debriefElapsed, 0);
    assert.equal(s.visits.mumtaz.status, 'observed');
    assert.equal(s.visits.mumtaz.completedAt, 720);
    assert.equal(getOutcome(s).primaryDelivered, false);
    s = accept(s, 'mumtaz');
    assert.equal(getOutcome(s).primaryDelivered, true);
    assert.equal(getOutcome(s).deliveredVisitors, 40);
    assert.equal(s.budget.remaining, 20);
    assert.deepEqual(getOutcome(s).breaches, []);
});
test('normal with accepted next80 plan costs10, leaves10, but only actual first40 delivery counts', () => {
    let s = addon(objective(run()));
    assert.equal(s.budget.remaining, 10);
    assert.equal(s.scope.addonFunded, true);
    assert.equal(s.scope.addonPlanned, true);
    assert.equal(s.scope.addonDelivered, false);
    s = at(s, 570);
    s = advance(field(s, 'mumtaz'), 30);
    s = advance(observe(s, 'mumtaz'), 120);
    s = accept(s, 'mumtaz');
    assert.equal(getOutcome(s).primaryDelivered, true);
    assert.equal(getOutcome(s).deliveredVisitors, 40);
    assert.equal(getOutcome(s).addonPlan.funded, true);
    assert.equal(s.budget.spent, 10);
});
test('early worked timeline: keeperT5, PA T6, fieldT6:30, photo toT7, observationT7–9', () => {
    let s = early();
    assert.equal(s.jobs.pa.startedAt, 180);
    assert.equal(s.jobs.keeper.startedAt, 180);
    assert.equal(s.budget.remaining, 5);
    s = at(s, 300);
    assert.equal(s.jobs.keeper.status, 'completed');
    assert.equal(s.jobs.pa.status, 'running');
    s = act(s, 'RESPOND_SPONSOR', 'R2', { decision: 'accept' });
    s = act(s, 'RESPOND_SPONSOR', 'R2', { decision: 'negotiate' });
    s = act(s, 'AUTHORIZE_PHOTO', 'R2', { audience: 'class' });
    s = at(s, 360);
    s = advance(field(s, 'mumtaz'), 30);
    assert.equal(s.clock, 390);
    s = act(s, 'START_PHOTO', 'R8', { duration: 30 });
    s = advance(s, 30);
    assert.equal(s.sponsor.photoStatus, 'completed');
    assert.equal(s.sponsor.photoCompletedAt, 420);
    s = observe(s, 'mumtaz');
    s = advance(s, 120);
    assert.equal(s.visits.mumtaz.status, 'observed');
    assert.equal(s.visits.mumtaz.completedAt, 540);
    assert.equal(s.sponsor.announcementStatus, 'running');
    assert.equal(s.sponsor.announcementDelivered, false);
    s = accept(s, 'mumtaz');
    assert.equal(getOutcome(s).primaryDelivered, true);
    assert.equal(s.log.filter(e => e.type === 'OBSERVATION_INTERRUPTED').length, 0);
    assert.equal(getOutcome(s).promiseResults.find(p => p.id === 'photo').delivered, true);
});
test('T3 is not an artificial gate: fully authorized jobs can start atT0', () => {
    let s = earlyReady(0);
    assert.equal(s.jobs.pa.startedAt, 0);
    assert.equal(s.jobs.keeper.completedAt, 120);
    assert.equal(s.field.mumtaz.readyAt, 210);
    s = accept(advance(observe(s, 'mumtaz'), 120), 'mumtaz');
    assert.equal(s.clock, 330);
    assert.equal(getOutcome(s).primaryDelivered, true);
});
test('early observation needs separate informed teacher timing consent', () => {
    let s = objective(run());
    s = pa(s);
    s = queue(authorize(s, 'keeper'), 'keeper');
    s = advance(s, 180);
    s = advance(field(s, 'mumtaz'), 30);
    no(() => observe(s, 'mumtaz'), /erken pencere/);
    s = act(s, 'ACCEPT_EARLY_WINDOW', 'R2');
    assert.equal(observe(s, 'mumtaz').visits.mumtaz.status, 'running');
});
test('substitute alternative T3–5 + field toT5:30 + observation toT7:30, costs5', () => {
    let s = alternative();
    assert.equal(s.clock, 330);
    assert.equal(s.budget.remaining, 15);
    assert.equal(s.scope.firstPromise, 'korsan');
    s = accept(advance(observe(s, 'korsan'), 120), 'korsan');
    assert.equal(s.clock, 450);
    assert.equal(getOutcome(s).primaryDelivered, true);
    assert.equal(getOutcome(s).primaryTarget, 'korsan');
    assert.equal(s.visits.mumtaz.status, 'idle');
});
test('substitute with optional next80 costs15 and leaves5', () => {
    let s = addon(alternative());
    s = accept(advance(observe(s, 'korsan'), 120), 'korsan');
    assert.equal(s.budget.remaining, 5);
    assert.equal(s.budget.spent, 15);
    assert.equal(getOutcome(s).deliveredVisitors, 40);
    assert.equal(getOutcome(s).addonPlan.funded, true);
});
test('additional alternative + normal Mümtaz can both succeed; original promise remains', () => {
    let s = alternative('additional');
    s = accept(advance(observe(s, 'korsan'), 120), 'korsan');
    assert.equal(getOutcome(s).primaryDelivered, false);
    assert.equal(s.scope.firstPromise, 'mumtaz');
    s = at(s, 570);
    s = advance(field(s, 'mumtaz'), 30);
    s = accept(advance(observe(s, 'mumtaz'), 120), 'mumtaz');
    assert.deepEqual(getOutcome(s).acceptedTargets, ['mumtaz', 'korsan']);
    assert.equal(getOutcome(s).primaryDelivered, true);
    assert.equal(getOutcome(s).deliveredVisitors, 40);
    assert.equal(s.budget.remaining, 15);
});
test('alternative is not automatic customer consent or identical animal content', () => {
    let s = objective(run());
    s = queue(authorize(s, 'alternative'), 'alternative');
    s = advance(s, 120);
    no(() => field(s, 'korsan'), /açıkça kabul/);
    assert.equal(s.scope.firstPromise, 'mumtaz');
    s = act(s, 'ACCEPT_ALTERNATIVE', 'R2', { mode: 'substitute' });
    no(() => act(s, 'ACCEPT_ALTERNATIVE', 'R2', { mode: 'additional' }), /zaten/);
    assert.equal(s.scope.firstPromise, 'korsan');
    no(() => act(objective(run()), 'ACCEPT_ALTERNATIVE', 'R2', { mode: 'same' }), /İkame/);
});
test('late job starts shift actual finishing times, no retroactive readiness', () => {
    let s = early(240);
    s = at(s, 390);
    assert.equal(s.jobs.pa.status, 'running');
    no(() => field(s, 'mumtaz'), /PA/);
    s = at(s, 420);
    s = advance(field(s, 'mumtaz'), 30);
    assert.equal(s.field.mumtaz.readyAt, 450);
    assert.equal(s.jobs.keeper.completedAt, 360);
    assert.equal(s.jobs.pa.completedAt, 420);
});
test('late observation cannot run beyond12 minutes', () => {
    let s = objective(run());
    s = at(s, 571);
    s = advance(field(s, 'mumtaz'), 30);
    assert.equal(s.clock, 601);
    no(() => observe(s, 'mumtaz'), /yeterli süre/);
    assert.equal(s.visits.mumtaz.status, 'idle');
});
test('a job queued near deadline is not charged when capacity frees too late', () => {
    let s = objective(run());
    s = at(s, 500);
    s = pa(s);
    s = queue(authorize(s, 'alternative'), 'alternative');
    assert.equal(s.jobs.alternative.status, 'queued');
    assert.equal(s.budget.spent, 10);
    s = at(s, 680);
    assert.equal(s.jobs.alternative.status, 'queued');
    assert.match(s.jobs.alternative.blockedReason, /süre/);
    assert.equal(s.budget.spent, 10);
    s = at(s, 720);
    assert.equal(s.jobs.alternative.status, 'cancelled');
    assert.equal(s.jobs.alternative.charged, false);
});
test('shared technician serializes PA and Korsan, while keeper runs independently', () => {
    let s = early();
    s = queue(authorize(s, 'alternative'), 'alternative');
    assert.equal(s.jobs.alternative.status, 'queued');
    assert.equal(s.budget.spent, 15);
    assert.equal(s.jobs.keeper.status, 'running');
    s = at(s, 360);
    assert.equal(s.jobs.pa.status, 'completed');
    assert.equal(s.jobs.alternative.status, 'running');
    assert.equal(s.jobs.alternative.startedAt, 360);
    assert.equal(s.budget.spent, 20);
    s = at(s, 480);
    assert.equal(s.jobs.alternative.status, 'completed');
});
test('queue waits for budget authorization and independent PA approval without spend', () => {
    let s = queue(run(), 'pa');
    assert.equal(s.jobs.pa.status, 'queued');
    assert.equal(s.budget.remaining, 20);
    s = authorize(s, 'pa');
    assert.equal(s.budget.spent, 0);
    s = act(s, 'PROPOSE_PA_CHANGE', 'R6');
    assert.equal(s.budget.spent, 0);
    s = act(s, 'APPROVE_PA_CHANGE', 'trainer');
    assert.equal(s.jobs.pa.status, 'running');
    assert.equal(s.budget.spent, 10);
    assert.equal(s.jobs.pa.startedAt, 0);
});
test('queued job cancels at zero cost; started job cancels with no refund or restart', () => {
    let s = queue(run(), 'alternative');
    s = act(s, 'CANCEL_JOB', 'R5', { job: 'alternative' });
    assert.equal(s.budget.spent, 0);
    no(() => queue(s, 'alternative'), /tekrar/);
    s = pa(s);
    s = advance(s, 20);
    s = act(s, 'CANCEL_JOB', 'R4', { job: 'pa' });
    assert.equal(s.budget.spent, 10);
    assert.equal(s.budget.remaining, 10);
    assert.equal(s.jobs.pa.status, 'cancelled');
    no(() => queue(s, 'pa'), /tekrar/);
    no(() => act(s, 'CANCEL_JOB', 'R4', { job: 'pa' }), /Yalnız/);
});
test('repeat authorizations, queueing, completion and accepts cannot duplicate charge or evidence', () => {
    let s = alternative();
    const snapshot = structuredClone(s);
    no(() => authorize(s, 'alternative'), /zaten/);
    no(() => queue(s, 'alternative'), /tekrar/);
    assert.deepEqual(s, snapshot);
    s = accept(advance(observe(s, 'korsan'), 120), 'korsan');
    const count = s.log.length;
    no(() => act(s, 'ACCEPT_OBSERVATION', 'R8', { target: 'korsan' }), /zaten/);
    no(() => act(s, 'ACCEPT_OUTCOME', 'R2', { target: 'korsan' }), /zaten/);
    assert.equal(s.log.length, count);
    assert.equal(s.log.filter(e => e.type === 'JOB_STARTED').length, 1);
});
test('insufficient funds do not spend or bypass authorization; optional unaccepted addon not breach', () => {
    let s = early();
    s = queue(authorize(s, 'workshop'), 'workshop');
    assert.equal(s.budget.remaining, 5);
    assert.equal(s.jobs.workshop.status, 'queued');
    assert.equal(s.scope.addonAccepted, false);
    s = act(s, 'END_SESSION', 'trainer');
    assert.equal(getOutcome(s).breaches.includes('addon80'), false);
    assert.equal(s.jobs.workshop.charged, false);
});
test('accepted but unfunded future addon remains explicit pending plan, not false present-session delivery breach', () => {
    let s = early();
    s = act(s, 'OFFER_ADDON', 'R1');
    s = act(s, 'ACCEPT_ADDON', 'R2');
    s = queue(authorize(s, 'workshop'), 'workshop');
    assert.equal(s.jobs.workshop.status, 'queued');
    assert.equal(s.budget.remaining, 5);
    assert.match(s.jobs.workshop.blockedReason, /kredi/);
    s = act(s, 'END_SESSION', 'trainer');
    assert.equal(getOutcome(s).breaches.includes('addon80'), false);
    assert.equal(getOutcome(s).addonPlan.accepted, true);
    assert.equal(getOutcome(s).addonPlan.funded, false);
});
test('independent roles enforced even when trainer would be convenient', () => {
    for (const [type, payload] of [['CONFIRM_OBJECTIVE', { objective: 'test' }], ['AUTHORIZE_JOB', { job: 'pa' }], ['QUEUE_JOB', { job: 'pa' }], ['START_FIELD_CHECK', { target: 'mumtaz' }], ['ACCEPT_OUTCOME', { target: 'mumtaz' }], ['ACCEPT_ALTERNATIVE', { mode: 'substitute' }], ['RESUME_WELFARE', { reason: 'test' }]])
        no(() => act(run(), type, 'trainer', payload), /yetkisinde/);
    no(() => act(run(), 'APPROVE_PA_CHANGE', 'R6'), /yetkisinde/);
    no(() => act(run(), 'QUEUE_JOB', 'R4', { job: 'keeper' }), /yetkisinde/);
    no(() => act(run(), 'CANCEL_JOB', 'R7', { job: 'pa' }), /yetkisinde/);
    no(() => act(run(), 'SET_DEPENDENCY', 'R3', { dependency: 'care', ready: false, reason: 'test' }), /yetkisinde/);
});
test('field and customer acceptance stay explicit; preparation never equals delivery', () => {
    let s = earlyReady();
    assert.equal(getOutcome(s).primaryDelivered, false);
    no(() => act(s, 'ACCEPT_OBSERVATION', 'R8', { target: 'mumtaz' }), /iki dakika/);
    s = observe(s, 'mumtaz');
    s = advance(s, 119);
    no(() => act(s, 'ACCEPT_OBSERVATION', 'R8', { target: 'mumtaz' }), /iki dakika/);
    s = advance(s, 1);
    no(() => act(s, 'ACCEPT_OUTCOME', 'R2', { target: 'mumtaz' }), /Önce R8/);
    s = act(s, 'ACCEPT_OBSERVATION', 'R8', { target: 'mumtaz' });
    assert.equal(getOutcome(s).primaryDelivered, false);
    s = act(s, 'ACCEPT_OUTCOME', 'R2', { target: 'mumtaz' });
    assert.equal(getOutcome(s).primaryDelivered, true);
});
test('capacity is actual attendance max40; smaller accepted group does not satisfy whole40 promise', () => {
    const s = earlyReady();
    for (const count of [0, -1, 41, 80, 120, 1.5, '40', NaN])
        no(() => observe(s, 'mumtaz', count), /1–40/);
    const partial = accept(advance(observe(s, 'mumtaz', 20), 120), 'mumtaz');
    assert.equal(getOutcome(partial).primaryDelivered, false);
});
test('unaccepted and cleanly rejected sponsor requests do not become breached promises', () => {
    for (const reject of [false, true]) {
        let s = objective(run());
        if (reject)
            s = act(s, 'RESPOND_SPONSOR', 'R2', { decision: 'reject' });
        s = at(s, 570);
        s = advance(field(s, 'mumtaz'), 30);
        s = accept(advance(observe(s, 'mumtaz'), 120), 'mumtaz');
        assert.deepEqual(getOutcome(s).breaches, []);
        assert.equal(s.sponsor.announcementDelivered, false);
        assert.equal(getOutcome(s).promiseResults.find(p => p.id === 'announcement').promised, false);
    }
});
test('accepted T8 announcement interrupts T7–9 observation; no silent time move', () => {
    let s = earlyReady();
    s = act(s, 'RESPOND_SPONSOR', 'R2', { decision: 'accept' });
    s = at(s, 420);
    s = observe(s, 'mumtaz');
    s = at(s, 480);
    assert.equal(s.visits.mumtaz.status, 'interrupted');
    assert.equal(s.visits.mumtaz.elapsed, 0);
    assert.equal(s.field.mumtaz.status, 'invalidated');
    assert.equal(s.sponsor.announcementAt, 480);
    no(() => act(s, 'ACCEPT_OBSERVATION', 'R8', { target: 'mumtaz' }), /iki dakika/);
    no(() => field(s, 'mumtaz'), /Anons/);
    s = at(s, 510);
    s = advance(field(s, 'mumtaz'), 30);
    s = accept(advance(observe(s, 'mumtaz'), 120), 'mumtaz');
    assert.equal(s.visits.mumtaz.completedAt, 660);
    assert.equal(getOutcome(s).primaryDelivered, true);
});
test('sponsor agreement requires timely explicit negotiation and cannot be changed invisibly', () => {
    let s = objective(run());
    s = act(s, 'RESPOND_SPONSOR', 'R2', { decision: 'accept' });
    no(() => act(s, 'RESPOND_SPONSOR', 'R2', { decision: 'reject' }), /sessizce/);
    no(() => act(s, 'RESPOND_SPONSOR', 'R2', { decision: 'accept', at: 540 }), /T8/);
    s = at(s, 420);
    no(() => act(s, 'RESPOND_SPONSOR', 'R2', { decision: 'negotiate' }), /ayrıldı/);
    assert.equal(s.sponsor.announcementAt, 480);
});
test('photo requires actual field, explicit consent, <=30seconds, and sponsor deadline', () => {
    let s = earlyReady();
    no(() => act(s, 'START_PHOTO', 'R8', { duration: 30 }), /rıza/);
    s = act(s, 'AUTHORIZE_PHOTO', 'R2', { audience: 'class' });
    no(() => act(s, 'START_PHOTO', 'R8', { duration: 31 }), /1–30/);
    s = at(s, 391);
    no(() => act(s, 'START_PHOTO', 'R8', { duration: 30 }), /T7/);
    let before = early();
    before = act(before, 'AUTHORIZE_PHOTO', 'R2', { audience: 'sponsor' });
    no(() => act(before, 'START_PHOTO', 'R8', { duration: 30 }), /bakım/);
});
test('photo and observation cannot overlap, and class consent never invented', () => {
    let s = earlyReady();
    s = act(s, 'AUTHORIZE_PHOTO', 'R2', { audience: 'sponsor' });
    assert.equal(s.sponsor.photoConsent, 'sponsor');
    s = act(s, 'START_PHOTO', 'R8', { duration: 30 });
    no(() => observe(s, 'mumtaz'), /Fotoğraf/);
    s = advance(s, 30);
    s = observe(s, 'mumtaz');
    no(() => act(s, 'START_PHOTO', 'R8', { duration: 1 }), /T7|gözlemin|zaten/);
});
test('welfare hold invalidates field and active observation; resume needs R7 then fresh30s', () => {
    let s = earlyReady();
    s = observe(s, 'mumtaz');
    s = advance(s, 30);
    s = act(s, 'WELFARE_HOLD', 'R7', { reason: 'Hayvan kendi sakin alanına çekildi.' });
    assert.equal(s.welfare.held, true);
    assert.equal(s.visits.mumtaz.status, 'interrupted');
    assert.equal(s.field.mumtaz.status, 'invalidated');
    no(() => field(s, 'mumtaz'), /Refah/);
    no(() => observe(s, 'mumtaz'), /Refah/);
    s = act(s, 'RESUME_WELFARE', 'R7', { reason: 'Nitelikli bakım zorlamasız devamı uygun buldu.' });
    no(() => observe(s, 'mumtaz'), /saha teyidi/);
    s = advance(field(s, 'mumtaz'), 30);
    s = accept(advance(observe(s, 'mumtaz'), 120), 'mumtaz');
    assert.equal(s.visits.mumtaz.attempts.length, 2);
    assert.equal(s.visits.mumtaz.attempts[0].completed, false);
    assert.equal(getOutcome(s).primaryDelivered, true);
});
test('welfare hold cuts active field test and photo, spending cannot bypass it', () => {
    let s = early();
    s = at(s, 360);
    s = field(s, 'mumtaz');
    s = advance(s, 10);
    s = act(s, 'WELFARE_HOLD', 'trainer', { reason: 'Sahada durdurma işareti.' });
    assert.equal(s.field.mumtaz.status, 'invalidated');
    s = advance(s, 30);
    assert.equal(s.field.mumtaz.status, 'invalidated');
    assert.equal(s.budget.spent, 15);
    let p = earlyReady();
    p = act(p, 'AUTHORIZE_PHOTO', 'R2', { audience: 'class' });
    p = act(p, 'START_PHOTO', 'R8', { duration: 30 });
    p = advance(p, 5);
    p = act(p, 'WELFARE_HOLD', 'R7', { reason: 'Bakımın mola talebi.' });
    assert.equal(p.sponsor.photoStatus, 'interrupted');
    p = advance(p, 40);
    assert.equal(p.sponsor.photoStatus, 'interrupted');
    assert.equal(p.sponsor.photoCompletedAt, null);
});
test('unsafe dependency prevents check, invalidates current check/visit, and requires restore plus recheck', () => {
    let s = earlyReady();
    s = observe(s, 'mumtaz');
    s = advance(s, 20);
    s = act(s, 'SET_DEPENDENCY', 'R3', { dependency: 'pa', ready: false, reason: 'Sessizlik doğrulanamadı.' });
    assert.equal(s.field.mumtaz.status, 'invalidated');
    assert.equal(s.visits.mumtaz.status, 'interrupted');
    no(() => field(s, 'mumtaz'), /PA/);
    s = act(s, 'SET_DEPENDENCY', 'R3', { dependency: 'pa', ready: true, reason: 'Saha sessizliği yeniden sağlandı.' });
    assert.equal(s.field.mumtaz.status, 'invalidated');
    no(() => observe(s, 'mumtaz'), /saha teyidi/);
    s = advance(field(s, 'mumtaz'), 30);
    assert.equal(s.field.mumtaz.status, 'ready');
});
test('routine readiness cannot bypass care, habitat, PA or active welfare safety gates', () => {
    for (const dependency of ['care', 'habitat', 'pa']) {
        let s = objective(run());
        s = act(s, 'SET_DEPENDENCY', dependency === 'care' ? 'R7' : 'R3', { dependency, ready: false, reason: 'Güvenlik kapısı hazır değil.' });
        s = at(s, 570);
        no(() => field(s, 'mumtaz'), /hazır değil|güvenli değil/);
    }
    let s = objective(run());
    s = act(s, 'WELFARE_HOLD', 'R7', { reason: 'Dinlenme alanı korunuyor.' });
    s = at(s, 570);
    no(() => field(s, 'mumtaz'), /Refah/);
});
test('historical accepted delivery survives later dependency loss, but current readiness does not', () => {
    let s = accept(advance(observe(earlyReady(0), 'mumtaz'), 120), 'mumtaz');
    s = act(s, 'SET_DEPENDENCY', 'R3', { dependency: 'habitat', ready: false, reason: 'Sonraki ziyaret için yeni saha koşulu.' });
    assert.equal(getOutcome(s).primaryDelivered, true);
    assert.equal(s.field.mumtaz.status, 'invalidated');
    assert.equal(s.visits.mumtaz.teacherAccepted, true);
});
test('safety reasons are required, ordinary evidence notes are optional and bounded', () => {
    no(() => act(run(), 'WELFARE_HOLD', 'R7', { reason: ' ' }), /gerekçesini/);
    no(() => act(run(), 'SET_DEPENDENCY', 'R3', { dependency: 'pa', ready: false }), /gerekçesini/);
    const s = act(run(), 'AUTHORIZE_JOB', 'R1', { job: 'pa', note: 'a'.repeat(700) });
    assert.equal(s.log.at(-1).note.length, 500);
    assert.equal(s.jobs.pa.authorized, true);
});
test('pause freezes local time and jobs; resume advances deterministically, not wall clock', () => {
    let s = early();
    s = advance(s, 20);
    s = act(s, 'PAUSE', 'trainer');
    const snapshot = structuredClone(s);
    s = advance(s, 200);
    assert.deepEqual(s, snapshot);
    s = act(s, 'RESUME', 'trainer');
    s = advance(s, 100);
    assert.equal(s.clock, 300);
    assert.equal(s.jobs.keeper.status, 'completed');
    assert.equal(s.jobs.pa.remaining, 60);
});
test('end stops paid and queued work, preserves spend, and prevents new operations', () => {
    let s = early();
    s = queue(authorize(s, 'alternative'), 'alternative');
    s = advance(s, 20);
    s = act(s, 'END_SESSION', 'trainer');
    assert.equal(s.phase, 'debrief');
    assert.equal(s.jobs.pa.status, 'cancelled');
    assert.equal(s.jobs.alternative.status, 'cancelled');
    assert.equal(s.budget.spent, 15);
    no(() => authorize(s, 'workshop'), /Operasyon sona/);
    no(() => act(s, 'END_SESSION', 'trainer'), /Operasyon sona/);
    assert.equal(getOutcome(s).breaches.includes('first40'), true);
});
test('three minute debrief has separate clock, remains pausable, finishes exactly and reset clears everything', () => {
    let s = accept(normal(), 'mumtaz');
    assert.equal(s.paused, true);
    s = act(s, 'RESUME', 'trainer');
    s = advance(s, 100);
    assert.equal(s.clock, 720);
    assert.equal(s.debriefElapsed, 100);
    s = act(s, 'PAUSE', 'trainer');
    assert.equal(advance(s, 100).debriefElapsed, 100);
    s = act(s, 'RESUME', 'trainer');
    s = advance(s, 80);
    assert.equal(s.phase, 'complete');
    assert.equal(s.debriefElapsed, 180);
    assert.equal(s.paused, true);
    no(() => act(s, 'RESUME', 'trainer'), /tamamlandı/);
    assert.deepEqual(advance(s, 500), s);
    assert.deepEqual(act(s, 'RESET', 'trainer'), createEpisode());
});
test('early paused end can resume debrief without changing play clock', () => {
    let s = act(createEpisode(), 'END_SESSION', 'trainer');
    assert.equal(s.phase, 'debrief');
    assert.equal(s.paused, true);
    s = act(s, 'RESUME', 'trainer');
    s = advance(s, 180);
    assert.equal(s.phase, 'complete');
    assert.equal(s.clock, 0);
    assert.equal(s.debriefElapsed, 180);
});
test('immutability, deterministic partitioned advance, and invalid input never mutate original', () => {
    const s = early(), before = structuredClone(s);
    assert.deepEqual(advance(s, 180), advance(advance(s, 73), 107));
    assert.deepEqual(s, before);
    for (const time of [-1, 1.5, NaN, Infinity, '5', 86401])
        no(() => advance(s, time), /tam saniye/);
    assert.deepEqual(s, before);
    no(() => dispatch(s, { type: 'NOPE', role: 'R1' }), /tanımlı/);
    no(() => dispatch(s, { type: 'PAUSE', role: 'hacker' }), /Geçerli bir rol/);
    no(() => dispatch(s, null), /Geçerli bir işlem/);
    no(() => act(s, 'QUEUE_JOB', 'R4', { job: '__proto__' }), /Geçerli bir iş/);
    no(() => field(s, 'constructor'), /Geçerli bir gözlem/);
});
test('action descriptors are role-filtered, unique, UI-ready and do not mutate state', () => {
    const s = createEpisode(), before = structuredClone(s);
    assert.equal(new Set(ACTIONS.map(a => a.id)).size, ACTIONS.length);
    for (const role of ROLES) {
        for (const a of getAvailableActions(s, role.id)) {
            assert.ok(a.roles.includes(role.id));
            assert.equal(typeof a.enabled, 'boolean');
            assert.equal(typeof a.reason, 'string');
            assert.ok(a.label && a.description);
            assert.ok(Array.isArray(a.fields));
        }
    }
    assert.deepEqual(s, before);
    assert.deepEqual(getAvailableActions(s, 'unknown'), []);
    assert.equal(getAvailableActions(s, 'trainer').some(a => a.type === 'AUTHORIZE_JOB'), false);
    assert.equal(getAvailableActions(s, 'R6').some(a => a.type === 'APPROVE_PA_CHANGE'), false);
    assert.equal(getAvailableActions(s, 'R2').find(a => a.type === 'CONFIRM_OBJECTIVE').enabled, true);
});
test('completion at exactT9 succeeds before negotiated announcement starts', () => {
    let s = earlyReady();
    s = act(s, 'RESPOND_SPONSOR', 'R2', { decision: 'negotiate' });
    s = at(s, 420);
    s = advance(observe(s, 'mumtaz'), 120);
    assert.equal(s.visits.mumtaz.status, 'observed');
    assert.equal(s.field.mumtaz.status, 'invalidated');
    assert.equal(s.sponsor.announcementStatus, 'running');
    assert.equal(s.sponsor.announcementDelivered, false);
    s = accept(s, 'mumtaz');
    assert.equal(getOutcome(s).primaryDelivered, true);
});
test('announcement is delivered only after all30 seconds, not when scheduled or started', () => {
    let s = act(run(), 'RESPOND_SPONSOR', 'R2', { decision: 'accept' });
    assert.equal(s.sponsor.announcementStatus, 'scheduled');
    s = at(s, 480);
    assert.equal(s.sponsor.announcementStatus, 'running');
    assert.equal(s.sponsor.announcementDelivered, false);
    s = advance(s, 29);
    assert.equal(s.sponsor.announcementDelivered, false);
    s = advance(s, 1);
    assert.equal(s.sponsor.announcementStatus, 'completed');
    assert.equal(s.sponsor.announcementCompletedAt, 510);
    assert.equal(s.sponsor.announcementDelivered, true);
});
test('PA dependency failure blocks fixed-time announcement without imaginary delivery or noise', () => {
    let s = act(run(), 'RESPOND_SPONSOR', 'R2', { decision: 'accept' });
    s = act(s, 'SET_DEPENDENCY', 'R3', { dependency: 'pa', ready: false, reason: 'PA iletişimi yok.' });
    s = at(s, 480);
    assert.equal(s.sponsor.announcementStatus, 'blocked');
    assert.equal(s.sponsor.announcementDelivered, false);
    s = act(s, 'SET_DEPENDENCY', 'R3', { dependency: 'pa', ready: true, reason: 'PA düzeldi.' });
    s = at(s, 510);
    assert.equal(s.sponsor.announcementStatus, 'blocked');
    assert.equal(s.sponsor.announcementDelivered, false);
    assert.equal(s.log.filter(e => e.type === 'ANNOUNCEMENT').length, 0);
});
test('mid-announcement PA loss or welfare hold stops output without delivery', () => {
    for (const failure of ['pa', 'welfare']) {
        let s = act(run(), 'RESPOND_SPONSOR', 'R2', { decision: 'accept' });
        s = at(s, 490);
        s = failure === 'pa' ? act(s, 'SET_DEPENDENCY', 'R3', { dependency: 'pa', ready: false, reason: 'Ses sistemi durdu.' }) : act(s, 'WELFARE_HOLD', 'R7', { reason: 'Nitelikli bakım sessizlik istedi.' });
        assert.equal(s.sponsor.announcementStatus, 'interrupted');
        s = at(s, 520);
        assert.equal(s.sponsor.announcementDelivered, false);
        assert.equal(s.sponsor.announcementCompletedAt, null);
    }
});
test('welfare hold at scheduled announcement prevents unsafe output', () => {
    let s = act(run(), 'RESPOND_SPONSOR', 'R2', { decision: 'negotiate' });
    s = act(s, 'WELFARE_HOLD', 'R7', { reason: 'Sessiz dinlenme gerekiyor.' });
    s = at(s, 540);
    assert.equal(s.sponsor.announcementStatus, 'blocked');
    assert.equal(s.sponsor.announcementDelivered, false);
});
test('ending in middle of announcement cannot claim completed delivery', () => {
    let s = act(run(), 'RESPOND_SPONSOR', 'R2', { decision: 'accept' });
    s = at(s, 480);
    s = act(s, 'END_SESSION', 'trainer');
    assert.equal(s.sponsor.announcementStatus, 'interrupted');
    assert.equal(s.sponsor.announcementDelivered, false);
    assert.equal(getOutcome(s).breaches.includes('announcement'), true);
});
test('additional alternative creates a distinct obligation; successful original alone does not erase it', () => {
    let s = objective(run());
    s = act(s, 'ACCEPT_ALTERNATIVE', 'R2', { mode: 'additional' });
    s = at(s, 570);
    s = advance(field(s, 'mumtaz'), 30);
    s = accept(advance(observe(s, 'mumtaz'), 120), 'mumtaz');
    const o = getOutcome(s);
    assert.equal(o.primaryDelivered, true);
    assert.equal(o.promiseResults.find(p => p.id === 'alternativeAdditional').promised, true);
    assert.equal(o.breaches.includes('alternativeAdditional'), true);
    assert.equal(o.breaches.includes('first40'), false);
});
test('supplemental delivered observation counts real unique visitors without silently satisfying primary promise', () => {
    let s = alternative('additional');
    s = accept(advance(observe(s, 'korsan'), 120), 'korsan');
    assert.equal(getOutcome(s).deliveredVisitors, 40);
    assert.equal(getOutcome(s).primaryDelivered, false);
    assert.equal(getOutcome(s).promiseResults.find(p => p.id === 'alternativeAdditional').delivered, true);
});
test('partial accepted group reports actual20 visitors, not zero or fulfilled first40', () => {
    const s = accept(advance(observe(earlyReady(0), 'mumtaz', 20), 120), 'mumtaz');
    assert.equal(getOutcome(s).deliveredVisitors, 20);
    assert.equal(getOutcome(s).primaryDelivered, false);
});
test('large advance auto-pauses at720 without silently consuming debrief; acceptance remains possible', () => {
    let s = objective(run());
    s = at(s, 570);
    s = advance(field(s, 'mumtaz'), 30);
    s = advance(observe(s, 'mumtaz'), 1000);
    assert.equal(s.clock, 720);
    assert.equal(s.phase, 'debrief');
    assert.equal(s.paused, true);
    assert.equal(s.debriefElapsed, 0);
    s = accept(s, 'mumtaz');
    s = act(s, 'RESUME', 'trainer');
    s = advance(s, 1000);
    assert.equal(s.phase, 'complete');
    assert.equal(s.debriefElapsed, 180);
    assert.equal(getOutcome(s).primaryDelivered, true);
});
test('zero-step time does not unexpectedly process or spend, and source state remains serializable', () => {
    const s = queue(run(), 'pa');
    assert.deepEqual(advance(s, 0), s);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.equal(s.budget.spent, 0);
});
test('unavailable paid pathway never blocks free normal service after cancellation', () => {
    let s = early(0);
    s = advance(s, 10);
    s = act(s, 'CANCEL_JOB', 'R4', { job: 'pa' });
    s = act(s, 'CANCEL_JOB', 'R7', { job: 'keeper' });
    s = at(s, 570);
    s = advance(field(s, 'mumtaz'), 30);
    s = accept(advance(observe(s, 'mumtaz'), 120), 'mumtaz');
    assert.equal(s.budget.remaining, 5);
    assert.equal(getOutcome(s).primaryDelivered, true);
});
test('new episode reset removes consent, sponsor agreement, safety flags, costs and outcome history', () => {
    let s = earlyReady();
    s = act(s, 'RESPOND_SPONSOR', 'R2', { decision: 'negotiate' });
    s = act(s, 'AUTHORIZE_PHOTO', 'R2', { audience: 'class' });
    s = act(s, 'WELFARE_HOLD', 'R7', { reason: 'Güvenli mola.' });
    const reset = act(s, 'RESET', 'trainer');
    assert.deepEqual(reset, createEpisode());
    assert.equal(reset.log.length, 1);
    assert.equal(reset.budget.remaining, 20);
    assert.equal(reset.teacher.earlyWindowAccepted, false);
    assert.equal(reset.sponsor.photoConsent, null);
});
test('UI descriptors offer restoration after dependency failure rather than disabling the only restore form', () => {
    let s = act(run(), 'SET_DEPENDENCY', 'R3', { dependency: 'pa', ready: false, reason: 'Saha bağımlılığı kesildi.' });
    const action = getAvailableActions(s, 'R3').find(a => a.id === 'dependency_pa');
    assert.equal(action.enabled, true);
    assert.equal(action.fields.find(f => f.name === 'ready').default, 'true');
    assert.equal(ACTIONS.find(a => a.id === 'dependency_pa').fields.find(f => f.name === 'ready').default, 'false');
});
test('UI photo duration defaults to feasible remaining seconds before sponsor leaves', () => {
    let s = earlyReady();
    s = act(s, 'AUTHORIZE_PHOTO', 'R2', { audience: 'class' });
    s = at(s, 405);
    const action = getAvailableActions(s, 'R8').find(a => a.id === 'photo_start');
    assert.equal(action.enabled, true);
    assert.equal(action.fields.find(f => f.name === 'duration').default, 15);
});
test('workshop funding is a prospective plan, never instant service or fabricated80 visitor delivery', () => {
    let s = addon(objective(run()));
    assert.equal(s.scope.addonFunded, true);
    assert.equal(s.scope.addonPlanned, true);
    assert.equal(s.scope.addonDelivered, false);
    assert.equal(s.scope.existingProgramPreserved, true);
    const outcome = getOutcome(s), result = outcome.promiseResults.find(p => p.id === 'addon80');
    assert.equal(outcome.deliveredVisitors, 0);
    assert.equal(result.delivered, false);
    assert.equal(result.assessed, false);
    assert.equal(result.funded, true);
    assert.equal(outcome.addonPlan.deliveryModeled, false);
    assert.equal(s.jobs.workshop.status, 'completed');
    assert.equal(s.budget.spent, 10);
    no(() => queue(s, 'workshop'), /tekrar/);
    no(() => authorize(s, 'workshop'), /zaten/);
    assert.equal(s.budget.spent, 10);
    s = act(s, 'END_SESSION', 'trainer');
    assert.equal(getOutcome(s).breaches.includes('addon80'), false);
    assert.equal(getOutcome(s).deliveredVisitors, 0);
});
test('two accepted experiences for first40 plus funded next80 plan still equals40 actual unique visitors', () => {
    let s = addon(alternative('additional'));
    s = accept(advance(observe(s, 'korsan'), 120), 'korsan');
    s = at(s, 570);
    s = advance(field(s, 'mumtaz'), 30);
    s = accept(advance(observe(s, 'mumtaz'), 120), 'mumtaz');
    assert.equal(getOutcome(s).deliveredVisitors, 40);
    assert.deepEqual(getOutcome(s).acceptedTargets, ['mumtaz', 'korsan']);
    assert.equal(getOutcome(s).addonPlan.funded, true);
    assert.equal(s.budget.remaining, 5);
    assert.deepEqual(getOutcome(s).breaches, []);
});
