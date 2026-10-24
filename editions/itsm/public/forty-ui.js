import { ROLES, ACTIONS, createEpisode, dispatch, advance, getOutcome, getAvailableActions } from './forty-engine.js';
import { principles, improvementSteps } from './teaching-panels.js';

const $ = selector => document.querySelector(selector);
const e = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const mm = value => `${String(Math.floor(Math.max(0, Number(value)||0)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0, Number(value)||0)%60)).padStart(2,'0')}`;
const percent = t => Math.max(0,Math.min(100,(t||0)/720*100));
const roleName = id => ROLES.find(r=>r.id===id)?.name || (id==='system'?'Bölüm saati':id||'Ekip');
const statusText = status => ({idle:'Henüz başlanmadı',queued:'Sırada',running:'Sürüyor',completed:'Tamamlandı',observed:'Gözlem bitti',checking:'Teyit sürüyor',unchecked:'Teyit bekliyor',invalidated:'Teyit yenilenmeli',cancelled:'İptal edildi',interrupted:'Kesildi',ready:'Hazır',accepted:'Kabul edildi',pending:'Bekliyor',failed:'Koşullar sağlanmadı'})[status] || status || 'Bekliyor';
let state = createEpisode();
let activeRole = 'R1';
let envelopeOpen = false;
let notice = {text:'Bilgi rol zarflarında. Önce rolünü seç, sonra saati başlat. Ekipçe aynı ekranı paylaşabilir veya rolleri tek başına deneyebilirsin.',kind:''};
let speed = 1;
let lastTick = performance.now();
let renderedPhase = state.phase;
let activeDescriptor = null;
let tickCarry = 0;
let resumeAfterDialog = false;
let modalPhase = null;

const envelopes = {
 R1:{name:'Hizmet sahibi',points:['Toplam 20 kredi var. Bir işi yetkilendirmek harcama değildir; iş gerçekten başladığında bedeli düşer. Başlamış iş iptal edilirse bedeli geri gelmez.','İlk 40 ziyaretçinin mevcut sözü korunmalı. Sonraki 80 kişi için ek atölye 10 kredidir. Henüz o ek hizmete söz verilmedi.','Bütçe ve kapsamı sen yönetirsin. Teknik tamamlanma, öğretmenin ve ziyaretçinin kabulü yerine geçmez.'],question:'Hangi değeri koruyorsun, hangi isteğe henüz söz vermedin?'},
 R2:{name:'Hizmet masası ve müşteri',points:['Öğretmenin ilk 40 kişi için sözü: T10–T12 arasında iki dakikalık Mümtaz gözlemi. Öğrenme amacı Mümtaz’ın doğal davranışını gözlemek.','Zamanı veya içeriği değiştiriyorsanız öğretmenin açık kabulünü al. Korsan canlı gözlemdir ama Mümtaz içeriğine eşdeğer değildir; farklı içerik olarak ikame ya da yalnız ek etkinlik olabilir.','Sponsor T7’de ayrılır; fotoğraf ve T8’de duyuru ister. İstek kabul edilene kadar söz değildir. Sınıf fotoğrafı için ayrıca izin gerekir. Sessiz gözlemle çakışacak bir duyurunun saatini de açıkça müzakere et.'],question:'Bir tarafın isteği, diğerine verdiğimiz sözü değiştirmiş sayılır mı?'},
 R3:{name:'Yetkin saha ekibi',points:['Mümtaz’ın koşulları: tanıdığı yetkin bakım, uygun habitat ve sessizlik. Bunların hepsi birlikte sağlanmalı; kredi harcamak güvenliğin yerine geçmez.','Hazırlık bittikten sonra 30 saniyelik saha teyidi gerekir. Teknik iş bitti diye alanı açma. Koşullar değişirse eski teyit güncel sayılmaz.','Korsan için de uygun alan ve ayrı saha teyidi gerekir. Hayvanı hareket etmeye zorlamak, gürültüyle çağırmak veya fiziksel müdahale bir seçenek değildir.'],question:'Tamamlandığını bildiğimiz iş ile hazır olduğunu gördüğümüz hizmet aynı mı?'},
 R4:{name:'Teknik bakım',points:['Sessiz PA düzenlemesi 3 dakika, 10 kredi ve 1 teknisyen ister. Bölümde tek teknisyen var; aynı anda başka teknik iş yapamaz.','R6 değişikliği sahiplenir, bağımsız eğitmen onaylar. Bütçe yetkisi de R1’dedir. Hazırlık, onay ve saha kabulü farklı adımlardır.','Rutin sessizlik T9:30’da oluşur. Erken hazırlık isteğe bağlıdır; gereksiz iş açmak sonuca katkı sağlamayabilir.'],question:'Bu teknik işi daha erken bitirmek, kimin hangi ihtiyacını gerçekten karşılıyor?'},
 R5:{name:'Eğitim ve alternatif içerik',points:['Korsan canlı gözlemi için koordinasyon 2 dakika, 5 kredi ve aynı tek teknisyeni kullanır. Bu da gerçek bir hizmettir, boş bir bekleme rotası değildir.','İçeriği Mümtaz’dan farklıdır. R2 öğretmenle bunun ikame mi, ek gözlem mi olduğunu açıkça kararlaştırır. Mümtaz sözü kendiliğinden silinmez.','Sonraki 80 kişi için isteğe bağlı ek atölye 10 kredi. Kapsam ve müşteri kabulü olmadan buna söz vermeyin.'],question:'Alternatif sunarken neyi değiştirdiğini açıkça söyleyebiliyor musun?'},
 R6:{name:'PA değişiklik sahibi',points:['Sessiz PA değişikliğinin etki ve uygulama gerekçesini sen sahiplenirsin. Kendi değişikliğine bağımsız onay veremezsin.','Onayı eğitmen ayrı bir görevle verir; uygulamayı R4, saha teyidini R3 yürütür. Korsan’ın “Onaylandı!” demesi onay değildir.','Sponsorun duyuru isteğini ve gözlem sessizliğini birlikte düşün. Yeni bir söz vermek yalnız teknik karar değildir.'],question:'Değişikliğin sahibiyken bağımsız incelemenin değerini nasıl korursun?'},
 R7:{name:'Bakım ve süreklilik',points:['Tanıdığı yetkin bakıcıyla rutin devir T9:30’da hazır olur. Güvenli erken devir 2 dakika sürer ve 5 kredi ister; teknisyen kullanmaz.','Erken devir aceleye getirilmiş bakım değildir. Yetkin bakım ve refah şartları bozulursa gözlem durur, para harcanmış olması bunu değiştirmez.','Eğitmenle birlikte refah durdurması koyabilirsin. Güvenli koşullar geri gelince tekrar saha teyidi gerekir.'],question:'Süreyi kısaltmakla güvenlik koşulunu atlamak arasındaki sınır nerede?'},
 R8:{name:'Ziyaretçi ve hizmet kabulü',points:['Her gözlem en fazla 40 kişi ve kesintisiz 2 dakika sürer. İlk 40 kişi için gerçek deneyimi doğrula; sırf hazırlık tamamlandı diye kabul verme.','Gözlemi başlatmak, tamamlanmasını beklemek ve ziyaretçi kabulünü kaydetmek ayrı adımlardır. Sonra öğretmen kendi kabulünü verir.','Sponsor fotoğrafı en fazla 30 saniye sürer, T7’den önce bitmeli; güncel saha koşulları ve uygun fotoğraf izni gerekir. Hayvanın poz vermesi beklenmez.'],question:'Bir kutuyu işaretlemek yerine, kimin neyi gerçekten deneyimlediğini gösterebilir misin?'},
 trainer:{name:'Kolaylaştırıcı ve bağımsız onaycı',points:['Kolaylaştırıcı kontrolleri saati başlatır, durdurur, ileri alır ve bölümü bitirir. Bunlar seçili katılımcı rolünün yetkilerini genişletmez.','PA değişikliğini R6 sahiplenir. Sen bağımsız inceleme yaparsın; diğer rollerin kararlarını onların yerine otomatik tamamlama.','Hayvan refahı veya güvenlik senaryosu için durdurma verebilirsin. Bölüm sonunda sonuçları karar günlüğünden inceleyin; sistem insanlara öğrenme veya başarı puanı vermez.'],question:'Ekibin kararını kolaylaştırıyor musun, yoksa onun yerine çözümü mü seçiyorsun?'}
};

