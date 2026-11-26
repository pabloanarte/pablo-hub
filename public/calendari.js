// Calendari de la pàgina d'inici (Avui), amb l'aspecte del Calendari d'Apple (vista de mes):
// títol gran, una línia entre setmanes, avui en un cercle vermell, esdeveniments de diversos dies com a barra
// i la resta com a pastilles amb el color del calendari. Clar i fosc amb les variables del hub.
// Fonts: Google Calendar (tots els calendaris visibles, també el de l'iPhone) pel pont de Gmail (acció «agenda»,
// /api/correu/agenda; còpia a localStorage «ag2:» per veure-ho sense connexió) i el hub (tasques, reunions,
// rodatges, feines, classes i dates límit de festivals).
window.AG = (() => {
  const E = s => String(s ?? "").replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  let vista = "mes", base = null, ver = 0;
  try { vista = localStorage.getItem("ag-vista2") || "mes" } catch (e) { }
  const iso = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const dia = s => new Date(s + "T12:00");
  const suma = (s, n) => { const d = dia(s); d.setDate(d.getDate() + n); return iso(d) };
  const dilluns = s => { const d = dia(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return iso(d) };
  const dies = (a, b) => Math.round((dia(b) - dia(a)) / 864e5);
  const COL = { tasca: "#8e8e93", reunio: "#0a84ff", rodatge: "#ff375f", feina: "#ff9f0a", classe: "#30b27a", limit: "#bf5af2" };
  const NOMK = { tasca: "Tasca", reunio: "Reunió", rodatge: "Rodatge", feina: "Feina", classe: "Classe", limit: "Festival" };
  const MESOS = ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"];

  function rang() {
    const b = base || H.today(), d = dia(b);
    if (vista === "mes") { const p = iso(new Date(d.getFullYear(), d.getMonth(), 1, 12)), u = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12)); return { de: dilluns(p), a: suma(dilluns(u), 6), mes: d.getMonth(), any: d.getFullYear() } }
    const de = dilluns(b); return { de, a: suma(de, 6), mes: dia(suma(de, 3)).getMonth(), any: dia(suma(de, 3)).getFullYear() };
  }

  // ---------- esdeveniments: {d0, d1, h, hf, t, k, col, cal, lloc, o} ----------
  async function delHub(de, a) {
    const [t, r, pdr, fe, cu, cv, ps] = await Promise.all(["tarea", "reunion", "pdr", "feina", "curs", "convocatoria", "proyecto"].map(x => H.col(x).catch(() => [])));
    const pn = id => (ps.find(x => x.id === id) || {}).titulo || "", dins = d => d && d >= de && d <= a, out = [], u = (d, o) => out.push({ d0: d, d1: d, ...o });
    t.filter(x => !x.hecha && dins(x.fecha)).forEach(x => u(x.fecha, { t: x.titulo || "Tasca", k: "tasca", o: ["tarea", x.id] }));
    r.filter(x => dins(x.fecha)).forEach(x => u(x.fecha, { h: x.hora, t: x.titulo || "Reunió", k: "reunio", lloc: x.lugar, o: ["reunion", x.id] }));
    pdr.forEach(x => (x.dias || []).forEach((d, i) => dins(d.fecha) && u(d.fecha, { h: ((String(d.calls || "").match(/\b\d{1,2}:\d{2}\b/) || [""])[0]).padStart(5, "0").replace(/^0+$/, ""), t: `Rodatge ${pn(x.proyecto) || x.titulo || ""} · J${i + 1}`, k: "rodatge", o: ["pdr", x.id] })));
    fe.forEach(x => { if (!x.ini) return; const f = x.fin && x.fin >= x.ini ? x.fin : x.ini; if (f < de || x.ini > a) return; out.push({ d0: x.ini, d1: f, t: `${x.rol || "Feina"}: ${x.titulo || ""}`, k: "feina", tot: 1, o: ["feina", x.id] }) });
    cu.forEach(x => (x.setmanes || []).forEach(s => s && dins(s.data) && u(s.data, { h: s.hora, t: `Classe: ${x.titulo || ""}`, k: "classe", lloc: x.centre, o: ["curs", x.id] })));
    cv.filter(x => (!x.estado || x.estado === "Per presentar") && dins(x.limite)).forEach(x => u(x.limite, { t: "Límit: " + (x.titulo || ""), k: "limit", tot: 1, o: ["convocatoria", x.id] }));
    return out;
  }
  const ck = (de, a) => "ag2:" + de + ":" + a;
  const deCopia = (de, a) => { try { return JSON.parse(localStorage.getItem(ck(de, a)) || "null") } catch (e) { return null } };
  async function deGoogle(de, a) {
    const r = await H.api("GET", `correu/agenda?de=${de}&a=${a}`);
    const l = (r.ev || []).map(e => ({ d0: e.ini.slice(0, 10), d1: (e.fi || e.ini).slice(0, 10), h: e.tot ? "" : e.ini.slice(11, 16), hf: e.tot ? "" : (e.fi || "").slice(11, 16), t: e.t, k: "google", col: e.color, cal: e.cal, lloc: e.lloc, tot: !!e.tot }));
    const g = { l, quan: Date.now() };
    try { localStorage.setItem(ck(de, a), JSON.stringify(g)); Object.keys(localStorage).filter(k => /^ag2?:/.test(k) && k !== ck(de, a)).slice(0, -6).forEach(k => localStorage.removeItem(k)) } catch (e) { }
    return g;
  }

  // ---------- dibuix ----------
  // Una setmana: fila de números i, a sota, carrils. Els de diversos dies van primer, com a barres.
  function setmana(dl, evs, o) {
    const ds = [...Array(7)].map((_, i) => suma(dl, i)), fi = ds[6], avui = H.today();
    const llarg = evs.filter(e => e.d1 > e.d0 && e.d1 >= dl && e.d0 <= fi).sort((x, y) => x.d0.localeCompare(y.d0) || dies(y.d0, y.d1) - dies(x.d0, x.d1));
    const curt = evs.filter(e => e.d1 <= e.d0 && e.d0 >= dl && e.d0 <= fi).sort((x, y) => (x.tot || !x.h ? 0 : 1) - (y.tot || !y.h ? 0 : 1) || (x.h || "").localeCompare(y.h || ""));
    const ocup = [...Array(7)].map(() => []), peces = [], max = o.max;
    llarg.forEach(e => { const c0 = Math.max(0, dies(dl, e.d0)), c1 = Math.min(6, dies(dl, e.d1)); let f = 0; while ([...Array(c1 - c0 + 1)].some((_, i) => ocup[c0 + i][f])) f++; if (f >= max) { for (let c = c0; c <= c1; c++) ocup[c].mes = (ocup[c].mes || 0) + 1; return } for (let c = c0; c <= c1; c++) ocup[c][f] = 1; peces.push({ e, c0, c1, f, talla0: e.d0 < dl || e.tall0, talla1: e.d1 > fi || e.tall1 }) });
    curt.forEach(e => { const c = dies(dl, e.d0); let f = 0; while (ocup[c][f]) f++; if (f >= max) { ocup[c].mes = (ocup[c].mes || 0) + 1; return } ocup[c][f] = 1; peces.push({ e, c0: c, c1: c, f }) });
    const files = Math.max(o.min || 0, ...ocup.map(x => x.length));
    const pastilla = p => { const e = p.e, cls = e.k === "tasca" ? "tsk" : e.tot || p.c1 > p.c0 || !e.h ? "tot" : "hr";
      return `<button class="agp ${cls}${p.talla0 ? " t0" : ""}${p.talla1 ? " t1" : ""}" style="grid-column:${p.c0 + 1}/${p.c1 + 2};grid-row:${p.f + 2};--c:${E(e.col || COL[e.k] || "#8e8e93")}" data-ag="dia" data-d="${ds[p.c0]}" title="${E([e.h && e.h + (e.hf ? "–" + e.hf : ""), e.t, e.cal || NOMK[e.k]].filter(Boolean).join(" · "))}">${cls === "tsk" ? `<i class="agr"></i>` : ""}<span>${E(e.t)}</span>${cls === "hr" && o.hores ? `<small>${E(e.h)}</small>` : ""}</button>` };
    return `<div class="agw" style="grid-template-rows:auto repeat(${files},var(--agl)) ${ocup.some(x => x.mes) ? "auto" : ""} 1fr">
      ${ds.map((d, i) => { const fora = o.mes != null && dia(d).getMonth() !== o.mes; return `<button class="agn ${d === avui ? "avui" : ""} ${i > 4 ? "cap" : ""}" ${fora ? "hidden" : ""} style="grid-column:${i + 1};grid-row:1" data-ag="dia" data-d="${d}" aria-label="${E(H.fecha(d, 1))}"><span>${dia(d).getDate()}</span></button>` }).join("")}
      ${peces.map(pastilla).join("")}
      ${ocup.map((x, i) => x.mes ? `<button class="agmes" style="grid-column:${i + 1};grid-row:${files + 2}" data-ag="dia" data-d="${ds[i]}">+${x.mes}</button>` : "").join("")}
      <div class="agfons" style="grid-row:1/-1;grid-column:1/-1" data-ag="fons" data-dl="${dl}"></div></div>`;
  }

  async function pinta(box) {
    if (!box) return; const v = ++ver, r = rang(), { de, a } = r;
    const [hub, cfg] = await Promise.all([delHub(de, a), H.api("GET", "correu/config").catch(() => ({}))]);
    let g = deCopia(de, a); if (v !== ver) return;
    const mob = innerWidth < 700;
    const dibuixa = (gl, peu) => {
      // a la vista de mes, només els dies del mes (com a l'iPhone): el que en surt es retalla
      const m0 = iso(new Date(r.any, r.mes, 1, 12)), m1 = iso(new Date(r.any, r.mes + 1, 0, 12));
      const evs = hub.concat(gl ? gl.l : []).filter(e => vista !== "mes" || (e.d1 >= m0 && e.d0 <= m1)).map(e => vista === "mes" && (e.d0 < m0 || e.d1 > m1) ? { ...e, d0: e.d0 < m0 ? m0 : e.d0, d1: e.d1 > m1 ? m1 : e.d1, tall0: e.d0 < m0, tall1: e.d1 > m1 } : e), setm = []; for (let d = de; d <= a; d = suma(d, 7)) setm.push(d);
      box.innerHTML = `<div class="card agc"><div class="agh"><h3 class="agt">${MESOS[r.mes]}<small>${r.any}</small></h3><span style="flex:1"></span>
          <div class="agseg"><button class="${vista === "setmana" ? "on" : ""}" data-ag="vista" data-v="setmana">Setmana</button><button class="${vista === "mes" ? "on" : ""}" data-ag="vista" data-v="mes">Mes</button></div>
          <div class="agnav"><button data-ag="ant" aria-label="Anterior">‹</button><button data-ag="avui">Avui</button><button data-ag="seg" aria-label="Següent">›</button></div></div>
        <div class="agdh">${["dl", "dt", "dc", "dj", "dv", "ds", "dg"].map((x, i) => `<span class="${i > 4 ? "cap" : ""}">${x}</span>`).join("")}</div>
        <div class="agcal v-${vista}">${setm.map(dl => setmana(dl, evs, vista === "mes" ? { max: mob ? 3 : 4, min: mob ? 2 : 3, mes: r.mes } : { max: mob ? 6 : 10, min: 5, hores: 1 })).join("")}</div>
        <div class="agpeu">${peu}</div></div>`;
    };
    const fa = q => Date.now() - q < 9e4 ? "ara" : "fa " + Math.round((Date.now() - q) / 6e4) + " min";
    const peu = (gl, err) => !cfg.connectat ? `Google Calendar no està connectat: connecta el pont de Google a <a href="#" data-ag="cfg">Configuració</a>.`
      : err ? `No he pogut llegir Google Calendar${gl ? ` (es veu la còpia de ${fa(gl.quan)})` : ""}.${err === "accio" ? " Torna a enganxar pont-gmail.gs a Apps Script i fes una implementació nova." : ""}`
      : `Google Calendar · actualitzat ${gl ? fa(gl.quan) : "…"}`;
    dibuixa(g, peu(g));
    if (!cfg.connectat || (g && Date.now() - g.quan < 5 * 60e3)) return;
    try { g = await deGoogle(de, a); if (v === ver) dibuixa(g, peu(g)) } catch (e) { if (v === ver) dibuixa(g, peu(g, e && e.error || "xarxa")) }
  }

  // ---------- interfície ----------
  function connecta(root, repinta) {
    root.addEventListener("click", e => {
      const b = e.target.closest("[data-ag]"); if (!b) return; if (b.tagName === "A") e.preventDefault();
      const k = b.dataset.ag, { de } = rang();
      if (k === "cfg") return hubShow("ajustos");
      if (k === "vista") { vista = b.dataset.v; try { localStorage.setItem("ag-vista2", vista) } catch (er) { } return repinta() }
      if (k === "avui") { base = null; return repinta() }
      if (k === "ant" || k === "seg") { const s = k === "ant" ? -1 : 1, d = dia(base || H.today()); base = vista === "mes" ? iso(new Date(d.getFullYear(), d.getMonth() + s, 1, 12)) : suma(de, 7 * s); return repinta() }
      if (k === "dia") return obreDia(b.dataset.d);
      if (k === "fons") { const r = b.getBoundingClientRect(), c = Math.min(6, Math.max(0, Math.floor((e.clientX - r.left) / (r.width / 7)))); return obreDia(suma(b.dataset.dl, c)) }
    });
  }
  async function obreDia(d) {
    const { de, a } = rang(), g = deCopia(de, a), l = (await delHub(d, d)).concat(g ? g.l : []).filter(x => x.d0 <= d && x.d1 >= d).sort((x, y) => (x.h || "").localeCompare(y.h || ""));
    H.sheet(`<h2 style="margin-top:0;font-size:22px;color:var(--ink);text-transform:none;letter-spacing:0">${E(H.fecha(d, 1))}</h2>
      ${l.length ? l.map(x => `<div class="r" ${x.o ? `data-ago="${x.o[0]}" data-id="${x.o[1]}"` : ""}><i class="dot" style="background:${E(x.col || COL[x.k] || "#8e8e93")}"></i><div class="g"><b>${E(x.t)}</b><small>${E([x.h ? x.h + (x.hf ? "–" + x.hf : "") : "Tot el dia", x.d1 > x.d0 ? `${H.fecha(x.d0)} – ${H.fecha(x.d1)}` : "", x.lloc, x.cal || NOMK[x.k]].filter(Boolean).join(" · "))}</small></div></div>`).join("") : `<p class="em">Res aquest dia.</p>`}
      <label>Tasca per a aquest dia</label><div class="row"><input id="agt" placeholder="Què has de fer?"><button class="b" data-agk="tasca">Afegir</button></div>`, () => { const b = document.getElementById("hshc"); b.onclick = b.onkeydown = null });
    const box = document.getElementById("hshc");
    box.onclick = async e => {
      const r = e.target.closest("[data-ago]"); if (r) { H.cerrar(); const [t, id] = [r.dataset.ago, r.dataset.id]; if (t === "tarea") return H.abrirTarea(id); if (t === "pdr") { hubShow("planes", { proj: "" }); return window.P && P.abrir(id) } if (t === "curs") { hubShow("docencia"); return window.DOC && DOC.curs(id) } return H.abrir(t, id) }
      if (e.target.closest('[data-agk="tasca"]')) { const t = document.getElementById("agt").value.trim(); if (!t) return document.getElementById("agt").focus(); await H.nuevaTarea(t, d); H.cerrar(); H.toast("Tasca afegida") }
    };
    box.onkeydown = e => { if (e.target.id === "agt" && e.key === "Enter") box.querySelector('[data-agk="tasca"]').click() };
  }
  return { pinta, connecta };
})();
