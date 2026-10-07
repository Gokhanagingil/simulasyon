const fail = (status, message) => { const error = new Error(message); error.status = status; throw error; };
export const isITSM = scenario => scenario.engine === 'itsm' || scenario.id === 'itsm-v1';
export const durationSeconds = scenario => scenario.phases.reduce((n, p) => n + p.minutes * 60, 0);
export const effects = ['none', 'queue', 'fence', 'water', 'power', 'change', 'alerts', 'request', 'supplier', 'knowledge', 'finale'];
const string = (value, name, max = 2000, empty = false) => {
  if (typeof value !== 'string' || (!empty && !value.trim()) || value.length > max) fail(400, `${name}: metni kontrol edin (en fazla ${max} karakter).`);
};
const unique = (rows, name, max) => {
  if (!Array.isArray(rows) || !rows.length || rows.length > max) fail(400, `${name}: 1–${max} kayıt olmalı.`);
  const seen = new Set();
  for (const row of rows) {
    if (!row || !/^[A-Za-z0-9_-]{1,40}$/.test(row.id) || seen.has(row.id)) fail(400, `${name}: kimlikler benzersiz harf/rakam/tire olmalı.`);
    seen.add(row.id);
  }
  return seen;
};
export function validateScenario(input) {
  if (!input || typeof input !== 'object' || !isITSM(input)) fail(400, 'Bir ITSM senaryo paketi seçin.');
  const pack = JSON.parse(JSON.stringify(input));
  string(pack.id, 'Paket kimliği', 40); string(pack.name, 'Paket adı', 120); string(pack.description, 'Açıklama');
  string(pack.version, 'Sürüm', 40);
  const roles = unique(pack.roles, 'Roller', 30), zones = unique(pack.zones, 'Bölgeler', 30);
  unique(pack.phases, 'Bölümler', 30); unique(pack.guides, 'Rehber', 50);
  const services = unique(pack.services, 'Hizmetler', 100), cis = unique(pack.cis, 'Varlıklar', 200);
  const events = unique(pack.events, 'Olaylar', 100); unique(pack.slaPolicies, 'SLA politikaları', 10);
  for (const role of pack.roles) for (const field of ['name','shortName','goal','responsibility','partners','briefing','authority','steps','output']) string(role[field] || '', `Rol ${role.id} / ${field}`, 4000, true);
  for (const phase of pack.phases) { string(phase.name, 'Bölüm adı', 120); if (!Number.isInteger(phase.minutes) || phase.minutes < 1 || phase.minutes > 480) fail(400, 'Bölüm süresi 1–480 dakika olmalı.'); }
  if (durationSeconds(pack) > 86400) fail(400, 'Toplam eğitim süresi 24 saati aşamaz.');
  for (const zone of pack.zones) { string(zone.name, 'Bölge adı', 120); if (!roles.has(zone.owner)) fail(400, `${zone.id}: bölge sahibi bulunamadı.`); }
  for (const service of pack.services) {
    string(service.name, 'Hizmet adı', 120);
    if (!roles.has(service.owner) || !Array.isArray(service.cis) || service.cis.some(id => !cis.has(id))) fail(400, `${service.id}: hizmet sahibi veya CI ilişkisi geçersiz.`);
  }
  for (const ci of pack.cis) {
    string(ci.name, 'Varlık adı', 120);
    if (!zones.has(ci.zone) || (ci.dependsOn && !cis.has(ci.dependsOn))) fail(400, `${ci.id}: bölge veya bağımlılık bulunamadı.`);
  }
  const priorities = new Set();
  for (const policy of pack.slaPolicies) {
    if (!/^P[1-4]$/.test(policy.priority) || priorities.has(policy.priority)) fail(400, 'Her öncelik için tek SLA politikası olmalı.');
    priorities.add(policy.priority);
    if (![policy.responseMinutes, policy.resolutionMinutes].every(n => Number.isInteger(n) && n >= 1 && n <= 1440) || policy.responseMinutes > policy.resolutionMinutes) fail(400, 'SLA hedefleri 1–1440 dakika olmalı; ilk müdahale çözüm süresini aşamaz.');
    if (policy.calendar !== '24x7' || policy.pause !== 'Yok') fail(400, 'Bu sürümde atölye SLA saati 24×7 çalışır ve duraklamaz.');
  }
  for (const event of pack.events) {
    for (const field of ['title','process','message','information','expected','debrief']) string(event[field], `${event.id} / ${field}`, field === 'title' ? 180 : 4000);
    if (!Number.isInteger(event.minute) || event.minute < 0 || event.minute >= durationSeconds(pack) / 60) fail(400, `${event.id}: dakika eğitim süresi içinde olmalı.`);
    if (!['incident','request','problem','change','knowledge','task'].includes(event.recordType) || !priorities.has(event.priority)) fail(400, `${event.id}: tür veya SLA önceliği geçersiz.`);
    if (!zones.has(event.zone) || !services.has(event.serviceId) || !cis.has(event.ciId)) fail(400, `${event.id}: hizmet, CI veya bölge ilişkisi geçersiz.`);
    if (!effects.includes(event.effect)) fail(400, `${event.id}: desteklenen bir animasyon seçin.`);
    if (!Array.isArray(event.prerequisites) || event.prerequisites.some(id => id === event.id || !events.has(id))) fail(400, `${event.id}: ön koşul bulunamadı veya kendisine bağlı.`);
    if (typeof event.requireBreach !== 'boolean' || typeof event.finale !== 'boolean') fail(400, `${event.id}: SLA gözlemi ve final seçeneklerini kontrol edin.`);
    if (event.requireBreach && !['incident','request'].includes(event.recordType)) fail(400, `${event.id}: aşım gözlemi yalnız olay veya talep için seçilebilir.`);
    unique(event.choices, `${event.id} sonuçları`, 10);
    for (const choice of event.choices) {
      choice.requiresResolved ??= [];
      if(!Array.isArray(choice.requiresResolved)||choice.requiresResolved.some(id=>id===event.id||!events.has(id)))fail(400, `${event.id}: sonuç için gereken tamamlanmış olay geçersiz.`);
      string(choice.label, 'Sonuç adı', 250); string(choice.result, 'Sonuç açıklaması', 4000);
      if (!Number.isInteger(choice.score) || choice.score < 0 || choice.score > 5 || typeof choice.resolve !== 'boolean') fail(400, 'Sonuç puanı 0–5 olmalı; kapatma seçimi yapılmalı.');
    }
    if (!event.choices.some(c => c.resolve)) fail(400, `${event.id}: en az bir sonuç olayı tamamlamalı.`);
  }
  const visiting = new Set(), done = new Set();
  function visit(id) { if (visiting.has(id)) fail(400, 'Olay ön koşulları döngü oluşturuyor.'); if (done.has(id)) return; visiting.add(id); pack.events.find(e => e.id === id).prerequisites.forEach(visit); visiting.delete(id); done.add(id); }
  pack.events.forEach(e => visit(e.id));
  pack.engine = 'itsm';
  return pack;
}

