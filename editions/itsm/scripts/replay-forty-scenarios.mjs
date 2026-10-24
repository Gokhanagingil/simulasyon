import {mkdirSync,writeFileSync} from 'node:fs';
import {createEpisode,dispatch,advance,getOutcome} from '../public/forty-engine.js';
import assert from 'node:assert/strict';
function run(name,fn){let s=createEpisode();const roles=new Set();const g={get state(){return s;},do(role,type,data={}){roles.add(role);s=dispatch(s,{type,role,...data});return g;},to(t){assert.ok(t>=s.clock);s=advance(s,t-s.clock);return g;},step(n){s=advance(s,n);return g;}};g.do('trainer','RESUME').do('R2','CONFIRM_OBJECTIVE',{objective:'İlk 40 kişinin doğal hayvan davranışını zorlamadan gözlemesi.'});fn(g);return{name,kind:'scripted_synthetic_role_replay_not_human_learning_evidence',roles:[...roles],outcome:getOutcome(s),finalState:s};}
function fundedAddon(g){g.do('R1','OFFER_ADDON').do('R2','ACCEPT_ADDON').do('R1','AUTHORIZE_JOB',{job:'workshop'}).do('R5','QUEUE_JOB',{job:'workshop'});}
function observe(g,target){g.do('R3','START_FIELD_CHECK',{target}).step(30).do('R8','START_OBSERVATION',{target,count:40}).step(120).do('R8','ACCEPT_OBSERVATION',{target}).do('R2','ACCEPT_OUTCOME',{target});}
function korsan(g,mode){g.to(180).do('R2','ACCEPT_ALTERNATIVE',{mode}).do('R1','AUTHORIZE_JOB',{job:'alternative'}).do('R5','QUEUE_JOB',{job:'alternative'}).step(120);observe(g,'korsan');}
const runs=[
 run('İlk söz korunur; gelecek atölye fonlanır',g=>{fundedAddon(g);g.to(570);observe(g,'mumtaz');}),
 run('Erken Mümtaz; rızalı fotoğraf; T9 için açık anons anlaşması',g=>{g.to(180).do('R2','ACCEPT_EARLY_WINDOW').do('R2','RESPOND_SPONSOR',{decision:'negotiate',at:540}).do('R2','AUTHORIZE_PHOTO',{audience:'class'}).do('R1','AUTHORIZE_JOB',{job:'pa'}).do('R1','AUTHORIZE_JOB',{job:'keeper'}).do('R6','PROPOSE_PA_CHANGE').do('trainer','APPROVE_PA_CHANGE').do('R4','QUEUE_JOB',{job:'pa'}).do('R7','QUEUE_JOB',{job:'keeper'}).step(180).do('R3','START_FIELD_CHECK',{target:'mumtaz'}).step(30).do('R8','START_PHOTO',{duration:30}).step(30).do('R8','START_OBSERVATION',{target:'mumtaz',count:40}).step(120).do('R8','ACCEPT_OBSERVATION',{target:'mumtaz'}).do('R2','ACCEPT_OUTCOME',{target:'mumtaz'}).to(720);}),
 run('Farklı Korsan içeriği açıkça ikame edilir; gelecek atölye fonlanır',g=>{fundedAddon(g);korsan(g,'substitute');g.to(720);}),
 run('Korsan ek deneyim; Mümtaz ilk söz; gelecek atölye fonlanır',g=>{fundedAddon(g);korsan(g,'additional');g.to(570);observe(g,'mumtaz');})
];
for(const [i,r] of runs.entries()){assert.equal(r.outcome.primaryDelivered,true,r.name);assert.equal(r.outcome.deliveredVisitors,40);assert.equal(r.finalState.budget.remaining,i===0?10:5);assert.equal(r.finalState.scope.addonDelivered,false);assert.deepEqual(r.outcome.breaches,[]);}
const result={generatedAt:new Date().toISOString(),scope:'Four scripted synthetic participant-role replays; not human usability, learning, satisfaction, or multiplayer evidence.',runs};
const dest=new URL('../delivery/forty/',import.meta.url);mkdirSync(dest,{recursive:true});writeFileSync(new URL('simulated-participant-runs.json',dest),JSON.stringify(result,null,2)+'\n');
console.log(runs.map(r=>`${r.name}: ${r.outcome.deliveredVisitors} simülasyonda kabul edilen ziyaretçi; ${r.finalState.budget.remaining} kredi; gelecek80 fonu=${r.finalState.scope.addonFunded}; ihlal=${r.outcome.breaches.length}`).join('\n'));
