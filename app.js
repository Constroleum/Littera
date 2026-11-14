
(function(){
const KEY="pluma-v1",$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,9);
let S=null;
if(window.plumaProj){S=plumaProj.data()}else{try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}}
if(!S||!S.items)S={sel:"c",target:0,items:[
 {id:"a",t:"Manuscrito",k:"f",p:null,h:"",s:"",n:"",st:"Borrador",o:1},
 {id:"b",t:"Capítulo 1",k:"f",p:"a",h:"",s:"",n:"",st:"Borrador",o:1},
 {id:"c",t:"Escena 1",k:"d",p:"b",h:"<h1>Escena 1</h1><p>Empieza a escribir aquí. Usa la barra superior como en Word, y el clasificador de la izquierda para organizar tu obra.</p>",s:"Primera escena.",n:"",st:"Borrador"},
 {id:"r",t:"Investigación",k:"f",p:null,h:"",s:"",n:"",st:"Pendiente",o:0}]};
let view="ed",dragId=null,timer=null,range=null;
const page=$("#page"),get=id=>S.items.find(i=>i.id===id),cur=()=>get(S.sel)||S.items[0];
const kids=p=>S.items.filter(i=>i.p===p);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const words=h=>{const d=document.createElement("div");d.innerHTML=(h||"").replace(/<img[^>]*>/g,"");const t=(d.innerText||d.textContent||"").replace(/\u200B/g,"").trim();return t?t.split(/\s+/).length:0};
let dirty=false;
const persist=async()=>{if(window.plumaProj){const r=await plumaProj.save(S);if(!r||!r.ok)throw new Error(r&&r.error||"error")}else localStorage.setItem(KEY,JSON.stringify(S));dirty=false};
const flush=async()=>{const e=$("#sv");clearTimeout(timer);try{await persist();e.textContent="Guardado"}catch(x){e.textContent="⚠ No se pudo guardar"}};
window.__plumaFlush=()=>dirty?flush():Promise.resolve();
window.__plumaForce=flush;
window.addEventListener("beforeunload",()=>{if(dirty&&window.plumaProj){try{plumaProj.saveSync(S)}catch(x){}}});
function save(){dirty=true;$("#sv").textContent="Guardando…";clearTimeout(timer);timer=setTimeout(flush,400)}
function isDesc(id,anc){let i=get(id);while(i){if(i.p===anc)return true;i=get(i.p)}return false}
function renderTree(){
 const t=$("#tree");t.innerHTML="";
 (function walk(p,d){kids(p).forEach(i=>{
  const r=document.createElement("div");r.className="it"+(i.id===S.sel?" sel":"");r.style.paddingLeft=(8+d*16)+"px";r.draggable=true;
  r.innerHTML=`<span class="c">${i.k==="f"?(i.o?"▾":"▸"):"•"}</span><span>${ICON[i.k]||"📄"} ${esc(i.t)}</span>`;
  r.onclick=e=>{if(i.k==="f"&&e.target.classList.contains("c"))i.o=i.o?0:1;else select(i.id);renderTree();save()};
  r.ondragstart=()=>{dragId=i.id};
  r.ondragover=e=>{e.preventDefault();r.classList.add("drop")};r.ondragleave=()=>r.classList.remove("drop");
  r.ondrop=e=>{e.preventDefault();r.classList.remove("drop");if(!dragId||dragId===i.id||isDesc(i.id,dragId))return;
   const m=get(dragId);S.items=S.items.filter(x=>x!==m);
   if(i.k==="f"){m.p=i.id;i.o=1;S.items.push(m)}else{m.p=i.p;S.items.splice(S.items.indexOf(i),0,m)}
   dragId=null;renderTree();save()};
  t.appendChild(r);
  if(i.k==="f"&&i.o)walk(i.id,d+1)})})(null,0);
}
function select(id){commit();range=null;S.sel=id;const i=cur();$("#ttl").value=i.t;page.innerHTML=i.h||"<p><br></p>";
 $("#iSyn").value=i.s||"";$("#iNo").value=i.n||"";$("#iNc").checked=!!i.nc;$("#iSt").value=i.st||"Borrador";$("#iTg").value=S.target||"";renderMeta();
 $(".mb")&&document.body.classList.remove("showB");renderTree();if(view==="ck")renderCork();if(view==="lc"&&window.__LC)window.__LC.refresh();stats();save()}
let ready=false;
const clean=h=>h.replace(/\u200B/g,"");
function commit(){if(!ready)return;const i=get(S.sel);if(i)i.h=clean(page.innerHTML)}
function stats(){const i=cur(),w=words(page.innerHTML);if(ready)i.h=clean(page.innerHTML);
 const tot=S.items.reduce((a,x)=>a+(x.id===i.id?w:words(x.h)),0);
 $("#wc").textContent=w+" palabras (documento)";$("#tw").textContent=tot+(S.target?" / "+S.target:"")+" en el proyecto";
 $("#bar i").style.width=S.target?Math.min(100,tot/S.target*100)+"%":"0"}
function renderCork(){
 const i=cur(),p=i.k==="f"?i.id:i.p,c=$("#cork");c.innerHTML="";
 const list=kids(p);if(!list.length)c.innerHTML='<p style="color:var(--mu)">Esta carpeta está vacía. Añade escenas o secciones con «+ Escena» / «+ Sección».</p>';
 list.forEach(x=>{const d=document.createElement("div");d.className="card"+(x.id===S.sel?" sel":"");
  d.innerHTML=`<b>${x.k==="f"?"📁 ":""}${esc(x.t)}</b><textarea placeholder="Sinopsis…">${esc(x.s||"")}</textarea><small>${badge(x)}${x.st||""} · ${x.k!=="f"?words(x.h)+" palabras":kids(x.id).length+" elementos"}</small>`;
  d.querySelector("textarea").oninput=e=>{x.s=e.target.value;if(x.id===S.sel)$("#iSyn").value=x.s;save()};
  d.onclick=()=>{S.sel=x.id;$$(".card").forEach(k=>k.classList.remove("sel"));d.classList.add("sel");renderTree()};
  d.ondblclick=()=>{setView("ed");select(x.id)};c.appendChild(d)})}
function setView(v){view=v;$("#scroll").style.display=v==="ed"?"":"none";$("#tb").style.display=v==="ed"?"":"none";$("#tb2").style.display=v==="ed"?"":"none";
 $("#cork").style.display=v==="ck"?"grid":"none";$("#lienzo").style.display=v==="lc"?"flex":"none";if(v==="lc"&&window.__LC)window.__LC.show();$$("[data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===v));if(v==="ck")renderCork()}
$$("[data-v]").forEach(b=>b.onclick=()=>setView(b.dataset.v));
const ICON={f:"📁",d:"📄",s:"§",c:"🎭",l:"🏞"},NAMES={f:"Nueva carpeta",d:"Nueva escena",s:"Nueva sección",c:"Nuevo personaje",l:"Nuevo escenario"},ROOT={c:"Personajes",l:"Escenarios"};
const F={
 c:[["Rol en la historia","rol"],["Edad","edad"],["Aspecto","asp",1],["Motivación","mot",1],["Conflicto interno","con",1],["Arco / evolución","arc",1],["Voz y manías","voz",1],["Relaciones","rel",1]],
 l:[["Tipo de lugar","tipo"],["Descripción sensorial","sen",1],["Atmósfera","atm"],["Importancia en la trama","imp",1],["Época / clima","epo"]],
 d:[["Momento / fecha","cuando"],["Objetivo de la escena","obj",1],["Conflicto","con",1],["Resultado / giro","res",1]]};F.s=F.d;
function add(k){const i=cur();let p;
 if(ROOT[k]){let r=S.items.find(x=>x.k==="f"&&x.sp===k);if(!r){r={id:uid(),t:ROOT[k],k:"f",p:null,h:"",s:"",n:"",st:"Pendiente",o:1,sp:k};S.items.push(r)}r.o=1;p=r.id}
 else{p=i.k==="f"?i.id:i.p;if(i.k==="f")i.o=1}
 const n={id:uid(),t:NAMES[k],k,p,h:"",s:"",n:"",st:"Borrador",o:1,m:{}};
 S.items.push(n);select(n.id);$("#ttl").focus();$("#ttl").select()}
$("#aD").onclick=()=>add("d");$("#aC").onclick=()=>add("c");$("#aL").onclick=()=>add("l");$("#aF").onclick=()=>add("f");
function opts(k,v){return '<option value="">—</option>'+S.items.filter(x=>x.k===k).map(x=>`<option value="${x.id}"${x.id===v?" selected":""}>${esc(x.t)}</option>`).join("")}
function badge(x){const m=x.m||{},a=[];if(m.pov&&get(m.pov))a.push("👁 "+esc(get(m.pov).t));if(m.lug&&get(m.lug))a.push("📍 "+esc(get(m.lug).t));return a.length?a.join(" · ")+"<br>":""}
function renderMeta(){const i=cur(),box=$("#meta"),fs=F[i.k];box.innerHTML="";if(!fs)return;
 const m=i.m=i.m||{};let h=`<b>${{c:"Ficha de personaje",l:"Ficha de escenario",d:"Ficha de escena",s:"Ficha de sección"}[i.k]}</b>`;
 if(i.k==="d"||i.k==="s")h+=`<label>Punto de vista</label><select data-m="pov">${opts("c",m.pov)}</select><label>Escenario</label><select data-m="lug">${opts("l",m.lug)}</select><label>Personajes presentes</label><div class="chips">${S.items.filter(x=>x.k==="c").map(x=>`<label class="chk"><input type="checkbox" data-pr="${x.id}" ${(m.pr||[]).includes(x.id)?"checked":""}>${esc(x.t)}</label>`).join("")||"<small>Crea personajes con + Personaje</small>"}</div>`;
 fs.forEach(([l,k,t])=>{h+=`<label>${l}</label>`+(t?`<textarea data-m="${k}">${esc(m[k]||"")}</textarea>`:`<input type="text" data-m="${k}" value="${esc(m[k]||"")}">`)});
 if(i.k!=="d"&&i.k!=="s"){const sc=S.items.filter(x=>(x.k==="d"||x.k==="s")&&x.m&&(i.k==="c"?((x.m.pr||[]).includes(i.id)||x.m.pov===i.id):x.m.lug===i.id));
  h+=`<label>Aparece en (${sc.length})</label><div class="chips">${sc.map(x=>`<a data-go="${x.id}">${esc(x.t)}</a>`).join("")||"<small>Aún en ninguna escena</small>"}</div>`}
 box.innerHTML=h;
 box.querySelectorAll("[data-m]").forEach(el=>{el.oninput=el.onchange=()=>{m[el.dataset.m]=el.value;save()}});
 box.querySelectorAll("[data-pr]").forEach(el=>el.onchange=()=>{m.pr=[...box.querySelectorAll("[data-pr]")].filter(x=>x.checked).map(x=>x.dataset.pr);save()});
 box.querySelectorAll("[data-go]").forEach(a=>a.onclick=()=>select(a.dataset.go))}
$("#aR").onclick=()=>{$("#ttl").focus();$("#ttl").select()};
$("#aX").onclick=()=>{const i=cur();if(S.items.length<2||!confirm("¿Eliminar «"+i.t+"» y todo su contenido?"))return;
 const ids=[i.id];(function f(p){kids(p).forEach(k=>{ids.push(k.id);f(k.id)})})(i.id);
 S.items=S.items.filter(x=>!ids.includes(x.id));select(i.p&&get(i.p)?i.p:S.items[0].id)};
function mv(dir){const i=cur(),sib=kids(i.p),x=sib.indexOf(i),o=sib[x+dir];if(!o)return;
 S.items.splice(S.items.indexOf(i),1);S.items.splice(S.items.indexOf(o)+(dir>0?1:0),0,i);renderTree();save()}
$("#aU").onclick=()=>mv(-1);$("#aN").onclick=()=>mv(1);
$("#ttl").oninput=e=>{cur().t=e.target.value||"Sin título";renderTree();save()};
page.oninput=()=>{stats();save()};
$("#iSyn").oninput=e=>{cur().s=e.target.value;save()};$("#iNo").oninput=e=>{cur().n=e.target.value;save()};
$("#iSt").onchange=e=>{cur().st=e.target.value;save()};$("#iTg").oninput=e=>{S.target=+e.target.value||0;stats();save()};
/* Editor rico */
document.addEventListener("selectionchange",()=>{const s=getSelection();if(s.rangeCount&&page.contains(s.anchorNode))range=s.getRangeAt(0).cloneRange()});
function rs(){page.focus();if(range){const s=getSelection();s.removeAllRanges();s.addRange(range)}}
function cmd(c,v){rs();document.execCommand("styleWithCSS",false,true);document.execCommand(c,false,v||null);stats();save()}
$$("#tb button").forEach(b=>b.onmousedown=e=>e.preventDefault());
$$("[data-c]").forEach(b=>b.onclick=()=>cmd(b.dataset.c));
$("#sBlk").onchange=e=>{cmd("formatBlock","<"+e.target.value+">")};



$("#cFg").oninput=e=>cmd("foreColor",e.target.value);$("#cBg").oninput=e=>cmd("hiliteColor",e.target.value);

function askText(msg,def){return new Promise(res=>{const o=document.createElement("div");o.style.cssText="position:fixed;inset:0;background:#0006;display:flex;align-items:center;justify-content:center;z-index:99";
 o.innerHTML="<div style='background:var(--pn);border:1px solid var(--ln);border-radius:10px;padding:16px;min-width:300px;display:flex;flex-direction:column;gap:10px'><label></label><input type='text' style='padding:6px 8px'><div style='display:flex;gap:6px;justify-content:flex-end'><button class='c'>Cancelar</button><button class='o on'>Aceptar</button></div></div>";
 o.querySelector("label").textContent=msg;const i=o.querySelector("input");i.value=def==null?"":def;document.body.appendChild(o);i.focus();i.select();
 const end=v=>{o.remove();res(v)};o.querySelector(".c").onclick=()=>end(null);o.querySelector(".o").onclick=()=>end(i.value);
 i.onkeydown=e=>{if(e.key==="Enter")end(i.value);if(e.key==="Escape")end(null)}})}
$("#bLink").onclick=async()=>{rs();const u=await askText("Dirección del enlace (https://…)","https://");if(u&&u!=="https://")cmd("createLink",u)};
$("#bTab").onclick=async()=>{rs();const r=+await askText("Filas",3),c=+await askText("Columnas",3);if(!r||!c)return;
 let h="<table>";for(let i=0;i<r;i++){h+="<tr>";for(let j=0;j<c;j++)h+="<td><br></td>";h+="</tr>"}cmd("insertHTML",h+"</table><p><br></p>")};


page.addEventListener("keydown",e=>{
 if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();flush()}
 if(e.key==="Tab"){e.preventDefault();document.execCommand("insertHTML",false,"&emsp;")}});
/* Modos */
/* Modo concentración: sin distracciones y a pantalla completa (Ctrl+Mayús+F; Esc para salir) */
function focusToast(t){let d=document.getElementById('fcT');if(!d){d=document.createElement('div');d.id='fcT';d.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#000b;color:#fff;padding:8px 16px;border-radius:20px;font:14px system-ui;z-index:9999;transition:opacity .6s;pointer-events:none';document.body.appendChild(d)}
 d.textContent=t;d.style.opacity=1;clearTimeout(d._t);d._t=setTimeout(()=>d.style.opacity=0,2600)}
function enterFocus(){document.body.classList.add("compose");setView("ed");
 try{const r=document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();if(r&&r.catch)r.catch(()=>{})}catch(e){}
 focusToast('Modo concentración · Esc para salir');page.focus()}
function exitFocus(){document.body.classList.remove("compose");try{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}catch(e){}}
const toggleFocus=()=>document.body.classList.contains("compose")?exitFocus():enterFocus();
window.__focusToggle=toggleFocus;
$("#bFoc").onclick=enterFocus;
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement)document.body.classList.remove("compose")});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("compose"))exitFocus();
});

$("#bB").onclick=()=>{document.body.classList.toggle("showB");document.body.classList.remove("showI")};
$("#bI").onclick=()=>{document.body.classList.toggle("showI");document.body.classList.remove("showB")};
/* Compilar */
function compRender(){const h=ms().innerHTML,o=$("#out"),ff=ffCss(B.fam);
 o.classList.toggle('jus',!!B.jus);o.classList.toggle('hyp',B.hyp!==0&&B.hyp!==false);[['--fs',B.fs],['--lh',B.lh],['--psb',B.psb],['--psa',B.psa],['--fli',B.fli]].forEach(([k,v])=>o.style.setProperty(k,v));o.style.setProperty('--ff',ff);
 $("#out").innerHTML=h||'<p style="color:var(--mu)">No hay nada que compilar.</p>'}
$("#bComp").onclick=()=>{$("#copt").innerHTML=compOpts();$$("#copt [data-k]").forEach(el=>el.onchange=()=>{B[el.dataset.k]=el.value;save();compRender()});compRender();$("#modal").style.display="flex"};


$("#mCl").onclick=()=>$("#modal").style.display="none";
$("#mPr").onclick=()=>run(pdf);$("#mWd").onclick=()=>run(docx);
$("#mCp").onclick=()=>{const r=document.createRange();r.selectNodeContents($("#out"));const s=getSelection();s.removeAllRanges();s.addRange(r);
 let ok=false;try{ok=document.execCommand("copy")}catch(e){}$("#mCp").textContent=ok?"¡Copiado!":"Selecciona y copia (Ctrl+C)";setTimeout(()=>$("#mCp").textContent="Copiar todo",1800)};
/* ===== Littera · Libro, portadas, encabezados/pies, párrafo ===== */
S.items.forEach(i=>{if(i.id==='r'&&i.t==='Investigación'&&i.nc===undefined)i.nc=1});
const SZ={A5:[148,210],'6x9 pulg':[152.4,228.6],'5.5x8.5 pulg':[139.7,215.9],A4:[210,297],Carta:[215.9,279.4]};
const CV={
 'Clásica':{bg:'#fbf7ee',tx:'#2b2218',ac:'#8a4b2a',f:'times',al:'c',rule:1},
 'Marco doble':{bg:'#fbf7ee',tx:'#2b2218',ac:'#8a4b2a',f:'times',al:'c',fr:'double',orn:1},
 'Editorial':{bg:'#f6f0e4',tx:'#1f1a14',ac:'#7a1f2b',f:'times',al:'c',up:1,sp:1,rules:1},
 'Bandas':{bg:'#f3ecd9',tx:'#1d1d1d',ac:'#c8501e',f:'times',al:'c',bands:1},
 'Pergamino':{bg:'#eadfc4',tx:'#3b2c1a',ac:'#7b5b2e',f:'times',al:'c',fr:'double',orn:1},
 'Burdeos y oro':{bg:'#5b1a2a',tx:'#f3e3c0',ac:'#d4af37',f:'times',al:'c',fr:'double',orn:1,up:1},
 'Índigo y marfil':{bg:'#0e1546',tx:'#f8ecd9',ac:'#d9b36a',f:'times',al:'c',fr:'single',orn:1,up:1,sp:1},
 'Verde inglés':{bg:'#1f3d2f',tx:'#efe6cf',ac:'#c9a24a',f:'times',al:'c',fr:'single',orn:1,up:1},
 'Cenefa griega':{bg:'#f8f1e0',tx:'#2b2218',ac:'#7a4a22',f:'times',al:'c',fr:'double',cen:'greca',orn:1},
 'Cenefa de rombos':{bg:'#fbf7ee',tx:'#2b2218',ac:'#8a1f2b',f:'times',al:'c',fr:'double',cen:'rombos',orn:1,up:1},
 'Cenefa de perlas':{bg:'#f5efe0',tx:'#2b2218',ac:'#5b4a2a',f:'times',al:'c',fr:'double',cen:'perlas',orn:1},
 'Ondas marinas':{bg:'#f2f0e6',tx:'#16222b',ac:'#1f4d6b',f:'times',al:'c',fr:'double',cen:'ondas',orn:1},
 'Gran clásico burdeos':{bg:'#5b1a2a',tx:'#f3e3c0',ac:'#d4af37',f:'times',al:'c',fr:'double',cen:'greca',orn:1,up:1},
 'Gran clásico azul':{bg:'#13224a',tx:'#f6ecd6',ac:'#d9b36a',f:'times',al:'c',fr:'double',cen:'rombos',orn:1,up:1,sp:1},
 'Verde y oro con cenefa':{bg:'#1f3d2f',tx:'#efe6cf',ac:'#c9a24a',f:'times',al:'c',fr:'double',cen:'perlas',orn:1,up:1},
 'Sobria':{bg:'#ffffff',tx:'#1a1a1a',ac:'#555555',f:'times',al:'c',rule:1,fr:'single'},
 'Moderna':{bg:'#ffffff',tx:'#1b1b1b',ac:'#e4572e',f:'helvetica',al:'l',block:1},
 'Oscura':{bg:'#14161c',tx:'#f1efe8',ac:'#d9a441',f:'times',al:'c',up:1,rule:1},
 'Novela':{bg:'#1f3a5f',tx:'#ffffff',ac:'#f4d35e',f:'helvetica',al:'c',up:1},
 'Minimal':{bg:'#ffffff',tx:'#222222',ac:'#999999',f:'times',al:'l'}};
