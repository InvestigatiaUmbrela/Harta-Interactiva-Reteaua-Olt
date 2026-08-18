/* ============================================================
   Transformă board.json (exportat din Figma) în materialul site-ului:
     assets/board/*.png|svg   — fiecare element, la poziția lui
     js/board.js              — geometria exactă a plansei

   Rulare:  node tools/import-board.mjs [cale/board.json]
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(process.argv[2] || join(ROOT, "board.json"));
const OUT_DIR = join(ROOT, "assets", "board");
const OUT_JS = join(ROOT, "js", "board.js");

if (!existsSync(SRC)) {
  console.error(`Nu găsesc ${SRC}`);
  console.error("Rulează plugin-ul din Figma și pune board.json în folderul site-ului.");
  process.exit(1);
}

const board = JSON.parse(readFileSync(SRC, "utf8"));
console.log(`Board: ${board.board} — ${board.width} × ${board.height}, ${board.elements.length} elemente`);

if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

/* nume de fișier sigur: diacriticele cad odată cu normalizarea,
   restul devine cratimă */
const slug = s => (s || "el")
  .normalize("NFD")
  .split("").filter(ch => ch.charCodeAt(0) < 0x300 || ch.charCodeAt(0) > 0x36f).join("")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "").slice(0, 44) || "el";

const used = new Map();
const elements = [];
const stats = { png: 0, svg: 0, empty: 0, bytes: 0 };

/* filigranul din fundal nu se mai importa: era un PNG urias afisat la
   2% opacitate, doar cost de memorie */
const DROP = [/peace\s*sign/i];

board.elements.forEach((el, i) => {
  if (!el.data) { stats.empty++; return; }
  if (DROP.some(re => re.test(el.name || ""))) return;

  let base = slug(el.name);
  const n = (used.get(base) || 0) + 1;
  used.set(base, n);
  if (n > 1) base = `${base}-${n}`;

  const file = `${base}.${el.format}`;
  const buf = el.format === "svg"
    ? Buffer.from(el.data, "utf8")
    : Buffer.from(el.data, "base64");

  writeFileSync(join(OUT_DIR, file), buf);
  stats[el.format]++;
  stats.bytes += buf.length;

  elements.push({
    id: el.id,
    name: el.name,
    type: el.type,
    x: el.x, y: el.y, w: el.w, h: el.h,
    ...(el.lx !== null && el.lx !== undefined
      ? { lx: el.lx, ly: el.ly, lw: el.lw, lh: el.lh } : {}),
    rotation: el.rotation || 0,
    opacity: el.opacity === undefined ? 1 : el.opacity,
    file: `assets/board/${file}`,
    ...(el.characters ? { text: el.characters } : {})
  });
});

elements.sort((a, b) => (a.y - b.y) || (a.x - b.x));

const js = `/* Generat de tools/import-board.mjs — nu edita manual.
   Geometria exactă a plansei din Figma. */

const BOARD = ${JSON.stringify({
  width: board.width,
  height: board.height,
  scale: board.scale || 2,
  elements
}, null, 1)};
`;

writeFileSync(OUT_JS, js, "utf8");

console.log(`Scris ${elements.length} fișiere în assets/board (${(stats.bytes / 1048576).toFixed(1)} MB)`);
console.log(`  PNG: ${stats.png}   SVG: ${stats.svg}   fără date: ${stats.empty}`);
console.log(`Scris ${OUT_JS}`);

// ce texte a găsit — de aici mapăm elementele pe entități
const texts = elements.filter(e => e.text).map(e => e.text.replace(/\s+/g, " ").trim());
console.log(`\nTexte găsite (${texts.length}):`);
texts.slice(0, 200).forEach(t => console.log("  " + t));
