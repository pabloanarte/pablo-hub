// Preproducción: cronograma por departamentos (ver crono.js). Departamentos y plantilla editables aquí.
Crono({
  sec: "preproduccion", tipo: "pre", nombre: "preproducción", titulo: "Calendario de preproducción",
  cats: [["Guion", "#5856d6"], ["Producción", "#0a84ff"], ["Casting", "#ff375f"], ["Localizaciones", "#30b27a"], ["Arte", "#ff9f0a"], ["Vestuario y maquillaje", "#af52de"], ["Fotografía", "#32ade6"], ["Sonido", "#a2845e"]],
  plantilla: [
    ["Desglose de guion", "Producción", 3], ["Presupuesto y financiación", "Producción", 5, 0, 1], ["Casting", "Casting", 10, 0, 1],
    ["Scouting de localizaciones", "Localizaciones", 7], ["Guion técnico y storyboard", "Fotografía", 5, 0, 1], ["Diseño de arte y vestuario", "Arte", 7],
    ["Permisos y seguros", "Producción", 4, 0, 1], ["Pruebas de cámara, vestuario y maquillaje", "Fotografía", 2], ["Ensayos", "Casting", 2, 0, 1],
    ["Plan de rodaje y citaciones", "Producción", 2], ["Inicio de rodaje", "Producción", 1, 1]
  ]
});
