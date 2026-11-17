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
#cvt,#cvr,#cvq,#cvp2,#cvmenu{position:absolute;z-index:15;background:var(--pn);border:1px solid var(--ln);border-radius:12px;box-shadow:0 6px 22px rgba(0,0,0,.25);font-size:13px}
#cvt{left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:2px;align-items:center;padding:4px 6px}
#cvr{right:14px;top:14px;display:flex;flex-direction:column;gap:2px;align-items:center;padding:4px}
#cvq{display:none;gap:3px;align-items:center;padding:4px 6px;z-index:16;border-radius:10px;white-space:nowrap}
#cvp2{display:none;flex-wrap:wrap;gap:4px;align-items:center;padding:8px 10px;z-index:17;border-radius:10px;max-width:min(640px,92%)}
#cvmenu{display:none;flex-direction:column;padding:4px;z-index:18;border-radius:8px;min-width:210px}
#cvt button,#cvr button,#cvq button,#cvmenu button{border:0;background:transparent;padding:6px 10px;border-radius:8px;cursor:pointer;color:var(--tx);text-align:left}
#cvq button{padding:5px 8px}#cvr button{padding:6px 9px;text-align:center}
#cvt button:hover,#cvr button:hover,#cvq button:hover,#cvmenu button:hover{background:var(--ah)}
#cvt button.on{background:var(--ah);color:var(--ac)}
#cvt button,#cvq button{white-space:nowrap}
#cvt .sep{width:1px;align-self:stretch;background:var(--ln);margin:2px 4px}
body.compose #cvt,body.compose #cvr{opacity:0;transition:opacity .25s}
body.compose #cvt:hover,body.compose #cvr:hover,body.compose #cvt.show,body.compose #cvr.show{opacity:1}
body.compose #cvt:after,body.compose #cvr:after{content:"";position:absolute;inset:-26px -18px -16px}
body.compose #cvh{display:none}
#cvz{font-size:11px;color:var(--mu);padding:1px 0}
#cvq .sw{width:16px;height:16px;min-width:16px}
#cvp2 button,#cvp2 select{border:1px solid var(--ln);border-radius:6px;background:var(--bg);padding:3px 8px}
#cvv{flex:1;position:relative;overflow:hidden;background:var(--bg);cursor:grab;touch-action:none;
 background-image:radial-gradient(var(--ln) 1px,transparent 1.2px);background-size:24px 24px}
