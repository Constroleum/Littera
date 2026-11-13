/* Littera web/iPad: sustituye a Electron. Proporciona plumaProj, plumaTools, plumaSpell y litteraLic
   con almacenamiento local (IndexedDB) y sincronización opcional con OneDrive (onedrive.js). */
(function(){
'use strict';
const CFG=window.LITTERA_CFG||{};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);

/* ---------- IndexedDB ---------- */
let _db=null;
function db(){return _db||(_db=new Promise((res,rej)=>{const r=indexedDB.open('littera',1);
 r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('p'))d.createObjectStore('p',{keyPath:'id'});if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv')};
 r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))}
const tx=async(store,mode,f)=>{const d=await db();return new Promise((res,rej)=>{const t=d.transaction(store,mode),s=t.objectStore(store);let out;try{out=f(s)}catch(e){rej(e);return}t.oncomplete=()=>res(out&&out.result!==undefined?out.result:out);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})};
const getP=id=>tx('p','readonly',s=>s.get(id));
const putP=rec=>tx('p','readwrite',s=>s.put(rec));
const delP=id=>tx('p','readwrite',s=>s.delete(id));
const allP=()=>tx('p','readonly',s=>s.getAll());
const kvGet=k=>tx('kv','readonly',s=>s.get(k));
const kvSet=(k,v)=>tx('kv','readwrite',s=>s.put(v,k));
const stripWords=h=>String(h||'').replace(/<img[^>]*>/g,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').trim().split(/\s+/).filter(Boolean).length;
const countWords=d=>((d&&d.items)||[]).filter(i=>i.k==='d'||i.k==='s').reduce((a,i)=>a+stripWords(i.h),0);
const meta=(rec)=>({path:rec.id,name:rec.name,title:(rec.data&&rec.data.bk&&rec.data.bk.tit)||'',author:(rec.data&&rec.data.bk&&rec.data.bk.aut)||'',mtime:rec.mtime,words:rec.words||0,dir:rec.od?'OneDrive · '+(rec.od.folder||''):'Este dispositivo'});
const cleanName=n=>(String(n||'').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').replace(/[. ]+$/,'').trim()||'Proyecto sin título').slice(0,80);

/* ---------- licencia (Ed25519 con WebCrypto, sin conexión) ---------- */
const b64u=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a};
const DAY=864e5,TRIAL=CFG.trialDays!=null?CFG.trialDays:14;
let pubKey=null;
async function getPub(){if(pubKey)return pubKey;if(!CFG.publicKey)return null;
 const der=b64u(CFG.publicKey.replace(/-----[^-]+-----/g,'').replace(/\s+/g,'').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''));
 pubKey=await crypto.subtle.importKey('spki',der,{name:'Ed25519'},false,['verify']);return pubKey}
async function verifyKey(key){
 const m=/^LITTERA-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(key||'').replace(/\s+/g,''));
 if(!m)return{ok:false,error:'El formato de la clave no es válido.'};
 let ok=false;try{const k=await getPub();if(!k)return{ok:false,error:'Esta copia no incluye la clave pública de licencias.'};ok=await crypto.subtle.verify({name:'Ed25519'},k,b64u(m[2]),new TextEncoder().encode(m[1]))}
 catch(e){return{ok:false,error:'Este navegador no puede validar la clave (hace falta iPadOS 17 o superior).'}}
 if(!ok)return{ok:false,error:'La clave no es auténtica.'};
 let p;try{p=JSON.parse(new TextDecoder().decode(b64u(m[1])))}catch(e){return{ok:false,error:'La clave está dañada.'}}
 if(p.x&&Date.now()>p.x)return{ok:false,error:'La licencia caducó el '+new Date(p.x).toLocaleDateString('es-ES')+'.'};
 return{ok:true,p}}
async function licRead(){let d=null;try{d=await kvGet('lic')}catch(e){}let l={};try{l=JSON.parse(localStorage.getItem('littera-lic')||'{}')}catch(e){}
 // la fecha de primer uso es la más antigua de las dos copias
 const first=Math.min(d&&d.first||Infinity,l.first||Infinity);return{...l,...d,first:isFinite(first)?first:undefined}}
