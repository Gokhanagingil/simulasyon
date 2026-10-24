/** Pure offline rehearsal. Role selection is not multiuser authentication. */
export const ROLES = Object.freeze([
    { id: 'R1', name: 'Hizmet sahibi', summary: '20 kredi ve kapsam yetkisi.' },
    { id: 'R2', name: 'Öğretmen ve müşteri ilişkileri', summary: 'Amaç, rıza, açık müşteri kabulü ve sponsor müzakeresi.' },
    { id: 'R3', name: 'Saha sorumlusu', summary: '30 saniyelik nitelikli saha teyidi.' },
    { id: 'R4', name: 'Teknik ekip', summary: 'Sessiz PA hazırlığı; Korsan ile bir ortak teknisyen.' },
    { id: 'R5', name: 'Alternatif ve atölye koordinasyonu', summary: 'Korsan farklı içeriktir; ek 80 kişi yeni kapsamdır.' },
    { id: 'R6', name: 'Değişiklik sahibi', summary: 'PA önerisi; kendi değişikliğini onaylayamaz.' },
    { id: 'R7', name: 'Nitelikli bakım sorumlusu', summary: 'Güvenli erken devir, refah durdurması ve bakım izni.' },
    { id: 'R8', name: 'Ziyaretçi akışı ve kabul', summary: 'En fazla 40 kişi; iki dakika kesintisiz, zorlamasız gözlem.' },
    { id: 'trainer', name: 'Bağımsız eğitmen', summary: 'Saati kolaylaştırır ve bağımsız onay verir; katılımcı kararlarını üstlenmez.' }
]);
const JOBS = {
    pa: { label: 'Sessiz PA hazırlığı', cost: 10, duration: 180, owner: 'R4', resource: 'technician' },
    keeper: { label: 'Güvenli erken bakım devri', cost: 5, duration: 120, owner: 'R7', resource: 'qualifiedCare' },
    alternative: { label: 'Korsan canlı alternatif koordinasyonu', cost: 5, duration: 120, owner: 'R5', resource: 'technician' },
    workshop: { label: 'Sonraki 80 kişi için atölye planını fonlama', cost: 10, duration: 0, owner: 'R5', resource: null }
};
const TARGETS = { mumtaz: 'Mümtaz', korsan: 'Korsan' };
const NOTE = { name: 'note', label: 'Kısa karar notu (isteğe bağlı)', type: 'text', default: '' };
const REASON = { name: 'reason', label: 'Güvenlik gerekçesi', type: 'text', default: '', required: true };
const meta = (id, type, label, roles, description, payload = {}, fields = [], extra = {}) => ({ id, type, label, roles, description, payload, fields, ...extra });
export const ACTIONS = Object.freeze([
    meta('objective', 'CONFIRM_OBJECTIVE', 'Öğretmenin amacını teyit et', ['R2'], 'İlk 40 kişinin mevcut Mümtaz sözü korunur.', {}, [{ name: 'objective', label: 'Öğretmenin amacı', type: 'text', default: '', required: true }, NOTE]),
    meta('early_window', 'ACCEPT_EARLY_WINDOW', 'Erken gözlem penceresi için anlaş', ['R2'], 'Öğretmen T10–T12 yerine hazır sahada daha erken gözlemi açıkça kabul eder.', {}, [NOTE]),
    ...Object.entries(JOBS).flatMap(([job, s]) => [
        meta(`authorize_${job}`, 'AUTHORIZE_JOB', `${s.label}: bütçe yetkisi`, ['R1'], 'Yetki harcama değildir; kredi yalnız iş gerçekten başladığında düşer.', { job }, [NOTE], { cost: s.cost, duration: s.duration }),
        meta(`queue_${job}`, 'QUEUE_JOB', `${s.label}: sıraya al`, [s.owner], 'Onay, kapsam, kaynak ve bütçe hazır olunca başlar; sıradayken harcama yok.', { job }, [NOTE], { cost: s.cost, duration: s.duration }),
        meta(`cancel_${job}`, 'CANCEL_JOB', `${s.label}: iptal et`, ['R1', s.owner], 'Başlamış işin kredisi iade edilmez. İptal edilen iş yeniden başlatılamaz.', { job }, [NOTE])
    ]),
    meta('propose_pa', 'PROPOSE_PA_CHANGE', 'PA değişikliğini öner', ['R6'], 'R6 değişiklik sahibidir; bağımsız eğitmen onayı gerekir.', {}, [NOTE]),
    meta('approve_pa', 'APPROVE_PA_CHANGE', 'PA değişikliğini bağımsız onayla', ['trainer'], 'Bütçe ve uygulama katılımcı rollerinde kalır.', {}, [NOTE]),
    meta('alternative_substitute', 'ACCEPT_ALTERNATIVE', 'Korsan’ı ikame olarak kabul et', ['R2'], 'Öğretmen farklı içerik ve erken zamanlamayı açıkça kabul eder; Mümtaz sözü anlaşmayla değiştirilir.', { mode: 'substitute' }, [NOTE]),
    meta('alternative_additional', 'ACCEPT_ALTERNATIVE', 'Korsan’ı ek deneyim olarak kabul et', ['R2'], 'Korsan ek içeriktir; Mümtaz sözü devam eder.', { mode: 'additional' }, [NOTE]),
    meta('offer_addon', 'OFFER_ADDON', 'Ek 80 kişilik kapsamı teklif et', ['R1'], 'Mevcut 80 kişilik program korunur. Yeni 10 kredilik atölye planı teklifi; henüz söz verilmiş değildir.', {}, [NOTE]),
    meta('accept_addon', 'ACCEPT_ADDON', 'Ek 80 kişilik atölyeyi kabul et', ['R2'], 'Öğretmen gelecekteki atölye planını kabul eder; fon ayırmak deneyimin gerçekleştiği anlamına gelmez.', {}, [NOTE]),
    ...Object.entries(TARGETS).flatMap(([target, name]) => [
        meta(`field_${target}`, 'START_FIELD_CHECK', `${name}: saha teyidine başla`, ['R3'], 'Bağımlılıklar ve nitelikli bakım hazırken 30 saniye.', { target }, [NOTE], { duration: 30 }),
        meta(`observe_${target}`, 'START_OBSERVATION', `${name}: gözlemi başlat`, ['R8'], 'En fazla 40 kişi, iki dakika kesintisiz ve zorlamasız. Belirli hayvan davranışı garanti edilmez.', { target }, [{ name: 'count', label: 'Katılımcı sayısı', type: 'number', default: 40, min: 1, max: 40 }, NOTE], { duration: 120 }),
        meta(`visitor_accept_${target}`, 'ACCEPT_OBSERVATION', `${name}: ziyaretçi kabulü`, ['R8'], 'Gerçekleşen iki dakikalık gözlemin ziyaretçi kabulü.', { target }, [NOTE]),
        meta(`teacher_accept_${target}`, 'ACCEPT_OUTCOME', `${name}: öğretmen kabulü`, ['R2'], 'Öğretmen sonucu ayrıca kabul eder; saha hazırlığı teslim değildir.', { target }, [NOTE])
    ]),
    meta('sponsor_accept', 'RESPOND_SPONSOR', 'T8 anons isteğini kabul et', ['R2'], '30 saniyelik anons gözlemi kesebilir. Kabulden önce istek taahhüt değildir.', { decision: 'accept', at: 480 }, [NOTE]),
    meta('sponsor_move', 'RESPOND_SPONSOR', 'Sponsorla T9 anonsu için anlaş', ['R2'], 'Sponsor T7’de ayrılmadan açık müzakere gerekir; sessiz takvim değişikliği değil.', { decision: 'negotiate', at: 540 }, [NOTE]),
    meta('sponsor_reject', 'RESPOND_SPONSOR', 'Anons isteğini kabul etme', ['R2'], 'Kabul edilmemiş isteğin reddi söz ihlali değildir.', { decision: 'reject' }, [NOTE]),
    meta('photo_sponsor', 'AUTHORIZE_PHOTO', 'Sponsor fotoğrafına rıza kaydet', ['R2'], 'İsteği kabul eder; hazır saha, en fazla 30 saniye ve T7’ye kadar bitiş gerekir.', { audience: 'sponsor' }, [NOTE]),
    meta('photo_class', 'AUTHORIZE_PHOTO', 'Sınıf fotoğrafına öğretmen rızası', ['R2'], 'Sınıfın katılımı için açık rıza kaydedilir; kişisel veri tutulmaz.', { audience: 'class' }, [NOTE]),
    meta('photo_start', 'START_PHOTO', 'Hazır sahada kısa fotoğrafı başlat', ['R8'], 'Hayvanı poz vermeye veya yaklaşmaya zorlamaz; gözlemle aynı anda yapılamaz.', {}, [{ name: 'duration', label: 'Süre (saniye)', type: 'number', default: 30, min: 1, max: 30 }, NOTE], { duration: 30 }),
    meta('welfare_hold', 'WELFARE_HOLD', 'Refah için durdur', ['R7', 'trainer'], 'Gözlem, fotoğraf ve saha teyidi kesilir. Para bu sınırı aşamaz.', {}, [REASON]),
    meta('welfare_resume', 'RESUME_WELFARE', 'Nitelikli bakım devam izni', ['R7'], 'Yeni saha teyidi gerekir; eski teyit kendiliğinden geri gelmez.', {}, [REASON]),
    ...['habitat', 'care', 'pa', 'korsan'].map(dependency => meta(`dependency_${dependency}`, 'SET_DEPENDENCY', `${({ habitat: 'Habitat', care: 'Nitelikli bakım', pa: 'PA / sessizlik', korsan: 'Korsan alanı' })[dependency]} durumunu bildir`, dependency === 'care' ? ['R7'] : ['R3'], 'Kayıp bağımlılık teyidi geçersiz kılar; düzeldikten sonra yeniden teyit gerekir.', { dependency }, [{ name: 'ready', label: 'Durum', type: 'select', default: 'false', options: [{ value: 'false', label: 'Güvenli değil / hazır değil' }, { value: 'true', label: 'Düzeldi / hazır' }] }, REASON])),
    meta('pause', 'PAUSE', 'Prova saatini duraklat', ['trainer'], 'Yerel prova saati durur; gerçek dünya SLA saati değildir.'),
    meta('resume', 'RESUME', 'Prova saatini başlat / sürdür', ['trainer'], 'Karar zamanınız gerçek başlangıcı belirler; T3 yalnız örnek başlangıçtır.'),
    meta('end', 'END_SESSION', 'Oturumu bitir', ['trainer'], 'Üç dakikalık değerlendirmeye geçer; harcanmış kredi iade edilmez.'),
    meta('reset', 'RESET', 'Yeni prova başlat', ['trainer'], 'Yalnız bu yerel provayı sıfırlar; eski pilota dokunmaz.')
]);
const copy = v => structuredClone(v);
const fail = m => { throw new Error(m); };
const clean = v => typeof v === 'string' ? v.trim().slice(0, 500) : '';
const targetCheck = t => {
    if (!Object.hasOwn(TARGETS, t))
        fail('Geçerli bir gözlem alanı seçin.');
    return t;
};
const jobCheck = j => {
    if (!Object.hasOwn(JOBS, j))
        fail('Geçerli bir iş seçin.');
    return j;
};
function log(s, role, type, text, note = '') {
    const e = { id: s.nextLogId++, time: s.clock, role, type, text };
    if (clean(note))
        e.note = clean(note);
    s.log.push(e);
}
const emptyField = () => ({ status: 'unchecked', startedAt: null, readyAt: null, reason: '', version: 0 });
const emptyVisit = () => ({ status: 'idle', count: 0, startedAt: null, completedAt: null, elapsed: 0, visitorAccepted: false, teacherAccepted: false, acceptedAt: null, attempts: [] });
export function createEpisode() {
    return {
        version: 1, title: 'Kırk Kişilik Söz', clock: 0, phase: 'play', paused: true, debriefElapsed: 0,
        limits: { play: 720, debrief: 180, routineReady: 570, capacity: 40, technician: 1 },
        budget: { initial: 20, spent: 0, remaining: 20 },
        scope: { totalVisitors: 120, firstCount: 40, firstPromise: 'mumtaz', promisedStart: 600, promisedEnd: 720, addonOffered: false, addonAccepted: false, addonFunded: false, addonPlanned: false, addonDelivered: false, addonCount: 80, existingProgramPreserved: true },
        teacher: { objective: '', objectiveConfirmed: false, alternativeMode: null, earlyWindowAccepted: false },
        change: { proposed: false, owner: null, approved: false, approvedBy: null },
        welfare: { held: false, reason: '', holds: [] }, dependencies: { habitat: true, care: true, pa: true, korsan: true },
        jobs: Object.fromEntries(Object.entries(JOBS).map(([id, s]) => [id, { id, ...s, status: 'idle', authorized: false, queuedAt: null, startedAt: null, completedAt: null, remaining: s.duration, blockedReason: '', charged: false }])),
        field: { mumtaz: emptyField(), korsan: emptyField() }, visits: { mumtaz: emptyVisit(), korsan: emptyVisit() },
        sponsor: { leavesAt: 420, requestAt: 480, status: 'pending', announcementAt: null, announcementDuration: 30, announcementDelivered: false, announcementStatus: 'idle', announcementStartedAt: null, announcementCompletedAt: null, negotiated: false, photoConsent: null, photoPromise: false, photoStatus: 'idle', photoStartedAt: null, photoEndsAt: null, photoCompletedAt: null },
        nextLogId: 2, log: [{ id: 1, time: 0, role: 'system', type: 'EPISODE_CREATED', text: '120 ziyaretçinin ilk 40’ı için T10–T12 Mümtaz sözü var. Sonraki 80 kişi ve sponsorun istekleri henüz taahhüt değil. 20 kredi, bir ortak teknisyen.' }]
    };
}
function noise(s) { return s.sponsor.announcementStatus === 'running'; }
function stopAnnouncement(s, reason) {
    if (s.sponsor.announcementStatus === 'running') {
        s.sponsor.announcementStatus = 'interrupted';
        log(s, 'system', 'ANNOUNCEMENT_INTERRUPTED', `Anons tamamlanmadan durdu: ${reason}`);
    }
}
function readyReason(s, t) {
    if (s.welfare.held)
        return `Refah durdurması sürüyor: ${s.welfare.reason}`;
    if (!s.dependencies.habitat)
        return 'Habitat güvenli değil.';
    if (!s.dependencies.care)
        return 'Nitelikli bakım bağımlılığı hazır değil.';
    if (noise(s))
        return 'Anons sürerken sessiz saha teyidi ve gözlem yapılamaz.';
    if (t === 'mumtaz') {
        if (!s.dependencies.pa)
            return 'PA / sessizlik bağımlılığı hazır değil.';
        if (s.clock < 570 && s.jobs.keeper.status !== 'completed')
            return 'Nitelikli bakım: erken devir veya T9:30 rutin hazırlığı bekleniyor.';
        if (s.clock < 570 && s.jobs.pa.status !== 'completed')
            return 'Sessiz PA hazırlığı veya T9:30 rutin sessizlik bekleniyor.';
    }
    else {
        if (!s.dependencies.korsan)
            return 'Korsan alanı hazır değil.';
        if (s.jobs.alternative.status !== 'completed')
            return 'Korsan koordinasyonu tamamlanmadı.';
        if (!s.teacher.alternativeMode)
            return 'Öğretmen Korsan’ı ikame veya ek içerik olarak açıkça kabul etmedi.';
    }
    return '';
}
function blockReason(s, j) {
    if (!j.authorized)
        return 'R1 bütçe yetkisi bekleniyor.';
    if (j.id === 'pa' && !s.change.approved)
        return 'R6 önerisi ve bağımsız eğitmen onayı bekleniyor.';
    if (j.id === 'workshop' && !s.scope.addonAccepted)
        return 'Ek kapsam için teklif ve öğretmen kabulü bekleniyor.';
    if (s.clock + j.duration > 720)
        return 'İşi tamamlamak için oturumda süre kalmadı; harcama yapılmaz.';
    if (j.resource === 'technician' && Object.values(s.jobs).some(v => v.resource === 'technician' && v.status === 'running'))
        return 'Tek ortak teknisyen başka işte; sıradayken harcama yok.';
    if (s.budget.remaining < j.cost)
        return 'Gerçek başlangıç için yeterli kredi yok.';
    return '';
}
function invalidate(s, t, reason, role = 'system') {
    const f = s.field[t], v = s.visits[t];
    if (['checking', 'ready'].includes(f.status)) {
        f.status = 'invalidated';
        f.startedAt = null;
        f.readyAt = null;
        f.reason = reason;
        f.version++;
        log(s, role, 'FIELD_INVALIDATED', `${TARGETS[t]} saha teyidi geçersiz: ${reason}`);
    }
    if (v.status === 'running') {
        v.attempts.push({ startedAt: v.startedAt, endedAt: s.clock, count: v.count, completed: false, reason });
        v.status = 'interrupted';
        v.elapsed = 0;
        v.completedAt = null;
        log(s, role, 'OBSERVATION_INTERRUPTED', `${TARGETS[t]} gözlemi kesildi; kesintisiz iki dakika yeniden başlamalı. ${reason}`);
    }
    if (t === 'mumtaz' && s.sponsor.photoStatus === 'running') {
        s.sponsor.photoStatus = 'interrupted';
        log(s, role, 'PHOTO_INTERRUPTED', `Fotoğraf güvenli biçimde durdu. ${reason}`);
    }
}
function end(s, reason) {
    stopAnnouncement(s, 'Oturum sona erdi.');
    for (const t of Object.keys(TARGETS))
        invalidate(s, t, 'Oturum sona erdi.');
    for (const j of Object.values(s.jobs))
        if (['running', 'queued'].includes(j.status)) {
            j.status = 'cancelled';
            j.blockedReason = 'Oturum sona erdi.';
            log(s, 'trainer', 'JOB_STOPPED', `${j.label} durdu. ${j.charged ? 'Harcanan kredi iade edilmedi.' : 'Başlamadığı için kredi harcanmadı.'}`);
        }
    s.phase = 'debrief';
    s.debriefElapsed = 0;
    s.paused = true;
    log(s, 'trainer', 'SESSION_ENDED', `${reason} Üç dakikalık değerlendirme başladı; tamamlanmış gözlemlerin açık kabulleri kaydedilebilir.`);
}
function reconcile(s) {
    if (s.phase !== 'play')
        return;
    for (const j of Object.values(s.jobs))
        if (j.status === 'running') {
            j.remaining = Math.max(0, j.startedAt + j.duration - s.clock);
            if (!j.remaining) {
                j.status = 'completed';
                j.completedAt = s.clock;
                log(s, j.owner, 'JOB_COMPLETED', `${j.label} tamamlandı.`);
            }
        }
    // Completion at a boundary precedes noise starting at that boundary (T7–T9 vs T9).
    for (const [t, f] of Object.entries(s.field)) {
        if (f.status === 'checking' && s.clock - f.startedAt >= 30 && !readyReason(s, t)) {
            f.status = 'ready';
            f.readyAt = s.clock;
            f.reason = '';
            log(s, 'R3', 'FIELD_READY', `${TARGETS[t]}: 30 saniyelik saha teyidi tamam. Henüz ziyaretçi teslimi değil.`);
        }
        const v = s.visits[t];
        if (v.status === 'running') {
            v.elapsed = Math.min(120, s.clock - v.startedAt);
            if (v.elapsed === 120) {
                v.status = 'observed';
                v.completedAt = s.clock;
                v.attempts.push({ startedAt: v.startedAt, endedAt: s.clock, count: v.count, completed: true });
                log(s, 'R8', 'OBSERVATION_COMPLETED', `${TARGETS[t]}: ${v.count} kişi için iki dakika kesintisiz, zorlamasız gözlem tamamlandı. İki açık kabul bekleniyor.`);
            }
        }
    }
    const p = s.sponsor;
    if (p.photoStatus === 'running' && s.clock >= p.photoEndsAt) {
        p.photoStatus = 'completed';
        p.photoCompletedAt = s.clock;
        log(s, 'R8', 'PHOTO_COMPLETED', 'Rızalı, zorlamasız kısa fotoğraf sponsor ayrılmadan tamamlandı.');
    }
    if (p.announcementStatus === 'running' && s.clock >= p.announcementStartedAt + p.announcementDuration) {
        p.announcementStatus = 'completed';
        p.announcementCompletedAt = s.clock;
        p.announcementDelivered = true;
        log(s, 'R2', 'ANNOUNCEMENT_COMPLETED', 'Kabul edilen sponsor anonsunun 30 saniyesi tamamlandı.');
    }
    if (p.status === 'accepted' && s.clock >= p.announcementAt && p.announcementStatus === 'scheduled') {
        if (!s.dependencies.pa || s.welfare.held) {
            p.announcementStatus = 'blocked';
            log(s, 'system', 'ANNOUNCEMENT_BLOCKED', 'Kabul edilen anons kendi saatinde güvenle başlayamadı; PA / refah kapısı nedeniyle teslim sayılmadı.');
        }
        else {
            p.announcementStatus = 'running';
            p.announcementStartedAt = s.clock;
            log(s, 'R2', 'ANNOUNCEMENT', `Kabul edilen sponsor anonsu T${p.announcementAt / 60}’da başladı; 30 saniye sürer.`);
            for (const t of Object.keys(TARGETS))
                invalidate(s, t, 'Sponsor anonsu sessiz alanı etkiledi.');
        }
    }
    for (const t of Object.keys(TARGETS)) {
        const r = readyReason(s, t);
        if (r)
            invalidate(s, t, r);
    }
    if (s.clock === 570 && !s.log.some(e => e.type === 'ROUTINE_READY'))
        log(s, 'system', 'ROUTINE_READY', 'T9:30 rutin bakım ve sessiz saha penceresi açıldı. Güvenlik bağımlılıkları ve yeni saha teyidi gerekli.');
    if (s.clock >= 720) {
        end(s, 'Süre tamamlandı.');
        return;
    }
    const queue = Object.values(s.jobs).filter(j => j.status === 'queued').sort((a, b) => a.queuedAt - b.queuedAt || a.queueOrder - b.queueOrder);
    for (const j of queue) {
        j.blockedReason = blockReason(s, j);
        if (!j.blockedReason) {
            j.status = 'running';
            j.startedAt = s.clock;
            j.charged = true;
            s.budget.spent += j.cost;
            s.budget.remaining -= j.cost;
            log(s, j.owner, 'JOB_STARTED', `${j.label} gerçekten başladı: ${j.cost} kredi; kalan ${s.budget.remaining}.`);
            if (!j.duration) {
                j.status = 'completed';
                j.completedAt = s.clock;
                j.remaining = 0;
                s.scope.addonFunded = true;
                s.scope.addonPlanned = true;
                log(s, j.owner, 'JOB_COMPLETED', 'Sonraki 80 kişi için kabul edilen atölye planına 10 kredi ayrıldı. Mevcut program korunur; atölye gerçekleşmiş veya 80 kişi hizmet almış sayılmaz.');
            }
        }
    }
}
function authorize(a) {
    if (!a || typeof a !== 'object')
        fail('Geçerli bir işlem seçin.');
    if (!ROLES.some(r => r.id === a.role))
        fail('Geçerli bir rol seçin.');
    const variants = ACTIONS.filter(v => v.type === a.type);
    if (!variants.length)
        fail('Bu işlem tanımlı değil.');
    let allowed = variants.some(v => v.roles.includes(a.role));
    if (['AUTHORIZE_JOB', 'QUEUE_JOB', 'CANCEL_JOB'].includes(a.type)) {
        jobCheck(a.job);
        if (a.type === 'QUEUE_JOB')
            allowed = JOBS[a.job].owner === a.role;
        if (a.type === 'CANCEL_JOB')
            allowed = a.role === 'R1' || JOBS[a.job].owner === a.role;
    }
    if (a.type === 'SET_DEPENDENCY') {
        if (!['habitat', 'care', 'pa', 'korsan'].includes(a.dependency))
            fail('Geçerli bir bağımlılık seçin.');
        allowed = a.dependency === 'care' ? a.role === 'R7' : a.role === 'R3';
    }
    if (!allowed)
        fail('Bu karar seçili rolün yetkisinde değil. Eğitmen katılımcı kararlarını üstlenemez.');
}
export function dispatch(input, a) {
    authorize(a);
    if (a.type === 'RESET')
        return createEpisode();
    const s = copy(input), { type, role } = a, note = clean(a.note), accepts = ['ACCEPT_OBSERVATION', 'ACCEPT_OUTCOME'];
    if (s.phase === 'complete')
        fail('Prova tamamlandı; yeni prova için sıfırlayın.');
    if (s.phase !== 'play' && !['PAUSE', 'RESUME', ...accepts].includes(type))
        fail('Operasyon sona erdi; yalnız tamamlanmış gözlemlerin açık kabulleri kaydedilebilir.');
    const t = ['START_FIELD_CHECK', 'START_OBSERVATION', ...accepts].includes(type) ? targetCheck(a.target) : null;
    switch (type) {
        case 'CONFIRM_OBJECTIVE':
            if (s.teacher.objectiveConfirmed)
                fail('Öğretmenin amacı zaten teyit edildi.');
            if (!clean(a.objective))
                fail('Öğretmenin amacını kısa bir cümleyle yazın.');
            s.teacher.objective = clean(a.objective);
            s.teacher.objectiveConfirmed = true;
            log(s, role, type, `Öğretmenin amacı: ${s.teacher.objective}`, note);
            break;
        case 'ACCEPT_EARLY_WINDOW':
            if (!s.teacher.objectiveConfirmed)
                fail('Önce öğretmenin amacını teyit edin.');
            if (s.teacher.earlyWindowAccepted)
                fail('Erken pencere zaten kabul edildi.');
            s.teacher.earlyWindowAccepted = true;
            log(s, role, type, 'Öğretmen T10–T12 yerine hazır sahada daha erken Mümtaz gözlemini açıkça kabul etti.', note);
            break;
        case 'AUTHORIZE_JOB': {
            const j = s.jobs[a.job];
            if (j.authorized || ['completed', 'cancelled'].includes(j.status))
                fail('İş zaten yetkili veya kapalı.');
            j.authorized = true;
            log(s, role, type, `${j.label}: ${j.cost} kredi yetkisi; henüz harcama yok.`, note);
            break;
        }
        case 'PROPOSE_PA_CHANGE':
            if (s.change.proposed)
                fail('PA değişikliği zaten önerildi.');
            s.change.proposed = true;
            s.change.owner = role;
            log(s, role, type, 'R6 PA değişikliğini önerdi; bağımsız onay bekleniyor.', note);
            break;
        case 'APPROVE_PA_CHANGE':
            if (!s.change.proposed)
                fail('Önce R6 değişikliği önermeli.');
            if (s.change.owner === role)
                fail('Değişiklik sahibi kendini onaylayamaz.');
            if (s.change.approved)
                fail('PA değişikliği zaten onaylandı.');
            s.change.approved = true;
            s.change.approvedBy = role;
            log(s, role, type, 'PA değişikliği bağımsız eğitmen tarafından onaylandı.', note);
            break;
        case 'QUEUE_JOB': {
            const j = s.jobs[a.job];
            if (j.status !== 'idle')
                fail('İş zaten sırada, başladı veya kapalı; tekrar başlatılamaz.');
            if (s.clock + j.duration > 720)
                fail('İşi tamamlamak için yeterli süre yok.');
            j.status = 'queued';
            j.queuedAt = s.clock;
            j.queueOrder = s.nextLogId;
            log(s, role, type, `${j.label} sıraya alındı; başlangıç koşulları oluşmadan harcama yok.`, note);
            break;
        }
        case 'CANCEL_JOB': {
            const j = s.jobs[a.job];
            if (!['queued', 'running'].includes(j.status))
                fail('Yalnız sıradaki veya süren iş iptal edilebilir.');
            j.status = 'cancelled';
            j.blockedReason = '';
            log(s, role, type, `${j.label} iptal edildi. ${j.charged ? 'Harcanmış kredi iade edilmedi.' : 'Başlamadığı için kredi harcanmadı.'}`, note);
            break;
        }
        case 'ACCEPT_ALTERNATIVE':
            if (!s.teacher.objectiveConfirmed)
                fail('Önce öğretmenin amacını teyit edin.');
            if (!['substitute', 'additional'].includes(a.mode))
                fail('İkame veya ek içerik açıkça seçilmeli.');
            if (s.teacher.alternativeMode)
                fail('Alternatifin anlamı zaten açıkça kabul edildi.');
            s.teacher.alternativeMode = a.mode;
            if (a.mode === 'substitute')
                s.scope.firstPromise = 'korsan';
            log(s, role, type, a.mode === 'substitute' ? 'Öğretmen farklı Korsan içeriğini ve erken penceresini Mümtaz sözünün yerine kabul etti.' : 'Öğretmen Korsan’ı erken ek deneyim olarak kabul etti; Mümtaz sözü sürüyor.', note);
            break;
        case 'OFFER_ADDON':
            if (s.scope.addonOffered)
                fail('Ek kapsam zaten teklif edildi.');
            s.scope.addonOffered = true;
            log(s, role, type, 'Ek 80 kişilik atölye teklif edildi; henüz kabul edilmiş söz değil.', note);
            break;
        case 'ACCEPT_ADDON':
            if (!s.scope.addonOffered)
                fail('Önce R1 ek kapsamı teklif etmeli.');
            if (!s.teacher.objectiveConfirmed)
                fail('Önce öğretmenin amacını teyit edin.');
            if (s.scope.addonAccepted)
                fail('Ek kapsam zaten kabul edildi.');
            s.scope.addonAccepted = true;
            log(s, role, type, 'Öğretmen sonraki 80 kişi için gelecekteki atölye planını kabul etti. Fonlama ve gerçekleşen hizmet birbirinden ayrıdır.', note);
            break;
        case 'START_FIELD_CHECK': {
            const r = readyReason(s, t);
            if (r)
                fail(r);
            if (['ready', 'checking'].includes(s.field[t].status))
                fail('Saha teyidi zaten hazır veya sürüyor.');
            if (s.clock + 30 > 720)
                fail('Saha teyidi için 30 saniye kalmadı.');
            s.field[t].status = 'checking';
            s.field[t].startedAt = s.clock;
            s.field[t].reason = '';
            log(s, role, type, `${TARGETS[t]} için 30 saniyelik nitelikli saha teyidi başladı.`, note);
            break;
        }
        case 'START_OBSERVATION': {
            const r = readyReason(s, t);
            if (r)
                fail(r);
            if (!s.teacher.objectiveConfirmed)
                fail('Öğretmenin amacı teyit edilmedi.');
            if (s.field[t].status !== 'ready')
                fail('Güncel nitelikli saha teyidi gerekli.');
            if (t === 'mumtaz' && s.clock < 600 && !s.teacher.earlyWindowAccepted)
                fail('T10–T12 sözünü erkene almak için öğretmenin açık erken pencere kabulü gerekli.');
            if (!Number.isInteger(a.count) || a.count < 1 || a.count > 40)
                fail('Bir oturum 1–40 kişi olmalı; 120 kişi 40 kişilik alana alınamaz.');
            if (s.clock + 120 > 720)
                fail('İki dakika kesintisiz gözlem için yeterli süre kalmadı.');
            if (Object.values(s.visits).some(v => v.status === 'running'))
                fail('Aynı grup iki gözleme eşzamanlı başlayamaz.');
            if (s.sponsor.photoStatus === 'running')
                fail('Fotoğraf bitmeden gözlem başlayamaz.');
            const v = s.visits[t];
            if (!['idle', 'interrupted'].includes(v.status))
                fail('Bu gözlem zaten başladı veya tamamlandı.');
            v.status = 'running';
            v.startedAt = s.clock;
            v.count = a.count;
            v.elapsed = 0;
            v.completedAt = null;
            log(s, role, type, `${TARGETS[t]}: ${a.count} kişiyle zorlamasız gözlem başladı; hayvan davranışı garanti edilmez.`, note);
            break;
        }
        case 'ACCEPT_OBSERVATION': {
            const v = s.visits[t];
            if (v.status !== 'observed' || v.elapsed !== 120)
                fail('Önce iki dakika kesintisiz gözlem tamamlanmalı.');
            if (v.visitorAccepted)
                fail('Ziyaretçi kabulü zaten kaydedildi.');
            v.visitorAccepted = true;
            log(s, role, type, `${TARGETS[t]}: ${v.count} kişi için ziyaretçi kabulü kaydedildi.`, note);
            break;
        }
        case 'ACCEPT_OUTCOME': {
            const v = s.visits[t];
            if (!v.visitorAccepted)
                fail('Önce R8 ziyaretçi gözlemini kabul etmeli.');
            if (v.teacherAccepted)
                fail('Öğretmen kabulü zaten kaydedildi.');
            v.teacherAccepted = true;
            v.acceptedAt = s.clock;
            log(s, role, type, `${TARGETS[t]} için öğretmenin açık sonuç kabulü kaydedildi.`, note);
            break;
        }
        case 'RESPOND_SPONSOR': {
            const p = s.sponsor;
            if (s.clock >= p.leavesAt)
                fail('Sponsor T7’de ayrıldı; yeni anlaşma yapılmış sayılamaz.');
            if (p.status === 'rejected')
                fail('Sponsor isteği zaten reddedildi.');
            if (a.decision === 'reject') {
                if (p.status === 'accepted')
                    fail('Kabul edilen sözü sessizce reddedemezsiniz; T9 için açık müzakere yapın.');
                p.status = 'rejected';
                log(s, role, type, 'Kabul edilmemiş anons isteği reddedildi; söz ihlali yok.', note);
            }
            else if (['accept', 'negotiate'].includes(a.decision)) {
                const at = a.decision === 'negotiate' ? 540 : 480;
                if (a.at !== undefined && a.at !== at)
                    fail('Anons T8 isteği veya açıkça müzakere edilen T9 olabilir.');
                if (p.status === 'accepted' && (a.decision !== 'negotiate' || p.announcementAt === 540))
                    fail('Bu anons anlaşması zaten kaydedildi.');
                p.status = 'accepted';
                p.announcementAt = at;
                p.announcementStatus = 'scheduled';
                p.negotiated = a.decision === 'negotiate';
                log(s, role, type, p.negotiated ? 'Sponsorla açıkça anlaşıldı: anons T9’a taşındı.' : 'T8 anons isteği kabul edildi; gerçek taahhüt ve kesinti riski oluştu.', note);
            }
            else
                fail('Sponsor kararını kabul, ret veya açık müzakere olarak seçin.');
            break;
        }
        case 'AUTHORIZE_PHOTO':
            if (s.clock >= 420)
                fail('Sponsor T7’de ayrıldı.');
            if (!['sponsor', 'class'].includes(a.audience))
                fail('Fotoğraf katılımını açıkça seçin.');
            if (s.sponsor.photoConsent)
                fail('Fotoğraf rızası zaten kaydedildi.');
            if (a.audience === 'class' && !s.teacher.objectiveConfirmed)
                fail('Sınıf fotoğrafı için önce öğretmen amacı ve rızası teyit edilmeli.');
            s.sponsor.photoConsent = a.audience;
            s.sponsor.photoPromise = true;
            log(s, role, type, a.audience === 'class' ? 'Öğretmen sınıfın kısa, zorlamasız fotoğrafa katılımını kabul etti.' : 'Sponsorun kısa, zorlamasız fotoğraf isteği ve katılım rızası kabul edildi.', note);
            break;
        case 'START_PHOTO': {
            const p = s.sponsor;
            if (!p.photoConsent)
                fail('Fotoğraf için açık rıza; sınıf için öğretmen rızası gerekir.');
            if (!Number.isInteger(a.duration) || a.duration < 1 || a.duration > 30)
                fail('Fotoğraf 1–30 saniye olabilir.');
            if (s.clock + a.duration > 420)
                fail('Fotoğraf T7 ayrılışına kadar tamamlanmalı.');
            const r = readyReason(s, 'mumtaz');
            if (r)
                fail(r);
            if (s.field.mumtaz.status !== 'ready')
                fail('Fotoğraf için güncel Mümtaz saha teyidi gerekli.');
            if (Object.values(s.visits).some(v => v.status === 'running'))
                fail('Fotoğraf kesintisiz gözlemin içine yerleştirilemez.');
            if (p.photoStatus !== 'idle')
                fail('Fotoğraf zaten başladı veya kapandı.');
            p.photoStatus = 'running';
            p.photoStartedAt = s.clock;
            p.photoEndsAt = s.clock + a.duration;
            log(s, role, type, `${a.duration} saniyelik zorlamasız fotoğraf hazır sahada başladı.`, note);
            break;
        }
        case 'WELFARE_HOLD':
            if (!clean(a.reason))
                fail('Refah durdurmasının güvenlik gerekçesini yazın.');
            if (s.welfare.held)
                fail('Refah durdurması zaten etkin.');
            stopAnnouncement(s, 'Refah durdurması.');
            s.welfare.held = true;
            s.welfare.reason = clean(a.reason);
            s.welfare.holds.push({ at: s.clock, reason: clean(a.reason), resumedAt: null });
            log(s, role, type, `Refah nedeniyle durduruldu: ${s.welfare.reason}`);
            for (const t of Object.keys(TARGETS))
                invalidate(s, t, s.welfare.reason, role);
            break;
        case 'RESUME_WELFARE':
            if (!s.welfare.held)
                fail('Etkin refah durdurması yok.');
            if (!clean(a.reason))
                fail('Nitelikli bakım devam izni gerekçesini yazın.');
            s.welfare.held = false;
            s.welfare.reason = '';
            s.welfare.holds.at(-1).resumedAt = s.clock;
            log(s, role, type, `Nitelikli bakım devam izni verdi; yeni saha teyidi gerekir. ${clean(a.reason)}`);
            break;
        case 'SET_DEPENDENCY': {
            if (![true, false, 'true', 'false'].includes(a.ready))
                fail('Bağımlılık hazır durumunu seçin.');
            const ready = a.ready === true || a.ready === 'true';
            if (!clean(a.reason))
                fail('Bağımlılık durumunun güvenlik gerekçesini yazın.');
            if (s.dependencies[a.dependency] === ready)
                fail('Bağımlılık zaten seçilen durumda.');
            s.dependencies[a.dependency] = ready;
            if (a.dependency === 'pa' && !ready)
                stopAnnouncement(s, 'PA bağımlılığı hazır değil.');
            log(s, role, type, `${a.dependency} bağımlılığı ${ready ? 'düzeldi; yeni saha teyidi gerekir' : 'hazır değil'}: ${clean(a.reason)}`);
            if (!ready)
                for (const t of Object.keys(TARGETS)) {
                    if (a.dependency === 'pa' && t !== 'mumtaz')
                        continue;
                    if (a.dependency === 'korsan' && t !== 'korsan')
                        continue;
                    invalidate(s, t, clean(a.reason), role);
                }
            break;
        }
        case 'PAUSE':
            if (s.paused)
                fail('Prova saati zaten duraklatıldı.');
            s.paused = true;
            log(s, role, type, 'Yerel prova saati duraklatıldı.');
            break;
        case 'RESUME':
            if (!s.paused)
                fail('Prova saati zaten çalışıyor.');
            s.paused = false;
            log(s, role, type, 'Yerel prova saati çalışıyor.');
            break;
        case 'END_SESSION':
            end(s, 'Eğitmen oturumu erken bitirdi.');
            break;
        default: fail('Bu işlem tanımlı değil.');
    }
    reconcile(s);
    return s;
}
export function advance(input, seconds) {
    if (!Number.isInteger(seconds) || seconds < 0 || seconds > 86400)
        fail('Zaman adımı 0–86400 arasında tam saniye olmalı.');
    const s = copy(input);
    if (s.paused || s.phase === 'complete')
        return s;
    for (let i = 0; i < seconds && s.phase !== 'complete' && !s.paused; i++)
        if (s.phase === 'play') {
            s.clock++;
            reconcile(s);
        }
        else {
            s.debriefElapsed++;
            if (s.debriefElapsed >= 180) {
                s.phase = 'complete';
                s.paused = true;
                log(s, 'trainer', 'DEBRIEF_COMPLETED', 'Üç dakikalık değerlendirme bitti. Sonuçlar olay kanıtıdır; öğrenme veya insan performansı puanı değildir.');
            }
        }
    return s;
}
export function getAvailableActions(s, role) {
    if (!ROLES.some(r => r.id === role))
        return [];
    return ACTIONS.filter(a => a.roles.includes(role)).map(original => {
        const action = copy(original);
        // Mutable form values must not strand the user behind a disabled button.
        // A failed dependency defaults to restoration, not a repeated failure report.
        if (action.type === 'SET_DEPENDENCY') {
            action.fields.find(f => f.name === 'ready').default = String(!s.dependencies[action.payload.dependency]);
        }
        if (action.type === 'START_PHOTO') {
            action.fields.find(f => f.name === 'duration').default = Math.max(1, Math.min(30, s.sponsor.leavesAt - s.clock));
        }
        const sample = Object.fromEntries(action.fields.map(f => [f.name, f.required && !f.default ? 'Kısa açık değerlendirme' : f.default]));
        let reason = '';
        try {
            dispatch(s, { type: action.type, role, ...action.payload, ...sample });
        }
        catch (error) {
            reason = error.message;
        }
        return { ...action, enabled: !reason, reason };
    });
}
export function getOutcome(s) {
    const delivered = t => s.visits[t].visitorAccepted && s.visits[t].teacherAccepted;
    const primaryTarget = s.scope.firstPromise, primaryDelivered = delivered(primaryTarget) && s.visits[primaryTarget].count === 40;
    const promiseResults = [
        { id: 'first40', label: `İlk 40 kişi: ${TARGETS[primaryTarget]}`, promised: true, delivered: primaryDelivered, detail: primaryDelivered ? 'Kesintisiz gözlem, ziyaretçi ve öğretmen kabulü tamam.' : '40 kişinin kesintisiz gözlemi ve iki açık kabul henüz tamam değil.' },
        { id: 'alternativeAdditional', label: 'Ek Korsan deneyimi', promised: s.teacher.alternativeMode === 'additional', delivered: delivered('korsan') && s.visits.korsan.count === 40, detail: s.teacher.alternativeMode !== 'additional' ? 'Ayrı bir ek Korsan sözü yok.' : delivered('korsan') && s.visits.korsan.count === 40 ? 'Ek Korsan deneyimi 40 kişi ve iki açık kabulle tamamlandı.' : 'Kabul edilen ek Korsan deneyimi henüz tamam değil.' },
        { id: 'addon80', label: 'Sonraki 80 kişi: gelecekteki atölye planı', promised: s.scope.addonAccepted, delivered: false, assessed: false, funded: s.scope.addonFunded, planned: s.scope.addonPlanned, detail: !s.scope.addonAccepted ? 'Kabul edilmiş ek plan yok; mevcut program korunur, ihlal sayılmaz.' : s.scope.addonFunded ? '10 kredi ayrıldı ve plan hazırlandı; atölye gerçekleşmiş veya 80 kişi hizmet almış sayılmaz. Gerçek teslim bu bölümde modellenmez.' : 'Gelecekteki atölye planı kabul edildi fakat henüz fonlanmadı. Mevcut program korunur; gerçek teslim bu bölümde modellenmez.' },
        { id: 'announcement', label: 'Sponsor anonsu', promised: s.sponsor.status === 'accepted', delivered: s.sponsor.announcementDelivered, detail: s.sponsor.status !== 'accepted' ? 'Kabul edilmemiş istek; ihlal yok.' : s.sponsor.negotiated ? 'T9 için açık müzakere kaydı var.' : 'T8 kabul edildi; sessizlikle kesişme riski üstlenildi.' },
        { id: 'photo', label: 'Sponsor fotoğrafı', promised: s.sponsor.photoPromise, delivered: s.sponsor.photoStatus === 'completed', detail: !s.sponsor.photoPromise ? 'Fotoğraf isteği taahhüt edilmedi.' : s.sponsor.photoStatus === 'completed' ? 'Hazır sahada, rızayla, kısa ve sponsor ayrılmadan.' : 'Kabul edilen fotoğraf henüz güvenli biçimde tamamlanmadı.' }
    ];
    const ended = s.phase !== 'play', unmet = promiseResults.filter(p => p.assessed !== false && p.promised && !p.delivered).map(p => p.id), causes = [];
    if (s.teacher.alternativeMode === 'substitute')
        causes.push('Mümtaz sözü öğretmenin açık kabulüyle farklı Korsan içeriğine çevrildi.');
    if (s.teacher.alternativeMode === 'additional')
        causes.push('Korsan ek içerik; Mümtaz yükümlülüğü kaybolmadı.');
    if (s.teacher.earlyWindowAccepted)
        causes.push('Erken Mümtaz penceresi öğretmenle açıkça anlaşıldı.');
    if (s.jobs.pa.charged || s.jobs.keeper.charged)
        causes.push('Erken hazırlık için gerçek başlangıçta kredi kullanıldı; saha ve kabul kapıları satın alınmadı.');
    if (s.clock >= 570 && !s.jobs.pa.charged && !s.jobs.keeper.charged)
        causes.push('Rutin T9:30 hazırlığı maliyetsizdi; 30 saniye saha teyidiyle T10–T12 gözlemi mümkündü.');
    if (s.log.some(e => e.type === 'OBSERVATION_INTERRUPTED'))
        causes.push('Kesinti süreyi sıfırladı; parçalı gözlem iki dakika kesintisiz kabul edilmedi.');
    if (s.welfare.holds.length)
        causes.push('Refah durdurmasından sonra nitelikli bakım izni ve yeni saha teyidi istendi.');
    if (s.sponsor.negotiated)
        causes.push('Anons T9’a açıkça müzakere edildi; T7–T9 gözleminin tamamlanma sınırıyla çakışmaz.');
    if (s.budget.remaining < 10 && !s.scope.addonFunded)
        causes.push('Kalan kredi gelecekteki atölye planının 10 kredilik fonlamasına yetmiyor. Sonraki 80 kişinin mevcut programı korunur; gerçekleşmiş teslim uydurulmaz.');
    if (!s.teacher.objectiveConfirmed)
        causes.push('Öğretmenin amacı açıkça teyit edilmedi.');
    return { phase: s.phase, ended, title: primaryDelivered ? 'Kırk kişilik söz açık kabulle karşılandı' : ended ? 'Kararların sonucu: açık kalan teslimler var' : 'Sözün sonucu henüz oluşuyor', primaryTarget, primaryDelivered, acceptedTargets: Object.keys(TARGETS).filter(delivered), budget: copy(s.budget), addonPlan: { offered: s.scope.addonOffered, accepted: s.scope.addonAccepted, funded: s.scope.addonFunded, planned: s.scope.addonPlanned, participantCount: 80, deliveryModeled: false, existingProgramPreserved: s.scope.existingProgramPreserved }, promiseResults, unmetPromises: unmet, breaches: ended ? unmet : [], deliveredVisitors: Math.max(0, ...Object.keys(TARGETS).filter(delivered).map(t => s.visits[t].count)), causes, evidence: s.log.filter(e => ['JOB_STARTED', 'FIELD_READY', 'ACCEPT_ALTERNATIVE', 'ACCEPT_EARLY_WINDOW', 'ACCEPT_OBSERVATION', 'ACCEPT_OUTCOME', 'RESPOND_SPONSOR', 'WELFARE_HOLD', 'OBSERVATION_INTERRUPTED', 'PHOTO_COMPLETED'].includes(e.type)).map(copy), reflection: ['Hangi istek gerçekten söze dönüştü, hangisi hiç kabul edilmedi?', 'Bütçe, teknisyen ve bakım bağımlılıkları karar zamanını nasıl etkiledi?', 'Saha hazırlığı ile ziyaretçi ve öğretmen kabulünü nasıl ayırdınız?', 'Alternatif için kimin açık rızası gerekliydi?', 'Refah sınırı ve kesintisiz gözlem kanıtı hangi kararı değiştirdi?'], disclaimer: 'Bunlar yerel simülasyonun olay sonuçlarıdır; öğrenme, katılımcı keyfi veya çalışan performansı puanı değildir. Rol değiştirme güvenli çok kullanıcılı kimlik doğrulama değildir.' };
}
