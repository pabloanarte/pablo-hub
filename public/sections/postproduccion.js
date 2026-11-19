// Postproducción: cronograma por departamentos (ver crono.js). Departamentos y plantilla editables aquí.
Crono({
  sec: "postproduccion", tipo: "post", nombre: "postproducció", titulo: "Calendari de postproducció",
  cats: [["Muntatge", "#1e88e5"], ["So", "#6d4c41"], ["Música", "#e53935"], ["Color", "#fb8c00"], ["VFX", "#5e35b1"], ["Grafisme", "#00897b"], ["Lliuraments", "#43a047"], ["Distribució", "#546e7a"]],
  plantilla: [
    ["Bolcat, còpia de seguretat i sincronització", "Muntatge", 2], ["Primer muntatge", "Muntatge", 10], ["Música", "Música", 15, 0, 1], ["Muntatge fi", "Muntatge", 7],
    ["VFX", "VFX", 7, 0, 1], ["Tancament de muntatge", "Muntatge", 1, 1], ["Etalonatge", "Color", 4], ["Edició i mescla de so", "So", 6, 0, 1],
    ["Grafisme i títols", "Grafisme", 2], ["Subtítols", "Lliuraments", 2, 0, 1], ["Màsters i DCP", "Lliuraments", 2], ["Lliurament final", "Lliuraments", 1, 1], ["Enviament a festivals", "Distribució", 3]
  ]
});
