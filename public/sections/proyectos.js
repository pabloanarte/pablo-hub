// Proyectos. Para añadir un campo: una línea en "campos".
(() => {
  const EST = ["Idea", "Desarrollo", "Financiación", "Preproducción", "Rodaje", "Postproducción", "Distribución", "Terminado"];
  const CE = { Idea: "#c7c7cc", Desarrollo: "#ff9f0a", Financiación: "#af52de", Preproducción: "#5ac8fa", Rodaje: "#ff375f", Postproducción: "#0a84ff", Distribución: "#30b27a", Terminado: "#000" };
  H.coleccion({
    sec: "proyectos", tipo: "proyecto", nuevo: "Proyecto",
    tabs: { f: "categoria", op: ["Largo", "Corto", "Videoclip", "Publicidad"] },
    campos: [
      { f: "titulo", tipo: "titulo" },
      { f: "categoria", l: "Categoría", tipo: "pills", op: ["Largo", "Corto", "Videoclip", "Publicidad"] },
      { f: "estado", l: "Estado", tipo: "pills", op: EST, col: CE },
      { f: "anio", l: "Año", tipo: "number" },
      { f: "logline", l: "Logline", tipo: "textarea", rows: 2 },
      { f: "notas", l: "Notas", tipo: "textarea", rows: 8 },
      { f: "enlaces", l: "Enlaces (guion, carpeta, Vimeo…)", tipo: "links" }
    ],
    orden: (a, b) => EST.indexOf(a.estado) - EST.indexOf(b.estado) || (a.titulo || "").localeCompare(b.titulo || ""),
    fila: d => ({ t: d.titulo, s: [d.categoria, d.estado, d.anio].filter(Boolean).join(" · "), c: CE[d.estado] }),
    extra: d => H.relacionados(d.id)
  });
})();
