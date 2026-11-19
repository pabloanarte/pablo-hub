// Herramientas comunes para las secciones del hub (todo dentro de window.H para no chocar con contactos.js).
// Una sección nueva normalmente solo necesita H.coleccion({...}) con su lista de campos.
window.H = (() => {
  const E = s => String(s ?? "").replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const api = (m, p, b) => fetch("/api/" + p, { method: m, headers: { "content-type": "application/json" }, body: b === undefined ? undefined : JSON.stringify(b) })
    .then(async r => { if (r.status === 401) { location.reload(); throw 0 } const d = await r.json().catch(() => ({})); if (!r.ok) throw d; return d });
  const iso = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = new Date(s + "T12:00"); d.setDate(d.getDate() + n); return iso(d) };
  const fecha = (s, largo) => s ? new Date(s + "T12:00").toLocaleDateString("es-ES", largo ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" }) : "";
  const uid = t => t + ":" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const url = u => u ? (/^https?:/.test(u) ? u : "https://" + u) : "";

  // ---------- datos ----------
  const cache = {}, subs = [];
  const pend = {};
  const col = async (t, force) => {
    if (cache[t] && !force) return cache[t];
    return pend[t] || (pend[t] = api("GET", "col/" + t).then(l => { delete pend[t]; return cache[t] = l }, e => { delete pend[t]; throw e }));
  };
  const tipo = d => d.id.split(":")[0];
  let tSave = {};
  function put(d, ya) {
    const l = cache[tipo(d)] || (cache[tipo(d)] = []); if (!l.includes(d)) { const i = l.findIndex(x => x.id === d.id); i >= 0 ? l[i] = d : l.push(d) }
    clearTimeout(tSave[d.id]);
    const go = () => { const { id, ...o } = d; return api("PUT", "doc/" + encodeURIComponent(id), o).then(changed).catch(() => toast("No se pudo guardar")) };
    if (ya) return go(); tSave[d.id] = setTimeout(go, 500);
  }
  function del(d) { const l = cache[tipo(d)] || []; const i = l.indexOf(d); if (i >= 0) l.splice(i, 1); clearTimeout(tSave[d.id]); return api("DELETE", "doc/" + encodeURIComponent(d.id)).then(changed) }
  function changed() { subs.forEach(f => f()) }
  const onChange = f => subs.push(f);
  let cT = 0, cC = [];
  async function contactos() { if (Date.now() - cT > 30000) { try { cC = (await api("GET", "all")).contacts; cT = Date.now() } catch (e) { } } return cC }

  // ---------- interfaz ----------
  const ov = document.createElement("div"); ov.id = "hsh"; ov.hidden = true; ov.innerHTML = '<div class="sheet" id="hshc"></div>'; document.body.appendChild(ov);
  const tst = document.createElement("div"); tst.id = "htoast"; tst.hidden = true; document.body.appendChild(tst);
  let tt, alCerrar;
  function toast(t) { tst.textContent = t; tst.hidden = false; clearTimeout(tt); tt = setTimeout(() => tst.hidden = true, 2600) }
  function sheet(html, onClose) { document.getElementById("hshc").innerHTML = '<div class="top"><button class="t" data-k="cerrar">Cerrar</button></div>' + html; ov.hidden = false; alCerrar = onClose; document.body.style.overflow = "hidden" }
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
    ed = { campos, doc, opt };
    const h = campos.map(c => campo(c, doc, cs, ps)).join("") +
      (opt.acciones || []).map((a, i) => `<button class="b" style="margin-top:18px" data-k="acc" data-i="${i}">${E(a.l)}</button> `).join("") +
      (opt.extra ? `<div id="hextra">${await opt.extra(doc)}</div>` : "") +
      `<button class="del" data-k="borrar">Eliminar</button>`;
    sheet(h, opt.alCerrar);
  }
  function campo(c, d, cs, ps) {
    const v = d[c.f] ?? "", lb = c.l ? `<label>${E(c.l)}</label>` : "";
    switch (c.tipo) {
      case "titulo": return `<input class="big" data-f="${c.f}" value="${E(v)}" placeholder="${E(c.ph || "Título")}">`;
      case "textarea": return lb + `<textarea data-f="${c.f}" rows="${c.rows || 5}" placeholder="${E(c.ph || "")}">${E(v)}</textarea>`;
      case "check": return `<label class="ck"><input type="checkbox" data-f="${c.f}" ${v ? "checked" : ""}> ${E(c.l)}</label>`;
      case "pills": return lb + `<div class="seg">${c.op.map(o => `<button class="t ${v === o ? "on" : ""}" data-k="pill" data-f="${c.f}" data-v="${E(o)}"${c.col && c.col[o] ? ` style="${v === o ? `background:${c.col[o]};color:#fff` : ""}"` : ""}>${E(o)}</button>`).join("")}</div>`;
      case "url": return lb + `<div class="row"><input data-f="${c.f}" value="${E(v)}" placeholder="https://"><a class="ln" target="_blank" rel="noopener" href="${E(url(v))}" ${v ? "" : "hidden"}>Abrir</a></div>`;
      case "links": return lb + `<textarea data-f="${c.f}" rows="2" placeholder="Un enlace por línea">${E(v)}</textarea><div class="ls">${String(v).split("\n").filter(x => x.trim()).map(x => `<a class="ln" target="_blank" rel="noopener" href="${E(url(x.trim()))}">${E(x.trim().replace(/^https?:\/\/(www\.)?/, "").slice(0, 40))}</a>`).join("")}</div>`;
      case "proyecto": return lb + `<select data-f="${c.f}"><option value="">—</option>${ps.slice().sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "")).map(p => `<option value="${p.id}" ${v === p.id ? "selected" : ""}>${E(p.titulo || "Sin título")}</option>`).join("")}</select>`;
      case "contactos": {
        const sel = Array.isArray(v) ? v : [], nom = id => (cs.find(x => x.id === id) || {}).nombre || "?";
        return lb + `<div class="ls">${sel.map(id => `<span class="chip">${E(nom(id))} <button data-k="quita" data-f="${c.f}" data-v="${id}">×</button></span>`).join("")}</div>
        <input data-k="pon" data-f="${c.f}" list="hdl-c" placeholder="Añadir contacto…"><datalist id="hdl-c">${cs.map(x => `<option value="${E(x.nombre + (x.persona ? " · " + x.persona : ""))}">`).join("")}</datalist>`;
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
    const t = e.target; if (!ed || t.dataset.k !== "pon") return;
    const cs = await contactos(), c = cs.find(x => (x.nombre + (x.persona ? " · " + x.persona : "")) === t.value || x.nombre === t.value); if (!c) return;
    const l = ed.doc[t.dataset.f] = (ed.doc[t.dataset.f] || []).filter(x => x !== c.id).concat(c.id); put(ed.doc); editar(ed.campos, ed.doc, ed.opt);
  });
  ov.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b || !ed) return; const k = b.dataset.k, d = ed.doc;
    if (k === "pill") { d[b.dataset.f] = d[b.dataset.f] === b.dataset.v ? "" : b.dataset.v; put(d); editar(ed.campos, d, ed.opt) }
    if (k === "quita") { d[b.dataset.f] = (d[b.dataset.f] || []).filter(x => x !== b.dataset.v); put(d); editar(ed.campos, d, ed.opt) }
    if (k === "acc") { await ed.opt.acciones[+b.dataset.i].fn(d); }
    if (k === "borrar" && confirm("¿Eliminar?")) { await del(d); cerrar(); toast("Eliminado") }
  });

  // ---------- sección tipo lista (proyectos, reuniones, festivales, brainstorm…) ----------
  // cfg: {sec, tipo, nuevo:"Nueva reunión", tabs:{f, op}, campos, fila:d=>({t,s,c}), orden(a,b), defecto:()=>({}), acciones, extra}
  const reg = {};
  async function abrir(tipo, id) { const c = reg[tipo], d = (await col(tipo)).find(x => x.id === id); if (c && d) c.abre(d) }
  function coleccion(cfg) {
    const el = document.getElementById("s-" + cfg.sec); let tab = "", q = "";
    const opt = d => ({ acciones: cfg.acciones, extra: cfg.extra, alCerrar: () => { if (!d.titulo && !d.texto && !d.apuntes) del(d); pintar() } });
    async function pintar() {
      const l = await col(cfg.tipo);
      const vis = l.filter(d => (!tab || d[cfg.tabs.f] === tab) && (!q || JSON.stringify(d).toLowerCase().includes(q))).sort(cfg.orden || ((a, b) => (a.titulo || "").localeCompare(b.titulo || "")));
      const lista = cfg.grupos ? cfg.grupos(vis) : [["", vis]];
      el.querySelector(".hl").innerHTML = vis.length ? lista.filter(g => g[1].length).map(([g, ds]) => (g ? `<h2>${E(g)} <span>${ds.length}</span></h2>` : "") + ds.map(d => { const r = cfg.fila(d); return `<div class="r" data-k="abre" data-id="${d.id}"><i class="dot" style="background:${r.c || "#c7c7cc"}"></i><div class="g"><b>${E(r.t || "Sin título")}</b><small>${E(r.s || "")}</small></div></div>` }).join("")).join("") : `<p class="em">Nada todavía.</p>`;
    }
    el.innerHTML = `<div class="bar"><input class="hq" placeholder="Buscar" style="margin:0"><button class="b" data-k="nuevo">+ ${E(cfg.nuevo)}</button></div>` +
      (cfg.tabs ? `<div class="seg"><button class="t on" data-k="tab" data-v="">Todo</button>${cfg.tabs.op.map(o => `<button class="t" data-k="tab" data-v="${E(o)}">${E(o)}</button>`).join("")}</div>` : "") + `<div class="hl"><p class="em">Cargando…</p></div>`;
    el.addEventListener("click", async e => {
      const b = e.target.closest("[data-k]"); if (!b) return;
      if (b.dataset.k === "tab") { tab = b.dataset.v; el.querySelectorAll('[data-k="tab"]').forEach(x => x.classList.toggle("on", x === b)); pintar() }
      if (b.dataset.k === "abre") { const d = (await col(cfg.tipo)).find(x => x.id === b.dataset.id); editar(cfg.campos, d, opt(d)) }
      if (b.dataset.k === "nuevo") { const d = Object.assign({ id: uid(cfg.tipo) }, cfg.defecto ? cfg.defecto() : {}, cfg.tabs && tab ? { [cfg.tabs.f]: tab } : {}); put(d, 1); editar(cfg.campos, d, opt(d)); setTimeout(() => { const i = box().querySelector("input.big"); i && i.focus() }, 50) }
    });
    el.querySelector(".hq").addEventListener("input", e => { q = e.target.value.toLowerCase(); pintar() });
    reg[cfg.tipo] = { abre: d => editar(cfg.campos, d, opt(d)) };
    onChange(() => { if (!el.hidden) pintar() });
    pintar().catch(() => el.querySelector(".hl").innerHTML = `<p class="em">No se pudo cargar.</p>`);
    return { pintar };
  }

  // Lista breve de documentos de otras secciones relacionados con un proyecto (para el "extra" del editor)
  async function relacionados(pid) {
    if (!pid) return "";
    const [r, t, f] = await Promise.all([col("reunion"), col("tarea"), col("convocatoria")]);
    const sec = (n, l, fn) => l.length ? `<h2>${n} <span>${l.length}</span></h2>` + l.map(x => `<div class="m">${fn(x)}</div>`).join("") : "";
    return sec("Reuniones", r.filter(x => x.proyecto === pid), x => `${E(fecha(x.fecha))} · ${E(x.titulo || "")}`) +
      sec("Tareas", t.filter(x => x.proyecto === pid && !x.hecha), x => `${x.fecha ? E(fecha(x.fecha)) + " · " : ""}${E(x.titulo || "")}`) +
      sec("Festivales y convocatorias", f.filter(x => x.proyecto === pid), x => `${E(x.titulo || "")}${x.estado ? " · " + E(x.estado) : ""}`);
  }

  return { E, api, today, addDays, fecha, uid, url, col, put, del, contactos, onChange, toast, sheet, cerrar, editar, coleccion, abrir, relacionados };
})();
