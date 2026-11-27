// Referències: biblioteca d'imatges i vídeos de referència, reutilitzables entre projectes.
// Dins un projecte només surten les d'aquell projecte; a Projectes → Referències, tota la biblioteca.
// Doc "ref:<id>": {titulo, img, video, tipus, nom, drive:{id,url}, font (enllaç d'on surt), tags:[], proyectos:[], nota, data}
// Referències d'enllaç (Drive, YouTube, Vimeo o qualsevol web): {url, plat: YouTube/Vimeo/Drive/Web, img = miniatura si n'hi ha}.
// YouTube i Vimeo es reprodueixen a la fitxa; la resta s'obren a part.
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
        ${pid ? `<button class="b2" data-fk="bib">Afegir de la biblioteca</button>` : ""}<button class="b2" data-fk="enllac">+ Enllaç</button><label class="b">+ Pujar<input type="file" multiple accept="image/*,video/*" id="rfup" hidden></label></div>
      ${tg.length ? `<div class="seg"><button class="t ${tag ? "" : "on"}" data-fk="tag" data-v="">Totes</button>${tg.map(t => `<button class="t ${tag === t ? "on" : ""}" data-fk="tag" data-v="${E(t)}">${E(t)}</button>`).join("")}</div>` : ""}
      <div class="mddr">${dr.connectat ? `<span><b>Drive connectat.</b> Els originals es desen ${carp ? `a <a href="${E(carp)}" target="_blank" rel="noopener">${pid ? "la carpeta Referències del projecte" : "la carpeta de la biblioteca"}</a>` : "al Drive"}; el que hi pugis directament arriba aquí sol.</span>` : `<span>Es desen aquí en versió lleugera. Per guardar els originals al Drive del segon compte, connecta'l a <a href="#" data-fk="cfg">Configuració</a>.</span>`}</div>
      ${ls.length ? `<div class="mdmas" id="rfdrop">${ls.map(r => `<div class="mdref" data-fk="veure" data-id="${r.id}">${r.img ? `<img src="${MED.url(r.img)}" alt="" loading="lazy">` : r.url && (H.video(r.url) || {}).thumb ? `<img src="${E(H.video(r.url).thumb)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=mdlnk><b>'+this.dataset.t+'</b>YouTube</span>'" data-t="${E(E(r.titulo || ""))}">` : r.url ? `<span class="mdnoimg mdlnk"><b>${E(r.titulo || "")}</b>${E((() => { try { return new URL(r.url).hostname.replace(/^www\./, "") } catch (e) { return "" } })())}</span>` : `<span class="mdnoimg">${E(r.titulo || r.nom || "")}</span>`}${r.url ? `<i class="mdv">${r.plat === "YouTube" || r.plat === "Vimeo" ? "▶ " : "↗ "}${E(r.plat || "Enllaç")}</i>` : r.tipus === "Vídeo" ? `<i class="mdv">▶</i>` : ""}${!pid && (r.proyectos || []).length ? `<small>${E((r.proyectos || []).map(pn).filter(Boolean).join(" · "))}</small>` : ""}</div>`).join("")}</div>`
        : `<div class="card" id="rfdrop"><p class="em" style="margin:6px 0">${base.length ? "Res amb aquest filtre." : pid ? "Encara no hi ha referències d'aquest projecte. Puja imatges, arrossega-les aquí, enganxa un enllaç (Drive, YouTube, Vimeo, una web…) o afegeix-ne de la biblioteca." : "La biblioteca és buida. Puja imatges o vídeos de referència, arrossega'ls aquí o enganxa'n l'enllaç."}</p></div>`}`;
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
    const vd = r.url && H.video(r.url);
    const cap = vd ? `<div class="dvp" data-fx="play" data-e="${E(vd.embed)}">${r.img ? `<img src="${MED.url(r.img)}" alt="">` : ""}<span><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="#fff"/></svg></span></div>`
      : r.url ? `${r.img ? `<a href="${E(r.url)}" target="_blank" rel="noopener">${MED.gran(r)}</a>` : ""}<a class="b" href="${E(r.url)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;text-decoration:none">Obrir ${r.plat === "Drive" ? "al Drive" : "l'enllaç"} ↗</a>` : MED.gran(r);
    H.sheet(`${cap}
      <input class="big" data-ff="titulo" value="${E(r.titulo || "")}" placeholder="Títol" style="margin-top:12px">
      ${r.url ? `<label>Enllaç</label><div class="row"><input data-ff="url" value="${E(r.url)}"><a class="ln" href="${E(r.url)}" target="_blank" rel="noopener">Obrir</a></div>` : ""}
      <div class="ls" style="margin-top:6px">${r.drive && r.drive.url ? `<a class="ln" href="${E(r.drive.url)}" target="_blank" rel="noopener">Original al Drive</a>` : ""}${r.img && !r.url ? `<a class="ln" href="${MED.url(r.img)}" target="_blank">Obrir la imatge</a>` : ""}</div>
      <label>Etiquetes (separades per comes: llum, vestuari, color…)</label><input data-ff="tags" list="rftl" value="${E(tags(r).join(", "))}"><datalist id="rftl">${totsTags.map(t => `<option value="${E(t)}">`).join("")}</datalist>
      <label>Projectes</label><div class="seg">${ps.map(p => `<button class="t ${(r.proyectos || []).includes(p.id) ? "on" : ""}" data-fx="proj" data-v="${p.id}">${E(p.titulo || "Sense títol")}</button>`).join("")}</div>
      ${r.url ? "" : `<label>D'on surt (pel·lícula, enllaç…)</label><div class="row"><input data-ff="font" value="${E(r.font || "")}" placeholder="p. ex. In the Mood for Love o https://…">${/^https?:/.test(r.font || "") ? `<a class="ln" href="${E(r.font)}" target="_blank" rel="noopener">Obrir</a>` : ""}</div>`}
      <label>Nota</label><textarea data-ff="nota" rows="3">${E(r.nota || "")}</textarea>
      <div class="sfoot"><button class="del" data-fx="del">Eliminar de la biblioteca</button><button class="b" data-k="cerrar">Fet</button></div>`, () => { const b = document.getElementById("hshc"); b.onclick = b.oninput = null; pintar() });
    const box = document.getElementById("hshc");
    box.oninput = e => { const f = e.target.dataset.ff; if (!f) return; r[f] = f === "tags" ? e.target.value.split(",").map(x => x.trim()).filter(Boolean) : e.target.value; H.put(r) };
    box.onclick = async e => {
      const b = e.target.closest("[data-fx]"); if (!b) return;
      if (b.dataset.fx === "play") { b.classList.add("dvf"); b.removeAttribute("data-fx"); b.innerHTML = `<iframe src="${E(b.dataset.e)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`; return }
      if (b.dataset.fx === "proj") { const l = r.proyectos || [], v = b.dataset.v; r.proyectos = l.includes(v) ? l.filter(x => x !== v) : l.concat(v); b.classList.toggle("on"); await H.put(r, 1) }
      if (b.dataset.fx === "del") { const pid = H.pj(); if ((r.proyectos || []).length > 1 && pid && pid !== "-") { if (!await H.confirma("Aquesta referència també és d'altres projectes. Treure-la només d'aquest?", { ok: "Treure-la d'aquest" })) return; r.proyectos = r.proyectos.filter(x => x !== pid); await H.put(r, 1); return H.cerrar() } if (!await H.confirma("Eliminar aquesta referència? També s'enviarà a la paperera del Drive.")) return; MED.esborra(r); await H.del(r); H.cerrar(); H.toast("Eliminada") }
    };
  }

  // Afegir des d'un enllaç: una imatge (es baixa com abans), YouTube/Vimeo (títol i miniatura), Drive o qualsevol web
  async function desDEnllac(u) {
    u = (u || await H.pregunta("Enganxa l'enllaç. Drive, YouTube, Vimeo, una imatge o qualsevol web.") || "").trim(); if (!u) return;
    if (!/^https?:\/\//i.test(u)) { if (/^[\w-]+(\.[\w-]+)+\//.test(u)) u = "https://" + u; else return H.toast("Ha de ser un enllaç (https://…)") }
    const pid = H.pj() === "-" ? "" : H.pj(), proyectos = pid ? [pid] : fp && fp !== "cap" ? [fp] : [], tags0 = tag ? [tag] : [];
    // el mateix arxiu o vídeo encara que l'enllaç canviï una mica (?usp=sharing, youtu.be…)
    const clau = x => { x = String(x || ""); const v = H.video(x), d = (x.match(/(?:drive|docs)\.google\.com\/.*?(?:\/d\/|[?&]id=)([\w-]{20,})/) || [])[1]; return v ? v.pl + ":" + v.id : d ? "drive:" + d : x.replace(/#.*$/, "").replace(/[?&](utm_\w+|usp|igsh|si|fbclid)=[^&]*/g, "").replace(/\/+$/, "").replace(/^https?:\/\/(www\.)?/i, "").toLowerCase() };
    const ja = (await H.col("ref")).find(x => (x.url || x.font) && clau(x.url || x.font) === clau(u));
    if (ja) { if (proyectos[0] && !(ja.proyectos || []).includes(proyectos[0])) { ja.proyectos = (ja.proyectos || []).concat(proyectos[0]); await H.put(ja, 1); H.toast("Ja era a la biblioteca: afegida al projecte") } else H.toast("Aquest enllaç ja hi és"); return pintar() }
    H.toast("Llegint l'enllaç…");
    const vd = H.video(u); let m = {};
    try { m = await H.api("GET", "oembed?tot=1&url=" + encodeURIComponent(u)) } catch (e) { if (e && e.offline) return H.toast("Sense connexió: per afegir enllaços cal internet") }
    // és una imatge directa: es baixa i es desa com les pujades (amb l'original al Drive si n'hi ha)
    if (!vd && m.imatge) try {
      const r = await fetch("/api/importar?img=" + encodeURIComponent(u)); if (!r.ok) throw 0;
      const bl = await r.blob(), nom = (decodeURIComponent(u.split(/[?#]/)[0].split("/").pop() || "referencia") || "referencia").slice(0, 80);
      const f = new File([bl], /\.\w{3,4}$/.test(nom) ? nom : nom + ".jpg", { type: bl.type || "image/jpeg" }), o = await MED.puja(f, { tipus: "ref", proj: pid }); if (!o) return;
      await H.put({ id: H.uid("ref"), titulo: f.name.replace(/\.\w+$/, ""), ...o, font: u, tags: tags0, proyectos }, 1); H.toast("Afegida"); return pintar();
    } catch (e) { }
    const plat = vd ? vd.pl : m.plat || (/drive\.google|docs\.google/.test(u) ? "Drive" : "Web");
    let titol = m.titol || "", img = "", host = ""; try { host = new URL(u).hostname.replace(/^www\./, "") } catch (e) { }
    const th = m.thumb || (vd && vd.thumb) || "";
    if (th) try { // miniatura: només al hub (no cal al Drive)
      const r = await fetch("/api/importar?img=" + encodeURIComponent(th)); if (!r.ok) throw 0;
      const bl = await r.blob(); let x = null; try { x = await MED.redueix(new File([bl], "m.jpg", { type: bl.type })) } catch (e) { }
      img = (await H.api("POST", "archivo?nombre=" + encodeURIComponent("miniatura.jpg"), new File([x ? x.blob : bl], "miniatura.jpg", { type: "image/jpeg" }))).id;
    } catch (e) { }
    await H.put({ id: H.uid("ref"), titulo: titol || (plat === "Drive" ? "Arxiu del Drive" : host || "Enllaç"), url: u, plat, tipus: vd ? "Vídeo" : "Enllaç", ...(img ? { img } : {}), data: H.today(), tags: tags0, proyectos }, 1);
    H.toast(plat === "Drive" && !img ? "Afegida (si l'arxiu del Drive és privat, no se'n veu la miniatura)" : "Afegida"); pintar();
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
  document.addEventListener("paste", e => { if (el.hidden || !document.getElementById("hsh").hidden || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || "") || (document.activeElement || {}).isContentEditable) return; const t = (e.clipboardData && e.clipboardData.getData("text") || "").trim(); if (/^https?:\/\/\S+$/i.test(t)) { e.preventDefault(); desDEnllac(t) } });
  el.addEventListener("input", e => { if (e.target.id === "rfq") { q = e.target.value.toLowerCase(); pintar() } });
  el.addEventListener("change", e => { const t = e.target; if (t.id === "rfup" && t.files.length) { const fs = [...t.files]; t.value = ""; puja(fs) } if (t.id === "rffp") { fp = t.value; pintar() } });
  el.addEventListener("dragover", e => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); el.classList.add("drop") } });
  el.addEventListener("dragleave", e => { if (!el.contains(e.relatedTarget)) el.classList.remove("drop") });
  el.addEventListener("drop", e => { if (!e.dataTransfer.files.length) return; e.preventDefault(); el.classList.remove("drop"); puja(e.dataTransfer.files) });
  H.onChange(() => { if (!el.hidden && !el.contains(document.activeElement)) pintar() });
  window.addEventListener("hub-sec", e => { if (e.detail === "referencies") { if (H.pj()) fp = ""; pintar() } });
})();
