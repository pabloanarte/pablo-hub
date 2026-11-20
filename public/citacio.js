// Full de citació (call sheet) d'una jornada d'un pla de rodatge.
// Es crea a partir del pla (horaris, sets, plans, personatges) i després TOT és editable a mà abans d'exportar-lo o enviar-lo.
// Es desa dins la jornada: doc.dias[i].citacio. "Tornar a omplir des del pla" només refà les parts que triïs.
window.CIT = (() => {
  const E = H.E, { aMin, aHora, uid } = R;
  let doc, dia, torna, el, c;
  const D = () => doc.dias[dia];
  const save = () => { D().citacio = c; H.put(doc) };
  // columnes de cada taula editable
  const T = {
    horaris: [["nom", "Què", 2], ["hora", "Hora", 1]],
    locs: [["nom", "Set / localització", 2], ["adreca", "Adreça", 3], ["notes", "Aparcament, accés, notes", 3], ["hospital", "Hospital més proper", 3]],
    pla: [["hora", "Hora", 1], ["pla", "Pla", 1], ["esc", "Esc.", 1], ["desc", "Descripció", 4], ["pers", "Personatges", 2], ["notes", "Notes", 2]],
    rep: [["pers", "Personatge", 2], ["actor", "Actor / actriu", 2], ["recollida", "Recollida", 1], ["maq", "Maquillatge", 1], ["apunt", "A punt", 1], ["tel", "Telèfon", 2], ["email", "Email", 2]],
    equip: [["rol", "Rol", 2], ["nom", "Nom", 2], ["call", "Citació", 1], ["tel", "Telèfon", 2], ["email", "Email", 2]]
  };
  const TIT = { horaris: "Horaris", locs: "Localitzacions", pla: "Pla del dia", rep: "Repartiment", equip: "Equip" };

  // ---------- omplir des del pla ----------
  function horasDia(d) { let t = aMin(d.ready) ?? 540; return d.filas.map(f => { if (f.fija && aMin(f.fija) != null) t = aMin(f.fija); const ini = t; if (["plano", "proceso", "comida"].includes(f.tipo)) t += +f.dur || 0; return { ini, fin: t } }) }
  function desDelPla(parts) {
    const d = D(), hs = horasDia(d), n = {};
    if (parts.includes("horaris")) {
      const h = String(d.calls || "").split("\n").map(x => x.trim()).filter(Boolean).map(x => { const m = x.match(/^(\d{1,2}[:.h]\d{2})\s*[-–·]?\s*(.*)$/); return m ? { id: uid(), hora: m[1].replace(/[.h]/, ":"), nom: m[2] || "Citació" } : { id: uid(), hora: "", nom: x } });
      h.push({ id: uid(), nom: "Ready to shoot", hora: d.ready || "" });
      d.filas.forEach((f, i) => { if (f.tipo === "comida") h.push({ id: uid(), nom: "Dinar", hora: aHora(hs[i].ini) + " – " + aHora(hs[i].fin) }) });
      if (hs.length) h.push({ id: uid(), nom: "Wrap previst", hora: aHora(hs.at(-1).fin) });
      n.horaris = h;
    }
    if (parts.includes("locs")) {
      const sets = [...new Set(d.filas.filter(f => f.tipo === "set" && f.texto && f.texto.trim()).map(f => f.texto.trim()))];
      n.locs = (sets.length ? sets : [""]).map((s, i) => ({ id: uid(), nom: s, adreca: i === 0 ? d.lugar || "" : "", notes: "", hospital: "" }));
    }
    if (parts.includes("pla")) n.pla = d.filas.map((f, i) => f.tipo === "plano" ? { id: uid(), hora: aHora(hs[i].ini), pla: f.num || "", esc: f.esc || "", desc: [f.escala, f.desc].filter(Boolean).join(" · "), pers: f.personajes || "", notes: [f.vestuario, f.notas].filter(Boolean).join(" · ") }
      : f.tipo === "set" ? { id: uid(), hora: "", pla: "", esc: "", desc: "SET: " + (f.texto || ""), pers: "", notes: "", banda: 1 }
        : { id: uid(), hora: aHora(hs[i].ini), pla: "", esc: "", desc: (f.tipo === "comida" ? "DINAR" : f.tipo === "wrap" ? "WRAP" : f.texto || "PROCÉS"), pers: "", notes: "", banda: 1 });
    if (parts.includes("rep")) {
      const primer = {};
      d.filas.forEach((f, i) => { if (f.tipo === "plano") String(f.personajes || "").split(/[,/;+\n]| i | y | and /).map(x => x.trim()).filter(x => x && !/^-+$/.test(x)).forEach(p => { if (!(p in primer)) primer[p] = hs[i].ini }) });
      const ve = (c.rep || []).reduce((m, r) => (m[r.pers] = r, m), {});
      n.rep = Object.entries(primer).map(([p, t]) => Object.assign({ id: uid(), pers: p, actor: "", recollida: "", maq: aHora(Math.max(0, t - 60)), apunt: aHora(Math.max(0, t - 15)), tel: "", email: "" }, ve[p] ? { actor: ve[p].actor, tel: ve[p].tel, email: ve[p].email, recollida: ve[p].recollida } : {}));
    }
    Object.assign(c, n);
  }
  async function nova() {
    const d = D(), p = doc.proyecto && (await H.col("proyecto")).find(x => x.id === doc.proyecto);
    c = { titol: (p && p.titulo) || doc.titulo || "", direccio: "Pablo Anarte", ad: doc.ad || "", produccio: "", data: d.fecha || "", jornada: `${dia + 1} de ${doc.dias.length}`, temps: { lloc: "", text: "" }, notes: "", emergencia: "Emergències: 112", equip: [], missatge: "" };
    desDelPla(["horaris", "locs", "pla", "rep"]);
  }

  // ---------- editor ----------
  async function obre(d0, i, fn) {
    doc = d0; dia = i; torna = fn; el = document.getElementById("s-planes");
    if (D().citacio) c = D().citacio; else { await nova(); save() }
    pinta();
  }
  const taula = k => `<div class="card cit"><h3>${TIT[k]}</h3><div class="cits"><table class="ctab"><thead><tr>${T[k].map(([, l, w]) => `<th style="width:${w * 10}%">${l}</th>`).join("")}<th style="width:34px"></th></tr></thead><tbody>${(c[k] || []).map((r, i) => `<tr class="${r.banda ? "cb" : ""}">${T[k].map(([f]) => `<td><textarea rows="1" data-t="${k}" data-i="${i}" data-f="${f}">${E(r[f] || "")}</textarea></td>`).join("")}<td><button class="x" data-c="treu" data-t="${k}" data-i="${i}" title="Treure la fila">×</button></td></tr>`).join("")}</tbody></table></div>
    <div class="ls" style="margin-top:8px"><button class="b2" data-c="fila" data-t="${k}">+ Fila</button>${k === "equip" || k === "rep" ? `<input list="cit-dl" data-c="base" data-t="${k}" placeholder="Afegir des d'Equip i repartiment…" style="flex:1;min-width:220px">` : ""}${["horaris", "locs", "pla", "rep"].includes(k) ? `<button class="b2" data-c="refa" data-t="${k}">Tornar a omplir des del pla</button>` : ""}</div></div>`;
  async function pinta() {
    const gent = await H.col("persona").catch(() => []);
    el.innerHTML = `<div class="bar" style="flex-wrap:wrap"><button class="b2" data-c="torna">← Pla de rodatge</button><b style="font-size:17px">Full de citació · jornada ${dia + 1}</b><span style="flex:1"></span><button class="b2" data-c="pdf">PDF</button><button class="b" data-c="envia">Enviar per correu…</button></div>
      <p class="em" style="margin:0 0 14px">Tot és editable: el que canviïs aquí no toca el pla de rodatge. Es desa sol.</p>
      <div class="card cit"><div class="g3"><div><label>Projecte</label><input data-k="titol" value="${E(c.titol)}"></div><div><label>Data</label><input type="date" data-k="data" value="${E(c.data)}"></div><div><label>Jornada</label><input data-k="jornada" value="${E(c.jornada)}"></div>
        <div><label>Direcció</label><input data-k="direccio" value="${E(c.direccio)}"></div><div><label>Ajudant de direcció</label><input data-k="ad" value="${E(c.ad)}"></div><div><label>Producció (nom i telèfon)</label><input data-k="produccio" value="${E(c.produccio)}"></div></div></div>
      ${taula("horaris")}${taula("locs")}
      <div class="card cit"><h3>Previsió del temps</h3><div class="ls"><input data-k="temps.lloc" value="${E(c.temps.lloc)}" placeholder="Població (p. ex. Sitges)" style="flex:1;min-width:180px"><button class="b2" data-c="temps">Buscar la previsió</button></div><textarea data-k="temps.text" rows="2" style="margin-top:8px" placeholder="Temperatura, pluja, sortida i posta de sol…">${E(c.temps.text)}</textarea></div>
      ${taula("pla")}${taula("rep")}${taula("equip")}
      <div class="card cit"><h3>Notes per departament</h3><textarea data-k="notes" rows="5" placeholder="Art: …&#10;Vestuari: …&#10;So: …&#10;Vehicles i parking: …">${E(c.notes)}</textarea><label>Emergències</label><textarea data-k="emergencia" rows="2">${E(c.emergencia)}</textarea></div>
      <div class="ls" style="margin:18px 0 40px"><button class="del" style="margin:0" data-c="reset">Tornar a fer-la tota des del pla</button></div>
      <datalist id="cit-dl">${gent.map(p => `<option value="${E(p.titulo || "")}">${E([p.rol, p.tipus].filter(Boolean).join(" · "))}</option>`).join("")}</datalist>`;
    requestAnimationFrame(() => el.querySelectorAll(".cit textarea").forEach(alca));
  }
  const alca = t => { t.style.height = "auto"; t.style.height = t.scrollHeight + "px" };

  // ---------- full imprès i correu (el mateix contingut) ----------
  function full(perCorreu) {
    const td = "border:1px solid #d1d1d6;padding:5px 6px;vertical-align:top;font-size:12px", th = td + ";background:#f2f2f7;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em";
    const tb = (k, cols) => (c[k] || []).length ? `<h3 style="font-size:13px;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.06em">${TIT[k]}</h3><table style="border-collapse:collapse;width:100%">${cols ? `<tr>${T[k].map(([, l]) => `<th style="${th}">${l}</th>`).join("")}</tr>` : ""}${c[k].map(r => `<tr${r.banda ? ' style="background:#f2f2f7;font-weight:700"' : ""}>${T[k].map(([f]) => `<td style="${td}">${E(r[f] || "").replace(/\n/g, "<br>")}${f === "adreca" && r.adreca ? `<br><a href="https://maps.google.com/?q=${encodeURIComponent(r.adreca)}" style="color:#0a84ff">Mapa</a>` : ""}</td>`).join("")}</tr>`).join("")}</table>` : "";
    const cap = [["Direcció", c.direccio], ["Ajudant de direcció", c.ad], ["Producció", c.produccio]].filter(x => x[1]).map(([l, v]) => `<b>${l}:</b> ${E(v)}`).join(" &nbsp;·&nbsp; ");
    return `<div style="font-family:Helvetica,Arial,sans-serif;color:#000;max-width:${perCorreu ? "760px" : "none"}">
      <table style="width:100%;border-collapse:collapse"><tr><td style="vertical-align:top"><div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6e6e73">Full de citació</div><div style="font-size:24px;font-weight:700;margin:2px 0">${E(c.titol)}</div><div style="font-size:12px">${cap}</div></td>
      <td style="vertical-align:top;text-align:right;white-space:nowrap"><div style="font-size:18px;font-weight:700">${c.data ? E(H.fecha(c.data, true)) : ""}</div><div style="font-size:12px">Jornada ${E(c.jornada)}</div></td></tr></table>
      ${tb("horaris")}${tb("locs", 1)}${c.temps.text ? `<h3 style="font-size:13px;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.06em">Temps${c.temps.lloc ? " · " + E(c.temps.lloc) : ""}</h3><div style="font-size:12px">${E(c.temps.text).replace(/\n/g, "<br>")}</div>` : ""}
      ${tb("pla", 1)}${tb("rep", 1)}${tb("equip", 1)}
      ${c.notes ? `<h3 style="font-size:13px;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.06em">Notes</h3><div style="font-size:12px">${E(c.notes).replace(/\n/g, "<br>")}</div>` : ""}
      ${c.emergencia ? `<div style="font-size:12px;margin-top:14px;padding:8px;border:1px solid #ff3b30;border-radius:6px;box-sizing:border-box">${E(c.emergencia).replace(/\n/g, "<br>")}</div>` : ""}</div>`;
  }
  const assumpte = () => `Citació · ${c.titol || "rodatge"} · jornada ${c.jornada}${c.data ? " · " + H.fecha(c.data) : ""}`;
  const destinataris = () => [...new Set([...(c.equip || []), ...(c.rep || [])].map(r => String(r.email || "").trim().toLowerCase()).filter(x => /@/.test(x)))];
  async function enviar() {
    const ds = destinataris();
    let ok = false; try { ok = (await H.api("GET", "correu/config")).connectat } catch (e) { }
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Enviar la citació</h2>
      ${ok ? "" : `<p class="em" style="color:#ff3b30">El correu encara no està connectat (secció Correu). Mentrestant pots descarregar el PDF i enviar-lo tu.</p>`}
      <label>Destinataris (van en còpia oculta; cadascú només veu la seva adreça)</label>
      <div class="ls">${ds.map(x => `<label class="ck" style="margin:0 10px 0 0"><input type="checkbox" class="cd" value="${E(x)}" checked> ${E(x)}</label>`).join("") || `<span class="em">Cap fila d'Equip o Repartiment té email.</span>`}</div>
      <label>Altres adreces (separades per comes)</label><input id="ce-x">
      <label>Assumpte</label><input id="ce-s" value="${E(assumpte())}">
      <label>Missatge (va a sobre de la citació)</label><textarea id="ce-m" rows="4">${E(c.missatge || `Hola a tothom,\n\nUs passo la citació ${c.data === H.addDays(H.today(), 1) ? "de demà" : c.data ? "del " + H.fecha(c.data, true) : "de la jornada"}. Qualsevol dubte, digueu-me.\n\nPablo`)}</textarea>
      <label>Vista prèvia</label><div style="border:1px solid var(--bd);border-radius:12px;padding:14px;max-height:340px;overflow:auto">${full(1)}</div>
      <div class="ls envb" style="margin-top:14px"><button class="b" data-c="env" ${ok ? "" : "disabled"}>Enviar ara</button><span style="flex:1"></span><input type="datetime-local" id="ce-q" style="width:auto"><button class="b2" data-c="prog" ${ok ? "" : "disabled"}>Programar</button></div>`);
  }
  async function fesEnvia(quan) {
    const sel = [...document.querySelectorAll("#hshc .cd:checked")].map(x => x.value).concat(document.getElementById("ce-x").value.split(/[,;\s]+/).filter(x => /@/.test(x)));
    if (!sel.length) return H.toast("Tria almenys un destinatari");
    if (quan && new Date(quan) <= new Date()) return H.toast("Ha de ser una hora futura");
    const m = document.getElementById("ce-m").value; c.missatge = m; save();
    const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;margin-bottom:18px">${E(m).replace(/\n/g, "<br>")}</div>` + full(1);
    const text = m + "\n\n(La citació es veu en format HTML. Si no la veus, demana-la en PDF.)";
    document.querySelectorAll("#hshc [data-c=env],#hshc [data-c=prog]").forEach(b => b.disabled = true);
    try {
      const r = await H.api("POST", "correu/envia", { a: "pablo.anarte.film@gmail.com", bcc: sel.join(","), assumpte: document.getElementById("ce-s").value, cos: text, html, quan: quan ? new Date(quan).toISOString() : "" });
      H.cerrar(); H.toast(r.programat ? "Citació programada" : `Citació enviada a ${sel.length} ${sel.length === 1 ? "persona" : "persones"}`);
    } catch (e) { H.toast(e && e.error === "config" ? "El correu no està connectat" : "No s'ha pogut enviar: " + ((e && e.error) || "")); document.querySelectorAll("#hshc [data-c=env],#hshc [data-c=prog]").forEach(b => b.disabled = false) }
  }
  async function temps() {
    const lloc = c.temps.lloc || (c.locs[0] && c.locs[0].adreca) || ""; if (!lloc) return H.toast("Escriu la població");
    if (!c.data) return H.toast("Falta la data de la jornada");
    const dif = Math.round((new Date(c.data + "T12:00") - new Date()) / 864e5); if (dif > 15) return H.toast("La previsió només arriba a 16 dies vista");
    try {
      const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&language=ca&name=${encodeURIComponent(lloc.split(",")[0])}`)).json(), p = g.results && g.results[0];
      if (!p) return H.toast("No trobo aquesta població");
      const f = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset&timezone=Europe%2FMadrid&start_date=${c.data}&end_date=${c.data}`)).json(), x = f.daily;
      c.temps.lloc = c.temps.lloc || p.name;
      c.temps.text = `${Math.round(x.temperature_2m_min[0])}–${Math.round(x.temperature_2m_max[0])} °C · probabilitat de pluja ${x.precipitation_probability_max[0] ?? "?"}% · vent fins a ${Math.round(x.wind_speed_10m_max[0])} km/h · surt el sol ${x.sunrise[0].slice(11)} · es pon ${x.sunset[0].slice(11)}`;
      save(); pinta(); H.toast("Previsió afegida (la pots editar)");
    } catch (e) { H.toast("No s'ha pogut obtenir la previsió") }
  }

  // ---------- esdeveniments (només quan la citació és oberta) ----------
  const viu = () => el && el.querySelector('[data-c="torna"]') && c;
  document.addEventListener("input", e => {
    const t = e.target; if (!viu() || !el.contains(t)) return;
    if (t.dataset.c === "base") return;
    if (t.dataset.t) { c[t.dataset.t][+t.dataset.i][t.dataset.f] = t.value; alca(t); return save() }
    if (t.dataset.k) { const [a, b] = t.dataset.k.split("."); if (b) c[a][b] = t.value; else c[a] = t.value; save() }
  });
  document.addEventListener("change", async e => {
    const t = e.target; if (!viu() || t.dataset.c !== "base" || !t.value) return;
    const p = (await H.col("persona")).find(x => (x.titulo || "") === t.value); if (!p) return;
    const k = t.dataset.t;
    if ([...(c.equip || []), ...(c.rep || [])].some(r => (r.nom || r.actor) === p.titulo)) { t.value = ""; return H.toast("Ja hi és") }
    if (k === "equip") c.equip.push({ id: uid(), rol: p.rol || "", nom: p.titulo || "", call: "", tel: p.tel || "", email: p.email || "" });
    else { const lliure = c.rep.find(r => !r.actor); if (lliure) Object.assign(lliure, { actor: p.titulo || "", tel: p.tel || "", email: p.email || "" }); else c.rep.push({ id: uid(), pers: "", actor: p.titulo || "", recollida: "", maq: "", apunt: "", tel: p.tel || "", email: p.email || "" }) }
    save(); pinta();
  });
  document.addEventListener("click", async e => {
    const b = e.target.closest("[data-c]"); if (!b || !c) return; const k = b.dataset.c;
    const dinsSheet = b.closest("#hshc"); if (dinsSheet || !viu() || !el.contains(b)) return; // només clics de la citació oberta
    if (k === "torna") { c = null; return torna() }
    if (k === "fila") { c[b.dataset.t].push(Object.fromEntries([["id", uid()]].concat(T[b.dataset.t].map(([f]) => [f, ""])))); save(); pinta() }
    if (k === "treu") { c[b.dataset.t].splice(+b.dataset.i, 1); save(); pinta() }
    if (k === "refa" && confirm(`Refer «${TIT[b.dataset.t]}» a partir del pla? Es perdran els canvis fets a mà en aquesta taula.`)) { desDelPla([b.dataset.t]); save(); pinta() }
    if (k === "reset" && confirm("Refer tota la citació a partir del pla? Es perdran tots els canvis fets a mà.")) { await nova(); save(); pinta() }
    if (k === "temps") temps();
    if (k === "pdf") R.pdf(`<div class="pz czp">${full(0)}</div>`, false);
    if (k === "envia") enviar();
  });
  document.getElementById("hsh").addEventListener("click", e => { const b = e.target.closest("[data-c]"); if (!b || !c || !document.getElementById("ce-m")) return; if (b.dataset.c === "env") fesEnvia(); if (b.dataset.c === "prog") { const v = document.getElementById("ce-q").value; if (!v) return H.toast("Tria el dia i l'hora"); fesEnvia(v) } });
  return { obre };
})();
