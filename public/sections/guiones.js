// Guiones técnicos: tabla editable por escenas, con colores por escala, imágenes, pegar desde Sheets y exportar a PDF/Excel.
(() => {
  const { E, escColor, escNorm, ESC, FILA, BANDA, uid } = R, el = document.getElementById("s-guiones");
  // Columnas del guion técnico. Para añadir una: una línea aquí.
  const COLS = [
    { k: "num", l: "Pl.", w: 46 }, { k: "sujeto", l: "Sujeto", w: 120 }, { k: "escala", l: "Escala", w: 74, t: "escala" },
    { k: "angulo", l: "Angulación", w: 96 }, { k: "posicion", l: "Posición cámara", w: 96 }, { k: "mov", l: "Movimiento", w: 104 },
    { k: "soporte", l: "Soporte", w: 90 }, { k: "lente", l: "Lente", w: 64 }, { k: "sonido", l: "Sonido", w: 74 }, { k: "fps", l: "FPS", w: 50 },
    { k: "desc", l: "Descripción", w: 230 }, { k: "accion", l: "Acción / diálogo", w: 210 }, { k: "notas", l: "Notas", w: 160 },
    { k: "set", l: "Set", w: 110 }, { k: "dur", l: "Min. rodaje", w: 64 }, { k: "img", l: "Imagen", w: 140, t: "img" }
  ];
  const OCULTAS = ["posicion", "fps"];
  let doc = null;
  const vis = () => COLS.filter(c => !(doc.ocultas || OCULTAS).includes(c.k));
  const save = () => H.put(doc);
  const planos = () => doc.escenas.flatMap(e => e.planos);
  const minTot = l => l.reduce((a, p) => a + (+p.dur || 0), 0);

  // ---------- lista de guiones ----------
  async function lista() {
    doc = null;
    const [gs, ps] = await Promise.all([H.col("gt"), H.col("proyecto")]);
    const pn = id => (ps.find(x => x.id === id) || {}).titulo || "";
    el.innerHTML = `<div class="bar"><span style="flex:1"></span><button class="b" data-k="nuevo">+ Guion técnico</button></div><div class="hl">` +
      (gs.length ? gs.slice().sort((a, b) => (b.mod || 0) - (a.mod || 0)).map(g => { const pl = g.escenas.flatMap(e => e.planos); return `<div class="r" data-k="abre" data-id="${g.id}"><i class="dot" style="background:#3b4a5a"></i><div class="g"><b>${E(g.titulo || "Sin título")}</b><small>${E([pn(g.proyecto), g.escenas.length + " escenas", pl.length + " planos", minTot(pl) ? Math.round(minTot(pl) / 6) / 10 + " h de rodaje" : ""].filter(Boolean).join(" · "))}</small></div></div>` }).join("")
        : `<p class="em">Aún no hay guiones técnicos. Crea uno nuevo o pega uno desde Google Sheets.</p>`) + `</div>`;
  }

  // ---------- editor ----------
  async function abrir(id) { doc = (await H.col("gt")).find(x => x.id === id); if (doc) pintar() }
  function celda(c, p, ei, pi) {
    const d = `data-e="${ei}" data-p="${pi}" data-f="${c.k}"`;
    if (c.t === "img") return `<td class="ci" ${d}>${p.img ? `<div class="thumb"><img src="${R.imgUrl(p.img)}" data-k="ver" alt=""><button data-k="qimg" ${d} title="Quitar">×</button></div>` : `<label class="addimg">＋ imagen<input type="file" accept="image/*" data-k="img" ${d} hidden></label>`}</td>`;
    if (c.t === "escala") return `<td style="background:${p.escala ? escColor(p.escala) + "33" : ""}"><input class="cel esc" list="dl-esc" value="${E(p.escala || "")}" ${d} style="border-left:4px solid ${p.escala ? escColor(p.escala) : "transparent"}"></td>`;
    return `<td><textarea class="cel" rows="1" ${d} ${c.k === "set" ? 'list="dl-set"' : ""}>${E(p[c.k] || "")}</textarea></td>`;
  }
  function pintar() {
    const cs = vis(), sets = [...new Set(doc.escenas.map(e => e.lugar).concat(planos().map(p => p.set)).filter(Boolean))];
    H.col("proyecto").then(ps => { const s = el.querySelector("#gt-proy"); if (s) s.innerHTML = `<option value="">Sin proyecto</option>` + ps.map(p => `<option value="${p.id}" ${p.id === doc.proyecto ? "selected" : ""}>${E(p.titulo || "")}</option>`).join("") });
    const pl = planos();
    el.innerHTML = `<div class="bar" style="flex-wrap:wrap;gap:8px"><button class="b2" data-k="volver">← Guiones</button><input class="tt" data-d="titulo" value="${E(doc.titulo || "")}" placeholder="Título" style="max-width:280px;font-weight:700">
      <select id="gt-proy" data-d="proyecto" style="width:auto"></select><input data-d="version" value="${E(doc.version || "")}" placeholder="Versión" style="width:110px">
      <span style="flex:1"></span><small>${doc.escenas.length} esc · ${pl.length} planos · ${Math.round(minTot(pl) / 6) / 10} h</small>
      <button class="b2" data-k="pegar">Pegar desde Sheets</button><button class="b2" data-k="cols">Columnas</button><button class="b2" data-k="renum">Renumerar</button>
      <button class="b2" data-k="pdf">PDF</button><button class="b2" data-k="xls">Excel</button><button class="b" data-k="plan">Crear plan de rodaje →</button></div>
      <div class="lg">${ESC.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join("")}<span style="margin-left:auto">Arrastra ⋮⋮ para reordenar · suelta una imagen sobre una fila para añadirla</span></div>
      <div class="shw"><table class="gt"><thead><tr><th style="width:44px"></th>${cs.map(c => `<th style="min-width:${c.w}px">${c.l}</th>`).join("")}<th style="width:60px"></th></tr></thead><tbody>` +
      doc.escenas.map((e, ei) => `<tr class="eh" data-e="${ei}" style="--c:${e.color || BANDA.escena}"><td colspan="${cs.length + 2}"><div class="ehd">
        <span class="hd" draggable="true" data-dragesc="${ei}">⋮⋮</span><b>ESC</b><input data-se="${ei}" data-f="num" value="${E(e.num || "")}" style="width:46px">
        <select data-se="${ei}" data-f="intext">${["", "INT", "EXT", "INT/EXT"].map(o => `<option ${o === (e.intext || "") ? "selected" : ""}>${o}</option>`).join("")}</select>
        <input data-se="${ei}" data-f="lugar" value="${E(e.lugar || "")}" placeholder="Lugar / set" style="width:200px"><input data-se="${ei}" data-f="momento" list="dl-mom" value="${E(e.momento || "")}" placeholder="Día / noche" style="width:110px">
        <input data-se="${ei}" data-f="paginas" value="${E(e.paginas || "")}" placeholder="Págs." style="width:64px"><input data-se="${ei}" data-f="sinopsis" value="${E(e.sinopsis || "")}" placeholder="Sinopsis de la escena" style="flex:1;min-width:160px">
        <small>${e.planos.length} pl · ${minTot(e.planos)} min</small>
        <span class="sw">${["#3b4a5a", "#7a1f2b", "#1f4e79", "#2e6b3a", "#6b3fa0", "#b35c00", "#555"].map(c => `<i data-k="cesc" data-e="${ei}" data-c="${c}" style="background:${c}"></i>`).join("")}</span>
        <button class="x" data-k="delesc" data-e="${ei}" title="Borrar escena">×</button></div></td></tr>` +
        e.planos.map((p, pi) => `<tr class="pr" draggable="false" data-e="${ei}" data-p="${pi}" style="${p.color ? "background:" + FILA[p.color] : ""}${p.ok ? ";opacity:.55" : ""}">
          <td class="hdc"><span class="hd" draggable="true" data-drag="${ei},${pi}">⋮⋮</span><input type="checkbox" data-k="ok" data-e="${ei}" data-p="${pi}" ${p.ok ? "checked" : ""} title="Hecho"><i class="cdot" data-k="color" data-e="${ei}" data-p="${pi}" style="background:${FILA[p.color] || "#fff"}" title="Color de fila"></i></td>` +
          cs.map(c => celda(c, p, ei, pi)).join("") + `<td class="acc"><button data-k="dup" data-e="${ei}" data-p="${pi}" title="Duplicar">⧉</button><button data-k="del" data-e="${ei}" data-p="${pi}" title="Borrar">×</button></td></tr>`).join("") +
        `<tr><td></td><td colspan="${cs.length + 1}"><button class="addrow" data-k="addp" data-e="${ei}">+ plano</button></td></tr>`).join("") +
      `</tbody></table></div><button class="b2" style="margin-top:12px" data-k="addesc">+ Escena</button>
      <datalist id="dl-esc">${ESC.map(x => `<option value="${x[0]}">`).join("")}</datalist><datalist id="dl-set">${sets.map(s => `<option value="${E(s)}">`).join("")}</datalist>
      <datalist id="dl-mom">${["DÍA", "NOCHE", "AMANECER", "ATARDECER", "HORA MÁGICA"].map(x => `<option value="${x}">`).join("")}</datalist>`;
    R.ajusta(el);
  }
  const nuevoPlano = e => ({ id: uid(), num: String((e.planos.length ? +e.planos.at(-1).num || e.planos.length : 0) + 1), set: e.lugar || "" });

  // ---------- eventos ----------
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k, ei = +b.dataset.e, pi = +b.dataset.p;
    if (k === "nuevo") { const d = { id: H.uid("gt"), titulo: "", escenas: [{ id: uid(), num: "1", intext: "INT", lugar: "", planos: [] }] }; d.escenas[0].planos.push(nuevoPlano(d.escenas[0])); await H.put(d, 1); doc = d; pintar(); el.querySelector(".tt").focus(); return }
    if (k === "abre") return abrir(b.dataset.id);
    if (!doc) return;
    if (k === "volver") return lista();
    if (k === "addp") { doc.escenas[ei].planos.push(nuevoPlano(doc.escenas[ei])); save(); pintar(); const t = el.querySelectorAll(`tr.pr[data-e="${ei}"] textarea`); t.length && t[t.length - (vis().length - 2)]?.focus() }
    if (k === "addesc") { const u = doc.escenas.at(-1); const n = { id: uid(), num: String((+(u && u.num) || doc.escenas.length) + 1), intext: "INT", lugar: "", planos: [] }; n.planos.push(nuevoPlano(n)); doc.escenas.push(n); save(); pintar() }
    if (k === "delesc" && confirm("¿Borrar la escena y sus planos?")) { doc.escenas.splice(ei, 1); save(); pintar() }
    if (k === "cesc") { doc.escenas[ei].color = b.dataset.c; save(); pintar() }
    if (k === "dup") { const p = doc.escenas[ei].planos[pi]; doc.escenas[ei].planos.splice(pi + 1, 0, { ...p, id: uid(), ok: false }); save(); pintar() }
    if (k === "del") { doc.escenas[ei].planos.splice(pi, 1); save(); pintar() }
    if (k === "ok") { doc.escenas[ei].planos[pi].ok = b.checked; save(); b.closest("tr").style.opacity = b.checked ? .55 : 1 }
    if (k === "color") { const p = doc.escenas[ei].planos[pi]; p.color = ((p.color || 0) + 1) % FILA.length; save(); b.closest("tr").style.background = FILA[p.color]; b.style.background = FILA[p.color] || "#fff" }
    if (k === "qimg") { const p = doc.escenas[ei].planos[pi]; H.api("DELETE", "archivo/" + p.img).catch(() => { }); delete p.img; save(); pintar() }
    if (k === "ver") window.open(b.src, "_blank");
    if (k === "renum") { doc.escenas.forEach((s, i) => { s.num = String(i + 1); s.planos.forEach((p, j) => p.num = String(j + 1)) }); save(); pintar(); H.toast("Escenas y planos renumerados") }
    if (k === "cols") H.sheet(`<h2 style="margin-top:0">Columnas visibles</h2>` + COLS.map(c => `<label class="ck"><input type="checkbox" data-col="${c.k}" ${(doc.ocultas || OCULTAS).includes(c.k) ? "" : "checked"}> ${c.l}</label>`).join(""), pintar);
    if (k === "pegar") H.sheet(`<h2 style="margin-top:0">Pegar desde Google Sheets o Excel</h2><p class="em" style="margin-top:0">Selecciona en tu hoja las filas <b>incluida la fila de cabecera</b> (Esc, Plano, Sujeto, Escala…), copia (Cmd+C) y pega aquí. Reconozco las columnas por su nombre en castellano, catalán o inglés.</p><textarea id="gt-paste" rows="12" placeholder="Pega aquí…"></textarea><button class="b" data-k="gtimport" style="margin-top:10px">Importar</button>`);
    if (k === "pdf") exportarPDF();
    if (k === "xls") exportarExcel();
    if (k === "plan") { if (!planos().length) return H.toast("Añade planos primero"); hubShow("planes"); window.P && P.generar(doc.id) }
  });
  document.getElementById("hsh").addEventListener("change", e => {
    const c = e.target.dataset.col; if (!c || !doc) return; const o = new Set(doc.ocultas || OCULTAS); e.target.checked ? o.delete(c) : o.add(c); doc.ocultas = [...o]; save();
  });
  document.getElementById("hsh").addEventListener("click", e => {
    if (!e.target.closest('[data-k="gtimport"]') || !doc) return;
    const fs = R.pegar(document.getElementById("gt-paste").value); if (!fs.length) return H.toast("No he reconocido filas. ¿Has copiado también la cabecera?");
    if (doc.escenas.length === 1 && doc.escenas[0].planos.length <= 1 && !doc.escenas[0].planos.some(p => p.sujeto || p.desc)) doc.escenas = [];
    let cur = null;
    for (const f of fs) {
      const n = f.esc || (cur ? cur.num : "1");
      if (!cur || cur.num !== n) { cur = doc.escenas.find(x => x.num === n) || null; if (!cur) { cur = { id: uid(), num: n, intext: (f.intext || "").toUpperCase().replace(/\.$/, "").replace(/\./g, ""), lugar: f.set || "", planos: [] }; doc.escenas.push(cur) } }
      delete f.esc; if (f.escala) f.escala = escNorm(f.escala) || f.escala; if (f.dur) f.dur = String(parseInt(f.dur) || ""); if (!f.set) f.set = cur.lugar || "";
      cur.planos.push(f);
    }
    save(); H.cerrar(); pintar(); H.toast(fs.length + " planos importados");
  });
  el.addEventListener("input", e => {
    const t = e.target; if (!doc) return;
    if (t.dataset.d) { doc[t.dataset.d] = t.value; return save() }
    if (t.dataset.se != null) { doc.escenas[+t.dataset.se][t.dataset.f] = t.value; return save() }
    if (t.dataset.f && t.dataset.p != null && !t.dataset.k) {
      const p = doc.escenas[+t.dataset.e].planos[+t.dataset.p]; p[t.dataset.f] = t.value; save();
      if (t.dataset.f === "escala") { const c = escColor(t.value); t.style.borderLeftColor = t.value ? c : "transparent"; t.parentNode.style.background = t.value ? c + "33" : "" }
    }
  });
  el.addEventListener("change", async e => {
    const t = e.target; if (!doc) return;
    if (t.dataset.d === "proyecto") { doc.proyecto = t.value; save() }
    if (t.dataset.se != null && t.tagName === "SELECT") { doc.escenas[+t.dataset.se][t.dataset.f] = t.value; save() }
    if (t.dataset.k === "img" && t.files[0]) { const id = await R.subirImagen(t.files[0]); if (id) { doc.escenas[+t.dataset.e].planos[+t.dataset.p].img = id; save(); pintar() } }
  });
  // arrastrar filas / escenas / imágenes
  let drag = null;
  el.addEventListener("dragstart", e => { const h = e.target.closest("[data-drag],[data-dragesc]"); if (!h) return; drag = h.dataset.drag ? { p: h.dataset.drag.split(",").map(Number) } : { e: +h.dataset.dragesc }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "x") });
  el.addEventListener("dragover", e => { const tr = e.target.closest("tr.pr,tr.eh"); if (!tr) return; e.preventDefault(); el.querySelectorAll(".dropb").forEach(x => x.classList.remove("dropb")); tr.classList.add("dropb") });
  el.addEventListener("drop", async e => {
    const tr = e.target.closest("tr.pr,tr.eh"); if (!tr || !doc) return; e.preventDefault(); el.querySelectorAll(".dropb").forEach(x => x.classList.remove("dropb"));
    const te = +tr.dataset.e, tp = tr.dataset.p != null ? +tr.dataset.p : 0;
    if (!drag && e.dataTransfer.files.length && tr.dataset.p != null) { const id = await R.subirImagen(e.dataTransfer.files[0]); if (id) { doc.escenas[te].planos[tp].img = id; save(); pintar() } return }
    if (!drag) return;
    // se coloca delante de la fila sobre la que se suelta (sobre la cabecera de escena: al principio de esa escena)
    if (drag.e != null) { const [s] = doc.escenas.splice(drag.e, 1); doc.escenas.splice(te > drag.e ? te - 1 : te, 0, s) }
    else { const [se, sp] = drag.p, [p] = doc.escenas[se].planos.splice(sp, 1); let i = tr.dataset.p != null ? tp : 0; if (se === te && tr.dataset.p != null && sp < tp) i--; doc.escenas[te].planos.splice(i, 0, p) }
    drag = null; save(); pintar();
  });
  el.addEventListener("dragend", () => { drag = null; el.querySelectorAll(".dropb").forEach(x => x.classList.remove("dropb")) });

  // ---------- exportar ----------
  function exportarPDF() {
    const cs = vis();
    R.pdf(`<div class="pz"><h1>${E(doc.titulo || "Guion técnico")}</h1><p>${E(["GUION TÉCNICO", doc.version].filter(Boolean).join(" · "))}</p><table><thead><tr>${cs.map(c => `<th>${c.l}</th>`).join("")}</tr></thead><tbody>` +
      doc.escenas.map(e => `<tr><td colspan="${cs.length}" class="band" style="background:${e.color || BANDA.escena};color:#fff">ESC ${E(e.num)} · ${E([e.intext, e.lugar, e.momento].filter(Boolean).join(" · "))}${e.paginas ? " · " + E(e.paginas) + " págs." : ""}${e.sinopsis ? " — " + E(e.sinopsis) : ""}</td></tr>` +
        e.planos.map(p => `<tr style="${p.color ? "background:" + FILA[p.color] : ""}">${cs.map(c => c.t === "img" ? `<td>${p.img ? `<img src="${R.imgUrl(p.img)}">` : ""}</td>` : c.t === "escala" ? `<td style="background:${p.escala ? escColor(p.escala) : ""};color:${p.escala ? "#fff" : ""};font-weight:700">${E(p.escala || "")}</td>` : `<td>${E(p[c.k] || "")}</td>`).join("")}</tr>`).join("")).join("") + `</tbody></table></div>`);
  }
  function exportarExcel() {
    const cs = vis(), ie = cs.findIndex(c => c.t === "escala"), ii = cs.findIndex(c => c.t === "img");
    R.excel("GT " + (doc.titulo || "guion"), [{
      nombre: "Guion técnico", titulo: "GUION TÉCNICO · " + (doc.titulo || "").toUpperCase(), sub: doc.version ? [doc.version] : [],
      cols: cs.map(c => ({ l: c.l, w: c.t === "img" ? 18 : Math.round(c.w / 7), izq: ["desc", "accion", "notas"].includes(c.k) })),
      filas: doc.escenas.flatMap(e => [{ banda: `ESC ${e.num || ""} · ${[e.intext, e.lugar, e.momento].filter(Boolean).join(" · ")}${e.sinopsis ? " — " + e.sinopsis : ""}`, color: e.color || BANDA.escena, blanco: 1 }]
        .concat(e.planos.map(p => ({ celdas: cs.map(c => c.t === "img" ? "" : p[c.k] || ""), color: FILA[p.color] || "", colores: ie >= 0 && p.escala ? { [ie]: escColor(p.escala) } : {}, img: ii >= 0 ? p.img : null, imgCol: ii }))))
    }]);
  }

  window.addEventListener("hub-sec", e => { if (e.detail === "guiones" && !doc) lista() });
  window.GT = { abrir };
  lista();
})();
