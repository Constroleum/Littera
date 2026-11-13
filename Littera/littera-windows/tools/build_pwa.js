// Genera la versión web/iPad de Littera en la carpeta "pwa-dist" (lista para subir a cualquier hosting HTTPS).
//   node tools/build_pwa.js
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..'), out = path.join(root, 'pwa-dist'), src = path.join(root, 'pwa-src');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const cp = (a, b) => { fs.mkdirSync(path.dirname(path.join(out, b)), { recursive: true }); fs.copyFileSync(path.join(root, a), path.join(out, b)); };
const cpDir = (a, b, skip = () => false) => {
  fs.mkdirSync(path.join(out, b), { recursive: true });
  for (const e of fs.readdirSync(path.join(root, a), { withFileTypes: true })) {
    if (skip(e)) continue;
    if (e.isDirectory()) cpDir(path.join(a, e.name), path.join(b, e.name), skip); else cp(path.join(a, e.name), path.join(b, e.name));
  }
};
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });

/* configuración del vendedor */
const prod = JSON.parse(rd('build/product.json'));
let pub = ''; try { pub = rd('build/public.pem'); } catch (e) { console.error('AVISO: falta build/public.pem (ejecuta primero COMPILAR.bat o GENERAR-CLAVES.bat). La web no podrá validar licencias.'); }
fs.writeFileSync(path.join(out, 'config.js'), 'window.LITTERA_CFG=' + JSON.stringify({
  seller: prod.seller, buyUrl: prod.buyUrl, supportEmail: prod.supportEmail, trialDays: prod.trialDays != null ? prod.trialDays : 14,
  msClientId: prod.msClientId || '', publicKey: pub
}) + ';');

/* páginas */
const html = rd('index.html');
const m = /<script>\s*\(function\(\)\{\s*\nconst KEY="pluma-v1"[\s\S]*?\}\)\(\);\s*<\/script>/.exec(html);
if (!m) { console.error('No encuentro el script principal en index.html'); process.exit(1); }
fs.writeFileSync(path.join(out, 'app.js'), m[0].replace(/^<script>/, '').replace(/<\/script>$/, ''));
let ed = html.replace(m[0], "<script>window.__LITTERA_EDITOR=1</script><script src='config.js'></script><script src='shim.js'></script><script src='onedrive.js'></script>")
  .replace(/<script src='canvas\.js'><\/script><script src='licgate\.js'><\/script>/, '')
  .replace("node_modules/jspdf/dist/jspdf.umd.min.js", 'lib/jspdf.umd.min.js').replace("node_modules/jszip/dist/jszip.min.js", 'lib/jszip.min.js')
  .replace('<head>', '<head><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png"><meta name="theme-color" content="#0a1236">');
ed = ed.split('Según Windows (claro/oscuro)').join('Según el sistema (claro/oscuro)');
ed = ed.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
fs.writeFileSync(path.join(out, 'editor.html'), ed);
fs.copyFileSync(path.join(src, 'projects.html'), path.join(out, 'index.html'));
for (const f of ['shim.js', 'onedrive.js']) fs.copyFileSync(path.join(src, f), path.join(out, f));
/* La lógica del tesauro se extrae de main.js para que Windows y la web usen siempre la misma */
{
  const mj = rd('main.js'), a = mj.indexOf('const ES_RULES'), z = mj.indexOf('/* Revisión gramatical');
  let t = mj.slice(a, z).replace("ipcMain.handle('thes:lookup', (e, lang, word) => {", 'window.__thesLookup = function (lang, word) {');
  const k = t.lastIndexOf('});'); t = t.slice(0, k) + '};' + t.slice(k + 3);
  fs.writeFileSync(path.join(out, 'thes-core.js'), "const LANGS = ['es', 'ca', 'en', 'fr'];\nconst getThes = l => (window.__thesData || {})[LANGS.includes(l) ? l : 'es'] || { e: {}, x: {} };\n" + t);
}
for (const f of ['canvas.js', 'licgate.js', 'themes.js']) cp(f, f);
cp('node_modules/jspdf/dist/jspdf.umd.min.js', 'lib/jspdf.umd.min.js'); cp('node_modules/jszip/dist/jszip.min.js', 'lib/jszip.min.js');
cpDir('assets', 'assets'); cpDir('fonts', 'fonts', e => e.name === 'licencias');
cpDir('dict', 'dict', e => e.isDirectory());
cpDir('pwa-src/icons', 'icons');
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'Littera', short_name: 'Littera', description: 'Editor para escribir tu libro', start_url: './', scope: './', display: 'standalone',
  background_color: '#0a1236', theme_color: '#0a1236', lang: 'es',
  icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }]
}, null, 1));

/* corrector (Hunspell WebAssembly) empaquetado para el navegador */
require('esbuild').buildSync({
  entryPoints: [path.join(__dirname, '_spell-entry.js')], bundle: true, platform: 'browser', format: 'iife', minify: true, mainFields: ['main'],
  outfile: path.join(out, 'hs.js'), define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'error'
});

/* service worker: todo disponible sin conexión */
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else files.push(path.relative(out, p).split(path.sep).join('/')); } })(out);
const h = crypto.createHash('sha1'); files.sort().forEach(f => { h.update(f); h.update(fs.readFileSync(path.join(out, f))); });
const ver = h.digest('hex').slice(0, 10);
const core = files.filter(f => f !== 'sw.js');
fs.writeFileSync(path.join(out, 'sw.js'), `const V='littera-${ver}',FILES=${JSON.stringify(core)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(new Request(f,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith(caches.match(r,{ignoreSearch:true}).then(c=>c||fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(V).then(ch=>ch.put(r,y))}return x}).catch(()=>caches.match('index.html'))))});
`);
const mb = files.reduce((a, f) => a + fs.statSync(path.join(out, f)).size, 0) / 1048576;
console.log(`Versión web creada en pwa-dist (${files.length} archivos, ${mb.toFixed(1)} MB). Sube el CONTENIDO de esa carpeta a tu hosting HTTPS.`);
