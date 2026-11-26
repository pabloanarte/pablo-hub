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
  const valors = o => o == null ? "" : typeof o === "object" ? Object.entries(o).filter(([k]) => !["id", "img", "thumb", "url", "ord"].includes(k) && k[0] !== "_").map(([, v]) => valors(v)).join(" ") : String(o);
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
    if (ya) { delete pendD[d.id]; return go() } pendD[d.id] = go; tSave[d.id] = setTimeout(() => { delete pendD[d.id]; go() }, 500);
  }
  // en tancar o amagar la pàgina (bloquejar el mòbil, canviar d'app), es desa al moment el que estava esperant
  const pendD = {};
  const buida = () => { for (const id in pendD) { clearTimeout(tSave[id]); const go = pendD[id]; delete pendD[id]; go() } };
  addEventListener("pagehide", buida); document.addEventListener("visibilitychange", () => { if (document.hidden) buida() });
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
  function sheet(html, onClose) { const c = document.getElementById("hshc"), nova = ov.hidden; c.innerHTML = '<div class="top"><button class="t" data-k="cerrar">Tancar</button></div>' + html; ov.hidden = false; if (nova) { c.scrollTop = 0; ov.scrollTop = 0; requestAnimationFrame(() => { c.scrollTop = 0 }) } alCerrar = onClose; document.body.style.overflow = "hidden" }
  function cerrar() { document.getElementById("hshc").scrollTop = 0; ov.hidden = true; document.body.style.overflow = ""; ed = null; const f = alCerrar; alCerrar = null; f && f() }
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
    const capH = opt.cap ? await opt.cap(doc) : "";
    const h = campos.map((c, i) => campo(c, doc, cs, ps) + (i === 0 && capH ? capH : "")).join("") +
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
        if (c.opsDoc && !c.opsDoc(d).length) return c.buit ? lb + `<small style="display:block">${E(c.buit)}</small>` : "";
        const ops = c.opsDoc ? c.opsDoc(d) : opsDe(c), edita = c.llista && ed && ed.editL === c.llista;
        if (edita) return lb + `<div class="seg">${ops.map((o, i) => `<span class="chip">${E(o)} <button data-k="lldel" data-l="${c.llista}" data-i="${i}" title="Eliminar de la llista">×</button></span>`).join("")}</div><div class="row"><input class="pnou" data-l="${c.llista}" data-f="${c.f}" placeholder="Nova opció… (Retorn)"><button class="b2" data-k="llfet">Fet</button></div><small>Treure una opció de la llista no la treu d'on ja estigui posada.</small>`;
        const sel = c.multi ? (Array.isArray(v) ? v : v ? [v] : []) : [v], es = o => sel.includes(o);
        return lb + `<div class="seg">${ops.concat(sel.filter(x => x && !ops.includes(x))).map(o => `<button class="t ${es(o) ? "on" : ""}" data-k="pill" data-f="${c.f}" data-v="${E(o)}"${c.col && c.col[o] && !/^#(8e8e93|c7c7cc)$/i.test(c.col[o]) ? ` style="${es(o) ? `background:${c.col[o]};color:#fff` : ""}"` : ""}>${E(o)}</button>`).join("")}${c.llista ? `<button class="t" data-k="llnou" data-l="${c.llista}" style="background:#fff;border:1px dashed #c7c7cc">+ Altres</button><button class="t" data-k="lled" data-l="${c.llista}" style="background:none;color:#8e8e93">Editar llista</button>` : ""}</div>${c.llista && ed && ed.nouL === c.llista ? `<input class="pnou" data-l="${c.llista}" data-f="${c.f}" placeholder="Nova opció i Retorn" autofocus>` : ""}` + (c.ajuda ? `<small style="display:block;margin-top:6px">${E(c.ajuda)}</small>` : "");
      }
      case "url": return lb + `<div class="row"><input data-f="${c.f}" value="${E(v)}" placeholder="https://"><a class="ln" target="_blank" rel="noopener" href="${E(url(v))}" ${v ? "" : "hidden"}>Obrir</a></div>`;
      case "links": return lb + `<textarea data-f="${c.f}" rows="2" placeholder="Un enllaç per línia">${E(v)}</textarea><div class="ls">${String(v).split("\n").filter(x => x.trim()).map(x => `<a class="ln" target="_blank" rel="noopener" href="${E(url(x.trim()))}">${E(x.trim().replace(/^https?:\/\/(www\.)?/, "").slice(0, 40))}</a>`).join("")}</div>`;
      case "proyecto": return lb + `<select data-f="${c.f}"><option value="">—</option>${ps.filter(p => c.tots || meu(p) || p.id === v).sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "")).map(p => `<option value="${p.id}" ${v === p.id ? "selected" : ""}>${E(p.titulo || "Sense títol")}</option>`).join("")}</select>`;
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
      let pujats = 0;
      for (const file of unic ? [t.files[0]] : t.files) {
        if (unic && !/^image\//.test(file.type)) { toast("Ha de ser una imatge"); continue }
        if (file.size > 25 * 1024 * 1024) { toast(file.name + " passa de 25 MB"); continue }
        toast("Pujant " + file.name + "…");
        try { pujats++; const a = await api("POST", "archivo?nombre=" + encodeURIComponent(file.name), file); if (unic) (d[f] || []).forEach(x => api("DELETE", "archivo/" + x.id).catch(() => {})); d[f] = unic ? [a] : (d[f] || []).concat(a) } catch (e) { pujats--; toast(e && e.error === "sin-archivos" ? "Falta activar el magatzem d'arxius a Cloudflare" : e && e.offline ? "Sense connexió: per pujar arxius cal internet" : "No s'ha pogut pujar " + file.name) }
      }
      put(d, 1); if (ed && ed.doc === d) editar(ed.campos, d, ed.opt); if (pujats) toast("Pujat"); return;
    }
    if (!ed || t.dataset.k !== "pon") return;
    const cs = await contactos(), c = cs.find(x => (x.nombre + (x.persona ? " · " + x.persona : "")) === t.value || x.nombre === t.value); if (!c) return;
    const l = ed.doc[t.dataset.f] = (ed.doc[t.dataset.f] || []).filter(x => x !== c.id).concat(c.id); put(ed.doc); editar(ed.campos, ed.doc, ed.opt);
  });
  ov.addEventListener("keydown", e => {
    const t = e.target; if (!ed || !t.classList.contains("pnou") || e.key !== "Enter" || !t.value.trim()) return;
    const c = ed.campos.find(x => x.llista === t.dataset.l), v = t.value.trim(), l = opsDe(c).slice();
    if (!l.includes(v)) l.push(v); desaLlista(t.dataset.l, l);
    if (!ed.editL) { const cm = ed.campos.find(x => x.f === t.dataset.f) || {}, cur = ed.doc[t.dataset.f]; ed.doc[t.dataset.f] = cm.multi ? [...new Set((Array.isArray(cur) ? cur : cur ? [cur] : []).concat(v))] : v } ed.nouL = null; put(ed.doc); changed(); editar(ed.campos, ed.doc, ed.opt);
  });
  ov.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b || !ed) return; const k = b.dataset.k, d = ed.doc;
    if (k === "llnou") { ed.nouL = b.dataset.l; ed.editL = null; await editar(ed.campos, d, ed.opt); const i = box().querySelector(".pnou"); i && i.focus(); return }
    if (k === "lled") { ed.editL = b.dataset.l; ed.nouL = null; return editar(ed.campos, d, ed.opt) }
    if (k === "llfet") { ed.editL = null; return editar(ed.campos, d, ed.opt) }
    if (k === "lldel") { const c = ed.campos.find(x => x.llista === b.dataset.l), l = opsDe(c).slice(); l.splice(+b.dataset.i, 1); desaLlista(b.dataset.l, l); changed(); return editar(ed.campos, d, ed.opt) }
    if (k === "desar") { await put(d, 1); cerrar(); toast("Desat"); return }
    if (k === "pill" && (ed.campos.find(c => c.f === b.dataset.f) || {}).multi) { const l = Array.isArray(d[b.dataset.f]) ? d[b.dataset.f] : d[b.dataset.f] ? [d[b.dataset.f]] : []; d[b.dataset.f] = l.includes(b.dataset.v) ? l.filter(x => x !== b.dataset.v) : l.concat(b.dataset.v); put(d); return editar(ed.campos, d, ed.opt) }
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
  const nou = tipo => reg[tipo] && reg[tipo].nou();
  // projecte obert a Projectes (o "-" = sense projecte); serveix per filtrar les seccions d'un projecte
  const pj = () => window.HUBP ? window.HUBP() : "";
  const dePj = d => { const p = pj(); return !p || (p === "-" ? !d.proyecto : d.proyecto === p) };
  const refresca = () => changed();
  async function abrir(tipo, id) { const c = reg[tipo], d = (await col(tipo)).find(x => x.id === id); if (c && d) c.abre(d) }
  // Canviar l'ordre a mà (camp «ord»): arrossegant per la nansa ⠿ o amb ↑ ↓
  let OR = null;
  function ordena(l, cfg, despres) {
    OR = { l, cfg, despres };
    const pinta = () => sheet(`<h2 style="margin-top:4px">Canviar l'ordre</h2><p class="em" style="margin-top:0">Arrossega per la nansa ⠿ o fes servir les fletxes. Es desa sol.</p><div id="ordl">${OR.l.map((d, i) => `<div class="r" data-ix="${i}"><span class="arr" title="Arrossega per canviar l'ordre">⠿</span><div class="g"><b>${E(d.titulo || "Sense títol")}</b><small>${E([d.categoria, d.estado].filter(Boolean).join(" · "))}</small></div><button class="t" data-k="osube" data-i="${i}" ${i ? "" : "disabled"}>↑</button><button class="t" data-k="obaja" data-i="${i}" ${i < OR.l.length - 1 ? "" : "disabled"}>↓</button></div>`).join("")}</div>`, () => { OR = null; despres() });
    OR.pinta = pinta; pinta();
  }
  const desaOrdre = () => { OR.l.forEach((d, i) => { if (d.ord !== i) { d.ord = i; put(d) } }); OR.pinta() };
  (() => { const c = document.getElementById("hshc"); if (!c) return;
    c.addEventListener("click", e => { const b = e.target.closest('[data-k="osube"],[data-k="obaja"]'); if (!b || !OR || b.disabled) return; const i = +b.dataset.i, j = b.dataset.k === "osube" ? i - 1 : i + 1;[OR.l[i], OR.l[j]] = [OR.l[j], OR.l[i]]; desaOrdre() });
    c.addEventListener("pointerdown", e => {
      const h = e.target.closest(".arr"); if (!h || !OR || e.button > 0) return;
      const row = h.closest(".r[data-ix]"); if (!row) return;
      e.preventDefault(); h.setPointerCapture(e.pointerId);
      const from = +row.dataset.ix, altres = [...row.parentElement.querySelectorAll(".r[data-ix]")].filter(r => r !== row);
      let y0 = e.clientY, s0 = c.scrollTop, to = from, yA = e.clientY;
      row.classList.add("arrs");
      const marca = () => { row.style.transform = `translateY(${yA - y0 + c.scrollTop - s0}px)`; to = altres.filter(r => { const b = r.getBoundingClientRect(); return yA > b.top + b.height / 2 }).length; altres.forEach((r, n) => { r.classList.toggle("dst", n === to); r.classList.toggle("dsb", to === altres.length && n === altres.length - 1) }) };
      const mou = ev => { yA = ev.clientY; marca() };
      const roda = setInterval(() => { const v = yA < 90 ? -12 : yA > innerHeight - 70 ? 12 : 0; if (v) { c.scrollBy(0, v); marca() } }, 30);
      const fi = () => { clearInterval(roda); h.removeEventListener("pointermove", mou); h.removeEventListener("pointerup", fi); h.removeEventListener("pointercancel", fi);
        row.classList.remove("arrs"); row.style.transform = ""; altres.forEach(r => r.classList.remove("dst", "dsb"));
        if (to !== from) { OR.l.splice(to, 0, OR.l.splice(from, 1)[0]); desaOrdre() } };
      h.addEventListener("pointermove", mou); h.addEventListener("pointerup", fi); h.addEventListener("pointercancel", fi);
    });
  })();
  // Projectes «meus»: els que dirigeixo o escric (o sense rol posat). Els d'ajudant de direcció o script només surten a «Com a equip».
  const rols = p => Array.isArray(p.rol) ? p.rol : p.rol ? [p.rol] : [];
  const meu = p => { const r = rols(p); return !r.length || r.includes("Direcció") || r.includes("Guió") };
  function coleccion(cfg) {
    const el = document.getElementById("s-" + cfg.sec); let VIS = [], tab = "", tab2 = cfg.tabs2 && cfg.tabs2.sense ? cfg.tabs2.op[0] : "", q = "";
    const en2 = (d, v) => !v || (cfg.tabs2.fn ? cfg.tabs2.fn(d, v) : d[cfg.tabs2.f] === v);
    const opt = d => ({ acciones: cfg.acciones, extra: cfg.extra, alCerrar: () => { if (!d.titulo && !d.texto && !d.apuntes) del(d); pintar() } });
    async function pintar() {
      const pj = cfg.perProj && window.HUBP ? window.HUBP() : "";
      const l = (await col(cfg.tipo)).filter(d => !pj || (pj === "-" ? !d.proyecto : d.proyecto === pj));
      const vis = l.filter(d => (!tab || d[cfg.tabs.f] === tab) && (!cfg.tabs2 || en2(d, tab2)) && (!q || valors(d).toLowerCase().includes(q))).sort(cfg.ordenable ? ((a, b) => (a.ord ?? -1) - (b.ord ?? -1) || (cfg.orden ? cfg.orden(a, b) : 0)) : cfg.orden || ((a, b) => (a.titulo || "").localeCompare(b.titulo || "")));
      VIS = cfg.ordenable ? l.filter(d => !cfg.tabs2 || en2(d, tab2)).sort((a, b) => (a.ord ?? -1) - (b.ord ?? -1) || (cfg.orden ? cfg.orden(a, b) : 0)) : vis;
      const lista = cfg.grupos ? cfg.grupos(vis) : [["", vis]];
      await llistes();
      if (cfg.tabs) { const ops = opsDe(cfg.tabs); el.querySelector(".tabsw").innerHTML = `<div class="tabs"><button class="t ${tab ? "" : "on"}" data-k="tab" data-v="">Tots<small></small></button>${ops.map(o => `<button class="t ${tab === o ? "on" : ""}" data-k="tab" data-v="${E(o)}">${E(o)} <small></small></button>`).join("")}</div>` }
      el.querySelectorAll('[data-k="tab"] small').forEach(x => { const v = x.parentNode.dataset.v, l2 = cfg.tabs2 ? l.filter(d => en2(d, tab2)) : l, n = v ? l2.filter(d => d[cfg.tabs.f] === v).length : l2.length; x.textContent = n ? n : "" });
      el.querySelector(".hl").classList.toggle("hlc", !!cfg.cartell); el.querySelector(".hl").innerHTML = vis.length ? lista.filter(g => g[1].length).map(([g, ds]) => (g ? `<h2>${E(g)} <span>${ds.length}</span></h2>` : "") + ds.map(d => { const r = cfg.fila(d); if (cfg.cartell) return `<div class="pcar" data-k="abre" data-id="${d.id}"><div class="pcim">${r.img ? `<img src="${r.img}" alt="" loading="lazy">` : `<span>${E(r.t || "Sense títol")}</span>`}</div><div class="g"><b><i class="dot" style="background:${r.c || "#c7c7cc"}"></i>${E(r.t || "Sense títol")}</b><small>${E(r.s || "")}</small></div></div>`; return `<div class="r" data-k="abre" data-id="${d.id}"><i class="dot" style="background:${r.c || "#c7c7cc"}"></i><div class="g"><b>${E(r.t || "Sense títol")}</b><small>${E(r.s || "")}</small></div></div>` }).join("")).join("") : `<p class="em">Encara no hi ha res. Prem «+ ${E(cfg.nuevo)}» per començar.</p>`;
    }
    el.innerHTML = `<div class="tabsw"></div>` +
      `${cfg.tabs2 ? `<div class="seg" style="margin:0 0 12px">${cfg.tabs2.sense ? "" : `<button class="t on" data-k="tab2" data-v="">Tots</button>`}${cfg.tabs2.op.map(o => `<button class="t ${o === tab2 ? "on" : ""}" data-k="tab2" data-v="${E(o)}">${E(o)}</button>`).join("")}</div>` : ""}<div class="bar"><input class="hq" placeholder="Cerca…"><span style="flex:1"></span>${cfg.ordenable ? `<button class="b2" data-k="ordena">Canviar l'ordre</button>` : ""}<button class="b" data-k="nuevo">+ ${E(cfg.nuevo)}</button></div><div class="hl"><p class="em">Carregant…</p></div>`;
    el.addEventListener("click", async e => {
      const b = e.target.closest("[data-k]"); if (!b) return;
      if (b.dataset.k === "tab") { tab = b.dataset.v; pintar() }
      if (b.dataset.k === "tab2") { tab2 = b.dataset.v; el.querySelectorAll('[data-k="tab2"]').forEach(x => x.classList.toggle("on", x === b)); pintar() }
      if (b.dataset.k === "abre") { const d = (await col(cfg.tipo)).find(x => x.id === b.dataset.id); if (cfg.obre) return cfg.obre(d); editar(cfg.campos, d, opt(d)) }
      if (b.dataset.k === "nuevo") nou();
      if (b.dataset.k === "ordena") ordena(VIS.slice(), cfg, pintar);
    });
    function nou() { const pj = cfg.perProj && window.HUBP ? window.HUBP() : ""; const d = Object.assign({ id: uid(cfg.tipo) }, cfg.defecto ? cfg.defecto() : {}, cfg.tabs && tab ? { [cfg.tabs.f]: tab } : {}, cfg.tabs2 && tab2 ? (cfg.tabs2.nou ? cfg.tabs2.nou(tab2) : { [cfg.tabs2.f]: tab2 }) : {}, pj && pj !== "-" ? { proyecto: pj } : {}); put(d, 1); editar(cfg.campos, d, opt(d)); setTimeout(() => { const i = box().querySelector("input.big"); i && i.focus() }, 50) }
    el.querySelector(".hq").addEventListener("input", e => { q = e.target.value.toLowerCase(); pintar() });
    reg[cfg.tipo] = { abre: d => editar(cfg.campos, d, opt(d)), nou };
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
  return { meu, rols, pj, dePj, nou, refresca, titols, projecteDe, valors, refrescaContactes, llistes, opsDe, MIG, E, api, today, addDays, fecha, uid, url, col, put, del, contactos, onChange, toast, sheet, cerrar, editar, coleccion, abrir, relacionados };
})();

