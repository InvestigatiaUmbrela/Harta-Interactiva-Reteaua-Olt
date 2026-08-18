/* ============================================================
   HARTA INTERACTIVĂ
   Redesenează gramatica conectorului din Figma în SVG:
   traseu ortogonal cu colțuri rotunjite, punct la origine,
   vârf de săgeată la țintă, etichetă în roșu, italic.
   ============================================================ */

const NS = "http://www.w3.org/2000/svg";
const VIEW = { w: 1600, h: 980 };
const PAD_X = 14;   // spațiu în jurul cutiei nodului, pe orizontală
const PAD_Y = 10;
const R = 9;        // raza colțului conectorului

const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

const byId = {};
NODES.forEach(n => { byId[n.id] = n; });

class NetworkMap {
  constructor(root) {
    this.root = root;
    this.stage = root.querySelector(".map__stage");
    this.svg = root.querySelector(".map__svg");
    this.selected = null;
    this.filters = new Set();
    this.view = { x: 0, y: 0, k: 1 };
    this.onSelect = () => {};

    this.svg.setAttribute("viewBox", `0 0 ${VIEW.w} ${VIEW.h}`);
    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    this.camera = el("g", { class: "camera" });
    this.layerEdges = el("g", { class: "layer-edges" });
    this.layerNodes = el("g", { class: "layer-nodes" });
    this.camera.append(this.layerEdges, this.layerNodes);
    this.svg.append(this.camera);

    this.drawNodes();
    this.measure();
    this.drawEdges();
    this.bindPanZoom();
    this.bindKeys();
  }

  /* ---------- noduri ---------- */

  drawNodes() {
    this.nodeEls = {};

    NODES.forEach(data => {
      const g = el("g", {
        class: `node node--${data.kind}`,
        "data-id": data.id,
        tabindex: "0",
        role: "button",
        "aria-label": `${data.label.join(" ")} — ${data.role}`
      });

      const plate = data.kind !== "person" && data.kind !== "event";
      const lineH = plate ? 25 : 24;

      /* Textul stă într-un subgrup: el singur dictează unde se prind săgețile,
         ca imaginile de deasupra să nu mute traseele. */
      const textG = el("g", { class: "node__text" });
      const lines = data.logoOnly ? [] : data.label;
      const total = lines.length * lineH;
      const top = data.y - total / 2 + lineH * 0.78;

      if (data.eyebrow) {
        const eb = el("text", {
          class: "node__eyebrow",
          x: data.x, y: top - lineH * 0.92, "text-anchor": "middle"
        });
        this.fillEyebrow(eb, data.eyebrow);
        textG.append(eb);
      }

      // plăcuțele albe poartă umbra roșie decalată din board-ul Figma
      lines.forEach((line, i) => {
        const y = top + i * lineH;
        const cls = `node__label${plate ? " node__label--plate" : ""}`;
        if (plate) {
          const sh = el("text", {
            class: `${cls} node__shadow`,
            x: data.x + 2, y: y + 2, "text-anchor": "middle"
          });
          sh.textContent = line;
          g.append(sh);
        }
        const t = el("text", { class: cls, x: data.x, y, "text-anchor": "middle" });
        t.textContent = line;
        textG.append(t);
      });

      // pentru nodurile fără text, ancora rămâne un punct în centru
      if (!lines.length && !data.eyebrow) {
        textG.append(el("rect", {
          x: data.x - 1, y: data.y - 1, width: 2, height: 2, fill: "none"
        }));
      }

      g.append(textG);
      this.drawMedia(g, data, lines.length ? top - lineH * (data.eyebrow ? 1.9 : 0.95)
                                           : data.y + (data.eyebrow ? 6 : data.imgH / 2));

      const box = el("rect", { class: "node__box" });
      const hit = el("rect", { class: "node__hit" });
      g.append(box, hit);

      this.layerNodes.append(g);
      this.nodeEls[data.id] = { g, box, hit, textG, data };
    });
  }

  /* portretul decupat și sigla, aliniate pe același rând, deasupra numelui */
  drawMedia(g, data, bottomY) {
    if (!data.img) return;

    const items = [{ name: data.img, h: data.imgH }];
    if (data.logo) items.push({ name: data.logo, h: data.logoH });
    items.forEach(it => { it.w = it.h * (ASPECT[it.name] || 1); });

    const gap = 10;
    const totalW = items.reduce((s, it) => s + it.w, 0) + gap * (items.length - 1);
    let x = data.x - totalW / 2;

    items.forEach(it => {
      g.append(el("image", {
        class: "node__img",
        href: `assets/fig/${it.name}.png`,
        x, y: bottomY - it.h, width: it.w, height: it.h,
        preserveAspectRatio: "xMidYMax meet"
      }));
      x += it.w + gap;
    });
  }

