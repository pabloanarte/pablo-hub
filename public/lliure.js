// Editor lliure de diapositives (window.DKL), com a Canva. El fa servir sections/decks.js amb les diapositives de tipus «lliure»
// (deck.js les dibuixa i, amb DK.aLliure, converteix una maqueta en elements solts).
// Clic: seleccionar · arrossegar: moure (s'imanta al centre, a les vores i als altres elements; Alt per no imantar)
// · nanses: mida i gir · clic a un text ja triat o doble clic: escriure · doble clic a una imatge: reenquadrar
// · Supr: esborrar · fletxes: moure (Maj ×10) · ⌘Z / ⌘⇧Z · ⌘D duplicar · ⌘C / ⌘V · Alt+clic: l'element de sota.
window.DKL = (() => {
  const E = DK.E, uid = () => Math.random().toString(36).slice(2, 9), imgUrl = id => "/api/archivo/" + id;
  let S = null, doc = null, host = null, k = 1, hk = {}, sel = null, edit = null, crop = false, clip = null, dr = null;
  let hist = [], refer = [], snapK = "", snapT = 0, tFl = 0, flT = 0, editPre = null; const HIST = {};
  const tx = e => e && (e.t === "text" || e.t === "num");
  const EL = id => S && (S.els || []).find(e => e.id === id);
  const node = id => host && host.querySelector(`.dk [data-e="${id}"]`);
  const alt = e => { if (!tx(e)) return +e.h || 1; const n = node(e.id); return n ? n.offsetHeight : (+e.h || 40) };
  const viu = () => host && host.isConnected && S && S.tipus === "lliure" && !document.getElementById("s-decks").hidden;
  const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n };
  const r1 = v => Math.round(v * 10) / 10;
  const hex = c => { if (!c) return "#000000"; if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase(); if (/^#[0-9a-f]{3}$/i.test(c)) return "#" + c.slice(1).split("").map(x => x + x).join(""); const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return "#000000"; return "#" + m[1].split(",").slice(0, 3).map(x => Math.round(+x).toString(16).padStart(2, "0")).join("") };

  // ---------- historial ----------
  function snap() { if (!S) return; hist.push(JSON.stringify(S.els)); if (hist.length > 80) hist.shift(); refer = []; setTimeout(refBarra) }
  function refBarra() { const b = document.querySelector("#dkpf .dkllu"); if (b) b.outerHTML = barra() }
  function desfer(r) { const a = r ? refer : hist, b = r ? hist : refer; if (!a.length) return H.toast(r ? "Res a refer" : "Res a desfer"); b.push(JSON.stringify(S.els)); S.els = JSON.parse(a.pop()); if (sel && !EL(sel)) sel = null; edit = null; hk.canvi(); hk.panel() }

  // ---------- muntar sobre la vista prèvia ----------
  function lliga(d, s) { if (s.id !== (S && S.id) || d !== doc) { if (S && doc === d) HIST[S.id] = [hist, refer]; if (d !== doc) for (const x in HIST) delete HIST[x]; sel = null; edit = null; crop = false; [hist, refer] = HIST[s.id] || [[], []] } S = s; doc = d; S.els = S.els || [] }
  function monta(p, d, s, kk, hooks) {
    lliga(d, s); host = p; k = kk; hk = hooks;
    const w = p.querySelector(".dkw"); if (!w) return;
    const box = document.createElement("div"); box.className = "dkllw"; w.replaceWith(box); box.appendChild(w);
    w.classList.add("dkll"); w.style.setProperty("--k", k);
    const ov = document.createElement("div"); ov.className = "dkov"; box.appendChild(ov);
    if (sel && !EL(sel)) sel = null;
    dibSel();
    if (edit) { const id = edit; edit = null; obreEdit(id, true) }
  }
  function dibSel(guies = []) {
    const ov = host && host.querySelector(".dkov"); if (!ov) return;
    const e = EL(sel), g = guies.map(x => x.v ? `<div class="gd v" style="left:${x.p * k}px"></div>` : `<div class="gd h" style="top:${x.p * k}px"></div>`).join("");
    if (!e) { ov.innerHTML = g; return }
    const sw = e.w * k, sh = alt(e) * k, petit = sw < 44 || sh < 44, linia = !tx(e) && (e.h <= 8 || e.w <= 8);
    const hs = edit || e.lk ? [] : linia ? (e.h <= 8 ? ["w", "e"] : ["n", "s"]) : petit ? (tx(e) ? ["e"] : ["se"]) : tx(e) ? ["nw", "ne", "sw", "se", "e", "w"] : ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    const gira = !edit && !e.lk && !petit && !linia;
    const ctx = dr || edit ? "" : (() => { const [, Hh] = DK.mida(doc), baix = e.y * k + sh + 14, y = baix + 40 <= Hh * k || e.y * k < 90 ? Math.min(baix, Hh * k + 8) : e.y * k - 86; const [Ww] = DK.mida(doc), cx = Math.max(110, Math.min(Ww * k - 110, (e.x + e.w / 2) * k)); return `<div class="dkctx" style="left:${cx}px;top:${y}px">${e.t === "text" && !e.lk ? `<button data-lk="escriu">Escriure</button>` : ""}${e.t === "img" && e.img && e.fit !== "contain" ? `<button data-lk="crop">${crop ? "Fet" : "Reenquadrar"}</button>` : ""}<button data-lk="dup">Duplicar</button><button data-lk="z" data-v="top">Al davant</button><button data-lk="z" data-v="bottom">Al darrere</button>${e.lk ? `<button data-lk="lk">Desbloquejar</button>` : `<button class="del" data-lk="treu">Esborrar</button>`}${window.innerWidth < 1100 ? `<button data-lk="mes">Més ↓</button>` : ""}</div>` })();
    ov.innerHTML = g + `<div class="dkbx${e.lk ? " lk" : ""}${edit ? " ed" : ""}${crop ? " crop" : ""}" style="left:${e.x * k}px;top:${e.y * k}px;width:${sw}px;height:${sh}px;transform:rotate(${e.r || 0}deg)">${hs.map(h => `<i class="dkh h-${h}" data-h="${h}"></i>`).join("")}${gira ? `<i class="dkh hr" data-h="rot" title="Girar"></i>` : ""}</div>` + ctx;
  }
  function pinta(e) { const n = node(e.id); if (!n) return; const t = document.createElement("div"); t.innerHTML = DK.elHTML(e, { url: imgUrl, n: hk.n }); n.replaceWith(t.firstElementChild); if (tx(e)) e.h = alt(e) }
  const sincro = () => { const e = EL(sel); if (!e) return; document.querySelectorAll("#dkpf [data-lp]").forEach(i => { const p = i.dataset.lp; if (["x", "y", "w", "h", "r", "fs"].includes(p) && document.activeElement !== i) i.value = Math.round(+e[p] || 0); if (p === "ls" && document.activeElement !== i) i.value = Math.round((+e.ls || 0) * 10) / 10 }) };

  // ---------- punter ----------
  const punt = ev => { const w = host.querySelector(".dkw").getBoundingClientRect(); return { x: (ev.clientX - w.left) / k, y: (ev.clientY - w.top) / k } };
  function imant(e, x, y, h, lliure) {
    if (lliure) return { x, y, l: [] };
    const [W, Hh] = DK.mida(doc), th = Math.min(7 / k, 14), cx = [0, W / 2, W], cy = [0, Hh / 2, Hh];
    S.els.forEach(o => { if (o.id === e.id) return; const oh = alt(o); cx.push(o.x, o.x + o.w / 2, o.x + o.w); cy.push(o.y, o.y + oh / 2, o.y + oh) });
    const best = (ts, vs) => { let b = null; ts.forEach(t => vs.forEach(v => { const d = t - v; if (Math.abs(d) < th && (!b || Math.abs(d) < Math.abs(b.d))) b = { d, t } })); return b };
    const bx = best(cx, [x, x + e.w / 2, x + e.w]), by = best(cy, [y, y + h / 2, y + h]);
    return { x: x + (bx ? bx.d : 0), y: y + (by ? by.d : 0), l: [bx && { v: 1, p: bx.t }, by && { v: 0, p: by.t }].filter(Boolean) };
  }
  function down(ev) {
    if (!viu() || ev.button > 0) return;
    const w = host.querySelector(".dkw"), h = ev.target.closest(".dkov .dkh");
    if (h) { const e = EL(sel); if (!e || e.lk) return; ev.preventDefault(); ev.stopPropagation(); dr = { m: h.dataset.h, e, o: { ...e }, p: punt(ev), nh: alt(e), mou: false }; return }
    let t = w.contains(ev.target) ? ev.target.closest("[data-e]") : null;
    if (ev.target.closest(".dkctx")) return;
    if (edit) { if (t && t.dataset.e === edit) return; if (!ev.target.closest("#dkpf")) tancaEdit() }
    if (!w.contains(ev.target)) return;
    if (t && ev.altKey) { const sota = document.elementsFromPoint(ev.clientX, ev.clientY).map(x => x.closest && x.closest(".dkll [data-e]")).filter((x, i, a) => x && a.indexOf(x) === i), i = sota.findIndex(x => x.dataset.e === sel); t = sota[(i + 1) % sota.length] || t }
    if (!t) { if (sel) { sel = null; crop = false; dibSel(); hk.panel() } return }
    const e = EL(t.dataset.e); if (!e) return;
    ev.preventDefault();
    const ja = sel === e.id; if (!ja) { sel = e.id; crop = false; dibSel(); hk.panel() }
    dr = { m: crop && ja && e.t === "img" ? "crop" : "move", e, o: { ...e }, p: punt(ev), ja, nh: alt(e), mou: false };
  }
  function move(ev) {
    if (!dr) return; ev.preventDefault();
    const p = punt(ev), dx = p.x - dr.p.x, dy = p.y - dr.p.y, e = dr.e, o = dr.o;
    if (!dr.mou) { if (Math.hypot(dx, dy) * k < 3) return; dr.mou = true; snap() }
    let gl = [];
    if (dr.m === "move") { if (e.lk) return; const g = imant(e, o.x + dx, o.y + dy, dr.nh, ev.altKey); e.x = r1(g.x); e.y = r1(g.y); gl = g.l }
    else if (dr.m === "crop") { const z = Math.max(1, +e.zm || 1); e.px = Math.max(0, Math.min(100, Math.round((o.px ?? 50) - dx / e.w * 100 / z * 1.6))); e.py = Math.max(0, Math.min(100, Math.round((o.py ?? 50) - dy / (e.h || 1) * 100 / z * 1.6))) }
    else if (dr.m === "rot") { const c = { x: o.x + o.w / 2, y: o.y + dr.nh / 2 }; let a = Math.atan2(p.y - c.y, p.x - c.x) * 180 / Math.PI + 90; a = ((a % 360) + 360) % 360; if (ev.shiftKey) a = Math.round(a / 15) * 15; else { const m = Math.round(a / 45) * 45; if (Math.abs(a - m) < 4) a = m } e.r = Math.round(a) % 360 }
    else { // canviar la mida (en l'eix de l'element, encara que estigui girat)
      const d = dr.m, a = -(o.r || 0) * Math.PI / 180, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a), oh = dr.nh;
      let w = o.w, h = oh;
      if (d.includes("e")) w = o.w + lx; if (d.includes("w")) w = o.w - lx; if (d.includes("s")) h = oh + ly; if (d.includes("n")) h = oh - ly;
      w = Math.max(12, w); h = Math.max(6, h);
      const cant = d.length === 2;
      if (tx(e)) {
        if (cant) { const f = w / o.w; e.w = r1(o.w * f); e.fs = r1(Math.max(4, (o.fs || 30) * f)); if (o.ls) e.ls = r1(o.ls * f); if (d.includes("n")) e.y = r1(o.y + oh - oh * f) }
        else { e.w = r1(w); delete e.nw }
        if (d.includes("w")) e.x = r1(o.x + o.w - e.w);
      } else {
        if (cant && ((e.t !== "forma") !== ev.shiftKey)) { const f = Math.max(w / o.w, h / oh); w = o.w * f; h = oh * f }
        e.w = r1(w); e.h = r1(h); if (d.includes("w")) e.x = r1(o.x + o.w - w); if (d.includes("n")) e.y = r1(o.y + oh - h);
      }
    }
    pinta(e); dibSel(gl); sincro();
  }
  function up() {
    if (!dr) return; const d = dr; dr = null;
    if (d.mou) { dibSel(); hk.canvi(); return }
    if (d.ja && d.m === "move" && d.e.t === "text" && !d.e.lk) obreEdit(d.e.id);
  }

  // ---------- escriure dins d'un text ----------
  const pla = n => { let o = ""; n.childNodes.forEach((c, i) => { if (c.nodeType === 3) o += c.nodeValue; else if (c.nodeName === "BR") o += "\n"; else if (c.nodeType === 1) { if (/^(DIV|P)$/.test(c.nodeName) && i && !o.endsWith("\n")) o += "\n"; o += pla(c) } }); return o };
  function obreEdit(id, reobre) {
    const n = node(id), e = EL(id); if (!n || !e || e.t !== "text" || e.lk) return;
    if (!reobre) editPre = JSON.stringify(S.els); edit = id; sel = id; dibSel();
    n.contentEditable = "plaintext-only"; if (n.contentEditable !== "plaintext-only") n.contentEditable = "true";
    n.classList.add("eded"); n.focus({ preventScroll: true });
    if (!reobre) { const r = document.createRange(); r.selectNodeContents(n); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }
    n.addEventListener("input", () => { e.text = pla(n).replace(/\n$/, ""); if (e.text.includes("\n")) delete e.nw; e.h = n.offsetHeight; dibSel(); const ta = document.querySelector('#dkpf [data-lp="text"]'); if (ta) ta.value = e.text });
    n.addEventListener("paste", ev => { ev.preventDefault(); document.execCommand("insertText", false, (ev.clipboardData || window.clipboardData).getData("text/plain")) });
    n.addEventListener("blur", () => setTimeout(() => { if (edit === id && document.activeElement !== node(id)) tancaEdit() }, 0));
  }
  function tancaEdit() { const id = edit; if (!id) return; edit = null; const n = node(id), e = EL(id); if (n) { if (e) e.text = pla(n).replace(/\n$/, ""); n.contentEditable = "false"; n.classList.remove("eded") } if (editPre && editPre !== JSON.stringify(S.els)) { hist.push(editPre); refer = []; setTimeout(refBarra) } editPre = null; dibSel(); hk.canvi() }

  // ---------- accions ----------
  function afegeix(e, editar) { snap(); e.id = uid(); S.els.push(e); sel = e.id; crop = false; hk.canvi(); hk.panel(); if (editar) setTimeout(() => obreEdit(e.id), 30) }
  function nouText(gran) {
    const [W, Hh] = DK.mida(doc), t = DK.tema(doc), w = gran ? Math.min(1100, W * .8) : Math.min(800, W * .6), fs = gran ? 96 : 40;
    afegeix({ t: "text", text: gran ? "Títol" : "Escriu aquí", x: r1((W - w) / 2), y: r1(Hh / 2 - fs * .6), w: r1(w), ff: DK.FONTS[t.font] || DK.FONTS.Helvetica, fs, fw: gran ? String(t.tw || 700) : "400", col: t.fg, al: "center", tt: gran ? t.tt : "none", ls: 0, lh: gran ? 1 : 1.4 }, 1);
  }
  function novaForma(f) {
    const [W, Hh] = DK.mida(doc), t = DK.tema(doc), m = Math.min(W, Hh) * .3;
    if (f === "linia") return afegeix({ t: "forma", bg: t.fg, x: r1(W / 2 - m), y: r1(Hh / 2), w: r1(m * 2), h: 3 });
    afegeix({ t: "forma", bg: t.ac === t.fg ? t.mut : t.ac, x: r1(W / 2 - m / 2), y: r1(Hh / 2 - m / 2), w: r1(m), h: r1(m), ...(f === "cercle" ? { rad: "50%" } : {}) });
  }
  async function midaImg(id) { try { const im = new Image(); im.src = imgUrl(id); await im.decode(); return im.naturalWidth / im.naturalHeight || 1.5 } catch (e) { return 1.5 } }
  async function novaImg(id, at) {
    const [W, Hh] = DK.mida(doc), r = await midaImg(id); let w = W * .4, h = w / r; if (h > Hh * .7) { h = Hh * .7; w = h * r }
    afegeix({ t: "img", img: id, fit: "cover", x: r1(at ? at.x - w / 2 : (W - w) / 2), y: r1(at ? at.y - h / 2 : (Hh - h) / 2), w: r1(w), h: r1(h) });
  }
  async function puja(files, at) { for (const f of files) { if (!/^image\//.test(f.type)) continue; const id = await R.subirImagen(f); if (id) await novaImg(id, at) } }
  function treu() { const e = EL(sel); if (!e) return; if (e.lk) return H.toast("Està bloquejat: desbloqueja'l per esborrar-lo"); snap(); S.els = S.els.filter(x => x.id !== e.id); sel = null; edit = null; crop = false; hk.canvi(); hk.panel() }
  function duplica(e, d = 24) { if (!e) return; const c = { ...JSON.parse(JSON.stringify(e)), x: r1(e.x + d), y: r1(e.y + d) }; delete c.lk; afegeix(c) }
  function capa(v) { const e = EL(sel); if (!e) return; snap(); const l = S.els, i = l.indexOf(e); l.splice(i, 1); const j = v === "top" ? l.length : v === "bottom" ? 0 : v === "up" ? Math.min(l.length, i + 1) : Math.max(0, i - 1); l.splice(j, 0, e); hk.canvi(); hk.panel() }
  function alinea(v) { const e = EL(sel); if (!e || e.lk) return; snap(); const [W, Hh] = DK.mida(doc), h = alt(e); if (v === "l") e.x = 0; if (v === "c") e.x = r1((W - e.w) / 2); if (v === "r") e.x = r1(W - e.w); if (v === "t") e.y = 0; if (v === "m") e.y = r1((Hh - h) / 2); if (v === "b") e.y = r1(Hh - h); hk.canvi(); sincro() }

  // ---------- panell ----------
  const NOMS = { text: "Text", num: "Número de pàgina", img: "Imatge", forma: "Forma", svg: "Dibuix" };
  const resum = e => e.t === "text" ? (e.text || "").split("\n")[0].slice(0, 34) || "Text buit" : e.t === "img" ? (e.img ? "Imatge" : "Espai per a imatge") : e.t === "forma" ? (e.rad === "50%" ? "Cercle" : e.h <= 6 || e.w <= 6 ? "Línia" : "Forma") : NOMS[e.t];
  const ICO = { text: "T", num: "#", img: "▣", forma: "■", svg: "✦" };
  const inp = (p, l, v, a = "") => `<label class="dkllf"><span>${l}</span><input data-lp="${p}" value="${E(v)}" inputmode="decimal" ${a}></label>`;
  const barra = () => `<div class="dkllu"><button class="b2" data-lk="undo" ${hist.length ? "" : "disabled"} title="⌘Z / Ctrl+Z">↶ Desfer</button><button class="b2" data-lk="redo" ${refer.length ? "" : "disabled"} title="⌘⇧Z / Ctrl+Y">↷ Refer</button>${clip ? `<button class="b2" data-lk="paste">Enganxar</button>` : ""}${sel ? `<button class="b2" data-lk="copy">Copiar</button>` : ""}</div>`;
  function panel(d, s) {
    if (d && s) lliga(d, s);
    const e = EL(sel);
    if (!e) {
      const t = DK.tema(doc);
      return barra() + `<p class="dkllh">Fes clic en un element per triar-lo i torna-hi a fer clic per escriure. Arrossega'l per moure'l.</p>
        <label>Afegir</label><div class="dkllb"><button class="b2" data-lk="nt" data-v="1">Títol</button><button class="b2" data-lk="nt">Text</button><label class="b2">Imatge<input type="file" accept="image/*" multiple data-lup="nou" hidden></label>${window.MED ? `<button class="b2" data-lk="refnou">De les referències</button>` : ""}</div><div class="dkllb" style="margin-top:6px"><button class="b2" data-lk="nf" data-v="rect">▭ Rectangle</button><button class="b2" data-lk="nf" data-v="cercle">◯ Cercle</button><button class="b2" data-lk="nf" data-v="linia">— Línia</button></div>
        <label>Fons de la diapositiva</label><div class="dkllcr"><input type="color" class="dkcl" data-lp="sbg" value="${hex(S.bg || t.bg)}"><input data-lp="sbgt" value="${E(hex(S.bg || t.bg))}"></div>
        <label>Elements (el de dalt tapa els de sota)</label><div class="dkllc">${S.els.slice().reverse().map(x => `<div class="r" data-lk="tria" data-v="${x.id}"><i class="ico">${ICO[x.t] || "•"}</i><div class="g"><b>${E(resum(x))}</b><small>${E([NOMS[x.t] !== resum(x) ? NOMS[x.t] : "", x.lk ? "bloquejat" : ""].filter(Boolean).join(" · "))}</small></div></div>`).join("") || `<p class="em">Cap element.</p>`}</div>
        ${S.orig ? `<button class="b2" data-lk="orig" style="margin-top:14px">Tornar a la maqueta original</button><small style="display:block;margin-top:6px">Es perden els canvis fets en mode lliure.</small>` : ""}`;
    }
    const pos = `<label>Posició i mida (px)</label><div class="dkllg">${inp("x", "X", Math.round(e.x))}${inp("y", "Y", Math.round(e.y))}${inp("w", "Ample", Math.round(e.w))}${tx(e) ? "" : inp("h", "Alt", Math.round(e.h))}${inp("r", "Gir °", e.r || 0)}</div>
      <label>Opacitat</label><input type="range" min="0" max="100" data-lp="op" value="${Math.round((e.op ?? 1) * 100)}">
      <label>Situar a la diapositiva</label><div class="seg dklla">${[["l", "Esquerra"], ["c", "Centre"], ["r", "Dreta"], ["t", "Dalt"], ["m", "Mig"], ["b", "Baix"]].map(([v, l]) => `<button class="t" data-lk="ali" data-v="${v}">${l}</button>`).join("")}</div>
      <label>Ordre</label><div class="seg dklla c2">${[["top", "Al davant"], ["up", "Un amunt"], ["down", "Un avall"], ["bottom", "Al darrere"]].map(([v, l]) => `<button class="t" data-lk="z" data-v="${v}">${l}</button>`).join("")}</div>`;
    let p = "";
    if (e.t === "text" || e.t === "num") {
      const fonts = Object.entries(DK.FONTS), cur = fonts.find(([, v]) => v === e.ff);
      p = (e.t === "text" ? `<label>Text</label><textarea data-lp="text" rows="3">${E(e.text || "")}</textarea>` : `<p class="dkllh">Mostra el número de la diapositiva.</p>`) +
        `<label>Tipografia</label><select data-lp="ff">${cur ? "" : `<option value="${E(e.ff || "")}" selected>${E(String(e.ff || "Actual").split(",")[0].replace(/['"]/g, ""))}</option>`}${fonts.map(([n, v]) => `<option value="${E(v)}" ${v === e.ff ? "selected" : ""}>${E(n)}</option>`).join("")}</select>
        <div class="dkllg">${inp("fs", "Mida", Math.round(e.fs || 30))}<label class="dkllf"><span>Color</span><input type="color" data-lp="col" value="${hex(e.col)}"></label></div>
        <div class="seg dklla c2"><button class="t ${+e.fw >= 600 || e.fw === "bold" ? "on" : ""}" data-lk="bold"><b>Negreta</b></button><button class="t ${e.it ? "on" : ""}" data-lk="it"><i>Cursiva</i></button></div>
        <label>Alineació del text</label><div class="seg dklla c2">${[["left", "Esquerra"], ["center", "Centre"], ["right", "Dreta"], ["justify", "Justificat"]].map(([v, l]) => `<button class="t ${(e.al || "left") === v ? "on" : ""}" data-lk="al" data-v="${v}">${l}</button>`).join("")}</div>
        <label>Majúscules</label><select data-lp="tt">${[["none", "Tal com l'escric"], ["uppercase", "MAJÚSCULES"], ["lowercase", "minúscules"], ["capitalize", "Inicials En Majúscula"]].map(([v, l]) => `<option value="${v}" ${(e.tt || "none") === v ? "selected" : ""}>${l}</option>`).join("")}</select>
        <div class="dkllg">${inp("ls", "Espaiat", Math.round((e.ls || 0) * 10) / 10)}${inp("lh", "Interlineat", e.lh || 1.2)}${inp("cols", "Columnes", e.cols || 1)}</div>
        <label class="ck"><input type="checkbox" data-lp="tsh" ${e.sh ? "checked" : ""}> Ombra</label>`;
    }
    if (e.t === "img") p = `<div class="dkim">${e.img ? `<div class="th" style="background-image:url('${imgUrl(e.img)}')"></div>` : ""}<label class="b2" style="margin:0">${e.img ? "Canviar" : "Pujar imatge"}<input type="file" accept="image/*" data-lup="img" hidden></label>${window.MED ? `<button class="b2" data-lk="refs">De les referències</button>` : ""}</div>
      ${e.img ? `<label>Ajust</label><div class="seg dklla c2"><button class="t ${e.fit !== "contain" ? "on" : ""}" data-lk="fit" data-v="cover">Omplir el requadre</button><button class="t ${e.fit === "contain" ? "on" : ""}" data-lk="fit" data-v="contain">Sencera</button></div>
      <button class="b2 ${crop ? "on" : ""}" data-lk="crop" style="margin-top:10px">${crop ? "Fet" : "Reenquadrar (o doble clic)"}</button>
      <label>Zoom</label><input type="range" min="100" max="300" data-lp="zm" value="${Math.round((+e.zm || 1) * 100)}">
      <button class="b2" data-lk="noimg" style="margin-top:8px">Treure la imatge (deixar l'espai)</button>` : ""}`;
    if (e.t === "forma") p = /gradient/.test(e.bg || "") ? `<p class="dkllh">Té un degradat.</p><button class="b2" data-lk="pla">Fer-la d'un sol color</button>` : `<label class="dkllf"><span>Color</span><input type="color" data-lp="bg" value="${hex(/transparent|rgba\([^)]*,\s*0\)/.test(e.bg || "") ? "#ffffff" : e.bg)}"></label>`;
    if (e.t === "svg") p = `<label class="dkllf"><span>Color</span><input type="color" data-lp="col" value="${hex(e.col)}"></label>`;
    if (e.t === "img" || e.t === "forma") { const bd = String(e.bd || "").match(/^([\d.]+)px\s+\w+\s+(.+)$/); p += `<label>Cantonades</label><input type="range" min="0" max="${Math.round(Math.min(e.w, e.h) / 2)}" data-lp="rad" value="${e.rad === "50%" ? Math.round(Math.min(e.w, e.h) / 2) : parseFloat(e.rad) || 0}">
      <div class="dkllg">${inp("bdw", "Vora", bd ? +bd[1] : 0)}<label class="dkllf"><span>Color de la vora</span><input type="color" data-lp="bdc" value="${hex(bd ? bd[2] : "#000000")}"></label></div>${e.t === "img" ? `<label class="ck"><input type="checkbox" data-lp="bsh" ${e.sh ? "checked" : ""}> Ombra</label>` : ""}`; }
    return barra() + `<div class="dkllt"><button class="b2" data-lk="desel">‹ Diapositiva</button><b>${E(NOMS[e.t] || "Element")}</b></div>${p}${pos}
      <div class="sfoot"><button class="del" data-lk="treu">Esborrar</button><span><button class="b2" data-lk="lk">${e.lk ? "Desbloquejar" : "Bloquejar"}</button> <button class="b2" data-lk="dup">Duplicar</button></span></div>`;
  }

  // ---------- esdeveniments ----------
  window.addEventListener("pointerdown", down, true);
  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  document.addEventListener("dblclick", ev => { if (!viu() || document.querySelector(".hdlg")) return; const t = ev.target.closest(".dkll [data-e]"); if (!t) return; const e = EL(t.dataset.e); if (!e) return; if (e.t === "img" && e.img && e.fit !== "contain") { crop = !crop; sel = e.id; dibSel(); hk.panel(); if (crop) H.toast("Arrossega la imatge per reenquadrar-la. Doble clic per acabar.") } else if (e.t === "text" && edit !== e.id && !e.lk) obreEdit(e.id) });
  document.addEventListener("dragover", ev => { if (viu() && ev.target.closest(".dkll") && [...(ev.dataTransfer.items || [])].some(i => i.kind === "file")) ev.preventDefault() });
  document.addEventListener("drop", ev => { if (!viu() || !ev.target.closest(".dkll") || !ev.dataTransfer.files.length) return; ev.preventDefault(); puja([...ev.dataTransfer.files], punt(ev)) });
  document.addEventListener("keydown", ev => {
    if (!viu() || !document.getElementById("hsh").hidden || document.querySelector(".hdlg")) return;
    if (edit) { if (ev.key === "Escape") { ev.preventDefault(); const n = node(edit); n && n.blur(); tancaEdit() } return }
    const a = document.activeElement; if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return;
    const m = ev.metaKey || ev.ctrlKey, key = ev.key.toLowerCase(), e = EL(sel);
    if (m && key === "z") { ev.preventDefault(); return desfer(ev.shiftKey) }
    if (m && key === "y") { ev.preventDefault(); return desfer(true) }
    if (m && key === "v" && clip) { ev.preventDefault(); const c = JSON.parse(clip); return duplica(c, c._de === S.id ? 24 : 0) }
    if (!e) return;
    if (m && key === "c") { ev.preventDefault(); clip = JSON.stringify({ ...e, _de: S.id }); H.toast("Copiat"); return hk.panel() }
    if (m && key === "d") { ev.preventDefault(); return duplica(e) }
    if (key === "backspace" || key === "delete") { ev.preventDefault(); return treu() }
    if (key === "escape") { ev.preventDefault(); sel = null; crop = false; dibSel(); return hk.panel() }
    if (key === "enter" && e.t === "text" && !e.lk) { ev.preventDefault(); return obreEdit(e.id) }
    const mv = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[key];
    if (mv && !e.lk) { ev.preventDefault(); if (Date.now() - flT > 1200) snap(); flT = Date.now(); const f = ev.shiftKey ? 10 : 1; e.x = r1(e.x + mv[0] * f); e.y = r1(e.y + mv[1] * f); pinta(e); dibSel(); sincro(); clearTimeout(tFl); tFl = setTimeout(() => hk.canvi(), 400) }
  });
  const sec = () => document.getElementById("s-decks");
  document.addEventListener("click", async ev => {
    const b = ev.target.closest("[data-lk]"); if (!b || !viu() || !sec().contains(b)) return;
    const v = b.dataset.v, e = EL(sel), K = b.dataset.lk;
    if (K === "nt") return nouText(!!v);
    if (K === "nf") return novaForma(v);
    if (K === "refnou") { const ids = await MED.tria({ proj: doc.proyecto, multi: true }); for (const id of ids) await novaImg(id); return }
    if (K === "undo" || K === "redo") return desfer(K === "redo");
    if (K === "paste" && clip) { const c = JSON.parse(clip); return duplica(c, c._de === S.id ? 24 : 0) }
    if (K === "tria") { sel = v; crop = false; dibSel(); return hk.panel() }
    if (K === "orig") { const id = S.id; if (await H.confirma("Tornar a la maqueta original? Es perdran els canvis fets en mode lliure.", { ok: "Tornar-hi", perill: 1 })) hk.maqueta(id); return }
    if (K === "desel") { sel = null; crop = false; dibSel(); return hk.panel() }
    if (!e) return;
    if (K === "copy") { clip = JSON.stringify({ ...e, _de: S.id }); H.toast("Copiat"); return hk.panel() }
    if (K === "treu") return treu();
    if (K === "dup") return duplica(e);
    if (K === "z") return capa(v);
    if (K === "ali") return alinea(v);
    if (K === "crop") { crop = !crop; dibSel(); return hk.panel() }
    if (K === "escriu") return obreEdit(e.id);
    if (K === "mes") { const f = document.getElementById("dkpf"); return f && f.scrollIntoView({ behavior: "smooth", block: "start" }) }
    snap();
    if (K === "lk") { if (e.lk) delete e.lk; else e.lk = 1 }
    if (K === "bold") e.fw = +e.fw >= 600 || e.fw === "bold" ? "400" : "700";
    if (K === "it") e.it = e.it ? 0 : 1;
    if (K === "al") e.al = v;
    if (K === "fit") e.fit = v;
    if (K === "noimg") { e.img = ""; crop = false }
    if (K === "pla") e.bg = DK.tema(doc).ac;
    if (K === "refs") { const ids = await MED.tria({ proj: doc.proyecto, multi: false }); if (!ids.length) return; e.img = ids[0]; e.px = e.py = 50; e.zm = 1 }
    hk.canvi(); hk.panel();
  });
  document.addEventListener("input", ev => {
    const t = ev.target, p = t.dataset && t.dataset.lp; if (!p || !viu() || !sec().contains(t)) return;
    if (p === "sbg" || p === "sbgt") { if (p === "sbgt" && !/^#[0-9a-f]{6}$/i.test(t.value.trim())) return; if (snapK !== "bg" + S.id || Date.now() - snapT > 1500) snap(); snapK = "bg" + S.id; snapT = Date.now(); S.bg = t.value.trim(); const o = document.querySelector(`#dkpf [data-lp="${p === "sbg" ? "sbgt" : "sbg"}"]`); if (o) o.value = S.bg; return hk.canvi() }
    const e = EL(sel); if (!e) return;
    if (e.lk && ["x", "y", "w", "h", "r"].includes(p)) { t.value = Math.round(+e[p] || 0); return H.toast("Està bloquejat") }
    if (snapK !== p + sel || Date.now() - snapT > 1500) snap(); snapK = p + sel; snapT = Date.now();
    const v = t.value;
    if (["x", "y", "w", "h", "r", "fs", "ls"].includes(p)) { e[p] = num(v); if (p === "w") delete e.nw; if (p === "w" || p === "h") e[p] = Math.max(1, e[p]); if (p === "fs") e.fs = Math.max(4, e.fs) }
    else if (p === "lh") e.lh = Math.max(.5, num(v)) || 1.2;
    else if (p === "cols") { const c = Math.round(num(v)); if (c > 1) e.cols = Math.min(4, c); else delete e.cols }
    else if (p === "op") { e.op = Math.round(+v) / 100; if (e.op >= 1) delete e.op }
    else if (p === "zm") { e.zm = +v / 100; if (e.zm <= 1) delete e.zm }
    else if (p === "rad") { const r = +v; if (r >= Math.min(e.w, e.h) / 2 - .5 && e.rad === "50%") return; e.rad = r || 0; if (!r) delete e.rad }
    else if (p === "bdw" || p === "bdc") { const g = document.querySelector('#dkpf [data-lp="bdw"]'), c = document.querySelector('#dkpf [data-lp="bdc"]'), w = num(g ? g.value : 0); if (w > 0) e.bd = `${w}px solid ${c ? c.value : "#000"}`; else delete e.bd }
    else if (p === "tsh") { if (t.checked) e.sh = "0 2px 16px rgba(0,0,0,.45)"; else delete e.sh }
    else if (p === "bsh") { if (t.checked) e.sh = "0 8px 30px rgba(0,0,0,.25)"; else delete e.sh }
    else e[p] = v; // text, ff, tt, col, bg
    pinta(e); dibSel(); clearTimeout(tDesa); tDesa = setTimeout(() => hk.canvi(), 250);
  });
  let tDesa = 0;
  document.addEventListener("change", async ev => {
    const t = ev.target; if (!t.dataset || !t.dataset.lup || !viu() || !t.files.length) return;
    if (t.dataset.lup === "nou") return puja([...t.files]);
    const e = EL(sel); if (!e) return; const id = await R.subirImagen(t.files[0]); if (!id) return;
    snap(); e.img = id; e.px = e.py = 50; delete e.zm; hk.canvi(); hk.panel();
  });

  return { monta, panel, actiu: () => !!(viu() && sel), triat: () => !!EL(sel), desfer };
})();
