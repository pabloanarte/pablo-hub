// Postproducción: cronograma por departamentos (ver crono.js). Departamentos y plantilla editables aquí.
Crono({
  sec: "postproduccion", tipo: "post", nombre: "postproducción", titulo: "Calendario de postproducción",
  cats: [["Montaje", "#0a84ff"], ["Sonido", "#a2845e"], ["Música", "#ff375f"], ["Color", "#ff9f0a"], ["VFX", "#af52de"], ["Grafismo", "#32ade6"], ["Entregas", "#30b27a"], ["Distribución", "#5856d6"]],
  plantilla: [
    ["Volcado, backup y sincronización", "Montaje", 2], ["Primer montaje", "Montaje", 10], ["Música", "Música", 15, 0, 1], ["Montaje fino", "Montaje", 7],
    ["VFX", "VFX", 7, 0, 1], ["Cierre de montaje", "Montaje", 1, 1], ["Etalonaje", "Color", 4], ["Edición y mezcla de sonido", "Sonido", 6, 0, 1],
    ["Grafismo y títulos", "Grafismo", 2], ["Subtítulos", "Entregas", 2, 0, 1], ["Masters y DCP", "Entregas", 2], ["Entrega final", "Entregas", 1, 1], ["Envío a festivales", "Distribución", 3]
  ]
});
