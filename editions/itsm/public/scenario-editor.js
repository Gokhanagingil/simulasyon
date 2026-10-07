const effects = {none:'Yok',queue:'Ziyaretçi kuyruğu',fence:'Aslan çiti / kırmızı ikaz',water:'Su / pompa',power:'Elektrik bağımlılığı',change:'Değişiklik',alerts:'Alarm',request:'Talep',supplier:'Tedarikçi',knowledge:'Bilgi',finale:'Final'};
const types = {incident:'Olay',request:'Talep',problem:'Problem',change:'Değişiklik',knowledge:'Bilgi',task:'Görev'};
export function createScenarioEditor({api,escape:e,onSaved,toast}) {
  let config=null, wid=null, selected=null, dirty=false, released=[], loading=null;
  const cacheKey=()=>`mavi-vadi-scenario-draft-${wid}`;
  function stash(){dirty=true;sessionStorage.setItem(cacheKey(),JSON.stringify(config));const badge=document.querySelector('#studio-dirty');if(badge)badge.textContent='Kaydedilmemiş değişiklikler';}
  async function load(id,runs){
    released=runs.filter(r=>r.run).map(r=>r.id);
    if(wid===id&&config)return;
    if(loading)return loading;
    wid=id;config=null;dirty=false;
    loading=(async()=>{const remote=await api(`/api/workshops/${id}/scenario`);let draft;try{draft=JSON.parse(sessionStorage.getItem(cacheKey())||'null');}catch{}
      config=draft?.revision===remote.revision?draft:remote;dirty=config===draft;selected=config.pack.events[0].id;
      if(draft&&config!==draft)toast('Sunucuda daha yeni senaryo var. Önceki taslak bu sekmede korundu; taslağı indirerek karşılaştırabilirsiniz.');
    })().finally(()=>loading=null);
    return loading;
  }
  const field=(key,label,value,kind='text',extra='')=>`<label>${label}${kind==='textarea'?`<textarea data-field="${key}" rows="3" ${extra}>${e(value??'')}</textarea>`:`<input data-field="${key}" type="${kind}" value="${e(value??'')}" ${extra}/>`}</label>`;
  const select=(key,label,value,items)=>`<label>${label}<select data-field="${key}">${items.map(([id,name])=>`<option value="${e(id)}" ${id===value?'selected':''}>${e(name)}</option>`).join('')}</select></label>`;
  const check=(key,label,value)=>`<label class="check-label"><input data-field="${key}" type="checkbox" ${value?'checked':''}/> ${label}</label>`;
  const packField=(key,label,value,kind='text',extra='')=>field(key,label,value,kind,extra).replace('data-field=','data-pack=');
  function render(){
    if(!config)return '<section class="panel table-panel">Senaryo yükleniyor…</section>';
    const p=config.pack,ev=p.events.find(x=>x.id===selected)||p.events[0];selected=ev.id;
    const locked=released.includes(ev.id);
    return `<div class="heading"><div class="eyebrow">KODSUZ SENARYO STÜDYOSU</div><div class="heading-row"><h1>Hikâyeyi sen kur.</h1><button class="btn primary" data-studio="save">Değişiklikleri kaydet</button></div><p>Bu atölyeye özel paket · Sürüm ${config.revision} · <span id="studio-dirty">${dirty?'Kaydedilmemiş değişiklikler':'Tüm değişiklikler kayıtlı'}</span></p></div>
      <div class="studio-tools"><button class="btn secondary" data-studio="add">+ Olay ekle</button><button class="btn secondary" data-studio="export">Paketi indir</button><label class="btn secondary import-label">Paket yükle<input type="file" accept="application/json,.json" id="scenario-import"/></label><button class="btn quiet" data-studio="export-draft">Sekmedeki taslağı indir</button><button class="btn quiet" data-studio="reload">Sunucudan yeniden yükle</button></div>
      <div class="notice"><b>Canlı geçmiş korunur</b><span>Ekibe gönderilmiş olaylar kilitlenir. SLA değişiklikleri yalnız daha sonra gönderilen olaylara uygulanır. Taslak aynı sekmede korunur; ekip yalnız kaydedilen sürümü görür.</span></div>
      <div class="studio-layout"><aside class="panel studio-list">${p.events.map(x=>`<button data-studio="select" data-event="${e(x.id)}" class="${x.id===ev.id?'active':''}"><small>${e(x.id)} · T+${x.minute}${released.includes(x.id)?' · Kilitli':''}</small><b>${e(x.title)}</b></button>`).join('')}</aside><section class="panel table-panel studio-form"><div class="panel-head"><h2>${e(ev.id)} · Olay kartı</h2><div class="actions"><button class="btn quiet" data-studio="duplicate">Kopyala</button>${!locked?'<button class="btn quiet danger" data-studio="remove">Olayı çıkar</button>':'<span class="tag amber">Ekibe gönderildi</span>'}</div></div>
      <fieldset ${locked?'disabled':''}><div class="form-grid">${field('title','Olay başlığı',ev.title,'text','maxlength="180"')}${field('minute','Önerilen dakika',ev.minute,'number','min="0"')}${field('process','Süreç / öğrenme alanı',ev.process)}${select('recordType','Kayıt türü',ev.recordType,Object.entries(types))}${select('priority','Öncelik',ev.priority,p.slaPolicies.map(x=>[x.priority,x.priority]))}${select('effect','Harita animasyonu',ev.effect,Object.entries(effects))}${select('zone','Bölge',ev.zone,p.zones.map(x=>[x.id,x.name]))}${select('serviceId','Hizmet',ev.serviceId,p.services.map(x=>[x.id,x.name]))}${select('ciId','Varlık / CI',ev.ciId,p.cis.map(x=>[x.id,x.name]))}${field('prerequisites','Ön koşul olayları (virgülle ayır)',ev.prerequisites.join(', '))}</div>
      ${field('message','Katılımcıya gelen mesaj',ev.message,'textarea')}${field('information','Bilgi zarfı',ev.information,'textarea')}${field('expected','Eğitmenin beklediği çıktı',ev.expected,'textarea')}${field('debrief','İşe aktarım sorusu',ev.debrief,'textarea')}${check('requireBreach','Çözümden önce gerçek SLA aşımı gözlensin',ev.requireBreach)}${check('finale','Bu olay tamamlandığında final kutlaması gösterilsin',ev.finale)}
      <h3>Kararların sonuçları</h3><p>Eğitmen, ekibin gösterdiği kanıta uygun sonucu seçer.</p>${ev.choices.map((c,i)=>`<div class="studio-choice" data-choice="${i}"><div class="form-grid">${field('label','Sonuç adı',c.label)}${field('score','Puan (0–5)',c.score,'number','min="0" max="5"')}</div>${field('result','Sonuç ve geri bildirim',c.result,'textarea')}${check('resolve','Bu sonuç kaydı tamamlar',c.resolve)}${field('requiresResolved','Önce tamamlanması gereken olaylar (virgülle ayır)',(c.requiresResolved||[]).join(', '))}<button type="button" class="btn quiet" data-studio="remove-choice" data-choice-index="${i}">Sonucu çıkar</button></div>`).join('')}<button type="button" class="btn secondary" data-studio="add-choice">+ Sonuç ekle</button></fieldset></section></div>
      <section class="panel table-panel"><h2>Paket ve zamanlama</h2><div class="form-grid">${packField('name','Paket adı',p.name)}${packField('version','İçerik sürümü',p.version)}</div>${packField('description','Paket açıklaması',p.description,'textarea')}<h3>SLA hedefleri · Gerçek dakika</h3><p>24×7; eğitim saati duraklatılsa da SLA işlemeye devam eder.</p><div class="form-grid">${p.slaPolicies.map((policy,i)=>`<div class="studio-choice" data-policy="${i}"><b>${e(policy.priority)}</b>${field('responseMinutes','İlk müdahale (dk)',policy.responseMinutes,'number','min="1" max="1440"')}${field('resolutionMinutes','Çözüm (dk)',policy.resolutionMinutes,'number','min="1" max="1440"')}</div>`).join('')}</div><details><summary>Bölüm süreleri ve gelişmiş paket alanları</summary><p>Bölüm süreleri yalnız başlamamış atölyelerde değişir. Roller, rehber, hizmetler ve CI ilişkileri paket dosyası üzerinden düzenlenip tekrar yüklenebilir.</p><div class="form-grid">${p.phases.map((phase,i)=>`<div data-phase="${i}">${field('name','Bölüm adı',phase.name)}${field('minutes','Süre (dk)',phase.minutes,'number','min="1" max="480"')}</div>`).join('')}</div></details></section><div class="studio-save"><span id="studio-error" role="alert"></span><button class="btn primary" data-studio="save">Değişiklikleri kaydet</button></div>`;
  }
  function update(target){
    if(!config)return;
    const key=target.dataset.field||target.dataset.pack;if(!key)return;
    let value=target.type==='checkbox'?target.checked:target.type==='number'?Number(target.value):target.value;
    if(['prerequisites','requiresResolved'].includes(key))value=value.split(',').map(x=>x.trim()).filter(Boolean);
    const ev=config.pack.events.find(x=>x.id===selected);
    const choice=target.closest('[data-choice]'),policy=target.closest('[data-policy]'),phase=target.closest('[data-phase]');
    const owner=target.dataset.pack?config.pack:choice?ev.choices[Number(choice.dataset.choice)]:policy?config.pack.slaPolicies[Number(policy.dataset.policy)]:phase?config.pack.phases[Number(phase.dataset.phase)]:ev;
    owner[key]=value;stash();
  }
  function download(value,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  const newId=()=>{let n=config.pack.events.length+1;while(config.pack.events.some(x=>x.id===`E${String(n).padStart(2,'0')}`))n++;return `E${String(n).padStart(2,'0')}`;};
  async function action(button){
    if(!config)return;
    const a=button.dataset.studio,p=config.pack,ev=p.events.find(x=>x.id===selected);
    if(a==='select'){selected=button.dataset.event;return true;}
    if(a==='export'||a==='export-draft'){const stored=sessionStorage.getItem(cacheKey());download(a==='export-draft'&&stored?JSON.parse(stored).pack:p,`Mavi-Vadi-ITSM-${a==='export-draft'?'taslak':'senaryo'}.json`);return false;}
    if(a==='save'){button.disabled=true;try{config=await api(`/api/workshops/${wid}/scenario`,'PUT',config);dirty=false;sessionStorage.removeItem(cacheKey());await onSaved();toast('Senaryo kaydedildi. Olay akışı güncellendi.');}finally{button.disabled=false;}return true;}
    if(a==='reload'){if(dirty&&!confirm('Kaydedilmemiş taslağı bırakıp sunucudaki sürümü yüklemek istiyor musunuz?'))return false;config=await api(`/api/workshops/${wid}/scenario`);sessionStorage.removeItem(cacheKey());dirty=false;selected=config.pack.events[0].id;return true;}
    if(a==='add'||a==='duplicate'){const id=newId(),copy=structuredClone(ev);copy.id=id;copy.title=a==='add'?'Yeni olay':`${ev.title} — kopya`;copy.prerequisites=[];copy.requireBreach=false;copy.finale=false;copy.choices.forEach((c,i)=>c.id=`${id}-${i+1}`);p.events.push(copy);selected=id;stash();return true;}
    if(released.includes(ev.id))throw Error('Ekibe gönderilen olay değiştirilemez.');
    if(a==='remove'){if(p.events.length===1)throw Error('Paket en az bir olay içermeli.');const refs=p.events.filter(x=>x.prerequisites.includes(ev.id)||x.choices.some(c=>(c.requiresResolved||[]).includes(ev.id)));if(refs.length)throw Error(`Önce ${refs.map(x=>x.id).join(', ')} olaylarının ön koşul ilişkisini kaldırın.`);if(!confirm(`${ev.title} olayı bu taslaktan çıkarılsın mı?`))return false;p.events=p.events.filter(x=>x.id!==ev.id);selected=p.events[0].id;}
    if(a==='add-choice'){let n=ev.choices.length+1;while(ev.choices.some(c=>c.id===`${ev.id}-${n}`))n++;ev.choices.push({id:`${ev.id}-${n}`,label:'Yeni sonuç',result:'Gözlenen sonucu açıklayın.',score:0,resolve:false,requiresResolved:[]});}
    if(a==='remove-choice'){if(ev.choices.length===1)throw Error('En az bir sonuç olmalı.');ev.choices.splice(Number(button.dataset.choiceIndex),1);}
    stash();return true;
  }
  async function importFile(file){if(!file)return;if(file.size>500000)throw Error('Paket en fazla 500 KB olabilir.');const p=JSON.parse(await file.text());if(!Array.isArray(p.events)||!p.events.length||!Array.isArray(p.slaPolicies))throw Error('Geçerli bir ITSM paket dosyası seçin.');const validated=await api(`/api/workshops/${wid}/scenario`,'POST',{pack:p});if(!confirm('Yüklenen paket kaydedilene kadar taslak olarak kullanılacak. Devam edilsin mi?'))return;config.pack=validated.pack;selected=config.pack.events[0].id;stash();}
  return {load,render,update,action,importFile,hasDraft:()=>dirty};
}
