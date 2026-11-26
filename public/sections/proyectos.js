// Proyectos. Para añadir un campo: una línea en "campos".
(() => {
  const EST = ["Idea", "Desenvolupament", "Finançament", "Preproducció", "Rodatge", "Postproducció", "Distribució", "Acabat"];
  const CE = { "Idea": "#8e8e93", "Desenvolupament": "#ff9f0a", "Finançament": "#af52de", "Preproducció": "#5ac8fa", "Rodatge": "#ff375f", "Postproducció": "#0a84ff", "Distribució": "#30b27a", "Acabat": "#000" };
  let CX = null; // el que el hub ja sap, per a la barra de progrés de cada projecte (passos.js)
  const col = H.coleccion({
    sec: "proyectos", tipo: "proyecto", nuevo: "Projecte",
    // Pestanyes: els meus projectes (direcció o guió) i a part els que he fet com a equip (ajudant de direcció, script)
    tabs2: { f: "rol", sense: 1, op: ["Direcció i guió", "Com a equip"], fn: (d, v) => v === "Com a equip" ? !H.meu(d) : H.meu(d), nou: v => ({ rol: v === "Com a equip" ? ["Ajudant de direcció"] : ["Direcció"] }) },
    ordenable: 1,
    tabs: { f: "categoria", llista: "proj_cat", op: ["Llarg", "Curt", "Videoclip", "Publicitat"] },
    campos: [
      { f: "titulo", tipo: "titulo" },
      { f: "altres", l: "Altres títols (anglès, de treball…), separats per comes", tipo: "text", ph: "p. ex. Rave To The Grave" },
      { f: "poster", l: "Pòster", tipo: "archivos", unic: 1, ajuda: "Vertical, com un cartell. JPG o PNG, màxim 25 MB." },
      { f: "categoria", l: "Tipus de projecte", tipo: "pills", llista: "proj_cat", op: ["Llarg", "Curt", "Videoclip", "Publicitat"] },
      { f: "rol", l: "El meu rol", tipo: "pills", multi: 1, op: ["Direcció", "Guió", "Ajudant de direcció", "Script"], col: { "Direcció": "#000", "Guió": "#000", "Ajudant de direcció": "#0a84ff", "Script": "#af52de" }, ajuda: "Si només hi ets d'ajudant de direcció o script, va a «Com a equip» i no surt als dossiers, festivals ni a la resta del hub." },
      { f: "estado", l: "Estat", tipo: "pills", op: EST, col: CE },
      { f: "anio", l: "Any", tipo: "number" },
      { f: "logline", l: "Logline", tipo: "textarea", rows: 2 },
      { f: "notas", l: "Notes", tipo: "textarea", rows: 8 },
      { f: "archivos", l: "Arxius (cançó, referències, guió, fotos…)", tipo: "archivos" },
      { f: "enlaces", l: "Enllaços (guió, carpeta, Vimeo…)", tipo: "links" }
    ],
    orden: (a, b) => EST.indexOf(a.estado) - EST.indexOf(b.estado) || (a.titulo || "").localeCompare(b.titulo || ""),
    cartell: 1,
    obre: d => window.HUB ? HUB.obreProjecte(d.id) : H.abrir("proyecto", d.id),
    fila: d => { const pr = CX && d.estado !== "Acabat" ? PAS.progres(d, CX) : null, fee = PAS.feeTxt(d), nt = PAS.valorat(d) ? PAS.fmtNota(PAS.nota(d)) : "";
      return { img: d.poster && d.poster[0] ? "/api/archivo/" + d.poster[0].id : "", t: d.titulo, s: [d.categoria, H.rols(d).join(", "), d.estado, d.anio].filter(Boolean).join(" · "), c: CE[d.estado],
        meta: nt || fee ? `${nt ? `<span>${H.E(nt)}</span>` : ""}${fee ? `<span class="${fee === "Sense fee" ? "" : "eur"}">${H.E(fee)}</span>` : ""}` : "",
        ...(pr && pr.tot ? { bar: pr.f, barT: `${PAS.faseActual(d, CX)} · ${pr.n}/${pr.tot}` } : {}) } },
    extra: d => H.relacionados(d.id)
  });
  // Documents que no són de cap projecte (dossiers, guions, plans, calendaris…): s'hi entra com si fos un projecte més
  const el = document.getElementById("s-proyectos"), box = document.createElement("div"); el.querySelector(".hl").after(box);
  async function orfes() {
    const l = await Promise.all(["deck", "gt", "pdr", "desg", "pre", "post"].map(t => H.col(t))), n = l.reduce((a, x) => a + x.filter(d => !d.proyecto).length, 0);
    box.innerHTML = n ? `<p style="margin-top:22px"><button class="b2" data-k="orfes">Documents sense projecte (${n})</button></p>` : "";
  }
  box.addEventListener("click", e => { if (e.target.closest('[data-k="orfes"]') && window.HUB) HUB.obreProjecte("-", "decks") });
  H.onChange(() => { if (!el.hidden) orfes() }); orfes();
  const carregaCX = async () => { try { const c = await PAS.ctx(); const nou = !CX; CX = c; if (nou) col.pintar() } catch (e) { } };
  H.onChange(() => { if (!el.hidden) PAS.ctx(true).then(c => { CX = c; col.pintar() }).catch(() => { }) }); carregaCX();
})();
