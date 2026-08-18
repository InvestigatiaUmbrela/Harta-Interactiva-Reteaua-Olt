/* ============================================================
   Construiește graful interactiv peste plansa exportată din Figma.

   Fiecare entitate = o grămadă de elemente din board (portret, siglă,
   nume, eticheta de tip). Fiecare relație = o săgeată, legată automat
   de entități citind punctul de origine și vârful din vectorul ei.

   Rulare:  node tools/build-graph.mjs
   ============================================================ */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = f => readFileSync(join(ROOT, f), "utf8");

const BOARD = (0, eval)(load("js/board.js").replace("const BOARD", "BOARD") + "; BOARD");
const DATA = load("js/data.js");
const NODES = (0, eval)(DATA.match(/const NODES = \[[\s\S]*?\n\];/)[0].replace("const NODES", "NODES") + "; NODES");
const EDGES = (0, eval)(DATA.match(/const EDGES = \[[\s\S]*?\n\];/)[0].replace("const EDGES", "EDGES") + "; EDGES");

const els = BOARD.elements;
const norm = s => (s || "").normalize("NFD")
  .split("").filter(c => c.charCodeAt(0) < 0x300 || c.charCodeAt(0) > 0x36f).join("")
  .split("").filter(c => "‘’‚‛“”„‟«»'\"".indexOf(c) === -1).join("")
  .replace(/\s+/g, " ").trim().toLowerCase();

/* ---------- 1. Ce elemente compun fiecare entitate ---------- */
/* img = numele stratului din Figma; txt = textul; lângă = poziția, când textul se repetă */

const MEMBERS = {
  stanescu:      { img: ["Stanesk", "PSD WHITE 9"], txt: ["Paul STĂNESCU"] },
  delta:         { txt: ["“Stuful din Delta Dunării”"] },
  anif:          { txt: ["ANIF Min. Agriculturii"] },
  busi:          { img: ["Busi 2", "PSD WHITE 8"], txt: ["Florin ‘Busi’ Barbu"] },
  carmin:        { img: ["CARMIN WHITE 2"], txt: [["Companie PRIVATĂ", 3580, 296]] },
  mariana:       { img: ["Mariana"], txt: ["Mariana MOȚ"] },
  sri:           { img: ["SRI WHITE 4"] },
  spital:        { txt: ["Spitalul JUDEȚEAN Slatina"] },
  cjolt:         { txt: ["Președinte CJ OLT"] },
  oprescu:       { img: ["Opresk", "PSD WHITE 5"], txt: ["Marius OPRESCU"] },
  coldea:        { img: ["Coldea"], txt: ["Florian COLDEA"] },
  pandarof:      { img: ["Pandarof"], txt: ["Marina PANDAROF"] },
  primarslatina: { txt: ["Primar SLATINA"] },
  emilmot:       { img: ["Mot", "PSD WHITE 7"], txt: ["Emil MOȚ"] },
  /* primarul și funcția lui sunt o singură entitate: pe planșă sunt
     lipite oricum, iar săgețile duc când la una, când la cealaltă */
  rada:          { img: ["Nicusor Rada 2", "PSD WHITE 10"],
                   txt: ["Nicușor RADA", "Primar PIATRA-OLT"] },
  mineralport:   { img: ["MineralportWhite 2"], txt: [["Companie PRIVATĂ", 1899, 1245]] },
  wagramer:      { img: ["Wagramer 2"], txt: [["Companie PRIVATĂ", 2397, 1245]] },
  postolache:    { img: ["Postolache 2"], txt: ["Claudiu POSTOLACHE"] },
  titiriga:      { img: ["Titiriga"], txt: ["VALERIU ȚIȚIRIGĂ"] },
  covaciu:       { img: ["Covaciu", "SRI WHITE 6"], txt: ["Vasile COVACIU", ["Director", 846, 1293], ["C.A.O.", 835, 1349]] },
  usurelu:       { img: ["Usurelu", "PSD WHITE 11"], txt: ["Cătălin UȘURELU", ["Director", 374, 1290], ["C.A.O.", 365, 1346]] },
  oltdrum:       { img: ["Olt Drum SA WHITE 2"], txt: [["Companie de STAT", 1390, 1384]] },
  cao:           { img: ["CAO WHITE 2"], txt: [["Companie de STAT", 580, 1859]] },
  adrianbarbu:   { img: ["Adrian Barbu - Panadria 2"], txt: ["Adrian BARBU"] },
  sga:           { txt: ["S.G.A. OLT", ["Director", 2094, 1850]] },
  panadria:      { txt: ["PANADRIA", ["Companie PRIVATĂ", 1704, 1850]] },
  oldnew:        { txt: ["OLD&NEW CONSTRUCT", ["Companie PRIVATĂ", 1110, 1850]] },
  pisicu:        { img: ["Pisicu 2"], txt: ["Mircea ‘Pisicu’ Ungureanu"] },
  condor:        { txt: ["Condor PĂDURARU", ["Companie PRIVATĂ", 2623, 1850]] },
  sorin:         { img: ["Paduraru 2"], txt: ["Sorin PĂDURARU"] }
};

