/* Littera · Verificador de métrica poética (castellano y catalán)
   Sin dependencias: window.Metrica.analyze(texto, {lang:'es'|'ca', sinalefa:true, expected:0})
   Castellano: se cuenta toda la palabra final y se suma 1 si es aguda / se resta 1 si es esdrújula.
   Catalán: se cuenta hasta la última sílaba tónica (inclusive). */
(function (g) {
  'use strict';
  const VOW = 'aeiouáéíóúàèòïü';
  const ACC = new Set([...'áéíóúàèò']);
  const BASE = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', à: 'a', è: 'e', ò: 'o', ï: 'i', ü: 'u', ç: 'c', ñ: 'ñ' };
  const base = c => BASE[c] || c;
  const isV = c => VOW.includes(c);
  const INSEP = new Set(['pr', 'pl', 'br', 'bl', 'fr', 'fl', 'gr', 'gl', 'tr', 'cr', 'cl', 'dr', 'kr', 'kl']);
  const ATON = {
    es: new Set('el la los las lo un de del al a en y e o u ni que se me te le les nos os mi mis tu tus su sus con por si'.split(' ')),
    ca: new Set('el la els les lo un una de del dels a al als en i o ni que em et es ens us li hi ho ne me te se mon ma ton ta son sa per pel pels amb com si no na'.split(' '))
  };
  const PROC = new Set(['l', 'd', 'm', 't', 's', 'n', 'qu', 'c', 'j']);
  const ENC = new Set(['m', 't', 's', 'l', 'n', 'ls', 'ns']);
  const ENC_HY = new Set(['m', 't', 's', 'ns', 'vos', 'lo', 'la', 'los', 'les', 'li', 'hi', 'ho', 'ne', 'me', 'te', 'se', 'nos', 'os', 'l', 'n', 'ls']);

  /* ---------- clasificación de letras ---------- */
  function cls(ch, lang) {
    if (ch === 'a' || ch === 'e' || ch === 'o') return 'S';
    if ('áéó'.includes(ch) || (lang === 'ca' && 'àèòé'.includes(ch))) return 'A';
    if (ch === 'i' || ch === 'u' || ch === 'y' || (lang === 'es' && ch === 'ü')) return 'w';
    return 'W'; // í ú ï ü(ca)
  }
  function items(w, lang) {
    const a = [...w], it = [];
    for (let i = 0; i < a.length; i++) {
      const ch = a[i], p = a[i - 1], n = a[i + 1];
      let v = isV(ch);
      if (ch === 'y' && lang === 'es') v = a.length === 1 || (i === a.length - 1 && i > 0 && isV(a[i - 1]));
      if (v && (ch === 'u' || ch === 'ü') && (p === 'q' || p === 'g')) {
        if (lang === 'es') { if (ch === 'u' && n && 'eiéí'.includes(n)) v = false; }
        else if (n && isV(n)) v = false;
      }
      if (lang === 'ca' && v && ch === 'i' && i === 0 && n && isV(n)) v = false; // iode, iogurt
      it.push({ ch, v, c: v ? cls(ch, lang) : null });
    }
    return it;
  }
  function canJoin(it, cur, k, lang) {
    const cs = cur.map(j => it[j].c), last = cs[cs.length - 1], v = it[k].c;
    if (lang === 'ca') return v === 'w' && cs.length === 1;
    const hasS = cs.some(c => c === 'S' || c === 'A'), allW = cs.every(c => c === 'w');
    if (v === 'w') return cs.length < 3 && last !== 'W' && !(cs.length === 2 && hasS && last === 'w');
    return allW && last === 'w'; // S, A, W tras débil: diptongo
  }
  function nuclei(it, lang) {
    const out = []; let cur = null;
    for (let k = 0; k < it.length; k++) {
      if (!it[k].v) { cur = null; continue; }
      if (cur && cur[cur.length - 1] === k - 1 && canJoin(it, cur, k, lang)) cur.push(k);
      else { cur = [k]; out.push(cur); }
    }
    return out;
  }
  function tokens(chars, lang) {
    const t = [], s = chars.map(c => c.ch);
    for (let i = 0; i < s.length; i++) {
      const two = s[i] + (s[i + 1] || '');
      const dg = lang === 'es' ? ['ch', 'll', 'rr'] : ['ny', 'll', 'tx'];
      if (dg.includes(two)) { t.push(two); i++; }
      else if ((s[i] === 'q' || s[i] === 'g') && (s[i + 1] === 'u' || s[i + 1] === 'ü') && !chars[i + 1].v) { t.push(s[i] + s[i + 1]); i++; }
      else if (s[i] === 'l' && s[i + 1] === '·') { t.push('l·'); i++; }
      else t.push(s[i]);
    }
    return t;
  }
  function splitCluster(c, lang) { // → [coda, ataque]
    const t = tokens(c, lang), k = t.length;
    if (k === 0) return ['', ''];
    if (k === 1) return ['', t[0]];
    const insep = (a, b) => INSEP.has(a + b);
    let cut;
    if (k === 2) cut = insep(t[0], t[1]) ? 0 : 1;
    else cut = insep(t[k - 2], t[k - 1]) ? k - 2 : k - 1;
    return [t.slice(0, cut).join(''), t.slice(cut).join('')];
  }

  /* ---------- palabra ---------- */
  function peakOf(it, nu) {
    for (const k of nu) if (ACC.has(it[k].ch)) return k;
    for (const k of nu) if (it[k].c === 'S') return k;
    return nu[nu.length - 1];
  }
  function stressIndex(core, lang) {
    const it = items(core, lang), nu = nuclei(it, lang), n = nu.length;
    if (!n) return -1;
    for (let i = 0; i < n; i++) if (nu[i].some(k => ACC.has(it[k].ch))) return i;
    if (n === 1) return 0;
    const L = core[core.length - 1], P = core[core.length - 2], isCons = c => c && !isV(c);
    if (lang === 'es') {
      if (L === 'y') return n - 1;
      if (L === 's' && isCons(P)) return n - 1;
      return (isV(L) || L === 'n' || L === 's') ? n - 2 : n - 1;
    }
    const lastN = nu[n - 1];
    if (isV(L) && lastN.length === 2 && lastN[1] === it.length - 1 && it[lastN[1]].c === 'w') return n - 1; // -iu, -eu, -au, -ou, -ai, -ei…
    if ('aeiou'.includes(L)) return n - 2;
    if (L === 's' && isV(P)) return n - 2;
    if ((core.endsWith('en') || core.endsWith('in')) && n > 1) return n - 2;
    return n - 1;
  }
  function analyzeWord(wd, lang) {
    const w = wd.w, it = items(w, lang), nu = nuclei(it, lang), n = nu.length;
    const syl = [];
    if (n) {
      const clusters = [], first = it.slice(0, nu[0][0]);
      let hiatus = 0;
      for (let i = 0; i < n - 1; i++) {
        const mid = it.slice(nu[i][nu[i].length - 1] + 1, nu[i + 1][0]);
        if (!mid.length) hiatus++;
        clusters.push(splitCluster(mid, lang));
      }
      const tail = it.slice(nu[n - 1][nu[n - 1].length - 1] + 1);
      for (let i = 0; i < n; i++) {
        let s = '';
        s += i === 0 ? first.map(c => c.ch).join('') : clusters[i - 1][1];
        s += nu[i].map(k => it[k].ch).join('');
        s += i === n - 1 ? tail.map(c => c.ch).join('') : clusters[i][0];
        syl.push(s.replace(/·(?=.)/g, '·'));
      }
      wd.hiatus = hiatus;
    } else wd.hiatus = 0;
    const st = n ? stressIndex(wd.rule || w, lang) : -1;
    const stI = Math.min(st, n - 1);
    const tonic = n > 1 || !ATON[lang].has(w);
    // inicio / final vocálico (h muda inicial)
    let f = 0; while (f < it.length && it[f].ch === 'h' && !it[f].v) f++;
    const startsV = !!(it[f] && it[f].v), endsV = !!(it.length && it[it.length - 1].v);
    // rima
    let rc = '', ra = '';
    if (n && stI >= 0) {
      const pk = peakOf(it, nu[stI]);
      rc = rimaKey(it.slice(pk).map(c => c.ch).join(''), lang);
      const vs = [base(it[pk].ch)];
      for (let i = stI + 1; i < n; i++) { let c = base(it[peakOf(it, nu[i])].ch); c = c === 'i' ? 'e' : c === 'u' ? 'o' : c; vs.push(c); }
      ra = vs.join('');
    }
    return { raw: wd.raw || w, w, syl, n, stress: stI, tonic, startsV, endsV, hiatus: wd.hiatus, rc, ra };
  }
  function rimaKey(t, lang) {
    t = t.replace(/·/g, '').replace(/[áàâ]/g, 'a').replace(/[éè]/g, 'e').replace(/í|ï/g, 'i').replace(/[óò]/g, 'o').replace(/[úü]/g, 'u');
    t = t.replace(/h/g, '').replace(/v/g, 'b').replace(/qu/g, 'k').replace(/c(?=[aou]|$|[^eiy])/g, 'k').replace(/c(?=[ei])/g, 'z').replace(/g(?=[ei])/g, 'j').replace(/gu(?=[ei])/g, 'g').replace(/ll/g, 'L');
    if (lang === 'ca') { t = t.replace(/b$/, 'p').replace(/d$/, 't').replace(/g$/, 'k'); }
    return t;
  }

  /* ---------- línea ---------- */
  function caWord(part) {
    const pc = part.split("'");
    if (pc.length === 1) return { w: part, rule: part };
    let pre = '', core = null, suf = '';
    pc.forEach((p, i) => {
      if (!p) return;
      if (core === null && i < pc.length - 1 && PROC.has(p)) pre += p;
      else if (core === null) core = p;
      else if (ENC.has(p)) suf += p;
      else core += p;
    });
    if (core === null) core = pre, pre = '';
    return { w: pre + core + suf, rule: core };
  }
  function tokenize(line, lang) {
    line = line.toLowerCase().replace(/[’‘`´]/g, "'");
    const raw = line.match(/[\p{L}·'\-]+/gu) || [], out = [];
    for (let t of raw) {
      t = t.replace(/^['\-·]+|['\-·]+$/g, '');
      if (!/\p{L}/u.test(t)) continue;
      if (lang === 'es') { t.replace(/'/g, '').split('-').filter(Boolean).forEach(p => out.push({ w: p, rule: p, raw: p })); continue; }
      const parts = t.split('-').filter(Boolean);
      if (parts.length > 1 && parts.slice(1).every(p => ENC_HY.has(p.replace(/^.*'/, '')))) {
        const a = caWord(parts[0]), b = parts.slice(1).map(p => caWord(p).w).join('');
        out.push({ w: a.w + b, rule: a.rule, raw: t }); continue;
      }
      parts.forEach(p => { const a = caWord(p); out.push({ w: a.w, rule: a.rule, raw: p }); });
    }
    return out.filter(x => /[aeiouáéíóúàèòïüy]/.test(x.w));
  }
  function analyzeLine(text, lang, opt) {
    const ws = tokenize(text, lang).map(x => analyzeWord(x, lang));
    if (!ws.length) return null;
    let slot = 0, merges = 0, hi = 0;
    ws.forEach((w, k) => {
      w.syn = k > 0 && opt.sinalefa !== false && ws[k - 1].endsV && w.startsV;
      w.slots = [];
      for (let j = 0; j < w.n; j++) w.slots.push(j === 0 && w.syn ? slot : ++slot);
      if (w.syn) merges++;
      hi += w.hiatus;
    });
    const last = ws[ws.length - 1], after = last.n - 1 - last.stress;
    let count;
    if (lang === 'es') count = slot + (after <= 0 ? 1 : after === 1 ? 0 : -(after - 1));
    else count = last.slots[last.stress];
    const pos = [...new Set(ws.filter(w => w.tonic && w.stress >= 0).map(w => w.slots[w.stress]))].sort((a, b) => a - b);
    return { words: ws, nsyl: slot, count, merges, hiatus: hi, stressPos: pos, rc: last.rc, ra: last.ra, lastWord: last.raw };
  }

  /* ---------- nombres y formas ---------- */
  const NM = {
    es: ['', 'monosílabo', 'bisílabo', 'trisílabo', 'tetrasílabo', 'pentasílabo', 'hexasílabo', 'heptasílabo', 'octosílabo', 'eneasílabo', 'decasílabo', 'endecasílabo', 'dodecasílabo', 'tridecasílabo', 'alejandrino', 'pentadecasílabo'],
    ca: ['', 'monosíl·lab', 'bisíl·lab', 'trisíl·lab', 'tetrasíl·lab', 'pentasíl·lab', 'hexasíl·lab', 'heptasíl·lab', 'octosíl·lab', 'eneasíl·lab', 'decasíl·lab', 'endecasíl·lab', 'dodecasíl·lab (alexandrí)', 'tridecasíl·lab', 'tetradecasíl·lab', 'pentadecasíl·lab']
  };
  const nameOf = (c, lang) => NM[lang][c] || (c > 0 ? 'verso de ' + c + ' sílabas' : '');
  const arte = c => (c <= 8 ? 'arte menor' : 'arte mayor');
  function endecaType(pos, lang) {
    const s = new Set(pos);
    if (lang === 'ca') {
      if (s.has(4) && s.has(10)) return 'cesura 4a (4+6)';
      if (s.has(6) && s.has(10)) return 'cesura 6a (6+4)';
      return '';
    }
    if (!s.has(10)) return '';
    if (s.has(6) && s.has(2)) return 'heroico (acentos 2-6-10)';
    if (s.has(6) && s.has(3)) return 'melódico (3-6-10)';
    if (s.has(6) && s.has(1)) return 'enfático (1-6-10)';
    if (s.has(4) && s.has(8)) return 'sáfico (4-8-10)';
    if (s.has(6)) return 'con acento en 6.ª';
    return '';
  }
  function canon(letters) { // ABBA / abab → relabel por orden de aparición (sin distinguir mayúsculas)
    const m = {}; let n = 0;
    return letters.map(l => { if (l === '-') return '-'; const k = l.toLowerCase(); if (!(k in m)) m[k] = String.fromCharCode(97 + n++); return m[k]; }).join('');
  }
  function stanzaForm(lines, lang) {
    const n = lines.length, cs = lines.map(l => l.count), pat = canon(lines.map(l => l.letter)), mn = Math.min(...cs), mx = Math.max(...cs);
    const same = cs.every(c => c === cs[0]), es = lang === 'es';
    if (n >= 4 && /^(-a)+-?$/.test(pat)) return es ? 'romance (rima en los versos pares)' : 'romanç (rima als versos parells)';
    if (n === 3 && cs[0] === 5 && cs[1] === 7 && cs[2] === 5) return 'haiku / haikú (5-7-5)';
    if (n === 5 && es && cs.join() === '7,11,7,7,11' && pat === 'abab' + 'b') return 'lira (7a 11B 7a 7b 11B)';
    if (n === 10 && pat === 'abbaaccddc' && mx <= 8) return 'décima espinela';
    if (n === 8 && es && pat === 'abababcc' && same && cs[0] === 11) return 'octava real';
    if (n === 4 && same && cs[0] === 14 && pat === 'aaaa') return es ? 'cuaderna vía' : 'cuaderna via';
    if (n === 2 && pat === 'aa') return es ? 'pareado' : 'apariat';
    if (n === 3) return mx <= 8 ? (es ? 'tercerilla' : 'tercet breu') : (es ? 'terceto' : 'tercet');
    if (n === 4) {
      if (pat === 'abba') return mx <= 8 ? (es ? 'redondilla' : 'quarteta') : (es ? 'cuarteto' : 'quartet');
      if (pat === 'abab') return mx <= 8 ? (es ? 'cuarteta' : 'quarteta alterna') : (es ? 'serventesio' : 'serventesi');
      if (pat === 'aabb') return es ? 'dos pareados' : 'dos apariats';
      if (pat === '-a-a') return es ? 'cuarteta asonantada (copla)' : 'cobla de quatre versos';
      return es ? 'cuarteto' : 'quartet';
    }
    if (n === 5) return mx <= 8 ? 'quintilla' : (es ? 'quinteto' : 'quintet');
    if (n === 6) return mx <= 8 ? 'sextilla' : (es ? 'sexteto' : 'sextet');
    if (n === 7) return es ? 'septilla' : 'septet';
    if (n === 8) return mx <= 8 ? (es ? 'octavilla' : 'octeto breu') : (es ? 'octava' : 'cobla (8 versos)');
    if (n === 10) return es ? 'décima' : 'dècima';
    return n + ' versos';
  }

  /* ---------- poema ---------- */
  function analyze(text, o) {
    o = o || {}; const lang = o.lang === 'ca' ? 'ca' : 'es', es = lang === 'es';
    const raw = String(text || '').replace(/\r/g, '').split('\n');
    const lines = []; let st = 0, prevBlank = true;
    raw.forEach((t, ri) => {
      const a = analyzeLine(t, lang, o);
      if (!a) { if (!prevBlank) { st++; prevBlank = true } return; }
      prevBlank = false; a.text = t.trim(); a.row = ri; a.stanza = st; lines.push(a);
    });
    // rima
    const groups = [];
    lines.forEach((l, i) => {
      l.i = i + 1;
      let g1 = groups.find(g => g.rc && g.rc === l.rc);
      if (!g1) { g1 = groups.find(g => g.ra && g.ra === l.ra); if (g1) g1.asn = true; }
      if (!g1) { g1 = { rc: l.rc, ra: l.ra, m: [], asn: false, id: groups.length }; groups.push(g1); }
      g1.m.push(l); l.g = g1;
    });
    const letter = n => (n < 26 ? String.fromCharCode(65 + n) : 'Z' + (n - 25));
    let li = 0;
    groups.forEach(g => { g.letter = g.m.length > 1 ? letter(li++) : '-'; });
    lines.forEach(l => { const g = l.g; l.letter = g.letter === '-' ? '-' : (g.asn ? g.letter.toLowerCase() : g.letter); l.rimaKind = g.letter === '-' ? '' : (g.asn ? 'asonante' : 'consonante'); delete l.g; });
    // medida esperada
    const freq = {}; lines.forEach(l => freq[l.count] = (freq[l.count] || 0) + 1);
    let auto = 0, best = 0; Object.keys(freq).forEach(k => { if (freq[k] > best) { best = freq[k]; auto = +k; } });
    const expected = +o.expected || (lines.length > 1 ? auto : 0);
    lines.forEach(l => {
      l.name = nameOf(l.count, lang); l.arte = arte(l.count);
      if (l.count === 11 && es || l.count === 10 && !es) l.tipo = endecaType(l.stressPos, lang);
      const lo = l.count - l.hiatus, hi = l.count + l.merges;
      if (!expected) { l.status = 'ok'; l.note = ''; return; }
      if (l.count === expected) { l.status = 'ok'; l.note = ''; }
      else if (expected > l.count && expected <= hi) { l.status = 'warn'; l.note = 'Encaja con ' + (expected - l.count) + ' ' + (es ? 'dialefa(s)' : 'dialefa(es)') + ' de las ' + l.merges + ' sinalefas posibles'; }
      else if (expected < l.count && expected >= lo) { l.status = 'warn'; l.note = 'Encaja con sinéresis en ' + (l.count - expected) + ' de los ' + l.hiatus + ' hiatos'; }
      else { l.status = 'bad'; l.note = 'Tiene ' + l.count + ' (esperado ' + expected + ')'; }
    });
    // estrofas
    const stz = [];
    lines.forEach(l => { (stz[l.stanza] = stz[l.stanza] || []).push(l); });
    const stanzas = stz.filter(Boolean).map(ls => ({ from: ls[0].i, to: ls[ls.length - 1].i, n: ls.length, scheme: ls.map(l => l.letter).join(''), form: ls.length > 1 ? stanzaForm(ls, lang) : '' }));
    // forma del poema
    const forms = [], cs = lines.map(l => l.count), N = lines.length;
    const all = (a, f) => a.every(f);
    const sch = lines.map(l => l.letter).join('');
    if (N === 14 && all(cs, c => c === (es ? 11 : 10) || c === 12 || c === 14)) {
      const q = stanzas.map(s => s.n).join('-'), pt = canon(lines.map(l => l.letter));
      const okQ = pt.slice(0, 8) === 'abbaabba' || pt.slice(0, 8) === 'abbaabba'.replace(/b/g, 'b');
      forms.push((es ? 'Soneto' : 'Sonet') + (okQ ? ' (cuartetos ABBA ABBA)' : ' (esquema ' + stanzas.map(s => s.scheme).join(' ') + ')') + (q === '4-4-3-3' || q === '14' ? '' : ' · estrofas ' + q));
    }
    if (N >= 4 && all(cs, c => c >= 6 && c <= 8)) {
      const ev = lines.filter((l, i) => i % 2 === 1), od = lines.filter((l, i) => i % 2 === 0);
      const r0 = ev[0].ra; if (all(ev, l => l.ra === r0) && !od.some(l => l.ra === r0 && l.rc === ev[0].rc)) forms.push('Romance (asonancia en los versos pares: ' + r0 + ')');
    }
    if (N >= 6 && cs.every(c => c === 7 || c === 11) && cs.includes(7) && cs.includes(11) && lines.some(l => l.letter !== '-')) forms.push('Silva (mezcla de heptasílabos y endecasílabos)');
    if (N >= 6 && stz.filter(Boolean).every(s => s.length === 3)) { const p = canon(lines.map(l => l.letter)); if (/^aba bcb|^abab?cb/.test(p) || p.slice(0, 6) === 'abab' + 'cb'.slice(0, 2) || p.slice(0, 6) === 'ababcb') forms.push(es ? 'Tercetos encadenados (ABA BCB CDC…)' : 'Tercets encadenats'); }
    if (N >= 4 && lines.every(l => l.letter === '-') && all(cs, c => c === cs[0])) forms.push((es ? 'Verso blanco' : 'Vers blanc') + ' (' + nameOf(cs[0], lang) + 's sin rima)');
    else if (N >= 6 && lines.every(l => l.letter === '-') && new Set(cs).size > 3) forms.push(es ? 'Verso libre (medida variable, sin rima)' : 'Vers lliure');
    return { lang, lines, stanzas, expected, auto, forms, scheme: stanzas.map(s => s.scheme).join(' '), summary: { lines: N, freq } };
  }
  g.Metrica = { analyze, analyzeLine, nameOf };
  if (typeof module !== 'undefined') module.exports = g.Metrica;
})(typeof window !== 'undefined' ? window : globalThis);
