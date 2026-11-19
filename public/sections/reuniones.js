// Reuniones: fecha, con quién (contactos), proyecto, apuntes y próximos pasos (que se pueden pasar a Tareas).
(() => {
  H.coleccion({
    sec: "reuniones", tipo: "reunion", nuevo: "Reunión",
    defecto: () => ({ fecha: H.today() }),
    campos: [
      { f: "titulo", tipo: "titulo", ph: "Asunto" },
      { f: "fecha", l: "Fecha", tipo: "date" },
      { f: "hora", l: "Hora", tipo: "time" },
      { f: "con", l: "Con quién", tipo: "contactos" },
      { f: "proyecto", l: "Proyecto", tipo: "proyecto" },
      { f: "lugar", l: "Lugar o enlace", tipo: "text" },
      { f: "apuntes", l: "Apuntes", tipo: "textarea", rows: 10 },
      { f: "pasos", l: "Próximos pasos (uno por línea)", tipo: "textarea", rows: 4 }
    ],
    orden: (a, b) => (b.fecha || "").localeCompare(a.fecha || "") || (b.hora || "").localeCompare(a.hora || ""),
    grupos: l => [["Próximas", l.filter(d => (d.fecha || "") >= H.today()).reverse()], ["Pasadas", l.filter(d => (d.fecha || "") < H.today())]],
    fila: d => ({ t: d.titulo, s: [H.fecha(d.fecha), d.hora, d.lugar].filter(Boolean).join(" · "), c: (d.fecha || "") >= H.today() ? "#0a84ff" : "#c7c7cc" }),
    acciones: [{
      l: "Pasar próximos pasos a Tareas", fn: async d => {
        const ls = (d.pasos || "").split("\n").map(x => x.replace(/^[-•*\s]+/, "").trim()).filter(Boolean);
        if (!ls.length) return H.toast("Escribe primero los próximos pasos");
        const ya = (await H.col("tarea")).filter(t => t.reunion === d.id).map(t => t.titulo);
        const nuevos = ls.filter(x => !ya.includes(x));
        for (const t of nuevos) await H.put({ id: H.uid("tarea"), titulo: t, proyecto: d.proyecto || "", reunion: d.id, hecha: false }, 1);
        H.toast(nuevos.length ? nuevos.length + " tareas creadas" : "Ya estaban en Tareas");
      }
    }]
  });
})();