export async function workshopScenario(store, fallback, wid) {
  if (!isITSM(fallback)) return { pack: fallback, revision: 0 };
  await store.run('INSERT OR IGNORE INTO workshop_scenarios(workshop_id,revision,definition,updated_at) VALUES(?,1,?,?)', wid, JSON.stringify(fallback), Date.now());
  const row = await store.one('SELECT * FROM workshop_scenarios WHERE workshop_id=?', wid);
  return { pack: JSON.parse(row.definition), revision: row.revision };
}

export async function saveWorkshopScenario(store, fallback, wid, input) {
  const current = await workshopScenario(store, fallback, wid);
  if (input.revision !== current.revision) fail(409, 'Senaryo başka bir oturumda değişti. Yenileyip değişikliğinizi tekrar uygulayın.');
  const pack = validateScenario(input.pack);
  if (pack.id !== current.pack.id) fail(400, 'Atölyenin paket kimliği değiştirilemez.');
  const runs = await store.all('SELECT event_id FROM event_runs WHERE workshop_id=?', wid);
  for (const run of runs) {
    if (JSON.stringify(pack.events.find(e => e.id === run.event_id)) !== JSON.stringify(current.pack.events.find(e => e.id === run.event_id))) fail(409, `${run.event_id} ekibe gönderildi. Geçmişi korumak için bu olay değiştirilemez veya silinemez.`);
  }
  const memberships = await store.all('SELECT role_id FROM memberships WHERE workshop_id=?', wid);
  if (memberships.some(m => !pack.roles.some(r => r.id === m.role_id))) fail(409, 'Katılımcı atanmış rol kaldırılamaz.');
  const workshop = await store.one('SELECT * FROM workshops WHERE id=?', wid);
  if ((workshop.status !== 'ready' || runs.length) && JSON.stringify(pack.phases) !== JSON.stringify(current.pack.phases)) fail(409, 'Başlamış oturumun bölüm süreleri değiştirilemez.');
  const result = await store.run('UPDATE workshop_scenarios SET revision=revision+1,definition=?,updated_at=? WHERE workshop_id=? AND revision=? AND (SELECT COUNT(*) FROM event_runs WHERE workshop_id=?)=?', JSON.stringify(pack), Date.now(), wid, input.revision, wid, runs.length);
  if (Number(result.changes ?? result.meta?.changes) !== 1) fail(409, 'Oturum bu sırada değişti. Senaryoyu yenileyin.');
  return { pack, revision: current.revision + 1 };
}
