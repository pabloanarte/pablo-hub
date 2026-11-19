// Postproducción: cronograma por departamentos (ver crono.js). Departamentos y plantilla editables aquí.
Crono({
  sec: "postproduccion", tipo: "post", nombre: "postproducción", titulo: "Calendari de postproducció",
  cats: [["Muntatge", "#0a84ff"], ["So", "#a2845e"], ["Música", "#ff375f"], ["Color", "#ff9f0a"], ["VFX", "#af52de"], ["Grafisme", "#32ade6"], ["Lliuraments", "#30b27a"], ["Distribució", "#5856d6"]],
  plantilla: [
    ["Bolcat, còpia de seguretat i sincronització", "Muntatge", 2], ["Primer muntatge", "Muntatge", 10], ["Música", "Música", 15, 0, 1], ["Muntatge fi", "Muntatge", 7],
    ["VFX", "VFX", 7, 0, 1], ["Tancament de muntatge", "Muntatge", 1, 1], ["Etalonatge", "Color", 4], ["Edició i mescla de so", "So", 6, 0, 1],
    ["Grafisme i títols", "Grafisme", 2], ["Subtítols", "Lliuraments", 2, 0, 1], ["Màsters i DCP", "Lliuraments", 2], ["Lliurament final", "Lliuraments", 1, 1], ["Enviament a festivals", "Distribució", 3]
  ]
});
