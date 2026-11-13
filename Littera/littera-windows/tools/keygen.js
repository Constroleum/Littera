// Generador de licencias de Littera (solo para el vendedor). NO se incluye en el programa.
//   node tools/keygen.js init                       -> crea el par de claves (una sola vez)
//   node tools/keygen.js make "Nombre" email [Edicion] [AAAA-MM-DD caducidad]
//   node tools/keygen.js check CLAVE
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), priv = path.join(root, 'keys', 'private.pem'), pub = path.join(root, 'build', 'public.pem');
const [cmd, ...a] = process.argv.slice(2);
if (cmd === 'init') {
  if (fs.existsSync(priv)) { console.log('Ya existe keys/private.pem. No se vuelve a crear (invalidaría tus licencias).'); process.exit(0); }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.mkdirSync(path.dirname(priv), { recursive: true });
  fs.writeFileSync(priv, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  fs.writeFileSync(pub, publicKey.export({ type: 'spki', format: 'pem' }));
  console.log('Claves creadas.\n  PRIVADA (guárdala, haz copia, no la compartas): keys/private.pem\n  Pública (va dentro del programa): build/public.pem');
} else if (cmd === 'make') {
  const [n, e, t = 'Pro', x] = a;
  if (!n || !e) { console.log('Uso: node tools/keygen.js make "Nombre" email [Edicion] [AAAA-MM-DD]'); process.exit(1); }
  if (!fs.existsSync(priv)) { console.log('Falta keys/private.pem. Ejecuta primero: node tools/keygen.js init'); process.exit(1); }
  const p = { n, e, t, i: Date.now() }; if (x) p.x = new Date(x + 'T23:59:59').getTime();
  const body = Buffer.from(JSON.stringify(p)).toString('base64url');
  const sig = crypto.sign(null, Buffer.from(body), crypto.createPrivateKey(fs.readFileSync(priv))).toString('base64url');
  const key = `LITTERA-${body}.${sig}`;
  fs.appendFileSync(path.join(root, 'keys', 'licencias-emitidas.csv'), `${new Date().toISOString()};${n};${e};${t};${x || ''};${key}\n`);
  console.log('\nLicencia para ' + n + ' <' + e + '>:\n\n' + key + '\n');
} else if (cmd === 'check') {
  const k = (a[0] || '').trim(), m = /^LITTERA-([^.]+)\.(.+)$/.exec(k);
  if (!m) { console.log('Formato no válido'); process.exit(1); }
  const ok = crypto.verify(null, Buffer.from(m[1]), crypto.createPublicKey(fs.readFileSync(pub)), Buffer.from(m[2], 'base64url'));
  console.log(ok ? 'VÁLIDA: ' + Buffer.from(m[1], 'base64url').toString() : 'NO válida');
} else console.log('Comandos: init | make "Nombre" email [Edicion] [AAAA-MM-DD] | check CLAVE');
