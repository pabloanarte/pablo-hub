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
 persones: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5 M16 4.5a3 3 0 0 1 0 6 M18 14.5c2 .6 3.5 2.3 3.5 5.5",
 desenvolupament: "M4 20l4-1 11-11-3-3L5 16z M14 7l3 3",
 desglossament: "M5 3h10l4 4v14H5z M8 9h3 M8 13h8 M8 17h8 M14 9h2",
 docencia: "M2 8l10-4 10 4-10 4z M6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5 M22 8v6",
 feines: "M3 8h18v12H3z M8 8V5h8v3 M3 13h18",
 ajustos: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1",
 web: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3.5 3.5 3.5 14.5 0 18 M12 3c-3.5 3.5-3.5 14.5 0 18"
};
// Seccions internes (cada una pinta la seva <section>). El menú no les mostra totes: les agrupa a GRUPS.
const SECTIONS = [
 {id:"inicio",label:"Avui",desc:"El que toca avui",src:"sections/inicio.js"},
 {id:"tareas",label:"Agenda",desc:"Tasques, calendari i reunions",src:"sections/tareas.js"},
 {id:"reuniones",label:"Agenda",desc:"Tasques, calendari i reunions",src:"sections/reuniones.js"},
 {id:"contactos",label:"Gent",desc:"Contactes, equip i repartiment",src:"sections/contactos.js"},
 {id:"persones",label:"Gent",desc:"Contactes, equip i repartiment",src:"sections/persones.js"},
 {id:"correu",label:"Correu",desc:"pablo.anarte.film@gmail.com",src:"sections/correu.js"},
 {id:"proyectos",label:"Projectes",desc:"Llargs, curts, videoclips i publicitat",src:"sections/proyectos.js"},
 {id:"projecte",label:"Projecte",desc:"",src:"sections/projecte.js"},
 {id:"decks",label:"Dossiers",desc:"Dossiers i presentacions",src:"sections/decks.js"},
 {id:"desenvolupament",label:"Desenvolupament",desc:"Versions, lectures i convocatòries",src:"sections/desenvolupament.js"},
 {id:"preproduccion",label:"Preproducció",desc:"Calendari per setmanes, dies o mesos",src:"sections/preproduccion.js"},
 {id:"desglossament",label:"Desglossament",desc:"Del guió en PDF a escenes, sets i personatges",src:"sections/desglossament.js"},
 {id:"guiones",label:"Guions tècnics",desc:"Plans per escena, amb escales en color i imatges",src:"sections/guiones.js"},
 {id:"storyboard",label:"Storyboard",desc:"Vinyetes dibuixades, fotos i vídeos, i l'animàtic amb el guió",src:"sections/storyboard.js"},
 {id:"planes",label:"Plans de rodatge",desc:"Generats des del guió tècnic, ordenats i amb hores",src:"sections/planes.js"},
 {id:"postproduccion",label:"Postproducció",desc:"Calendari per setmanes, dies o mesos",src:"sections/postproduccion.js"},
 {id:"festivales",label:"Festivals",desc:"Festivals, labs i residències",src:"sections/festivales.js"},
 {id:"docencia",label:"Docència",desc:"Cursos, sessions i visionats per exercici",src:"sections/docencia.js"},
 {id:"feines",label:"Diners",desc:"Feines, factures i cobraments",src:"sections/feines.js"},
 {id:"brainstorm",label:"Idees",desc:"Idees soltes",src:"sections/brainstorm.js"},
 {id:"web",label:"pabloanarte.com",desc:"La meva web",src:"sections/web.js"},
 {id:"ajustos",label:"Configuració",desc:"Còpia, calendari, dreceres, resum diari, objectius i factures",src:"sections/ajustos.js"}
];
// Menú: 7 apartats (+ web i configuració a baix). Les pestanyes de cada apartat són seccions internes.
const GRUPS = [
 {id:"avui",label:"Avui",ic:"inicio",tabs:[["inicio","Avui"]]},
 {id:"agenda",label:"Agenda",ic:"tareas",tabs:[["tareas","Tasques i calendari"],["reuniones","Reunions"]]},
 {id:"gent",label:"Gent",ic:"contactos",tabs:[["contactos","Contactes"],["persones","Equip i repartiment"]]},
 {id:"projectes",label:"Projectes",ic:"proyectos",tabs:[["proyectos","Projectes"],["festivales","Festivals"],["decks","Dossiers"],["brainstorm","Idees"]]},
 {id:"correu",label:"Correu",ic:"correu",tabs:[["correu","Correu"]]},
 {id:"docencia",label:"Docència",ic:"docencia",tabs:[["docencia","Docència"]]},
 {id:"diners",label:"Diners",ic:"feines",tabs:[["feines","Feines i factures"]]},
 {sep:1},
 {id:"web",label:"pabloanarte.com",ic:"web",tabs:[["web","pabloanarte.com"]]},
 {id:"ajustos",label:"Configuració",ic:"ajustos",tabs:[["ajustos","Configuració"]]}
];
// Dins d'un projecte: pestanyes amb només el que és d'aquell projecte
const PTABS = [["resum","Resum"],["desenvolupament","Desenvolupament"],["decks","Dossiers"],["preproduccion","Preproducció"],["guio","Guió i pla"],["postproduccion","Postproducció"],["festivales","Festivals"],["equip","Equip"],["arxius","Arxius"]];
const GUIO = [["desglossament","Desglossament"],["guiones","Guió tècnic"],["storyboard","Storyboard"],["planes","Pla de rodatge"]];
const nav = document.getElementById("hubnav"), wrap = document.querySelector(".w"), sub = document.getElementById("subnav");
SECTIONS.forEach(s => { if (!document.getElementById("s-" + s.id)) { const e = document.createElement("section"); e.id = "s-" + s.id; e.hidden = true; wrap.appendChild(e) } });
nav.innerHTML = GRUPS.map(g => g.sep ? "<hr>" : `<button data-g="${g.id}"><svg viewBox="0 0 24 24"><path d="${I[g.ic] || I.inicio}"/></svg>${g.label}<span class="n" id="n-${g.id}" hidden></span></button>`).join("") + `<hr><button class="out" onclick="location.href='/salir'">Tancar la sessió</button>`;