/* Fuentes: las mismas que en el editor */
const FAMMAP={times:'Times New Roman',helvetica:'Arial',courier:'Courier New'};
const FONT_WIN=['Georgia','Times New Roman','Garamond','Cambria','Palatino Linotype','Book Antiqua','Arial','Calibri','Verdana','Tahoma','Trebuchet MS','Segoe UI','Century Gothic','Courier New','Consolas'];
const FONT_INC=['EB Garamond','Cormorant Garamond','Lora','Merriweather','Libre Baskerville','Crimson Pro','Playfair Display','Source Serif 4','Open Sans','Lato','Montserrat','Roboto','Nunito','Source Sans 3','Courier Prime','Special Elite','Caveat'];
const ffCss=n=>{n=FAMMAP[n]||n||'Times New Roman';return `'${n}',${/Courier|Consolas|Cousine|Special Elite/.test(n)?'monospace':/Arial|Calibri|Verdana|Tahoma|Trebuchet|Segoe|Century|Open Sans|Lato|Montserrat|Roboto|Nunito|Source Sans/.test(n)?'sans-serif':'serif'}`};
const hb={hT:0,hI:0,hZ:9,hS:0,hL:'single'},fb={fT:0,fI:0,fZ:9,fS:0,fL:'none',pnf:'n'};
const HST={
 'Clásico':{...hb,h1c:'{capitulo}',h2c:'{autor}'},
 'Versalitas con filete':{...hb,hT:1,hZ:8,hS:1,h1c:'{titulo}',h2c:'{autor}'},
 'Cursiva centrada':{...hb,hI:1,hL:'none',h1c:'{capitulo}',h2c:'{titulo}'},
 'Folio y título (extremos)':{...hb,hL:'none',h1c:'{titulo}',h1r:'{pagina}',h2l:'{pagina}',h2c:'{autor}'},
 'Doble filete':{...hb,hT:1,hZ:8,hS:1,hL:'double',h1c:'{titulo}',h2c:'{autor}'},
 'Filete grueso':{...hb,hL:'thick',h1c:'{capitulo}',h2c:'{titulo}'},
 'Sin encabezado':{...hb,hL:'none'}};
const FST={
 'Número centrado':{...fb,f1c:'{pagina}',f2c:'{pagina}'},
 'Número entre guiones':{...fb,pnf:'dash',f1c:'{pagina}',f2c:'{pagina}'},
 'Página n':{...fb,pnf:'pag',f1c:'{pagina}',f2c:'{pagina}'},
 'Exterior con filete':{...fb,fL:'single',f1r:'{pagina}',f2l:'{pagina}'},
 'Título y número':{...fb,fL:'single',f1l:'{titulo}',f1r:'{pagina}',f2l:'{pagina}',f2r:'{autor}'},
 'Romano centrado':{...fb,pnf:'roman',f1c:'{pagina}',f2c:'{pagina}'},
 'Sin pie':{...fb}};
const D={tit:'',sub:'',aut:'',tag:'',cov_on:1,cov:'Clásica',cbg:'#fbf7ee',ctx:'#2b2218',cac:'#8a4b2a',cimg:'',cimp:'top',
 size:'A5',mt:20,mb:20,mi:22,mo:16,mir:1,fam:'Times New Roman',hyp:1,cfam:'',fs:11.5,lh:1.4,jus:1,psb:0,psa:6,fli:0,
 ftm:'cap',dtm:'no',sepk:'stars',eo:1,nch:1,nfc:0,hst:'Clásico',fst:'Número centrado',
 h1l:'',h1c:'{capitulo}',h1r:'',h2l:'',h2c:'{autor}',h2r:'',f1l:'',f1c:'{pagina}',f1r:'',f2l:'',f2c:'{pagina}',f2r:'',
 ...hb,...fb};
const st0=S.bk||{};
const B=S.bk=Object.assign(D,st0);if(FAMMAP[B.fam])B.fam=FAMMAP[B.fam];
if(st0.sepk===undefined&&st0.sep===0)B.sepk='none';
if(st0.ftm===undefined&&st0.fch===0)B.ftm='no';
if(st0.hL===undefined&&st0.hr===0)B.hL='none';
if(st0.fL===undefined&&st0.fr)B.fL='single';
const BK={'Párrafo normal':['p',null],'Texto de novela':['p',{textIndent:'1.5em',textAlign:'justify',marginTop:'0',marginBottom:'0',lineHeight:'1.5'}],'Capítulo':['h1',{textAlign:'center',pageBreakBefore:'always',marginTop:'3em',marginBottom:'1.5em'}],'Subtítulo':['h2',{textAlign:'center',fontStyle:'italic',marginBottom:'1em'}],'Epígrafe':['blockquote',{textAlign:'right',marginLeft:'6em',marginBottom:'1.5em'}],'Verso':['p',{textAlign:'left',marginLeft:'3em',fontStyle:'italic',marginTop:'0',marginBottom:'0'}]};
const ea=s=>esc(s).replace(/'/g,'&#39;'),hx=c=>{const m=(c||'').match(/[0-9]+/g);return /^rgb/.test(c||'')&&m&&m.length>=3?m.slice(0,3).map(n=>(+n).toString(16).padStart(2,'0')).join(''):(c||'000000').replace('#','')},rgb=h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
const roman=n=>{let s='';[[1000,'m'],[900,'cm'],[500,'d'],[400,'cd'],[100,'c'],[90,'xc'],[50,'l'],[40,'xl'],[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']].forEach(([v,t])=>{while(n>=v){s+=t;n-=v}});return s};
const pnum=n=>({n:''+n,dash:'– '+n+' –',roman:roman(n),ROMAN:roman(n).toUpperCase(),pag:'Página '+n}[B.pnf||'n']);
const CMPT=28.3465;   /* puntos por cm */
const len=(v,base,d)=>{if(v===''||v==null)return d;const n=parseFloat(v);if(isNaN(n))return d;if(/em$/.test(v))return n*base;if(/px$/.test(v))return n*.75;if(/cm$/.test(v))return n*CMPT;if(/mm$/.test(v))return n*CMPT/10;if(/in$/.test(v))return n*72;if(/pt$/.test(v)||/^-?[\d.]+$/.test(v))return n;return d};

/* ----- Párrafo: entradas rápidas (cm / pt / múltiplo) ----- */
function blks(){const s=getSelection(),r=s.rangeCount&&page.contains(s.anchorNode)?s.getRangeAt(0):range;if(!r)return[];return[...page.querySelectorAll(':scope>*')].filter(b=>r.intersectsNode(b))}
const toPt=(v,b)=>{if(!v)return null;const n=parseFloat(v);if(isNaN(n))return null;if(/em$/.test(v))return n*(parseFloat(getComputedStyle(b).fontSize)||15)*.75;if(/px$/.test(v))return n*.75;if(/cm$/.test(v))return n*CMPT;if(/mm$/.test(v))return n*CMPT/10;if(/pt$/.test(v))return n;if(/in$/.test(v))return n*72;return null};
const PU={textIndent:'cm',marginLeft:'cm',marginRight:'cm',marginTop:'pt',marginBottom:'pt',lineHeight:''};
function fromStyle(p,b){const v=b.style[p];if(!v)return'';if(p==='lineHeight'){if(/(pt|px|cm|mm|in)$/.test(v))return +(toPt(v,b)/((parseFloat(getComputedStyle(b).fontSize)||15)*.75)).toFixed(2);const n=parseFloat(v);return isNaN(n)?'':+n.toFixed(2)}const t=toPt(v,b);if(t==null)return'';return PU[p]==='cm'?+(t/CMPT).toFixed(2):+t.toFixed(1)}
function fillP(){const b=blks()[0];if(!b)return;$$('[data-p]').forEach(e=>{if(document.activeElement!==e)e.value=fromStyle(e.dataset.p,b)});if(!pg.hidden)fillPg(b)}
document.addEventListener('selectionchange',()=>{if(range&&page.contains(range.startContainer)&&!document.activeElement.closest('#tb2,#pg'))fillP()});
$$('[data-p]').forEach(el=>el.onchange=()=>{rs();const p=el.dataset.p,v=el.value;blks().forEach(b=>b.style[p]=v===''?'':(p==='lineHeight'?v:v+PU[p]));stats();save()});
$('#sBk').onchange=e=>{const v=e.target.value;e.target.value='';if(!v)return;rs();if(v==='Separador de escena'){cmd('insertHTML',`<p style='text-align:center;text-indent:0'>* * *</p>`);return}const[tg,css]=BK[v];document.execCommand('formatBlock',false,'<'+tg+'>');blks().forEach(b=>{b.removeAttribute('style');b.className='';if(css)Object.assign(b.style,css)});stats();save();fillP()};

/* ----- Libro: ventana de configuración ----- */
const T=[['cover','Portada'],['page','Página'],['hf','Encabezados y pies'],['comp','Compilar'],['exp','Exportar']];let tab='cover';
document.body.insertAdjacentHTML('beforeend',`<div id='bm'><div><div class='mh'><b>Libro</b><span id='bkt'>${T.map(([k,t])=>`<button data-t='${k}'>${t}</button>`).join('')}</span><span class='sp'></span><button id='bkc'>Cerrar</button></div><div id='bkb'></div></div></div>`);
const bm=$('#bm'),bb=$('#bkb');
const fl=(l,k,t,x)=>`<label>${l}<input data-k='${k}' type='${t||'text'}' ${x||''} value='${ea(B[k]==null?'':B[k])}'></label>`;
const ck=(l,k)=>`<label class='ck'><input data-k='${k}' type='checkbox' ${B[k]?'checked':''}> ${l}</label>`;
const fontSel=(l,k,def)=>{const op=n=>`<option value='${n}'${B[k]==n?' selected':''} style="font-family:'${n}'">${n}</option>`;return `<label>${l}<select data-k='${k}'>${def?`<option value=''>${def}</option>`:''}<optgroup label='Windows'>${FONT_WIN.map(op).join('')}</optgroup><optgroup label='Incluidas en Littera'>${FONT_INC.map(op).join('')}</optgroup></select></label>`};
const sl=(l,k,o)=>`<label>${l}<select data-k='${k}'>${o.map(x=>{const[v,t]=[].concat(x);return `<option value='${v}'${B[k]==v?' selected':''}>${t||v}</option>`}).join('')}</select></label>`;
const RL=[['none','Ninguno'],['single','Simple'],['double','Doble'],['thick','Grueso']];
const PNF=[['n','1, 2, 3'],['dash','– 1 –'],['pag','Página 1'],['roman','i, ii, iii'],['ROMAN','I, II, III']];
const FTM=[['no','No mostrar'],['cap','Solo capítulos (carpetas de 2.º nivel)'],['all','Todas las carpetas']];
const DTM=[['no','No mostrar (solo lo que escribo)'],['si','Mostrar el nombre de cada escena/sección']];
const SEPK=[['none','Ninguno'],['stars','* * *'],['line','———'],['dots','•  •  •'],['space','Espacio en blanco'],['page','Salto de página']];
const compOpts=()=>`<div class='row'>${sl('Nombres de carpetas / capítulos','ftm',FTM)}${sl('Nombres de escenas y secciones','dtm',DTM)}${sl('Separador entre escenas y secciones','sepk',SEPK)}</div>`;
function cvp(){const P=CV[B.cov]||CV['Clásica'],c=P.al==='c',ff=B.cfam?ffCss(B.cfam):P.f==='times'?'Georgia,serif':'system-ui,sans-serif',pk=190/((SZ[B.size]||SZ.A5)[0]*72/25.4),top=B.cimg&&B.cimp!=='mid',ab=s=>`position:absolute;${s}`;
 const sz=SZ[B.size]||SZ.A5,fr=P.cen?cenefaSvg(sz[0]*72/25.4,sz[1]*72/25.4,P.cen,B.cac):P.fr?`<div style='${ab('inset:9px;')}border:${P.fr==='double'?'3px double':'1px solid'} ${B.cac};pointer-events:none'></div>`:'';
 const bands=P.bands?`<div style='${ab('left:0;right:0;top:0;height:15%;')}background:${B.cac}'></div><div style='${ab('left:0;right:0;bottom:0;height:15%;')}background:${B.cac}'></div>`:'';
 const orn=P.orn?`<div style='display:flex;align-items:center;gap:5px;margin:10px ${c?'auto':'0'};width:60%;color:${B.cac}'><i style='flex:1;height:1px;background:${B.cac}'></i>◆<i style='flex:1;height:1px;background:${B.cac}'></i></div>`:'';
 const rule=(P.rule||P.block)&&!P.orn?`<div style='height:2px;background:${B.cac};width:50px;margin:12px ${c?'auto':'0'}'></div>`:'';
 const img=B.cimg?`<img src='${B.cimg}' style='max-width:70%;max-height:60px;display:block;margin:8px ${c?'auto':'0'}'>`:'';
 return `<div id='cvp' style='position:relative;${P.cen?'aspect-ratio:'+sz[0]+'/'+sz[1]+';overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;padding:12%;':''}background:${B.cbg};color:${B.ctx};text-align:${c?'center':'left'};font-family:${ff};${P.block?'border-left:20px solid '+B.cac:''}'>${bands}${fr}<div style='position:relative'>${top?img:''}<div style='font-size:${B.ctz?(B.ctz*pk).toFixed(1):P.sp?17:21}px;font-weight:700;margin-top:${top?8:46}px;${P.up?'text-transform:uppercase;':''}${P.sp?'letter-spacing:3px;':P.up?'letter-spacing:2px;':''}'>${esc(B.tit||'Título del libro')}</div>${rule}${orn}<div style='font-style:italic;margin-top:8px;${B.csz?'font-size:'+(B.csz*pk).toFixed(1)+'px':''}'>${esc(B.sub)}</div>${B.cimg&&!top?img:''}</div><div style='position:relative;color:${P.bands?B.cbg:B.ctx}'><div style='font-size:${B.caz?(B.caz*pk).toFixed(1):13}px;letter-spacing:1px'>${esc(B.aut||'Autor')}</div><small style='${B.cgz?'font-size:'+(B.cgz*pk).toFixed(1)+'px;':''}color:${P.bands?B.cbg:B.cac}'>${esc(B.tag)}</small></div></div>`}
function hfPrev(){const sub=(s,n)=>(s||'').replace(/[{]titulo[}]/g,B.tit||'Título').replace(/[{]autor[}]/g,B.aut||'Autor').replace(/[{]capitulo[}]/g,'Capítulo 1').replace(/[{]pagina[}]/g,pnum(n));
 const one=n=>{const pre=n%2===1||!B.eo?1:2,z=k=>{const rule=B[k+'L'],bd=rule==='none'?'':`border-${k==='h'?'bottom':'top'}:${rule==='double'?'3px double':rule==='thick'?'2px solid':'1px solid'} #888;`;
  return `<div style='display:flex;gap:4px;padding:3px 0;${bd}font-size:${Math.max(7,(B[k+'Z']||9)*.9)}px;${B[k+'I']?'font-style:italic;':''}${B[k+'T']?'text-transform:uppercase;':''}${B[k+'S']?'letter-spacing:.12em;':''}'>${['l','c','r'].map(s=>`<span style='flex:1;text-align:${{l:'left',c:'center',r:'right'}[s]}'>${esc(sub(B[k+pre+s],n))}</span>`).join('')}</div>`};
  return `<div style='flex:1;background:#fff;color:#222;border:1px solid #ccc;box-shadow:0 1px 6px rgba(0,0,0,.15);padding:8px 10px;height:140px;display:flex;flex-direction:column;justify-content:space-between;font-family:Georgia,serif'>${z('h')}<div style='flex:1;margin:8px 0;background:repeating-linear-gradient(#bbb 0 2px,transparent 2px 8px);opacity:.5'></div>${z('f')}</div>`};
 return `<div style='display:flex;gap:10px;margin:8px 0'>${one(2)}${one(3)}</div>`}
function tabHtml(){
 if(tab==='cover')return `<div class='bg2'><div>${ck('Incluir portada','cov_on')}${sl('Estilo de portada','cov',Object.keys(CV))}${fl('Título','tit')}${fl('Subtítulo','sub')}${fl('Autor','aut')}${fl('Lema o colección','tag')}<b>Tipografía de la portada</b>${fontSel('Fuente','cfam','Según el estilo de portada')}<div class='row'>${fl('Título (pt)','ctz','number',`step='1' min='8' max='90' placeholder='32'`)}${fl('Subtítulo (pt)','csz','number',`step='1' min='6' max='60' placeholder='15'`)}</div><div class='row'>${fl('Autor (pt)','caz','number',`step='1' min='6' max='60' placeholder='14'`)}${fl('Lema (pt)','cgz','number',`step='1' min='5' max='40' placeholder='10'`)}</div><div class='row'>${fl('Fondo','cbg','color')}${fl('Texto','ctx','color')}${fl('Acento','cac','color')}</div><b>Imagen de portada</b><div class='row'><button id='cvI'>${B.cimg?'Cambiar imagen…':'Añadir imagen…'}</button>${B.cimg?`<button id='cvIx'>Quitar</button>`:''}</div>${B.cimg?sl('Posición de la imagen','cimp',[['top','Sobre el título'],['mid','Entre título y autor']]):''}<input type='file' id='cvF' accept='image/*' hidden></div><div id='cvw'>${cvp()}</div></div>`;
 if(tab==='page')return `<div class='bg2'><div>${sl('Idioma del libro (por defecto)','lang',[['es','Castellano'],['ca','Català'],['en','English'],['fr','Français'],['all','Todos los idiomas']])}${sl('Tamaño de página','size',Object.keys(SZ))}${fontSel('Fuente del libro','fam')}<div class='row'>${fl('Cuerpo (pt)','fs','number',`step='.5' min='8' max='18'`)}${fl('Interlineado','lh','number',`step='.05' min='1' max='3'`)}</div><div class='row'>${fl('Espacio antes del párrafo (pt)','psb','number',`step='1' min='0'`)}${fl('Espacio después del párrafo (pt)','psa','number',`step='1' min='0'`)}</div>${fl('Sangría de la primera línea (cm)','fli','number',`step='.25' min='0'`)}${ck('Justificar el texto por defecto','jus')}${ck('Guionar las palabras en el texto justificado (según el idioma)','hyp')}<p class='hint'>Son los valores de todo el libro. Cada párrafo puede tener los suyos con el botón «¶ Párrafo…» del editor.</p></div><div><b>Márgenes (mm)</b><div class='row'>${fl('Superior','mt','number')}${fl('Inferior','mb','number')}</div><div class='row'>${fl('Interior','mi','number')}${fl('Exterior','mo','number')}</div>${ck('Márgenes espejo (impar/par)','mir')}</div></div>`;
 if(tab==='hf'){const r=(t,p)=>`<b>${t}</b><div class='row3'>${['l','c','r'].map((z,i)=>fl(['Izquierda','Centro','Derecha'][i],p+z)).join('')}</div>`;
  const typo=(k,rl)=>`<div class='row'>${fl('Tamaño (pt)',k+'Z','number',`step='.5' min='6' max='16'`)}${sl('Filete',k+'L',RL)}</div><div class='row'>${ck('Mayúsculas',k+'T')}${ck('Cursiva',k+'I')}${ck('Espaciado',k+'S')}</div>`;
  return `<div class='bg2'><div><b>Encabezado</b>${sl('Estilo de encabezado','hst',[...Object.keys(HST),'Personalizado'])}${typo('h')}</div><div><b>Pie de página</b>${sl('Estilo de pie','fst',[...Object.keys(FST),'Personalizado'])}${sl('Formato del número de página','pnf',PNF)}${typo('f')}</div></div><div id='hfv'>${hfPrev()}</div>${ck('Distinguir páginas pares e impares','eo')}${ck('Sin encabezado en la 1.ª página de cada capítulo','nch')}${ck('Sin pie en la 1.ª página de cada capítulo','nfc')}<details><summary>Textos de encabezado y pie (avanzado)</summary><p class='hint'>Variables: {titulo} {autor} {capitulo} {pagina}</p>${r('Encabezado · páginas impares','h1')}${r('Encabezado · páginas pares','h2')}${r('Pie · páginas impares','f1')}${r('Pie · páginas pares','f2')}</details>`}
 if(tab==='comp')return `<p class='hint'>Estas opciones se aplican a la vista «Compilar», al PDF y al Word. Si no quieres que se lean los nombres de las carpetas o de las escenas, elige «No mostrar»: saldrá solo lo que escribes dentro. Para dejar fuera un documento concreto, marca «Excluir al compilar» en el Inspector.</p>${compOpts()}`;
 return `<p>Se exportan las escenas, secciones y carpetas en el orden del clasificador (sin personajes ni escenarios), con portada, encabezados y pies, según las opciones de la pestaña «Compilar».</p><div class='row'><button id='xP' class='big'>Descargar PDF</button><button id='xW' class='big'>Descargar Word (.docx)</button></div><p id='xs' class='hint'></p><b>Copia de seguridad</b><p class='hint'>Tu proyecto ya se guarda solo como archivo. Además puedes guardar una copia aparte.</p><div class='row'><button id='xB' class='big'>Guardar copia (.json)</button><button id='xR' class='big'>Restaurar copia</button></div><input type='file' id='xF' accept='.json,application/json' hidden><p class='hint'>Las letras capitulares solo se ven en pantalla.</p>`}
function applyHF(k,name){const P=(k==='hst'?HST:FST)[name];if(!P)return;(k==='hst'?['h1l','h1c','h1r','h2l','h2c','h2r']:['f1l','f1c','f1r','f2l','f2c','f2r']).forEach(x=>B[x]='');Object.assign(B,P)}
function rb(){bb.innerHTML=tabHtml();$$('#bkt button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
 bb.querySelectorAll('[data-k]').forEach(el=>{el.onchange=el.oninput=()=>{const k=el.dataset.k;B[k]=el.type==='checkbox'?el.checked:el.type==='number'?(el.value===''&&/^c[tsag]z$/.test(k)?'':+el.value):el.value;
  if(k==='cov'){const P=CV[B.cov];B.cbg=P.bg;B.ctx=P.tx;B.cac=P.ac;rb()}
  else if(k==='hst'||k==='fst'){applyHF(k,B[k]);rb()}
  else if(/^(h[12][lcr]|h[TIZLS]|f[12][lcr]|f[TIZLS]|pnf)$/.test(k)){const hd=/^h/.test(k);B[hd?'hst':'fst']='Personalizado';const s=bb.querySelector(`[data-k=${hd?'hst':'fst'}]`);if(s)s.value='Personalizado';$('#hfv').innerHTML=hfPrev()}
  else if(tab==='cover')$('#cvw').innerHTML=cvp();
  save()}});
 if($('#cvI')){const f=$('#cvF');$('#cvI').onclick=()=>f.click();f.onchange=async()=>{if(f.files[0]){B.cimg=await readImg(f.files[0],1200);save();rb()}};if($('#cvIx'))$('#cvIx').onclick=()=>{B.cimg='';save();rb()}}
 if($('#xP')){$('#xP').onclick=()=>run(pdf);$('#xW').onclick=()=>run(docx);$('#xB').onclick=()=>run(async()=>[slug()+'-copia.json',new Blob([JSON.stringify(S)])]);$('#xR').onclick=()=>$('#xF').click();$('#xF').onchange=async ev=>{const f=ev.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!d.items||!d.items.length)throw 0;Object.assign(B,d.bk||{});d.bk=B;S=d;const it=d.items.find(x=>x.id===d.sel)||d.items[0];S.sel=it.id;page.innerHTML=it.h||'';select(S.sel);save();rb();$('#xs').textContent='Copia restaurada.'}catch(x){$('#xs').textContent='Archivo no válido.'}}}}
$('#bBook').onclick=()=>{bm.style.display='flex';rb()};$('#bkc').onclick=()=>{bm.style.display='none';setLang()};$$('#bkt button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;rb()});
async function run(f){const s=$('#xs')||$('#mSt');s.textContent='Generando…';try{const[n,b]=await f();const d=window.claude&&await claude.use('downloads');if(d)await d.save({filename:n,data:b});else{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();a.remove()}s.textContent='Listo.'}catch(e){s.textContent=e&&e.code==='declined'?'Cancelado.':'Error: '+((e&&(e.code||e.message))||e)}}
/* Imágenes: reducir antes de guardar (el proyecto es un solo archivo) */
function readImg(file,maxW){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const src=r.result;if(!/^data:image\/(png|jpe?g|webp)/.test(src)){res(src);return}const im=new Image();im.onerror=()=>res(src);im.onload=()=>{if(im.naturalWidth<=maxW&&file.size<400000&&!/webp/.test(file.type)){res(src);return}const k=Math.min(1,maxW/im.naturalWidth),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);const g=c.getContext('2d'),png=/png/.test(file.type);if(!png){g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height)}g.drawImage(im,0,0,c.width,c.height);res(png?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.88))};im.src=src};r.readAsDataURL(file)})}

