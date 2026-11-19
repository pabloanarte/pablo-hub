// Cronograma tipo Gantt para Preproducción y Postproducción (window.Crono).
// Cada tarea es un documento "pre:…" o "post:…" con inicio, fin, categoría (color), estado y proyecto.
// Las barras se arrastran para moverlas y se estiran por el borde derecho para cambiar la duración.
window.Crono = cfg => {
  const { E } = H, el = document.getElementById("s-" + cfg.sec), tipo = cfg.tipo;
  const CATS = cfg.cats, col = c => (CATS.find(x => x[0] === c) || [])[1] || "#8e8e93";
  const EST = ["Pendiente", "En curso", "Hecho"];
  const CAMPOS = [
    { f: "titulo", tipo: "titulo", ph: "Tarea" },
    { f: "cat", l: "Departamento", tipo: "pills", op: CATS.map(c => c[0]), col: Object.fromEntries(CATS) },
    { f: "ini", l: "Inicio", tipo: "date" }, { f: "fin", l: "Fin", tipo: "date" },
    { f: "estado", l: "Estado", tipo: "pills", op: EST, col: { Pendiente: "#8e8e93", "En curso": "#0a84ff", Hecho: "#30b27a" } },
    { f: "hito", l: "Es un hito (entrega, fecha clave)", tipo: "check" },
    { f: "proyecto", l: "Proyecto", tipo: "proyecto" }, { f: "resp", l: "Responsable", tipo: "text" },
    { f: "notas", l: "Notas", tipo: "textarea" }, { f: "archivos", l: "Archivos", tipo: "archivos" }
  ];
  const ZOOM = { dias: 34, semanas: 14, meses: 4.2 };
  let zoom = "semanas", proy = "", ini0 = null;
  const dd = s => new Date(s + "T12:00"), dif = (a, b) => Math.round((dd(b) - dd(a)) / 864e5), mas = H.addDays;

  async function datos() {
    const l = (await H.col(tipo)).filter(x => !proy || x.proyecto === proy);
    return l.map(x => ({ ...x, ini: x.ini || H.today(), fin: x.fin && x.fin >= (x.ini || "") ? x.fin : (x.ini || H.today()) }));
  }
  function rango(l, ppd, ancho) {
    const hoy = H.today(); let a = l.reduce((m, x) => x.ini < m ? x.ini : m, hoy), b = l.reduce((m, x) => x.fin > m ? x.fin : m, hoy);
    a = mas(a, -((dd(a).getDay() + 6) % 7) - 7); b = mas(b, 21);
    const min = Math.ceil((ancho || 900) / ppd); if (dif(a, b) < min) b = mas(a, min);
    return [a, b];
  }
  function chart(l, ppd, a, b, impr) {
    const n = dif(a, b) + 1, W = n * ppd, hoy = H.today(), meses = [], marcas = [];
    for (let i = 0; i < n; i++) { const d = mas(a, i), x = dd(d); if (i === 0 || x.getDate() === 1) { const m = x.toLocaleDateString("es-ES", { month: "long", year: "numeric" }); meses.push([i, m[0].toUpperCase() + m.slice(1)]) }
      if (zoom === "dias" && !impr) marcas.push([i, x.getDate(), [0, 6].includes(x.getDay())]); else if (x.getDay() === 1 && ppd >= 3) marcas.push([i, x.getDate(), false]) }
    const grupos = CATS.map(c => [c[0], l.filter(x => x.cat === c[0])]).concat([["Sin departamento", l.filter(x => !CATS.some(c => c[0] === x.cat))]]).filter(g => g[1].length);
    const filas = grupos.flatMap(([g, ts]) => [{ g }].concat(ts.sort((x, y) => x.ini.localeCompare(y.ini)).map(t => ({ t }))));
    const fondo = zoom === "dias" && !impr ? marcas.filter(m => m[2]).map(m => `<i class="we" style="left:${m[0] * ppd}px;width:${ppd}px"></i>`).join("") : "";
    return `<div class="gantt${impr ? " imp" : ""}"><div class="gl"><div class="gh">Tarea</div>${filas.map(f => f.g ? `<div class="gg" style="color:${col(f.g)}">${E(f.g)}</div>` : `<div class="gn" data-k="edt" data-id="${f.t.id}"><i class="dot" style="background:${col(f.t.cat)}"></i><span>${E(f.t.titulo || "Sin título")}</span>${f.t.estado === "Hecho" ? "<small>✓</small>" : ""}</div>`).join("")}</div>
      <div class="gr"><div style="width:${W}px;position:relative"><div class="gh gm">${meses.map(m => `<span style="left:${m[0] * ppd}px">${E(m[1])}</span>`).join("")}${marcas.map(m => `<b style="left:${m[0] * ppd}px">${m[1]}</b>`).join("")}</div>
      <div class="gb" style="height:${filas.length * 34}px">${fondo}${marcas.map(m => `<i class="vl" style="left:${m[0] * ppd}px"></i>`).join("")}${hoy >= a && hoy <= b ? `<i class="hoy" style="left:${(dif(a, hoy) + .5) * ppd}px"></i>` : ""}` +
      filas.map((f, i) => f.g ? `<div class="grow g" style="top:${i * 34}px;width:${W}px"></div>` : (() => { const t = f.t, x = dif(a, t.ini) * ppd, w = Math.max(ppd, (dif(t.ini, t.fin) + 1) * ppd), c = col(t.cat);
        return t.hito ? `<div class="hito" data-id="${t.id}" style="top:${i * 34 + 9}px;left:${x + ppd / 2 - 8}px;background:${c}" title="${E(t.titulo)}"></div><span class="blab" style="top:${i * 34 + 8}px;left:${x + ppd / 2 + 12}px">${E(t.titulo || "")}</span>`
          : `<div class="bar2${t.estado === "Hecho" ? " ok" : ""}" data-id="${t.id}" style="top:${i * 34 + 6}px;left:${x}px;width:${w}px;background:${c}${t.estado === "Pendiente" || !t.estado ? ";opacity:.75" : ""}" title="${E(t.titulo)} · ${E(H.fecha(t.ini))} – ${E(H.fecha(t.fin))}">${w >= 90 ? `<span>${E(t.titulo || "")}</span>` : ""}${impr ? "" : `<i class="rs"></i>`}</div>${w < 90 ? `<span class="blab" style="top:${i * 34 + 10}px;left:${x + w + 6}px">${E(t.titulo || "")}</span>` : ""}` })()).join("") + `</div></div></div></div>`;
  }
  async function pintar() {
    const ps = await H.col("proyecto"), l = await datos(), ppd = ZOOM[zoom], [a, b] = rango(l, ppd, el.clientWidth - 260); ini0 = a;
    el.innerHTML = `<div class="tabs">${Object.keys(ZOOM).map(z => `<button class="t ${z === zoom ? "on" : ""}" data-k="zoom" data-v="${z}">${{ dias: "Días", semanas: "Semanas", meses: "Meses" }[z]}</button>`).join("")}</div>
      <div class="bar" style="flex-wrap:wrap"><select data-k="proy" style="width:auto"><option value="">Todos los proyectos</option>${ps.map(p => `<option value="${p.id}" ${p.id === proy ? "selected" : ""}>${E(p.titulo || "")}</option>`).join("")}</select>
      <button class="b2" data-k="hoy">Hoy</button><span style="flex:1"></span><button class="b2" data-k="plantilla">Plantilla de ${E(cfg.nombre)}</button><button class="b2" data-k="pdf">PDF</button><button class="b2" data-k="xls">Excel</button><button class="b" data-k="nueva">+ Tarea</button></div>
      <div class="lg">${CATS.map(c => `<span><i style="background:${c[1]}"></i>${c[0]}</span>`).join("")}<span style="margin-left:auto">Arrastra una barra para moverla · estira su borde derecho para cambiar la duración · toca para editar</span></div>` +
      (l.length ? chart(l, ppd, a, b) : `<p class="em">Aún no hay tareas de ${E(cfg.nombre)}. Añade una o carga la plantilla con las fases habituales.</p>`);
    const g = el.querySelector(".gr"); if (g) g.scrollLeft = Math.max(0, (dif(a, H.today()) - 7) * ppd);
  }
  const abrir = async id => { const d = (await H.col(tipo)).find(x => x.id === id); if (d) H.editar(CAMPOS, d, { alCerrar: () => { if (!d.titulo) H.del(d); pintar() } }) };

  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    if (k === "zoom") { zoom = b.dataset.v; pintar() }
    if (k === "hoy") { const g = el.querySelector(".gr"); if (g) g.scrollLeft = Math.max(0, (dif(ini0, H.today()) - 7) * ZOOM[zoom]) }
    if (k === "edt") abrir(b.dataset.id);
    if (k === "nueva") { const d = { id: H.uid(tipo), titulo: "", ini: H.today(), fin: H.addDays(H.today(), 6), estado: "Pendiente", proyecto: proy, cat: CATS[0][0] }; await H.put(d, 1); abrir(d.id); setTimeout(() => { const i = document.querySelector("#hshc input.big"); i && i.focus() }, 60) }
    if (k === "plantilla") {
      const ps = await H.col("proyecto");
      H.sheet(`<h2 style="margin-top:0">Plantilla de ${E(cfg.nombre)}</h2><p class="em" style="margin-top:0">Crea las fases habituales encadenadas a partir de una fecha. Luego ajustas las fechas arrastrando.</p>
        <label>Proyecto</label><select id="pl-p"><option value="">—</option>${ps.map(p => `<option value="${p.id}" ${p.id === proy ? "selected" : ""}>${E(p.titulo || "")}</option>`).join("")}</select>
        <label>Empieza el</label><input type="date" id="pl-f" value="${H.today()}">` + cfg.plantilla.map((t, i) => `<label class="ck"><input type="checkbox" data-pl="${i}" checked> ${E(t[0])} <small>· ${E(t[1])} · ${t[2]} días</small></label>`).join("") + `<button class="b" data-k="plcrear" style="margin-top:14px">Crear tareas</button>`);
    }
    if (k === "pdf") { const l = await datos(); if (!l.length) return; const [a, b] = rango(l, 1, 1); const n = dif(a, b) + 1, ppd = Math.max(1.5, Math.min(30, 830 / n)); R.pdf(`<div class="pz"><h1>${E(cfg.titulo)}${proy ? " · " + E(((await H.col("proyecto")).find(p => p.id === proy) || {}).titulo || "") : ""}</h1>` + chart(l, ppd, a, b, 1).replace('<div class="gantt', '<div style="zoom:1" class="gantt') + `<div class="lg">${CATS.map(c => `<span><i style="background:${c[1]}"></i>${c[0]}</span>`).join("")}</div></div>`) }
    if (k === "xls") exportarExcel();
  });
  el.addEventListener("change", e => { if (e.target.dataset.k === "proy") { proy = e.target.value; pintar() } });
  document.getElementById("hsh").addEventListener("click", async e => {
    if (!e.target.closest('[data-k="plcrear"]') || el.hidden) return;
    // plantilla: [nombre, departamento, días, hito, en paralelo con la anterior]
    let f = document.getElementById("pl-f").value || H.today(), prev = f; const p = document.getElementById("pl-p").value;
    for (const [i, t] of cfg.plantilla.entries()) {
      if (!document.querySelector(`[data-pl="${i}"]`).checked) continue;
      const ini = t[4] ? prev : f, fin = H.addDays(ini, t[2] - 1);
      await H.put({ id: H.uid(tipo), titulo: t[0], cat: t[1], ini, fin, estado: "Pendiente", proyecto: p, hito: !!t[3] }, 1);
      if (!t[4]) { prev = ini; f = H.addDays(fin, 1) }
    }
    H.cerrar(); proy = p; pintar(); H.toast("Tareas creadas");
  });
  // arrastrar barras
  let dr = null;
  el.addEventListener("pointerdown", async e => {
    const bar = e.target.closest(".bar2,.hito"); if (!bar) return; e.preventDefault();
    const d = (await H.col(tipo)).find(x => x.id === bar.dataset.id); if (!d) return;
    dr = { bar, d, x: e.clientX, modo: e.target.classList.contains("rs") ? "fin" : "mover", left: bar.offsetLeft, w: bar.offsetWidth, mov: 0 };
    bar.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", e => {
    if (!dr) return; const dx = e.clientX - dr.x, ppd = ZOOM[zoom]; dr.mov = Math.round(dx / ppd);
    if (dr.modo === "mover") dr.bar.style.left = dr.left + dr.mov * ppd + "px"; else dr.bar.style.width = Math.max(ppd, dr.w + dr.mov * ppd) + "px";
  });
  el.addEventListener("pointerup", async e => {
    if (!dr) return; const { d, mov, modo, x } = dr; dr = null;
    if (Math.abs(e.clientX - x) < 4) return abrir(d.id);
    const ini = d.ini || H.today(), fin = d.fin || ini;
    if (modo === "mover") { d.ini = H.addDays(ini, mov); d.fin = H.addDays(fin, mov) } else { d.fin = H.addDays(fin, mov); if (d.fin < d.ini) d.fin = d.ini }
    await H.put(d, 1); pintar();
  });

  async function exportarExcel() {
    const l = await datos(); if (!l.length) return; const [a, b] = rango(l, 1, 1), sem = [];
    for (let d = a; d <= b; d = mas(d, 7)) sem.push(d);
    const ps = await H.col("proyecto"), pn = id => (ps.find(p => p.id === id) || {}).titulo || "";
    R.excel(cfg.titulo, [{
      nombre: cfg.titulo, titulo: cfg.titulo.toUpperCase(), sub: proy ? [pn(proy)] : [],
      cols: [{ l: "Tarea", w: 30, izq: 1 }, { l: "Departamento", w: 14 }, { l: "Inicio", w: 11 }, { l: "Fin", w: 11 }, { l: "Días", w: 6 }, { l: "Estado", w: 10 }, { l: "Responsable", w: 14 }, { l: "Proyecto", w: 16 }].concat(sem.map(s => ({ l: dd(s).toLocaleDateString("es-ES", { day: "numeric", month: "short" }), w: 6 }))),
      filas: CATS.map(c => c[0]).concat([undefined]).flatMap(cat => { const ts = l.filter(x => cat ? x.cat === cat : !CATS.some(c => c[0] === x.cat)).sort((x, y) => x.ini.localeCompare(y.ini)); return ts.length ? [{ banda: cat || "Sin departamento", color: cat ? col(cat) : "#c7c7cc", blanco: 1 }].concat(ts.map(t => {
        const colores = { 1: col(t.cat) }; sem.forEach((s, i) => { const f = mas(s, 6); if (t.ini <= f && t.fin >= s) colores[8 + i] = col(t.cat) });
        return { celdas: [t.titulo || "", t.cat || "", dd(t.ini).toLocaleDateString("es-ES"), dd(t.fin).toLocaleDateString("es-ES"), dif(t.ini, t.fin) + 1, t.estado || "", t.resp || "", pn(t.proyecto)].concat(sem.map(() => "")), colores };
      })) : [] })
    }]);
  }
  H.onChange(() => { if (!el.hidden && !dr) pintar() });
  window.addEventListener("hub-sec", e => { if (e.detail === cfg.sec) pintar() });
  pintar();
};
