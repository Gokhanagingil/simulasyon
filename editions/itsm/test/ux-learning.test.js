import {test} from 'node:test';
import assert from 'node:assert/strict';
import {learningForm,learningPage,syncLearningUI} from '../public/learning.js';

function fixture() {
  const note='Kaydedilmiş gözlem '.repeat(9)+'SON BÖLÜM: <etiket> & gerçek saha teyidi.';
  const article={id:'a1',family:'family-1',version:1,status:'published',title:'İletişim hizmeti için güvenli kontrol',scope:'Bu hizmette doğru bağımlılık ve koşul kontrol edilir.',procedure:'Müşteri işlemi uçtan uca sınanır, saha sonucu kayda alınır.',limits:'Teyit başarısızsa güvenli duruma dönülür ve rol sahibine devredilir.',source:{id:'source-1',eventId:'E01',note},authorId:'writer',author:'Bilgi Yazarı',authorRole:'R5'};
  return {user:{id:'learner',name:'Katılımcı',trainer:false},roleId:'R3',itsm:{encounter:{revision:17},records:[{id:'w__E01',event_id:'E01',number:'INC-001',title:'Turnike sorunu'},{id:'w__E03',event_id:'E03',number:'INC-003',title:'Saha kontrolü'}],decisions:[{id:'source-1',event_id:'E01',actor_id:'writer',actor:'Bilgi Yazarı',kind:'note',note},{id:'own-source',event_id:'E01',actor_id:'learner',actor:'Katılımcı',kind:'note',note:'Aynı olayda kendi gözlemim; yeniden kullanım için uygun değildir.'},{id:'own-observation',event_id:'E03',actor_id:'learner',actor:'Katılımcı',kind:'note',note:'Başka olayda benim tam saha gözlemim ve doğruladığım sonuç.'},{id:'other-observation',event_id:'E03',actor_id:'other',actor:'Başka kişi',kind:'note',note:'Başka kişinin kanıtı yeniden kullanım için seçilemez.'},{id:'private',event_id:'E03',actor_id:'learner',actor:'Katılımcı',kind:'reveal',note:'Özel zarf işlem kaydı kanıt değildir.'}],learning:{enabled:true,allowed:['draft','edit','submit','review','publish','revise','retire','reuse','measure','transfer','assess'],caution:'Öğrenme kanıtı kapanış puanı değildir.',articles:[article],transfers:[],reuses:[],measurements:[],metrics:{published:1,crossRoleReuse:0,successfulReuse:0,measurements:0,transferAssessed:0}}}};
}
function selectMarkup(html,name) {
  const match=html.match(new RegExp(`<select name="${name}"[^>]*>[\\s\\S]*?<\\/select>`));
  assert.ok(match,`select ${name} exists`);
  return match[0];
}
function assertNeutralRequired(html,name,prompt) {
  const select=selectMarkup(html,name);
  assert.match(select,/^<select[^>]* required[ >]/);
  assert.ok(select.includes(`<option value="">${prompt}</option>`));
  assert.doesNotMatch(select,/selected/);
}

test('review, reuse and all assessment criteria require an explicit neutral choice',()=>{
  const state=fixture();
  assertNeutralRequired(learningForm(state,'review','a1'),'option','İnceleme kararını seçin');
  assertNeutralRequired(learningForm(state,'reuse','a1'),'option','Gözlenen sonucu seçin');
  const assessment=learningForm(state,'assess','transfer-1');
  for(const key of ['dependency','decision','verification'])assertNeutralRequired(assessment,key,'Gözlenen düzeyi seçin');
  const measurement=learningForm(state,'measure');
  assertNeutralRequired(measurement,'option','Gözlem noktasını seçin');
  assertNeutralRequired(measurement,'eventId','İlgili olayı seçin');
});