/* ===== Littera · Manuscrito compilado y exportación ===== */
const isDoc=x=>x.k==='d'||x.k==='s';
function ms(){commit();const root=document.createElement('div'),ftm=B.ftm||'cap',dtm=B.dtm||'no',sk=B.sepk||'stars';let any=false,afterHead=true;
 const plain=h=>{const d=document.createElement('div');d.innerHTML=h;return(d.textContent||'').replace(/\u200B/g,'').trim().toLowerCase()};
 const P=(txt,css)=>{const p=document.createElement('p');p.textContent=txt;p.style.cssText='text-indent:0;'+css;return p};
 (function walk(p,d){kids(p).filter(x=>!x.sp&&!x.nc).forEach(i=>{
  if(i.k==='f'){
   if(ftm==='all'||(ftm==='cap'&&d>0)){const h=document.createElement('h1');h.textContent=i.t;h.style.cssText='text-align:center;page-break-before:always;margin-top:3em;margin-bottom:1.5em';root.appendChild(h);afterHead=true;any=true}
   walk(i.id,d+1)}
  else if(isDoc(i)){
   const t=document.createElement('div');t.innerHTML=i.h||'';const ch=[...t.children],pre=[];
   if(any&&!afterHead&&ch.length){
    if(sk==='stars')pre.push(P('* * *','text-align:center'));else if(sk==='line')pre.push(P('———','text-align:center'));else if(sk==='dots')pre.push(P('•  •  •','text-align:center'));else if(sk==='space')pre.push(P('\u00a0','margin:0'))}
   const f0=ch[0];
   if(dtm==='si'&&!(f0&&/^H[1-3]$/.test(f0.tagName)&&plain(f0.outerHTML)===String(i.t).trim().toLowerCase())){const h=document.createElement('h2');h.textContent=i.t;h.style.cssText='text-align:center;margin-top:1.5em;margin-bottom:1em';pre.push(h)}
   const all=[...pre,...ch];
   if(sk==='page'&&any&&!afterHead&&all.length)all[0].style.pageBreakBefore='always';
   all.forEach(c=>{if(!c.dataset.lg)c.dataset.lg=i.lg||B.lang||'es';root.appendChild(c)});
   if(all.length){any=true;afterHead=false}}
 })})(null,0);return root}