async function licWrite(o){try{localStorage.setItem('littera-lic',JSON.stringify(o))}catch(e){}try{await kvSet('lic',o)}catch(e){}}
async function licStatus(){
 const d=await licRead(),now=Date.now(),product={name:'Littera',buyUrl:CFG.buyUrl,seller:CFG.seller,supportEmail:CFG.supportEmail,trialDays:TRIAL};
 if(d.key){const v=await verifyKey(d.key);if(v.ok)return{state:'licensed',name:v.p.n,email:v.p.e,edition:v.p.t||'Pro',expires:v.p.x||null,product}}
 if(!d.first)d.first=now;if(d.seen&&now<d.seen-DAY)d.tampered=true;d.seen=Math.max(d.seen||0,now);await licWrite(d);
 const left=Math.ceil((d.first+TRIAL*DAY-now)/DAY);
 if(d.tampered||left<=0)return{state:'expired',daysLeft:0,product,tampered:!!d.tampered};
 return{state:'trial',daysLeft:left,product}}
window.litteraLic={status:licStatus,
 async activate(k){const v=await verifyKey(k);if(!v.ok)return v;const d=await licRead();d.key=String(k).replace(/\s+/g,'');await licWrite(d);return{ok:true,status:await licStatus()}},
 async remove(){const d=await licRead();delete d.key;await licWrite(d);return licStatus()},
 buy(){if(CFG.buyUrl)window.open(CFG.buyUrl,'_blank')},onShow(){}};
const LOCKED={ok:false,error:'La prueba ha terminado. Activa Littera con tu clave de licencia.'};
const locked=async()=>(await licStatus()).state==='expired';

/* ---------- modal sencillo ---------- */
window.__dlg=function(html,buttons){return new Promise(res=>{const o=document.createElement('div');
 o.style.cssText='position:fixed;inset:0;background:#0007;display:flex;align-items:center;justify-content:center;z-index:100000;font:15px system-ui,sans-serif';
 o.innerHTML=`<div style="background:#fbfaf7;color:#2b2a27;border-radius:12px;padding:20px 22px;width:min(480px,92vw);box-shadow:0 10px 40px #0007"><div>${html}</div><div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;justify-content:flex-end">${buttons.map((b,i)=>`<button data-i="${i}" style="padding:9px 14px;border-radius:8px;border:1px solid #8a4b2a;background:${b.pri?'#8a4b2a':'#fff'};color:${b.pri?'#fff':'#2b2a27'};font:inherit">${esc(b.t)}</button>`).join('')}</div></div>`;
 o.querySelectorAll('button').forEach(b=>b.onclick=()=>{o.remove();res(+b.dataset.i)});document.body.appendChild(o)})};