#cvv.pan{cursor:grabbing}#cvv.lk{cursor:crosshair}
#cvw{position:absolute;left:0;top:0;transform-origin:0 0}
#cvF,#cvN,#cvT{position:absolute;left:0;top:0;width:0;height:0}
#cvL{position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible;pointer-events:none}
#cvL .lp{pointer-events:stroke;cursor:pointer;fill:none}
.cn{position:absolute;box-sizing:border-box;border:2px solid var(--c);border-radius:10px;background:color-mix(in srgb,var(--c) 14%,var(--pn));color:var(--tx);padding:7px 9px;overflow:hidden;cursor:move;user-select:none;display:flex;flex-direction:column;gap:2px}
.cn.sel{outline:2px solid var(--ac);outline-offset:3px;overflow:visible}
.cn .nt{font:600 14px Georgia,serif;line-height:1.2;overflow:hidden;text-overflow:ellipsis}
.cn .ns{font-size:12px;color:var(--mu);overflow:hidden;flex:1;line-height:1.25}
.cn .nf{font-size:11px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cn.item.c{border-radius:40px 40px 14px 14px}.cn.item.l{border-radius:4px 4px 28px 28px;border-style:double;border-width:4px}
.cn.item.s{border-style:dashed}
.cn.note{background:color-mix(in srgb,var(--c) 11%,var(--pn));color:var(--tx);border-radius:6px;font:14px/1.4 system-ui,"Segoe UI",sans-serif}
.cn.note .nt{font:14px/1.4 system-ui,sans-serif;white-space:normal;overflow:hidden}
.nt.md h1,.nt.md h2,.nt.md h3{margin:0 0 .25em;font:600 1.15em Georgia,serif}.nt.md h1{font-size:1.35em}
.nt.md p{margin:0 0 .35em}.nt.md ul,.nt.md ol{margin:.1em 0 .35em;padding-left:1.25em}
.nt.md code{background:var(--ah);padding:0 4px;border-radius:3px;font-size:.9em}
.nt.md .wl{color:var(--ac);text-decoration:underline;cursor:pointer}.nt.md .wl.no{opacity:.55;text-decoration:underline dotted}
.cn.ed .nt.md{white-space:pre-wrap}
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
.cn .an{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#fff;border:2px solid var(--ac);box-sizing:border-box;display:none;cursor:crosshair;z-index:4}
.cn .an.mid{width:12px;height:12px;margin:-6px 0 0 -6px}
.cn .an:hover,.cn .an.nr{background:var(--ac);transform:scale(1.35)}
.cn:hover .an.mid,.cn.sel .an,.cn.tgt .an,#cvv.anch .an{display:block}
.cn:hover,.cn.tgt,#cvv.anch .cn{overflow:visible}
.cn.sel.multi .rz,.cn.lk .rz{display:none}
.cn.sel .rz{display:block}
.cn.lk{cursor:default}.cn.lk:before{content:"🔒";position:absolute;right:3px;top:1px;font-size:10px;opacity:.7}
.cn.tgt{outline:3px solid var(--ac);outline-offset:2px}
.cn .nt{font-size:var(--fz,14px)}.cn.frame .nt{font-size:var(--fz,15px)}
.cn.fsolid{background:var(--c)!important;color:#fff!important}.cn.fsolid .nt,.cn.fsolid .ns,.cn.fsolid .nf{color:#fff}
.cn.fnone{background:transparent!important;box-shadow:none}.cn.fpaper{background:var(--pn)!important}
.eh{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;border:2.5px solid var(--ac);box-sizing:border-box;cursor:grab;z-index:6}.eh:hover{transform:scale(1.25)}
#cvs{position:absolute;right:66px;top:14px;z-index:20;background:var(--pn);border:1px solid var(--ln);border-radius:10px;box-shadow:0 6px 24px #0004;padding:12px 14px;width:300px;display:none;font-size:13px}
#cvs h5{margin:10px 0 4px;color:var(--ac);font:600 13px system-ui}#cvs h5:first-child{margin-top:0}
#cvs label{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:3px 0}
#cvs label.ck{justify-content:flex-start}
.cn.ed .nt{user-select:text;cursor:text;outline:1px dashed var(--ac)}
.cl{position:absolute;transform:translate(-50%,-50%);background:var(--pn);border:1px solid var(--ln);border-radius:10px;padding:1px 8px;font-size:12px;white-space:nowrap;cursor:pointer;color:var(--tx)}
.cl.sel{outline:2px solid var(--ac)}
#cvm{position:absolute;border:1px dashed var(--ac);background:#8a4b2a22;display:none;pointer-events:none}
#cvh{position:absolute;left:10px;top:8px;max-width:calc(100% - 90px);font-size:12px;color:var(--mu);pointer-events:none;background:var(--bg);padding:2px 8px;border-radius:8px;opacity:.9}
#cvadd{position:fixed;inset:0;background:#0006;display:none;align-items:center;justify-content:center;z-index:50}
#cvadd>div{background:var(--pn);border:1px solid var(--ln);border-radius:10px;width:min(560px,92vw);max-height:80vh;display:flex;flex-direction:column;padding:14px;gap:8px}
#cvadd .lst{overflow:auto;flex:1;border:1px solid var(--ln);border-radius:6px;padding:6px}
#cvadd h4{margin:8px 0 2px;color:var(--ac)}#cvadd label{display:flex;gap:6px;align-items:center;padding:2px 0}
.sw{width:18px;height:18px;border-radius:50%;border:2px solid var(--pn);box-shadow:0 0 0 1px var(--ln);padding:0;min-width:18px;cursor:pointer}
`;
document.head.appendChild(css);
root.innerHTML=`<div id="cvv"><div id="cvw"><div id="cvF"></div><svg id="cvL"></svg><div id="cvN"></div><div id="cvT"></div></div><div id="cvm"></div><div id="cvh"></div></div><div id="cvt"></div><div id="cvr"></div><div id="cvq"></div><div id="cvp2"></div><div id="cvs"></div><div id="cvmenu"></div>`;
const addDlg=document.createElement('div');addDlg.id='cvadd';document.body.appendChild(addDlg);
const V=$('#cvv'),W=$('#cvw'),NL=$('#cvN'),FL=$('#cvF'),TL=$('#cvT'),SV=$('#cvL'),MQ=$('#cvm'),SP=$('#cvs'),Q=$('#cvq'),PP=$('#cvp2'),MN=$('#cvmenu');
let selN=new Set(),selL=null,linkMode=false,undo=[],redo=[],pendingFrom=null,reDrag=null,moreOpen=false,afterAdd=null;
const PAL=['#8f8f8f','#fb464c','#e9973f','#e0de71','#44cf6e','#53dfdd','#a882ff'];
const findItem=n=>{n=String(n).trim().toLowerCase();return L.S().items.find(i=>i.t&&i.t.trim().toLowerCase()===n)};
const CV=()=>{const S=L.S();if(!S.cv)S.cv={nodes:[],links:[],x:60,y:60,z:1,auto:true};return S.cv};
/* ajustes del lienzo (se guardan con el proyecto) */
const D0={route:'curve',lw:2.5,head:'a',snap:false,grid:true,gs:24,detail:'normal',pov:1,lug:1,pr:1,anch:false};
const cfg=()=>Object.assign({},D0,CV().cfg||{});
const setCfg=(k,v)=>{const c=CV();c.cfg=Object.assign(c.cfg||{},{[k]:v});L.save()};
const sn=v=>{const g=cfg();return g.snap?Math.round(v/g.gs)*g.gs:Math.round(v)};
const nodeById=id=>CV().nodes.find(n=>n.id===id);
const refOf=n=>n.type==='item'?L.get(n.ref):null;
const snap=()=>JSON.stringify({n:CV().nodes,l:CV().links});
function pushUndo(){undo.push(snap());if(undo.length>80)undo.shift();redo=[]}
function restore(s){const o=JSON.parse(s),c=CV();c.nodes=o.n;c.links=o.l;selN.clear();selL=null;L.save();render()}
const doUndo=()=>{if(!undo.length)return;redo.push(snap());restore(undo.pop())};
const doRedo=()=>{if(!redo.length)return;undo.push(snap());restore(redo.pop())};
function mut(f){pushUndo();f();L.save();render()}
function applyView(){const c=CV(),g=cfg();W.style.transform=`translate(${c.x}px,${c.y}px) scale(${c.z})`;V.style.backgroundImage=g.grid?'':'none';V.style.backgroundSize=g.gs*c.z+'px '+g.gs*c.z+'px';V.style.backgroundPosition=c.x+'px '+c.y+'px';V.classList.toggle('anch',!!g.anch);quickPos();const z=$('#cvz');if(z)z.textContent=Math.round(c.z*100)+'%'}
function toWorld(e){const r=V.getBoundingClientRect(),c=CV();return[(e.clientX-r.left-c.x)/c.z,(e.clientY-r.top-c.y)/c.z]}
function center(){const r=V.getBoundingClientRect(),c=CV();return[(r.width/2-c.x)/c.z,(r.height/2-c.y)/c.z]}

/* ---------- geometría: formas y puntos de anclaje ---------- */
const SHAPES=[['','Según el tipo'],['rect','Rectángulo'],['round','Redondeado'],['pill','Píldora'],['ellipse','Elipse']];
const RAD={rect:3,round:10,pill:999};
function shapeOf(n){if(n.shp)return n.shp;return n.type==='ev'?'pill':n.type==='note'?'rect':'round'}
function radiusOf(n){const s=n.shp;if(s)return RAD[s]||0;return n.type==='ev'?999:n.type==='note'?3:n.type==='frame'?16:10}
const NORM={t:[0,-1],r:[1,0],b:[0,1],l:[-1,0]};
const TS=[.25,.5,.75],SIDES=['t','r','b','l'];
const ANAME={t:'Arriba',r:'Derecha',b:'Abajo',l:'Izquierda'},TNAME={t:['izquierda','centro','derecha'],b:['izquierda','centro','derecha'],l:['arriba','centro','abajo'],r:['arriba','centro','abajo']};
function anchorPt(n,a){const t=a.t==null?.5:a.t;let x,y;
 if(a.s==='t'){x=n.x+n.w*t;y=n.y}else if(a.s==='b'){x=n.x+n.w*t;y=n.y+n.h}else if(a.s==='l'){x=n.x;y=n.y+n.h*t}else{x=n.x+n.w;y=n.y+n.h*t}
 if(shapeOf(n)==='ellipse'){const cx=n.x+n.w/2,cy=n.y+n.h/2,rx=n.w/2,ry=n.h/2;
  if(a.s==='t'||a.s==='b'){const u=Math.max(-1,Math.min(1,(x-cx)/rx));y=cy+(a.s==='t'?-1:1)*ry*Math.sqrt(1-u*u)}
  else{const u=Math.max(-1,Math.min(1,(y-cy)/ry));x=cx+(a.s==='l'?-1:1)*rx*Math.sqrt(1-u*u)}}
 return[x,y]}
function nearAnchor(n,wx,wy,r){let best=null,bd=1e9;SIDES.forEach(s=>TS.forEach(t=>{const p=anchorPt(n,{s,t}),d=Math.hypot(p[0]-wx,p[1]-wy);if(d<bd){bd=d;best={s,t}}}));return r==null||bd<=r?best:null}
function autoSide(n,tx,ty){const dx=tx-(n.x+n.w/2),dy=ty-(n.y+n.h/2);return Math.abs(dx)*n.h>Math.abs(dy)*n.w?{s:dx>0?'r':'l',t:.5}:{s:dy>0?'b':'t',t:.5}}
function edge(n,tx,ty){const cx=n.x+n.w/2,cy=n.y+n.h/2,dx=tx-cx,dy=ty-cy;if(!dx&&!dy)return[cx,cy];
 const s=Math.min((n.w/2+4)/Math.abs(dx||1e-9),(n.h/2+4)/Math.abs(dy||1e-9));return[cx+dx*s,cy+dy*s]}
function geo(a,b,bend){
 const ac=[a.x+a.w/2,a.y+a.h/2],bc=[b.x+b.w/2,b.y+b.h/2],dx=bc[0]-ac[0],dy=bc[1]-ac[1],len=Math.hypot(dx,dy)||1;
 const q=[(ac[0]+bc[0])/2-dy/len*len*bend,(ac[1]+bc[1])/2+dx/len*len*bend];
 const p1=edge(a,q[0],q[1]),p2=edge(b,q[0],q[1]);
 return{p1,p2,q,mid:[.25*p1[0]+.5*q[0]+.25*p2[0],.25*p1[1]+.5*q[1]+.25*p2[1]]};
}
function bendFor(l,all){const same=all.filter(o=>(o.a===l.a&&o.b===l.b)||(o.a===l.b&&o.b===l.a));const i=same.indexOf(l);
 return l.cv!=null?l.cv:(.12+i*.16)*(l.a<l.b?1:-1)}
const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
function polyPath(pts,r){let d=`M${pts[0]}`;for(let i=1;i<pts.length-1;i++){const p=pts[i-1],c=pts[i],n=pts[i+1],l1=dist(p,c),l2=dist(c,n);if(!l1||!l2)continue;const rr=Math.min(r,l1/2,l2/2);
 d+=` L${[c[0]+(p[0]-c[0])/l1*rr,c[1]+(p[1]-c[1])/l1*rr]} Q${c} ${[c[0]+(n[0]-c[0])/l2*rr,c[1]+(n[1]-c[1])/l2*rr]}`}
 return d+` L${pts[pts.length-1]}`}
function polyAt(pts,t){let tot=0;for(let i=1;i<pts.length;i++)tot+=dist(pts[i-1],pts[i]);let w=tot*t;for(let i=1;i<pts.length;i++){const d=dist(pts[i-1],pts[i]);if(w<=d||i===pts.length-1){const k=d?Math.min(1,w/d):0;return[pts[i-1][0]+(pts[i][0]-pts[i-1][0])*k,pts[i-1][1]+(pts[i][1]-pts[i-1][1])*k]}w-=d}return pts[0]}
/* ruta completa de una flecha: {d, p1, p2, f1, f2, mid} */
function route(l,a,b,all){
 const g=cfg(),rt=l.rt||g.route,sa=l.sa,ta=l.ta,lp=l.lp==null?.5:l.lp,ac=[a.x+a.w/2,a.y+a.h/2],bc=[b.x+b.w/2,b.y+b.h/2];
 if(rt==='curve'&&!sa&&!ta){const q=geo(a,b,bendFor(l,all));return{d:`M${q.p1} Q${q.q} ${q.p2}`,p1:q.p1,p2:q.p2,f1:q.q,f2:q.q,mid:q.mid}}
 if(rt==='line'){let p1=sa?anchorPt(a,sa):edge(a,bc[0],bc[1]);const p2=ta?anchorPt(b,ta):edge(b,p1[0],p1[1]);if(!sa)p1=edge(a,p2[0],p2[1]);
  return{d:`M${p1} L${p2}`,p1,p2,f1:p2,f2:p1,mid:[p1[0]+(p2[0]-p1[0])*lp,p1[1]+(p2[1]-p1[1])*lp]}}
 const s1=sa||autoSide(a,ta?anchorPt(b,ta)[0]:bc[0],ta?anchorPt(b,ta)[1]:bc[1]),p1=anchorPt(a,s1),s2=ta||autoSide(b,p1[0],p1[1]),p2=anchorPt(b,s2),n1=NORM[s1.s],n2=NORM[s2.s];
 if(rt==='curve'){const k=Math.max(34,dist(p1,p2)*.4*(1+(l.cv||0)*2)),c1=[p1[0]+n1[0]*k,p1[1]+n1[1]*k],c2=[p2[0]+n2[0]*k,p2[1]+n2[1]*k],tt=lp,u=1-tt;
  return{d:`M${p1} C${c1} ${c2} ${p2}`,p1,p2,f1:c1,f2:c2,mid:[u*u*u*p1[0]+3*u*u*tt*c1[0]+3*u*tt*tt*c2[0]+tt*tt*tt*p2[0],u*u*u*p1[1]+3*u*u*tt*c1[1]+3*u*tt*tt*c2[1]+tt*tt*tt*p2[1]]}}
 /* en ángulo (ortogonal) */
 const G=24,q1=[p1[0]+n1[0]*G,p1[1]+n1[1]*G],q2=[p2[0]+n2[0]*G,p2[1]+n2[1]*G],h1=n1[0]!==0,h2=n2[0]!==0;let mid;
 if(h1&&h2){const mx=(q1[0]+q2[0])/2;mid=[[mx,q1[1]],[mx,q2[1]]]}else if(!h1&&!h2){const my=(q1[1]+q2[1])/2;mid=[[q1[0],my],[q2[0],my]]}
 else if(h1)mid=[[q2[0],q1[1]]];else mid=[[q1[0],q2[1]]];
 let pts=[p1,q1,...mid,q2,p2].filter((p,i,A)=>!i||dist(p,A[i-1])>.5);
 pts=pts.filter((p,i,A)=>i===0||i===A.length-1||!((A[i-1][0]===p[0]&&p[0]===A[i+1][0])||(A[i-1][1]===p[1]&&p[1]===A[i+1][1])));
 return{d:polyPath(pts,12),p1,p2,f1:pts[1],f2:pts[pts.length-2],mid:polyAt(pts,lp)}}
const HEADS=[['n','Sin punta'],['a','Flecha'],['o','Flecha abierta'],['d','Punto'],['m','Rombo']];
function heads(l){const g=cfg();return[l.h1!=null?l.h1:(l.dir==='b'?'a':'n'),l.h2!=null?l.h2:(l.dir?(l.dir==='n'?'n':'a'):g.head)]}
function headShape(t,p,f,w){if(!t||t==='n')return null;const a=Math.atan2(p[1]-f[1],p[0]-f[0]),s=8+w*2.2,P=(r,th)=>[p[0]-Math.cos(a+th)*r,p[1]-Math.sin(a+th)*r];
 if(t==='a'){const A=P(s,.42),B=P(s,-.42);return{d:`M${p} L${A} L${B} Z`,fill:1}}
 if(t==='o'){const A=P(s,.5),B=P(s,-.5);return{d:`M${A} L${p} L${B}`,fill:0}}
 if(t==='d'){const r=s*.38,c=P(r,0);return{d:`M${c[0]-r},${c[1]} a${r},${r} 0 1,0 ${2*r},0 a${r},${r} 0 1,0 ${-2*r},0`,fill:1}}
 const nx=Math.cos(a),ny=Math.sin(a),c=P(s*.5,0),h=s*.35;return{d:`M${p} L${c[0]-ny*h},${c[1]+nx*h} L${p[0]-nx*s},${p[1]-ny*s} L${c[0]+ny*h},${c[1]-nx*h} Z`,fill:1}}
const headSVG=(t,p,f,col,w)=>{const h=headShape(t,p,f,w);return h?`<path d="${h.d}" fill="${h.fill?col:'none'}" stroke="${col}" stroke-width="${Math.min(w,2.2)}" stroke-linejoin="round" stroke-linecap="round" style="pointer-events:none"/>`:''};
const DASH={solid:'',dashed:'9 6',dotted:'2 6'};

/* ---------- barra ---------- */
function toolbar(){
 $('#cvt').innerHTML=`<button data-a="note" title="Tarjeta de texto (también: doble clic en el fondo). Admite **negrita**, *cursiva*, # títulos, - listas y [[enlaces a escenas o personajes]]">＋ Tarjeta</button><button data-a="add" title="Escenas, personajes y escenarios del proyecto (también puedes arrastrarlos desde el clasificador)">📄 Del proyecto</button><button data-a="frame" title="Agrupa visualmente varios elementos">▭ Grupo</button><button data-a="ev">◉ Evento</button><button data-a="tl">⟶ Línea de tiempo</button><span class="sep"></span><button data-a="link" class="${linkMode?'on':''}" title="Pulsa dos elementos para unirlos. Para elegir los puntos exactos, arrastra desde los puntos ○ del borde.">↗ Unir</button>`;
 $('#cvr').innerHTML=`<button data-a="zi" title="Acercar">＋</button><button data-a="fit" title="Ajustar a la pantalla">⤢</button><button data-a="zo" title="Alejar">−</button><span id="cvz"></span><button data-a="un" title="Deshacer (Ctrl+Z)">↶</button><button data-a="re" title="Rehacer (Ctrl+Y)">↷</button><button data-a="cfg" title="Ajustes del lienzo">⚙</button><button data-a="foc" title="Sin distracciones: lienzo a pantalla completa (Ctrl+Mayús+F · Esc para salir)">⛶</button>`;
 root.querySelectorAll('#cvt [data-a],#cvr [data-a]').forEach(b=>b.onclick=()=>act(b.dataset.a));
 applyView();
}
function settings(){
 const g=cfg(),c=CV(),op=(arr,v)=>arr.map(([k,t])=>`<option value="${k}"${String(v)===String(k)?' selected':''}>${t}</option>`).join('');
 SP.innerHTML=`<h5>Cuadrícula</h5>
 <label class="ck"><input type="checkbox" data-k="grid" ${g.grid?'checked':''}>Mostrar cuadrícula</label>
 <label class="ck"><input type="checkbox" data-k="snap" ${g.snap?'checked':''}>Imán: ajustar a la cuadrícula al mover</label>
 <label>Tamaño de la cuadrícula<select data-k="gs">${op([[12,'12 px'],[24,'24 px'],[48,'48 px']],g.gs)}</select></label>
 <h5>Flechas nuevas</h5>
 <label>Trazado<select data-k="route">${op([['curve','Curva'],['line','Recta'],['elbow','En ángulo']],g.route)}</select></label>
 <label>Grosor<select data-k="lw">${op([[1.5,'Fino'],[2.5,'Normal'],[4,'Grueso'],[6,'Muy grueso']],g.lw)}</select></label>
 <label>Punta final<select data-k="head">${op(HEADS,g.head)}</select></label>
 <label class="ck"><input type="checkbox" data-k="anch" ${g.anch?'checked':''}>Mostrar siempre los puntos de conexión</label>
 <h5>Relaciones automáticas</h5>
 <label class="ck"><input type="checkbox" data-k="auto" ${c.auto!==false?'checked':''}>Dibujar relaciones de las escenas</label>
 <label class="ck" style="padding-left:18px"><input type="checkbox" data-k="pov" ${g.pov?'checked':''}>Punto de vista</label>
 <label class="ck" style="padding-left:18px"><input type="checkbox" data-k="lug" ${g.lug?'checked':''}>Escenario</label>
 <label class="ck" style="padding-left:18px"><input type="checkbox" data-k="pr" ${g.pr?'checked':''}>Personajes que aparecen</label>
 <h5>Detalle de los elementos</h5>
 <label>Contenido<select data-k="detail">${op([['min','Solo el título'],['normal','Normal'],['full','Completo (resumen sin recortar)']],g.detail)}</select></label>
 <h5>Herramientas</h5><div style="display:flex;gap:6px;flex-wrap:wrap"><button data-a="lay" title="Escenas por capítulos, personajes arriba, escenarios abajo">Distribuir por capítulos</button><button data-a="tlalign" title="Ordena sobre la línea de tiempo seleccionada">Alinear en la línea</button><button data-a="png">Exportar PNG</button></div>`;
 SP.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{SP.style.display='none';act(b.dataset.a)});
 SP.querySelectorAll('[data-k]').forEach(i=>i.onchange=()=>{const k=i.dataset.k;let v=i.type==='checkbox'?(i.checked?1:0):i.value;
  if(['lw','gs'].includes(k))v=+v;if(['grid','snap','anch'].includes(k))v=!!v;
  if(k==='auto'){c.auto=!!v;L.save()}else setCfg(k,v);applyView();render()});
}
function act(a){
 const c=CV();
 if(a==='add')return openAdd();
 if(a==='foc'){if(window.__focusToggle)window.__focusToggle();return}
 if(a==='cfg'){const on=SP.style.display!=='block';SP.style.display=on?'block':'none';if(on)settings();return}
 if(a==='link'){linkMode=!linkMode;pendingFrom=null;V.classList.toggle('lk',linkMode);toolbar();return hint()}
 if(a==='note'||a==='frame'||a==='ev'||a==='tl'){const[x,y]=center(),d=DEF[a];
  const n={id:uid(),type:a,x:sn(x-d[0]/2),y:sn(y-d[1]/2),w:d[0],h:d[1],tx:{note:'',frame:'Título del marco',ev:'Fecha · suceso',tl:'Línea de tiempo'}[a],c:{note:'#8f8f8f',frame:'#8f8f8f',ev:'#53dfdd',tl:'#8f8f8f'}[a]};
  mut(()=>c.nodes.push(n));selN=new Set([n.id]);render();if(a!=='tl'&&a!=='frame')editText(n.id);return}
 if(a==='zi')return zoomAt(1.2);if(a==='zo')return zoomAt(1/1.2);if(a==='fit')return fit();
 if(a==='un')return doUndo();if(a==='re')return doRedo();
 if(a==='lay')return layout();if(a==='tlalign')return alignTL();if(a==='png')return exportPNG();
}
function hint(){$('#cvh').textContent=linkMode?(pendingFrom?'Ahora pulsa el elemento de destino · Esc cancela':'Pulsa el elemento de origen · Esc cancela'):'Rueda: zoom · Arrastra el fondo: mover · Doble clic en el fondo: tarjeta · ○ del borde: arrastra para unir · Mayús+arrastrar: seleccionar varios · Ctrl+clic en [[enlace]]: abrir'}
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
 $('#cvNo').onclick=()=>{afterAdd=null;close()};
 $('#cvAll').onclick=()=>addDlg.querySelectorAll('input:not(:disabled)').forEach(i=>i.checked=true);
 $('#cvOk').onclick=()=>{const ids=[...addDlg.querySelectorAll('input:checked')].map(i=>i.value);close();if(ids.length)addItems(ids)};
}
function addItems(ids,at){
 const c=CV(),[cx,cy]=at||center();let k=0;const made=[];
 mut(()=>{ids.forEach(id=>{const it=L.get(id);if(!it||c.nodes.some(n=>n.type==='item'&&n.ref===id))return;
  const d=DEF.item,w=it.k==='c'||it.k==='l'?160:d[0],h=it.k==='c'||it.k==='l'?78:d[1],cols=Math.min(4,Math.ceil(Math.sqrt(ids.length)));
  const n={id:uid(),type:'item',ref:id,x:sn(cx-w/2+(k%cols)*(w+30)-(cols-1)*(w+30)/2),y:sn(cy-h/2+Math.floor(k/cols)*(h+30)),w,h,c:{d:'#8a4b2a',s:'#b7950b',c:'#2f6fb5',l:'#2e8b57'}[it.k]||'#6b6b6b'};
  k++;c.nodes.push(n);made.push(n.id)});afterLink(made)});
 selN=new Set(made);render();
}

/* ---------- distribución y alineación ---------- */
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
function alignSel(k){
 const ns=[...selN].map(nodeById).filter(n=>n&&!n.lk);if(ns.length<2)return;
 mut(()=>{const bb=bbox(ns);
  if(k==='l')ns.forEach(n=>n.x=bb[0]);else if(k==='r')ns.forEach(n=>n.x=bb[2]-n.w);else if(k==='c')ns.forEach(n=>n.x=Math.round((bb[0]+bb[2])/2-n.w/2));
  else if(k==='t')ns.forEach(n=>n.y=bb[1]);else if(k==='b')ns.forEach(n=>n.y=bb[3]-n.h);else if(k==='m')ns.forEach(n=>n.y=Math.round((bb[1]+bb[3])/2-n.h/2));
  else if(k==='dh'||k==='dv'){const h=k==='dh',s=[...ns].sort((a,b)=>h?a.x-b.x:a.y-b.y),span=h?bb[2]-bb[0]:bb[3]-bb[1],sum=s.reduce((t,n)=>t+(h?n.w:n.h),0),gap=(span-sum)/(s.length-1);let p=h?bb[0]:bb[1];
   s.forEach(n=>{if(h)n.x=Math.round(p);else n.y=Math.round(p);p+=(h?n.w:n.h)+gap})}
  else if(k==='sw'){const w=Math.max(...ns.map(n=>n.w));ns.forEach(n=>n.w=w)}else if(k==='sh'){const h=Math.max(...ns.map(n=>n.h));ns.forEach(n=>n.h=h)}
 });
}

/* ---------- render ---------- */
function md(s){const inl=t=>esc(t).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>').replace(/~~([^~]+)~~/g,'<s>$1</s>').replace(/\[\[([^\]\n]+)\]\]/g,(m,n)=>`<span class="wl${findItem(n.replace(/&amp;/g,'&'))?'':' no'}">${n}</span>`);
 const out=[];let list='';const close=()=>{if(list){out.push(`</${list}>`);list=''}};
 String(s||'').split('\n').forEach(line=>{let m;
  if(m=/^(#{1,3})\s+(.*)$/.exec(line)){close();out.push(`<h${m[1].length}>${inl(m[2])}</h${m[1].length}>`)}
  else if(m=/^\s*[-*•]\s+(.*)$/.exec(line)){if(list!=='ul'){close();out.push('<ul>');list='ul'}out.push(`<li>${inl(m[1])}</li>`)}
  else if(m=/^\s*\d+[.)]\s+(.*)$/.exec(line)){if(list!=='ol'){close();out.push('<ol>');list='ol'}out.push(`<li>${inl(m[1])}</li>`)}
  else{close();if(line.trim())out.push(`<p>${inl(line)}</p>`)}});close();return out.join('')}
function nodeHTML(n){
 const it=refOf(n),g=cfg();
 if(n.type==='item'){if(!it)return'';const w=it.k==='f'?'':L.words(it.h),min=g.detail==='min',full=g.detail==='full';
  return`<div class="nt">${IC[it.k]||''} ${esc(it.t)}</div>${!min&&(full||n.h>60)?`<div class="ns">${esc((it.s||'').slice(0,full?600:160))}</div>`:''}${min?'':`<div class="nf">${it.k==='d'||it.k==='s'?esc(it.st||'')+' · '+w+' pal.':it.k==='c'?esc((it.m&&it.m.rol)||'Personaje'):esc((it.m&&it.m.tipo)||'Escenario')}</div>`}`}
 if(n.type==='tl')return`<div class="bar"></div><div class="nt">${esc(n.tx||'')}</div>`;
 if(n.type==='note')return`<div class="nt md">${md(n.tx)}</div>`;
 return`<div class="nt">${esc(n.tx||'')}</div>`;
}
const FZ={s:'11px',m:'',l:'19px',x:'26px'},BS={solid:'solid',dashed:'dashed',dotted:'dotted',double:'double'};
function render(){
 const c=CV();
 c.nodes=c.nodes.filter(n=>n.type!=='item'||refOf(n));const alive=new Set(c.nodes.map(n=>n.id));
 c.links=c.links.filter(l=>alive.has(l.a)&&alive.has(l.b));selN.forEach(i=>{if(!alive.has(i))selN.delete(i)});
 NL.innerHTML='';FL.innerHTML='';
 c.nodes.forEach(n=>{const d=document.createElement('div'),it=refOf(n);
  d.className='cn '+n.type+(it?' '+it.k:'')+(selN.has(n.id)?' sel':'')+(selN.size>1?' multi':'')+(n.lk?' lk':'')+(n.fl&&n.fl!=='tint'?' f'+n.fl:'');d.dataset.id=n.id;
  d.style.setProperty('--c',n.c||'#8a4b2a');
  if(n.shp)d.style.borderRadius=n.shp==='ellipse'?'50%':RAD[n.shp]+'px';
  if(n.bs==='none'){d.style.borderWidth='0'}else if(n.bs){d.style.borderStyle=BS[n.bs];if(n.bs==='double')d.style.borderWidth='4px'}
  if(n.fs&&FZ[n.fs])d.style.setProperty('--fz',FZ[n.fs]);if(n.al)d.style.textAlign={l:'left',c:'center',r:'right'}[n.al];
  d.innerHTML=nodeHTML(n)+SIDES.map(s=>TS.map(t=>`<div class="an${t===.5?' mid':''}" data-s="${s}" data-t="${t}"></div>`).join('')).join('')+'<div class="rz"></div>';
  (n.type==='frame'?FL:NL).appendChild(d);place(n,d)});
 drawLinks();props();quick();hint();applyView();
}
function place(n,d){d=d||NL.querySelector(`[data-id="${n.id}"]`)||FL.querySelector(`[data-id="${n.id}"]`);if(!d)return;d.style.left=n.x+'px';d.style.top=n.y+'px';d.style.width=n.w+'px';d.style.height=n.h+'px';
 d.querySelectorAll('.an').forEach(a=>{const p=anchorPt(n,{s:a.dataset.s,t:+a.dataset.t});a.style.left=(p[0]-n.x)+'px';a.style.top=(p[1]-n.y)+'px'})}
function drawLinks(){
 const c=CV(),g=cfg();let h='';TL.innerHTML='';
 if(c.auto!==false){
  const by={};c.nodes.forEach(n=>{if(n.type==='item')by[n.ref]=n});
  c.nodes.forEach(n=>{const it=refOf(n);if(!it||!(it.k==='d'||it.k==='s')||!it.m)return;
   [['pov','#6c4fb3','4 5'],['lug','#2e8b57','1 6'],['pr','#a3478b','2 4']].forEach(([k,col,da])=>{if(!g[k])return;(Array.isArray(it.m[k])?it.m[k]:[it.m[k]]).forEach(ref=>{const t=ref&&by[ref];if(!t)return;
    const q=geo(n,t,.08);h+=`<path d="M${q.p1} Q${q.q} ${q.p2}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="${da}" opacity=".55"/>`})})});
 }
 c.links.forEach(l=>{const a=nodeById(l.a),b=nodeById(l.b);if(!a||!b)return;
  const r=route(l,a,b,c.links),col=l.c||'#8a4b2a',sel=selL===l.id,w=l.w||g.lw,[h1,h2]=heads(l);
  h+=`<g data-l="${l.id}"><path class="lp" d="${r.d}" stroke="transparent" stroke-width="16"/><path d="${r.d}" fill="none" stroke="${col}" stroke-width="${sel?w+1.5:w}" stroke-dasharray="${DASH[l.st||'solid']}" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"/>`
   +headSVG(h2,r.p2,r.f2,col,w)+headSVG(h1,r.p1,r.f1,col,w)
   +'</g>';
  if(sel)[1,2].forEach(k=>{const e=document.createElement('div'),p=k===1?r.p1:r.p2;e.className='eh';e.dataset.e=k;e.title='Arrastra para conectar a otro punto';e.style.cssText=`left:${p[0]}px;top:${p[1]}px;border-color:${col}`;TL.appendChild(e)});
  if(l.lbl){const e=document.createElement('div');e.className='cl'+(sel?' sel':'');e.dataset.l=l.id;e.textContent=l.lbl;e.style.left=r.mid[0]+'px';e.style.top=r.mid[1]+'px';e.style.borderColor=col;TL.appendChild(e)}});
 const ghost=(fromN,fromA,cur,col)=>{const p1=fromA?anchorPt(fromN,fromA):edge(fromN,cur[0],cur[1]);return`<path d="M${p1} L${cur}" stroke="${col}" stroke-width="2.5" stroke-dasharray="6 5" fill="none" style="pointer-events:none"/>`};
 if(pendingFrom&&pendingFrom.cur){const a=nodeById(pendingFrom.id);if(a)h+=ghost(a,pendingFrom.sa,pendingFrom.cur,'#8a4b2a')}
 if(reDrag&&reDrag.cur){const l=c.links.find(x=>x.id===reDrag.id),o=l&&nodeById(reDrag.end===1?l.b:l.a);if(o)h+=ghost(o,reDrag.end===1?l.ta:l.sa,reDrag.cur,l.c||'#8a4b2a')}
 SV.innerHTML=h;
}
function swatches(cur,fn){return PAL.map(k=>`<button class="sw" data-k="${k}" style="background:${k}${k===cur?';outline:2px solid var(--tx)':''}"></button>`).join('')}
const sel=(p,opts,val,title)=>`<select data-p="${p}" title="${title||''}">${opts.map(([k,t])=>`<option value="${k}"${String(val)===String(k)?' selected':''}>${t}</option>`).join('')}</select>`;
const ANCH_OPTS=[['','Automático'],...SIDES.flatMap(s=>TS.map((t,i)=>[s+':'+t,ANAME[s]+' · '+TNAME[s][i]]))];
const aKey=a=>a?a.s+':'+a.t:'';
const aVal=v=>{if(!v)return null;const[s,t]=v.split(':');return{s,t:+t}};
function props(){
 const box=PP,c=CV(),g=cfg();
 if(selL){const l=c.links.find(x=>x.id===selL);if(!l){selL=null;return props()}
  const rt=l.rt||g.route,[h1,h2]=heads(l);
  box.innerHTML=`<b>Flecha</b><button data-p="lbl">Etiqueta…</button>
  ${sel('rt',[['curve','Curva'],['line','Recta'],['elbow','En ángulo']],rt,'Trazado')}
  ${sel('st',[['solid','Continua'],['dashed','Discontinua'],['dotted','Punteada']],l.st||'solid','Estilo de línea')}
  ${sel('w',[[1.5,'Fina'],[2.5,'Normal'],[4,'Gruesa'],[6,'Muy gruesa']],l.w||g.lw,'Grosor')}
  ${sel('h1',HEADS.map(([k,t])=>[k,'Inicio: '+t.toLowerCase()]),h1,'Punta en el origen')}${sel('h2',HEADS.map(([k,t])=>[k,'Fin: '+t.toLowerCase()]),h2,'Punta en el destino')}
  ${sel('sa',ANCH_OPTS.map(([k,t])=>[k,'Sale: '+t]),aKey(l.sa),'Punto de salida')}${sel('ta',ANCH_OPTS.map(([k,t])=>[k,'Llega: '+t]),aKey(l.ta),'Punto de llegada')}
  <button data-p="inv">⇄ Invertir</button>${rt==='curve'?'<button data-p="bend">Curvar más</button><button data-p="str">Menos</button>':''}${swatches(l.c||'#8a4b2a')}<span class="sp"></span><button data-p="del">Eliminar</button>`;
  box.querySelectorAll('.sw').forEach(b=>b.onclick=()=>mut(()=>l.c=b.dataset.k));
  const q=s=>box.querySelector(`[data-p=${s}]`);
  q('lbl').onclick=async()=>{const t=await L.askText('Etiqueta de la flecha (por ejemplo: «traiciona a», «un año después»)',l.lbl||'');if(t!=null)mut(()=>l.lbl=t.trim())};
  q('rt').onchange=e=>mut(()=>l.rt=e.target.value);q('st').onchange=e=>mut(()=>l.st=e.target.value);q('w').onchange=e=>mut(()=>l.w=+e.target.value);
  q('h1').onchange=e=>mut(()=>{const k=heads(l);l.h1=e.target.value;l.h2=k[1];delete l.dir});q('h2').onchange=e=>mut(()=>{const k=heads(l);l.h2=e.target.value;l.h1=k[0];delete l.dir});
  q('sa').onchange=e=>mut(()=>{const v=aVal(e.target.value);if(v)l.sa=v;else delete l.sa});q('ta').onchange=e=>mut(()=>{const v=aVal(e.target.value);if(v)l.ta=v;else delete l.ta});
  q('inv').onclick=()=>mut(()=>{const t=l.a;l.a=l.b;l.b=t;const s=l.sa;if(l.ta)l.sa=l.ta;else delete l.sa;if(s)l.ta=s;else delete l.ta;if(l.h1!=null||l.h2!=null||l.dir){const k=heads(l);l.h1=k[1];l.h2=k[0];delete l.dir}});
  if(q('bend')){q('bend').onclick=()=>mut(()=>{if(l.sa||l.ta)l.cv=Math.min(1.5,(l.cv||0)+.25);else{const b=bendFor(l,c.links);l.cv=(b>=0?1:-1)*(Math.abs(b)+.15)}});
   q('str').onclick=()=>mut(()=>{if(l.sa||l.ta)l.cv=Math.max(-.6,(l.cv||0)-.25);else l.cv=0})}
  q('del').onclick=()=>mut(()=>{c.links=c.links.filter(x=>x!==l);selL=null});
  return}
 const ns=[...selN].map(nodeById).filter(Boolean);
 if(!ns.length){box.innerHTML='<span style="color:var(--mu)">Selecciona un elemento o una flecha para cambiar su aspecto.</span>';return}
 const n=ns[0],one=ns.length===1;
 box.innerHTML=`<b>${one?({item:'Elemento del proyecto',note:'Nota',frame:'Marco',ev:'Evento',tl:'Línea de tiempo'}[n.type]):ns.length+' elementos'}</b>${swatches(one?n.c:'')}
  ${n.type!=='tl'?sel('shp',SHAPES,one?n.shp||'':'','Forma')+sel('fl',[['tint','Relleno suave'],['solid','Relleno sólido'],['paper','Relleno neutro'],['none','Sin relleno']],one?n.fl||'tint':'tint','Relleno')+sel('bs',[['','Borde: según tipo'],['solid','Borde continuo'],['dashed','Borde discontinuo'],['dotted','Borde punteado'],['double','Borde doble'],['none','Sin borde']],one?n.bs||'':'','Borde'):''}
  ${n.type!=='tl'?sel('fs',[['s','Texto pequeño'],['m','Texto normal'],['l','Texto grande'],['x','Texto muy grande']],one?n.fs||'m':'m','Tamaño del texto')+sel('al',[['','Alinear: auto'],['l','Izquierda'],['c','Centro'],['r','Derecha']],one?n.al||'':'','Alineación del texto'):''}
  ${one&&n.type!=='item'?'<button data-p="txt">Editar texto</button>':''}${one&&n.type==='item'?'<button data-p="open">Abrir en el editor</button><button data-p="ren">Renombrar</button>':''}
  ${ns.length>1?sel('aln',[['','Alinear…'],['l','Izquierda'],['c','Centrar horizontal'],['r','Derecha'],['t','Arriba'],['m','Centrar vertical'],['b','Abajo'],['dh','Distribuir horizontal'],['dv','Distribuir vertical'],['sw','Mismo ancho'],['sh','Mismo alto']],'','Alinear y distribuir'):''}
  <button data-p="lock" title="Impide moverlo o cambiarle el tamaño">${ns.every(x=>x.lk)?'🔓 Desbloquear':'🔒 Bloquear'}</button><button data-p="dup">Duplicar</button><button data-p="front">Traer al frente</button><span class="sp"></span><button data-p="del">${ns.some(x=>x.type==='item')?'Quitar del lienzo':'Eliminar'}</button>`;
 box.querySelectorAll('.sw').forEach(b=>b.onclick=()=>mut(()=>ns.forEach(x=>x.c=b.dataset.k)));
 const q=s=>box.querySelector(`[data-p=${s}]`);
 const setP=(k,del)=>e=>mut(()=>ns.forEach(x=>{const v=e.target.value;if(v===del||v==='')delete x[k];else x[k]=v}));
 if(q('shp')){q('shp').onchange=setP('shp','');q('fl').onchange=setP('fl','tint');q('bs').onchange=setP('bs','');q('fs').onchange=setP('fs','m');q('al').onchange=setP('al','')}
 if(q('aln'))q('aln').onchange=e=>{const v=e.target.value;if(v)alignSel(v)};
 q('lock').onclick=()=>mut(()=>{const all=ns.every(x=>x.lk);ns.forEach(x=>{if(all)delete x.lk;else x.lk=1})});
 q('del').onclick=()=>delSel();
 q('dup').onclick=()=>mut(()=>{const m=new Map(),made=[];ns.forEach(x=>{if(x.type==='item')return;const y=JSON.parse(JSON.stringify(x));y.id=uid();y.x+=30;y.y+=30;delete y.lk;m.set(x.id,y.id);c.nodes.push(y);made.push(y.id)});
  c.links.filter(l=>m.has(l.a)&&m.has(l.b)).forEach(l=>c.links.push({...l,id:uid(),a:m.get(l.a),b:m.get(l.b)}));if(made.length)selN=new Set(made)});
 q('front').onclick=()=>mut(()=>{ns.forEach(x=>{c.nodes=c.nodes.filter(y=>y!==x);c.nodes.push(x)})});
 if(q('txt'))q('txt').onclick=()=>editText(n.id);
 if(q('open'))q('open').onclick=()=>openItem(n);
 if(q('ren'))q('ren').onclick=async()=>{const it=refOf(n),t=await L.askText('Nuevo nombre',it.t);if(t&&t.trim()){pushUndo();it.t=t.trim();L.save();L.tree();render()}};
}
const swQ=cur=>PAL.map(k=>`<button class="sw" data-k="${k}" title="Color" style="background:${k}${k===cur?';outline:2px solid var(--tx)':''}"></button>`).join('');
function quick(){
 const c=CV();let html='',bx=null;
 if(selL){const l=c.links.find(x=>x.id===selL),a=l&&nodeById(l.a),b=l&&nodeById(l.b);if(!a||!b){Q.style.display='none';PP.style.display='none';return}
  const r=route(l,a,b,c.links);bx=[r.mid[0],r.mid[1],r.mid[0],r.mid[1]];
  html=swQ(l.c)+`<button data-q="lbl" title="Etiqueta">✎</button><button data-q="rt" title="Cambiar trazado (curva · recta · en ángulo)">⤳</button><button data-q="inv" title="Invertir sentido">⇄</button><button data-q="del" title="Eliminar">🗑</button><button data-q="more" title="Más opciones">⋯</button>`}
 else{const ns=[...selN].map(nodeById).filter(Boolean);if(!ns.length||(drag&&drag.m==='mv'&&drag.pushed)){Q.style.display='none';PP.style.display='none';return}
  bx=bbox(ns);const one=ns.length===1;
  html=swQ(one?ns[0].c:'')+(one?`<button data-q="edit" title="${ns[0].type==='item'?'Abrir en el editor':'Editar texto'}">✎</button>`:'')+`<button data-q="dup" title="Duplicar (Ctrl+D)">⧉</button><button data-q="lock" title="Bloquear / desbloquear">${ns.every(x=>x.lk)?'🔓':'🔒'}</button><button data-q="del" title="${ns.some(x=>x.type==='item')?'Quitar del lienzo':'Eliminar'}">🗑</button><button data-q="more" title="Más opciones: forma, relleno, borde, texto, alinear…">⋯</button>`}
 Q.innerHTML=html;Q.style.display='flex';Q._bx=bx;
 Q.querySelectorAll('.sw').forEach(b=>b.onclick=()=>mut(()=>{if(selL){const l=c.links.find(x=>x.id===selL);if(l)l.c=b.dataset.k}else[...selN].map(nodeById).forEach(x=>x&&(x.c=b.dataset.k))}));
 const P=s=>PP.querySelector(`[data-p=${s}]`),on=(k,f)=>{const b=Q.querySelector(`[data-q=${k}]`);if(b)b.onclick=f};
 on('del',()=>delSel());on('dup',()=>{const b=P('dup');b&&b.click()});on('lock',()=>{const b=P('lock');b&&b.click()});on('lbl',()=>{const b=P('lbl');b&&b.click()});on('inv',()=>{const b=P('inv');b&&b.click()});
 on('edit',()=>{const n=nodeById([...selN][0]);if(!n)return;if(n.type==='item')openItem(n);else editText(n.id)});
 on('rt',()=>{const s=P('rt');if(!s)return;const o=['curve','line','elbow'];s.value=o[(o.indexOf(s.value)+1)%3];s.dispatchEvent(new Event('change'))});
 on('more',()=>{moreOpen=!moreOpen;quickPos()});
 quickPos();
}
function quickPos(){
 if(!Q||Q.style.display!=='flex'){if(PP)PP.style.display='none';return}
 const c=CV(),bx=Q._bx;if(!bx)return;const r=V.getBoundingClientRect(),w=Q.offsetWidth,h=Q.offsetHeight;
 const x1=c.x+bx[0]*c.z,x2=c.x+bx[2]*c.z,y1=c.y+bx[1]*c.z,y2=c.y+bx[3]*c.z;
 let left=(x1+x2)/2-w/2,top=y1-h-12;if(top<8)top=y2+12;
 left=Math.max(8,Math.min(r.width-w-8,left));top=Math.max(8,Math.min(r.height-h-70,top));
 Q.style.left=left+'px';Q.style.top=top+'px';
 if(moreOpen){PP.style.display='flex';const pw=PP.offsetWidth,ph=PP.offsetHeight;PP.style.left=Math.max(8,Math.min(r.width-pw-8,left+w/2-pw/2))+'px';PP.style.top=Math.max(8,Math.min(r.height-ph-8,top+h+8))+'px'}else PP.style.display='none';
}
function afterLink(made){if(!afterAdd||!made.length)return;const ctx=afterAdd;afterAdd=null,c=CV(),A=nodeById(ctx.from);if(!A)return;
 made.forEach(id=>{const B=nodeById(id);if(!B)return;c.links.push({id:uid(),a:ctx.from,b:id,lbl:'',st:'solid',c:A.c||'#8f8f8f',sa:ctx.sa||autoSide(A,B.x+B.w/2,B.y+B.h/2),ta:autoSide(B,A.x+A.w/2,A.y+A.h/2)})})}
function dropMenu(cx,cy,ctx){const r=root.getBoundingClientRect();
 MN.innerHTML='<button data-m="card">＋ Tarjeta de texto</button><button data-m="proj">📄 Del proyecto…</button><button data-m="x" style="color:var(--mu)">Cancelar</button>';
 MN.style.display='flex';MN.style.left=Math.max(8,Math.min(r.width-230,cx-r.left))+'px';MN.style.top=Math.max(8,Math.min(r.height-130,cy-r.top))+'px';
 const hide=()=>{MN.style.display='none'};
 MN.querySelector('[data-m=x]').onclick=hide;
 MN.querySelector('[data-m=proj]').onclick=()=>{hide();afterAdd=ctx;openAdd()};
 MN.querySelector('[data-m=card]').onclick=()=>{hide();const c=CV(),from=nodeById(ctx.from);if(!from)return;
  const m={id:uid(),type:'note',x:sn(ctx.at[0]-80),y:sn(ctx.at[1]-30),w:170,h:90,tx:'',c:'#8f8f8f'};
  mut(()=>{c.nodes.push(m);c.links.push({id:uid(),a:ctx.from,b:m.id,lbl:'',st:'solid',c:from.c||'#8f8f8f',sa:ctx.sa||autoSide(from,m.x+m.w/2,m.y+m.h/2),ta:autoSide(m,from.x+from.w/2,from.y+from.h/2)})});selN=new Set([m.id]);render();editText(m.id)}}
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
function addLink(a,b,lbl,sa,ta){if(a===b)return;const c=CV();mut(()=>{const A=nodeById(a),B=nodeById(b),l={id:uid(),a,b,lbl:lbl||'',st:'solid',c:(A||{}).c||'#8f8f8f'};l.sa=sa||autoSide(A,B.x+B.w/2,B.y+B.h/2);l.ta=ta||autoSide(B,A.x+A.w/2,A.y+A.h/2);c.links.push(l);selL=l.id;selN.clear()});}
function nodeAt(wx,wy,skipId){const c=CV(),m=14/c.z,ns=c.nodes.filter(n=>n.id!==skipId);
 for(let i=ns.length-1;i>=0;i--){const n=ns[i];if(n.type!=='frame'&&wx>=n.x-m&&wx<=n.x+n.w+m&&wy>=n.y-m&&wy<=n.y+n.h+m)return n}
 for(let i=ns.length-1;i>=0;i--){const n=ns[i];if(n.type==='frame'&&wx>=n.x-m&&wx<=n.x+n.w+m&&wy>=n.y-m&&wy<=n.y+n.h+m&&!(wx>n.x+m&&wx<n.x+n.w-m&&wy>n.y+m&&wy<n.y+n.h-m))return n}return null}
function hover(e,skipId){
 document.querySelectorAll('#lienzo .cn.tgt').forEach(x=>{x.classList.remove('tgt');x.querySelectorAll('.an.nr').forEach(a=>a.classList.remove('nr'))});
 const[wx,wy]=toWorld(e),n=nodeAt(wx,wy,skipId);if(!n)return null;const nd=document.querySelector(`#lienzo [data-id="${n.id}"]`);if(!nd)return null;
 nd.classList.add('tgt');const na=nearAnchor(n,wx,wy,30/CV().z);
 nd.querySelectorAll('.an').forEach(a=>a.classList.toggle('nr',!!na&&a.dataset.s===na.s&&+a.dataset.t===na.t));return{id:nd.dataset.id,na}}

/* ---------- ratón ---------- */
let drag=null;
V.addEventListener('pointerdown',e=>{
 if(e.button===2)return;const c=CV();
 if(SP.style.display==='block'&&!e.target.closest('#cvs'))SP.style.display='none';
 MN.style.display='none';
 { const wl=e.target.closest('.wl'); if(wl&&(e.ctrlKey||e.metaKey)){const it=findItem(wl.textContent);if(it){L.setView('ed');L.select(it.id)}return} }
 if(e.target.closest('.ed'))return;
 const an=e.target.closest('.an'),eh=e.target.closest('.eh'),rz=e.target.closest('.rz'),nd=e.target.closest('.cn'),lb=e.target.closest('.cl'),lp=e.target.closest('.lp');
 const[wx,wy]=toWorld(e);
 if(an&&nd){e.preventDefault();pendingFrom={id:nd.dataset.id,sa:{s:an.dataset.s,t:+an.dataset.t},cur:[wx,wy]};drag={m:'link'};V.setPointerCapture(e.pointerId);return}
 if(eh){e.preventDefault();reDrag={id:selL,end:+eh.dataset.e,cur:[wx,wy]};drag={m:'re'};V.setPointerCapture(e.pointerId);return}
 if(rz&&nd){const n=nodeById(nd.dataset.id);if(n.lk)return;pushUndo();drag={m:'rz',n,ox:wx,oy:wy,w:n.w,h:n.h,moved:0};V.setPointerCapture(e.pointerId);return}
 if(nd){const id=nd.dataset.id,n=nodeById(id);
  if(linkMode){if(!pendingFrom){pendingFrom={id};selN=new Set([id]);render()}else{const a=pendingFrom.id;pendingFrom=null;addLink(a,id)}return}
  if(e.shiftKey){selN.has(id)?selN.delete(id):selN.add(id)}else if(!selN.has(id))selN=new Set([id]);
  selL=null;
  const mv=[...selN].map(nodeById).filter(o=>o&&!o.lk),extra=new Map();
  if(n.type==='frame'&&!n.lk){c.nodes.forEach(o=>{if(o!==n&&!o.lk&&!selN.has(o.id)&&o.x>=n.x&&o.y>=n.y&&o.x+o.w<=n.x+n.w&&o.y+o.h<=n.y+n.h)extra.set(o.id,o)})}
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
  if(drag.pushed){if(Q.style.display!=='none'){Q.style.display='none';PP.style.display='none'}drag.moved=1;drag.list.forEach(([o,x,y])=>{o.x=sn(x+dx);o.y=sn(y+dy);place(o)});drawLinks()}}
 else if(drag.m==='rz'){drag.moved=1;drag.n.w=Math.max(60,sn(drag.w+wx-drag.ox));drag.n.h=Math.max(30,sn(drag.h+wy-drag.oy));place(drag.n);drawLinks()}
 else if(drag.m==='link'){pendingFrom.cur=[wx,wy];hover(e,pendingFrom.id);drawLinks()}
 else if(drag.m==='re'){reDrag.cur=[wx,wy];const l=c.links.find(x=>x.id===reDrag.id);hover(e,l&&(reDrag.end===1?l.b:l.a));drawLinks()}
 else if(drag.m==='mq'){const r=V.getBoundingClientRect(),x=Math.min(e.clientX,drag.sx)-r.left,y=Math.min(e.clientY,drag.sy)-r.top;
  Object.assign(MQ.style,{display:'block',left:x+'px',top:y+'px',width:Math.abs(e.clientX-drag.sx)+'px',height:Math.abs(e.clientY-drag.sy)+'px'})}
});
function endDrag(e){
 if(!drag)return;const d=drag;drag=null;V.classList.remove('pan');MQ.style.display='none';const c=CV();
 const tgt=()=>{const[wx,wy]=toWorld(e);return nodeAt(wx,wy)};
 document.querySelectorAll('#lienzo .cn.tgt').forEach(x=>x.classList.remove('tgt'));
 if(d.m==='pan'){if(!d.moved){selN.clear();selL=null;render()}else L.save()}
 else if(d.m==='mv'){if(d.moved){L.save()}render()}
 else if(d.m==='rz'){L.save();render()}
 else if(d.m==='link'){const pf0=pendingFrom,n=(()=>{const[wx,wy]=toWorld(e);return nodeAt(wx,wy,pf0&&pf0.id)})(),pf=pendingFrom;pendingFrom=null;const a=pf&&pf.id;
  if(n&&a&&n.id!==a){const[wx,wy]=toWorld(e);addLink(a,n.id,'',pf.sa,nearAnchor(n,wx,wy,30/c.z)||undefined)}
  else if(a){const[wx,wy]=toWorld(e);render();dropMenu(e.clientX,e.clientY,{from:a,sa:pf.sa,at:[wx,wy]})}
  else render()}
 else if(d.m==='re'){const rd=reDrag;reDrag=null;const l=c.links.find(x=>x.id===rd.id),n=(()=>{const[wx,wy]=toWorld(e);return nodeAt(wx,wy,l&&(rd.end===1?l.b:l.a))})();
  if(l&&n&&n.id!==(rd.end===1?l.b:l.a)){const[wx,wy]=toWorld(e),na=nearAnchor(n,wx,wy,30/c.z);
   mut(()=>{if(rd.end===1){l.a=n.id;if(na)l.sa=na;else delete l.sa}else{l.b=n.id;if(na)l.ta=na;else delete l.ta}})}
  else render()}
 else if(d.m==='mq'){const r=V.getBoundingClientRect(),x1=Math.min(e.clientX,d.sx),x2=Math.max(e.clientX,d.sx),y1=Math.min(e.clientY,d.sy),y2=Math.max(e.clientY,d.sy);
  const a=[(x1-r.left-c.x)/c.z,(y1-r.top-c.y)/c.z],b=[(x2-r.left-c.x)/c.z,(y2-r.top-c.y)/c.z];
  selN=new Set(d.base);c.nodes.forEach(n=>{if(n.x<b[0]&&n.x+n.w>a[0]&&n.y<b[1]&&n.y+n.h>a[1])selN.add(n.id)});selL=null;render()}
}
V.addEventListener('pointerup',endDrag);V.addEventListener('pointercancel',endDrag);
V.addEventListener('dblclick',e=>{
 const nd=e.target.closest('.cn'),lb=e.target.closest('.cl'),lp=e.target.closest('.lp');
 if(e.target.closest('.an,.eh'))return;
 { const wl=e.target.closest('.wl'); if(wl){const it=findItem(wl.textContent);if(it){L.setView('ed');L.select(it.id)}return} }
 if(lb||lp){const g=(lb||lp.closest('[data-l]')),l=CV().links.find(x=>x.id===g.dataset.l);selL=l.id;render();
  L.askText('Etiqueta de la flecha',l.lbl||'').then(t=>{if(t!=null)mut(()=>l.lbl=t.trim())});return}
 if(nd){const n=nodeById(nd.dataset.id);if(n.type==='item')openItem(n);else if(!e.target.closest('.rz'))editText(n.id);return}
 const[wx,wy]=toWorld(e),n={id:uid(),type:'note',x:sn(wx-85),y:sn(wy-40),w:170,h:90,tx:'',c:'#8f8f8f'};
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
 else if(e.ctrlKey&&k==='d'&&selN.size){e.preventDefault();const b=document.querySelector('#cvp2 [data-p=dup]');if(b)b.click()}
 else if(k==='escape'){moreOpen=false;MN.style.display='none';linkMode=false;pendingFrom=null;reDrag=null;SP.style.display='none';V.classList.remove('lk');selN.clear();selL=null;toolbar();render()}
 else if(k==='f2'&&selN.size===1){const n=nodeById([...selN][0]);if(n&&n.type!=='item')editText(n.id)}
 else if(k.startsWith('arrow')&&selN.size){e.preventDefault();const s=e.shiftKey?30:6,dx=k==='arrowleft'?-s:k==='arrowright'?s:0,dy=k==='arrowup'?-s:k==='arrowdown'?s:0;
  selN.forEach(i=>{const n=nodeById(i);if(n&&!n.lk){n.x+=dx;n.y+=dy;place(n)}});drawLinks();L.save()}
});

/* ---------- exportar PNG ---------- */
function wrap(ctx,t,w,max){const out=[];String(t||'').split('\n').forEach(p=>{let line='';p.split(/\s+/).forEach(wd=>{const test=line?line+' '+wd:wd;if(ctx.measureText(test).width>w&&line){out.push(line);line=wd}else line=test});out.push(line)});return out.slice(0,max)}
function exportPNG(){
 const c=CV(),bb=bbox(c.nodes);if(!bb){alert('El lienzo está vacío.');return}
 const cs=getComputedStyle(document.documentElement),g=n=>cs.getPropertyValue(n).trim()||'#888',pad=60,gg=cfg();
 const W0=bb[2]-bb[0]+pad*2,H0=bb[3]-bb[1]+pad*2,sc=Math.min(2,7000/Math.max(W0,H0));
 const cn=document.createElement('canvas');cn.width=Math.round(W0*sc);cn.height=Math.round(H0*sc);const x=cn.getContext('2d');x.scale(sc,sc);x.translate(pad-bb[0],pad-bb[1]);
 x.fillStyle=getComputedStyle(document.body).backgroundColor;x.fillRect(bb[0]-pad,bb[1]-pad,W0,H0);
 const shp=n=>{const p=new Path2D(),s=shapeOf(n);if(s==='ellipse')p.ellipse(n.x+n.w/2,n.y+n.h/2,n.w/2,n.h/2,0,0,Math.PI*2);else p.roundRect(n.x,n.y,n.w,n.h,Math.min(radiusOf(n),n.h/2,n.w/2));return p};
 const hexA=(h,a)=>{const v=parseInt(h.slice(1),16);return`rgba(${v>>16},${v>>8&255},${v&255},${a})`};
 const font=(s,w)=>`${w||''} ${s}px Georgia,serif`,FS={s:11,m:14,l:19,x:26};
 c.nodes.filter(n=>n.type==='frame').forEach(n=>{const p=shp(n);x.fillStyle=n.fl==='none'?'transparent':hexA(n.c,.07);x.fill(p);if(n.bs!=='none'){x.setLineDash(n.bs==='solid'?[]:[8,6]);x.lineWidth=2;x.strokeStyle=n.c;x.stroke(p);x.setLineDash([])}x.font=font(FS[n.fs]||15,'600');x.fillStyle=n.c;x.textBaseline='top';x.fillText(n.tx||'',n.x+14,n.y+8)});
 const lines=[];
 c.links.forEach(l=>{const a=nodeById(l.a),b=nodeById(l.b);if(!a||!b)return;const r=route(l,a,b,c.links),col=l.c||'#8a4b2a',w=l.w||gg.lw,[h1,h2]=heads(l);
  x.strokeStyle=col;x.lineWidth=w;x.lineCap='round';x.lineJoin='round';x.setLineDash((DASH[l.st||'solid']||'').split(' ').filter(Boolean).map(Number));x.stroke(new Path2D(r.d));x.setLineDash([]);
  [[h2,r.p2,r.f2],[h1,r.p1,r.f1]].forEach(([t,p,f])=>{const hs=headShape(t,p,f,w);if(!hs)return;const hp=new Path2D(hs.d);x.lineWidth=Math.min(w,2.2);x.fillStyle=col;if(hs.fill)x.fill(hp);x.stroke(hp)});
  if(l.lbl)lines.push([l,r,col])});
 c.nodes.filter(n=>n.type!=='frame').forEach(n=>{const it=refOf(n);
  if(n.type==='tl'){x.fillStyle=n.c;x.fillRect(n.x,n.y+n.h/2-3,n.w,6);x.beginPath();x.moveTo(n.x+n.w+14,n.y+n.h/2);x.lineTo(n.x+n.w,n.y+n.h/2-11);x.lineTo(n.x+n.w,n.y+n.h/2+11);x.fill();x.font=font(14,'600');x.textBaseline='top';x.fillText(n.tx||'',n.x,n.y);return}
  const col=n.c||'#8a4b2a',p=shp(n),solid=n.fl==='solid',txc=solid?'#fff':g('--tx'),muc=solid?'#fff':g('--mu'),z=FS[n.fs]||14;
  if(n.fl==='none'){}else if(solid){x.fillStyle=col;x.fill(p)}else if(n.fl==='paper'){x.fillStyle=g('--pn');x.fill(p)}
  else{x.fillStyle=g('--pn');x.fill(p);x.fillStyle=hexA(col,.14);x.fill(p)}
  if(n.bs!=='none'){x.lineWidth=n.bs==='double'?4:2;x.setLineDash(n.bs==='dashed'||(!n.bs&&it&&it.k==='s')?[7,5]:n.bs==='dotted'?[2,5]:[]);x.strokeStyle=col;x.stroke(p);x.setLineDash([])}
  x.save();x.clip(p);x.textBaseline='top';const al=n.al||(n.type==='ev'?'c':'l'),tx=al==='c'?n.x+n.w/2:al==='r'?n.x+n.w-9:n.x+9;x.textAlign={l:'left',c:'center',r:'right'}[al];
  if(it){x.fillStyle=txc;x.font=font(z,'600');let y=n.y+8;wrap(x,(IC[it.k]||'')+' '+it.t,n.w-18,2).forEach(s=>{x.fillText(s,tx,y);y+=z*1.2});
   if(gg.detail!=='min'){if(gg.detail==='full'||n.h>60){x.font=`${Math.round(z*.86)}px system-ui,sans-serif`;x.fillStyle=muc;wrap(x,it.s||'',n.w-18,Math.max(1,Math.floor((n.y+n.h-y-20)/(z*1.1)))).forEach(s=>{x.fillText(s,tx,y);y+=z*1.1})}
    x.font='11px system-ui,sans-serif';x.fillStyle=muc;x.fillText(it.k==='d'||it.k==='s'?(it.st||'')+' · '+L.words(it.h)+' pal.':it.k==='c'?((it.m&&it.m.rol)||'Personaje'):((it.m&&it.m.tipo)||'Escenario'),tx,n.y+n.h-17)}}
  else{x.fillStyle=txc;x.font=n.type==='note'?`${z}px system-ui,sans-serif`:font(z,'600');const ls=wrap(x,n.tx,n.w-18,Math.max(1,Math.floor((n.h-12)/(z*1.3))));
   const y0=n.type==='ev'?n.y+n.h/2-ls.length*z*.65:n.y+8;ls.forEach((s,i)=>x.fillText(s,tx,y0+i*z*1.3))}
  x.restore();x.textAlign='left'});
 lines.forEach(([l,r,col])=>{x.font='12px system-ui,sans-serif';const w=x.measureText(l.lbl).width+16;x.beginPath();x.roundRect(r.mid[0]-w/2,r.mid[1]-10,w,20,10);x.fillStyle=g('--pn');x.fill();x.strokeStyle=col;x.lineWidth=1;x.stroke();x.fillStyle=g('--tx');x.textBaseline='middle';x.textAlign='center';x.fillText(l.lbl,r.mid[0],r.mid[1]+1);x.textAlign='left'});
 cn.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(L.S().title||'lienzo').toString().replace(/[\\/:*?"<>|]/g,'_')+'-lienzo.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)});
}

window.__LC={show(){toolbar();selN.clear();selL=null;render();if(!CV().nodes.length&&!CV().seen){CV().seen=1}},
 refresh(){if(root.style.display!=='none')render()},busy(){return !!(selN.size||selL||pendingFrom||linkMode||moreOpen||MN.style.display==='flex'||SP.style.display==='block'||document.querySelector('#lienzo .ed'))},dbg:{CV,route,anchorPt,nearAnchor,cfg,alignSel,get selN(){return selN},set selN(v){selN=v;selL=null},pickLink(id){selL=id;selN.clear();render()},render}};
})();
