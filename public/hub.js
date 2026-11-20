// Secciones del hub. Para añadir una: una línea aquí + un archivo en sections/ (la <section> se crea sola).
const I = {
 inicio: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
 tareas: "M4 4h16v16H4z M8 12l3 3 5-6",
 contactos: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4 4-6 8-6s8 2 8 6",
 reuniones: "M4 5h16v11H9l-5 4z M8 9h8 M8 12h5",
 proyectos: "M3 5h18v14H3z M7 5v14 M17 5v14 M3 9h4 M3 15h4 M17 9h4 M17 15h4",
 festivales: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z",
 brainstorm: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z",
 preproduccion: "M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5 M8 14h3",
 guiones: "M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h8",
 planes: "M3 7h18v13H3z M3 7l3-4h4l-3 4 M10 7l3-4h4l-3 4 M17 7l3-4",
 postproduccion: "M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5 M9 15l2 2 4-4",
 decks: "M3 5h14v10H3z M7 19h14V9 M6 12l3-3 3 3",
 correu: "M3 6h18v12H3z M3 7l9 6 9-6",
 web: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3.5 3.5 3.5 14.5 0 18 M12 3c-3.5 3.5-3.5 14.5 0 18"
};
const SECTIONS = [
 {id:"inicio",label:"Inici",desc:"El més important d'avui",src:"sections/inicio.js"},
 {id:"tareas",label:"Tasques",desc:"Pendents i calendari",src:"sections/tareas.js"},
 {id:"contactos",label:"Contactes",desc:"Productores, artistes i mànagers",src:"sections/contactos.js"},
 {id:"correu",label:"Correu",desc:"pablo.anarte.film@gmail.com",src:"sections/correu.js"},
 {id:"reuniones",label:"Reunions",desc:"Apunts i propers passos",src:"sections/reuniones.js"},
 {id:"proyectos",label:"Projectes",desc:"Llargs, curts, videoclips i publicitat",src:"sections/proyectos.js"},
 {id:"decks",label:"Decks",desc:"Dossiers i presentacions",src:"sections/decks.js"},
 {id:"preproduccion",label:"Preproducció",desc:"Calendari per setmanes, dies o mesos",src:"sections/preproduccion.js"},
 {id:"guiones",label:"Guions tècnics",desc:"Plans per escena, amb escales en color i imatges",src:"sections/guiones.js"},
 {id:"planes",label:"Plans de rodatge",desc:"Generats des del guió tècnic, ordenats i amb hores",src:"sections/planes.js"},
 {id:"postproduccion",label:"Postproducció",desc:"Calendari per setmanes, dies o mesos",src:"sections/postproduccion.js"},
 {id:"festivales",label:"Festivals",desc:"Festivals, labs i residències",src:"sections/festivales.js"},
 {id:"brainstorm",label:"Brainstorm",desc:"Idees soltes",src:"sections/brainstorm.js"},
 {id:"web",label:"La meva web",desc:"pabloanarte.com",src:"sections/web.js"}
];
const nav = document.getElementById("hubnav"), wrap = document.querySelector(".w");
SECTIONS.forEach(s => { if (!document.getElementById("s-" + s.id)) { const e = document.createElement("section"); e.id = "s-" + s.id; e.hidden = true; wrap.appendChild(e) } });
nav.innerHTML = SECTIONS.map(s => `<button data-id="${s.id}"><svg viewBox="0 0 24 24"><path d="${I[s.id] || I.inicio}"/></svg>${s.label}<span class="n" id="n-${s.id}" hidden></span></button>`).join("") + `<hr><button class="out" onclick="location.href='/salir'">Tancar la sessió</button><button class="out mclose" onclick="document.body.classList.remove('menu')">Tancar el menú</button>`;
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
{ const t = new Date().toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" }); document.getElementById("hdate").textContent = t[0].toUpperCase() + t.slice(1) }

// Contadores del menú
async function contar() {
 try {
  const hoy = H.today(), sem = H.addDays(hoy, 7);
  const [t, r, f, p, i, c] = await Promise.all(["tarea", "reunion", "convocatoria", "proyecto", "idea"].map(x => H.col(x)).concat(H.contactos()));
  const set = (id, n, al) => { const e = document.getElementById("n-" + id); e.hidden = !n; e.textContent = n; e.classList.toggle("al", !!al) };
  const urg = t.filter(x => !x.hecha && x.fecha && x.fecha <= hoy).length;
  set("tareas", urg || t.filter(x => !x.hecha).length, urg);
  set("reuniones", r.filter(x => (x.fecha || "") >= hoy).length);
  set("festivales", f.filter(x => (!x.estado || x.estado === "Per presentar") && x.limite && x.limite >= hoy && x.limite <= sem).length || f.filter(x => !x.estado || x.estado === "Per presentar").length, f.some(x => (!x.estado || x.estado === "Per presentar") && x.limite && x.limite >= hoy && x.limite <= sem));
  set("proyectos", p.length); set("brainstorm", i.length); set("contactos", c.length);
 } catch (e) {}
}

// Cerca global (Retorn)
document.getElementById("gq").addEventListener("keydown", async e => {
 if (e.key !== "Enter" || !e.target.value.trim()) return;
 const q = e.target.value.trim().toLowerCase(), E = H.E, txt = d => H.valors(d).toLowerCase();
 const T = [["proyecto", "Projectes"], ["reunion", "Reunions"], ["tarea", "Tasques"], ["convocatoria", "Festivals"], ["idea", "Brainstorm"], ["pre", "Preproducció"], ["post", "Postproducció"], ["gt", "Guions tècnics", "guiones"], ["pdr", "Plans de rodatge", "planes"]];
 const ls = await Promise.all(T.map(([t]) => H.col(t))), cs = await H.contactos();
 const data = (t, d) => t === "convocatoria" ? (d.limite ? "Límit " + H.fecha(d.limite) : "") : t === "pre" || t === "post" ? H.fecha(d.ini) : t === "pdr" ? (d.dias && d.dias[0] && d.dias[0].fecha ? H.fecha(d.dias[0].fecha) : "") : d.fecha ? H.fecha(d.fecha) : "";
 let h = `<h2 style="margin-top:0">Resultats de «${E(q)}»</h2>`, n = 0;
 T.forEach(([t, l], i) => { const m = ls[i].filter(d => txt(d).includes(q)); n += m.length; if (m.length) h += `<h2>${l} <span>${m.length}</span></h2>` + m.map(d => `<div class="r" data-k="gq" data-t="${t}" data-id="${d.id}"><div class="g"><b>${E(d.titulo || "Sense títol")}</b><small>${E(data(t, d))}</small></div></div>`).join("") });
 const mc = cs.filter(c => txt(c).includes(q)); n += mc.length;
 if (mc.length) h += `<h2>Contactes <span>${mc.length}</span></h2>` + mc.map(c => `<div class="r" data-k="gc" data-id="${c.id}"><div class="g"><b>${E(c.nombre)}</b><small>${E([c.persona, c.tipo, c.estado].filter(Boolean).join(" · "))}</small></div></div>`).join("");
 H.sheet(n ? h : h + `<p class="em">No s'ha trobat res.</p>`);
});
document.getElementById("hsh").addEventListener("click", e => {
 const b = e.target.closest('[data-k="gq"],[data-k="gc"]'); if (!b) return;
 H.cerrar(); const t = b.dataset.t, id = b.dataset.id;
 if (b.dataset.k === "gc") { show("contactos"); setTimeout(() => { const nb = document.querySelector('#nav [data-v="contactos"]'); nb && nb.click(); setTimeout(() => { const r = document.querySelector(`#s-contactos [data-a="o"][data-id="${id}"]`); r && r.click() }, 150) }, 50); return }
 if (t === "gt") { show("guiones"); return window.GT && GT.abrir(id) }
 if (t === "pdr") { show("planes"); return window.P && P.abrir(id) }
 if (t === "pre" || t === "post") { show(t === "pre" ? "preproduccion" : "postproduccion"); return window.CronoAbrir && CronoAbrir[t] && CronoAbrir[t](id) }
 t === "tarea" ? H.abrirTarea(id) : H.abrir(t, id);
});

let ini = SECTIONS[0].id; try { ini = localStorage.getItem("hub-sec") || ini } catch (e) {}
show(ini);
(function carga(i) { if (i >= SECTIONS.length) { contar(); H.onChange(contar); return } const e = document.createElement("script"); e.src = SECTIONS[i].src; e.onload = e.onerror = () => carga(i + 1); document.body.appendChild(e) })(0);
