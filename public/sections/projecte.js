// Pàgina d'un projecte (Projectes → pòster): pestanyes Resum, Equip i Arxius. La resta de pestanyes són les
// seccions de sempre (Desenvolupament, Dossiers, Preproducció…) filtrades pel projecte obert (H.pj()).
(() => {
  const el = document.getElementById("s-projecte"), E = H.E;
  let ver = 0;
  const avui = () => H.today();
  const vaA = pt => window.HUB && HUB.obreProjecte(H.pj(), pt);

  async function pintar() {
    const pid = H.pj(); if (!pid || pid === "-" || el.hidden) return;
    const v = ++ver, mode = window.HUB ? HUB.mode() : "resum";
    const p = (await H.col("proyecto")).find(x => x.id === pid); if (v !== ver) return;
    if (!p) { el.innerHTML = `<p class="em">Aquest projecte ja no existeix.</p>`; return }
    if (mode === "equip") return equip(p, v);
    if (mode === "arxius") return arxius(p, v);
    return resum(p, v);
  }

  // ---------- Resum ----------
  async function resum(p, v) {
    const [ts, rs, fs, pre, post, pdr, dks, devs, gts, ds, pers] = await Promise.all(["tarea", "reunion", "convocatoria", "pre", "post", "pdr", "deck", "dev", "gt", "desg", "persona"].map(t => H.col(t)));
    if (v !== ver) return;
    const de = l => l.filter(x => x.proyecto === p.id), hoy = avui(), lim = H.addDays(hoy, 60);
    const dates = [];
    de(ts).filter(x => !x.hecha && x.fecha).forEach(x => dates.push([x.fecha, "Tasca", x.titulo]));
    de(rs).filter(x => x.fecha >= hoy).forEach(x => dates.push([x.fecha, "Reunió", x.titulo + (x.hora ? " · " + x.hora : "")]));
    de(fs).forEach(x => { if ((!x.estado || x.estado === "Per presentar") && x.limite >= hoy) dates.push([x.limite, "Límit", x.titulo]); if (x.evento >= hoy && ["Seleccionat", "Presentat"].includes(x.estado)) dates.push([x.evento, "Festival", x.titulo]) });
    de(pre).concat(de(post)).filter(x => x.ini >= hoy).forEach(x => dates.push([x.ini, x.hito ? "Fita" : "Calendari", x.titulo]));
    de(pdr).forEach(x => (x.dias || []).forEach((d, i) => d.fecha >= hoy && dates.push([d.fecha, "Rodatge", `${x.titulo || "Pla"} · jornada ${i + 1}`])));
    const prop = dates.filter(d => d[0] <= lim || d[1] === "Tasca").sort((a, b) => a[0].localeCompare(b[0])).slice(0, 8);
    const fp = de(fs), sel = fp.filter(x => x.estado === "Seleccionat"), prem = sel.filter(x => x.premi), pend = fp.filter(x => x.estado === "Presentat");
    const dev = devs.find(x => x.id === "dev:" + p.id.split(":")[1]) || {}, vers = (dev.versions || []).slice().sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    const gt = de(gts), plans = de(pdr), jorn = plans.reduce((a, x) => a + (x.dias || []).length, 0);
    const eq = (p.equip || []).filter(x => pers.some(y => y.id === x.id));
    const targ = (pt, t, n, s) => `<div class="card prs" data-pt="${pt}" style="cursor:pointer"><h3>${t}</h3><div class="pn">${n}</div><small class="em">${E(s || "")}</small></div>`;
    const img = p.poster && p.poster[0] ? `/api/archivo/${p.poster[0].id}` : "";
    el.innerHTML = `<div class="prcap">
        <div class="prpos" data-k="edita" title="Editar la fitxa">${img ? `<img src="${img}" alt="">` : `<span>${E(p.titulo || "Sense títol")}</span>`}</div>
        <div style="min-width:0;flex:1">
          ${p.logline ? `<p class="prlog">${E(p.logline)}</p>` : `<p class="em">Encara no té logline.</p>`}
          <div class="ls" style="margin:10px 0 0">${[p.categoria, p.rol, p.estado, p.anio].filter(Boolean).map(x => `<span class="chip">${E(x)}</span>`).join("")}</div>
          <div class="ls" style="margin-top:14px"><button class="b" data-k="edita">Editar la fitxa</button>${(p.altres || "").trim() ? `<span class="em">També: ${E(p.altres)}</span>` : ""}</div>
        </div></div>
      <div class="dash" style="margin-top:20px">
        <div class="card w2"><h3>Properes dates</h3>${prop.length ? prop.map(d => `<div class="m pdt"><b>${E(H.fecha(d[0]))}</b><span><span class="em">${E(d[1])}</span> · ${E(d[2] || "")}</span></div>`).join("") : `<p class="em">Res als propers dos mesos.</p>`}</div>
        ${targ("festivales", "Festivals", fp.length, fp.length ? `${sel.length} ${sel.length === 1 ? "selecció" : "seleccions"}${prem.length ? ` · ${prem.length} ${prem.length === 1 ? "premi" : "premis"}` : ""}${pend.length ? ` · ${pend.length} sense decidir` : ""}` : "Encara cap inscripció")}
        ${["Llarg", "Curt"].includes(p.categoria) ? targ("desenvolupament", "Desenvolupament", vers.length, vers[0] ? `última: ${[vers[0].tipus, vers[0].versio].filter(Boolean).join(" ")}${vers[0].data ? " · " + H.fecha(vers[0].data) : ""}` : "Cap versió apuntada") : ""}
        ${targ("decks", "Dossiers", de(dks).length, de(dks).map(x => x.titulo).filter(Boolean).slice(0, 2).join(", ") || "Cap dossier encara")}
        ${targ("guio", "Guió i pla", gt.length + plans.length, [de(ds).length && de(ds).length + (de(ds).length === 1 ? " desglossament" : " desglossaments"), gt.length && gt.length + (gt.length === 1 ? " guió tècnic" : " guions tècnics"), jorn && jorn + (jorn === 1 ? " jornada" : " jornades")].filter(Boolean).join(" · ") || "Res encara")}
        ${targ("equip", "Equip", eq.length, eq.slice(0, 3).map(x => (pers.find(y => y.id === x.id) || {}).titulo).filter(Boolean).join(", ") || "Ningú encara")}
      </div>
      ${p.notas ? `<div class="card" style="margin-top:16px"><h3>Notes</h3><div style="white-space:pre-wrap;line-height:1.5">${E(p.notas)}</div></div>` : ""}`;
  }

  // ---------- Equip ----------
  async function equip(p, v) {
    const pers = await H.col("persona"); if (v !== ver) return;
    const eq = (p.equip || []).map(x => Object.assign({}, x, { p: pers.find(y => y.id === x.id) })).filter(x => x.p);
    const lliures = pers.filter(x => !eq.some(y => y.id === x.id)).sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
    el.innerHTML = `<div class="card"><h3>Afegir algú</h3><div class="ls" style="gap:10px"><select id="peq" style="flex:2;min-width:200px"><option value="">Tria una persona d'Equip i repartiment…</option>${lliures.map(x => `<option value="${x.id}">${E(x.titulo || "Sense nom")}${x.rol ? " · " + E(x.rol) : x.tipus === "Repartiment" ? " · repartiment" : ""}</option>`).join("")}</select><input id="peqr" placeholder="Rol en aquest projecte" style="flex:1;min-width:160px"><button class="b" data-k="afeq">Afegir</button></div>
        <p class="em" style="margin:10px 0 0">Si no hi és, crea-la primer a Gent → Equip i repartiment.</p></div>
      <div style="margin-top:16px">${eq.length ? eq.map(x => `<div class="r"><i class="dot" style="background:${x.p.tipus === "Repartiment" ? "#ff375f" : "#0a84ff"}"></i><div class="g" data-k="pers" data-id="${x.id}" style="cursor:pointer"><b>${E(x.p.titulo || "Sense nom")}</b><small>${E([x.p.tel, x.p.email].filter(Boolean).join(" · "))}</small></div><input data-rol="${x.id}" value="${E(x.rol || x.p.rol || "")}" placeholder="Rol" style="width:200px;max-width:40%"><button class="x" data-k="treq" data-id="${x.id}" title="Treure del projecte">×</button></div>`).join("") : `<p class="em">Encara no hi ha ningú en aquest projecte.</p>`}</div>`;
  }

  // ---------- Arxius ----------
  async function arxius(p, v) {
    const devs = await H.col("dev"); if (v !== ver) return;
    const dev = devs.find(x => x.id === "dev:" + p.id.split(":")[1]) || {};
    const fv = (dev.versions || []).filter(x => x.arxiu).map(x => Object.assign({ de: [x.tipus, x.versio, x.data && H.fecha(x.data)].filter(Boolean).join(" · ") }, x.arxiu));
    const ar = p.archivos || [], ln = String(p.enlaces || "").split("\n").map(x => x.trim()).filter(Boolean);
    const fila = (a, s) => `<div class="r"><i class="dot" style="background:#8e8e93"></i><a class="g" href="/api/archivo/${E(a.id)}" target="_blank" style="color:inherit;text-decoration:none"><b>${E(a.nombre || "Arxiu")}</b><small>${E([s, a.size ? Math.max(1, Math.round(a.size / 1024)) + " kB" : ""].filter(Boolean).join(" · "))}</small></a>${s ? "" : `<button class="x" data-k="trar" data-id="${E(a.id)}" title="Treure">×</button>`}</div>`;
    el.innerHTML = `<div class="bar"><span class="em">Arxius del projecte: guió, referències, cançó, fotos… (màxim 25 MB cadascun).</span><span style="flex:1"></span><label class="b" style="cursor:pointer;color:#fff">+ Pujar arxius<input type="file" multiple id="prup" hidden></label></div>
      ${ar.length ? ar.map(a => fila(a, "")).join("") : `<p class="em">Encara no hi ha arxius.</p>`}
      ${fv.length ? `<h2 style="margin-top:24px">Versions del guió <span>${fv.length}</span></h2>` + fv.map(a => fila(a, a.de || "Desenvolupament")).join("") : ""}
      <h2 style="margin-top:24px">Enllaços</h2><textarea id="prln" rows="3" placeholder="Un enllaç per línia: carpeta del Drive, Vimeo, guió…">${E(p.enlaces || "")}</textarea>
      <div class="ls" style="margin-top:8px">${ln.map(x => `<a class="ln" target="_blank" rel="noopener" href="${E(H.url(x))}">${E(x.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60))}</a>`).join("")}</div>`;
  }

  const doc = async () => (await H.col("proyecto")).find(x => x.id === H.pj());
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k],[data-pt]"); if (!b) return;
    if (b.dataset.pt) return vaA(b.dataset.pt);
    const k = b.dataset.k, p = await doc(); if (!p) return;
    if (k === "edita") return H.abrir("proyecto", p.id);
    if (k === "pers") return H.abrir("persona", b.dataset.id);
    if (k === "afeq") { const s = document.getElementById("peq"); if (!s.value) return s.focus(); p.equip = (p.equip || []).concat({ id: s.value, rol: document.getElementById("peqr").value.trim() }); await H.put(p, 1); return pintar() }
    if (k === "treq") { p.equip = (p.equip || []).filter(x => x.id !== b.dataset.id); await H.put(p, 1); return pintar() }
    if (k === "trar") { if (!confirm("Treure aquest arxiu?")) return; H.api("DELETE", "archivo/" + b.dataset.id).catch(() => { }); p.archivos = (p.archivos || []).filter(a => a.id !== b.dataset.id); await H.put(p, 1); return pintar() }
  });
  el.addEventListener("change", async e => {
    const t = e.target, p = await doc(); if (!p) return;
    if (t.id === "prup" && t.files.length) {
      for (const f of t.files) {
        if (f.size > 25 * 1024 * 1024) { H.toast(f.name + " passa de 25 MB"); continue }
        H.toast("Pujant " + f.name + "…");
        try { const a = await H.api("POST", "archivo?nombre=" + encodeURIComponent(f.name), f); p.archivos = (p.archivos || []).concat(a) } catch (er) { H.toast("No s'ha pogut pujar " + f.name) }
      }
      await H.put(p, 1); H.toast("Fet"); return pintar();
    }
    if (t.dataset.rol) { const x = (p.equip || []).find(y => y.id === t.dataset.rol); if (x) { x.rol = t.value.trim(); H.put(p, 1) } }
    if (t.id === "prln") { p.enlaces = t.value; await H.put(p, 1); pintar() }
  });
  H.onChange(() => { if (!el.hidden && !el.contains(document.activeElement)) pintar() });
  window.addEventListener("hub-sec", e => { if (e.detail === "projecte") pintar() });
  pintar();
})();
