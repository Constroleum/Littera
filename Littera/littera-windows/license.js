/* Licencias de Littera: claves firmadas (Ed25519) que se validan sin conexión.
   La clave privada NO está en el programa: solo la clave pública (build/public.pem). */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const PRODUCT = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'build', 'product.json'), 'utf8')); } catch (e) { return {}; } })();
const TRIAL_DAYS = PRODUCT.trialDays != null ? PRODUCT.trialDays : 14;
const DAY = 86400000;
const file = () => path.join(app.getPath('userData'), 'license.json');
let PUB = null;
try { PUB = crypto.createPublicKey(fs.readFileSync(path.join(__dirname, 'build', 'public.pem'))); } catch (e) { PUB = null; }

const b64u = b => Buffer.from(b).toString('base64url');
function read() { try { return JSON.parse(fs.readFileSync(file(), 'utf8')); } catch (e) { return {}; } }
function write(o) { try { fs.mkdirSync(path.dirname(file()), { recursive: true }); fs.writeFileSync(file(), JSON.stringify(o)); } catch (e) {} }

/* Clave: LITTERA-<payload>.<firma>  (payload = JSON en base64url) */
function verify(key) {
  if (!PUB) return { ok: false, error: 'Esta copia no incluye la clave pública de licencias.' };
  const m = /^LITTERA-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(key || '').replace(/\s+/g, ''));
  if (!m) return { ok: false, error: 'El formato de la clave no es válido.' };
  let okSig = false;
  try { okSig = crypto.verify(null, Buffer.from(m[1]), PUB, Buffer.from(m[2], 'base64url')); } catch (e) {}
  if (!okSig) return { ok: false, error: 'La clave no es auténtica.' };
  let p; try { p = JSON.parse(Buffer.from(m[1], 'base64url').toString('utf8')); } catch (e) { return { ok: false, error: 'La clave está dañada.' }; }
  if (p.x && Date.now() > p.x) return { ok: false, error: 'La licencia caducó el ' + new Date(p.x).toLocaleDateString('es-ES') + '.' };
  return { ok: true, p };
}

function status() {
  const d = read(), now = Date.now();
  if (d.key) {
    const v = verify(d.key);
    if (v.ok) return { state: 'licensed', name: v.p.n, email: v.p.e, edition: v.p.t || 'Pro', expires: v.p.x || null, product: PRODUCT };
  }
  if (!d.first) { d.first = now; }
  if (d.seen && now < d.seen - DAY) { d.tampered = true; }   // el reloj se ha retrasado
  d.seen = Math.max(d.seen || 0, now); write(d);
  const left = Math.ceil((d.first + TRIAL_DAYS * DAY - now) / DAY);
  if (d.tampered || left <= 0) return { state: 'expired', daysLeft: 0, product: PRODUCT, tampered: !!d.tampered };
  return { state: 'trial', daysLeft: left, product: PRODUCT };
}
const locked = () => status().state === 'expired';
function activate(key) {
  const v = verify(key); if (!v.ok) return v;
  const d = read(); d.key = String(key).replace(/\s+/g, ''); write(d); return { ok: true, status: status() };
}
function remove() { const d = read(); delete d.key; write(d); return status(); }
module.exports = { status, activate, remove, locked, verify, PRODUCT };
