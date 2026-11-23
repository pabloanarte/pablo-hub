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
    de(fs).forEach(x => { if ((!x.estado || x.estado === "Per presentar") && x.limite >= hoy) dates.push([x.limite, "Límit", x.titulo]); if (x.evento >= hoy && ["Seleccionat", "Premiat", "Presentat"].includes(x.estado)) dates.push([x.evento, "Festival", x.titulo]) });
    de(pre).concat(de(post)).filter(x => x.ini >= hoy).forEach(x => dates.push([x.ini, x.hito ? "Fita" : "Calendari", x.titulo]));
    de(pdr).forEach(x => (x.dias || []).forEach((d, i) => d.fecha >= hoy && dates.push([d.fecha, "Rodatge", `${x.titulo || "Pla"} · jornada ${i + 1}`])));
    const prop = dates.filter(d => d[0] <= lim || d[1] === "Tasca").sort((a, b) => a[0].localeCompare(b[0])).slice(0, 8);
    const fp = de(fs), sel = fp.filter(x => ["Seleccionat", "Premiat"].includes(x.estado)), prem = sel.filter(x => x.premi || x.estado === "Premiat"), pend = fp.filter(x => x.estado === "Presentat");
    const dev = devs.find(x => x.id === "dev:" + p.id.split(":")[1]) || {}, vers = (dev.versions || []).slice().sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    const gt = de(gts), plans = de(pdr), jorn = plans.reduce((a, x) => a + (x.dias || []).length, 0);
    const eq = (p.equip || []).filter(x => pers.some(y => y.id === x.id));
    const targ = (pt, t, n, s) => `<div class="card prs" data-pt="${pt}" style="cursor:pointer"><h3>${t}</h3><div class="pn">${n}</div><small class="em">${E(s || "")}</small></div>`;
    const img = p.poster && p.poster[0] ? `/api/archivo/${p.poster[0].id}` : "";
    el.innerHTML = `<div class="prcap">
        <div class="prpos" data-k="edita" title="Editar la fitxa">${img ? `<img src="${img}" alt="">` : `<span>${E(p.titulo || "Sense títol")}</span>`}</div>
        <div style="min-width:0;flex:1">
          ${p.logline ? `<p class="prlog">${E(p.logline)}</p>` : `<p class="em">Encara no té logline.</p>`}
          <div class="ls" style="margin:10px 0 0">${[p.categoria, ...H.rols(p), p.estado, p.anio].filter(Boolean).map(x => `<span class="chip">${E(x)}</span>`).join("")}</div>
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
  // ---------- Equip ----------
  // @ d'Instagram net a partir del que escriguin («@nom», «nom», «instagram.com/nom/?igsh=…»)
  const arroba = t => { t = String(t || "").trim(); if (!t) return ""; const m = t.match(/instagram\.com\/([\w.]+)/i); t = (m ? m[1] : t).replace(/^@+/, "").replace(/[/?#].*$/, "").trim(); return /^[\w.]{1,30}$/.test(t) ? "@" + t : "" };
  const UNIO = { i: " i ", y: " y ", "&": " & ", ",": ", " };
  // Text dels crèdits: un rol per línia («Rol: @a i @b»), en l'ordre de l'equip; si algú no té Instagram, surt el nom
  function credits(p, eq) {
    const c = p.cred || {}, sep = c.sep === "espai" ? " " : ": ", u = UNIO[c.unio || "i"], grups = [];
    eq.forEach(x => { const rol = String(x.rol || x.p.rol || "").trim() || "Equip", k = rol.toLowerCase(), qui = arroba(x.p.insta) || x.p.titulo || ""; if (!qui) return; let g = grups.find(y => y.k === k); if (!g) grups.push(g = { k, rol, q: [] }); if (!g.q.includes(qui)) g.q.push(qui) });
    const ll = grups.map(g => g.rol + sep + (g.q.length > 1 ? g.q.slice(0, -1).join(" ") + u + g.q.at(-1) : g.q[0]));
    return [c.cap || "", ll.join(c.buit ? "\n\n" : "\n")].filter(Boolean).join("\n\n");
  }
  async function equip(p, v) {
    const pers = await H.col("persona"); if (v !== ver) return;
    const eq = (p.equip || []).map(x => Object.assign({}, x, { p: pers.find(y => y.id === x.id) })).filter(x => x.p);
    const lliures = pers.filter(x => !eq.some(y => y.id === x.id)).sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
    const c = p.cred || {}, txt = p.credits != null && p.credits !== "" ? p.credits : credits(p, eq);
    el.innerHTML = `<div class="dash eqd">
      <div class="card"><h3>Del formulari de l'equip</h3>
        <p class="em" style="margin-top:0">Enganxa l'enllaç del full de respostes del Google Forms (al formulari: Respostes → Enllaça amb Fulls). Surt el nom, el rol tal com l'han escrit, l'Instagram, el correu i el telèfon.</p>
        <div class="ls" style="gap:8px"><input id="eqf" placeholder="https://docs.google.com/spreadsheets/…" value="${E(p.formulari || "")}" style="flex:1;min-width:220px"><button class="b" data-k="eqllegeix">${p.formulari ? "Tornar a llegir" : "Llegir"}</button></div>
        <div class="ls" style="margin-top:8px"><label class="b2" style="cursor:pointer">O puja l'arxiu (CSV o Excel)<input type="file" accept=".csv,.tsv,.xlsx,text/csv" id="eqarx" hidden></label></div></div>
      <div class="card"><h3>Afegir algú a mà</h3><div class="ls" style="gap:10px"><select id="peq" style="flex:2;min-width:200px"><option value="">Tria una persona d'Equip i repartiment…</option>${lliures.map(x => `<option value="${x.id}">${E(x.titulo || "Sense nom")}${x.rol ? " · " + E(x.rol) : x.tipus === "Repartiment" ? " · repartiment" : ""}</option>`).join("")}</select><input id="peqr" placeholder="Rol en aquest projecte" style="flex:1;min-width:160px"><button class="b" data-k="afeq">Afegir</button></div>
        <p class="em" style="margin:10px 0 0">Si no hi és, crea-la primer a Gent → Equip i repartiment.</p></div></div>
      <h2 style="margin-top:20px">Equip <span>${eq.length}</span></h2>
      <div>${eq.length ? eq.map((x, i) => `<div class="r"><span class="eqo"><button class="t" data-k="eqamunt" data-i="${i}" ${i ? "" : "disabled"} title="Amunt">↑</button><button class="t" data-k="eqavall" data-i="${i}" ${i < eq.length - 1 ? "" : "disabled"} title="Avall">↓</button></span><div class="g" data-k="pers" data-id="${x.id}" style="cursor:pointer"><b>${E(x.p.titulo || "Sense nom")}</b><small>${E([arroba(x.p.insta), x.p.tel, x.p.email].filter(Boolean).join(" · "))}</small></div><input data-rol="${x.id}" value="${E(x.rol || x.p.rol || "")}" placeholder="Rol" style="width:220px;max-width:40%"><button class="x" data-k="treq" data-id="${x.id}" title="Treure del projecte">×</button></div>`).join("") : `<p class="em">Encara no hi ha ningú en aquest projecte.</p>`}</div>
      ${eq.length ? `<div class="card" style="margin-top:20px"><h3>Crèdits per a Instagram</h3>
        <p class="em" style="margin-top:0">Surten en l'ordre de la llista (canvia'l amb ↑ ↓) i els rols repetits s'ajunten. Pots retocar el text: es guarda.</p>
        <div class="ls" style="gap:10px;margin-bottom:10px">
          <select data-c="sep" style="width:auto"><option value="dos" ${c.sep !== "espai" ? "selected" : ""}>Rol: @usuari</option><option value="espai" ${c.sep === "espai" ? "selected" : ""}>Rol @usuari</option></select>
          <select data-c="unio" style="width:auto">${Object.keys(UNIO).map(k => `<option value="${E(k)}" ${(c.unio || "i") === k ? "selected" : ""}>@a ${k === "," ? "," : k} @b</option>`).join("")}</select>
          <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;margin:0;font-size:14px;color:#000"><input type="checkbox" data-c="buit" ${c.buit ? "checked" : ""} style="width:auto;margin:0"> Línia en blanc entre rols</label></div>
        <input data-c="cap" value="${E(c.cap || "")}" placeholder="Primera línia (opcional): títol, «Una producció de @…»" style="margin-bottom:8px">
        <textarea id="eqtxt" rows="14" style="font-family:inherit">${E(txt)}</textarea>
        <div class="ls" style="margin-top:8px;align-items:center"><button class="b" data-k="eqcopia">Copiar</button><button class="b2" data-k="eqregen">Tornar a generar</button><span class="em" id="eqn" style="margin-left:auto">${txt.length} / 2.200 caràcters</span></div></div>` : ""}`;
  }

  // ---------- llegir el formulari ----------
  const col = (hs, re) => hs.findIndex(h => re.test(h));
  async function llegeixFormulari(p, font) {
    let rows = null;
    if (typeof font === "string") {
      if (/docs\.google\.com\/forms/i.test(font)) return H.toast("Aquest és l'enllaç del formulari: obre Respostes → «Enllaça amb Fulls» i enganxa l'enllaç del full");
      try { const r = await H.api("POST", "correu/full", { url: font }); if (r && r.rows) rows = r.rows } catch (e) { }
      if (!rows) { try { rows = (await IMP.llegir(font))[0].rows } catch (e) { return H.toast((e && e.message) || "No s'ha pogut llegir el full") } }
    } else { try { const f = await IMP.llegir(font); rows = f[0].rows || null } catch (e) { return H.toast("No s'ha pogut llegir l'arxiu") } }
    rows = (rows || []).filter(r => r.some(x => String(x).trim()));
    if (rows.length < 2) return H.toast("El full no té respostes");
    const hs = rows[0].map(h => String(h).toLowerCase());
    const ci = { nom: col(hs, /nom|nombre|name/), rol: col(hs, /\brol|càrrec|cargo|posici|departament|role|position|funci|ofici|lloc|puesto/), ig: col(hs, /insta|\big\b|usuari|usuario|@/), mail: col(hs, /mail|correu|correo/), tel: col(hs, /tel|mòbil|móvil|movil|phone|whats|contacte|contacto/) };
    if (ci.nom < 0) ci.nom = hs.findIndex((h, i) => i > 0 && !Object.values(ci).includes(i) && !/marca|time|data|fecha/.test(h));
    const pers = await H.col("persona"), net = t => String(t || "").trim();
    const llista = rows.slice(1).map(r => { const g = k => ci[k] >= 0 ? net(r[ci[k]]) : ""; return { nom: g("nom"), rol: g("rol"), ig: arroba(g("ig")), mail: g("mail").toLowerCase(), tel: g("tel") } }).filter(x => x.nom || x.ig);
    // fusiona respostes repetides (la darrera mana) i busca qui ja hi és a Gent
    const uniq = []; llista.forEach(x => { const k = x.mail || x.ig || x.nom.toLowerCase(), j = uniq.findIndex(y => (y.mail || y.ig || y.nom.toLowerCase()) === k); j >= 0 ? uniq[j] = x : uniq.push(x) });
    uniq.forEach(x => { x.ja = pers.find(y => (x.mail && String(y.email || "").toLowerCase() === x.mail) || (x.ig && arroba(y.insta) === x.ig) || (x.nom && (y.titulo || "").toLowerCase() === x.nom.toLowerCase())); x.dins = x.ja && (p.equip || []).some(e => e.id === x.ja.id) });
    if (typeof font === "string") { p.formulari = font; H.put(p, 1) }
    H.sheet(`<h2 style="margin-top:4px">Respostes del formulari</h2><p class="em" style="margin-top:0">Marca qui vols afegir a l'equip del projecte. Pots corregir el rol i l'Instagram.</p>
      <div id="eqrev">${uniq.map((x, i) => `<div class="r" style="flex-wrap:wrap;gap:6px"><input type="checkbox" data-i="${i}" ${x.dins ? "" : "checked"}><div class="g" style="min-width:140px"><b>${E(x.nom || x.ig)}</b><small>${E([x.mail, x.tel].filter(Boolean).join(" · "))}${x.dins ? " · ja és a l'equip" : x.ja ? " · ja és a Gent" : " · nou"}</small></div>
        <input data-f="rol" data-i="${i}" value="${E(x.rol)}" placeholder="Rol" style="width:170px"><input data-f="ig" data-i="${i}" value="${E(x.ig)}" placeholder="@instagram" style="width:150px"></div>`).join("")}</div>
      <div class="sfoot"><span class="em">${uniq.length} respostes</span><button class="b" id="eqok">Afegir a l'equip</button></div>`);
    const box = document.getElementById("eqrev");
    box.addEventListener("input", e => { const t = e.target; if (t.dataset.f) uniq[+t.dataset.i][t.dataset.f] = t.dataset.f === "ig" ? t.value.trim() : t.value });
    document.getElementById("eqok").onclick = async () => {
      const tria = [...box.querySelectorAll("input[type=checkbox]")].filter(c => c.checked).map(c => uniq[+c.dataset.i]);
      for (const x of tria) {
        const ig = arroba(x.ig); let q = x.ja;
        if (!q) { q = { id: H.uid("persona"), titulo: x.nom || ig, tipus: "Equip", email: x.mail, tel: x.tel, insta: ig ? "https://www.instagram.com/" + ig.slice(1) : "" }; await H.put(q, 1) }
        else { let c = false; if (!q.email && x.mail) { q.email = x.mail; c = true } if (!q.tel && x.tel) { q.tel = x.tel; c = true } if (ig && arroba(q.insta) !== ig) { q.insta = "https://www.instagram.com/" + ig.slice(1); c = true } if (c) await H.put(q, 1) }
        const e = (p.equip || []).find(y => y.id === q.id);
        if (e) { if (x.rol) e.rol = x.rol } else p.equip = (p.equip || []).concat({ id: q.id, rol: x.rol });
      }
      await H.put(p, 1); H.cerrar(); H.toast(tria.length + (tria.length === 1 ? " persona afegida" : " persones afegides")); pintar();
    };
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
    if (k === "eqllegeix") { const u = document.getElementById("eqf").value.trim(); if (!/^https:\/\//.test(u)) return document.getElementById("eqf").focus(); b.disabled = true; b.textContent = "Llegint…"; await llegeixFormulari(p, u); b.disabled = false; b.textContent = "Tornar a llegir"; return }
    if (k === "eqamunt" || k === "eqavall") { const pers = await H.col("persona"), eq = (p.equip || []).filter(x => pers.some(y => y.id === x.id)), i = +b.dataset.i, j = k === "eqamunt" ? i - 1 : i + 1;[eq[i], eq[j]] = [eq[j], eq[i]]; p.equip = eq.concat((p.equip || []).filter(x => !eq.includes(x))); if (!p.credits) delete p.credits; await H.put(p, 1); return pintar() }
    if (k === "eqcopia") { const t = document.getElementById("eqtxt").value; try { await navigator.clipboard.writeText(t); H.toast("Copiat") } catch (er) { document.getElementById("eqtxt").select(); document.execCommand("copy"); H.toast("Copiat") } return }
    if (k === "eqregen") { if (p.credits && !confirm("Es perdran els retocs que hagis fet al text. Tornar a generar-lo?")) return; delete p.credits; await H.put(p, 1); return pintar() }
    if (k === "treq") { p.equip = (p.equip || []).filter(x => x.id !== b.dataset.id); await H.put(p, 1); return pintar() }
    if (k === "trar") { if (!confirm("Treure aquest arxiu?")) return; H.api("DELETE", "archivo/" + b.dataset.id).catch(() => { }); p.archivos = (p.archivos || []).filter(a => a.id !== b.dataset.id); await H.put(p, 1); return pintar() }
  });
  el.addEventListener("input", async e => {
    if (e.target.id !== "eqtxt") return; const p = await doc(); if (!p) return;
    p.credits = e.target.value; document.getElementById("eqn").textContent = e.target.value.length + " / 2.200 caràcters"; H.put(p);
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
    if (t.id === "eqarx" && t.files[0]) return llegeixFormulari(p, t.files[0]);
    if (t.dataset.c) { p.cred = Object.assign({}, p.cred, { [t.dataset.c]: t.type === "checkbox" ? t.checked : t.value }); if (!p.credits || confirm("Has retocat el text dels crèdits. Vols tornar-lo a generar amb aquest format? (Es perdran els retocs)")) delete p.credits; await H.put(p, 1); return pintar() }
    if (t.dataset.rol) { const x = (p.equip || []).find(y => y.id === t.dataset.rol); if (x) { x.rol = t.value.trim(); await H.put(p, 1); if (!p.credits) pintar() } }
    if (t.id === "prln") { p.enlaces = t.value; await H.put(p, 1); pintar() }
  });
  H.onChange(() => { if (!el.hidden && !el.contains(document.activeElement)) pintar() });
  window.addEventListener("hub-sec", e => { if (e.detail === "projecte") pintar() });
  pintar();
})();
