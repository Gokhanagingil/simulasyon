import { escape as e } from './ui.js';

const states = {draft:'Taslak',review:'İnceleme bekliyor',approved:'Yayına uygun',published:'Yayımlanmış',retired:'Emekli'};
const results = {worked:'İşe yaradı',failed:'İşe yaramadı',not_applicable:'Koşullara uygun değildi'};
const names = {draft:'Bilgi taslağı oluştur',edit:'Taslağı düzelt',submit:'R8 incelemesine gönder',review:'Bağımsız inceleme',publish:'Onaylı sürümü yayımla',revise:'Yeni sürüm oluştur',retire:'Sürümü emekli et',reuse:'Başka olayda sına',measure:'Ölçüm ve gözlem kaydet',transfer:'İşe aktarım yanıtım',assess:'Aktarım kanıtını değerlendir'};
const submitNames = {draft:'Bilgi taslağını kaydet',edit:'Taslak düzeltmesini kaydet',submit:'R8 incelemesine gönder',review:'İnceleme kararını kaydet',publish:'Onaylı sürümü yayımla',revise:'Yeni sürüm taslağını oluştur',retire:'Sürümü emekli et',reuse:'Bilgi kullanımını kaydet',measure:'Ölçüm ve gözlemi kaydet',transfer:'Aktarım yanıtını gönder',assess:'Aktarım değerlendirmesini kaydet'};
const criteria = {dependency:'Bağımlılık ve iş etkisi',decision:'Yetki ve risk',verification:'Hizmet kabul kanıtı'};
const control = (op,id='',label=names[op]) => `<button class="btn secondary" type="button" data-learning="${op}" data-id="${e(id)}">${e(label)}</button>`;
const text = value => e(value).replace(/\r?\n/g,'<br>');
const normalize = value => String(value||'').toLocaleLowerCase('tr').trim();
const eventLabel = (state,eventId) => {
  const record = state.itsm.records.find(r=>r.event_id===eventId);
  return [eventId,record?.number,record?.title].filter(Boolean).join(' · ');
};
const recordLink = (state,eventId,label='Kaynak kaydı aç') => {
  const record = state.itsm.records.find(r=>r.event_id===eventId);
  return record ? `<button class="btn quiet" type="button" data-action="record" data-id="${e(record.id)}">${e(label)}: ${e(record.number||eventId)}</button>` : '';
};
const articleContent = a => `<p><b>Koşul:</b> ${text(a.scope)}</p><p><b>Adımlar / kontrol:</b> ${text(a.procedure)}</p><p><b>Sınırlar / geri dönüş:</b> ${text(a.limits)}</p>`;
const sourceContent = (state,a) => `<p><b>Kaynak olay:</b> ${e(eventLabel(state,a.source.eventId))}</p><p>${text(a.source.note)}</p>${recordLink(state,a.source.eventId)}${a.review?`<p><b>Bağımsız inceleme:</b> ${e(a.review.actor)} · ${a.review.decision==='approve'?'Yayına uygun':'Düzeltme gerekli'}</p><p>${text(a.review.note)}</p>`:'<p>Bağımsız inceleme henüz yok.</p>'}${a.retirementReason?`<p><b>Emeklilik:</b> ${text(a.retirementReason)}</p>`:''}`;
const articlePreview = (state,a) => a ? `<section class="decision"><h3>${e(a.title)} · v${a.version}</h3><p>${e(states[a.status])} · ${e(a.author)} · ${e(a.source.eventId)}</p>${articleContent(a)}<details><summary>Tam kaynak ve inceleme kanıtı</summary>${sourceContent(state,a)}</details></section>` : '';
function transferContent(t) {
  return `<article class="decision"><b>${e(t.actor)}</b>${Object.entries(criteria).map(([key,label])=>`<p><b>${label}:</b><br>${text(t[key])}</p>`).join('')}${t.assessment?`<p><b>Eğitmen gözlemi:</b> ${text(t.assessment.note)}</p><p>${Object.entries(criteria).map(([key,label])=>`${label}: ${t.assessment[key]==='demonstrated'?'Gözlendi':'Pratik gerekli'}`).join(' · ')}</p>`:'<p>Yanıt kaydedildi. Eğitmen değerlendirmesi bekleniyor.</p>'}</article>`;
}