/* ---------- proyectos ---------- */
const params=new URLSearchParams(location.search);
const isEditor=!!window.__LITTERA_EDITOR;
let cur=null;      // registro abierto
let saveChain=Promise.resolve(),lastJson=null;
async function persistLocal(rec,data){rec.data=data;rec.mtime=Date.now();rec.words=countWords(data);if(data&&data.bk&&data.bk.tit&&!rec.od)rec.title=data.bk.tit;await putP(rec)}
window.plumaProj={
 data:()=>cur?cur.data:null,
 name:()=>cur?cur.name:'',
 save(d){if(!cur)return Promise.resolve({ok:false,error:'Sin proyecto abierto'});
  return saveChain=saveChain.then(async()=>{try{const j=JSON.stringify(d);if(j===lastJson)return{ok:true};await persistLocal(cur,d);lastJson=j;try{localStorage.removeItem('littera-pending:'+cur.id)}catch(e){}
   if(cur.od&&window.__od)window.__od.queue(cur);return{ok:true}}catch(e){return{ok:false,error:e.message}}})},
 saveSync(d){if(!cur)return true;try{localStorage.setItem('littera-pending:'+cur.id,JSON.stringify(d))}catch(e){}return true},
 async list(){const l=await allP();return l.sort((a,b)=>b.mtime-a.mtime).map(meta)},
 async create(n){if(await locked())return LOCKED;const name=cleanName(n),id=uid(),rec={id,name,data:{bk:{tit:name}},mtime:Date.now(),words:0};await putP(rec);return this.open(id)},
 async open(id){if(await locked())return LOCKED;location.href='editor.html?p='+encodeURIComponent(id);return{ok:true}},
 openDialog(){return new Promise(res=>{const i=document.createElement('input');i.type='file';i.accept='.littera,.pluma,.json,application/json';
  i.onchange=async()=>{const f=i.files[0];if(!f)return res({ok:false});try{const d=JSON.parse(await f.text());if(!d||typeof d!=='object')throw 0;
   const name=cleanName(f.name.replace(/\.(littera|pluma|json)$/i,'')),id=uid();await putP({id,name,data:d,mtime:Date.now(),words:countWords(d)});res(await this.open(id))}catch(e){res({ok:false,error:'El archivo no es un proyecto válido.'})}};i.click()})},
 async rename(id,n){const r=await getP(id);if(!r)return{ok:false,error:'No encontrado'};r.name=cleanName(n);await putP(r);return{ok:true}},
 async duplicate(id){const r=await getP(id);if(!r)return{ok:false,error:'No encontrado'};const c=JSON.parse(JSON.stringify(r));c.id=uid();c.name=r.name+' (copia)';delete c.od;c.mtime=Date.now();await putP(c);return{ok:true}},
 async remove(id){await delP(id);try{localStorage.removeItem('littera-pending:'+id)}catch(e){}return{ok:true}},
 async importLegacy(d,n){const id=uid();await putP({id,name:cleanName(n),data:d,mtime:Date.now(),words:countWords(d)});return this.open(id)},
 folder(){if(window.__od)window.__od.open()},
 async export(id){const r=await getP(id);if(!r)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r.data)],{type:'application/json'}));a.download=r.name+'.littera';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)},
 _get:getP,_put:putP,_all:allP,_del:delP,_uid:uid,_clean:cleanName,_count:countWords};
window.plumaSpell={set(){}};

/* ---------- corrector, tesauro, gramática ---------- */
const spell={};let hsMod=null;
const personal=new Set((()=>{try{return JSON.parse(localStorage.getItem('littera-personal')||'[]')}catch(e){return[]}})());
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('No se pudo cargar '+src));document.head.appendChild(s)})}
const DF={es:['es_ES'],ca:['ca'],en:['en_US','en_GB'],fr:['fr']};
async function speller(lang){const l=DF[lang]?lang:'es';
 if(!spell[l])spell[l]=(async()=>{if(!window.__hunspell)await loadScript('hs.js');if(!hsMod)hsMod=await window.__hunspell();
  const get=async f=>new Uint8Array(await (await fetch('dict/'+f)).arrayBuffer()),list=[];
  for(const base of DF[l]){const aff=hsMod.mountBuffer(await get(base+'.aff'),base+'.aff'),dic=hsMod.mountBuffer(await get(base+'.dic'),base+'.dic');list.push(hsMod.create(aff,dic))}
  return{spell:w=>list.some(x=>x.spell(w)),suggest:w=>list[0].suggest(w)}})();
 return spell[l]}
async function loadThes(lang){const k=DF[lang]?lang:'es';window.__thesData=window.__thesData||{};
 if(!window.__thesData[k])window.__thesData[k]=await (await fetch('dict/thes_'+k+'.json')).json();
 if(!window.__thesLookup)await loadScript('thes-core.js')}
