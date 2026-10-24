import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const moduleBody=source=>source.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const contractData=moduleBody(read('public/training-contract-data.js'));
const contract=moduleBody(read('public/training-contract.js'));
const engine=moduleBody(read('public/forty-engine.js'));
const teaching=moduleBody(read('public/teaching-panels.js'));
const speech=moduleBody(read('public/facilitator-speech.js'));
const narrator=moduleBody(read('public/narrator-guide.js'));
const ui=moduleBody(read('public/forty-ui.js'));
const escape="const e=value=>String(value??'').replace(/[&<>\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[ch]));";
const bundle=`'use strict';\nconst Training=(()=>{${contractData}\n${contract}\nreturn {trainingContract,getPublicBriefing,getRoleBriefing,changeAuthorityFor,publicFacilitatorContract};})();\nconst Narrator=(()=>{const {publicFacilitatorContract}=Training;\n${speech}\n${narrator}\nreturn {createPublicNarrator};})();\nconst Engine=(()=>{const {getPublicBriefing,changeAuthorityFor}=Training;\n${engine}\nreturn {ROLES,ACTIONS,createEpisode,dispatch,advance,getOutcome,getAvailableActions};})();\nconst Teaching=(()=>{${escape}\n${teaching}\nreturn {principles,improvementSteps};})();\n(()=>{const {ROLES,ACTIONS,createEpisode,dispatch,advance,getOutcome,getAvailableActions}=Engine;const {principles,improvementSteps}=Teaching;const {getPublicBriefing,getRoleBriefing,trainingContract}=Training;const {createPublicNarrator}=Narrator;\n${ui}\n})();`;
new vm.Script(bundle,{filename:'forty-offline-bundle.js'});
let html=read('public/forty-visitors.html')
 .replace('<link rel="stylesheet" href="./forty-visitors.css">',`<style>${read('public/forty-visitors.css')}</style>`)
 .replace('<script type="module" src="./forty-ui.js"></script>',`<script>${bundle.replace(/<\/script/gi,'<\\/script')}</script>`)
 .replace("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; object-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none'");
if(/<(?:script|link)\b[^>]*(?:src|href)=["']\.\//i.test(html))throw Error('Offline artifact contains an external local dependency.');
const dest=new URL('../delivery/forty/',import.meta.url);mkdirSync(dest,{recursive:true});
writeFileSync(new URL('Mavi_Vadi_Kirk_Kisilik_Soz.html',dest),html);
writeFileSync(new URL('forty-offline-bundle.js',dest),bundle);
const result={filename:'Mavi_Vadi_Kirk_Kisilik_Soz.html',bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex'),externalRuntimeDependencies:0,mode:'single-device-offline-simulation',sourceEntrypoint:'/forty-visitors.html',narration:{kind:'deterministic-public-script',liveAI:false,localVoiceOnly:true,microphone:false,contractVersion:'1.0.0'}};
writeFileSync(new URL('artifact-manifest.json',dest),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
