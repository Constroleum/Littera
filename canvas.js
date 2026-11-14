/* Littera — Lienzo: pizarra orgánica para articular la historia.
   Nodos (escenas, secciones, personajes, escenarios del proyecto + notas, marcos, eventos, líneas de tiempo)
   unidos con flechas. Los datos viven en S.cv y se guardan con el proyecto. */
(function(){
const L=window.__L;if(!L)return;
const $=s=>document.querySelector(s),root=$('#lienzo'),esc=L.esc,uid=L.uid;
const COLORS=['#8a4b2a','#c0392b','#d68910','#b7950b','#2e8b57','#1f8a8a','#2f6fb5','#6c4fb3','#a3478b','#6b6b6b'];
const IC={d:'📄',s:'§',c:'🎭',l:'🏞',f:'📁'};
const DEF={item:[190,92],note:[170,120],frame:[440,300],ev:[160,46],tl:[1100,64]};
const css=document.createElement('style');
css.textContent=`
#lienzo{flex:1;display:none;flex-direction:column;min-height:0;min-width:0;position:relative}
#cvt,#cvp2{display:flex;gap:4px;align-items:center;padding:5px 10px;border-bottom:1px solid var(--ln);background:var(--pn);flex-wrap:wrap;flex-shrink:0}
#cvp2{min-height:34px;background:var(--bg);font-size:13px}
#cvt .sep{width:1px;align-self:stretch;background:var(--ln);margin:0 4px}
#cvt label{display:flex;gap:4px;align-items:center;color:var(--mu);font-size:13px}
#cvt button.on{background:var(--ah);border-color:var(--ac);color:var(--ac)}
#cvv{flex:1;position:relative;overflow:hidden;background:var(--bg);cursor:grab;touch-action:none;
 background-image:radial-gradient(var(--ln) 1px,transparent 1.2px);background-size:24px 24px}
#cvv.pan{cursor:grabbing}#cvv.lk{cursor:crosshair}
#cvw{position:absolute;left:0;top:0;transform-origin:0 0}
#cvF,#cvN,#cvT{position:absolute;left:0;top:0;width:0;height:0}
#cvL{position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible;pointer-events:none}
#cvL .lp{pointer-events:stroke;cursor:pointer;fill:none}
.cn{position:absolute;box-sizing:border-box;border:2px solid var(--c);border-radius:10px;background:color-mix(in srgb,var(--c) 14%,var(--pn));color:var(--tx);padding:7px 9px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.14);cursor:move;user-select:none;display:flex;flex-direction:column;gap:2px}
.cn.sel{outline:3px solid var(--ac);outline-offset:2px;overflow:visible}
.cn .nt{font:600 14px Georgia,serif;line-height:1.2;overflow:hidden;text-overflow:ellipsis}
.cn .ns{font-size:12px;color:var(--mu);overflow:hidden;flex:1;line-height:1.25}
.cn .nf{font-size:11px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cn.item.c{border-radius:40px 40px 14px 14px}.cn.item.l{border-radius:4px 4px 28px 28px;border-style:double;border-width:4px}
.cn.item.s{border-style:dashed}
.cn.note{background:color-mix(in srgb,var(--c) 22%,#fffbe6);color:#2b2a27;border-radius:3px;box-shadow:3px 4px 10px rgba(0,0,0,.2);font:14px/1.35 "Segoe UI",system-ui,sans-serif}
.cn.note .nt{font:14px/1.35 system-ui,sans-serif;white-space:pre-wrap;overflow:hidden}
.cn.frame{background:color-mix(in srgb,var(--c) 7%,transparent);border-style:dashed;border-radius:16px;box-shadow:none;padding:0;cursor:default}
.cn.frame .nt{position:absolute;left:12px;top:6px;font:600 15px Georgia,serif;color:var(--c);background:var(--bg);padding:0 8px;border-radius:6px}
.cn.ev{border-radius:30px;align-items:center;justify-content:center;text-align:center;padding:4px 12px}
.cn.ev .nt{white-space:pre-wrap}
.cn.tl{background:transparent;border:0;box-shadow:none;border-radius:0;padding:0;justify-content:center;cursor:move}
.cn.tl .bar{position:absolute;left:0;right:0;top:50%;height:6px;margin-top:-3px;background:var(--c);border-radius:3px;
 background-image:repeating-linear-gradient(90deg,transparent 0 78px,var(--bg) 78px 80px)}
.cn.tl:after{content:"";position:absolute;right:-6px;top:50%;margin-top:-11px;border:11px solid transparent;border-left:16px solid var(--c);border-right:0}
.cn.tl .nt{position:absolute;left:0;top:-4px;font:600 14px Georgia,serif;color:var(--c)}
.cn .rz{position:absolute;right:-8px;bottom:-8px;width:16px;height:16px;border-radius:4px;background:var(--ac);cursor:nwse-resize;display:none}
.cn .hd{position:absolute;right:-17px;top:50%;margin-top:-8px;width:16px;height:16px;border-radius:50%;background:var(--ac);color:#fff;font-size:11px;text-align:center;line-height:16px;cursor:crosshair;display:none}
.cn.sel .rz,.cn.sel .hd{display:block}
.cn.sel.multi .hd,.cn.sel.multi .rz{display:none}
.cn.ed .nt{user-select:text;cursor:text;outline:1px dashed var(--ac)}
.cl{position:absolute;transform:translate(-50%,-50%);background:var(--pn);border:1px solid var(--ln);border-radius:10px;padding:1px 8px;font-size:12px;white-space:nowrap;cursor:pointer;color:var(--tx)}
.cl.sel{outline:2px solid var(--ac)}
#cvm{position:absolute;border:1px dashed var(--ac);background:#8a4b2a22;display:none;pointer-events:none}
#cvh{position:absolute;left:10px;bottom:8px;font-size:12px;color:var(--mu);pointer-events:none;background:var(--bg);padding:2px 8px;border-radius:8px;opacity:.9}
#cvadd{position:fixed;inset:0;background:#0006;display:none;align-items:center;justify-content:center;z-index:50}
#cvadd>div{background:var(--pn);border:1px solid var(--ln);border-radius:10px;width:min(560px,92vw);max-height:80vh;display:flex;flex-direction:column;padding:14px;gap:8px}
#cvadd .lst{overflow:auto;flex:1;border:1px solid var(--ln);border-radius:6px;padding:6px}
#cvadd h4{margin:8px 0 2px;color:var(--ac)}#cvadd label{display:flex;gap:6px;align-items:center;padding:2px 0}
.sw{width:18px;height:18px;border-radius:50%;border:2px solid var(--pn);box-shadow:0 0 0 1px var(--ln);padding:0;min-width:18px;cursor:pointer}
`;
document.head.appendChild(css);
root.innerHTML=`<div id="cvt"></div><div id="cvp2"></div><div id="cvv"><div id="cvw"><div id="cvF"></div><svg id="cvL"></svg><div id="cvN"></div><div id="cvT"></div></div><div id="cvm"></div><div id="cvh"></div></div>`;
const addDlg=document.createElement('div');addDlg.id='cvadd';document.body.appendChild(addDlg);
const V=$('#cvv'),W=$('#cvw'),NL=$('#cvN'),FL=$('#cvF'),TL=$('#cvT'),SV=$('#cvL'),MQ=$('#cvm');
let selN=new Set(),selL=null,linkMode=false,undo=[],redo=[],pendingFrom=null;
const CV=()=>{const S=L.S();if(!S.cv)S.cv={nodes:[],links:[],x:60,y:60,z:1,auto:true};return S.cv};
const nodeById=id=>CV().nodes.find(n=>n.id===id);
const refOf=n=>n.type==='item'?L.get(n.ref):null;
const snap=()=>JSON.stringify({n:CV().nodes,l:CV().links});
function pushUndo(){undo.push(snap());if(undo.length>80)undo.shift();redo=[]}
function restore(s){const o=JSON.parse(s),c=CV();c.nodes=o.n;c.links=o.l;selN.clear();selL=null;L.save();render()}
const doUndo=()=>{if(!undo.length)return;redo.push(snap());restore(undo.pop())};
const doRedo=()=>{if(!redo.length)return;undo.push(snap());restore(redo.pop())};
function mut(f){pushUndo();f();L.save();render()}
function applyView(){const c=CV();W.style.transform=`translate(${c.x}px,${c.y}px) scale(${c.z})`;V.style.backgroundSize=24*c.z+'px '+24*c.z+'px';V.style.backgroundPosition=c.x+'px '+c.y+'px';const z=$('#cvz');if(z)z.textContent=Math.round(c.z*100)+'%'}
function toWorld(e){const r=V.getBoundingClientRect(),c=CV();return[(e.clientX-r.left-c.x)/c.z,(e.clientY-r.top-c.y)/c.z]}
function center(){const r=V.getBoundingClientRect(),c=CV();return[(r.width/2-c.x)/c.z,(r.height/2-c.y)/c.z]}

/* ---------- barra ---------- */
function toolbar(){
 $('#cvt').innerHTML=`<button data-a="add" title="Elegir escenas, personajes o escenarios del proyecto (también puedes arrastrarlos desde el clasificador)">＋ Del proyecto</button>
 <button data-a="note">＋ Nota</button><button data-a="frame">＋ Marco</button><button data-a="ev">＋ Evento</button><button data-a="tl">＋ Línea de tiempo</button><span class="sep"></span>
 <button data-a="link" class="${linkMode?'on':''}" title="Pulsa dos elementos para unirlos con una flecha. También puedes arrastrar desde el punto ● del elemento seleccionado.">↗ Enlazar</button>
 <label><input type="checkbox" id="cvAuto" ${CV().auto!==false?'checked':''}>Relaciones automáticas</label><span class="sep"></span>
 <button data-a="lay" title="Colocar escenas por capítulos, personajes arriba y escenarios abajo">Distribuir</button>
 <button data-a="tlalign" title="Ordena sobre la línea de tiempo seleccionada los elementos que están junto a ella">Alinear en la línea</button><span class="sep"></span>
 <button data-a="zo">−</button><span id="cvz" style="min-width:44px;text-align:center"></span><button data-a="zi">＋</button><button data-a="fit">Ajustar</button><span class="sep"></span>
 <button data-a="un" title="Deshacer (Ctrl+Z)">↶</button><button data-a="re" title="Rehacer (Ctrl+Y)">↷</button><button data-a="png">Exportar PNG</button>`;
 $('#cvAuto').onchange=e=>{CV().auto=e.target.checked;L.save();drawLinks()};
 $('#cvt').querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(b.dataset.a));
 applyView();
}
function act(a){
 const c=CV();
 if(a==='add')return openAdd();
 if(a==='link'){linkMode=!linkMode;pendingFrom=null;V.classList.toggle('lk',linkMode);toolbar();return hint()}
 if(a==='note'||a==='frame'||a==='ev'||a==='tl'){const[x,y]=center(),d=DEF[a];
  const n={id:uid(),type:a,x:x-d[0]/2,y:y-d[1]/2,w:d[0],h:d[1],tx:{note:'',frame:'Título del marco',ev:'Fecha · suceso',tl:'Línea de tiempo'}[a],c:{note:'#d68910',frame:'#6b6b6b',ev:'#2f6fb5',tl:'#8a4b2a'}[a]};
  mut(()=>c.nodes.push(n));selN=new Set([n.id]);render();if(a!=='tl'&&a!=='frame')editText(n.id);return}
 if(a==='zi')return zoomAt(1.2);if(a==='zo')return zoomAt(1/1.2);if(a==='fit')return fit();
 if(a==='un')return doUndo();if(a==='re')return doRedo();
 if(a==='lay')return layout();if(a==='tlalign')return alignTL();if(a==='png')return exportPNG();
}
function hint(){$('#cvh').textContent=linkMode?(pendingFrom?'Ahora pulsa el elemento de destino · Esc cancela':'Pulsa el elemento de origen · Esc cancela'):'Rueda: zoom · Arrastra el fondo: mover · Mayús+arrastrar: seleccionar varios · Doble clic: abrir/editar · ● : arrastra para enlazar'}
function zoomAt(f,px,py){const c=CV(),r=V.getBoundingClientRect();px=px==null?r.width/2:px;py=py==null?r.height/2:py;
 const z=Math.min(2.5,Math.max(.15,c.z*f)),k=z/c.z;c.x=px-(px-c.x)*k;c.y=py-(py-c.y)*k;c.z=z;applyView();L.save()}
function bbox(list){if(!list.length)return null;let a=1e9,b=1e9,c=-1e9,d=-1e9;list.forEach(n=>{a=Math.min(a,n.x);b=Math.min(b,n.y);c=Math.max(c,n.x+n.w);d=Math.max(d,n.y+n.h)});return[a,b,c,d]}
function fit(){const c=CV(),bb=bbox(c.nodes),r=V.getBoundingClientRect();if(!bb){c.x=60;c.y=60;c.z=1;applyView();return}
 const w=bb[2]-bb[0]+120,h=bb[3]-bb[1]+120,z=Math.min(1.2,Math.max(.15,Math.min(r.width/w,r.height/h)));
 c.z=z;c.x=(r.width-(bb[2]-bb[0])*z)/2-bb[0]*z;c.y=(r.height-(bb[3]-bb[1])*z)/2-bb[1]*z;applyView();L.save()}

/* ---------- añadir del proyecto ---------- */
function openAdd(){
 const S=L.S(),have=new Set(CV().nodes.filter(n=>n.type==='item').map(n=>n.ref));
 const grp=[['d','Escenas'],['s','Secciones'],['c','Personajes'],['l','Escenarios']];
 let h='<div><b>Añadir al lienzo</b><div class="lst">';
 grp.forEach(([k,t])=>{const l=S.items.filter(x=>x.k===k);if(!l.length)return;
  h+=`<h4>${t}</h4>`+l.map(x=>`<label><input type="checkbox" value="${x.id}" ${have.has(x.id)?'disabled':''}> ${IC[k]} ${esc(x.t)}${have.has(x.id)?' <small style="color:var(--mu)">(ya está)</small>':''}</label>`).join('')});
 if(!S.items.some(x=>'dscl'.includes(x.k)))h+='<p style="color:var(--mu)">Aún no hay escenas, personajes ni escenarios en el proyecto.</p>';
 h+=`</div><div style="display:flex;gap:6px"><button id="cvAll">Marcar todo</button><span class="sp"></span><button id="cvNo">Cancelar</button><button id="cvOk" style="background:var(--ac);color:#fff">Añadir</button></div></div>`;
 addDlg.innerHTML=h;addDlg.style.display='flex';
 const close=()=>addDlg.style.display='none';
 $('#cvNo').onclick=close;
 $('#cvAll').onclick=()=>addDlg.querySelectorAll('input:not(:disabled)').forEach(i=>i.checked=true);
 $('#cvOk').onclick=()=>{const ids=[...addDlg.querySelectorAll('input:checked')].map(i=>i.value);close();if(ids.length)addItems(ids)};
}
function addItems(ids,at){
 const c=CV(),[cx,cy]=at||center();let k=0;const made=[];
 mut(()=>ids.forEach(id=>{const it=L.get(id);if(!it||c.nodes.some(n=>n.type==='item'&&n.ref===id))return;
  const d=DEF.item,w=it.k==='c'||it.k==='l'?160:d[0],h=it.k==='c'||it.k==='l'?78:d[1],cols=Math.min(4,Math.ceil(Math.sqrt(ids.length)));
  const n={id:uid(),type:'item',ref:id,x:cx-w/2+(k%cols)*(w+30)-(cols-1)*(w+30)/2,y:cy-h/2+Math.floor(k/cols)*(h+30),w,h,c:{d:'#8a4b2a',s:'#b7950b',c:'#2f6fb5',l:'#2e8b57'}[it.k]||'#6b6b6b'};
  k++;c.nodes.push(n);made.push(n.id)}));
 selN=new Set(made);render();
}

/* ---------- distribución ---------- */
function layout(){
 const c=CV(),S=L.S(),items=c.nodes.filter(n=>n.type==='item'&&refOf(n));if(!items.length)return;
 mut(()=>{
  const order=[];(function walk(p){S.items.filter(i=>i.p===p).forEach(i=>{order.push(i);walk(i.id)})})(null);
  const pos=new Map(order.map((o,i)=>[o.id,i])),by=k=>items.filter(n=>refOf(n).k===k).sort((a,b)=>pos.get(a.ref)-pos.get(b.ref));
  let x=0,topY=0;const chars=by('c'),locs=by('l'),scenes=items.filter(n=>'ds'.includes(refOf(n).k)).sort((a,b)=>pos.get(a.ref)-pos.get(b.ref));
  chars.forEach((n,i)=>{n.x=i*(n.w+30);n.y=topY});
  const y0=chars.length?topY+110+60:0,cols=new Map();
  scenes.forEach(n=>{const p=refOf(n).p||'';if(!cols.has(p))cols.set(p,[]);cols.get(p).push(n)});
  [...cols.values()].forEach(col=>{let y=y0,w=0;col.forEach(n=>{n.x=x;n.y=y;y+=n.h+26;w=Math.max(w,n.w)});x+=w+70});
  const ly=Math.max(y0,...scenes.map(n=>n.y+n.h))+(scenes.length?80:0);
  locs.forEach((n,i)=>{n.x=i*(n.w+30);n.y=ly});
 });
 fit();
}
function alignTL(){
 const c=CV(),t=[...selN].map(nodeById).find(n=>n&&n.type==='tl');
 if(!t){alert('Selecciona primero una línea de tiempo.');return}
 const near=c.nodes.filter(n=>n!==t&&n.type!=='frame'&&n.type!=='tl'&&n.x+n.w/2>=t.x-80&&n.x+n.w/2<=t.x+t.w+80&&Math.abs(n.y+n.h/2-(t.y+t.h/2))<420).sort((a,b)=>a.x-b.x);
 if(!near.length){alert('Coloca elementos cerca de la línea de tiempo y vuelve a intentarlo.');return}
 mut(()=>{const step=Math.max(...near.map(n=>n.w))+30,ty=t.y+t.h/2;near.forEach((n,i)=>{n.x=t.x+30+i*step*.55;n.y=i%2?ty+44:ty-44-n.h});
  t.w=Math.max(t.w,near[near.length-1].x+near[near.length-1].w-t.x+60)});
}

/* ---------- render ---------- */
function nodeHTML(n){
 const it=refOf(n);
 if(n.type==='item'){if(!it)return'';const w=it.k==='f'?'':L.words(it.h);
  return`<div class="nt">${IC[it.k]||''} ${esc(it.t)}</div>${n.h>60?`<div class="ns">${esc((it.s||'').slice(0,160))}</div>`:''}<div class="nf">${it.k==='d'||it.k==='s'?esc(it.st||'')+' · '+w+' pal.':it.k==='c'?esc((it.m&&it.m.rol)||'Personaje'):esc((it.m&&it.m.tipo)||'Escenario')}</div>`}
 if(n.type==='tl')return`<div class="bar"></div><div class="nt">${esc(n.tx||'')}</div>`;
 return`<div class="nt">${esc(n.tx||'')}</div>`;
}
function render(){
 const c=CV(),ids=new Set(c.nodes.map(n=>n.id));
 c.nodes=c.nodes.filter(n=>n.type!=='item'||refOf(n));const alive=new Set(c.nodes.map(n=>n.id));
 c.links=c.links.filter(l=>alive.has(l.a)&&alive.has(l.b));selN.forEach(i=>{if(!alive.has(i))selN.delete(i)});
 NL.innerHTML='';FL.innerHTML='';
 c.nodes.forEach(n=>{const d=document.createElement('div'),it=refOf(n);
  d.className='cn '+n.type+(it?' '+it.k:'')+(selN.has(n.id)?' sel':'')+(selN.size>1?' multi':'');d.dataset.id=n.id;
  d.style.setProperty('--c',n.c||'#8a4b2a');d.innerHTML=nodeHTML(n)+'<div class="hd">●</div><div class="rz"></div>';
  (n.type==='frame'?FL:NL).appendChild(d);place(n,d)});
 drawLinks();props();hint();applyView();
}
function place(n,d){d=d||NL.querySelector(`[data-id="${n.id}"]`)||FL.querySelector(`[data-id="${n.id}"]`);if(!d)return;d.style.left=n.x+'px';d.style.top=n.y+'px';d.style.width=n.w+'px';d.style.height=n.h+'px'}
function edge(n,tx,ty){const cx=n.x+n.w/2,cy=n.y+n.h/2,dx=tx-cx,dy=ty-cy;if(!dx&&!dy)return[cx,cy];
 const s=Math.min((n.w/2+4)/Math.abs(dx||1e-9),(n.h/2+4)/Math.abs(dy||1e-9));return[cx+dx*s,cy+dy*s]}
function geo(a,b,bend){
 const ac=[a.x+a.w/2,a.y+a.h/2],bc=[b.x+b.w/2,b.y+b.h/2],dx=bc[0]-ac[0],dy=bc[1]-ac[1],len=Math.hypot(dx,dy)||1;
 const q=[(ac[0]+bc[0])/2-dy/len*len*bend,(ac[1]+bc[1])/2+dx/len*len*bend];
 const p1=edge(a,q[0],q[1]),p2=edge(b,q[0],q[1]);
 return{p1,p2,q,mid:[.25*p1[0]+.5*q[0]+.25*p2[0],.25*p1[1]+.5*q[1]+.25*p2[1]]};
}
function arrow(p,from,col){const a=Math.atan2(p[1]-from[1],p[0]-from[0]),s=13;
 const pt=(r,t)=>[p[0]-Math.cos(a+t)*r,p[1]-Math.sin(a+t)*r];const A=pt(s,.42),B=pt(s,-.42);
 return`<polygon points="${p[0]},${p[1]} ${A[0]},${A[1]} ${B[0]},${B[1]}" fill="${col}"/>`}
const DASH={solid:'',dashed:'9 6',dotted:'2 6'};
function bendFor(l,all){const same=all.filter(o=>(o.a===l.a&&o.b===l.b)||(o.a===l.b&&o.b===l.a));const i=same.indexOf(l);
 return l.cv!=null?l.cv:(.12+i*.16)*(l.a<l.b?1:-1)}
function drawLinks(){
 const c=CV();let h='';TL.innerHTML='';
 if(c.auto!==false){
  const by={};c.nodes.forEach(n=>{if(n.type==='item')by[n.ref]=n});
  c.nodes.forEach(n=>{const it=refOf(n);if(!it||!(it.k==='d'||it.k==='s')||!it.m)return;
   [['pov','#6c4fb3','4 5'],['lug','#2e8b57','1 6'],['pr','#a3478b','2 4']].forEach(([k,col,da])=>{(Array.isArray(it.m[k])?it.m[k]:[it.m[k]]).forEach(ref=>{const t=ref&&by[ref];if(!t)return;
    const g=geo(n,t,.08);h+=`<path d="M${g.p1} Q${g.q} ${g.p2}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="${da}" opacity=".55"/>`})})});
 }
 c.links.forEach(l=>{const a=nodeById(l.a),b=nodeById(l.b);if(!a||!b)return;
  const g=geo(a,b,bendFor(l,c.links)),col=l.c||'#8a4b2a',sel=selL===l.id,d=`M${g.p1} Q${g.q} ${g.p2}`;
  h+=`<g data-l="${l.id}"><path class="lp" d="${d}" stroke="transparent" stroke-width="16"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${sel?4:2.5}" stroke-dasharray="${DASH[l.st||'solid']}" stroke-linecap="round" style="pointer-events:none"/>`
   +((l.dir||'f')!=='n'?arrow(g.p2,g.q,col):'')+((l.dir)==='b'?arrow(g.p1,g.q,col):'')+'</g>';
  if(l.lbl){const e=document.createElement('div');e.className='cl'+(sel?' sel':'');e.dataset.l=l.id;e.textContent=l.lbl;e.style.left=g.mid[0]+'px';e.style.top=g.mid[1]+'px';e.style.borderColor=col;TL.appendChild(e)}});
 if(pendingFrom&&pendingFrom.cur){const a=nodeById(pendingFrom.id);if(a){const p1=edge(a,pendingFrom.cur[0],pendingFrom.cur[1]);h+=`<path d="M${p1} L${pendingFrom.cur}" stroke="#8a4b2a" stroke-width="2.5" stroke-dasharray="6 5" fill="none"/>`}}
 SV.innerHTML=h;
}
function swatches(cur,fn){return COLORS.map(k=>`<button class="sw" data-k="${k}" style="background:${k}${k===cur?';outline:2px solid var(--tx)':''}"></button>`).join('')}
function props(){
 const box=$('#cvp2'),c=CV();
 if(selL){const l=c.links.find(x=>x.id===selL);if(!l){selL=null;return props()}
  box.innerHTML=`<b>Flecha</b><button data-p="lbl">Etiqueta…</button>
  <select data-p="st"><option value="solid">Línea continua</option><option value="dashed">Discontinua</option><option value="dotted">Punteada</option></select>
  <select data-p="dir"><option value="f">→ Una flecha</option><option value="b">↔ Doble</option><option value="n">— Sin flecha</option></select>
  <button data-p="inv">⇄ Invertir</button><button data-p="bend">Curvar más</button><button data-p="str">Recta</button>${swatches(l.c||'#8a4b2a')}<span class="sp"></span><button data-p="del">Eliminar</button>`;
  box.querySelector('[data-p=st]').value=l.st||'solid';box.querySelector('[data-p=dir]').value=l.dir||'f';
  box.querySelectorAll('.sw').forEach(b=>b.onclick=()=>mut(()=>l.c=b.dataset.k));
  box.querySelector('[data-p=lbl]').onclick=async()=>{const t=await L.askText('Etiqueta de la flecha (por ejemplo: «traiciona a», «un año después»)',l.lbl||'');if(t!=null)mut(()=>l.lbl=t.trim())};
  box.querySelector('[data-p=st]').onchange=e=>mut(()=>l.st=e.target.value);
  box.querySelector('[data-p=dir]').onchange=e=>mut(()=>l.dir=e.target.value);
  box.querySelector('[data-p=inv]').onclick=()=>mut(()=>{const t=l.a;l.a=l.b;l.b=t});
  box.querySelector('[data-p=bend]').onclick=()=>mut(()=>{const g=bendFor(l,c.links);l.cv=(g>=0?1:-1)*(Math.abs(g)+.15)});
  box.querySelector('[data-p=str]').onclick=()=>mut(()=>l.cv=0);
  box.querySelector('[data-p=del]').onclick=()=>mut(()=>{c.links=c.links.filter(x=>x!==l);selL=null});
  return}
 const ns=[...selN].map(nodeById).filter(Boolean);
 if(!ns.length){box.innerHTML='<span style="color:var(--mu)">Selecciona un elemento o una flecha para cambiar su aspecto.</span>';return}
 const n=ns[0],one=ns.length===1;
 box.innerHTML=`<b>${one?({item:'Elemento del proyecto',note:'Nota',frame:'Marco',ev:'Evento',tl:'Línea de tiempo'}[n.type]):ns.length+' elementos'}</b>${swatches(one?n.c:'')}
  ${one&&n.type!=='item'?'<button data-p="txt">Editar texto</button>':''}${one&&n.type==='item'?'<button data-p="open">Abrir en el editor</button><button data-p="ren">Renombrar</button>':''}
  <button data-p="dup">Duplicar</button><button data-p="front">Traer al frente</button><span class="sp"></span><button data-p="del">${ns.some(x=>x.type==='item')?'Quitar del lienzo':'Eliminar'}</button>`;
 box.querySelectorAll('.sw').forEach(b=>b.onclick=()=>mut(()=>ns.forEach(x=>x.c=b.dataset.k)));
 const q=s=>box.querySelector(`[data-p=${s}]`);
 q('del').onclick=()=>delSel();
 q('dup').onclick=()=>mut(()=>{const m=new Map(),made=[];ns.forEach(x=>{if(x.type==='item')return;const y=JSON.parse(JSON.stringify(x));y.id=uid();y.x+=30;y.y+=30;m.set(x.id,y.id);c.nodes.push(y);made.push(y.id)});
  c.links.filter(l=>m.has(l.a)&&m.has(l.b)).forEach(l=>c.links.push({...l,id:uid(),a:m.get(l.a),b:m.get(l.b)}));if(made.length)selN=new Set(made)});
 q('front').onclick=()=>mut(()=>{ns.forEach(x=>{c.nodes=c.nodes.filter(y=>y!==x);c.nodes.push(x)})});
 if(q('txt'))q('txt').onclick=()=>editText(n.id);
 if(q('open'))q('open').onclick=()=>openItem(n);
 if(q('ren'))q('ren').onclick=async()=>{const it=refOf(n),t=await L.askText('Nuevo nombre',it.t);if(t&&t.trim()){pushUndo();it.t=t.trim();L.save();L.tree();render()}};
}
function delSel(){const c=CV();
 if(selL){mut(()=>{c.links=c.links.filter(l=>l.id!==selL);selL=null});return}
 if(!selN.size)return;mut(()=>{c.nodes=c.nodes.filter(n=>!selN.has(n.id));c.links=c.links.filter(l=>!selN.has(l.a)&&!selN.has(l.b));selN.clear()})}
function openItem(n){const it=refOf(n);if(!it)return;L.setView('ed');L.select(it.id)}
function editText(id){
 const n=nodeById(id),d=document.querySelector(`#lienzo [data-id="${id}"]`);if(!d)return;const t=d.querySelector('.nt');
 d.classList.add('ed');t.contentEditable='plaintext-only';t.textContent=n.tx||'';t.focus();
 const r=document.createRange();r.selectNodeContents(t);const s=getSelection();s.removeAllRanges();s.addRange(r);
 const fin=ok=>{t.onblur=null;t.contentEditable='false';d.classList.remove('ed');if(ok&&t.textContent!==n.tx){pushUndo();n.tx=t.textContent.replace(/\n+$/,'');L.save()}render()};
 t.onblur=()=>fin(true);t.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape'){t.onblur=null;fin(false)}if(e.key==='Enter'&&!e.shiftKey&&n.type!=='note'){e.preventDefault();t.blur()}};
}

/* ---------- enlaces ---------- */
function addLink(a,b,lbl){if(a===b)return;const c=CV();mut(()=>{const l={id:uid(),a,b,lbl:lbl||'',st:'solid',dir:'f',c:'#8a4b2a'};c.links.push(l);selL=l.id;selN.clear()});}

/* ---------- ratón ---------- */
let drag=null;
V.addEventListener('pointerdown',e=>{
 if(e.button===2)return;const c=CV();
 if(e.target.closest('.ed'))return;
 const hd=e.target.closest('.hd'),rz=e.target.closest('.rz'),nd=e.target.closest('.cn'),lb=e.target.closest('.cl'),lp=e.target.closest('.lp');
 const[wx,wy]=toWorld(e);
 if(hd&&nd){e.preventDefault();pendingFrom={id:nd.dataset.id,cur:[wx,wy]};drag={m:'link'};V.setPointerCapture(e.pointerId);return}
 if(rz&&nd){const n=nodeById(nd.dataset.id);pushUndo();drag={m:'rz',n,ox:wx,oy:wy,w:n.w,h:n.h,moved:0};V.setPointerCapture(e.pointerId);return}
 if(nd){const id=nd.dataset.id,n=nodeById(id);
  if(linkMode){if(!pendingFrom){pendingFrom={id};selN=new Set([id]);render()}else{const a=pendingFrom.id;pendingFrom=null;addLink(a,id)}return}
  if(e.shiftKey){selN.has(id)?selN.delete(id):selN.add(id)}else if(!selN.has(id))selN=new Set([id]);
  selL=null;
  const mv=[...selN].map(nodeById).filter(Boolean),extra=new Map();
  if(n.type==='frame'){c.nodes.forEach(o=>{if(o!==n&&!selN.has(o.id)&&o.x>=n.x&&o.y>=n.y&&o.x+o.w<=n.x+n.w&&o.y+o.h<=n.y+n.h)extra.set(o.id,o)})}
  const all=[...new Set([...mv,...extra.values()])];
  drag={m:'mv',ox:wx,oy:wy,list:all.map(o=>[o,o.x,o.y]),moved:0,pushed:0};V.setPointerCapture(e.pointerId);render();return}
 if(lb||lp){const g=(lb||lp.closest('[data-l]'));selL=g.dataset.l;selN.clear();render();return}
 if(linkMode&&pendingFrom){pendingFrom=null;hint();drawLinks()}
 if(e.shiftKey){drag={m:'mq',sx:e.clientX,sy:e.clientY,base:new Set(selN)};V.setPointerCapture(e.pointerId);return}
 drag={m:'pan',sx:e.clientX,sy:e.clientY,x:c.x,y:c.y,moved:0};V.classList.add('pan');V.setPointerCapture(e.pointerId);
});
V.addEventListener('pointermove',e=>{
 if(!drag)return;const c=CV(),[wx,wy]=toWorld(e);
 if(drag.m==='pan'){const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=1;c.x=drag.x+dx;c.y=drag.y+dy;applyView()}
 else if(drag.m==='mv'){const dx=wx-drag.ox,dy=wy-drag.oy;if(!drag.pushed&&Math.abs(dx)+Math.abs(dy)>3){pushUndo();drag.pushed=1}
  if(drag.pushed){drag.moved=1;drag.list.forEach(([o,x,y])=>{o.x=Math.round(x+dx);o.y=Math.round(y+dy);place(o)});drawLinks()}}
 else if(drag.m==='rz'){drag.moved=1;drag.n.w=Math.max(60,Math.round(drag.w+wx-drag.ox));drag.n.h=Math.max(30,Math.round(drag.h+wy-drag.oy));place(drag.n);drawLinks()}
 else if(drag.m==='link'){pendingFrom.cur=[wx,wy];drawLinks()}
 else if(drag.m==='mq'){const r=V.getBoundingClientRect(),x=Math.min(e.clientX,drag.sx)-r.left,y=Math.min(e.clientY,drag.sy)-r.top;
  Object.assign(MQ.style,{display:'block',left:x+'px',top:y+'px',width:Math.abs(e.clientX-drag.sx)+'px',height:Math.abs(e.clientY-drag.sy)+'px'})}
});
function endDrag(e){
 if(!drag)return;const d=drag;drag=null;V.classList.remove('pan');MQ.style.display='none';const c=CV();
 if(d.m==='pan'){if(!d.moved){selN.clear();selL=null;render()}else L.save()}
 else if(d.m==='mv'){if(d.moved){L.save()}render()}
 else if(d.m==='rz'){L.save();render()}
 else if(d.m==='link'){const t=document.elementFromPoint(e.clientX,e.clientY),nd=t&&t.closest&&t.closest('.cn'),a=pendingFrom&&pendingFrom.id;pendingFrom=null;
  if(nd&&a&&nd.dataset.id!==a)addLink(a,nd.dataset.id);
  else if(a){const[wx,wy]=toWorld(e),from=nodeById(a),n={id:uid(),type:'note',x:wx-80,y:wy-30,w:170,h:90,tx:'',c:'#d68910'};
   mut(()=>{c.nodes.push(n);c.links.push({id:uid(),a,b:n.id,lbl:'',st:'solid',dir:'f',c:from.c||'#8a4b2a'})});selN=new Set([n.id]);render();editText(n.id)}
  else render()}
 else if(d.m==='mq'){const r=V.getBoundingClientRect(),x1=Math.min(e.clientX,d.sx),x2=Math.max(e.clientX,d.sx),y1=Math.min(e.clientY,d.sy),y2=Math.max(e.clientY,d.sy);
  const a=[(x1-r.left-c.x)/c.z,(y1-r.top-c.y)/c.z],b=[(x2-r.left-c.x)/c.z,(y2-r.top-c.y)/c.z];
  selN=new Set(d.base);c.nodes.forEach(n=>{if(n.x<b[0]&&n.x+n.w>a[0]&&n.y<b[1]&&n.y+n.h>a[1])selN.add(n.id)});selL=null;render()}
}
V.addEventListener('pointerup',endDrag);V.addEventListener('pointercancel',endDrag);
V.addEventListener('dblclick',e=>{
 const nd=e.target.closest('.cn'),lb=e.target.closest('.cl'),lp=e.target.closest('.lp');
 if(lb||lp){const g=(lb||lp.closest('[data-l]')),l=CV().links.find(x=>x.id===g.dataset.l);selL=l.id;render();
  L.askText('Etiqueta de la flecha',l.lbl||'').then(t=>{if(t!=null)mut(()=>l.lbl=t.trim())});return}
 if(nd){const n=nodeById(nd.dataset.id);if(n.type==='item')openItem(n);else if(!e.target.closest('.rz,.hd'))editText(n.id);return}
 const[wx,wy]=toWorld(e),n={id:uid(),type:'note',x:wx-85,y:wy-40,w:170,h:90,tx:'',c:'#d68910'};
 mut(()=>CV().nodes.push(n));selN=new Set([n.id]);render();editText(n.id);
});
V.addEventListener('wheel',e=>{e.preventDefault();const r=V.getBoundingClientRect();zoomAt(e.deltaY<0?1.1:1/1.1,e.clientX-r.left,e.clientY-r.top)},{passive:false});
V.addEventListener('dragover',e=>{if(L.dragId())e.preventDefault()});
V.addEventListener('drop',e=>{const id=L.dragId();if(!id)return;e.preventDefault();const it=L.get(id);if(!it)return;
 const ids=it.k==='f'?L.S().items.filter(x=>x.p===id&&'dscl'.includes(x.k)).map(x=>x.id):[id];addItems(ids,toWorld(e))});
document.addEventListener('keydown',e=>{
 if(root.style.display==='none')return;const t=e.target;if(t&&(t.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(t.tagName)))return;
 const k=e.key.toLowerCase();
 if(k==='delete'||k==='backspace'){e.preventDefault();delSel()}
 else if(e.ctrlKey&&k==='z'){e.preventDefault();e.shiftKey?doRedo():doUndo()}
 else if(e.ctrlKey&&k==='y'){e.preventDefault();doRedo()}
 else if(e.ctrlKey&&k==='a'){e.preventDefault();selN=new Set(CV().nodes.map(n=>n.id));render()}
 else if(k==='escape'){linkMode=false;pendingFrom=null;V.classList.remove('lk');selN.clear();selL=null;toolbar();render()}
 else if(k==='f2'&&selN.size===1){const n=nodeById([...selN][0]);if(n&&n.type!=='item')editText(n.id)}
 else if(k.startsWith('arrow')&&selN.size){e.preventDefault();const s=e.shiftKey?30:6,dx=k==='arrowleft'?-s:k==='arrowright'?s:0,dy=k==='arrowup'?-s:k==='arrowdown'?s:0;
  selN.forEach(i=>{const n=nodeById(i);if(n){n.x+=dx;n.y+=dy;place(n)}});drawLinks();L.save()}
});

/* ---------- exportar PNG ---------- */
function wrap(ctx,t,w,max){const out=[];String(t||'').split('\n').forEach(p=>{let line='';p.split(/\s+/).forEach(wd=>{const test=line?line+' '+wd:wd;if(ctx.measureText(test).width>w&&line){out.push(line);line=wd}else line=test});out.push(line)});return out.slice(0,max)}
function exportPNG(){
 const c=CV(),bb=bbox(c.nodes);if(!bb){alert('El lienzo está vacío.');return}
 const cs=getComputedStyle(document.documentElement),g=n=>cs.getPropertyValue(n).trim()||'#888',pad=60;
 const W0=bb[2]-bb[0]+pad*2,H0=bb[3]-bb[1]+pad*2,sc=Math.min(2,7000/Math.max(W0,H0));
 const cn=document.createElement('canvas');cn.width=Math.round(W0*sc);cn.height=Math.round(H0*sc);const x=cn.getContext('2d');x.scale(sc,sc);x.translate(pad-bb[0],pad-bb[1]);
 x.fillStyle=getComputedStyle(document.body).backgroundColor;x.fillRect(bb[0]-pad,bb[1]-pad,W0,H0);
 const rr=(n,r)=>{x.beginPath();x.roundRect(n.x,n.y,n.w,n.h,r)};
 const hexA=(h,a)=>{const v=parseInt(h.slice(1),16);return`rgba(${v>>16},${v>>8&255},${v&255},${a})`};
 const font=(s,w)=>`${w||''} ${s}px Georgia,serif`;
 c.nodes.filter(n=>n.type==='frame').forEach(n=>{rr(n,16);x.fillStyle=hexA(n.c,.07);x.fill();x.setLineDash([8,6]);x.lineWidth=2;x.strokeStyle=n.c;x.stroke();x.setLineDash([]);x.font=font(15,'600');x.fillStyle=n.c;x.textBaseline='top';x.fillText(n.tx||'',n.x+14,n.y+8)});
 const lines=[];
 c.links.forEach(l=>{const a=nodeById(l.a),b=nodeById(l.b);if(!a||!b)return;const gg=geo(a,b,bendFor(l,c.links)),col=l.c||'#8a4b2a';
  x.beginPath();x.moveTo(...gg.p1);x.quadraticCurveTo(...gg.q,...gg.p2);x.strokeStyle=col;x.lineWidth=2.5;x.lineCap='round';x.setLineDash((DASH[l.st||'solid']||'').split(' ').filter(Boolean).map(Number));x.stroke();x.setLineDash([]);
  const ah=(p,f)=>{const an=Math.atan2(p[1]-f[1],p[0]-f[0]);x.beginPath();x.moveTo(...p);x.lineTo(p[0]-Math.cos(an-.42)*13,p[1]-Math.sin(an-.42)*13);x.lineTo(p[0]-Math.cos(an+.42)*13,p[1]-Math.sin(an+.42)*13);x.closePath();x.fillStyle=col;x.fill()};
  if((l.dir||'f')!=='n')ah(gg.p2,gg.q);if(l.dir==='b')ah(gg.p1,gg.q);if(l.lbl)lines.push([l,gg,col])});
 c.nodes.filter(n=>n.type!=='frame').forEach(n=>{const it=refOf(n);
  if(n.type==='tl'){x.fillStyle=n.c;x.fillRect(n.x,n.y+n.h/2-3,n.w,6);x.beginPath();x.moveTo(n.x+n.w+14,n.y+n.h/2);x.lineTo(n.x+n.w,n.y+n.h/2-11);x.lineTo(n.x+n.w,n.y+n.h/2+11);x.fill();x.font=font(14,'600');x.textBaseline='top';x.fillText(n.tx||'',n.x,n.y);return}
  const col=n.c||'#8a4b2a',r=n.type==='ev'?n.h/2:n.type==='note'?3:10;
  rr(n,r);x.fillStyle=n.type==='note'?hexA(col,.22)+'':g('--pn');x.fill();if(n.type!=='note'){rr(n,r);x.fillStyle=hexA(col,.14);x.fill()}else{rr(n,r);x.fillStyle='#fffbe6';x.fill();rr(n,r);x.fillStyle=hexA(col,.22);x.fill()}
  x.lineWidth=2;x.setLineDash(it&&it.k==='s'?[7,5]:[]);x.strokeStyle=col;rr(n,r);x.stroke();x.setLineDash([]);
  x.save();rr(n,r);x.clip();x.textBaseline='top';
  if(it){x.fillStyle=g('--tx');x.font=font(14,'600');let y=n.y+8;wrap(x,(IC[it.k]||'')+' '+it.t,n.w-18,2).forEach(s=>{x.fillText(s,n.x+9,y);y+=17});
   if(n.h>60){x.font='12px system-ui,sans-serif';x.fillStyle=g('--mu');wrap(x,it.s||'',n.w-18,Math.max(1,Math.floor((n.y+n.h-y-20)/15))).forEach(s=>{x.fillText(s,n.x+9,y);y+=15})}
   x.font='11px system-ui,sans-serif';x.fillStyle=g('--mu');x.fillText(it.k==='d'||it.k==='s'?(it.st||'')+' · '+L.words(it.h)+' pal.':it.k==='c'?((it.m&&it.m.rol)||'Personaje'):((it.m&&it.m.tipo)||'Escenario'),n.x+9,n.y+n.h-17)}
  else{x.fillStyle=n.type==='note'?'#2b2a27':g('--tx');x.font=n.type==='note'?'14px system-ui,sans-serif':font(14,'600');const ls=wrap(x,n.tx,n.w-18,Math.floor((n.h-12)/18));
   const y0=n.type==='ev'?n.y+n.h/2-ls.length*9:n.y+8;x.textAlign=n.type==='ev'?'center':'left';ls.forEach((s,i)=>x.fillText(s,n.type==='ev'?n.x+n.w/2:n.x+9,y0+i*18));x.textAlign='left'}
  x.restore()});
 lines.forEach(([l,gg,col])=>{x.font='12px system-ui,sans-serif';const w=x.measureText(l.lbl).width+16;x.beginPath();x.roundRect(gg.mid[0]-w/2,gg.mid[1]-10,w,20,10);x.fillStyle=g('--pn');x.fill();x.strokeStyle=col;x.lineWidth=1;x.stroke();x.fillStyle=g('--tx');x.textBaseline='middle';x.textAlign='center';x.fillText(l.lbl,gg.mid[0],gg.mid[1]+1);x.textAlign='left'});
 cn.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(L.S().title||'lienzo').toString().replace(/[\\/:*?"<>|]/g,'_')+'-lienzo.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)});
}

window.__LC={show(){toolbar();selN.clear();selL=null;render();if(!CV().nodes.length&&!CV().seen){CV().seen=1}},
 refresh(){if(root.style.display!=='none')render()}};
})();
