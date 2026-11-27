// Recce (localitzacions tècniques) d'un projecte: fotos, vídeos i fotos del visor (ArriCam/Artemis) per localització.
// Doc "recce:<id del projecte>": {proyecto, llocs:[{id, nom, adreca, notes, items:[{id, img, video, tipus, nom, nota, optica, data, drive:{id,url}, gt:[{gt, pla}]}]}]}
// Les fotos que es pugen a la carpeta del Drive del projecte (Recce/<localització>) arriben soles (pont-drive.gs).
// Des de cada foto: «Posar al guió tècnic» (imatge d'un pla).
(() => {
  const { E } = H, el = document.getElementById("s-recce"), uid = () => Math.random().toString(36).slice(2, 9);
  const TIPUS = ["Foto", "Vídeo", "Visor"];
  let ver = 0;
  const idDe = pid => "recce:" + pid.split(":")[1];
  async function doc(crea) {
    const pid = H.pj(); if (!pid || pid === "-") return null;
    let d = (await H.col("recce")).find(x => x.id === idDe(pid));
    if (!d && crea) { d = { id: idDe(pid), proyecto: pid, llocs: [] }; await H.put(d, 1) }
    return d;
  }
  const lloc = (d, id) => (d.llocs || []).find(l => l.id === id);
  const neteja = () => { const b = document.getElementById("hshc"); b.onclick = b.oninput = b.onchange = null };
  const item = (d, id) => { for (const l of d.llocs || []) { const x = (l.items || []).find(y => y.id === id); if (x) return [x, l] } return [] };

  async function pintar() {
    if (el.hidden) return; const v = ++ver, pid = H.pj();
    if (!pid || pid === "-") { el.innerHTML = `<p class="em">Obre un projecte per veure'n el recce.</p>`; return }
    const [d, dr, p, gts] = await Promise.all([doc(), MED.drive(), H.col("proyecto").then(l => l.find(x => x.id === pid)), H.col("gt")]); if (v !== ver) return;
    const alGTimg = new Set(gts.filter(g => g.proyecto === pid).flatMap(g => g.escenas.flatMap(e => e.planos.map(q => q.img))).filter(Boolean));
    const ls = (d && d.llocs) || [], n = ls.reduce((a, l) => a + (l.items || []).length, 0);
    const carp = dr.connectat && dr.carpetes && dr.carpetes[pid] && dr.carpetes[pid].recce;
    el.innerHTML = `<div class="bar"><span class="em" style="margin:0">${n ? `${ls.length} ${ls.length === 1 ? "localització" : "localitzacions"} · ${n} ${n === 1 ? "arxiu" : "arxius"}` : "Fotos, vídeos i fotos del visor de les localitzacions tècniques."}</span><span style="flex:1"></span><button class="b" data-rk="noulloc">+ Localització</button></div>
      <div class="mddr">${dr.connectat ? `<span><b>Drive connectat.</b> El que pugis a ${carp ? `<a href="${E(carp)}" target="_blank" rel="noopener">la carpeta Recce de ${E(p ? p.titulo : "")}</a>` : "la carpeta Recce del projecte"} (una subcarpeta per localització; dins, una carpeta «Visor» per a les fotos d'ArriCam) arriba aquí sol cada 10 minuts.</span><button class="b2" data-rk="sync">Sincronitzar ara</button>` : `<span>Les fotos es desen aquí en versió lleugera. Per guardar els originals al Drive i que les fotos del mòbil arribin soles, connecta el Drive a <a href="#" data-rk="cfg">Configuració</a>.</span>`}</div>
      ${ls.length ? ls.map(l => `<div class="card mdll" data-lloc="${l.id}"><div class="mdlh"><input class="mdnom" data-rf="nom" data-l="${l.id}" value="${E(l.nom || "")}" placeholder="Nom de la localització"><span class="em" style="margin:0">${(l.items || []).length || ""}</span>
          <label class="b2">+ Fotos i vídeos<input type="file" multiple accept="image/*,video/*" data-rup="${l.id}" hidden></label><label class="b2">+ Visor<input type="file" multiple accept="image/*" data-rup="${l.id}" data-visor="1" hidden></label><button class="x" data-rk="dellloc" data-l="${l.id}" title="Eliminar la localització" aria-label="Eliminar la localització">×</button></div>
          <div class="row mdad"><input data-rf="adreca" data-l="${l.id}" value="${E(l.adreca || "")}" placeholder="Adreça o enllaç de Maps">${l.adreca ? `<a class="ln" target="_blank" rel="noopener" href="${E(/^https?:/.test(l.adreca) ? l.adreca : "https://maps.google.com/?q=" + encodeURIComponent(l.adreca))}">Mapa</a>` : ""}</div>
          <textarea data-rf="notes" data-l="${l.id}" rows="2" placeholder="Notes: llum, horaris, permisos, endolls, so…">${E(l.notes || "")}</textarea>
          ${(l.items || []).length ? `<div class="mdgr">${l.items.map(x => `<div class="mdit" data-rk="veure" data-id="${x.id}">${alGTimg.has(x.img) ? MED.mini(x).replace(/<\/div>$/, `<i class="mdgt2" title="És al guió tècnic">GT</i></div>`) : MED.mini(x)}${x.nota || x.optica ? `<small>${E([x.optica, x.nota].filter(Boolean).join(" · "))}</small>` : ""}</div>`).join("")}</div>` : `<p class="em mddrop">Arrossega aquí fotos o vídeos, o fes servir els botons.</p>`}</div>`).join("")
        : `<div class="card"><p class="em" style="margin:6px 0">Encara no hi ha cap localització. Crea'n una i puja-hi les fotos del recce${dr.connectat ? ", o puja-les al Drive" : ""}.</p></div>`}`;
  }

  async function puja(lid, files, visor) {
    const d = await doc(1), l = lloc(d, lid); if (!l) return;
    const fs = [...files]; let n = 0;
    for (const [i, f] of fs.entries()) {
      H.toast(`Pujant ${i + 1} de ${fs.length}…`);
      if (!l.carpeta) l.carpeta = (l.nom || "").trim() || "Localització " + (d.llocs.indexOf(l) + 1); // carpeta del Drive: es queda amb aquest nom encara que la localització canviï de nom
      const o = await MED.puja(f, { tipus: "recce", proj: d.proyecto, lloc: l.carpeta + (visor ? "/Visor" : "") });
      if (!o) continue;
      if (visor || /artemis|arricam|arri.?cam|viewfinder/i.test(f.name)) o.tipus = o.tipus === "Vídeo" ? "Vídeo" : "Visor";
      l.items = (l.items || []).concat({ id: uid(), ...o }); n++;
      await H.put(d, 1);
    }
    H.toast(n ? `${n} ${n === 1 ? "arxiu pujat" : "arxius pujats"}` : "No s'ha pujat res"); pintar();
  }

  // ---------- fitxa d'una foto ----------
  async function veure(id) {
    const d = await doc(); if (!d) return; const [x, l] = item(d, id); if (!x) return;
    const gts = (await H.col("gt")).filter(g => g.proyecto === d.proyecto);
    const on = (x.gt || []).map(r => { const g = gts.find(y => y.id === r.gt), pl = g && g.escenas.flatMap(e => e.planos.map(p => [e, p])).find(([, p]) => p.id === r.pla); return g && pl ? `<span class="chip">${E(g.titulo || "Guió tècnic")} · esc. ${E(pl[0].num || "")} · pla ${E(pl[1].num || "")}</span>` : "" }).join("");
    const altres = d.llocs.filter(y => y !== l);
    H.sheet(`${MED.gran(x)}
      <div class="ls" style="margin-top:10px">${x.drive && x.drive.url ? `<a class="ln" href="${E(x.drive.url)}" target="_blank" rel="noopener">Original al Drive</a>` : ""}${x.img ? `<a class="ln" href="${MED.url(x.img)}" target="_blank">Obrir la imatge</a>` : ""}<span class="em" style="margin:0">${E([x.nom, x.data && H.fecha(x.data)].filter(Boolean).join(" · "))}</span></div>
      <label>Tipus</label><div class="seg">${TIPUS.map(t => `<button class="t ${x.tipus === t ? "on" : ""}" data-rx="tipus" data-v="${t}">${t}</button>`).join("")}</div>
      <label>Òptica o focal (opcional)</label><input data-rxf="optica" value="${E(x.optica || "")}" placeholder="p. ex. 35 mm">
      <label>Nota</label><textarea data-rxf="nota" rows="3" placeholder="Què hi veus: enquadrament, pla, idea…">${E(x.nota || "")}</textarea>
      <h2>Al guió tècnic</h2>${on ? `<div class="ls">${on}</div>` : ""}
      ${gts.length ? `<button class="b2" data-rx="agt" style="margin-top:6px">${on ? "Posar-la en un altre pla" : "Posar al guió tècnic"}</button>` : `<p class="em" style="margin:6px 0">Aquest projecte encara no té guió tècnic.</p>`}
      ${altres.length ? `<label>Moure a una altra localització</label><select data-rx="mou"><option value="">—</option>${altres.map(y => `<option value="${y.id}">${E(y.nom || "Sense nom")}</option>`).join("")}</select>` : ""}
      <div class="sfoot"><button class="del" data-rx="del">Eliminar</button><button class="b" data-k="cerrar">Fet</button></div>`, () => { neteja(); pintar() });
    const box = document.getElementById("hshc");
    box.onclick = async e => {
      const b = e.target.closest("[data-rx]"); if (!b || b.tagName === "SELECT") return;
      if (b.dataset.rx === "tipus") { x.tipus = b.dataset.v; await H.put(d, 1); box.querySelectorAll('[data-rx="tipus"]').forEach(y => y.classList.toggle("on", y === b)) }
      if (b.dataset.rx === "del") { if (!await H.confirma((x.gt || []).length ? "Aquesta foto és al guió tècnic: també se'n traurà. Eliminar-la? (També s'enviarà a la paperera del Drive.)" : "Eliminar aquesta foto? També s'enviarà a la paperera del Drive.")) return; await treuDelGT(x); MED.esborra(x); if (x.drive && x.drive.id) d.esborrats = (d.esborrats || []).concat(x.drive.id).slice(-500); l.items = l.items.filter(y => y !== x); await H.put(d, 1); box.onclick = null; H.cerrar() }
      if (b.dataset.rx === "agt") { box.onclick = null; alGT(d, x) }
    };
    box.oninput = e => { const f = e.target.dataset.rxf; if (f) { x[f] = e.target.value; H.put(d) } };
    box.onchange = async e => { if (e.target.dataset.rx === "mou" && e.target.value) { const y = lloc(d, e.target.value); l.items = l.items.filter(z => z !== x); y.items = (y.items || []).concat(x); await H.put(d, 1); box.onclick = null; H.cerrar(); H.toast("Mogut a " + (y.nom || "l'altra localització")) } };
  }

  // treure una foto dels plans del guió tècnic on s'havia posat (abans d'esborrar-la)
  async function treuDelGT(x) {
    if (!x.img) return;
    for (const g of await H.col("gt")) { let c = false; g.escenas.forEach(e => e.planos.forEach(p => { if (p.img === x.img) { delete p.img; delete p.imgRecce; c = true } })); if (c) await H.put(g, 1) }
  }
  // ---------- posar una foto en un pla del guió tècnic ----------
  async function alGT(d, x) {
    const gts = (await H.col("gt")).filter(g => g.proyecto === d.proyecto); let gi = 0;
    const pinta = () => { const g = gts[gi];
      H.sheet(`<h2 style="margin-top:0;font-size:20px;color:var(--ink);text-transform:none;letter-spacing:0">A quin pla va?</h2>
        <div class="ls">${x.img ? `<img src="${MED.url(x.img)}" alt="" style="height:70px;border-radius:6px">` : ""}</div>
        ${gts.length > 1 ? `<label>Guió tècnic</label><select data-gx="gt">${gts.map((y, i) => `<option value="${i}" ${i === gi ? "selected" : ""}>${E(y.titulo || "Sense títol")}</option>`).join("")}</select>` : ""}
        ${g.escenas.map(e => `<h2>Escena ${E(e.num || "")} ${E([e.intext, e.lugar].filter(Boolean).join(". "))}</h2>${e.planos.map(p => `<div class="r" data-gx="pla" data-id="${p.id}"><span class="chip" style="margin:0;padding:3px 10px">${E(p.num || "")}</span><div class="g"><b>${E([p.escala, p.descripcion || p.desc].filter(Boolean).join(" · ") || "Pla " + (p.num || ""))}</b>${p.img ? `<small>Ja té imatge: se substituirà</small>` : ""}</div>${p.img ? `<img src="${MED.url(p.img)}" alt="" style="height:40px;border-radius:4px">` : ""}</div>`).join("")}`).join("")}`, () => { neteja(); pintar() });
    };
    pinta();
    const box = document.getElementById("hshc");
    box.onchange = e => { if (e.target.dataset.gx === "gt") { gi = +e.target.value; pinta() } };
    box.onclick = async e => {
      const r = e.target.closest('[data-gx="pla"]'); if (!r) return;
      const g = gts[gi], p = g.escenas.flatMap(e => e.planos).find(y => y.id === r.dataset.id); if (!p || !x.img) return;
      if (p.img && !p.imgRecce && !p.imgSb && !await H.confirma("Aquest pla ja té una imatge. Substituir-la?")) return;
      p.img = x.img; p.imgRecce = 1; delete p.imgSb; g.ocultas = (g.ocultas || []).filter(c => c !== "img"); await H.put(g, 1);
      x.gt = (x.gt || []).filter(y => y.pla !== p.id).concat({ gt: g.id, pla: p.id }); await H.put(d, 1);
      box.onclick = box.onchange = null; H.cerrar(); H.toast("Posada al pla " + (p.num || ""));
    };
  }

  // ---------- esdeveniments ----------
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-rk]"); if (!b) return; if (b.tagName === "A") e.preventDefault();
    const k = b.dataset.rk;
    if (k === "cfg") return hubShow("ajustos");
    if (k === "veure") return veure(b.dataset.id);
    if (k === "sync") { b.disabled = true; b.textContent = "Sincronitzant…"; try { const r = await H.api("POST", "drive/sincronitza", {}); H.toast(r.nous ? r.nous + (r.nous === 1 ? " arxiu nou" : " arxius nous") : "Tot al dia") } catch (er) { H.toast(er && er.error ? "Drive: " + er.error : "No s'ha pogut sincronitzar") } await H.col("recce", true); return pintar() }
    const d = await doc(1);
    if (k === "noulloc") { d.llocs = (d.llocs || []).concat({ id: uid(), nom: "", items: [] }); await H.put(d, 1); await pintar(); const i = el.querySelector(".mdll:last-of-type .mdnom"); i && i.focus(); return }
    if (k === "dellloc") { const l = lloc(d, b.dataset.l); if ((l.items || []).length && !await H.confirma(`Eliminar «${l.nom || "aquesta localització"}» i els seus ${l.items.length} arxius? Els originals aniran a la paperera del Drive.`)) return; d.esborrats = (d.esborrats || []).concat((l.items || []).map(x => x.drive && x.drive.id).filter(Boolean)).slice(-500); for (const x of l.items || []) { await treuDelGT(x); MED.esborra(x) } d.llocs = d.llocs.filter(y => y !== l); await H.put(d, 1); return pintar() }
  });
  el.addEventListener("input", async e => { const f = e.target.dataset.rf; if (!f) return; const d = await doc(1), l = lloc(d, e.target.dataset.l); if (l) { l[f] = e.target.value; H.put(d) } });
  el.addEventListener("change", e => { const t = e.target; if (t.dataset.rup && t.files.length) { const fs = [...t.files]; t.value = ""; puja(t.dataset.rup, fs, !!t.dataset.visor) } if (t.dataset.rf === "adreca") pintar() });
  // arrossegar fotos a una localització
  el.addEventListener("dragover", e => { const c = e.target.closest(".mdll"); if (c && e.dataTransfer.types.includes("Files")) { e.preventDefault(); c.classList.add("drop") } });
  el.addEventListener("dragleave", e => { const c = e.target.closest(".mdll"); if (c && !c.contains(e.relatedTarget)) c.classList.remove("drop") });
  el.addEventListener("drop", e => { const c = e.target.closest(".mdll"); if (!c || !e.dataTransfer.files.length) return; e.preventDefault(); c.classList.remove("drop"); puja(c.dataset.lloc, e.dataTransfer.files, false) });
  H.onChange(() => { if (!el.hidden && !el.contains(document.activeElement)) pintar() });
  window.addEventListener("hub-sec", e => { if (e.detail === "recce") H.col("recce", true).catch(() => { }).then(pintar) });
})();