function setNotice(text,kind=''){notice={text,kind};$('#announcement').textContent=text;$('#announcement').className=`notice ${kind}`;}
function send(command){
 try{state=dispatch(state,command);setNotice(state.log?.at(-1)?.text||'Karar kaydedildi.','success');render();return true;}
 catch(error){setNotice(error.message,'error');return false;}
}
function visit(target){return state.visits?.[target]||{};}
function field(target){return state.field?.[target]||{};}
function accepted(target){const v=visit(target);return !!(v.customerAccepted||v.outcomeAccepted||v.teacherAccepted||v.acceptedByTeacher||state.teacher?.accepted?.[target]);}
function completed(target){const v=visit(target);return ['observed','completed','accepted'].includes(v.status)||!!v.completedAt;}
function safe(target){const f=field(target);return ['ready','completed','passed'].includes(f.status)||f.valid===true||f.ready===true;}
function job(id){return state.jobs?.[id]||{};}
function progress(item){return item.duration?Math.max(0,Math.min(100,(state.clock-(item.startedAt??state.clock))/item.duration*100)):0;}
function drawMetrics(){
 const running=Object.values(state.jobs||{}).filter(j=>j.status==='running');
 const technician=running.find(j=>j.resource==='technician'||j.id==='pa'||j.id==='alternative');
 const firstComplete=completed('mumtaz')||completed('korsan');
 const observedCount=Math.max(...['mumtaz','korsan'].map(t=>completed(t)?visit(t).count||0:0));
 const cards=[
  ['KULLANILABİLİR BÜTÇE',state.budget.remaining,'kredi',`${state.budget.spent} harcandı · başlangıç 20`,state.budget.remaining<5],
  ['ORTAK TEKNİSYEN',technician?'0':'1','/ 1',technician?`${technician.label||technician.id} sürüyor`:'Yeni iş için uygun',false],
  ['İLK GRUP',firstComplete?'40':'40','kişi',firstComplete?`${observedCount} kişi gözlem yaptı · kabulleri kontrol et`:'Söz verilen grup · en fazla 40',false],
  ['SONRAKİ GRUP','80','kişi',job('workshop').status==='completed'?'Ek atölyeye kaynak ayrıldı; henüz uygulanmadı':state.scope?.addonAccepted?'Ek atölye planı kabul edildi':'Mevcut program sürüyor · ek atölye isteğe bağlı',false]
 ];
 $('#metrics').innerHTML=cards.map(([label,value,unit,note,warn])=>`<div class="metric ${warn?'warning':''}"><span class="metric-label">${e(label)}</span><div class="metric-value"><strong>${e(value)}</strong><small>${e(unit)}</small></div><span class="metric-note">${e(note)}</span></div>`).join('');
}
function drawPark(){
 const hold=state.welfare?.hold||state.welfare?.active||state.welfare?.held;
 const mumReady=safe('mumtaz'),korsanReady=safe('korsan');
 const mumActive=visit('mumtaz').status==='running',korActive=visit('korsan').status==='running';
 const badge=hold?'Refah durdurması · gözlem alanı kapalı':mumActive?'Mümtaz gözlemi sürüyor · sessizlik korunuyor':korActive?'Korsan gözlemi sürüyor · farklı eğitim içeriği':mumReady?'Mümtaz alanı saha teyidi aldı':korsanReady?'Korsan alanı saha teyidi aldı':'Alan hazırlığı ve saha teyidi bekleniyor';
 const people=Array.from({length:10},(_,i)=>`<g transform="translate(${80+(i%5)*13} ${174+Math.floor(i/5)*17})"><circle r="3" cy="-6" fill="${i%2?'#687d65':'#526e71'}"/><path d="M-3-1h6v8h-6z" fill="${i%2?'#a6b393':'#95afb0'}"/></g>`).join('');
 $('#park-scene').innerHTML=`<div class="park-wrap"><svg viewBox="0 0 650 295" role="img" aria-label="Mavi Vadi planı: girişte ilk 40 kişi, Mümtaz’ın sakin su alanı, Korsan’ın gözlem alanı ve ortak teknik ekip."><defs><pattern id="meadow" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".8" fill="#c6d3b2"/></pattern></defs><rect width="650" height="295" fill="#e5ecd9"/><rect width="650" height="295" fill="url(#meadow)"/><path d="M-20 242C73 211 157 260 205 202S243 96 357 123 450 238 671 200" fill="none" stroke="#d2d6bc" stroke-width="31"/><path d="M-20 242C73 211 157 260 205 202S243 96 357 123 450 238 671 200" fill="none" stroke="#f6f0d9" stroke-width="25"/><path d="M217 171Q158 83 115 85M433 159Q480 81 562 77" fill="none" stroke="#f6f0d9" stroke-width="17"/>
 <g fill="#bfd0a6"><circle cx="30" cy="28" r="31"/><circle cx="62" cy="14" r="34"/><circle cx="183" cy="34" r="25"/><circle cx="602" cy="30" r="47"/><circle cx="634" cy="89" r="29"/><circle cx="270" cy="259" r="39"/><circle cx="310" cy="289" r="30"/></g><g fill="#94b184"><circle cx="24" cy="26" r="15"/><circle cx="55" cy="12" r="17"/><circle cx="178" cy="29" r="13"/><circle cx="601" cy="20" r="25"/><circle cx="632" cy="84" r="15"/><circle cx="267" cy="261" r="23"/></g>
 <path d="M261 36Q322 10 384 37T459 92Q474 126 440 148T336 148Q258 140 249 94T261 36" fill="#c6d9c1" stroke="#a8c09f" stroke-width="2"/><path d="M280 54Q322 35 374 53T434 92Q446 118 415 128T334 132Q272 125 271 94T280 54" fill="#a9cdd0"/><path d="M285 101q39 12 66 0m28 14q19 6 37-3" fill="none" stroke="#cee4dc" stroke-width="2"/>
 <g transform="translate(349 86)"><ellipse rx="34" ry="18" fill="#879d99"/><ellipse cx="25" cy="3" rx="20" ry="13" fill="#94a8a1"/><circle cx="18" cy="-9" r="5" fill="#879d99"/><circle cx="33" cy="-7" r="4" fill="#879d99"/><path d="M29-1h3" stroke="#3f5c51" stroke-linecap="round"/><ellipse cx="40" cy="5" rx="3" ry="2" fill="#6a857a"/></g><text x="346" y="171" text-anchor="middle" class="park-label">MÜMTAZ · SESSİZ HABİTAT</text><text x="346" y="185" text-anchor="middle" class="park-small">${e(mumActive?'Gözlem sürüyor':mumReady?'Saha teyidi var':'Saha teyidi bekliyor')}</text>
 <g transform="translate(520 74)"><ellipse cy="15" rx="43" ry="25" fill="#cad8ad"/><path d="M-16 16h40M0 16V-19m0 10 21-8" fill="none" stroke="#8a9b70" stroke-width="4" stroke-linecap="round"/><ellipse cx="17" cy="-22" rx="9" ry="13" fill="#5c9869" transform="rotate(-15 17 -22)"/><circle cx="18" cy="-32" r="7" fill="#79a75c"/><path d="m23-33 8 4-7 3" fill="#c5a45c"/><circle cx="20" cy="-34" r="1.3" fill="#1d4935"/><path d="m15-11-6 15 11-12" fill="#467f71"/></g><text x="522" y="122" text-anchor="middle" class="park-label">KORSAN</text><text x="522" y="136" text-anchor="middle" class="park-small">${e(korActive?'Canlı gözlem sürüyor':korsanReady?'Saha teyidi var':'Farklı içerik')}</text>
 <g transform="translate(90 69)"><rect x="-38" y="-22" width="77" height="39" rx="5" fill="#a9ba9d"/><path d="m-45-20 45-21 45 21" fill="#688c73"/><rect x="-5" y="-8" width="20" height="25" fill="#e0e8cf"/><rect x="-27" y="-11" width="14" height="11" fill="#d2e1c1"/><text y="41" text-anchor="middle" class="park-label">ORTAK TEKNİK EKİP</text><text y="54" text-anchor="middle" class="park-small">1 teknisyen</text></g>
 <g transform="translate(84 140)"><path d="M-19 23V0h73v23" fill="none" stroke="#8ca080" stroke-width="5"/><rect x="-27" y="-12" width="89" height="17" rx="3" fill="#f5f4df"/><text x="17" y="0" text-anchor="middle" class="park-small">İLK 40 ZİYARETÇİ</text></g>${people}
 <g transform="translate(550 223)"><rect x="-31" y="-14" width="62" height="31" rx="7" fill="#e5c894"/><path d="m-16-14 8-13h19l12 13" fill="#d8b982"/><path d="M-4-22h14l7 8H-9z" fill="#c4d6c9"/><circle cx="-19" cy="17" r="6" fill="#708471"/><circle cx="20" cy="17" r="6" fill="#708471"/><text y="42" text-anchor="middle" class="park-small">${state.clock>=420?'Sponsor ayrıldı':'Sponsor T7’de ayrılır'}</text></g>
 </svg><div class="park-badge">${e(badge)}</div></div>`;
 const keeper=job('keeper');
 const careReady=!state.welfare.held&&state.dependencies.care&&(state.clock>=570||keeper.status==='completed');
 const pa=job('pa');
 const announcementActive=state.sponsor.announcementStatus==='running';
 const paReady=!state.welfare.held&&state.dependencies.pa&&!announcementActive&&(state.clock>=570||pa.status==='completed');
 $('#situation').innerHTML=`<div class="situation ${careReady?'':'wait'}"><b>Yetkin bakım</b>${careReady?'Devir hazır · güncel saha koşulları ayrıca gerekir':state.welfare.held?'Refah durdurması etkin':!state.dependencies.care?'Yetkin bakım koşulu hazır değil':keeper.status==='running'?`Erken devir sürüyor · ${mm(Math.max(0,keeper.duration-(state.clock-keeper.startedAt)))} kaldı`:'Rutin devir T9:30 · erken devir henüz yok'}</div><div class="situation ${paReady?'':'wait'}"><b>Sessiz alan</b>${paReady?'PA hazırlığı hazır · duyuru etkisini kontrol et':state.welfare.held?'Refah durdurması etkin':!state.dependencies.pa?'PA / sessizlik koşulu hazır değil':announcementActive?'Anons sürüyor · sessiz saha kapalı':pa.status==='running'?`PA hazırlığı sürüyor · ${mm(Math.max(0,pa.duration-(state.clock-pa.startedAt)))} kaldı`:'Rutin sessizlik T9:30 · erken hazırlık henüz yok'}</div>`;
}
function drawTimeline(){
 const bars=(items)=>items.map(b=>`<span class="time-bar ${b.class||''}" style="left:${percent(b.start)}%;width:${Math.max(.5,percent(b.end)-percent(b.start))}%" title="${e(b.title)}">${e(b.short||'')}</span>`).join('')+`<i class="time-now" style="left:${Math.min(99.6,percent(state.clock))}%" aria-hidden="true"></i>`;
 const lanes=[{label:'Öğretmenin sözü',items:[{start:600,end:720,class:'promise',title:'İlk söz: Mümtaz gözlemi T10–T12',short:'T10–12'}]},{label:'Sponsor isteği',items:[{start:390,end:420,class:'request',title:'Sponsorun ayrılışı T7',short:''},{start:state.sponsor?.announcementAt??480,end:(state.sponsor?.announcementAt??480)+30,class:'request',title:'Duyuru: kabul edilmemişse yalnız istek',short:''}]}];
 for(const j of Object.values(state.jobs||{})){
  if(j.status==='idle')continue;
  const start=j.startedAt??j.queuedAt??state.clock;
  const end=j.completedAt??(j.startedAt!=null?j.startedAt+j.duration:start+j.duration);
  lanes.push({label:j.label||j.id,items:[{start,end,class:j.status==='queued'?'pending':j.status==='cancelled'?'cancelled':'job',title:`${j.label||j.id}: ${statusText(j.status)} · ${mm(start)}–${mm(end)}${j.status==='queued'?' (yalnız plan; başlangıç garantisi değil)':''}`,short:j.status==='queued'?'Sırada':statusText(j.status)}]});
 }
 for(const target of ['mumtaz','korsan']){
  const v=visit(target);if(v.startedAt==null)continue;
  lanes.push({label:target==='mumtaz'?'Mümtaz gözlemi':'Korsan gözlemi',items:[{start:v.startedAt,end:v.completedAt??v.startedAt+120,class:v.status==='interrupted'?'cancelled':'',title:`${statusText(v.status)}: ${mm(v.startedAt)}–${mm(v.completedAt??v.startedAt+120)}`,short:statusText(v.status)}]});
 }
 $('#timeline').innerHTML=`<div class="timeline"><div class="time-ruler"><span class="lane-label">Bölüm dakikası</span><div class="ruler-ticks">${[0,2,4,6,8,10,12].map(x=>`<span>${x}</span>`).join('')}</div></div>${lanes.map(l=>`<div class="time-lane"><div class="lane-label">${e(l.label)}</div><div class="lane-track">${bars(l.items)}</div></div>`).join('')}<div class="timeline-legend"><span>İlk söz</span><span>İstek / müzakere</span><span>Gerçek iş süresi</span></div><p class="muted" style="margin:10px 0 0">Kesikli sıradaki işler henüz harcama değildir. Geç başlangıç, bitişi de ileri taşır.</p></div>`;
}
function drawEnvelope(){
 const env=envelopes[activeRole]||envelopes.trainer;
 $('#role-envelope').innerHTML=envelopeOpen?`<div class="role-envelope"><div class="envelope-content"><h3>${e(activeRole==='trainer'?'Eğitmen':activeRole)} · ${e(env.name)}</h3><ul>${env.points.map(p=>`<li>${e(p)}</li>`).join('')}</ul><div class="envelope-question">${e(env.question)}</div><button class="text-button envelope-close" id="close-envelope">Zarfı kapat</button></div></div>`:`<div class="role-envelope"><div class="envelope-closed"><div class="role-stamp">${e(activeRole==='trainer'?'E':activeRole)}</div><h3>${e(env.name)}</h3><p>Bu rolün bildikleri, ekibin bütünü değil.</p><button class="button" id="open-envelope">Rol zarfını aç</button></div></div>`;
 $('#open-envelope')?.addEventListener('click',()=>{envelopeOpen=true;drawEnvelope();});
 $('#close-envelope')?.addEventListener('click',()=>{envelopeOpen=false;drawEnvelope();});
}
function drawActions(){
 const actions=getAvailableActions(state,activeRole).filter(a=>!['PAUSE','RESUME','END_SESSION','RESET'].includes(a.type)).filter(a=>state.phase==='play'||['ACCEPT_OBSERVATION','ACCEPT_OUTCOME'].includes(a.type));
 $('#actions-title').textContent=activeRole==='trainer'?'Bağımsız inceleme':`${activeRole} · karar ve uygulama`;
 if(state.phase==='complete'){$('#actions').innerHTML='<p class="no-actions">Bölüm ve değerlendirme tamamlandı. Aşağıda gerçekleşen sonuçları inceleyin veya yeni bir prova başlatın.</p>';return;}
 $('#actions').innerHTML=actions.length?actions.map((a,i)=>`<article class="action-card"><h3>${e(a.label)}</h3>${a.description?`<p>${e(a.description)}</p>`:''}${a.cost!=null||a.duration?`<div class="action-meta">${a.cost!=null?`<span>${a.cost} kredi</span>`:''}${a.duration?`<span>${a.duration%60?`${a.duration} sn`:`${a.duration/60} dk`}</span>`:''}</div>`:''}<button class="button" data-action-index="${i}" ${!a.enabled?'disabled':''}>${e(a.label)}</button>${!a.enabled&&a.reason?`<div class="action-reason">${e(a.reason)}</div>`:''}</article>`).join(''):'<p class="no-actions">Bu rol için şu anda bir işlem yok. Rol zarfındaki bilgiyi ekiple paylaş.</p>';
 document.querySelectorAll('[data-action-index]').forEach(button=>button.addEventListener('click',()=>openAction(actions[Number(button.dataset.actionIndex)])));
}
function drawCommitments(){
 const t=state.teacher||{},s=state.sponsor||{},sc=state.scope||{};
 const alt=t.alternativeMode||t.alternative?.mode||t.alternative;
 const sponsorStatus=s.decision||s.status||'requested';
 const isSponsorAccepted=['accept','accepted','negotiate','negotiated'].includes(sponsorStatus)||s.accepted===true;
 $('#commitments').innerHTML=`<div class="commitment"><b>İlk 40 · Mümtaz gözlemi</b>İlk söz T10–T12, iki dakika. ${t.earlyWindowAccepted?'Öğretmen daha erken gözlem zamanını kabul etti.':''}<span class="tag">${accepted('mumtaz')?'Öğretmen kabulü kaydedildi':completed('mumtaz')?'Gözlem bitti · kabul kontrolü gerekli':'Hizmet ve müşteri kabulü bekleniyor'}</span></div><div class="commitment"><b>Korsan · farklı içerik</b>${alt==='substitute'?'Öğretmen farklı içeriği Mümtaz yerine kabul etti.':alt==='additional'?'Yalnız ek etkinlik kabul edildi; Mümtaz sözü sürüyor.':'İçerik ve kapsam için öğretmenle açık mutabakat gerekir.'}</div><div class="commitment"><b>Sponsor</b>${sponsorStatus==='reject'||sponsorStatus==='rejected'?'İstek reddedildi; verilmiş bir söz bozulmadı.':isSponsorAccepted?`İstek kabul/müzakere kaydı var. Duyuru: ${mm(s.announcementAt??480)}. Fotoğraf sonucu ayrıca doğrulanır.`:'Fotoğraf ve T8 duyurusu bir istek. Kabul edilmeden taahhüt sayılmaz.'}<span class="tag amber">T7’de ayrılır · hayvanın poz vermesi beklenmez</span></div><div class="commitment"><b>Sonraki 80 · ek atölye</b>${sc.addonAccepted||sc.addon?.accepted?'Ek atölye planı kabul edildi; kaynak ayırma, deneyimin uygulanması değildir.':sc.addonOffered?'Ek kapsam önerildi; müşteri kabulü bekleniyor.':'10 kredilik isteğe bağlı ek hizmet. Henüz söz değil.'}</div>`;
}
function drawLog(){
 const logs=[...(state.log||[])].reverse();
 $('#event-log').innerHTML=logs.length?logs.map(l=>`<li><time>${mm(l.time??l.at??0)}</time><div><strong>${e(roleName(l.role))}</strong><p>${e(l.text||l.message||l.type)}</p>${l.note?`<p>${e(l.note)}</p>`:''}</div></li>`).join(''):'<li class="empty">Henüz karar yok. Rol bilgilerini paylaşın; ilk hamle zaman tahtasında iz bırakacak.</li>';
}
function render(){
 $('#clock').textContent=mm(state.phase==='play'?state.clock:state.debriefClock??state.debriefElapsed??0);
 $('#clock-label').textContent=state.phase==='play'?'YEREL BÖLÜM SAATİ':'DEĞERLENDİRME SAATİ';
 $('#phase').textContent=state.phase==='complete'?'Tamamlandı':state.phase!=='play'?'Değerlendirme':state.paused?(state.clock===0?'Hazır':'Duraklatıldı'):'Çalışıyor';
 $('#time-remaining').textContent=state.phase==='play'?`${mm(720-state.clock)} oyun süresi kaldı`:`${mm(180-(state.debriefClock??state.debriefElapsed??0))} değerlendirme kaldı`;
 $('#toggle-clock').textContent=state.phase==='complete'?'Bölüm tamamlandı':state.paused?(state.clock===0&&state.phase==='play'?'Oyunu başlat':'Saati sürdür'):'Duraklat';
 $('#toggle-clock').disabled=state.phase==='complete';
 document.querySelectorAll('[data-step]').forEach(b=>{b.disabled=state.phase==='complete';});
 $('#end').disabled=state.phase!=='play';
 $('#live-status').textContent=state.phase!=='play'?'Son durum':state.paused?'Saat duruyor':'Saat çalışıyor';
 $('#live-status').className=`live-dot ${!state.paused&&state.phase==='play'?'running':''}`;
 drawMetrics();drawPark();drawTimeline();drawActions();drawCommitments();drawLog();
 if(state.phase!=='play')drawDebrief();else $('#debrief').hidden=true;
 if(renderedPhase==='play'&&state.phase!=='play'){
  if($('#modal').open)$('#modal').close();
  setNotice('Oyun sona erdi. Sonuçlar yalnız gerçekleşen iş, gözlem ve kabul kayıtlarından türetildi. Üç dakikalık değerlendirmeyi başlatabilirsiniz.');
  $('#debrief').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 }
 renderedPhase=state.phase;
}
function openModal(content){resumeAfterDialog=!state.paused&&state.phase!=='complete';modalPhase=state.phase;if(resumeAfterDialog){state=dispatch(state,{type:'PAUSE',role:'trainer'});render();}$('#modal-content').innerHTML=`<div class="modal-inner">${content}</div>`;$('#modal').showModal();$('#modal-content').querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#modal').close()));}
function modalTop(title){return `<div class="modal-top"><h2 id="modal-title">${e(title)}</h2><button class="close-button" data-close aria-label="Pencereyi kapat">×</button></div>`;}
function renderField(f){
 const selected=f.default??'';
 let control;
 if(f.type==='select')control=`<select name="${e(f.name)}">${(f.options||[]).map(o=>`<option value="${e(o.value)}" ${String(o.value)===String(selected)?'selected':''}>${e(o.label)}</option>`).join('')}</select>`;
 else if(f.type==='textarea'||f.name==='reason'||f.name==='objective'||f.name==='note')control=`<textarea name="${e(f.name)}" ${f.required?'required':''} maxlength="500" placeholder="${e(f.placeholder||'Kısa ve somut bir not yeterli.')}" rows="2">${e(selected)}</textarea>`;
 else control=`<input name="${e(f.name)}" type="${f.type==='number'?'number':'text'}" value="${e(selected)}" ${f.min!=null?`min="${f.min}"`:''} ${f.max!=null?`max="${f.max}"`:''} ${f.required?'required':''} ${f.type!=='number'?'maxlength="300"':''}>`;
 return `<label>${e(f.label)}${control}${f.help?`<span class="field-help">${e(f.help)}</span>`:''}</label>`;
}
function openAction(a){
 activeDescriptor=a;
 openModal(`${modalTop(a.label)}<p>${e(a.description||'Kararını kaydet ve etkisini ortak tahtada izle.')}</p><div class="callout">${e(activeRole==='trainer'?'Bağımsız eğitmen kararı':`${activeRole} · ${envelopes[activeRole]?.name||roleName(activeRole)}`)} · Pencere açıkken saat durur; kapanınca önceki duruma döner.</div><form id="action-form"><div class="form-fields">${(a.fields||[]).map(renderField).join('')}</div><div id="action-error" hidden class="form-error" role="alert"></div><p class="privacy-note">Yalnız kurgusal oyun bilgisi kullanın. Gerçek kişi bilgisi girmeyin.</p><div class="modal-buttons"><button type="button" class="button" data-close>Vazgeç</button><button type="submit" class="button primary">Kararı uygula</button></div></form>`);
 $('#action-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!activeDescriptor)return;
  const command={type:activeDescriptor.type,role:activeRole,...activeDescriptor.payload};
  const data=new FormData(event.currentTarget);
  for(const f of activeDescriptor.fields||[]){let value=data.get(f.name);if(f.type==='number')value=Number(value);if(f.type==='select'&&f.options?.some(o=>typeof o.value==='boolean'))value=value==='true';command[f.name]=value;}
  try{state=dispatch(state,command);const decisionText=state.log?.at(-1)?.text||'Karar kaydedildi.';activeDescriptor=null;$('#modal').close();setNotice(decisionText,'success');render();}
  catch(error){$('#action-error').hidden=false;$('#action-error').textContent=error.message;}
 });
}
function help(){openModal(`${modalTop('Hizmeti birlikte kurun')}<p>12 dakikada, ilk 40 kişiye verilen sözü ve kaynakları birlikte yönetin. Tek bir doğru yol seçmeniz istenmiyor; kararlarınızın sonuçlarını yaşayacaksınız.</p><ol><li>Bir rol seçin, zarfını açın. Ekipçe oynuyorsanız o rolün sahibi bilgiyi masaya getirsin.</li><li>Üstteki saati başlatın. Bir işi sıraya almak, onaylamak, bitirmek ve hizmeti kabul etmek aynı şey değildir.</li><li>Diğer rollerle anlaşın; doğru role geçip ilgili işlemi uygulayın. Bütün işlemler tek cihazda simüle edilir.</li><li>1× gerçek zamanla oynayın veya prova için +15 sn / +30 sn kullanın. Saati ileri almak son tarihleri de ilerletir. Karar ve bilgi pencereleri açıkken saat durur; kapatınca önceki durumuna döner.</li><li>Bölüm bitince 3 dakikalık değerlendirmede sonuçların nedenlerine bakın. İnsanlara puan verilmez.</li></ol><div class="callout">Sağdaki rol değişimi güvenli kullanıcı hesabı değildir. Zarflar aynı ekranda bilerek açılır. Sekme gizlenirse oyun otomatik duraklar; sayfa yenilenirse ilerleme kaybolur.</div><div class="modal-buttons"><button class="button primary" data-close>Anladım</button></div>`);}
function confirmEnd(){openModal(`${modalTop('Bölümü burada bitir?')}<p>Devam eden işler ve gözlemler tamamlanmış sayılmaz. Şu ana kadarki kararlarla değerlendirmeye geçilir; oyun saati geri alınmaz.</p><div class="modal-buttons"><button class="button" data-close>Devam et</button><button class="button primary" id="confirm-end">Bitir ve değerlendir</button></div>`);$('#confirm-end').addEventListener('click',()=>{if(send({type:'END_SESSION',role:'trainer'}))$('#modal').close();});}
function confirmReset(){openModal(`${modalTop('Yeni bir prova başlat?')}<p>Bu açık sekmedeki kararlar silinir ve bütçe yeniden 20 kredi olur. Saklamak istersen önce karar kaydını indir.</p><div class="modal-buttons"><button class="button" data-close>Vazgeç</button><button class="button primary" id="confirm-reset">Sıfırla ve yeniden başla</button></div>`);$('#confirm-reset').addEventListener('click',()=>{resumeAfterDialog=false;tickCarry=0;state=createEpisode();activeRole='R1';envelopeOpen=false;activeDescriptor=null;speed=1;$('#speed').value='1';$('#role').value='R1';renderedPhase='play';lastTick=performance.now();$('#modal').close();drawEnvelope();setNotice('Yeni prova hazır. Önceki kararlar bu sekmeden temizlendi.');render();window.scrollTo({top:0,behavior:'smooth'});});}
function exportLog(){
 const output={episode:'Kırk Kişilik Söz',version:'1.0.0',mode:'single_device_offline_simulation_not_multiplayer',exportedAt:new Date().toISOString(),state,outcome:getOutcome(state),limitations:['Tek cihaz, rol değişimi simülasyonu; gerçek kimlik doğrulama yok.','İnsan öğrenmesi veya performansı ölçülmez.','Niles veya başka bir sistemle bağlantı yok.']};
 const blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Mavi_Vadi_Kirk_Kisilik_Soz_Karar_Kaydi.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('Karar kaydı indirme için hazırlandı. Cihazınızın indirme konumunu kontrol edin.');
}
function drawDebrief(){
 const out=getOutcome(state);
 const pending=out.promiseResults.filter(p=>p.assessed!==false&&p.promised&&!p.delivered);
 $('#debrief').hidden=false;
 $('#debrief').innerHTML=`<span class="eyebrow">3 DAKİKA · SONUÇTAN ÖĞRENMEYE</span><h2 id="debrief-title">${e(out.title)}</h2><p class="debrief-lead">Bu bir insan başarı puanı değil. Görülen sonuçlar bu bölümde gerçekten başlatılan, tamamlanan ve kabul edilen işlemlerden üretildi. ${state.phase!=='complete'?'T12’de biten gözlemin R8 ziyaretçi ve R2 öğretmen kabullerini rol masasından tamamlayabilirsiniz.':''}</p><div class="outcome-grid">${out.promiseResults.map(p=>`<article class="outcome-card ${p.assessed!==false&&p.promised&&!p.delivered?'warning':''}"><h3>${e(p.label)}</h3><p>${e(p.detail)}</p><span class="tag">${p.assessed===false?(p.funded?'Kaynak ayrıldı · gelecek plan':p.planned?'Planlandı · kaynak bekliyor':'Bu bölümde uygulanmadı'):p.delivered?'Gerçekleşti':p.promised?'Açık taahhüt':'Taahhüt verilmedi'}</span></article>`).join('')}<article class="outcome-card"><h3>Kaynakların izi</h3><p>${out.budget.spent} kredi gerçekten harcandı; ${out.budget.remaining} kredi kaldı. ${out.deliveredVisitors} kişinin gözlem deneyimi açık kabulle doğrulandı. Ek 80 kişilik atölyeye kaynak ayırmak, bu kişilere deneyim sunulduğu anlamına gelmez.</p></article></div>${pending.length&&state.phase!=='complete'?'<div class="alert-note">Açık kabuller hâlâ kaydedilebilir. Hazırlığı tamamlanmış hizmet, ziyaretçi deneyimi ve müşteri kabulüyle aynı şey değildir.</div>':''}${out.causes.length?`<div class="debrief-causes"><h3>Bu sonuç nasıl oluştu?</h3><ul>${out.causes.map(c=>`<li>${e(c)}</li>`).join('')}</ul></div>`:''}<div class="debrief-questions"><div class="debrief-question"><b>01</b><p>İsteği, verilmiş sözü ve müşteri kabulünü hangi anda birbirinden ayırdınız? Bir örnek seçin.</p></div><div class="debrief-question"><b>02</b><p>Teknik tamamlanma ile ziyaretçinin yaşadığı değer arasında hangi bağımlılık fark yarattı?</p></div><div class="debrief-question"><b>03</b><p>Aynı koşullarla yeniden başlasanız hangi kararı, hangi kanıta dayanarak değiştirirdiniz?</p></div></div><div class="debrief-actions"><button class="button primary" id="debrief-timer">${state.phase==='complete'?'Değerlendirme tamamlandı':state.paused?'Değerlendirme saatini başlat / sürdür':'Değerlendirmeyi duraklat'}</button><button class="button" id="debrief-export">Karar kaydını indir</button><button class="button" id="debrief-reset">Yeni bir yaklaşım dene</button></div>`;
 $('#debrief-timer').disabled=state.phase==='complete';
 $('#debrief-timer').addEventListener('click',()=>{send({type:state.paused?'RESUME':'PAUSE',role:'trainer'});lastTick=performance.now();});
 $('#debrief-export').addEventListener('click',exportLog);$('#debrief-reset').addEventListener('click',confirmReset);
}
function reference(kind){
 const isPrinciples=kind==='principles',items=isPrinciples?principles:improvementSteps;
 openModal(`${modalTop(isPrinciples?'7 Yol Gösterici İlke':'Sürekli İyileştirme')}<p>${isPrinciples?'İlkeler bir işlem sırası değildir. Aynı kararı farklı açılardan görmek için birlikte kullanın.':'Yedi adım, tek bir döngü. Her turda kanıtla başlayın ve öğrendiklerinizle yeni ihtiyaca dönün.'}</p><div class="reference-center">${isPrinciples?'PUSULA: ZİYARETÇİYE DEĞER':'AMAÇ → KANIT → EYLEM → ÖĞRENME'}</div><ol class="reference-grid ${isPrinciples?'principles':'improvement'}">${items.map(([title,english,summary,example],i)=>`<li><span class="reference-number">${String(i+1).padStart(2,'0')}</span><div><h3>${e(title)}</h3><small lang="en">${e(english)}</small><p>${e(summary)}</p><p class="reference-example">${e(example)}</p></div></li>`).join('')}</ol>${isPrinciples?'':'<div class="reference-loop">↺ 7 → 1 · Öğrendiklerinizle vizyonu ve sonraki ihtiyacı yeniden değerlendirin.</div>'}<p class="privacy-note">Türkçe açıklamalar bu atölyenin özgün öğrenme yardımlarıdır. ITIL® PeopleCert’in tescilli markasıdır. Bunlar oyun komutu veya öğrenme puanı değildir. Pencere açıkken saat durur; kapatınca önceki durumuna döner.</p><div class="modal-buttons"><button class="button primary" data-close>Oyuna dön</button></div>`);
 $('#modal').classList.add('reference-dialog');
}

