// Decks: dossiers i presentacions. Editor de diapositives amb estils, «Omplir per apartats» (vista prèvia en directe), importar PDF,
// revisió de disseny, exportar (PDF, PNG, JPEG) i enllaç per compartir. Dibuix a deck.js (window.DK).
(() => {
  const { E } = H, el = document.getElementById("s-decks");
  let doc = null, sel = 0, pan = "slide", ver = 0;
  const save = () => H.put(doc);
  const tmp = (d, k, v) => Object.defineProperty(d, k, { value: v, enumerable: false, writable: true, configurable: true }); // no es desa
  const aj = n => n && DK.ajusta(n);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const imgUrl = id => "/api/archivo/" + id;

  // ---------- plantilles de l'assistent ----------
  // Cada categoria: [clau, títol, camps] — camps: [clau, etiqueta, tipus]
  const PL = {
    film: { nom: "Dossier de llargmetratge o curt", cats: [
      ["projecte", "Projecte", [["titol", "Títol", "text"], ["format", "Format i durada (p. ex. Llargmetratge · 95 min)", "text"], ["genere", "Gènere", "text"], ["estat", "Estat (p. ex. En desenvolupament)", "text"], ["portada", "Imatge de portada", "img"]]],
      ["logline", "Logline", [["text", "Logline", "area"]]],
      ["sinopsi", "Sinopsi", [["text", "Sinopsi", "area"]]],
      ["nota", "Nota del director", [["text", "Nota", "area"], ["img", "Foto (opcional)", "img"]]],
      ["personatges", "Personatges", [["items", "Personatges", "items:personatges"]]],
      ["referencies", "Referències visuals", [["imgs", "Imatges", "imgs"]]],
      ["to", "To i estètica", [["text", "Text", "area"], ["img", "Imatge", "img"]]],
      ["fitxa", "Fitxa tècnica", [["format", "Format (p. ex. Digital · 4K)", "text"], ["camera", "Càmera", "text"], ["optiques", "Òptiques", "text"], ["ratio", "Relació d'aspecte", "text"], ["espais", "Càmera per espai (enquadraments, moviment)", "items:espais"]]],
      ["paleta", "Paleta de color", [["auto", "Treure-la de les imatges", "check"], ["colors", "O escriu els colors (#hex)", "area"]]],
      ["equip", "Equip", [["items", "Equip", "items:equip"]]],
      ["produccio", "Producció", [["items", "Dades (pressupost, rodatge, localitzacions…)", "items:dades"]]],
      ["calendari", "Calendari", [["items", "Fases", "items:calendari"]]],
      ["contacte", "Contacte", [["text", "Dades de contacte", "area"]]]] },
    videoclip: { nom: "Tractament de videoclip", cats: [
      ["projecte", "Artista i cançó", [["titol", "Cançó", "text"], ["format", "Artista", "text"], ["estat", "Data de rodatge o estrena", "text"], ["portada", "Imatge de portada", "img"]]],
      ["concepte", "Concepte", [["text", "Concepte", "area"]]],
      ["narrativa", "Narrativa", [["text", "Narrativa", "area"], ["img", "Imatge", "img"]]],
      ["referencies", "Referències", [["imgs", "Imatges", "imgs"]]],
      ["paleta", "Paleta de color", [["auto", "Treure-la de les imatges", "check"], ["colors", "O escriu els colors (#hex)", "area"]]],
      ["fitxa", "Fitxa tècnica", [["format", "Format (p. ex. Digital · 4K)", "text"], ["camera", "Càmera", "text"], ["optiques", "Òptiques", "text"], ["ratio", "Relació d'aspecte", "text"], ["espais", "Càmera per espai (enquadraments, moviment)", "items:espais"]]],
      ["localitzacions", "Localitzacions", [["text", "Text", "area"], ["imgs", "Imatges", "imgs"]]],
      ["vestuari", "Vestuari", [["text", "Text", "area"], ["imgs", "Imatges", "imgs"]]],
      ["casting", "Càsting", [["items", "Persones", "items:personatges"]]],
      ["video", "Referència de vídeo", [["url", "Enllaç", "text"], ["img", "Fotograma", "img"]]],
      ["produccio", "Producció i pressupost", [["items", "Dades", "items:dades"]]],
      ["equip", "Equip", [["items", "Equip", "items:equip"]]],
      ["contacte", "Contacte", [["text", "Dades de contacte", "area"]]]] },
    director: { nom: "Dossier de director", cats: [
      ["projecte", "Portada", [["titol", "Nom", "text"], ["format", "Subtítol (p. ex. director de cine)", "text"], ["portada", "Foto", "img"]]],
      ["bio", "Bio", [["text", "Bio", "area"], ["img", "Foto", "img"]]],
      ["filmografia", "Filmografia", [["items", "Obres", "items:personatges"]]],
      ["festivals", "Festivals i premis", [["text", "Un per línia", "area"]]],
      ["referencies", "Imatges de treballs", [["imgs", "Fotogrames", "imgs"]]],
      ["contacte", "Contacte", [["text", "Dades de contacte", "area"]]]] },
    blanc: { nom: "En blanc", cats: [["projecte", "Portada", [["titol", "Títol", "text"], ["format", "Subtítol", "text"], ["portada", "Imatge", "img"]]]] }
  };
  const ITEMS = { personatges: [["nom", "Nom"], ["text", "Descripció", "area"], ["img", "Imatge", "img"]], equip: [["nom", "Nom"], ["text", "Rol"], ["img", "Foto", "img"]], dades: [["nom", "Etiqueta"], ["text", "Valor"]], laurels: [["nom", "Festival"], ["text", "Secció o premi i any"]], calendari: [["nom", "Fase"], ["a", "Inici", "date"], ["b", "Fi", "date"]], espais: [["nom", "Espai (p. ex. Shisha bar)"], ["text", "Enquadraments i moviment", "area"]] };

  // Converteix les dades de l'assistent en diapositives
  function genera(d) {
    const v = d.dades || {}, g = (c, k) => (v[c] || {})[k], ok = c => v[c] && !v[c].off, S = [], pn = "pablo anarte";
    const p = v.projecte || {};
    S.push({ tipus: "portada", titol: p.titol || d.titulo || "", subtitol: [p.format, p.genere].filter(Boolean).join(" · "), peu: [d.plantilla === "director" ? "" : pn, p.estat].filter(Boolean).join(" · "), img: p.portada || (g("referencies", "imgs") || [])[0] || "" });
    const txt = (c, titol) => ok(c) && g(c, "text") && S.push(g(c, "img") ? { tipus: "imatgetext", titol, text: g(c, "text"), img: g(c, "img"), costat: S.length % 2 } : { tipus: "text", titol, text: g(c, "text") });
    if (ok("logline") && g("logline", "text")) S.push({ tipus: "cita", text: g("logline", "text"), autor: "" });
    if (ok("concepte") && g("concepte", "text")) S.push({ tipus: "cita", text: g("concepte", "text"), autor: "concepte" });
    txt("sinopsi", "sinopsi"); txt("narrativa", "narrativa"); txt("bio", "bio"); txt("nota", "nota del director");
    if (ok("personatges") && (g("personatges", "items") || []).length) S.push({ tipus: "personatges", titol: "personatges", items: g("personatges", "items") });
    if (ok("filmografia") && (g("filmografia", "items") || []).length) S.push({ tipus: "personatges", titol: "filmografia", items: g("filmografia", "items") });
    if (ok("festivals") && g("festivals", "text")) S.push({ tipus: "laurels", titol: "festivals i premis", items: g("festivals", "text").split("\n").filter(x => x.trim()).map(x => { const [n, ...r] = x.replace(/^[-•*]\s*/, "").split(/\s+[—–-]\s+/); return { nom: n.trim(), text: r.join(" · ").trim() } }) });
    if (ok("referencies") && (g("referencies", "imgs") || []).length) { const l = g("referencies", "imgs"); for (let i = 0; i < l.length; i += 6) S.push({ tipus: "moodboard", titol: i ? "" : "referències", imgs: l.slice(i, i + 6) }) }
    txt("to", "to i estètica");
    if (ok("paleta") && (g("paleta", "auto") || g("paleta", "colors"))) S.push({ tipus: "paleta", titol: "paleta", auto: !!g("paleta", "auto"), colors: g("paleta", "colors") || "" });
    for (const [c, t] of [["localitzacions", "localitzacions"], ["vestuari", "vestuari"]]) if (ok(c) && (g(c, "text") || (g(c, "imgs") || []).length)) { if (g(c, "text")) S.push({ tipus: "imatgetext", titol: t, text: g(c, "text"), img: (g(c, "imgs") || [])[0] || "", costat: 1 }); if ((g(c, "imgs") || []).length > 1) S.push({ tipus: "moodboard", titol: "", imgs: g(c, "imgs").slice(1, 7) }) }
    if (ok("fitxa")) { const f = v.fitxa || {}, it = [["Format", f.format], ["Càmera", f.camera], ["Òptiques", f.optiques], ["Relació d'aspecte", f.ratio]].filter(x => String(x[1] || "").trim()).map(([nom, text]) => ({ nom, text })), es = (f.espais || []).filter(x => x.nom || x.text); if (it.length || es.length) S.push({ tipus: "fitxa", titol: "fitxa tècnica", items: it, espais: es }) }
    if (ok("casting") && (g("casting", "items") || []).length) S.push({ tipus: "personatges", titol: "càsting", items: g("casting", "items") });
    if (ok("video") && (g("video", "url") || g("video", "img"))) S.push({ tipus: "video", titol: "referència", url: g("video", "url"), img: g("video", "img") });
    if (ok("equip") && (g("equip", "items") || []).length) S.push({ tipus: "equip", titol: "equip", items: g("equip", "items") });
    if (ok("produccio") && (g("produccio", "items") || []).length) S.push({ tipus: "dades", titol: "producció", items: g("produccio", "items") });
    if (ok("calendari") && (g("calendari", "items") || []).length) S.push({ tipus: "calendari", titol: "calendari", items: g("calendari", "items") });
    if (ok("contacte") && g("contacte", "text")) S.push({ tipus: "contacte", titol: "gràcies", text: g("contacte", "text") });
    return S.map(s => ({ id: uid(), ...JSON.parse(JSON.stringify(s)) })); // còpia: editar la diapositiva no toca les dades de l'assistent
  }

  // Omple l'assistent amb el que ja hi ha al hub (projecte, web, preproducció)
  async function preomple(d) {
    const v = d.dades = d.dades || {}, set = (c, k, x) => { v[c] = v[c] || {}; if (x && !v[c][k]) v[c][k] = x };
    const p = (await H.col("proyecto")).find(x => x.id === d.proyecto);
    if (p) { set("projecte", "titol", p.titulo); set("projecte", "format", [p.categoria, p.anio].filter(Boolean).join(" · ")); set("projecte", "estat", p.estado); set("logline", "text", p.logline); const im = (p.archivos || []).filter(a => /^image\//.test(a.tipo)).map(a => a.id); if (im.length) set("referencies", "imgs", im) }
    const pre = (await H.col("pre")).filter(x => d.proyecto && x.proyecto === d.proyecto);
    if (pre.length) set("calendari", "items", pre.sort((a, b) => (a.ini || "").localeCompare(b.ini || "")).map(x => ({ nom: x.titulo, a: x.ini, b: x.fin, text: [x.ini, x.fin].filter(Boolean).join(" – ") })));
    try { const w = (await H.api("GET", "web")).data; set("contacte", "text", [w.email, "pabloanarte.com"].filter(Boolean).join("\n")); if (d.plantilla === "director") { set("bio", "text", (w.sobre_mi || []).join("\n\n")); set("filmografia", "items", [...(w.ficcion || []).map(x => ({ nom: x.titulo, text: [x.tipo, x.nota].filter(Boolean).join(" · ") })), ...(w.videoclips || []).map(x => ({ nom: x.titulo, text: "videoclip · " + (x.artista || "") }))]); set("projecte", "titol", "pablo anarte"); set("projecte", "format", "director de cine") } } catch (e) { set("contacte", "text", "pablo.anarte.film@gmail.com\npabloanarte.com") }
  }

  // ---------- llista ----------
  async function lista() {
    doc = null; mode = "slides"; const v = ++ver;
    const [ls0, ps] = await Promise.all([H.col("deck"), H.col("proyecto")]); if (v !== ver) return; const ls = ls0.filter(H.dePj);
    const pn = id => (ps.find(x => x.id === id) || {}).titulo || "";
    el.innerHTML = `<div class="bar"><span style="flex:1"></span><button class="b2" data-k="impdf">Importar un dossier (PDF)</button><button class="b" data-k="nou">+ Nou dossier</button></div>
      <div class="dkl">${ls.slice().sort((a, b) => (b.mod || 0) - (a.mod || 0)).map(d => `<div class="dkc" data-k="obre" data-id="${d.id}"><div class="dkcth">${d.slides.length ? DK.escalada(d, d.slides.find(s => !s.amaga) || d.slides[0], Math.round(Math.min(340, 190 * DK.ratio(d))), { img: imgUrl, mostra: 1 }) : ""}</div><div class="g" style="padding:10px 4px 0"><b>${E(d.titulo || "Sense títol")}</b><small>${E([pn(d.proyecto), (DK.ESTILS[d.estil] || {}).nom, d.ratio === "propi" ? `${d.rw}:${d.rh}` : d.ratio, d.slides.length + (d.slides.length === 1 ? " diapositiva" : " diapositives"), d.compartir && d.compartir.actiu ? "compartit" : ""].filter(Boolean).join(" · "))}</small></div></div>`).join("") || `<p class="em">Encara no hi ha dossiers. Crea'n un amb l'assistent o importa un PDF fet amb InDesign, Canva o el que sigui.</p>`}</div>`;
    aj(el);
  }

  // ---------- nou dossier ----------
  async function nou() {
    const ps = (await H.col("proyecto")).filter(H.meu);
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Nou dossier</h2>
      <label>Tipus</label><div class="seg">${Object.entries(PL).map(([k, p], i) => `<button class="t ${i ? "" : "on"}" data-nk="pl" data-v="${k}">${E(p.nom)}</button>`).join("")}</div>
      <label>Projecte (per omplir-lo amb el que ja tens)</label><select id="nd-p"><option value="">—</option>${ps.map(p => `<option value="${p.id}" ${p.id === H.pj() ? "selected" : ""}>${E(p.titulo || "")}</option>`).join("")}</select>
      <label>Estil</label><div class="dkst">${Object.entries(DK.ESTILS).map(([k, t], i) => `<button class="${i ? "" : "on"}" data-nk="st" data-v="${k}">${DK.escalada({ estil: k, ratio: "16:9" }, { tipus: "portada", titol: "días de sal", subtitol: "llargmetratge", peu: "pablo anarte" }, 150, { mostra: 1 })}<span>${E(t.nom)}</span></button>`).join("")}</div>
      <label>Format</label><select id="nd-f" onchange="document.getElementById('nd-pr').hidden=this.value!=='propi'">${DK.FORMATS.map(f => `<option>${f[0]}</option>`).join("")}<option value="propi">Personalitzat…</option></select>
      <div class="row" id="nd-pr" hidden><input id="nd-rw" value="16" placeholder="Ample" inputmode="decimal"><span>:</span><input id="nd-rh" value="9" placeholder="Alt" inputmode="decimal"></div>
      <div class="sfoot"><span></span><button class="b" data-nk="crea">Crear i omplir dades</button></div>`); aj(document.getElementById("hshc"));
  }
  document.getElementById("hsh").addEventListener("click", async e => {
    const b = e.target.closest("[data-nk]"); if (!b || el.hidden) return; const k = b.dataset.nk;
    if (k === "pl" || k === "st") { b.parentNode.querySelectorAll("[data-nk]").forEach(x => x.classList.toggle("on", x === b)); return }
    if (k === "crea") {
      const pl = document.querySelector('#hshc [data-nk="pl"].on').dataset.v, st = document.querySelector('#hshc [data-nk="st"].on').dataset.v;
      const d = { id: H.uid("deck"), titulo: "", plantilla: pl, estil: st, ratio: document.getElementById("nd-f").value, rw: +document.getElementById("nd-rw").value.replace(",", ".") || 16, rh: +document.getElementById("nd-rh").value.replace(",", ".") || 9, proyecto: document.getElementById("nd-p").value, slides: [], dades: {}, mod: Date.now() };
      await preomple(d); d.titulo = (d.dades.projecte || {}).titol || PL[pl].nom; d.slides = genera(d); d.viu = true; d.ma = false; await H.put(d, 1); H.cerrar(); doc = d; sel = 0; assistent();
    }
  });

  // ---------- editor ----------
  async function obre(id) { ++ver; doc = (await H.col("deck")).find(x => x.id === id); sel = 0; if (!doc) return; if (doc.viu && !doc.ma && !doc.slides.some(s => s.tipus === "lliure")) assistent(); else { mode = "slides"; pintar() } }
  const S = () => doc.slides[sel];
  async function pintar() {
    if (!doc) return; ++ver;
    if (doc.slides.some(s => s.tipus === "paleta" && s.auto) && !doc._pal) tmp(doc, "_pal", await DK.paleta(totesImgs().map(imgUrl)));
    tmp(doc, "_imgs", totesImgs());
    const ps = (await H.col("proyecto")).filter(p => H.meu(p) || p.id === doc.proyecto);
    el.innerHTML = `<div class="bar tb"><button class="b2" data-k="volver">← Dossiers</button><input data-d="titulo" value="${E(doc.titulo || "")}" placeholder="Títol del dossier" style="flex:1;min-width:180px;max-width:360px;font-weight:700"><select data-d="proyecto" style="width:auto"><option value="">Sense projecte</option>${ps.map(p => `<option value="${p.id}" ${p.id === doc.proyecto ? "selected" : ""}>${E(p.titulo || "")}</option>`).join("")}</select><span style="flex:1"></span><button class="b2" data-k="rev">Revisió de disseny</button><button class="b2" data-k="share">${doc.compartir && doc.compartir.actiu ? "Compartit ✓" : "Compartir"}</button><button class="b" data-k="down">Descarregar</button></div>
      <div class="bar tb sec"><button class="b2" data-k="assist">Omplir per apartats</button><button class="b2" data-k="addpdf">Afegir pàgines d'un PDF</button><button class="b2" data-k="dup">Duplicar (p. ex. per traduir)</button><span style="flex:1"></span><button class="del" data-k="del">Eliminar dossier</button></div>
      <div class="dkcols"><div class="dkmain"><div id="dkprev"></div><div class="dknav"><button class="b2" data-k="prev" ${sel ? "" : "disabled"}>‹</button><span>${doc.slides.length ? sel + 1 : 0} / ${doc.slides.length}</span><button class="b2" data-k="next" ${sel < doc.slides.length - 1 ? "" : "disabled"}>›</button></div>
      <div class="dkth">${doc.slides.map((s, i) => `<div class="dkt ${i === sel ? "on" : ""} ${s.amaga ? "amg" : ""}" data-k="sel" data-i="${i}" draggable="true" data-dr="${i}"><span>${i + 1}</span>${DK.escalada(doc, s, Math.round(Math.min(186, 105 * DK.ratio(doc))), { img: imgUrl })}</div>`).join("")}<button class="b2 dkadd" data-k="add">+ Diapositiva</button></div></div>
      <aside class="dkpan"><div class="tabs"><button class="t ${pan === "slide" ? "on" : ""}" data-k="pan" data-v="slide">Diapositiva</button><button class="t ${pan === "dis" ? "on" : ""}" data-k="pan" data-v="dis">Disseny</button></div><div id="dkpf">${pan === "slide" ? panSlide() : panDis()}</div></aside></div>`;
    aj(el.querySelector(".dkth")); aj(el.querySelector("#dkpf"));
    prev();
  }
  function prev() {
    const p = el.querySelector("#dkprev"); if (!p || !doc.slides.length) { if (p) p.innerHTML = `<p class="em">Sense diapositives. Afegeix-ne una o fes servir «Omplir per apartats».</p>`; return }
    const r = DK.ratio(doc), cw = p.clientWidth || el.clientWidth - 40, hmax = Math.max(300, window.innerHeight - (r < 1 ? 420 : 280)); // vertical: que es vegin també les miniatures
    const am = Math.floor(Math.min(cw, 1300, hmax * r)), ll = S().tipus === "lliure";
    p.innerHTML = DK.escalada(doc, S(), am, { img: imgUrl, n: sel + 1 }); aj(p);
    if (ll && window.DKL) DKL.monta(p, doc, S(), am / DK.mida(doc)[0], HK);
  }
  // enllaç amb l'editor lliure (lliure.js)
  const HK = {
    get n() { return sel + 1 },
    canvi: () => { doc.ma = true; refresca() },
    panel: () => { const f = el.querySelector("#dkpf"); if (!f) return; if (pan !== "slide") { pan = "slide"; el.querySelectorAll('[data-k="pan"]').forEach(x => x.classList.toggle("on", x.dataset.v === "slide")) } f.innerHTML = panSlide() },
    maqueta: id => { const i = doc.slides.findIndex(x => x.id === id), s = doc.slides[i]; if (!s || !s.orig) return; doc.slides[i] = { ...s.orig, id: s.id, amaga: !!s.amaga }; if (!doc.slides[i].amaga) delete doc.slides[i].amaga; sel = i; refresca(1) }
  };
  async function aLliure(i) { const s = doc.slides[i]; if (!s || s.tipus === "lliure") return; doc.slides[i] = await DK.aLliure(doc, s, { img: imgUrl, n: i + 1 }) }
  function refresca(tot) { doc.mod = Date.now(); save(); if (tot) return pintar(); prev(); const t = el.querySelector(`.dkt[data-i="${sel}"]`); if (t) { t.innerHTML = `<span>${sel + 1}</span>` + DK.escalada(doc, S(), Math.round(Math.min(186, 105 * DK.ratio(doc))), { img: imgUrl }); aj(t) } }
  const totesImgs = () => doc.slides.flatMap(s => [s.img, ...(s.imgs || []), ...(s.items || []).map(x => x.img), ...(s.els || []).map(x => x.img)]).filter(Boolean);
  let amplePrev = ""; const reprev = () => { const w = el.clientWidth + "x" + window.innerHeight; if (doc && w !== amplePrev) { amplePrev = w; prev() } }; new ResizeObserver(reprev).observe(el); window.addEventListener("resize", reprev);

  // camps
  function camp(k, l, t, v, ctx) {
    const d = `data-c="${k}" data-ctx="${ctx}"`;
    if (t === "text") return `<label>${l}</label><input ${d} value="${E(v || "")}">`;
    if (t === "area") return `<label>${l}</label><textarea ${d} rows="5">${E(v || "")}</textarea>`;
    if (t === "check") return `<label class="ck"><input type="checkbox" ${d} ${v ? "checked" : ""}> ${l}</label>`;
    if (t === "date") return `<label>${l}</label><input type="date" ${d} value="${E(v || "")}">`;
    if (t === "img") return `<label>${l}</label><div class="dkim">${v ? `<div class="th" style="background-image:url('${imgUrl(v)}')"></div><button class="b2" data-ik="treu" ${d}>Treure la imatge</button>` : ""}<label class="b2" style="margin:0">${v ? "Canviar" : "Pujar imatge"}<input type="file" accept="image/*" data-up="1" ${d} hidden></label>${window.MED ? `<button class="b2" data-ik="refs" ${d}>De les referències</button>` : ""}</div>`;
    if (t === "imgs") return `<label>${l}</label><div class="dkims">${(v || []).map((id, i) => `<div class="th" style="background-image:url('${imgUrl(id)}')"><button data-ik="treui" data-i="${i}" ${d}>×</button></div>`).join("")}<label class="th add" title="Pujar imatges">＋<input type="file" accept="image/*" multiple data-up="n" ${d} hidden></label></div>${window.MED ? `<button class="b2" data-ik="refs" data-multi="1" ${d} style="margin-top:8px">Triar de les referències${doc && doc.proyecto ? " i el recce" : ""}</button>` : ""}`;
    if (t.startsWith("items")) { const f = ITEMS[t.split(":")[1]] || ITEMS.personatges; return `<label>${l}</label>` + (v || []).map((x, i) => `<div class="dkit">${f.map(([fk, fl, ft]) => camp(fk, fl, ft || "text", x[fk], ctx + "|" + k + "|" + i)).join("")}<button class="del" style="margin:4px 0 0" data-ik="treuit" data-i="${i}" ${d}>Eliminar aquest element</button></div>`).join("") + `<button class="b2" data-ik="addit" ${d}>+ Afegir</button>` }
    return "";
  }
  function panSlide() {
    if (!doc.slides.length) return `<p class="em">Afegeix una diapositiva.</p>`;
    const s = S(), t = DK.TIPUS[s.tipus] || DK.TIPUS.text;
    const peu = `<div class="sfoot"><button class="del" data-k="sdel">Esborrar</button><span><button class="b2" data-k="samaga">${s.amaga ? "Mostrar" : "Amagar"}</button> <button class="b2" data-k="sdup">Duplicar</button></span></div>`;
    if (s.tipus === "lliure") { const h = window.DKL ? DKL.panel(doc, s) : ""; return h + (window.DKL && DKL.triat() ? "" : `<label style="margin-top:18px">Diapositiva</label>` + peu.replace('<div class="sfoot">', '<div class="sfoot" style="margin-top:6px">')) }
    const tt = { personatges: "items:personatges", equip: "items:equip", dades: "items:dades", fitxa: "items:dades", calendari: "items:calendari", laurels: "items:laurels" };
    return `<div class="dkllx"><b>Edició lliure</b><small>Converteix aquesta diapositiva en elements solts: pots moure, canviar de mida, girar o esborrar qualsevol text, imatge o detall, i afegir-ne de nous.</small><div class="row"><button class="b" data-k="lliure">Editar lliurement</button><button class="b2" data-k="lliuretot">Totes les diapositives</button></div></div>
      <label>Maqueta</label><select data-k="tipus">${Object.entries(DK.TIPUS).map(([k, x]) => `<option value="${k}" ${k === s.tipus ? "selected" : ""}>${E(x.nom)}</option>`).join("")}</select>` +
      t.camps.map(([k, l, ty]) => camp(k, l, ty === "items" ? (k === "espais" ? "items:espais" : tt[s.tipus] || "items:personatges") : ty, s[k], "s")).join("") +
      peu;
  }
  function panDis() {
    const t = DK.tema(doc), mob = window.innerWidth < 900;
    return `<label>Estil</label><div class="dkst sm">${Object.entries(DK.ESTILS).map(([k, x]) => `<button class="${doc.estil === k ? "on" : ""}" data-k="estil" data-v="${k}">${DK.escalada({ estil: k, ratio: "16:9" }, { tipus: "portada", titol: "títol", subtitol: "", peu: "" }, mob ? 120 : 132, { mostra: 1 })}<span>${E(x.nom)}</span></button>`).join("")}</div>
      <label>Format</label><select data-k="ratio">${DK.FORMATS.map(f => `<option ${f[0] === doc.ratio ? "selected" : ""}>${f[0]}</option>`).join("")}<option value="propi" ${doc.ratio === "propi" ? "selected" : ""}>Personalitzat…</option></select>
      ${doc.ratio === "propi" ? `<div class="row"><input data-k="rw" value="${E(doc.rw || 16)}" placeholder="Ample"><span>:</span><input data-k="rh" value="${E(doc.rh || 9)}" placeholder="Alt"></div>` : ""}
      <label>Tipografia</label><select data-k="font">${Object.keys(DK.FONTS).map(f => `<option ${f === t.font ? "selected" : ""}>${f}</option>`).join("")}</select>
      <label>Colors</label><div class="dkcol">${[["bg", "Fons"], ["fg", "Text"], ["mut", "Text secundari"], ["ac", "Accent"]].map(([k, l]) => `<label class="ck"><input type="color" data-k="col" data-v="${k}" value="${t[k]}"> ${l}</label>`).join("")}</div>
      <label>Títols</label><select data-k="tt"><option value="lowercase" ${t.tt === "lowercase" ? "selected" : ""}>en minúscules</option><option value="uppercase" ${t.tt === "uppercase" ? "selected" : ""}>EN MAJÚSCULES</option><option value="none" ${t.tt === "none" ? "selected" : ""}>Tal com els escric</option></select>
      <button class="b2" data-k="resta" style="margin-top:16px">Tornar als colors de l'estil</button>${doc.slides.some(s => s.tipus === "lliure") ? `<small style="display:block;margin-top:10px">Les diapositives d'edició lliure conserven els seus colors i tipografies: es canvien element per element.</small>` : ""}`;
  }

  // ---------- omplir per apartats: formulari a l'esquerra i el dossier es va fent a la dreta ----------
  // Mentre no es toquin les diapositives a mà (doc.ma), el dossier es refà sol amb cada canvi.
  // Si s'han retocat a mà, la vista prèvia ensenya com quedaria i «Aplicar al dossier» el refà.
  let mode = "slides", tViu = 0;
  // els dossiers fets abans d'aquesta pàgina (sense «viu») poden tenir retocs a mà: no es refan sols
  function assistent() { mode = "apartats"; if (doc && !doc.viu) { if (doc.ma === undefined && (doc.slides || []).length) doc.ma = true; doc.viu = true; save() } pintaAp() }
  async function pintaAp() {
    if (!doc) return; ++ver;
    const pl = PL[doc.plantilla] || PL.film, v = doc.dades = doc.dades || {};
    const ps = (await H.col("proyecto")).filter(p => H.meu(p) || p.id === doc.proyecto);
    el.innerHTML = `<div class="bar tb"><button class="b2" data-k="volver">← Dossiers</button><input data-d="titulo" value="${E(doc.titulo || "")}" placeholder="Títol del dossier" style="flex:1;min-width:180px;max-width:360px;font-weight:700"><select data-d="proyecto" style="width:auto"><option value="">Sense projecte</option>${ps.map(p => `<option value="${p.id}" ${p.id === doc.proyecto ? "selected" : ""}>${E(p.titulo || "")}</option>`).join("")}</select><span style="flex:1"></span><button class="b2" data-k="mode" data-v="slides">Retocar diapositives</button><button class="b2" data-k="share">${doc.compartir && doc.compartir.actiu ? "Compartit ✓" : "Compartir"}</button><button class="b" data-k="down">Descarregar</button></div>
      <div class="dkap"><div class="dkfm">
        <div class="seg" style="margin-top:0">${Object.entries(PL).map(([k, p]) => `<button class="t ${k === (doc.plantilla || "film") ? "on" : ""}" data-ak="pl" data-v="${k}">${E(p.nom)}</button>`).join("")}</div>
        <div class="ls dknav2">${pl.cats.map(([c, t]) => `<a class="ln ${(v[c] || {}).off ? "off" : ""}" href="#" data-ak="ves" data-v="${c}">${E(t)}</a>`).join("")}</div>
        <div id="dkma">${avisMa()}</div>
        ${pl.cats.map(([c, t, fs]) => `<div class="dkcat ${(v[c] || {}).off ? "off" : ""}" id="cat-${c}"><label class="ck dkct"><input type="checkbox" data-ak="on" data-v="${c}" ${(v[c] || {}).off ? "" : "checked"}> ${E(t)}</label><div class="dkcf">${fs.map(([k, l, ty]) => camp(k, l, ty, (v[c] || {})[k], "a|" + c)).join("")}</div></div>`).join("")}
      </div><aside class="dkviu"><div class="dkvh"><b>Vista prèvia</b><span id="dkvn"></span></div><div id="dkvl"></div></aside></div>`;
    viu();
  }
  const avisMa = () => doc.ma ? `<div class="dkav"><span>Has retocat diapositives a mà. La vista prèvia ensenya com quedaria amb aquests apartats.</span><button class="b" data-ak="gen">Aplicar al dossier</button></div>` : "";
  // refà el dossier (si no s'ha retocat a mà) i pinta la vista prèvia
  function viu(desa) {
    const box = el.querySelector("#dkvl"); if (!box || mode !== "apartats") return;
    if (!doc.ma) { const nou = genera(doc), pt = (doc.dades.projecte || {}).titol; if (pt && !doc.titolMa) { doc.titulo = pt; const ti = el.querySelector('[data-d="titulo"]'); if (ti && document.activeElement !== ti) ti.value = pt } doc.slides = nou; if (desa) { doc.mod = Date.now(); save() } }
    const ls = doc.ma ? genera(doc) : doc.slides, w = Math.max(200, Math.floor((box.clientWidth || 460) - 2));
    tmp(doc, "_imgs", ls.flatMap(x => [x.img, ...(x.imgs || []), ...(x.items || []).map(y => y.img)]).filter(Boolean));
    const pinta = () => { box.innerHTML = ls.map((x, i) => `<div class="dkvs" ${doc.ma ? "" : `data-k="vsel" data-i="${i}"`} title="${doc.ma ? "" : "Retocar aquesta diapositiva"}">${DK.escalada(doc, x, w, { img: imgUrl, n: i + 1 })}</div>`).join("") || `<p class="em">Omple algun apartat i el dossier es construirà aquí.</p>`; aj(box); const n = el.querySelector("#dkvn"); if (n) n.textContent = ls.length + (ls.length === 1 ? " diapositiva" : " diapositives") };
    if (ls.some(x => x.tipus === "paleta" && x.auto) && !doc._pal) DK.paleta(doc._imgs.map(imgUrl)).then(p => { tmp(doc, "_pal", p); pinta() }); else pinta();
  }
  const viuDeb = () => { clearTimeout(tViu); tViu = setTimeout(() => viu(true), 300) };
  const marcaMa = () => { if (doc && !doc.ma && doc.dades && Object.keys(doc.dades).length) doc.ma = true };
  new ResizeObserver(() => { if (doc && mode === "apartats") { clearTimeout(tViu); tViu = setTimeout(() => viu(), 150) } }).observe(el);

  // ---------- revisió de disseny ----------
  async function revisio() {
    const [w, h] = DK.mida(doc), t = DK.tema(doc), av = [];
    if (DK.contrast(t.fg, t.bg) < 4.5) av.push([0, "Poc contrast entre el text i el fons (" + DK.contrast(t.fg, t.bg).toFixed(1) + ":1). Costarà de llegir."]);
    if (DK.contrast(t.mut, t.bg) < 3) av.push([0, "El text secundari té poc contrast amb el fons."]);
    const box = document.createElement("div"); box.style.cssText = "position:fixed;left:-20000px;top:0"; document.body.appendChild(box);
    const mides = {};
    for (const [i, s] of doc.slides.entries()) {
      if (s.amaga) continue;
      box.innerHTML = DK.dibuixa(doc, s, { img: imgUrl, n: i + 1 }); await new Promise(r => setTimeout(r, 20)); DK.ajusta(box);
      const n = i + 1, root = box.firstElementChild, fit = +root.style.getPropertyValue("--fit") || 1;
      const sob = [...root.querySelectorAll(".p, .p > div, .it, .dad > div, .cal")].find(x => x.scrollHeight > x.clientHeight + 4 || x.scrollWidth > x.clientWidth + 4);
      if (sob) av.push([n, `El text no hi cap ni reduint-lo: «${(sob.innerText || "").trim().slice(0, 50)}…». Escurça'l o reparteix-lo en dues diapositives.`]);
      else if (fit < .8) av.push([n, `He hagut de reduir el text al ${Math.round(fit * 100)}% perquè hi càpiga. Potser és massa per a una diapositiva.`]);
      if (root.querySelector(".ph, .elph")) av.push([n, "Falta una imatge."]);
      const par = (root.innerText || "").trim().split(/\s+/).filter(Boolean).length; if (par > 160) av.push([n, `Massa text (${par} paraules). Millor repartir-lo en dues diapositives.`]);
      if (["portada", "text", "imatgetext", "personatges", "equip", "llista", "dades", "calendari"].includes(s.tipus) && !s.titol) av.push([n, "Sense títol."]);
      root.querySelectorAll(".im:not(.ph), .elib").forEach(x => { const id = (x.style.backgroundImage.match(/archivo\/([\w]+)/) || [])[1]; if (id) { const r = x.getBoundingClientRect(); mides[id] = Math.max(mides[id] || 0, r.width) } });
    }
    box.remove();
    // resolució de les imatges (en relació amb la mida a què es mostren; per imprimir cal el doble)
    for (const [id, ample] of Object.entries(mides)) { try { const im = new Image(); im.src = imgUrl(id); await im.decode(); if (im.naturalWidth < ample * .9) { const n = doc.slides.findIndex(s => [s.img, ...(s.imgs || []), ...(s.items || []).map(x => x.img), ...(s.els || []).map(x => x.img)].includes(id)) + 1; av.push([n, `Imatge de poca resolució (${im.naturalWidth}px per a un espai de ${Math.round(ample)}px): es veurà pixelada.`]) } } catch (e) { } }
    const uniq = av.filter((x, i) => av.findIndex(y => y[0] === x[0] && y[1] === x[1]) === i);
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Revisió de disseny</h2>` + (uniq.length ? uniq.map(([n, m]) => `<div class="r" data-rk="${n}"><i class="dot" style="background:#ff9f0a"></i><div class="g"><b>${n ? "Diapositiva " + n : "Tot el dossier"}</b><small>${E(m)}</small></div></div>`).join("") : `<p class="em">Tot correcte: res tallat, imatges amb prou resolució i bon contrast.</p>`));
  }

  // ---------- exportar ----------
  function descarregar() {
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Descarregar</h2>
      <label>Format</label><div class="seg">${["PDF", "PNG", "JPEG"].map((f, i) => `<button class="t ${i ? "" : "on"}" data-xk="f" data-v="${f}">${f}</button>`).join("")}</div>
      <label>Qualitat</label><div class="seg">${[["0.5", "Lleugera (per enviar)"], ["1", "Pantalla"], ["2", "Alta (impressió)"]].map(([v, l], i) => `<button class="t ${i === 1 ? "on" : ""}" data-xk="q" data-v="${v}">${l}</button>`).join("")}</div>
      <label>Diapositives</label><div class="seg"><button class="t on" data-xk="a" data-v="totes">Totes</button><button class="t" data-xk="a" data-v="actual">Només l'actual</button></div>
      <small>El PDF s'obre al diàleg d'imprimir: tria «Desar com a PDF». La qualitat afecta les imatges PNG/JPEG.</small>
      <div class="sfoot"><span></span><button class="b" data-xk="go">Descarregar</button></div>`);
  }
  async function exporta(f, q, a) {
    const ls = a === "actual" ? [S()] : doc.slides.filter(s => !s.amaga), [w, h] = DK.mida(doc), nom = (doc.titulo || "dossier").replace(/[\\/:*?"<>|]/g, "");
    if (f === "PDF") {
      let z = document.getElementById("printzone"); if (!z) { z = document.createElement("div"); z.id = "printzone"; document.body.appendChild(z) }
      z.innerHTML = `<style>@page{size:${w}px ${h}px;margin:0}#printzone .dk{page-break-after:always;break-after:page}</style>` + ls.map(s => DK.dibuixa(doc, s, { img: imgUrl, n: doc.slides.indexOf(s) + 1, final: 1 })).join("");
      document.body.classList.add("printing"); DK.ajusta(z); const fi = () => { document.body.classList.remove("printing"); z.innerHTML = ""; window.removeEventListener("afterprint", fi) }; window.addEventListener("afterprint", fi);
      await Promise.all([...z.querySelectorAll(".im, .elib")].map(x => { const u = (x.style.backgroundImage.match(/url\("?([^")]+)/) || [])[1]; return u ? new Image().decode.call(Object.assign(new Image(), { src: u })).catch(() => { }) : 0 }));
      await document.fonts.ready; setTimeout(() => window.print(), 150); return;
    }
    H.toast("Preparant les imatges…");
    await carrega("/vendor/html-to-image.js", "htmlToImage");
    const box = document.createElement("div"); box.style.cssText = "position:fixed;left:-30000px;top:0"; document.body.appendChild(box);
    const out = [];
    for (const [i, s] of ls.entries()) {
      box.innerHTML = DK.dibuixa(doc, s, { img: imgUrl, n: doc.slides.indexOf(s) + 1, final: 1 }); await document.fonts.ready; await new Promise(r => setTimeout(r, 60)); DK.ajusta(box);
      const fn = f === "PNG" ? htmlToImage.toBlob : (n, o) => htmlToImage.toJpeg(n, o).then(u => fetch(u).then(r => r.blob()));
      out.push([`${nom} ${String(doc.slides.indexOf(s) + 1).padStart(2, "0")}.${f === "PNG" ? "png" : "jpg"}`, await fn(box.firstElementChild, { pixelRatio: +q, quality: .92, width: w, height: h, cacheBust: false, backgroundColor: s.tipus === "lliure" && s.bg ? s.bg : DK.tema(doc).bg })]);
    }
    box.remove();
    if (out.length === 1) return baixa(out[0][1], out[0][0]);
    await carrega("/vendor/jszip.min.js", "JSZip"); const zip = new JSZip(); out.forEach(([n, b]) => zip.file(n, b));
    baixa(await zip.generateAsync({ type: "blob" }), nom + ".zip");
  }
  const carrega = (src, g) => window[g] ? Promise.resolve() : new Promise((ok, ko) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s) });
  function baixa(b, n) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = n; a.click(); H.toast("Descarregat") }

  // ---------- compartir ----------
  function compartir() {
    const c = doc.compartir = doc.compartir || { token: [...crypto.getRandomValues(new Uint8Array(16))].map(x => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join(""), actiu: false, pw: "", baixar: true };
    const url = location.origin + "/d/" + c.token;
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Compartir amb enllaç</h2>
      <label class="ck"><input type="checkbox" data-sk="actiu" ${c.actiu ? "checked" : ""}> Enllaç actiu (qualsevol amb l'enllaç el pot veure, sense entrar al hub)</label>
      <label>Enllaç</label><div class="row"><input readonly value="${E(url)}" id="sh-url"><button class="b2" data-sk="copia">Copiar</button></div>
      <label>Contrasenya (opcional)</label><input data-sk="pw" value="${E(c.pw || "")}" placeholder="Sense contrasenya">
      <label class="ck"><input type="checkbox" data-sk="baixar" ${c.baixar !== false ? "checked" : ""}> Permetre descarregar-lo en PDF</label>
      <small>Si desactives l'enllaç, deixa de funcionar a l'instant. Els canvis que facis al dossier es veuen a l'enllaç.</small>`);
  }

  // ---------- importar PDF (dossiers fets amb InDesign, Canva…) ----------
  async function importaPDF(file, d) {
    H.toast("Llegint el PDF…");
    const pdfjs = await import("/vendor/pdf.min.mjs"); pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise, nous = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const pg = await pdf.getPage(n), v0 = pg.getViewport({ scale: 1 }), sc = 2400 / v0.width, vp = pg.getViewport({ scale: sc });
      if (n === 1 && !d.slides.length) { const r = v0.width / v0.height, f = DK.FORMATS.find(x => Math.abs(x[1] - r) < .02); if (f) d.ratio = f[0]; else { d.ratio = "propi"; d.rw = Math.round(v0.width); d.rh = Math.round(v0.height) } }
      const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      const blob = await new Promise(r => c.toBlob(r, "image/jpeg", .9)); H.toast(`Pàgina ${n} de ${pdf.numPages}…`);
      const a = await H.api("POST", "archivo?nombre=" + encodeURIComponent(`${file.name} p${n}.jpg`), new File([blob], "p.jpg", { type: "image/jpeg" }));
      nous.push({ id: uid(), tipus: "pagina", img: a.id });
    }
    d.slides.push(...nous); d.mod = Date.now(); await H.put(d, 1); H.toast(nous.length + (nous.length === 1 ? " pàgina importada" : " pàgines importades"));
  }

  // ---------- esdeveniments ----------
  const triaFitxer = (accept, multi) => new Promise(ok => { const i = document.createElement("input"); i.type = "file"; i.accept = accept; i.multiple = !!multi; i.onchange = () => ok([...i.files]); i.click() });
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b || b.disabled) return; const k = b.dataset.k, i = +b.dataset.i;
    if (k === "nou") return nou();
    if (k === "obre") return obre(b.dataset.id);
    if (k === "impdf") { const [f] = await triaFitxer(".pdf"); if (!f) return; const d = { id: H.uid("deck"), titulo: f.name.replace(/\.pdf$/i, "").replace(/^[0-9a-f]{8}-/, "").replace(/[_]+/g, " ").trim(), estil: "minim", ratio: "16:9", slides: [], mod: Date.now(), proyecto: H.pj() === "-" ? "" : H.pj() }; try { await importaPDF(f, d); doc = d; sel = 0; pintar() } catch (er) { H.toast("No s'ha pogut llegir el PDF") } return }
    if (!doc) return;
    if (k === "volver") { mode = "slides"; return lista() }
    if (k === "mode") { mode = "slides"; return pintar() }
    if (k === "vsel") { sel = i; mode = "slides"; return pintar() }
    if (k === "del" && await H.confirma("Eliminar aquest dossier? No es pot desfer.")) { await H.del(doc); doc = null; H.toast("Dossier eliminat"); return lista() }
    if (k === "sel") { sel = i; pintar() }
    if (k === "prev" && sel) { sel--; pintar() }
    if (k === "next" && sel < doc.slides.length - 1) { sel++; pintar() }
    if (k === "pan") { pan = b.dataset.v; el.querySelector("#dkpf").innerHTML = pan === "slide" ? panSlide() : panDis(); aj(el.querySelector("#dkpf")); el.querySelectorAll('[data-k="pan"]').forEach(x => x.classList.toggle("on", x === b)) }
    if (k === "add") { marcaMa(); doc.slides.splice(sel + 1, 0, { id: uid(), tipus: "text", titol: "", text: "" }); sel = Math.min(sel + 1, doc.slides.length - 1); pan = "slide"; refresca(1) }
    if (k === "sdel" && await H.confirma("Esborrar aquesta diapositiva?")) { marcaMa(); doc.slides.splice(sel, 1); sel = Math.max(0, sel - 1); refresca(1) }
    if (k === "sdup") { marcaMa(); doc.slides.splice(sel + 1, 0, { ...JSON.parse(JSON.stringify(S())), id: uid(), amaga: false }); sel++; refresca(1) }
    if (k === "samaga") { marcaMa(); S().amaga = !S().amaga; refresca(1) }
    if (k === "estil") { doc.estil = b.dataset.v; doc.tema = {}; refresca(1) }
    if (k === "resta") { doc.tema = {}; refresca(1) }
    if (k === "lliure") { doc.ma = true; b.disabled = true; try { await aLliure(sel); refresca(1) } catch (er) { console.error(er); H.toast("No s'ha pogut convertir"); b.disabled = false } return }
    if (k === "lliuretot") { if (!await H.confirma("Passar totes les diapositives a edició lliure? Cada una es podrà tornar a la seva maqueta, però el formulari «Omplir per apartats» ja no les refarà soles.", { ok: "Passar-les totes" })) return; doc.ma = true; H.toast("Convertint…"); try { for (let j = 0; j < doc.slides.length; j++) await aLliure(j) } catch (er) { console.error(er) } refresca(1); return }
    if (k === "assist") assistent();
    if (k === "rev") revisio();
    if (k === "down") descarregar();
    if (k === "share") compartir();
    if (k === "dup") { const d = JSON.parse(JSON.stringify(doc)); d.id = H.uid("deck"); d.titulo = (doc.titulo || "") + " (còpia)"; delete d.compartir; d.mod = Date.now(); await H.put(d, 1); doc = d; sel = 0; pintar(); H.toast("Duplicat: ara pots traduir-ne els textos") }
    if (k === "addpdf") { marcaMa(); const [f] = await triaFitxer(".pdf"); if (f) { try { await importaPDF(f, doc); pintar() } catch (er) { H.toast("No s'ha pogut llegir el PDF") } } }
  });
  // valors dels camps (diapositiva o assistent)
  function dest(ctx, crea) {
    const [z, c, ik, ii] = ctx.split("|");
    let o = z === "s" ? S() : ((doc.dades = doc.dades || {})[c] = (doc.dades[c] || {}));
    if (ik != null && z === "s") o = S()[c] && S()[c][+ik] ? S()[c][+ik] : o; // (no s'usa)
    return { o, z, c, ik, ii };
  }
  function obj(ctx) { // retorna l'objecte on es desa el camp
    const p = ctx.split("|"); let o = p[0] === "s" ? S() : ((doc.dades = doc.dades || {})[p[1]] = doc.dades[p[1]] || {});
    for (let j = p[0] === "s" ? 1 : 2; j < p.length; j += 2) o = ((o[p[j]] = o[p[j]] || [])[+p[j + 1]]);
    return o;
  }
  const rp = () => { if (mode === "apartats") assistent(); else el.querySelector("#dkpf").innerHTML = panSlide() };
  function onInput(e) {
    const t = e.target; if (!doc) return;
    if (t.dataset.d) { doc[t.dataset.d] = t.value; if (t.dataset.d === "titulo") doc.titolMa = !!t.value; doc.mod = Date.now(); return save() }
    if (t.dataset.c && t.dataset.ctx && !t.dataset.up) { const o = obj(t.dataset.ctx); o[t.dataset.c] = t.type === "checkbox" ? t.checked : t.value; if (t.dataset.c === "a" || t.dataset.c === "b") o.text = (o.a || "") + " " + (o.b || ""); if (t.dataset.ctx[0] === "s") { if (t.dataset.c === "auto") tmp(doc, "_pal", null); marcaMa(); refresca() } else { save(); viuDeb() } return }
    if (t.dataset.sk) { const c = doc.compartir; if (t.dataset.sk === "pw") c.pw = t.value; else c[t.dataset.sk] = t.checked; save(); const sb = el.querySelector('[data-k="share"]'); if (sb) sb.textContent = c.actiu ? "Compartit ✓" : "Compartir"; return }
    if (t.dataset.ak === "on") { const v = doc.dades[t.dataset.v] = doc.dades[t.dataset.v] || {}; v.off = !t.checked; save(); const c = el.querySelector("#cat-" + t.dataset.v), ln = el.querySelector(`[data-ak="ves"][data-v="${t.dataset.v}"]`); c && c.classList.toggle("off", v.off); ln && ln.classList.toggle("off", v.off); viuDeb(); return }
    const k = t.dataset.k;
    if (k === "col") { doc.tema = { ...(doc.tema || {}), [t.dataset.v]: t.value }; refresca(); el.querySelectorAll(".dkt").forEach((x, i) => { x.innerHTML = `<span>${i + 1}</span>` + DK.escalada(doc, doc.slides[i], Math.round(Math.min(186, 105 * DK.ratio(doc))), { img: imgUrl }); aj(x) }) }
    if (k === "rw" || k === "rh") { doc[k] = t.value; refresca() }
  }
  el.addEventListener("input", onInput);
  document.getElementById("hsh").addEventListener("input", e => { if (!el.hidden) onInput(e) });
  async function onChange(e) {
    const t = e.target; if (!doc) return;
    if (t.dataset.d === "proyecto") { doc.proyecto = t.value; save() }
    if (t.dataset.k === "tipus") { S().tipus = t.value; marcaMa(); refresca(); el.querySelector("#dkpf").innerHTML = panSlide() }
    if (t.dataset.k === "ratio") { doc.ratio = t.value; refresca(1) }
    if (t.dataset.k === "font") { doc.tema = { ...(doc.tema || {}), font: t.value }; refresca(1) }
    if (t.dataset.k === "tt") { doc.tema = { ...(doc.tema || {}), tt: t.value }; refresca(1) }
    if (t.dataset.up && t.files.length) {
      const o = obj(t.dataset.ctx), ids = [];
      for (const f of t.files) { const id = await R.subirImagen(f); if (id) ids.push(id) }
      if (!ids.length) return;
      if (t.dataset.up === "n") o[t.dataset.c] = (o[t.dataset.c] || []).concat(ids); else o[t.dataset.c] = ids[0];
      tmp(doc, "_pal", null); if (t.dataset.ctx[0] === "s") { marcaMa(); refresca(); el.querySelector("#dkpf").innerHTML = panSlide() } else { save(); assistent() }
    }
  }
  el.addEventListener("change", onChange);
  document.getElementById("hsh").addEventListener("change", e => { if (!el.hidden) onChange(e) });
  // botons dins dels camps (imatges i llistes), al panell i a l'assistent
  async function onIk(e) {
    const b = e.target.closest("[data-ik]"); if (!b || !doc) return; const o = obj(b.dataset.ctx), c = b.dataset.c, k = b.dataset.ik;
    if (k === "treu") delete o[c];
    if (k === "treui") o[c].splice(+b.dataset.i, 1);
    if (k === "treuit") o[c].splice(+b.dataset.i, 1);
    if (k === "addit") o[c] = (o[c] || []).concat({ nom: "", text: "" });
    if (k === "refs") { const ids = await MED.tria({ proj: doc.proyecto, multi: !!b.dataset.multi }); if (!ids.length) return; if (b.dataset.multi) o[c] = (o[c] || []).concat(ids.filter(x => !(o[c] || []).includes(x))); else o[c] = ids[0] }
    tmp(doc, "_pal", null);
    if (b.dataset.ctx[0] === "s") { marcaMa(); refresca(); el.querySelector("#dkpf").innerHTML = panSlide() } else { save(); assistent() }
  }
  el.addEventListener("click", onIk);
  // botons de la pàgina d'apartats
  el.addEventListener("click", async e => {
    const a = e.target.closest("[data-ak]"); if (!a || !doc || a.tagName === "INPUT") return;
    if (a.dataset.ak === "ves") { e.preventDefault(); const c = document.getElementById("cat-" + a.dataset.v); c && c.scrollIntoView({ behavior: "smooth", block: "start" }) }
    if (a.dataset.ak === "pl") { const ve = doc.plantilla === "director", nu = a.dataset.v === "director"; doc.plantilla = a.dataset.v; if (ve !== nu) { const pj = doc.dades.projecte = doc.dades.projecte || {}; delete pj.titol; delete pj.format; if (nu) { pj.titol = "pablo anarte"; pj.format = "director de cine" } if (!doc.titolMa) doc.titulo = nu ? "pablo anarte" : "" } await preomple(doc); save(); assistent() }
    if (a.dataset.ak === "gen") { if (!await H.confirma("Es refaran les diapositives amb aquests apartats i es perdran els retocs fets a mà. Continuar?")) return; doc.ma = false; sel = 0; viu(true); el.querySelector("#dkma").innerHTML = ""; H.toast("Dossier refet: " + doc.slides.length + " diapositives") }
  });
  document.getElementById("hsh").addEventListener("click", async e => {
    if (el.hidden || !doc) return; onIk(e);
    const r = e.target.closest("[data-rk]"); if (r && +r.dataset.rk) { sel = +r.dataset.rk - 1; H.cerrar(); pintar() }
    const x = e.target.closest("[data-xk]");
    if (x) { if (x.dataset.xk === "go") { const v = k => document.querySelector(`#hshc [data-xk="${k}"].on`).dataset.v; const [f, q, aa] = [v("f"), v("q"), v("a")]; H.cerrar(); exporta(f, q, aa).catch(() => H.toast("No s'ha pogut exportar")) } else x.parentNode.querySelectorAll("[data-xk]").forEach(y => y.classList.toggle("on", y === x)) }
    const s = e.target.closest('[data-sk="copia"]'); if (s) { navigator.clipboard.writeText(document.getElementById("sh-url").value).then(() => H.toast("Enllaç copiat")) }
  });
  // arrossegar miniatures per reordenar
  let dr = null;
  el.addEventListener("dragstart", e => { const t = e.target.closest("[data-dr]"); if (t) { dr = +t.dataset.dr; e.dataTransfer.setData("text/plain", "x") } });
  el.addEventListener("dragover", e => { if (dr != null && e.target.closest("[data-dr]")) e.preventDefault() });
  el.addEventListener("drop", e => { const t = e.target.closest("[data-dr]"); if (dr == null || !t) return; e.preventDefault(); marcaMa(); const to = +t.dataset.dr, [s] = doc.slides.splice(dr, 1); doc.slides.splice(to, 0, s); sel = to; dr = null; refresca(1) });
  document.addEventListener("keydown", e => { if (e.defaultPrevented || el.hidden || !doc || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable || document.querySelector(".hdlg") || !document.getElementById("hsh").hidden || (window.DKL && DKL.actiu())) return; if (e.key === "ArrowRight" && sel < doc.slides.length - 1) { sel++; pintar() } if (e.key === "ArrowLeft" && sel) { sel--; pintar() } });

  window.addEventListener("hub-sec", e => { if (e.detail === "decks" && (!doc || !H.dePj(doc))) { mode = "slides"; lista() } });
  window.DECKS = { obre };
  lista();
})();
