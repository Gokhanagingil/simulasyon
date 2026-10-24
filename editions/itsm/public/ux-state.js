// Device-local drafts only. Never persist credentials or hidden revision tokens.
export function captureFields(root) {
  return [...root.querySelectorAll('input,textarea,select')].filter(el=>el.type!=='password'&&el.type!=='hidden'&&el.type!=='file').map((el,index)=>({index,name:el.name,id:el.id,value:el.value,checked:el.checked}));
}
export function restoreFields(root,fields) {
  const controls=[...root.querySelectorAll('input,textarea,select')].filter(el=>el.type!=='password'&&el.type!=='hidden'&&el.type!=='file');
  for(const saved of fields||[]){const el=controls[saved.index];if(el&&el.name===saved.name&&el.id===saved.id){el.value=saved.value;if(['checkbox','radio'].includes(el.type))el.checked=saved.checked;}}
}
export function draftKey(user,workshop,form,operation='',record=''){return `itsm-form-${user}-${workshop}-${form}-${operation}-${record}`;}
export function controlKey(el){
 if(!el)return null;
 if(el.id)return 'id:'+el.id;
 const data=el.dataset||{},keys=['action','id','record','op','option','view','learning','studio','event','member','filter','localSearch','learningFilter'];
 const stable=keys.filter(k=>data[k]!==undefined).map(k=>[k,data[k]]);
 if(stable.length)return el.tagName+JSON.stringify(stable);
 if(el.name)return `${el.tagName}:${el.closest?.('form')?.dataset.form||''}:${el.name}`;
 const href=el.getAttribute?.('href');if(href)return 'link:'+href;
 const text=el.textContent?.trim();return text?`${el.tagName}:${text}`:null;
}
function detailKey(el){
 const article=el.closest?.('article'),section=el.closest?.('section');
 return JSON.stringify([article?.dataset.articleId||article?.querySelector('h2,h3')?.textContent||'',section?.id||section?.getAttribute('aria-label')||'',el.querySelector?.('summary')?.textContent||'']);
}
export function preserveView(root,render) {
  const standalone=captureFields({querySelectorAll:q=>[...root.querySelectorAll(q)].filter(el=>!el.closest?.('form')&&el.matches?.('[data-learning-filter],[data-local-search]'))});
  const forms=[...root.querySelectorAll('form')].map(f=>({kind:f.dataset.form,fields:captureFields(f)}));
  const active=document.activeElement, all=[...root.querySelectorAll('input,textarea,select,button,a,summary')], key=all.includes(active)?controlKey(active):null, start=active?.selectionStart,end=active?.selectionEnd;
  const opened=new Map([...root.querySelectorAll('details')].map(x=>[detailKey(x),x.open])),scroll=window.scrollY;
  render();
  restoreFields({querySelectorAll:q=>[...root.querySelectorAll(q)].filter(el=>!el.closest?.('form')&&el.matches?.('[data-learning-filter],[data-local-search]'))},standalone);
  for(const saved of forms){const f=[...root.querySelectorAll('form')].find(f=>f.dataset.form===saved.kind);if(f)restoreFields(f,saved.fields);}
  const details=[...root.querySelectorAll('details')];details.forEach(x=>{const key=detailKey(x);if(opened.has(key)&&details.filter(y=>detailKey(y)===key).length===1)x.open=opened.get(key);});
  const matches=key?[...root.querySelectorAll('input,textarea,select,button,a,summary')].filter(el=>controlKey(el)===key):[];const next=matches.length===1?matches[0]:null;
  if(next&&!next.disabled){next.focus({preventScroll:true});if(typeof start==='number'&&next.setSelectionRange)try{next.setSelectionRange(start,end);}catch{}}
  window.scrollTo({top:scroll});
}
