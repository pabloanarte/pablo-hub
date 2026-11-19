// Herramientas comunes para Guiones técnicos, Planes de rodaje y cronogramas (window.R).
window.R = (() => {
  const E = H.E;
  // ---------- escalas de plano y sus colores ----------
  const ESC = [["GPG", "#5856d6"], ["PG", "#0a84ff"], ["PE", "#32ade6"], ["PA", "#00b8a9"], ["PM", "#30b27a"], ["PMC", "#8bc34a"], ["PP", "#ff9f0a"], ["PPP", "#ff6b35"], ["PD", "#ff375f"], ["INS", "#af52de"]];
  const SINON = { LS: "PG", WS: "PG", ELS: "GPG", EWS: "GPG", FS: "PE", MLS: "PA", MS: "PM", MCU: "PMC", CU: "PP", ECU: "PPP", DETAIL: "PD", DETALLE: "PD", INSERT: "INS", "PLANO DETALLE": "PD", "PRIMER PLANO": "PP", "PLANO MEDIO": "PM", "PLANO GENERAL": "PG" };
  const escNorm = v => { const s = String(v || "").toUpperCase().trim(); if (!s) return ""; const f = s.split(/[\s/,+]|TO/)[0]; return SINON[s] || SINON[f] || (ESC.find(x => x[0] === f) || [])[0] || f };
  const escColor = v => (ESC.find(x => x[0] === escNorm(v)) || [])[1] || "#c7c7cc";
  const ORDEN_ESC = ["GPG", "PG", "PE", "PA", "PM", "PMC", "PP", "PPP", "PD", "INS"];
  // Colores de bandas y filas (como en tus planes de rodaje)
  const BANDA = { set: "#f8c8cc", proceso: "#fff3b0", comida: "#a9c7f5", wrap: "#4a86e8", call: "#34c759", ready: "#7fe3f0", escena: "#3b4a5a" };
  const FILA = ["", "#ffe5e5", "#fff4cc", "#e3f6e3", "#e1efff", "#efe5ff", "#eeeeee"];

  // ---------- tiempo ----------
  const aMin = t => { const m = String(t || "").match(/(\d{1,2})[:.h](\d{2})/); return m ? +m[1] * 60 + +m[2] : null };
  const aHora = m => m == null ? "" : `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, "0")}`;
  const uid = () => Math.random().toString(36).slice(2, 9);

  // ---------- subir imagen (storyboard / referencia) ----------
  async function subirImagen(file) {
    if (file.size > 25 * 1024 * 1024) { H.toast("La imatge passa de 25 MB"); return null }
    H.toast("Pujant la imatge…");
    try { const a = await H.api("POST", "archivo?nombre=" + encodeURIComponent(file.name), file); H.toast("Imatge afegida"); return a.id } catch (e) { H.toast("No s'ha pogut pujar la imatge"); return null }
  }
  const imgUrl = id => "/api/archivo/" + id;

  // ---------- pegar desde Google Sheets / Excel ----------
  // Reconoce las cabeceras habituales (castellano, catalán, inglés) y las convierte a campos del guion técnico.
  const CAB = {
    esc: ["esc", "escena", "scene", "sc", "seq"], num: ["pla", "plano", "shot", "pl", "nº", "n", "#"], sujeto: ["sujeto", "subjecte", "subject", "personajes", "personatges"],
    escala: ["valor de pl", "valor de plano", "escala", "shot size", "tamaño", "valor"], posicion: ["camera position", "posición", "posicio", "ang. horiz.", "angulo horizontal"],
    angulo: ["angle", "angulación", "angulacio", "ang. vert.", "angulo", "ángulo"], mov: ["movement", "movimiento", "moviment", "mov. de càmera", "mov. de camara", "mov"],
    soporte: ["equipment", "soporte", "suport", "equipo"], lente: ["lens", "lente", "òptica", "optica", "objetivo"], sonido: ["sound", "sonido", "so"],
    desc: ["description", "descripción", "descripcio", "descripció", "acció", "acción", "action", "accio"], dialogo: ["diálogo", "dialogo", "dialeg", "diàleg", "dialogue"],
    notas: ["notes", "notas", "anotaciones", "anotacions", "fx/notes", "observaciones"], dur: ["duración", "durada", "duration", "dur"], fps: ["fps"], intext: ["int./ext.", "int/ext", "int.ext", "int-ext"], set: ["set", "localización", "localitzacio", "location"]
  };
  function pegar(texto) {
    const filas = texto.replace(/\r/g, "").split("\n").map(l => l.split("\t"));
    if (filas.length < 2) return [];
    const cab = filas[0].map(c => c.trim().toLowerCase()), mapa = {};
    cab.forEach((c, i) => { for (const [k, ls] of Object.entries(CAB)) if (!(k in mapa) && ls.some(x => c === x || (x.length > 3 && c.startsWith(x)))) { mapa[k] = i; break } });
    // si "acción" y "descripción" van en columnas distintas, la segunda va a acción
    const ia = cab.findIndex(c => /^acci/.test(c)); if (ia >= 0 && mapa.desc !== ia) mapa.accion = ia;
    return filas.slice(1).filter(f => f.some(c => c.trim())).map(f => { const o = { id: uid() }; for (const [k, i] of Object.entries(mapa)) o[k] = (f[i] || "").trim(); return o });
  }

  // ---------- exportar a PDF (imprimir) ----------
  function pdf(html, apaisado = true) {
    let z = document.getElementById("printzone"); if (!z) { z = document.createElement("div"); z.id = "printzone"; document.body.appendChild(z) }
    z.innerHTML = `<style>@page{size:A4 ${apaisado ? "landscape" : "portrait"};margin:8mm}</style>` + html;
    document.body.classList.add("printing");
    const fin = () => { document.body.classList.remove("printing"); z.innerHTML = ""; window.removeEventListener("afterprint", fin) };
    window.addEventListener("afterprint", fin);
    const imgs = [...z.querySelectorAll("img")];
    Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r }))).then(() => setTimeout(() => window.print(), 100));
  }

  // ---------- exportar a Excel (con colores e imágenes) ----------
  let xl;
  const cargaExcel = () => xl || (xl = new Promise((ok, ko) => { const s = document.createElement("script"); s.src = "/vendor/exceljs.min.js"; s.onload = () => ok(window.ExcelJS); s.onerror = ko; document.head.appendChild(s) }));
  const argb = c => "FF" + String(c || "#ffffff").replace("#", "").toUpperCase();
  // hoja: {nombre, titulo, sub:[líneas], cols:[{l, w}], filas:[{banda:"texto", color} | {celdas:[...], color, colores:{i:color}, img:id, imgCol}]}
  async function excel(nombreArchivo, hojas) {
    H.toast("Preparant l'Excel…");
    const X = await cargaExcel(), wb = new X.Workbook();
    for (const h of hojas) {
      const ws = wb.addWorksheet((h.nombre || "Hoja").slice(0, 30), { pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
      const n = h.cols.length; ws.columns = h.cols.map(c => ({ width: c.w || 14 }));
      const borde = { top: { style: "thin", color: { argb: "FFD0D0D0" } }, left: { style: "thin", color: { argb: "FFD0D0D0" } }, bottom: { style: "thin", color: { argb: "FFD0D0D0" } }, right: { style: "thin", color: { argb: "FFD0D0D0" } } };
      const banda = (txt, color, opts = {}) => { const r = ws.addRow([txt]); ws.mergeCells(r.number, 1, r.number, n); const c = r.getCell(1); c.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; c.font = { bold: true, size: opts.size || 10, color: { argb: opts.blanco ? "FFFFFFFF" : "FF000000" } }; if (color) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(color) } }; r.height = opts.alto || 18; return r };
      if (h.titulo) banda(h.titulo, "#000000", { blanco: 1, size: 14, alto: 26 });
      (h.sub || []).forEach(s => banda(s.t || s, s.color || null, { blanco: s.blanco }));
      const cab = ws.addRow(h.cols.map(c => c.l)); cab.eachCell(c => { c.font = { bold: true, size: 9 }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(h.colorCab || "#cfe2f3") } }; c.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; c.border = borde }); cab.height = 22;
      for (const f of h.filas) {
        if (f.banda != null) { banda(f.banda, f.color, { blanco: f.blanco }); continue }
        const r = ws.addRow(f.celdas);
        r.eachCell({ includeEmpty: true }, (c, i) => {
          c.alignment = { vertical: "middle", horizontal: (h.cols[i - 1] || {}).izq ? "left" : "center", wrapText: true }; c.font = { size: 9 }; c.border = borde;
          const col = (f.colores || {})[i - 1] || f.color; if (col) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(col) } };
        });
        r.height = f.img ? 64 : Math.max(20, 13 * Math.ceil(Math.max(...f.celdas.map((v, i) => String(v || "").length / Math.max(6, ((h.cols[i] || {}).w || 14) * 1.1)), 1)));
        if (f.img) try {
          const rs = await fetch(imgUrl(f.img)), t = rs.headers.get("content-type") || "", b = await rs.arrayBuffer();
          const ext = /png/.test(t) ? "png" : /gif/.test(t) ? "gif" : "jpeg", id = wb.addImage({ buffer: b, extension: ext });
          ws.addImage(id, { tl: { col: f.imgCol + 0.05, row: r.number - 1 + 0.05 }, ext: { width: 110, height: 80 } });
        } catch (e) { }
      }
    }
    const buf = await wb.xlsx.writeBuffer(), a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })); a.download = nombreArchivo.replace(/[\\/:*?"<>|]/g, "") + ".xlsx"; a.click();
    H.toast("Excel descarregat");
  }

  // ---------- celdas editables ----------
  // Textareas que crecen solas
  const auto = el => { el.style.height = "auto"; el.style.height = el.scrollHeight + "px" };
  document.addEventListener("input", e => { if (e.target.matches("textarea.cel")) auto(e.target) });
  const ajusta = root => root.querySelectorAll("textarea.cel").forEach(auto);


  // ---------- idioma de les exportacions (PDF i Excel): ca / es / en ----------
  const L = {
    ca: { c_num: "Pl.", c_sujeto: "Subjecte", c_escala: "Escala", c_angulo: "Angulació", c_posicion: "Posició càmera", c_mov: "Moviment", c_soporte: "Suport", c_lente: "Òptica", c_sonido: "So", c_fps: "FPS", c_desc: "Descripció", c_accion: "Acció / diàleg", c_notas: "Notes", c_set: "Set", c_dur: "Min. rodatge", c_img: "Imatge",
      p_esc: "Esc.", p_mov: "Mov. càmera", p_personajes: "Personatges", p_vestuario: "Vestuari", p_notas: "FX / notes", p_dur: "Durada (min)", p_img: "Ref.", p_angulo: "Angulació", horario: "Horari", hora: "Hora",
      gt: "GUIÓ TÈCNIC", pdr: "PLA DE RODATGE", jornada: "JORNADA", set: "SET", proceso: "PROCÉS", comida: "DINAR", wrap: "WRAP", ready: "READY TO SHOOT", esc: "ESC", pags: "pàg.", ad: "AD",
      t_tarea: "Tasca", t_dep: "Departament", t_ini: "Inici", t_fin: "Fi", t_dias: "Dies", t_estado: "Estat", t_resp: "Responsable", t_proy: "Projecte", sin_dep: "Sense departament", pre: "Calendari de preproducció", post: "Calendari de postproducció" },
    es: { c_num: "Pl.", c_sujeto: "Sujeto", c_escala: "Escala", c_angulo: "Angulación", c_posicion: "Posición cámara", c_mov: "Movimiento", c_soporte: "Soporte", c_lente: "Lente", c_sonido: "Sonido", c_fps: "FPS", c_desc: "Descripción", c_accion: "Acción / diálogo", c_notas: "Notas", c_set: "Set", c_dur: "Min. rodaje", c_img: "Imagen",
      p_esc: "Esc.", p_mov: "Mov. cámara", p_personajes: "Personajes", p_vestuario: "Vestuario", p_notas: "FX / notas", p_dur: "Duración (min)", p_img: "Ref.", p_angulo: "Angulación", horario: "Horario", hora: "Hora",
      gt: "GUION TÉCNICO", pdr: "PLAN DE RODAJE", jornada: "JORNADA", set: "SET", proceso: "PROCESO", comida: "COMIDA", wrap: "WRAP", ready: "READY TO SHOOT", esc: "ESC", pags: "págs.", ad: "AD",
      t_tarea: "Tarea", t_dep: "Departamento", t_ini: "Inicio", t_fin: "Fin", t_dias: "Días", t_estado: "Estado", t_resp: "Responsable", t_proy: "Proyecto", sin_dep: "Sin departamento", pre: "Calendario de preproducción", post: "Calendario de postproducción" },
    en: { c_num: "Shot", c_sujeto: "Subject", c_escala: "Shot size", c_angulo: "Angle", c_posicion: "Camera position", c_mov: "Movement", c_soporte: "Equipment", c_lente: "Lens", c_sonido: "Sound", c_fps: "FPS", c_desc: "Description", c_accion: "Action / dialogue", c_notas: "Notes", c_set: "Set", c_dur: "Shooting min.", c_img: "Image",
      p_esc: "Sc.", p_mov: "Camera move", p_personajes: "Characters", p_vestuario: "Wardrobe", p_notas: "FX / notes", p_dur: "Duration (min)", p_img: "Ref.", p_angulo: "Angle", horario: "Block", hora: "Time",
      gt: "SHOT LIST", pdr: "SHOOTING SCHEDULE", jornada: "DAY", set: "SET", proceso: "PROCESS", comida: "LUNCH", wrap: "WRAP", ready: "READY TO SHOOT", esc: "SC", pags: "pp.", ad: "AD",
      t_tarea: "Task", t_dep: "Department", t_ini: "Start", t_fin: "End", t_dias: "Days", t_estado: "Status", t_resp: "Owner", t_proy: "Project", sin_dep: "No department", pre: "Pre-production schedule", post: "Post-production schedule" }
  };
  // valors (departaments, estats, moment del dia) en castellà i anglès
  const V = {
    es: { "Guió": "Guion", "Producció": "Producción", "Càsting": "Casting", "Localitzacions": "Localizaciones", "Art": "Arte", "Vestuari i maquillatge": "Vestuario y maquillaje", "Fotografia": "Fotografía", "So": "Sonido", "Muntatge": "Montaje", "Grafisme": "Grafismo", "Lliuraments": "Entregas", "Distribució": "Distribución", "Pendent": "Pendiente", "En curs": "En curso", "Fet": "Hecho", "DIA": "DÍA", "NIT": "NOCHE", "MATINADA": "AMANECER", "CAPVESPRE": "ATARDECER" },
    en: { "Guió": "Script", "Producció": "Production", "Càsting": "Casting", "Localitzacions": "Locations", "Art": "Art", "Vestuari i maquillatge": "Wardrobe & make-up", "Fotografia": "Camera", "So": "Sound", "Muntatge": "Editing", "Música": "Music", "Color": "Colour", "Grafisme": "Graphics", "Lliuraments": "Deliverables", "Distribució": "Distribution", "Pendent": "To do", "En curs": "In progress", "Fet": "Done", "DIA": "DAY", "DÍA": "DAY", "NIT": "NIGHT", "NOCHE": "NIGHT" }
  };
  const ESC_EN = { GPG: "EWS", PG: "WS", PE: "FS", PA: "MLS", PM: "MS", PMC: "MCU", PP: "CU", PPP: "ECU", PD: "DETAIL", INS: "INSERT" };
  const lang = () => { try { return localStorage.getItem("hub-lang-exp") || "ca" } catch (e) { return "ca" } };
  const t = (k, def) => (L[lang()] || L.ca)[k] || L.ca[k] || def || k;
  const tv = v => (V[lang()] || {})[v] || v;
  const loc = () => ({ ca: "ca-ES", es: "es-ES", en: "en-GB" })[lang()];
  const escX = v => lang() === "en" && v ? String(v).replace(/\b(GPG|PG|PE|PA|PMC|PM|PPP|PP|PD|INS)\b/g, m => ESC_EN[m] || m) : v || "";
  const selLang = () => `<select class="lang" title="Idioma dels PDF i Excel">${[["ca", "Exportar en català"], ["es", "Exportar en castellà"], ["en", "Exportar en anglès"]].map(([v, l]) => `<option value="${v}" ${v === lang() ? "selected" : ""}>${l}</option>`).join("")}</select>`;
  document.addEventListener("change", e => { if (e.target.matches("select.lang")) { try { localStorage.setItem("hub-lang-exp", e.target.value) } catch (x) { } document.querySelectorAll("select.lang").forEach(s => s.value = e.target.value) } });

  return { t, tv, loc, escX, selLang, lang, E, ESC, escNorm, escColor, ORDEN_ESC, BANDA, FILA, aMin, aHora, uid, subirImagen, imgUrl, pegar, pdf, excel, ajusta };
})();
