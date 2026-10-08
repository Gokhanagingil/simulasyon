import { encounterPermissions, actionLabels } from './itsm-authority.js';
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const facts={
 R2:'Su alanı kapanınca okul grubunun 40 kişisi girişte bekliyor. Ağ kesilirse turnike ve rezervasyon da etkileniyor.',
 R3:'Pompa ekranı yeşilken havuzda akış kesilebiliyor. Kabul testi gerçek su akışı ve güvenli ziyaretçi rotasını içermeli.',
 R4:'Saha ölçümü: P1 ve P2 aynı B1 panosundan besleniyor. B1 ayrıca park ağını besliyor; pano yeniden başlatılırsa giriş de durur.',
 R5:'Son üç olay B1 gerilim dalgalanmasıyla aynı anda. Pompa yeniden başlatmak ortak nedenin tekrarını engellemiyor.',
 R7:'Acil uyumlu kit 45 kredi. Tedarik hazırlığı bir teknisyeni 90 simülasyon saniyesi meşgul eder; tamamlanırsa aynı kurulum 35 krediye yapılır. Bekleme ve bütçe arasında seçim var.',
 R8:'Cihaz yeşili hizmet kabulü değildir. Geçici düzelmede 180 simülasyon saniyesi sonra tekrar testi gerekir.',
};
const recoveryReserve=35;
const effectiveCost=s=>s.plan?.type==='isolate'&&s.jobs.some(j=>j.type==='support'&&j.done)?35:s.plan?.cost;
const initial=now=>({version:1,revision:0,clock:{seconds:0,at:now,running:false,speed:1},credits:100,shared:{},inspected:false,plan:null,approved:false,funded:false,jobs:[],water:'degraded',network:'up',recurrenceAt:null,validated:false,history:[],requests:{}});
export function projectEncounter(original,now=Date.now()){
 const s=structuredClone(original);const clock=s.clock;s.time=clock.seconds+(clock.running?Math.max(0,now-clock.at)/1000*clock.speed:0);
 for(const job of s.jobs){if(job.done||job.until>s.time)continue;job.done=true;
  if(job.type==='restart'){s.water='temporary';s.network='up';s.recurrenceAt=job.until+180;}
  if(job.type==='isolate'){s.water='test_pending';s.network='up';s.recurrenceAt=null;}
  s.history.push({at:job.until,actor:'Sistem',message:job.type==='support'?'Tedarik hazırlığı tamamlandı; teknisyen yeniden uygun, bağımsız kit 35 krediye hazır.':job.type==='restart'?'Pano yeniden başlatıldı. Giriş açıldı; ortak besleme riski kaldı.':'Bağımsız besleme kuruldu. Teknik iş bitti; saha kabulü bekleniyor.'});
 }
 if(s.recurrenceAt!==null&&s.time>=s.recurrenceAt){s.water='degraded';s.validated=false;s.history.push({at:s.recurrenceAt,actor:'Sistem',message:'B1 dalgalanması tekrarlandı. Geçici çözüm kalıcı değildi; su hizmeti yeniden etkilendi.'});s.recurrenceAt=null;s.plan=null;s.approved=false;s.funded=false;}
 s.history.sort((a,b)=>a.at-b.at);
 s.available=2-s.jobs.filter(j=>!j.done).reduce((n,j)=>n+j.technicians,0);
 return s;
}
async function load(store,wid,now){
 let row=await store.one('SELECT * FROM simulation_runtime WHERE workshop_id=?',wid);
 if(!row){
  const seed=initial(now),legacy=await store.one("SELECT resolved_at FROM simulation_records WHERE workshop_id=? AND event_id='E07' AND resolved_at IS NOT NULL",wid);
  if(legacy){seed.legacyAccepted=true;seed.legacyAcceptedAt=legacy.resolved_at;seed.inspected=true;seed.validated=true;seed.water='resilient';seed.history.push({at:0,actor:'Önceki atölye kabulü',message:'Mevcut E07 eğitmen kabulü korundu. Bu sürümdeki kaynak işleri yeniden oynatılmadı; geçmiş kredi/teknisyen tüketimi bilinmiyor.'});}
  await store.run('INSERT OR IGNORE INTO simulation_runtime(workshop_id,revision,state) VALUES(?,0,?)',wid,JSON.stringify(seed));row=await store.one('SELECT * FROM simulation_runtime WHERE workshop_id=?',wid);
 }
 return {row,state:projectEncounter(JSON.parse(row.state),now)};
}
export async function readEncounter(store,wid,role,trainer,now=Date.now()){
 const {row,state:s}=await load(store,wid,now);const active=!s.legacyAccepted&&!!await store.one("SELECT 1 FROM simulation_records WHERE workshop_id=? AND event_id IN ('E05','E06','E07') AND resolved_at IS NULL",wid);
 const safe={...s,recoveryReserve};if(s.plan)safe.plan={...s.plan,effectiveCost:effectiveCost(s)};delete safe.requests; // Idempotency metadata is server-private.
 const next=s.legacyAccepted?'Önceki E07 kabulü korunuyor. Eski kaynak harcaması bu modelde ölçülmedi.':!active?'E05 veya E06 kartını gönderin.':!s.shared.R4?'Teknik bakım ölçümünü ekiple paylaşsın.':!s.inspected?'Teknik bakım veya problem yöneticisi CMDB bağımlılığını incelesin.':!s.plan?'Teknik bakım iki müdahale seçeneğini karşılaştırsın.':!s.funded?'Hizmet sahibi maliyeti ve kalan kapasiteyi değerlendirsin.':!s.approved?'Değişiklik yetkilisi iş ve saha kanıtını birleştirip riske karar versin.':s.jobs.some(j=>!j.done&&j.type!=='support')?(s.clock.running?'Uygulama sürüyor; kapasite doluyken başka iş başlatmayın.':'İş sırada; eğitmen baskı saatini başlatmalı. Düşünme arasında kaynak işleri de durur.'):s.water==='test_pending'?'Saha operasyonu gerçek akışı doğrulasın.':s.water==='temporary'?'Geçici çözüm hizmeti döndürdü. Tekrarı bekleyebilir veya teknik bakımdan kalıcı plan isteyebilirsiniz.':s.validated?'Hizmet kabul edildi. Eğitmen E06/E07 sonuçlarını kanıtla değerlendirebilir.':'Teknik bakım onaylı planı uygulasın.';
 return {...safe,revision:row.revision,active,privateFact:trainer?null:facts[role]||null,trainerFacts:trainer?facts:undefined,allowed:encounterPermissions(role,trainer),actionLabels,next,capacity:2,mode:'standalone',hint:trainer?'Cevabı söylemeden sorun: Bu CI arızalanırsa hangi iki hizmeti kaybederiz? Hangi kanıt planı değiştirirdi?':undefined};
}
export async function mutateEncounter({store,wid,user,role,input,now=Date.now()}){
 const action=input.operation;if(!encounterPermissions(role,user.trainer).includes(action))fail(403,'Bu oyun işlemi rolünüzün yetkisinde değil. Ekip ve roller ekranındaki yetkiyi kullanın.');
 if(typeof input.requestId!=='string'||!/^[A-Za-z0-9_-]{8,80}$/.test(input.requestId))fail(400,'Tekrarlanabilir işlem kimliği gerekli.');
 const {row,state:s}=await load(store,wid,now);const signature=JSON.stringify([user.id,action,input.option||null,input.note||null]);
 if(s.requests[input.requestId]){if(s.requests[input.requestId]!==signature)fail(409,'İşlem kimliği başka bir karar için kullanılmış.');return;}
 if(s.legacyAccepted)fail(409,'Bu atölyenin önceki E07 kabulü korunuyor. Yeni kaynak modelini oynamak için yeni atölye açın.');
 if(input.runtimeRevision!==row.revision)fail(409,'Ekip bu sırada bir karar verdi. Güncel durumu okuyup yeniden deneyin.');
 if(action!=='pace'&&!await store.one("SELECT 1 FROM event_runs WHERE workshop_id=? AND event_id IN ('E05','E06','E07')",wid))fail(409,'Önce pompa senaryosu eğitmen tarafından açılmalı.');
 let message='';
 if(action==='pace'){
  if(!user.trainer)fail(403,'Baskı saatini yalnız eğitmen yönetir.');
  if(!['pause','1','3','6'].includes(input.option))fail(400,'Hız 1, 3 veya 6 olmalı.');
  s.clock={seconds:s.time,at:now,running:input.option!=='pause',speed:input.option==='pause'?s.clock.speed:Number(input.option)};
  message=input.option==='pause'?'Baskı saati durdu; gerçek kayıt SLA saatleri devam eder.':`Baskı saati ${input.option}× hızında. Kaynak işleri ve tekrar testi bu saati izler.`;
 } else if(action==='share'){
  const source=user.trainer?input.option:role;if(!facts[source])fail(400,'Bu rolün hazır saha kanıtı yok.');if(s.shared[source])fail(409,'Bu kanıt zaten ekiple paylaşıldı.');
  s.shared[source]=facts[source];message=`${source} kanıtı paylaşıldı: ${facts[source]}`;
 } else if(action==='inspect'){
  if(!s.shared.R4)fail(409,'Önce teknik bakımın saha ölçümünü isteyin.');if(s.inspected)fail(409,'CMDB incelemesi zaten kaydedildi.');
  s.inspected=true;message='CMDB saha ölçümüyle doğrulandı: P1 + P2 → B1 → park ağı → turnike / rezervasyon. İki pompa bağımsız yedeklilik değil.';
 } else if(action==='plan'){
  if(!s.inspected)fail(409,'Önce CI bağımlılıklarını inceleyin.');if(s.jobs.some(j=>!j.done&&j.type!=='support')||s.validated||s.water==='test_pending')fail(409,'Uygulama veya kabul sonrası plan değiştirilemez.');
  if(!['restart','isolate'].includes(input.option))fail(400,'Bir teknik plan seçin.');
  if(typeof input.note!=='string'||input.note.trim().length<20||input.note.length>2000)fail(400,'Test ve geri dönüş koşulunu en az 20 karakterle açıklayın.');
  s.plan={type:input.option,cost:input.option==='restart'?10:45,technicians:input.option==='restart'?1:2,duration:input.option==='restart'?45:120,note:input.note.trim()};s.approved=false;s.funded=false;
  message=input.option==='restart'?'Plan: 10 kredi / 1 teknisyen / 45 sn. B1 yeniden başlar; ağ ve giriş geçici kesilir. Tekrar riski sürer.':'Plan: 45 kredi / 2 teknisyen / 120 sn. Bağımsız besleme kurulacak; saha kabulü gerekir. Giriş ağı açık kalır.';
 } else if(action==='fund'){
  if(!s.plan)fail(409,'Önce teknik planı bekleyin.');if(s.funded)fail(409,'Bütçe zaten ayrıldı.');const cost=effectiveCost(s);if(s.plan.type==='restart'&&s.credits-cost<recoveryReserve)fail(409,'Hizmet sahibinin 35 kredilik kurtarma rezervi korunur. Tedarik hazırlığıyla kalıcı çözümü seçin.');if(s.credits<cost)fail(409,'Bu plan için yeterli oyun kredisi yok. Tedarik hazırlığı tamamlanınca 35 kredilik seçeneği değerlendirin.');s.funded=true;message=`Hizmet sahibi ${cost} kredi harcama sınırını ayırdı. Uygulama başladığında düşülecek.`;
 } else if(action==='approve'){
  if(!s.plan||!s.funded)fail(409,'Önce plan ve kaynak kararı gerekli.');if(!s.shared.R2||!s.shared.R3)fail(409,'İş etkisini R2, saha kabul koşulunu R3 paylaşmalı.');if(s.approved)fail(409,'Bu plan zaten onaylandı.');
  s.approved=true;message='Değişiklik yetkilisi hizmet etkisini, test/geri dönüş planını ve bütçeyi değerlendirerek uygulamaya izin verdi.';
 } else if(action==='execute'){
  if(!s.plan||!s.approved||!s.funded)fail(409,'Uygulama için plan, kaynak ve değişiklik onayı gerekli.');
  if(s.jobs.some(j=>!j.done&&j.type!=='support')||s.water==='test_pending'||(s.water==='temporary'&&s.plan.type==='restart')||s.validated)fail(409,'Bu uygulama zaten başlatılmış veya tamamlanmış.');
  if(s.available<s.plan.technicians)fail(409,'Teknisyenler başka işte. İş bitmesini bekleyin; aynı kişiyi iki işe veremezsiniz.');
  const cost=effectiveCost(s);
  if(s.plan.type==='restart'&&s.credits-cost<recoveryReserve)fail(409,'35 kredilik kurtarma rezervi harcanamaz; kalıcı çözüm için tedarik hazırlığını tamamlayın.');
  if(s.credits<cost)fail(409,'Oyun kredisi yetersiz.');s.credits-=cost;s.jobs.push({type:s.plan.type,technicians:s.plan.technicians,until:s.time+s.plan.duration,done:false});
  if(s.plan.type==='restart')s.network='down';s.recurrenceAt=null;s.water='repairing';message=`Uygulama başladı: ${cost} kredi harcandı, ${s.plan.technicians} teknisyen ${s.plan.duration} sn meşgul.`;
 } else if(action==='support'){
  if(s.jobs.some(j=>j.type==='support'))fail(409,'Bu tedarik hazırlığı zaten başlatılmış.');if(s.available<1)fail(409,'Boş teknisyen yok.');s.jobs.push({type:'support',technicians:1,until:s.time+90,done:false});message='Tedarik hazırlığına 90 sn için bir teknisyen ayrıldı. İki kişilik kurulum bu iş bitene kadar bekler; hazırlık bitince kit 45 yerine 35 kredi olur.';
 } else if(action==='validate'){
  if(s.water!=='test_pending')fail(409,'Bağımsız besleme işi bitmeli; geçici yeniden başlatma kalıcı kabul değildir.');if(!s.shared.R3)fail(409,'Saha kabul koşulunu önce ekiple paylaşın.');
  s.water='resilient';s.validated=true;message='Saha kabulü: B1 kesintisinde bağımsız pompa akışı sürüyor; hizmet dayanıklılığı doğrulandı. CMDB artık bağımsız beslemeyi gösteriyor.';
 }
 s.history.push({at:s.time,actor:user.name,message});s.requests[input.requestId]=signature;
 // Conditional UPDATE is one atomic compare-and-swap on both SQLite and D1.
 s.revision=row.revision+1;delete s.available;delete s.time;
 await store.run('UPDATE simulation_runtime SET state=?,revision=revision+1 WHERE workshop_id=? AND revision=?',JSON.stringify(s),wid,row.revision);
 const saved=await store.one('SELECT state FROM simulation_runtime WHERE workshop_id=?',wid);
 if(JSON.parse(saved.state).requests[input.requestId]!==signature)fail(409,'Eşzamanlı karar alındı; kaynaklar değişti. Güncel durumu yenileyin.');
}
