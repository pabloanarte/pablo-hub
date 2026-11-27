// Desenvolupament de projectes (sobretot llargs): versions del guió i del tractament, lectures i notes rebudes,
// i què demana cada convocatòria o ajuda, marcant què ja està llest. Un document "dev:<id del projecte>" per projecte.
(() => {
  const { E } = H, el = document.getElementById("s-desenvolupament");
  let p = null, d = null, ver = 0;
  const save = () => H.put(d);
  const TIPUS = ["Idea", "Sinopsi", "Tractament", "Escaleta", "Guió", "Memòria de direcció", "Dossier"];
  // Plantilles orientatives (cal revisar sempre les bases de cada any)
  const PLANT = {
    "Residència de l'Acadèmia de Cine": ["Sinopsi breu", "Tractament o primera versió de guió", "Memòria / carta de motivació", "Currículum i filmografia", "Enllaços a treballs anteriors", "Pla de treball durant la residència"],
    "Ajut al desenvolupament (ICEC)": ["Sinopsi", "Tractament o guió", "Memòria de direcció", "Pressupost de desenvolupament", "Pla de finançament", "Calendari", "Currículums de l'equip", "Documentació de la productora"],
    "Ajut a l'escriptura de guió": ["Sinopsi", "Tractament", "Escaleta o primera seqüència dialogada", "Memòria", "Currículum del guionista"],
    "Laboratori o residència (genèric)": ["Logline", "Sinopsi", "Nota d'intencions", "Bio i filmografia", "Referències visuals", "Carta de motivació"],
    "Llista en blanc": []
  };
  async function lista() {
    if (H.pj() && H.pj() !== "-") return obre(H.pj());
    const v = ++ver, [ps, ds] = await Promise.all([H.col("proyecto"), H.col("dev")]); if (v !== ver) return; p = d = null;
    const dev = ps.filter(x => ["Llarg", "Curt"].includes(x.categoria) && H.meu(x) && !["Distribució", "Acabat"].includes(x.estado));
    const altres = ps.filter(x => !dev.includes(x) && ds.some(y => y.id === "dev:" + x.id.split(":")[1]));
    const fila = x => { const o = ds.find(y => y.id === "dev:" + x.id.split(":")[1]) || {}, u = (o.versions || []).slice().sort((a, b) => (b.data || "").localeCompare(a.data || ""))[0], pend = (o.convs || []).flatMap(c => c.docs || []).filter(z => !z.fet).length;
      return `<div class="r" data-k="obre" data-id="${x.id}"><i class="dot" style="background:#ff9f0a"></i><div class="g"><b>${E(x.titulo || "Sense títol")}</b><small>${[x.categoria, x.estado, u ? `última versió: ${u.tipus || ""} ${u.versio || ""} (${H.fecha(u.data)})` : "sense versions", (o.lectures || []).length ? o.lectures.length + " lectures" : "", pend ? pend + " documents per preparar" : ""].filter(Boolean).map(E).join(" · ")}</small></div></div>` };
    el.innerHTML = `<p class="em" style="margin:0 0 14px">Llargs i curts teus en idea o desenvolupament. Per afegir-ne un, crea'l a Projectes.</p>` + (dev.length ? dev.map(fila).join("") : `<p class="em">No hi ha cap projecte en desenvolupament.</p>`) + (altres.length ? `<h2>Altres</h2>` + altres.map(fila).join("") : "");
  }
  async function obre(pid) {
    ++ver; p = (await H.col("proyecto")).find(x => x.id === pid); if (!p) return;
    const id = "dev:" + pid.split(":")[1]; d = (await H.col("dev")).find(x => x.id === id);
    if (!d) { d = { id, versions: [], lectures: [], convs: [] }; H.put(d, 1) }
    pinta();
  }
  const ta = (k, i, f, v, ph = "", rows = 1) => `<textarea rows="${rows}" data-l="${k}" data-i="${i}" data-f="${f}" placeholder="${E(ph)}">${E(v || "")}</textarea>`;
  async function pinta() {
    const vs = d.versions.slice().map((v, i) => [v, i]).sort((a, b) => (b[0].data || "").localeCompare(a[0].data || "") || b[1] - a[1]), cs = (await H.col("convocatoria")).filter(c => c.proyecto === p.id && c.tipo === "Lab / residència");
    el.innerHTML = `<div class="bar tb">${H.pj() ? "" : `<button class="b2" data-k="torna">← Desenvolupament</button><b style="font-size:20px">${E(p.titulo || "")}</b>`}<span class="em">${E([p.categoria, p.estado].filter(Boolean).join(" · "))}</span><span style="flex:1"></span><button class="b2" data-k="proj">Fitxa del projecte</button></div>
      ${p.logline ? `<p style="font-size:17px;max-width:900px;margin:4px 0 18px">${E(p.logline)}</p>` : ""}
      ${["Llarg", "Curt"].includes(p.categoria) ? tractament() : ""}
      <div class="card"><h3>Versions</h3><p class="em" style="margin:0 0 8px">Cada versió del tractament, de l'escaleta o del guió, amb l'arxiu i què ha canviat.</p>
        ${vs.length ? `<div class="cits"><table class="ctab"><thead><tr><th style="width:13%">Data</th><th style="width:15%">Tipus</th><th style="width:8%">Versió</th><th>Què ha canviat</th><th style="width:22%">Arxiu</th><th style="width:34px"></th></tr></thead><tbody>${vs.map(([v, i]) => `<tr><td><input type="date" data-l="versions" data-i="${i}" data-f="data" value="${E(v.data || "")}" style="border:0;background:none"></td><td><select data-l="versions" data-i="${i}" data-f="tipus" style="border:0;background:none">${TIPUS.map(t => `<option ${t === v.tipus ? "selected" : ""}>${t}</option>`).join("")}</select></td><td>${ta("versions", i, "versio", v.versio, "v1")}</td><td>${ta("versions", i, "canvis", v.canvis, "Canvis principals")}</td>
          <td>${v.arxiu ? `<a class="ln" href="/api/archivo/${E(v.arxiu.id)}" target="_blank">${E(v.arxiu.nombre)}</a>${v.pag ? ` <small>${v.pag} pàg.${(() => { const ant = d.versions.filter(y => y !== v && y.pag && (y.tipus || "Guió") === (v.tipus || "Guió") && (y.data || "") < (v.data || "")).sort((a, b) => (b.data || "").localeCompare(a.data || ""))[0]; const dif = ant ? v.pag - ant.pag : 0; return ant && dif ? ` (${dif > 0 ? "+" : ""}${dif})` : "" })()}</small>` : ""} <button class="x" data-k="qarx" data-i="${i}" title="Treure l'arxiu">×</button>` : `<label class="b2" style="cursor:pointer;font-size:13px">Pujar<input type="file" data-k="arx" data-i="${i}" hidden></label>`}</td><td><button class="x" data-k="treu" data-l="versions" data-i="${i}" title="Treure">×</button></td></tr>`).join("")}</tbody></table></div>` : ""}
        <button class="b2" data-k="nova" data-l="versions" style="margin-top:8px">+ Versió</button></div>
      <div class="card"><h3>Lectures i notes</h3><p class="em" style="margin:0 0 8px">Qui ho ha llegit, sobre quina versió, què t'ha dit i què en fas.</p>
        ${d.lectures.length ? `<div class="cits"><table class="ctab"><thead><tr><th style="width:13%">Data</th><th style="width:15%">Qui</th><th style="width:10%">Versió</th><th>Notes rebudes</th><th style="width:26%">Què en faig</th><th style="width:34px"></th></tr></thead><tbody>${d.lectures.map((l, i) => `<tr><td><input type="date" data-l="lectures" data-i="${i}" data-f="data" value="${E(l.data || "")}" style="border:0;background:none"></td><td>${ta("lectures", i, "qui", l.qui, "Nom")}</td><td>${ta("lectures", i, "versio", l.versio, "Guió v2")}</td><td>${ta("lectures", i, "notes", l.notes, "", 2)}</td><td>${ta("lectures", i, "accio", l.accio, "", 2)}</td><td><button class="x" data-k="treu" data-l="lectures" data-i="${i}" title="Treure">×</button></td></tr>`).join("")}</tbody></table></div>` : ""}
        <button class="b2" data-k="nova" data-l="lectures" style="margin-top:8px">+ Lectura</button></div>
      <div class="card"><h3>Convocatòries i ajudes</h3><p class="em" style="margin:0 0 8px">Què demana cada una i què ja tens llest. Les plantilles són orientatives: revisa sempre les bases d'aquell any.</p>
        ${d.convs.map((c, ci) => { const fets = (c.docs || []).filter(x => x.fet).length; return `<div class="dcv"><div class="ls"><input data-cv="${ci}" data-f="nom" value="${E(c.nom || "")}" style="flex:1;font-weight:700;min-width:200px"><input type="date" data-cv="${ci}" data-f="limit" value="${E(c.limit || "")}" style="width:auto" title="Data límit"><span class="em">${fets}/${(c.docs || []).length} llestos</span><button class="x" data-k="qcv" data-i="${ci}" title="Treure">×</button></div>
          ${(c.docs || []).map((x, xi) => `<div class="ls dck"><input type="checkbox" data-k="fet" data-c="${ci}" data-i="${xi}" ${x.fet ? "checked" : ""}><input data-dc="${ci}" data-i="${xi}" value="${E(x.nom || "")}" style="flex:1;${x.fet ? "text-decoration:line-through;color:var(--mut)" : ""}"><button class="x" data-k="qdoc" data-c="${ci}" data-i="${xi}" title="Treure">×</button></div>`).join("")}
          <button class="b2" data-k="ndoc" data-c="${ci}" style="margin-top:6px">+ Document</button></div>` }).join("")}
        <div class="ls" style="margin-top:12px"><select id="dv-pl" style="width:auto">${Object.keys(PLANT).map(k => `<option>${E(k)}</option>`).join("")}${cs.map(c => `<option value="conv:${c.id}">${E(c.titulo || "")} (de Festivals)</option>`).join("")}</select><button class="b2" data-k="ncv">+ Afegir convocatòria</button></div></div>
      <div class="card"><h3>Notes de desenvolupament</h3><textarea data-dn="notes" rows="6" placeholder="Idees, dubtes, escenes que falten…">${E(d.notes || "")}</textarea></div>`;
    el.querySelectorAll(".ctab textarea").forEach(alca);
  }
  // ---------- Tractament (llargs i curts): darrera versió en PDF i el text, que es pot escriure aquí ----------
  const trs = () => d.versions.map((x, i) => [x, i]).filter(([x]) => x.tipus === "Tractament").sort((a, b) => (b[0].data || "").localeCompare(a[0].data || "") || b[1] - a[1]).map(x => x[0]);
  function tractament() {
    const l = trs(), u = l.find(x => x.arxiu);
    return `<div class="card"><h3>Tractament</h3>
      ${u ? `<div class="r" style="padding:4px 0"><i class="dot" style="background:var(--ink)"></i><a class="g" href="/api/archivo/${E(u.arxiu.id)}" target="_blank" style="color:inherit;text-decoration:none"><b>PDF ${E(u.versio || "")}</b><small>${E([u.data && H.fecha(u.data), u.pag && u.pag + " pàg.", u.arxiu.nombre].filter(Boolean).join(" · "))}</small></a></div>` : ""}
      <label style="margin-top:${u ? 10 : 0}px">Text del tractament</label><textarea data-dn="tractament" rows="${(d.tractament || "").length > 400 ? 14 : 6}" placeholder="Escriu-lo aquí o puja'n el PDF. Cada PDF queda com una versió nova a la llista de sota.">${E(d.tractament || "")}</textarea>
      <div class="ls" style="margin-top:10px"><label class="b2" style="cursor:pointer">${u ? "Pujar una versió nova (PDF o Word)" : "Pujar el tractament (PDF o Word)"}<input type="file" accept=".pdf,application/pdf,.doc,.docx,.pages" data-k="trup" hidden></label>${l.length > 1 ? `<small class="em">${l.length} versions</small>` : ""}</div></div>`;
  }
  const alca = t => { t.style.height = "auto"; t.style.height = t.scrollHeight + "px" };
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k, i = +b.dataset.i;
    if (k === "obre") return obre(b.dataset.id);
    if (!d) return;
    if (k === "torna") return lista();
    if (k === "proj") return H.abrir("proyecto", p.id);
    if (k === "nova") { d[b.dataset.l].push(b.dataset.l === "versions" ? { tipus: "Guió", data: H.today(), versio: "", canvis: "" } : { data: H.today(), qui: "", versio: "", notes: "", accio: "" }); save(); pinta() }
    if (k === "treu" && await H.confirma("Treure aquesta fila?")) { const v = d[b.dataset.l][i]; if (v && v.arxiu) H.api("DELETE", "archivo/" + v.arxiu.id).catch(() => {}); d[b.dataset.l].splice(i, 1); save(); pinta() }
    if (k === "qarx" && await H.confirma("Treure l'arxiu d'aquesta versió?")) { H.api("DELETE", "archivo/" + d.versions[i].arxiu.id).catch(() => {}); delete d.versions[i].arxiu; delete d.versions[i].pag; save(); pinta() }
    if (k === "ncv") {
      const v = document.getElementById("dv-pl").value;
      if (v.startsWith("conv:")) { const c = (await H.col("convocatoria")).find(x => x.id === v.slice(5)); d.convs.push({ nom: c.titulo || "", limit: c.limite || "", docs: PLANT["Laboratori o residència (genèric)"].map(n => ({ nom: n, fet: false })) }) }
      else d.convs.push({ nom: v === "Llista en blanc" ? "" : v, limit: "", docs: PLANT[v].map(n => ({ nom: n, fet: false })) });
      save(); pinta();
    }
    if (k === "qcv" && await H.confirma("Treure aquesta convocatòria i la seva llista?")) { d.convs.splice(i, 1); save(); pinta() }
    if (k === "ndoc") { d.convs[+b.dataset.c].docs.push({ nom: "", fet: false }); save(); await pinta(); const l = el.querySelectorAll(`[data-dc="${b.dataset.c}"]`); l.length && l[l.length - 1].focus() }
    if (k === "qdoc") { d.convs[+b.dataset.c].docs.splice(i, 1); save(); pinta() }
    if (k === "fet") { d.convs[+b.dataset.c].docs[i].fet = b.checked; save(); pinta() }
  });
  el.addEventListener("input", e => {
    const t = e.target; if (!d) return;
    if (t.dataset.l && t.dataset.f) { d[t.dataset.l][+t.dataset.i][t.dataset.f] = t.value; if (t.tagName === "TEXTAREA") alca(t); save() }
    if (t.dataset.cv) { d.convs[+t.dataset.cv][t.dataset.f] = t.value; save() }
    if (t.dataset.dc) { d.convs[+t.dataset.dc].docs[+t.dataset.i].nom = t.value; save() }
    if (t.dataset.dn) { d[t.dataset.dn] = t.value; save() }
  });
  el.addEventListener("change", async e => {
    const t = e.target; if (!d) return;
    if (t.tagName === "SELECT" && t.dataset.l) { d[t.dataset.l][+t.dataset.i][t.dataset.f] = t.value; save() }
    if ((t.dataset.k === "arx" || t.dataset.k === "trup") && t.files[0]) {
      const f = t.files[0]; t.value = ""; if (f.size > 25 * 1024 * 1024) return H.toast("Passa de 25 MB");
      H.toast("Pujant " + f.name + "…");
      // tractament nou: una versió de tipus Tractament (número del nom de l'arxiu o el següent)
      if (t.dataset.k === "trup") { const n = (f.name.match(/(?:^|[^a-z])v(?:ersi[oó]n?)?\s*\.?\s*(\d+)/i) || [])[1]; d.versions.push({ tipus: "Tractament", data: H.today(), versio: "v" + (n || trs().length + 1), canvis: "" }) }
      const v = t.dataset.k === "trup" ? d.versions[d.versions.length - 1] : d.versions[+t.dataset.i];
      try { v.arxiu = await H.api("POST", "archivo?nombre=" + encodeURIComponent(f.name), f) } catch (er) { if (t.dataset.k === "trup") d.versions.pop(); return H.toast("No s'ha pogut pujar") }
      // si és un PDF, compta les pàgines i, si és el guió, les apunta al progrés d'escriptura (Avui)
      if (/\.pdf$/i.test(f.name) || f.type === "application/pdf") {
        try { const pdfjs = await import("/vendor/pdf.min.mjs"); pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs"; v.pag = (await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise).numPages } catch (er) { }
        if (v.pag && (v.tipus || "Guió") === "Guió") {
          const es = (await H.col("ajust")).find(x => x.id === "ajust:escriptura") || { id: "ajust:escriptura", log: [] }, dia = v.data || H.today();
          es.log = (es.log || []).filter(x => !(x.proj === p.id && x.d === dia)).concat({ proj: p.id, d: dia, p: v.pag, versio: v.versio || "" }); H.put(es, 1);
        }
      }
      save(); pinta(); H.toast(v.pag ? `Pujat · ${v.pag} pàgines` : "Pujat");
      const darrera = d.versions.map((x, i) => [x, i]).filter(([x]) => (x.tipus || "Guió") === "Guió" && x.arxiu).sort((a, b) => (b[0].data || "").localeCompare(a[0].data || "") || b[1] - a[1]).map(x => x[0])[0];
      if ((v.tipus || "Guió") === "Guió" && darrera === v && window.DESG) DESG.desdePDF(f, p.id, (p.titulo || "Guió") + (v.versio ? " " + v.versio : "")).then(r => H.toast(r.d.escenes.length + " escenes desglossades")).catch(er => H.toast(er && /capçaleres/.test(er.message) ? "No he trobat les capçaleres d'escena (INT./EXT.) per desglossar-lo" : "No s'ha pogut desglossar el guió"))
    }
  });
  window.addEventListener("hub-sec", e => { if (e.detail !== "desenvolupament") return; if (p && H.pj() && p.id === H.pj()) return obre(p.id); lista() });
  window.DEV = { obre };
  if (!el.hidden) lista();
})();