function runs(n,st,o){n.childNodes.forEach(c=>{if(c.nodeType===3){const t=c.nodeValue.replace(/[\u200B\u00AD]/g,'').replace(/[ \t\r\n\f]+/g,' ');if(t)o.push({...st,t});return}if(c.nodeType!==1)return;const g=c.tagName,s=c.style,x={...st},td=s.textDecorationLine||s.textDecoration||'';if(g==='BR'){o.push({br:1});return}if(g==='IMG')return;if(/^(B|STRONG)$/.test(g)||/bold|[6-9]00/.test(s.fontWeight))x.b=1;if(/^(I|EM)$/.test(g)||s.fontStyle==='italic')x.i=1;if(g==='U'||/underline/.test(td))x.u=1;if(/^(S|STRIKE|DEL)$/.test(g)||/line-through/.test(td))x.s=1;if(g==='SUP'||s.verticalAlign==='super'){x.sup=1;delete x.sub}if(g==='SUB'||s.verticalAlign==='sub'){x.sub=1;delete x.sup}if(s.color)x.c=s.color;const fmn=(s.fontFamily||(g==='FONT'&&c.getAttribute('face'))||'').split(',')[0].replace(/["']/g,'').trim();if(fmn)x.f=fmn;const fz=s.fontSize;if(/px$/.test(fz))x.z=parseFloat(fz)*.75/B.fs;else if(/pt$/.test(fz))x.z=parseFloat(fz)/B.fs;runs(c,x,o)})}
function mk(el,o){const s=el.style,g=el.tagName,hd=/^H[1-3]$/.test(g),f=B.fs,bp=/px$/.test(s.fontSize)?parseFloat(s.fontSize)*.75:/pt$/.test(s.fontSize)?parseFloat(s.fontSize):0,
  z=bp||f*(hd?{H1:2,H2:1.5,H3:1.2}[g]:1),e=(v,d)=>len(v,z,d),r=[],ds=el.dataset||{};
 if(o.txt)r.push({t:o.txt});else runs(el,{},r);
 const nal=v=>{v=(v||'').replace(/^-(webkit|moz)-/,'');return v==='start'?'left':v==='end'?'right':v},ta=nal(s.textAlign||(el.getAttribute&&el.getAttribute('align')))||(hd||g==='BLOCKQUOTE'?'left':B.jus?'justify':'left'),tl=nal(s.textAlignLast),lhv=s.lineHeight||'',lu=/(pt|px|cm|mm|in)$/.test(lhv),lx=lu?len(lhv,z,0):0,
  lh=lx?lx/z:(lhv?(/%$/.test(lhv)?parseFloat(lhv)/100:parseFloat(lhv)):0)||B.lh,bgc=s.backgroundColor;
 return{g,hd,r,z,lx,lh,mark:o.pre||'',f:(s.fontFamily||'').split(',')[0].replace(/["']/g,'').trim(),b:hd||/bold|[6-9]00/.test(s.fontWeight),i:g==='BLOCKQUOTE'||s.fontStyle==='italic',al:o.al||ta,lal:ta==='justify'?(/^(center|right|justify)$/.test(tl)?tl:'left'):'',
  ti:o.ti!=null?o.ti*f:e(s.textIndent,g==='P'?B.fli*CMPT:0),ml:e(s.marginLeft,0)+(o.ml||0)*f+(g==='BLOCKQUOTE'?2*f:0),mr:e(s.marginRight,0),
  mt:e(s.marginTop,hd?f:g==='P'?B.psb:0),mb:e(s.marginBottom,hd?f*.5:g==='LI'?B.psa*.4:B.psa),
  pb:s.pageBreakBefore==='always',ch:g==='H1',lg:o.lg||el.dataset.lg||B.lang||'es',
  kn:ds.kn==='1',kt:ds.kt==='1',wo:ds.wo!=='0',bg:bgc&&bgc!=='transparent'&&bgc!=='rgba(0, 0, 0, 0)'?hx(bgc):'',bd:ds.bd||'',bdc:ds.bdc||''}}
const markOf=(ty,k)=>({disc:'•',circle:'o',square:'-','lower-alpha':String.fromCharCode(96+(k-1)%26+1)+')','upper-alpha':String.fromCharCode(64+(k-1)%26+1)+')','lower-roman':roman(k)+'.','upper-roman':roman(k).toUpperCase()+'.'}[ty]||(k+'.'));
function blocks(root){const o=[],twp=((SZ[B.size]||SZ.A5)[0]-B.mi-B.mo)*PX;
 const list=(el,dp,lg)=>{let k=0;const ty=el.style.listStyleType||(el.tagName==='OL'?'decimal':'disc');[...el.children].forEach(li=>{
   if(li.tagName==='UL'||li.tagName==='OL'){list(li,dp+1,lg);return}if(li.tagName!=='LI')return;k++;
   const c=li.cloneNode(true),nest=[...c.children].filter(x=>/^(UL|OL)$/.test(x.tagName));nest.forEach(n=>n.remove());
   o.push(mk(c,{pre:markOf(ty,k),ml:1.6*(dp+1),ti:-1.2,lg}));nest.forEach(n=>list(n,dp+1,lg))})};
 [...root.children].forEach(el=>{const g=el.tagName,lg=el.dataset.lg;
  if(g==='UL'||g==='OL'){list(el,0,lg);return}
  const imgs=g==='IMG'?[el]:[...el.querySelectorAll('img')];
  if(imgs.length){if(g!=='IMG'){const c=el.cloneNode(true);c.querySelectorAll('img').forEach(i=>i.remove());if(c.textContent.replace(/[\u200B\s]/g,''))o.push(mk(c,{}))}
   const s=el.style;imgs.forEach(im=>{const w=im.style.width||im.getAttribute('width')||'',n=parseFloat(w);o.push({im:1,src:im.getAttribute('src'),wp:/%$/.test(w)?n:/px$|^\d+$/.test(w)&&n?Math.min(100,n/twp*100):0,al:s.textAlign||'left',ml:len(s.marginLeft,B.fs,0),mr:len(s.marginRight,B.fs,0),mt:len(s.marginTop,B.fs,0),mb:len(s.marginBottom,B.fs,B.psa),pb:s.pageBreakBefore==='always',kn:el.dataset.kn==='1',lg})});return}
  if(g==='TABLE')el.querySelectorAll('tr').forEach(tr=>o.push(mk(tr,{txt:[...tr.cells].map(c=>c.textContent.trim()).join('  |  '),lg})));
  else if(g==='HR')o.push(mk(el,{txt:'* * *',al:'center',lg}));else o.push(mk(el,{lg}))});return o}
const slug=()=>(B.tit||'libro').replace(/[^\w ]/g,'').trim().replace(/ +/g,'_')||'libro';
/* Imágenes: se normalizan a PNG/JPEG y se leen sus dimensiones */
const IM={};
function loadImg(src){return new Promise(res=>{const im=new Image();im.onerror=()=>res(null);im.onload=()=>{const w=im.naturalWidth,h=im.naturalHeight;let data=src,fmt=/^data:image\/png/.test(src)?'PNG':/^data:image\/jpe?g/.test(src)?'JPEG':null;
  if(!fmt){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,w,h);g.drawImage(im,0,0);data=c.toDataURL('image/jpeg',.92);fmt='JPEG'}
  res({data,fmt,w,h})};im.src=src})}
async function loadAll(list){for(const k in IM)delete IM[k];const srcs=[...new Set(list.filter(b=>b.im&&b.src).map(b=>b.src).concat(B.cimg&&B.cov_on?[B.cimg]:[]))];await Promise.all(srcs.map(async s=>{IM[s]=await loadImg(s)}))}
/* ----- PDF ----- */
/* Fuentes del PDF: estándar (Times/Arial/Courier), incrustadas (las de Littera) o equivalentes métricos de las de Windows */
const PF_STD={'Times New Roman':'times','Arial':'helvetica','Courier New':'courier'};
const PF_SUB={'Georgia':'Gelasio','Cambria':'Caladea','Calibri':'Carlito','Garamond':'EB Garamond','Palatino Linotype':'Lora','Book Antiqua':'Lora','Verdana':'Open Sans','Tahoma':'Open Sans','Trebuchet MS':'Open Sans','Segoe UI':'Open Sans','Century Gothic':'Montserrat','Consolas':'Cousine'};
const PF_HAVE=new Set([...FONT_INC,'Gelasio','Caladea','Carlito','Cousine']),PFK={};
const pdfFam=n=>{n=FAMMAP[n]||(n||'').trim()||'Times New Roman';if(PF_STD[n])return PF_STD[n];const t=PF_SUB[n]||n;if(PF_HAVE.has(t))return t;return /Courier|Mono|Consolas/i.test(n)?'courier':/Arial|Sans|Helvet|Calibri|Verdana|Tahoma/i.test(n)?'helvetica':'times'};
const pfData=n=>new Promise(res=>{const W=window.__PF=window.__PF||{};if(W[n])return res(W[n]);const e=document.createElement('script');e.src='fonts/pdf/'+n.toLowerCase().replace(/ /g,'-')+'.js';e.onload=()=>res(W[n]||null);e.onerror=()=>res(null);document.head.appendChild(e)});
async function pfRegister(doc,names){const ST={'400n':'normal','400i':'italic','700n':'bold','700i':'bolditalic'};
 for(const f of new Set([...names].map(pdfFam))){if(['times','helvetica','courier'].includes(f)||PFK[f])continue;const d=await pfData(f);
  if(!d){PF_HAVE.delete(f);continue}
  for(const k in d){const fn=f.toLowerCase().replace(/ /g,'-')+'-'+k+'.ttf';doc.addFileToVFS(fn,d[k]);doc.addFont(fn,f,ST[k])}PFK[f]=Object.keys(d)}}
const pfStyle=(f,b,i)=>{if(['times','helvetica','courier'].includes(f))return b?(i?'bolditalic':'bold'):(i?'italic':'normal');
 const K=PFK[f]||[],w=b?'700':'400',pick=[w+(i?'i':'n'),w+'n','400'+(i?'i':'n'),'400n'].find(k=>K.includes(k))||'400n';return{'400n':'normal','400i':'italic','700n':'bold','700i':'bolditalic'}[pick]};
function spaced(doc,t,x,y,al,cs){const ch=[...t],ws=ch.map(c=>doc.getTextWidth(c)),tot=ws.reduce((a,b)=>a+b,0)+cs*(ch.length-1);let px=al==='center'?x-tot/2:al==='right'?x-tot:x;ch.forEach((c,i)=>{doc.text(c,px,y);px+=ws[i]+cs})}
function ornament(doc,x,y,w){doc.setLineWidth(.7);doc.line(x-w,y,x-9,y);doc.line(x+9,y,x+w,y);doc.triangle(x,y-4,x+5,y,x,y+4,'F');doc.triangle(x,y-4,x-5,y,x,y+4,'F')}
/* Cenefas: lista de trazos en puntos, la misma para el PDF y para la vista previa */
function cenefaOps(kind,W,H){const ops=[],m=W*.05,bw=W*.042,L=(pts,lw,fill)=>ops.push({t:'l',pts,lw,fill}),Ci=(x,y,r)=>ops.push({t:'c',x,y,r});
 const x0=m,y0=m,x1=W-m,y1=H-m;
 L([[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]],1.6);L([[x0+bw,y0+bw],[x1-bw,y0+bw],[x1-bw,y1-bw],[x0+bw,y1-bw],[x0+bw,y0+bw]],.6);
 /* cada lado se dibuja en coordenadas (u a lo largo, v a lo ancho) */
 const side=(map,len)=>{const h=bw,n=Math.max(3,Math.round(len/(h*(kind==='greca'?1.5:1.2)))),t=len/n,P=(u,v)=>map(u,v);
  if(kind==='greca'){L([P(0,h*.12),P(len,h*.12)],.7);L([P(0,h*.88),P(len,h*.88)],.7);
   for(let i=0;i<n;i++){const u=i*t,q=(a,b)=>P(u+a*t,h*(.12+b*.76));L([q(0,0),q(0,.75),q(.7,.75),q(.7,.25),q(.35,.25),q(.35,.5)],.8)}}
  else if(kind==='rombos')for(let i=0;i<n;i++){const u=i*t;L([P(u,h/2),P(u+t/2,h*.14),P(u+t,h/2),P(u+t/2,h*.86),P(u,h/2)],.8,1);Ci(...P(u+t,h/2),h*.07)}
  else if(kind==='perlas')for(let i=0;i<n;i++){const[x,y]=P(i*t+t/2,h/2);Ci(x,y,h*.24)}
  else{const pts=[];for(let k=0;k<=n*10;k++){const u=k*t/10;pts.push(P(u,h/2+Math.sin(k/10*Math.PI*2)*h*.28))}L(pts,.9)}};
 const sx=bw,gx=x1-x0-2*bw,gy=y1-y0-2*bw;
 side((u,v)=>[x0+bw+u,y0+v],gx);side((u,v)=>[x0+bw+u,y1-v],gx);side((u,v)=>[x0+v,y0+bw+u],gy);side((u,v)=>[x1-v,y0+bw+u],gy);
 [[x0,y0],[x1-bw,y0],[x0,y1-bw],[x1-bw,y1-bw]].forEach(([x,y])=>{L([[x,y],[x+bw,y],[x+bw,y+bw],[x,y+bw],[x,y]],.8);L([[x+bw/2,y+bw*.18],[x+bw*.82,y+bw/2],[x+bw/2,y+bw*.82],[x+bw*.18,y+bw/2],[x+bw/2,y+bw*.18]],.7,1)});
 return ops}
function cenefaPdf(doc,W,H,kind,ac){doc.setDrawColor(...ac);doc.setFillColor(...ac);cenefaOps(kind,W,H).forEach(o=>{if(o.t==='c'){doc.circle(o.x,o.y,o.r,'F');return}
  doc.setLineWidth(o.lw);for(let i=1;i<o.pts.length;i++)doc.line(o.pts[i-1][0],o.pts[i-1][1],o.pts[i][0],o.pts[i][1]);
  if(o.fill&&o.pts.length>=4){const p=o.pts;doc.setLineWidth(.2);doc.triangle(p[0][0],p[0][1],p[1][0],p[1][1],p[2][0],p[2][1],'F');doc.triangle(p[0][0],p[0][1],p[2][0],p[2][1],p[3][0],p[3][1],'F')}})}
function cenefaSvg(W,H,kind,col){return `<svg viewBox='0 0 ${W} ${H}' preserveAspectRatio='none' style='position:absolute;inset:0;width:100%;height:100%;pointer-events:none'>${cenefaOps(kind,W,H).map(o=>o.t==='c'?`<circle cx='${o.x}' cy='${o.y}' r='${o.r}' fill='${col}'/>`:`<polyline points='${o.pts.map(q=>q.join(',')).join(' ')}' fill='${o.fill?col:'none'}' stroke='${col}' stroke-width='${o.lw}' stroke-linejoin='round'/>`).join('')}</svg>`}
function cover(doc,W,H,im){const P=CV[B.cov]||CV['Clásica'],cf=pdfFam(B.cfam||P.f),c=P.al==='c',x=c?W/2:W*.13,a=c?'center':'left',mw=W*(c?(P.sp?.6:.68):.7),ac=rgb(hx(B.cac)),tx=rgb(hx(B.ctx)),bg=rgb(hx(B.cbg)),fit=(d,mw2,mh)=>{let w=mw2,h=w*d.h/d.w;if(h>mh){w*=mh/h;h=mh}return[w,h]};
 doc.setFillColor(...bg);doc.rect(0,0,W,H,'F');
 if(P.block){doc.setFillColor(...ac);doc.rect(0,0,W*.06,H,'F')}
 if(P.bands){doc.setFillColor(...ac);doc.rect(0,0,W,H*.15,'F');doc.rect(0,H*.85,W,H*.15,'F')}
 if(P.cen)cenefaPdf(doc,W,H,P.cen,ac);else if(P.fr){const m=W*.07;doc.setDrawColor(...ac);doc.setLineWidth(P.fr==='double'?2.2:1.2);doc.rect(m,m,W-2*m,H-2*m);if(P.fr==='double'){doc.setLineWidth(.6);doc.rect(m+6,m+6,W-2*m-12,H-2*m-12)}}
 let y=H*.3;
 if(im&&B.cimp!=='mid'){const[w,h]=fit(im,W*.5,H*.26);doc.addImage(im.data,im.fmt,c?x-w/2:x,H*.13,w,h);y=H*.13+h+H*.09}else if(im)y=H*.21;
 let sz=32,lines;doc.setFont(cf,pfStyle(cf,1,0));for(const s of(B.ctz?[+B.ctz]:[32,28,24,20])){sz=s;doc.setFontSize(s);lines=doc.splitTextToSize(P.up?(B.tit||'TÍTULO').toUpperCase():(B.tit||'Título'),mw);if(lines.length<=4)break}
 doc.setTextColor(...tx);doc.setDrawColor(...ac);doc.setFillColor(...ac);const lh=sz*1.2;
 if(P.rules){doc.setLineWidth(.8);doc.line(c?x-W*.2:x,y-sz-8,c?x+W*.2:x+W*.4,y-sz-8)}
 lines.forEach(l=>{P.sp?spaced(doc,l,x,y,a,sz*.08):doc.text(l,x,y,c?{align:'center'}:{});y+=lh});
 const ry=y-lh+sz*.6;
 if(P.orn)ornament(doc,x,ry,W*.09);else if(P.rule||P.block){doc.setLineWidth(2);doc.line(c?x-30:x,ry,c?x+30:x+60,ry)}else if(P.rules){doc.setLineWidth(.8);doc.line(c?x-W*.2:x,ry,c?x+W*.2:x+W*.4,ry)}
 if(B.sub){const ss=+B.csz||15;doc.setFont(cf,pfStyle(cf,0,1));doc.setFontSize(ss);y+=ss*.9;doc.splitTextToSize(B.sub,mw).forEach(l=>{doc.text(l,x,y,c?{align:'center'}:{});y+=ss*1.35})}
 if(im&&B.cimp==='mid'){const[w,h]=fit(im,W*.5,H*.28);doc.addImage(im.data,im.fmt,c?x-w/2:x,y+H*.03,w,h)}
 const fr=!!P.fr,ay=P.bands?H*.925:H*(fr?.84:.86),ty=P.bands?H*.075:H*(fr?.88:.9);
 doc.setFont(cf,pfStyle(cf,0,0));doc.setFontSize(+B.caz||14);doc.setTextColor(...(P.bands?bg:tx));P.sp?spaced(doc,B.aut||'',x,ay,a,1.5):doc.text(B.aut||'',x,ay,c?{align:'center'}:{});
 if(B.tag){doc.setFontSize(+B.cgz||10);doc.setTextColor(...(P.bands?bg:ac));doc.text(B.tag,x,ty,c?{align:'center'}:{})}}
async function pdf(){const{jsPDF}=window.jspdf,mm=72/25.4,[W,H]=SZ[B.size].map(v=>v*mm),doc=new jsPDF({unit:'pt',format:[W,H]}),cv=B.cov_on,F=pdfFam(B.fam);
 const bl=blocks(ms());await loadAll(bl);await pfRegister(doc,[B.fam,B.cfam||(CV[B.cov]||{}).f].concat(bl.flatMap(b=>[b.f].concat((b.r||[]).map(r=>r.f)))).filter(Boolean));if(cv){cover(doc,W,H,B.cimg?IM[B.cimg]:null);doc.addPage([W,H])}
 const top=B.mt*mm,bot=H-B.mb*mm,N=()=>doc.getNumberOfPages()-(cv?1:0),pc={},cs={};let y=top,ch='';
 const M=n=>{const o=n%2===1;return B.mir?{l:(o?B.mi:B.mo)*mm,r:(o?B.mo:B.mi)*mm}:{l:B.mi*mm,r:B.mo*mm}},np=()=>{doc.addPage([W,H]);y=top},sf=(t,z)=>{const fm=t.fm||F;doc.setFont(fm,pfStyle(fm,t.b,t.i));doc.setFontSize(z)};
 const tokens=b=>{const tk=[];b.r.forEach(r=>{if(r.br){tk.push({br:1});return}(r.t||'').split(/( +)/).forEach(w=>{if(!w)return;const z0=r.z?B.fs*r.z:b.z,base={...r,b:r.b||b.b,i:r.i||b.i,fm:pdfFam(r.f||b.f||B.fam),z0,z:z0*(r.sup||r.sub?.65:1)};
   if(w[0]===' '){tk.push({...base,w:' ',sp:1});return}
   const ps=w.split(/(?<=[\p{L}\p{N}][-\u2013\u2014])(?=\p{L})/u);ps.forEach((q,i)=>tk.push({...base,w:q.replace(/\u00a0/g,' '),cb:i<ps.length-1}))})});return tk};
 /* Reparto en líneas: solo se corta en espacios o tras un guion; nunca entre dos trozos con distinto formato de una misma palabra */
 const HY=B.hyp!==0&&B.hyp!==false&&window.LitteraHyph;
 const hyph=(b,t,room)=>{const m=/^([^\p{L}]*)(\p{L}+)([^\p{L}]*)$/u.exec(t.w);if(!m||m[2].length<5)return null;const ps=LitteraHyph(b.lg,m[2]);if(ps.length<2)return null;sf(t,t.z);let best=-1;
  for(let i=1;i<ps.length;i++){if(doc.getTextWidth(m[1]+ps.slice(0,i).join('')+'-')<=room)best=i;else break}
  return best<0?null:[m[1]+ps.slice(0,best).join('')+'-',ps.slice(best).join('')+m[3]]};
 const wrap=(b,tk)=>{const m=M(1),av0=W-m.l-m.r-b.ml-b.mr,lines=[],ti=b.mark?0:b.ti,hy=HY&&b.al==='justify'&&b.lg!=='all';let k=0,first=1,hc=0;
  if(!tk.length)return[{ln:[],x:0,av:av0,last:1,first:1}];
  tk.forEach(t=>{if(!t.br){sf(t,t.z);t.wd=doc.getTextWidth(t.w)}});
  while(k<tk.length){const av=av0-(first?ti:0),ln=[];let x=0,brk=0;
   while(k<tk.length){const t=tk[k];
    if(t.br){k++;brk=1;break}
    if(t.sp){if(ln.length&&!ln[ln.length-1].t.sp){ln.push({t,w:t.wd,x});x+=t.wd}k++;continue}
    let j=k,sw=0;while(j<tk.length&&!tk[j].br&&!tk[j].sp){sw+=tk[j].wd;if(tk[j++].cb)break}
    if(x+sw>av+.01&&ln.length){
     if(hy&&hc<2&&j===k+1){const r=hyph(b,t,av-x);if(r){sf(t,t.z);const a={...t,w:r[0],cb:0,hy:1},c={...t,w:r[1]};a.wd=doc.getTextWidth(a.w);c.wd=doc.getTextWidth(c.w);tk.splice(k,1,a,c);ln.push({t:a,w:a.wd,x});x+=a.wd;k++}}
     break}
    if(!ln.length&&sw>av){sf(t,t.z);let n=t.w.length;
     if(t.wd>av){while(n>1&&doc.getTextWidth(t.w.slice(0,n))>av)n--;
      if(n<t.w.length){const a={...t,w:t.w.slice(0,n),cb:0},c={...t,w:t.w.slice(n)};a.wd=doc.getTextWidth(a.w);c.wd=doc.getTextWidth(c.w);tk.splice(k,1,a,c);ln.push({t:a,w:a.wd,x});x+=a.wd;k++;break}}
     ln.push({t,w:t.wd,x});x+=t.wd;k++;continue}
    for(;k<j;k++){ln.push({t:tk[k],w:tk[k].wd,x});x+=tk[k].wd}}
   while(ln.length&&ln[ln.length-1].t.sp)x-=ln.pop().w;
   hc=ln.length&&ln[ln.length-1].t.hy?hc+1:0;
   lines.push({ln,x,av,last:k>=tk.length||brk,first});first=0}
  return lines};
 const lineH=(b,L)=>b.lx||((L.ln.length?Math.max(...L.ln.map(q=>q.t.z0)):b.z)*b.lh);
 const imgD=b=>{const d=IM[b.src];if(!d)return null;const m=M(N()),tw=W-m.l-m.r-b.ml-b.mr;let w=b.wp?tw*b.wp/100:Math.min(tw,d.w*.75),h=w*d.h/d.w;const mh=bot-top;if(h>mh){w*=mh/h;h=mh}return{d,w:Math.min(w,tw),h,tw}};
 const nextH=nb=>{if(nb.im){const q=imgD(nb);return q?q.h:0}const ls=wrap(nb,tokens(nb));return nb.mt+lineH(nb,ls[0])+(nb.wo&&ls.length>1?lineH(nb,ls[1]):0)};
 bl.forEach((b,bi)=>{
  if(b.im){const q=imgD(b);if(!q)return;if(b.pb&&y>top)np();else if(y>top)y+=b.mt;if(y+q.h>bot&&y>top)np();
   if(b.kn&&bl[bi+1]&&y+q.h+nextH(bl[bi+1])>bot&&y>top)np();
   const m=M(N()),x=m.l+b.ml+(b.al==='center'?(q.tw-q.w)/2:b.al==='right'?q.tw-q.w:0);doc.addImage(q.d.data,q.d.fmt,x,y,q.w,q.h);if(!pc[N()])pc[N()]=ch;y+=q.h+b.mb;return}
  const tk=tokens(b),lines=wrap(b,tk),tot=lines.reduce((a,L)=>a+lineH(b,L),0);
  if(b.pb&&y>top)np();else if(y>top)y+=b.mt;
  if(y>top){if(b.kt&&y+tot>bot&&tot<=bot-top)np();else if(b.kn||b.hd){const nb=bl[bi+1];if(nb){const nh=nextH(nb);if(y+tot+nh>bot&&tot+nh<=bot-top)np()}}}
  const bdc=b.bd?rgb(hx(b.bdc||'#808080')):null;
  lines.forEach((L,li)=>{const lh=lineH(b,L);
   if(b.wo&&y>top&&lines.length>=2){if(li===0&&y+lh+lineH(b,lines[1])>bot)np();else if(li>=2&&li===lines.length-2&&y+lh+lineH(b,lines[li+1])>bot)np()}
   if(y+lh>bot)np();
   if(b.ch&&li===0){ch=b.r.map(t=>t.t||'').join('').trim();if(b.pb||y<=top+.5)cs[N()]=1}
   const m=M(N()),xl=m.l+b.ml,xr=W-m.r-b.mr,mode=b.al==='justify'?(L.last?(b.lal||'left'):'justify'):b.al,ns=L.ln.filter(q=>q.t.sp).length;let off=0,ex=0;
   if(mode==='justify'&&ns)ex=(L.av-L.x)/ns;else if(mode==='center')off=(L.av-L.x)/2;else if(mode==='right')off=L.av-L.x;
   if(b.bg){doc.setFillColor(...rgb(b.bg));doc.rect(xl-3,y,xr-xl+6,lh,'F')}
   if(bdc){doc.setDrawColor(...bdc);doc.setLineWidth(.6);const k=b.bd;
    if(k==='box'||k==='left'){doc.setLineWidth(k==='left'?2:.6);doc.line(xl-4,y,xl-4,y+lh)}
    if(k==='box'){doc.setLineWidth(.6);doc.line(xr+4,y,xr+4,y+lh)}
    if((k==='box'||k==='top'||k==='tb')&&li===0){doc.setLineWidth(.6);doc.line(xl-4,y,xr+4,y)}
    if((k==='box'||k==='bottom'||k==='tb')&&li===lines.length-1){doc.setLineWidth(.6);doc.line(xl-4,y+lh,xr+4,y+lh)}}
   const zl=L.ln.length?Math.max(...L.ln.map(q=>q.t.z0)):b.z,x0=xl+(L.first?(b.mark?0:b.ti):0)+off,by=y+(lh-zl)/2+zl*.8;let c=0;
   if(L.first&&b.mark){sf({b:b.b,i:b.i,fm:pdfFam(b.f||B.fam)},b.z);doc.setTextColor(0,0,0);doc.text(b.mark,xl+b.ti,by)}
   L.ln.forEach(q=>{const t=q.t,px=x0+q.x+c;if(t.sp){c+=ex;return}sf(t,t.z);doc.setTextColor(...rgb(t.c?hx(t.c):'000000'));const yy=by-(t.sup?t.z0*.33:0)+(t.sub?t.z0*.12:0);doc.text(t.w,px,yy);if(t.u)doc.line(px,yy+1.5,px+q.w,yy+1.5);if(t.s)doc.line(px,yy-t.z*.3,px+q.w,yy-t.z*.3)});
   if(!pc[N()])pc[N()]=ch;y+=lh});
  y+=b.mb});
 const tot=doc.getNumberOfPages(),sub=(s,n)=>(s||'').replace(/[{]titulo[}]/g,B.tit).replace(/[{]autor[}]/g,B.aut).replace(/[{]capitulo[}]/g,pc[n]||'').replace(/[{]pagina[}]/g,pnum(n));
 for(let p=cv?2:1;p<=tot;p++){const n=p-(cv?1:0),m=M(n),pre=n%2===1||!B.eo?1:2;doc.setPage(p);
  [['h',top/2+3],['f',bot+(H-bot)/2+3]].forEach(([z,yy])=>{if(z==='h'&&B.nch&&cs[n])return;if(z==='f'&&B.nfc&&cs[n])return;
   const sz=B[z+'Z']||9,sp=B[z+'S']?sz*.14:0,rule=B[z+'L'];doc.setFont(F,pfStyle(F,0,B[z+'I']));doc.setFontSize(sz);doc.setTextColor(90);
   [['l',m.l,'left'],['c',(m.l+W-m.r)/2,'center'],['r',W-m.r,'right']].forEach(([s,x,a])=>{let t=sub(B[z+pre+s],n);if(!t)return;if(B[z+'T'])t=t.toUpperCase();sp?spaced(doc,t,x,yy,a,sp):doc.text(t,x,yy,{align:a})});
   if(rule&&rule!=='none'){const ly=z==='h'?yy+5:yy-sz-3,d=z==='h'?1:-1;doc.setDrawColor(150);doc.setLineWidth(rule==='thick'?1.4:.4);doc.line(m.l,ly,W-m.r,ly);if(rule==='double'){doc.setLineWidth(.4);doc.line(m.l,ly+2.6*d,W-m.r,ly+2.6*d)}}})}
 return[slug()+'.pdf',doc.output('blob')]}
/* ----- Word ----- */
async function docx(){const mm=72/25.4,[Wm,Hm]=SZ[B.size],W=Math.round(Wm*56.69),H=Math.round(Hm*56.69),T=v=>Math.round(v*20),X=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),FN={times:'Times New Roman',helvetica:'Arial',courier:'Courier New'},fn=FN[B.fam]||B.fam,cv=B.cov_on,P=CV[B.cov]||CV['Clásica'],NS=`xmlns:w='http://schemas.openxmlformats.org/wordprocessingml/2006/main' xmlns:r='http://schemas.openxmlformats.org/officeDocument/2006/relationships'`,XH=`<?xml version='1.0' encoding='UTF-8' standalone='yes'?>`;
 const bl=blocks(ms());await loadAll(bl);const media=[];let did=1;
 const usedF=new Set([B.fam,B.cfam].concat(bl.flatMap(b=>[b.f].concat((b.r||[]).map(r=>r.f)))).filter(n=>FONT_INC.includes(n))),emb=[];
 for(const n of usedF){const d=await pfData(n);if(d)emb.push([n,d])}
 const imgXml=(d,w,h)=>{const id=did++,rid='rIdM'+id,ext=d.fmt==='PNG'?'png':'jpeg';media.push({name:`image${id}.${ext}`,rid,d});const cx=Math.round(w*12700),cy=Math.round(h*12700);
  return `<w:r><w:drawing><wp:inline distT='0' distB='0' distL='0' distR='0' xmlns:wp='http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'><wp:extent cx='${cx}' cy='${cy}'/><wp:docPr id='${id}' name='Imagen ${id}'/><a:graphic xmlns:a='http://schemas.openxmlformats.org/drawingml/2006/main'><a:graphicData uri='http://schemas.openxmlformats.org/drawingml/2006/picture'><pic:pic xmlns:pic='http://schemas.openxmlformats.org/drawingml/2006/picture'><pic:nvPicPr><pic:cNvPr id='${id}' name='image${id}'/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed='${rid}'/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x='0' y='0'/><a:ext cx='${cx}' cy='${cy}'/></a:xfrm><a:prstGeom prst='rect'><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`};
 const rp=(t,z)=>`<w:rPr><w:rFonts w:ascii='${X(t.f||fn)}' w:hAnsi='${X(t.f||fn)}' w:cs='${X(t.f||fn)}'/>${t.b?'<w:b/>':''}${t.i?'<w:i/>':''}${t.s?'<w:strike/>':''}${t.c?`<w:color w:val='${hx(t.c)}'/>`:''}<w:sz w:val='${Math.round(z*2)}'/>${t.u?`<w:u w:val='single'/>`:''}${t.sup?`<w:vertAlign w:val='superscript'/>`:t.sub?`<w:vertAlign w:val='subscript'/>`:''}<w:lang w:val='${({ca:'ca-ES',en:'en-US',fr:'fr-FR'})[t.lg]||'es-ES'}'/></w:rPr>`,run=(t,z)=>t.br?'<w:r><w:br/></w:r>':`<w:r>${rp(t,z)}<w:t xml:space='preserve'>${X(t.t)}</w:t></w:r>`;
 const jc=b=>({center:'center',right:'right'}[b.al]||(b.al==='justify'?(b.lal==='justify'?'distribute':'both'):'left'));
 const bdr=b=>{if(!b.bd)return'';const c=hx(b.bdc||'#808080'),ln=s=>`<w:${s} w:val='single' w:sz='4' w:space='4' w:color='${c}'/>`,k=b.bd;return `<w:pBdr>${k==='box'?ln('top')+ln('left')+ln('bottom')+ln('right'):k==='left'?`<w:left w:val='single' w:sz='18' w:space='6' w:color='${c}'/>`:k==='top'?ln('top'):k==='bottom'?ln('bottom'):ln('top')+ln('bottom')}</w:pBdr>`};
 const LF={times:1.15,helvetica:1.15,courier:1.133}[B.fam]||1.15;
 const textW=pt=>(Wm-B.mi-B.mo)*mm-pt;
 const par=b=>{const lhp=b.im?0:b.lx||Math.max(b.z,...b.r.map(r=>r.z?B.fs*r.z:0))*b.lh,sp=`<w:spacing w:before='${T(b.mt)}' w:after='${T(b.mb)}' w:line='${b.im?240:Math.max(20,T(lhp))}' w:lineRule='${b.im?'auto':'exact'}'/>`;
  if(b.im){const d=IM[b.src];if(!d)return'';const tw=textW(b.ml+b.mr);let w=b.wp?tw*b.wp/100:Math.min(tw,d.w*.75),h=w*d.h/d.w;const mh=(Hm-B.mt-B.mb)*mm*.92;if(h>mh){w*=mh/h;h=mh}
   return `<w:p><w:pPr>${b.kn?'<w:keepNext/>':''}${b.pb?'<w:pageBreakBefore/>':''}${sp}<w:ind w:left='${T(b.ml)}' w:right='${T(b.mr)}'/><w:jc w:val='${jc(b)}'/></w:pPr>${imgXml(d,w,h)}</w:p>`}
  return `<w:p><w:pPr>${b.ch?`<w:pStyle w:val='Heading1'/>`:''}${b.kn||b.hd?'<w:keepNext/>':''}${b.kt?'<w:keepLines/>':''}${b.pb?'<w:pageBreakBefore/>':''}<w:widowControl w:val='${b.wo?1:0}'/>${bdr(b)}${b.bg?`<w:shd w:val='clear' w:color='auto' w:fill='${b.bg}'/>`:''}${b.al!=='justify'?'<w:suppressAutoHyphens/>':''}${sp}<w:ind w:left='${T(b.ml)}' w:right='${T(b.mr)}' ${b.ti<0?`w:hanging='${T(-b.ti)}'`:`w:firstLine='${T(b.ti)}'`}/><w:jc w:val='${jc(b)}'/></w:pPr>${b.mark?run({t:b.mark,lg:b.lg,b:b.b,i:b.i,f:b.f},b.z)+'<w:r><w:tab/></w:r>':''}${b.r.map(r=>run({...r,lg:b.lg,b:r.b||b.b,i:r.i||b.i,f:r.f||b.f},r.z?B.fs*r.z:b.z)).join('')}</w:p>`};
 /* portada */
 const cf=B.cfam||FN[P.f]||fn,cc=P.al==='c'?'center':'left',cp=(t,z,col,o)=>`<w:p><w:pPr><w:spacing w:before='${o.bf||0}' w:after='${o.af||0}'/><w:jc w:val='${cc}'/></w:pPr><w:r><w:rPr><w:rFonts w:ascii='${cf}' w:hAnsi='${cf}'/>${o.b?'<w:b/>':''}${o.i?'<w:i/>':''}${P.up&&o.up?'<w:caps/>':''}<w:color w:val='${col}'/>${P.sp&&o.up?`<w:spacing w:val='${Math.round(z*2.2)}'/>`:''}<w:sz w:val='${Math.round(z*2)}'/></w:rPr><w:t xml:space='preserve'>${X(t)}</w:t></w:r></w:p>`;
 const pad=Math.round(W*.13),pgSz=`<w:pgSz w:w='${W}' w:h='${H}'/>`,tx=hx(B.ctx),ac=hx(B.cac),bgc=hx(B.cbg),cvH=H-240,cim=cv&&B.cimg?IM[B.cimg]:null;
 const cimP=bf=>{if(!cim)return'';let w=Wm*mm*.45,h=w*cim.h/cim.w;const mh=Hm*mm*.24;if(h>mh){w*=mh/h;h=mh}return `<w:p><w:pPr><w:spacing w:before='${bf}' w:after='0'/><w:jc w:val='${cc}'/></w:pPr>${imgXml(cim,w,h)}</w:p>`};
 const cTop=cim&&B.cimp!=='mid',cMid=cim&&B.cimp==='mid',fr=!!P.fr;
 const core=cp(B.tit||'Título',+B.ctz||(P.sp?30:34),tx,{b:1,up:1,bf:cTop?Math.round(H*.04):Math.round(H*(cMid?.2:fr?.22:.28)),af:240})+(B.sub?cp(B.sub,+B.csz||15,P.bands?tx:ac,{i:1,af:200}):'')+(cMid?cimP(Math.round(H*.03)):'');
 const authorP=(col,bf)=>cp(B.aut,+B.caz||14,col,{bf})+(B.tag?cp(B.tag,+B.cgz||10,P.bands?bgc:ac,{}):'');
 const tbl=(w,borders,rows,mar)=>`<w:tbl><w:tblPr><w:tblW w:w='${w}' w:type='dxa'/><w:tblInd w:w='0' w:type='dxa'/>${borders||''}<w:tblLayout w:type='fixed'/><w:tblCellMar><w:left w:w='${mar}' w:type='dxa'/><w:right w:w='${mar}' w:type='dxa'/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w='${w}'/></w:tblGrid>${rows}</w:tbl>`;
 const row=(w,h,fill,inner)=>`<w:tr><w:trPr><w:trHeight w:val='${h}' w:hRule='exact'/></w:trPr><w:tc><w:tcPr><w:tcW w:w='${w}' w:type='dxa'/>${fill?`<w:shd w:val='clear' w:color='auto' w:fill='${fill}'/>`:''}</w:tcPr>${inner}</w:tc></w:tr>`;
 const tiny=`<w:p><w:pPr><w:spacing w:before='0' w:after='0' w:line='20' w:lineRule='exact'/></w:pPr></w:p>`;
 let coverBody='';
 if(cv){
  if(P.bands){const h1=Math.round(cvH*.15),h3=h1,h2=cvH-h1-h3;
   coverBody=tbl(W,'',row(W,h1,ac,cp(B.tag||' ',+B.cgz||10,bgc,{bf:Math.round(h1*.35)}))+row(W,h2,bgc,(cTop?cimP(Math.round(H*.05)):'')+core+'')+row(W,h3,ac,cp(B.aut,+B.caz||14,bgc,{bf:Math.round(h3*.3)})),pad)}
  else if(fr){const fm=Math.round(W*.07),iw=W-2*fm,fh=cvH-2*fm-60,dbl=P.fr==='double',bd=`<w:tblBorders>${['top','left','bottom','right'].map(s=>`<w:${s} w:val='${dbl?'double':'single'}' w:sz='${dbl?18:10}' w:space='0' w:color='${ac}'/>`).join('')}</w:tblBorders>`;
   const orw=P.cen?cp('\u25C6   \u25C6   \u25C6   \u25C6   \u25C6',10,ac,{bf:60,af:0}):'',inner=orw+(cTop?cimP(Math.round(H*.05)):'')+core+authorP(tx,Math.round(H*(cMid?.13:.2)))+orw;
   coverBody=tbl(W,'',row(W,cvH,bgc,`<w:p><w:pPr><w:spacing w:before='0' w:after='0' w:line='${fm}' w:lineRule='exact'/></w:pPr></w:p>`+tbl(iw,bd,row(iw,fh,'',inner),Math.round(W*.06))+tiny),fm)}
  else coverBody=tbl(W,'',row(W,cvH,bgc,(cTop?cimP(Math.round(H*.1)):'')+core+authorP(tx,Math.round(H*(cMid?.13:.3)))),pad);
  coverBody+=`<w:p><w:pPr><w:spacing w:before='0' w:after='0' w:line='20' w:lineRule='exact'/><w:sectPr>${pgSz}<w:pgMar w:top='0' w:right='0' w:bottom='0' w:left='0' w:header='0' w:footer='0' w:gutter='0'/></w:sectPr></w:pPr></w:p>`}
 const mg=`<w:pgMar w:top='${T(B.mt*mm)}' w:right='${T(B.mo*mm)}' w:bottom='${T(B.mb*mm)}' w:left='${T(B.mi*mm)}' w:header='${T(B.mt*mm/2)}' w:footer='${T(B.mb*mm/2)}' w:gutter='0'/>`;
 /* "Sin encabezado/pie en la primera página de cada capítulo": cada capítulo empieza una sección con página inicial propia */
 const nSec=!!(B.nch||B.nfc),secX=first=>`<w:sectPr><w:headerReference w:type='default' r:id='rId3'/><w:headerReference w:type='even' r:id='rId4'/>${nSec?`<w:headerReference w:type='first' r:id='rId7'/>`:''}<w:footerReference w:type='default' r:id='rId5'/><w:footerReference w:type='even' r:id='rId6'/>${nSec?`<w:footerReference w:type='first' r:id='rId8'/>`:''}${pgSz}${mg}${first?`<w:pgNumType w:start='1'/>`:''}${nSec?'<w:titlePg/>':''}</w:sectPr>`;
 const parts=bl.map(par);let firstSec=true;
 if(nSec)for(let i=1;i<bl.length;i++)if(bl[i].ch&&bl[i].pb){let j=i-1;while(j>=0&&!parts[j])j--;if(j<0)continue;parts[j]=parts[j].replace('</w:pPr>',secX(firstSec)+'</w:pPr>');firstSec=false}
 const body=parts.join('');
 const doc=`${XH}<w:document ${NS}><w:body>${coverBody}${body}${secX(firstSec)}</w:body></w:document>`;
 /* encabezados y pies */
 const tw=W-T(B.mi*mm)-T(B.mo*mm),hrp=z=>`<w:rPr>${B[z+'I']?'<w:i/>':''}${B[z+'T']?'<w:caps/>':''}<w:color w:val='666666'/>${B[z+'S']?`<w:spacing w:val='${Math.round((B[z+'Z']||9)*2.8)}'/>`:''}<w:sz w:val='${Math.round((B[z+'Z']||9)*2)}'/></w:rPr>`;
 const seg=(s,z)=>{const h=hrp(z),f=B.pnf||'n',pre=f==='dash'?'– ':f==='pag'?'Página ':'',post=f==='dash'?' –':'',sw=f==='roman'?' \\* roman':f==='ROMAN'?' \\* ROMAN':'',tr=t=>`<w:r>${h}<w:t xml:space='preserve'>${X(t)}</w:t></w:r>`;
  return (s||'').replace(/[{]titulo[}]/g,B.tit).replace(/[{]autor[}]/g,B.aut).split(/([{]pagina[}]|[{]capitulo[}])/).filter(Boolean).map(q=>q==='{pagina}'?(pre?tr(pre):'')+`<w:fldSimple w:instr=' PAGE${sw} '><w:r>${h}<w:t>1</w:t></w:r></w:fldSimple>`+(post?tr(post):''):q==='{capitulo}'?`<w:fldSimple w:instr=' STYLEREF &quot;Heading 1&quot; '><w:r>${h}<w:t> </w:t></w:r></w:fldSimple>`:tr(q)).join('')};
 const hf=(z,pre)=>{const tg=z==='h'?'hdr':'ftr',rl=B[z+'L'],bt=z==='h'?'bottom':'top';return `${XH}<w:${tg} ${NS}><w:p><w:pPr>${rl&&rl!=='none'?`<w:pBdr><w:${bt} w:val='${rl==='double'?'double':'single'}' w:sz='${rl==='thick'?14:4}' w:space='4' w:color='999999'/></w:pBdr>`:''}<w:tabs><w:tab w:val='center' w:pos='${Math.round(tw/2)}'/><w:tab w:val='right' w:pos='${tw}'/></w:tabs></w:pPr>${seg(B[z+pre+'l'],z)}<w:r><w:tab/></w:r>${seg(B[z+pre+'c'],z)}<w:r><w:tab/></w:r>${seg(B[z+pre+'r'],z)}</w:p></w:${tg}>`};
 const z=new JSZip(),W1='application/vnd.openxmlformats-officedocument.wordprocessingml.',RT='http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
 z.file('[Content_Types].xml',`${XH}<Types xmlns='http://schemas.openxmlformats.org/package/2006/content-types'><Default Extension='rels' ContentType='application/vnd.openxmlformats-package.relationships+xml'/><Default Extension='xml' ContentType='application/xml'/><Default Extension='odttf' ContentType='application/vnd.openxmlformats-officedocument.obfuscatedFont'/><Default Extension='png' ContentType='image/png'/><Default Extension='jpeg' ContentType='image/jpeg'/><Override PartName='/word/document.xml' ContentType='${W1}document.main+xml'/><Override PartName='/word/styles.xml' ContentType='${W1}styles+xml'/><Override PartName='/word/settings.xml' ContentType='${W1}settings+xml'/><Override PartName='/word/fontTable.xml' ContentType='${W1}fontTable+xml'/>${[1,2,3].map(i=>`<Override PartName='/word/header${i}.xml' ContentType='${W1}header+xml'/><Override PartName='/word/footer${i}.xml' ContentType='${W1}footer+xml'/>`).join('')}</Types>`);
 z.file('_rels/.rels',`${XH}<Relationships xmlns='http://schemas.openxmlformats.org/package/2006/relationships'><Relationship Id='rId1' Type='${RT}officeDocument' Target='word/document.xml'/></Relationships>`);
 z.file('word/_rels/document.xml.rels',`${XH}<Relationships xmlns='http://schemas.openxmlformats.org/package/2006/relationships'><Relationship Id='rId1' Type='${RT}styles' Target='styles.xml'/><Relationship Id='rId2' Type='${RT}settings' Target='settings.xml'/><Relationship Id='rId3' Type='${RT}header' Target='header1.xml'/><Relationship Id='rId4' Type='${RT}header' Target='header2.xml'/><Relationship Id='rId5' Type='${RT}footer' Target='footer1.xml'/><Relationship Id='rId6' Type='${RT}footer' Target='footer2.xml'/><Relationship Id='rId7' Type='${RT}header' Target='header3.xml'/><Relationship Id='rId8' Type='${RT}footer' Target='footer3.xml'/><Relationship Id='rId9' Type='${RT}fontTable' Target='fontTable.xml'/>${media.map(m=>`<Relationship Id='${m.rid}' Type='${RT}image' Target='media/${m.name}'/>`).join('')}</Relationships>`);
 media.forEach(m=>z.file('word/media/'+m.name,m.d.data.split(',')[1],{base64:true}));
 z.file('word/document.xml',doc);
 z.file('word/styles.xml',`${XH}<w:styles ${NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii='${fn}' w:hAnsi='${fn}' w:cs='${fn}'/><w:sz w:val='${Math.round(B.fs*2)}'/><w:lang w:val='es-ES'/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type='paragraph' w:default='1' w:styleId='Normal'><w:name w:val='Normal'/></w:style><w:style w:type='paragraph' w:styleId='Heading1'><w:name w:val='Heading 1'/><w:basedOn w:val='Normal'/><w:next w:val='Normal'/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val='0'/></w:pPr></w:style></w:styles>`);
 z.file('word/settings.xml',`${XH}<w:settings ${NS}>${emb.length?'<w:embedTrueTypeFonts/>':''}${B.mir?'<w:mirrorMargins/>':''}<w:defaultTabStop w:val='720'/>${B.hyp!==0&&B.hyp!==false?`<w:autoHyphenation/><w:consecutiveHyphenLimit w:val='2'/>`:''}${B.eo?'<w:evenAndOddHeaders/>':''}<w:compat><w:compatSetting w:name='compatibilityMode' w:uri='http://schemas.microsoft.com/office/word' w:val='15'/></w:compat></w:settings>`);
 z.file('word/header1.xml',hf('h',1));z.file('word/header2.xml',hf('h',B.eo?2:1));z.file('word/footer1.xml',hf('f',1));z.file('word/footer2.xml',hf('f',B.eo?2:1));
 const emp=t=>`${XH}<w:${t} ${NS}><w:p/></w:${t}>`;{const ST={embedRegular:'400n',embedBold:'700n',embedItalic:'400i',embedBoldItalic:'700i'},guid=()=>'{'+'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)}).toUpperCase()+'}';let rels='',ft='',n=0;
  emb.forEach(([name,d])=>{ft+=`<w:font w:name='${X(name)}'><w:charset w:val='00'/><w:family w:val='auto'/><w:pitch w:val='variable'/>`;
   for(const tg in ST){const b64=d[ST[tg]];if(!b64)continue;n++;const g=guid(),u=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)),hex=g.replace(/[{}-]/g,''),key=[];for(let i=0;i<16;i++)key.push(parseInt(hex.substr(i*2,2),16));key.reverse();for(let i=0;i<32;i++)u[i]^=key[i%16];
    z.file(`word/fonts/font${n}.odttf`,u);rels+=`<Relationship Id='rIdF${n}' Type='${RT}font' Target='fonts/font${n}.odttf'/>`;ft+=`<w:${tg} r:id='rIdF${n}' w:fontKey='${g}'/>`}
   ft+='</w:font>'});
  z.file('word/fontTable.xml',`${XH}<w:fonts ${NS}>${ft}</w:fonts>`);z.file('word/_rels/fontTable.xml.rels',`${XH}<Relationships xmlns='http://schemas.openxmlformats.org/package/2006/relationships'>${rels}</Relationships>`)}
 z.file('word/header3.xml',B.nch?emp('hdr'):hf('h',1));z.file('word/footer3.xml',B.nfc?emp('ftr'):hf('f',1));
 return[slug()+'.docx',await z.generateAsync({type:'blob'})]}

/* ===== Littera · Editor: tamaño de letra, párrafo, imágenes, temas ===== */
try{document.execCommand('defaultParagraphSeparator',false,'p')}catch(e){}
const caretEl=()=>{const s=getSelection();if(!s.rangeCount)return null;const n=s.anchorNode;if(!n||!page.contains(n))return null;return n.nodeType===3?n.parentElement:n};
const curBlock=()=>{let e=caretEl();while(e&&e.parentElement!==page)e=e.parentElement;return e};
function reselect(a,b){const r=document.createRange();r.setStart(a,0);r.setEnd(b,b.nodeType===3?b.nodeValue.length:b.childNodes.length);const s=getSelection();s.removeAllRanges();s.addRange(r);range=r.cloneRange()}
/* Estilo "de escritura": con el cursor sin selección se inserta un span invisible que recibe lo que se escriba */
function typingSpan(css){const id='ts'+Date.now(),st=Object.entries(css).map(([k,v])=>k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+':'+v).join(';');
 document.execCommand('insertHTML',false,`<span id="${id}" style="${st}">&#8203;</span>`);
 const sp=document.getElementById(id);if(sp){sp.removeAttribute('id');const r=document.createRange();r.setStart(sp.firstChild,sp.firstChild.nodeValue.length);r.collapse(true);const s=getSelection();s.removeAllRanges();s.addRange(r)}}
const emptyBlock=b=>b&&!/^(UL|OL|TABLE)$/.test(b.tagName)&&!b.textContent.replace(/\u200B/g,'').trim()&&!b.querySelector('img');
function typeStyle(css){rs();const s=getSelection();if(!s.rangeCount)return;
 if(!s.getRangeAt(0).collapsed)return false;
 const b=curBlock();
 if(emptyBlock(b)){Object.entries(css).forEach(([k,v])=>b.style[k]=v);b.querySelectorAll('[style]').forEach(x=>{Object.keys(css).forEach(k=>x.style[k]='')})}else typingSpan(css);
 stats();save();return true}
function setSize(pt){if(typeStyle({fontSize:pt+'pt'}))return;
 document.execCommand('styleWithCSS',false,false);document.execCommand('fontSize',false,'7');
 const made=[];page.querySelectorAll('font[size="7"]').forEach(f=>{const sp=document.createElement('span');sp.style.fontSize=pt+'pt';while(f.firstChild)sp.appendChild(f.firstChild);sp.querySelectorAll('[style*="font-size"]').forEach(x=>x.style.fontSize='');f.replaceWith(sp);made.push(sp)});
 page.querySelectorAll('span[style*="font-size"]').forEach(x=>{if(!x.textContent&&!x.querySelector('img'))x.remove()});
 if(made.length&&made[0].isConnected)reselect(made[0].firstChild||made[0],made[made.length-1].lastChild||made[made.length-1]);
 stats();save()}
function setFont(name){if(typeStyle({fontFamily:`'${name}'`}))return;cmd('fontName',name)}
$('#sSize').innerHTML=[8,9,10,11,11.5,12,13,14,16,18,20,24,28,32,36,48,72].map(v=>`<option value="${v}">${v}</option>`).join('');
$('#sSize').value='11.5';
$('#sSize').onchange=e=>setSize(+e.target.value);
$('#sFont').onchange=e=>setFont(e.target.value);
/* Sincroniza la barra con el texto bajo el cursor (tamaño, fuente, negrita…) */
function setOpt(sel,val,label){let o=[...sel.options].find(x=>x.value===String(val));if(!o){o=new Option(label||val,val);const arr=[...sel.options],i=sel.dataset.num?arr.findIndex(x=>+x.value>+val):-1;i<0?sel.add(o):sel.add(o,arr[i])}sel.value=String(val)}
$('#sSize').dataset.num=1;
let syncT=0;
function syncTb(){const s=getSelection();if(!s.rangeCount||!page.contains(s.anchorNode))return;const ae=document.activeElement;if(ae&&ae!==page&&ae.closest&&ae.closest('#tb,#tb2,#pg'))return;
 const e=caretEl();if(!e)return;const cs=getComputedStyle(e);
 setOpt($('#sSize'),Math.round(parseFloat(cs.fontSize)*.75*2)/2);
 const ff=cs.fontFamily.split(',')[0].replace(/["']/g,'').trim();if(ff)setOpt($('#sFont'),ff);
 $$('#tb [data-c]').forEach(b=>{let on=false;try{on=document.queryCommandState(b.dataset.c)}catch(x){}b.classList.toggle('on',!!on)});
 const bk=curBlock(),tg=bk?bk.tagName.toLowerCase():'p';$('#sBlk').value=['p','h1','h2','h3','blockquote'].includes(tg)?tg:'p'}
document.addEventListener('selectionchange',()=>{cancelAnimationFrame(syncT);syncT=requestAnimationFrame(syncTb)});
/* Intro: el párrafo nuevo conserva tamaño y fuente de donde se estaba escribiendo */
let pend=null;
page.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.ctrlKey&&!e.metaKey){const el=caretEl();pend=null;if(el&&!el.closest('h1,h2,h3,li')){const cs=getComputedStyle(el);pend={sz:Math.round(parseFloat(cs.fontSize)*.75*100)/100,ff:cs.fontFamily,px:cs.fontSize}}}});
page.addEventListener('input',e=>{if(e.inputType==='insertParagraph'&&pend){const el=caretEl();if(el){const cs=getComputedStyle(el);if(cs.fontSize!==pend.px||cs.fontFamily!==pend.ff){const b=curBlock();const css={fontSize:pend.sz+'pt',fontFamily:pend.ff};
  if(emptyBlock(b)){b.style.fontSize=css.fontSize;b.style.fontFamily=css.fontFamily;b.querySelectorAll('[style]').forEach(x=>{x.style.fontSize='';x.style.fontFamily=''})}else typingSpan(css)}}pend=null}});
/* Pegar: texto limpio (sin tamaños ni fuentes ajenas) o imagen */
let lastCopy='';
['copy','cut'].forEach(ev=>page.addEventListener(ev,()=>{lastCopy=String(getSelection())}));
const ALLOW=/^(P|H1|H2|H3|BLOCKQUOTE|UL|OL|LI|BR|B|STRONG|I|EM|U|S|STRIKE|SUP|SUB|A|TABLE|TBODY|TR|TD|TH|HR)$/;
function cleanHtml(h){const d=document.createElement('div');d.innerHTML=h;d.querySelectorAll('script,style,meta,img,svg').forEach(x=>x.remove());
 (function w(n){[...n.children].forEach(c=>{w(c);if(c.tagName==='DIV'){const p=document.createElement('p');while(c.firstChild)p.appendChild(c.firstChild);c.replaceWith(p);c=p}
  if(!ALLOW.test(c.tagName)){const f=document.createDocumentFragment();while(c.firstChild)f.appendChild(c.firstChild);const st=c.style;if(/bold|[6-9]00/.test(st.fontWeight)||st.fontStyle==='italic'||/underline/.test(st.textDecoration)){const sp=document.createElement('span');if(/bold|[6-9]00/.test(st.fontWeight))sp.style.fontWeight='bold';if(st.fontStyle==='italic')sp.style.fontStyle='italic';if(/underline/.test(st.textDecoration))sp.style.textDecoration='underline';sp.appendChild(f);c.replaceWith(sp)}else c.replaceWith(f);return}
  const ta=c.style.textAlign;c.removeAttribute('style');c.removeAttribute('class');c.removeAttribute('id');if(ta&&/^(P|H\d|BLOCKQUOTE)$/.test(c.tagName))c.style.textAlign=ta})})(d);return d.innerHTML}
page.addEventListener('paste',e=>{const cd=e.clipboardData;if(!cd)return;const f=[...(cd.files||[])].find(x=>/^image\//.test(x.type));
 if(f){e.preventDefault();insertImgFile(f);return}
 const h=cd.getData('text/html'),t=cd.getData('text/plain');
 if(h&&t!==lastCopy){e.preventDefault();document.execCommand('insertHTML',false,cleanHtml(h));stats();save()}});
/* Imágenes */
async function insertImgFile(f){const src=await readImg(f,1400);rs();
 cmd('insertHTML',`<p style="text-align:center;text-indent:0"><img src="${src}" style="width:80%"></p><p><br></p>`)}
$('#bImg').onclick=()=>{const s=getSelection();if(s.rangeCount&&page.contains(s.anchorNode))range=s.getRangeAt(0).cloneRange();$('#fImg').click()};
$('#fImg').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)insertImgFile(f)};
page.addEventListener('dragover',e=>{if([...(e.dataTransfer.types||[])].includes('Files'))e.preventDefault()});
page.addEventListener('drop',e=>{const f=[...(e.dataTransfer.files||[])].find(x=>/^image\//.test(x.type));if(!f)return;e.preventDefault();
 const r=document.caretRangeFromPoint?document.caretRangeFromPoint(e.clientX,e.clientY):null;if(r){const s=getSelection();s.removeAllRanges();s.addRange(r);range=r.cloneRange()}insertImgFile(f)});
const ibx=document.createElement('div'),ib=document.createElement('div');ibx.id='ibx';ib.id='ib';ibx.hidden=ib.hidden=true;
ib.innerHTML=`<button data-w="25">25%</button><button data-w="50">50%</button><button data-w="75">75%</button><button data-w="100">100%</button><input id="ibw" type="number" min="5" max="100" step="5" title="Ancho (% del texto)">%<button data-a="left" title="A la izquierda">⇤</button><button data-a="center" title="Centrada">↔</button><button data-a="right" title="A la derecha">⇥</button><button id="ibc" title="Añadir o quitar pie de imagen">Pie</button><button id="ibx2" title="Eliminar imagen">🗑</button>`;
document.body.append(ibx,ib);ib.addEventListener('mousedown',e=>{if(e.target.tagName!=='INPUT')e.preventDefault()});
let selImg=null;
function placeImg(){if(!selImg||!selImg.isConnected){ibx.hidden=ib.hidden=true;return}const r=selImg.getBoundingClientRect();
 Object.assign(ibx.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});ibx.hidden=false;ib.hidden=false;
 const bh=ib.offsetHeight||34;ib.style.left=Math.max(4,Math.min(r.left,innerWidth-ib.offsetWidth-6))+'px';ib.style.top=Math.max(4,r.top-bh-6<4?r.bottom+6:r.top-bh-6)+'px';
 const w=selImg.style.width;$('#ibw').value=/%$/.test(w)?parseFloat(w):Math.round(selImg.getBoundingClientRect().width/page.getBoundingClientRect().width*100)}
