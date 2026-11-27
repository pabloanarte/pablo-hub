// Calendari del projecte (targeta del Resum): una sola llista de dates (reunions, recces, càsting, rodatge, muntatge,
// entrega…) en lloc dels cronogrames de preproducció i postproducció. Mateix aspecte que el calendari d'Avui (AG.nou).
// Dades: p.cal [{id, tipus, titol, data, fi, hora, horafi, lloc, notes}]. Hi surten també, sense duplicar-les, les reunions,
// tasques, jornades del pla de rodatge, feines i festivals d'aquest projecte. «Reunió» nova = una reunió de veritat (Gent → Reunions).
// Les dates de p.cal van al calendari d'Avui, a l'iCal, a Google Calendar (uid «<projecte>-c-<id>») i al resum diari.
// Migració única (p.calMig): les tasques dels antics cronogrames (docs pre:/post: del projecte) passen a p.cal.
window.CALP = (() => {
  const E = H.E, TIPUS = AG.TIPUS, colT = AG.colT;
  let P = null; // projecte que es mostra
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const suma = (s, n) => { const d = new Date(s + "T12:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) };
  const doc = async () => P && (await H.col("proyecto")).find(x => x.id === P.id);

  // totes les dates del projecte entre de i a: {d0, d1, h, hf, t, k, col, tot, lloc, o:[tipus, id], c (si és de p.cal)}
  async function fonts(de, a) {
    if (!P) return [];
    const [p, t, r, pdr, fe, cv] = await Promise.all([doc(), ...["tarea", "reunion", "pdr", "feina", "convocatoria"].map(x => H.col(x).catch(() => []))]);
    if (!p) return [];
    const pid = p.id, dins = d => d && d >= de && d <= a, out = [], u = (d, o) => out.push({ d0: d, d1: d, ...o });
    (p.cal || []).forEach(c => { if (!c || !c.data) return; const f = c.fi && c.fi > c.data ? c.fi : c.data; if (f < de || c.data > a) return;
      out.push({ d0: c.data, d1: f, h: f > c.data ? "" : c.hora, hf: c.horafi, t: c.titol || c.tipus || "Data", tl: c.titol ? `${c.tipus}: ${c.titol}` : c.tipus || "Data", k: "c", col: colT(c.tipus), tot: f > c.data || !c.hora ? 1 : 0, lloc: c.lloc, c }) });
    r.filter(x => x.proyecto === pid && dins(x.fecha)).forEach(x => u(x.fecha, { h: x.hora, t: x.titulo || "Reunió", tl: "Reunió: " + (x.titulo || ""), k: "reunio", col: colT("Reunió"), lloc: x.lugar, o: ["reunion", x.id] }));
    pdr.filter(x => x.proyecto === pid).forEach(x => (x.dias || []).forEach((d, i) => dins(d.fecha) && u(d.fecha, { h: ((String(d.calls || "").match(/\b\d{1,2}:\d{2}\b/) || [""])[0]).padStart(5, "0").replace(/^0+$/, ""), t: `Rodatge J${i + 1}`, k: "rodatge", col: colT("Rodatge"), o: ["pdr", x.id] })));
    t.filter(x => x.proyecto === pid && !x.hecha && dins(x.fecha)).forEach(x => u(x.fecha, { t: x.titulo || "Tasca", k: "tasca", o: ["tarea", x.id] }));
    fe.filter(x => x.proyecto === pid && x.ini).forEach(x => { const f = x.fin && x.fin >= x.ini ? x.fin : x.ini; if (f < de || x.ini > a) return; out.push({ d0: x.ini, d1: f, t: `${x.rol || "Feina"}: ${x.titulo || ""}`, k: "feina", tot: 1, o: ["feina", x.id] }) });
    cv.filter(x => x.proyecto === pid).forEach(x => {
      if ((!x.estado || x.estado === "Per presentar") && dins(x.limite)) u(x.limite, { t: "Límit: " + (x.titulo || ""), k: "limit", tot: 1, o: ["convocatoria", x.id] });
      if (["Seleccionat", "Premiat", "Presentat"].includes(x.estado) && dins(x.evento)) u(x.evento, { t: "Festival: " + (x.titulo || ""), k: "limit", tot: 1, o: ["convocatoria", x.id] });
    });
    return out;
  }

  // sota el mes: les properes dates (o les darreres si ja no n'hi ha cap)
  async function peu() {
    const avui = H.today(), l = (await fonts(avui, suma(avui, 400))).filter(x => x.d1 >= avui).sort((x, y) => x.d0.localeCompare(y.d0) || (x.h || "").localeCompare(y.h || "")).slice(0, 6);
    const btn = `<button class="b2 cpnou2" data-ag="nova" style="margin-top:10px">+ Afegir una data</button>`;
    if (!l.length) return `<div class="cpbuit">Encara no hi ha cap data. Afegeix-hi reunions, recces, càsting, rodatge, muntatge, entrega… o toca un dia.</div>${btn}`;
    return `<div class="cpll">${l.map(fila).join("")}</div>${btn}`;
  }
  const quan = x => [x.d1 > x.d0 ? `${H.fecha(x.d0)} – ${H.fecha(x.d1)}` : H.fecha(x.d0), x.h && x.h + (x.hf ? "–" + x.hf : "")].filter(Boolean).join(" · ");
  const fila = x => `<div class="r" ${x.c ? `data-ag="cal" data-id="${E(x.c.id)}"` : `data-ag="obre" data-t="${x.o[0]}" data-id="${E(x.o[1])}"`}><i class="dot" style="background:${E(x.col || "#8e8e93")}"></i><div class="g"><b>${E(x.tl || x.t)}</b><small>${E([quan(x), x.lloc].filter(Boolean).join(" · "))}</small></div></div>`;

  const cal = AG.nou({
    clau: "cp-vista", google: false, min: 1, fonts, peu,
    cap: `<button class="b2 cpnou" data-ag="nova" title="Afegir una data">+ Data</button>`,
    dia: d => dia(d),
    clic: (k, b) => {
      if (k === "nova") { edita(null, H.today()); return true }
      if (k === "cal") { edita(b.dataset.id); return true }
      if (k === "obre") { obre(b.dataset.t, b.dataset.id); return true }
      return false;
    }
  });
  const obre = (t, id) => { H.cerrar(); if (t === "tarea") return H.abrirTarea(id); if (t === "pdr") { window.HUB && HUB.obreProjecte(P.id, "guio"); hubShow("planes", { dins: true }); return window.P && window.P.abrir && window.P.abrir(id) } return H.abrir(t, id) };

  // un dia: el que hi ha i afegir-hi una data
  async function dia(d) {
    const l = (await fonts(d, d)).filter(x => x.d0 <= d && x.d1 >= d).sort((x, y) => (x.h || "").localeCompare(y.h || ""));
    H.sheet(`<h2 class="cph">${E(H.fecha(d, 1))}</h2>
      ${l.length ? l.map(fila).join("") : `<p class="em">Res aquest dia.</p>`}
      <label>Afegir</label><div class="seg cpts">${TIPUS.map(([t, c]) => `<button class="t" data-cpt="${E(t)}"><i class="dot" style="background:${c}"></i>${E(t)}</button>`).join("")}</div>`, () => { const b = document.getElementById("hshc"); b.onclick = null });
    document.getElementById("hshc").onclick = e => {
      const r = e.target.closest("[data-ag]"); if (r) { if (r.dataset.ag === "cal") return edita(r.dataset.id); if (r.dataset.ag === "obre") return obre(r.dataset.t, r.dataset.id) }
      const t = e.target.closest("[data-cpt]"); if (t) edita(null, d, t.dataset.cpt);
    };
  }

  // editar o crear una data
  async function edita(id, d, tipus) {
    const p = await doc(); if (!p) return;
    const ve = id && (p.cal || []).find(x => x.id === id), c = ve ? { ...ve } : { tipus: tipus || "Reunió", data: d || H.today() };
    const pinta = () => {
      const reu = !ve && c.tipus === "Reunió";
      H.sheet(`<h2 class="cph">${ve ? "Data" : "Data nova"}</h2>
        <div class="seg cpts">${TIPUS.map(([t, col]) => `<button class="t ${c.tipus === t ? "on" : ""}" data-cpt="${E(t)}"><i class="dot" style="background:${col}"></i>${E(t)}</button>`).join("")}</div>
        <label>${c.tipus === "Altres" ? "Què és" : "Detall (opcional)"}</label><input id="cpti" value="${E(c.titol || "")}" placeholder="${E({ Reunió: "p. ex. amb l'artista", Recce: "p. ex. terrat", Rodatge: "p. ex. jornada 1", Entrega: "p. ex. màster final", Muntatge: "p. ex. primer muntatge" }[c.tipus] || "")}">
        <div class="cpfl"><div><label>Data</label><input type="date" id="cpd" value="${E(c.data || "")}"></div>${reu ? "" : `<div><label>Fins a (si dura més d'un dia)</label><input type="date" id="cpf" value="${E(c.fi || "")}"></div>`}</div>
        <div class="cpfl"><div><label>Hora${c.fi > c.data ? " (només el primer dia)" : ""}</label><input type="time" id="cph" value="${E(c.hora || "")}"></div><div><label>Fins a les</label><input type="time" id="cphf" value="${E(c.horafi || "")}"></div></div>
        <label>Lloc</label><input id="cpl" value="${E(c.lloc || "")}">
        <label>Notes</label><textarea id="cpn" rows="3">${E(c.notes || "")}</textarea>
        ${reu ? `<p class="em" style="margin:8px 0 0">Es desarà com a reunió (Gent → Reunions), vinculada a aquest projecte.</p>` : ""}
        <div class="sfoot">${ve ? `<button class="del" data-cpk="del">Eliminar</button>` : `<span></span>`}<button class="b" data-cpk="desa">${ve ? "Fet" : "Afegir"}</button></div>`, () => { const b = document.getElementById("hshc"); b.onclick = null });
      const box = document.getElementById("hshc");
      box.onclick = async e => {
        const t = e.target.closest("[data-cpt]"); if (t) { llegeix(); c.tipus = t.dataset.cpt; return pinta() }
        const b = e.target.closest("[data-cpk]"); if (!b) return;
        const q = await doc(); if (!q) return;
        if (b.dataset.cpk === "del") { if (!await H.confirma("Eliminar aquesta data?")) return; q.cal = (q.cal || []).filter(x => x.id !== id); await H.put(q, 1); H.cerrar(); return repinta() }
        llegeix(); if (!/^\d{4}-\d{2}-\d{2}$/.test(c.data || "")) return H.toast("Falta la data");
        if (!(c.fi > c.data)) delete c.fi; if (!(c.horafi > c.hora)) delete c.horafi;
        ["titol", "hora", "lloc", "notes"].forEach(k => { if (!c[k]) delete c[k] });
        if (reu) { const r = { id: H.uid("reunion"), titulo: c.titol || q.titulo || "Reunió", fecha: c.data, hora: c.hora || "", ...(c.hora && c.horafi > c.hora ? { durada: (+c.horafi.slice(0, 2) * 60 + +c.horafi.slice(3)) - (+c.hora.slice(0, 2) * 60 + +c.hora.slice(3)) } : {}), ...(c.lloc ? { lugar: c.lloc } : {}), ...(c.notes ? { apuntes: c.notes } : {}), proyecto: q.id }; await H.put(r, 1); H.cerrar(); H.toast("Reunió afegida"); return repinta() }
        q.cal = q.cal || []; const i = q.cal.findIndex(x => x.id === id);
        if (i >= 0) q.cal[i] = { ...c, id }; else q.cal.push({ ...c, id: uid() });
        q.cal.sort((x, y) => (x.data || "").localeCompare(y.data || "") || (x.hora || "").localeCompare(y.hora || ""));
        await H.put(q, 1); H.cerrar(); H.toast(ve ? "Desat" : "Afegit"); repinta();
      };
      box.onkeydown = e => { if (e.key === "Enter" && e.target.tagName === "INPUT") box.querySelector('[data-cpk="desa"]').click() };
    };
    const llegeix = () => { const v = k => (document.getElementById(k) || {}).value || ""; Object.assign(c, { titol: v("cpti").trim(), data: v("cpd"), fi: document.getElementById("cpf") ? v("cpf") : "", hora: v("cph"), horafi: v("cphf"), lloc: v("cpl").trim(), notes: v("cpn") }) };
    pinta();
  }

  // migració única dels antics cronogrames de preproducció i postproducció d'aquest projecte
  const GUESS = [[/rodatge|rodaje|shoot/i, "Rodatge"], [/muntatge|montaje|edici/i, "Muntatge"], [/etalonatge|color/i, "Color"], [/\bso\b|mescla|sonido|sound/i, "So"], [/vfx|efectes/i, "VFX"], [/c[aà]sting/i, "Càsting"], [/assaig|assajos|ensayo/i, "Assaig"], [/scouting|localitz|recce/i, "Recce"], [/prova|prueba/i, "Proves"], [/lliurament|entrega|deadline|export/i, "Entrega"], [/estrena/i, "Estrena"], [/reuni/i, "Reunió"]];
  async function migra(p) {
    if (p.calMig) return;
    const [pre, post] = await Promise.all([H.col("pre").catch(() => []), H.col("post").catch(() => [])]);
    const l = pre.concat(post).filter(x => x.proyecto === p.id && /^\d{4}-\d{2}-\d{2}$/.test(x.ini || ""));
    const q = await doc(); if (!q || q.calMig) return;
    q.calMig = 1;
    if (l.length) {
      q.cal = (q.cal || []).concat(l.map(x => ({ id: uid(), tipus: (GUESS.find(g => g[0].test(x.titulo || "")) || [0, x.hito ? "Entrega" : { "Càsting": "Càsting", "Localitzacions": "Recce", "Muntatge": "Muntatge", "Color": "Color", "So": "So", "Música": "So", "VFX": "VFX", "Lliuraments": "Entrega" }[x.cat] || "Altres"])[1], titol: x.titulo || "", data: x.ini, ...(x.fin > x.ini ? { fi: x.fin } : {}), ...(x.notas ? { notes: x.notas } : {}) })));
      q.cal.sort((x, y) => (x.data || "").localeCompare(y.data || ""));
    }
    await H.put(q, 1);
  }

  let box = null;
  const repinta = () => box && document.body.contains(box) && cal.pinta(box);
  // dins el Resum: posa el calendari a #pcal
  async function pinta(el, p) {
    P = p; box = el.querySelector("#pcal"); if (!box) return;
    try { await migra(p) } catch (e) { }
    cal.pinta(box);
  }
  let con = false;
  function connecta(el) { if (con) return; con = true; cal.connecta(el, repinta) }
  return { pinta, connecta, fonts };
})();
