import { workshopScenario, saveWorkshopScenario, durationSeconds, validateScenario } from './scenario-config.js';
import { publicRole, elapsedSeconds, currentPhase } from './domain.js';
import { createDemo, demoAccounts } from './demo.js';
import { readITSM, mutateITSM } from './itsm-engine.js';

class HttpError extends Error {
  constructor(status, message) { super(message); this.status=status; }
}
const required=(value,name,max=120)=>{
  if(typeof value!=='string'||!value.trim()||value.length>max) throw new HttpError(400,`${name} alanını kontrol et.`);
  return value.trim();
};
const secret=(value,name='Parola')=>{
  if(typeof value!=='string'||!value.length||value.length>200) throw new HttpError(400,`${name} alanını kontrol et.`);
  return value;
};
const safeUser=user=>({id:user.id,username:user.username,name:user.name,trainer:!!user.trainer,platform:!!user.platform});
const tokenFrom=request=>(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('mv_session='))?.slice(11);
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');

export function createHandler({store,scenario:defaultScenario,passwords,secureCookies=false,platformOwnerEmail=''}) {
  const {one,all,run}=store;
  const attempts=new Map();
  const secure=secureCookies?'; Secure':'';
  const sessionCookie=token=>`mv_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}`;
  const expiredCookie=`mv_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;

  const trainer=user=>{if(!user.trainer)throw new HttpError(403,'Bu işlemi eğitmenin yapabilir.');};
  async function auth(request) {
    const token=tokenFrom(request);
    const user=token&&await one('SELECT u.*, EXISTS(SELECT 1 FROM platform_users p WHERE p.user_id=u.id) AS platform FROM users u JOIN logins l ON u.id=l.user_id WHERE l.token=? AND l.expires>?',await passwords.digest(token),Date.now());
    if(!user)throw new HttpError(401,'Oturumun sona ermiş. Lütfen tekrar giriş yap.');
    return user;
  }
  async function access(id,user) {
    const workshop=await one('SELECT * FROM workshops WHERE id=?',id);
    if(!workshop||(!user.trainer&&!await one('SELECT 1 FROM memberships WHERE workshop_id=? AND user_id=?',id,user.id)))throw new HttpError(404,'Bu atölye bulunamadı.');
    return workshop;
  }
  const workshops=user=>user.trainer?all('SELECT * FROM workshops ORDER BY created_at DESC'):all('SELECT w.* FROM workshops w JOIN memberships m ON w.id=m.workshop_id WHERE m.user_id=? ORDER BY w.created_at DESC',user.id);
  async function state(id,user) {
    let workshop=await access(id,user);
    const {pack:scenario,revision}=await workshopScenario(store,defaultScenario,id);
    const maximum=durationSeconds(scenario), seconds=elapsedSeconds(workshop,Date.now(),maximum);
    if(seconds>=maximum&&workshop.status==='running'){
      await run("UPDATE workshops SET elapsed=?, started_at=NULL, status='completed' WHERE id=?",maximum,id);
      workshop=await one('SELECT * FROM workshops WHERE id=?',id);
    }
    const membership=await one('SELECT role_id FROM memberships WHERE workshop_id=? AND user_id=?',id,user.id);
    const [zoneStates,members,announcements,note,activity]=await Promise.all([
      all('SELECT zone_id,status,note FROM zone_states WHERE workshop_id=?',id),
      all('SELECT u.id,u.name,u.username,m.role_id FROM users u JOIN memberships m ON u.id=m.user_id WHERE m.workshop_id=? ORDER BY u.name',id),
      user.trainer?all('SELECT * FROM announcements WHERE workshop_id=? ORDER BY created_at DESC LIMIT 30',id):all('SELECT * FROM announcements WHERE workshop_id=? AND (role_id IS NULL OR role_id=?) ORDER BY created_at DESC LIMIT 30',id,membership?.role_id||''),
      one('SELECT text FROM notes WHERE workshop_id=? AND user_id=?',id,user.id),
      user.trainer?all('SELECT a.*,u.name AS actor FROM activity a JOIN users u ON u.id=a.actor_id WHERE workshop_id=? ORDER BY created_at DESC LIMIT 20',id):[],
    ]);
    return {
      workshop:{...workshop,elapsed_seconds:seconds,duration_seconds:maximum},scenarioRevision:revision,user:safeUser(user),roleId:membership?.role_id||null,
      scenario:{id:scenario.id,version:scenario.version,name:scenario.name,description:scenario.description,phases:scenario.phases,guides:scenario.guides,
        roles:scenario.roles.map(r=>user.trainer||membership?.role_id===r.id?r:publicRole(r)),
        zones:scenario.zones.map(z=>({...z,...zoneStates.find(s=>s.zone_id===z.id)}))},
      phase:currentPhase(scenario.phases,seconds),members,announcements,note:note?.text||'',activity,
      itsm:await readITSM(store,scenario,id,!!user.trainer),
    };
  }
  async function body(request,limit=32768) {
    let bytes=0,parts=[];
    if(request.body){const reader=request.body.getReader();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>limit){await reader.cancel();throw new HttpError(413,'Bu içerik çok uzun.');}parts.push(value);}}
    const text=await new Blob(parts).text();
    try {const data=JSON.parse(text||'{}');if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}
    catch {throw new HttpError(400,'Gönderilen bilgi okunamadı.');}
  }
  return async function handle(request,{remoteAddress='local'}={}) {
    const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});
    const send=(status,data)=>new Response(JSON.stringify(data),{status,headers});
    const login=async user=>{
      const token=randomToken();
      await run('INSERT INTO logins VALUES(?,?,?)',await passwords.digest(token),user.id,Date.now()+28800000);
      headers.set('Set-Cookie',sessionCookie(token));
      return send(200,{user:safeUser(user),workshops:await workshops(user)});
    };
    try {
      const url=new URL(request.url),path=url.pathname,method=request.method;
      if(path==='/health'&&method==='GET')return send(200,{ok:true});
      if(method==='GET'&&path==='/api/auth/options')return send(200,{platform:!!platformOwnerEmail});
      if(!['GET','HEAD'].includes(method)){
        if(request.headers.get('sec-fetch-site')==='cross-site')throw new HttpError(403,'İstek doğrulanamadı.');
        const origin=request.headers.get('origin');
        if(origin){try{if(new URL(origin).host!==url.host)throw Error();}catch{throw new HttpError(403,'İstek doğrulanamadı.');}}
        if(!(request.headers.get('content-type')||'').startsWith('application/json'))throw new HttpError(415,'JSON içerik bekleniyor.');
      }
      if(path==='/api/auth/platform'&&method==='POST'){
        if(!platformOwnerEmail)throw new HttpError(404,'Bu giriş yöntemi etkin değil.');
        const identity=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
        if(!identity||!email)throw new HttpError(401,'ChatGPT hesabınla giriş yap.');
        let user=await one('SELECT u.* FROM users u JOIN platform_users p ON p.user_id=u.id WHERE p.id=?',identity);
        if(!user){
          if(email.toLowerCase()!==platformOwnerEmail.toLowerCase())throw new HttpError(403,'Eğitmen girişi bu uygulamanın sahibine açıktır. Katılımcı hesabınla giriş yapabilirsin.');
          user=await one('SELECT * FROM users WHERE trainer=1 ORDER BY username LIMIT 1');
          const existing=await one('SELECT id FROM platform_users WHERE user_id=?',user.id);
          if(existing&&existing.id!==identity)throw new HttpError(403,'Bu eğitmen başka bir hesaba bağlı.');
          await run('INSERT OR IGNORE INTO platform_users(id,user_id) VALUES(?,?)',identity,user.id);
        }
        return login({...user,platform:true});
      }
      if(path==='/api/auth/login'&&method==='POST'){
        const input=await body(request),username=required(input.username,'Kullanıcı adı',40).toLocaleLowerCase('en'),password=secret(input.password);
        const key=`${remoteAddress}:${username}`,last=attempts.get(key);
        if(last&&last.until>Date.now()&&last.count>=20)throw new HttpError(429,'Çok sayıda deneme yapıldı. Birkaç dakika sonra tekrar dene.');
        const user=await one('SELECT * FROM users WHERE username=?',username);
        if(!user||!await passwords.verifyPassword(password,user.password)){
          attempts.set(key,{count:last?.until>Date.now()?last.count+1:1,until:Date.now()+300000});
          if(attempts.size>1000)for(const [k,v]of attempts)if(v.until<Date.now())attempts.delete(k);
          throw new HttpError(401,'Kullanıcı adı veya parola doğru değil.');
        }
        attempts.delete(key);return login(user);
      }
      const user=await auth(request);
      if(path==='/api/auth/logout'&&method==='POST'){
        const token=tokenFrom(request);if(token)await run('DELETE FROM logins WHERE token=?',await passwords.digest(token));
        headers.set('Set-Cookie',expiredCookie);return send(200,{ok:true});
      }
      if(path==='/api/me'&&method==='GET')return send(200,{user:safeUser(user),workshops:await workshops(user)});
      if(path==='/api/me'&&method==='PATCH'){
        const input=await body(request),name=required(input.name,'Ad soyad',80);await run('UPDATE users SET name=? WHERE id=?',name,user.id);return send(200,{user:safeUser({...user,name})});
      }
      if(path==='/api/password'&&method==='POST'){
        const input=await body(request);
        if(!await passwords.verifyPassword(secret(input.current,'Mevcut parola'),user.password))throw new HttpError(400,'Mevcut parolanı kontrol et.');
        const password=secret(input.password,'Yeni parola');if(password.length<8)throw new HttpError(400,'Yeni parola en az 8 karakter olmalı.');
        await run('UPDATE users SET password=? WHERE id=?',await passwords.hashPassword(password),user.id);
        await run('DELETE FROM logins WHERE user_id=?',user.id);headers.set('Set-Cookie',expiredCookie);return send(200,{ok:true});
      }
      if(path==='/api/demo-accounts'&&['GET','POST'].includes(method)){
        trainer(user);
        return send(200,method==='POST'?await createDemo(store,defaultScenario,passwords):await demoAccounts(store,defaultScenario));
      }
      if(path==='/api/workshops'&&method==='POST'){
        trainer(user);const input=await body(request),workshop=await store.createWorkshop(required(input.name,'Atölye adı',100));await store.log(workshop.id,user.id,'Atölye oluşturuldu.');return send(201,{workshop});
      }
      const match=path.match(/^\/api\/workshops\/([a-f0-9-]+)(?:\/(state|clock|members|zones|announcements|note|itsm|scenario))?(?:\/([a-zA-Z0-9-]+))?$/);
      if(!match)throw new HttpError(404,'İşlem bulunamadı.');
      const [,id,resource,target]=match,workshop=await access(id,user);
      const config=await workshopScenario(store,defaultScenario,id),scenario=config.pack;
      const roleExists=roleId=>scenario.roles.some(r=>r.id===roleId);
      if(resource==='scenario'){trainer(user);if(method==='GET')return send(200,config);if(method==='POST')return send(200,{pack:validateScenario((await body(request,512000)).pack)});if(method==='PUT'){const saved=await saveWorkshopScenario(store,defaultScenario,id,await body(request,512000));await store.log(id,user.id,`Senaryo güncellendi: sürüm ${saved.revision}.`);return send(200,saved);}}
      if(resource==='state'&&method==='GET')return send(200,await state(id,user));
      if(resource==='itsm'&&method==='POST'){await mutateITSM({store,scenario,wid:id,user,input:await body(request),revision:config.revision});return send(200,await state(id,user));}
      if(resource==='note'&&method==='PUT'){
        const input=await body(request);if(typeof input.text!=='string'||input.text.length>4000)throw new HttpError(400,'Not en fazla 4000 karakter olabilir.');
        await run('INSERT INTO notes VALUES(?,?,?) ON CONFLICT(workshop_id,user_id) DO UPDATE SET text=excluded.text',id,user.id,input.text);return send(200,{ok:true});
      }
      trainer(user);const input=await body(request);
      if(resource==='clock'&&method==='POST'){
        const maximum=durationSeconds(scenario);let elapsed=elapsedSeconds(workshop,Date.now(),maximum),status=workshop.status,started=null;
        if(input.action==='start'){if(elapsed>=maximum)throw new HttpError(400,'Atölye tamamlandı. Yeni bir atölye oluşturabilirsin.');status='running';started=Date.now();}
        else if(input.action==='pause'){if(status!=='completed')status='paused';}
        else if(input.action==='phase'){const index=scenario.phases.findIndex(p=>p.id===input.phase);if(index<0)throw new HttpError(400,'Bölüm bulunamadı.');elapsed=scenario.phases.slice(0,index).reduce((n,p)=>n+p.minutes*60,0);status='paused';}
        else throw new HttpError(400,'Saat işlemi bulunamadı.');
        await run('UPDATE workshops SET elapsed=?,status=?,started_at=? WHERE id=?',elapsed,status,started,id);
        await store.log(id,user.id,input.action==='start'?'Oturum başlatıldı.':input.action==='pause'?'Oturum duraklatıldı.':'Eğitim bölümü değiştirildi.');
      } else if(resource==='members'&&method==='POST'){
        const username=required(input.username,'Kullanıcı adı',40).toLocaleLowerCase('en');if(!/^[a-z0-9._-]{3,40}$/.test(username))throw new HttpError(400,'Kullanıcı adı 3–40 harf, rakam, nokta, alt çizgi veya tire içermeli.');
        const name=required(input.name,'Ad soyad',80),password=secret(input.password);if(password.length<8)throw new HttpError(400,'Parola en az 8 karakter olmalı.');if(!roleExists(input.roleId))throw new HttpError(400,'Bir rol seç.');
        if(await one('SELECT id FROM users WHERE username=?',username))throw new HttpError(409,'Bu kullanıcı adı kullanılıyor. Başka bir ad seç.');
        const uid=crypto.randomUUID();
        await store.batch([['INSERT INTO users VALUES(?,?,?,?,0)',[uid,username,name,await passwords.hashPassword(password)]],['INSERT INTO memberships VALUES(?,?,?)',[id,uid,input.roleId]]]);
        await store.log(id,user.id,`${name} atölyeye katıldı.`);
      } else if(resource==='members'&&target&&method==='PATCH'){
        if(!roleExists(input.roleId))throw new HttpError(400,'Bir rol seç.');if(!await one('SELECT 1 FROM memberships WHERE workshop_id=? AND user_id=?',id,target))throw new HttpError(404,'Katılımcı bulunamadı.');
        await run('UPDATE memberships SET role_id=? WHERE workshop_id=? AND user_id=?',input.roleId,id,target);await store.log(id,user.id,'Katılımcı rolü güncellendi.');
      } else if(resource==='zones'&&target&&method==='PATCH'){
        if(!scenario.zones.some(z=>z.id===target))throw new HttpError(404,'Bölge bulunamadı.');if(!['open','monitor','closed'].includes(input.status))throw new HttpError(400,'Bölge durumu geçersiz.');if(typeof input.note!=='string'||input.note.length>500)throw new HttpError(400,'Not en fazla 500 karakter olabilir.');
        await run('UPDATE zone_states SET status=?,note=? WHERE workshop_id=? AND zone_id=?',input.status,input.note,id,target);await store.log(id,user.id,`${scenario.zones.find(z=>z.id===target).name} durumu güncellendi.`);
      } else if(resource==='announcements'&&method==='POST'){
        const title=required(input.title,'Başlık',100),message=required(input.message,'Mesaj',1200);if(input.roleId&&!roleExists(input.roleId))throw new HttpError(400,'Alıcı rol bulunamadı.');
        await run('INSERT INTO announcements VALUES(?,?,?,?,?,?)',crypto.randomUUID(),id,title,message,input.roleId||null,Date.now());await store.log(id,user.id,'Yeni duyuru paylaşıldı.');
      } else throw new HttpError(404,'İşlem bulunamadı.');
      return send(200,await state(id,user));
    } catch(error){
      if(!error.status)console.error(error);
      return send(error.status||500,{error:error.status?error.message:'İşlem tamamlanamadı. Lütfen tekrar dene.'});
    }
  };
}
