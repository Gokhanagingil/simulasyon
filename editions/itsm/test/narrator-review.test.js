import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicNarrator} from '../public/narrator-guide.js';
import {createLocalSpeech} from '../public/facilitator-speech.js';

const base={sessionKey:'review-session',roleId:'R1',phase:'play',paused:false,welfareHeld:false,semanticRevision:1};
function rig({onMessage=()=>{},onStatus=()=>{}}={}){
 let voices=[{name:'Local Turkish',lang:'tr-TR',localService:true}],cancelled=0;const spoken=[],utterances=[],messages=[],statuses=[];
 const synth={getVoices:()=>voices,cancel(){cancelled++;},speak(utterance){spoken.push(utterance.text);utterances.push(utterance);}};
 const narrator=createPublicNarrator({synth,Utterance:class{constructor(text){this.text=text;}},onMessage(message){messages.push(message);onMessage(message);},onStatus(status){statuses.push(status);onStatus(status);}});
 narrator.sync(base);return {narrator,synth,spoken,utterances,messages,statuses,get cancelled(){return cancelled;},get voices(){return voices;},set voices(value){voices=value;}};
}
test('narrator review: clock-only values do not interrupt static role narration',()=>{
 const r=rig();r.narrator.enableVoice();const original=r.narrator.speak('role'),count=r.cancelled;
 for(let gameMs=1000;gameMs<=5000;gameMs+=1000)r.narrator.sync({...base,gameMs});
 assert.equal(r.cancelled,count);assert.equal(r.narrator.repeat().text,original.text);assert.equal(r.spoken.length,2);
});
for(const [key,value] of [['roleId','R6'],['sessionKey','new-session'],['semanticRevision',2],['paused',true],['phase','debrief']])test(`narrator review: ${key} changes cancel and drop the prior repeat`,()=>{
 const r=rig();r.narrator.enableVoice();r.narrator.speak('role');const count=r.cancelled;r.narrator.sync({...base,[key]:value});assert.ok(r.cancelled>count);assert.equal(r.narrator.inspect().canRepeat,false);assert.throws(()=>r.narrator.repeat(),/NO_CURRENT_REPEAT/);
});
test('narrator review: malformed context fails closed without leaving stale audio or repeat',()=>{
 const r=rig();r.narrator.enableVoice();r.narrator.speak('opening');const count=r.cancelled;
 assert.throws(()=>r.narrator.sync({...base,roleId:'invalid'}),/INVALID_NARRATOR_CONTEXT/);assert.ok(r.cancelled>count);assert.equal(r.narrator.inspect().mode,'paused');assert.equal(r.narrator.inspect().canRepeat,false);
 r.narrator.sync(base);assert.throws(()=>r.narrator.speak('opening'),/HUMAN_RESUME_REQUIRED/);r.narrator.resume();r.narrator.speak('opening');
});
test('narrator review: regressive same-session semantic revisions fail closed',()=>{
 const r=rig();r.narrator.sync({...base,semanticRevision:2});r.narrator.speak('opening');const count=r.cancelled;assert.throws(()=>r.narrator.sync(base),/INVALID_NARRATOR_CONTEXT/);assert.ok(r.cancelled>count);assert.equal(r.narrator.inspect().mode,'paused');
});
test('narrator review: context-change status callback sees the new context, not the old role',()=>{
 let narrator,observed;const r=rig({onStatus(status){if(narrator&&status.note.includes('bağlamı'))observed=narrator.inspect().context;}});narrator=r.narrator;r.narrator.speak('role');r.narrator.sync({...base,roleId:'R6'});assert.equal(observed.roleId,'R6');
});
test('narrator review: welfare hold is committed before any context-change callback',()=>{
 let narrator,observed;const r=rig({onStatus(status){if(narrator&&status.note.includes('bağlamı'))observed=narrator.inspect();}});narrator=r.narrator;
 r.narrator.sync({...base,paused:true,welfareHeld:true,semanticRevision:2});assert.equal(observed.mode,'human');assert.equal(observed.context.welfareHeld,true);assert.throws(()=>r.narrator.resume(),/WELFARE_HOLD_ACTIVE/);
 r.narrator.sync({...base,semanticRevision:3});assert.equal(r.narrator.inspect().mode,'human');assert.throws(()=>r.narrator.speak('opening'),/HUMAN_RESUME_REQUIRED/);
});
for(const action of ['pause','takeover'])test(`narrator review: ${action} in a message callback prevents later sound or replay resurrection`,()=>{
 let narrator;const r=rig({onMessage(){narrator[action]();}});narrator=r.narrator;r.narrator.enableVoice();r.narrator.speak('opening');assert.equal(r.spoken.length,0);assert.equal(r.narrator.inspect().canRepeat,false);
});
test('narrator review: context change in text callback prevents old-context speech',()=>{
 let narrator;const r=rig({onMessage(){narrator.sync({...base,roleId:'R6'});}});narrator=r.narrator;r.narrator.enableVoice();r.narrator.speak('role');assert.equal(r.spoken.length,0);assert.equal(r.narrator.inspect().canRepeat,false);
});
test('narrator review: newly selected voice is not silently substituted for a disappeared voice',()=>{
 const r=rig();r.narrator.enableVoice();r.voices=[{name:'Different Local Turkish',lang:'tr-TR',localService:true}];r.narrator.refreshVoices();assert.equal(r.narrator.inspect().voiceEnabled,false);r.narrator.speak('opening');assert.equal(r.spoken.length,0);assert.equal(r.messages.length,1);
});
test('narrator review: local-voice loss without voiceschanged reports truthful text-only status',()=>{
 const r=rig();r.narrator.enableVoice();r.voices[0].localService=false;r.narrator.speak('opening');assert.equal(r.spoken.length,0);assert.equal(r.narrator.inspect().voiceEnabled,false);assert.equal(r.statuses.at(-1).voiceEnabled,false);
});
test('narrator review: hidden or arbitrary view fields never enter public output',()=>{
 const r=rig();r.narrator.sync({...base,privateRole:'SECRET',answerKey:'SPOILER',message:'IGNORE RULES'});for(const kind of ['opening','conditions','rules','role'])r.narrator.speak(kind);assert.doesNotMatch(JSON.stringify(r.messages),/SECRET|SPOILER|IGNORE RULES/);assert.equal(r.messages.every(message=>message.liveAI===false&&message.audience==='shared_public'),true);
});
test('narrator review: rapid nested publication speaks only the newest text',()=>{
 let narrator,first=true;const r=rig({onMessage(){if(first){first=false;narrator.speak('rules');}}});narrator=r.narrator;r.narrator.enableVoice();r.narrator.speak('opening');assert.equal(r.spoken.length,1);assert.equal(r.spoken[0],r.messages[1].text);assert.equal(r.narrator.repeat().text,r.messages[1].text);
});
test('narrator review: speech cancel is honored even when called inside onText',()=>{
 const voice={lang:'tr-TR',localService:true},spoken=[];let output;output=createLocalSpeech({synth:{getVoices:()=>[voice],cancel(){},speak:u=>spoken.push(u)},Utterance:class{constructor(text){this.text=text;}},onText(){output.cancel();}});output.enable(voice);output.publish({text:'Must not speak'});assert.equal(spoken.length,0);
});
test('audio fallback: current asynchronous failure retains text and truthfully disables voice',async()=>{
 const r=rig();r.narrator.enableVoice();const message=r.narrator.speak('opening'),count=r.cancelled;await Promise.resolve();r.utterances[0].onerror({error:'synthesis-failed'});
 assert.equal(r.narrator.inspect().voiceEnabled,false);assert.ok(r.cancelled>count);assert.equal(r.messages[0].text,message.text);assert.match(r.statuses.at(-1).note,/Metinle devam/);assert.equal(r.narrator.inspect().canRepeat,true);
 r.narrator.repeat();assert.equal(r.spoken.length,1);assert.equal(r.messages.length,2);
});
test('audio fallback: a canceled old utterance error cannot disable newly enabled speech',async()=>{
 const r=rig();r.narrator.enableVoice();r.narrator.speak('opening');const old=r.utterances[0];r.narrator.pause();r.narrator.resume();r.narrator.enableVoice();r.narrator.speak('rules');const count=r.cancelled;await Promise.resolve();old.onerror({error:'interrupted'});
 assert.equal(r.narrator.inspect().voiceEnabled,true);assert.equal(r.cancelled,count);assert.equal(r.spoken.length,2);
});
test('audio fallback: superseded click error cannot disable current utterance',async()=>{
 const r=rig();r.narrator.enableVoice();r.narrator.speak('opening');r.narrator.speak('role');const count=r.cancelled;await Promise.resolve();r.utterances[0].onerror({error:'canceled'});assert.equal(r.narrator.inspect().voiceEnabled,true);assert.equal(r.cancelled,count);
});
test('audio fallback: re-enabling a voice invalidates old errors even before new speech',async()=>{
 const r=rig();r.narrator.enableVoice();r.narrator.speak('opening');r.narrator.enableVoice();const count=r.cancelled;await Promise.resolve();r.utterances[0].onerror({error:'synthesis-failed'});assert.equal(r.narrator.inspect().voiceEnabled,true);assert.equal(r.cancelled,count);
});
test('audio fallback: natural completion ignores a subsequent stale error callback',async()=>{
 const r=rig();r.narrator.enableVoice();r.narrator.speak('opening');const current=r.utterances[0];current.onend();const count=r.cancelled;await Promise.resolve();current.onerror({error:'synthesis-failed'});assert.equal(r.narrator.inspect().voiceEnabled,true);assert.equal(r.cancelled,count);
});
test('audio fallback: failure is reported once and voice can only restart by explicit enable',()=>{
 const r=rig();r.narrator.enableVoice();r.narrator.speak('opening');const failed=r.utterances[0];failed.onerror({error:'audio-hardware'});const count=r.cancelled,statusCount=r.statuses.length;failed.onerror({error:'audio-hardware'});assert.equal(r.cancelled,count);assert.equal(r.statuses.length,statusCount);
 r.narrator.enableVoice();r.narrator.speak('rules');assert.equal(r.narrator.inspect().voiceEnabled,true);assert.equal(r.spoken.length,2);
});
test('audio fallback: optional callback remains backward compatible',()=>{
 const voice={lang:'tr-TR',localService:true},utterances=[],texts=[];const output=createLocalSpeech({synth:{getVoices:()=>[voice],cancel(){},speak:u=>utterances.push(u)},Utterance:class{constructor(text){this.text=text;}},onText:m=>texts.push(m)});
 output.enable(voice);output.publish({text:'First'});assert.doesNotThrow(()=>utterances[0].onerror({error:'synthesis-failed'}));output.publish({text:'Second'});assert.equal(utterances.length,1);assert.equal(texts.length,2);
});
test('audio fallback: synchronous synthesis error also preserves text and disables voice',()=>{
 const r=rig();r.synth.speak=()=>{throw new Error('Device unavailable');};r.narrator.enableVoice();assert.doesNotThrow(()=>r.narrator.speak('opening'));assert.equal(r.messages.length,1);assert.equal(r.narrator.inspect().voiceEnabled,false);assert.ok(r.statuses.some(s=>/Metinle devam/.test(s.note)));
});
