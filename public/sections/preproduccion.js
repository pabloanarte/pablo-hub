// Preproducción: cronograma por departamentos (ver crono.js). Departamentos y plantilla editables aquí.
Crono({
  sec: "preproduccion", tipo: "pre", nombre: "preproducción", titulo: "Calendari de preproducció",
  cats: [["Guió", "#5856d6"], ["Producció", "#0a84ff"], ["Càsting", "#ff375f"], ["Localitzacions", "#30b27a"], ["Art", "#ff9f0a"], ["Vestuari i maquillatge", "#af52de"], ["Fotografia", "#32ade6"], ["So", "#a2845e"]],
  plantilla: [
    ["Desglossament de guió", "Producció", 3], ["Pressupost i finançament", "Producció", 5, 0, 1], ["Càsting", "Càsting", 10, 0, 1],
    ["Scouting de localitzacions", "Localitzacions", 7], ["Guió tècnic i storyboard", "Fotografia", 5, 0, 1], ["Disseny d'art i vestuari", "Art", 7],
    ["Permisos i assegurances", "Producció", 4, 0, 1], ["Proves de càmera, vestuari i maquillatge", "Fotografia", 2], ["Assajos", "Càsting", 2, 0, 1],
    ["Pla de rodatge i citacions", "Producció", 2], ["Inici de rodatge", "Producció", 1, 1]
  ]
});
