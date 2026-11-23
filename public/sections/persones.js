// Equip i repartiment: base de dades de persones de confiança (direcció de fotografia, producció, art… i actors i actrius).
(() => {
  const ROLS = ["Direcció de fotografia", "Producció", "Ajudant de direcció", "Art", "Vestuari", "Maquillatge i perruqueria", "So", "Muntatge", "Color", "Música", "Gaffer / elèctrics", "Foto fixa"];
  const rolTxt = d => [].concat(d.rol || []).join(", ");
  const rang = d => d.tipus === "Repartiment" ? -1 : H.rangRol(rolTxt(d));
  const dept = d => d.tipus === "Repartiment" ? "Repartiment" : rolTxt(d) ? H.deptDe(rolTxt(d)) : "Sense rol";
  const COL = { "Repartiment": "#1d1d1f", "Direcció": "#30b27a", "Producció": "#30b27a", "Fotografia": "#0a84ff", "Foto fixa": "#0a84ff", "Art": "#ff9f0a", "Vestuari": "#ff9f0a", "Maquillatge": "#ff9f0a", "So": "#5ac8fa", "Postproducció": "#ff375f", "Càsting": "#af52de" };
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
    // per departaments (com els crèdits), i dins de cada un per càrrec i nom
    orden: (a, b) => rang(a) - rang(b) || (a.titulo || "").localeCompare(b.titulo || ""),
    grupos: l => { const g = {}; l.forEach(d => { const k = dept(d); (g[k] = g[k] || []).push(d) }); return Object.entries(g) },
    fila: d => ({ t: d.titulo || "Sense nom", s: [d.tipus === "Repartiment" ? d.edat && "edat " + d.edat : rolTxt(d), d.ciutat, d.tarifa, d.valoracio, d.tel].filter(Boolean).join(" · "), c: COL[dept(d)] || "#8e8e93" })
  });
})();