  fillEyebrow(node, text) {
    // „Companie PRIVATĂ” — al doilea cuvânt preia accentul roșu
    const parts = text.split(/(\s+)/);
    parts.forEach(p => {
      const isAccent = /^(PRIVAT[ĂA]|STAT|PSD|S\.R\.I\.|SRI)$/.test(p.trim());
      const ts = el("tspan", isAccent ? { class: "accent" } : {});
      ts.textContent = p;
      node.append(ts);
    });
  }

  /* Două dreptunghiuri per nod:
     rect  — doar textul, de el se prind săgețile;
     full  — text + imagini, zona de hover, click și contur. */
  measure() {
    for (const id in this.nodeEls) {
      const ref = this.nodeEls[id];

      const t = ref.textG.getBBox();
      const rect = {
        x: t.x - PAD_X, y: t.y - PAD_Y,
        w: t.width + PAD_X * 2, h: t.height + PAD_Y * 2
      };
      rect.cx = rect.x + rect.w / 2;
      rect.cy = rect.y + rect.h / 2;
      ref.rect = rect;

      const b = ref.g.getBBox();
      const full = {
        x: b.x - 8, y: b.y - 8,
        w: b.width + 16, h: b.height + 16
      };
      ref.full = full;

      ["box", "hit"].forEach(k => {
        ref[k].setAttribute("x", full.x);
        ref[k].setAttribute("y", full.y);
        ref[k].setAttribute("width", full.w);
        ref[k].setAttribute("height", full.h);
      });
    }
  }

  /* ---------- geometrie conectori ---------- */

  anchor(rect, side, slip = 0) {
    switch (side) {
      case "l": return { x: rect.x, y: rect.cy + slip };
      case "r": return { x: rect.x + rect.w, y: rect.cy + slip };
      case "t": return { x: rect.cx + slip, y: rect.y };
      default:  return { x: rect.cx + slip, y: rect.y + rect.h };
    }
  }

  pickSides(a, b, route) {
    const dx = b.cx - a.cx, dy = b.cy - a.cy;
    if (route === "line") {
      return Math.abs(dx) > Math.abs(dy)
        ? [dx > 0 ? "r" : "l", dx > 0 ? "l" : "r"]
        : [dy > 0 ? "b" : "t", dy > 0 ? "t" : "b"];
    }
    if (route === "hvh") return [dx > 0 ? "r" : "l", dx > 0 ? "l" : "r"];
    if (route === "vhv") return [dy > 0 ? "b" : "t", dy > 0 ? "t" : "b"];
    if (route === "hv")  return [dx > 0 ? "r" : "l", dy > 0 ? "t" : "b"];
    return [dy > 0 ? "b" : "t", dx > 0 ? "l" : "r"];
  }

  points(edge) {
    const A = this.nodeEls[edge.from].rect;
    const B = this.nodeEls[edge.to].rect;
    const [sa, sb] = this.pickSides(A, B, edge.route);
    const off = edge.offset || 0;
    const horiz = sa === "l" || sa === "r";
    const p0 = this.anchor(A, sa, horiz ? off : 0);
    const p1 = this.anchor(B, sb, (sb === "l" || sb === "r") ? off : 0);

    switch (edge.route) {
      case "line":
        return horiz
          ? [p0, { x: p1.x, y: p0.y }, p1]
          : [p0, { x: p0.x, y: p1.y }, p1];
      case "hvh": {
        const mx = edge.mid !== undefined ? edge.mid : (p0.x + p1.x) / 2;
        return [p0, { x: mx, y: p0.y }, { x: mx, y: p1.y }, p1];
      }
      case "vhv": {
        const my = edge.mid !== undefined ? edge.mid : (p0.y + p1.y) / 2;
        return [p0, { x: p0.x, y: my }, { x: p1.x, y: my }, p1];
      }
      case "hv":
        return [p0, { x: p1.x, y: p0.y }, p1];
      default:
        return [p0, { x: p0.x, y: p1.y }, p1];
    }
  }