function pickImg(im){selImg=im;placeImg()}
page.addEventListener('click',e=>pickImg(e.target.tagName==='IMG'?e.target:null));
page.addEventListener('input',()=>{if(selImg)placeImg()});
$('#scroll').addEventListener('scroll',()=>{if(selImg)placeImg()});window.addEventListener('resize',()=>{if(selImg)placeImg()});
const imgBlock=()=>{let e=selImg;while(e&&e.parentElement!==page)e=e.parentElement;return e};
ib.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{selImg.style.width=b.dataset.w+'%';placeImg();stats();save()});
$('#ibw').onchange=e=>{const v=Math.max(5,Math.min(100,+e.target.value||80));selImg.style.width=v+'%';placeImg();stats();save()};
ib.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const k=imgBlock();if(k){k.style.textAlign=b.dataset.a;k.style.textIndent='0'}placeImg();stats();save()});
$('#ibc').onclick=()=>{const k=imgBlock();if(!k)return;const n=k.nextElementSibling;if(n&&n.dataset.cap){n.remove()}else{const c=document.createElement('p');c.dataset.cap='1';c.style.cssText='text-align:center;text-indent:0;font-style:italic;font-size:'+Math.round(B.fs*.85*2)/2+'pt';c.textContent='Pie de imagen';k.after(c);const r=document.createRange();r.selectNodeContents(c);const s=getSelection();s.removeAllRanges();s.addRange(r);page.focus()}stats();save()};
$('#ibx2').onclick=()=>{const k=imgBlock();if(!k)return;const only=!k.textContent.replace(/\u200B/g,'').trim()&&k.querySelectorAll('img').length===1;if(only){const n=k.nextElementSibling;if(n&&n.dataset.cap)n.remove();k.remove()}else selImg.remove();selImg=null;placeImg();if(!page.children.length)page.innerHTML='<p><br></p>';stats();save()};
/* Listas con estilo */
const LS=[['disc','• Viñetas'],['circle','○ Círculos'],['square','■ Cuadrados'],['decimal','1. Números'],['lower-alpha','a. Letras'],['upper-alpha','A. Letras'],['lower-roman','i. Romanos'],['upper-roman','I. Romanos']];
$('#sLs').innerHTML='<option value="">Lista…</option>'+LS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');
$('#sLs').onchange=e=>{const v=e.target.value;e.target.value='';if(!v)return;rs();const ord=/decimal|alpha|roman/.test(v);let l=caretEl()&&caretEl().closest('ul,ol');
 if(!l||(l.tagName==='OL')!==ord)document.execCommand(ord?'insertOrderedList':'insertUnorderedList');
 l=caretEl()&&caretEl().closest('ul,ol');if(l)l.style.listStyleType=v;stats();save()};
