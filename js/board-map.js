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
      GRAPH.entities.forEach(en => {
        const n = NODE_BY_ID[en.id];
        if (n && this.filters.has(n.kind)) ents.add(en.id);
      });
      GRAPH.relations.forEach((r, i) => {
        if (ents.has(r.from) && ents.has(r.to)) rels.add(i);
      });
    }

    this.board.querySelectorAll("[data-ent]").forEach(el => {
      const active = ents.has(el.dataset.ent);
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
  }

  clampView() {
    const r = this.stage.getBoundingClientRect();
    const w = BOARD.width * this.view.k, h = BOARD.height * this.view.k;
    const slackX = Math.max(0, (r.width - w) / 2);
    const slackY = Math.max(0, (r.height - h) / 2);
    const marginX = Math.min(r.width * 0.5, 240);
    const marginY = Math.min(r.height * 0.5, 240);

    this.view.x = w <= r.width ? slackX
      : Math.min(marginX, Math.max(r.width - w - marginX, this.view.x));
    this.view.y = h <= r.height ? slackY
      : Math.min(marginY, Math.max(r.height - h - marginY, this.view.y));
  }

  fit() {
    const r = this.stage.getBoundingClientRect();
    const whole = Math.min(r.width / BOARD.width, r.height / BOARD.height);
    this.minK = whole * 0.9;

    /* Pe ecran mic, plansa întreagă ar fi ilizibilă. Pornim de la un zoom
       la care numele se citesc, ancorat în colțul de sus-stânga, de unde
       începe povestea; restul se navighează cu degetul. */
    const small = r.width < 620;
    const k = small ? Math.max(whole, 0.3) : whole;

    this.view = { k, x: 0, y: 0 };
    if (small && k > whole) { this.view.x = -40 * k; this.view.y = -20 * k; }
    this.clampView();
    this.apply();
  }

  zoomAt(factor, px, py) {
    const k = Math.min(6, Math.max(this.minK, this.view.k * factor));
    const ratio = k / this.view.k;
    this.view.x = px - (px - this.view.x) * ratio;
    this.view.y = py - (py - this.view.y) * ratio;
    this.view.k = k;
    this.clampView();
    this.apply();
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
    const k = Math.min(6, Math.max(this.minK, zoom || Math.max(this.view.k, 0.55)));
    this.view.k = k;
    this.view.x = r.width / 2 - (en.x + en.w / 2) * k;
    this.view.y = r.height / 2 - (en.y + en.h / 2) * k;
    this.clampView();
    this.apply();
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
        if (pinch.dist > 0) this.zoomAt(dist / pinch.dist, mid.x, mid.y);
        this.view.x += mid.x - pinch.mid.x;
        this.view.y += mid.y - pinch.mid.y;
        this.clampView();
        this.apply();
        pinch = { dist, mid };
        this.dragged = true;
        return;
      }

      if (pts.size === 1 && last) {
        const p = local(ev);
        const dx = p.x - last.x, dy = p.y - last.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) this.dragged = true;
        this.view.x += dx;
        this.view.y += dy;
        last = p;
        this.clampView();
        this.apply();
      }
    });

    const up = ev => {
      pts.delete(ev.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 0) {
        last = null;
        this.stage.classList.remove("is-panning");
        try { this.stage.releasePointerCapture(ev.pointerId); } catch (_) {}
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
