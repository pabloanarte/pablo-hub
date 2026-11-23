// Guiones técnicos: tabla editable por escenas, con colores por escala, imágenes, pegar desde Sheets y exportar a PDF/Excel.
(() => {
  const { E, escColor, escNorm, ESC, FILA, BANDA, uid } = R, el = document.getElementById("s-guiones");
  // Columnes base del guió tècnic (l'ordre, les visibles i les columnes pròpies es configuren a "Columnes").
  const BASE = [
    { k: "num", l: "Pl.", w: 46 }, { k: "sujeto", l: "Subjecte", w: 120 }, { k: "escala", l: "Escala", w: 74, t: "escala" },
    { k: "angulo", l: "Ang. vertical", w: 112, dl: "dl-av" }, { k: "posicion", l: "Ang. horitzontal", w: 124, dl: "dl-ah" }, { k: "mov", l: "Moviment", w: 104 },
    { k: "soporte", l: "Suport", w: 90 }, { k: "lente", l: "Òptica", w: 64 }, { k: "sonido", l: "So", w: 74 }, { k: "fps", l: "FPS", w: 50 },
    { k: "desc", l: "Descripció", w: 230 }, { k: "accion", l: "Acció / diàleg", w: 210 }, { k: "notas", l: "Notes", w: 160 },
    { k: "set", l: "Set", w: 110 }, { k: "dur", l: "Min. rodatge", w: 64 }, { k: "img", l: "Imatge", w: 140, t: "img" }
  ];
  const AMB_MIN = ["Videoclip", "Publicitat"]; // tipus de projecte que mostren "Min. rodatge" per defecte
  let doc = null;
  const totes = () => { const o = (doc.cols || []).filter(k => BASE.some(c => c.k === k) || (doc.custom || {})[k]); BASE.forEach(c => { if (!o.includes(c.k)) o.push(c.k) }); Object.keys(doc.custom || {}).forEach(k => { if (!o.includes(k)) o.push(k) }); return o.map(k => BASE.find(c => c.k === k) || { k, l: doc.custom[k], w: 150 }) };
  const vis = () => totes().filter(c => !(doc.ocultas || []).includes(c.k));
  // Columnes per defecte: les desades com a predeterminades o, si no, totes menys FPS (i Min. rodatge si el projecte no és videoclip ni publicitat)
  async function perDefecte(d) {
    const aj = (await H.col("ajust")).find(x => x.id === "ajust:gt"), p = (await H.col("proyecto")).find(x => x.id === d.proyecto);
    if (aj) { d.cols = aj.cols.slice(); d.custom = { ...(aj.custom || {}) }; d.ocultas = aj.ocultas.slice(); d.colsAuto = false; return }
    d.cols = BASE.map(c => c.k); d.custom = d.custom || {}; d.ocultas = ["fps"].concat(p && AMB_MIN.includes(p.categoria) ? [] : ["dur"]); d.colsAuto = true;
  }
  const save = () => H.put(doc);
  const planos = () => doc.escenas.flatMap(e => e.planos);
  const minTot = l => l.reduce((a, p) => a + (+p.dur || 0), 0);

  // ---------- lista de guiones ----------
  let ver = 0;
  async function lista() {
    doc = null; const v = ++ver;
    const [gs0, ps] = await Promise.all([H.col("gt"), H.col("proyecto")]); const gs = gs0.filter(H.dePj);
    if (v !== ver) return;
    const pn = id => (ps.find(x => x.id === id) || {}).titulo || "";
    el.innerHTML = `<div class="bar"><span style="flex:1"></span><button class="b2" data-k="importar">Importar PDF, Excel o Google Sheets</button><button class="b" data-k="nuevo">+ Guió tècnic</button></div><div class="hl">` +
      (gs.length ? gs.slice().sort((a, b) => (b.mod || 0) - (a.mod || 0)).map(g => { const pl = g.escenas.flatMap(e => e.planos); return `<div class="r" data-k="abre" data-id="${g.id}"><i class="dot" style="background:#3b4a5a"></i><div class="g"><b>${E(g.titulo || "Sense títol")}</b><small>${E([pn(g.proyecto), g.escenas.length + (g.escenas.length === 1 ? " escena" : " escenes"), pl.length + (pl.length === 1 ? " pla" : " plans"), minTot(pl) ? Math.round(minTot(pl) / 6) / 10 + " h de rodatge" : ""].filter(Boolean).join(" · "))}</small></div></div>` }).join("")
        : `<p class="em">Encara no hi ha guions tècnics. Crea'n un de nou o enganxa'n un des de Google Sheets.</p>`) + `</div>`;
  }

  // ---------- editor ----------
  async function abrir(id) { ++ver; doc = (await H.col("gt")).find(x => x.id === id); if (!doc) return; if (!doc.ocultas || !doc.cols) { await perDefecte(doc); save() } pintar() }
  function celda(c, p, ei, pi) {
    const d = `data-e="${ei}" data-p="${pi}" data-f="${c.k}"`;
    if (c.t === "img") return `<td class="ci" ${d}>${p.img ? `<div class="thumb"><img src="${R.imgUrl(p.img)}" data-k="ver" alt=""><button data-k="qimg" ${d} title="Treure">×</button></div>` : `<label class="addimg">＋ imatge<input type="file" accept="image/*" data-k="img" ${d} hidden></label>`}</td>`;
    if (c.t === "escala") return `<td style="background:${p.escala ? escColor(p.escala) : ""}"><input class="cel esc" list="dl-esc" value="${E(p.escala || "")}" ${d} style="${p.escala ? "color:#fff" : ""}"></td>`;
    if (c.dl) return `<td><input class="cel" list="${c.dl}" ${d} value="${E(p[c.k] || "")}"></td>`;
    return `<td><textarea class="cel" rows="1" ${d}>${E(p[c.k] || "")}</textarea></td>`;
  }
  // Avís quan el guió (desglossament) ha canviat després de fer aquest guió tècnic
  async function avis() {
    const box = el.querySelector("#gtav"); if (!box || !doc || !window.DESG || !DESG.diferencies) return;
    const ds = await H.col("desg"), pj = doc.proyecto && (await H.col("proyecto")).find(p => p.id === doc.proyecto);
    let d = doc.desg && ds.find(x => x.id === doc.desg);
    if (!d) { const c = pj && pj.desg && ds.find(x => x.id === pj.desg); box.innerHTML = c ? `<div class="gtav"><span>Aquest guió tècnic no està vinculat al guió del projecte, i no et podrà avisar quan canviï.</span><button class="b2" data-k="gtvincula">Vincular-lo</button></div>` : ""; return }
    const x = DESG.diferencies(doc, d), n = x.nous.length + x.canvis.length + x.fora.length;
    el.querySelectorAll("tr.eh .gtcv").forEach(t => t.remove());
    x.canvis.forEach(e => { const i = doc.escenas.indexOf(e), tr = el.querySelector(`tr.eh[data-e="${i}"] .ehd`); tr && tr.insertAdjacentHTML("beforeend", `<span class="gtcv">Canviada al guió</span>`) });
    x.fora.forEach(e => { const i = doc.escenas.indexOf(e), tr = el.querySelector(`tr.eh[data-e="${i}"] .ehd`); tr && tr.insertAdjacentHTML("beforeend", `<span class="gtcv">Ja no és al guió</span>`) });
    const ll = l => l.map(e => E(e.num || "?")).join(", ");
    box.innerHTML = n ? `<div class="gtav"><span><b>El guió ha canviat.</b> ${[x.nous.length && `${x.nous.length} ${x.nous.length === 1 ? "escena nova" : "escenes noves"} (${ll(x.nous)})`, x.canvis.length && `${x.canvis.length} ${x.canvis.length === 1 ? "escena canviada" : "escenes canviades"} (${ll(x.canvis)})`, x.fora.length && `${x.fora.length} ${x.fora.length === 1 ? "escena que ja no hi és" : "escenes que ja no hi són"} (${ll(x.fora)})`].filter(Boolean).join(" · ")}.</span>
      ${x.nous.length ? `<button class="b2" data-k="gtnous">Afegir les noves</button>` : ""}${x.canvis.length ? `<button class="b2" data-k="gtcap">Actualitzar capçaleres</button>` : ""}<button class="b2" data-k="gtrevisat">Ja ho he revisat</button></div>` : "";
  }
  async function aplicaAvis(k) {
    const d = (await H.col("desg")).find(x => x.id === doc.desg); if (!d) return;
    const x = DESG.diferencies(doc, d), de = s => ({ num: s.num, intext: s.intext, lugar: s.set, momento: s.moment, paginas: s.pag });
    if (k === "gtnous") x.nous.forEach(s => { const j = d.escenes.indexOf(s); let pos = -1; for (let q = j - 1; q >= 0 && pos < 0; q--) pos = doc.escenas.findIndex(e => e.dsg === d.escenes[q].id); const n = { id: uid(), dsg: s.id, pet: DESG.firma(s), ...de(s), sinopsis: [s.pers && "Personatges: " + s.pers, s.atrezzo && "Atrezzo: " + s.atrezzo, s.vestuari && "Vestuari: " + s.vestuari, s.notes].filter(Boolean).join("\n"), planos: [] }; n.planos.push(nuevoPlano(n)); doc.escenas.splice(pos + 1, 0, n) });
    if (k === "gtcap") x.canvis.forEach(e => { const s = d.escenes.find(y => y.id === e.dsg); Object.assign(e, de(s), { pet: DESG.firma(s) }) });
    if (k === "gtrevisat") { x.canvis.forEach(e => { const s = d.escenes.find(y => y.id === e.dsg); e.pet = DESG.firma(s) }); x.fora.forEach(e => e.fora = true); doc.ignora = (doc.ignora || []).concat(x.nous.map(s => s.id)) }
    save(); pintar();
  }
  async function vincula() {
    const pj = (await H.col("proyecto")).find(p => p.id === doc.proyecto), d = pj && (await H.col("desg")).find(x => x.id === pj.desg); if (!d) return;
    doc.desg = d.id; doc.escenas.forEach(e => { const s = d.escenes.find(y => String(y.num) === String(e.num)); if (s) { e.dsg = s.id; e.pet = DESG.firma(s) } });
    save(); pintar(); H.toast("Vinculat al guió del projecte");
  }
  function pintar() {
    setTimeout(avis, 0);
    const cs = vis(), sets = [...new Set(doc.escenas.map(e => e.lugar).concat(planos().map(p => p.set)).filter(Boolean))];
    H.col("proyecto").then(ps => { const s = el.querySelector("#gt-proy"); if (s) s.innerHTML = `<option value="">Sense projecte</option>` + ps.filter(p => H.meu(p) || p.id === doc.proyecto).map(p => `<option value="${p.id}" ${p.id === doc.proyecto ? "selected" : ""}>${E(p.titulo || "")}</option>`).join("") });
    const pl = planos();
    el.innerHTML = `<div class="bar tb"><button class="b2" data-k="volver">← Guions</button><input class="tt" data-d="titulo" value="${E(doc.titulo || "")}" placeholder="Títol del guió" style="max-width:320px;font-weight:700">
      <select id="gt-proy" data-d="proyecto" style="width:auto"></select><input data-d="version" value="${E(doc.version || "")}" placeholder="Versió" style="width:110px">
      <span class="cnt">${doc.escenas.length} ${doc.escenas.length === 1 ? "escena" : "escenes"} · ${pl.length} ${pl.length === 1 ? "pla" : "plans"}${minTot(pl) ? " · " + Math.round(minTot(pl) / 6) / 10 + " h" : ""}</span><span style="flex:1"></span><button class="del" style="margin:0" data-k="delgt">Eliminar guió</button></div>
      <div class="bar tb"><button class="b2" data-k="pegar">Enganxar des de Sheets</button><button class="b2" data-k="cols">Columnes</button><button class="b2" data-k="renum">Renumerar</button><span style="flex:1"></span>
      ${R.selLang()}<button class="b2" data-k="pdf">PDF</button><button class="b2" data-k="xls">Excel</button><button class="b" data-k="plan">Crear pla de rodatge →</button></div>
      <div id="gtav"></div>
      <div class="lg">${ESC.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join("")}<span style="margin-left:auto">Arrossega ⋮⋮ per reordenar · deixa anar una imatge sobre una fila per afegir-la</span></div>
      <div class="shw"><table class="gt" style="table-layout:fixed;width:${70 + cs.reduce((a, c) => a + c.w, 0) + 64}px"><colgroup><col style="width:70px">${cs.map(c => `<col style="width:${c.w}px">`).join("")}<col style="width:64px"></colgroup><tbody>` +
      doc.escenas.map((e, ei) => `<tr class="eh" data-e="${ei}" style="--c:${e.color || BANDA.escena}"><td colspan="${cs.length + 2}"><div class="ehd">
        <span class="hd" draggable="true" data-dragesc="${ei}">⋮⋮</span><b>ESC</b><input data-se="${ei}" data-f="num" value="${E(e.num || "")}" style="width:46px">
        <select data-se="${ei}" data-f="intext">${["", "INT", "EXT", "INT/EXT"].map(o => `<option ${o === (e.intext || "") ? "selected" : ""}>${o}</option>`).join("")}</select>
        <input data-se="${ei}" data-f="lugar" value="${E(e.lugar || "")}" placeholder="Lloc / set" style="width:200px"><input data-se="${ei}" data-f="momento" list="dl-mom" value="${E(e.momento || "")}" placeholder="Dia / nit" style="width:110px">
        <input data-se="${ei}" data-f="paginas" value="${E(e.paginas || "")}" placeholder="Pàg." style="width:64px"><input data-se="${ei}" data-f="sinopsis" value="${E(e.sinopsis || "")}" placeholder="Sinopsi de l'escena" style="flex:1;min-width:160px">
        <small>${e.planos.length} ${e.planos.length === 1 ? "pla" : "plans"}${minTot(e.planos) ? " · " + minTot(e.planos) + " min" : ""}</small>
        <span class="sw">${["#3b4a5a", "#7a1f2b", "#1f4e79", "#2e6b3a", "#6b3fa0", "#b35c00", "#555"].map(c => `<i data-k="cesc" data-e="${ei}" data-c="${c}" style="background:${c}"></i>`).join("")}</span>
        <button class="x" data-k="delesc" data-e="${ei}" title="Esborrar escena">×</button></div></td></tr><tr class="ch"><th style="width:44px"></th>${cs.map(c => `<th style="min-width:${c.w}px">${E(c.l)}</th>`).join("")}<th style="width:60px"></th></tr>` +
        e.planos.map((p, pi) => `<tr class="pr" draggable="false" data-e="${ei}" data-p="${pi}" style="${p.color ? "background:" + FILA[p.color] : ""}${p.ok ? ";opacity:.55" : ""}">
          <td class="hdc"><span class="hd" draggable="true" data-drag="${ei},${pi}">⋮⋮</span><input type="checkbox" data-k="ok" data-e="${ei}" data-p="${pi}" ${p.ok ? "checked" : ""} title="Fet"><i class="cdot" data-k="color" data-e="${ei}" data-p="${pi}" style="background:${FILA[p.color] || "#fff"}" title="Color de fila"></i></td>` +
          cs.map(c => celda(c, p, ei, pi)).join("") + `<td class="acc"><button data-k="dup" data-e="${ei}" data-p="${pi}" title="Duplicar">⧉</button><button data-k="del" data-e="${ei}" data-p="${pi}" title="Esborrar">×</button></td></tr>`).join("") +
        `<tr><td></td><td colspan="${cs.length + 1}"><button class="addrow" data-k="addp" data-e="${ei}">+ pla</button></td></tr>`).join("") +
      `</tbody></table></div><button class="b2" style="margin-top:12px" data-k="addesc">+ Escena</button>
      <datalist id="dl-av">${["Normal", "Picat", "Contrapicat", "Zenital", "Nadir", "Holandès"].map(x => `<option value="${x}">`).join("")}</datalist><datalist id="dl-ah">${["Frontal", "3/4", "Perfil", "Dorsal", "POV"].map(x => `<option value="${x}">`).join("")}</datalist><datalist id="dl-esc">${ESC.map(x => `<option value="${x[0]}">`).join("")}</datalist><datalist id="dl-set">${sets.map(s => `<option value="${E(s)}">`).join("")}</datalist>
      <datalist id="dl-mom">${["DIA", "NIT", "MATINADA", "CAPVESPRE", "HORA MÀGICA"].map(x => `<option value="${x}">`).join("")}</datalist>`;
    R.ajusta(el);
  }
  const nuevoPlano = e => ({ id: uid(), num: String((e.planos.length ? +e.planos.at(-1).num || e.planos.length : 0) + 1), set: e.lugar || "" });

  // ---------- eventos ----------
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k, ei = +b.dataset.e, pi = +b.dataset.p;
    if (k === "nuevo") { const d = { id: H.uid("gt"), titulo: "", proyecto: H.pj() === "-" ? "" : H.pj(), escenas: [{ id: uid(), num: "1", intext: "INT", lugar: "", planos: [] }] }; d.escenas[0].planos.push(nuevoPlano(d.escenas[0])); await perDefecte(d); await H.put(d, 1); doc = d; pintar(); el.querySelector(".tt").focus(); return }
    if (k === "abre") return abrir(b.dataset.id);
    if (k === "importar") return IMP.dialeg("gt", async escenes => { const d = { id: H.uid("gt"), titulo: "Guió importat", proyecto: H.pj() === "-" ? "" : H.pj(), escenas: escenes }; await perDefecte(d); if (escenes.some(e => e.planos.some(p => p.dur))) d.ocultas = d.ocultas.filter(x => x !== "dur"); await H.put(d, 1); doc = d; pintar(); H.toast(escenes.reduce((a, e) => a + e.planos.length, 0) + " plans importats"); const t = el.querySelector(".tt"); t && (t.focus(), t.select()) });
    if (!doc) return;
    if (k === "gtnous" || k === "gtcap" || k === "gtrevisat") return aplicaAvis(k);
    if (k === "gtvincula") return vincula();
    if (k === "volver") return lista();
    if (k === "addp") { doc.escenas[ei].planos.push(nuevoPlano(doc.escenas[ei])); save(); pintar(); const t = el.querySelectorAll(`tr.pr[data-e="${ei}"] textarea`); t.length && t[t.length - (vis().length - 2)]?.focus() }
    if (k === "addesc") { const u = doc.escenas.at(-1); const n = { id: uid(), num: String((+(u && u.num) || doc.escenas.length) + 1), intext: "INT", lugar: "", planos: [] }; n.planos.push(nuevoPlano(n)); doc.escenas.push(n); save(); pintar() }
    if (k === "delesc" && confirm("Esborrar l'escena i els seus plans?")) { doc.escenas.splice(ei, 1); save(); pintar() }
    if (k === "cesc") { doc.escenas[ei].color = b.dataset.c; save(); pintar() }
    if (k === "dup") { const p = doc.escenas[ei].planos[pi]; doc.escenas[ei].planos.splice(pi + 1, 0, { ...p, id: uid(), ok: false }); save(); pintar() }
    if (k === "del" && confirm("Esborrar aquest pla?")) { doc.escenas[ei].planos.splice(pi, 1); save(); pintar() }
    if (k === "delgt" && confirm("Eliminar aquest guió tècnic sencer? No es pot desfer.")) { await H.del(doc); doc = null; H.toast("Guió eliminat"); return lista() }
    if (k === "ok") { doc.escenas[ei].planos[pi].ok = b.checked; save(); b.closest("tr").style.opacity = b.checked ? .55 : 1 }
    if (k === "color") { const p = doc.escenas[ei].planos[pi]; p.color = ((p.color || 0) + 1) % FILA.length; save(); b.closest("tr").style.background = FILA[p.color]; b.style.background = FILA[p.color] || "#fff" }
    if (k === "qimg") { const p = doc.escenas[ei].planos[pi]; if (!p.imgSb) H.api("DELETE", "archivo/" + p.img).catch(() => { }); delete p.img; delete p.imgSb; save(); pintar() }
    if (k === "ver") window.open(b.src, "_blank");
    if (k === "renum") { doc.escenas.forEach((s, i) => { s.num = String(i + 1); s.planos.forEach((p, j) => p.num = String(j + 1)) }); save(); pintar(); H.toast("Escenes i plans renumerats") }
    if (k === "cols") panell();
    if (k === "pegar") H.sheet(`<h2 style="margin-top:0">Enganxar des de Google Sheets o Excel</h2><p class="em" style="margin-top:0">Selecciona al full les files <b>inclosa la fila de capçalera</b> (Esc, Pla, Subjecte, Escala…), copia (Cmd+C) i enganxa-ho aquí. Reconec les columnes pel nom en català, castellà o anglès.</p><textarea id="gt-paste" rows="12" placeholder="Enganxa aquí…"></textarea><button class="b" data-k="gtimport" style="margin-top:10px">Importar</button>`);
    if (k === "pdf") exportarPDF();
    if (k === "xls") exportarExcel();
    if (k === "plan") { if (!planos().length) return H.toast("Afegeix plans primer"); hubShow("planes"); window.P && P.generar(doc.id) }
  });
  // ---------- panell de columnes: mostrar/amagar, ordenar, afegir i eliminar columnes pròpies ----------
  function panell() {
    const cs = totes();
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Columnes del guió</h2><p class="em" style="margin-top:0">Marca les que vols veure, ordena-les amb les fletxes o afegeix-ne de noves.</p>` +
      cs.map((c, i) => `<div class="colr"><input type="checkbox" data-gk="vis" data-c="${c.k}" ${(doc.ocultas || []).includes(c.k) ? "" : "checked"}>${BASE.some(b => b.k === c.k) ? `<span>${E(c.l)}</span>` : `<input class="cn" data-gk="nom" data-c="${c.k}" value="${E(c.l)}">`}<button data-gk="up" data-i="${i}" ${i ? "" : "disabled"}>↑</button><button data-gk="down" data-i="${i}" ${i < cs.length - 1 ? "" : "disabled"}>↓</button>${BASE.some(b => b.k === c.k) ? "<i></i>" : `<button data-gk="del" data-c="${c.k}" title="Eliminar columna">×</button>`}</div>`).join("") +
      `<label>Nova columna</label><div class="row"><input id="gt-ncol" placeholder="P. ex. Atrezzo, Vestuari, Música… (Retorn)"><button class="b2" data-gk="add">Afegir</button></div>
      <div class="sfoot"><button class="b2" data-gk="def">Fer servir com a columnes per defecte</button><button class="b" data-gk="ok">Fet</button></div><small>Les columnes per defecte s'apliquen als guions tècnics nous.</small>`, pintar);
  }
  const hsh = document.getElementById("hsh");
  hsh.addEventListener("change", e => { const t = e.target; if (!doc || t.dataset.gk !== "vis") return; const o = new Set(doc.ocultas || []); t.checked ? o.delete(t.dataset.c) : o.add(t.dataset.c); doc.ocultas = [...o]; doc.colsAuto = false; save() });
  hsh.addEventListener("input", e => { const t = e.target; if (!doc || t.dataset.gk !== "nom") return; doc.custom[t.dataset.c] = t.value; save() });
  const afegeix = () => { const i = document.getElementById("gt-ncol"), v = i.value.trim(); if (!v) return; const k = "x_" + uid(); doc.custom = { ...(doc.custom || {}), [k]: v }; doc.cols = totes().map(c => c.k); doc.colsAuto = false; save(); panell(); setTimeout(() => document.getElementById("gt-ncol").focus(), 30) };
  hsh.addEventListener("keydown", e => { if (doc && e.target.id === "gt-ncol" && e.key === "Enter") afegeix() });
  hsh.addEventListener("click", async e => {
    const b = e.target.closest("[data-gk]"); if (!b || !doc || b.dataset.gk === "vis" || b.dataset.gk === "nom") return; const g = b.dataset.gk, ks = totes().map(c => c.k), i = +b.dataset.i;
    if (g === "up" || g === "down") { const j = g === "up" ? i - 1 : i + 1;[ks[i], ks[j]] = [ks[j], ks[i]]; doc.cols = ks; doc.colsAuto = false; save(); panell() }
    if (g === "del" && confirm("Eliminar aquesta columna i el que hi has escrit?")) { delete doc.custom[b.dataset.c]; doc.cols = ks.filter(k => k !== b.dataset.c); planos().forEach(p => delete p[b.dataset.c]); save(); panell() }
    if (g === "add") afegeix();
    if (g === "def") { await H.put({ id: "ajust:gt", cols: ks, ocultas: doc.ocultas || [], custom: doc.custom || {} }, 1); H.toast("Desades com a columnes per defecte") }
    if (g === "ok") H.cerrar();
  });

  document.getElementById("hsh").addEventListener("click", e => {
    if (!e.target.closest('[data-k="gtimport"]') || !doc) return;
    const fs = R.pegar(document.getElementById("gt-paste").value); if (!fs.length) return H.toast("No he reconegut cap fila. Has copiat també la capçalera?");
    if (doc.escenas.length === 1 && doc.escenas[0].planos.length <= 1 && !doc.escenas[0].planos.some(p => p.sujeto || p.desc)) doc.escenas = [];
    let cur = null;
    for (const f of fs) {
      const n = f.esc || (cur ? cur.num : "1");
      if (!cur || cur.num !== n) { cur = doc.escenas.find(x => x.num === n) || null; if (!cur) { cur = { id: uid(), num: n, intext: (f.intext || "").toUpperCase().replace(/\.$/, "").replace(/\./g, ""), lugar: f.set || "", planos: [] }; doc.escenas.push(cur) } }
      delete f.esc; if (f.escala) f.escala = escNorm(f.escala) || f.escala; if (f.dur) f.dur = String(parseInt(f.dur) || ""); if (!f.set) f.set = cur.lugar || "";
      cur.planos.push(f);
    }
    save(); H.cerrar(); pintar(); H.toast(fs.length + (fs.length === 1 ? " pla importat" : " plans importats"));
  });
  el.addEventListener("input", e => {
    const t = e.target; if (!doc) return;
    if (t.dataset.d) { doc[t.dataset.d] = t.value; return save() }
    if (t.dataset.se != null) { doc.escenas[+t.dataset.se][t.dataset.f] = t.value; return save() }
    if (t.dataset.f && t.dataset.p != null && !t.dataset.k) {
      const p = doc.escenas[+t.dataset.e].planos[+t.dataset.p]; p[t.dataset.f] = t.value; save();
      if (t.dataset.f === "escala") { const c = escColor(t.value); t.style.borderLeftColor = t.value ? c : "transparent"; t.parentNode.style.background = t.value ? c : ""; t.style.color = t.value ? "#fff" : "" }
    }
  });
  el.addEventListener("change", async e => {
    const t = e.target; if (!doc) return;
    if (t.dataset.d === "proyecto") { doc.proyecto = t.value; if (doc.colsAuto !== false) await perDefecte(doc); save(); pintar() }
    if (t.dataset.se != null && t.tagName === "SELECT") { doc.escenas[+t.dataset.se][t.dataset.f] = t.value; save() }
    if (t.dataset.k === "img" && t.files[0]) { const id = await R.subirImagen(t.files[0]); if (id) { const pq = doc.escenas[+t.dataset.e].planos[+t.dataset.p]; pq.img = id; delete pq.imgSb; save(); pintar() } }
  });
  // arrastrar filas / escenas / imágenes
  let drag = null;
  el.addEventListener("dragstart", e => { const h = e.target.closest("[data-drag],[data-dragesc]"); if (!h) return; drag = h.dataset.drag ? { p: h.dataset.drag.split(",").map(Number) } : { e: +h.dataset.dragesc }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "x") });
  el.addEventListener("dragover", e => { const tr = e.target.closest("tr.pr,tr.eh"); if (!tr) return; e.preventDefault(); el.querySelectorAll(".dropb").forEach(x => x.classList.remove("dropb")); tr.classList.add("dropb") });
  el.addEventListener("drop", async e => {
    const tr = e.target.closest("tr.pr,tr.eh"); if (!tr || !doc) return; e.preventDefault(); el.querySelectorAll(".dropb").forEach(x => x.classList.remove("dropb"));
    const te = +tr.dataset.e, tp = tr.dataset.p != null ? +tr.dataset.p : 0;
    if (!drag && e.dataTransfer.files.length && tr.dataset.p != null) { const id = await R.subirImagen(e.dataTransfer.files[0]); if (id) { doc.escenas[te].planos[tp].img = id; delete doc.escenas[te].planos[tp].imgSb; save(); pintar() } return }
    if (!drag) return;
    // se coloca delante de la fila sobre la que se suelta (sobre la cabecera de escena: al principio de esa escena)
    if (drag.e != null) { const [s] = doc.escenas.splice(drag.e, 1); doc.escenas.splice(te > drag.e ? te - 1 : te, 0, s) }
    else { const [se, sp] = drag.p, [p] = doc.escenas[se].planos.splice(sp, 1); let i = tr.dataset.p != null ? tp : 0; if (se === te && tr.dataset.p != null && sp < tp) i--; doc.escenas[te].planos.splice(i, 0, p) }
    drag = null; save(); pintar();
  });
  el.addEventListener("dragend", () => { drag = null; el.querySelectorAll(".dropb").forEach(x => x.classList.remove("dropb")) });

  // ---------- exportar ----------
  const lb = c => c.k.startsWith("x_") ? c.l : R.t("c_" + c.k, c.l), banda = e => `${R.t("esc")} ${e.num || ""} · ${[e.intext, e.lugar, R.tv(e.momento)].filter(Boolean).join(" · ")}${e.paginas ? " · " + e.paginas + " " + R.t("pags") : ""}${e.sinopsis ? " — " + e.sinopsis : ""}`;
  function exportarPDF() {
    const cs = vis();
    R.pdf(`<div class="pz"><h1>${E(doc.titulo || R.t("gt"))}</h1><p>${E([R.t("gt"), doc.version].filter(Boolean).join(" · "))}</p><table><tbody>` +
      doc.escenas.map(e => `<tr><td colspan="${cs.length}" class="band" style="background:${e.color || BANDA.escena};color:#fff">${E(banda(e))}</td></tr><tr>${cs.map(c => `<th>${E(lb(c))}</th>`).join("")}</tr>` +
        e.planos.map(p => `<tr style="${p.color ? "background:" + FILA[p.color] : ""}">${cs.map(c => c.t === "img" ? `<td>${p.img ? `<img src="${R.imgUrl(p.img)}">` : ""}</td>` : c.t === "escala" ? `<td style="background:${p.escala ? escColor(p.escala) : ""};color:${p.escala ? "#fff" : ""};font-weight:700">${E(R.escX(p.escala))}</td>` : `<td>${E(p[c.k] || "")}</td>`).join("")}</tr>`).join("")).join("") + `</tbody></table></div>`);
  }
  function exportarExcel() {
    const cs = vis(), ie = cs.findIndex(c => c.t === "escala"), ii = cs.findIndex(c => c.t === "img");
    R.excel(R.t("gt") + " " + (doc.titulo || ""), [{
      nombre: R.t("gt"), titulo: R.t("gt") + " · " + (doc.titulo || "").toUpperCase(), sub: doc.version ? [doc.version] : [],
      cols: cs.map(c => ({ l: lb(c), w: c.t === "img" ? 18 : Math.round(c.w / 7), izq: ["desc", "accion", "notas"].includes(c.k) })),
      sinCab: 1, filas: doc.escenas.flatMap(e => [{ banda: banda(e), color: e.color || BANDA.escena, blanco: 1 }, { cab: 1 }]
        .concat(e.planos.map(p => ({ celdas: cs.map(c => c.t === "img" ? "" : c.t === "escala" ? R.escX(p.escala) : p[c.k] || ""), color: FILA[p.color] || "", colores: ie >= 0 && p.escala ? { [ie]: escColor(p.escala) } : {}, img: ii >= 0 ? p.img : null, imgCol: ii }))))
    }]);
  }

  window.addEventListener("hub-sec", e => { if (e.detail === "guiones" && (!doc || !H.dePj(doc))) lista() });
  // Crea un guió tècnic nou a partir d'unes escenes (p. ex. des del Desglossament)
  async function nou(escenas, titulo, proyecto, desg) {
    const d = { id: H.uid("gt"), titulo: titulo || "Guió tècnic", escenas: escenas.map(e => ({ ...e, sinopsis: e.sinopsis || e.notas || "" })), proyecto: proyecto || "", desg: desg || "" };
    await perDefecte(d); await H.put(d, 1); hubShow("guiones"); doc = d; ++ver; pintar(); H.toast(escenas.length + " escenes passades al guió tècnic");
  }
  window.GT = { abrir, nou };
  lista();
})();