const DECOR = ["Peace sign 1"];

const claimed = new Set();
const entities = [];
const warn = [];

for (const [id, def] of Object.entries(MEMBERS)) {
  const idx = [];

  for (const name of def.img || []) {
    const i = els.findIndex((e, k) => !claimed.has(k) && e.name === name);
    if (i === -1) { warn.push(`${id}: nu găsesc imaginea "${name}"`); continue; }
    idx.push(i); claimed.add(i);
  }

  for (const spec of def.txt || []) {
    const [want, nx, ny] = Array.isArray(spec) ? spec : [spec, null, null];
    const target = norm(want);
    const hits = els.map((e, k) => ({ e, k }))
      .filter(({ e, k }) => !claimed.has(k) && e.text && norm(e.text).startsWith(target));
    if (!hits.length) { warn.push(`${id}: nu găsesc textul "${want}"`); continue; }
    let pick = hits[0];
    if (nx !== null) {
      pick = hits.reduce((best, h) =>
        Math.hypot(h.e.x - nx, h.e.y - ny) < Math.hypot(best.e.x - nx, best.e.y - ny) ? h : best);
    }
    idx.push(pick.k); claimed.add(pick.k);
  }

  if (!idx.length) { warn.push(`${id}: NICIUN element`); continue; }

  const box = idx.reduce((b, i) => {
    const e = els[i];
    return {
      x0: Math.min(b.x0, e.x), y0: Math.min(b.y0, e.y),
      x1: Math.max(b.x1, e.x + e.w), y1: Math.max(b.y1, e.y + e.h)
    };
  }, { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });

  entities.push({
    id, els: idx,
    x: +box.x0.toFixed(1), y: +box.y0.toFixed(1),
    w: +(box.x1 - box.x0).toFixed(1), h: +(box.y1 - box.y0).toFixed(1)
  });
}

/* ---------- 2. Capetele fiecărei săgeți ---------- */
/* Vectorul conține un cerc (originea) și un triunghi (vârful).
   Le separăm după subtrasee: cercul are curbe, vârful doar linii. */

/* Parser de traseu: H și V au o singură coordonată, așa că numerele
   nu pot fi perechate orbește. Întoarce subtraseele ca liste de puncte. */
function pathSubpaths(d) {
  const cmds = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
  const subs = [];
  let cur = null, x = 0, y = 0, sx = 0, sy = 0, curvy = false;

  const push = (px, py) => { if (cur) cur.pts.push({ x: px, y: py }); };

  for (const c of cmds) {
    const op = c[0];
    const n = (c.slice(1).match(/-?\d*\.?\d+(?:[eE]-?\d+)?/g) || []).map(Number);
    const rel = op === op.toLowerCase();

    switch (op.toUpperCase()) {
      case "M":
        for (let i = 0; i + 1 < n.length; i += 2) {
          x = rel ? x + n[i] : n[i];
          y = rel ? y + n[i + 1] : n[i + 1];
          if (i === 0) { cur = { pts: [], curvy: false }; subs.push(cur); sx = x; sy = y; }
          push(x, y);
        }
        break;
      case "L":
        for (let i = 0; i + 1 < n.length; i += 2) {
          x = rel ? x + n[i] : n[i];
          y = rel ? y + n[i + 1] : n[i + 1];
          push(x, y);
        }
        break;
      case "H":
        for (const v of n) { x = rel ? x + v : v; push(x, y); }
        break;
      case "V":
        for (const v of n) { y = rel ? y + v : v; push(x, y); }
        break;
      case "C":
        for (let i = 0; i + 5 < n.length; i += 6) {
          x = rel ? x + n[i + 4] : n[i + 4];
          y = rel ? y + n[i + 5] : n[i + 5];
          push(x, y);
        }
        if (cur) cur.curvy = true;
        break;
      case "S": case "Q":
        for (let i = 0; i + 3 < n.length; i += 4) {
          x = rel ? x + n[i + 2] : n[i + 2];
          y = rel ? y + n[i + 3] : n[i + 3];
          push(x, y);
        }
        if (cur) cur.curvy = true;
        break;
      case "T":
        for (let i = 0; i + 1 < n.length; i += 2) {
          x = rel ? x + n[i] : n[i];
          y = rel ? y + n[i + 1] : n[i + 1];
          push(x, y);
        }
        if (cur) cur.curvy = true;
        break;
      case "A":
        for (let i = 0; i + 6 < n.length; i += 7) {
          x = rel ? x + n[i + 5] : n[i + 5];
          y = rel ? y + n[i + 6] : n[i + 6];
          push(x, y);
        }
        if (cur) cur.curvy = true;
        break;
      case "Z":
        x = sx; y = sy;
        break;
    }
  }
  return subs.filter(s => s.pts.length);
}

