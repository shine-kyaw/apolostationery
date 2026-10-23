/* ==========================================================================
   APOLO — product search
   --------------------------------------------------------------------------
   What people actually type into a stationery shop's search box: misspellings
   ("pensil", "sharpner", "exersize book"), British spelling ("colour pencil"),
   the word they use at home ("rubber" for eraser, "crayon" for oil pastels),
   one word where the store wrote two ("notebook") — and Burmese (ဘောပင်, ခဲတံ).
   The store's names are all English, so each product also carries the Burmese
   words for what it is.

   Scoring: a hit in the product's name counts most, then its category, then
   tags and options. Every word must match; if no product has them all, the
   products that match most of them are returned and flagged `loose`, so a
   search never dead-ends on one stray word.
   ========================================================================== */

/* query word → what to look for instead (each alternative is a word or a phrase) */
const SAME = {
  rubber: ['eraser'], rubbers: ['eraser'],
  sharpner: ['sharpener'], sharpeners: ['sharpener'],
  colour: ['color'], colours: ['color'], coloured: ['color'], coloring: ['coloring', 'color'], colouring: ['coloring', 'color'],
  notebook: ['note book', 'notebook'], notebooks: ['note book', 'notebook'], notepad: ['note pad'],
  copybook: ['exercise book'], exercisebook: ['exercise book'],
  crayon: ['oil pastel', 'pastel'], crayons: ['oil pastel', 'pastel'],
  biro: ['ball pen'], ballpen: ['ball pen'], ballpoint: ['ball pen'],
  whiteboard: ['white board'], gluestick: ['glue stick'],
  staple: ['staples', 'stapler'], pins: ['pin'],
  tipex: ['correction'], whitener: ['correction'], whiteout: ['correction'],
  puncher: ['punch'], laminate: ['lamination'], laminating: ['lamination'], laminator: ['lamination'],
  transparency: ['ohp'], sticker: ['label', 'sticky'], stickers: ['label', 'sticky'], postit: ['sticky note'],
  knife: ['cutter'], envelop: ['envelope'], receipt: ['receipt', 'voucher'], memo: ['cash memo', 'note'],
  calculater: ['calculator'], clipboard: ['clip board']
};

/* Burmese words for what a product is, found from its English name and type */
const BURMESE = [
  [/exercise book|signature book/i, 'ကျောင်းသုံးစာအုပ် ဗလာစာအုပ် စာအုပ်'],
  [/note ?book|note pad|composition|lecture/i, 'မှတ်စုစာအုပ် စာအုပ်'],
  [/drawing|graphic book|coloring/i, 'ပုံဆွဲစာအုပ် စာအုပ်'],
  [/hard cover|binding book|practice book/i, 'စာအုပ်'],
  [/ledger|journal/i, 'စာရင်းစာအုပ် စာအုပ်'],
  [/voucher|invoice|receipt|cash memo/i, 'ဘောက်ချာ ပြေစာ'],
  [/ball pen|gel pen|gel ink|semi gel/i, 'ဘောပင်'],
  [/pencil/i, 'ခဲတံ'],
  [/colou?r pencil/i, 'ရောင်စုံခဲတံ'],
  [/mechanical pencil/i, 'စက်ခဲတံ'],
  [/pencil lead/i, 'ခဲတံသွား'],
  [/eraser/i, 'ခဲဖျက်'],
  [/sharpener/i, 'ခဲချွန်'],
  [/ruler|geometry/i, 'ပေတံ'],
  [/oil pastel/i, 'ကရေယွန် ဆီပတ်စတယ်'],
  [/marker/i, 'မာကာ'],
  [/highlighter/i, 'ဟိုက်လိုက်တာ'],
  [/correction/i, 'ဖြူဆေး'],
  [/glue/i, 'ကော်'],
  [/scissor/i, 'ကတ်ကြေး'],
  [/cutter|blade/i, 'ဓား'],
  [/stapler|staples/i, 'စတက်ပလာ'],
  [/clip|push pin|paper pin/i, 'ကလစ် ပင်အပ်'],
  [/punch/i, 'အပေါက်ဖောက်စက်'],
  [/calculator/i, 'ဂဏန်းပေါင်းစက်'],
  [/sticky note|label/i, 'စတစ်ကာ'],
  [/tape/i, 'တိပ်'],
  [/paper|sheet/i, 'စက္ကူ'],
  [/copy paper|paper one|double a|nevia/i, 'ကော်ပီစက္ကူ'],
  [/colou?r (copy )?paper/i, 'ရောင်စုံစက္ကူ'],
  [/envelope/i, 'စာအိတ်'],
  [/file|folder|clip board|sheet protector|divider/i, 'ဖိုင် ဖိုင်တွဲ'],
  [/lamination/i, 'လမီနိတ်'],
  [/key ring/i, 'သော့ချိတ်'],
  [/calculator|stapler|punch|tray/i, 'ရုံးသုံး']
];