export function learningSummary(state) {
  const l=state.itsm.learning;
  if(!l?.enabled)return '';
  return `<section class="panel table-panel"><h2>Kapanıştan ayrı: öğrenme kanıtı</h2><p>${e(l.caution)}</p><p>Yayımlı bilgi: <b>${l.metrics.published}</b> · Başka rolde kullanım: <b>${l.metrics.crossRoleReuse}</b> · İşe yaradığı bildirilen kullanım: <b>${l.metrics.successfulReuse}</b> · R8 gözlemi: <b>${l.metrics.measurements}</b> · Eğitmenin değerlendirdiği aktarım: <b>${l.metrics.transferAssessed}</b></p><a href="#learning">Bilgi sürümleri ve öğrenme kanıtını incele →</a></section>`;
}

export function learningPage(state) {
  const l=state.itsm.learning;
  if(!l?.enabled)return '<h1>Bilgi ve öğrenme</h1><p>Bu eski atölyenin paketi korunuyor. Sürümlü bilgi ve öğrenme akışı için eğitmen yeni atölye açmalı.</p>';
  const can=op=>l.allowed.includes(op), own=a=>state.user.trainer||a.authorId===state.user.id;
  const ownTransfer=l.transfers.find(t=>t.actorId===state.user.id);
  const sourceEvents=[...new Set(l.articles.map(a=>a.source.eventId))].sort();
  const articles=l.articles.map(a=>{
    const family=l.articles.filter(other=>other.family===a.family);
    const current=family.find(other=>other.status==='published');
    const latest=Math.max(...family.map(other=>other.version));
    const search=[a.title,a.author,a.authorRole,a.source.eventId,eventLabel(state,a.source.eventId),`v${a.version}`,states[a.status],a.scope,a.procedure,a.limits,a.source.note,a.review?.note].join(' ');
    return `<article class="panel service" data-learning-article data-article-id="${e(a.id)}" data-search="${e(normalize(search))}" data-status="${e(a.status)}" data-event="${e(a.source.eventId)}"><small>${e(states[a.status])} · v${a.version} · ${e(a.author)} · ${e(a.source.eventId)}</small><h2>${e(a.title)}</h2><p>${current?`Geçerli yayımlı sürüm: v${current.version}.`:'Geçerli yayımlı sürüm yok.'}${latest>a.version?` En yeni sürüm: v${latest}.`:''}</p>${articleContent(a)}<details><summary>Kaynak ve inceleme kanıtı</summary>${sourceContent(state,a)}</details><div class="actions">${own(a)&&a.status==='draft'?['edit','submit'].filter(can).map(op=>control(op,a.id)).join(''):''}${can('review')&&a.status==='review'&&a.authorId!==state.user.id?control('review',a.id):''}${own(a)&&a.status==='approved'&&can('publish')?control('publish',a.id):''}${own(a)&&['published','retired'].includes(a.status)&&can('revise')?control('revise',a.id):''}${own(a)&&a.status==='published'&&can('retire')?control('retire',a.id):''}${can('reuse')&&a.status==='published'&&a.authorId!==state.user.id&&a.authorRole!==state.roleId?control('reuse',a.id):''}</div></article>`;
  }).join('');
  return `<h1>Bir sonraki vardiyaya ne bıraktık?</h1><p>Kaynak kanıt → R5 taslak → R8 bağımsız inceleme → yayın → başka rolde gözlenen kullanım. Yeni sürüm yayımlanana kadar önceki yayımlı sürüm geçerlidir.</p>${learningSummary(state)}<div class="actions">${['draft','measure'].filter(can).map(op=>control(op)).join('')}${can('transfer')?control('transfer',ownTransfer?.id,ownTransfer?'Yanıtımı gör':names.transfer):''}</div>
  <section data-learning-browser aria-label="Bilgi sürümlerini bul"><div class="panel table-panel"><h2>Bilgi sürümleri</h2><div class="guide-grid"><label>Bilgi ara<input type="search" id="learning-search" name="learningSearch" data-learning-filter="query" placeholder="Başlık, yazar, olay, sürüm veya kanıt" aria-controls="learning-articles"/></label><label>İnceleme / yayın durumu<select id="learning-status" name="learningStatus" data-learning-filter="status" aria-controls="learning-articles"><option value="">Tüm durumlar</option>${Object.entries(states).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label><label>Kaynak olay<select id="learning-event" name="learningEvent" data-learning-filter="event" aria-controls="learning-articles"><option value="">Tüm kaynak olaylar</option>${sourceEvents.map(eventId=>`<option value="${e(eventId)}">${e(eventLabel(state,eventId))}</option>`).join('')}</select></label></div><p data-learning-count role="status" aria-live="polite">${l.articles.length} / ${l.articles.length} bilgi sürümü gösteriliyor.</p></div><div class="guide-grid" id="learning-articles">${articles}</div><p data-learning-empty ${l.articles.length?'hidden':''}>${l.articles.length?'Bu arama ve filtrelerle eşleşen bilgi yok. Aramayı veya filtreleri değiştirin.':'Henüz bilgi taslağı yok. R5 önce bir olayda kaydedilmiş çalışma kanıtını seçmeli.'}</p></section>
  <section class="panel table-panel"><h2>Başka rolde kullanım</h2>${l.reuses.map(r=>`<article class="decision"><p><b>${e(r.actor)} · ${e(r.eventId)} · v${r.version} · ${e(results[r.result])}</b></p><p>${text(r.note)}</p><p>${e(r.title)}</p><details><summary>Kaydedilmiş kullanım gözlemi</summary><p>${text(r.observation.note)}</p>${recordLink(state,r.eventId,'Kullanım kaydını aç')}</details></article>`).join('')||'<p>Henüz gözlenmedi. Bilginin yayımlanması, kullanıldığı anlamına gelmez.</p>'}</section>
  <section class="panel table-panel"><h2>R8 ölçüm günlüğü</h2>${l.measurements.map(m=>`<article class="decision"><p><b>${e(m.actor)} · ${e({baseline:'Başlangıç',checkpoint:'Ara',final:'Son'}[m.stage])} · ${e(m.eventId)}</b></p><p>${text(m.metric)}</p><p>${text(m.observation)}</p><small>O andaki kayıtlar: ${m.snapshot.open} açık / ${m.snapshot.breached} SLA aşımı / ${m.snapshot.resolved} kabul. Gerçek SLA; kasıtlı E04 aşımını yorumda ayırın.</small>${recordLink(state,m.eventId,'İlgili kaydı aç')}</article>`).join('')||'<p>Başlangıç/ara/son gözlem henüz yok.</p>'}</section>
  <section class="panel table-panel"><h2>Yeni duruma aktarım</h2><p>Yeni örnek: iki entegrasyon sunucusu ayrı olsa da aynı DNS’e bağlı. İşlem API’si yeşil, müşteri siparişi tamamlanmıyor. Ortak bağımlılık, yetkili risk kararı ve uçtan uca kabul kanıtını açıklayın.</p>${l.transfers.map(t=>transferContent(t)+(!t.assessment&&can('assess')?control('assess',t.id):'')).join('')||'<p>Henüz yanıt yok. Senaryo kapanış puanı bu aktarımın yerine geçmez.</p>'}</section>`;
}

