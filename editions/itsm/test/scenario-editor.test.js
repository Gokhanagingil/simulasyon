import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScenarioEditor } from '../public/scenario-editor.js';
import { loadScenario } from '../server/content.js';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function editor(api){
  const values=new Map();
  globalThis.sessionStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  globalThis.document={querySelector:()=>null,querySelectorAll:()=>[]};
  return createScenarioEditor({api,escape:String,onSaved:async()=>{},toast:()=>{}});
}
test('a slower previous workshop cannot replace the selected scenario',async()=>{
  const first=deferred(),second=deferred();
  const ui=editor(path=>path.includes('/first/')?first.promise:second.promise);
  const a=ui.load('first',[]),b=ui.load('second',[]);
  const secondPack=loadScenario();secondPack.name='Second workshop';
  second.resolve({revision:2,pack:secondPack});await b;
  first.resolve({revision:1,pack:loadScenario()});await a;
  assert.match(ui.render(),/Second workshop/);assert.match(ui.render(),/Sürüm 2/);
});
test('logout invalidates an in-flight editor load',async()=>{
  const pending=deferred(),ui=editor(()=>pending.promise);
  const loading=ui.load('first',[]);ui.clear();
  pending.resolve({revision:1,pack:loadScenario()});await loading;
  assert.match(ui.render(),/yükleniyor/);assert.equal(ui.hasDraft(),false);
});
test('saving through two visible save buttons creates one write',async()=>{
  const pending=deferred();let writes=0;
  const ui=editor(async(path,method)=>{if(method==='PUT'){writes++;return pending.promise;}return {revision:1,pack:loadScenario()};});
  await ui.load('first',[]);
  const a=ui.action({dataset:{studio:'save'}}),b=ui.action({dataset:{studio:'save'}});
  await b;assert.equal(writes,1);pending.resolve({revision:2,pack:loadScenario()});await a;
  assert.equal(ui.hasDraft(),false);assert.match(ui.render(),/Sürüm 2/);
});
