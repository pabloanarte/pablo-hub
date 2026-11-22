// Feines com a ajudant de direcció, script, direcció per encàrrec o docència: dates, productora, tarifa i cobrament.
(() => {
  const { E } = H, el = document.getElementById("s-feines");
  const EST = ["Pressupostat", "Confirmat", "Fet", "Facturat", "Cobrat"];
  const CE = { "Pressupostat": "#8e8e93", "Confirmat": "#0a84ff", "Fet": "#ff9f0a", "Facturat": "#af52de", "Cobrat": "#30b27a" };
  const total = d => +d.total || (+d.tarifa || 0) * (+d.jornades || 0);
  const eur = n => n.toLocaleString("ca-ES", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
  H.coleccion({
    sec: "feines", tipo: "feina", nuevo: "Feina",
    tabs: { f: "rol", llista: "feina_rol", op: ["Ajudant de direcció", "Script", "Direcció", "Docència"] },
    defecto: () => ({ estado: "Confirmat", rol: "Ajudant de direcció" }),
    campos: [
      { f: "titulo", tipo: "titulo", ph: "Projecte (p. ex. videoclip de …)" },
      { f: "rol", l: "Rol", tipo: "pills", llista: "feina_rol", op: ["Ajudant de direcció", "Script", "Direcció", "Docència"] },
      { f: "estado", l: "Estat", tipo: "pills", op: EST, col: CE },
      { f: "productora", l: "Productora o client", tipo: "text" },
      { f: "contactes", l: "Contactes", tipo: "contactos" },
      { f: "ini", l: "Inici", tipo: "date" }, { f: "fin", l: "Fi", tipo: "date" },
      { f: "jornades", l: "Jornades", tipo: "number" },
      { f: "tarifa", l: "Tarifa per jornada (€)", tipo: "number" },
      { f: "total", l: "Total acordat (€), si no és per jornades", tipo: "number" },
      { f: "factura", l: "Núm. de factura", tipo: "text" },
      { f: "facturat", l: "Data de la factura", tipo: "date" },
      { f: "client", l: "Dades del client per a la factura (raó social, NIF, adreça)", tipo: "textarea" },
      { f: "iva", l: "IVA (%) si no és el de sempre", tipo: "number" },
      { f: "irpf", l: "IRPF (%) si no és el de sempre", tipo: "number" },
      { f: "cobrament", l: "Data de cobrament", tipo: "date" },
      { f: "proyecto", l: "Projecte del hub (si n'hi ha)", tipo: "proyecto" },
      { f: "cv", l: "Posar-la al CV i a la web", tipo: "check" },
      { f: "notas", l: "Notes", tipo: "textarea" }
    ],
    acciones: [{ l: "Fer la factura (PDF)", fn: d => factura(d) }],
    orden: (a, b) => (b.ini || "").localeCompare(a.ini || ""),
    grupos: l => [["Per cobrar", l.filter(d => d.estado !== "Cobrat" && d.estado !== "Pressupostat")], ["Pressupostades", l.filter(d => d.estado === "Pressupostat")], ["Cobrades", l.filter(d => d.estado === "Cobrat")]],
    fila: d => ({ t: d.titulo || "Sense títol", s: [d.rol, d.productora, d.ini && H.fecha(d.ini), total(d) ? eur(total(d)) : "", d.estado].filter(Boolean).join(" · "), c: CE[d.estado] })
  });
  // Factura numerada en PDF amb IVA i IRPF. Les dades fiscals són a Configuració → «Dades per a les factures».
  async function factura(d) {
    const cfg = (await H.col("ajust")).find(x => x.id === "ajust:factura") || { id: "ajust:factura" };
    if (!cfg.nom || !cfg.nif) { H.toast("Primer omple les teves dades a Configuració → Dades per a les factures"); H.cerrar(); return hubShow("ajustos") }
    if (!String(d.client || d.productora || "").trim()) return H.toast("Posa les dades del client (o la productora) per a la factura");
    const base = total(d); if (!base) return H.toast("Posa la tarifa i les jornades, o el total");
    if (!d.factura) { const n = +cfg.seguent || 1; d.factura = (String(cfg.prefix || "").trim() || H.today().slice(0, 4) + "-") + String(n).padStart(3, "0"); cfg.seguent = n + 1; await H.put(cfg, 1) }
    if (!d.facturat) d.facturat = H.today();
    if (["Confirmat", "Fet", "Pressupostat"].includes(d.estado)) d.estado = "Facturat";
    await H.put(d, 1);
    const pc = (v, def) => v === "" || v == null ? +def || 0 : +v;
    const iva = pc(d.iva, cfg.iva === "" || cfg.iva == null ? 0 : cfg.iva), irpf = pc(d.irpf, cfg.irpf === "" || cfg.irpf == null ? 15 : cfg.irpf), qi = base * iva / 100, qr = base * irpf / 100, tot = base + qi - qr;
    const lin = +d.jornades && +d.tarifa && !+d.total ? `${d.jornades} ${+d.jornades === 1 ? "jornada" : "jornades"} × ${eur(+d.tarifa)}` : "";
    const nl = t => E(t || "").replace(/\n/g, "<br>");
    const td = "padding:8px 0;border-bottom:1px solid #ddd";
    R.pdf(`<div style="font-family:Helvetica,Arial,sans-serif;color:#000;font-size:11pt;padding:10mm 6mm">
      <div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-size:22pt;font-weight:700">Factura</div><div style="margin-top:4px">Núm. ${E(d.factura)}<br>Data: ${E(H.fecha(d.facturat))}</div></div>
      <div style="text-align:right">${E(cfg.nom)}<br>NIF ${E(cfg.nif)}<br>${nl(cfg.adreca)}${cfg.email ? "<br>" + E(cfg.email) : ""}${cfg.tel ? "<br>" + E(cfg.tel) : ""}</div></div>
      <div style="margin-top:14mm"><div style="font-size:9pt;color:#666">Client</div><div>${nl(d.client || d.productora || "")}</div></div>
      <table style="width:100%;border-collapse:collapse;margin-top:12mm"><tr><th style="text-align:left;${td}">Concepte</th><th style="text-align:right;${td}">Import</th></tr>
      <tr><td style="${td}">${E(d.rol || "")}${d.titulo ? " · " + E(d.titulo) : ""}${d.ini ? `<br><span style="color:#666">${E(H.fecha(d.ini))}${d.fin && d.fin !== d.ini ? " – " + E(H.fecha(d.fin)) : ""}${lin ? " · " + lin : ""}</span>` : lin ? `<br><span style="color:#666">${lin}</span>` : ""}</td><td style="text-align:right;${td}">${eur(base)}</td></tr></table>
      <table style="width:60%;margin-left:40%;border-collapse:collapse;margin-top:6mm">
        <tr><td style="padding:4px 0">Base imposable</td><td style="text-align:right">${eur(base)}</td></tr>
        ${iva ? `<tr><td style="padding:4px 0">IVA ${iva}%</td><td style="text-align:right">${eur(qi)}</td></tr>` : ""}
        ${irpf ? `<tr><td style="padding:4px 0">Retenció IRPF ${irpf}%</td><td style="text-align:right">−${eur(qr)}</td></tr>` : ""}
        <tr><td style="padding:8px 0;border-top:2px solid #000;font-weight:700">Total</td><td style="text-align:right;border-top:2px solid #000;font-weight:700">${eur(tot)}</td></tr></table>
      ${cfg.iban ? `<div style="margin-top:14mm">Pagament per transferència a l'IBAN <b>${E(cfg.iban)}</b></div>` : ""}</div>`, false);
  }
  // resum a dalt: pendent de cobrar i cobrat aquest any
  el.insertAdjacentHTML("afterbegin", `<div id="fres"></div>`);
  async function resum() {
    const l = await H.col("feina"), any = H.today().slice(0, 4);
    const pend = l.filter(d => ["Confirmat", "Fet", "Facturat"].includes(d.estado)).reduce((a, d) => a + total(d), 0);
    const cob = l.filter(d => d.estado === "Cobrat" && (d.cobrament || d.fin || d.ini || "").startsWith(any)).reduce((a, d) => a + total(d), 0);
    const jor = l.filter(d => (d.ini || "").startsWith(any) && d.estado !== "Pressupostat").reduce((a, d) => a + (+d.jornades || 0), 0);
    document.getElementById("fres").innerHTML = `<div class="kpi" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px"><div><b>${eur(pend)}</b><small>Per cobrar</small></div><div><b>${eur(cob)}</b><small>Cobrat el ${any}</small></div><div><b>${jor}</b><small>Jornades el ${any}</small></div></div>`;
  }
  H.onChange(resum); resum();
})();