function bboxOf(sub) {
  const xs = sub.pts.map(p => p.x), ys = sub.pts.map(p => p.y);
  return {
    x0: Math.min(...xs), x1: Math.max(...xs),
    y0: Math.min(...ys), y1: Math.max(...ys)
  };
}

function endpoints(file, ox, oy) {
  const svg = load(file);
  const d = (svg.match(/ d="([^"]+)"/) || [])[1];
  if (!d) return null;

  let dot = null, head = null;
  for (const sub of pathSubpaths(d)) {
    const b = bboxOf(sub);
    const w = b.x1 - b.x0, h = b.y1 - b.y0;
    if (w > 34 || h > 34 || (w < 3 && h < 3)) continue;
    const c = { x: ox + (b.x0 + b.x1) / 2, y: oy + (b.y0 + b.y1) / 2 };
    if (sub.curvy && !dot) dot = c;            // cercul de la origine
    else if (!sub.curvy && !head) head = c;    // triunghiul din vârf
  }
  return { dot, head };
}

function nearest(pt, maxDist) {
  if (!pt) return null;
  let best = null, bestD = Infinity;
  for (const en of entities) {
    const dx = Math.max(en.x - pt.x, 0, pt.x - (en.x + en.w));
    const dy = Math.max(en.y - pt.y, 0, pt.y - (en.y + en.h));
    const d = Math.hypot(dx, dy);
    if (d < bestD) { bestD = d; best = en; }
  }
  return bestD <= maxDist ? best.id : null;
}

/* etichetele rămase, nerevendicate de entități */
const labelPool = els.map((e, k) => ({ e, k }))
  .filter(({ e, k }) => !claimed.has(k) && e.text);

/* Punctele traseului, în coordonate de plansă — eticheta se măsoară
   față de linia propriu-zisă, nu față de centrul cutiei. O cutie de
   săgeată în L are centrul în gol, departe de linie. */
function pathSegments(file, ox, oy) {
  const svg = load(file);
  const d = (svg.match(/ d="([^"]+)"/) || [])[1];
  if (!d) return [];
  const segs = [];
  for (const sub of pathSubpaths(d)) {
    for (let i = 0; i + 1 < sub.pts.length; i++) {
      const a = sub.pts[i], b = sub.pts[i + 1];
      segs.push({ ax: ox + a.x, ay: oy + a.y, bx: ox + b.x, by: oy + b.y });
    }
  }
  return segs;
}

/* distanța de la etichetă până la linie, măsurată pe segment:
   pe o linie de 1900px, colțurile sunt la capete, iar o etichetă din
   mijloc ar părea la 900px de traseu dacă am măsura doar până la ele */
