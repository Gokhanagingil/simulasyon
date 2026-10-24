import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {createApp} from '../server/app.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('separate episode entrypoint and module assets are served without changing the legacy root',async t=>{
 const {server}=createApp({databasePath:':memory:',admin:{password:'synthetic-forty-test-password-3249'}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const path of ['/forty-visitors.html','/forty-visitors.css','/forty-engine.js','/forty-ui.js']){const response=await fetch(base+path);assert.equal(response.status,200,path);assert.ok((await response.text()).length>1000);}
 const root=await fetch(base+'/');assert.equal(await root.text(),read('public/index.html'));
});
test('offline episode is self-contained, syntax-valid, isolated, and its manifest matches exact bytes',()=>{
 const html=read('delivery/forty/Mavi_Vadi_Kirk_Kisilik_Soz.html');
 const manifest=JSON.parse(read('delivery/forty/artifact-manifest.json'));
 assert.equal(createHash('sha256').update(html).digest('hex'),manifest.sha256);
 assert.equal(Buffer.byteLength(html),manifest.bytes);
 assert.doesNotMatch(html,/<(?:script|link)\b[^>]*(?:src|href)=["']\.\//i);
 assert.match(html,/connect-src 'none'/);
 const script=html.match(/<script>([\s\S]*)<\/script>/)?.[1];assert.ok(script);new vm.Script(script);
 assert.doesNotMatch(read('public/forty-ui.js'),/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\s*[(.]/);
 assert.doesNotMatch(read('public/forty-engine.js'),/vertical-slice-engine|animal-encounter|Date\.now|Math\.random/);
});
test('episode source includes local-only boundaries, keyboard target, and both one-click reference panels',()=>{
 const html=read('public/forty-visitors.html'),ui=read('public/forty-ui.js');
 assert.match(html,/id="operations" tabindex="-1"/);
 assert.match(html,/data-reference="principles"/);assert.match(html,/data-reference="improvement"/);
 assert.match(html,/Kimlik doğrulama veya kişiye özel gizlilik sağlamaz/);
 assert.match(ui,/envelopeOpen=false;activeDescriptor=null/);
 assert.match(ui,/visibilitychange/);assert.match(ui,/Math\.floor\(tickCarry\)/);
});
