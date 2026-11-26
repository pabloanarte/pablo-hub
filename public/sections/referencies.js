// Referències: biblioteca d'imatges i vídeos de referència, reutilitzables entre projectes.
// Dins un projecte només surten les d'aquell projecte; a Projectes → Referències, tota la biblioteca.
// Doc "ref:<id>": {titulo, img, video, tipus, nom, drive:{id,url}, font (enllaç d'on surt), tags:[], proyectos:[], nota, data}
// L'original va al Drive del compte de mitjans (carpeta Referències del projecte o la de la biblioteca); el que s'hi
// pugi directament arriba sol (pont-drive.gs). Al dossier, «Triar de les referències» (MED.tria).
(() => {
  const { E } = H, el = document.getElementById("s-referencies");
  let ver = 0, tag = "", q = "", fp = "";
  const tags = d => (d.tags || []).filter(Boolean);

  async function pintar() {
    if (el.hidden) return; const v = ++ver, pid = H.pj() === "-" ? "" : H.pj();
    const [ls0, ps, dr] = await Promise.all([H.col("ref"), H.col("proyecto"), MED.drive()]); if (v !== ver) return;
    const meus = ps.filter(H.meu), pn = id => (ps.find(x => x.id === id) || {}).titulo || "";
    const base = ls0.filter(r => pid ? (r.proyectos || []).includes(pid) : !fp || (fp === "cap" ? !(r.proyectos || []).length : (r.proyectos || []).includes(fp)));
    const tg = [...new Set(base.flatMap(tags))].sort((a, b) => a.localeCompare(b));
    if (tag && !tg.includes(tag)) tag = "";
    const ls = base.filter(r => (!tag || tags(r).includes(tag)) && (!q || H.valors(r).toLowerCase().includes(q) || (r.proyectos || []).some(id => pn(id).toLowerCase().includes(q)))).sort((a, b) => (b.data || "").localeCompare(a.data || "") || (b.ord || 0) - (a.ord || 0));
    const carp = dr.connectat && (pid ? dr.carpetes && dr.carpetes[pid] && dr.carpetes[pid].refs : dr.biblioteca);
    el.innerHTML = `<div class="bar"><input class="hq" id="rfq" placeholder="Cerca…" value="${E(q)}" style="max-width:320px">${pid ? "" : `<select id="rffp" style="width:auto"><option value="">Tots els projectes</option><option value="cap" ${fp === "cap" ? "selected" : ""}>Sense projecte</option>${meus.map(p => `<option value="${p.id}" ${fp === p.id ? "selected" : ""}>${E(p.titulo || "")}</option>`).join("")}</select>`}<span style="flex:1"></span>
        ${pid ? `<button class="b2" data-fk="bib">Afegir de la biblioteca</button>` : ""}<button class="b2" data-fk="enllac">Des d'un enllaç</button><label class="b">+ Pujar<input type="file" multiple accept="image/*,video/*" id="rfup" hidden></label></div>
      ${tg.length ? `<div class="seg"><button class="t ${tag ? "" : "on"}" data-fk="tag" data-v="">Totes</button>${tg.map(t => `<button class="t ${tag === t ? "on" : ""}" data-fk="tag" data-v="${E(t)}">${E(t)}</button>`).join("")}</div>` : ""}
      <div class="mddr">${dr.connectat ? `<span><b>Drive connectat.</b> Els originals es desen ${carp ? `a <a href="${E(carp)}" target="_blank" rel="noopener">${pid ? "la carpeta Referències del projecte" : "la carpeta de la biblioteca"}</a>` : "al Drive"}; el que hi pugis directament arriba aquí sol.</span>` : `<span>Es desen aquí en versió lleugera. Per guardar els originals al Drive del segon compte, connecta'l a <a href="#" data-fk="cfg">Configuració</a>.</span>`}</div>
      ${ls.length ? `<div class="mdmas" id="rfdrop">${ls.map(r => `<div class="mdref" data-fk="veure" data-id="${r.id}">${r.img ? `<img src="${MED.url(r.img)}" alt="" loading="lazy">` : `<span class="mdnoimg">${E(r.titulo || r.nom || "")}</span>`}${r.tipus === "Vídeo" ? `<i class="mdv">▶</i>` : ""}${!pid && (r.proyectos || []).length ? `<small>${E((r.proyectos || []).map(pn).filter(Boolean).join(" · "))}</small>` : ""}</div>`).join("")}</div>`
        : `<div class="card" id="rfdrop"><p class="em" style="margin:6px 0">${base.length ? "Res amb aquest filtre." : pid ? "Encara no hi ha referències d'aquest projecte. Puja imatges, arrossega-les aquí o afegeix-ne de la biblioteca." : "La biblioteca és buida. Puja imatges o vídeos de referència, o arrossega'ls aquí."}</p></div>`}`;
    const i = el.querySelector("#rfq"); if (i && q) { i.focus(); i.setSelectionRange(q.length, q.length) }
  }

  async function puja(files) {
    const pid = H.pj() === "-" ? "" : H.pj(), fs = [...files]; let n = 0;
    for (const [i, f] of fs.entries()) {
      H.toast(`Pujant ${i + 1} de ${fs.length}…`);
      const o = await MED.puja(f, { tipus: "ref", proj: pid || fp && fp !== "cap" && fp || "", lloc: tag }); if (!o) continue;
      const pr = pid || (fp && fp !== "cap" ? fp : "");
      await H.put({ id: H.uid("ref"), titulo: f.name.replace(/\.\w+$/, ""), ...o, tags: tag ? [tag] : [], proyectos: pr ? [pr] : [] }, 1); n++;
    }
    H.toast(n ? `${n} ${n === 1 ? "referència afegida" : "referències afegides"}` : "No s'ha afegit res"); pintar();
  }

  async function veure(id) {
    const r = (await H.col("ref")).find(x => x.id === id); if (!r) return;
    const ps = (await H.col("proyecto")).filter(p => H.meu(p) || (r.proyectos || []).includes(p.id));
    const totsTags = [...new Set((await H.col("ref")).flatMap(tags))].sort();
    H.sheet(`${MED.gran(r)}
      <input class="big" data-ff="titulo" value="${E(r.titulo || "")}" placeholder="Títol" style="margin-top:12px">
      <div class="ls" style="margin-top:6px">${r.drive && r.drive.url ? `<a class="ln" href="${E(r.drive.url)}" target="_blank" rel="noopener">Original al Drive</a>` : ""}${r.img ? `<a class="ln" href="${MED.url(r.img)}" target="_blank">Obrir la imatge</a>` : ""}</div>
      <label>Etiquetes (separades per comes: llum, vestuari, color…)</label><input data-ff="tags" list="rftl" value="${E(tags(r).join(", "))}"><datalist id="rftl">${totsTags.map(t => `<option value="${E(t)}">`).join("")}</datalist>
      <label>Projectes</label><div class="seg">${ps.map(p => `<button class="t ${(r.proyectos || []).includes(p.id) ? "on" : ""}" data-fx="proj" data-v="${p.id}">${E(p.titulo || "Sense títol")}</button>`).join("")}</div>
      <label>D'on surt (pel·lícula, enllaç…)</label><div class="row"><input data-ff="font" value="${E(r.font || "")}" placeholder="p. ex. In the Mood for Love o https://…">${/^https?:/.test(r.font || "") ? `<a class="ln" href="${E(r.font)}" target="_blank" rel="noopener">Obrir</a>` : ""}</div>
      <label>Nota</label><textarea data-ff="nota" rows="3">${E(r.nota || "")}</textarea>
      <div class="sfoot"><button class="del" data-fx="del">Eliminar de la biblioteca</button><button class="b" data-k="cerrar">Fet</button></div>`, () => { const b = document.getElementById("hshc"); b.onclick = b.oninput = null; pintar() });
    const box = document.getElementById("hshc");
    box.oninput = e => { const f = e.target.dataset.ff; if (!f) return; r[f] = f === "tags" ? e.target.value.split(",").map(x => x.trim()).filter(Boolean) : e.target.value; H.put(r) };
    box.onclick = async e => {
      const b = e.target.closest("[data-fx]"); if (!b) return;
      if (b.dataset.fx === "proj") { const l = r.proyectos || [], v = b.dataset.v; r.proyectos = l.includes(v) ? l.filter(x => x !== v) : l.concat(v); b.classList.toggle("on"); await H.put(r, 1) }
      if (b.dataset.fx === "del") { const pid = H.pj(); if ((r.proyectos || []).length > 1 && pid && pid !== "-") { if (!confirm("Aquesta referència també és d'altres projectes. Treure-la només d'aquest? (Cancel·la per no fer res)")) return; r.proyectos = r.proyectos.filter(x => x !== pid); await H.put(r, 1); return H.cerrar() } if (!confirm("Eliminar aquesta referència? També s'enviarà a la paperera del Drive.")) return; MED.esborra(r); await H.del(r); H.cerrar(); H.toast("Eliminada") }
    };
  }

  async function desDEnllac() {
    const u = (prompt("Enllaç de la imatge (que acabi en .jpg, .png… o «Copiar l'adreça de la imatge»)") || "").trim(); if (!u) return;
    if (!/^https:\/\//i.test(u)) return H.toast("Ha de ser un enllaç https://");
    H.toast("Baixant la imatge…");
    try {
      const r = await fetch("/api/importar?img=" + encodeURIComponent(u)); if (!r.ok) throw 0;
      const b = await r.blob(), nom = (decodeURIComponent(u.split(/[?#]/)[0].split("/").pop() || "referencia") || "referencia").slice(0, 80);
      const f = new File([b], /\.\w{3,4}$/.test(nom) ? nom : nom + ".jpg", { type: b.type || "image/jpeg" });
      const pid = H.pj() === "-" ? "" : H.pj(), o = await MED.puja(f, { tipus: "ref", proj: pid }); if (!o) return;
      await H.put({ id: H.uid("ref"), titulo: f.name.replace(/\.\w+$/, ""), ...o, font: u, tags: tag ? [tag] : [], proyectos: pid ? [pid] : fp && fp !== "cap" ? [fp] : [] }, 1); H.toast("Afegida"); pintar();
    } catch (e) { H.toast("No he pogut baixar aquesta imatge. Desa-la i puja-la.") }
  }

  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-fk]"); if (!b) return; if (b.tagName === "A") e.preventDefault();
    const k = b.dataset.fk;
    if (k === "cfg") return hubShow("ajustos");
    if (k === "tag") { tag = b.dataset.v; return pintar() }
    if (k === "veure") return veure(b.dataset.id);
    if (k === "enllac") return desDEnllac();
    if (k === "bib") {
      const pid = H.pj(), ids = await MED.tria({ multi: 1 }); if (!ids.length) return;
      const ls = await H.col("ref"); let n = 0;
      for (const r of ls) if (ids.includes(r.img) && !(r.proyectos || []).includes(pid)) { r.proyectos = (r.proyectos || []).concat(pid); await H.put(r, 1); n++ }
      H.toast(n ? n + (n === 1 ? " referència afegida al projecte" : " referències afegides al projecte") : "Ja hi eren"); pintar();
    }
  });
  el.addEventListener("input", e => { if (e.target.id === "rfq") { q = e.target.value.toLowerCase(); pintar() } });
  el.addEventListener("change", e => { const t = e.target; if (t.id === "rfup" && t.files.length) { const fs = [...t.files]; t.value = ""; puja(fs) } if (t.id === "rffp") { fp = t.value; pintar() } });
  el.addEventListener("dragover", e => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); el.classList.add("drop") } });
  el.addEventListener("dragleave", e => { if (!el.contains(e.relatedTarget)) el.classList.remove("drop") });
  el.addEventListener("drop", e => { if (!e.dataTransfer.files.length) return; e.preventDefault(); el.classList.remove("drop"); puja(e.dataTransfer.files) });
  H.onChange(() => { if (!el.hidden && !el.contains(document.activeElement)) pintar() });
  window.addEventListener("hub-sec", e => { if (e.detail === "referencies") { if (H.pj()) fp = ""; pintar() } });
})();
