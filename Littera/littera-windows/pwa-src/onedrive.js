/* Littera web/iPad: sincronización de proyectos con OneDrive (Microsoft Graph, OAuth2 PKCE, sin servidor propio). */
(function(){
'use strict';
const CFG=window.LITTERA_CFG||{},P=()=>window.plumaProj;
const GRAPH='https://graph.microsoft.com/v1.0',AUTH='https://login.microsoftonline.com/common/oauth2/v2.0/',SCOPE='Files.ReadWrite offline_access User.Read';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const redirect=()=>new URL('./',location.href).href;
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const b64url=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const rnd=n=>b64url(crypto.getRandomValues(new Uint8Array(n)));
class AuthError extends Error{}
/* ---------- autenticación ---------- */
async function login(){
 if(!CFG.msClientId)return;
 const verifier=rnd(48),state=rnd(12),challenge=b64url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
 lsSet('littera-od-pkce',{verifier,state});
 location.href=AUTH+'authorize?'+new URLSearchParams({client_id:CFG.msClientId,response_type:'code',redirect_uri:redirect(),response_mode:'query',scope:SCOPE,state,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'});
}
async function tokenReq(body){
 const r=await fetch(AUTH+'token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:CFG.msClientId,scope:SCOPE,...body})});
 const j=await r.json();if(!r.ok)throw new AuthError(j.error_description||j.error||'auth');
 const t={at:j.access_token,rt:j.refresh_token||(lsGet('littera-od-tok')||{}).rt,exp:Date.now()+(j.expires_in||3600)*1000};lsSet('littera-od-tok',t);return t}
async function handleRedirect(){
 const q=new URLSearchParams(location.search);if(!q.get('code')&&!q.get('error'))return;
 const pk=lsGet('littera-od-pkce');history.replaceState(null,'',location.pathname);
 if(q.get('error')){window.__odMsg='No se pudo conectar con OneDrive: '+(q.get('error_description')||q.get('error'));return}
 if(!pk||pk.state!==q.get('state'))return;
 try{await tokenReq({grant_type:'authorization_code',code:q.get('code'),redirect_uri:redirect(),code_verifier:pk.verifier});localStorage.removeItem('littera-od-pkce');window.__odOpenAfter=1}
 catch(e){window.__odMsg='No se pudo conectar con OneDrive: '+e.message}}
const connected=()=>!!(lsGet('littera-od-tok')||{}).rt||!!(lsGet('littera-od-tok')||{}).at;
function logout(){try{localStorage.removeItem('littera-od-tok')}catch(e){}}
async function token(){let t=lsGet('littera-od-tok');if(!t)throw new AuthError('no-conectado');
 if(t.exp>Date.now()+60000)return t.at;
 if(!t.rt)throw new AuthError('caducado');
 try{return (await tokenReq({grant_type:'refresh_token',refresh_token:t.rt})).at}catch(e){logout();throw new AuthError('caducado')}}
async function g(path,opt={}){const at=await token();
 const r=await fetch(path.startsWith('http')?path:GRAPH+path,{...opt,headers:{Authorization:'Bearer '+at,...(opt.headers||{})}});
 if(r.status===401){logout();throw new AuthError('caducado')}return r}
const item=id=>id==='root'?'/me/drive/root':'/me/drive/items/'+id;
async function children(id){let url=item(id)+'/children?$select=id,name,folder,file,eTag,size&$top=200',out=[];
 while(url){const r=await g(url);if(!r.ok)throw new Error('OneDrive respondió '+r.status);const j=await r.json();out=out.concat(j.value||[]);url=j['@odata.nextLink']||null}return out}
async function download(id){const r=await g('/me/drive/items/'+id+'/content');if(!r.ok)throw new Error('No se pudo descargar ('+r.status+')');return r.text()}
async function remoteMeta(id){const r=await g('/me/drive/items/'+id+'?$select=id,name,eTag,parentReference');if(r.status===404)return null;if(!r.ok)throw new Error('OneDrive respondió '+r.status);return r.json()}
async function uploadTo(rec,{force}={}){
 const bytes=new TextEncoder().encode(JSON.stringify(rec.data)),od=rec.od,h={};
 let r;
 if(bytes.length<3.5*1048576){
  const url=od.itemId?'/me/drive/items/'+od.itemId+'/content':'/me/drive/items/'+od.parentId+':/'+encodeURIComponent(od.fileName)+':/content?@microsoft.graph.conflictBehavior=rename';
  if(od.itemId&&od.etag&&!force)h['If-Match']=od.etag;h['Content-Type']='application/json';
  r=await g(url,{method:'PUT',headers:h,body:bytes});
 }else{
  const url=od.itemId?'/me/drive/items/'+od.itemId+'/createUploadSession':'/me/drive/items/'+od.parentId+':/'+encodeURIComponent(od.fileName)+':/createUploadSession';
  if(od.itemId&&od.etag&&!force)h['If-Match']=od.etag;h['Content-Type']='application/json';
  const s=await g(url,{method:'POST',headers:h,body:JSON.stringify({item:{'@microsoft.graph.conflictBehavior':od.itemId?'replace':'rename'}})});
  if(!s.ok){r=s}else{const u=(await s.json()).uploadUrl;
   r=await fetch(u,{method:'PUT',headers:{'Content-Range':`bytes 0-${bytes.length-1}/${bytes.length}`},body:bytes})}
 }
 if(r.status===412)return{conflict:true};
 if(!r.ok)throw new Error('OneDrive respondió '+r.status);
 const j=await r.json();od.itemId=j.id;od.etag=j.eTag;od.fileName=j.name||od.fileName;od.dirty=0;od.last=Date.now();await P()._put(rec);return{ok:true}}

/* ---------- estado y cola de subida ---------- */
let badge=null,timer=null,busy=false,curRec=null;
function setBadge(t,bad){if(!badge){const f=document.querySelector('#foot');if(!f)return;badge=document.createElement('span');badge.id='odst';badge.style.cssText='margin-left:12px;font-size:12px';f.appendChild(badge)}
 badge.textContent=t;badge.style.color=bad?'#b3261e':'';badge.onclick=bad&&bad!==1?()=>{location.href='index.html'}:null}
async function conflict(rec){
 const c=await window.__dlg('<b>Este proyecto cambió en OneDrive</b><p style="margin:8px 0 0">Se modificó desde otro dispositivo después de tu última sincronización. No se perderá nada: la versión que no elijas se guarda como copia en este dispositivo.</p>',[{t:'Usar la de OneDrive'},{t:'Mantener la de este dispositivo',pri:1}]);
 const mk=async(data,suffix)=>{const id=P()._uid();await P()._put({id,name:rec.name+' ('+suffix+')',data,mtime:Date.now(),words:P()._count(data)})};
 if(c===0){const remote=JSON.parse(await download(rec.od.itemId)),m=await remoteMeta(rec.od.itemId);
  await mk(JSON.parse(JSON.stringify(rec.data)),'copia local');rec.data=remote;rec.od.etag=m.eTag;rec.od.dirty=0;rec.words=P()._count(remote);await P()._put(rec);return'remote'}
 const remote=await download(rec.od.itemId);try{await mk(JSON.parse(remote),'versión de OneDrive')}catch(e){}
 const m=await remoteMeta(rec.od.itemId);rec.od.etag=m&&m.eTag;await P()._put(rec);return'local'}
async function doUpload(rec,force){
 if(busy){clearTimeout(timer);timer=setTimeout(()=>doUpload(rec),1500);return}
 busy=true;setBadge('☁ Subiendo…',1);
 try{
  if(!navigator.onLine){setBadge('☁ Sin conexión: se subirá al volver',1);return}
  let r=await uploadTo(rec,{force});
  if(r.conflict){const w=await conflict(rec);if(w==='remote'){location.reload();return}r=await uploadTo(rec,{force:true})}
  setBadge('☁ Sincronizado '+new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}))
 }catch(e){setBadge(e instanceof AuthError?'☁ Vuelve a conectar OneDrive (pulsa aquí)':'☁ No se pudo subir: '+e.message,e instanceof AuthError?2:1)}
 finally{busy=false}}
function queue(rec){curRec=rec;rec.od.dirty=1;P()._put(rec);setBadge('☁ Pendiente de subir…',1);clearTimeout(timer);timer=setTimeout(()=>doUpload(rec),2500)}
async function flush(rec){clearTimeout(timer);if(rec&&rec.od&&rec.od.dirty&&navigator.onLine)await doUpload(rec)}
window.addEventListener('online',()=>{if(curRec&&curRec.od&&curRec.od.dirty)doUpload(curRec)});
async function openSync(rec){
 curRec=rec;
 if(!navigator.onLine||!connected()){setBadge(connected()?'☁ Sin conexión: trabajas con la copia local':'☁ OneDrive sin conectar (pulsa aquí)',connected()?1:2);return rec}
 try{const m=await remoteMeta(rec.od.itemId);
  if(!m){setBadge('☁ El archivo ya no está en OneDrive',2);return rec}
  if(m.eTag!==rec.od.etag){
   if(!rec.od.dirty){const d=JSON.parse(await download(rec.od.itemId));rec.data=d;rec.od.etag=m.eTag;rec.words=P()._count(d);await P()._put(rec)}
   else{const w=await conflict(rec);if(w==='local')await doUpload(rec,{force:true})}}
  else if(rec.od.dirty)doUpload(rec);
  setBadge('☁ Sincronizado');
 }catch(e){setBadge(e instanceof AuthError?'☁ Vuelve a conectar OneDrive (pulsa aquí)':'☁ OneDrive no disponible: '+e.message,e instanceof AuthError?2:1)}
 return rec}

/* ---------- ventana de OneDrive (lista de proyectos) ---------- */
function ui(){
 let o=document.querySelector('#odw');if(!o){o=document.createElement('div');o.id='odw';
  o.style.cssText='position:fixed;inset:0;background:#0007;display:flex;align-items:center;justify-content:center;z-index:99990;font:15px system-ui,sans-serif';document.body.appendChild(o)}
 return o}
const WRAP=h=>`<div style="background:#fbfaf7;color:#2b2a27;border-radius:12px;padding:18px 20px;width:min(560px,94vw);max-height:86vh;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 40px #0007">${h}</div>`;
const BTN='padding:9px 14px;border-radius:8px;border:1px solid #8a4b2a;background:#fff;color:#2b2a27;font:inherit;cursor:pointer';
const BTNP=BTN.replace('background:#fff','background:#8a4b2a').replace('color:#2b2a27','color:#fff');
function close(){const o=document.querySelector('#odw');if(o)o.remove()}
async function open(){
 const o=ui();
 if(!CFG.msClientId){o.innerHTML=WRAP(`<b style="font-size:18px">OneDrive no está configurado</b><p style="margin:0">Quien publica esta web debe registrar la aplicación en Microsoft Azure y poner su identificador en <code>build\\product.json</code> (campo <code>msClientId</code>). Los pasos están en IPAD-LEEME.txt.</p><div style="text-align:right"><button id="odx" style="${BTN}">Cerrar</button></div>`);o.querySelector('#odx').onclick=close;return}
 if(!connected()){o.innerHTML=WRAP(`<b style="font-size:18px">☁ Conectar con OneDrive</b><p style="margin:0">Trabaja con tus proyectos <code>.littera</code> guardados en tu OneDrive: se abren desde la nube y se guardan solos cuando escribes.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button id="odx" style="${BTN}">Cancelar</button><button id="odl" style="${BTNP}">Conectar con Microsoft</button></div>`);
  o.querySelector('#odx').onclick=close;o.querySelector('#odl').onclick=login;return}
 const stack=[{id:'root',name:'OneDrive'}];
 const render=async()=>{
  const here=stack[stack.length-1];o.innerHTML=WRAP(`<div style="display:flex;align-items:center;gap:8px"><b style="font-size:18px;flex:1">☁ OneDrive</b><button id="odo" style="${BTN};padding:5px 10px;font-size:13px">Desconectar</button><button id="odx" style="${BTN};padding:5px 10px">✕</button></div>
   <div style="color:#6f6a5e;font-size:13px">${stack.map((s,i)=>`<a data-i="${i}" style="color:#8a4b2a;cursor:pointer">${esc(s.name)}</a>`).join(' › ')}</div>
   <div id="odl" style="overflow:auto;flex:1;min-height:160px;border:1px solid #ddd8cc;border-radius:8px;background:#fff">Cargando…</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button id="odn" style="${BTN}">＋ Nuevo proyecto aquí</button><button id="odu" style="${BTN}">⬆ Subir uno de este dispositivo aquí</button></div>`);
  o.querySelector('#odx').onclick=close;o.querySelector('#odo').onclick=()=>{logout();open()};
  o.querySelectorAll('[data-i]').forEach(a=>a.onclick=()=>{stack.length=+a.dataset.i+1;render()});
  const box=o.querySelector('#odl');
  try{const l=await children(here.id),dirs=l.filter(x=>x.folder).sort((a,b)=>a.name.localeCompare(b.name)),files=l.filter(x=>x.file&&/\.(littera|pluma)$/i.test(x.name));
   box.innerHTML=(dirs.map(d=>`<div class="r" data-d="${d.id}" data-n="${esc(d.name)}" style="padding:11px 12px;border-bottom:1px solid #eee;cursor:pointer">📁 ${esc(d.name)}</div>`).join('')+files.map(f=>`<div class="r" data-f="${f.id}" style="padding:11px 12px;border-bottom:1px solid #eee;cursor:pointer;font-weight:600">📖 ${esc(f.name)} <small style="font-weight:400;color:#807b6f">${Math.round(f.size/1024)} KB</small></div>`).join(''))||'<div style="padding:14px;color:#807b6f">Esta carpeta no tiene carpetas ni proyectos .littera.</div>';
   box.querySelectorAll('[data-d]').forEach(e=>e.onclick=()=>{stack.push({id:e.dataset.d,name:e.dataset.n});render()});
   box.querySelectorAll('[data-f]').forEach(e=>e.onclick=async()=>{const f=files.find(x=>x.id===e.dataset.f);e.textContent='Abriendo…';
    try{const d=JSON.parse(await download(f.id)),id=P()._uid(),name=P()._clean(f.name.replace(/\.(littera|pluma)$/i,''));
     await P()._put({id,name,data:d,mtime:Date.now(),words:P()._count(d),od:{itemId:f.id,etag:f.eTag,fileName:f.name,parentId:here.id,folder:stack.map(s=>s.name).slice(1).join('/')||'(raíz)',dirty:0}});
     close();await P().open(id)}catch(x){e.textContent='No se pudo abrir: '+x.message}})
  }catch(x){if(x instanceof AuthError){box.innerHTML='<div style="padding:14px">La sesión de OneDrive ha caducado. <a id="odre" style="color:#8a4b2a;cursor:pointer;text-decoration:underline">Vuelve a conectar</a>.</div>';box.querySelector('#odre').onclick=login}else box.textContent='Error: '+x.message}
  o.querySelector('#odn').onclick=async()=>{const n=prompt('Nombre del nuevo proyecto');if(!n||!n.trim())return;
   const name=P()._clean(n),id=P()._uid(),rec={id,name,data:{bk:{tit:name}},mtime:Date.now(),words:0,od:{fileName:name+'.littera',parentId:here.id,folder:stack.map(s=>s.name).slice(1).join('/')||'(raíz)',dirty:1}};
   try{const r=await uploadTo(rec);if(r.conflict)throw new Error('conflicto');await P()._put(rec);close();await P().open(id)}catch(x){alert('No se pudo crear en OneDrive: '+x.message)}};
  o.querySelector('#odu').onclick=async()=>{const l=(await P()._all()).filter(r=>!r.od);if(!l.length){alert('No hay proyectos locales para subir.');return}
   const names=l.map((r,i)=>(i+1)+'. '+r.name).join('\n'),k=parseInt(prompt('¿Cuál subes a «'+here.name+'»? Escribe su número:\n\n'+names),10);const r0=l[k-1];if(!r0)return;
   r0.od={fileName:r0.name+'.littera',parentId:here.id,folder:stack.map(s=>s.name).slice(1).join('/')||'(raíz)',dirty:1};
   try{const r=await uploadTo(r0);if(r.conflict)throw new Error('conflicto');await P()._put(r0);alert('«'+r0.name+'» ya está en OneDrive y seguirá sincronizado.');close();if(typeof window.__reload==='function')window.__reload()}catch(x){delete r0.od;alert('No se pudo subir: '+x.message)}};
 };
 render()}
window.__od={open,queue,flush,openSync,connected,handleRedirect};
if(!window.__LITTERA_EDITOR){handleRedirect().then(()=>{if(window.__odMsg)alert(window.__odMsg);if(window.__odOpenAfter)open()})}
})();