// UI filtering only. The server still decides permissions, evidence validity and revisions.
export function syncLearningUI(root=document) {
  for(const browser of root.querySelectorAll('[data-learning-browser]')) {
    const query=normalize(browser.querySelector('[data-learning-filter="query"]')?.value);
    const status=browser.querySelector('[data-learning-filter="status"]')?.value||'';
    const event=browser.querySelector('[data-learning-filter="event"]')?.value||'';
    const cards=[...browser.querySelectorAll('[data-learning-article]')];
    let visible=0;
    for(const card of cards) {
      card.hidden=!!(query&&!normalize(card.dataset.search).includes(query)||status&&card.dataset.status!==status||event&&card.dataset.event!==event);
      if(!card.hidden)visible++;
    }
    browser.querySelector('[data-learning-count]').textContent=`${visible} / ${cards.length} bilgi sürümü gösteriliyor.`;
    browser.querySelector('[data-learning-empty]').hidden=visible>0;
  }
  for(const form of root.querySelectorAll('form[data-form="learning"]')) {
    const selected=form.querySelector('select[name="evidence"]')?.value;
    if(selected===undefined)continue;
    let found=false;
    for(const preview of form.querySelectorAll('[data-learning-evidence]')) {
      preview.hidden=preview.dataset.learningEvidence!==selected;
      if(!preview.hidden)found=true;
    }
    const empty=form.querySelector('[data-learning-no-evidence]');
    if(empty)empty.hidden=found;
  }
}