const MYANMAR = /[က-႟]/;
/* Burmese digits ၀–၉ → 0–9, so "၃၆" finds "36" */
const digits = s => s.replace(/[၀-၉]/g, d => String(d.charCodeAt(0) - 0x1040));
/* \p{M} keeps Burmese vowel signs and tone marks attached to their letters */
export const norm = s => digits(String(s || '')).toLowerCase().replace(/[^\p{L}\p{M}\p{N}.]+/gu, ' ')
  .replace(/(^|\s)\.+|\.+(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
const words = s => norm(s).split(' ').filter(Boolean);
/* plural → singular, for English words only ("pins" → "pin", "files" → "file") */
const stem = w => w.length > 3 && !MYANMAR.test(w)
  ? w.replace(/ies$/, 'y').replace(/(ch|sh|x)es$/, '$1').replace(/([^s])s$/, '$1') : w;

/* weights: words in a name's brackets — "(With Glue)", "(Blue/Black/Red)" —
   describe it rather than say what it is, so they count a little less */
const NAME = 3, BRACKET = 2.2, CATEGORY = 2, OTHER = 1;

function build(c, burmeseCat) {
  const vocab = new Set();
  const rows = c.products.map((p, order) => {
    const tok = new Map();
    const add = (s, w) => {
      const list = words(s);
      for (const x of list) for (const y of [x, stem(x)]) { tok.set(y, Math.max(tok.get(y) || 0, w)); vocab.add(y); }
      /* "note book" is also "notebook" */
      for (let i = 0; i + 1 < list.length; i++) {
        const j = list[i] + list[i + 1];
        if (!/\d/.test(j)) { tok.set(j, Math.max(tok.get(j) || 0, w)); vocab.add(j); }
      }
    };
    const english = [p.titleEn || p.title, p.type].join(' ');
    const title = p.titleEn || p.title;
    add(title.replace(/([^()]*)/g, ' '), NAME);
    add((title.match(/([^()]*)/g) || []).join(' '), BRACKET);
    add(p.collections.map(col => col.title).join(' ') + ' ' + p.type, CATEGORY);
    add([p.vendor, ...p.tags, ...p.options.flatMap(o => [o.name, ...o.values])].join(' '), OTHER);
    if (p.promo) add(p.promo, OTHER);
    /* Burmese: its Burmese name, its categories' Burmese names, and what it is */
    const my = [
      p.titleEn ? p.title : '',
      ...p.collections.flatMap(col => [col.my, burmeseCat(col)]),
      ...BURMESE.filter(([re]) => re.test(english)).map(([, w]) => w),
      p.promo || ''
    ].filter(Boolean).join(' ');
    const lead = norm(title).replace(/^apolo /, '');
    return { p, tok, lead, my: norm(my), name: norm(p.titleEn ? p.title + ' ' + p.titleEn : p.title), order };
  });
  return { rows, vocab: [...vocab] };
}

/* optimal string alignment distance (Damerau–Levenshtein with adjacent swaps), capped */
function distance(a, b, cap) {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      if (v < low) low = v;
    }
    if (low > cap) return cap + 1;
    prev2 = prev; prev = cur;
  }
  return prev[b.length];
}

/* the ways one query word can be satisfied: [tokens…, factor] */
function alternatives(w, vocab) {
  if (MYANMAR.test(w)) return [{ my: w, f: 1 }];
  const alts = [{ t: [w], f: 1 }];
  if (stem(w) !== w) alts.push({ t: [stem(w)], f: 1 });
  for (const s of SAME[w] || SAME[stem(w)] || []) alts.push({ t: words(s).map(stem), f: 0.9 });
  const known = vocab.includes(w) || vocab.includes(stem(w)) || (w.length >= 3 && vocab.some(v => v.startsWith(w)));
  if (!known && w.length >= 4 && !/\d/.test(w)) {
    const cap = w.length >= 8 ? 2 : 1;
    for (const v of vocab) if (!/\d/.test(v) && distance(w, v, cap) <= cap) alts.push({ t: [v], f: 0.7 });
  }
  return alts;
}

function scoreWord(row, alts) {
  let best = 0;
  for (const a of alts) {
    if (a.my) { if (row.my.includes(a.my) || row.name.includes(a.my)) best = Math.max(best, NAME * a.f); continue; }
    let s = 0;
    for (const t of a.t) {
      let hit = row.tok.get(t) || 0;
      /* typing in progress: "pen" also finds "pencil", but ranks below "pen" */
      if (!hit && t.length >= 2) for (const [k, w] of row.tok) if (k.startsWith(t)) hit = Math.max(hit, w * 0.6);
      if (!hit) { s = 0; break; }
      s += hit;
    }
    best = Math.max(best, (s / a.t.length) * a.f);
  }
  return best;
}

const cache = new WeakMap();

/** Search the catalogue. Returns products, best first; the array carries
    `loose: true` when no product matched every word. */
export function searchCatalog(c, q, { burmeseCat = () => '' } = {}) {
  const qs = words(q);
  if (!qs.length) return [];
  let idx = cache.get(c);
  if (!idx) { idx = build(c, burmeseCat); cache.set(c, idx); }
  const alts = qs.map(w => alternatives(w, idx.vocab));

  /* a name that starts with what was typed ("gel pen" → "Gel Pen A-101")
     beats one that only contains it ("Semi Gel Pen") */
  const phrase = qs.join(' ');
  const scored = idx.rows.map(row => {
    const per = alts.map(a => scoreWord(row, a));
    const at = w => (row.lead + ' ').startsWith(w + ' ');
    const lead = at(phrase) ? 1.5 : at(qs[0]) ? 0.75 : 0;
    return { row, per, hits: per.filter(Boolean).length, score: per.reduce((a, b) => a + b, 0) + (per[0] ? lead : 0) };
  }).filter(x => x.hits);

  const all = scored.filter(x => x.hits === qs.length);
  const pool = all.length ? all : scored.filter(x => x.hits === Math.max(0, ...scored.map(y => y.hits)));
  pool.sort((a, b) => b.score - a.score || (b.row.p.available - a.row.p.available) || a.row.order - b.row.order);
  const out = pool.map(x => x.row.p);
  if (!all.length && out.length) out.loose = true;
  return out;
}