function distToPath(segs, cx, cy) {
  let best = Infinity;
  for (const s of segs) {
    const dx = s.bx - s.ax, dy = s.by - s.ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((cx - s.ax) * dx + (cy - s.ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(s.ax + t * dx - cx, s.ay + t * dy - cy);
    if (d < best) best = d;
  }
  return best;
}

const vectors = els.map((e, k) => ({ e, k })).filter(({ e }) => e.type === "VECTOR");
const relations = [];
const unmatched = [];

for (const { e, k } of vectors) {
  const ends = endpoints(e.file, e.x, e.y);
  const from = ends ? nearest(ends.dot, 240) : null;
  const to = ends ? nearest(ends.head, 240) : null;
  let a = from, b = to;

  /* Săgețile foarte lungi pot avea ambele capete lângă aceeași cutie.
     Le reparăm din lista de relații, pornind de la capătul sigur. */
  if (!a || !b || a === b) {
    const known = a || b;
    let cands = EDGES.slice();
    if (known) cands = cands.filter(x => x.from === known || x.to === known);

    const boxOfId = id => entities.find(en => en.id === id);
    const distTo = id => {
      const en = boxOfId(id);
      if (!en) return Infinity;
      const dx = Math.max(en.x - (e.x + e.w), e.x - (en.x + en.w), 0);
      const dy = Math.max(en.y - (e.y + e.h), e.y - (en.y + en.h), 0);
      return Math.hypot(dx, dy);
    };

    let best = null, bestScore = Infinity;
    for (const c of cands) {
      const score = distTo(c.from) + distTo(c.to);
      if (score < bestScore) { bestScore = score; best = c; }
    }
    if (best) { a = best.from; b = best.to; }
  }

  if (!a || !b || a === b) {
    unmatched.push({ el: k, name: e.name, from: a, to: b, label: null });
    continue;
  }

  /* traseul brut al săgeții: îl redesenăm inline, ca hover-ul să urmeze
     exact linia, nu o cutie în jurul ei */
  const svg = load(e.file);
  const viewBox = (svg.match(/viewBox="([^"]+)"/) || [])[1] || null;
  const d = (svg.match(/ d="([^"]+)"/) || [])[1] || null;

  relations.push({
    el: k, from: a, to: b,
    pts: pathSegments(e.file, e.x, e.y),
    labelEl: null, label: "", labelEls: [],
    viewBox, d
  });
}

/* ---------- 2b. Etichetele, atribuite global ---------- */
/* Atribuirea lacomă „cea mai apropiată etichetă” greșește când două
   săgeți trec una lângă alta: prima își ia eticheta vecinei. Calculăm
   toate perechile, cu bonus când textul se potrivește cu o relație
   cunoscută între exact aceleași capete, și le luăm în ordinea costului. */

const pairs = [];
for (const rel of relations) {
  for (const cand of labelPool) {
    const cx = cand.e.x + cand.e.w / 2, cy = cand.e.y + cand.e.h / 2;
    const d = distToPath(rel.pts, cx, cy);
    if (d > 150) continue;
    const want = norm(cand.e.text);
    const exact = EDGES.some(x =>
      norm(x.label) === want &&
      ((x.from === rel.from && x.to === rel.to) || (x.from === rel.to && x.to === rel.from)));
    pairs.push({ rel, cand, cost: d - (exact ? 90 : 0) });
  }
}
pairs.sort((p, q) => p.cost - q.cost);

for (const p of pairs) {
  if (p.cand.taken) continue;
  if (p.rel.labelEls.length >= 2) continue;   // o săgeată poate purta două
  p.cand.taken = true;
  p.rel.labelEls.push(p.cand.k);
  if (!p.rel.label) {
    p.rel.label = p.cand.e.text.replace(/\s+/g, " ").trim();
    p.rel.labelEl = p.cand.k;
  }
}

relations.forEach(r => { delete r.pts; });

/* ---------- 3. Textele din documentar, potrivite pe relații ---------- */

for (const rel of relations) {
  const want = norm(rel.label);
  let hit = EDGES.find(x => x.from === rel.from && x.to === rel.to && norm(x.label) === want)
         || EDGES.find(x => x.from === rel.from && x.to === rel.to)
         || EDGES.find(x => x.to === rel.from && x.from === rel.to && norm(x.label) === want);
  if (hit) { rel.detail = hit.detail; rel.src = hit.src; }
  else { rel.detail = null; rel.src = "harta"; }
}

/* ---------- 4. Scriem ---------- */

const decorEls = els.map((e, k) => k).filter(k => DECOR.includes(els[k].name));

const out = `/* Generat de tools/build-graph.mjs — nu edita manual.
   Leagă elementele plansei de entități și relații. */

const GRAPH = ${JSON.stringify({
  entities,
  relations,
  decor: decorEls
}, null, 1)};
`;

writeFileSync(join(ROOT, "js", "graph.js"), out, "utf8");

console.log(`Entități: ${entities.length}/${Object.keys(MEMBERS).length}`);
console.log(`Relații legate: ${relations.length} din ${vectors.length} săgeți`);
console.log(`Cu text din documentar: ${relations.filter(r => r.detail).length}`);
if (warn.length) { console.log("\nAvertismente:"); warn.forEach(w => console.log("  " + w)); }
if (unmatched.length) {
  console.log("\nSăgeți nelegate:");
  unmatched.forEach(u => console.log(`  ${u.name}  from=${u.from} to=${u.to}  "${u.label || ""}"`));
}
const orphanLabels = labelPool.filter(c => !c.taken).map(c => c.e.text.replace(/\s+/g, " ").trim());
if (orphanLabels.length) console.log(`\nEtichete nefolosite (${orphanLabels.length}): ` + orphanLabels.join(" | "));
