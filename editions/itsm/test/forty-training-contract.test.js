import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {trainingContract,getPublicBriefing,getRoleBriefing,changeAuthorityFor,publicFacilitatorContract} from '../public/training-contract.js';
import {ROLES,ACTIONS,createEpisode,dispatch} from '../public/forty-engine.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const moduleId='forty-visitors';
const ids=Array.from({length:8},(_,i)=>`R${i+1}`);

test('episode canonical JSON matches frozen browser data and reproducible generator',()=>{
 assert.deepEqual(trainingContract,JSON.parse(read('content/training-contract-v1.json')));
 assert.equal(trainingContract.schema,'mavi-vadi-training-contract/1');
 assert.equal(trainingContract.version,'1.0.0');
 assert.equal(Object.isFrozen(trainingContract.modules[moduleId].authority.changeApproval),true);
 assert.match(execFileSync(process.execPath,['scripts/build-training-contract.mjs','--check'],{cwd:new URL('../',import.meta.url),encoding:'utf8'}),/match/);
});

test('episode ownership metadata does not grant another module portfolio or authority',()=>{
 assert.deepEqual(trainingContract.roles.map(r=>r.id),ids);
 assert.equal(new Set(trainingContract.roles.flatMap(r=>r.ownedCiIds)).size,16);
 for(const id of ids){const role=getRoleBriefing(moduleId,id);assert.equal(role.id,id);assert.equal(role.portfolioActive,false);assert.equal(role.ownedCiIds.length,2);}
 assert.match(trainingContract.identity.processHat,/tek başına.*yetkisi vermez/);
 assert.match(trainingContract.identity.transition,/önceki bölümün bütçesi, sonucu ve işlem yetkisi.*taşınmaz/);
});

test('short opening uses one fiction one first action and five plain rules',()=>{
 const b=getPublicBriefing(moduleId);assert(b.fiction.length<400);assert(b.firstAction.length<220);assert.equal(b.rules.length,5);assert(b.rules.every(rule=>rule.length<150));assert(!b.fiction.includes('\n'));
 assert.equal(b.durationMinutes,12);assert.equal(b.debriefMinutes,3);
 assert.deepEqual(b.resources,{normalBudget:20,recoveryReserve:0,technicians:1});
 assert.match(b.identity.localRoleSelection,/kimlik doğrulama/);assert.match(b.identity.ciOwnership,/CI,/);
});

test('public narrator projection has no role envelope or future-event answer and is copy-safe',()=>{
 const b=getPublicBriefing(moduleId),n=publicFacilitatorContract(moduleId);
 assert.equal(n.version,b.version);assert.equal(n.audience,'shared_public');assert.equal(n.mode,moduleId);
 assert.equal(n.openingConditions.normalBudget,20);assert.deepEqual(n.authority,b.authority);
 assert.equal(n.roles.length,9);assert.doesNotMatch(JSON.stringify(n),/roleEvidence|eventSchedule|privateFacts|envelopes|closureCriterion|T9:30|T\+13|E-N0[1-9]/);
 b.rules.push('MUTATED');b.authority.changeApproval.pa='R6';
 assert.equal(getPublicBriefing(moduleId).rules.length,5);assert.equal(changeAuthorityFor(moduleId,'pa'),'trainer');
});

test('unknown module role and operation fail closed',()=>{
 assert.throws(()=>getPublicBriefing('legacy-240'));assert.throws(()=>publicFacilitatorContract('__proto__'));
 for(const id of ['__proto__','R99'])assert.equal(getRoleBriefing(moduleId,id),null);
 for(const operation of ['unknown','__proto__'])assert.equal(changeAuthorityFor(moduleId,operation),null);
});

test('episode role hats and all-role independent PA approval retain exact authority',()=>{
 assert.deepEqual(ROLES.map(r=>({id:r.id,title:r.name})),getPublicBriefing(moduleId).roles.map(r=>({id:r.id,title:r.title})));
 assert.deepEqual(ACTIONS.find(a=>a.type==='APPROVE_PA_CHANGE').roles,[changeAuthorityFor(moduleId,'pa')]);
 assert.deepEqual(ACTIONS.find(a=>a.type==='PROPOSE_PA_CHANGE').roles,['R6']);
 for(const role of [...ids,'trainer']){const s=dispatch(createEpisode(),{role:'R6',type:'PROPOSE_PA_CHANGE'});if(role==='trainer')assert.equal(dispatch(s,{role,type:'APPROVE_PA_CHANGE'}).change.approved,true);else assert.throws(()=>dispatch(s,{role,type:'APPROVE_PA_CHANGE'}));}
 assert.equal(createEpisode().budget.initial,20);assert.equal(createEpisode().limits.technician,1);
});

test('built episode consumes exact canonical contract rather than unused metadata',()=>{
 const bundle=read('delivery/forty/forty-offline-bundle.js');
 assert(bundle.includes(read('public/training-contract-data.js').replace(/^export /gm,'')));
 assert.match(bundle,/getPublicBriefing/);assert.match(bundle,/changeAuthorityFor/);assert.match(bundle,/data-training-contract/);
 assert.match(read('delivery/forty/Mavi_Vadi_Kirk_Kisilik_Soz.html'),/SABİT METİN · CANLI AI DEĞİL/);
});

test('12-minute dependency closure does not require the separate 42-minute runtime',()=>{
 const files=['public/forty-engine.js','public/forty-ui.js','public/training-contract.js','public/training-contract-data.js','public/narrator-guide.js','public/facilitator-speech.js'];
 for(const path of files){const source=read(path);assert.doesNotMatch(source,/vertical-slice-engine|playable-ui|classroom-guide/);for(const match of source.matchAll(/from ['"]([^'"]+)['"]/g)){assert(match[1].startsWith('./'));assert(existsSync(new URL('../'+path+'/../'+match[1],import.meta.url)),match[1]);}}
});

test('legacy pilot GRC entrypoints and account runtime retain their prior source hashes',()=>{
 const protectedFiles={
  'content/itsm-v1.json':'8b2b100aef105f26f25506c2fccbcc7b7f61f6fbdfc5d27b658135e45e6a4c04',
  'content/grc-v1.json':'09b8f22e7cd9da90bef5574a097e57a65867ec962ec4da9791aca59fc737a592',
  'content/niles-itsm-setup.json':'fdf35f25af04eaf640fccd5fcd1de26a65062b4ca62f909eb7fbce8818891e7b',
  'public/index.html':'82325de9a7ab080436efd1278f7009e87cd61aac0dbd6232e1c37dc10e03f827',
  'public/app.js':'e0fa6d55ddff2e63ff4c5aa969eedde434f32e139e137d3af93549e2d630f25c',
  'public/itsm.js':'464f5479db80c03c326e6602c5f8c45253e5891ef977081b896913a257922cee',
  'server/app.js':'01946d3ec9cbb911190110c6aa27b632374fa0070224cf74d2d0c722e53e2129',
  'server/demo.js':'000574d380794b3a810fd3b2a480c2a028da67f08b996efaf4e9b5c4d59ccf2a',
  'server/handler.js':'c2b6da0a4d90d48353afcaefae6d82868e89bd3b8150f44e7c47facda47e7911'
 };
 for(const [path,expected] of Object.entries(protectedFiles))assert.equal(createHash('sha256').update(read(path)).digest('hex'),expected,path);
});