test('submitted transfer opens the current user answer read-only, including assessment',()=>{
  const state=fixture();
  const own={id:'own-answer',actorId:'learner',actor:'Katılımcı',dependency:'Ortak DNS müşteri sipariş hizmetini etkiler.',decision:'Risk kararını yetkili rol vermelidir.',verification:'Gerçek sipariş uçtan uca teyit edilir.'};
  state.itsm.learning.transfers=[{...own,id:'other-answer',actorId:'other',dependency:'Başka yanıt'},own];
  assert.match(learningPage(state),/data-learning="transfer" data-id="own-answer">Yanıtımı gör/);
  const before=learningForm(state,'transfer','other-answer');
  assert.doesNotMatch(before,/<form|<textarea|type="submit"/);
  assert.match(before,/Ortak DNS/);
  assert.doesNotMatch(before,/Başka yanıt/);
  assert.match(before,/Eğitmen değerlendirmesi bekleniyor/);
  own.assessment={note:'DNS bağımlılığı gözlendi; karar rolü yeniden çalışılmalı.',dependency:'demonstrated',decision:'needs_practice',verification:'demonstrated'};
  const after=learningForm(state,'transfer');
  assert.match(after,/DNS bağımlılığı gözlendi/);
  assert.match(after,/Yetki ve risk: Pratik gerekli/);
  assert.doesNotMatch(after,/<form|type="submit"/);
});

test('another user transfer does not hide the initial answer form',()=>{
  const state=fixture();
  state.itsm.learning.transfers=[{id:'other-answer',actorId:'other',actor:'Başka kişi',dependency:'Bağımlılık',decision:'Karar',verification:'Teyit'}];
  const page=learningPage(state);
  assert.match(page,/data-learning="transfer" data-id="">İşe aktarım yanıtım/);
  const form=learningForm(state,'transfer');
  assert.match(form,/data-form="learning"/);
  assert.match(form,/Aktarım yanıtını gönder/);
});

test('record context preselects only eligible saved evidence and previews full escaped source',()=>{
  const state=fixture();
  const context={eventId:'E03',evidenceId:'own-observation'};
  const form=learningForm(state,'reuse','a1',context);
  const evidence=selectMarkup(form,'evidence');
  assert.match(evidence,/<option value="E03\|own-observation" selected>/);
  assert.doesNotMatch(evidence,/source-1|own-source|other-observation|private/);
  assert.match(form,/data-learning-evidence="E03\|own-observation" ><h3>/);
  assert.match(form,/data-action="record" data-id="w__E03"/);
  assert.match(form,/yalnız bu bilginin uygunluğunu ve kullanım sonucunu açıklayan yeni yorum/);
  for(const bad of [{eventId:'E03',evidenceId:'other-observation'},{eventId:'E01',evidenceId:'own-source'},{eventId:'E01',evidenceId:'own-observation'}]) {
    assert.doesNotMatch(selectMarkup(learningForm(state,'reuse','a1',bad),'evidence'),/selected/);
  }
  const draft=learningForm(state,'draft',undefined,{eventId:'E01',evidenceId:'source-1'});
  assert.match(draft,/SON BÖLÜM: &lt;etiket&gt; &amp; gerçek saha teyidi\./);
  assert.doesNotMatch(draft,/<etiket>/);
  assert.match(draft,/data-action="record" data-id="w__E01"/);
});

test('editing an article retains its recorded source and original runtime revision',()=>{
  const state=fixture();
  const html=learningForm(state,'edit','a1');
  assert.match(selectMarkup(html,'evidence'),/<option value="E01\|source-1" selected>/);
  assert.match(html,/name="runtimeRevision" value="17"/);
  assert.match(html,/name="articleId" value="a1"/);
  assert.match(html,/name="title" required minlength="8" maxlength="160" aria-describedby="learning-title-hint"/);
  assert.match(html,/id="learning-title-hint">En az 8, en çok 160 karakter/);
  assert.match(html,/id="learning-scope-hint">En az 20, en çok 2000 karakter/);
});

test('all learning submit controls name the action and errors have permanent accessible output',()=>{
  const state=fixture();
  const labels={draft:'Bilgi taslağını kaydet',edit:'Taslak düzeltmesini kaydet',submit:'R8 incelemesine gönder',review:'İnceleme kararını kaydet',publish:'Onaylı sürümü yayımla',revise:'Yeni sürüm taslağını oluştur',retire:'Sürümü emekli et',reuse:'Bilgi kullanımını kaydet',measure:'Ölçüm ve gözlemi kaydet',transfer:'Aktarım yanıtını gönder',assess:'Aktarım değerlendirmesini kaydet'};
  for(const [operation,label] of Object.entries(labels)) {
    const html=learningForm(state,operation,'a1');
    assert.ok(html.includes(`<button class="btn primary" type="submit">${label}</button>`),operation);
    assert.match(html,/class="form-error" role="alert" aria-live="assertive"/);
    assert.doesNotMatch(html,/>Kaydet<\/button>/);
  }
});

