import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const body=s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const digest=s=>createHash('sha256').update(s).digest('hex');

test('offline artifact contains exact current engine, UI and teaching source with matching manifest',()=>{const html=read('delivery/forty/Mavi_Vadi_Kirk_Kisilik_Soz.html'),bundle=read('delivery/forty/forty-offline-bundle.js'),manifest=JSON.parse(read('delivery/forty/artifact-manifest.json'));assert.equal(manifest.bytes,Buffer.byteLength(html));assert.equal(manifest.sha256,digest(html));assert.ok(bundle.includes(body(read('public/forty-engine.js'))));assert.ok(bundle.includes(body(read('public/forty-ui.js'))));assert.ok(bundle.includes(body(read('public/narrator-guide.js'))));assert.ok(bundle.includes(body(read('public/facilitator-speech.js'))));assert.ok(bundle.includes(body(read('public/teaching-panels.js'))));assert.ok(html.includes(`<style>${read('public/forty-visitors.css')}</style>`));const embedded=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.equal(embedded,bundle.replace(/<\/script/gi,'<\\/script'));assert.doesNotThrow(()=>new vm.Script(bundle));assert.equal(manifest.externalRuntimeDependencies,0);assert.match(html,/connect-src 'none'/);assert.doesNotMatch(html.replace(/<script>[\s\S]*?<\/script>/g,''),/<(?:script|link)\b[^>]*(?:src|href)=["'](?:https?:|\.\/)/i);});
