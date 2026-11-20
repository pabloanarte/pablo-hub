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
      { f: "cobrament", l: "Data de cobrament", tipo: "date" },
      { f: "proyecto", l: "Projecte del hub (si n'hi ha)", tipo: "proyecto" },
      { f: "cv", l: "Posar-la al CV i a la web", tipo: "check" },
      { f: "notas", l: "Notes", tipo: "textarea" }
    ],
    orden: (a, b) => (b.ini || "").localeCompare(a.ini || ""),
    grupos: l => [["Per cobrar", l.filter(d => d.estado !== "Cobrat" && d.estado !== "Pressupostat")], ["Pressupostades", l.filter(d => d.estado === "Pressupostat")], ["Cobrades", l.filter(d => d.estado === "Cobrat")]],
    fila: d => ({ t: d.titulo || "Sense títol", s: [d.rol, d.productora, d.ini && H.fecha(d.ini), total(d) ? eur(total(d)) : "", d.estado].filter(Boolean).join(" · "), c: CE[d.estado] })
  });
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
