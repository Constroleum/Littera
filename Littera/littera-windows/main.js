const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const lic = require('./license');

const EXT = '.littera';
const EXTS = ['.littera', '.pluma'];   // .pluma = proyectos de la versión anterior (Pluma)
const isProj = f => EXTS.some(e => f.toLowerCase().endsWith(e));
let win = null;
let current = null;          // { path, data }
let backedUp = new Set();    // rutas con copia .bak ya hecha en esta sesión
let closing = false;

/* ---------- rutas y utilidades ---------- */
const projectsDir = () => {
  const d = path.join(app.getPath('documents'), 'Littera');
  fs.mkdirSync(d, { recursive: true });
  return d;
};
const recentFile = () => path.join(app.getPath('userData'), 'recent.json');
const readRecent = () => { try { return JSON.parse(fs.readFileSync(recentFile(), 'utf8')).filter(p => fs.existsSync(p)); } catch (e) { return []; } };
const addRecent = p => {
  const r = [p, ...readRecent().filter(x => x.toLowerCase() !== p.toLowerCase())].slice(0, 15);
  try { fs.writeFileSync(recentFile(), JSON.stringify(r)); } catch (e) {}
  buildMenu();
};
const cleanName = n => (String(n || '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/[. ]+$/, '').trim() || 'Proyecto sin título').slice(0, 80);
const uniquePath = (dir, name, ext = EXT) => {
  let p = path.join(dir, name + ext), i = 2;
  while (fs.existsSync(p)) p = path.join(dir, `${name} (${i++})${ext}`);
  return p;
};
const baseName = p => path.basename(p, path.extname(p));
/* Migración única desde Pluma: copia (sin borrar) los proyectos y el diccionario personal */
function migrateFromPluma() {
  try {
    const docs = app.getPath('documents'), oldD = path.join(docs, 'Pluma'), newD = path.join(docs, 'Littera');
    if (fs.existsSync(oldD) && !fs.existsSync(newD)) {
      fs.mkdirSync(newD, { recursive: true });
      for (const f of fs.readdirSync(oldD)) { const s = path.join(oldD, f); if (fs.statSync(s).isFile()) fs.copyFileSync(s, path.join(newD, f)); }
    }
    const oldU = path.join(app.getPath('appData'), 'Pluma'), f = 'personal-dict.json', dst = path.join(app.getPath('userData'), f);
    if (fs.existsSync(path.join(oldU, f)) && !fs.existsSync(dst)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(path.join(oldU, f), dst); }
  } catch (e) {}
}
const stripWords = h => { const t = String(h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim(); return t ? t.split(/\s+/).length : 0; };

function starter() {
  return {
    sel: 'c', target: 0, items: [
      { id: 'a', t: 'Manuscrito', k: 'f', p: null, h: '', s: '', n: '', st: 'Borrador', o: 1 },
      { id: 'b', t: 'Capítulo 1', k: 'f', p: 'a', h: '', s: '', n: '', st: 'Borrador', o: 1 },
      { id: 'c', t: 'Escena 1', k: 'd', p: 'b', h: '<h1>Escena 1</h1><p>Empieza a escribir aquí. Usa la barra superior como en Word, y el clasificador de la izquierda para organizar tu obra.</p>', s: 'Primera escena.', n: '', st: 'Borrador' },
      { id: 'r', t: 'Investigación', k: 'f', p: null, h: '', s: '', n: '', st: 'Pendiente', o: 0 }]
  };
}

function writeAtomic(p, data) {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  if (!backedUp.has(p) && fs.existsSync(p)) {
    try { fs.copyFileSync(p, p + '.bak'); } catch (e) {}
    backedUp.add(p);
  }
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, json, 'utf8');
  fs.renameSync(tmp, p);
}

function readProject(p) {
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!d || !Array.isArray(d.items) || !d.items.length) throw new Error('Archivo no válido');
  return d;
}

/* ---------- navegación ---------- */
async function flush() {
  if (!win || win.isDestroyed() || !current) return;
  try {
    await Promise.race([
      win.webContents.executeJavaScript('window.__plumaFlush ? window.__plumaFlush() : null'),
      new Promise(r => setTimeout(r, 3000))
    ]);
  } catch (e) {}
}
function setTitle() { if (win && !win.isDestroyed()) win.setTitle(current ? `${baseName(current.path)} — Littera` : 'Littera'); }

async function showManager(newProject) {
  await flush();
  current = null;
  setTitle();
  win.loadFile('projects.html', newProject ? { query: { nuevo: '1' } } : undefined);
  buildMenu();
}
async function openPath(p) {
  if (lic.locked()) { if (win) win.loadFile('projects.html'); return { ok: false, error: 'La prueba ha terminado. Activa Littera con tu clave de licencia.' }; }
  try {
    await flush();
    const data = readProject(p);
    current = { path: p, data };
    addRecent(p);
    setTitle();
    win.loadFile('index.html');
    return { ok: true };
  } catch (e) {
    dialog.showErrorBox('No se pudo abrir el proyecto', `${p}\n\n${e.message}`);
    return { ok: false, error: e.message };
  }
}
async function openDialog() {
  const r = await dialog.showOpenDialog(win, {
    title: 'Abrir proyecto', defaultPath: projectsDir(),
    filters: [{ name: 'Proyectos de Littera', extensions: ['littera', 'pluma', 'json'] }], properties: ['openFile']
  });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  let p = r.filePaths[0];
  if (p.toLowerCase().endsWith('.json')) {          // copia de seguridad antigua: se importa como proyecto
    try {
      const d = readProject(p);
      const np = uniquePath(projectsDir(), cleanName(path.basename(p, '.json')));
      writeAtomic(np, d);
      p = np;
    } catch (e) { dialog.showErrorBox('Archivo no válido', e.message); return { ok: false }; }
  }
  return openPath(p);
}
async function saveAs() {
  if (!current) return;
  await flush();
  const r = await dialog.showSaveDialog(win, {
    title: 'Guardar proyecto como', defaultPath: path.join(path.dirname(current.path), baseName(current.path) + EXT),
    filters: [{ name: 'Proyectos de Littera', extensions: ['littera'] }]
  });
  if (r.canceled || !r.filePath) return;
  let np = r.filePath; if (!isProj(np)) np += EXT;
  try { writeAtomic(np, current.data); current.path = np; addRecent(np); setTitle(); }
  catch (e) { dialog.showErrorBox('No se pudo guardar', e.message); }
}

/* ---------- diccionarios en línea (RAE / IEC) ---------- */
const DICTS = {
  rae: w => w ? 'https://dle.rae.es/' + encodeURIComponent(w) : 'https://dle.rae.es/',
  iec: w => w ? 'https://dlc.iec.cat/Results?DecEntradaText=' + encodeURIComponent(w) : 'https://dlc.iec.cat/',
  mw: w => w ? 'https://www.merriam-webster.com/dictionary/' + encodeURIComponent(w) : 'https://www.merriam-webster.com/',
  mwt: w => w ? 'https://www.merriam-webster.com/thesaurus/' + encodeURIComponent(w) : 'https://www.merriam-webster.com/thesaurus',
  larousse: w => w ? 'https://www.larousse.fr/dictionnaires/francais/' + encodeURIComponent(w) : 'https://www.larousse.fr/dictionnaires/francais/',
  cnrtl: w => w ? 'https://www.cnrtl.fr/synonymie/' + encodeURIComponent(w) : 'https://www.cnrtl.fr/synonymie/',
  jane: w => w ? 'https://sinonims.iec.cat/sinonims_cerca_sin.asp?pclau2=' + encodeURIComponent(w) : 'https://sinonims.iec.cat/'
};
/* El Diccionari de sinònims (Albert Jané, IEC) se abre en una ventana propia de Littera, solo con páginas del IEC */
let janeWin = null;
function openJane(url) {
  if (janeWin && !janeWin.isDestroyed()) { janeWin.loadURL(url); janeWin.show(); janeWin.focus(); return; }
  janeWin = new BrowserWindow({
    width: 900, height: 780, parent: win || undefined, title: 'Diccionari de sinònims — Albert Jané (IEC)', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, partition: 'persist:jane' }
  });
  janeWin.setMenu(null);
  const ok = u => { try { return /(^|\.)iec\.cat$/.test(new URL(u).hostname); } catch (e) { return false; } };
  janeWin.webContents.setWindowOpenHandler(({ url: u }) => { if (ok(u)) janeWin.loadURL(u); else shell.openExternal(u); return { action: 'deny' }; });
  janeWin.webContents.on('will-navigate', (e, u) => { if (!ok(u)) { e.preventDefault(); shell.openExternal(u); } });
  janeWin.webContents.on('did-fail-load', (e, code, desc, u, main) => {
    if (main && code !== -3) janeWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<body style="font:16px system-ui;padding:40px;color:#444"><h2>Sin conexión</h2><p>El diccionario de Albert Jané necesita internet. Conéctate y vuelve a intentarlo.</p></body>'));
  });
  janeWin.on('closed', () => { janeWin = null; });
  janeWin.loadURL(url);
}
function openDict(which, word) {
  const w = String(word || '').trim().split(/\s+/)[0].replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
  if (which === 'jane') openJane(DICTS.jane(w)); else shell.openExternal(DICTS[which](w));
}
async function openDictFromSelection(which) {
  let w = '';
  try { if (win && current) w = await win.webContents.executeJavaScript('String(getSelection()).slice(0,80)'); } catch (e) {}
  openDict(which, w);
}

