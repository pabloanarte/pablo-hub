// Correu: Gmail de pablo.anarte.film@gmail.com a través del pont d'Apps Script (functions/api → /api/correu/…).
// Llegir, respondre, escriure, programar enviaments i veure què toca amb els contactes.
(() => {
  const { E } = H, el = document.getElementById("s-correu");
  const COMPTE = "pablo.anarte.film@gmail.com";
  const VIS = { rebuts: ["Rebuts", "in:inbox"], nollegits: ["No llegits", "in:inbox is:unread"], enviats: ["Enviats", "in:sent"], tot: ["Tot", "-in:spam -in:trash"], programats: ["Programats", ""] };
  let vis = "rebuts", q = "", fils = [], fi = false, obert = null, ver = 0, connectat = null;
  const api = (m, p, b) => H.api(m, "correu/" + p, b);
  const data = s => { const d = new Date(s), h = new Date(); return d.toDateString() === h.toDateString() ? d.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("ca-ES", { day: "numeric", month: "short", year: d.getFullYear() === h.getFullYear() ? undefined : "numeric" }) };
  const sp = v => String(v || "").split(/[,;\n]+/).map(x => x.trim().toLowerCase()).filter(Boolean);
  const adr = s => ((String(s || "").match(/<([^>]+)>/) || [])[1] || String(s || "")).trim().toLowerCase();
  const nom = s => String(s || "").replace(/<[^>]+>/, "").replace(/"/g, "").trim() || adr(s);
  async function contactes() { return (window.CONT ? CONT.tots() : await H.contactos()) || [] }
  const deContacte = (cs, ems) => cs.find(c => sp(c.email).some(x => ems.includes(x)));
  const errText = e => (e && e.error) ? (e.error === "config" ? "El correu no està connectat." : e.error) : "No s'ha pogut connectar amb Gmail.";

  // ---------- connexió ----------
  async function guia() {
    el.innerHTML = `<div class="card" style="max-width:760px"><h3>Connectar el correu</h3>
      <p>El hub llegeix i envia des de <b>${COMPTE}</b> a través d'un petit programa que viu dins del teu propi compte de Google. Es fa una sola vegada (uns 5 minuts):</p>
      <ol class="pasos">
        <li>Obre <a class="ln" href="https://script.google.com/home/projects/create" target="_blank" rel="noopener">script.google.com</a> amb el compte <b>${COMPTE}</b>. Es crea un projecte nou: clica el nom de dalt i posa-li «Puente Web».</li>
        <li>Esborra el que hi ha a l'editor i enganxa-hi aquest codi: <button class="b2" data-k="copia">Copiar el codi</button></li>
        <li>Desa (icona del disquet). A la barra de dalt, al desplegable de funcions, tria <b>configurar</b> i prem <b>Ejecutar</b>. Google et demanarà permís: «Revisar permisos» → el teu compte → «Configuración avanzada» → «Ir a Puente Web». Si surten caselles, marca-les totes («Seleccionar todo») i prem «Continuar» o «Permitir».</li>
        <li>A baix, al «Registro de ejecución», surt una clau llarga. Copia-la.</li>
        <li>Prem <b>Implementar → Nueva implementación</b>. A la rodeta, tria <b>Aplicación web</b>. «Ejecutar como»: <b>Yo</b>. «Quién tiene acceso»: <b>Cualquier usuario</b>. Prem Implementar i copia l'<b>URL de l'aplicació web</b> (acaba en /exec).</li>
        <li>Enganxa les dues coses aquí:</li>
      </ol>
      <label>URL de l'aplicació web</label><input id="cg-u" placeholder="https://script.google.com/macros/s/…/exec">
      <label>Clau</label><input id="cg-c" type="password" placeholder="La clau del registre d'execució">
      <div class="ls" style="margin-top:12px"><button class="b" data-k="connecta">Connectar</button><span id="cg-st" class="em"></span></div>
      <p class="em">La clau es guarda només al servidor del hub; no surt mai al navegador. Els botons de Google surten en castellà perquè és l'idioma del teu compte. Si algun dia canvio el codi del pont, caldrà enganxar-lo de nou i a «Implementar → Gestionar implementaciones» editar-la i triar «Nueva versión» (l'URL no canvia).</p></div>`;
  }

  // ---------- llista ----------
  async function pintar() {
    const v = ++ver;
    if (connectat === null) { try { connectat = (await api("GET", "config")).connectat } catch (e) { if (e && e.offline) { el.innerHTML = '<p class="em" style="padding:20px 0">Sense connexió. El correu necessita internet.</p>'; return } connectat = false } }
    if (v !== ver) return;
    if (!connectat) return guia();
    if (obert) return fil(obert);
    el.innerHTML = `<div class="bar" style="flex-wrap:wrap"><div class="seg" style="flex-wrap:wrap">${Object.entries(VIS).map(([k, [l]]) => `<button class="t ${k === vis ? "on" : ""}" data-k="vis" data-v="${k}">${l}</button>`).join("")}</div>
      <input id="cq" class="cq" placeholder="Cerca al correu (com a Gmail: from:, subject:…)" value="${E(q)}" style="flex:1;min-width:200px"><button class="b2" data-k="refresca">Actualitzar</button><button class="b" data-k="nou">+ Nou correu</button></div><div id="cl"><p class="em">Carregant…</p></div>`;
    if (vis === "programats") return programats(v);
    fils = []; fi = false; await mes(v);
  }
  async function mes(v) {
    try {
      const qq = q ? q : VIS[vis][1]; // una cerca busca a tot el correu, no només a la pestanya
      const r = await api("GET", `llista?max=30&inici=${fils.length}&q=${encodeURIComponent(qq)}`); if (v !== ver) return;
      fils = fils.concat(r.fils); fi = r.fils.length < 30; await llista();
    } catch (e) { if (v === ver) document.getElementById("cl").innerHTML = `<p class="em">${E(errText(e))}</p>` }
  }
  async function llista() {
    const cs = await contactes(), cl = document.getElementById("cl"); if (!cl) return;
    cl.innerHTML = fils.length ? `<div class="crl">${fils.map(f => { const c = deContacte(cs, f.participants.filter(x => x !== COMPTE)); return `<div class="r crf ${f.nollegit ? "nl" : ""}" data-k="obre" data-id="${f.id}"><i class="dot" style="background:${f.nollegit ? "#000" : "transparent"}"></i><div class="g"><b>${E(f.de)}${f.n > 1 ? ` <span class="mut">${f.n}</span>` : ""}${c ? ` <span class="xip"><i style="background:${window.CONT ? CONT.color(c.estado) : "#c7c7cc"}"></i>${E(c.nombre)}</span>` : ""}</b><small><span class="cas">${E(f.assumpte || "(sense assumpte)")}</span> — ${E(f.resum)}</small></div><small class="cdt">${data(f.data)}</small></div>` }).join("")}</div>${fi ? "" : `<div class="ls" style="justify-content:center;margin-top:12px"><button class="b2" data-k="mes">Carregar-ne més</button></div>`}` : `<p class="em">No hi ha correus aquí.</p>`;
  }
  async function programats(v) {
    try {
      const r = await api("GET", "programats"); if (v !== ver) return;
      document.getElementById("cl").innerHTML = r.llista.length ? r.llista.map(p => `<div class="r"><i class="dot" style="background:${p.error ? "#ff3b30" : "#ff9f0a"}"></i><div class="g"><b>${E(p.assumpte || "(resposta)")} → ${E(p.a || "")}</b><small>${new Date(p.quan).toLocaleString("ca-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}${p.error ? (p.intents >= 3 ? " · no s'ha pogut enviar: " : " · reintentant: ") + E(p.error) : ""} · ${E(String(p.resum || "").slice(0, 90))}</small></div><button class="del" style="margin:0" data-k="cancela" data-id="${p.id}">Cancel·lar</button></div>`).join("") + `<p class="em">Es revisen cada 5 minuts, així que poden sortir fins a 5 minuts més tard de l'hora triada.</p>` : `<p class="em">No hi ha cap enviament programat.</p>`;
    } catch (e) { if (v === ver) document.getElementById("cl").innerHTML = `<p class="em">${E(errText(e))}</p>` }
  }

  // ---------- un fil ----------
  async function fil(id) {
    obert = id; const v = ++ver;
    el.innerHTML = `<div class="bar"><button class="b2" data-k="torna">← Correu</button><span style="flex:1"></span><a class="b2" style="text-decoration:none;display:inline-flex;align-items:center" target="_blank" rel="noopener" href="https://mail.google.com/mail/u/?authuser=${COMPTE}#all/${E(id)}">Obrir a Gmail</a></div><p class="em">Carregant…</p>`;
    try {
      const [f, cs] = await Promise.all([api("GET", "fil?llegit=1&id=" + encodeURIComponent(id)), contactes()]); if (v !== ver) return;
      const ems = [...new Set(f.missatges.flatMap(m => [m.de, m.a, m.cc].join(",").split(",").map(adr)))].filter(x => x && x !== COMPTE), c = deContacte(cs, ems);
      // el pont respon a l'últim missatge de l'altra persona; aquí es mostra i s'apunta la mateixa adreça
      const EM = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g, alt = f.missatges.filter(m => adr(m.de) !== COMPTE), ult = f.missatges[f.missatges.length - 1];
      const resp = alt.length ? adr(alt[alt.length - 1].rt || alt[alt.length - 1].de) : ((ult.a.match(EM) || [])[0] || "").toLowerCase();
      el.querySelector(".em").outerHTML = `<h2 class="cass">${E(f.assumpte || "(sense assumpte)")}</h2>
        ${c ? `<div class="ls" style="margin-bottom:10px"><span class="xip"><i style="background:${window.CONT ? CONT.color(c.estado) : "#c7c7cc"}"></i>${E(c.nombre)} · ${E(c.estado || "Pendent")}</span><button class="b2" data-k="contacte" data-id="${c.id}">Obrir la fitxa</button>${c.estado === "Contactat" && f.missatges.some(m => adr(m.de) !== COMPTE) ? `<button class="b2" data-k="respost" data-id="${c.id}">Marcar «Ha respost»</button>` : ""}</div>` : ""}
        ${f.missatges.map((m, i) => `<details class="cms" ${i >= f.missatges.length - 2 ? "open" : ""}><summary><b>${E(nom(m.de))}</b><span class="mut"> ${E(adr(m.de))}</span><span class="cdt">${new Date(m.data).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></summary><small class="mut">Per a: ${E(m.a)}${m.cc ? " · Cc: " + E(m.cc) : ""}</small><div class="ccos">${E(m.cos.replace(/\n{3,}/g, "\n\n").trim())}</div>${m.adjunts.length ? `<small class="mut">Adjunts: ${m.adjunts.map(a => E(a.nom)).join(", ")} (obre'ls a Gmail)</small>` : ""}</details>`).join("")}
        <div class="card" style="margin-top:16px"><h3>Respondre a ${E(resp)}</h3><textarea id="cr-t" rows="7" placeholder="Escriu la resposta…"></textarea>${envBar("resp")}</div>`;
      el.dataset.resp = resp; el.dataset.ass = f.assumpte || "";
    } catch (e) { if (v === ver) el.querySelector(".em").textContent = errText(e) }
  }
  const envBar = k => `<div class="ls envb" style="margin-top:10px"><button class="b" data-k="env-${k}">Enviar ara</button><span style="flex:1"></span><input type="datetime-local" id="cr-q-${k}" style="width:auto"><button class="b2" data-k="prog-${k}">Programar</button></div>`;

  // ---------- escriure ----------
  async function nou(a = "", ass = "", cos = "") {
    const cs = (await contactes()).filter(c => sp(c.email).length);
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Nou correu</h2>
      <label>Per a</label><input id="cn-a" list="cn-dl" value="${E(a)}" placeholder="Nom d'un contacte o adreça"><datalist id="cn-dl">${cs.flatMap(c => sp(c.email).map(e => `<option value="${E(e)}">${E(c.nombre)}</option>`)).join("")}</datalist>
      <label>Cc (opcional)</label><input id="cn-cc">
      <label>Assumpte</label><input id="cn-s" value="${E(ass)}">
      <label>Missatge</label><textarea id="cn-t" rows="12">${E(cos)}</textarea>
      ${envBar("nou")}`);
  }
  let ocupat = false;
  const local = d => { const x = new Date(d); return new Date(x - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) };
  async function envia(k, quan) {
    if (ocupat) return;
    const b = document.querySelector(`[data-k="env-${k}"]`), bp = document.querySelector(`[data-k="prog-${k}"]`), cos = (document.getElementById(k === "nou" ? "cn-t" : "cr-t") || {}).value || "";
    const o = k === "nou" ? { a: document.getElementById("cn-a").value.trim(), cc: document.getElementById("cn-cc").value.trim(), assumpte: document.getElementById("cn-s").value.trim(), cos } : { a: el.dataset.resp, assumpte: "Re: " + el.dataset.ass.replace(/^re:\s*/i, ""), cos, fil: obert };
    if (!/@/.test(o.a)) return H.toast("Falta l'adreça"); if (!cos.trim()) return H.toast("El missatge és buit");
    if (quan) { if (new Date(quan) <= new Date()) return H.toast("Ha de ser una hora futura"); o.quan = new Date(quan).toISOString() }
    ocupat = true; if (bp) bp.disabled = true; if (b) { b.disabled = true; b.textContent = quan ? "Programant…" : "Enviant…" }
    try {
      const r = await api("POST", "envia", o);
      window.CONT && CONT.registra(o.a, (o.assumpte ? "Asunto: " + o.assumpte + "\n\n" : "") + cos, quan ? local(o.quan) : H.today(), r.programat);
      H.toast(quan ? "Programat per al " + new Date(quan).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Enviat");
      if (k === "nou") H.cerrar(); else fil(obert);
    } catch (e) { H.toast(errText(e)); if (b) { b.disabled = false; b.textContent = "Enviar ara" } if (bp) bp.disabled = false }
    ocupat = false;
  }

  // ---------- esdeveniments ----------
  const clic = async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    if (b.tagName === "A" && !b.target) e.preventDefault();
    if (k === "copia") { const t = await (await fetch("/pont-gmail.gs")).text(); try { await navigator.clipboard.writeText(t); H.toast("Codi copiat") } catch (er) { H.toast("No s'ha pogut copiar") } }
    if (k === "connecta") {
      const st = document.getElementById("cg-st"); st.textContent = "Comprovant…";
      try { await api("PUT", "config", { url: document.getElementById("cg-u").value.trim(), clau: document.getElementById("cg-c").value.trim() }); connectat = true; H.toast("Correu connectat"); pintar() } catch (er) { st.textContent = errText(er) }
    }
    if (k === "vis") { vis = b.dataset.v; q = ""; pintar() } // canviar de pestanya treu la cerca
    if (k === "refresca") pintar();
    if (k === "mes") { b.disabled = true; mes(ver) }
    if (k === "obre") fil(b.dataset.id);
    if (k === "torna") { obert = null; pintar() }
    if (k === "nou") nou();
    if (k === "cancela" && confirm("Cancel·lar aquest enviament programat?")) { try { await api("POST", "cancela", { id: b.dataset.id }); window.CONT && CONT.desprograma(b.dataset.id); H.toast("Cancel·lat") } catch (er) { H.toast(errText(er)) } pintar() }
    if (k === "contacte") window.CONT && CONT.obre(b.dataset.id);
    if (k === "respost") { CONT.estat(b.dataset.id, "Ha respost"); H.toast("Marcat com a «Ha respost»"); b.remove() }
    if (k.startsWith("env-")) envia(k.slice(4));
    if (k.startsWith("prog-")) { const v = document.getElementById("cr-q-" + k.slice(5)).value; if (!v) return H.toast("Tria el dia i l'hora"); envia(k.slice(5), v) }
  };
  el.addEventListener("click", clic);
  document.getElementById("hsh").addEventListener("click", e => { if (e.target.closest('[data-k^="env-nou"],[data-k^="prog-nou"]')) clic(e) });
  el.addEventListener("keydown", e => { if (e.target.id === "cq" && e.key === "Enter") { q = e.target.value.trim(); pintar() } });
  window.addEventListener("hub-sec", e => { if (e.detail === "correu") pintar() });
  window.CORREU = { obre: id => { obert = id; hubShow("correu") }, nou, connectat: async () => { if (connectat === null) { try { connectat = (await api("GET", "config")).connectat } catch (e) { if (e && e.offline) { el.innerHTML = '<p class="em" style="padding:20px 0">Sense connexió. El correu necessita internet.</p>'; return } connectat = false } } return connectat } };
  if (!el.hidden) pintar();
})();
