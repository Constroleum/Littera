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
['change','input'].forEach(ev=>document.addEventListener(ev,e=>{if(e.target.dataset&&e.target.dataset.k&&/^(size|mt|mb|mi|mo)$/.test(e.target.dataset.k))applyPaper()}));
let rzT;window.addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(applyPaper,120)});
const sv0=setView;setView=function(v){sv0(v);applyPaper()};

/* ===== Corrector ortográfico (castellano / català) ===== */
const WORD=/[\p{L}\p{M}]+(?:·[\p{L}\p{M}]+)*/gu;
const SP={cache:{es:new Map(),ca:new Map()},ign:new Set(),ver:0,timer:null};
const docLang=()=>cur().lg||B.lang||'es';
const spLangs=()=>{const l=docLang();return l==='all'?['es','ca']:[l]};
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
  items.push({t:`Sinónimos y antónimos de «${tk.w}»`,f:()=>openThes(tk.w,tk.range())});items.push({t:`Buscar «${tk.w}» en la RAE`,f:()=>plumaTools.dict('rae',tk.w)});items.push({t:`Buscar «${tk.w}» en el IEC`,f:()=>plumaTools.dict('iec',tk.w)});items.push('-');
 }else if(hasSel){
  const t=sel.toString().trim();if(t&&t.length<60&&!/\n/.test(t)){items.push({t:'Sinónimos y antónimos…',f:()=>openThes(t,sel.getRangeAt(0).cloneRange())});items.push({t:'Buscar en la RAE',f:()=>plumaTools.dict('rae',t)});items.push({t:'Buscar en el IEC',f:()=>plumaTools.dict('iec',t)});items.push('-')}
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
function showTp(tab){tpTab=tab;tp.hidden=false;renderTp()}
function matchCase(src,rep){
 if(src.length>1&&src===src.toUpperCase()&&src!==src.toLowerCase())return rep.toUpperCase();
 if(src[0]&&src[0]!==src[0].toLowerCase())return rep[0].toUpperCase()+rep.slice(1);
 return rep}
function openThes(word,range){
 if(!word){const s=getSelection();
  if(s.rangeCount&&page.contains(s.anchorNode)){const r=s.getRangeAt(0);
   if(!r.collapsed&&r.toString().trim().length<60){word=r.toString().trim();range=r.cloneRange()}
   else{const tk=tokenAt(r.startContainer,r.startOffset);if(tk){word=tk.w;range=tk.range()}}}}
 thTarget=range||null;thWord=word||'';tpTab='th';tp.hidden=false;renderTp();
}
async function renderTh(){
 tpb.innerHTML=`<div class="row"><input type="text" id="thq" placeholder="Escribe una palabra…" value="${esc(thWord)}"><button id="thg" class="on">Buscar</button></div>
 <div class="row"><select id="thl"><option value="auto">Idioma: según el documento</option><option value="es">Castellano</option><option value="ca">Català</option></select></div><div id="thr"></div>`;
 const q=$('#thq'),go=()=>{thWord=q.value.trim();lookup()};
 $('#thg').onclick=go;q.onkeydown=e=>{if(e.key==='Enter')go()};$('#thl').onchange=go;
 if(thWord)lookup();else $('#thr').innerHTML='<small>Selecciona una palabra del texto (o escríbela aquí) y pulsa Buscar. Atajo: Mayús+F7. Un clic en una palabra de los resultados la pone en tu texto.</small>';
 if(!thWord)q.focus();
}
async function lookup(){
 const box=$('#thr');if(!thWord){box.innerHTML='';return}
 const sel=$('#thl').value,dl=docLang(),order=sel==='auto'?(dl==='ca'?['ca']:dl==='all'?['es','ca']:['es']):[sel];
 let res=null,lang=null;
 for(const l of order){res=await plumaTools.thes(l,thWord);if(res){lang=l;break}}
 if(!res){box.innerHTML=`<small>No hay resultados para «${esc(thWord)}». Si es una forma conjugada o plural, prueba con el infinitivo o el singular.</small>`;return}
 const chip=(w,ant)=>`<button class="chip${ant?' ant':''}" data-w="${esc(w)}">${esc(w)}</button>`;
 let h=`<small>${lang==='ca'?'Català':'Castellano'}${res.base!==thWord.toLowerCase()?' · resultados para «'+esc(res.base)+'»':''}</small>`;
 if(res.groups.length){h+='<h4>Sinónimos</h4>';res.groups.forEach(g=>{h+=`<div>${g[0]?`<small>${esc(g[0])}</small>`:''}<div class="chips">${g[1].map(w=>chip(w)).join('')}</div></div>`})}
 h+='<h4>Antónimos</h4>'+(res.ants.length?`<div class="chips">${res.ants.map(w=>chip(w,1)).join('')}</div>`:'<small>No hay antónimos registrados para esta palabra.</small>');
 box.innerHTML=h;
 box.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{
  const w=b.dataset.w;
  if(!thTarget){navigator.clipboard&&navigator.clipboard.writeText(w);b.textContent='✓ copiada';return}
  const src=thTarget.toString()||thWord,txt=matchCase(src,w);
  page.focus();const s=getSelection();s.removeAllRanges();s.addRange(thTarget);document.execCommand('insertText',false,txt);
  const s2=getSelection();
  try{if(s2.anchorNode&&s2.anchorNode.nodeType===3&&s2.anchorOffset>=txt.length){const r=new Range();r.setStart(s2.anchorNode,s2.anchorOffset-txt.length);r.setEnd(s2.anchorNode,s2.anchorOffset);thTarget=r}else thTarget=null}catch(e){thTarget=null}
  thWord=txt;$('#thq').value=txt;stats();save();spellSoon(100)});
}
page.addEventListener('keydown',e=>{if(e.shiftKey&&e.key==='F7'){e.preventDefault();openThes()}});
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
