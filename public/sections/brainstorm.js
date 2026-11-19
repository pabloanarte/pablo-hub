// Brainstorm: ideas sueltas, con etiqueta y proyecto opcionales.
(() => {
  H.coleccion({
    sec: "brainstorm", tipo: "idea", nuevo: "Idea",
    defecto: () => ({ fecha: H.today() }),
    campos: [
      { f: "titulo", tipo: "titulo", ph: "Idea" },
      { f: "texto", l: "Desarrollo", tipo: "textarea", rows: 12 },
      { f: "etiqueta", l: "Etiqueta", tipo: "pills", op: ["Historia", "Escena", "Personaje", "Imagen", "Videoclip", "Negocio", "Otra"] },
      { f: "proyecto", l: "Proyecto", tipo: "proyecto" },
      { f: "enlaces", l: "Referencias", tipo: "links" }
    ],
    orden: (a, b) => (b.fecha || "").localeCompare(a.fecha || ""),
    fila: d => ({ t: d.titulo, s: [d.etiqueta, (d.texto || "").split("\n")[0].slice(0, 80)].filter(Boolean).join(" · "), c: "#ffcc00" })
  });
})();