/* ---------- menú ---------- */
function buildMenu() {
  const recent = readRecent().map(p => ({ label: baseName(p), sublabel: p, click: () => openPath(p) }));
  const inProject = !!current;
  const tpl = [
    {
      label: '&Archivo', submenu: [
        { label: 'Nuevo proyecto…', accelerator: 'CmdOrCtrl+N', click: () => showManager(true) },
        { label: 'Abrir proyecto…', accelerator: 'CmdOrCtrl+O', click: () => openDialog() },
        { label: 'Proyectos recientes', submenu: recent.length ? recent : [{ label: '(ninguno)', enabled: false }] },
        { label: 'Todos los proyectos', accelerator: 'CmdOrCtrl+Shift+P', click: () => showManager(false) },
        { type: 'separator' },
        { label: 'Guardar', accelerator: 'CmdOrCtrl+S', enabled: inProject, click: async () => { if (win) await win.webContents.executeJavaScript('window.__plumaForce && window.__plumaForce()').catch(() => {}); } },
        { label: 'Guardar como…', accelerator: 'CmdOrCtrl+Shift+S', enabled: inProject, click: () => saveAs() },
        { label: 'Mostrar en el Explorador', enabled: inProject, click: () => shell.showItemInFolder(current.path) },
        { type: 'separator' },
        { label: 'Salir', accelerator: 'Alt+F4', role: 'quit' }
      ]
    },
    {
      label: '&Edición', submenu: [
        { role: 'undo', label: 'Deshacer' }, { role: 'redo', label: 'Rehacer' }, { type: 'separator' },
        { role: 'cut', label: 'Cortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' }
      ]
    },
    {
      label: '&Ver', submenu: [
        { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' }, { role: 'resetZoom', label: 'Tamaño normal' },
        { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' },
        { label: 'Modo concentración (sin distracciones)', accelerator: 'CmdOrCtrl+Shift+F', registerAccelerator: false, enabled: inProject, click: () => { if (win) win.webContents.executeJavaScript('window.__focusToggle&&window.__focusToggle()', true); } },
        ...(app.isPackaged ? [] : [{ type: 'separator' }, { role: 'toggleDevTools', label: 'Herramientas de desarrollo' }])
      ]
    },
    {
      label: '&Diccionarios', submenu: [
        { label: 'Sinónimos y antónimos (incluidos, sin conexión)', accelerator: 'F7', registerAccelerator: false, click: () => { if (win) win.webContents.executeJavaScript('document.dispatchEvent(new KeyboardEvent("keydown",{key:"F7"}))', true); } },
        { label: 'Diccionario del idioma del documento', accelerator: 'F8', registerAccelerator: false, click: () => { if (win) win.webContents.executeJavaScript('document.dispatchEvent(new KeyboardEvent("keydown",{key:"F8"}))', true); } },
        { label: 'Sinónimos en línea del idioma del documento', accelerator: 'Shift+F8', registerAccelerator: false, click: () => { if (win) win.webContents.executeJavaScript('document.dispatchEvent(new KeyboardEvent("keydown",{key:"F8",shiftKey:true}))', true); } },
        { type: 'separator' },
        { label: 'Diccionario de la lengua española (RAE)', accelerator: 'Alt+1', registerAccelerator: false, click: () => openDictFromSelection('rae') },
        { label: "Diccionari de la llengua catalana (IEC)", accelerator: 'Alt+2', registerAccelerator: false, click: () => openDictFromSelection('iec') },
        { label: "Diccionari de sinònims d'Albert Jané (IEC) — necesita internet", accelerator: 'Alt+3', registerAccelerator: false, click: () => openDictFromSelection('jane') },
        { type: 'separator' },
        { label: 'Merriam-Webster (inglés) — necesita internet', accelerator: 'Alt+4', registerAccelerator: false, click: () => openDictFromSelection('mw') },
        { label: 'Merriam-Webster Thesaurus (sinónimos en inglés)', accelerator: 'Alt+5', registerAccelerator: false, click: () => openDictFromSelection('mwt') },
        { label: 'Larousse (francés) — necesita internet', accelerator: 'Alt+6', registerAccelerator: false, click: () => openDictFromSelection('larousse') },
        { label: 'CNRTL — sinónimos en francés', accelerator: 'Alt+7', registerAccelerator: false, click: () => openDictFromSelection('cnrtl') },
        { type: 'separator' },
        { label: 'Si hay texto seleccionado, se busca esa palabra', enabled: false }
      ]
    },
    {
      label: 'A&yuda', submenu: [
        { label: 'Licencia…', click: () => { if (win) win.webContents.send('lic:show'); } },
        { label: 'Abrir carpeta de proyectos', click: () => shell.openPath(projectsDir()) },
        { label: 'Atajos de teclado', click: () => dialog.showMessageBox(win, { type: 'info', title: 'Atajos de teclado', message: 'Atajos de teclado', detail: [
          'Modo concentración (pantalla completa): Ctrl+Mayús+F  ·  salir: Esc',
          'Pantalla completa de la ventana: F11',
          'Sinónimos y antónimos (sin conexión): F7',
          'Diccionario del idioma del documento: F8',
          'Sinónimos en línea del idioma del documento: Mayús+F8',
          'RAE: Alt+1  ·  IEC: Alt+2  ·  Albert Jané: Alt+3',
          'Merriam-Webster: Alt+4  ·  M-W Thesaurus: Alt+5',
          'Larousse: Alt+6  ·  CNRTL (sinónimos): Alt+7',
          '(Los diccionarios usan la palabra seleccionada o la del cursor.)',
          'Guardar: Ctrl+S  ·  Nuevo proyecto: Ctrl+N  ·  Abrir: Ctrl+O'].join('\n') }) },
        { label: 'Acerca de Littera', click: () => dialog.showMessageBox(win, { type: 'info', title: 'Littera', message: 'Littera ' + app.getVersion(), detail: 'Escritura de libros por proyectos.\nLos proyectos se guardan como archivos .littera en Documentos\\Littera (los .pluma antiguos también se abren).\n\nCorrector: Hunspell con RLA-ES (castellano) y Softcatalà (català).\nSinónimos: OpenThesaurus ES (LGPL 2.1) y Diccionari de sinònims de Softcatalà (CC BY 4.0).\nFuentes: Fontsource / SIL Open Font License.' }) }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

/* ---------- ventana ---------- */
function create(initialFile) {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 560, title: 'Littera', backgroundColor: '#ece9e2',
    icon: path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: { contextIsolation: true, spellcheck: false, preload: path.join(__dirname, 'preload.js') }
  });
  const ses = win.webContents.session;
  ses.setSpellCheckerLanguages([]);   // el corrector es propio (Hunspell incluido), no el de Chromium
  win.webContents.on('page-title-updated', e => e.preventDefault());
  win.webContents.on('did-finish-load', setTitle);
  win.on('close', async e => {
    if (closing || !current) return;
    e.preventDefault(); closing = true;
    await flush();
    win.close();
  });
  win.on('closed', () => { win = null; closing = false; });
  win.webContents.on('context-menu', (e, p) => {
    if (p.formControlType !== 'text-input' && p.formControlType !== 'text-area') return;
    const m = new Menu();
    m.append(new MenuItem({ role: 'cut', label: 'Cortar' }));
    m.append(new MenuItem({ role: 'copy', label: 'Copiar' }));
    m.append(new MenuItem({ role: 'paste', label: 'Pegar' }));
    m.append(new MenuItem({ role: 'selectAll', label: 'Seleccionar todo' }));
    m.popup();
  });
  buildMenu();
  if (initialFile) { openPath(initialFile).then(r => { if (!r.ok) win.loadFile('projects.html'); }); }
  else win.loadFile('projects.html');
}

/* ---------- corrector (Hunspell sin conexión), tesauro y gramática ---------- */
const { loadModule } = require('hunspell-asm');
const DICT = f => path.join(__dirname, 'dict', f);
let hs = null;
const spellers = {};
const personalFile = () => path.join(app.getPath('userData'), 'personal-dict.json');
let personal = new Set();
try { personal = new Set(JSON.parse(fs.readFileSync(personalFile(), 'utf8'))); } catch (e) {}
const personalOk = w => personal.has(w.toLowerCase());

const LANGS = ['es', 'ca', 'en', 'fr'];
const DICTFILES = { es: ['es_ES'], ca: ['ca'], en: ['en_US', 'en_GB'], fr: ['fr'] };   // inglés: se aceptan ortografía americana y británica
function getSpeller(lang) {
  const l = LANGS.includes(lang) ? lang : 'es';
  if (!spellers[l]) spellers[l] = (async () => {
    if (!hs) hs = await loadModule();
    const list = DICTFILES[l].map(base => {
      const aff = hs.mountBuffer(fs.readFileSync(DICT(base + '.aff')), base + '.aff');
      const dic = hs.mountBuffer(fs.readFileSync(DICT(base + '.dic')), base + '.dic');
      return hs.create(aff, dic);
    });
    return { spell: w => list.some(s => s.spell(w)), suggest: w => list[0].suggest(w) };
  })();
  return spellers[l];
}
ipcMain.handle('spell:check', async (e, lang, words) => {
  const sp = await getSpeller(lang);
  return words.map(w => personalOk(w) || sp.spell(w));
});
ipcMain.handle('spell:suggest', async (e, lang, word) => {
  const langs = lang === 'all' ? LANGS : [lang];
  const lists = [];
  for (const l of langs) { try { lists.push((await getSpeller(l)).suggest(word).slice(0, 6)); } catch (x) { lists.push([]); } }
  const out = [];
  for (let i = 0; i < 6; i++) lists.forEach(l => { if (l[i] && !out.includes(l[i])) out.push(l[i]); });
  return out.slice(0, 6);
});
ipcMain.handle('spell:add', async (e, word) => {
  personal.add(word.toLowerCase());
  try { fs.writeFileSync(personalFile(), JSON.stringify([...personal])); } catch (x) {}
  return true;
});

/* Tesauro: sinónimos y antónimos */
const thes = {};
const getThes = l => {
  const k = LANGS.includes(l) ? l : 'es';
  if (!thes[k]) { try { thes[k] = JSON.parse(fs.readFileSync(DICT(`thes_${k}.json`), 'utf8')); } catch (e) { thes[k] = { e: {}, x: {} }; } }
  return thes[k];
};
const ES_RULES = [['mente', ''], ['ces', 'z'], ['es', ''], ['s', ''], ['a', 'o'], ['ando', 'ar'], ['iendo', 'er'], ['iendo', 'ir'], ['yendo', 'er'], ['yendo', 'ir'], ['ado', 'ar'], ['ada', 'ar'], ['ido', 'er'], ['ido', 'ir'], ['ida', 'er'], ['ida', 'ir'], ['aba', 'ar'], ['aban', 'ar'], ['ábamos', 'ar'], ['aron', 'ar'], ['ó', 'ar'], ['ió', 'er'], ['ió', 'ir'], ['ieron', 'er'], ['ieron', 'ir'], ['é', 'ar'], ['aste', 'ar'], ['amos', 'ar'], ['an', 'ar'], ['as', 'ar'], ['a', 'ar'], ['o', 'ar'], ['e', 'ar'], ['en', 'ar'], ['emos', 'er'], ['imos', 'ir'], ['es', 'er'], ['es', 'ir'], ['e', 'er'], ['e', 'ir'], ['o', 'er'], ['o', 'ir'], ['ía', 'er'], ['ía', 'ir'], ['ían', 'er'], ['ían', 'ir'], ['ará', 'ar'], ['erá', 'er'], ['irá', 'ir'], ['aría', 'ar'], ['ería', 'er'], ['iría', 'ir']];
const CA_RULES = [['ment', ''], ['es', 'a'], ['s', ''], ['ns', 'n'], ['a', ''], ['a', 'e'], ['ant', 'ar'], ['ent', 're'], ['ent', 'er'], ['int', 'ir'], ['at', 'ar'], ['ada', 'ar'], ['ats', 'ar'], ['ades', 'ar'], ['it', 'ir'], ['ida', 'ir'], ['ut', 're'], ['ava', 'ar'], ['aves', 'ar'], ['aven', 'ar'], ['àvem', 'ar'], ['aren', 'ar'], ['à', 'ar'], ['o', 'ar'], ['a', 'ar'], ['es', 'ar'], ['e', 'ar'], ['en', 'ar'], ['em', 'ar'], ['eu', 'ar'], ['en', 're'], ['en', 'er'], ['ia', 're'], ['ia', 'er'], ['ia', 'ir'], ['ien', 're'], ['ien', 'er'], ['ien', 'ir'], ['eix', 'ir'], ['eixen', 'ir'], ['ix', 'ir']];
const EN_RULES = [['ies', 'y'], ['es', ''], ['s', ''], ['ed', ''], ['ed', 'e'], ['ied', 'y'], ['ing', ''], ['ing', 'e'], ['ying', 'ie'], ['ly', ''], ['ily', 'y'], ['er', ''], ['er', 'e'], ['ier', 'y'], ['est', ''], ['est', 'e'], ['iest', 'y'], ['ness', ''], ['ves', 'f'], ['ves', 'fe'], ["'s", ''], ['ment', '']];
const FR_RULES = [['s', ''], ['x', ''], ['aux', 'al'], ['eaux', 'eau'], ['e', ''], ['es', ''], ['ée', 'er'], ['é', 'er'], ['ée', 'é'], ['és', 'er'], ['ées', 'er'], ['ant', 'er'], ['ante', 'ant'], ['ent', 'er'], ['ons', 'er'], ['ez', 'er'], ['ais', 'er'], ['ait', 'er'], ['aient', 'er'], ['era', 'er'], ['erai', 'er'], ['ra', 'r'], ['is', 'ir'], ['it', 'ir'], ['ie', 'ir'], ['ement', ''], ['ment', ''], ['euse', 'eur'], ['rice', 'teur'], ['trice', 'teur'], ['ive', 'if'], ['ère', 'er'], ['elle', 'el'], ['enne', 'en'], ['onne', 'on'], ['ette', 'et'], ['ale', 'al'], ['ue', 'u'], ['ues', 'u'], ['ite', 'it'], ['ente', 'ent']];
const RULES = { es: ES_RULES, ca: CA_RULES, en: EN_RULES, fr: FR_RULES };
function stems(w, lang) {
  const out = [w], R = RULES[lang] || ES_RULES;
  const add = x => { if (x && x.length > 1 && !out.includes(x)) out.push(x); if (lang === 'en' && x && /([b-df-hj-np-tv-z])\1$/.test(x)) { const y = x.slice(0, -1); if (y.length > 1 && !out.includes(y)) out.push(y); } };
  for (let pass = 0; pass < 2; pass++) for (const b of [...out]) for (const [suf, r] of R) if (b.endsWith(suf) && b.length - suf.length >= 2) add(b.slice(0, -suf.length) + r);
  return out;
}
ipcMain.handle('thes:lookup', (e, lang, word) => {
  let w = String(word || '').toLowerCase().normalize('NFC').trim();
  if (lang === 'fr' || lang === 'ca') w = w.replace(/^(?:[ldjmtnsc]|qu|jusqu|lorsqu|puisqu)['’]/, '');
  const T = getThes(lang);
  if (!w) return null;
  for (const c of stems(w, lang)) {
    const groups = T.e[c], x = T.x[c];
    if (!groups && !x) continue;
    const syn = [], ants = new Set(x ? x.split('|') : []);
    (groups || []).forEach(g => {
      if (g[1]) syn.push([g[0], g[1].split('|')]);
      if (g[2]) g[2].split('|').forEach(a => ants.add(a));
    });
    return { base: c, groups: syn, ants: [...ants] };
  }
  return null;
});

/* Revisión gramatical opcional (LanguageTool, necesita internet) */
ipcMain.handle('grammar:check', async (e, lang, text) => {
  try {
    const body = new URLSearchParams({
      text, language: { ca: 'ca', es: 'es', en: 'en-US', fr: 'fr' }[lang] || 'auto',
      disabledRules: 'MORFOLOGIK_RULE_ES,MORFOLOGIK_RULE_CA_ES,MORFOLOGIK_RULE_EN_US,MORFOLOGIK_RULE_EN_GB,HUNSPELL_RULE,HUNSPELL_NO_SUGGEST_RULE,FR_SPELLING_RULE'
    });
    if (!['ca', 'es', 'en', 'fr'].includes(lang)) body.set('preferredVariants', 'es-ES,ca-ES,en-US,fr');
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 25000);
    const r = await fetch('https://api.languagetool.org/v2/check', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body, signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return { ok: false, error: `El servidor respondió ${r.status}` + (r.status === 429 ? ' (demasiadas peticiones; espera un minuto)' : '') };
    const j = await r.json();
    return { ok: true, matches: (j.matches || []).map(m => ({ o: m.offset, l: m.length, msg: m.message, rep: (m.replacements || []).slice(0, 5).map(x => x.value), rule: m.rule && m.rule.id })) };
  } catch (x) { return { ok: false, error: x.name === 'AbortError' ? 'Tiempo de espera agotado' : 'No se pudo conectar (¿hay internet?)' }; }
});

/* Cortar / copiar / pegar desde el menú propio del editor */
ipcMain.handle('dict:open', (e, which, word) => { if (DICTS[which]) openDict(which, word); });
ipcMain.handle('ctx:edit', (e, a) => { if (win && ['cut', 'copy', 'paste', 'selectAll'].includes(a)) win.webContents[a](); });

/* ---------- IPC ---------- */

ipcMain.on('proj:data', e => { e.returnValue = current ? current.data : null; });
ipcMain.on('proj:name', e => { e.returnValue = current ? baseName(current.path) : ''; });
ipcMain.on('proj:saveSync', (e, data) => {
  try { if (current) { current.data = data; writeAtomic(current.path, data); } e.returnValue = true; } catch (x) { e.returnValue = false; }
});
ipcMain.handle('proj:save', (e, data) => {
  if (!current) return { ok: false, error: 'Sin proyecto abierto' };
  try { current.data = data; writeAtomic(current.path, data); return { ok: true }; }
  catch (x) { return { ok: false, error: x.message }; }
});
ipcMain.handle('proj:list', () => {
  const seen = new Set(), out = [];
  const add = p => {
    const k = p.toLowerCase(); if (seen.has(k) || !fs.existsSync(p)) return; seen.add(k);
    try {
      const st = fs.statSync(p), d = JSON.parse(fs.readFileSync(p, 'utf8'));
      const words = (d.items || []).filter(i => i.k === 'd' || i.k === 's').reduce((a, i) => a + stripWords(i.h), 0);
      out.push({ path: p, name: baseName(p), title: (d.bk && d.bk.tit) || '', author: (d.bk && d.bk.aut) || '', mtime: st.mtimeMs, words, dir: path.dirname(p) });
    } catch (x) { /* archivo ilegible: se omite */ }
  };
  try { fs.readdirSync(projectsDir()).filter(isProj).forEach(f => add(path.join(projectsDir(), f))); } catch (x) {}
  readRecent().forEach(add);
  return out.sort((a, b) => b.mtime - a.mtime);
});
ipcMain.handle('proj:create', (e, name) => {
  if (lic.locked()) return LOCKED;
  const n = cleanName(name), p = uniquePath(projectsDir(), n);
  const d = starter(); d.bk = { tit: n };
  writeAtomic(p, d);
  return openPath(p);
});
ipcMain.handle('lic:status', () => lic.status());
ipcMain.handle('lic:activate', (e, k) => lic.activate(k));
ipcMain.handle('lic:remove', () => lic.remove());
ipcMain.handle('lic:buy', () => { if (lic.PRODUCT.buyUrl) shell.openExternal(lic.PRODUCT.buyUrl); });
const LOCKED = { ok: false, error: 'La prueba ha terminado. Activa Littera con tu clave de licencia.' };
ipcMain.handle('proj:open', (e, p) => lic.locked() ? LOCKED : openPath(p));
ipcMain.handle('proj:openDialog', () => lic.locked() ? LOCKED : openDialog());
ipcMain.handle('proj:rename', (e, p, name) => {
  try {
    const np = path.join(path.dirname(p), cleanName(name) + path.extname(p));
    if (np.toLowerCase() !== p.toLowerCase() && fs.existsSync(np)) return { ok: false, error: 'Ya existe un proyecto con ese nombre.' };
    fs.renameSync(p, np);
    if (fs.existsSync(p + '.bak')) fs.renameSync(p + '.bak', np + '.bak');
    const r = readRecent().map(x => x.toLowerCase() === p.toLowerCase() ? np : x);
    fs.writeFileSync(recentFile(), JSON.stringify(r)); buildMenu();
    return { ok: true };
  } catch (x) { return { ok: false, error: x.message }; }
});
ipcMain.handle('proj:duplicate', (e, p) => {
  try { fs.copyFileSync(p, uniquePath(path.dirname(p), baseName(p) + ' - copia', path.extname(p))); return { ok: true }; }
  catch (x) { return { ok: false, error: x.message }; }
});
ipcMain.handle('proj:delete', async (e, p) => {
  try {
    await shell.trashItem(p);
    try { fs.unlinkSync(p + '.bak'); } catch (x) {}
    fs.writeFileSync(recentFile(), JSON.stringify(readRecent().filter(x => x.toLowerCase() !== p.toLowerCase()))); buildMenu();
    return { ok: true };
  } catch (x) { return { ok: false, error: x.message }; }
});
ipcMain.handle('proj:importLegacy', (e, data, name) => {
  try { const p = uniquePath(projectsDir(), cleanName(name)); writeAtomic(p, data); return openPath(p); }
  catch (x) { return { ok: false, error: x.message }; }
});
ipcMain.handle('proj:folder', () => shell.openPath(projectsDir()));

/* ---------- arranque (una sola instancia, archivos .pluma) ---------- */
const fileArg = argv => argv.slice(app.isPackaged ? 1 : 2).find(a => isProj(a) && fs.existsSync(a));
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', (e, argv) => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); const f = fileArg(argv); if (f) openPath(f); }
  });
  app.whenReady().then(() => {
    migrateFromPluma();
    create(fileArg(process.argv));
    app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) create(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
