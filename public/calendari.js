// Calendari de la pàgina d'inici (Avui): Google Calendar (tots els calendaris, també el que l'iPhone hi posa) + el hub.
// Google arriba pel pont de Gmail (acció «agenda», /api/correu/agenda); es desa una còpia per veure-ho sense connexió.
// El hub: tasques, reunions, rodatges, feines, classes i dates límit de festivals.
window.AG = (() => {
  const E = s => String(s ?? "").replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  let vista = "setmana", base = null, ver = 0;
  try { vista = localStorage.getItem("ag-vista") || "setmana" } catch (e) { }
  const iso = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const dia = s => new Date(s + "T12:00");
  const suma = (s, n) => { const d = dia(s); d.setDate(d.getDate() + n); return iso(d) };
  const dilluns = s => { const d = dia(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return iso(d) };
  const COL = { tasca: "#8e8e93", reunio: "#0a84ff", rodatge: "#ff375f", feina: "#ff9f0a", classe: "#30b27a", limit: "#af52de" };

  // rang visible
  function rang() {
    const avui = H.today(), b = base || avui;
    if (vista === "mes") { const d = dia(b); const p = iso(new Date(d.getFullYear(), d.getMonth(), 1, 12)), u = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12)); const de = dilluns(p); let a = suma(dilluns(u), 6); return { de, a, mes: d.getMonth() } }
    const de = dilluns(b); return { de, a: suma(de, 6) };
  }

  // ---------- esdeveniments ----------
  async function delHub(de, a) {
    const [t, r, pdr, fe, cu, cv, ps] = await Promise.all(["tarea", "reunion", "pdr", "feina", "curs", "convocatoria", "proyecto"].map(x => H.col(x).catch(() => [])));
    const pn = id => (ps.find(x => x.id === id) || {}).titulo || "", dins = d => d && d >= de && d <= a, out = [];
    t.filter(x => !x.hecha && dins(x.fecha)).forEach(x => out.push({ d: x.fecha, t: x.titulo || "Tasca", k: "tasca", o: ["tarea", x.id] }));
    r.filter(x => dins(x.fecha)).forEach(x => out.push({ d: x.fecha, h: x.hora, t: x.titulo || "Reunió", k: "reunio", lloc: x.lugar, o: ["reunion", x.id] }));
    pdr.forEach(x => (x.dias || []).forEach((d, i) => dins(d.fecha) && out.push({ d: d.fecha, h: d.citacio && d.citacio.hora || "", t: `Rodatge ${pn(x.proyecto) || x.titulo || ""} · J${i + 1}`, k: "rodatge", o: ["pdr", x.id] })));
    fe.forEach(x => { if (!x.ini) return; const f = x.fin && x.fin >= x.ini ? x.fin : x.ini; for (let d = x.ini, n = 0; d <= f && n < 60; d = suma(d, 1), n++) if (dins(d)) out.push({ d, t: `${x.rol || "Feina"}: ${x.titulo || ""}`, k: "feina", o: ["feina", x.id] }) });
    cu.forEach(x => (x.setmanes || []).forEach(s => s && dins(s.data) && out.push({ d: s.data, h: s.hora, t: `Classe: ${x.titulo || ""}`, k: "classe", lloc: x.centre, o: ["curs", x.id] })));
    cv.filter(x => (!x.estado || x.estado === "Per presentar") && dins(x.limite)).forEach(x => out.push({ d: x.limite, t: "Límit: " + (x.titulo || ""), k: "limit", o: ["convocatoria", x.id] }));
    return out;
  }
  const ck = (de, a) => "ag:" + de + ":" + a;
  async function deGoogle(de, a) {
    let g = null; try { g = JSON.parse(localStorage.getItem(ck(de, a)) || "null") } catch (e) { }
    return g;
  }
  async function refrescaGoogle(de, a) {
    const r = await H.api("GET", `correu/agenda?de=${de}&a=${a}`);
    const l = (r.ev || []).flatMap(e => { const d0 = e.ini.slice(0, 10), d1 = (e.fi || e.ini).slice(0, 10), o = []; for (let d = d0, n = 0; d <= d1 && n < 40; d = suma(d, 1), n++) o.push({ d, h: e.tot ? "" : d === d0 ? e.ini.slice(11, 16) : "", hf: !e.tot && d === d1 ? (e.fi || "").slice(11, 16) : "", t: e.t, k: "google", col: e.color, cal: e.cal, lloc: e.lloc, tot: e.tot }); return o });
    try { localStorage.setItem(ck(de, a), JSON.stringify({ l, quan: Date.now() })); Object.keys(localStorage).filter(k => k.startsWith("ag:") && k !== ck(de, a)).slice(0, -6).forEach(k => localStorage.removeItem(k)) } catch (e) { }
    return { l, quan: Date.now() };
  }

  // ---------- dibuix ----------
  async function pinta(box) {
    if (!box) return; const v = ++ver, { de, a, mes } = rang(), avui = H.today();
    const [hub, cfg] = await Promise.all([delHub(de, a), H.api("GET", "correu/config").catch(() => ({}))]);
    let g = await deGoogle(de, a); if (v !== ver) return;
    const dibuixa = (gl, estat) => {
      const tots = hub.concat(gl ? gl.l : []).sort((x, y) => (x.h || "").localeCompare(y.h || "") || (x.k === "google" ? 0 : 1) - (y.k === "google" ? 0 : 1));
      const per = {}; tots.forEach(e => (per[e.d] = per[e.d] || []).push(e));
      const dies = []; for (let d = de; d <= a; d = suma(d, 1)) dies.push(d);
      const titol = vista === "mes" ? dia(base || avui).toLocaleDateString("ca-ES", { month: "long", year: "numeric" }) : (() => { const x = dia(de), y = dia(a); return x.getMonth() === y.getMonth() ? `${x.getDate()} – ${y.toLocaleDateString("ca-ES", { day: "numeric", month: "long" })}` : `${x.toLocaleDateString("ca-ES", { day: "numeric", month: "short" })} – ${y.toLocaleDateString("ca-ES", { day: "numeric", month: "short" })}` })();
      const ev = (e, curt) => `<div class="agev ${e.k}" data-ag="ev" data-d="${e.d}" data-i="${(per[e.d] || []).indexOf(e)}" style="--c:${E(e.col || COL[e.k] || "#8e8e93")}" title="${E([e.h, e.t, e.cal].filter(Boolean).join(" · "))}">${e.h ? `<i>${E(e.h)}</i>` : ""}<span>${E(e.t)}</span></div>`;
      box.innerHTML = `<div class="card agc"><div class="agh"><h3 style="margin:0">${E(titol[0].toUpperCase() + titol.slice(1))}</h3><span style="flex:1"></span>
          <div class="seg" style="margin:0"><button class="t ${vista === "setmana" ? "on" : ""}" data-ag="vista" data-v="setmana">Setmana</button><button class="t ${vista === "mes" ? "on" : ""}" data-ag="vista" data-v="mes">Mes</button></div>
          <button class="b2 agn" data-ag="ant" aria-label="Anterior">‹</button><button class="b2" data-ag="avui">Avui</button><button class="b2 agn" data-ag="seg" aria-label="Següent">›</button></div>
        <div class="agg ${vista}">${["dl", "dt", "dc", "dj", "dv", "ds", "dg"].map(x => `<div class="agdh">${x}</div>`).join("")}
          ${dies.map(d => { const l = per[d] || [], fora = vista === "mes" && dia(d).getMonth() !== mes, max = vista === "mes" ? 3 : 8;
            return `<div class="agd ${d === avui ? "avui" : ""} ${fora ? "fora" : ""} ${d < avui ? "passat" : ""}" data-ag="dia" data-d="${d}"><b>${dia(d).getDate()}</b><em class="agwd">${["dg", "dl", "dt", "dc", "dj", "dv", "ds"][dia(d).getDay()]}</em>${l.slice(0, max).map(e => ev(e)).join("")}${l.length > max ? `<small class="agm">+${l.length - max} més</small>` : ""}</div>` }).join("")}</div>
        <div class="agpeu">${estat}</div></div>`;
    };
    const estatTxt = (gl, err) => !cfg.connectat ? `Google Calendar no està connectat: connecta el pont de Google a <a href="#" data-ag="cfg">Configuració</a> per veure-hi els teus calendaris.` : err ? `No he pogut llegir Google Calendar${gl ? ` (es veu la còpia de fa ${Math.max(1, Math.round((Date.now() - gl.quan) / 6e4))} min)` : ""}. ${err === "accio" ? "Torna a enganxar pont-gmail.gs a Apps Script i fes una implementació nova (Gestiona les implementacions → Edita → Versió nova)." : ""}` : `Google Calendar · actualitzat ${gl && Date.now() - gl.quan < 9e4 ? "ara" : gl ? "fa " + Math.round((Date.now() - gl.quan) / 6e4) + " min" : "…"}`;
    dibuixa(g, estatTxt(g));
    if (!cfg.connectat) return;
    if (g && Date.now() - g.quan < 5 * 60e3) return; // còpia recent: no cal tornar a demanar
    try { g = await refrescaGoogle(de, a); if (v === ver) dibuixa(g, estatTxt(g)) } catch (e) { if (v === ver) dibuixa(g, estatTxt(g, e && e.error || "xarxa")) }
  }

  // ---------- esdeveniments de la interfície ----------
  function connecta(root, repinta) {
    root.addEventListener("click", async e => {
      const b = e.target.closest("[data-ag]"); if (!b) return; if (b.tagName === "A") e.preventDefault();
      const k = b.dataset.ag, { de } = rang();
      if (k === "cfg") return hubShow("ajustos");
      if (k === "vista") { vista = b.dataset.v; try { localStorage.setItem("ag-vista", vista) } catch (er) { } return repinta() }
      if (k === "avui") { base = null; return repinta() }
      if (k === "ant" || k === "seg") { const s = k === "ant" ? -1 : 1, b0 = base || H.today(); if (vista === "mes") { const d = dia(b0); base = iso(new Date(d.getFullYear(), d.getMonth() + s, 1, 12)) } else base = suma(de, 7 * s); return repinta() }
      if (k === "ev") { e.stopPropagation(); return obreDia(b.dataset.d, +b.dataset.i) }
      if (k === "dia") return obreDia(b.dataset.d);
    });
  }
  async function obreDia(d, i) {
    const { de, a } = rang(), hub = (await delHub(d, d)), g = await deGoogle(de, a), l = hub.concat(g ? g.l.filter(x => x.d === d) : []).sort((x, y) => (x.h || "").localeCompare(y.h || ""));
    H.sheet(`<h2 style="margin-top:0;font-size:22px;color:var(--ink);text-transform:none;letter-spacing:0">${E(H.fecha(d, 1))}</h2>
      ${l.length ? l.map((x, j) => `<div class="r" ${x.o ? `data-ago="${x.o[0]}" data-id="${x.o[1]}"` : ""}><i class="dot" style="background:${E(x.col || COL[x.k] || "#8e8e93")}"></i><div class="g"><b>${E(x.t)}</b><small>${E([x.h ? x.h + (x.hf ? "–" + x.hf : "") : x.tot ? "Tot el dia" : "", x.lloc, x.cal || { tasca: "Tasca", reunio: "Reunió", rodatge: "Rodatge", feina: "Feina", classe: "Classe", limit: "Festival" }[x.k]].filter(Boolean).join(" · "))}</small></div></div>`).join("") : `<p class="em">Res aquest dia.</p>`}
      <label>Tasca per aquest dia</label><div class="row"><input id="agt" placeholder="Què has de fer?"><button class="b" data-agk="tasca">Afegir</button></div>`, () => { const b = document.getElementById("hshc"); b.onclick = b.onkeydown = null });
    const box = document.getElementById("hshc");
    box.onclick = async e => {
      const r = e.target.closest("[data-ago]"); if (r) { box.onclick = null; H.cerrar(); const [t, id] = [r.dataset.ago, r.dataset.id]; if (t === "tarea") return H.abrirTarea(id); if (t === "pdr") { hubShow("planes", { proj: "" }); return window.P && P.abrir(id) } if (t === "curs") { hubShow("docencia"); return window.DOC && DOC.curs(id) } return H.abrir(t, id) }
      if (e.target.closest('[data-agk="tasca"]')) { const t = document.getElementById("agt").value.trim(); if (!t) return document.getElementById("agt").focus(); await H.nuevaTarea(t, d); box.onclick = null; H.cerrar(); H.toast("Tasca afegida") }
    };
    box.onkeydown = e => { if (e.target.id === "agt" && e.key === "Enter") box.querySelector('[data-agk="tasca"]').click() };
  }
  return { pinta, connecta };
})();
