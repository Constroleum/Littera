/* Littera · temas de color (compartido por el editor y la pantalla de proyectos) */
(function(){
const v=(bg,pn,ln,tx,mu,ac,ah,paper,ink)=>({bg,pn,ln,tx,mu,ac,ah,paper,ink});
const T={
 claro:{n:'Marfil',g:'Claros',d:0,v:v('#ece9e2','#fbfaf7','#ddd8cc','#2b2a27','#807b6f','#8a4b2a','#f0e3d8','#ffffff','#222222')},
 'gris-perla':{n:'Gris perla',g:'Grises',d:0,v:v('#e6e7e9','#f4f5f6','#cfd1d4','#26282b','#6f7378','#4a5565','#dde0e5','#fbfbfc','#222426')},
 'gris-plata':{n:'Gris plata',g:'Grises',d:0,v:v('#d3d5d8','#e8e9eb','#b9bcc1','#212326','#5f646a','#3d5a80','#d9dce1','#f2f3f4','#1f2124')},
 'gris-pizarra':{n:'Gris pizarra',g:'Grises',d:1,v:v('#3b3f45','#474c53','#5c626a','#eceef0','#aab0b8','#9fbbdc','#565c64','#e9eaec','#23262a')},
 grafito:{n:'Grafito',g:'Grises',d:1,v:v('#1c1d1f','#2a2b2e','#3e4044','#e6e7e9','#9a9da3','#c3cad4','#38393d','#2d2e31','#e6e7e9')},
 sahara:{n:'Sahara',g:'Sahara',d:0,v:v('#e8d8b8','#f3e8cf','#d2bd92','#3b2d18','#8a7650','#b4531f','#ead7ae','#fbf3e0','#3a2d1a')},
 duna:{n:'Duna',g:'Sahara',d:0,v:v('#efe2c8','#f8efdc','#dccaa3','#43341e','#94805a','#a3612b','#f1e0bc','#fffaf0','#3f3320')},
 terracota:{n:'Terracota',g:'Sahara',d:0,v:v('#e9d3bd','#f5e5d4','#d3b79c','#40281a','#8d6a52','#9c3f1d','#eed5b9','#fcf1e4','#3b2518')},
 oasis:{n:'Oasis',g:'Sahara',d:0,v:v('#e6dcc0','#f2ead2','#cdbf95','#38341e','#7d7650','#4f6b3a','#e3dcb6','#faf5e2','#35311c')},
 atardecer:{n:'Atardecer sahariano',g:'Sahara',d:1,v:v('#2a1f14','#38291a','#53402a','#f1e4c9','#b9a37c','#e0a050','#4a3721','#3a2c1c','#f1e4c9')},
 oscuro:{n:'Oscuro',g:'Oscuros',d:1,v:v('#171614','#22201e','#38352f','#e8e4da','#9a9588','#e0a67c','#3a2e25','#2a2825','#e8e4da')},
 indigo:{n:'Índigo Littera',g:'Oscuros',d:1,v:v('#080d38','#0e1546','#232d75','#f4ead6','#a9a7c8','#e3c58e','#1a246a','#fbf4e6','#1d1a2e')}
};
const KEY='littera-theme',root=document.documentElement;
const cur=()=>{try{return localStorage.getItem(KEY)||'auto'}catch(e){return'auto'}};
function apply(id){const t=T[id];
 ['bg','pn','ln','tx','mu','ac','ah','paper','ink'].forEach(k=>t?root.style.setProperty('--'+k,t.v[k]):root.style.removeProperty('--'+k));
 if(t){root.dataset.theme=t.d?'dark':'light';root.style.colorScheme=t.d?'dark':'light'}else{root.removeAttribute('data-theme');root.style.colorScheme=''}
 try{localStorage.setItem(KEY,t?id:'auto')}catch(e){}}
function list(){const g={};Object.entries(T).forEach(([id,t])=>(g[t.g]=g[t.g]||[]).push({id,n:t.n}));
 return[{g:'Automático',items:[{id:'auto',n:'Según Windows (claro/oscuro)'}]},...Object.entries(g).map(([k,items])=>({g:k,items}))]}
window.LitteraTheme={list,apply,current:cur};
apply(cur());
})();
