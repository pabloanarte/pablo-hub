// Equip i repartiment: base de dades de persones de confiança (direcció de fotografia, producció, art… i actors i actrius).
(() => {
  const ROLS = ["Direcció de fotografia", "Producció", "Ajudant de direcció", "Art", "Vestuari", "Maquillatge i perruqueria", "So", "Muntatge", "Color", "Música", "Gaffer / elèctrics", "Foto fixa"];
  H.coleccion({
    sec: "persones", tipo: "persona", nuevo: "Persona",
    tabs: { f: "tipus", op: ["Equip", "Repartiment"] },
    defecto: () => ({ tipus: "Equip" }),
    campos: [
      { f: "titulo", tipo: "titulo", ph: "Nom i cognoms" },
      { f: "tipus", l: "Equip o repartiment", tipo: "pills", op: ["Equip", "Repartiment"] },
      { f: "rol", l: "Rol (equip)", tipo: "pills", llista: "persona_rol", op: ROLS },
      { f: "tel", l: "Telèfon", tipo: "tel" },
      { f: "email", l: "Email", tipo: "email" },
      { f: "insta", l: "Instagram o web", tipo: "url" },
      { f: "ciutat", l: "Ciutat", tipo: "text" },
      { f: "tarifa", l: "Tarifa habitual", tipo: "text", ph: "p. ex. 250 €/jornada amb equip" },
      { f: "edat", l: "Edat aparent (repartiment)", tipo: "text", ph: "25–35" },
      { f: "idiomes", l: "Idiomes i accents", tipo: "text" },
      { f: "reel", l: "Reel, videobook o book", tipo: "links" },
      { f: "fotos", l: "Fotos", tipo: "archivos", accept: "image/*,video/*,.pdf" },
      { f: "treballs", l: "Amb qui o en què hem treballat", tipo: "textarea", rows: 3 },
      { f: "valoracio", l: "Valoració", tipo: "pills", op: ["★", "★★", "★★★"] },
      { f: "notas", l: "Notes", tipo: "textarea" }
    ],
    orden: (a, b) => (a.rol || "").localeCompare(b.rol || "") || (a.titulo || "").localeCompare(b.titulo || ""),
    grupos: l => { const g = {}; l.forEach(d => { const k = d.tipus === "Repartiment" ? "Repartiment" : d.rol || "Sense rol"; (g[k] = g[k] || []).push(d) }); return Object.entries(g) },
    fila: d => ({ t: d.titulo || "Sense nom", s: [d.tipus === "Repartiment" ? d.edat && "edat " + d.edat : d.rol, d.ciutat, d.tarifa, d.valoracio, d.tel].filter(Boolean).join(" · "), c: d.tipus === "Repartiment" ? "#af52de" : "#0a84ff" })
  });
})();
