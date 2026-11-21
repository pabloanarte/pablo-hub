// Herramientas comunes para las secciones del hub (todo dentro de window.H para no chocar con contactos.js).
// Una sección nueva normalmente solo necesita H.coleccion({...}) con su lista de campos.
window.H = (() => {
  const E = s => String(s ?? "").replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const api = (m, p, b) => fetch("/api/" + p, { method: m, headers: { "content-type": b instanceof Blob ? (b.type || "application/octet-stream") : "application/json" }, body: b === undefined ? undefined : b instanceof Blob ? b : JSON.stringify(b) })
    .then(async r => { if (r.status === 401) { location.reload(); throw 0 } const d = await r.json().catch(() => ({})); if (!r.ok) throw d; return d });
  const iso = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = new Date(s + "T12:00"); d.setDate(d.getDate() + n); return iso(d) };
  const fecha = (s, largo) => s ? new Date(s + "T12:00").toLocaleDateString("ca-ES", largo ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" }) : "";
  const uid = t => t + ":" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const valors = o => o == null ? "" : typeof o === "object" ? Object.entries(o).filter(([k]) => k !== "id" && k !== "img").map(([, v]) => valors(v)).join(" ") : String(o);
  const url = u => u ? (/^https?:/.test(u) ? u : "https://" + u) : "";

  // ---------- datos ----------
  const cache = {}, subs = [];
  const pend = {};
  // Valors antics en castellà → català (es tradueixen un sol cop i es desen)
  const MIG = {"Pendiente":"Pendent","Contactado":"Contactat","Respondió":"Ha respost","Reunión":"Reunió","Descartado":"Descartat","Manager":"Mànager","Publicidad":"Publicitat","Largometraje: Días de Sal":"Llargmetratge: Días de Sal","Largometraje: La Última Noche":"Llargmetratge: La Última Noche","Distribución de cortos":"Distribució de curts","Largo":"Llarg","Corto":"Curt","Desarrollo":"Desenvolupament","Financiación":"Finançament","Preproducción":"Preproducció","Rodaje":"Rodatge","Postproducción":"Postproducció","Distribución":"Distribució","Terminado":"Acabat","Por presentar":"Per presentar","Presentado":"Presentat","Seleccionado":"Seleccionat","Rechazado":"Rebutjat","Lab / residencia":"Lab / residència","Historia":"Història","Personaje":"Personatge","Imagen":"Imatge","Negocio":"Negoci","Otra":"Altres","En curso":"En curs","Hecho":"Fet","Guion":"Guió","Producción":"Producció","Casting":"Càsting","Localizaciones":"Localitzacions","Arte":"Art","Vestuario y maquillaje":"Vestuari i maquillatge","Fotografía":"Fotografia","Sonido":"So","Montaje":"Muntatge","Grafismo":"Grafisme","Entregas":"Lliuraments"};
  function migra(d) { let c = 0; for (const f of ["categoria", "estado", "tipo", "etiqueta", "cat", "rol"]) if (typeof d[f] === "string" && MIG[d[f]]) { d[f] = MIG[d[f]]; c = 1 } if (c) put(d) }
  const col = async (t, force) => {
    if (cache[t] && !force) return cache[t];
    return pend[t] || (pend[t] = api("GET", "col/" + t).then(l => { delete pend[t]; l.forEach(migra); return cache[t] = l }, e => { delete pend[t]; throw e }));
  };
  const tipo = d => d.id.split(":")[0];
  let tSave = {};
  function put(d, ya) {
    const l = cache[tipo(d)] || (cache[tipo(d)] = []); if (!l.includes(d)) { const i = l.findIndex(x => x.id === d.id); i >= 0 ? l[i] = d : l.push(d) }
    clearTimeout(tSave[d.id]);
    const go = () => { const { id, ...o } = d; return api("PUT", "doc/" + encodeURIComponent(id), o).then(changed).catch(() => toast("No s'ha pogut desar")) };
    if (ya) return go(); tSave[d.id] = setTimeout(go, 500);
  }
  function del(d) { const l = cache[tipo(d)] || []; const i = l.indexOf(d); if (i >= 0) l.splice(i, 1); clearTimeout(tSave[d.id]); return api("DELETE", "doc/" + encodeURIComponent(d.id)).then(changed) }
  function changed() { subs.forEach(f => f()) }
  const onChange = f => subs.push(f);
  const refrescaContactes = () => { cT = 0; changed() };
  let cT = 0, cC = [];
  async function contactos() { if (Date.now() - cT > 30000) { try { cC = (await api("GET", "all")).contacts; cT = Date.now() } catch (e) { } } return cC }

  // ---------- llistes editables (p. ex. tipus de projecte) ----------
  let LL = null;
  async function llistes() { if (!LL) { const a = await col("ajust"); LL = a.find(x => x.id === "ajust:llistes") || { id: "ajust:llistes" } } return LL }
  const opsDe = c => (c.llista && LL && LL[c.llista]) || c.op;
  function desaLlista(k, l) { LL[k] = l; put(LL, 1) }

  // ---------- interfaz ----------
  const ov = document.createElement("div"); ov.id = "hsh"; ov.hidden = true; ov.innerHTML = '<div class="sheet" id="hshc"></div>'; document.body.appendChild(ov);
  const tst = document.createElement("div"); tst.id = "htoast"; tst.hidden = true; document.body.appendChild(tst);
  let tt, alCerrar;
  function toast(t) { tst.textContent = t; tst.hidden = false; clearTimeout(tt); tt = setTimeout(() => tst.hidden = true, 2600) }
  function sheet(html, onClose) { document.getElementById("hshc").innerHTML = '<div class="top"><button class="t" data-k="cerrar">Tancar</button></div>' + html; ov.hidden = false; alCerrar = onClose; document.body.style.overflow = "hidden" }
  function cerrar() { ov.hidden = true; document.body.style.overflow = ""; ed = null; const f = alCerrar; alCerrar = null; f && f() }
  ["input", "change", "click"].forEach(t => ov.addEventListener(t, e => e.stopPropagation())); // que contactos.js no reciba estos eventos
  ov.addEventListener("click", e => { if (e.target === ov || e.target.closest('[data-k="cerrar"]')) cerrar() });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !ov.hidden) cerrar() });

  // ---------- editor de un documento ----------
  // Tipos de campo: titulo, text, textarea, date, time, number, url, check, pills (opciones), contactos, proyecto, links
  let ed = null; // {campos, doc, extra}
  async function editar(campos, doc, opt = {}) {
    const cs = campos.some(c => c.tipo === "contactos") ? await contactos() : [];
    const ps = campos.some(c => c.tipo === "proyecto") ? await col("proyecto") : [];
    await llistes();
    ed = { campos, doc, opt, editL: ed && ed.doc === doc ? ed.editL : null, nouL: ed && ed.doc === doc ? ed.nouL : null };
    const h = campos.map(c => campo(c, doc, cs, ps)).join("") +
      (opt.acciones || []).map((a, i) => `<button class="b" style="margin-top:18px" data-k="acc" data-i="${i}">${E(a.l)}</button> `).join("") +
      (opt.extra ? `<div id="hextra">${await opt.extra(doc)}</div>` : "") +
      `<div class="sfoot"><button class="del" data-k="borrar">Eliminar</button><button class="b" data-k="desar">Desar</button></div>`;
    sheet(h, opt.alCerrar);
  }
  function campo(c, d, cs, ps) {
    const v = d[c.f] ?? "", lb = c.l ? `<label>${E(c.l)}</label>` : "";
    switch (c.tipo) {
      case "titulo": return `<input class="big" data-f="${c.f}" value="${E(v)}" placeholder="${E(c.ph || "Títol")}">`;
      case "textarea": return lb + `<textarea data-f="${c.f}" rows="${c.rows || 5}" placeholder="${E(c.ph || "")}">${E(v)}</textarea>`;
      case "check": return `<label class="ck"><input type="checkbox" data-f="${c.f}" ${v ? "checked" : ""}> ${E(c.l)}</label>`;
      case "pills": {
        const ops = opsDe(c), edita = c.llista && ed && ed.editL === c.llista;
        if (edita) return lb + `<div class="seg">${ops.map((o, i) => `<span class="chip">${E(o)} <button data-k="lldel" data-l="${c.llista}" data-i="${i}" title="Eliminar de la llista">×</button></span>`).join("")}</div><div class="row"><input class="pnou" data-l="${c.llista}" data-f="${c.f}" placeholder="Nou tipus… (Retorn)"><button class="b2" data-k="llfet">Fet</button></div><small>Treure un tipus de la llista no canvia els projectes que ja el tenen.</small>`;
        return lb + `<div class="seg">${ops.concat(v && !ops.includes(v) ? [v] : []).map(o => `<button class="t ${v === o ? "on" : ""}" data-k="pill" data-f="${c.f}" data-v="${E(o)}"${c.col && c.col[o] && !/^#(8e8e93|c7c7cc)$/i.test(c.col[o]) ? ` style="${v === o ? `background:${c.col[o]};color:#fff` : ""}"` : ""}>${E(o)}</button>`).join("")}${c.llista ? `<button class="t" data-k="llnou" data-l="${c.llista}" style="background:#fff;border:1px dashed #c7c7cc">+ Altres</button><button class="t" data-k="lled" data-l="${c.llista}" style="background:none;color:#8e8e93">Editar llista</button>` : ""}</div>${c.llista && ed && ed.nouL === c.llista ? `<input class="pnou" data-l="${c.llista}" data-f="${c.f}" placeholder="Nom del nou tipus (p. ex. Fashion film) i Retorn" autofocus>` : ""}`;
      }
      case "url": return lb + `<div class="row"><input data-f="${c.f}" value="${E(v)}" placeholder="https://"><a class="ln" target="_blank" rel="noopener" href="${E(url(v))}" ${v ? "" : "hidden"}>Obrir</a></div>`;
      case "links": return lb + `<textarea data-f="${c.f}" rows="2" placeholder="Un enllaç per línia">${E(v)}</textarea><div class="ls">${String(v).split("\n").filter(x => x.trim()).map(x => `<a class="ln" target="_blank" rel="noopener" href="${E(url(x.trim()))}">${E(x.trim().replace(/^https?:\/\/(www\.)?/, "").slice(0, 40))}</a>`).join("")}</div>`;
      case "proyecto": return lb + `<select data-f="${c.f}"><option value="">—</option>${ps.slice().sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "")).map(p => `<option value="${p.id}" ${v === p.id ? "selected" : ""}>${E(p.titulo || "Sense títol")}</option>`).join("")}</select>`;
      case "contactos": {
        const sel = Array.isArray(v) ? v : [], nom = id => (cs.find(x => x.id === id) || {}).nombre || "?";
        return lb + `<div class="ls">${sel.map(id => `<span class="chip">${E(nom(id))} <button data-k="quita" data-f="${c.f}" data-v="${id}">×</button></span>`).join("")}</div>
        <input data-k="pon" data-f="${c.f}" list="hdl-c" placeholder="Afegir contacte…"><datalist id="hdl-c">${cs.map(x => `<option value="${E(x.nombre + (x.persona ? " · " + x.persona : ""))}">`).join("")}</datalist>`;
      }
      case "archivos": {
        const fs = Array.isArray(v) ? v : [], src = a => "/api/archivo/" + a.id;
        const ver = a => /^image\//.test(a.tipo) ? `<a href="${src(a)}" target="_blank"><img src="${src(a)}" alt="" style="max-width:100%;max-height:220px;border-radius:8px;display:block"></a>`
          : /^audio\//.test(a.tipo) ? `<audio controls preload="none" src="${src(a)}" style="width:100%"></audio>`
          : /^video\//.test(a.tipo) ? `<video controls preload="metadata" src="${src(a)}" style="width:100%;max-height:300px;border-radius:8px;background:#000"></video>` : "";
        if (c.unic) { const a = fs[0]; return lb + (a ? `<div class="arch"><img src="${src(a)}" alt="" style="width:auto;height:auto;max-width:100%;max-height:360px;border-radius:8px;display:block"><div class="row"><span class="g"></span><button class="t" data-k="pcanvi">Canviar</button><input type="file" accept="image/*" data-k="sarch" data-f="${c.f}" hidden><button class="t" data-k="qarch" data-f="${c.f}" data-v="${a.id}">Treure</button></div></div>` : `<label class="b2" style="display:inline-block;color:#000;font-size:14px;cursor:pointer">+ Pujar imatge<input type="file" accept="image/*" data-k="sarch" data-f="${c.f}" hidden></label><small style="display:block;margin-top:4px">${E(c.ajuda || "JPG o PNG. Màxim 25 MB.")}</small>`) }
        return lb + fs.map(a => `<div class="arch">${ver(a)}<div class="row"><a class="g" href="${src(a)}" target="_blank" style="text-decoration:none"><b style="font-size:14px">${E(a.nombre)}</b><small>${a.size < 1048576 ? Math.max(1, Math.round(a.size / 1024)) + " KB" : (a.size / 1048576).toFixed(1) + " MB"}</small></a><button class="t" data-k="qarch" data-f="${c.f}" data-v="${a.id}">Treure</button></div></div>`).join("") +
          `<label class="b2" style="display:inline-block;margin-top:6px;color:#000;font-size:14px;cursor:pointer">+ Pujar arxius<input type="file" multiple accept="${E(c.accept || "image/*,audio/*,video/*,.pdf")}" data-k="sarch" data-f="${c.f}" hidden></label><small style="display:block;margin-top:4px">Àudio, vídeo, imatge o PDF. Màxim 25 MB cadascun; per a vídeos més grans, enganxa l'enllaç a Enllaços.</small>`;
      }
      default: return lb + `<input type="${c.tipo || "text"}" data-f="${c.f}" value="${E(v)}" placeholder="${E(c.ph || "")}">`;
    }
  }
  const box = () => document.getElementById("hshc");
  ov.addEventListener("input", e => {
    const t = e.target, f = t.dataset.f; if (!ed || !f || t.dataset.k) return;
    ed.doc[f] = t.type === "checkbox" ? t.checked : t.value;
    if (t.type === "url" || t.closest(".row")) { const a = t.parentNode.querySelector("a"); if (a) { a.href = url(t.value); a.hidden = !t.value } }
    put(ed.doc); ed.opt.cambio && ed.opt.cambio();
  });
  ov.addEventListener("change", async e => {
    const t = e.target;
    if (ed && t.dataset.k === "sarch" && t.files.length) {
      const d = ed.doc, f = t.dataset.f, unic = (ed.campos.find(c => c.f === f) || {}).unic;
      for (const file of unic ? [t.files[0]] : t.files) {
        if (unic && !/^image\//.test(file.type)) { toast("Ha de ser una imatge"); continue }
        if (file.size > 25 * 1024 * 1024) { toast(file.name + " passa de 25 MB"); continue }
        toast("Pujant " + file.name + "…");
        try { const a = await api("POST", "archivo?nombre=" + encodeURIComponent(file.name), file); if (unic) (d[f] || []).forEach(x => api("DELETE", "archivo/" + x.id).catch(() => {})); d[f] = unic ? [a] : (d[f] || []).concat(a) } catch (e) { toast(e && e.error === "sin-archivos" ? "Falta activar el magatzem d'arxius a Cloudflare" : "No s'ha pogut pujar " + file.name) }
      }
      put(d, 1); if (ed && ed.doc === d) editar(ed.campos, d, ed.opt); toast("Pujat"); return;
    }
    if (!ed || t.dataset.k !== "pon") return;
    const cs = await contactos(), c = cs.find(x => (x.nombre + (x.persona ? " · " + x.persona : "")) === t.value || x.nombre === t.value); if (!c) return;
    const l = ed.doc[t.dataset.f] = (ed.doc[t.dataset.f] || []).filter(x => x !== c.id).concat(c.id); put(ed.doc); editar(ed.campos, ed.doc, ed.opt);
  });
  ov.addEventListener("keydown", e => {
    const t = e.target; if (!ed || !t.classList.contains("pnou") || e.key !== "Enter" || !t.value.trim()) return;
    const c = ed.campos.find(x => x.llista === t.dataset.l), v = t.value.trim(), l = opsDe(c).slice();
    if (!l.includes(v)) l.push(v); desaLlista(t.dataset.l, l);
    if (!ed.editL) ed.doc[t.dataset.f] = v; ed.nouL = null; put(ed.doc); changed(); editar(ed.campos, ed.doc, ed.opt);
  });
  ov.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b || !ed) return; const k = b.dataset.k, d = ed.doc;
    if (k === "llnou") { ed.nouL = b.dataset.l; ed.editL = null; await editar(ed.campos, d, ed.opt); const i = box().querySelector(".pnou"); i && i.focus(); return }
    if (k === "lled") { ed.editL = b.dataset.l; ed.nouL = null; return editar(ed.campos, d, ed.opt) }
    if (k === "llfet") { ed.editL = null; return editar(ed.campos, d, ed.opt) }
    if (k === "lldel") { const c = ed.campos.find(x => x.llista === b.dataset.l), l = opsDe(c).slice(); l.splice(+b.dataset.i, 1); desaLlista(b.dataset.l, l); changed(); return editar(ed.campos, d, ed.opt) }
    if (k === "desar") { await put(d, 1); cerrar(); toast("Desat"); return }
    if (k === "pill") { d[b.dataset.f] = d[b.dataset.f] === b.dataset.v ? "" : b.dataset.v; put(d); editar(ed.campos, d, ed.opt) }
    if (k === "pcanvi") return b.nextElementSibling.click();
    if (k === "qarch" && confirm("Treure aquest arxiu?")) { api("DELETE", "archivo/" + b.dataset.v).catch(() => {}); d[b.dataset.f] = (d[b.dataset.f] || []).filter(x => x.id !== b.dataset.v); put(d); editar(ed.campos, d, ed.opt) }
    if (k === "quita") { d[b.dataset.f] = (d[b.dataset.f] || []).filter(x => x !== b.dataset.v); put(d); editar(ed.campos, d, ed.opt) }
    if (k === "acc") { await ed.opt.acciones[+b.dataset.i].fn(d); }
    if (k === "borrar" && confirm("Eliminar?")) { ed.campos.filter(c => c.tipo === "archivos").forEach(c => (d[c.f] || []).forEach(x => api("DELETE", "archivo/" + x.id).catch(() => {}))); await del(d); cerrar(); toast("Eliminat") }
  });

  // ---------- sección tipo lista (proyectos, reuniones, festivales, brainstorm…) ----------
  // cfg: {sec, tipo, nuevo:"Nueva reunión", tabs:{f, op}, campos, fila:d=>({t,s,c}), orden(a,b), defecto:()=>({}), acciones, extra}
  const reg = {};
  async function abrir(tipo, id) { const c = reg[tipo], d = (await col(tipo)).find(x => x.id === id); if (c && d) c.abre(d) }
  function coleccion(cfg) {
    const el = document.getElementById("s-" + cfg.sec); let tab = "", tab2 = "", q = "";
    const opt = d => ({ acciones: cfg.acciones, extra: cfg.extra, alCerrar: () => { if (!d.titulo && !d.texto && !d.apuntes) del(d); pintar() } });
    async function pintar() {
      const l = await col(cfg.tipo);
      const vis = l.filter(d => (!tab || d[cfg.tabs.f] === tab) && (!tab2 || d[cfg.tabs2.f] === tab2) && (!q || valors(d).toLowerCase().includes(q))).sort(cfg.orden || ((a, b) => (a.titulo || "").localeCompare(b.titulo || "")));
      const lista = cfg.grupos ? cfg.grupos(vis) : [["", vis]];
      await llistes();
      if (cfg.tabs) { const ops = opsDe(cfg.tabs); el.querySelector(".tabsw").innerHTML = `<div class="tabs"><button class="t ${tab ? "" : "on"}" data-k="tab" data-v="">Tots<small></small></button>${ops.map(o => `<button class="t ${tab === o ? "on" : ""}" data-k="tab" data-v="${E(o)}">${E(o)} <small></small></button>`).join("")}</div>` }
      el.querySelectorAll('[data-k="tab"] small').forEach(x => { const v = x.parentNode.dataset.v, n = v ? l.filter(d => d[cfg.tabs.f] === v).length : l.length; x.textContent = n ? n : "" });
      el.querySelector(".hl").classList.toggle("hlc", !!cfg.cartell); el.querySelector(".hl").innerHTML = vis.length ? lista.filter(g => g[1].length).map(([g, ds]) => (g ? `<h2>${E(g)} <span>${ds.length}</span></h2>` : "") + ds.map(d => { const r = cfg.fila(d); if (cfg.cartell) return `<div class="pcar" data-k="abre" data-id="${d.id}"><div class="pcim">${r.img ? `<img src="${r.img}" alt="" loading="lazy">` : `<span>${E(r.t || "Sense títol")}</span>`}</div><div class="g"><b><i class="dot" style="background:${r.c || "#c7c7cc"}"></i>${E(r.t || "Sense títol")}</b><small>${E(r.s || "")}</small></div></div>`; return `<div class="r" data-k="abre" data-id="${d.id}"><i class="dot" style="background:${r.c || "#c7c7cc"}"></i><div class="g"><b>${E(r.t || "Sense títol")}</b><small>${E(r.s || "")}</small></div></div>` }).join("")).join("") : `<p class="em">Encara no hi ha res. Prem «+ ${E(cfg.nuevo)}» per començar.</p>`;
    }
    el.innerHTML = `<div class="tabsw"></div>` +
      `${cfg.tabs2 ? `<div class="seg" style="margin:0 0 12px"><button class="t on" data-k="tab2" data-v="">Tots</button>${cfg.tabs2.op.map(o => `<button class="t" data-k="tab2" data-v="${E(o)}">${E(o)}</button>`).join("")}</div>` : ""}<div class="bar"><input class="hq" placeholder="Cerca…"><span style="flex:1"></span><button class="b" data-k="nuevo">+ ${E(cfg.nuevo)}</button></div><div class="hl"><p class="em">Carregant…</p></div>`;
    el.addEventListener("click", async e => {
      const b = e.target.closest("[data-k]"); if (!b) return;
      if (b.dataset.k === "tab") { tab = b.dataset.v; pintar() }
      if (b.dataset.k === "tab2") { tab2 = b.dataset.v; el.querySelectorAll('[data-k="tab2"]').forEach(x => x.classList.toggle("on", x === b)); pintar() }
      if (b.dataset.k === "abre") { const d = (await col(cfg.tipo)).find(x => x.id === b.dataset.id); editar(cfg.campos, d, opt(d)) }
      if (b.dataset.k === "nuevo") { const d = Object.assign({ id: uid(cfg.tipo) }, cfg.defecto ? cfg.defecto() : {}, cfg.tabs && tab ? { [cfg.tabs.f]: tab } : {}, cfg.tabs2 && tab2 ? { [cfg.tabs2.f]: tab2 } : {}); put(d, 1); editar(cfg.campos, d, opt(d)); setTimeout(() => { const i = box().querySelector("input.big"); i && i.focus() }, 50) }
    });
    el.querySelector(".hq").addEventListener("input", e => { q = e.target.value.toLowerCase(); pintar() });
    reg[cfg.tipo] = { abre: d => editar(cfg.campos, d, opt(d)) };
    onChange(() => { if (!el.hidden) pintar() });
    pintar().catch(() => el.querySelector(".hl").innerHTML = `<p class="em">No s'ha pogut carregar.</p>`);
    return { pintar };
  }

  // Lista breve de documentos de otras secciones relacionados con un proyecto (para el "extra" del editor)
  async function relacionados(pid) {
    if (!pid) return "";
    const [r, t, f] = await Promise.all([col("reunion"), col("tarea"), col("convocatoria")]);
    const sec = (n, l, fn) => l.length ? `<h2>${n} <span>${l.length}</span></h2>` + l.map(x => `<div class="m">${fn(x)}</div>`).join("") : "";
    return sec("Reunions", r.filter(x => x.proyecto === pid), x => `${E(fecha(x.fecha))} · ${E(x.titulo || "")}`) +
      sec("Tasques", t.filter(x => x.proyecto === pid && !x.hecha), x => `${x.fecha ? E(fecha(x.fecha)) + " · " : ""}${E(x.titulo || "")}`) +
      sec("Festivals", f.filter(x => x.proyecto === pid), x => `${E(x.titulo || "")}${x.estado ? " · " + E(x.estado) : ""}`);
  }

  // Títols d'un projecte: el principal i els alternatius (p. ex. «Rave Hasta Que Acabe» = «Rave To The Grave»)
  const titols = p => [p && p.titulo, ...String((p && p.altres) || "").split(/[,;\n]/)].map(x => String(x || "").trim()).filter(x => x.length > 2);
  // Projecte que surt en un text (el títol més llarg que hi aparegui, en qualsevol dels seus títols)
  const projecteDe = (ps, text) => { const t = String(text || "").toLowerCase(); let o = null, n = 0; ps.forEach(p => titols(p).forEach(x => { if (x.length > n && t.includes(x.toLowerCase())) { o = p; n = x.length } })); return o };
  return { titols, projecteDe, valors, refrescaContactes, llistes, opsDe, MIG, E, api, today, addDays, fecha, uid, url, col, put, del, contactos, onChange, toast, sheet, cerrar, editar, coleccion, abrir, relacionados };
})();
