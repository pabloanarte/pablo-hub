// Secciones del hub. Para añadir una: una línea aquí + un archivo en sections/ (la <section> se crea sola).
const I = {
 inicio: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
 tareas: "M4 4h16v16H4z M8 12l3 3 5-6",
 contactos: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4 4-6 8-6s8 2 8 6",
 reuniones: "M4 5h16v11H9l-5 4z M8 9h8 M8 12h5",
 proyectos: "M3 5h18v14H3z M7 5v14 M17 5v14 M3 9h4 M3 15h4 M17 9h4 M17 15h4",
 festivales: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z",
 brainstorm: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z",
 web: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3.5 3.5 3.5 14.5 0 18 M12 3c-3.5 3.5-3.5 14.5 0 18"
};
const SECTIONS = [
 {id:"inicio",label:"Inicio",desc:"Lo importante de hoy",src:"sections/inicio.js"},
 {id:"tareas",label:"Tareas",desc:"Pendientes y calendario",src:"sections/tareas.js"},
 {id:"contactos",label:"Contactos",desc:"Productoras, artistas y managers",src:"sections/contactos.js"},
 {id:"reuniones",label:"Reuniones",desc:"Apuntes y próximos pasos",src:"sections/reuniones.js"},
 {id:"proyectos",label:"Proyectos",desc:"Largos, cortos, videoclips y publicidad",src:"sections/proyectos.js"},
 {id:"festivales",label:"Festivales",desc:"Festivales, labs y residencias",src:"sections/festivales.js"},
 {id:"brainstorm",label:"Brainstorm",desc:"Ideas sueltas",src:"sections/brainstorm.js"},
 {id:"web",label:"Mi web",desc:"pabloanarte.com",src:"sections/web.js"}
];
const nav = document.getElementById("hubnav"), wrap = document.querySelector(".w");
SECTIONS.forEach(s => { if (!document.getElementById("s-" + s.id)) { const e = document.createElement("section"); e.id = "s-" + s.id; e.hidden = true; wrap.appendChild(e) } });
nav.innerHTML = SECTIONS.map(s => `<button data-id="${s.id}"><svg viewBox="0 0 24 24"><path d="${I[s.id] || I.inicio}"/></svg>${s.label}<span class="n" id="n-${s.id}" hidden></span></button>`).join("") + `<hr><button class="out" onclick="location.href='/salir'">Cerrar sesión</button>`;
function show(id) {
 if (!SECTIONS.some(s => s.id === id)) id = SECTIONS[0].id;
 const s = SECTIONS.find(x => x.id === id);
 SECTIONS.forEach(x => { document.getElementById("s-" + x.id).hidden = x.id !== id });
 nav.querySelectorAll("button[data-id]").forEach(b => b.classList.toggle("on", b.dataset.id === id));
 document.getElementById("stitle").textContent = s.label; document.getElementById("sdesc").textContent = s.desc;
 try { localStorage.setItem("hub-sec", id) } catch (e) {}
 document.body.classList.remove("menu"); window.scrollTo(0, 0); window.dispatchEvent(new CustomEvent("hub-sec", { detail: id }));
}
window.hubShow = show;
nav.onclick = e => { const b = e.target.closest("button[data-id]"); if (b) show(b.dataset.id) };
document.querySelector(".logo").onclick = () => show("inicio");
document.getElementById("mb").onclick = () => document.body.classList.toggle("menu");
document.body.addEventListener("click", e => { if (document.body.classList.contains("menu") && !e.target.closest(".side,#mb")) document.body.classList.remove("menu") });
{ const t = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }); document.getElementById("hdate").textContent = t[0].toUpperCase() + t.slice(1) }

// Contadores del menú
async function contar() {
 try {
  const hoy = H.today(), sem = H.addDays(hoy, 7);
  const [t, r, f, p, i, c] = await Promise.all(["tarea", "reunion", "convocatoria", "proyecto", "idea"].map(x => H.col(x)).concat(H.contactos()));
  const set = (id, n, al) => { const e = document.getElementById("n-" + id); e.hidden = !n; e.textContent = n; e.classList.toggle("al", !!al) };
  const urg = t.filter(x => !x.hecha && x.fecha && x.fecha <= hoy).length;
  set("tareas", urg || t.filter(x => !x.hecha).length, urg);
  set("reuniones", r.filter(x => (x.fecha || "") >= hoy).length);
  set("festivales", f.filter(x => (!x.estado || x.estado === "Por presentar") && x.limite && x.limite >= hoy && x.limite <= sem).length || f.filter(x => !x.estado || x.estado === "Por presentar").length, f.some(x => (!x.estado || x.estado === "Por presentar") && x.limite && x.limite >= hoy && x.limite <= sem));
  set("proyectos", p.length); set("brainstorm", i.length); set("contactos", c.length);
 } catch (e) {}
}

// Búsqueda global
document.getElementById("gq").addEventListener("keydown", async e => {
 if (e.key !== "Enter" || !e.target.value.trim()) return;
 const q = e.target.value.trim().toLowerCase(), E = H.E;
 const T = [["proyecto", "Proyectos"], ["reunion", "Reuniones"], ["tarea", "Tareas"], ["convocatoria", "Festivales"], ["idea", "Brainstorm"]];
 const ls = await Promise.all(T.map(([t]) => H.col(t))), cs = await H.contactos();
 let h = `<h2 style="margin-top:0">Resultados de «${E(q)}»</h2>`, n = 0;
 T.forEach(([t, l], i) => { const m = ls[i].filter(d => JSON.stringify(d).toLowerCase().includes(q)); n += m.length; if (m.length) h += `<h2>${l} <span>${m.length}</span></h2>` + m.map(d => `<div class="r" data-k="gq" data-t="${t}" data-id="${d.id}"><div class="g"><b>${E(d.titulo || "Sin título")}</b><small>${E(d.fecha ? H.fecha(d.fecha) : "")}</small></div></div>`).join("") });
 const mc = cs.filter(c => JSON.stringify(c).toLowerCase().includes(q)); n += mc.length;
 if (mc.length) h += `<h2>Contactos <span>${mc.length}</span></h2>` + mc.map(c => `<div class="r" data-k="gc"><div class="g"><b>${E(c.nombre)}</b><small>${E([c.persona, c.tipo, c.estado].filter(Boolean).join(" · "))}</small></div></div>`).join("");
 H.sheet(n ? h : h + `<p class="em">Nada encontrado.</p>`);
});
document.getElementById("hsh").addEventListener("click", e => {
 const b = e.target.closest('[data-k="gq"],[data-k="gc"]'); if (!b) return;
 H.cerrar(); if (b.dataset.k === "gc") return show("contactos");
 b.dataset.t === "tarea" ? H.abrirTarea(b.dataset.id) : H.abrir(b.dataset.t, b.dataset.id);
});

let ini = SECTIONS[0].id; try { ini = localStorage.getItem("hub-sec") || ini } catch (e) {}
show(ini);
(function carga(i) { if (i >= SECTIONS.length) { contar(); H.onChange(contar); return } const e = document.createElement("script"); e.src = SECTIONS[i].src; e.onload = e.onerror = () => carga(i + 1); document.body.appendChild(e) })(0);
