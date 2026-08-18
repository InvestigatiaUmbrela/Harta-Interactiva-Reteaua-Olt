/* ============================================================
   HARTA — plansa exportată din Figma, cu interacțiune peste ea.

   Fiecare element al board-ului e pus la coordonatele lui exacte.
   Săgețile sunt redesenate inline din traseul lor original, ca hover-ul
   să urmeze linia adevărată, nu o cutie în jurul ei.
   ============================================================ */

const NSVG = "http://www.w3.org/2000/svg";

class BoardMap {
  constructor(root) {
    this.root = root;
    this.stage = root.querySelector(".map__stage");
    this.onSelect = () => {};
    this.selected = null;
    this.filters = new Set();
    this.drift = 0;          // deplasarea lentă a grilei din fundal

    /* Grila din spate se mișcă și se apropie la o cincime din viteza
       plansei — destul cât să dea adâncime, prea puțin cât să distragă. */
    this.grid = document.createElement("div");
    this.grid.className = "map__grid";
    this.stage.prepend(this.grid);

    this.board = document.createElement("div");
    this.board.className = "board";
    this.board.style.width = BOARD.width + "px";
    this.board.style.height = BOARD.height + "px";
    this.stage.prepend(this.board);

    this.relOf = new Map();     // index element -> relații care îl folosesc
    this.entOf = new Map();     // index element -> entitate

    GRAPH.entities.forEach(en => en.els.forEach(i => this.entOf.set(i, en.id)));
    GRAPH.relations.forEach((r, i) => {
      if (r.labelEl !== null && r.labelEl !== undefined) this.relOf.set(r.labelEl, i);
    });

    this.drawSprites();
    this.drawWires();
    this.drawHotspots();
    this.bindPanZoom();
    this.fit();
    this.run();
  }

  /* ---------- 1. plansa ---------- */

  drawSprites() {
    this.spriteOf = new Map();
    const relEls = new Set(GRAPH.relations.map(r => r.el));

    BOARD.elements.forEach((e, i) => {
      if (relEls.has(i)) return;               // săgețile se desenează inline

      const img = document.createElement("img");
      img.className = "sprite";
      img.src = e.file;
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      img.style.cssText =
        `left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;` +
        (e.opacity !== 1 ? `opacity:${e.opacity};` : "");

      if (GRAPH.decor.includes(i)) img.classList.add("sprite--decor");

      img.dataset.el = String(i);
      const ent = this.entOf.get(i);
      if (ent) img.dataset.ent = ent;
      const rel = this.relOf.get(i);
      if (rel !== undefined) img.dataset.rel = String(rel);

      this.board.append(img);
      this.spriteOf.set(i, img);
    });
  }

  /* ---------- 2. săgețile ---------- */

  drawWires() {
    this.wires = [];

    GRAPH.relations.forEach((r, i) => {
      const e = BOARD.elements[r.el];
      if (!r.d || !r.viewBox) return;

      const svg = document.createElementNS(NSVG, "svg");
      svg.setAttribute("class", "wire");
      svg.setAttribute("viewBox", r.viewBox);
      svg.dataset.rel = String(i);
      svg.style.cssText = `left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;`;

      const ink = document.createElementNS(NSVG, "path");
      ink.setAttribute("class", "wire__ink");
      ink.setAttribute("d", r.d);

      const hit = document.createElementNS(NSVG, "path");
      hit.setAttribute("class", "wire__hit");
      hit.setAttribute("d", r.d);

      svg.append(ink, hit);
      this.board.append(svg);
      this.wires.push({ svg, ink, rel: r, index: i });
    });
  }

  /* ---------- 3. zonele de click ---------- */

  drawHotspots() {
    this.hotspots = {};

    GRAPH.entities.forEach(en => {
      const node = NODE_BY_ID[en.id];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hotspot";
      b.dataset.ent = en.id;
      b.style.cssText =
        `left:${en.x - 10}px;top:${en.y - 10}px;` +
        `width:${en.w + 20}px;height:${en.h + 20}px;`;
      b.setAttribute("aria-label",
        node ? `${node.label.join(" ")} — ${node.role}` : en.id);
      this.board.append(b);
      this.hotspots[en.id] = b;
    });
  }

