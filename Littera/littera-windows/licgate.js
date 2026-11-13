/* Aviso de licencia (prueba / caducada / activar). Se carga en todas las pantallas. */
(function(){
const L=window.litteraLic;if(!L)return;
const st=document.createElement('style');
st.textContent=`#lgw{position:fixed;inset:0;background:#000a;display:none;align-items:center;justify-content:center;z-index:99999;font:14px system-ui,"Segoe UI",sans-serif}
#lgw .bx{background:#fbfaf7;color:#2b2a27;border-radius:12px;padding:24px 26px;width:min(520px,92vw);box-shadow:0 10px 40px #0007}
#lgw h2{margin:0 0 6px;font:600 22px Georgia,serif;color:#8a4b2a}#lgw p{margin:6px 0;line-height:1.45}
#lgw textarea{width:100%;height:84px;box-sizing:border-box;border:1px solid #ccc;border-radius:6px;padding:6px;font:12px monospace;margin-top:8px}
#lgw .r{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}#lgw .r .sp{flex:1}
#lgw button{border:1px solid #cfc8b8;background:#fff;border-radius:6px;padding:7px 14px;cursor:pointer;font:inherit;color:#2b2a27}
#lgw button.pri{background:#8a4b2a;border-color:#8a4b2a;color:#fff}#lgw .er{color:#b3261e;min-height:18px}
#lgb{position:fixed;right:12px;bottom:30px;background:#8a4b2a;color:#fff;border-radius:16px;padding:4px 12px;font:12px system-ui;cursor:pointer;z-index:9999;display:none}`;
document.head.appendChild(st);
const w=document.createElement('div');w.id='lgw';document.body.appendChild(w);
const b=document.createElement('div');b.id='lgb';document.body.appendChild(b);
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S=null;
async function refresh(){S=await L.status();
 if(S.state==='trial'){b.style.display='block';b.textContent='Prueba: quedan '+S.daysLeft+' día'+(S.daysLeft===1?'':'s')+' · Activar';b.onclick=()=>show()}
 else b.style.display='none';
 if(S.state==='expired')show();return S}
function show(){
 const exp=S.state==='expired',lic=S.state==='licensed',buy=S.product&&S.product.buyUrl;
 let h='<div class="bx"><h2>Littera</h2>';
 if(lic)h+=`<p><b>Licencia activa</b> (${esc(S.edition)})<br>Licenciada a: ${esc(S.name)} · ${esc(S.email)}${S.expires?'<br>Caduca: '+new Date(S.expires).toLocaleDateString('es-ES'):''}</p>`;
 else if(exp)h+=`<p><b>${S.tampered?'No se puede comprobar el periodo de prueba.':'La prueba gratuita ha terminado.'}</b> Para seguir usando Littera introduce tu clave de licencia. Tus proyectos están intactos en Documentos\\Littera.</p>`;
 else h+=`<p>Estás en el periodo de prueba: te quedan <b>${S.daysLeft}</b> día${S.daysLeft===1?'':'s'}. Si ya tienes una clave, actívala aquí.</p>`;
 if(!lic)h+='<textarea id="lgk" placeholder="Pega aquí tu clave (empieza por LITTERA-)"></textarea><div class="er" id="lge"></div>';
 h+='<div class="r">'+(lic?'<button id="lgd">Quitar licencia de este equipo</button>':'<button class="pri" id="lga">Activar</button>'+(buy?'<button id="lgbuy">Comprar licencia</button>':''))+'<span class="sp"></span>'+(exp?'':'<button id="lgc">Cerrar</button>')+'</div></div>';
 w.innerHTML=h;w.style.display='flex';
 const q=s=>w.querySelector(s);
 if(q('#lgc'))q('#lgc').onclick=()=>w.style.display='none';
 if(q('#lgbuy'))q('#lgbuy').onclick=()=>L.buy();
 if(q('#lgd'))q('#lgd').onclick=async()=>{S=await L.remove();show();refresh()};
 if(q('#lga'))q('#lga').onclick=async()=>{const r=await L.activate(q('#lgk').value);if(r.ok){S=r.status;show();refresh();setTimeout(()=>w.style.display='none',1800)}else q('#lge').textContent=r.error};
}
window.__showLicense=async()=>{await refresh();if(S.state!=='expired')show()};
if(L.onShow)L.onShow(()=>window.__showLicense());
refresh();
})();
