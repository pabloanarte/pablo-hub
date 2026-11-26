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
    const brief = window.BRIEF && BRIEF.es(p) ? BRIEF.card(p, await BRIEF.preguntes()) : ""; // briefing amb l'artista (brief.js)
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
    const dev = devs.find(x => x.id === "dev:" + p.id.split(":")[1]) || {}, vers = (dev.versions || []).map((x, i) => [x, i]).sort((a, b) => (b[0].data || "").localeCompare(a[0].data || "") || b[1] - a[1]).map(x => x[0]);
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
        ${brief}
        ${(() => { const gs = (dev.versions || []).map((x, i) => [x, i]).filter(([x]) => (x.tipus || "Guió") === "Guió" && x.arxiu).sort((a, b) => (b[0].data || "").localeCompare(a[0].data || "") || b[1] - a[1]).map(x => x[0]), u = gs[0], dg = p.desg && ds.find(x => x.id === p.desg);
          return `<div class="card" style="grid-column:1/-1"><h3>Guió</h3>${u ? `<div class="r" style="padding:4px 0"><i class="dot" style="background:#000"></i><a class="g" href="/api/archivo/${E(u.arxiu.id)}" target="_blank" style="color:inherit;text-decoration:none"><b>Guió ${E(u.versio || "")}</b><small>${E([u.data && H.fecha(u.data), u.pag && u.pag + " pàg.", u.arxiu.nombre].filter(Boolean).join(" · "))}</small></a></div>` : `<p class="em" style="margin-top:0">Puja-hi el guió i en sortiran el desglossament, el guió tècnic, el storyboard i el pla.</p>`}
            ${dg ? `<p class="em" style="margin:6px 0 0">Desglossat: ${dg.escenes.length} escenes · <a href="#" data-pt="guio" style="color:#000">Obrir</a></p>` : ""}
            <div class="ls" style="margin-top:10px;align-items:center"><label class="b" style="cursor:pointer;color:#fff">${u ? "Pujar una versió nova (PDF)" : "Pujar el guió (PDF)"}<input type="file" accept=".pdf,application/pdf" id="prguio" hidden></label>${gs.length > 1 ? `<button class="b2" data-pt="desenvolupament">Totes les versions (${gs.length})</button>` : ""}</div></div>` })()}
        <div class="card w2"><h3>Properes dates</h3>${prop.length ? prop.map(d => `<div class="m pdt"><b>${E(H.fecha(d[0]))}</b><span><span class="em">${E(d[1])}</span> · ${E(d[2] || "")}</span></div>`).join("") : `<p class="em">Res als propers dos mesos.</p>`}</div>
        ${targ("festivales", "Festivals", fp.length, fp.length ? `${sel.length} ${sel.length === 1 ? "selecció" : "seleccions"}${prem.length ? ` · ${prem.length} ${prem.length === 1 ? "premi" : "premis"}` : ""}${pend.length ? ` · ${pend.length} sense decidir` : ""}` : "Encara cap inscripció")}
        ${["Llarg", "Curt"].includes(p.categoria) ? targ("desenvolupament", "Desenvolupament", vers.length, vers[0] ? `última: ${[vers[0].tipus, vers[0].versio].filter(Boolean).join(" ")}${vers[0].data ? " · " + H.fecha(vers[0].data) : ""}` : "Cap versió apuntada") : ""}
        ${targ("decks", "Dossiers", de(dks).length, de(dks).map(x => x.titulo).filter(Boolean).slice(0, 2).join(", ") || "Cap dossier encara")}
        ${targ("guio", "Guió i pla", gt.length + plans.length, [de(ds).length && de(ds).length + (de(ds).length === 1 ? " desglossament" : " desglossaments"), gt.length && gt.length + (gt.length === 1 ? " guió tècnic" : " guions tècnics"), jorn && jorn + (jorn === 1 ? " jornada" : " jornades")].filter(Boolean).join(" · ") || "Res encara")}
        ${targ("equip", "Equip", eq.length, eq.slice(0, 3).map(x => (pers.find(y => y.id === x.id) || {}).titulo).filter(Boolean).join(", ") || "Ningú encara")}
      </div>
      ${p.notas ? `<div class="card" style="margin-top:16px"><h3>Notes</h3><div style="white-space:pre-wrap;line-height:1.5">${E(p.notas)}</div></div>` : ""}`;
    if (brief) BRIEF.ajusta(el);
  }

  // ---------- Equip ----------
  // @ d'Instagram net a partir del que escriguin («@nom», «nom», «instagram.com/nom/?igsh=…»)
  const arroba = t => {
    t = String(t || "").trim(); if (!t || /^(no|n\/?a|ninguno|ninguna|cap|none|-+|no tinc|no tengo|x)$/i.test(t)) return "";
    if (/instagram\.com\//i.test(t)) { const seg = t.replace(/^.*instagram\.com\//i, "").split(/[/?#]/).filter(Boolean); t = /^(p|reel|reels|tv|explore)$/i.test(seg[0] || "") ? "" : /^(_u|stories)$/i.test(seg[0] || "") ? seg[1] || "" : seg[0] || "" }
    else { const m = t.match(/@([\w.]{1,30})/); t = m ? m[1] : t.replace(/^@+/, "") }
    t = t.trim(); return /^[\w.]{1,30}$/.test(t) && /[a-z]/i.test(t) ? "@" + t : "";
  };
  const rangRol = H.rangRol, deptDe = H.deptDe; // a lib.js
  // ordena l'equip per departaments; dins el mateix rang es manté l'ordre que tenien
  const rolDe = (x, pers) => x.rol || ((pers.find(y => y.id === x.id) || {}).rol) || "";
  const perDepartaments = (eq, pers) => eq.map((x, i) => [x, i]).sort((a, b) => rangRol(rolDe(a[0], pers)) - rangRol(rolDe(b[0], pers)) || a[1] - b[1]).map(x => x[0]);
  const UNIO = { i: " i ", y: " y ", "&": " & ", ",": ", " };
  // Text dels crèdits: un rol per línia («Rol: @a i @b»), en l'ordre de l'equip; si algú no té Instagram, surt el nom
  function credits(p, eq) {
    const c = p.cred || {}, sep = c.sep === "espai" ? " " : ": ", u = UNIO[c.unio || "i"], grups = [];
    eq.forEach(x => { const rol = String(x.rol || x.p.rol || "").trim(), k = rol.toLowerCase(), qui = arroba(x.p.insta) || x.p.titulo || ""; if (!qui) return; let g = grups.find(y => y.k === k); if (!g) grups.push(g = { k, rol, q: [] }); if (!g.q.includes(qui)) g.q.push(qui) });
    grups.sort((a, b) => (a.rol ? 0 : 1) - (b.rol ? 0 : 1)); // els que no tenen rol, al final i sense etiqueta
    const ll = grups.map(g => (g.rol ? g.rol + sep : "") + (g.q.length > 1 ? g.q.slice(0, -1).join(", ") + u + g.q.at(-1) : g.q[0]));
    return [c.cap || "", ll.join(c.buit ? "\n\n" : "\n")].filter(Boolean).join("\n\n");
  }
  async function equip(p, v) {
    const pers = await H.col("persona"); if (v !== ver) return;
    // si no l'has reordenat a mà, l'equip surt sempre per departaments
    const eq0 = p.ordreMa ? (p.equip || []) : perDepartaments(p.equip || [], pers);
    const eq = eq0.map(x => Object.assign({}, x, { p: pers.find(y => y.id === x.id) })).filter(x => x.p);
    const lliures = pers.filter(x => !eq.some(y => y.id === x.id)).sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
    const c = p.cred || {}, gen = credits(p, eq), txt = p.credits != null && p.credits !== "" ? p.credits : gen, vell = p.credits && p.credGen && p.credGen !== gen;
    el.innerHTML = `<div class="dash eqd">
      <div class="card"><h3>Del formulari de l'equip</h3>
        <p class="em" style="margin-top:0">Enganxa l'enllaç del full de respostes del Google Forms (al formulari: «Respuestas» → «Ver en Hojas de cálculo»). Surt el nom, el rol tal com l'han escrit, l'Instagram, el correu i el telèfon.</p>
        <div class="ls" style="gap:8px"><input id="eqf" placeholder="https://docs.google.com/spreadsheets/…" value="${E(p.formulari || "")}" style="flex:1;min-width:220px"><button class="b" data-k="eqllegeix">${p.formulari ? "Tornar a llegir" : "Llegir"}</button></div>
        <div class="ls" style="margin-top:8px"><label class="b2" style="cursor:pointer">O puja l'arxiu (CSV o Excel)<input type="file" accept=".csv,.tsv,.xlsx,text/csv" id="eqarx" hidden></label></div></div>
      <div class="card"><h3>Afegir algú a mà</h3><div class="ls" style="gap:10px"><select id="peq" style="flex:2;min-width:200px"><option value="">Tria una persona d'Equip i repartiment…</option>${lliures.map(x => `<option value="${x.id}">${E(x.titulo || "Sense nom")}${x.rol ? " · " + E(x.rol) : x.tipus === "Repartiment" ? " · repartiment" : ""}</option>`).join("")}</select><input id="peqr" placeholder="Rol en aquest projecte" style="flex:1;min-width:160px"><button class="b" data-k="afeq">Afegir</button></div>
        <p class="em" style="margin:10px 0 0">Si no hi és, crea-la primer a Gent → Equip i repartiment.</p></div></div>
      <div class="ls" style="margin-top:20px;justify-content:space-between"><h2 style="margin:0">Equip <span>${eq.length}</span></h2>${eq.length > 1 && p.ordreMa ? `<button class="b2" data-k="eqdept">Tornar a ordenar per departaments</button>` : ""}</div>
      <div id="eqll">${eq.length ? eq.map((x, i) => { const dp = deptDe(x.rol || x.p.rol), cap = !p.ordreMa && (i === 0 || deptDe(eq[i - 1].rol || eq[i - 1].p.rol) !== dp) ? `<h2 style="margin:${i ? 18 : 6}px 0 4px">${E(dp)}</h2>` : ""; return cap + `<div class="r" data-eq="${i}"><span class="eqh" title="Arrossega per canviar l'ordre" aria-label="Moure">⠿</span><div class="g" data-k="pers" data-id="${x.id}" style="cursor:pointer"><b>${E(x.p.titulo || "Sense nom")}</b><small>${E([arroba(x.p.insta), x.p.tel, x.p.email].filter(Boolean).join(" · "))}</small></div><input data-rol="${x.id}" value="${E(x.rol || x.p.rol || "")}" placeholder="Rol" style="width:220px;max-width:40%"><button class="x" data-k="treq" data-id="${x.id}" title="Treure del projecte">×</button></div>` }).join("") : `<p class="em">Encara no hi ha ningú en aquest projecte.</p>`}</div>
      ${eq.length ? `<div class="card" style="margin-top:20px"><h3>Crèdits per a Instagram</h3>
        <p class="em" style="margin-top:0">Surten en l'ordre de la llista (canvia'l amb ↑ ↓) i els rols repetits s'ajunten. Pots retocar el text: es guarda.</p>
        <div class="ls" style="gap:10px;margin-bottom:10px">
          <select data-c="sep" style="width:auto"><option value="dos" ${c.sep !== "espai" ? "selected" : ""}>Rol: @usuari</option><option value="espai" ${c.sep === "espai" ? "selected" : ""}>Rol @usuari</option></select>
          <select data-c="unio" style="width:auto">${Object.keys(UNIO).map(k => `<option value="${E(k)}" ${(c.unio || "i") === k ? "selected" : ""}>@a ${k === "," ? "," : k} @b</option>`).join("")}</select>
          <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;margin:0;font-size:14px;color:#000"><input type="checkbox" data-c="buit" ${c.buit ? "checked" : ""} style="width:auto;margin:0"> Línia en blanc entre rols</label></div>
        <input data-c="cap" value="${E(c.cap || "")}" placeholder="Primera línia (opcional): títol, «Una producció de @…»" style="margin-bottom:8px">
        ${vell ? `<p class="em" style="margin:0 0 8px;color:#ff3b30">L'equip ha canviat des que vas retocar el text. <a href="#" data-k="eqregen" style="color:#000">Tornar a generar</a></p>` : ""}
        <textarea id="eqtxt" rows="${Math.min(22, Math.max(5, txt.split("\n").length + 1))}" style="font-family:inherit">${E(txt)}</textarea>
        <div class="ls" style="margin-top:8px;align-items:center"><button class="b" data-k="eqcopia">Copiar</button><button class="b2" data-k="eqregen">Tornar a generar</button><span class="em" id="eqn" style="margin-left:auto;${txt.length > 2200 ? "color:#ff3b30" : ""}">${txt.length > 2200 ? `Sobren ${txt.length - 2200} caràcters (màxim 2.200)` : txt.length + " / 2.200 caràcters"}</span></div></div>` : ""}`;
  }

  // ---------- llegir el formulari ----------
  const col = (hs, re) => hs.findIndex(h => re.test(h));
  async function llegeixFormulari(p, font) {
    let rows = null;
    if (typeof font === "string") {
      if (/docs\.google\.com\/forms/i.test(font)) return H.toast("Aquest és l'enllaç del formulari: obre Respostes → «Enllaça amb Fulls» i enganxa l'enllaç del full");
      if (/forms\.gle\//i.test(font)) return H.toast("Aquest és l'enllaç del formulari: obre «Respuestas» → «Ver en Hojas de cálculo» i enganxa l'enllaç del full");
      let pont = null; try { const r = await H.api("POST", "correu/full", { url: font }); if (r && r.rows) rows = r.rows } catch (e) { pont = (e && e.error) || "error" }
      if (!rows && pont && pont !== "config") return H.toast(pont === "accio" ? "Cal actualitzar el pont de Google (Configuració → Pont de Google) perquè pugui llegir el full" : "El pont no ha pogut obrir el full: " + pont);
      if (!rows) { try { rows = (await IMP.llegir(font))[0].rows } catch (e) { return H.toast((e && e.message) || "No s'ha pogut llegir el full") } }
    } else { try { const f = await IMP.llegir(font); rows = f[0].rows || null } catch (e) { return H.toast("No s'ha pogut llegir l'arxiu") } }
    rows = (rows || []).filter(r => r.some(x => String(x).trim()));
    if (rows.length < 2) return H.toast("El full no té respostes");
    const hs = rows[0].map(h => String(h).toLowerCase()), presa = new Set(), ci = {};
    // per ordre: cada columna només es fa servir una vegada
    const tria = (k, re, no) => { const i = hs.findIndex((h, j) => !presa.has(j) && re.test(h) && !(no && no.test(h))); ci[k] = i; if (i >= 0) presa.add(i) };
    tria("ig", /insta|\big\b|@/); tria("mail", /e-?mail|correu|correo|adreça electrònica|direcci[oó]n de correo/); tria("tel", /tel[eè]f|\btel\b|m[oòó]bil|m[oó]vil|phone|whats/);
    tria("contacte", /contact/); tria("rol", /\brols?\b|c[àa]rrec|cargo|posici|departament|department|role|position|funci|ofici|puesto|feina|trabajo|job/);
    tria("cognom", /cognom|apellido|surname|last name/); tria("nom", /\bnom\b|nom i|nombre|name|nom complet/, /usuari|usuario|user/);
    if (ci.nom < 0) ci.nom = hs.findIndex((h, i) => i > 0 && !presa.has(i) && !/marca|time|data|fecha/.test(h));
    const pers = await H.col("persona"), net = t => String(t || "").trim();
    const llista = rows.slice(1).map(r => { const g = k => ci[k] >= 0 && ci[k] != null ? net(r[ci[k]]) : "", ct = g("contacte");
      const x = { nom: [g("nom"), g("cognom")].filter(Boolean).join(" "), rol: g("rol"), ig: arroba(g("ig")), mail: g("mail").toLowerCase(), tel: g("tel") };
      if (ct) { if (/@.+\./.test(ct) && !x.mail) x.mail = (ct.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [""])[0].toLowerCase(); if (/\d{6,}/.test(ct.replace(/[\s.-]/g, "")) && !x.tel) x.tel = ct.replace(/[^\d+\s]/g, "").trim() }
      return x }).filter(x => x.nom || x.ig);
    // fusiona respostes repetides (la darrera mana) i busca qui ja hi és a Gent
    const n = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
    const mateix = (a, b) => (a.mail && a.mail === b.mail) || (a.ig && n(a.ig) === n(b.ig)) || (a.nom && n(a.nom) === n(b.nom));
    const uniq = []; llista.forEach(x => { const j = uniq.findIndex(y => mateix(x, y)); if (j >= 0) { const y = uniq[j]; uniq[j] = { nom: x.nom || y.nom, rol: x.rol || y.rol, ig: x.ig || y.ig, mail: x.mail || y.mail, tel: x.tel || y.tel } } else uniq.push(x) });
    uniq.forEach(x => { x.ja = pers.find(y => mateix(x, { mail: String(y.email || "").toLowerCase(), ig: arroba(y.insta), nom: y.titulo })); x.dins = x.ja && (p.equip || []).some(e => e.id === x.ja.id) });
    if (typeof font === "string") { p.formulari = font; H.put(p, 1) }
    H.sheet(`<h2 style="margin-top:4px">Respostes del formulari</h2><p class="em" style="margin-top:0">Marca qui vols afegir a l'equip del projecte. Pots corregir el rol i l'Instagram.</p>
      <div id="eqrev">${uniq.map((x, i) => `<div class="r" style="flex-wrap:wrap;gap:6px"><input type="checkbox" data-i="${i}" ${x.dins ? "" : "checked"}><div class="g" style="min-width:140px"><b>${E(x.nom || x.ig)}</b><small>${E([x.mail, x.tel].filter(Boolean).join(" · "))}${x.rol ? "" : " · <b style='color:#ff3b30'>sense rol</b>"}${x.dins ? " · ja és a l'equip" : x.ja ? " · ja és a Gent" : " · nou"}</small></div>
        <input data-f="rol" data-i="${i}" value="${E(x.rol)}" placeholder="Rol" style="width:170px"><input data-f="ig" data-i="${i}" value="${E(x.ig)}" placeholder="@instagram" style="width:150px"></div>`).join("")}</div>
      <div class="sfoot"><span class="em">${uniq.length} respostes</span><button class="b" id="eqok">Afegir a l'equip</button></div>`);
    const box = document.getElementById("eqrev");
    box.addEventListener("input", e => { const t = e.target; if (t.dataset.f) uniq[+t.dataset.i][t.dataset.f] = t.dataset.f === "ig" ? t.value.trim() : t.value });
    document.getElementById("eqok").onclick = async () => {
      const tria = [...box.querySelectorAll("input[type=checkbox]")].filter(c => c.checked).map(c => uniq[+c.dataset.i]);
      if (!tria.length) return H.toast("No has marcat ningú");
      for (const x of tria) {
        const ig = arroba(x.ig); let q = x.ja;
        if (!q) { q = { id: H.uid("persona"), titulo: x.nom || ig, tipus: /^(cast|reparto|repartiment|actor|actriz|actriu|int[eè]rpret)/i.test(x.rol) ? "Repartiment" : "Equip", rol: x.rol, email: x.mail, tel: x.tel, insta: ig ? "https://www.instagram.com/" + ig.slice(1) : "" }; await H.put(q, 1) }
        else { let c = false; if (!q.email && x.mail) { q.email = x.mail; c = true } if (!q.tel && x.tel) { q.tel = x.tel; c = true } if (ig && (!q.insta || /instagram\.com/i.test(q.insta)) && n(arroba(q.insta)) !== n(ig)) { q.insta = "https://www.instagram.com/" + ig.slice(1); c = true } if (!q.rol && x.rol) { q.rol = x.rol; c = true } if (c) await H.put(q, 1) }
        const e = (p.equip || []).find(y => y.id === q.id);
        if (e) { if (x.rol) e.rol = x.rol } else p.equip = (p.equip || []).concat({ id: q.id, rol: x.rol });
      }
      if (!p.ordreMa) p.equip = perDepartaments(p.equip || [], await H.col("persona")); if (!p.credits) delete p.credits;
      await H.put(p, 1); H.cerrar(); H.toast(tria.length + (tria.length === 1 ? " persona afegida" : " persones afegides") + (p.ordreMa ? "" : ", ordenat per departaments")); pintar();
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

  // Pujar una versió del guió (des del Resum o del Desglossament): versió a Desenvolupament, pàgines, escriptura i desglossament
  async function pujaGuio(pid, f) {
    const p = (await H.col("proyecto")).find(x => x.id === pid); if (!p) return;
    if (f.size > 25 * 1024 * 1024) return H.toast("Passa de 25 MB");
    const id = "dev:" + pid.split(":")[1], dv = (await H.col("dev")).find(x => x.id === id) || { id, versions: [], lectures: [], convs: [] };
    const gs = (dv.versions || []).filter(x => (x.tipus || "Guió") === "Guió"), ant = gs.map(x => parseInt(String(x.versio || "").replace(/\D/g, "")) || 0);
    const num = (f.name.replace(/\.pdf$/i, "").match(/(?:^|[^a-z0-9])v\.?\s?(\d{1,3})(?![0-9])/i) || [])[1];
    const versio = "v" + (num || (ant.length ? Math.max(...ant) + 1 : 1)), ja = gs.find(x => x.versio === versio);
    if (ja && !confirm(`Ja hi ha una ${versio} del guió. Vols substituir-la per aquest arxiu?`)) return;
    H.toast("Pujant el guió…");
    let a; try { a = await H.api("POST", "archivo?nombre=" + encodeURIComponent(f.name), f) } catch (er) { return H.toast("No s'ha pogut pujar") }
    const v = ja || { tipus: "Guió", versio, canvis: "" }; if (ja && ja.arxiu) H.api("DELETE", "archivo/" + ja.arxiu.id).catch(() => { });
    Object.assign(v, { data: avui(), arxiu: a });
    try { const pdfjs = await import("/vendor/pdf.min.mjs"); pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs"; v.pag = (await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise).numPages } catch (er) { }
    if (!ja) dv.versions = (dv.versions || []).concat(v);
    await H.put(dv, 1);
    if (v.pag) { const es = (await H.col("ajust")).find(x => x.id === "ajust:escriptura") || { id: "ajust:escriptura", log: [] }; es.log = (es.log || []).filter(x => !(x.proj === pid && x.d === v.data)).concat({ proj: pid, d: v.data, p: v.pag, versio: v.versio }); H.put(es, 1) }
    try { const r = await DESG.desdePDF(f, pid, (p.titulo || "Guió") + " " + v.versio); H.toast(`Guió ${v.versio}${v.pag ? " · " + v.pag + " pàg." : ""} · ${r.d.escenes.length} escenes desglossades${r.revisar ? ` · el guió tècnic té ${r.revisar} ${r.revisar === 1 ? "canvi" : "canvis"} per revisar` : ""}`); return r }
    catch (er) { H.toast(er && /capçaleres/.test(er.message) ? "Guió desat, però no he trobat les capçaleres d'escena (INT./EXT.)" : "Guió desat, però no s'ha pogut desglossar") }
  }
  window.PJ = { pujaGuio };
  const doc = async () => (await H.col("proyecto")).find(x => x.id === H.pj());
  // arrossegar per canviar l'ordre de l'equip (ratolí, dit o llapis)
  el.addEventListener("pointerdown", e => {
    const h = e.target.closest(".eqh"), ll = document.getElementById("eqll"); if (!h || !ll) return;
    e.preventDefault(); const fila = h.closest(".r"), y0 = e.clientY; let mogut = false;
    fila.classList.add("eqdrag");
    const mou = ev => {
      if (!mogut && Math.abs(ev.clientY - y0) < 4) return;
      if (!mogut) { mogut = true; ll.querySelectorAll("h2").forEach(x => x.remove()) } // en moure a mà deixa d'anar per departaments
      const files = [...ll.querySelectorAll(".r[data-eq]")].filter(x => x !== fila);
      const des = files.find(x => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2 });
      if (des) { if (fila.nextElementSibling !== des) ll.insertBefore(fila, des) } else if (ll.lastElementChild !== fila) ll.appendChild(fila);
    };
    const fi = async () => {
      window.removeEventListener("pointermove", mou); window.removeEventListener("pointerup", fi); window.removeEventListener("pointercancel", fi);
      fila.classList.remove("eqdrag"); if (!mogut) return;
      const ordre = [...ll.querySelectorAll(".r[data-eq]")].map(x => +x.dataset.eq);
      const p = await doc(); if (!p) return; const pers = await H.col("persona");
      const eq = (p.ordreMa ? (p.equip || []) : perDepartaments(p.equip || [], pers)).filter(x => pers.some(y => y.id === x.id));
      const nou = ordre.map(i => eq[i]).filter(Boolean);
      p.equip = nou.concat((p.equip || []).filter(x => !nou.includes(x))); p.ordreMa = true;
      if (!p.credits) { delete p.credits; delete p.credGen }
      await H.put(p, 1); pintar();
    };
    window.addEventListener("pointermove", mou); window.addEventListener("pointerup", fi); window.addEventListener("pointercancel", fi);
  });
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k],[data-pt]"); if (!b) return; if (b.tagName === "A") e.preventDefault();
    if (b.dataset.k === "eqcopia") { // abans de qualsevol espera, perquè Safari ho compti com a part del toc
      const ta = document.getElementById("eqtxt"), t = ta.value; let ok = false;
      try { if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(t).then(() => H.toast("Copiat"), () => { ta.focus(); ta.setSelectionRange(0, t.length); H.toast(document.execCommand("copy") ? "Copiat" : "Selecciona el text i copia'l") }); return } } catch (er) { }
      ta.focus(); ta.setSelectionRange(0, t.length); try { ok = document.execCommand("copy") } catch (er) { } H.toast(ok ? "Copiat" : "Selecciona el text i copia'l"); return }
    if (b.dataset.pt) return vaA(b.dataset.pt);
    const k = b.dataset.k, p = await doc(); if (!p) return;
    if (k === "edita") return H.abrir("proyecto", p.id);
    if (k === "pers") return H.abrir("persona", b.dataset.id);
    if (k === "afeq") { const s = document.getElementById("peq"); if (!s.value) return s.focus(); p.equip = (p.equip || []).concat({ id: s.value, rol: document.getElementById("peqr").value.trim() }); await H.put(p, 1); return pintar() }
    if (k === "eqllegeix") { let u = document.getElementById("eqf").value.trim(); if (!u) return document.getElementById("eqf").focus(); if (!/^https?:\/\//.test(u)) u = "https://" + u; b.disabled = true; b.textContent = "Llegint…"; await llegeixFormulari(p, u); b.disabled = false; b.textContent = "Tornar a llegir"; return }
    if (k === "eqamunt" || k === "eqavall") { const pers = await H.col("persona"), eq = (p.ordreMa ? (p.equip || []) : perDepartaments(p.equip || [], pers)).filter(x => pers.some(y => y.id === x.id)), i = +b.dataset.i, j = k === "eqamunt" ? i - 1 : i + 1;[eq[i], eq[j]] = [eq[j], eq[i]]; p.equip = eq.concat((p.equip || []).filter(x => !eq.includes(x))); p.ordreMa = true; if (!p.credits) { delete p.credits; delete p.credGen } await H.put(p, 1); return pintar() }
    if (k === "eqdept") { p.equip = perDepartaments(p.equip || [], await H.col("persona")); delete p.ordreMa; if (!p.credits) delete p.credGen; await H.put(p, 1); H.toast("Ordenat per departaments"); return pintar() }
    if (k === "eqregen") { e.preventDefault(); if (p.credits && !confirm("Es perdran els retocs que hagis fet al text. Tornar a generar-lo?")) return; delete p.credits; delete p.credGen; await H.put(p, 1); return pintar() }
    if (k === "treq") { p.equip = (p.equip || []).filter(x => x.id !== b.dataset.id); await H.put(p, 1); return pintar() }
    if (k === "trar") { if (!confirm("Treure aquest arxiu?")) return; H.api("DELETE", "archivo/" + b.dataset.id).catch(() => { }); p.archivos = (p.archivos || []).filter(a => a.id !== b.dataset.id); await H.put(p, 1); return pintar() }
  });
  el.addEventListener("input", async e => {
    if (e.target.id !== "eqtxt") return; const p = await doc(); if (!p) return;
    if (!p.credits) { const pers = await H.col("persona"); p.credGen = credits(p, (p.ordreMa ? (p.equip || []) : perDepartaments(p.equip || [], pers)).map(x => Object.assign({}, x, { p: pers.find(y => y.id === x.id) })).filter(x => x.p)) }
    p.credits = e.target.value; const l = e.target.value.length, nn = document.getElementById("eqn"); nn.textContent = l > 2200 ? `Sobren ${l - 2200} caràcters (màxim 2.200)` : l + " / 2.200 caràcters"; nn.style.color = l > 2200 ? "#ff3b30" : ""; H.put(p);
  });
  el.addEventListener("change", async e => {
    const t = e.target, p = await doc(); if (!p) return;
    if (t.id === "prguio" && t.files[0]) { const f = t.files[0]; t.value = ""; const l = t.closest("label"); l.classList.add("ocupat"); await pujaGuio(p.id, f); l.classList.remove("ocupat"); return pintar() }
    if (t.id === "prup" && t.files.length) {
      for (const f of t.files) {
        if (f.size > 25 * 1024 * 1024) { H.toast(f.name + " passa de 25 MB"); continue }
        H.toast("Pujant " + f.name + "…");
        try { const a = await H.api("POST", "archivo?nombre=" + encodeURIComponent(f.name), f); p.archivos = (p.archivos || []).concat(a) } catch (er) { H.toast("No s'ha pogut pujar " + f.name) }
      }
      await H.put(p, 1); H.toast("Fet"); return pintar();
    }
    if (t.id === "eqarx" && t.files[0]) { const f = t.files[0]; t.value = ""; return llegeixFormulari(p, f) }
    if (t.dataset.c) { p.cred = Object.assign({}, p.cred, { [t.dataset.c]: t.type === "checkbox" ? t.checked : t.value }); if (!p.credits || confirm("Has retocat el text dels crèdits. Vols tornar-lo a generar amb aquest format? (Es perdran els retocs)")) delete p.credits; await H.put(p, 1); return pintar() }
    if (t.dataset.rol) { const x = (p.equip || []).find(y => y.id === t.dataset.rol); if (x) { x.rol = t.value.trim(); await H.put(p, 1); if (!p.credits) pintar() } }
    if (t.id === "prln") { p.enlaces = t.value; await H.put(p, 1); pintar() }
  });
  H.onChange(() => { if (!el.hidden && !el.contains(document.activeElement)) pintar() });
  if (window.BRIEF) BRIEF.connecta(el, doc, () => pintar());
  window.addEventListener("hub-sec", e => { if (e.detail === "projecte") pintar() });
  pintar();
})();
