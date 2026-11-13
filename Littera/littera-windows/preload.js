const { contextBridge, ipcRenderer } = require('electron');
const inv = (c, ...a) => ipcRenderer.invoke(c, ...a);

contextBridge.exposeInMainWorld('plumaSpell', { set: () => {} });

contextBridge.exposeInMainWorld('plumaTools', {
  spellCheck: (l, w) => inv('spell:check', l, w),
  spellSuggest: (l, w) => inv('spell:suggest', l, w),
  spellAdd: w => inv('spell:add', w),
  thes: (l, w) => inv('thes:lookup', l, w),
  grammar: (l, t) => inv('grammar:check', l, t),
  edit: a => inv('ctx:edit', a),
  dict: (k, w) => inv('dict:open', k, w)
});

contextBridge.exposeInMainWorld('plumaProj', {
  data: () => ipcRenderer.sendSync('proj:data'),
  name: () => ipcRenderer.sendSync('proj:name'),
  save: d => inv('proj:save', d),
  saveSync: d => ipcRenderer.sendSync('proj:saveSync', d),
  list: () => inv('proj:list'),
  create: n => inv('proj:create', n),
  open: p => inv('proj:open', p),
  openDialog: () => inv('proj:openDialog'),
  rename: (p, n) => inv('proj:rename', p, n),
  duplicate: p => inv('proj:duplicate', p),
  remove: p => inv('proj:delete', p),
  importLegacy: (d, n) => inv('proj:importLegacy', d, n),
  folder: () => inv('proj:folder')
});

contextBridge.exposeInMainWorld('litteraLic', {
  status: () => inv('lic:status'),
  activate: k => inv('lic:activate', k),
  remove: () => inv('lic:remove'),
  buy: () => inv('lic:buy'),
  onShow: f => ipcRenderer.on('lic:show', () => f())
});
