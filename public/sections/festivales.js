// Festivales y convocatorias (labs / residencias). Las fechas límite salen en el calendario de Tareas.
(() => {
  const EST = ["Per presentar", "Presentat", "Seleccionat", "Rebutjat", "Descartat"];
  const CE = { "Per presentar": "#ff9f0a", "Presentat": "#0a84ff", "Seleccionat": "#30b27a", "Rebutjat": "#8e8e93", "Descartat": "#c7c7cc" };
  H.coleccion({
    sec: "festivales", tipo: "convocatoria", nuevo: "Afegir",
    tabs: { f: "tipo", op: ["Festival", "Lab / residència"] },
    defecto: () => ({ estado: "Per presentar" }),
    campos: [
      { f: "titulo", tipo: "titulo", ph: "Nom" },
      { f: "tipo", l: "Tipus", tipo: "pills", op: ["Festival", "Lab / residència"] },
      { f: "estado", l: "Estat", tipo: "pills", op: EST, col: CE },
      { f: "limite", l: "Data límit", tipo: "date" },
      { f: "evento", l: "Data del festival o resolució", tipo: "date" },
      { f: "proyecto", l: "Projecte", tipo: "proyecto" },
      { f: "lugar", l: "Lloc", tipo: "text" },
      { f: "web", l: "Web o bases", tipo: "url" },
      { f: "tasa", l: "Taxa / plataforma", tipo: "text", ph: "Gratuït, 20 €, FilmFreeway…" },
      { f: "notas", l: "Notes", tipo: "textarea" }
    ],
    orden: (a, b) => (a.limite || "9").localeCompare(b.limite || "9"),
    grupos: l => { const act = d => ["Per presentar", ""].includes(d.estado || ""); return [["Per presentar", l.filter(act)], ["Presentats i tancats", l.filter(d => !act(d))]] },
    fila: d => ({ t: d.titulo, s: [d.limite && "Límit " + H.fecha(d.limite), d.estado, d.lugar].filter(Boolean).join(" · "), c: CE[d.estado] })
  });
})();
