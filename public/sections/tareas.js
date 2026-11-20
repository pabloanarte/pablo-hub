// Tareas y calendario. El calendario junta tareas, reuniones y fechas de festivales/convocatorias.
(() => {
  const { E, today, fecha, addDays } = H;
  const el = document.getElementById("s-tareas");
  const CAMPOS = [
    { f: "titulo", tipo: "titulo", ph: "Tasca" },
    { f: "fecha", l: "Data", tipo: "date" },
    { f: "hecha", l: "Feta", tipo: "check" },
    { f: "proyecto", l: "Projecte", tipo: "proyecto" },
    { f: "notas", l: "Notes", tipo: "textarea" }
  ];
  const COL = { tarea: "#000", reunion: "#0a84ff", limite: "#ff3b30", evento: "#30b27a", rodatge: "#ff375f", feina: "#af52de" };
  let vista = "lista", mes = today().slice(0, 7), verHechas = false;

  el.innerHTML = `<div class="tabs"><button class="t on" data-k="v" data-v="lista">Llista</button><button class="t" data-k="v" data-v="cal">Calendari</button></div>
  <div class="bar"><input id="tnew" placeholder="Nova tasca… (escriu i prem Retorn)"><input id="tnewf" type="date" style="width:auto"></div><div id="tv"><p class="em">Carregant…</p></div>`;

  const fila = t => `<div class="r"><input type="checkbox" class="tck" data-id="${t.id}" ${t.hecha ? "checked" : ""}><div class="g" data-k="abre" data-id="${t.id}"><b style="${t.hecha ? "text-decoration:line-through;color:#8e8e93" : ""}">${E(t.titulo || "Sense títol")}</b><small>${[t.fecha && fecha(t.fecha), t.pn].filter(Boolean).map(E).join(" · ")}</small></div></div>`;

  async function datos() {
    const [t, r, f, p, pl, fe] = await Promise.all([H.col("tarea"), H.col("reunion"), H.col("convocatoria"), H.col("proyecto"), H.col("pdr"), H.col("feina")]);
    const pn = id => (p.find(x => x.id === id) || {}).titulo || "";
    t.forEach(x => x.pn = pn(x.proyecto));
    const ev = [].concat(
      t.filter(x => x.fecha).map(x => ({ d: x.fecha, c: COL.tarea, t: x.titulo, id: x.id, tipo: "tarea", hecha: x.hecha })),
      r.filter(x => x.fecha).map(x => ({ d: x.fecha, c: COL.reunion, t: (x.hora ? x.hora + " " : "") + (x.titulo || "Reunió"), id: x.id, tipo: "reunion" })),
      f.filter(x => x.limite).map(x => ({ d: x.limite, c: COL.limite, t: "Límit: " + (x.titulo || ""), id: x.id, tipo: "convocatoria" })),
      f.filter(x => x.evento).map(x => ({ d: x.evento, c: COL.evento, t: x.titulo || "", id: x.id, tipo: "convocatoria" })),
      pl.flatMap(x => (x.dias || []).map((d, i) => d.fecha ? { d: d.fecha, c: COL.rodatge, t: `Rodatge ${pn(x.proyecto) || x.titulo || ""} · J${i + 1}`, id: x.id, tipo: "pdr" } : null).filter(Boolean)),
      fe.filter(x => x.ini).flatMap(x => { const o = [], fi = x.fin && x.fin >= x.ini ? x.fin : x.ini; for (let d = x.ini, n = 0; d <= fi && n < 60; d = H.addDays(d, 1), n++) o.push({ d, c: COL.feina, t: `${x.rol || "Feina"}: ${x.titulo || ""}`, id: x.id, tipo: "feina" }); return o }));
    return { t, ev };
  }

  async function pintar() {
    const { t, ev } = await datos(), v = el.querySelector("#tv"), hoy = today(), sem = addDays(hoy, 7);
    if (vista === "lista") {
      const p = t.filter(x => !x.hecha).sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9"));
      const G = [["Endarrerides", p.filter(x => x.fecha && x.fecha < hoy)], ["Avui", p.filter(x => x.fecha === hoy)], ["Propers 7 dies", p.filter(x => x.fecha > hoy && x.fecha <= sem)], ["Més endavant", p.filter(x => x.fecha > sem)], ["Sense data", p.filter(x => !x.fecha)]];
      const h = t.filter(x => x.hecha);
      const prox = ev.filter(e => e.tipo !== "tarea" && e.d >= hoy && e.d <= sem).sort((a, b) => a.d.localeCompare(b.d));
      const agenda = `<div class="card"><h3>Propers 7 dies</h3>` + (prox.length ? prox.map(e => `<div class="r" data-k="evl" data-t="${e.tipo}" data-id="${e.id}"><i class="dot" style="background:${e.c}"></i><div class="g"><b>${E(e.t)}</b><small>${E(fecha(e.d))}</small></div></div>`).join("") : `<p class="em">Sense reunions ni dates límit.</p>`) + `</div>`;
      v.innerHTML = `<div class="split"><div>` +
        (G.some(g => g[1].length) ? G.filter(g => g[1].length).map(([n, l]) => `<h2 ${n === "Endarrerides" ? 'style="color:#d70015"' : ""}>${n} <span>${l.length}</span></h2>` + l.map(fila).join("")).join("") : `<p class="em">Cap tasca pendent.</p>`) +
        (h.length ? `<h2 data-k="hechas" style="cursor:pointer">Fetes <span>${h.length}</span> ${verHechas ? "▾" : "▸"}</h2>` + (verHechas ? h.map(fila).join("") : "") : "") + `</div>${agenda}</div>`;
    } else {
      const [y, m] = mes.split("-").map(Number), pri = new Date(y, m - 1, 1), ini = (pri.getDay() + 6) % 7, dias = new Date(y, m, 0).getDate();
      let c = "";
      for (let i = 0; i < ini; i++) c += `<div></div>`;
      for (let d = 1; d <= dias; d++) {
        const s = `${mes}-${String(d).padStart(2, "0")}`, es = ev.filter(e => e.d === s);
        c += `<div class="cd ${s === hoy ? "hoy" : ""}" data-k="dia" data-d="${s}"><b>${d}</b>${es.slice(0, 3).map(e => `<span style="background:${e.c}${e.hecha ? ";opacity:.35" : ""}">${E(e.t)}</span>`).join("")}${es.length > 3 ? `<small>+${es.length - 3}</small>` : ""}</div>`;
      }
      v.innerHTML = `<div class="bar" style="justify-content:space-between"><button class="t" data-k="mes" data-n="-1">‹</button><b>${pri.toLocaleDateString("ca-ES", { month: "long", year: "numeric" })}</b><button class="t" data-k="mes" data-n="1">›</button></div>
      <div class="cal">${["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"].map(x => `<small>${x}</small>`).join("")}${c}</div>
      <div class="lg"><span><i style="background:${COL.tarea}"></i>Tasca</span><span><i style="background:${COL.reunion}"></i>Reunió</span><span><i style="background:${COL.limite}"></i>Data límit</span><span><i style="background:${COL.rodatge}"></i>Rodatge</span><span><i style="background:${COL.feina}"></i>Feina</span><span><i style="background:${COL.evento}"></i>Festival / resolució</span></div>`;
    }
  }

  async function abrir(tipo, id) {
    if (tipo === "pdr") { hubShow("planes"); return window.P && P.abrir(id) }
    const t = (await H.col(tipo)).find(x => x.id === id); if (!t) return;
    if (tipo === "tarea") return H.editar(CAMPOS, t, { alCerrar: pintar });
    H.abrir(tipo, id);
  }
  async function dia(s) {
    const { ev } = await datos(), es = ev.filter(e => e.d === s);
    H.sheet(`<h2 style="margin-top:0;color:#000;font-size:18px;text-transform:none;letter-spacing:0">${E(fecha(s, 1))}</h2>` +
      (es.map(e => `<div class="r" data-k="ev" data-t="${e.tipo}" data-id="${e.id}"><i class="dot" style="background:${e.c}"></i><div class="g"><b>${E(e.t)}</b></div></div>`).join("") || `<p class="em">Res aquest dia.</p>`) +
      `<div class="bar"><input id="tdia" placeholder="Nova tasca aquest dia… (Retorn)" data-d="${s}" style="margin:0"></div>`, pintar);
  }
  async function nueva(titulo, f) { await H.put({ id: H.uid("tarea"), titulo, fecha: f || "", hecha: false, proyecto: "" }, 1) }

  el.addEventListener("click", e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    if (k === "v") { vista = b.dataset.v; el.querySelectorAll('[data-k="v"]').forEach(x => x.classList.toggle("on", x === b)); pintar() }
    if (k === "mes") { const [y, m] = mes.split("-").map(Number), d = new Date(y, m - 1 + +b.dataset.n, 1); mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; pintar() }
    if (k === "dia") dia(b.dataset.d);
    if (k === "abre") abrir("tarea", b.dataset.id);
    if (k === "evl") { if (b.dataset.t === "pdr") { hubShow("planes"); return window.P && P.abrir(b.dataset.id) } H.abrir(b.dataset.t, b.dataset.id) }
    if (k === "hechas") { verHechas = !verHechas; pintar() }
  });
  el.addEventListener("change", async e => {
    if (!e.target.classList.contains("tck")) return;
    const t = (await H.col("tarea")).find(x => x.id === e.target.dataset.id); t.hecha = e.target.checked; H.put(t, 1); setTimeout(pintar, 250);
  });
  el.addEventListener("keydown", async e => {
    if (e.target.id === "tnew" && e.key === "Enter" && e.target.value.trim()) { await nueva(e.target.value.trim(), el.querySelector("#tnewf").value); e.target.value = ""; pintar() }
  });
  document.getElementById("hsh").addEventListener("keydown", async e => {
    if (e.target.id === "tdia" && e.key === "Enter" && e.target.value.trim()) { await nueva(e.target.value.trim(), e.target.dataset.d); dia(e.target.dataset.d) }
  });
  document.getElementById("hsh").addEventListener("click", e => {
    const b = e.target.closest('[data-k="ev"]'); if (!b) return; H.cerrar(); abrir(b.dataset.t, b.dataset.id);
  });
  H.abrirTarea = id => abrir("tarea", id);
  H.nuevaTarea = nueva;
  H.onChange(() => { if (!el.hidden) pintar() });
  pintar().catch(() => el.querySelector("#tv").innerHTML = `<p class="em">No s'ha pogut carregar.</p>`);
})();