const DICTS={rae:w=>w?'https://dle.rae.es/'+encodeURIComponent(w):'https://dle.rae.es/',iec:w=>w?'https://dlc.iec.cat/Results?DecEntradaText='+encodeURIComponent(w):'https://dlc.iec.cat/',mw:w=>w?'https://www.merriam-webster.com/dictionary/'+encodeURIComponent(w):'https://www.merriam-webster.com/',mwt:w=>w?'https://www.merriam-webster.com/thesaurus/'+encodeURIComponent(w):'https://www.merriam-webster.com/thesaurus',larousse:w=>w?'https://www.larousse.fr/dictionnaires/francais/'+encodeURIComponent(w):'https://www.larousse.fr/dictionnaires/francais/',cnrtl:w=>w?'https://www.cnrtl.fr/synonymie/'+encodeURIComponent(w):'https://www.cnrtl.fr/synonymie/',jane:w=>w?'https://sinonims.iec.cat/sinonims_cerca_sin.asp?pclau2='+encodeURIComponent(w):'https://sinonims.iec.cat/'};
window.plumaTools={
 async spellCheck(l,words){const sp=await speller(l);return words.map(w=>personal.has(w.toLowerCase())||sp.spell(w))},
 async spellSuggest(lang,word){const langs=lang==='all'?['es','ca','en','fr']:[lang],lists=[];
  for(const l of langs){try{lists.push((await speller(l)).suggest(word).slice(0,6))}catch(x){lists.push([])}}
  const out=[];for(let i=0;i<6;i++)lists.forEach(l=>{if(l[i]&&!out.includes(l[i]))out.push(l[i])});return out.slice(0,6)},
 async spellAdd(w){personal.add(w.toLowerCase());try{localStorage.setItem('littera-personal',JSON.stringify([...personal]))}catch(e){}return true},
 async thes(l,w){await loadThes(l);return window.__thesLookup(l,w)},
 async grammar(lang,text){try{const body=new URLSearchParams({text,language:{ca:'ca',es:'es',en:'en-US',fr:'fr'}[lang]||'auto',disabledRules:'MORFOLOGIK_RULE_ES,MORFOLOGIK_RULE_CA_ES,MORFOLOGIK_RULE_EN_US,MORFOLOGIK_RULE_EN_GB,HUNSPELL_RULE,HUNSPELL_NO_SUGGEST_RULE,FR_SPELLING_RULE'});
   if(!['ca','es','en','fr'].includes(lang))body.set('preferredVariants','es-ES,ca-ES,en-US,fr');
   const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),25000);
   const r=await fetch('https://api.languagetool.org/v2/check',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body,signal:ctl.signal});clearTimeout(t);
   if(!r.ok)return{ok:false,error:'El servidor respondió '+r.status};const j=await r.json();
   return{ok:true,matches:(j.matches||[]).map(m=>({o:m.offset,l:m.length,msg:m.message,rep:(m.replacements||[]).slice(0,5).map(x=>x.value),rule:m.rule&&m.rule.id}))}}
  catch(x){return{ok:false,error:'No se pudo conectar (¿hay internet?)'}}},
 edit(a){if(a==='copy'||a==='cut')document.execCommand(a);else if(a==='selectAll')document.execCommand('selectAll');
  else if(a==='paste'&&navigator.clipboard&&navigator.clipboard.readText)navigator.clipboard.readText().then(t=>document.execCommand('insertText',false,t)).catch(()=>{})},
 dict(k,w){const ww=String(w||'').trim().split(/\s+/)[0].replace(/^[^\p{L}]+|[^\p{L}]+$/gu,'');if(DICTS[k])window.open(DICTS[k](ww),'_blank')}};

/* ---------- arranque ---------- */
window.__littera=(async function(){
 if('serviceWorker'in navigator){try{await navigator.serviceWorker.register('sw.js')}catch(e){}}
 if(!isEditor)return;
 const id=params.get('p');cur=id?await getP(id):null;
 if(!cur){location.replace('index.html');return}
 try{const pend=localStorage.getItem('littera-pending:'+id);if(pend){const d=JSON.parse(pend);cur.data=d;cur.mtime=Date.now();cur.words=countWords(d);await putP(cur);localStorage.removeItem('littera-pending:'+id);if(cur.od)cur.od.dirty=1,await putP(cur)}}catch(e){}
 if(cur.od&&window.__od){try{cur=await window.__od.openSync(cur)||cur}catch(e){}}
 lastJson=JSON.stringify(cur.data);
 const need=['app.js','canvas.js','licgate.js'];for(const s of need)await loadScript(s);
 // botón para volver a la lista de proyectos
 const top=$('#top');if(top){const b=document.createElement('button');b.textContent='◂ Proyectos';b.title='Volver a la lista de proyectos';
  b.onclick=async()=>{try{await window.__plumaForce()}catch(e){}if(cur.od&&window.__od)await window.__od.flush(cur);location.href='index.html'};
  const lg=top.querySelector('.lg');top.insertBefore(b,lg||top.firstChild)}
 const hide=()=>{if(document.visibilityState==='hidden'){window.__plumaFlush&&window.__plumaFlush()}};
 document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',hide);
})();
})();
