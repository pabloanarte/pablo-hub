// Inicio: resumen de todas las secciones.
(() => {
  const { E, today, addDays, fecha } = H, el = document.getElementById("s-inicio");
  const card = (t, ir, body, cls = "") => `<div class="card ${cls}"><h3>${t}${ir ? `<a data-go="${ir}">Veure-ho tot →</a>` : ""}</h3>${body}</div>`;
  const vacio = t => `<p class="em" style="margin:6px 0">${t}</p>`;
  const PE = { "Idea": "#8e8e93", "Desenvolupament": "#ff9f0a", "Finançament": "#af52de", "Preproducció": "#5ac8fa", "Rodatge": "#ff375f", "Postproducció": "#0a84ff", "Distribució": "#30b27a" };

  async function pintar() {
    OB = (await aj("ajust:objectius")) || {};
    const [t, r, f, p, i, c] = await Promise.all(["tarea", "reunion", "convocatoria", "proyecto", "idea"].map(x => H.col(x)).concat(H.contactos()));
    const hoy = today(), d7 = addDays(hoy, 7), d14 = addDays(hoy, 14);
    const pend = t.filter(x => !x.hecha), urg = pend.filter(x => x.fecha && x.fecha <= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const prox = pend.filter(x => x.fecha > hoy && x.fecha <= d7).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const reu = r.filter(x => (x.fecha || "") >= hoy && x.fecha <= d14).sort((a, b) => (a.fecha + (a.hora || "")).localeCompare(b.fecha + (b.hora || "")));
    const abiertas = f.filter(x => !x.estado || x.estado === "Per presentar");
    const lim = abiertas.filter(x => x.limite && x.limite >= hoy).sort((a, b) => a.limite.localeCompare(b.limite));
    const M = x => x.msgs || [], dias = s => Math.floor((Date.now() - new Date(s)) / 864e5);
    const seg = c.filter(x => x.estado === "Contactat" && M(x).length > 0 && M(x).length < 3 && dias(M(x).at(-1).d) >= 7);
    const porC = c.filter(x => !x.estado || x.estado === "Pendent").length;
    const pn = id => (p.find(x => x.id === id) || {}).titulo || "";
    const tf = x => `<div class="r"><input type="checkbox" class="ick" data-id="${x.id}"><div class="g" data-k="tarea" data-id="${x.id}"><b>${E(x.titulo || "Sense títol")}</b><small>${E([x.fecha < hoy ? "Endarrerida · " + fecha(x.fecha) : x.fecha === hoy ? "Avui" : fecha(x.fecha), pn(x.proyecto)].filter(Boolean).join(" · "))}</small></div></div>`;
    const kpi = [["Tasques per avui", urg.length, "tareas", urg.some(x => x.fecha < hoy) ? "#ff3b30" : ""], ["Reunions (14 dies)", reu.length, "reuniones"], ["Dates límit (14 dies)", lim.filter(x => x.limite <= d14).length, "festivales", lim.some(x => x.limite <= d7) ? "#ff3b30" : ""], ["Seguiments pendents", seg.length, "contactos"], ["Contactes per contactar", porC, "contactos"], ["Projectes en marxa", p.filter(x => x.estado && x.estado !== "Acabat").length, "proyectos"]];
    const vivos = p.filter(x => x.estado && x.estado !== "Acabat");

    el.innerHTML = `<div class="kpi">${kpi.map(([l, n, go, col]) => `<div data-go="${go}"><b style="${col && n ? "color:" + col : ""}">${n}</b><small>${l}</small></div>`).join("")}</div><div class="dash">` +
      card("Per avui", "tareas", (urg.length ? urg.map(tf).join("") : vacio("Res urgent avui.")) + (prox.length ? `<h2>Aquesta setmana</h2>` + prox.map(tf).join("") : "") + `<input id="inew" placeholder="Nova tasca per avui… (Retorn)" style="margin-top:10px">`) +
      card("Agenda", "reuniones", reu.length ? reu.map(x => `<div class="r" data-k="reunion" data-id="${x.id}"><i class="dot" style="background:#0a84ff"></i><div class="g"><b>${E(x.titulo || "Reunió")}</b><small>${E([fecha(x.fecha), x.hora, x.lugar, pn(x.proyecto)].filter(Boolean).join(" · "))}</small></div></div>`).join("") : vacio("Cap reunió les properes dues setmanes.")) +
      card("Dates límit", "festivales", lim.length ? lim.slice(0, 8).map(x => { const n = Math.round((new Date(x.limite) - new Date(hoy)) / 864e5); return `<div class="r" data-k="convocatoria" data-id="${x.id}"><i class="dot" style="background:${n <= 7 ? "#ff3b30" : "#ff9f0a"}"></i><div class="g"><b>${E(x.titulo || "")}</b><small>${E([x.tipo, pn(x.proyecto)].filter(Boolean).join(" · "))}</small></div><small style="white-space:nowrap;${n <= 7 ? "color:#ff3b30" : ""}">${n === 0 ? "avui" : n === 1 ? "demà" : "en " + n + " dies"}</small></div>` }).join("") : vacio("No hi ha convocatòries obertes amb data.")) +
      card("Contactes", "contactos", setmana(c) + `<div class="st" style="grid-template-columns:repeat(4,1fr)">${[["Per contactar", porC], ["Contactats", c.filter(x => M(x).length > 0 || ["Contactat", "Ha respost", "Reunió"].includes(x.estado)).length], ["Han respost", c.filter(x => x.estado === "Ha respost").length], ["Reunió", c.filter(x => x.estado === "Reunió").length]].map(([l, n]) => `<div><b>${n}</b><small>${l}</small></div>`).join("")}</div>` +
        (seg.length ? `<h2>Toca fer seguiment</h2>` + seg.slice(0, 6).map(x => `<div class="r"><i class="dot" style="background:#0a84ff"></i><div class="g" data-ct="${x.id}"><b>${E(x.nombre)}</b><small>Últim missatge fa ${dias(M(x).at(-1).d)} dies per ${E(M(x).at(-1).v || "missatge")}</small></div><button class="b2" data-seg="${x.id}">${x.email ? "Escriure" : "Copiar el missatge"}</button></div>`).join("") : "")) +
      (() => { const av = lim.map(x => [x, Math.round((new Date(x.limite) - new Date(hoy)) / 864e5)]).filter(([, n]) => n === 0 || n === 2 || n === 7); return av.length ? card("Recordatoris de terminis", "", av.map(([x, n]) => `<div class="r" data-k="convocatoria" data-id="${x.id}"><i class="dot" style="background:${n <= 2 ? "#ff3b30" : "#ff9f0a"}"></i><div class="g"><b>${E(x.titulo || "")}</b><small>${E([x.tipo, pn(x.proyecto), x.estado].filter(Boolean).join(" · "))}</small></div><small style="white-space:nowrap;color:${n <= 2 ? "#ff3b30" : "#ff9f0a"}">${n === 0 ? "acaba avui" : "queden " + n + " dies"}</small></div>`).join("")) : "" })() +
      `<div id="ifest" hidden></div><div id="iclas" hidden></div><div id="iesc" hidden></div><div id="icob" hidden></div><div id="ivig" hidden></div><div id="icop" hidden></div><div id="icor" hidden></div>` +
      card("Projectes en marxa", "proyectos", vivos.length ? vivos.map(x => `<div class="r" data-k="proyecto" data-id="${x.id}"><i class="dot" style="background:${PE[x.estado] || "#c7c7cc"}"></i><div class="g"><b>${E(x.titulo || "")}</b><small>${E([x.categoria, x.estado].filter(Boolean).join(" · "))}</small></div><small>${(n => n ? n + (n > 1 ? " tasques" : " tasca") : "")(pend.filter(y => y.proyecto === x.id).length)}</small></div>`).join("") : vacio("Afegeix els teus projectes a la secció Projectes.")) +
      card("Últimes idees", "brainstorm", i.length ? i.slice().sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).slice(0, 5).map(x => `<div class="r" data-k="idea" data-id="${x.id}"><i class="dot" style="background:#ffcc00"></i><div class="g"><b>${E(x.titulo || "")}</b><small>${E((x.texto || "").split("\n")[0].slice(0, 90))}</small></div></div>`).join("") : vacio("Apunta aquí qualsevol idea solta.")) +
      `</div>`;
    correu(c); copiaAvis(); festivals(); classes(); escriptura(); cobrar(); vigila();
  }
  const aj = async id => (await H.col("ajust")).find(x => x.id === id);
  const dilluns = d => { const x = new Date(d + "T12:00:00"); const w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); return x.toISOString().slice(0, 10) };
  let OB = {};
  // Contactes nous aquesta setmana (objectiu a Configuració, 10 per defecte)
  function setmana(c) {
    const ini = dilluns(today()), n = c.filter(x => (x.msgs || []).length && x.msgs[0].d >= ini).length, obj = +OB.contactes || 10, pc = Math.min(100, Math.round(n / obj * 100));
    return `<div style="margin:-2px 0 12px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline"><b>${n} de ${obj} contactes nous aquesta setmana</b><span class="em" style="white-space:nowrap;margin:0">${n >= obj ? "Fet ✓" : `en falten ${obj - n}`}</span></div><div class="pbar"><i style="width:${pc}%"></i></div></div>`;
  }
  const posa = (id, html) => { const b = document.getElementById(id); if (b) { if (html) b.outerHTML = html; else b.remove() } };
  // Novetats de festivals (avisos de FilmFreeway i Festhome al Gmail que encara no són al hub)
  let fcache = null;
  async function festivals() {
    if (!window.FIMP || !FIMP.pendents) return posa("ifest");
    if (fcache && Date.now() - fcache.t < 20 * 6e4 && !fcache.r) return posa("ifest");
    try {
      if (!fcache || Date.now() - fcache.t > 20 * 6e4) { fcache = { t: Date.now(), r: null }; if (window.CORREU && !(await CORREU.connectat())) return posa("ifest"); fcache.r = await FIMP.pendents(21) }
      const { n, props } = fcache.r; if (!n) return posa("ifest");
      const ps = await H.col("proyecto"), pn = id => (ps.find(x => x.id === id) || {}).titulo || "";
      posa("ifest", card("Novetats de festivals", "festivales", props.slice(0, 6).map(p => `<div class="r"><i class="dot" style="background:${p.estado === "Premiat" ? "#c9a227" : p.estado === "Seleccionat" ? "#30b27a" : p.estado === "Rebutjat" ? "#8e8e93" : "#0a84ff"}"></i><div class="g"><b>${E(p.festival)}</b><small>${E([pn(p.proyecto), p.premi || p.estado, p.ja ? "abans: " + (p.ja.estado || "") : "nou"].filter(Boolean).join(" · "))}</small></div></div>`).join("") + `<button class="b" data-fest="1" style="margin-top:10px">Revisar i aplicar ${n === 1 ? "el canvi" : `els ${n} canvis`}</button>`));
    } catch (e) { posa("ifest") }
  }
  // Classes d'avui i de demà, amb el material
  async function classes() {
    const [cs, vs] = await Promise.all([H.col("curs"), H.col("visionat")]), hoy = today(), dm = addDays(hoy, 1), l = [];
    cs.forEach(c => (c.setmanes || []).forEach(x => { if (x.data === hoy || x.data === dm) l.push({ c, x }) }));
    if (!l.length) return posa("iclas");
    l.sort((a, b) => (a.x.data + (a.x.hora || "")).localeCompare(b.x.data + (b.x.hora || "")));
    posa("iclas", card("Classes", "docencia", l.map(({ c, x }) => { const vv = (x.vis || []).map(id => vs.find(v => v.id === id)).filter(Boolean);
      return `<div class="m" style="padding:8px 0"><b>${x.data === hoy ? "Avui" : "Demà"}${x.hora ? " · " + E(x.hora) + (x.horafi ? "–" + E(x.horafi) : "") : ""} · ${E(c.titulo || "Curs")}</b>${x.tema ? `<div>${E(x.tema)}</div>` : ""}
        <div class="ls" style="margin-top:6px">${(x.arxius || []).map(a => `<a class="ln" href="/api/archivo/${E(a.id)}" target="_blank">${E(a.nombre)}</a>`).join("")}${vv.map(v => `<a class="ln" href="${E(v.url)}" target="_blank">▶ ${E(v.titulo || "Visionat")}</a>`).join("")}${!(x.arxius || []).length && !vv.length ? `<span class="em">Encara no hi ha material${x.data === dm ? " per demà" : ""}.</span>` : ""}</div>
        <div class="ls" style="margin-top:6px"><button class="b2" data-cls="${c.id}">Obrir el curs</button></div></div>` }).join("")));
  }
  // Escriptura: pàgines aquesta setmana
  async function escriptura() {
    if (!OB.escriptura) return posa("iesc");
    const p = (await H.col("proyecto")).find(x => x.id === OB.escriptura); if (!p) return posa("iesc");
    const es = (await aj("ajust:escriptura")) || { log: [] }, log = (es.log || []).filter(x => x.proj === p.id).sort((a, b) => a.d.localeCompare(b.d));
    const obj = +OB.pagines || 7, ara = log.length ? log.at(-1).p : 0;
    const base = d => { const ab = log.filter(x => x.d < d); return ab.length ? ab.at(-1).p : (log.find(x => x.d >= d) || { p: 0 }).p };
    const setm = [...Array(6)].map((_, i) => { const ini = dilluns(addDays(today(), -7 * (5 - i))), fi = addDays(ini, 7), dins = log.filter(x => x.d < fi); return Math.max(0, (dins.length ? dins.at(-1).p : 0) - base(ini)) });
    const fet = setm[5], mx = Math.max(obj, ...setm, 1);
    posa("iesc", card("Escriptura · " + E(p.titulo || ""), "", `<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline"><b>${fet} de ${obj} pàgines aquesta setmana</b><span class="em" style="white-space:nowrap;margin:0">Total: ${ara} pàg.</span></div><div class="pbar"><i style="width:${Math.min(100, Math.round(fet / obj * 100))}%"></i></div>
      <div class="sbars">${setm.map((n, i) => `<div title="${n} pàgines"><i style="height:${Math.round(n / mx * 100)}%;${n >= obj ? "background:#30b27a" : ""}"></i><small>${i === 5 ? "Ara" : "−" + (5 - i)}</small></div>`).join("")}</div>
      <div class="ls" style="margin-top:10px"><input id="iescp" type="number" min="0" placeholder="Pàgines totals que portes" style="flex:1;min-width:140px"><button class="b2" data-esc="${p.id}">Apuntar</button></div>`));
  }
  // Factures que fa 30 dies o més que esperen cobrament
  async function cobrar() {
    const fe = (await H.col("feina")).filter(x => x.estado === "Facturat" && x.facturat && addDays(x.facturat, 30) <= today()).sort((a, b) => a.facturat.localeCompare(b.facturat));
    if (!fe.length) return posa("icob");
    posa("icob", card("Per reclamar", "feines", fe.map(x => `<div class="r" data-k="feina" data-id="${x.id}"><i class="dot" style="background:#ff3b30"></i><div class="g"><b>${E(x.titulo || "")}</b><small>${E([x.productora, "factura " + (x.factura || ""), "fa " + Math.floor((Date.now() - new Date(x.facturat)) / 864e5) + " dies"].filter(Boolean).join(" · "))}</small></div></div>`).join("")));
  }
  // Convocatòries vigilades que han canviat
  async function vigila() {
    const v = await aj("ajust:vigila"), l = ((v || {}).llista || []).filter(x => x.canvi && !x.vist);
    if (!l.length) return posa("ivig");
    posa("ivig", card("Convocatòries amb novetats", "", l.map(x => `<div class="r rw"><i class="dot" style="background:#ff9f0a"></i><a class="g" href="${E(x.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><b>${E(x.nom)}</b><small>Ha canviat el ${E(fecha(x.canvi))}${x.extracte ? " · " + E(x.extracte.slice(0, 80)) + "…" : ""}</small></a><div class="acts"><button class="b2" data-vnova="${E(x.id)}">Crear convocatòria</button><button class="b2" data-vvist="${E(x.id)}">Ja ho he vist</button></div></div>`).join("")));
  }
  // Seguiment: amb correu, s'obre el missatge ja escrit a Correu; si no, es copia i s'obre el seu Instagram
  async function seguiment(id) {
    const c = (await H.contactos()).find(x => x.id === id); if (!c || !window.CONT) return;
    const em = String(c.email || "").split(/[,;\s]+/).filter(Boolean)[0];
    if (em && window.CORREU) { const t = CONT.plantilla(id, "Email"), m = t.match(/^(?:Asunto|Assumpte|Subject)\s*:\s*(.+)\n+/i); return CORREU.nou(em, m ? m[1].trim() : "Seguiment", m ? t.slice(m[0].length) : t) }
    const t = CONT.plantilla(id, "Instagram"); try { await navigator.clipboard.writeText(t); H.toast("Missatge copiat") } catch (er) { prompt("Copia el missatge:", t) }
    const ig = String(c.ig || "").replace(/^.*instagram\.com\//, "").replace(/^@/, "").replace(/[/?#].*$/, "");
    if (ig) window.open("https://instagram.com/" + ig, "_blank");
    if (confirm("Quan l'hagis enviat, el marco com a seguiment fet avui?")) CONT.registraIG(id);
  }
  // Avís si fa més de 10 dies que no hi ha còpia de seguretat
  async function copiaAvis() {
    const a = ((await H.col("ajust")).find(x => x.id === "ajust:copia") || {}), box = document.getElementById("icop"); if (!box) return;
    const d = a.ultima ? Math.floor((Date.now() - new Date(a.ultima)) / 864e5) : null;
    if (d !== null && d <= 10) return box.remove();
    box.outerHTML = `<div class="card"><h3>Còpia de seguretat</h3><p class="em" style="margin:0 0 10px">${d === null ? "Encara no has fet cap còpia de les dades del hub." : `Fa ${d} dies de l'última còpia.`}</p><div class="ls"><a class="b" href="/api/copia" download data-cop="1">Descarregar-la ara</a><button class="b2" data-ves="ajustos">Configuració</button></div></div>`;
  }
  // Correu: qui t'ha respost (correus de contactes posteriors a l'últim enviament) i no llegits
  let cache = null;
  async function correu(c) {
    const box = document.getElementById("icor"); if (!box) return; try { if (!(await H.api("GET", "correu/config")).connectat) return } catch (e) { return }
    const sp = v => String(v || "").split(/[,;\n]+/).map(x => x.trim().toLowerCase()).filter(Boolean), ems = [...new Set(c.flatMap(x => sp(x.email)))];
    try {
      if (!cache || Date.now() - cache.t > 5 * 6e4) { const [r, p] = await Promise.all([H.api("POST", "correu/resum", { correus: ems }), H.api("GET", "correu/programats")]); cache = { t: Date.now(), r, p: p.llista.length } }
      const { r, p } = cache, M = x => x.msgs || [];
      const loc = s => { const x = new Date(s); return new Date(x - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) };
      const resp = c.filter(x => M(x).length).map(x => { const ems = sp(x.email), d = ems.map(e => r.de[e]).filter(Boolean).sort().pop(), env = ems.map(e => (r.a || {})[e]).filter(Boolean).sort().pop(), ult = M(x).at(-1).d; return { x, d, env, ult } }).filter(o => o.d && loc(o.d) >= o.ult && (!o.env || o.d > o.env) && !["Ha respost", "Reunió", "Descartat"].includes(o.x.estado)).sort((a, b) => b.d.localeCompare(a.d));
      // qui t'ha respost després del teu últim missatge passa sol a «Ha respost»
      resp.forEach(o => { if (window.CONT && CONT.tots().some(y => y.id === o.x.id) && ["Pendent", "Contactat", undefined, ""].includes(o.x.estado)) { CONT.estat(o.x.id, "Ha respost"); o.auto = 1 } });
      box.outerHTML = card("Correu", "correu", `<div class="st s3">${[["No llegits", r.nollegits], ["T'han respost", resp.length], ["Programats", p]].map(([l, n]) => `<div><b>${n}</b><small>${l}</small></div>`).join("")}</div>` +
        (resp.length ? `<h2>T'han respost</h2>` + resp.slice(0, 6).map(o => `<div class="r"><i class="dot" style="background:#30b27a"></i><div class="g" data-ct="${o.x.id}"><b>${E(o.x.nombre)}</b><small>${o.auto ? "Marcat com a «Ha respost»" : E(o.x.estado || "Pendent")} · correu del ${fecha(loc(o.d))}</small></div></div>`).join("") : ""));
    } catch (e) { box.remove() }
  }
  el.addEventListener("click", async e => {
    if (e.target.closest("[data-cop]")) { setTimeout(() => H.col("ajust", true).then(() => { const b = document.querySelector("#s-inicio [data-cop]"); b && b.closest(".card").remove() }), 1500); return }
    const vs = e.target.closest("[data-ves]"); if (vs) return hubShow(vs.dataset.ves);
    const sg = e.target.closest("[data-seg]"); if (sg) return seguiment(sg.dataset.seg);
    if (e.target.closest("[data-fest]")) { fcache = null; return FIMP.revisaCorreu((await FIMP.pendents(21)).r) }
    const cl = e.target.closest("[data-cls]"); if (cl) { hubShow("docencia"); return window.DOC && DOC.curs(cl.dataset.cls) }
    const es = e.target.closest("[data-esc]"); if (es) { const v = +document.getElementById("iescp").value; if (!(v >= 0) || document.getElementById("iescp").value === "") return document.getElementById("iescp").focus(); const o = (await aj("ajust:escriptura")) || { id: "ajust:escriptura", log: [] }; o.log = (o.log || []).filter(x => !(x.proj === es.dataset.esc && x.d === today())).concat({ proj: es.dataset.esc, d: today(), p: v }); await H.put(o, 1); H.toast("Apuntat"); return }
    const vn = e.target.closest("[data-vnova],[data-vvist]"); if (vn) { const v = await aj("ajust:vigila"), x = v && v.llista.find(y => y.id === (vn.dataset.vnova || vn.dataset.vvist)); if (!x) return; x.vist = true; await H.put(v, 1);
      if (vn.dataset.vnova) { const d = { id: H.uid("convocatoria"), titulo: x.nom, tipo: "Lab / residència", estado: "Per presentar", web: x.url }; await H.put(d, 1); hubShow("festivales"); H.abrir("convocatoria", d.id) } return }
    const hr = e.target.closest("[data-hr]"); if (hr) { window.CONT && CONT.estat(hr.dataset.hr, "Ha respost"); hr.closest(".r").remove(); H.toast("Marcat com a «Ha respost»"); return }
    const ct = e.target.closest("[data-ct]"); if (ct) return window.CONT && CONT.obre(ct.dataset.ct);
    const g = e.target.closest("[data-go]"); if (g) return hubShow(g.dataset.go);
    const b = e.target.closest("[data-k]"); if (!b) return;
    b.dataset.k === "tarea" ? H.abrirTarea && H.abrirTarea(b.dataset.id) : H.abrir(b.dataset.k, b.dataset.id);
  });
  el.addEventListener("change", async e => {
    if (!e.target.classList.contains("ick")) return;
    const t = (await H.col("tarea")).find(x => x.id === e.target.dataset.id); t.hecha = true; await H.put(t, 1); H.toast("Feta");
  });
  el.addEventListener("keydown", async e => {
    if (e.target.id === "inew" && e.key === "Enter" && e.target.value.trim()) { await H.put({ id: H.uid("tarea"), titulo: e.target.value.trim(), fecha: today(), hecha: false, proyecto: "" }, 1) }
  });
  H.onChange(() => { if (!el.hidden) pintar() });
  window.addEventListener("hub-sec", e => { if (e.detail === "inicio") pintar() });
  pintar().catch(() => el.innerHTML = `<p class="em">No s'ha pogut carregar.</p>`);
})();
