const LANGS = ['es', 'ca', 'en', 'fr'];
const getThes = l => (window.__thesData || {})[LANGS.includes(l) ? l : 'es'] || { e: {}, x: {} };
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
window.__thesLookup = function (lang, word) {
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
};