test('article browser exposes searchable source, author, version and current family status',()=>{
  const state=fixture();
  state.itsm.learning.articles.push({...state.itsm.learning.articles[0],id:'a2',version:2,status:'review',title:'Yeni bağımlılık koşulları'});
  const html=learningPage(state);
  for(const key of ['query','status','event'])assert.ok(html.includes(`data-learning-filter="${key}"`));
  assert.match(html,/data-search="[^"]*bilgi yazarı[^"]*e01[^"]*v1/);
  assert.match(html,/Geçerli yayımlı sürüm: v1\. En yeni sürüm: v2\./);
  assert.match(html,/data-status="review" data-event="E01"/);
  assert.match(html,/data-learning-count role="status" aria-live="polite">2 \/ 2 bilgi sürümü/);
  assert.match(html,/SON BÖLÜM: &lt;etiket&gt; &amp; gerçek saha teyidi\./);
  assert.match(html,/data-action="record" data-id="w__E01"/);
});

test('article actions retain author, role, review and published-version boundaries',()=>{
  const state=fixture();
  state.itsm.learning.articles[0].status='draft';
  let html=learningPage(state);
  assert.doesNotMatch(html,/data-learning="reuse"|data-learning="edit"|data-learning="review"/);
  state.itsm.learning.articles[0].status='review';
  html=learningPage(state);
  assert.match(html,/data-learning="review"/);
  state.user.id='writer';
  html=learningPage(state);
  assert.doesNotMatch(html,/data-learning="review"/);
  state.itsm.learning.articles[0].status='published';
  state.user.id='learner';
  state.roleId='R5';
  assert.doesNotMatch(learningPage(state),/data-learning="reuse"/);
});

test('filter changes combine Turkish search, event and status without replacing cards',()=>{
  const inputs={query:{value:'İLETİŞİM'},status:{value:''},event:{value:''}};
  const cards=[{dataset:{search:'İletişim bilgi yazarı e01 v1',status:'published',event:'E01'}},{dataset:{search:'İletişim bilgi yazarı e03 v2',status:'review',event:'E03'}},{dataset:{search:'Pompa r5 e01 v1',status:'retired',event:'E01'}}];
  const count={},empty={};
  const browser={querySelector(selector){if(selector==='[data-learning-count]')return count;if(selector==='[data-learning-empty]')return empty;return inputs[selector.match(/="(\w+)"/)[1]];},querySelectorAll:()=>cards};
  const root={querySelectorAll:selector=>selector==='[data-learning-browser]'?[browser]:[]};
  syncLearningUI(root);
  assert.deepEqual(cards.map(c=>c.hidden),[false,false,true]);
  assert.equal(count.textContent,'2 / 3 bilgi sürümü gösteriliyor.');
  inputs.status.value='review';inputs.event.value='E03';
  syncLearningUI(root);
  assert.deepEqual(cards.map(c=>c.hidden),[true,false,true]);
  inputs.query.value='bulunmayan';
  syncLearningUI(root);
  assert.ok(cards.every(c=>c.hidden));assert.equal(empty.hidden,false);
  inputs.query.value='';inputs.status.value='';inputs.event.value='';
  syncLearningUI(root);
  assert.ok(cards.every(c=>!c.hidden));assert.equal(empty.hidden,true);
});

test('source preview follows restored and changed evidence and rejects an absent selection',()=>{
  const selection={value:'E03|own'},empty={};
  const previews=[{dataset:{learningEvidence:'E01|source'}},{dataset:{learningEvidence:'E03|own'}}];
  const form={querySelector:selector=>selector==='select[name="evidence"]'?selection:empty,querySelectorAll:()=>previews};
  const root={querySelectorAll:selector=>selector==='form[data-form="learning"]'?[form]:[]};
  syncLearningUI(root);assert.deepEqual(previews.map(p=>p.hidden),[true,false]);assert.equal(empty.hidden,true);
  selection.value='E01|source';syncLearningUI(root);assert.deepEqual(previews.map(p=>p.hidden),[false,true]);
  selection.value='stale-source';syncLearningUI(root);assert.ok(previews.every(p=>p.hidden));assert.equal(empty.hidden,false);
});
