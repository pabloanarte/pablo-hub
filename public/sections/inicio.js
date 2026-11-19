// Inicio: resumen de todas las secciones.
(() => {
  const { E, today, addDays, fecha } = H, el = document.getElementById("s-inicio");
  const card = (t, ir, body, cls = "") => `<div class="card ${cls}"><h3>${t}${ir ? `<a data-go="${ir}">Veure-ho tot →</a>` : ""}</h3>${body}</div>`;
  const vacio = t => `<p class="em" style="margin:6px 0">${t}</p>`;
  const PE = { "Idea": "#8e8e93", "Desenvolupament": "#ff9f0a", "Finançament": "#af52de", "Preproducció": "#5ac8fa", "Rodatge": "#ff375f", "Postproducció": "#0a84ff", "Distribució": "#30b27a" };

  async function pintar() {
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
    const kpi = [["Tasques per avui", urg.length, "tareas", urg.some(x => x.fecha < hoy) ? "#ff3b30" : ""], ["Reunions (14 dies)", reu.length, "reuniones"], ["Dates límit (14 dies)", lim.filter(x => x.limite <= d14).length, "festivales", lim.some(x => x.limite <= d7) ? "#ff3b30" : ""], ["Seguiments pendents", seg.length, "contactos"], ["Contactes per contactar", porC, "contactos"], ["Projectes en marxa", p.filter(x => x.estado !== "Acabat").length, "proyectos"]];
    const vivos = p.filter(x => x.estado && x.estado !== "Acabat");

    el.innerHTML = `<div class="kpi">${kpi.map(([l, n, go, col]) => `<div data-go="${go}"><b style="${col && n ? "color:" + col : ""}">${n}</b><small>${l}</small></div>`).join("")}</div><div class="dash">` +
      card("Per avui", "tareas", (urg.length ? urg.map(tf).join("") : vacio("Res urgent avui.")) + (prox.length ? `<h2>Aquesta setmana</h2>` + prox.map(tf).join("") : "") + `<input id="inew" placeholder="Nova tasca per avui… (Retorn)" style="margin-top:10px">`) +
      card("Agenda", "reuniones", reu.length ? reu.map(x => `<div class="r" data-k="reunion" data-id="${x.id}"><i class="dot" style="background:#0a84ff"></i><div class="g"><b>${E(x.titulo || "Reunió")}</b><small>${E([fecha(x.fecha), x.hora, x.lugar, pn(x.proyecto)].filter(Boolean).join(" · "))}</small></div></div>`).join("") : vacio("Cap reunió les properes dues setmanes.")) +
      card("Dates límit", "festivales", lim.length ? lim.slice(0, 8).map(x => { const n = Math.round((new Date(x.limite) - new Date(hoy)) / 864e5); return `<div class="r" data-k="convocatoria" data-id="${x.id}"><i class="dot" style="background:${n <= 7 ? "#ff3b30" : "#ff9f0a"}"></i><div class="g"><b>${E(x.titulo || "")}</b><small>${E([x.tipo, pn(x.proyecto)].filter(Boolean).join(" · "))}</small></div><small style="white-space:nowrap;${n <= 7 ? "color:#ff3b30" : ""}">${n === 0 ? "hoy" : n === 1 ? "mañana" : "en " + n + " dies"}</small></div>` }).join("") : vacio("No hi ha convocatòries obertes amb data.")) +
      card("Contactes", "contactos", `<div class="st" style="grid-template-columns:repeat(4,1fr)">${[["Per contactar", porC], ["Contactats", c.filter(x => x.estado === "Contactat").length], ["Han respost", c.filter(x => x.estado === "Ha respost").length], ["Reunió", c.filter(x => x.estado === "Reunió").length]].map(([l, n]) => `<div><b>${n}</b><small>${l}</small></div>`).join("")}</div>` +
        (seg.length ? `<h2>Toca fer seguiment</h2>` + seg.slice(0, 6).map(x => `<div class="r" data-go="contactos"><i class="dot" style="background:#0a84ff"></i><div class="g"><b>${E(x.nombre)}</b><small>Últim missatge fa ${dias(M(x).at(-1).d)} dies</small></div></div>`).join("") : "")) +
      card("Projectes en marxa", "proyectos", vivos.length ? vivos.map(x => `<div class="r" data-k="proyecto" data-id="${x.id}"><i class="dot" style="background:${PE[x.estado] || "#c7c7cc"}"></i><div class="g"><b>${E(x.titulo || "")}</b><small>${E([x.categoria, x.estado].filter(Boolean).join(" · "))}</small></div><small>${(n => n ? n + (n > 1 ? " tasques" : " tasca") : "")(pend.filter(y => y.proyecto === x.id).length)}</small></div>`).join("") : vacio("Afegeix els teus projectes a la secció Projectes.")) +
      card("Últimes idees", "brainstorm", i.length ? i.slice().sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).slice(0, 5).map(x => `<div class="r" data-k="idea" data-id="${x.id}"><i class="dot" style="background:#ffcc00"></i><div class="g"><b>${E(x.titulo || "")}</b><small>${E((x.texto || "").split("\n")[0].slice(0, 90))}</small></div></div>`).join("") : vacio("Apunta aquí qualsevol idea solta.")) +
      `</div>`;
  }
  el.addEventListener("click", e => {
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
