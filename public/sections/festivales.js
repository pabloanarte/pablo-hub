// Festivales y convocatorias (labs / residencias). Las fechas límite salen en el calendario de Tareas.
(() => {
  const EST = ["Per presentar", "Presentat", "Seleccionat", "Rebutjat", "Descartat"];
  const CE = { "Per presentar": "#ff9f0a", "Presentat": "#0a84ff", "Seleccionat": "#30b27a", "Rebutjat": "#8e8e93", "Descartat": "#c7c7cc" };
  let PS = {}; // id del projecte → títol, per mostrar-lo a cada festival
  const carregaPS = () => H.col("proyecto").then(l => { const n = {}; l.forEach(p => n[p.id] = p.titulo || ""); const canvi = JSON.stringify(n) !== JSON.stringify(PS); PS = n; if (canvi && col) col.pintar() });
  const col = H.coleccion({
    sec: "festivales", perProj: 1, tipo: "convocatoria", nuevo: "Convocatòria",
    tabs: { f: "tipo", op: ["Festival", "Lab / residència"] },
    defecto: () => ({ estado: "Per presentar", tipo: "Festival" }),
    campos: [
      { f: "titulo", tipo: "titulo", ph: "Nom" },
      { f: "tipo", l: "Tipus", tipo: "pills", op: ["Festival", "Lab / residència"] },
      { f: "estado", l: "Estat", tipo: "pills", op: EST, col: CE },
      { f: "limite", l: "Data límit", tipo: "date" },
      { f: "evento", l: "Data del festival o resolució", tipo: "date" },
      { f: "proyecto", l: "Projecte", tipo: "proyecto" },
      { f: "plataforma", l: "Plataforma d'inscripció", tipo: "pills", llista: "fest_plat", op: ["FilmFreeway", "Festhome"] },
      { f: "classe", l: "Categoria del festival (si en té)", tipo: "pills", multi: 1, op: ["Categoria A", "Categoria B", "De gènere"] },
      { f: "necessitats", l: "Què demanen (marca el que cal enviar)", tipo: "pills", multi: 1, llista: "fest_nec", op: ["DCP", "ProRes", "H.264", "Subtítols en anglès", "Subtítols en castellà", "Llista de diàlegs", "Tràiler", "Fotos fixes", "Pòster", "Press kit", "Biofilmografia", "Fitxa tècnica i artística", "Còpia de visionat (Vimeo)", "Música lliure de drets"] },
      { f: "enviat", l: "Ja enviat", tipo: "pills", multi: 1, opsDoc: d => [].concat(d.necessitats || []), buit: "Marca primer què demanen." },
      { f: "necnotes", l: "Altres requisits (formats, terminis d'enviament de còpia, adreça…)", tipo: "textarea", rows: 2 },
      { f: "lugar", l: "Lloc", tipo: "text" },
      { f: "seccio", l: "Secció", tipo: "text", ph: "Secció oficial, competició de curts…" },
      { f: "premi", l: "Premi o menció", tipo: "text", ph: "Si n'hi ha" },
      { f: "estrena", l: "Estrena que hi fa la pel·lícula", tipo: "pills", op: ["Mundial", "Internacional", "Europea", "Estatal", "Catalana"] },
      { f: "projeccions", l: "Projeccions", tipo: "textarea", rows: 2, ph: "Una per línia: dia, hora, sala" },
      { f: "cost", l: "Cost de la inscripció (€)", tipo: "number" },
      { f: "web", l: "Web o bases", tipo: "url" },
      { f: "tasa", l: "Taxa (notes)", tipo: "text", ph: "Gratuït, descompte early bird…" },
      { f: "notas", l: "Notes", tipo: "textarea" }
    ],
    orden: (a, b) => (a.limite || a.evento || "9").localeCompare(b.limite || b.evento || "9") || (a.titulo || "").localeCompare(b.titulo || ""),
    grupos: l => [["Per presentar", l.filter(d => !d.estado || d.estado === "Per presentar")], ["Sense decidir", l.filter(d => d.estado === "Presentat")], ["Premiats", l.filter(d => d.estado === "Seleccionat" && d.premi)], ["Seleccionats", l.filter(d => d.estado === "Seleccionat" && !d.premi)], ["Rebutjats", l.filter(d => d.estado === "Rebutjat")], ["Descartats", l.filter(d => d.estado === "Descartat")]],
    fila: d => { const nec = (d.necessitats || []).filter(x => !(d.enviat || []).includes(x)); return { t: d.titulo, s: [PS[d.proyecto], d.estado === "Per presentar" && d.limite && "Límit " + H.fecha(d.limite), d.premi || (d.estado !== "Per presentar" && d.estado), d.plataforma, [].concat(d.classe || []).join(", "), d.estado !== "Rebutjat" && d.estado !== "Descartat" && nec.length && "Falta: " + nec.join(", ")].filter(Boolean).join(" · "), c: CE[d.estado] } }
  });

  carregaPS(); H.onChange(carregaPS);
  // Un sol cop: omple la plataforma dels festivals importats abans que existís el camp
  (async () => {
    const aj = await H.col("ajust"); if (aj.some(x => x.id === "ajust:migplat")) return;
    for (const d of await H.col("convocatoria")) {
      if (d.plataforma) continue;
      const n = d.notas || "", t = d.tasa || "";
      const p = /festhome/i.test(t) || /Importat de Festhome/.test(n) ? "Festhome" : /filmfreeway/i.test(t) || /Importat de FilmFreeway/.test(n) ? "FilmFreeway"
        : /arxiu exportat/.test(n) && !/\((2026-11-12|2026-11-06|2026-11-03)\)/.test(n) ? "FilmFreeway" : /arxiu exportat/.test(n) ? "Festhome" : "";
      if (!p) continue;
      d.plataforma = p; if (/^(filmfreeway|festhome)$/i.test(t.trim())) d.tasa = ""; H.put(d, 1);
    }
    H.put({ id: "ajust:migplat", fet: 1 }, 1);
  })();

  // ---------- Recorregut per projecte ----------
  const { E } = H, el = document.getElementById("s-festivales");
  let vista = "llista";
  const ANY = d => (d.evento || d.limite || "").slice(0, 4);
  const linia = d => `${d.titulo}${ANY(d) ? " " + ANY(d) : ""} — ${d.premi || d.seccio || "selecció oficial"}`;
  const seleccions = l => l.filter(d => d.estado === "Seleccionat" || d.premi);
  async function recorregut() {
    const [cs, ps] = await Promise.all([H.col("convocatoria"), H.col("proyecto")]);
    const fs = cs.filter(d => d.tipo !== "Lab / residència" && d.proyecto), box = document.getElementById("frec");
    const grups = ps.map(p => [p, fs.filter(d => d.proyecto === p.id)]).filter(([, l]) => l.length).sort((a, b) => b[1].length - a[1].length);
    box.innerHTML = grups.length ? grups.map(([p, l]) => {
      const n = e => l.filter(d => d.estado === e).length, sel = seleccions(l), cost = l.filter(d => !["Per presentar", "Descartat"].includes(d.estado)).reduce((a, d) => a + (+d.cost || 0), 0);
      const NIV = ["Mundial", "Internacional", "Europea", "Estatal", "Catalana"], fetes = NIV.map(e => [e, l.find(d => d.estrena === e && (d.estado === "Seleccionat" || d.premi))]);
      // una estrena d'un nivell més ampli ja cobreix els de sota (una mundial també és estatal…)
      fetes.forEach((f, i) => { if (!f[1]) { const ant = fetes.slice(0, i).find(x => x[1]); if (ant) f[2] = ant[0] } });
      const prox = l.filter(d => d.estado === "Per presentar" && d.limite && d.limite >= H.today()).sort((a, b) => a.limite.localeCompare(b.limite))[0];
      return `<div class="card frc"><h3>${E(p.titulo || "Sense títol")}</h3>
        <div class="st s5">${[["Presentats", l.length - n("Per presentar") - n("Descartat")], ["Seleccions", sel.length], ["Premis", l.filter(d => d.premi).length], ["Pendents", n("Per presentar")], ["Taxes", cost + " €"]].map(([t, v]) => `<div><b>${v}</b><small>${t}</small></div>`).join("")}</div>
        <p class="em" style="margin:10px 0">Estrenes: ${fetes.map(([e, d, per]) => d ? `<b>${e}</b> a ${E(d.titulo)}` : per ? `<span class="mut">${e}: ja feta (${per.toLowerCase()})</span>` : `<span class="mut">${e} lliure</span>`).join(" · ")}${prox ? `<br>Pròxima data límit: <b>${E(prox.titulo)}</b>, ${H.fecha(prox.limite)}` : ""}</p>
        ${l.slice().sort((a, b) => (b.evento || b.limite || "").localeCompare(a.evento || a.limite || "")).map(d => `<div class="r" data-k="fobre" data-id="${d.id}"><i class="dot" style="background:${CE[d.estado] || "#c7c7cc"}"></i><div class="g"><b>${E(d.titulo || "")}</b><small>${d.premi ? `<span style="color:#b8860b;font-weight:700">${E(d.premi)}</span> · ` : ""}${[d.estado, d.seccio, d.estrena && "estrena " + d.estrena.toLowerCase(), d.evento ? H.fecha(d.evento) : d.limite && "límit " + H.fecha(d.limite), d.lugar].filter(Boolean).map(E).join(" · ")}</small></div></div>`).join("")}
        ${sel.length ? `<div class="ls" style="margin-top:12px"><button class="b2" data-k="fcopia" data-p="${p.id}">Copiar la llista de seleccions</button><button class="b2" data-k="fdeck" data-p="${p.id}">Posar els llorers als dossiers d'aquest projecte</button></div>` : ""}</div>`;
    }).join("") : `<p class="em">Quan una convocatòria de festival tingui un projecte assignat, aquí veuràs el recorregut de cada pel·lícula.</p>`;
  }
  function posaVista() {
    [...el.children].forEach(c => { if (!c.classList.contains("fvis")) c.hidden = vista === "rec" ? c.id !== "frec" : c.id === "frec" });
    el.querySelectorAll(".fvis .t").forEach(b => b.classList.toggle("on", b.dataset.v === vista));
    if (vista === "rec") recorregut();
  }
  el.insertAdjacentHTML("afterbegin", `<div class="seg fvis" style="margin-bottom:14px;display:flex;flex-wrap:wrap;gap:6px;align-items:center"><button class="t on" data-k="fvis" data-v="llista">Convocatòries</button><button class="t" data-k="fvis" data-v="rec">Recorregut per projecte</button><span style="flex:1"></span><button class="b2" data-k="fimp">Importar de FilmFreeway i Festhome</button></div>`);
  el.insertAdjacentHTML("beforeend", `<div id="frec" hidden></div>`);
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    if (k === "fvis") { vista = b.dataset.v; posaVista() }
    if (k === "fimp") return FIMP.obre();
    if (k === "fobre") H.abrir("convocatoria", b.dataset.id);
    if (k === "fcopia" || k === "fdeck") {
      const sel = seleccions((await H.col("convocatoria")).filter(d => d.proyecto === b.dataset.p && d.tipo !== "Lab / residència")), txt = sel.map(linia).join("\n");
      if (k === "fcopia") { try { await navigator.clipboard.writeText(txt); H.toast("Copiat") } catch (er) { H.toast("No s'ha pogut copiar") } return }
      const ds = (await H.col("deck")).filter(d => d.proyecto === b.dataset.p);
      if (!ds.length) return H.toast("Aquest projecte encara no té cap dossier");
      const items = sel.map(d => ({ nom: d.titulo || "", premi: !!d.premi, text: [d.premi || d.seccio || "selecció oficial", ANY(d)].filter(Boolean).join(" · ") }));
      ds.forEach(d => {
        d.dades = d.dades || {}; d.dades.festivals = Object.assign({}, d.dades.festivals, { text: txt });
        const s = (d.slides || []).find(x => x.tipus === "laurels" || (x.tipus === "llista" && /festivals/i.test(x.titol || "")));
        if (s) Object.assign(s, { tipus: "laurels", titol: s.titol || "festivals i premis", items }); else (d.slides = d.slides || []).splice(Math.max(1, d.slides.length - 1), 0, { id: "s" + Date.now().toString(36), tipus: "laurels", titol: "festivals i premis", items });
        H.put(d);
      });
      H.toast(ds.length === 1 ? "Llorers posats al dossier" : `Llorers posats a ${ds.length} dossiers`);
    }
  });
  H.onChange(() => { if (vista === "rec" && !el.hidden) recorregut() });
})();