// Estat: secció visible, projecte obert (P) i pestanya del projecte (PT)
let ACT = "inicio", P = "", PT = "resum", PNOM = "";
window.HUBP = () => P;
const grupDe = id => { if (P && id !== "inicio" && !GRUPS.some(g => g.id !== "projectes" && g.tabs && g.tabs.some(t => t[0] === id))) return "projectes"; const g = GRUPS.find(g => g.tabs && g.tabs.some(t => t[0] === id)); return g ? g.id : "projectes" };
async function pintaSub() {
 const g = grupDe(ACT), E = H.E;
 if (g === "projectes" && P) {
  const ps = await H.col("proyecto"), p = ps.find(x => x.id === P);
  PNOM = P === "-" ? "Sense projecte" : (p && p.titulo) || "Sense títol";
  document.getElementById("stitle").textContent = PNOM;
  document.getElementById("sdesc").textContent = p ? [p.categoria, H.rols(p).join(", "), p.estado].filter(Boolean).join(" · ") : "Documents que no són de cap projecte";
  sub.innerHTML = `<div class="ls" style="margin-bottom:12px"><button class="b2" data-go="tanca">← Projectes</button></div><div class="tabs ptabs">${PTABS.filter(t => P !== "-" || !["resum", "equip", "arxius", "desenvolupament"].includes(t[0])).map(t => `<button class="t ${PT === t[0] ? "on" : ""}" data-pt="${t[0]}">${t[1]}</button>`).join("")}</div>` +
   (PT === "guio" ? `<div class="seg" style="margin:0 0 14px">${GUIO.map(t => `<button class="t ${ACT === t[0] ? "on" : ""}" data-sec="${t[0]}">${t[1]}</button>`).join("")}</div>` : "");
  { const on = sub.querySelector(".ptabs .on"); if (on) { const t = on.parentElement; t.scrollLeft = on.offsetLeft - (t.clientWidth - on.offsetWidth) / 2 } }
  sub.hidden = false; return;
 }
 const gr = GRUPS.find(x => x.id === g) || GRUPS[0];
 sub.innerHTML = gr.tabs.length > 1 ? `<div class="seg" style="margin:0 0 16px">${gr.tabs.map(t => `<button class="t ${ACT === t[0] ? "on" : ""}" data-sec="${t[0]}">${t[1]}</button>`).join("")}</div>` : "";
 sub.hidden = !sub.innerHTML;
}
function show(id, o) {
 o = o || {};
 if (!SECTIONS.some(s => s.id === id)) id = "inicio";
 if (o.proj !== undefined) P = o.proj;
 else if (!o.dins && !(P && GUIO.some(t => t[0] === id))) P = ""; // anar a qualsevol altra part del hub tanca el projecte obert (dins de «Guió i pla» s'hi queda)
 ACT = id;
 const s = SECTIONS.find(x => x.id === id);
 SECTIONS.forEach(x => { document.getElementById("s-" + x.id).hidden = x.id !== id });
 const g = grupDe(id);
 nav.querySelectorAll("button[data-g]").forEach(b => b.classList.toggle("on", b.dataset.g === g));
 document.querySelectorAll(".bbar [data-g]").forEach(b => b.classList.toggle("on", b.dataset.g === g));
 document.getElementById("stitle").textContent = s.label; document.getElementById("sdesc").textContent = s.desc;
 try { localStorage.setItem("hub-sec", id); localStorage.setItem("hub-proj", P); localStorage.setItem("hub-pt", PT) } catch (e) {}
 document.body.classList.remove("menu"); window.scrollTo(0, 0);
 pintaSub();
 if (o.refresca !== false) H.refresca && H.refresca();
 window.dispatchEvent(new CustomEvent("hub-sec", { detail: id }));
}
// obrir un projecte (des del seu pòster) i canviar de pestanya
const SEC_PT = { resum: "projecte", equip: "projecte", arxius: "projecte", guio: "desglossament" };
function obreProjecte(id, pt) { P = id; PT = pt || "resum"; show(SEC_PT[PT] || PT, { proj: id, dins: true }) }
window.HUB = { obreProjecte, mode: () => PT, show };
window.hubShow = (id, o) => show(id, o || {});
nav.onclick = e => { const b = e.target.closest("button[data-g]"); if (!b) return; const g = GRUPS.find(x => x.id === b.dataset.g); P = ""; show(g.tabs[0][0]) };
sub.onclick = e => {
 const b = e.target.closest("[data-sec],[data-pt],[data-go]"); if (!b) return;
 if (b.dataset.go === "tanca") { P = ""; return show("proyectos") }
 if (b.dataset.pt) { PT = b.dataset.pt; return show(SEC_PT[PT] || PT, { dins: true }) }
 if (b.dataset.sec) show(b.dataset.sec, { dins: !!P });
};
document.querySelector(".logo").onclick = () => { P = ""; show("inicio") };
document.getElementById("mb").onclick = () => document.body.classList.toggle("menu");
document.body.addEventListener("click", e => { if (document.body.classList.contains("menu") && !e.target.closest(".side,#mb,.bbar")) document.body.classList.remove("menu") });
{ const t = new Date().toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" }); document.getElementById("hdate").textContent = t[0].toUpperCase() + t.slice(1) }

// Barra inferior (mòbil) i botó + per apuntar ràpid
{
 const bb = document.createElement("nav"); bb.className = "bbar";
 bb.innerHTML = [["avui", "inicio", "Avui"], ["agenda", "tareas", "Agenda"], ["projectes", "proyectos", "Projectes"], ["gent", "contactos", "Gent"]].map(([g, ic, l]) => `<button data-g="${g}"><svg viewBox="0 0 24 24"><path d="${I[ic]}"/></svg><span>${l}</span></button>`).join("") + `<button data-g="mes"><svg viewBox="0 0 24 24"><path d="M5 12h.01 M12 12h.01 M19 12h.01"/></svg><span>Més</span></button>`;
 document.body.appendChild(bb);
 bb.onclick = e => { const b = e.target.closest("[data-g]"); if (!b) return; if (b.dataset.g === "mes") return document.body.classList.toggle("menu"); const g = GRUPS.find(x => x.id === b.dataset.g); P = ""; show(g.tabs[0][0]) };
 const fab = document.createElement("button"); fab.className = "fab"; fab.title = "Apuntar ràpid"; fab.textContent = "+"; document.body.appendChild(fab);
 const OPS = [["tasca", "Tasca"], ["reunio", "Reunió"], ["contacte", "Contacte"], ["idea", "Idea"], ["feina", "Feina"], ["visionat", "Visionat"]];
 fab.onclick = () => H.sheet(`<h3 style="font-size:22px;margin:4px 0 14px">Apuntar ràpid</h3><div class="qadd">${OPS.map(([k, l]) => `<button class="b2" data-qa="${k}">${l}</button>`).join("")}</div>
  <div id="qaf" hidden style="margin-top:16px"><label>Tasca</label><input id="qat" placeholder="Què has de fer?"><label>Data (opcional)</label><input id="qad" type="date"><button class="b" data-qa="desa" style="margin-top:12px;width:100%">Afegir la tasca</button></div>`);
 document.getElementById("hsh").addEventListener("click", async e => {
  const b = e.target.closest("[data-qa]"); if (!b) return; const k = b.dataset.qa;
  if (k === "tasca") { document.getElementById("qaf").hidden = false; return document.getElementById("qat").focus() }
  if (k === "desa") { const t = document.getElementById("qat").value.trim(); if (!t) return document.getElementById("qat").focus(); await H.nuevaTarea(t, document.getElementById("qad").value); H.cerrar(); return H.toast("Tasca afegida") }
  H.cerrar(); P = "";
  if (k === "reunio") { show("reuniones"); return H.nou && H.nou("reunion") }
  if (k === "idea") { show("brainstorm"); return H.nou && H.nou("idea") }
  if (k === "feina") { show("feines"); return H.nou && H.nou("feina") }
  if (k === "visionat") { show("docencia"); return window.DOC && DOC.nouVis && DOC.nouVis() }
  if (k === "contacte") { show("contactos"); setTimeout(() => { const nb = document.querySelector('#nav [data-v="contactos"]'); nb && nb.click(); setTimeout(() => { const a = document.querySelector('#s-contactos [data-a="new"]'); a && a.click() }, 150) }, 50) }
 });
 document.getElementById("hsh").addEventListener("keydown", async e => { if (e.target.id === "qat" && e.key === "Enter") document.querySelector('[data-qa="desa"]').click() });
}

// Contadores del menú
async function contar() {
 try {
  const hoy = H.today(), sem = H.addDays(hoy, 7);
  const [t, r, f, p, i, c, fe] = await Promise.all(["tarea", "reunion", "convocatoria", "proyecto", "idea"].map(x => H.col(x)).concat(H.contactos(), H.col("feina")));
  const set = (id, n, al) => { const e = document.getElementById("n-" + id); if (!e) return; e.hidden = !n; e.textContent = n; e.classList.toggle("al", !!al) };
  const urg = t.filter(x => !x.hecha && x.fecha && x.fecha <= hoy).length;
  set("agenda", urg || t.filter(x => !x.hecha && x.fecha === hoy).length + r.filter(x => x.fecha === hoy).length, urg);
  const fu = f.filter(x => (!x.estado || x.estado === "Per presentar") && x.limite && x.limite >= hoy && x.limite <= sem).length;
  set("projectes", fu, fu);
  const cob = fe.filter(x => x.estado === "Facturat" && x.facturat && H.addDays(x.facturat, 30) <= hoy).length;
  set("diners", cob || fe.filter(x => ["Fet", "Facturat"].includes(x.estado)).length, cob);
 } catch (e) {}
}

// Cerca global (Retorn)
document.getElementById("gq").addEventListener("keydown", async e => {
 if (e.key !== "Enter" || !e.target.value.trim()) return;
 const q = e.target.value.trim().toLowerCase(), E = H.E, txt = d => H.valors(d).toLowerCase();
 const T = [["proyecto", "Projectes"], ["reunion", "Reunions"], ["tarea", "Tasques"], ["convocatoria", "Festivals"], ["idea", "Idees"], ["pre", "Preproducció"], ["post", "Postproducció"], ["gt", "Guions tècnics", "guiones"], ["sb", "Storyboards", "storyboard"], ["pdr", "Plans de rodatge", "planes"], ["persona", "Equip i repartiment"], ["feina", "Diners"], ["desg", "Desglossament", "desglossament"], ["curs", "Cursos"], ["visionat", "Visionats"]];
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
 if (t === "gt") { show("guiones", { proj: "" }); return window.GT && GT.abrir(id) }
 if (t === "pdr") { show("planes", { proj: "" }); return window.P && P.abrir(id) }
 if (t === "curs" || t === "visionat") { show("docencia"); return window.DOC && (t === "curs" ? DOC.curs(id) : DOC.vis(id)) }
 if (t === "sb") { show("storyboard", { proj: "" }); return window.SB && SB.obre(id) }
 if (t === "desg") { show("desglossament", { proj: "" }); return window.DESG && DESG.obre(id) }
 if (t === "pre" || t === "post") { show(t === "pre" ? "preproduccion" : "postproduccion"); return window.CronoAbrir && CronoAbrir[t] && CronoAbrir[t](id) }
 t === "tarea" ? H.abrirTarea(id) : H.abrir(t, id);
});

let ini = "inicio", iniP = "", iniPT = "resum"; try { ini = localStorage.getItem("hub-sec") || ini; iniP = localStorage.getItem("hub-proj") || ""; iniPT = localStorage.getItem("hub-pt") || "resum" } catch (e) {}
if (iniP) { P = iniP; PT = iniPT; show(ini, { proj: iniP, dins: true, refresca: false }) } else show(ini, { refresca: false });
(function carga(i) { if (i >= SECTIONS.length) { contar(); H.onChange(contar); return } const e = document.createElement("script"); e.src = SECTIONS[i].src; e.onload = e.onerror = () => carga(i + 1); document.body.appendChild(e) })(0);
