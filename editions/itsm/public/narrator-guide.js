import { publicFacilitatorContract } from './training-contract.js';
import { createLocalSpeech, localTurkishVoices } from './facilitator-speech.js';

// Shared-room preview: only the canonical PUBLIC briefing can become speech.
// It receives no engine state, role envelope, free text, microphone, or provider.
export function createPublicNarrator({onMessage=()=>{},onStatus=()=>{},synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance}={}) {
 const briefing=publicFacilitatorContract('forty-visitors');
 let context=null,contextKey='',contextValid=false,mode='ready',last=null,voiceEnabled=false,selectedVoice=null,serial=0;
 const output=createLocalSpeech({synth,Utterance,onText:message=>onMessage(message),onUnavailable:()=>{voiceEnabled=false;selectedVoice=null;status('Cihaz sesi kullanılamadı. Metinle devam edin; sesi yeniden açmayı deneyebilirsiniz.');}});
 function status(note=''){onStatus({mode,voiceEnabled,note,canRepeat:!!last&&last.contextKey===contextKey&&mode==='ready',hasLocalVoice:localTurkishVoices(synth).length>0});}
 function cancel(note=''){serial++;output.cancel();status(note);}
 function reconcileVoice(){if(voiceEnabled&&!localTurkishVoices(synth).includes(selectedVoice)){voiceEnabled=false;selectedVoice=null;output.disable();}}
 function line(kind){
  if(kind==='opening')return `${briefing.fiction} ${briefing.firstAction}`;
  if(kind==='conditions')return briefing.conditions.join(' ');
  if(kind==='rules')return briefing.rules.map((text,index)=>`${index+1}. ${text}`).join(' ');
  if(kind==='role'){
   const role=briefing.roles.find(role=>role.id===context?.roleId);
   if(role)return `${role.id==='trainer'?'Eğitmen':role.id}: ${role.title}. ${role.publicMission} ${role.publicAuthorityBoundary}`;
  }
  throw new Error('UNKNOWN_PUBLIC_SCRIPT');
 }
 function publish(kind,text){
  if(mode!=='ready')throw new Error('HUMAN_RESUME_REQUIRED');
  if(!context||!contextValid)throw new Error('NARRATOR_CONTEXT_REQUIRED');
  const id=++serial,message=Object.freeze({kind,text,audience:'shared_public',contractVersion:briefing.version,liveAI:false});
  // Cancel previous utterance; never queue rapid clicks or resurrect old output.
  reconcileVoice();output.cancel();output.publish(message);reconcileVoice();
  if(id===serial&&mode==='ready')last={kind,text,contextKey};
  status('Metin hazır.');return message;
 }
 return {
  sync(view){
   if(!view||!['play','debrief','complete'].includes(view.phase)||!briefing.roles.some(r=>r.id===view.roleId)||typeof view.sessionKey!=='string'||!view.sessionKey||typeof view.paused!=='boolean'||typeof view.welfareHeld!=='boolean'||!Number.isSafeInteger(view.semanticRevision)||view.semanticRevision<0||(context?.sessionKey===view.sessionKey&&view.semanticRevision<context.semanticRevision)){
    contextValid=false;mode='paused';last=null;cancel('Oyun bağlamı doğrulanamadı; anlatım susturuldu.');throw new Error('INVALID_NARRATOR_CONTEXT');
   }
   const next={sessionKey:view.sessionKey,roleId:view.roleId,phase:view.phase,paused:view.paused,welfareHeld:view.welfareHeld,semanticRevision:view.semanticRevision};
   const nextKey=JSON.stringify(next);
   const changed=!!contextKey&&nextKey!==contextKey,handover=next.welfareHeld&&mode==='ready';
   // Commit the context and safety state before emitting any callback. A
   // callback must never see or restart speech under the superseded context.
   context=next;contextKey=nextKey;contextValid=true;if(handover)mode='human';
   if(changed||handover){last=null;cancel(handover?'Oyun bağlamı değişti; refah durdurması nedeniyle anlatım eğitmende.':'Oyun bağlamı değişti; önceki anlatım kesildi.');}
   status();
  },
  speak(kind){return publish(kind,line(kind));},
  repeat(){if(!last||last.contextKey!==contextKey)throw new Error('NO_CURRENT_REPEAT');return publish(last.kind,last.text);},
  pause(){mode='paused';cancel('Anlatım susturuldu. Oyun saati değişmedi.');},
  takeover(){mode='human';last=null;cancel('Anlatım eğitmende. Oyun saati değişmedi.');},
  resume(){if(!context||!contextValid)throw new Error('NARRATOR_CONTEXT_REQUIRED');if(context.welfareHeld)throw new Error('WELFARE_HOLD_ACTIVE');mode='ready';status('Hazır. Okunacak metni seçin.');},
  interrupt(note='Anlatım kesildi.'){last=null;cancel(note);},
  enableVoice(){const voice=localTurkishVoices(synth)[0];if(!voice)throw new Error('LOCAL_TURKISH_VOICE_UNAVAILABLE');output.enable(voice);selectedVoice=voice;voiceEnabled=true;status('Cihaz sesi açık; okunacak metni seçin.');},
  disableVoice(){voiceEnabled=false;selectedVoice=null;output.disable();status('Yalnız metin.');},
  refreshVoices(){reconcileVoice();status();},
  reset(){serial++;mode='ready';last=null;context=null;contextKey='';voiceEnabled=false;output.disable();status('Yeni prova; ses kapalı.');},
  inspect(){return {mode,voiceEnabled,context:context?{...context}:null,canRepeat:!!last&&last.contextKey===contextKey&&mode==='ready'};}
 };
}