  /* ---------- 4. interacțiune ---------- */

  bind(onSelect) {
    this.onSelect = onSelect;

    this.board.addEventListener("click", ev => {
      if (this.dragged) return;
      const hs = ev.target.closest(".hotspot");
      if (hs) { this.select({ type: "node", id: hs.dataset.ent }); return; }
      const w = ev.target.closest(".wire");
      if (w) { this.select({ type: "edge", index: Number(w.dataset.rel) }); return; }
      this.clear();
    });

    const over = (ev, on) => {
      const hs = ev.target.closest(".hotspot");
      if (hs) { this.hot(hs.dataset.ent, null, on); return; }
      const w = ev.target.closest(".wire");
      if (w) this.hot(null, Number(w.dataset.rel), on);
    };
    this.board.addEventListener("mouseover", e => over(e, true));
    this.board.addEventListener("mouseout", e => over(e, false));

    this.board.addEventListener("keydown", ev => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      const hs = ev.target.closest(".hotspot");
      if (!hs) return;
      ev.preventDefault();
      this.select({ type: "node", id: hs.dataset.ent });
    });
  }

  hot(entId, relIdx, on) {
    if (entId) {
      this.board.querySelectorAll(`[data-ent="${entId}"]`)
        .forEach(el => el.classList.toggle("is-hot", on));
    }
    if (relIdx !== null && relIdx !== undefined) {
      this.board.querySelectorAll(`[data-rel="${relIdx}"]`)
        .forEach(el => el.classList.toggle("is-hot", on));
    }
  }

  select(sel) {
    this.selected = sel;
    this.paint();
    this.onSelect(sel);
  }

  clear() {
    if (!this.selected && !this.filters.size) return;
    this.selected = null;
    this.paint();
    this.onSelect(null);
  }

  /* selecția aprinde nodul și legăturile lui, restul plansei se stinge */
  paint() {
    const sel = this.selected;
    const on = !!sel || this.filters.size > 0;
    this.board.classList.toggle("is-dimmed", on);

    const ents = new Set(), rels = new Set();
    const onlyEls = new Set();   // când filtrăm, doar aceste elemente se aprind

    if (sel && sel.type === "node") {
      ents.add(sel.id);
      GRAPH.relations.forEach((r, i) => {
        if (r.from === sel.id || r.to === sel.id) {
          rels.add(i); ents.add(r.from); ents.add(r.to);
        }
      });
    } else if (sel && sel.type === "edge") {
      const r = GRAPH.relations[sel.index];
      rels.add(sel.index); ents.add(r.from); ents.add(r.to);
    } else if (this.filters.size) {
      /* La filtrare aprindem doar fațeta cerută: firma fără persoana ei.
         La selecție se aprinde entitatea întreagă — vezi mai jos. */
      /* „Afiliere” e un tag umbrelă: acoperă siglele PSD și SRI deodată. */
      const wanted = [];
      for (const k of this.filters) {
        if (k === AFFIL_TAG.key) wanted.push(...AFFIL_TAG.facets);
        else wanted.push(k);
      }

      GRAPH.entities.forEach(en => {
        for (const k of wanted) {
          const part = en.facets && en.facets[k];
          if (part && part.length) {
            ents.add(en.id);
            part.forEach(i => onlyEls.add(i));
          }
        }
      });
      GRAPH.relations.forEach((r, i) => {
        if (ents.has(r.from) && ents.has(r.to)) rels.add(i);
      });
    }

    this.board.querySelectorAll("[data-ent]").forEach(el => {
      let active = ents.has(el.dataset.ent);
      // la filtrare, sprite-urile din afara fațetei cerute rămân stinse
      if (active && onlyEls.size && el.dataset.el !== undefined) {
        active = onlyEls.has(Number(el.dataset.el));
      }
      el.classList.toggle("is-active", active);
      el.classList.toggle("is-selected",
        !!sel && sel.type === "node" && sel.id === el.dataset.ent);
    });
    this.board.querySelectorAll("[data-rel]").forEach(el => {
      const i = Number(el.dataset.rel);
      el.classList.toggle("is-active", rels.has(i));
      el.classList.toggle("is-selected",
        !!sel && sel.type === "edge" && sel.index === i);
    });
  }

  setFilters(kinds) {
    this.filters = new Set(kinds);
    this.selected = null;
    this.paint();
  }

  /* ---------- 5. navigare ca pe hartă ---------- */

  apply() {
    const { x, y, k } = this.view;
    this.board.style.transform = `translate(${x}px, ${y}px) scale(${k})`;

    if (this.grid) {
      const P = 0.2;                                   // o cincime din viteză
      const base = this.baseK || k;
      const gk = 1 + (k / base - 1) * P;               // zoom amortizat
      const cell = 46 * gk;
      this.grid.style.backgroundSize =
        `${cell}px ${cell}px, ${cell}px ${cell}px, ${cell * 5}px ${cell * 5}px, ${cell * 5}px ${cell * 5}px`;
      const gx = x * P + (this.drift || 0), gy = y * P;
      this.grid.style.backgroundPosition =
        `${gx}px ${gy}px, ${gx}px ${gy}px, ${gx}px ${gy}px, ${gx}px ${gy}px`;
    }
  }

  /* Marginile: planșa nu poate fi trasă afară din cadru. Lăsăm doar o
     ramă mică de respiro, cât să nu pară lipită de bord. */
  clamp(v = this.view) {
    const r = this.stage.getBoundingClientRect();
    const w = BOARD.width * v.k, h = BOARD.height * v.k;
    const airX = Math.min(r.width * 0.08, 64);
    const airY = Math.min(r.height * 0.08, 64);

    v.x = w <= r.width ? (r.width - w) / 2
      : Math.min(airX, Math.max(r.width - w - airX, v.x));
    v.y = h <= r.height ? (r.height - h) / 2
      : Math.min(airY, Math.max(r.height - h - airY, v.y));
    return v;
  }

  fit() {
    const r = this.stage.getBoundingClientRect();
    const whole = Math.min(r.width / BOARD.width, r.height / BOARD.height);

    this.minK = whole;              // mai departe de-atât n-are rost: se vede tot
    this.maxK = Math.max(whole * 8, 1.6);
    this.baseK = whole;             // reper pentru zoom-ul amortizat al grilei

    /* Pe ecran mic, planșa întreagă ar fi ilizibilă. Pornim de la un zoom
       la care numele se citesc; restul se navighează cu degetul. */
    const small = r.width < 620;
    const k = small ? Math.max(whole, 0.3) : whole;

    this.view = this.clamp({ k, x: 0, y: 0 });
    this.target = { ...this.view };
    this.apply();
  }

  zoomAt(factor, px, py) {
    const t = this.target;
    const k = Math.min(this.maxK, Math.max(this.minK, t.k * factor));
    const ratio = k / t.k;
    t.x = px - (px - t.x) * ratio;
    t.y = py - (py - t.y) * ratio;
    t.k = k;
    this.clamp(t);
    this.run();
  }

  zoomBy(factor) {
    const r = this.stage.getBoundingClientRect();
    this.zoomAt(factor, r.width / 2, r.height / 2);
  }

  reset() { this.fit(); }

  focus(id, zoom) {
    const en = GRAPH.entities.find(e => e.id === id);
    if (!en) return;
    const r = this.stage.getBoundingClientRect();
    const k = Math.min(this.maxK, Math.max(this.minK, zoom || Math.max(this.view.k, 0.55)));
    this.target.k = k;
    this.target.x = r.width / 2 - (en.x + en.w / 2) * k;
    this.target.y = r.height / 2 - (en.y + en.h / 2) * k;
    this.clamp(this.target);
    this.run();
  }

  /* O singură buclă, pornită o dată. Duce vederea spre țintă — de aici
     vine alunecarea, mișcarea se stinge în loc să se oprească sec — și
     tot ea plimbă grila, foarte încet, spre stânga.
     Două bucle separate ar scădea amândouă deriva, deci ar dubla viteza. */
  run() {
    if (this.raf) return;
    let prev = performance.now();

    const step = now => {
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;

      const v = this.view, t = this.target, e = 0.16;
      v.x += (t.x - v.x) * e;
      v.y += (t.y - v.y) * e;
      v.k += (t.k - v.k) * e;

      if (Math.abs(t.x - v.x) < 0.15) v.x = t.x;
      if (Math.abs(t.y - v.y) < 0.15) v.y = t.y;
      if (Math.abs(t.k - v.k) < 0.0002) v.k = t.k;

      this.drift -= 4 * dt;          // ~4 px pe secundă, indiferent de framerate
      this.apply();
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  bindPanZoom() {
    const pts = new Map();
    let last = null, pinch = null;

    const local = ev => {
      const r = this.stage.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    };

    this.stage.addEventListener("pointerdown", ev => {
      pts.set(ev.pointerId, local(ev));
      this.dragged = false;
      this.dragging = true;
      this.vel = { x: 0, y: 0 };
      if (pts.size === 1) {
        last = local(ev);
        this.stage.setPointerCapture(ev.pointerId);
        this.stage.classList.add("is-panning");
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = {
          dist: Math.hypot(a.x - b.x, a.y - b.y),
          mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        };
      }
    });

    this.stage.addEventListener("pointermove", ev => {
      if (!pts.has(ev.pointerId)) return;
      pts.set(ev.pointerId, local(ev));

      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        /* Pinch-ul trebuie să urmeze degetele exact. Dacă lăsăm scara să
           fie „trasă” de bucla de alunecare, ea rămâne mereu în urmă față
           de translație și imaginea se leagănă. Aici mergem 1:1. */
        const ratio = pinch.dist > 0 ? dist / pinch.dist : 1;
        if (Math.abs(ratio - 1) > 0.004) this.zoomAt(ratio, mid.x, mid.y);

        this.target.x += mid.x - pinch.mid.x;
        this.target.y += mid.y - pinch.mid.y;
        this.clamp(this.target);

        this.view.x = this.target.x;
        this.view.y = this.target.y;
        this.view.k = this.target.k;
        this.vel = { x: 0, y: 0 };     // pinch-ul nu aruncă planșa la final
        this.apply();

        pinch = { dist, mid };
        this.dragged = true;
        return;
      }

      if (pts.size === 1 && last) {
        const p = local(ev);
        const dx = p.x - last.x, dy = p.y - last.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) this.dragged = true;

        /* În timpul tragerii, planșa urmează degetul 1:1 — orice lag ar
           părea o defecțiune. Reținem viteza pentru alunecarea de la final. */
        this.target.x += dx;
        this.target.y += dy;
        this.clamp(this.target);
        this.view.x = this.target.x;
        this.view.y = this.target.y;
        this.vel = { x: dx, y: dy };
        last = p;
        this.apply();
      }
    });

    const up = ev => {
      pts.delete(ev.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 0) {
        last = null;
        this.dragging = false;
        this.stage.classList.remove("is-panning");
        try { this.stage.releasePointerCapture(ev.pointerId); } catch (_) {}

        // alunecarea: mișcarea se stinge, nu se oprește sec
        const v = this.vel || { x: 0, y: 0 };
        if (Math.hypot(v.x, v.y) > 1.5) {
          this.target.x += v.x * 7;
          this.target.y += v.y * 7;
          this.clamp(this.target);
        }
        this.run();
        setTimeout(() => { this.dragged = false; }, 0);
      } else {
        last = [...pts.values()][0];
      }
    };
    this.stage.addEventListener("pointerup", up);
    this.stage.addEventListener("pointercancel", up);

    this.stage.addEventListener("wheel", ev => {
      ev.preventDefault();
      const p = local(ev);
      this.zoomAt(ev.deltaY < 0 ? 1.14 : 1 / 1.14, p.x, p.y);
    }, { passive: false });

    this.stage.addEventListener("dblclick", ev => {
      const p = local(ev);
      this.zoomAt(1.6, p.x, p.y);
    });

    let t = null;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => { this.fit(); }, 180);
    });
  }
}

/* dicționar de conținut, pentru fișe */
const NODE_BY_ID = {};
NODES.forEach(n => { NODE_BY_ID[n.id] = n; });
