/* Littera web/iPad: sincronización de proyectos con OneDrive (Microsoft Graph, OAuth2 PKCE, sin servidor propio). */
(function(){
'use strict';
const CFG=window.LITTERA_CFG||{},P=()=>window.plumaProj;
const GRAPH='https://graph.microsoft.com/v1.0',AUTH='https://login.microsoftonline.com/common/oauth2/v2.0/',SCOPE='Files.ReadWrite offline_access User.Read',SCOPE_SP='Files.ReadWrite.All Sites.Read.All offline_access User.Read';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const redirect=()=>new URL('./',location.href).href;
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const b64url=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const rnd=n=>b64url(crypto.getRandomValues(new Uint8Array(n)));
class AuthError extends Error{}
/* ---------- autenticación ---------- */
async function login(sp){
 if(!CFG.msClientId)return;
 const verifier=rnd(48),state=rnd(12),challenge=b64url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
 lsSet('littera-od-pkce',{verifier,state,sp:!!sp});
 location.href=AUTH+'authorize?'+new URLSearchParams({client_id:CFG.msClientId,response_type:'code',redirect_uri:redirect(),response_mode:'query',scope:sp?SCOPE_SP:SCOPE,state,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'});
}
async function tokenReq(body,scope){
 const r=await fetch(AUTH+'token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:CFG.msClientId,scope:scope||(lsGet('littera-od-tok')||{}).sc||SCOPE,...body})});
 const j=await r.json();if(!r.ok)throw new AuthError(j.error_description||j.error||'auth');
 const t={at:j.access_token,rt:j.refresh_token||(lsGet('littera-od-tok')||{}).rt,exp:Date.now()+(j.expires_in||3600)*1000,sc:scope||(lsGet('littera-od-tok')||{}).sc||SCOPE};lsSet('littera-od-tok',t);return t}
async function handleRedirect(){
 const q=new URLSearchParams(location.search);if(!q.get('code')&&!q.get('error'))return;
 const pk=lsGet('littera-od-pkce');history.replaceState(null,'',location.pathname);
 if(q.get('error')){window.__odMsg='No se pudo conectar con OneDrive: '+(q.get('error_description')||q.get('error'));return}
 if(!pk||pk.state!==q.get('state'))return;
 try{await tokenReq({grant_type:'authorization_code',code:q.get('code'),redirect_uri:redirect(),code_verifier:pk.verifier},pk.sp?SCOPE_SP:SCOPE);localStorage.removeItem('littera-od-pkce');window.__odOpenAfter=1}
 catch(e){window.__odMsg='No se pudo conectar con OneDrive: '+e.message}}
const hasSP=()=>/Sites\.Read\.All/.test((lsGet('littera-od-tok')||{}).sc||'');
const connected=()=>!!(lsGet('littera-od-tok')||{}).rt||!!(lsGet('littera-od-tok')||{}).at;
function logout(){try{localStorage.removeItem('littera-od-tok')}catch(e){}}
async function token(){let t=lsGet('littera-od-tok');if(!t)throw new AuthError('no-conectado');
 if(t.exp>Date.now()+60000)return t.at;
 if(!t.rt)throw new AuthError('caducado');
 try{return (await tokenReq({grant_type:'refresh_token',refresh_token:t.rt})).at}catch(e){logout();throw new AuthError('caducado')}}
async function g(path,opt={}){const at=await token();
 const r=await fetch(path.startsWith('http')?path:GRAPH+path,{...opt,headers:{Authorization:'Bearer '+at,...(opt.headers||{})}});
 if(r.status===401){logout();throw new AuthError('caducado')}return r}
const dp=d=>d?'/drives/'+d:'/me/drive';
const item=(id,d)=>dp(d)+(id==='root'?'/root':'/items/'+id);
async function children(id,d){let url=item(id,d)+'/children?$select=id,name,folder,file,eTag,size&$top=200',out=[];
 while(url){const r=await g(url);if(!r.ok)throw new Error('OneDrive respondió '+r.status);const j=await r.json();out=out.concat(j.value||[]);url=j['@odata.nextLink']||null}return out}
async function download(id,d){const r=await g(dp(d)+'/items/'+id+'/content');if(!r.ok)throw new Error('No se pudo descargar ('+r.status+')');return r.text()}
async function remoteMeta(id,d){const r=await g(dp(d)+'/items/'+id+'?$select=id,name,eTag,parentReference');if(r.status===404)return null;if(!r.ok)throw new Error('OneDrive respondió '+r.status);return r.json()}
async function uploadTo(rec,{force}={}){
 const bytes=new TextEncoder().encode(JSON.stringify(rec.data)),od=rec.od,h={},D=dp(od.driveId);
 let r;
 if(bytes.length<3.5*1048576){
  const url=od.itemId?D+'/items/'+od.itemId+'/content':D+'/items/'+od.parentId+':/'+encodeURIComponent(od.fileName)+':/content?@microsoft.graph.conflictBehavior=rename';
  if(od.itemId&&od.etag&&!force)h['If-Match']=od.etag;h['Content-Type']='application/json';
  r=await g(url,{method:'PUT',headers:h,body:bytes});
 }else{
  const url=od.itemId?D+'/items/'+od.itemId+'/createUploadSession':D+'/items/'+od.parentId+':/'+encodeURIComponent(od.fileName)+':/createUploadSession';
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
 const c=await window.__dlg('<b>Este proyecto cambió en la nube</b><p style="margin:8px 0 0">Se modificó desde otro dispositivo después de tu última sincronización. No se perderá nada: la versión que no elijas se guarda como copia en este dispositivo.</p>',[{t:'Usar la de la nube'},{t:'Mantener la de este dispositivo',pri:1}]);
 const mk=async(data,suffix)=>{const id=P()._uid();await P()._put({id,name:rec.name+' ('+suffix+')',data,mtime:Date.now(),words:P()._count(data)})};
 if(c===0){const remote=JSON.parse(await download(rec.od.itemId,rec.od.driveId)),m=await remoteMeta(rec.od.itemId,rec.od.driveId);
  await mk(JSON.parse(JSON.stringify(rec.data)),'copia local');rec.data=remote;rec.od.etag=m.eTag;rec.od.dirty=0;rec.words=P()._count(remote);await P()._put(rec);return'remote'}
 const remote=await download(rec.od.itemId,rec.od.driveId);try{await mk(JSON.parse(remote),'versión de OneDrive')}catch(e){}
 const m=await remoteMeta(rec.od.itemId,rec.od.driveId);rec.od.etag=m&&m.eTag;await P()._put(rec);return'local'}
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
 try{const m=await remoteMeta(rec.od.itemId,rec.od.driveId);
  if(!m){setBadge('☁ El archivo ya no está en OneDrive',2);return rec}
  if(m.eTag!==rec.od.etag){
   if(!rec.od.dirty){const d=JSON.parse(await download(rec.od.itemId,rec.od.driveId));rec.data=d;rec.od.etag=m.eTag;rec.words=P()._count(d);await P()._put(rec)}
   else{const w=await conflict(rec);if(w==='local')await doUpload(rec,{force:true})}}
  else if(rec.od.dirty)doUpload(rec);
  setBadge('☁ Sincronizado');
 }catch(e){setBadge(e instanceof AuthError?'☁ Vuelve a conectar OneDrive (pulsa aquí)':'☁ OneDrive no disponible: '+e.message,e instanceof AuthError?2:1)}
 return rec}

/* ---------- ventana de OneDrive / SharePoint (lista de proyectos) ---------- */
function ui(){
 let o=document.querySelector('#odw');if(!o){o=document.createElement('div');o.id='odw';
  o.style.cssText='position:fixed;inset:0;background:#0007;display:flex;align-items:center;justify-content:center;z-index:99990;font:15px system-ui,sans-serif';document.body.appendChild(o)}
 return o}
const WRAP=h=>`<div style="background:#fbfaf7;color:#2b2a27;border-radius:12px;padding:18px 20px;width:min(560px,94vw);max-height:86vh;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 40px #0007">${h}</div>`;
const BTN='padding:9px 14px;border-radius:8px;border:1px solid #8a4b2a;background:#fff;color:#2b2a27;font:inherit;cursor:pointer';
const BTNP=BTN.replace('background:#fff','background:#8a4b2a').replace('color:#2b2a27','color:#fff');
const ROW='padding:11px 12px;border-bottom:1px solid #eee;cursor:pointer';
function close(){const o=document.querySelector('#odw');if(o)o.remove()}
const isProj=n=>/\.(littera|pluma)$/i.test(n);
const HEAD=(t,extra)=>`<div style="display:flex;align-items:center;gap:8px"><b style="font-size:18px;flex:1">${t}</b>${extra||''}<button id="odx" style="${BTN};padding:5px 10px">✕</button></div>`;
const folderPath=stack=>stack.map(s=>s.name).slice(1).join('/')||'(raíz)';
/* enlaces de SharePoint / OneDrive: se resuelven con la API de "shares" */
async function resolveLink(url){
 const enc='u!'+btoa(unescape(encodeURIComponent(url.trim()))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const r=await g('/shares/'+enc+'/driveItem?$select=id,name,eTag,size,file,folder,parentReference');
 if(r.status===403||r.status===401)throw new Error('No tienes acceso a ese enlace, o falta permitir SharePoint (permisos).');
 if(!r.ok)throw new Error('No se pudo abrir el enlace ('+r.status+')');return r.json()}
async function listSites(q){const out=new Map();
 const add=async url=>{try{const r=await g(url);if(r.ok)((await r.json()).value||[]).forEach(x=>{if(x.id&&(x.displayName||x.name))out.set(x.id,x)})}catch(e){if(e instanceof AuthError)throw e}};
 if(!q)await add('/me/followedSites?$select=id,displayName,webUrl');
 await add('/sites?search='+encodeURIComponent(q||'*')+'&$select=id,displayName,webUrl&$top=40');
 return [...out.values()].sort((a,b)=>(a.displayName||a.name).localeCompare(b.displayName||b.name))}
async function siteDrives(id){const r=await g('/sites/'+id+'/drives?$select=id,name,webUrl');if(!r.ok)throw new Error('SharePoint respondió '+r.status);return (await r.json()).value||[]}
async function adopt(f,drv,parentId,folder){ // crea el registro local enlazado y abre el editor
 const d=JSON.parse(await download(f.id,drv)),id=P()._uid(),name=P()._clean(f.name.replace(/\.(littera|pluma)$/i,''));
 await P()._put({id,name,data:d,mtime:Date.now(),words:P()._count(d),od:{itemId:f.id,etag:f.eTag,fileName:f.name,parentId,driveId:drv||undefined,folder,dirty:0}});
 close();await P().open(id)}
async function open(){
 const o=ui(),bind=()=>{const x=o.querySelector('#odx');if(x)x.onclick=close};
 const show=h=>{o.innerHTML=WRAP(h);bind()};
 if(!CFG.msClientId){show(`<b style="font-size:18px">OneDrive no está configurado</b><p style="margin:0">Quien publica esta web debe registrar la aplicación en Microsoft Azure y poner su identificador en <code>build\\product.json</code> (campo <code>msClientId</code>). Los pasos están en IPAD-LEEME.txt.</p><div style="text-align:right"><button id="odx" style="${BTN}">Cerrar</button></div>`);return}
 if(!connected()){show(`<b style="font-size:18px">☁ Conectar con Microsoft</b><p style="margin:0">Trabaja con tus proyectos <code>.littera</code> guardados en OneDrive o SharePoint: se abren desde la nube y se guardan solos cuando escribes.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button id="odx" style="${BTN}">Cancelar</button><button id="odl" style="${BTNP}">Conectar con Microsoft</button></div>`);
  o.querySelector('#odl').onclick=()=>login(false);return}
 const logoutBtn=`<button id="odo" style="${BTN};padding:5px 10px;font-size:13px">Desconectar</button>`;
 const start=()=>{
  show(HEAD('☁ OneDrive y SharePoint',logoutBtn)+`<div style="display:flex;flex-direction:column;gap:8px">
   <button id="s1" style="${BTN};text-align:left">☁ <b>Mi OneDrive</b><br><small>Carpetas y archivos de tu cuenta</small></button>
   <button id="s2" style="${BTN};text-align:left">🏢 <b>SharePoint</b><br><small>Sitios y bibliotecas de documentos de tu organización</small></button>
   <button id="s3" style="${BTN};text-align:left">🔗 <b>Pegar un enlace</b><br><small>Dirección de un archivo .littera (o carpeta) de SharePoint u OneDrive</small></button></div>`);
  o.querySelector('#odo').onclick=()=>{logout();open()};
  o.querySelector('#s1').onclick=()=>browse([{id:'root',name:'OneDrive',drv:null}]);
  o.querySelector('#s2').onclick=()=>needSP(sitesView);
  o.querySelector('#s3').onclick=()=>needSP(linkView)};
 const needSP=f=>{if(hasSP())return f();
  show(HEAD('🏢 Permitir SharePoint')+`<p style="margin:0">Para trabajar con archivos de SharePoint, Microsoft te pedirá un permiso adicional (leer tus sitios y editar archivos a los que tengas acceso). En algunas organizaciones lo debe aprobar el administrador de TI.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button id="b1" style="${BTN}">Volver</button><button id="b2" style="${BTNP}">Continuar</button></div>`);
  o.querySelector('#b1').onclick=start;o.querySelector('#b2').onclick=()=>login(true)};
 const linkView=()=>{
  show(HEAD('🔗 Abrir desde un enlace')+`<p style="margin:0">Pega la dirección del archivo <code>.littera</code> en SharePoint (botón «Copiar vínculo» o la dirección del navegador).</p><input id="lk" placeholder="https://empresa.sharepoint.com/…/Novela.littera" style="padding:10px;border:1px solid #ccc;border-radius:8px;font:inherit"><div id="lm" style="color:#b3261e;min-height:18px"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button id="b1" style="${BTN}">Volver</button><button id="b2" style="${BTNP}">Abrir</button></div>`);
  o.querySelector('#b1').onclick=start;
  o.querySelector('#b2').onclick=async()=>{const u=o.querySelector('#lk').value.trim(),m=o.querySelector('#lm');if(!/^https?:\/\//i.test(u)){m.textContent='Pega una dirección que empiece por https://';return}
   m.style.color='#6f6a5e';m.textContent='Abriendo…';
   try{const it=await resolveLink(u),pr=it.parentReference||{};
    if(it.folder)return browse([{id:it.id,name:it.name,drv:pr.driveId||null}]);
    if(!isProj(it.name)){m.style.color='#b3261e';m.textContent='Ese archivo no es un proyecto .littera.';return}
    await adopt(it,pr.driveId,pr.id,'SharePoint')}
   catch(x){m.style.color='#b3261e';m.textContent=x instanceof AuthError?'La sesión ha caducado. Vuelve a conectar.':x.message}}};
 const sitesView=async(q)=>{
  show(HEAD('🏢 SharePoint')+`<div style="display:flex;gap:6px"><input id="sq" placeholder="Buscar un sitio…" value="${esc(q||'')}" style="flex:1;padding:9px;border:1px solid #ccc;border-radius:8px;font:inherit"><button id="sg" style="${BTN}">Buscar</button></div><div id="sl" style="overflow:auto;flex:1;min-height:180px;border:1px solid #ddd8cc;border-radius:8px;background:#fff">Cargando…</div><div style="display:flex;gap:8px"><button id="b1" style="${BTN}">Volver</button></div>`);
  o.querySelector('#b1').onclick=start;const go=()=>sitesView(o.querySelector('#sq').value.trim());o.querySelector('#sg').onclick=go;o.querySelector('#sq').onkeydown=e=>{if(e.key==='Enter')go()};
  const box=o.querySelector('#sl');
  try{const l=await listSites(q);box.innerHTML=l.map(x=>`<div style="${ROW}" data-s="${esc(x.id)}" data-n="${esc(x.displayName||x.name)}">🏢 ${esc(x.displayName||x.name)}<br><small style="color:#807b6f">${esc(x.webUrl||'')}</small></div>`).join('')||'<div style="padding:14px;color:#807b6f">No se han encontrado sitios. Prueba a buscar por nombre o pega un enlace.</div>';
   box.querySelectorAll('[data-s]').forEach(e=>e.onclick=async()=>{box.textContent='Cargando bibliotecas…';
    try{const dr=await siteDrives(e.dataset.s);
     if(dr.length===1)return browse([{id:'root',name:e.dataset.n,drv:null,lib:1},{id:'root',name:dr[0].name,drv:dr[0].id}]);
     box.innerHTML=dr.map(d=>`<div style="${ROW}" data-d="${esc(d.id)}" data-n="${esc(d.name)}">📚 ${esc(d.name)}</div>`).join('')||'<div style="padding:14px">Este sitio no tiene bibliotecas.</div>';
     box.querySelectorAll('[data-d]').forEach(x=>x.onclick=()=>browse([{id:'root',name:e.dataset.n,drv:null,lib:1},{id:'root',name:x.dataset.n,drv:x.dataset.d}]))}catch(x){box.textContent='Error: '+x.message}})
  }catch(x){box.innerHTML=x instanceof AuthError?'<div style="padding:14px">La sesión ha caducado. Vuelve a conectar.</div>':'<div style="padding:14px">Error: '+esc(x.message)+'</div>'}};
 const browse=async stack=>{
  const here=stack[stack.length-1],drv=here.drv||null;
  o.innerHTML=WRAP(HEAD('☁ '+esc(stack[0].name),`<button id="odh" style="${BTN};padding:5px 10px;font-size:13px">Inicio</button>`)+
   `<div style="color:#6f6a5e;font-size:13px">${stack.map((s,i)=>`<a data-i="${i}" style="color:#8a4b2a;cursor:pointer">${esc(s.name)}</a>`).join(' › ')}</div>
   <div id="odl" style="overflow:auto;flex:1;min-height:160px;border:1px solid #ddd8cc;border-radius:8px;background:#fff">Cargando…</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button id="odn" style="${BTN}">＋ Nuevo proyecto aquí</button><button id="odu" style="${BTN}">⬆ Subir uno de este dispositivo aquí</button></div>`);bind();
  o.querySelector('#odh').onclick=start;
  o.querySelectorAll('[data-i]').forEach(a=>a.onclick=()=>{const i=+a.dataset.i;if(stack[i].lib)return sitesView();browse(stack.slice(0,i+1))});
  const box=o.querySelector('#odl');
  try{const l=await children(here.id,drv),dirs=l.filter(x=>x.folder).sort((a,b)=>a.name.localeCompare(b.name)),files=l.filter(x=>x.file&&isProj(x.name));
   box.innerHTML=(dirs.map(d=>`<div style="${ROW}" data-d="${d.id}" data-n="${esc(d.name)}">📁 ${esc(d.name)}</div>`).join('')+files.map(f=>`<div style="${ROW};font-weight:600" data-f="${f.id}">📖 ${esc(f.name)} <small style="font-weight:400;color:#807b6f">${Math.round(f.size/1024)} KB</small></div>`).join(''))||'<div style="padding:14px;color:#807b6f">Esta carpeta no tiene carpetas ni proyectos .littera.</div>';
   box.querySelectorAll('[data-d]').forEach(e=>e.onclick=()=>browse(stack.concat({id:e.dataset.d,name:e.dataset.n,drv})));
   box.querySelectorAll('[data-f]').forEach(e=>e.onclick=async()=>{const f=files.find(x=>x.id===e.dataset.f);e.textContent='Abriendo…';
    try{await adopt(f,drv,here.id,folderPath(stack.filter(s=>!s.lib)))}catch(x){e.textContent='No se pudo abrir: '+x.message}})
  }catch(x){if(x instanceof AuthError){box.innerHTML='<div style="padding:14px">La sesión ha caducado. <a id="odre" style="color:#8a4b2a;cursor:pointer;text-decoration:underline">Vuelve a conectar</a>.</div>';box.querySelector('#odre').onclick=()=>login(hasSP())}else box.textContent='Error: '+x.message}
  o.querySelector('#odn').onclick=async()=>{const n=prompt('Nombre del nuevo proyecto');if(!n||!n.trim())return;
   const name=P()._clean(n),id=P()._uid(),rec={id,name,data:{bk:{tit:name}},mtime:Date.now(),words:0,od:{fileName:name+'.littera',parentId:here.id,driveId:drv||undefined,folder:folderPath(stack.filter(s=>!s.lib)),dirty:1}};
   try{const r=await uploadTo(rec);if(r.conflict)throw new Error('conflicto');await P()._put(rec);close();await P().open(id)}catch(x){alert('No se pudo crear en la nube: '+x.message)}};
  o.querySelector('#odu').onclick=async()=>{const l=(await P()._all()).filter(r=>!r.od);if(!l.length){alert('No hay proyectos locales para subir.');return}
   const names=l.map((r,i)=>(i+1)+'. '+r.name).join('\n'),k=parseInt(prompt('¿Cuál subes a «'+here.name+'»? Escribe su número:\n\n'+names),10);const r0=l[k-1];if(!r0)return;
   r0.od={fileName:r0.name+'.littera',parentId:here.id,driveId:drv||undefined,folder:folderPath(stack.filter(s=>!s.lib)),dirty:1};
   try{const r=await uploadTo(r0);if(r.conflict)throw new Error('conflicto');await P()._put(r0);alert('«'+r0.name+'» ya está en la nube y seguirá sincronizado.');close();if(typeof window.__reload==='function')window.__reload()}catch(x){delete r0.od;alert('No se pudo subir: '+x.message)}};
 };
 start()}
window.__od={open,queue,flush,openSync,connected,handleRedirect};
if(!window.__LITTERA_EDITOR){handleRedirect().then(()=>{if(window.__odMsg)alert(window.__odMsg);if(window.__odOpenAfter)open()})}
})();