/* ===== Panel de formato de párrafo ===== */
const pg=$('#pg'),pgb=$('#pgb');
const ALS=[['left','Izquierda','⇤'],['center','Centrada','↔'],['right','Derecha','⇥'],['justify','Justificada','☰'],['justify-c','Justificada, última línea centrada','☰↔'],['justify-r','Justificada, última línea a la derecha','☰⇥'],['distribute','Distribuida (también la última línea)','⇔']];
pgb.innerHTML=`<h4>Alineación</h4><div class="chips" id="pgAl">${ALS.map(([k,t,i])=>`<button data-al="${k}" title="${t}">${i}</button>`).join('')}</div>
<h4>Sangría</h4><div class="row"><label>Izquierda (cm)<input id="pgL" type="number" step=".25"></label><label>Derecha (cm)<input id="pgR" type="number" step=".25"></label></div>
<div class="row"><label>Especial<select id="pgS"><option value="">Predeterminada</option><option value="none">Ninguna</option><option value="first">Primera línea</option><option value="hang">Francesa (colgante)</option></select></label><label>Valor (cm)<input id="pgSv" type="number" step=".25" min="0"></label></div>
<h4>Espaciado</h4><div class="row"><label>Antes (pt)<input id="pgB" type="number" step="1" min="0"></label><label>Después (pt)<input id="pgA" type="number" step="1" min="0"></label></div>
<div class="row"><label>Interlineado<select id="pgT"><option value="">Predeterminado</option>${['1','1.15','1.3','1.5','2','2.5','3'].map(v=>`<option value="${v}">${v}</option>`).join('')}<option value="m">Múltiple…</option><option value="x">Exacto (pt)…</option></select></label><label>Valor<input id="pgTv" type="number" step=".05" min="0"></label></div>
<h4>Paginación</h4><label class="ck"><input type="checkbox" id="pgPb">Salto de página antes</label><label class="ck"><input type="checkbox" id="pgKn">Conservar con el siguiente</label><label class="ck"><input type="checkbox" id="pgKt">Conservar líneas juntas</label><label class="ck"><input type="checkbox" id="pgWo">Control de líneas viudas y huérfanas</label>
<h4>Aspecto</h4><label class="ck"><input type="checkbox" id="pgDc">Letra capitular (solo pantalla)</label>
<div class="row"><label>Fondo<input id="pgBg" type="color" value="#fff3b0"></label><button id="pgBgx">Sin fondo</button></div>
<div class="row"><label>Borde<select id="pgBd"><option value="">Ninguno</option><option value="box">Recuadro</option><option value="left">Barra izquierda</option><option value="top">Superior</option><option value="bottom">Inferior</option><option value="tb">Superior e inferior</option></select></label><label>Color<input id="pgBc" type="color" value="#808080"></label></div>
<div class="row"><button id="pgRs">Restablecer formato de párrafo</button></div>`;
const getAl=b=>{const ta=b.style.textAlign||getComputedStyle(b).textAlign,tl=b.style.textAlignLast;if(ta==='justify'){if(tl==='center')return'justify-c';if(tl==='right')return'justify-r';if(tl==='justify')return'distribute';return'justify'}return ta==='center'||ta==='right'?ta:'left'};
function setAlign(b,k){b.style.textAlignLast='';if(k==='justify-c'){b.style.textAlign='justify';b.style.textAlignLast='center'}else if(k==='justify-r'){b.style.textAlign='justify';b.style.textAlignLast='right'}else if(k==='distribute'){b.style.textAlign='justify';b.style.textAlignLast='justify'}else b.style.textAlign=k}
function setBorder(b,k,c){c=c||'#808080';['Top','Right','Bottom','Left'].forEach(s=>b.style['border'+s]='');b.style.padding='';delete b.dataset.bd;delete b.dataset.bdc;if(!k)return;b.dataset.bd=k;b.dataset.bdc=c;const L='1px solid '+c;
 if(k==='box'){b.style.border=L;b.style.padding='4px 8px'}else if(k==='left'){b.style.borderLeft='3px solid '+c;b.style.paddingLeft='8px'}else{if(k==='top'||k==='tb')b.style.borderTop=L;if(k==='bottom'||k==='tb')b.style.borderBottom=L}}