$('#role').innerHTML=ROLES.map(r=>`<option value="${e(r.id)}">${e(r.id==='trainer'?'Eğitmen':r.id)} · ${e(r.name)}</option>`).join('');
$('#role').value=activeRole;
$('#role').addEventListener('change',event=>{activeRole=event.target.value;envelopeOpen=false;activeDescriptor=null;if($('#modal').open)$('#modal').close();drawEnvelope();drawActions();});
$('#toggle-clock').addEventListener('click',()=>{send({type:state.paused?'RESUME':'PAUSE',role:'trainer'});lastTick=performance.now();});
document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{
 try{const wasPaused=state.paused;if(wasPaused)state=dispatch(state,{type:'RESUME',role:'trainer'});state=advance(state,Number(button.dataset.step));if(wasPaused&&!state.paused&&state.phase!=='complete')state=dispatch(state,{type:'PAUSE',role:'trainer'});lastTick=performance.now();render();setNotice(`Bölüm saati ${button.dataset.step} saniye ilerletildi. Son tarihler ve kaynak işleri de ilerledi.`);}
 catch(error){setNotice(error.message,'error');}
}));
$('#speed').addEventListener('change',event=>{speed=Number(event.target.value);lastTick=performance.now();setNotice(`Saat ${speed}× hızında. İş süreleri ve son tarihler aynı bölüm saatini kullanır.`);});
$('#help').addEventListener('click',help);document.querySelectorAll('[data-reference]').forEach(b=>b.addEventListener('click',()=>reference(b.dataset.reference)));$('#end').addEventListener('click',confirmEnd);$('#reset').addEventListener('click',confirmReset);$('#export').addEventListener('click',exportLog);
$('#modal').addEventListener('close',()=>{$('#modal').classList.remove('reference-dialog');activeDescriptor=null;if(resumeAfterDialog&&state.paused&&state.phase===modalPhase&&state.phase!=='complete'){state=dispatch(state,{type:'RESUME',role:'trainer'});render();}resumeAfterDialog=false;modalPhase=null;tickCarry=0;lastTick=performance.now();});
$('#modal').addEventListener('click',event=>{if(event.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('#modal').close();}});
document.addEventListener('visibilitychange',()=>{lastTick=performance.now();if(document.hidden&&!state.paused&&state.phase!=='complete'){state=dispatch(state,{type:'PAUSE',role:'trainer'});render();setNotice('Sekme görünür olmadığı için saat duraklatıldı. Hazır olduğunuzda sürdürün.');}});
setInterval(()=>{const now=performance.now();const elapsed=Math.min(2,(now-lastTick)/1000);lastTick=now;if(state.paused||state.phase==='complete'||document.hidden){tickCarry=0;return;}tickCarry+=elapsed*speed;const seconds=Math.floor(tickCarry);if(!seconds)return;tickCarry-=seconds;try{state=advance(state,seconds);render();}catch(error){if(!state.paused)state=dispatch(state,{type:'PAUSE',role:'trainer'});setNotice(error.message,'error');render();}},250);
// Explicit test seam: synthetic tests can inspect state; no network, account or persistent storage.
export function inspectEpisode(){return structuredClone(state);}
export function applyEpisodeCommand(command){state=dispatch(state,command);render();}
export function advanceEpisode(seconds){state=advance(state,seconds);render();}
drawEnvelope();render();
