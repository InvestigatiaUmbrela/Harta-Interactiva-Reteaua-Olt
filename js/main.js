
/* ============================================================
   1. CONFIGURARE
   Înlocuiește cu ID-ul clipului de pe YouTube (partea de după
   „watch?v=” sau după „youtu.be/”). Exemplu: "dQw4w9WgXcQ"
   ============================================================ */
const VIDEO_ID = "pEphuJU3OQo";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ============================================================
   2. VIDEO
   ============================================================ */
function mountVideo() {
  const frame = $("#video-frame");
  if (!frame || !VIDEO_ID) return;
  frame.innerHTML = "";
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`;
  iframe.title = "Documentar — Rețeaua Olt";
  iframe.loading = "lazy";
  iframe.allow = "accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen";
  iframe.setAttribute("allowfullscreen", "");
  iframe.allowFullscreen = true;
  frame.append(iframe);
}

/* ============================================================
   3. CRONOLOGIE ȘI CIFRE
   ============================================================ */
function mountTimeline(onTag) {
  const wrap = $("#timeline");
  if (!wrap) return;
  wrap.innerHTML = TIMELINE.map(item => `
    <article class="tl-item">
      <div class="tl-year">${item.year}</div>
      <h3 class="tl-title">${item.title}</h3>
      <p class="tl-body">${item.body}</p>
      <div class="tl-tags">
        ${item.nodes.map(id => NODE_BY_ID[id]
          ? `<button type="button" class="tl-tag" data-node="${id}">${NODE_BY_ID[id].label.join(" ")}</button>`
          : "").join("")}
      </div>
    </article>`).join("");

  wrap.addEventListener("click", ev => {
    const btn = ev.target.closest("[data-node]");
    if (btn) onTag(btn.dataset.node);
  });
}

function mountFigures() {
  const wrap = $("#figures");
  if (!wrap) return;
  wrap.innerHTML = FIGURES.map(f => `
    <div class="figure">
      <div class="figure__value" data-value="${f.value}"
           data-prefix="${f.prefix}" data-suffix="${f.suffix}">
        ${f.prefix}0${f.suffix}
      </div>
      <p class="figure__label">${f.label}</p>
      <p class="figure__note">${f.note}</p>
    </div>`).join("");
}

/* ============================================================
   4. FILTRE
   ============================================================ */
function mountFilters(map) {
  const wrap = $("#map-filters");
  if (!wrap) return;
  /* după contopiri, un om poate fi și firma lui: filtrele se uită și la
     `also`, altfel „Companie privată” ar rămâne aproape goală */
  const kinds = Object.keys(KIND_META).filter(k =>
    NODES.some(n => n.kind === k || (n.also || []).includes(k)));

  /* afilierea e un singur tag, lângă tipuri: aprinde toate siglele
     de partid și de serviciu de pe planșă */
  const hasAffil = NODES.some(n => (n.affil || []).length);

  wrap.innerHTML =
    kinds.map(k => `
      <button type="button" class="chip chip--${k}" data-kind="${k}" aria-pressed="false">
        <span class="chip__dot" aria-hidden="true"></span>${KIND_META[k].label}
      </button>`).join("") +
    (hasAffil ? `
      <button type="button" class="chip chip--affil" data-kind="${AFFIL_TAG.key}" aria-pressed="false">
        <span class="chip__dot" aria-hidden="true"></span>${AFFIL_TAG.label}
      </button>` : "");

  const active = new Set();
  wrap.addEventListener("click", ev => {
    const btn = ev.target.closest("[data-kind]");
    if (!btn) return;
    const k = btn.dataset.kind;
    if (active.has(k)) active.delete(k); else active.add(k);
    btn.setAttribute("aria-pressed", String(active.has(k)));
    map.selected = null;
    map.setFilters(active);
    closeDrawer();
  });
}

/* ============================================================
   5. PANOUL DE DETALII
   ============================================================ */
const drawer = {
  root: null, card: null, kind: null, title: null, role: null, body: null,
  shot: null, img: null, lastFocus: null
};

function initDrawer(map) {
  drawer.root  = $("#modal");
  drawer.card  = $(".modal__card");
  drawer.kind  = $("#modal-kind");
  drawer.title = $("#modal-title");
  drawer.role  = $("#modal-role");
  drawer.body  = $("#modal-body");
  drawer.shot  = $("#modal-shot");
  drawer.img   = $("#modal-img");

  $("#modal-close").addEventListener("click", () => map.clear());
  $("#modal-veil").addEventListener("click", () => map.clear());
  bindScrollContainment(drawer.root);

  drawer.body.addEventListener("click", ev => {
    const row = ev.target.closest("[data-goto]");
    if (!row) return;
    const [type, key] = row.dataset.goto.split(":");
    if (type === "node") {
      map.select({ type: "node", id: key });
      map.focus(key, Math.max(map.view.k, 1.4));
    } else {
      map.select({ type: "edge", index: Number(key) });
    }
  });

  // capcană de focus simplă: Tab nu iese din pop-up cât e deschis
  drawer.root.addEventListener("keydown", ev => {
    if (ev.key !== "Tab") return;
    const f = drawer.card.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])");
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  });
}

/* Pagina din spate nu trebuie să se miște cât e pop-up-ul deschis.

   Nu o mai blocăm cu `position: fixed` pe body: aceea prăbușea înălțimea
   documentului de la 4500 la 1278 px, ceea ce ducea derularea la zero, iar
   la închidere trebuia pusă înapoi — dar `scroll-behavior: smooth` o punea
   *animat*, deci vedeai pagina sărind sus și întorcându-se încet. Pe
   telefon, relayout-ul întregii pagini cu peste o sută de imagini era și
   scump, de acolo și reîncărcările.

   Pop-up-ul e oricum fix peste ecran, deci e de ajuns să oprim derularea
   chiar acolo unde se naște. Layout-ul rămâne neatins, nu mai e nimic de
   salvat și de restaurat. */
function bindScrollContainment(root) {
  const scrollable = () => root.querySelector(".modal__body");

  // în afara zonei care se derulează, gestul nu are ce să miște
  const block = ev => {
    const body = scrollable();
    if (body && ev.target instanceof Node && body.contains(ev.target)) return;
    ev.preventDefault();
  };

  root.addEventListener("wheel", block, { passive: false });
  root.addEventListener("touchmove", block, { passive: false });
}

function closeDrawer() {
  if (!drawer.root || drawer.root.hidden) return;
  drawer.root.hidden = true;
  if (drawer.lastFocus && document.contains(drawer.lastFocus)) {
    // fără preventScroll, focalizarea ar trage singură pagina spre element
    drawer.lastFocus.focus({ preventScroll: true });
  }
  drawer.lastFocus = null;
}

function relationsOf(id) {
  const out = [];
  GRAPH.relations.forEach((e, i) => {
    if (e.from === id) out.push({ dir: "→", rel: e.label, other: e.to, index: i });
    else if (e.to === id) out.push({ dir: "←", rel: e.label, other: e.from, index: i });
  });
  return out;
}

function renderDrawer(sel) {
  if (!sel) { closeDrawer(); return; }

  if (sel.type === "node") {
    const n = NODE_BY_ID[sel.id];
    const rels = relationsOf(n.id);
    const kinds = [n.kind, ...(n.also || [])]
      .map(k => KIND_META[k] && KIND_META[k].label)
      .filter(Boolean);
    drawer.kind.textContent = kinds.join(" · ");
    drawer.title.textContent = n.label.join(" ");
    drawer.role.textContent = n.role;

    /* apartenențele, așa cum apar pe planșă: sigla PSD lângă om,
       stema SRI la cei veniți pe filiera serviciilor */
    const affil = (n.affil || []).length
      ? `<h4 class="drawer__h">Afiliere</h4>
         <div class="affils">${n.affil
           .map(a => `<span class="affil affil--${a.toLowerCase()}">${a}</span>`).join("")}</div>`
      : "";

    drawer.body.innerHTML = `
      <p class="drawer__lead">${n.lead}</p>
      ${affil}
      <h4 class="drawer__h">Ce se știe</h4>
      <ul class="facts">${n.facts.map(f => `<li>${f}</li>`).join("")}</ul>
      <h4 class="drawer__h">Legături · ${rels.length}</h4>
      <div class="links">
        ${rels.map(r => `
          <button type="button" class="link-row" data-goto="edge:${r.index}">
            <span class="link-row__dir">${r.dir}</span>
            <span>
              <span class="link-row__rel">${r.rel}</span>
              <span class="link-row__to">${NODE_BY_ID[r.other].label.join(" ")}</span>
            </span>
          </button>`).join("")}
      </div>`;
  } else {
    const e = GRAPH.relations[sel.index];
    const a = NODE_BY_ID[e.from], b = NODE_BY_ID[e.to];
    drawer.kind.textContent = "Legătură";
    drawer.title.textContent = e.label || "Legătură pe planșă";
    drawer.role.textContent = `${a.label.join(" ")}  →  ${b.label.join(" ")}`;

    /* unele săgeți sunt desenate pe planșă fără să fie explicate separat
       în documentar — le arătăm ca atare, fără să inventăm o afirmație */
    const lead = e.detail
      ? `<p class="drawer__lead">${e.detail}</p>`
      : `<p class="drawer__lead">Legătura există în rețea. Detaliile ei nu au
           fost făcute publice dincolo de ce scrie pe săgeată.</p>`;

    drawer.body.innerHTML = `
      ${lead}
      <h4 class="drawer__h">Capetele relației</h4>
      <div class="links">
        <button type="button" class="link-row" data-goto="node:${a.id}">
          <span class="link-row__dir">DE&nbsp;LA</span>
          <span>
            <span class="link-row__to">${a.label.join(" ")}</span>
            <span class="link-row__rel">${a.role}</span>
          </span>
        </button>
        <button type="button" class="link-row" data-goto="node:${b.id}">
          <span class="link-row__dir">CĂTRE</span>
          <span>
            <span class="link-row__to">${b.label.join(" ")}</span>
            <span class="link-row__rel">${b.role}</span>
          </span>
        </button>
      </div>
      <h4 class="drawer__h">Notă</h4>
      <p class="figure__note">${DISCLAIMER}</p>`;
  }

  // portretul din board apare și în pop-up
  const face = sel.type === "node" ? NODE_BY_ID[sel.id] : NODE_BY_ID[GRAPH.relations[sel.index].from];
  if (face && face.img) {
    drawer.img.src = `assets/fig/${face.img}.png`;
    drawer.img.alt = face.label.join(" ");
    drawer.shot.hidden = false;
  } else {
    drawer.shot.hidden = true;
    drawer.img.removeAttribute("src");
  }

  if (drawer.root.hidden) drawer.lastFocus = document.activeElement;
  drawer.root.hidden = false;
  drawer.body.scrollTop = 0;
  $("#modal-close").focus({ preventScroll: true });

  if (gsap && !prefersReduced()) {
    gsap.fromTo(drawer.card,
      { opacity: 0, y: 26, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.34, ease: "power3.out", overwrite: true });
    gsap.fromTo(drawer.body.children,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.045, delay: 0.1,
        ease: "power2.out", overwrite: true });
  }
}

/* ============================================================
   7. PÂNZA DIN HERO — harta reală, desenându-se singură
   ============================================================ */
function mountHeroWeb() {
  const svg = $("#hero-web");
  if (!svg) return;
  svg.setAttribute("viewBox", "0 0 1600 980");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");

  const ns = "http://www.w3.org/2000/svg";
  const frag = document.createDocumentFragment();

  EDGES.forEach(e => {
    const a = NODE_BY_ID[e.from], b = NODE_BY_ID[e.to];
    if (!a || !b) return;
    const mid = e.route === "vhv" ? { x: a.x, y: e.mid !== undefined ? e.mid : (a.y + b.y) / 2 }
              : e.route === "hvh" ? { x: e.mid !== undefined ? e.mid : (a.x + b.x) / 2, y: a.y }
              : { x: a.x, y: b.y };
    const d =
      e.route === "vhv" ? `M ${a.x} ${a.y} L ${mid.x} ${mid.y} L ${b.x} ${mid.y} L ${b.x} ${b.y}`
    : e.route === "hvh" ? `M ${a.x} ${a.y} L ${mid.x} ${mid.y} L ${mid.x} ${b.y} L ${b.x} ${b.y}`
    : `M ${a.x} ${a.y} L ${mid.x} ${mid.y} L ${b.x} ${b.y}`;

    /* Două trasee suprapuse: unul e linia în sine, celălalt un segment
       scurt care circulă pe ea. Așa rețeaua rămâne vie, nu doar se
       desenează o dată la încărcare. */
    const base = document.createElementNS(ns, "path");
    base.setAttribute("class", "web-base");
    base.setAttribute("d", d);
    frag.append(base);

    const pulse = document.createElementNS(ns, "path");
    pulse.setAttribute("class", "web-pulse");
    pulse.setAttribute("d", d);
    frag.append(pulse);
  });

  NODES.forEach(n => {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", n.x);
    c.setAttribute("cy", n.y);
    c.setAttribute("r", 4);
    frag.append(c);
  });

  svg.append(frag);
  return svg;
}

/* ============================================================
   8. MIȘCARE
   ============================================================ */
const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Impulsuri care circulă continuu prin rețea: fiecare traseu primește un
   segment scurt care îl parcurge la nesfârșit, cu porniri decalate, ca să
   nu bată toate în același ritm.

   Pornirea nu atârnă de animația de intrare. Dacă ar fi legată de finalul
   ei și aceasta s-ar întrerupe — filă în fundal, tab reactivat târziu —
   pânza ar rămâne moartă pentru totdeauna. */
let pulseLoop = null;

function startPulses() {
  if (pulseLoop || !gsap || prefersReduced()) return;

  const pulses = $$("#hero-web .web-pulse");
  if (!pulses.length) return;

  pulseLoop = gsap.timeline({ repeat: -1 });

  pulses.forEach((p, i) => {
    const len = p.getTotalLength();
    if (!len) return;
    const dash = Math.min(90, Math.max(28, len * 0.12));
    gsap.set(p, { strokeDasharray: `${dash} ${len}`, strokeDashoffset: dash });
    pulseLoop.to(p, {
      strokeDashoffset: -len,
      duration: 3.2 + len / 900,
      ease: "none",
      repeat: -1,
      repeatDelay: 1.4
    }, i * 0.09);
  });

  // nu ardem baterie cât pânza nu se vede
  if (ScrollTrigger) {
    ScrollTrigger.create({
      trigger: ".hero", start: "top bottom", end: "bottom top",
      onToggle: self => (self.isActive ? pulseLoop.play() : pulseLoop.pause())
    });
  }
}

function animate(map) {
  if (!gsap) return;

  const mm = gsap.matchMedia();

  /* --- fără mișcare: totul e deja la starea finală --- */
  mm.add("(prefers-reduced-motion: reduce)", () => {
    gsap.set(".hero__title .line > span, .hero__lede, .hero__cta, .hero__eyebrow", { clearProps: "all" });
    gsap.set("#hero-web path", { strokeDasharray: "none", strokeDashoffset: 0 });
    gsap.set(".section__rule", { scaleX: 1 });
    $$(".figure__value").forEach((elm, i) => {
      const f = FIGURES[i];
      elm.textContent = f.prefix + f.value.toLocaleString("ro-RO") + f.suffix;
    });
    ScrollTrigger.refresh();
  });

  mm.add("(prefers-reduced-motion: no-preference)", () => {

    /* --- deschiderea: pânza se trage, apoi titlul --- */
    const web = $$("#hero-web .web-base");
    web.forEach(p => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.set("#hero-web circle", { scale: 0, transformOrigin: "center" });

    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro
      .to(web, {
        strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut",
        stagger: { each: 0.012, from: "random" }
      })
      .to("#hero-web circle", {
        scale: 1, duration: 0.5, ease: "back.out(2)",
        stagger: { each: 0.01, from: "random" }
      }, "-=1.5")
      .from(".hero__eyebrow", { opacity: 0, x: -20, duration: 0.6 }, 0.25)
      .from(".hero__title .line > span", {
        yPercent: 118, duration: 1, stagger: 0.09, ease: "power4.out"
      }, 0.4)
      .from(".hero__lede", { opacity: 0, y: 24, duration: 0.8 }, "-=0.5")
      .from(".hero__cta > *", { opacity: 0, y: 18, duration: 0.6, stagger: 0.08 }, "-=0.45")
      .from(".hero__scroll", { opacity: 0, duration: 0.6 }, "-=0.3");

    startPulses();

    /* --- linia roșie de sub fiecare titlu de secțiune --- */
    $$(".section__rule").forEach(rule => {
      gsap.fromTo(rule, { scaleX: 0 }, {
        scaleX: 1, duration: 0.9, ease: "power3.inOut",
        scrollTrigger: { trigger: rule, start: "top 88%" }
      });
    });

    $$(".section__head").forEach(head => {
      gsap.from(head.querySelectorAll(".section__num, .section__title, .section__sub"), {
        opacity: 0, y: 26, duration: 0.7, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: head, start: "top 85%" }
      });
    });

    /* --- cronologia intră în cascadă --- */
    ScrollTrigger.batch(".tl-item", {
      start: "top 88%",
      onEnter: batch => gsap.from(batch, {
        opacity: 0, x: -28, duration: 0.65, stagger: 0.12, ease: "power3.out", overwrite: true
      })
    });

    /* --- cifrele urcă la valoare --- */
    $$(".figure__value").forEach(elm => {
      const target = Number(elm.dataset.value);
      const prefix = elm.dataset.prefix || "";
      const suffix = elm.dataset.suffix || "";
      const obj = { n: 0 };
      gsap.to(obj, {
        n: target, duration: 1.6, ease: "power2.out",
        scrollTrigger: { trigger: elm, start: "top 90%", once: true },
        onUpdate: () => {
          elm.textContent = prefix + Math.round(obj.n).toLocaleString("ro-RO") + suffix;
        }
      });
    });
    gsap.from(".figure", {
      opacity: 0, y: 22, duration: 0.55, stagger: 0.07, ease: "power3.out",
      scrollTrigger: { trigger: "#figures", start: "top 85%" }
    });

    /* --- harta se desenează la prima vizionare --- */
    ScrollTrigger.create({
      trigger: "#harta", start: "top 65%", once: true,
      onEnter: () => {
        /* Plansa intră ca un tot. Nu animăm elementele una câte una:
           dacă un tween se blochează, harta rămâne invisibilă — preț
           mult prea mare pentru o intrare. */
        gsap.fromTo(".map__stage",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
            clearProps: "opacity,transform" });
      }
    });

  });

  /* --- bara de sus apare după ce hero-ul iese din cadru --- */
  ScrollTrigger.create({
    start: "top -120",
    onUpdate: self => $("#topbar").classList.toggle("is-visible", self.scroll() > 120),
    onRefresh: self => $("#topbar").classList.toggle("is-visible", self.scroll() > 120)
  });
}

/* ============================================================
   9. PAGINA SE DESCHIDE DE SUS
   ============================================================ */
/* Browserul reține unde ai rămas și resetează singur `scrollRestoration`
   pe „auto” după ce finalizează intrarea din istoric — deci nu e de ajuns
   să i-o cerem o dată. Insistăm la câteva momente cheie, dar ne oprim în
   clipa în care atingi tu ecranul: n-are rost să te tragem înapoi sus
   dacă deja citești. */
function startAtTop() {
  if (location.hash) return;

  let userMoved = false;
  const mark = () => { userMoved = true; };
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e =>
    window.addEventListener(e, mark, { passive: true, once: true }));

  const manual = () => {
    try {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    } catch (_) {}
  };

  const top = () => {
    if (userMoved || window.scrollY === 0) return;
    // „instant”, altfel scroll-behavior: smooth ar anima drumul înapoi
    try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }
    catch (_) { window.scrollTo(0, 0); }
  };

  /* Reîncercările la momente fixe pierd cursa pe telefon: browserul
     restaurează poziția când vrea el, de multe ori după ce imaginile
     s-au încărcat și pagina a crescut. Așa că nu mai ghicim momentul —
     ascultăm derularea însăși. Orice mișcare pe care n-a făcut-o
     utilizatorul e anulată pe loc. Garda se ridică la 2,5 secunde după
     ce pagina e complet încărcată, sau la prima atingere. */
  const guard = () => { if (!userMoved) top(); };
  window.addEventListener("scroll", guard, { passive: true });

  const release = () =>
    setTimeout(() => window.removeEventListener("scroll", guard), 2500);
  if (document.readyState === "complete") release();
  else window.addEventListener("load", release, { once: true });

  manual(); top();

  // revenirea în filă din memoria de fundal a telefonului
  window.addEventListener("pageshow", ev => { if (ev.persisted) { manual(); top(); } });
}

/* ============================================================
   10. BARA DE PROGRES
   ============================================================ */
function mountProgress() {
  const bar = $("#progress i");
  if (!bar) return;

  let ticking = false;
  const draw = () => {
    ticking = false;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    bar.style.transform = `scaleX(${p})`;
  };

  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(draw);
  }, { passive: true });

  addEventListener("resize", draw, { passive: true });
  draw();
}

/* ============================================================
   11. PORNIRE
   ============================================================ */
function boot() {
  startAtTop();
  mountProgress();
  mountVideo();
  mountFigures();
  mountHeroWeb();

  const mapRoot = $("#harta .map");
  const map = new BoardMap(mapRoot);
  map.bind(renderDrawer);

  initDrawer(map);
  mountFilters(map);

  mountTimeline(id => {
    document.getElementById("harta").scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" });
    map.select({ type: "node", id });
    map.focus(id, 1.7);
  });

  map.bindFullscreen($("#map-full"));

  document.addEventListener("keydown", ev => {
    if (ev.key === "Escape") map.clear();
  });

  animate(map);

  /* Plansa are 148 de imagini. Până se încarcă, înălțimea paginii se tot
     schimbă, iar ScrollTrigger ajunge să calculeze declanșări imposibile
     (start negativ). Remăsurăm după ce totul e pe ecran. */
  const remeasure = () => { if (ScrollTrigger) ScrollTrigger.refresh(); };
  window.addEventListener("load", remeasure);

  const imgs = $$(".board .sprite");
  let pending = imgs.filter(i => !i.complete).length;
  if (pending) {
    imgs.forEach(i => {
      if (i.complete) return;
      const done = () => { if (--pending === 0) remeasure(); };
      i.addEventListener("load", done, { once: true });
      i.addEventListener("error", done, { once: true });
    });
  }

  /* Plasă de siguranță: nimic din ce e decorativ nu are voie să lase
     harta ascunsă. Dacă un tween rămâne agățat, curățăm opacitatea. */
  setTimeout(() => {
    $$(".board .sprite, .board .wire").forEach(el => {
      if (el.style.opacity !== "" && parseFloat(el.style.opacity) < 1) {
        el.style.opacity = "";
      }
    });
  }, 4000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