const hex=c=>{const m=(c||'').match(/\d+/g);return m&&m.length>=3?'#'+m.slice(0,3).map(n=>(+n).toString(16).padStart(2,'0')).join(''):''};
function fillPg(b){const al=getAl(b);$$('#pgAl [data-al]').forEach(x=>x.classList.toggle('on',x.dataset.al===al));
 $('#pgL').value=fromStyle('marginLeft',b);$('#pgR').value=fromStyle('marginRight',b);
 const ti=b.style.textIndent,t=toPt(ti,b);$('#pgS').value=!ti?'':!t?'none':t>0?'first':'hang';$('#pgSv').value=t?+(Math.abs(t)/CMPT).toFixed(2):'';
 $('#pgB').value=fromStyle('marginTop',b);$('#pgA').value=fromStyle('marginBottom',b);
 const lh=b.style.lineHeight;let ty='',tv='';if(lh){if(/(pt|px|cm|mm|in)$/.test(lh)){ty='x';tv=+toPt(lh,b).toFixed(1)}else{const n=+parseFloat(lh).toFixed(2);ty=['1','1.15','1.3','1.5','2','2.5','3'].includes(String(n))?String(n):'m';tv=n}}
 $('#pgT').value=ty;$('#pgTv').value=tv;$('#pgTv').disabled=!/^[mx]$/.test(ty);
 $('#pgPb').checked=b.style.pageBreakBefore==='always';$('#pgKn').checked=b.dataset.kn==='1';$('#pgKt').checked=b.dataset.kt==='1';$('#pgWo').checked=b.dataset.wo!=='0';$('#pgDc').checked=b.classList.contains('dc');
 $('#pgBd').value=b.dataset.bd||'';if(b.dataset.bdc)$('#pgBc').value=b.dataset.bdc;if(b.style.backgroundColor)$('#pgBg').value=hex(b.style.backgroundColor)||'#fff3b0'}
const onPg=(sel,fn)=>{const el=$(sel);el.onchange=()=>{rs();blks().forEach(b=>fn(b,el));stats();save();fillP()}};
$$('#pgAl [data-al]').forEach(x=>{x.onmousedown=e=>e.preventDefault();x.onclick=()=>{rs();blks().forEach(b=>setAlign(b,x.dataset.al));stats();save();fillP()}});
onPg('#pgL',(b,e)=>b.style.marginLeft=e.value===''?'':e.value+'cm');onPg('#pgR',(b,e)=>b.style.marginRight=e.value===''?'':e.value+'cm');
const setSpecial=b=>{const k=$('#pgS').value,v=+$('#pgSv').value||(k==='first'||k==='hang'?1:0);if(k==='')b.style.textIndent='';else if(k==='none')b.style.textIndent='0';else if(k==='first')b.style.textIndent=v+'cm';else{b.style.textIndent=-v+'cm';const l=toPt(b.style.marginLeft,b)||0;if(l<v*CMPT-.5)b.style.marginLeft=v+'cm'}};
onPg('#pgS',setSpecial);onPg('#pgSv',b=>{if(/^(first|hang)$/.test($('#pgS').value))setSpecial(b)});
onPg('#pgB',(b,e)=>b.style.marginTop=e.value===''?'':e.value+'pt');onPg('#pgA',(b,e)=>b.style.marginBottom=e.value===''?'':e.value+'pt');
onPg('#pgT',(b,e)=>{const v=e.value;b.style.lineHeight=v===''?'':v==='m'?($('#pgTv').value||'1.5'):v==='x'?(($('#pgTv').value||'16')+'pt'):v});
onPg('#pgTv',b=>{const v=$('#pgT').value,n=$('#pgTv').value;if(v==='m'&&n)b.style.lineHeight=n;if(v==='x'&&n)b.style.lineHeight=n+'pt'});
onPg('#pgPb',(b,e)=>b.style.pageBreakBefore=e.checked?'always':'');
onPg('#pgKn',(b,e)=>{if(e.checked)b.dataset.kn='1';else delete b.dataset.kn});onPg('#pgKt',(b,e)=>{if(e.checked)b.dataset.kt='1';else delete b.dataset.kt});
onPg('#pgWo',(b,e)=>{if(e.checked)delete b.dataset.wo;else b.dataset.wo='0'});
onPg('#pgDc',(b,e)=>b.classList.toggle('dc',e.checked));
onPg('#pgBg',(b,e)=>b.style.backgroundColor=e.value);$('#pgBgx').onclick=()=>{rs();blks().forEach(b=>b.style.backgroundColor='');stats();save()};
onPg('#pgBd',(b,e)=>setBorder(b,e.value,$('#pgBc').value));onPg('#pgBc',(b,e)=>{if(b.dataset.bd)setBorder(b,b.dataset.bd,e.value)});
$('#pgRs').onclick=()=>{rs();blks().forEach(b=>{b.removeAttribute('style');['kn','kt','wo','bd','bdc'].forEach(k=>delete b.dataset[k]);b.classList.remove('dc')});stats();save();fillP()};
$('#pgx').onclick=()=>{pg.hidden=true};
function openPg(){const t=$('#tp');if(t)t.hidden=true;pg.hidden=!pg.hidden;if(!pg.hidden){const s=getSelection();if(s.rangeCount&&page.contains(s.anchorNode))range=s.getRangeAt(0).cloneRange();const b=blks()[0];if(b)fillPg(b)}}
$('#bPg').onclick=openPg;$('#bPg2').onclick=openPg;
$$('#tb2 button,#tb button').forEach(b=>b.onmousedown=e=>e.preventDefault());
$('#sLh').innerHTML='<option value="">Interl.</option>'+['1','1.15','1.3','1.5','1.6','2','2.5','3'].map(v=>`<option value="${v}">${v}</option>`).join('');
$('#sLh').onchange=e=>{const v=e.target.value;e.target.value='';if(!v)return;rs();blks().forEach(b=>b.style.lineHeight=v);stats();save();fillP()};
$('#bMk').onclick=()=>{page.classList.toggle('marks');$('#bMk').classList.toggle('on')};
/* Temas de color */
const thSel=$('#sTheme');
if(window.LitteraTheme){thSel.innerHTML=LitteraTheme.list().map(g=>`<optgroup label="${g.g}">${g.items.map(t=>`<option value="${t.id}">${t.n}</option>`).join('')}</optgroup>`).join('');thSel.value=LitteraTheme.current();thSel.onchange=()=>LitteraTheme.apply(thSel.value)}
$('#aS').onclick=()=>add('s');
$('#iNc').onchange=e=>{cur().nc=e.target.checked?1:0;save()};
if(window.__testHook)window.__testHook({pdf,docx,ms,blocks,B,S,page,select,setSize,rs,compOpts,add,cur,get,kids,cleanHtml,setBorder,setAlign,CV});

if(window.visualViewport){const vf=()=>{const k=visualViewport.height<innerHeight-120;document.body.style.height=k?visualViewport.height+'px':'';if(k)window.scrollTo(0,0)};visualViewport.addEventListener('resize',vf)}
$('#ctr').addEventListener('pointerdown',()=>document.body.classList.remove('showB','showI'));
function setLang(){const i=cur(),l=i.lg||B.lang||'es';if(l==='all')page.removeAttribute('lang');else page.lang=l;page.spellcheck=true;$('#sLg').value=l;if(window.plumaSpell)plumaSpell.set(l)}
$('#sLg').onchange=e=>{cur().lg=e.target.value;setLang();save()};
const sel0=select;select=function(id){sel0(id);setLang()};
/* ===== Papel y zoom ===== */
const PX=96/25.4;
Object.assign(SZ,{A6:[105,148],B6:[125,176],B5:[176,250],A3:[297,420],Legal:[215.9,355.6],Personalizado:[B.cw||140,B.ch||210]});
const pp=$('#sPp'),zm=$('#sZm');
function applyPaper(){
 if(!B.size||!SZ[B.size])B.size='A5';
 if(B.size==='Personalizado')SZ.Personalizado=[B.cw||140,B.ch||210];
 pp.innerHTML=Object.keys(SZ).map(k=>k==='Personalizado'?`<option value="Personalizado">Personalizado${B.size===k?' · '+SZ[k][0]+'×'+SZ[k][1]+' mm':'…'}</option>`:`<option value="${k}">${k} · ${SZ[k][0]}×${SZ[k][1]} mm</option>`).join('');
 pp.value=B.size;zm.value=B.zoom||'fit';
 const[w,h]=SZ[B.size],wp=w*PX,sc=$('#scroll');
 page.style.maxWidth='none';page.style.width=wp+'px';page.style.minHeight=(h*PX)+'px';
 page.style.padding=`${(B.mt??20)*PX}px ${(B.mo??16)*PX}px ${(B.mb??20)*PX}px ${(B.mi??22)*PX}px`;
 page.style.setProperty('--fs',B.fs);page.style.setProperty('--lh',B.lh);page.style.setProperty('--psb',B.psb);page.style.setProperty('--psa',B.psa);page.style.setProperty('--fli',B.fli);
 page.style.setProperty('--ff',ffCss(B.fam));page.classList.toggle('jus',!!B.jus);page.classList.toggle('hyp',B.hyp!==0&&B.hyp!==false);
 const ph={textIndent:B.fli,marginTop:B.psb,marginBottom:B.psa,lineHeight:B.lh};$$('[data-p]').forEach(e=>e.placeholder=ph[e.dataset.p]??'');
 const fit=!B.zoom||B.zoom==='fit';
 if(!fit)page.style.zoom=+B.zoom/100;else if(sc.clientWidth>120)page.style.zoom=Math.max(.3,Math.min(1.5,(sc.clientWidth-30)/wp));
}
pp.onchange=async()=>{const v=pp.value;
 if(v==='Personalizado'){const r=await askText('Ancho × alto en mm (por ejemplo 140x210)',(B.cw||140)+'x'+(B.ch||210));
  const m=r&&r.replace(/,/g,'.').match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/i);
  if(m&&+m[1]>=50&&+m[1]<=1000&&+m[2]>=50&&+m[2]<=1500){B.cw=+m[1];B.ch=+m[2];B.size='Personalizado'}}
 else B.size=v;
 applyPaper();save()};
zm.onchange=()=>{B.zoom=zm.value;applyPaper();save()};
['change','input'].forEach(ev=>document.addEventListener(ev,e=>{if(e.target.dataset&&e.target.dataset.k&&/^(size|mt|mb|mi|mo|fs|lh|fam|jus|psb|psa|fli)$/.test(e.target.dataset.k))applyPaper()}));
let rzT;window.addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(applyPaper,120)});
const sv0=setView;setView=function(v){sv0(v);applyPaper()};

/* ===== Corrector ortográfico (castellano / català) ===== */
const WORD=/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*(?:·[\p{L}\p{M}]+)*/gu;
const SP={cache:{es:new Map(),ca:new Map(),en:new Map(),fr:new Map()},ign:new Set(),ver:0,timer:null};
const docLang=()=>cur().lg||B.lang||'es';
const spLangs=()=>{const l=docLang();return l==='all'?['es','ca','en','fr']:[l]};
function tokenAt(node,off){
 if(!node||node.nodeType!==3)return null;
 const t=node.nodeValue,re=new RegExp(WORD.source,'gu');let m;
 while(m=re.exec(t)){if(off>=m.index&&off<=m.index+m[0].length){const s=m.index,e=s+m[0].length;
  return{w:m[0],n:node,s,e,range(){const r=new Range();r.setStart(node,s);r.setEnd(node,e);return r}}}}
 return null}
async function spellScan(){
 if(!window.plumaTools||!window.CSS||!CSS.highlights||view!=='ed')return;
 const ver=++SP.ver,langs=spLangs(),toks=[],tw=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);
 let n;while(n=tw.nextNode()){const re=new RegExp(WORD.source,'gu'),t=n.nodeValue;let m;
  while(m=re.exec(t))if(m[0].length>1)toks.push({n,s:m.index,e:m.index+m[0].length,w:m[0]})}
 try{
  for(const l of langs){
   const need=[...new Set(toks.map(t=>t.w))].filter(w=>!SP.cache[l].has(w));
   for(let i=0;i<need.length;i+=400){const part=need.slice(i,i+400),r=await plumaTools.spellCheck(l,part);part.forEach((w,j)=>SP.cache[l].set(w,r[j]));if(ver!==SP.ver)return}
  }
 }catch(e){return}
 if(ver!==SP.ver)return;
 const sel=getSelection(),ranges=[];
 for(const t of toks){
  if(SP.ign.has(t.w.toLowerCase())||langs.some(l=>SP.cache[l].get(t.w)))continue;
  if(sel.rangeCount&&sel.isCollapsed&&sel.anchorNode===t.n&&sel.anchorOffset>t.s&&sel.anchorOffset<=t.e&&document.activeElement===page)continue; // palabra que se está escribiendo
  try{const r=new Range();r.setStart(t.n,t.s);r.setEnd(t.n,t.e);ranges.push(r)}catch(e){}
 }
 CSS.highlights.set('typo',new Highlight(...ranges));
}
function spellSoon(ms){clearTimeout(SP.timer);SP.timer=setTimeout(spellScan,ms||500)}
page.addEventListener('input',()=>{CSS.highlights&&CSS.highlights.delete('gram');spellSoon(600)});
page.addEventListener('blur',()=>spellSoon(100));
const sl0=setLang;setLang=function(){sl0();page.spellcheck=false;SP.ver++;spellSoon(50)};
const isBad=w=>!SP.ign.has(w.toLowerCase())&&!spLangs().some(l=>SP.cache[l].get(w));

/* ===== Menú contextual del editor ===== */
const cm=$('#cm');
function hideCm(){cm.hidden=true}
function showCm(x,y,items){
 cm.innerHTML='';
 items.forEach(it=>{
  if(it==='-'){cm.appendChild(document.createElement('hr'));return}
  const d=document.createElement('div');d.textContent=it.t;if(it.b)d.className='b';if(it.off)d.className='d';
  if(!it.off)d.onclick=()=>{hideCm();it.f()};cm.appendChild(d)});
 cm.hidden=false;
 const r=cm.getBoundingClientRect();cm.style.left=Math.max(4,Math.min(x,innerWidth-r.width-6))+'px';cm.style.top=Math.max(4,Math.min(y,innerHeight-r.height-6))+'px';
}
document.addEventListener('mousedown',e=>{if(!cm.contains(e.target))hideCm()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideCm()});
window.addEventListener('blur',hideCm);$('#scroll').addEventListener('scroll',hideCm);
function replaceRange(r,text){page.focus();const s=getSelection();s.removeAllRanges();s.addRange(r);document.execCommand('insertText',false,text);stats();save();spellSoon(100)}
page.addEventListener('contextmenu',async e=>{
 e.preventDefault();
 const pos=document.caretPositionFromPoint?document.caretPositionFromPoint(e.clientX,e.clientY):null;
 let tk=null;
 if(pos&&pos.offsetNode&&page.contains(pos.offsetNode))tk=tokenAt(pos.offsetNode,pos.offset);
 const sel=getSelection(),hasSel=!sel.isCollapsed&&page.contains(sel.anchorNode);
 const items=[];
 if(tk&&!hasSel&&tk.w.length>1){
  if(isBad(tk.w)){
   const sug=await plumaTools.spellSuggest(docLang(),tk.w);
   if(sug.length)sug.forEach(s=>items.push({t:s,b:1,f:()=>replaceRange(tk.range(),s)}));else items.push({t:'Sin sugerencias',off:1});
   items.push('-');
   items.push({t:'Añadir al diccionario',f:async()=>{await plumaTools.spellAdd(tk.w);Object.values(SP.cache).forEach(m=>m.delete(tk.w));spellSoon(0)}});
   items.push({t:'Ignorar',f:()=>{SP.ign.add(tk.w.toLowerCase());spellSoon(0)}});
   items.push('-');
  }
  items.push({t:`Sinónimos y antónimos de «${tk.w}»`,f:()=>openThes(tk.w,tk.range())});items.push({t:`Buscar «${tk.w}» en la RAE`,f:()=>plumaTools.dict('rae',tk.w)});items.push({t:`Buscar «${tk.w}» en el IEC`,f:()=>plumaTools.dict('iec',tk.w)});extraDictItems(tk.w).forEach(x=>items.push(x));items.push('-');
 }else if(hasSel){
  const t=sel.toString().trim();if(t&&t.length<60&&!/\n/.test(t)){items.push({t:'Sinónimos y antónimos…',f:()=>openThes(t,sel.getRangeAt(0).cloneRange())});items.push({t:'Buscar en la RAE',f:()=>plumaTools.dict('rae',t)});items.push({t:'Buscar en el IEC',f:()=>plumaTools.dict('iec',t)});extraDictItems(t).forEach(x=>items.push(x));items.push('-')}
 }
 if(hasSel){items.push({t:'Cortar',f:()=>plumaTools.edit('cut')});items.push({t:'Copiar',f:()=>plumaTools.edit('copy')})}
 items.push({t:'Pegar',f:()=>plumaTools.edit('paste')});items.push({t:'Seleccionar todo',f:()=>plumaTools.edit('selectAll')});
 showCm(e.clientX,e.clientY,items);
});

