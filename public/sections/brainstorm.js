// Brainstorm: ideas sueltas, con etiqueta y proyecto opcionales.
(() => {
  H.coleccion({
    sec: "brainstorm", tipo: "idea", nuevo: "Idea",
    defecto: () => ({ fecha: H.today() }),
    campos: [
      { f: "titulo", tipo: "titulo", ph: "Idea" },
      { f: "texto", l: "Desenvolupament", tipo: "textarea", rows: 12 },
      { f: "etiqueta", l: "Etiqueta", tipo: "pills", op: ["Història", "Escena", "Personatge", "Imatge", "Videoclip", "Negoci", "Altres"] },
      { f: "proyecto", l: "Projecte", tipo: "proyecto" },
      { f: "archivos", l: "Arxius", tipo: "archivos" },
      { f: "enlaces", l: "Referències", tipo: "links" }
    ],
    orden: (a, b) => (b.fecha || "").localeCompare(a.fecha || ""),
    fila: d => ({ t: d.titulo, s: [d.etiqueta, (d.texto || "").split("\n")[0].slice(0, 80)].filter(Boolean).join(" · "), c: "#ffcc00" })
  });
})();
