import { animalEnabled, animalView } from './animal-encounter.js';
import { recordPermissions, encounterPermissions, actionLabels, typeOwners } from './itsm-authority.js';
import { readEncounter, mutateEncounter } from './itsm-encounter.js';
import { isITSM } from './scenario-config.js';
// ITSM runtime is scoped by workshop; the GRC pack never invokes this module.
const fail=(status,message)=>{const e=new Error(message);e.status=status;throw e;};
const text=(v,min=1,max=2000)=>{if(typeof v!=='string'||v.trim().length<min||v.length>max)fail(400,`Açıklama ${min}–${max} karakter olmalı.`);return v.trim();};
const publicPumpBrief='Envanter iki pompayı yedekli gösteriyor. Saha ölçümü ve CMDB ilişkisi bunu doğruluyor mu? Mümtaz test sonucunu bekliyor.';
const eventRecordId=(wid,eid)=>`${wid}__${eid}`;
export function slaStatus(record,now=Date.now()) {
  if(!record.due_at)return {applicable:false};
  const stop=record.resolved_at||now;
  return {applicable:true,breached:stop>record.due_at,responseBreached:(record.ack_at||stop)>record.response_due_at,remainingSeconds:Math.ceil((record.due_at-stop)/1000),source:'workshop',dueAt:record.due_at,responseDueAt:record.response_due_at};
}
export async function readITSM(store,scenario,wid,isTrainer,role=null) {
  if(!isITSM(scenario))return null;
  const [runs,records,decisions]=await Promise.all([
    store.all('SELECT * FROM event_runs WHERE workshop_id=? ORDER BY released_at',wid),
    store.all('SELECT * FROM simulation_records WHERE workshop_id=? ORDER BY created_at DESC',wid),
    store.all('SELECT d.*,u.name AS actor FROM simulation_decisions d JOIN users u ON u.id=d.actor_id WHERE d.workshop_id=? ORDER BY created_at DESC',wid),
  ]);
  const now=Date.now(),encounter=await readEncounter(store,wid,role,isTrainer),enriched=records.map(r=>({...r,...(!isTrainer&&r.event_id==='E06'?{notes:publicPumpBrief}:{}),sla:slaStatus(r,now),permissions:recordPermissions(role,isTrainer,r)}));
  const animals=animalView(encounter,role,isTrainer,animalEnabled(scenario),runs.map(r=>r.event_id));
  delete encounter.animal;
  const activeEvents=scenario.events.filter(e=>runs.some(r=>r.event_id===e.id)&&!records.find(r=>r.event_id===e.id)?.resolved_at);
  return {serverNow:now,mode:'workshop',niles:{status:'not_connected',label:'Niles bağlantısı doğrulanmadı',message:'Buradaki SLA atölye kaydına aittir. Niles referansı eklemek canlı senkronizasyon veya Niles SLA kanıtı sağlamaz.'},
    animals,encounter,authority:{role,recordTypes:Object.keys(typeOwners).filter(type=>isTrainer||typeOwners[type].includes(role)),referenceAllowed:isTrainer||role==='R2',allowed:encounterPermissions(role,isTrainer),labels:actionLabels,description:isTrainer?'Eğitmen prova için tüm oyun rollerini uygulayabilir. Katılımcı yetkisi üyelikten belirlenir.':'Çalışma notunu herkes paylaşabilir. Üstlenme ve sonuç önerisi kayıt türündeki sorumlu rollere aittir. Kayıt kapatma/puan kabulü yalnız eğitmendedir. Niles yetkisi verilmez.'},
    events:scenario.events.filter(e=>isTrainer||runs.some(r=>r.event_id===e.id)).map(e=>({...Object.fromEntries(['id','minute','title','process','recordType','priority','zone','serviceId','ciId','message','prerequisites'].map(k=>[k,e[k]])),information:isTrainer||(['E05','E06','E07'].includes(e.id)?(encounter.inspected||['R4','R5'].includes(role)):recordPermissions(role,false,{type:e.recordType}).propose)?e.information:'Bu teknik bilgi sorumlu rolün zarfında. İlgili ekipten kanıt isteyin; çalışma notuyla paylaşılabilir.',...(e.id==='E06'&&!isTrainer?{message:publicPumpBrief}:{}),run:runs.find(r=>r.event_id===e.id)||null,...(isTrainer?{expected:e.expected,choices:e.choices,debrief:e.debrief}:records.find(r=>r.event_id===e.id)?.resolved_at?{debrief:e.debrief}:{})})),
    records:enriched,decisions:decisions.map(d=>({...d,...(!isTrainer?{choice_id:undefined}: {})})),services:scenario.services,cis:scenario.cis.map(ci=>{const c={...ci};if(c.kind==='animal')c.changeHistory=c.id==='CI-HIPPO'&&animals.enabled?animals.history:decisions.filter(d=>records.some(r=>r.event_id===d.event_id&&r.ci_id===c.id)).map(d=>({at:d.created_at,actor:d.actor,message:d.note,clock:'wall'}));if(animals.enabled&&c.id==='CI-ELIF')c.state=animals.keeperReady?'Vardiya hazır':'Vardiya teyidi bekleniyor';if(animals.enabled&&c.id==='CI-HABITAT')c.state=animals.habitat;return c;}).map(c=>!isTrainer&&!encounter.inspected&&!records.some(r=>r.event_id==='E07'&&r.resolved_at)&&role!=='R4'&&['CI-P1','CI-P2'].includes(c.id)?{...c,dependsOn:'Saha teyidi bekleniyor',name:c.name+' · ilişki teyidi bekliyor'}:encounter.validated&&c.id==='CI-P2'?{...c,dependsOn:null,name:c.name+' · bağımsız besleme doğrulandı'}:c),slaPolicies:scenario.slaPolicies,
    effects:[...new Set([...activeEvents.filter(e=>!(encounter.validated&&['E05','E06','E07'].includes(e.id))).map(e=>e.effect),...(encounter.active&&!encounter.validated?['water']:[]),...(encounter.network==='down'?['queue','power']:[])])],
    metrics:{released:runs.length,total:scenario.events.length,open:records.filter(r=>!r.resolved_at).length,breached:enriched.filter(r=>r.sla.breached).length,responded:records.filter(r=>r.ack_at).length,resolved:records.filter(r=>r.resolved_at).length,score:runs.reduce((n,r)=>n+r.score,0),maximum:scenario.events.reduce((n,e)=>n+Math.max(...e.choices.map(c=>c.score)),0)},
    finale:records.length===scenario.events.length&&records.every(r=>r.resolved_at)&&runs.some(r=>scenario.events.find(e=>e.id===r.event_id)?.finale&&records.find(t=>t.event_id===r.event_id)?.resolved_at),
  };
}
export async function mutateITSM({store,scenario,wid,user,input,revision}) {
  if(!isITSM(scenario))fail(404,'ITSM paketi etkin değil.');
  const now=Date.now();
  const membership=await store.one('SELECT role_id FROM memberships WHERE workshop_id=? AND user_id=?',wid,user.id);
  const role=membership?.role_id||null;
  if(!user.trainer&&!role)fail(403,'Bu atölyenin katılımcısı değilsiniz.');
  if(input.action==='animal'){if(!animalEnabled(scenario))fail(409,'Bu kayıtlı paket hayvan hizmeti modelini içermiyor. Eski atölye korunur; yeni atölye açın.');const runs=await store.all('SELECT event_id FROM event_runs WHERE workshop_id=?',wid);if(!runs.some(r=>r.event_id==='E02'))fail(409,'Önce E02 kartını gönderin.');if(['animal_plan','animal_execute'].includes(input.operation)&&!['E09','E10'].every(id=>runs.some(r=>r.event_id===id)))fail(409,'Vardiya ve PA riskini görmek için E09 ve E10 kartlarını da gönderin.');return mutateEncounter({store,wid,user,role,input,now,animal:true});}
  if(input.action==='encounter')return mutateEncounter({store,wid,user,role,input,now});
  if(input.requestId!==undefined&&(typeof input.requestId!=='string'||!/^[A-Za-z0-9_-]{8,80}$/.test(input.requestId)))fail(400,'İşlem kimliği geçersiz.');
  if(['release','evaluate'].includes(input.action)&&!user.trainer)fail(403,'Olay akışını eğitmen yönetir.');
  if(input.action==='release') {
    const e=scenario.events.find(e=>e.id===input.eventId);if(!e)fail(404,'Olay bulunamadı.');
    const runs=await store.all('SELECT event_id FROM event_runs WHERE workshop_id=?',wid);
    if(e.prerequisites.some(id=>!runs.some(r=>r.event_id===id)))fail(409,'Önce bu olayın ön koşulu olan kartları gönder.');
    const policy=scenario.slaPolicies.find(p=>p.priority===e.priority),timed=['incident','request'].includes(e.recordType);
    await store.batch([
      ['INSERT OR IGNORE INTO event_runs(workshop_id,event_id,released_at,score) SELECT ?,?,?,0 WHERE EXISTS(SELECT 1 FROM workshop_scenarios WHERE workshop_id=? AND revision=?)',[wid,e.id,now,wid,revision]],
      ['INSERT OR IGNORE INTO simulation_records(id,workshop_id,event_id,number,type,title,priority,service_id,ci_id,status,created_at,response_due_at,due_at,notes) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM workshop_scenarios WHERE workshop_id=? AND revision=?)',
        [eventRecordId(wid,e.id),wid,e.id,`${{incident:'INC',request:'REQ',problem:'PRB',change:'CHG',knowledge:'KB',task:'TSK'}[e.recordType]}-${e.id.replace(/^E/,'').padStart(3,'0')}`,e.recordType,e.title,e.priority,e.serviceId,e.ciId,'new',now,timed?now+policy.responseMinutes*60000:null,timed?now+policy.resolutionMinutes*60000:null,e.message,wid,revision]],
    ]);
    if(!await store.one('SELECT id FROM simulation_records WHERE id=? AND workshop_id=?',eventRecordId(wid,e.id),wid))fail(409,'Senaryo bu sırada değişti. Güncel olay akışından tekrar gönderin.');
    return;
  }
  const record=await store.one('SELECT * FROM simulation_records WHERE workshop_id=? AND id=?',wid,input.recordId);
  if(!record)fail(404,'Kayıt bulunamadı.');
  if(!recordPermissions(role,user.trainer,record)[input.action])fail(403,'Bu kayıt türünde işlem rolünüzün yetkisinde değil. Sorumlu rolle çalışın.');
  const decisionId=input.requestId||crypto.randomUUID();
  if(['note','propose','evaluate'].includes(input.action)) {
    const previous=await store.one('SELECT * FROM simulation_decisions WHERE id=?',decisionId);
    if(previous) {
      if(previous.workshop_id!==wid||previous.event_id!==record.event_id||previous.actor_id!==user.id||previous.kind!==input.action)fail(409,'Bu işlem kimliği başka bir kayda ait.');
      const note=text(input.note,input.action==='note'?5:20);if(previous.choice_id!==(input.choiceId||null)||(input.action==='evaluate'?!previous.note.startsWith(note+'\nSonuç: '):previous.note!==note))fail(409,'İşlem kimliği farklı içerik için kullanılmış.');
      return;
    }
  }
  if(input.action==='ack') {
    if(record.resolved_at)fail(409,'Kapanmış kayıtta ilk müdahale değiştirilemez.');
    await store.run("UPDATE simulation_records SET ack_at=COALESCE(ack_at,?),assignee=COALESCE(assignee,?),status=CASE WHEN status='new' THEN 'working' ELSE status END WHERE id=? AND workshop_id=? AND resolved_at IS NULL",now,user.name,record.id,wid);
  } else if(input.action==='note'||input.action==='propose') {
    if(record.resolved_at)fail(409,'Bu kayıt kapanmış.');
    const note=text(input.note,input.action==='propose'?20:5);
    const id=decisionId;
    await store.batch([
      ['INSERT OR IGNORE INTO simulation_decisions(id,workshop_id,event_id,actor_id,kind,note,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM simulation_records WHERE id=? AND workshop_id=? AND resolved_at IS NULL)',[id,wid,record.event_id,user.id,input.action,note,now,record.id,wid]],
      ["UPDATE simulation_records SET status=CASE WHEN ?='propose' THEN 'review' ELSE status END WHERE id=? AND workshop_id=? AND resolved_at IS NULL AND EXISTS(SELECT 1 FROM simulation_decisions WHERE id=?)",[input.action,record.id,wid,id]],
    ]);
    if(!await store.one('SELECT id FROM simulation_decisions WHERE id=?',id))fail(409,'Bu kayıt başka bir oturumda kapandı. Güncel durumu yenileyin.');
  } else if(input.action==='evaluate') {
    const e=scenario.events.find(e=>e.id===record.event_id),choice=e.choices.find(c=>c.id===input.choiceId);
    if(!choice)fail(400,'Bir sonuç dalı seç.');
    if(record.resolved_at)fail(409,'Sonuç zaten kabul edilmiş; yeniden puan verilmez.');
    for(const id of choice.requiresResolved||[]){const previous=await store.one('SELECT resolved_at FROM simulation_records WHERE workshop_id=? AND event_id=?',wid,id);if(!previous?.resolved_at)fail(409,`${id} tamamlanıp doğrulanmadan bu sonuç kabul edilemez.`);}
    const encounter=await readEncounter(store,wid,role,!!user.trainer);
    if(choice.resolve&&animalEnabled(scenario)&&['E02','E09','E10'].includes(e.id)){const a=encounter.animal;if(!a?.accepted)fail(409,'Önce hayvan hizmeti planını uygulayın, saha ve ziyaretçi kabulünü doğrulayın.');if(choice.animalOutcome&&choice.animalOutcome!==a.plan.type)fail(409,'Seçilen sonuç gerçek ziyaret planıyla uyuşmuyor.');}
    if(choice.resolve&&e.id==='E06'&&!encounter.inspected)fail(409,'E06 kabulü için CMDB bağımlılığı saha kanıtıyla incelenmeli.');
    if(choice.resolve&&e.id==='E07'&&!encounter.validated)fail(409,'E07 kabulü için onaylı değişiklik uygulanmalı ve saha hizmet testi doğrulanmalı.');
    const note=text(input.note,20);
    if(choice.resolve&&e.requireBreach&&now<=record.due_at)fail(409,'Bu kartta gerçek SLA aşımı gözlenecek. Çözüm hedefi henüz dolmadı.');
    if(choice.resolve&&!record.ack_at)fail(409,'Önce ilk müdahaleyi kaydet.');
    await store.batch([
      ['INSERT OR IGNORE INTO simulation_decisions(id,workshop_id,event_id,actor_id,kind,note,choice_id,created_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM simulation_records WHERE id=? AND workshop_id=? AND resolved_at IS NULL)',[decisionId,wid,e.id,user.id,'evaluate',`${note}\nSonuç: ${choice.result}`,choice.id,now,record.id,wid]],
      ['UPDATE event_runs SET score=? WHERE workshop_id=? AND event_id=? AND EXISTS(SELECT 1 FROM simulation_decisions WHERE id=?)',[choice.score,wid,e.id,decisionId]],
      ["UPDATE simulation_records SET status=?,resolved_at=? WHERE id=? AND workshop_id=? AND resolved_at IS NULL AND EXISTS(SELECT 1 FROM simulation_decisions WHERE id=?)",[choice.resolve?'resolved':'working',choice.resolve?now:null,record.id,wid,decisionId]],
    ]);
    if(!await store.one('SELECT id FROM simulation_decisions WHERE id=?',decisionId))fail(409,'Bu kayıt başka bir oturumda kapandı. Güncel durumu yenileyin.');
  } else if(input.action==='niles') {
    const value=text(input.url,10,350);let u;try{u=new URL(value);}catch{fail(400,'Geçerli Niles kayıt adresi gir.');}
    if(u.origin!=='https://niles-grc.com'||u.username||u.password||u.search||u.hash||u.pathname==='/')fail(400,'Niles staging kayıt adresini, sorgu veya erişim anahtarı olmadan gir.');
    await store.run('UPDATE simulation_records SET niles_url=? WHERE id=? AND workshop_id=?',u.href,record.id,wid);
  } else fail(400,'İşlem bulunamadı.');
}
