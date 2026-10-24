import { escape as e } from './ui.js';

// Original teaching text and layout. These are learning aids, never game commands.
export const principles = [
  ['Değere odaklan', 'Focus on value', 'Ziyaretçinin hangi sonucu beklediğini birlikte tanımlayın.', 'Turnike yeşil olsa da ziyaretçi girebiliyor mu?'],
  ['Bulunduğun yerden başla', 'Start where you are', 'Mevcut kanıtı ve işe yarayan kapasiteyi gözlemleyin.', 'Yeni pompa almadan önce mevcut iki pompanın ortak panosunu inceleyin.'],
  ['Geri bildirimle yinelemeli ilerle', 'Progress iteratively with feedback', 'Küçük bir adımı sınayın; öğrendiğinize göre sonraki adımı seçin.', 'Sessiz gözlemi önce sahada test edin; başarısızsa planı düzeltin.'],
  ['İş birliği yap ve görünürlüğü artır', 'Collaborate and promote visibility', 'Karar için gereken bilgiyi ilgili roller arasında görünür kılın.', 'Saha, teknik ekip ve vardiya planlayıcısının kanıtlarını birleştirin.'],
  ['Bütünsel düşün ve çalış', 'Think and work holistically', 'Hizmeti, insanları ve bağımlılıkları bir bütün olarak ele alın.', 'Mümtaz, Elif, habitat, su ve park ağı aynı ziyaret vaadine katkı sağlar.'],
  ['Basit ve uygulanabilir tut', 'Keep it simple and practical', 'İstenen sonucu sağlayan gerekli adımları koruyun.', 'Kararı, sahibini ve kabul kanıtını anlaşılır bir kayıtla açıklayın.'],
  ['Optimize et ve otomatikleştir', 'Optimize and automate', 'Önce işi iyileştirin; uygun ve doğrulanmış bölümleri otomatikleştirin.', 'Yanlış hizmet vaadini daha hızlı üretmek yerine önce vaadi düzeltin.'],
];
export const improvementSteps = [
  ['Vizyonumuz nedir?', 'What is the vision?', 'Amaç ve değer', 'Ziyaretçinin güvenli, anlaşılır ve teyit edilmiş bir deneyim yaşaması.'],
  ['Şimdi neredeyiz?', 'Where are we now?', 'Başlangıç durumu', 'Mevcut gözlemleri ve hizmet bağımlılıklarını kaydedin; varsayımı kanıttan ayırın.'],
  ['Nerede olmak istiyoruz?', 'Where do we want to be?', 'Ölçülebilir hedef', 'Hangi hizmet sonucunu, hangi ölçütle ve ne zamana kadar doğrulayacağınızı belirleyin.'],
  ['Oraya nasıl ulaşırız?', 'How do we get there?', 'İyileştirme planı', 'Yetkili roller, kaynak, küçük adımlar, test ve güvenli geri dönüşü planlayın.'],
  ['Harekete geç', 'Take action', 'Uygulama', 'Onaylı adımı ilgili rol uygulasın; gerçekleşen işi ve gözlemi kaydedin.'],
  ['Hedefe ulaştık mı?', 'Did we get there?', 'Sonucu değerlendirme', 'Başlangıç ve hedefle karşılaştırın; kapanan kayıt sayısının ötesinde hizmeti sınayın.'],
  ['İvmeyi nasıl koruruz?', 'How do we keep the momentum going?', 'Öğrenmeyi sürdürme', 'İşe yarayan bilgiyi paylaşın, yeniden kullanımını gözleyin ve yeni ihtiyaca dönün.'],
];
export function teachingShortcuts() {
  return `<nav class="teaching-shortcuts" aria-label="Atölye öğrenme panelleri"><span>ITIL 4 · DÜŞÜNME MOLASI</span><button type="button" data-teaching-open="principles" aria-haspopup="dialog">7 Yol Gösterici İlke <span aria-hidden="true">↗</span></button><button type="button" data-teaching-open="improvement" aria-haspopup="dialog">Sürekli İyileştirme <span aria-hidden="true">↗</span></button></nav>`;
}
export function teachingMarkup(kind, trainer=false, selected=-1) {
  const isPrinciples=kind==='principles', items=isPrinciples?principles:improvementSteps;
  return `<header class="teaching-head"><div><span class="eyebrow">MAVİ VADİ · ITIL 4</span><h2 id="teaching-title">${isPrinciples?'7 Yol Gösterici İlke':'Sürekli İyileştirme'}</h2><p id="teaching-description">${isPrinciples?'Her kararda birlikte düşünün. İlkeler bir işlem sırası değildir.':'Yedi adımda öğrenin, sonucu ölçün ve yeni ihtiyaca dönün.'}</p></div><button type="button" class="btn secondary" data-teaching-close autofocus>Oyuna dön <span aria-hidden="true">↩</span></button></header>
  <div class="teaching-body"><div class="teaching-intro"><b>${isPrinciples?'Pusulamız: ziyaretçiye değer':'Yolumuz: kanıttan daha iyi hizmete'}</b><p>${trainer?'Bir karta basarak sunum ekranında vurgulayın. Vurgu yalnız bu cihazdadır; katılımcılara gönderilmez.':'Kartları birlikte okuyun; kendi olayınızdan bir kanıt bulun.'} Panel oyun saatlerini duraklatmaz.</p>${trainer?'<button type="button" class="btn quiet" data-teaching-clear>Vurguyu temizle</button>':''}</div>
  <ol class="teaching-grid ${isPrinciples?'principle-grid':'improvement-grid'}">${items.map(([title,english,summary,example],index)=>`<li class="teaching-card ${index===selected?'is-highlighted':''}">${trainer?`<button type="button" class="teaching-select" data-teaching-select="${index}" aria-pressed="${index===selected}">`:'<div class="teaching-select">'}<span class="teaching-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><h3>${e(title)}</h3><span class="teaching-english" lang="en">${e(english)}</span><p class="teaching-summary">${e(summary)}</p><p class="teaching-example">${e(example)}</p><span class="teaching-highlight" ${index===selected?'':'hidden'}>Şimdi bu noktadayız</span>${trainer?'</button>':'</div>'}</li>`).join('')}</ol>
  ${isPrinciples?'':'<p class="teaching-loop"><span aria-hidden="true">↺</span> 7 → 1 · Öğrendiklerinizle vizyonu ve sıradaki iyileştirme ihtiyacını yeniden değerlendirin.</p>'}
  <p class="teaching-footnote">Türkçe ifadeler ve park örnekleri bu atölyenin özgün açıklamalarıdır. ITIL® PeopleCert’in tescilli markasıdır. <a href="https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1/itil-4-practitioner-continual-improvement-3871" target="_blank" rel="noopener noreferrer">PeopleCert · ITIL 4</a></p><p class="teaching-announcement" role="status" aria-live="polite"></p></div>`;
}

// A separate native dialog leaves the playing DOM, route, drafts and scroll intact.
export function installTeachingPanels(getState, root=document) {
  const panel=root.createElement('dialog');
  panel.id='teaching-dialog'; panel.className='teaching-dialog';
  panel.setAttribute('aria-labelledby','teaching-title'); panel.setAttribute('aria-describedby','teaching-description');
  root.body.append(panel);
  let kind='principles', trigger, scope='', highlights={principles:-1,improvement:-1};
  function syncScope() {
    const s=getState(), next=JSON.stringify([s?.user?.id,s?.workshop?.id,!!s?.user?.trainer]);
    if(next!==scope){scope=next;highlights={principles:-1,improvement:-1};if(panel.open)panel.close();}
    return s;
  }
  function highlight(index) {
    if(!Number.isInteger(index)||index < -1||index > 6)return;
    if(!syncScope()?.user?.trainer)return;
    highlights[kind]=index;
    panel.querySelectorAll('[data-teaching-select]').forEach(button=>{
      const active=Number(button.dataset.teachingSelect)===index;
      button.setAttribute('aria-pressed',String(active));
      button.closest('li').classList.toggle('is-highlighted',active);
      button.querySelector('.teaching-highlight').hidden=!active;
    });
    panel.querySelector('[role=status]').textContent=index<0?'Vurgu temizlendi.':`${index+1}. ${ (kind==='principles'?principles:improvementSteps)[index][0]} vurgulandı.`;
  }
  root.addEventListener('click',event=>{
    const opener=event.target.closest('[data-teaching-open]');
    if(opener){const s=syncScope();if(!s)return;trigger=opener;kind=opener.dataset.teachingOpen==='improvement'?'improvement':'principles';panel.innerHTML=teachingMarkup(kind,!!s.user?.trainer,highlights[kind]);panel.showModal();return;}
    if(!panel.contains(event.target))return;
    if(event.target.closest('[data-teaching-close]'))panel.close();
    const selected=event.target.closest('[data-teaching-select]');
    if(selected)highlight(Number(selected.dataset.teachingSelect));
    if(event.target.closest('[data-teaching-clear]'))highlight(-1);
  });
  panel.addEventListener('close',()=>{
    const fallback=root.querySelector(`[data-teaching-open="${kind}"]`);
    (trigger?.isConnected?trigger:fallback)?.focus({preventScroll:true});
  });
  return {syncScope,close:()=>panel.close()};
}

export function serviceOrientation(state, compact=false) {
  const services=state?.itsm?.services||[], cis=state?.itsm?.cis||[], roles=state?.scenario?.roles||[];
  if(!services.length)return '';
  const owner=id=>id?`${id} · ${roles.find(r=>r.id===id)?.shortName||roles.find(r=>r.id===id)?.name||'Kayıtlı rol'}`:'Sahip tanımlanmamış';
  // Traverse only declared CI edges; no inferred ownership or service membership.
  const dependencies=ids=>{const found=new Map();const visit=id=>{if(found.has(id))return;const ci=cis.find(c=>c.id===id);found.set(id,ci||{id,name:id});if(ci?.dependsOn)visit(ci.dependsOn);};ids.forEach(visit);return [...found.values()];};
  return `<section class="service-orientation panel" aria-labelledby="service-orientation-title"><span class="eyebrow">ÖNCE ZİYARETÇİNİN DENEYİMİ</span><h2 id="service-orientation-title">Hizmet → hayvan ve sorumlusu → destek sistemi</h2><p>Hayvanlar bireysel canlı CI’lardır. Hizmet sahibi, CI sahibi ve bakıcı aynı kavram değildir. Yalnız senaryoda kayıtlı ilişkiler gösterilir.</p><div class="orientation-services">${services.map(service=>{
    const linked=dependencies(service.cis||[]), animals=linked.filter(c=>c.kind==='animal'), support=linked.filter(c=>c.kind!=='animal');
    return `<details class="orientation-service" ${!compact&&service.id==='SVC-OBS'?'open':''}><summary>${e(service.name)}<span>${e(service.id)} · Hizmet sahibi: ${e(owner(service.owner))}</span></summary><p class="orientation-promise">${e(service.promise)}</p><div class="orientation-chain"><section><h3>01 · Hayvanlar ve sahiplik</h3>${animals.length?animals.map(c=>`<article class="orientation-animal"><b>${e(c.name)}</b><span>${e(c.identity||c.id)}</span><p>CI sahibi: ${e(owner(c.owner))}</p><p>${e(c.needs||'')}</p></article>`).join(''):'<p>Bu hizmetin kayıtlı CI zincirinde hayvan bulunmuyor.</p>'}</section><section><h3>02 · Destekleyen insan ve altyapı</h3><ul>${support.map(c=>`<li><b>${e(c.name)}</b>${c.owner?`<span>CI sahibi: ${e(owner(c.owner))}</span>`:''}${c.dependsOn?`<span>Bağımlı olduğu: ${e(cis.find(x=>x.id===c.dependsOn)?.name||c.dependsOn)}</span>`:''}</li>`).join('')||'<li>Destek CI tanımlanmamış.</li>'}</ul></section></div>${service.requiresServices?.length?`<p class="orientation-prerequisite"><b>Ek hizmet ön koşulu:</b> ${service.requiresServices.map(id=>e(services.find(s=>s.id===id)?.name||id)).join(' · ')}. Bu hizmetin kendi zincirini de inceleyin.</p>`:''}</details>`;
  }).join('')}</div></section>`;
}
