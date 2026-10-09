import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, hashPassword, verifyPassword, digest } from '../server/store.js';
import { createHandler } from '../server/handler.js';
import { loadScenario } from '../server/content.js';
import { validateScenario } from '../server/scenario-config.js';
import { slaStatus } from '../server/itsm-engine.js';

async function fixture(t) {
  const scenario=loadScenario(),store=createStore(':memory:',scenario,{username:'trainer',password:'test-only-password'});
  t.after(()=>store.db.close());
  let handler=createHandler({store,scenario,passwords:{hashPassword,verifyPassword,digest}});
  const client=()=>{let cookie='';return async(path,method='GET',body)=>{
    const response=await handler(new Request('https://test.invalid'+path,{method,headers:{cookie,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));
    if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
    return {status:response.status,body:await response.json()};
  };};
  const trainer=client(),login=await trainer('/api/auth/login','POST',{username:'trainer',password:'test-only-password'}),wid=login.body.workshops[0].id,path=`/api/workshops/${wid}`;
  await trainer(path+'/members','POST',{username:'member',name:'Katılımcı',password:'test-member-password',roleId:'R2'});
  const member=client();await member('/api/auth/login','POST',{username:'member',password:'test-member-password'});
  return {store,trainer,member,client,wid,path,scenario,restart:()=>handler=createHandler({store,scenario,passwords:{hashPassword,verifyPassword,digest}}),action:(body,as=trainer)=>as(path+'/itsm','POST',body)};
}

async function completeLearningEvidence(f){
 const clients={};
 for(const role of ['R5','R8']){await f.trainer(f.path+'/members','POST',{username:'learning-'+role.toLowerCase(),name:role,password:'isolated-learning-fixture',roleId:role});clients[role]=f.client();await clients[role]('/api/auth/login','POST',{username:'learning-'+role.toLowerCase(),password:'isolated-learning-fixture'});}
 const step=async(client,operation,extra={})=>{const current=(await client(f.path+'/state')).body.itsm.encounter;const out=await f.action({action:'learning',operation,runtimeRevision:current.revision,requestId:crypto.randomUUID(),...extra},client);assert.equal(out.status,200,JSON.stringify(out.body));return out.body.itsm.learning;};
 for(const eventId of ['E01','E03'])await f.action({action:'release',eventId});
 const note=async(eventId)=>{const out=await f.action({action:'note',recordId:f.wid+'__'+eventId,note:'Gerçek atölye gözlemi: verilen hizmet koşulu ve saha sonucu kaydedildi.'},f.member);return out.body.itsm.decisions.find(d=>d.event_id===eventId&&d.kind==='note').id;};
 const evidenceId=await note('E01');let l=await step(clients.R5,'draft',{title:'Hizmet koşulunu önce doğrula',scope:'Ziyaret hizmeti etkilenince kapsam ve bağımlılık kontrolü.',procedure:'Saha ölçümünü karşılaştır, gerçek ziyaretçi teyidi al.',limits:'Teknik yeşil tek başına yeterli değil; uygunsuzsa alan kapalı.',eventId:'E01',evidenceId});const articleId=l.articles[0].id;
 await step(clients.R5,'submit',{articleId});await step(clients.R8,'review',{articleId,option:'approve',note:'Kanıt, kullanım koşulu ve güvenli sınırlar bağımsız incelendi.'});await step(clients.R5,'publish',{articleId});
 await step(f.member,'reuse',{articleId,eventId:'E03',evidenceId:await note('E03'),option:'worked',note:'Başka olayda kapsam ve saha teyidi kontrolü uygulandı; sonuç gözlendi.'});
 for(const option of ['baseline','final'])await step(clients.R8,'measure',{eventId:'E01',option,metric:'Atölye kaydı ve gerçek SLA başlangıç/son gözlem penceresi.',note:'Bu izole test ölçümüdür; insan öğrenmesi veya memnuniyeti iddia edilmez.'});
 l=await step(f.member,'transfer',{dependency:'İki sunucu aynı DNS bağımlılığına sahip; sipariş hizmeti etkilenir.',decision:'Plan, kaynak ve onay ayrı rollerdedir; kontrolsüz değişiklik yapılmaz.',verification:'Sipariş uçtan uca test edilir ve müşteri kabul kanıtı alınır.'});
 await step(f.trainer,'assess',{transferId:l.transfers[0].id,dependency:'demonstrated',decision:'demonstrated',verification:'needs_practice',note:'Bu fixture öğrenme mekanizmasını sınar; gerçek katılımcı değerlendirmesi değildir.'});
}

test('only trainers release events; duplicate releases do not reset records; prerequisites and participant visibility hold',async t=>{
  const f=await fixture(t);
  assert.equal((await f.action({action:'release',eventId:'E01'},f.member)).status,403);
  assert.equal((await f.member(f.path+'/state')).body.itsm.events.length,0);
  assert.equal((await f.action({action:'release',eventId:'E07'})).status,409);
  const first=await f.action({action:'release',eventId:'E01'});assert.equal(first.status,200);
  const record=first.body.itsm.records[0];
  await f.action({action:'ack',recordId:record.id},f.member);
  const repeated=await f.action({action:'release',eventId:'E01'});
  assert.equal(repeated.body.itsm.records.length,1);assert.equal(repeated.body.itsm.records[0].due_at,record.due_at);
  assert.ok(repeated.body.itsm.records[0].ack_at);
  const visible=(await f.member(f.path+'/state')).body.itsm;
  assert.equal(visible.events.length,1);assert.equal(visible.events[0].choices,undefined);assert.equal(visible.events[0].expected,undefined);
  assert.equal((await f.member(f.path+'/scenario')).status,403);
});

test('evidence, trainer acceptance, effects and scores follow the lifecycle without duplicate scoring',async t=>{
  const f=await fixture(t),released=await f.action({action:'release',eventId:'E03'}),record=released.body.itsm.records[0];
  assert.ok(released.body.itsm.effects.includes('fence'));
  assert.equal((await f.action({action:'evaluate',recordId:record.id,choiceId:'E03-1',note:'Saha testi ve güvenlik teyidi alındı.'})).status,409);
  await f.action({action:'ack',recordId:record.id},f.member);
  assert.equal((await f.action({action:'propose',recordId:record.id,note:'Az'},f.member)).status,400);
  await f.action({action:'propose',recordId:record.id,note:'Alan kapatıldı; çit ve sensör onarıldı. Saha sahibi güvenli açılışı teyit etti.'},f.member);
  assert.equal((await f.action({action:'evaluate',recordId:record.id,choiceId:'E03-1',note:'Saha testi ve güvenlik teyidi alındı.'},f.member)).status,403);
  const bad=await f.action({action:'evaluate',recordId:record.id,choiceId:'E03-3',note:'Teknik iş bitti, saha testi henüz eksik.'});assert.ok(bad.body.itsm.effects.includes('fence'));
  const good=await f.action({action:'evaluate',recordId:record.id,choiceId:'E03-1',note:'Saha testi tamamlandı, hizmet sahibi açılışı onayladı.'});
  assert.equal(good.body.itsm.metrics.score,5);assert.equal(good.body.itsm.effects.includes('fence'),false);
  assert.equal((await f.action({action:'evaluate',recordId:record.id,choiceId:'E03-1',note:'Tekrar aynı sonuca puan verilmemeli.'})).status,409);
});

test('scenario editing persists across handler restart; changes are scoped, versioned and protect released content',async t=>{
  const f=await fixture(t),original=(await f.trainer(f.path+'/scenario')).body;
  const added=structuredClone(original.pack.events[0]);added.id='CUSTOM';added.title='Parametrik turnike';added.choices.forEach((c,i)=>c.id=`CUSTOM-${i}`);original.pack.events.push(added);
  original.pack.slaPolicies.find(p=>p.priority==='P2').resolutionMinutes=15;
  const saved=await f.trainer(f.path+'/scenario','PUT',original);assert.equal(saved.status,200);assert.equal(saved.body.revision,2);
  assert.equal((await f.trainer(f.path+'/scenario','PUT',original)).status,409);
  f.restart();const persisted=(await f.trainer(f.path+'/scenario')).body;assert.equal(persisted.pack.events.length,13);
  const live=await f.action({action:'release',eventId:'CUSTOM'});assert.equal(live.status,200);
  const record=live.body.itsm.records[0];assert.equal(record.due_at-record.created_at,15*60000);
  const locked=structuredClone(persisted);locked.pack.events.find(e=>e.id==='CUSTOM').title='Geçmişi değiştirme';
  assert.equal((await f.trainer(f.path+'/scenario','PUT',locked)).status,409);
  const removed=structuredClone(persisted);removed.pack.events=removed.pack.events.filter(e=>e.id!=='E11');removed.pack.events.forEach(e=>e.prerequisites=e.prerequisites.filter(id=>id!=='E11'));
  removed.pack.slaPolicies.find(p=>p.priority==='P2').resolutionMinutes=20;
  assert.equal((await f.trainer(f.path+'/scenario','PUT',removed)).status,200);
  assert.equal((await f.trainer(f.path+'/state')).body.itsm.records[0].due_at,record.due_at);
  const other=await f.trainer('/api/workshops','POST',{name:'Bağımsız atölye'}),otherPath=`/api/workshops/${other.body.workshop.id}`;
  assert.equal((await f.trainer(otherPath+'/scenario')).body.pack.events.length,12);
  assert.equal((await f.member(otherPath+'/state')).status,404);
  assert.equal((await f.trainer(otherPath+'/itsm','POST',{action:'ack',recordId:record.id})).status,404);
});

test('invalid cycles, missing references and impossible SLA values are rejected before persistence',async t=>{
  const f=await fixture(t),config=(await f.trainer(f.path+'/scenario')).body;
  const candidates=[];
  let p=structuredClone(config.pack);p.events[0].prerequisites=['E08'];candidates.push(p);
  p=structuredClone(config.pack);p.events=p.events.filter(e=>e.id!=='E05');candidates.push(p);
  p=structuredClone(config.pack);p.slaPolicies[0].resolutionMinutes=0;candidates.push(p);
  p=structuredClone(config.pack);p.events[0].ciId='missing';candidates.push(p);
  p=structuredClone(config.pack);p.events[0].choices.forEach(c=>c.resolve=false);candidates.push(p);
  for(const pack of candidates)assert.equal((await f.trainer(f.path+'/scenario','PUT',{...config,pack})).status,400);
  assert.equal((await f.trainer(f.path+'/scenario')).body.revision,1);
  assert.equal(validateScenario(config.pack).events.length,12);
});

test('SLA is independent of paused workshop time and retains breach after closure; breach requirement is a data field',async t=>{
  const f=await fixture(t),config=(await f.trainer(f.path+'/scenario')).body;
  const event=config.pack.events.find(e=>e.id==='E04');event.id='SLA-LAB';event.choices.forEach((c,i)=>c.id=`SLA-LAB-${i}`);
  assert.equal((await f.trainer(f.path+'/scenario','PUT',config)).status,200);
  const released=await f.action({action:'release',eventId:'SLA-LAB'}),record=released.body.itsm.records[0];
  await f.action({action:'ack',recordId:record.id});
  await f.trainer(f.path+'/clock','POST',{action:'pause'});
  assert.equal((await f.action({action:'evaluate',recordId:record.id,choiceId:'SLA-LAB-0',note:'Aşım henüz gerçekleşmedi; kapatmamalı.'})).status,409);
  const nearEnd=record.due_at+1;
  assert.equal(slaStatus(record,nearEnd).breached,true);
  // Controlled test fixture moves the deadline; this is not real Niles SLA evidence.
  f.store.run('UPDATE simulation_records SET due_at=? WHERE id=?',Date.now()-2000,record.id);
  const solved=await f.action({action:'evaluate',recordId:record.id,choiceId:'SLA-LAB-0',note:'Aşım gözlemi tamam; alternatif hizmet ve kullanıcı teyidi alındı.'});
  assert.equal(solved.status,200);assert.equal(solved.body.itsm.records[0].sla.breached,true);
  assert.equal(solved.body.itsm.niles.status,'not_connected');
  const final=slaStatus(solved.body.itsm.records[0],Date.now()+60000);assert.equal(final.breached,true);assert.equal(final.remainingSeconds,solved.body.itsm.records[0].sla.remainingSeconds);
});

test('full scenario can be played and final status does not depend on a fixed event id or score denominator',async t=>{
  const f=await fixture(t);await completeLearningEvidence(f);let state;
  for(const eventId of ['E02','E09','E10'])assert.equal((await f.action({action:'release',eventId})).status,200);
  const animalStep=async(operation,extra={})=>{const current=(await f.trainer(f.path+'/state')).body.itsm.encounter;const response=await f.action({action:'animal',operation,runtimeRevision:current.revision,requestId:crypto.randomUUID(),...extra});assert.equal(response.status,200,JSON.stringify(response.body));};
  for(const option of ['R2','R3','R4','R7','R8'])await animalStep('animal_share',{option});
  await animalStep('animal_inspect');await animalStep('animal_plan',{option:'quiet',note:'Elif ve PA sessizliği saha testi; başarısızsa gözlem alanı kapalı.'});await animalStep('animal_fund');await animalStep('animal_approve');await animalStep('animal_keeper');
  const advance=seconds=>{const row=f.store.one('SELECT state FROM simulation_runtime WHERE workshop_id=?',f.wid),runtime=JSON.parse(row.state);runtime.clock.seconds+=seconds;f.store.run('UPDATE simulation_runtime SET state=? WHERE workshop_id=?',JSON.stringify(runtime),f.wid);};
  advance(60);await animalStep('animal_execute');advance(90);await animalStep('animal_validate',{option:'pass'});await animalStep('animal_accept',{note:'Nermin Hoca sessiz gözlem kapsamını ve zamanını kabul etti.'});
  for(const event of f.scenario.events){
    const released=await f.action({action:'release',eventId:event.id});assert.equal(released.status,200,event.id);
    const record=released.body.itsm.records.find(r=>r.event_id===event.id);
    await f.action({action:'ack',recordId:record.id});
    if(event.id==='E06'){
      const step=async(operation,extra={})=>{const current=(await f.trainer(f.path+'/state')).body.itsm.encounter;const response=await f.action({action:'encounter',operation,runtimeRevision:current.revision,requestId:crypto.randomUUID(),...extra});assert.equal(response.status,200,JSON.stringify(response.body));};
      for(const option of ['R2','R3','R4'])await step('share',{option});
      await step('inspect');await step('plan',{option:'isolate',note:'B1 kesintisinde su akışını test et; başarısızsa güvenli kapalı rota.'});await step('fund');await step('approve');await step('execute');
      // Controlled simulation-clock advance, not a real SLA or Niles claim.
      const row=f.store.one('SELECT * FROM simulation_runtime WHERE workshop_id=?',f.wid),runtime=JSON.parse(row.state);runtime.clock.seconds+=121;f.store.run('UPDATE simulation_runtime SET state=? WHERE workshop_id=?',JSON.stringify(runtime),f.wid);
      await step('validate');
    }
    if(event.requireBreach)f.store.run('UPDATE simulation_records SET due_at=? WHERE id=?',Date.now()-1,record.id);
    const result=await f.action({action:'evaluate',recordId:record.id,choiceId:event.choices[0].id,note:'Eğitmen, kayıt ilişkisini ve hizmet sahibinin kabul kanıtını doğruladı.'});
    assert.equal(result.status,200,event.id);state=result.body;
    if(event.id==='E07'){
      const problem=state.itsm.records.find(r=>r.event_id==='E05');
      const closed=await f.action({action:'evaluate',recordId:problem.id,choiceId:'E05-3',note:'Kalıcı düzeltme, hizmet testi ve tekrar izleme sonucu doğrulandı.'});
      assert.equal(closed.status,200);state=closed.body;
    }
  }
  assert.equal(state.itsm.currentServicesReady,false);await animalStep('animal_revalidate',{note:'Kalıcı teknik düzeltme sonrası güncel gözlem hizmeti yeniden teyit edildi.'});state=(await f.trainer(f.path+'/state')).body;assert.equal(state.itsm.currentServicesReady,true);
  assert.equal(state.itsm.metrics.resolved,12);assert.equal(state.itsm.metrics.maximum,60);assert.equal(state.itsm.metrics.score,60);assert.equal(state.itsm.finale,true);assert.deepEqual(state.itsm.effects,[]);
});

test('retry keys deduplicate notes and accepted results without extra score or history',async t=>{
  const f=await fixture(t),released=await f.action({action:'release',eventId:'E01'}),record=released.body.itsm.records[0];
  await f.action({action:'ack',recordId:record.id});
  const note={action:'note',recordId:record.id,note:'Yerel prova: turnike testi yapıldı.',requestId:'note-retry-0001'};
  assert.equal((await f.action(note,f.member)).status,200);
  assert.equal((await f.action(note,f.member)).body.itsm.decisions.filter(d=>d.id===note.requestId).length,1);
  const input={action:'evaluate',recordId:record.id,choiceId:'E01-1',note:'Kuyruk açıldı ve ziyaretçi teyidi alındı.',requestId:'accept-retry-0001'};
  assert.equal((await f.action(input)).status,200);
  const again=await f.action(input);assert.equal(again.status,200);
  assert.equal(again.body.itsm.decisions.filter(d=>d.id===input.requestId).length,1);
  assert.equal(again.body.itsm.metrics.score,5);
  assert.equal((await f.action({...note,requestId:'new-closed-note'})).status,409);
});

test('unreachable closure dependencies and malformed guide content are rejected',()=>{
  const p=loadScenario();
  const cycle=structuredClone(p);
  for(const c of cycle.events[0].choices)if(c.resolve)c.requiresResolved=['E02'];
  for(const c of cycle.events[1].choices)if(c.resolve)c.requiresResolved=['E01'];
  assert.throws(()=>validateScenario(cycle),/döngü/);
  const malformed=structuredClone(p);malformed.guides[0].content={unexpected:true};
  assert.throws(()=>validateScenario(malformed),/metni kontrol/);
});

test('finale does not celebrate while the other required events remain unplayed',async t=>{
  const f=await fixture(t);await completeLearningEvidence(f);const config=(await f.trainer(f.path+'/scenario')).body;
  const final=config.pack.events.find(e=>e.finale);final.prerequisites=[];
  assert.equal((await f.trainer(f.path+'/scenario','PUT',config)).status,200);
  const released=await f.action({action:'release',eventId:final.id}),r=released.body.itsm.records[0];
  await f.action({action:'ack',recordId:r.id});
  const choice=final.choices.find(c=>c.resolve&&!c.requiresResolved.length);
  const accepted=await f.action({action:'evaluate',recordId:r.id,choiceId:choice.id,note:'Final kartının kanıtı doğrulandı; diğer işler henüz oynanmadı.'});
  assert.equal(accepted.status,200);assert.equal(accepted.body.itsm.finale,false);
  const participant=(await f.member(f.path+'/state')).body.itsm.events.find(e=>e.id===final.id);
  assert.equal(participant.debrief,final.debrief);assert.equal(participant.choices,undefined);
});
