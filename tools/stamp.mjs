/* ============================================================
   Pune o versiune pe fiecare fișier de cod din index.html.

   Browserul ține minte CSS-ul și JS-ul mult timp. Dacă adresa nu se
   schimbă, servește vechiul fișier și pare că site-ul n-a fost actualizat
   — pe telefon, unde nu poți forța reîncărcarea, e și mai supărător.
   Adresa devine style.css?v=a1b2c3, calculat din conținut: se schimbă
   doar când se schimbă fișierul, deci restul rămâne în cache.

   Rulare:  node tools/stamp.mjs
   ============================================================ */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = join(ROOT, "index.html");

const hash = file => createHash("sha1")
  .update(readFileSync(file))
  .digest("hex").slice(0, 8);

let html = readFileSync(PAGE, "utf8");
const stamped = [];

/* src="js/x.js" sau href="css/x.css", cu sau fără ?v= dinainte */
html = html.replace(
  /(src|href)="((?:js|css)\/[^"?]+\.(?:js|css))(\?v=[a-f0-9]+)?"/g,
  (all, attr, path) => {
    const abs = join(ROOT, path);
    if (!existsSync(abs)) return all;
    const v = hash(abs);
    stamped.push(`${path} → ${v}`);
    return `${attr}="${path}?v=${v}"`;
  }
);

writeFileSync(PAGE, html, "utf8");

console.log(`Versionat ${stamped.length} fișiere în index.html:`);
stamped.forEach(s => console.log("  " + s));