/* ===== Panel: sinónimos / antónimos y gramática ===== */
const tp=$('#tp'),tpb=$('#tpb');
let tpTab='th',thTarget=null,thWord='',gr={matches:[],busy:false,msg:'',ran:false};
tpb.addEventListener('mousedown',e=>{if(e.target.closest('.chip,.gi,.gi *,button'))e.preventDefault()});
$('#tpx').onclick=()=>{tp.hidden=true;CSS.highlights&&CSS.highlights.delete('gram')};
$$('.tph [data-t]').forEach(b=>b.onclick=()=>{tpTab=b.dataset.t;renderTp()});
function renderTp(){$$('.tph [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===tpTab));tpTab==='th'?renderTh():renderGr()}
function showTp(tab){tpTab=tab;$('#pg').hidden=true;tp.hidden=false;renderTp()}
function matchCase(src,rep){
 if(src.length>1&&src===src.toUpperCase()&&src!==src.toLowerCase())return rep.toUpperCase();
 if(src[0]&&src[0]!==src[0].toLowerCase())return rep[0].toUpperCase()+rep.slice(1);
 return rep}
function openThes(word,range){
 if(!word){const s=getSelection();
  if(s.rangeCount&&page.contains(s.anchorNode)){const r=s.getRangeAt(0);
   if(!r.collapsed&&r.toString().trim().length<60){word=r.toString().trim();range=r.cloneRange()}
   else{const tk=tokenAt(r.startContainer,r.startOffset);if(tk){word=tk.w;range=tk.range()}}}}
 thTarget=range||null;thWord=word||'';tpTab='th';$('#pg').hidden=true;tp.hidden=false;renderTp();
}
async function renderTh(){
 tpb.innerHTML=`<div class="row"><input type="text" id="thq" placeholder="Escribe una palabra…" value="${esc(thWord)}"><button id="thg" class="on">Buscar</button></div>
 <div class="row"><select id="thl"><option value="auto">Idioma: según el documento</option><option value="es">Castellano</option><option value="ca">Català</option><option value="en">English</option><option value="fr">Français</option></select></div><div id="thr"></div>`;
 const q=$('#thq'),go=()=>{thWord=q.value.trim();lookup()};
 $('#thg').onclick=go;q.onkeydown=e=>{if(e.key==='Enter')go()};$('#thl').onchange=go;
 if(thWord)lookup();else $('#thr').innerHTML='<small>Selecciona una palabra del texto (o escríbela aquí) y pulsa Buscar. Atajo: Mayús+F7. Un clic en una palabra de los resultados la pone en tu texto.</small>';
 if(!thWord)q.focus();
}
const LNAME={es:'Castellano',ca:'Català',en:'English',fr:'Français'};
const ONL={ca:{k:'jane',t:"Diccionari de sinònims d'Albert Jané (IEC)",x:'con el diccionario del IEC (3.ª edición)'},en:{k:'mwt',t:'Merriam-Webster Thesaurus',x:'con el tesauro en línea de Merriam-Webster'},fr:{k:'cnrtl',t:'CNRTL — Trésor de la langue française (synonymes)',x:'con el diccionario de sinónimos del CNRTL'}};
const onlineBox=lang=>{const o=ONL[lang];if(!o)return'';const on=navigator.onLine;return `<h4>${esc(o.t)}</h4>${on?`<button class="chip" id="thj" data-k="${o.k}" style="border-radius:8px">Consultar «${esc(thWord)}» en línea ↗</button><div><small>Se abre ${o.x}. Necesita internet.</small></div>`:'<small>Sin conexión: este diccionario solo está disponible con internet. Los sinónimos y antónimos incluidos en Littera funcionan sin conexión.</small>'}`};
const janeHook=box=>{const j=box.querySelector('#thj');if(j)j.onclick=()=>plumaTools.dict(j.dataset.k,thWord)};
function extraDictItems(w){const l=docLang(),all=l==='all',o=[];
 if(l==='ca'||all)o.push({t:`Sinònims de «${w}» en Albert Jané (en línea)`,f:()=>plumaTools.dict('jane',w)});
 if(l==='en'||all){o.push({t:`Merriam-Webster: «${w}» (en línea)`,f:()=>plumaTools.dict('mw',w)});o.push({t:`Merriam-Webster Thesaurus: «${w}»`,f:()=>plumaTools.dict('mwt',w)})}
 if(l==='fr'||all){o.push({t:`Larousse: «${w}» (en línea)`,f:()=>plumaTools.dict('larousse',w)});o.push({t:`CNRTL sinónimos: «${w}»`,f:()=>plumaTools.dict('cnrtl',w)})}
 return o}
async function lookup(){
 const box=$('#thr');if(!thWord){box.innerHTML='';return}
 const sel=$('#thl').value,dl=docLang(),order=sel==='auto'?(dl==='all'?['es','ca','en','fr']:[dl]):[sel];
 let res=null,lang=null;
 for(const l of order){res=await plumaTools.thes(l,thWord);if(res){lang=l;break}}
 if(!res){box.innerHTML=`<small>No hay resultados para «${esc(thWord)}». Si es una forma conjugada o plural, prueba con el infinitivo o el singular.</small>`+onlineBox(order[0]);janeHook(box);return}
 const chip=(w,ant)=>`<button class="chip${ant?' ant':''}" data-w="${esc(w)}">${esc(w)}</button>`;
 let h=`<small>${LNAME[lang]||lang}${res.base!==thWord.toLowerCase()?' · resultados para «'+esc(res.base)+'»':''}</small>`;
 if(res.groups.length){h+='<h4>Sinónimos</h4>';res.groups.forEach(g=>{h+=`<div>${g[0]?`<small>${esc(g[0])}</small>`:''}<div class="chips">${g[1].map(w=>chip(w)).join('')}</div></div>`})}
 h+='<h4>Antónimos</h4>'+(res.ants.length?`<div class="chips">${res.ants.map(w=>chip(w,1)).join('')}</div>`:'<small>No hay antónimos registrados para esta palabra.</small>');
 box.innerHTML=h+onlineBox(lang);janeHook(box);
 box.querySelectorAll('.chip[data-w]').forEach(b=>b.onclick=()=>{
  const w=b.dataset.w;
  if(!thTarget){navigator.clipboard&&navigator.clipboard.writeText(w);b.textContent='✓ copiada';return}
  const src=thTarget.toString()||thWord,txt=matchCase(src,w);
  page.focus();const s=getSelection();s.removeAllRanges();s.addRange(thTarget);document.execCommand('insertText',false,txt);
  const s2=getSelection();
  try{if(s2.anchorNode&&s2.anchorNode.nodeType===3&&s2.anchorOffset>=txt.length){const r=new Range();r.setStart(s2.anchorNode,s2.anchorOffset-txt.length);r.setEnd(s2.anchorNode,s2.anchorOffset);thTarget=r}else thTarget=null}catch(e){thTarget=null}
  thWord=txt;$('#thq').value=txt;stats();save();spellSoon(100)});
}
/* Atajos de diccionarios y sinónimos */
function wordForDict(){const s=getSelection();let t=s.toString().trim();
 if(!t&&s.rangeCount&&s.isCollapsed){const k=tokenAt(s.anchorNode,s.anchorOffset);if(k)t=k.w}
 return t.length<80&&!/\n/.test(t)?t:''}
const DICT_BY_LANG={es:'rae',ca:'iec',en:'mw',fr:'larousse'},SYN_BY_LANG={es:'rae',ca:'jane',en:'mwt',fr:'cnrtl'};
const KEYDICT={'1':'rae','2':'iec','3':'jane','4':'mw','5':'mwt','6':'larousse','7':'cnrtl'};
function langForDict(){const l=docLang();return l==='all'?'es':l}
/* Atajos de teclado personalizables + autocorrección de la raya */
const ACT=[
 {id:'focus',t:'Modo concentración (pantalla completa)',k:'Ctrl+Shift+F',run:()=>toggleFocus()},
 {id:'thes',t:'Sinónimos y antónimos (sin conexión)',k:'F7',ed:1,run:()=>openThes()},
 {id:'dict',t:'Diccionario del idioma del documento',k:'F8',ed:1,run:()=>plumaTools.dict(DICT_BY_LANG[langForDict()],wordForDict())},
 {id:'synon',t:'Sinónimos en línea del idioma del documento',k:'Shift+F8',ed:1,run:()=>plumaTools.dict(SYN_BY_LANG[langForDict()],wordForDict())},
 ...Object.entries(KEYDICT).map(([n,d])=>({id:'d_'+d,t:{rae:'Diccionario de la lengua española (RAE)',iec:'Diccionari de la llengua catalana (IEC)',jane:"Sinònims d'Albert Jané (IEC)",mw:'Merriam-Webster (inglés)',mwt:'Merriam-Webster Thesaurus (inglés)',larousse:'Larousse (francés)',cnrtl:'CNRTL, sinónimos en francés'}[d],k:'Alt+'+n,ed:1,run:()=>plumaTools.dict(d,wordForDict())})),
 {id:'raya',t:'Insertar raya (—)',k:'Alt+Shift+-',ed:1,run:()=>insTxt('—')},
 {id:'nbsp',t:'Insertar espacio duro (no se parte entre líneas)',k:'Ctrl+Shift+Space',ed:1,run:()=>insTxt(' ')},
 {id:'ang',t:'Poner la selección entre comillas angulares «»',k:'Alt+Shift+Q',ed:1,run:()=>insTxt('«'+getSelection().toString()+'»')},
 {id:'al_left',t:'Alinear a la izquierda',k:'Ctrl+L',ed:1,run:()=>alignSel('left')},
 {id:'al_center',t:'Centrar',k:'Ctrl+E',ed:1,run:()=>alignSel('center')},
 {id:'al_right',t:'Alinear a la derecha',k:'Ctrl+R',ed:1,run:()=>alignSel('right')},
 {id:'al_justify',t:'Justificar',k:'Ctrl+J',ed:1,run:()=>alignSel('justify')}
];
function insTxt(t){page.focus();document.execCommand('insertText',false,t);stats();save()}
function alignSel(k){page.focus();blks().forEach(b=>setAlign(b,k));stats();save();try{fillP()}catch(e){}}
const KP=(()=>{let o={};try{o=JSON.parse(localStorage.getItem('littera-keys')||'{}')}catch(e){}return{keys:o.keys||{},dash:o.dash==null?1:o.dash,dashsp:o.dashsp?1:0}})();
const kSave=()=>{try{localStorage.setItem('littera-keys',JSON.stringify(KP))}catch(e){}kSync()};
const kOf=a=>a.id in KP.keys?KP.keys[a.id]:a.k;
let KMAP={};
function kSync(){KMAP={};ACT.forEach(a=>{const c=kOf(a);if(c)KMAP[c]=a.id});try{if(window.plumaTools&&plumaTools.setKeys)plumaTools.setKeys(Object.fromEntries(ACT.map(a=>[a.id,kOf(a)])))}catch(e){}}
function comboOf(e){if(['Control','Shift','Alt','Meta','AltGraph'].includes(e.key))return'';
 const c=e.code||'',k=/^(Key[A-Z]|Digit\d)$/.test(c)?c.slice(-1):/^Numpad\d$/.test(c)?c.slice(-1):({Minus:'-',Equal:'=',Comma:',',Period:'.',Space:'Space',Slash:'/',Backslash:'\\',Semicolon:';',Quote:"'",NumpadSubtract:'-'})[c]||(e.key.length===1?e.key.toUpperCase():e.key);
 return[(e.ctrlKey||e.metaKey)?'Ctrl':'',e.altKey?'Alt':'',e.shiftKey?'Shift':'',k].filter(Boolean).join('+')}
const KRES=['Ctrl+S','Ctrl+C','Ctrl+V','Ctrl+X','Ctrl+Z','Ctrl+Y','Ctrl+A','Ctrl+B','Ctrl+I','Ctrl+U','Ctrl+F','Ctrl+P','Ctrl+N','Ctrl+O','Ctrl+W','Ctrl+Q','Ctrl+T','Ctrl+Shift+Z'];
let kCap=null;
document.addEventListener('keydown',e=>{
 if(kCap){e.preventDefault();e.stopPropagation();const m=$('#kmsg');
  if(e.key==='Escape'){kCap=null;return keysRender()}
  if(e.key==='Delete'||e.key==='Backspace'){KP.keys[kCap]='';kCap=null;kSave();return keysRender()}
  const c=comboOf(e);if(!c)return;
  if(!/\+/.test(c)&&!/^F\d+$/.test(c)){m.textContent='Usa al menos Ctrl, Alt o Mayús junto a la tecla (o una tecla F).';return}
  if(KRES.includes(c)){m.textContent=c+' está reservado por el editor.';return}
  const o=ACT.find(a=>a.id!==kCap&&kOf(a)===c);if(o){m.textContent=c+' ya lo usa «'+o.t+'». Quítaselo primero.';return}
  KP.keys[kCap]=c;kCap=null;kSave();return keysRender()}
 if(e.key==='Escape'&&document.body.classList.contains('compose'))exitFocus();
 const id=KMAP[comboOf(e)];if(!id)return;const a=ACT.find(x=>x.id===id);
 if(!a||(a.ed&&(view!=='ed'||!window.plumaTools)))return;e.preventDefault();e.stopPropagation();a.run()},true);
window.__act=id=>{const a=ACT.find(x=>x.id===id);if(a&&!(a.ed&&view!=='ed'))a.run()};
function keysRender(){const m=$('#kmod');if(!m)return;
 m.firstChild.innerHTML=`<div class='mh'><b>Atajos de teclado</b><span style='flex:1'></span><button id='kRst'>Restablecer todos</button><button id='kX'>Cerrar</button></div>
 <div style='padding:10px 14px;overflow:auto'><p class='hint'>Pulsa sobre una combinación y escribe la nueva (Supr la borra, Esc cancela). Se guardan en este equipo.</p><p id='kmsg' class='hint' style='color:#b3261e;min-height:1.2em'></p>
 <table style='width:100%;border-collapse:collapse'>${ACT.map(a=>`<tr><td style='padding:4px 6px;border-bottom:1px solid var(--ln)'>${esc(a.t)}</td><td style='padding:4px 6px;border-bottom:1px solid var(--ln);white-space:nowrap;text-align:right'><button data-k='${a.id}' style='min-width:130px'>${kCap===a.id?'Pulsa la combinación…':esc(kOf(a)||'—')}</button> <button data-r='${a.id}' title='Valor por defecto'>↺</button></td></tr>`).join('')}</table>
 <p><b>Escritura</b></p><label class='ck'><input type='checkbox' id='kDash' ${KP.dash?'checked':''}> Al escribir «-- » (dos guiones y espacio) poner una raya (—)</label><br><label class='ck'><input type='checkbox' id='kDsp' ${KP.dashsp?'checked':''}> Dejar un espacio después de la raya (si no, «—Hola» como en los diálogos)</label></div>`;
 m.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{kCap=b.dataset.k;keysRender()});
 m.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{delete KP.keys[b.dataset.r];kCap=null;kSave();keysRender()});
 $('#kRst').onclick=()=>{KP.keys={};kCap=null;kSave();keysRender()};$('#kX').onclick=()=>{kCap=null;m.remove()};
 $('#kDash').onchange=e=>{KP.dash=e.target.checked?1:0;kSave()};$('#kDsp').onchange=e=>{KP.dashsp=e.target.checked?1:0;kSave()}}
function keysOpen(){if($('#kmod'))return;const m=document.createElement('div');m.id='kmod';m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:70;padding:16px';
 m.innerHTML=`<div style='background:var(--pn);color:var(--tx);border-radius:10px;width:min(680px,100%);max-height:90%;display:flex;flex-direction:column'></div>`;m.onclick=e=>{if(e.target===m){kCap=null;m.remove()}};document.body.appendChild(m);keysRender()}
window.__keysOpen=keysOpen;
if($('#bKeys'))$('#bKeys').onclick=keysOpen;
kSync();
page.addEventListener('beforeinput',e=>{if(!KP.dash||e.inputType!=='insertText'||e.data!==' ')return;const s=getSelection();if(!s.isCollapsed||!s.anchorNode||s.anchorNode.nodeType!==3)return;
 const n=s.anchorNode,o=s.anchorOffset;if(o>=2&&n.data.slice(o-2,o)==='--'&&n.data[o-3]!=='-'){e.preventDefault();const r=document.createRange();r.setStart(n,o-2);r.setEnd(n,o);s.removeAllRanges();s.addRange(r);document.execCommand('insertText',false,KP.dashsp?'— ':'—')}});
$('#bSy').onclick=()=>openThes();

/* Gramática (LanguageTool, opcional y en línea) */
function plainMap(){
 const tw=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);let text='',map=[],n,last=null;
 while(n=tw.nextNode()){const b=n.parentElement.closest('p,h1,h2,h3,blockquote,li,td,div')||page;if(last&&b!==last)text+='\n\n';last=b;map.push({n,start:text.length});text+=n.nodeValue}
 return{text,map}}
function rangeFor(map,off,len){
 const f=o=>{let k=0;for(let i=0;i<map.length;i++){if(map[i].start<=o)k=i;else break}return{n:map[k].n,o:Math.min(o-map[k].start,map[k].n.nodeValue.length)}};
 const a=f(off),b=f(off+len),r=new Range();r.setStart(a.n,a.o);r.setEnd(b.n,b.o);return r}
function renderGr(){
 let h=`<small>Revisa concordancia, puntuación y estilo en castellano y catalán con LanguageTool. <b>Envía el texto de este documento a un servidor externo (languagetool.org)</b> y necesita internet. La ortografía se corrige aparte, sin conexión.</small>
 <div class="row"><button id="grr" class="on" ${gr.busy?'disabled':''}>${gr.busy?'Revisando…':'Revisar este documento'}</button></div>`;
 if(gr.msg)h+=`<small>${esc(gr.msg)}</small>`;
 gr.matches.forEach((m,i)=>{if(m.done)return;
  h+=`<div class="gi" data-i="${i}"><div><mark>${esc(m.bad)}</mark> — ${esc(m.msg)}</div><div class="chips" style="margin-top:6px">${m.rep.map((r,j)=>`<button class="chip" data-r="${j}">${esc(r)||'(borrar)'}</button>`).join('')}<button class="chip ant" data-ig="1">Ignorar</button></div></div>`});
 tpb.innerHTML=h;
 const b=$('#grr');if(b)b.onclick=runGrammar;
 tpb.querySelectorAll('.gi').forEach(el=>{
  const m=gr.matches[+el.dataset.i];
  el.onclick=e=>{if(e.target.closest('.chip'))return;try{const{map}=plainMap(),r=rangeFor(map,m.o,m.l);page.focus();const s=getSelection();s.removeAllRanges();s.addRange(r);r.startContainer.parentElement&&r.startContainer.parentElement.scrollIntoView({block:'center'})}catch(x){}};
  el.querySelectorAll('[data-r]').forEach(c=>c.onclick=()=>{
   const rep=m.rep[+c.dataset.r],{text,map}=plainMap();
   if(text.substr(m.o,m.l)!==m.bad){gr.msg='El texto ha cambiado desde la revisión: vuelve a revisar.';renderGr();return}
   replaceRange(rangeFor(map,m.o,m.l),rep);m.done=true;const d=rep.length-m.l;gr.matches.forEach(x=>{if(!x.done&&x.o>m.o)x.o+=d});renderGr()});
  el.querySelector('[data-ig]').onclick=()=>{m.done=true;renderGr()};
 });
}
async function runGrammar(){
 gr={matches:[],busy:true,msg:'',ran:true};renderGr();
 const{text,map}=plainMap();
 if(!text.trim()){gr.busy=false;gr.msg='El documento está vacío.';renderGr();return}
 const dl=docLang(),chunks=[];let start=0;
 while(start<text.length){let end=Math.min(text.length,start+12000);if(end<text.length){const k=text.lastIndexOf('\n\n',end);if(k>start+2000)end=k}chunks.push([start,text.slice(start,end)]);start=end}
 for(const[off,t]of chunks){
  const r=await plumaTools.grammar(dl,t);
  if(!r.ok){gr.busy=false;gr.msg=r.error;renderGr();return}
  r.matches.forEach(m=>gr.matches.push({o:m.o+off,l:m.l,msg:m.msg,rep:m.rep,bad:text.substr(m.o+off,m.l)}));
 }
 gr.busy=false;gr.msg=gr.matches.length?`${gr.matches.length} sugerencias. Haz clic en una para verla en el texto.`:'No se han encontrado problemas.';
 try{CSS.highlights.set('gram',new Highlight(...gr.matches.map(m=>rangeFor(map,m.o,m.l))))}catch(e){}
 renderGr();
}
$('#bGr').onclick=()=>showTp('gr');

applyPaper();

window.__L={S:()=>S,get,esc,uid,words,save,askText,tree:renderTree,setView,select,dragId:()=>dragId};
select(S.sel);ready=true;setView("ed");spellSoon(300);
})();
