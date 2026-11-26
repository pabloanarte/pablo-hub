// Docència: per a qualsevol tipus de classe.
//  · Cursos (doc "curs:"): dades del curs i, setmana a setmana, el tema, els PDF d'aquella sessió, els visionats i notes.
//  · Visionats (doc "visionat:"): enllaços de Vimeo o YouTube amb miniatura, classificats per exercici, amb anotacions.
window.DOC = (() => {
  const { E } = H, el = document.getElementById("s-docencia");
  const EXS = ["Presentació de personatge", "Persecució", "Conversa", "Línia de Guió", "Curts"];
  const NIV = ["Primària", "ESO", "Batxillerat", "Grau", "Màster", "Adults"];
  const CEX = { llista: "doc_ex", op: EXS };
  let vista = "cursos", curs = null, ex = "", q = "", qtx = "", ver = 0;
  try { vista = localStorage.getItem("doc-vista") || vista } catch (e) { }

  // ---------- vídeos: identificar, miniatura i reproductor ----------
  function video(u) {
    u = String(u || "").trim(); let m;
    if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/))) return { pl: "YouTube", id: m[1], embed: "https://www.youtube-nocookie.com/embed/" + m[1] + "?rel=0", thumb: "https://i.ytimg.com/vi/" + m[1] + "/hqdefault.jpg" };
    if ((m = u.match(/vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/|showcase\/\d+\/video\/)?(\d+)(?:\/([\da-f]+))?(?:.*[?&]h=([\da-f]+))?/i))) { const h = m[2] || m[3]; return { pl: "Vimeo", id: m[1], embed: "https://player.vimeo.com/video/" + m[1] + "?dnt=1" + (h ? "&h=" + h : "") } }
    return null;
  }
  async function meta(u) {
    const v = video(u) || {}; let o = {};
    try { o = await H.api("GET", "oembed?url=" + encodeURIComponent(u)) } catch (e) {
      if (v.pl === "Vimeo") try { const r = await (await fetch("https://vimeo.com/api/oembed.json?url=" + encodeURIComponent(u))).json(); o = { titol: r.title, autor: r.author_name, thumb: r.thumbnail_url, durada: r.duration } } catch (er) { }
    }
    return { titulo: o.titol || "", autor: o.autor || "", thumb: o.thumb || v.thumb || "", durada: o.durada || 0 };
  }
  const durada = s => s ? Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0") : "";
  const PLAY = `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="#fff"/></svg>`;

  // ---------- capçalera ----------
  function cap() {
    return `<div class="seg" style="margin-bottom:14px"><button class="t ${vista === "cursos" ? "on" : ""}" data-k="vista" data-v="cursos">Cursos</button><button class="t ${vista === "visionats" ? "on" : ""}" data-k="vista" data-v="visionats">Visionats</button></div>`;
  }
  async function pintar() {
    const v = ++ver;
    if (vista === "visionats") return visionats(v);
    if (curs) return fitxa(v);
    return cursos(v);
  }

  // ---------- cursos ----------
  const ses = c => (c.setmanes || []).slice().sort((a, b) => (a.data || "").localeCompare(b.data || ""));
  async function cursos(v) {
    const l = (await H.col("curs")).slice().sort((a, b) => (b.inici || "").localeCompare(a.inici || "") || (a.titulo || "").localeCompare(b.titulo || "")); if (v !== ver) return;
    const avui = H.today(), actiu = c => !c.fi || c.fi >= avui;
    const fila = c => { const s = ses(c), prop = s.find(x => x.data && x.data >= avui), n = s.reduce((a, x) => a + (x.arxius || []).length, 0);
      return `<div class="r" data-k="obre" data-id="${c.id}"><i class="dot" style="background:${actiu(c) ? "#0a84ff" : "#c7c7cc"}"></i><div class="g"><b>${E(c.titulo || "Sense títol")}</b><small>${E([c.centre, c.nivell, s.length ? s.length + (s.length > 1 ? " sessions" : " sessió") : "", n ? n + " PDF" : "", prop ? "propera: " + H.fecha(prop.data) + (prop.hora ? ", " + prop.hora : "") : ""].filter(Boolean).join(" · "))}</small></div></div>` };
    const act = l.filter(actiu), alt = l.filter(c => !actiu(c));
    el.innerHTML = cap() + `<div class="bar"><span class="em">Cada curs amb les seves sessions: tema, PDF, visionats i notes.</span><span style="flex:1"></span><button class="b" data-k="nou">+ Curs</button></div>
      <div class="hl">${l.length ? (act.length ? `<h2>En curs i propers <span>${act.length}</span></h2>` + act.map(fila).join("") : "") + (alt.length ? `<h2>Acabats <span>${alt.length}</span></h2>` + alt.map(fila).join("") : "") : `<p class="em">Encara no hi ha cap curs. Prem «+ Curs» per començar.</p>`}</div>`;
  }
  async function fitxa(v) {
    const [cs, vs] = await Promise.all([H.col("curs"), H.col("visionat"), H.llistes()]); if (v !== ver) return;
    const c = cs.find(x => x.id === curs); if (!c) { curs = null; return pintar() }
    let net = 0; (c.setmanes || []).forEach(x => { const l = (x.vis || []).filter(id => vs.some(y => y.id === id)); if (l.length !== (x.vis || []).length) { x.vis = l; net = 1 } }); if (net) H.put(c, 1);
    const avui = H.today(), s = ses(c), act = s.filter(x => x.data && x.data <= avui).pop();
    const inp = (f, l, t = "text", ph = "") => `<div style="flex:1;min-width:150px"><label>${l}</label><input type="${t}" data-c="${f}" value="${E(c[f] || "")}" placeholder="${E(ph)}"></div>`;
    const sessio = x => { const n = s.indexOf(x) + 1, vv = (x.vis || []).map(id => vs.find(y => y.id === id)).filter(Boolean);
      return `<div class="card dses${x === act ? " on" : ""}" data-s="${x.id}">
        <div class="ls"><b style="font-size:16px;white-space:nowrap">Sessió ${n}</b><input type="date" data-sf="data" value="${E(x.data || "")}" style="width:auto"><span class="dhor"><input type="time" data-sf="hora" value="${E(x.hora || "")}" title="Hora d'inici" style="width:auto">–<input type="time" data-sf="horafi" value="${E(x.horafi || "")}" title="Hora d'acabar" style="width:auto"></span><span style="flex:1"></span><button class="x" data-k="qses" title="Treure la sessió">×</button></div>
        <input data-sf="tema" value="${E(x.tema || "")}" placeholder="Tema o exercici de la sessió" style="margin-top:8px;font-weight:600">
        <div class="dpdf">${(x.arxius || []).map(a => `<span class="chip"><a href="/api/archivo/${E(a.id)}" target="_blank">${E(a.nombre)}</a> <button data-k="qpdf" data-a="${E(a.id)}" title="Treure">×</button></span>`).join("")}<label class="b2" style="cursor:pointer;font-size:13px">+ PDF<input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.key,.pages,image/*" data-k="pujar" hidden></label></div>
        ${vv.length ? `<div class="dvis">${vv.map(y => `<div class="dvs" data-k="vveu" data-id="${y.id}" title="${E(y.notas || "")}">${y.thumb ? `<img src="${E(y.thumb)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=dvph>${PLAY.replace(/"/g, "&quot;")}</span>'">` : `<span class="dvph">${PLAY}</span>`}<small>${E(y.titulo || "Sense títol (" + ((video(y.url) || {}).pl || "enllaç") + ")")}</small><button class="x" data-k="qvis" data-id="${y.id}" title="Treure de la sessió">×</button></div>`).join("")}</div>` : ""}
        <div class="ls" style="margin-top:6px"><select data-k="avis" style="width:100%;max-width:360px"><option value="">+ Afegir un visionat…</option>${EXS2().map(e => { const g = vs.filter(y => EXS2().find(z => [].concat(y.exercici || []).includes(z)) === e && !(x.vis || []).includes(y.id)); return g.length ? `<optgroup label="${E(e)}">${g.map(y => `<option value="${y.id}">${E(y.titulo || "Sense títol (" + ((video(y.url) || {}).pl || "enllaç") + ")")}</option>`).join("")}</optgroup>` : "" }).join("")}${(() => { const g = vs.filter(y => !EXS2().some(e => [].concat(y.exercici || []).includes(e)) && !(x.vis || []).includes(y.id)); return g.length ? `<optgroup label="Sense exercici">${g.map(y => `<option value="${y.id}">${E(y.titulo || "Sense títol (" + ((video(y.url) || {}).pl || "enllaç") + ")")}</option>`).join("")}</optgroup>` : "" })()}</select></div>
        <textarea data-sf="notes" rows="2" placeholder="Notes de la sessió: com ha anat, què cal canviar…" style="margin-top:8px">${E(x.notes || "")}</textarea></div>` };
    el.innerHTML = cap() + `<div class="bar tb"><button class="b2" data-k="torna">← Cursos</button><span style="flex:1"></span><button class="del" data-k="qcurs">Eliminar el curs</button></div>
      <input class="big" data-c="titulo" value="${E(c.titulo || "")}" placeholder="Nom del curs" style="margin-bottom:10px">
      <div class="ls" style="align-items:flex-end;gap:12px">${inp("centre", "Centre o escola", "text", "ESCAC, institut, centre cívic…")}${inp("tipus", "Tipus de classe", "text", "Taller, assignatura, curs intensiu…")}${inp("nivell", "Alumnes", "text", "1r de grau, 4t d'ESO, adults…")}${inp("inici", "Inici", "date")}${inp("fi", "Final", "date")}</div>
      <label>Notes del curs</label><textarea data-c="notas" rows="3" placeholder="Horari, aula, contacte del centre, programa…">${E(c.notas || "")}</textarea>
      <h2 style="margin-top:22px">Sessions <span>${s.length}</span></h2>
      ${s.map(sessio).join("") || `<p class="em">Afegeix la primera sessió.</p>`}
      <button class="b" data-k="nses" style="margin-top:6px">+ Sessió</button>`;
  }
  // Ordre de la llista; «Documental» sempre just abans de «Curts» (ho va demanar Pablo)
  const EXS2 = () => { const l = H.opsDe(CEX).slice(), i = l.indexOf("Documental"), j = l.indexOf("Curts"); if (i > j && j >= 0) { l.splice(i, 1); l.splice(j, 0, "Documental") } return l };

  // ---------- visionats ----------
  const CAMPS = [
    { f: "titulo", tipo: "titulo", ph: "Títol" },
    { f: "url", l: "Enllaç (Vimeo o YouTube)", tipo: "url" },
    { f: "exercici", l: "Exercici", tipo: "pills", multi: 1, llista: "doc_ex", op: EXS },
    { f: "nivell", l: "Per a", tipo: "pills", multi: 1, llista: "doc_niv", op: NIV },
    { f: "notas", l: "Les meves anotacions", tipo: "textarea", rows: 4, ph: "Per a més petits, per parlar del punt de vista, a partir del minut 3…" },
    { f: "autor", l: "Autor o director", tipo: "text" }
  ];
  const repr = d => { const v = video(d.url); return v ? `<div class="dvp" data-k="play" data-vid="${d.id}" data-e="${E(v.embed)}">${d.thumb ? `<img src="${E(d.thumb)}" alt="" onerror="this.remove()">` : ""}<span>${PLAY}</span></div>` : `<p class="em dvbuit" data-vid="${d.id}">Enganxa un enllaç de Vimeo o YouTube per veure'l aquí.</p>` };
  let tmeta = 0;
  // posa a la fitxa oberta la miniatura i el títol nous sense tornar-la a pintar (no es perd el que s'escriu)
  function aplica(d) {
    const box = document.getElementById("hshc"), p = box && box.querySelector(`[data-vid="${d.id}"]`); if (!p || document.getElementById("hsh").hidden) return;
    const t = box.querySelector("input.big"); if (t && document.activeElement !== t) t.value = d.titulo || "";
    p.outerHTML = repr(d);
    const a = box.querySelector('input[data-f="autor"]'); if (a && document.activeElement !== a) a.value = d.autor || "";
  }
  function editaVis(d) {
    let ultim = d.url;
    const llegeix = async () => {
      const u = d.url, m = await meta(u); if (u !== d.url) return;
      d.thumb = m.thumb; if (m.durada) d.durada = m.durada;
      const auto = d._auto || {}; ["titulo", "autor"].forEach(k => { if (m[k] && (!d[k] || d[k] === auto[k])) { d[k] = m[k]; auto[k] = m[k] } }); d._auto = auto;
      H.put(d, 1); aplica(d);
    };
    const opt = {
      cap: async x => repr(x),
      cambio: () => { clearTimeout(tmeta); tmeta = setTimeout(() => { if (d.url === ultim) return; ultim = d.url; if (!video(d.url)) { d.thumb = ""; aplica(d); return d.url && H.toast("L'enllaç ha de ser de Vimeo o YouTube") } llegeix() }, 900) },
      alCerrar: () => { clearTimeout(tmeta); if (!d.url && !d.titulo) H.del(d); pintar() }
    };
    if (d._u !== undefined) { delete d._u; H.put(d, 1) }
    H.editar(CAMPS, d, opt);
    // si en afegir-lo no es va poder llegir el títol o la miniatura, es torna a provar en obrir la fitxa
    if (d.url && (!d.titulo || !d.thumb)) llegeix();
  }
  async function visionats(v) {
    const l = await H.col("visionat"); await H.llistes(); if (v !== ver) return;
    const exs = EXS2(), te = d => [].concat(d.exercici || []);
    const vis = l.filter(d => (!ex || (ex === "-" ? !te(d).length : te(d).includes(ex))) && (!q || [d.titulo, d.autor, d.notas, te(d).join(" "), [].concat(d.nivell || []).join(" ")].join(" ").toLowerCase().includes(q))).sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
    const sense = l.filter(d => !te(d).length).length;
    const card = d => `<div class="vcar" data-k="vobre" data-id="${d.id}"><div class="vcim">${d.thumb ? `<img src="${E(d.thumb)}" alt="" loading="lazy" onerror="this.remove()">` : ""}<span class="vpl">${PLAY}</span>${d.durada ? `<i>${durada(d.durada)}</i>` : ""}</div>
      <div class="g"><b>${E(d.titulo || "Sense títol")}</b><small>${E([!d.titulo && (video(d.url) || {}).pl, te(d).join(", "), [].concat(d.nivell || []).join(", ")].filter(Boolean).join(" · "))}</small>${d.notas ? `<p>${E(d.notas)}</p>` : ""}</div></div>`;
    el.innerHTML = cap() + `<div class="tabs"><button class="t ${ex ? "" : "on"}" data-k="ex" data-v="">Tots <small>${l.length || ""}</small></button>${exs.map(e => `<button class="t ${ex === e ? "on" : ""}" data-k="ex" data-v="${E(e)}">${E(e)} <small>${l.filter(d => te(d).includes(e)).length || ""}</small></button>`).join("")}${sense ? `<button class="t ${ex === "-" ? "on" : ""}" data-k="ex" data-v="-">Sense exercici <small>${sense}</small></button>` : ""}</div>
      <div class="bar" style="flex-wrap:wrap"><input class="dvq" placeholder="Cerca…" value="${E(qtx)}" style="flex:1;min-width:150px;max-width:420px"><span style="flex:1"></span><input class="dvu" id="dv-url" placeholder="Enllaç de Vimeo o YouTube" style="flex:1;min-width:200px;max-width:380px"><button class="b" data-k="vnou">+ Visionat</button></div>
      <div class="vgr">${vis.map(card).join("") || `<p class="em">${l.length ? "Cap visionat aquí." : "Encara no hi ha visionats. Enganxa un enllaç a dalt."}</p>`}</div>`;
  }
  let afegint = false;
  async function afegeix() {
    const i = document.getElementById("dv-url"), u = i.value.trim(); if (!u) return i.focus();
    const v = video(u); if (!v) return H.toast("Ha de ser un enllaç de Vimeo o YouTube");
    if (afegint) return; afegint = true;
    const ja = (await H.col("visionat")).find(d => { const w = video(d.url); return w && w.pl === v.pl && w.id === v.id });
    if (ja) { afegint = false; H.toast("Aquest vídeo ja hi és"); return editaVis(ja) }
    i.value = ""; H.toast("Afegint…"); const m = await meta(u); afegint = false;
    const d = { id: H.uid("visionat"), url: u, titulo: m.titulo, autor: m.autor, thumb: m.thumb, durada: m.durada, _auto: { titulo: m.titulo, autor: m.autor }, exercici: ex && ex !== "-" ? [ex] : [], nivell: [], notas: "" };
    await H.put(d, 1); pintar(); editaVis(d);
  }

  // ---------- esdeveniments ----------
  const doc = async () => (await H.col("curs")).find(x => x.id === curs);
  const sessioDe = (c, t) => { const s = t.closest("[data-s]"); return s && (c.setmanes || []).find(x => x.id === s.dataset.s) };
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b || b.tagName === "SELECT" || b.tagName === "INPUT") return; const k = b.dataset.k;
    if (k === "vista") { vista = b.dataset.v; curs = null; try { localStorage.setItem("doc-vista", vista) } catch (er) { } return pintar() }
    if (k === "obre") { curs = b.dataset.id; return pintar() }
    if (k === "torna") { const c = await doc(); if (c && !(c.setmanes || []).length && ["titulo", "centre", "tipus", "nivell", "fi", "notas"].every(k => !String(c[k] || "").trim())) await H.del(c); curs = null; return pintar() }
    if (k === "nou") { const c = { id: H.uid("curs"), titulo: "", setmanes: [], inici: H.today() }; await H.put(c, 1); curs = c.id; await pintar(); const i = el.querySelector('input[data-c="titulo"]'); return i && i.focus() }
    if (k === "ex") { ex = b.dataset.v; return pintar() }
    if (k === "vnou") return afegeix();
    if (k === "vobre") { const d = (await H.col("visionat")).find(x => x.id === b.dataset.id); return d && editaVis(d) }
    if (k === "vveu") { if (e.target.closest('[data-k="qvis"]')) return; const d = (await H.col("visionat")).find(x => x.id === b.dataset.id); return d && editaVis(d) }
    const c = await doc(); if (!c) return;
    if (k === "qcurs") { if (!confirm("Eliminar aquest curs amb totes les sessions i els seus PDF?")) return; (c.setmanes || []).forEach(x => (x.arxius || []).forEach(a => H.api("DELETE", "archivo/" + a.id).catch(() => { }))); await H.del(c); curs = null; return pintar() }
    if (k === "nses") { const s = ses(c), u = s[s.length - 1]; c.setmanes = (c.setmanes || []).concat({ id: Date.now().toString(36), data: u && u.data ? H.addDays(u.data, 7) : (c.inici || H.today()), hora: u ? u.hora || "" : "", horafi: u ? u.horafi || "" : "", tema: "", arxius: [], vis: [], notes: "" }); await H.put(c, 1); await pintar(); const l = el.querySelectorAll('input[data-sf="tema"]'); return l.length && l[l.length - 1].focus() }
    const x = sessioDe(c, b); if (!x) return;
    if (k === "qses") { if (!confirm("Treure aquesta sessió" + ((x.arxius || []).length ? " i els seus PDF" : "") + "?")) return; (x.arxius || []).forEach(a => H.api("DELETE", "archivo/" + a.id).catch(() => { })); c.setmanes = c.setmanes.filter(y => y !== x); H.put(c, 1); return pintar() }
    if (k === "qpdf") { if (!confirm("Treure aquest arxiu?")) return; H.api("DELETE", "archivo/" + b.dataset.a).catch(() => { }); x.arxius = (x.arxius || []).filter(a => a.id !== b.dataset.a); H.put(c, 1); return pintar() }
    if (k === "qvis") { x.vis = (x.vis || []).filter(id => id !== b.dataset.id); H.put(c, 1); return pintar() }
  });
  let tdes = 0;
  el.addEventListener("input", async e => {
    const t = e.target;
    if (t.classList.contains("dvq")) { qtx = t.value; q = t.value.toLowerCase(); const pos = t.selectionStart; clearTimeout(tdes); tdes = setTimeout(async () => { await pintar(); const i = el.querySelector(".dvq"); if (i) { i.focus(); i.setSelectionRange(pos, pos) } }, 250); return }
    if (!t.dataset.c && !t.dataset.sf) return;
    const c = await doc(); if (!c) return;
    if (t.dataset.c) c[t.dataset.c] = t.value;
    else { const x = sessioDe(c, t); if (x) x[t.dataset.sf] = t.value }
    H.put(c);
  });
  el.addEventListener("keydown", e => { if (e.target.id === "dv-url" && e.key === "Enter") afegeix() });
  el.addEventListener("change", async e => {
    const t = e.target, c = curs && await doc(); if (!c) return; const x = sessioDe(c, t); if (!x) return;
    if (t.type === "date" && t.dataset.sf) { H.put(c, 1); return pintar() }
    if (t.type === "time") return H.put(c, 1);
    if (t.dataset.k === "avis" && t.value) { x.vis = (x.vis || []).concat(t.value); H.put(c, 1); return pintar() }
    if (t.dataset.k === "pujar" && t.files.length) {
      for (const f of t.files) {
        if (f.size > 25 * 1024 * 1024) { H.toast(f.name + " passa de 25 MB"); continue }
        H.toast("Pujant " + f.name + "…");
        try { const a = await H.api("POST", "archivo?nombre=" + encodeURIComponent(f.name), f); x.arxius = (x.arxius || []).concat(a) } catch (er) { H.toast(er && er.error === "sin-archivos" ? "Falta activar el magatzem d'arxius a Cloudflare" : "No s'ha pogut pujar " + f.name) }
      }
      await H.put(c, 1); H.toast("Pujat"); pintar();
    }
  });
  // reproductor dins la fitxa del visionat
  document.getElementById("hsh").addEventListener("click", e => {
    const p = e.target.closest('.dvp[data-k="play"]'); if (!p) return;
    p.outerHTML = `<div class="dvp dvf"><iframe src="${E(p.dataset.e)}${p.dataset.e.includes("?") ? "&" : "?"}autoplay=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  });

  H.onChange(() => { if (!el.hidden && !el.contains(document.activeElement)) pintar() });
  pintar().catch(() => el.innerHTML = cap() + `<p class="em">No s'ha pogut carregar.</p>`);
  return {
    curs: id => { vista = "cursos"; curs = id; pintar() },
    vis: async id => { vista = "visionats"; curs = null; await pintar(); const d = (await H.col("visionat")).find(x => x.id === id); d && editaVis(d) },
    nouVis: async () => { vista = "visionats"; curs = null; await pintar(); const i = document.getElementById("dv-url"); i && i.focus() },
    _video: video
  };
})();
