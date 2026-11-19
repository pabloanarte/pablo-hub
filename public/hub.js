// Secciones del hub. Para añadir una: una línea aquí + un archivo en sections/ (la <section> se crea sola).
const SECTIONS = [
 {id:"tareas",label:"Tareas",src:"sections/tareas.js"},
 {id:"contactos",label:"Contactos",src:"sections/contactos.js"},
 {id:"reuniones",label:"Reuniones",src:"sections/reuniones.js"},
 {id:"proyectos",label:"Proyectos",src:"sections/proyectos.js"},
 {id:"festivales",label:"Festivales y convocatorias",src:"sections/festivales.js"},
 {id:"brainstorm",label:"Brainstorm",src:"sections/brainstorm.js"},
 {id:"web",label:"Mi web",src:"sections/web.js"}
];
const nav = document.getElementById("hubnav"), wrap = document.querySelector(".w");
SECTIONS.forEach(s => { if (!document.getElementById("s-" + s.id)) { const e = document.createElement("section"); e.id = "s-" + s.id; e.hidden = true; wrap.appendChild(e) } });
function show(id) {
 if (!SECTIONS.some(s => s.id === id)) id = SECTIONS[0].id;
 SECTIONS.forEach(s => { document.getElementById("s-" + s.id).hidden = s.id !== id });
 nav.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.id === id));
 try { localStorage.setItem("hub-sec", id) } catch (e) {}
 window.scrollTo(0, 0); window.dispatchEvent(new Event("hub-sec"));
}
nav.hidden = false;
nav.innerHTML = SECTIONS.map(s => `<button class="t" data-id="${s.id}">${s.label}</button>`).join("");
nav.onclick = e => { const b = e.target.closest("button"); if (b) show(b.dataset.id) };
let ini = SECTIONS[0].id; try { ini = localStorage.getItem("hub-sec") || ini } catch (e) {}
show(ini);
// Carga todas las secciones (en orden) para que se puedan enlazar entre ellas
(function carga(i) { if (i >= SECTIONS.length) return; const e = document.createElement("script"); e.src = SECTIONS[i].src; e.onload = e.onerror = () => carga(i + 1); document.body.appendChild(e) })(0);
