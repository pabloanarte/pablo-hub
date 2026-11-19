// Festivales y convocatorias (labs / residencias). Las fechas límite salen en el calendario de Tareas.
(() => {
  const EST = ["Por presentar", "Presentado", "Seleccionado", "Rechazado", "Descartado"];
  const CE = { "Por presentar": "#ff9f0a", Presentado: "#0a84ff", Seleccionado: "#30b27a", Rechazado: "#8e8e93", Descartado: "#c7c7cc" };
  H.coleccion({
    sec: "festivales", tipo: "convocatoria", nuevo: "Añadir",
    tabs: { f: "tipo", op: ["Festival", "Lab / residencia"] },
    defecto: () => ({ estado: "Por presentar" }),
    campos: [
      { f: "titulo", tipo: "titulo", ph: "Nombre" },
      { f: "tipo", l: "Tipo", tipo: "pills", op: ["Festival", "Lab / residencia"] },
      { f: "estado", l: "Estado", tipo: "pills", op: EST, col: CE },
      { f: "limite", l: "Fecha límite", tipo: "date" },
      { f: "evento", l: "Fecha del festival o resolución", tipo: "date" },
      { f: "proyecto", l: "Proyecto", tipo: "proyecto" },
      { f: "lugar", l: "Lugar", tipo: "text" },
      { f: "web", l: "Web o bases", tipo: "url" },
      { f: "tasa", l: "Tasa / plataforma", tipo: "text", ph: "Gratis, 20 €, FilmFreeway…" },
      { f: "notas", l: "Notas", tipo: "textarea" }
    ],
    orden: (a, b) => (a.limite || "9").localeCompare(b.limite || "9"),
    grupos: l => { const act = d => ["Por presentar", ""].includes(d.estado || ""); return [["Por presentar", l.filter(act)], ["Presentados y cerrados", l.filter(d => !act(d))]] },
    fila: d => ({ t: d.titulo, s: [d.limite && "Límite " + H.fecha(d.limite), d.estado, d.lugar].filter(Boolean).join(" · "), c: CE[d.estado] })
  });
})();
