// Workshop learning evidence, not a psychological or employee-performance score.
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const required=(value,label,min=20,max=2000)=>{if(typeof value!=='string'||value.trim().length<min||value.length>max)fail(400,`${label}: ${min}–${max} karakterle somut kanıt yazın.`);return value.trim();};
export const learningEnabled=scenario=>scenario.learningModel===1;
export const learningActions={R5:['draft','edit','submit','revise','publish','retire'],R8:['review','measure'],R2:['reuse'],R3:['reuse'],R7:['reuse']};
export function learningPermissions(role,trainer){return trainer?['draft','edit','submit','revise','publish','retire','review','measure','reuse','transfer','assess']:[...(learningActions[role]||[]),'transfer'];}
export const initialLearning=()=>({articles:[],measurements:[],transfers:[],reuses:[],history:[]});
export function learningView(state,role,trainer,enabled){const s=state.learning||initialLearning();return {...s,enabled,allowed:learningPermissions(role,trainer),metrics:{published:s.articles.filter(a=>a.status==='published').length,reviewed:s.articles.filter(a=>a.review?.decision==='approve').length,retired:s.articles.filter(a=>a.status==='retired').length,crossRoleReuse:s.reuses.filter(r=>r.role!==r.authorRole).length,successfulReuse:s.reuses.filter(r=>r.result==='worked').length,measurements:s.measurements.length,transferAssessed:s.transfers.filter(t=>t.assessment).length},caution:'Bunlar gözlenen çalışma ve öğrenme kanıtlarıdır. Tıklama, metin uzunluğu veya kapanış puanı öğrenme ve eğlenceyi kanıtlamaz.'};}
export function applyLearning(state,input,user,role,records,decisions,now){
 const s=state.learning||(state.learning=initialLearning()),op=input.operation;
 if(!learningPermissions(role,!!user.trainer).includes(op))fail(403,'Bu bilgi/öğrenme işlemi rolünüzün yetkisinde değil.');
 const actor={actorId:user.id,actor:user.name,role:role||'trainer',at:now};
 const record=id=>{const r=records.find(r=>r.event_id===id);if(!r)fail(409,'Kanıt için bu atölyede gönderilmiş bir olay seçin.');return r;};
 const evidence=(eventId,id)=>{record(eventId);const d=decisions.find(d=>d.id===id&&d.event_id===eventId&&['note','propose','evaluate'].includes(d.kind));if(!d)fail(409,'Kaynak olaya ait kaydedilmiş bir çalışma/sonuç kanıtı seçin.');return {id:d.id,eventId,note:d.note,actorId:d.actor_id,at:d.created_at};};
 let a=input.articleId?s.articles.find(a=>a.id===input.articleId):null;
 if(['edit','submit','revise','publish','retire','review','reuse'].includes(op)&&!a)fail(404,'Bilgi sürümü bulunamadı.');
 if(['edit','submit','publish','revise','retire'].includes(op)&&!user.trainer&&a.authorId!==user.id)fail(403,'Bu sürümü yalnız yazarı yönetebilir.');
 let message;const previousStatus=a?.status||null;
 if(op==='draft'||op==='revise'){
  if(op==='revise'&&!['published','retired'].includes(a.status))fail(409,'Yeni sürüm yalnız yayımlanmış veya emekli bir sürümden türetilir.');
  if(op==='revise'&&s.articles.some(x=>x.family===a.family&&['draft','review','approved'].includes(x.status)))fail(409,'Bu makalenin bekleyen bir sürümü zaten var.');
  if(op==='revise'&&a.version!==Math.max(...s.articles.filter(x=>x.family===a.family).map(x=>x.version)))fail(409,'Yeni sürümü en son sürümden oluşturun.');
  const source=evidence(input.eventId,input.evidenceId),id=crypto.randomUUID();
  const article={id,family:a?.family||id,version:a?a.version+1:1,status:'draft',title:required(input.title,'Başlık',8,160),scope:required(input.scope,'Uygulanacağı koşul'),procedure:required(input.procedure,'Adımlar ve kontrol'),limits:required(input.limits,'Uygulanmayacağı koşul ve geri dönüş'),source,authorId:user.id,author:user.name,authorRole:role||'trainer',createdAt:now};
  s.articles.push(article);a=article;message=`Bilgi v${article.version} taslağı: ${article.title}`;
 }else if(op==='edit'){
  if(a.status!=='draft')fail(409,'İncelenen veya yayımlanmış içeriği değiştiremezsiniz; yeni sürüm oluşturun.');
  a.title=required(input.title,'Başlık',8,160);a.scope=required(input.scope,'Uygulanacağı koşul');a.procedure=required(input.procedure,'Adımlar ve kontrol');a.limits=required(input.limits,'Sınırlar ve geri dönüş');a.source=evidence(input.eventId,input.evidenceId);delete a.review;message=`v${a.version} taslağı düzeltildi; yeniden bağımsız inceleme gerekir.`;
 }else if(op==='submit'){
  if(a.status!=='draft')fail(409,'Yalnız taslak incelemeye gönderilebilir.');a.status='review';message=`v${a.version} R8 bağımsız kanıt incelemesine gönderildi.`;
 }else if(op==='review'){
  if(a.status!=='review')fail(409,'Bu sürüm inceleme beklemiyor.');if(a.authorId===user.id)fail(403,'Yazar kendi makalesini inceleyemez; başka bir R8 katılımcısı gerekir.');
  if(!['approve','reject'].includes(input.option))fail(400,'Onay veya düzeltme seçin.');
  const note=required(input.note,'Kaynak, kapsam ve geri dönüş incelemesi');a.review={...actor,decision:input.option,note};a.status=input.option==='approve'?'approved':'draft';message=`v${a.version} incelemesi: ${input.option==='approve'?'yayına uygun':'düzeltme gerekli'}.`;
 }else if(op==='publish'){
  if(a.status!=='approved'||!a.review||a.review.actorId===a.authorId)fail(409,'Bağımsız onay olmadan yayımlanamaz.');
  for(const previous of s.articles.filter(x=>x.family===a.family&&x.status==='published')){previous.status='retired';previous.retiredAt=now;previous.retirementReason=`v${a.version} yayımlandı`;}
  a.status='published';a.publishedAt=now;message=`Bilgi v${a.version} yayımlandı; önceki etkin sürüm emekli edildi.`;
 }else if(op==='retire'){
  if(a.status!=='published')fail(409,'Yalnız yayımlanmış sürüm emekli edilir.');a.retirementReason=required(input.note,'Emeklilik gerekçesi');a.status='retired';a.retiredAt=now;message=`v${a.version} kullanımdan kaldırıldı.`;
 }else if(op==='reuse'){
  if(a.status!=='published')fail(409,'Taslak, incelemedeki veya emekli sürüm yeniden kullanılamaz.');if(a.authorId===user.id||a.authorRole===role)fail(403,'Yeniden kullanım farklı kullanıcı ve farklı rol tarafından yapılmalı.');
  const target=record(input.eventId);if(target.event_id===a.source.eventId)fail(409,'Bilgiyi kaynak kayıttan farklı bir olayda sınayın.');
  const observation=evidence(input.eventId,input.evidenceId);if(observation.actorId!==user.id)fail(403,'Yeniden kullanımda kendi kaydettiğiniz saha/çalışma gözlemini seçin.');
  if(!['worked','failed','not_applicable'].includes(input.option))fail(400,'Gözlenen sonucu seçin.');
  if(s.reuses.some(r=>r.articleId===a.id&&r.actorId===user.id&&r.eventId===input.eventId))fail(409,'Bu kullanıcı/sürüm/olay için sonuç zaten kayıtlı.');
  s.reuses.push({...actor,id:crypto.randomUUID(),articleId:a.id,version:a.version,title:a.title,authorRole:a.authorRole,eventId:input.eventId,observation,result:input.option,note:required(input.note,'Uygunluk kontrolü ve gerçek sonuç')});message=`v${a.version} başka rolde sınandı: ${input.option}. Eski kullanım kanıtı sonraki sürümde korunur.`;
 }else if(op==='measure'){
  record(input.eventId);if(!['baseline','checkpoint','final'].includes(input.option))fail(400,'Başlangıç, ara veya son ölçüm seçin.');
  s.measurements.push({...actor,id:crypto.randomUUID(),stage:input.option,eventId:input.eventId,metric:required(input.metric,'Ölçüt ve ölçüm yöntemi'),observation:required(input.note,'Gözlenen değer ve yorum'),snapshot:{open:records.filter(r=>!r.resolved_at).length,breached:records.filter(r=>r.due_at&&(r.resolved_at||now)>r.due_at).length,resolved:records.filter(r=>r.resolved_at).length}});message='R8 ölçüt, gerçek anlık kayıt sayıları ve yorumunu kaydetti.';
 }else if(op==='transfer'){
  if(s.transfers.some(t=>t.actorId===user.id))fail(409,'Bu katılımcının aktarım yanıtı zaten kaydedildi.');
  s.transfers.push({...actor,id:crypto.randomUUID(),dependency:required(input.dependency,'Yeni örnekte ortak bağımlılık'),decision:required(input.decision,'Yetki ve risk kararı'),verification:required(input.verification,'Hizmet kabul kanıtı')});message='Yeni iş örneğine aktarım yanıtı kaydedildi; öğrenme değerlendirmesi eğitmeni bekliyor.';
 }else if(op==='assess'){
  const transfer=s.transfers.find(t=>t.id===input.transferId);if(!transfer)fail(404,'Aktarım yanıtı bulunamadı.');if(transfer.assessment)fail(409,'Bu gözlem zaten değerlendirildi.');
  if(!['dependency','decision','verification'].every(k=>['demonstrated','needs_practice'].includes(input[k])))fail(400,'Üç ölçütün her biri için gözlenen düzeyi seçin.');
  transfer.assessment={...actor,dependency:input.dependency,decision:input.decision,verification:input.verification,note:required(input.note,'Gözlenen öğrenme ve geri bildirim')};message='Eğitmen aktarım kanıtını üç ölçüte göre değerlendirdi; memnuniyet/psikoloji ölçülmedi.';
 }else fail(400,'Öğrenme işlemi bulunamadı.');
 s.history.push({...actor,operation:op,articleId:a?.id||(['draft','revise'].includes(op)?s.articles.at(-1).id:null),version:a?.version||(['draft','revise'].includes(op)?s.articles.at(-1).version:null),previousStatus,status:a?.status||(['draft','revise'].includes(op)?'draft':null),note:input.note||null,message});return message;
}
