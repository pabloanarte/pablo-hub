// Festivales y convocatorias (labs / residencias). Las fechas límite salen en el calendario de Tareas.
(() => {
  const EST = ["Per presentar", "Presentat", "Seleccionat", "Rebutjat", "Descartat"];
  const CE = { "Per presentar": "#ff9f0a", "Presentat": "#0a84ff", "Seleccionat": "#30b27a", "Rebutjat": "#8e8e93", "Descartat": "#c7c7cc" };
  const col = H.coleccion({
    sec: "festivales", tipo: "convocatoria", nuevo: "Convocatòria",
    tabs: { f: "tipo", op: ["Festival", "Lab / residència"] },
    defecto: () => ({ estado: "Per presentar", tipo: "Festival" }),
    campos: [
      { f: "titulo", tipo: "titulo", ph: "Nom" },
      { f: "tipo", l: "Tipus", tipo: "pills", op: ["Festival", "Lab / residència"] },
      { f: "estado", l: "Estat", tipo: "pills", op: EST, col: CE },
      { f: "limite", l: "Data límit", tipo: "date" },
      { f: "evento", l: "Data del festival o resolució", tipo: "date" },
      { f: "proyecto", l: "Projecte", tipo: "proyecto" },
      { f: "lugar", l: "Lloc", tipo: "text" },
      { f: "seccio", l: "Secció", tipo: "text", ph: "Secció oficial, competició de curts…" },
      { f: "premi", l: "Premi o menció", tipo: "text", ph: "Si n'hi ha" },
      { f: "estrena", l: "Estrena que hi fa la pel·lícula", tipo: "pills", op: ["Mundial", "Internacional", "Europea", "Estatal", "Catalana"] },
      { f: "projeccions", l: "Projeccions", tipo: "textarea", rows: 2, ph: "Una per línia: dia, hora, sala" },
      { f: "cost", l: "Cost de la inscripció (€)", tipo: "number" },
      { f: "web", l: "Web o bases", tipo: "url" },
      { f: "tasa", l: "Taxa / plataforma", tipo: "text", ph: "Gratuït, 20 €, FilmFreeway…" },
      { f: "notas", l: "Notes", tipo: "textarea" }
    ],
    orden: (a, b) => (a.limite || "9").localeCompare(b.limite || "9"),
    grupos: l => { const act = d => ["Per presentar", ""].includes(d.estado || ""); return [["Per presentar", l.filter(act)], ["Presentats i tancats", l.filter(d => !act(d))]] },
    fila: d => ({ t: d.titulo, s: [d.limite && "Límit " + H.fecha(d.limite), d.estado, d.lugar].filter(Boolean).join(" · "), c: CE[d.estado] })
  });

  // ---------- Recorregut per pel·lícula ----------
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
      const n = e => l.filter(d => d.estado === e).length, sel = seleccions(l), cost = l.reduce((a, d) => a + (+d.cost || 0), 0);
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
  el.insertAdjacentHTML("afterbegin", `<div class="seg fvis" style="margin-bottom:14px"><button class="t on" data-k="fvis" data-v="llista">Convocatòries</button><button class="t" data-k="fvis" data-v="rec">Recorregut per pel·lícula</button></div>`);
  el.insertAdjacentHTML("beforeend", `<div id="frec" hidden></div>`);
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    if (k === "fvis") { vista = b.dataset.v; posaVista() }
    if (k === "fobre") H.abrir("convocatoria", b.dataset.id);
    if (k === "fcopia" || k === "fdeck") {
      const sel = seleccions((await H.col("convocatoria")).filter(d => d.proyecto === b.dataset.p && d.tipo !== "Lab / residència")), txt = sel.map(linia).join("\n");
      if (k === "fcopia") { try { await navigator.clipboard.writeText(txt); H.toast("Copiat") } catch (er) { H.toast("No s'ha pogut copiar") } return }
      const ds = (await H.col("deck")).filter(d => d.proyecto === b.dataset.p);
      if (!ds.length) return H.toast("Aquest projecte encara no té cap dossier");
      const items = sel.map(d => ({ nom: d.titulo || "", text: [d.premi || d.seccio || "selecció oficial", ANY(d)].filter(Boolean).join(" · ") }));
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
