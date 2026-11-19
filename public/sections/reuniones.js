// Reuniones: fecha, con quién (contactos), proyecto, apuntes y próximos pasos (que se pueden pasar a Tareas).
(() => {
  H.coleccion({
    sec: "reuniones", tipo: "reunion", nuevo: "Reunió",
    defecto: () => ({ fecha: H.today() }),
    campos: [
      { f: "titulo", tipo: "titulo", ph: "Assumpte" },
      { f: "fecha", l: "Data", tipo: "date" },
      { f: "hora", l: "Hora", tipo: "time" },
      { f: "con", l: "Amb qui", tipo: "contactos" },
      { f: "proyecto", l: "Projecte", tipo: "proyecto" },
      { f: "lugar", l: "Lloc o enllaç", tipo: "text" },
      { f: "apuntes", l: "Apunts", tipo: "textarea", rows: 10 },
      { f: "pasos", l: "Propers passos (un per línia)", tipo: "textarea", rows: 4 }
    ],
    orden: (a, b) => (b.fecha || "").localeCompare(a.fecha || "") || (b.hora || "").localeCompare(a.hora || ""),
    grupos: l => [["Properes", l.filter(d => (d.fecha || "") >= H.today()).reverse()], ["Passades", l.filter(d => (d.fecha || "") < H.today())]],
    fila: d => ({ t: d.titulo, s: [H.fecha(d.fecha), d.hora, d.lugar].filter(Boolean).join(" · "), c: (d.fecha || "") >= H.today() ? "#0a84ff" : "#c7c7cc" }),
    acciones: [{
      l: "Passar els propers passos a Tasques", fn: async d => {
        const ls = (d.pasos || "").split("\n").map(x => x.replace(/^[-•*\s]+/, "").trim()).filter(Boolean);
        if (!ls.length) return H.toast("Escriu primer els propers passos");
        const ya = (await H.col("tarea")).filter(t => t.reunion === d.id).map(t => t.titulo);
        const nuevos = ls.filter(x => !ya.includes(x));
        for (const t of nuevos) await H.put({ id: H.uid("tarea"), titulo: t, proyecto: d.proyecto || "", reunion: d.id, hecha: false }, 1);
        H.toast(nuevos.length ? nuevos.length + (nuevos.length > 1 ? " tasques creades" : " tasca creada") : "Ja eren a Tasques");
      }
    }]
  });
})();