export function learningForm(state,op,id,context={}) {
  const learning=state.itsm.learning;
  const a=learning.articles.find(article=>article.id===id);
  const ownTransfer=learning.transfers.find(t=>t.actorId===state.user.id);
  const heading=title=>`<div class="modal-head"><h2 id="dialog-title">${e(title)}</h2><button class="btn quiet" type="button" data-action="close" aria-label="Pencereyi kapat">×</button></div>`;
  if(op==='transfer'&&ownTransfer)return `${heading('Yanıtım ve değerlendirme durumu')}<div class="modal-body"><p>Aktarım yanıtınız kaydedildi. Bu yanıt salt okunur; aynı atölyede ikinci yanıt gönderilemez.</p>${transferContent(ownTransfer)}</div>`;
  const field=(name,label,value='',min=20,max=2000)=>`<label>${label}<textarea name="${name}" required minlength="${min}" maxlength="${max}" aria-describedby="learning-${name}-hint">${e(value)}</textarea><small id="learning-${name}-hint">En az ${min}, en çok ${max} karakter. ${name==='title'?'Konuyu ayırt eden bir başlık yazın.':'Somut kanıtı ve gerekçenizi yazın.'}</small></label>`;
  const select=(name,label,values,prompt='Seçin')=>`<label>${label}<select name="${name}" required><option value="">${prompt}</option>${values.map(([value,label])=>`<option value="${e(value)}">${e(label)}</option>`).join('')}</select></label>`;
  const options=state.itsm.decisions.filter(d=>['note','propose','evaluate'].includes(d.kind)&&(op!=='reuse'||d.actor_id===state.user.id&&d.event_id!==a?.source.eventId));
  const selected=options.find(d=>d.id===context.evidenceId&&d.event_id===context.eventId)||options.find(d=>op!=='reuse'&&a?.source.id===d.id&&a.source.eventId===d.event_id);
  const evidence=`<label>${op==='reuse'?'Başka olayda kendi kaydettiğin gözlem':'Kaynak olayın kaydedilmiş kanıtı'}<select name="evidence" required aria-describedby="learning-evidence-help"><option value="">Kanıt seçin</option>${options.map(d=>`<option value="${e(d.event_id+'|'+d.id)}" ${selected===d?'selected':''}>${e(d.event_id+' · '+d.actor+' · '+d.note.slice(0,100))}</option>`).join('')}</select></label><p id="learning-evidence-help">${op==='reuse'?'Seçilen kayıtlı gözlem aynen ilişkilendirilir. Aşağıya yalnız bu bilginin uygunluğunu ve kullanım sonucunu açıklayan yeni yorumunuzu yazın.':'Kanıtı seçtikten sonra aşağıda tam metni ve kaynak kaydı kontrol edin.'} Listede kanıt yoksa önce ilgili olayda çalışma notunu kaydedin.</p><section class="decision" aria-label="Seçilen kanıtın tam metni" aria-live="polite"><p data-learning-no-evidence ${selected?'hidden':''}>Tam önizleme için bir kanıt seçin.</p>${options.map(d=>`<article data-learning-evidence="${e(d.event_id+'|'+d.id)}" ${selected===d?'':'hidden'}><h3>Seçilen kaynak kanıt</h3><p>${e(eventLabel(state,d.event_id))} · ${e(d.actor)}</p><p>${text(d.note)}</p>${recordLink(state,d.event_id)}</article>`).join('')}</section>`;
  let body='';
  if(['draft','edit','revise'].includes(op))body=field('title','Başlık',a?.title||'',8,160)+evidence+field('scope','Hangi koşulda geçerli?',a?.scope||'')+field('procedure','Güvenli adımlar ve doğrulama',a?.procedure||'')+field('limits','Sınırlar / uygulanmayacağı durum / geri dönüş',a?.limits||'');
  else if(op==='review')body=articlePreview(state,a)+select('option','İnceleme kararı',[['approve','Kaynak ve sınırlar yeterli: yayına uygun'],['reject','Düzeltme gerekli']],'İnceleme kararını seçin')+field('note','Hangi kanıtı ve sınırı sınadın?');
  else if(op==='retire')body=articlePreview(state,a)+field('note','Neden artık kullanılmamalı?');
  else if(op==='reuse')body=articlePreview(state,a)+'<p>Bilgiyi uyguladığını varsayma; yaptığın kontrolü ve gözlediğin sonucu kaydet.</p>'+evidence+select('option','Gözlenen sonuç',Object.entries(results),'Gözlenen sonucu seçin')+field('note','Bu bilgi için uygunluk, uygulama ve sonuç yorumun');
  else if(op==='measure')body=select('option','Gözlem noktası',[['baseline','Başlangıç'],['checkpoint','Ara'],['final','Son']],'Gözlem noktasını seçin')+select('eventId','İlgili gönderilmiş olay',state.itsm.records.map(r=>[r.event_id,r.event_id+' · '+r.number+' · '+r.title]),'İlgili olayı seçin')+field('metric','Ölçüt, kaynak ve gözlem penceresi')+field('note','Gözlenen değer ve yorum; E04 kasıtlı aşımını ayır');
  else if(op==='transfer')body='<p>İki entegrasyon sunucusu aynı DNS’e bağlı; API yeşil ama müşteri siparişi tamamlanmıyor. Yanıt tek sefer gönderilir; göndermeden önce üç alanı kontrol edin.</p>'+field('dependency','Hangi ortak bağımlılık ve iş etkisi?')+field('decision','Kim hangi risk/uygulama kararını vermeli?')+field('verification','Gerçek hizmeti hangi uçtan uca kanıt doğrular?');
  else if(op==='assess') {
    const transfer=learning.transfers.find(t=>t.id===id);
    body=(transfer?transferContent(transfer):'')+Object.entries(criteria).map(([key,label])=>select(key,label,[['needs_practice','Henüz gösterilmedi / pratik gerekli'],['demonstrated','Yanıtta gözlendi']],'Gözlenen düzeyi seçin')).join('')+field('note','Somut kanıt ve gelişim geri bildirimi');
  } else body=articlePreview(state,a)+`<p>${op==='submit'?'Bu taslak R8 incelemesine gidecek.':'Bu onaylı sürüm yayımlanacak; aynı makalenin önceki yayımlı sürümü emekli olacak.'}</p>`;
  return `${heading(names[op])}<div class="modal-body"><form data-form="learning"><input type="hidden" name="runtimeRevision" value="${state.itsm.encounter.revision}"/><input type="hidden" name="operation" value="${e(op)}"/><input type="hidden" name="${op==='assess'?'transferId':'articleId'}" value="${e(id||'')}"/>${body}<small>Taslak bu sekmede korunur. “${e(submitNames[op])}” ile işlem ekibe kaydedilir.</small><button class="btn primary" type="submit">${e(submitNames[op])}</button><div class="form-error" role="alert" aria-live="assertive"></div></form></div>`;
}