// Departaments de rodatge (ordre de crèdits): els fan servir l'equip del projecte i Gent → Equip i repartiment.
(() => {
  // Ordre de crèdits per departaments: repartiment, direcció (amb guió, ajudantia, script i coach), producció,
  // fotografia (amb càmera, DIT, elèctrics i grip), art, vestuari, maquillatge, so, postproducció, càsting i foto fixa.
  // Cada regla és [rang, departament, patró]; es comproven primer les més concretes.
  const DEPT = [
    [80, "Càsting", /c[aà]sting|direct\w* de reparto|director\w* de repartiment/i],
    [14, "Coach", /coach|entrenador\w*|preparador\w* d|actoral|direcci[oó]n? d['’e ]+a?actor|director\w* d['’e ]+a?actor/i],
    [12, "Ajudants de direcció", /ajudan\w* de direcci|ayudant\w* de direcci|asistent\w* de direcci|assistent\w* de direcci|auxiliar\w* de direcci|ayte\.? (de )?direcci|assistant director|\b[12](st|nd|r|er)?\.?\s?ad\b|\bad\b|meritori\w* de direcci/i],
    [13, "Script", /\bscript|continu[iï]tat|continuidad|continuity|scripta/i],
    [30, "Fotografia", /direcci[oó]n? de fotograf|director\w* de fotograf|\bdop\b|\bd\.o\.p\b|cinematograph|director of photography|director\w* de foto\b|dir\.? (de )?fotograf|\bd\.?f\.?$|\bdf\b/i],
    [72, "Postproducció", /compositing|composicio digital|\bvfx\b|\bsfx\b|efectes|efectos|visual effects/i],
    [40, "Art", /direcci[oó] d['’ ]?art|direcci[oó]n de arte|director\w* (de |d['’])?art|direccion artistica|direcci[oó] art[ií]stica|art director|disseny de producci|dise[ñn]\w* de producci|production design|set design/i],
    [41, "Art", /ajudant\w* d['’ ]?art|ayudante de arte|art assistant|atrezz|attrezz|ambientaci|props|decora/i],
    [74, "Postproducció", /postproducci\w* de so|post-?producci\w* de so|muntatge de so|montaje de sonido|edicio\w* de so|editor\w* de so|editor de sonido|sound editor|di[aà]legs|di[aá]logos|dialog/i],
    [60, "So", /sound mixer/i],
    [75, "Postproducció", /mescla|mezcla|\bmix/i],
    [73, "Postproducció", /supervisi[oó] sonora|sound design|dise[ñn]o de sonido|disseny de so|sound supervisor/i],
    [61, "So", /perchista|\bboom|microfonist/i],
    [60, "So", /so directe|sonido directo|sonidista|sound recordist|location sound|t[eè]cnic de so|t[eé]cnico de sonido|\bso\b|\bsonido\b|\bsound\b/i],
    [76, "Postproducció", /m[uú]sica|banda sonora|composi|composer|\bscore|soundtrack/i],
    [71, "Color", /colou?ri|\bcolou?r\b|etalona|grading/i],
    [72, "Postproducció", /postproducci|post-?producci/i],
    [77, "Postproducció", /grafi|graphics|t[ií]tols|t[ií]tulos|motion/i],
    [70, "Muntatge", /muntat|montaje|montador|\beditor|editing|editat|edicio/i],
    [34, "Fotografia", /\bdit\b|data wrangler|data manager|digital imaging|video ?assist/i],
    [35, "Fotografia", /ronin|steadicam|gimbal|dron/i],
    [32, "Fotografia", /\b1\s?(st|º|ª|o|a|r|er)?\.?\s?ac\b|primer\w* ajudant\w* de c[aà]mera|\b1\w*\.? (ajudant|ayudant|asistent|assistent)\w* de c|primer ayudante de c[aá]mara|foquista|focus puller|first assistant camera/i],
    [33, "Fotografia", /\b2\s?(nd|º|ª|o|a|n)?\.?\s?ac\b|^ac$|(aux|ayte)\.? (de )?c[aá]m|ajudant\w* de c[aà]mera|ayudante de c[aá]mara|auxiliar\w* de c[aà]mera|auxiliar de c[aá]mara|camera assistant|clapper|loader/i],
    [31, "Fotografia", /operador\w* de c[aàá]m|camera operator|c[aà]mera\b|c[aá]mara\b/i],
    [36, "Fotografia", /gaffer|best boy|cap d['’ ]?el[eè]ctrics|jef\w* de el[eé]ctric/i],
    [37, "Fotografia", /el[eéè]ctri|spark|electrician|il·luminaci|iluminaci/i],
    [38, "Fotografia", /\bgrip|maquinista|key grip/i],
    [21, "Producció", /cap de producci|jef\w* de producci|production manager|line producer|director\w* de producci/i],
    [22, "Producció", /ajudant\w* de producci|ayudante de producci|auxiliar\w* de producci|asistent\w* de producci|\bpa\b|production assistant|key set|runner|catering|meritori|localitzaci|localizaci|location|coordinad\w* de producci/i],
    [20, "Producció", /product\w* executi|productor\w* ejecutiv|executive producer|\bproduc|produït|produced|production company/i],
    [50, "Vestuari", /vestuari|vestuario|figurinist|stylist|estilis|fashion|wardrobe|costume|sastr/i],
    [55, "Maquillatge", /maquilla|\bmua\b|muah|make-?up|perruqueri|peluquer|\bhair\b|caracteri[tz]/i],
    [85, "Foto fixa", /foto fixa|foto fija|still|\bphoto\b|fot[oò]graf\w* (de rodatge|fixa|fija|del rodaje)|making.?of|\bbts\b|behind the scenes|^fotograf\w*$|^photograph\w*$/i],
    [11, "Direcció", /gui[oó]n?(?![a-z])|guionista|screenplay|written|writer|escrit|idea original/i],
    [10, "Direcció", /direcci[oó]|direcci[oó]n|director|directora|dirigi|directed|creative direction/i],
    [0, "Repartiment", /repartiment|reparto|\bcast\b|actor|actress|actriu|actriz|int[eè]rpret|talent|protagonist|figuraci|\bextras?\b/i]
  ];
  // un rol com «Director i guionista» es parteix i compta la part més amunt de la llista
  const regla = r => { let m = null; String(r || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+(?:i|y|and)\s+|\s*[&\/,+]\s*/i).filter(Boolean).forEach(t => { const d = DEPT.find(x => x[2].test(t)); if (d && (!m || d[0] < m[0])) m = d }); return m };
  const rangRol = r => { const d = regla(r); return d ? d[0] : 99 };
  const deptDe = r => { const d = regla(r); return d ? d[1] : "Altres" };
  H.rangRol = rangRol; H.deptDe = deptDe;
})();
