// Planes de rodaje: se generan desde un guion técnico (agrupados por set, eje y escala, con horas, cambios de set, comida y wrap)
// y luego se ajustan a mano: arrastrar filas, cambiar duraciones, mover entre jornadas, marcar planos rodados.
(() => {
  const { E, escColor, escNorm, ORDEN_ESC, BANDA, FILA, aMin, aHora, uid } = R, el = document.getElementById("s-planes");
  const COLS = [
    { k: "num", l: "Pl.", w: 44 }, { k: "esc", l: "Esc.", w: 40 }, { k: "escala", l: "Escala", w: 64, t: "escala" }, { k: "angulo", l: "Angulación", w: 90 },
    { k: "desc", l: "Descripción", w: 240 }, { k: "mov", l: "Mov. cámara", w: 90 }, { k: "personajes", l: "Personajes", w: 100 }, { k: "vestuario", l: "Vestuario", w: 90 },
    { k: "notas", l: "FX / notas", w: 170 }, { k: "dur", l: "Dur. (min)", w: 54, t: "dur" }, { k: "img", l: "Ref.", w: 120, t: "img" }
  ];
  const BANDAS = { set: "SET", proceso: "PROCESO", comida: "COMIDA", wrap: "WRAP" };
  const DEF_ESC = "GPG 45, PG 40, PE 35, PA 30, PM 30, PMC 25, PP 20, PPP 15, PD 15, INS 10";
  let doc = null, dia = 0;
  const save = () => H.put(doc);
  const D = () => doc.dias[dia];

  // ---------- horas ----------
  // Cada fila empieza cuando acaba la anterior (o a su hora fija si la tiene). Las bandas de SET no consumen tiempo.
  function horas(d) {
    let t = aMin(d.ready) ?? 540; const out = [];
    for (const f of d.filas) {
      if (f.fija && aMin(f.fija) != null) t = aMin(f.fija);
      const usa = ["plano", "proceso", "comida"].includes(f.tipo), ini = t, fin = usa ? t + (+f.dur || 0) : t;
      out.push({ ini, fin }); t = fin;
    }
    return out;
  }
  // Bloques horarios (columna HORARIO): de banda a banda
  function bloques(d, hs) {
    const b = {}; let ini = null, idx = null;
    d.filas.forEach((f, i) => {
      if (f.tipo !== "plano") { idx = null; return }
      if (idx == null) { idx = i; b[i] = { n: 0, ini: hs[i].ini, fin: hs[i].fin } }
      b[idx].n++; b[idx].fin = hs[i].fin;
    });
    return b;
  }

  // ---------- generador desde guion técnico ----------
  async function generar(gtId) {
    const gs = await H.col("gt");
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Crear plan de rodaje</h2>
      <p class="em" style="margin-top:0">Ordeno los planos por set, después por eje de cámara (angulación/posición) y de plano abierto a cerrado, reparto las jornadas y añado cambios de set, comida y wrap. Luego puedes ajustar todo a mano.</p>
      <label>Guion técnico</label><select id="g-gt">${gs.map(g => `<option value="${g.id}" ${g.id === gtId ? "selected" : ""}>${E(g.titulo || "Sin título")}</option>`).join("")}</select>
      <div class="g2"><div><label>Fecha 1ª jornada</label><input type="date" id="g-fecha" value="${H.today()}"></div><div><label>Crew call</label><input type="time" id="g-call" value="08:00"></div>
      <div><label>Ready to shoot</label><input type="time" id="g-ready" value="09:00"></div><div><label>Horas de rodaje por jornada</label><input type="number" id="g-horas" value="10" step="0.5"></div>
      <div><label>Comida a las</label><input type="time" id="g-comida" value="14:00"></div><div><label>Duración comida (min)</label><input type="number" id="g-comdur" value="60"></div>
      <div><label>Cambio de set / montaje (min)</label><input type="number" id="g-cambio" value="30"></div><div><label>Orden</label><select id="g-orden"><option value="smart">Set → eje → abierto a cerrado</option><option value="guion">Orden del guion</option></select></div></div>
      <label>Minutos por plano si el guion no lo indica</label><input id="g-min" value="${DEF_ESC}">
      <label class="ck" style="margin-top:12px"><input type="checkbox" id="g-hechos"> Incluir planos ya marcados como hechos</label>
      <button class="b" data-k="gen" style="margin-top:16px">Crear plan</button>`);
  }
  function construir(gt, o) {
    const mins = {}; o.min.split(",").forEach(x => { const m = x.trim().match(/^(\S+)\s+(\d+)/); if (m) mins[escNorm(m[1])] = +m[2] });
    let idx = 0; const shots = [];
    gt.escenas.forEach(e => e.planos.forEach(p => { if (p.ok && !o.hechos) return; shots.push({ p, e, i: idx++, set: (p.set || e.lugar || "Sin set").trim(), eje: String(p.posicion || p.angulo || "").toLowerCase().trim(), dur: +p.dur || mins[escNorm(p.escala)] || 20 }) }));
    const sets = []; shots.forEach(s => { let g = sets.find(x => x.n.toLowerCase() === s.set.toLowerCase()); if (!g) sets.push(g = { n: s.set, l: [] }); g.l.push(s) });
    if (o.orden === "smart") sets.forEach(g => { const ejes = [...new Set(g.l.map(s => s.eje))]; g.l.sort((a, b) => ejes.indexOf(a.eje) - ejes.indexOf(b.eje) || (ORDEN_ESC.indexOf(escNorm(a.p.escala)) + 1 || 99) - (ORDEN_ESC.indexOf(escNorm(b.p.escala)) + 1 || 99) || a.i - b.i) });
    if (o.orden === "guion") { sets.length = 0; shots.forEach(s => { const u = sets.at(-1); if (u && u.n === s.set) u.l.push(s); else sets.push({ n: s.set, l: [s] }) }) }
    const largo = o.horas * 60, ready = aMin(o.ready), comida = aMin(o.comida), dias = [];
    let d, t, comido;
    const nuevoDia = () => { d = { id: uid(), fecha: o.fecha ? H.addDays(o.fecha, dias.length) : "", calls: `${o.call} Crew call`, ready: o.ready, filas: [] }; dias.push(d); t = ready; comido = false };
    const fila = (tipo, x) => { if (tipo !== "comida" && !comido && t >= comida && t > ready) { d.filas.push({ id: uid(), tipo: "comida", texto: "COMIDA", dur: o.comdur }); t += o.comdur; comido = true } d.filas.push({ id: uid(), tipo, ...x }); if (["plano", "proceso", "comida"].includes(tipo)) t += +x.dur || 0 };
    nuevoDia();
    for (const g of sets) {
      const tot = g.l.reduce((a, s) => a + s.dur, 0) + (d.filas.length ? o.cambio : 0) + (comido ? 0 : o.comdur);
      const hay = d.filas.some(f => f.tipo === "plano"), cabe1 = t - ready + o.cambio + g.l[0].dur <= largo;
      if (hay && ((t - ready + tot > largo && tot <= largo) || !cabe1)) { fila("wrap", { texto: "WRAP" }); nuevoDia() }
      fila("set", { texto: g.n });
      if (d.filas.length > 1) fila("proceso", { texto: "Cambio de set / montaje", dur: o.cambio });
      for (const s of g.l) {
        if (t - ready + s.dur > largo && d.filas.some(f => f.tipo === "plano")) { fila("wrap", { texto: "WRAP" }); nuevoDia(); fila("set", { texto: g.n + " (continuación)" }) }
        const p = s.p; fila("plano", { ref: p.id, num: p.num || "", esc: s.e.num || "", escala: p.escala || "", angulo: [p.angulo, p.posicion].filter(Boolean).join(" · "), desc: [p.desc, p.accion].filter(Boolean).join("\n"), mov: p.mov || "", personajes: p.sujeto || "", notas: [p.notas, p.fps && p.fps + " fps", p.lente, p.soporte].filter(Boolean).join(" · "), dur: s.dur, img: p.img || "" });
      }
    }
    fila("wrap", { texto: "WRAP" });
    return dias;
  }

  // ---------- lista ----------
  async function lista() {
    doc = null;
    const ls = await H.col("pdr");
    el.innerHTML = `<div class="bar"><span style="flex:1"></span><button class="b2" data-k="vacio">+ Plan vacío</button><button class="b" data-k="desdegt">+ Crear desde guion técnico</button></div><div class="hl">` +
      (ls.length ? ls.slice().sort((a, b) => (b.dias[0]?.fecha || "").localeCompare(a.dias[0]?.fecha || "")).map(p => { const pl = p.dias.flatMap(d => d.filas.filter(f => f.tipo === "plano")); return `<div class="r" data-k="abre" data-id="${p.id}"><i class="dot" style="background:${BANDA.set}"></i><div class="g"><b>${E(p.titulo || "Sin título")}</b><small>${E([p.dias.length + (p.dias.length > 1 ? " jornadas" : " jornada"), p.dias[0]?.fecha && H.fecha(p.dias[0].fecha), pl.length + " planos", pl.filter(f => f.rodado).length + " rodados"].filter(Boolean).join(" · "))}</small></div></div>` }).join("")
        : `<p class="em">Aún no hay planes de rodaje. Créalo desde un guion técnico y se ordena solo.</p>`) + `</div>`;
  }

  // ---------- editor ----------
  async function abrir(id) { doc = (await H.col("pdr")).find(x => x.id === id); dia = 0; if (doc) pintar() }
  function pintar() {
    const d = D(), hs = horas(d), bl = bloques(d, hs), pl = d.filas.filter(f => f.tipo === "plano"), n = COLS.length + 3;
    const fin = hs.length ? hs.at(-1).fin : aMin(d.ready);
    el.innerHTML = `<div class="bar" style="flex-wrap:wrap;gap:8px"><button class="b2" data-k="volver">← Planes</button><input data-d="titulo" value="${E(doc.titulo || "")}" placeholder="Título" style="max-width:280px;font-weight:700"><input data-d="ad" value="${E(doc.ad || "")}" placeholder="AD y teléfono" style="max-width:240px">
      <span style="flex:1"></span>${doc.gt ? `<button class="b2" data-k="regen">Regenerar desde guion</button>` : ""}<button class="b2" data-k="pdf">PDF</button><button class="b2" data-k="xls">Excel</button></div>
      <div class="tabs">${doc.dias.map((x, i) => `<button class="t ${i === dia ? "on" : ""}" data-k="dia" data-i="${i}">Jornada ${i + 1}<small>${x.fecha ? " " + H.fecha(x.fecha) : ""}</small></button>`).join("")}<button class="t" data-k="adddia">+ Jornada</button></div>
      <div class="dhead"><div><label>Fecha</label><input type="date" data-j="fecha" value="${E(d.fecha || "")}"></div><div><label>Ready to shoot</label><input type="time" data-j="ready" value="${E(d.ready || "09:00")}"></div>
      <div style="flex:2"><label>Localización / dirección</label><input data-j="lugar" value="${E(d.lugar || "")}"></div><div style="flex:3"><label>Citaciones (una por línea)</label><textarea data-j="calls" rows="2">${E(d.calls || "")}</textarea></div>
      <div class="kpi" style="margin:0;flex:2;min-width:340px;grid-template-columns:repeat(3,1fr)"><div><b>${pl.filter(f => f.rodado).length}/${pl.length}</b><small>Planos rodados</small></div><div><b>${aHora(fin)}</b><small>Wrap previsto</small></div><div><b>${Math.round((fin - (aMin(d.ready) ?? 540)) / 6) / 10} h</b><small>De rodaje</small></div></div></div>
      <div class="shw"><table class="gt pdr"><thead><tr><th style="width:52px"></th><th>Horario</th><th>Hora</th>${COLS.map(c => `<th style="min-width:${c.w}px">${c.l}</th>`).join("")}<th style="width:70px"></th></tr></thead><tbody>` +
      d.filas.map((f, i) => {
        const h = hs[i], mano = `<td class="hdc"><span class="hd" draggable="true" data-drag="${i}">⋮⋮</span>${f.tipo === "plano" ? `<input type="checkbox" data-k="rod" data-i="${i}" ${f.rodado ? "checked" : ""} title="Rodado"><i class="cdot" data-k="color" data-i="${i}" style="background:${FILA[f.color] || "#fff"}"></i>` : ""}</td>`;
        const acc = `<td class="acc"><select data-k="mover" data-i="${i}" title="Mover a otra jornada"><option>→</option>${doc.dias.map((x, j) => j === dia ? "" : `<option value="${j}">J${j + 1}</option>`).join("")}</select><button data-k="del" data-i="${i}" title="Borrar">×</button></td>`;
        if (f.tipo !== "plano") {
          const c = BANDA[f.tipo] || "#eee", dur = ["proceso", "comida"].includes(f.tipo);
          return `<tr class="pr band" data-i="${i}" style="background:${c};${f.tipo === "wrap" ? "color:#fff" : ""}">${mano}<td colspan="2" class="hora">${f.tipo === "set" ? "" : aHora(h.ini) + (dur ? " – " + aHora(h.fin) : "")}</td><td colspan="${COLS.length - 2}"><input class="cel bt" data-i="${i}" data-f="texto" value="${E(f.texto || "")}" placeholder="${BANDAS[f.tipo]}" style="${f.tipo === "set" ? "text-align:center;font-weight:700" : "font-weight:600"}"></td><td>${dur ? `<input class="cel" data-i="${i}" data-f="dur" value="${E(f.dur || "")}" style="text-align:center">` : ""}</td><td><input class="cel" data-i="${i}" data-f="fija" value="${E(f.fija || "")}" placeholder="hora fija" title="Hora fija (opcional)" style="font-size:11px"></td>${acc}</tr>`;
        }
        const b = bl[i];
        return `<tr class="pr" data-i="${i}" style="${f.color ? "background:" + FILA[f.color] : ""}${f.rodado ? ";opacity:.45" : ""}">${mano}${b ? `<td class="blk" rowspan="${b.n}">${aHora(b.ini)} – ${aHora(b.fin)}</td>` : ""}<td class="hora">${aHora(h.ini)}<br><small>${aHora(h.fin)}</small></td>` +
          COLS.map(c => c.t === "img" ? `<td class="ci" data-i="${i}">${f.img ? `<div class="thumb"><img src="${R.imgUrl(f.img)}" data-k="ver" alt=""><button data-k="qimg" data-i="${i}">×</button></div>` : `<label class="addimg">＋<input type="file" accept="image/*" data-k="img" data-i="${i}" hidden></label>`}</td>`
            : c.t === "escala" ? `<td style="background:${f.escala ? escColor(f.escala) + "33" : ""}"><input class="cel esc" list="dl-esc2" data-i="${i}" data-f="escala" value="${E(f.escala || "")}" style="border-left:4px solid ${f.escala ? escColor(f.escala) : "transparent"}"></td>`
              : c.t === "dur" ? `<td><input class="cel" data-i="${i}" data-f="dur" value="${E(f.dur || "")}" style="text-align:center;font-weight:700"></td>`
                : `<td><textarea class="cel" rows="1" data-i="${i}" data-f="${c.k}">${E(f[c.k] || "")}</textarea></td>`).join("") + acc + `</tr>`;
      }).join("") +
      `</tbody></table></div><div class="bar" style="margin-top:12px;flex-wrap:wrap"><button class="b2" data-k="add" data-t="plano">+ Plano</button><button class="b2" data-k="add" data-t="set">+ Set</button><button class="b2" data-k="add" data-t="proceso">+ Proceso</button><button class="b2" data-k="add" data-t="comida">+ Comida</button><button class="b2" data-k="add" data-t="wrap">+ Wrap</button>${doc.gt ? `<button class="b2" data-k="pend">Planos del guion sin programar</button>` : ""}<span style="flex:1"></span>${doc.dias.length > 1 ? `<button class="del" style="margin:0" data-k="deldia">Borrar jornada</button>` : ""}</div>
      <div class="lg"><span><i style="background:${BANDA.set}"></i>Set</span><span><i style="background:${BANDA.proceso}"></i>Proceso</span><span><i style="background:${BANDA.comida}"></i>Comida</span><span><i style="background:${BANDA.wrap}"></i>Wrap</span><span style="margin-left:auto">Arrastra ⋮⋮ para reordenar: las horas se recalculan solas · «hora fija» obliga a empezar a esa hora</span></div>
      <datalist id="dl-esc2">${R.ESC.map(x => `<option value="${x[0]}">`).join("")}</datalist>`;
    R.ajusta(el);
  }
  const refresca = () => { const y = window.scrollY, x = el.querySelector(".shw")?.scrollLeft; pintar(); window.scrollTo(0, y); const s = el.querySelector(".shw"); if (s && x) s.scrollLeft = x };

  // ---------- eventos ----------
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k, i = +b.dataset.i;
    if (k === "desdegt") return generar((await H.col("gt"))[0]?.id);
    if (k === "vacio") { const d = { id: H.uid("pdr"), titulo: "", dias: [{ id: uid(), fecha: H.today(), ready: "09:00", calls: "08:00 Crew call", filas: [{ id: uid(), tipo: "set", texto: "" }, { id: uid(), tipo: "plano", dur: 30 }, { id: uid(), tipo: "wrap", texto: "WRAP" }] }] }; await H.put(d, 1); doc = d; dia = 0; return pintar() }
    if (k === "abre") return abrir(b.dataset.id);
    if (!doc) return;
    if (k === "volver") return lista();
    if (k === "dia") { dia = i; pintar() }
    if (k === "adddia") { const u = doc.dias.at(-1); doc.dias.push({ id: uid(), fecha: u.fecha ? H.addDays(u.fecha, 1) : "", ready: u.ready, calls: u.calls, lugar: u.lugar, filas: [{ id: uid(), tipo: "set", texto: "" }, { id: uid(), tipo: "wrap", texto: "WRAP" }] }); dia = doc.dias.length - 1; save(); pintar() }
    if (k === "deldia" && confirm("¿Borrar esta jornada entera?")) { doc.dias.splice(dia, 1); dia = Math.max(0, dia - 1); save(); pintar() }
    if (k === "add") { const t = b.dataset.t, f = { id: uid(), tipo: t, texto: t === "set" ? "" : t === "proceso" ? "" : BANDAS[t], dur: t === "plano" ? 30 : t === "proceso" ? 30 : t === "comida" ? 60 : undefined }; const w = D().filas.findIndex(x => x.tipo === "wrap"); t === "wrap" || w < 0 ? D().filas.push(f) : D().filas.splice(w, 0, f); save(); refresca() }
    if (k === "del") { D().filas.splice(i, 1); save(); refresca() }
    if (k === "rod") { D().filas[i].rodado = b.checked; save(); refresca() }
    if (k === "color") { const f = D().filas[i]; f.color = ((f.color || 0) + 1) % FILA.length; save(); refresca() }
    if (k === "qimg") { delete D().filas[i].img; save(); refresca() }
    if (k === "ver") window.open(b.src, "_blank");
    if (k === "pdf") exportarPDF();
    if (k === "xls") exportarExcel();
    if (k === "regen") { const g = (await H.col("gt")).find(x => x.id === doc.gt); if (!g) return H.toast("No encuentro el guion técnico"); if (confirm("Se rehará el plan entero desde el guion técnico y perderás los cambios hechos a mano. ¿Seguir?")) { generar(g.id); regenerando = doc } }
    if (k === "pend") {
      const g = (await H.col("gt")).find(x => x.id === doc.gt); if (!g) return;
      const ya = new Set(doc.dias.flatMap(d => d.filas.map(f => f.ref))), l = g.escenas.flatMap(e => e.planos.map(p => ({ p, e }))).filter(x => !ya.has(x.p.id));
      H.sheet(`<h2 style="margin-top:0">Planos del guion sin programar <span>${l.length}</span></h2>` + (l.length ? l.map(({ p, e }) => `<div class="r" data-k="addpend" data-ref="${p.id}"><i class="dot" style="background:${escColor(p.escala)}"></i><div class="g"><b>Esc ${E(e.num)} · Pl ${E(p.num)} · ${E(p.escala || "")} ${E(p.sujeto || "")}</b><small>${E((p.desc || "").slice(0, 120))}</small></div><span class="ln">Añadir a J${dia + 1}</span></div>`).join("") : `<p class="em">Todos los planos del guion están en el plan.</p>`));
    }
  });
  let regenerando = null;
  document.getElementById("hsh").addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return;
    if (b.dataset.k === "gen") {
      const v = id => document.getElementById(id), gt = (await H.col("gt")).find(x => x.id === v("g-gt").value); if (!gt) return H.toast("Elige un guion técnico");
      const o = { fecha: v("g-fecha").value, call: v("g-call").value, ready: v("g-ready").value, horas: +v("g-horas").value || 10, comida: v("g-comida").value, comdur: +v("g-comdur").value || 0, cambio: +v("g-cambio").value || 0, orden: v("g-orden").value, min: v("g-min").value, hechos: v("g-hechos").checked };
      const dias = construir(gt, o);
      if (regenerando) { doc = regenerando; doc.dias = dias; regenerando = null } else doc = { id: H.uid("pdr"), titulo: gt.titulo || "", proyecto: gt.proyecto || "", gt: gt.id, ad: "", dias };
      await H.put(doc, 1); dia = 0; H.cerrar(); pintar(); H.toast(`Plan creado: ${dias.length} ${dias.length > 1 ? "jornadas" : "jornada"}`);
    }
    if (b.dataset.k === "addpend" && doc) {
      const g = (await H.col("gt")).find(x => x.id === doc.gt), e2 = g.escenas.find(e => e.planos.some(p => p.id === b.dataset.ref)), p = e2.planos.find(p => p.id === b.dataset.ref);
      const f = { id: uid(), tipo: "plano", ref: p.id, num: p.num || "", esc: e2.num || "", escala: p.escala || "", angulo: [p.angulo, p.posicion].filter(Boolean).join(" · "), desc: [p.desc, p.accion].filter(Boolean).join("\n"), mov: p.mov || "", personajes: p.sujeto || "", notas: p.notas || "", dur: +p.dur || 20, img: p.img || "" };
      const w = D().filas.findIndex(x => x.tipo === "wrap"); w < 0 ? D().filas.push(f) : D().filas.splice(w, 0, f); save(); b.remove(); refresca();
    }
  });
  el.addEventListener("input", e => {
    const t = e.target; if (!doc) return;
    if (t.dataset.d) { doc[t.dataset.d] = t.value; return save() }
    if (t.dataset.j) { D()[t.dataset.j] = t.value; save(); if (t.dataset.j === "ready") debRef(); return }
    if (t.dataset.f && t.dataset.i != null && !t.dataset.k) {
      const f = D().filas[+t.dataset.i]; f[t.dataset.f] = t.value; save();
      if (t.dataset.f === "dur" || t.dataset.f === "fija") debRef();
      if (t.dataset.f === "escala") { const c = escColor(t.value); t.style.borderLeftColor = t.value ? c : "transparent"; t.parentNode.style.background = t.value ? c + "33" : "" }
    }
  });
  let tr; const debRef = () => { clearTimeout(tr); tr = setTimeout(() => { const a = document.activeElement, s = a && [a.dataset.i, a.dataset.f, a.dataset.j]; refresca(); if (s) { const n = el.querySelector(s[2] ? `[data-j="${s[2]}"]` : `[data-i="${s[0]}"][data-f="${s[1]}"]`); if (n) { n.focus(); n.setSelectionRange && n.setSelectionRange(n.value.length, n.value.length) } } }, 700) };
  el.addEventListener("change", async e => {
    const t = e.target; if (!doc) return;
    if (t.dataset.k === "img" && t.files[0]) { const id = await R.subirImagen(t.files[0]); if (id) { D().filas[+t.dataset.i].img = id; save(); refresca() } }
    if (t.dataset.k === "mover" && t.value !== "→") { const [f] = D().filas.splice(+t.dataset.i, 1), d2 = doc.dias[+t.value], w = d2.filas.findIndex(x => x.tipo === "wrap"); w < 0 ? d2.filas.push(f) : d2.filas.splice(w, 0, f); save(); refresca(); H.toast("Movido a la jornada " + (+t.value + 1)) }
    if (t.dataset.j === "fecha") { pintar() }
  });
  let drag = null;
  el.addEventListener("dragstart", e => { const h = e.target.closest("[data-drag]"); if (!h) return; drag = +h.dataset.drag; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "x") });
  el.addEventListener("dragover", e => { const r = e.target.closest("tr.pr"); if (!r) return; e.preventDefault(); el.querySelectorAll(".dropb").forEach(x => x.classList.remove("dropb")); r.classList.add("dropb") });
  el.addEventListener("drop", async e => {
    const r = e.target.closest("tr.pr"); if (!r || !doc) return; e.preventDefault(); el.querySelectorAll(".dropb").forEach(x => x.classList.remove("dropb"));
    const ti = +r.dataset.i;
    if (drag == null) { if (e.dataTransfer.files.length && D().filas[ti].tipo === "plano") { const id = await R.subirImagen(e.dataTransfer.files[0]); if (id) { D().filas[ti].img = id; save(); refresca() } } return }
    const [f] = D().filas.splice(drag, 1); D().filas.splice(drag < ti ? ti - 1 : ti, 0, f); drag = null; save(); refresca();
  });
  el.addEventListener("dragend", () => { drag = null; el.querySelectorAll(".dropb").forEach(x => x.classList.remove("dropb")) });

  // ---------- exportar ----------
  const cab = (d, i) => [doc.titulo ? doc.titulo.toUpperCase() : "PLAN DE RODAJE", `${d.fecha ? new Date(d.fecha + "T12:00").toLocaleDateString("es-ES") + " · " : ""}JORNADA ${i + 1}/${doc.dias.length}${d.lugar ? " · " + d.lugar : ""}`];
  function exportarPDF() {
    R.pdf(doc.dias.map((d, di) => {
      const hs = horas(d), bl = bloques(d, hs), [t, s] = cab(d, di);
      return `<div class="pz" style="${di < doc.dias.length - 1 ? "page-break-after:always" : ""}"><p style="text-align:center;margin:0;font-size:9px">PLAN DE RODAJE</p><div class="band" style="background:#000;color:#fff;font-size:16px;font-style:italic">${E(t)}</div><div class="band" style="background:#fff">${E(s)}</div>${doc.ad ? `<p style="font-size:9px;margin:2px 0">AD: ${E(doc.ad)}</p>` : ""}` +
        (d.calls || "").split("\n").filter(x => x.trim()).map(c => `<div class="band" style="background:${BANDA.call}">${E(c)}</div>`).join("") + `<div class="band" style="background:${BANDA.ready}">READY TO SHOOT: ${E(d.ready || "")}</div>` +
        `<table><thead><tr><th>Horario</th><th>Hora</th>${COLS.map(c => `<th>${c.l}</th>`).join("")}<th>✓</th></tr></thead><tbody>` +
        d.filas.map((f, i) => f.tipo !== "plano" ? `<tr><td colspan="${COLS.length + 3}" class="band" style="background:${BANDA[f.tipo]};${f.tipo === "wrap" ? "color:#fff" : ""}">${f.tipo === "set" ? "SET: " : aHora(hs[i].ini) + (["proceso", "comida"].includes(f.tipo) ? " – " + aHora(hs[i].fin) : "") + " · "}${E(f.texto || BANDAS[f.tipo])}</td></tr>`
          : `<tr style="${f.color ? "background:" + FILA[f.color] : ""}">${bl[i] ? `<td rowspan="${bl[i].n}" style="font-weight:700;white-space:nowrap">${aHora(bl[i].ini)} – ${aHora(bl[i].fin)}</td>` : ""}<td style="white-space:nowrap">${aHora(hs[i].ini)} – ${aHora(hs[i].fin)}</td>` +
          COLS.map(c => c.t === "img" ? `<td>${f.img ? `<img src="${R.imgUrl(f.img)}">` : ""}</td>` : c.t === "escala" ? `<td style="background:${f.escala ? escColor(f.escala) : ""};color:#fff;font-weight:700">${E(f.escala || "")}</td>` : `<td>${E(f[c.k] || "").replace(/\n/g, "<br>")}</td>`).join("") + `<td>${f.rodado ? "✓" : ""}</td></tr>`).join("") + `</tbody></table></div>`;
    }).join(""));
  }
  function exportarExcel() {
    const ie = COLS.findIndex(c => c.t === "escala") + 2, ii = COLS.findIndex(c => c.t === "img") + 2;
    R.excel("Plan de rodaje " + (doc.titulo || ""), doc.dias.map((d, di) => {
      const hs = horas(d), bl = bloques(d, hs), [t, s] = cab(d, di);
      return {
        nombre: "Jornada " + (di + 1), titulo: t, sub: [s].concat(doc.ad ? ["AD: " + doc.ad] : [], (d.calls || "").split("\n").filter(x => x.trim()).map(c => ({ t: c, color: BANDA.call })), [{ t: "READY TO SHOOT: " + (d.ready || ""), color: BANDA.ready }]),
        cols: [{ l: "Horario", w: 13 }, { l: "Hora", w: 12 }].concat(COLS.map(c => ({ l: c.l, w: c.t === "img" ? 18 : Math.round(c.w / 7), izq: ["desc", "notas"].includes(c.k) })), [{ l: "✓", w: 4 }]),
        filas: d.filas.map((f, i) => f.tipo !== "plano" ? { banda: (f.tipo === "set" ? "SET: " : aHora(hs[i].ini) + (["proceso", "comida"].includes(f.tipo) ? " – " + aHora(hs[i].fin) : "") + " · ") + (f.texto || BANDAS[f.tipo]), color: BANDA[f.tipo], blanco: f.tipo === "wrap" }
          : { celdas: [bl[i] ? aHora(bl[i].ini) + " – " + aHora(bl[i].fin) : "", aHora(hs[i].ini) + " – " + aHora(hs[i].fin)].concat(COLS.map(c => c.t === "img" ? "" : f[c.k] || ""), [f.rodado ? "✓" : ""]), color: FILA[f.color] || "", colores: f.escala ? { [ie]: escColor(f.escala) } : {}, img: f.img, imgCol: ii })
      };
    }));
  }

  window.addEventListener("hub-sec", e => { if (e.detail === "planes" && !doc) lista() });
  window.P = { generar, abrir };
  lista();
})();