  /* traseu cu colțuri rotunjite, exact ca pe board */
  pathOf(pts) {
    const clean = pts.filter((p, i) => i === 0 ||
      Math.abs(p.x - pts[i - 1].x) > 0.5 || Math.abs(p.y - pts[i - 1].y) > 0.5);
    if (clean.length < 2) return "";

    let d = `M ${clean[0].x} ${clean[0].y}`;
    for (let i = 1; i < clean.length - 1; i++) {
      const prev = clean[i - 1], cur = clean[i], next = clean[i + 1];
      const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y);
      const outLen = Math.hypot(next.x - cur.x, next.y - cur.y);
      const r = Math.max(0, Math.min(R, inLen / 2, outLen / 2));
      if (r < 1) { d += ` L ${cur.x} ${cur.y}`; continue; }
      const a = { x: cur.x + (prev.x - cur.x) / inLen * r, y: cur.y + (prev.y - cur.y) / inLen * r };
      const c = { x: cur.x + (next.x - cur.x) / outLen * r, y: cur.y + (next.y - cur.y) / outLen * r };
      d += ` L ${a.x} ${a.y} Q ${cur.x} ${cur.y} ${c.x} ${c.y}`;
    }
    const last = clean[clean.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  }

  /* eticheta stă pe cel mai lung segment, întoarsă pe verticale */
  labelSpot(pts) {
    let best = null, bestLen = -1;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len > bestLen) { bestLen = len; best = [a, b]; }
    }
    const [a, b] = best;
    const vertical = Math.abs(b.y - a.y) > Math.abs(b.x - a.x);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    return vertical
      ? { x: mx - 6, y: my, rot: -90, len: bestLen }
      : { x: mx, y: my - 7, rot: 0, len: bestLen };
  }

  arrow(p, prev) {
    const dx = p.x - prev.x, dy = p.y - prev.y;
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    return el("path", {
      class: "arrow-head",
      d: "M 0 0 L -11 -5 L -11 5 Z",
      transform: `translate(${p.x} ${p.y}) rotate(${ang})`
    });
  }

  /* ---------- muchii ---------- */

  drawEdges() {
    this.edgeEls = [];

    EDGES.forEach((edge, i) => {
      const pts = this.points(edge);
      const d = this.pathOf(pts);
      const g = el("g", {
        class: "edge", "data-i": String(i),
        tabindex: "0", role: "button",
        "aria-label": `${byId[edge.from].label.join(" ")} ${edge.label} ${byId[edge.to].label.join(" ")}`
      });

      const line = el("path", { class: "edge__line", d });
      const hit = el("path", { class: "edge__hit", d });
      const dot = el("circle", { class: "edge__dot", cx: pts[0].x, cy: pts[0].y, r: 3.6 });
      const head = this.arrow(pts[pts.length - 1], pts[pts.length - 2]);

      g.append(line, dot, head, hit);

      const spot = this.labelSpot(pts);
      if (spot.len > 46) {
        const attrs = { class: "edge__label", x: spot.x, y: spot.y, "text-anchor": "middle" };
        if (spot.rot) attrs.transform = `rotate(${spot.rot} ${spot.x} ${spot.y})`;
        const t = el("text", attrs);
        t.textContent = edge.label;
        g.append(t);
      }

      this.layerEdges.append(g);
      this.edgeEls.push({ g, line, edge, index: i });
    });

    // lungimea traseului pentru animația de desenare
    this.edgeEls.forEach(e => {
      const len = e.line.getTotalLength();
      e.length = len;
      e.line.style.strokeDasharray = len;
    });
  }

  /* ---------- interacțiune ---------- */

  bind(onSelect) {
    this.onSelect = onSelect;

    this.layerNodes.addEventListener("click", ev => {
      const g = ev.target.closest(".node");
      if (g) this.select({ type: "node", id: g.dataset.id });
    });
    this.layerEdges.addEventListener("click", ev => {
      const g = ev.target.closest(".edge");
      if (g) this.select({ type: "edge", index: Number(g.dataset.i) });
    });

    const hover = (ev, cls) => {
      const g = ev.target.closest(".node, .edge");
      if (!g) return;
      g.classList.toggle("is-hot", cls);
    };
    this.camera.addEventListener("mouseover", e => hover(e, true));
    this.camera.addEventListener("mouseout", e => hover(e, false));

    this.camera.addEventListener("keydown", ev => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      const g = ev.target.closest(".node, .edge");
      if (!g) return;
      ev.preventDefault();
      if (g.classList.contains("node")) this.select({ type: "node", id: g.dataset.id });
      else this.select({ type: "edge", index: Number(g.dataset.i) });
    });
  }

  select(sel) {
    this.selected = sel;
    this.paint();
    this.onSelect(sel);
  }

  clear() {
    this.selected = null;
    this.paint();
    this.onSelect(null);
  }

  /* evidențiază selecția și stinge restul planșei */
  paint() {
    const sel = this.selected;
    this.stage.classList.toggle("is-dimmed", !!sel || this.filters.size > 0);

    const activeNodes = new Set();
    const activeEdges = new Set();

    if (sel && sel.type === "node") {
      activeNodes.add(sel.id);
      EDGES.forEach((e, i) => {
        if (e.from === sel.id || e.to === sel.id) {
          activeEdges.add(i);
          activeNodes.add(e.from);
          activeNodes.add(e.to);
        }
      });
    } else if (sel && sel.type === "edge") {
      const e = EDGES[sel.index];
      activeEdges.add(sel.index);
      activeNodes.add(e.from);
      activeNodes.add(e.to);
    } else if (this.filters.size) {
      NODES.forEach(n => { if (this.filters.has(n.kind)) activeNodes.add(n.id); });
      EDGES.forEach((e, i) => {
        if (activeNodes.has(e.from) && activeNodes.has(e.to)) activeEdges.add(i);
      });
    }

    for (const id in this.nodeEls) {
      const g = this.nodeEls[id].g;
      g.classList.toggle("is-active", activeNodes.has(id));
      g.classList.toggle("is-selected", !!sel && sel.type === "node" && sel.id === id);
    }
    this.edgeEls.forEach(e => {
      e.g.classList.toggle("is-active", activeEdges.has(e.index));
      e.g.classList.toggle("is-selected", !!sel && sel.type === "edge" && sel.index === e.index);
    });
  }

  setFilters(kinds) {
    this.filters = new Set(kinds);
    this.paint();
  }

  /* ---------- pan & zoom ---------- */

  applyView() {
    const { x, y, k } = this.view;
    this.camera.setAttribute("transform", `translate(${x} ${y}) scale(${k})`);
  }

  zoomBy(factor, cx, cy) {
    const k = Math.min(4, Math.max(0.55, this.view.k * factor));
    const px = cx !== undefined ? cx : VIEW.w / 2;
    const py = cy !== undefined ? cy : VIEW.h / 2;
    this.view.x = px - (px - this.view.x) * (k / this.view.k);
    this.view.y = py - (py - this.view.y) * (k / this.view.k);
    this.view.k = k;
    this.applyView();
  }

  reset() {
    this.view = { x: 0, y: 0, k: 1 };
    this.applyView();
  }

  /* aduce un nod în centrul scenei */
  focusNode(id, zoom = 1.9) {
    const rect = this.nodeEls[id]?.rect;
    if (!rect) return;
    this.view.k = zoom;
    this.view.x = VIEW.w / 2 - rect.cx * zoom;
    this.view.y = VIEW.h / 2 - rect.cy * zoom;
    this.applyView();
  }

  toLocal(ev) {
    const r = this.svg.getBoundingClientRect();
    const scale = VIEW.w / r.width;
    return { x: (ev.clientX - r.left) * scale, y: (ev.clientY - r.top) * scale };
  }

  bindPanZoom() {
    let dragging = false, moved = false, last = null;

    this.stage.addEventListener("pointerdown", ev => {
      if (ev.button !== 0) return;
      dragging = true; moved = false;
      last = { x: ev.clientX, y: ev.clientY };
      this.stage.setPointerCapture(ev.pointerId);
      this.stage.classList.add("is-panning");
    });

    this.stage.addEventListener("pointermove", ev => {
      if (!dragging) return;
      const scale = VIEW.w / this.svg.getBoundingClientRect().width;
      const dx = (ev.clientX - last.x) * scale;
      const dy = (ev.clientY - last.y) * scale;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      this.view.x += dx;
      this.view.y += dy;
      last = { x: ev.clientX, y: ev.clientY };
      this.applyView();
    });

    const stop = ev => {
      if (!dragging) return;
      dragging = false;
      this.stage.classList.remove("is-panning");
      try { this.stage.releasePointerCapture(ev.pointerId); } catch (_) {}
    };
    this.stage.addEventListener("pointerup", stop);
    this.stage.addEventListener("pointercancel", stop);

    // clicul care a fost de fapt o tragere nu deschide panoul
    this.stage.addEventListener("click", ev => {
      if (moved) { ev.stopPropagation(); moved = false; }
    }, true);

    this.stage.addEventListener("wheel", ev => {
      ev.preventDefault();
      const p = this.toLocal(ev);
      this.zoomBy(ev.deltaY < 0 ? 1.12 : 1 / 1.12, p.x, p.y);
    }, { passive: false });
  }

  bindKeys() {
    this.stage.addEventListener("keydown", ev => {
      if (ev.key === "Escape") this.clear();
      if (ev.key === "+" || ev.key === "=") this.zoomBy(1.2);
      if (ev.key === "-") this.zoomBy(1 / 1.2);
      if (ev.key === "0") this.reset();
    });
  }
}

