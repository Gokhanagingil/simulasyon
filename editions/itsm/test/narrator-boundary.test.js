import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPublicNarrator} from '../public/narrator-guide.js';
import {publicFacilitatorContract} from '../public/training-contract.js';
const ctx={sessionKey:'fictional-test',roleId:'R1',phase:'play',paused:true,welfareHeld:false,semanticRevision:2};
test('public narrator has no microphone/provider/network/secret-envelope path',()=>{
 for(const path of ['public/narrator-guide.js','public/facilitator-speech.js']){const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');assert.doesNotMatch(source,/\b(fetch|XMLHttpRequest|WebSocket|SpeechRecognition|getUserMedia|mediaDevices|localStorage|sessionStorage)\s*[(.]/);assert.doesNotMatch(source,/\benvelopes\s*\[|roleEvidence|eventSchedule/);}
});
test('opening conditions rules and every role use only shared canonical text',()=>{
 const messages=[],n=createPublicNarrator({synth:null,Utterance:null,onMessage:m=>messages.push(m)}),b=publicFacilitatorContract('forty-visitors');n.sync(ctx);
 n.speak('opening');assert.equal(messages.at(-1).text,`${b.fiction} ${b.firstAction}`);
 n.speak('conditions');assert.equal(messages.at(-1).text,b.conditions.join(' '));
 n.speak('rules');assert.equal(messages.at(-1).text,b.rules.map((text,i)=>`${i+1}. ${text}`).join(' '));
 for(const role of b.roles){n.sync({...ctx,roleId:role.id});n.speak('role');assert.ok(messages.at(-1).text.includes(role.publicMission));assert.ok(messages.at(-1).text.includes(role.publicAuthorityBoundary));assert.equal(messages.at(-1).liveAI,false);assert.equal(messages.at(-1).audience,'shared_public');}
});
test('unrecognized narrator kind cannot become arbitrary speech',()=>{const n=createPublicNarrator({synth:null,Utterance:null});n.sync(ctx);for(const kind of ['__proto__','private','other-role-secret','model-answer'])assert.throws(()=>n.speak(kind),/UNKNOWN_PUBLIC_SCRIPT/);});
