// Proyectos. Para añadir un campo: una línea en "campos".
(() => {
  const EST = ["Idea", "Desenvolupament", "Finançament", "Preproducció", "Rodatge", "Postproducció", "Distribució", "Acabat"];
  const CE = { "Idea": "#8e8e93", "Desenvolupament": "#ff9f0a", "Finançament": "#af52de", "Preproducció": "#5ac8fa", "Rodatge": "#ff375f", "Postproducció": "#0a84ff", "Distribució": "#30b27a", "Acabat": "#000" };
  H.coleccion({
    sec: "proyectos", tipo: "proyecto", nuevo: "Projecte",
    tabs2: { f: "rol", op: ["Direcció", "Ajudant de direcció", "Script"] },
    tabs: { f: "categoria", llista: "proj_cat", op: ["Llarg", "Curt", "Videoclip", "Publicitat"] },
    campos: [
      { f: "titulo", tipo: "titulo" },
      { f: "categoria", l: "Tipus de projecte", tipo: "pills", llista: "proj_cat", op: ["Llarg", "Curt", "Videoclip", "Publicitat"] },
      { f: "rol", l: "El meu rol", tipo: "pills", op: ["Direcció", "Ajudant de direcció", "Script"], col: { "Direcció": "#000", "Ajudant de direcció": "#0a84ff", "Script": "#af52de" } },
      { f: "estado", l: "Estat", tipo: "pills", op: EST, col: CE },
      { f: "anio", l: "Any", tipo: "number" },
      { f: "logline", l: "Logline", tipo: "textarea", rows: 2 },
      { f: "notas", l: "Notes", tipo: "textarea", rows: 8 },
      { f: "archivos", l: "Arxius (cançó, referències, guió, fotos…)", tipo: "archivos" },
      { f: "enlaces", l: "Enllaços (guió, carpeta, Vimeo…)", tipo: "links" }
    ],
    orden: (a, b) => EST.indexOf(a.estado) - EST.indexOf(b.estado) || (a.titulo || "").localeCompare(b.titulo || ""),
    fila: d => ({ t: d.titulo, s: [d.categoria, d.rol, d.estado, d.anio, (d.archivos || []).length && d.archivos.length + (d.archivos.length > 1 ? " arxius" : " arxiu")].filter(Boolean).join(" · "), c: CE[d.estado] }),
    extra: d => H.relacionados(d.id)
  });
})();
