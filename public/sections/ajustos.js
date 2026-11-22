// Configuració: còpia de seguretat, calendari al mòbil, hub com a app i pont de Google.
(() => {
  const { E } = H, el = document.getElementById("s-ajustos");
  const fa = s => { if (!s) return "mai"; const d = Math.floor((Date.now() - new Date(s)) / 864e5); return d <= 0 ? "avui" : d === 1 ? "ahir" : `fa ${d} dies` };
  async function pintar() {
    const [a, cal, cor, gc, dr] = await Promise.all([H.col("ajust").then(l => l.find(x => x.id === "ajust:copia") || {}), H.api("GET", "calendari").catch(() => ({})), H.api("GET", "correu/config").catch(() => ({})), H.col("ajust").then(l => l.find(x => x.id === "ajust:gcal") || {}), H.api("GET", "drecera").catch(() => ({}))]);
    el.innerHTML = `<div class="dash" style="grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr))">
      <div class="card"><h3>Còpia de seguretat</h3>
        <p>Última còpia: <b>${fa(a.ultima)}</b>${a.on === "drive" ? " (al Drive)" : a.on ? " (descarregada)" : ""}.</p>
        <p class="em">Tot el que hi ha al hub (contactes, projectes, guions, plans, dossiers…) en un sol arxiu. Els arxius pujats (fotos, vídeos) es queden al servidor i no hi van inclosos.</p>
        <div class="ls"><a class="b" href="/api/copia" download data-k="baixa">Descarregar còpia</a><label class="b2" style="cursor:pointer">Restaurar una còpia…<input type="file" accept=".json,application/json" data-k="restaura" hidden></label></div>
        <h2 style="margin-top:22px">Al Drive, cada dilluns</h2>
        ${cor.connectat ? `<p class="em">El pont de Google desa una còpia a la carpeta «Còpies PABLO hub» del teu Drive cada dilluns a les 7 i guarda les 12 últimes.</p><div class="ls"><button class="b2" data-k="drive">Fer-ne una ara al Drive</button><span id="drv" class="em"></span></div>` : `<p class="em">Quan connectis el correu (secció Correu), també es farà una còpia setmanal al teu Drive.</p>`}
      </div>
      <div class="card"><h3>Dreceres de l'iPhone</h3>
        <p class="em" style="margin-top:0">Tres dreceres per a l'app <b>Atajos</b>. Totes fan servir el mateix enllaç secret, amb un final diferent:</p>
        <div class="m"><b>Contactat al hub</b> (Instagram): acaba en <code>?u=</code> <button class="b2" data-k="drcpu" style="margin-left:6px">Copiar</button></div>
        <div class="m"><b>Apunta al hub</b> (Siri): acaba en <code>?x=</code> <button class="b2" data-k="drcpx" style="margin-left:6px">Copiar</button></div>
        <div class="m"><b>Guardar visionat</b> (YouTube o Vimeo): acaba en <code>?v=</code> <button class="b2" data-k="drcpv" style="margin-left:6px">Copiar</button></div>
        <details style="margin-top:10px"><summary class="em" style="cursor:pointer">«Apunta al hub» amb Siri</summary><ol class="pasos">
          <li>Atajos → <b>+</b> → nom <b>Apunta al hub</b> (és el que diràs a Siri: «Oye Siri, apunta al hub»).</li>
          <li>Acció <b>«Dictar texto»</b>.</li>
          <li>Acció <b>«Codificar URL»</b> amb <b>«Texto dictado»</b> (així els espais i els accents arriben bé).</li>
          <li>Acció <b>«Texto»</b>: enganxa l'enllaç que acaba en <b>?x=</b> i, just darrere, toca <b>«Texto codificado»</b> (o «URL codificada») a la tira de sobre el teclat.</li>
          <li>Acció <b>«Abrir URL»</b> amb <b>«Texto»</b>. Desa.</li>
          <li>El que dictis queda com a tasca per avui. Si comences per «idea…», va a Idees.</li></ol></details>
        <details style="margin-top:8px"><summary class="em" style="cursor:pointer">«Guardar visionat» des de YouTube o Vimeo</summary><ol class="pasos">
          <li>Fes un duplicat de «Contactat al hub» (mantén-la premuda → «Duplicar») i posa-li de nom <b>Guardar visionat</b>.</li>
          <li>On hi ha l'enllaç (el bloc <b>«Texto»</b>, o «Abrir URL» si el vas posar allà), canvia el final <b>?u=</b> per <b>?v=</b>. La burbuja «Direcciones URL» es queda darrere.</li>
          <li>A YouTube o Vimeo: Compartir → «Guardar visionat». Queda a Docència → Visionats amb títol i miniatura; després hi tries l'exercici.</li></ol></details>
        <h3 style="margin-top:18px">Drecera d'Instagram</h3>
        <p class="em">Quan escriguis a algú per Instagram per feina: al seu perfil, ⋯ → «Compartir este perfil» → «Contactat al hub». Si ja és a Contactes, queda marcat com a contactat avui; si no, s'hi afegeix.</p>
        <input readonly value="${E(dr.url || "")}" id="dru" style="font-size:13px">
        <div class="ls" style="margin-top:8px"><button class="b" data-k="drcp">Copiar l'enllaç</button><button class="b2" data-k="drnou">Canviar l'enllaç</button></div>
        <details style="margin-top:12px"><summary class="em" style="cursor:pointer">Com es crea la drecera (un sol cop)</summary><ol class="pasos">
          <li>Copia l'enllaç d'aquí dalt i envia-te'l a l'iPhone (o obre aquesta pàgina a l'iPhone i copia'l allà).</li>
          <li>App <b>Atajos</b> → <b>+</b>. Posa-li de nom <b>Contactat al hub</b>.</li>
          <li>Toca la <b>ⓘ</b> de baix → activa <b>«Mostrar en la hoja para compartir»</b>.</li>
          <li>Afegeix l'acció <b>«Obtener direcciones URL de»</b> amb <b>«Entrada del atajo»</b>.</li>
          <li>Afegeix l'acció <b>«Abrir URL»</b>. Al seu camp enganxa l'enllaç (acaba en <b>?u=</b>) i, just a continuació, toca <b>«Direcciones URL»</b> a la tira de sobre el teclat. Desa.</li>
          <li>Prova-ho: a Instagram, a un perfil → ⋯ → «Compartir este perfil» → «Contactat al hub» (si no surt, a «Más» o a «Editar acciones»). S'obrirà Safari un moment amb «✓ … contactat avui».</li>
          <li>L'enllaç és secret: qui el tingui pot afegir contactes. Si el comparteixes per error, prem «Canviar l'enllaç» i posa el nou a la drecera.</li></ol></details>
      </div>
      <div class="card"><h3>Google Calendar (editable)</h3>
        ${cor.connectat ? `<p class="em">Un calendari «PABLO hub» al teu Google Calendar, sincronitzat cada 10 minuts en els dos sentits: si hi canvies una data o una hora (també des de l'iPhone), canvia al hub.</p>
        <p>Última sincronització: <b>${gc.ultima ? new Date(gc.ultima).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "encara cap"}</b></p>
        <div class="ls"><button class="b" data-k="gcal">Sincronitzar ara</button><span id="gcs" class="em"></span></div>
        <details style="margin-top:12px"><summary class="em" style="cursor:pointer">Què es sincronitza</summary><ol class="pasos">
          <li>Hi van classes, reunions, rodatges, feines, tasques pendents i dates de festivals (dels últims 2 mesos als propers 5 anys).</li>
          <li>De Google al hub tornen la data de tot i l'hora de classes i reunions; de les reunions, també el títol, el lloc i les notes; de les tasques, el títol i les notes; de les classes, les notes; de les feines, les dates d'inici i final. La resta de canvis fets a Google es desfan i mana el hub.</li>
          <li>Un esdeveniment nou creat en aquest calendari arriba al hub com a reunió (si té hora) o com a tasca (si és de dia sencer). Si dura uns quants dies, arriba com a tasca del primer dia. Els esdeveniments periòdics no se sincronitzen.</li>
          <li>Si esborres a Google una reunió, s'esborra del hub; si esborres una tasca, queda feta. Si s'hi esborra una altra cosa, es torna a posar. Si en falten més de 5 de cop, no s'esborra res del hub.</li></ol></details>
        <details style="margin-top:8px"><summary class="em" style="cursor:pointer">Com es posa i es veu a l'iPhone</summary><ol class="pasos">
          <li>Actualitza el pont de Google (targeta «Pont de Google») i, en executar <b>configurar</b>, accepta el permís nou de Calendar.</li>
          <li>Prem «Sincronitzar ara»: apareixerà el calendari «PABLO hub» a calendar.google.com.</li>
          <li>iPhone: Ajustes → Calendario → Cuentas → el teu compte de Google (pablo.anarte.film@gmail.com) amb «Calendarios» activat. A l'app Calendario → Calendarios, marca «PABLO hub». Si no hi surt, obre calendar.google.com/calendar/syncselect i marca'l.</li>
          <li>Si tenies subscrit el calendari de la targeta «Calendari al mòbil», treu-lo perquè no surti tot repetit.</li></ol></details>` : `<p class="em">Primer connecta el correu (secció Correu): el calendari de Google va pel mateix pont.</p>`}
      </div>
      <div class="card"><details><summary style="cursor:pointer;font-weight:700;font-size:15px">Calendari al mòbil (només lectura)</summary><p class="em">Ja no cal si fas servir Google Calendar (a sobre). Queda aquí per si mai el necessites.</p>
        <p class="em">Tasques, reunions, classes, dates límit i festivals, jornades de rodatge i feines, al calendari del teu iPhone o de Google. S'actualitza sol (cada hora, aproximadament). Només s'hi veuen, no s'hi editen.</p>
        <input readonly value="${E(cal.url || "")}" id="calu" style="font-size:13px">
        <div class="ls" style="margin-top:8px"><button class="b" data-k="calcp">Copiar l'enllaç</button><a class="b2" href="${E((cal.url || "").replace(/^https?:/, "webcal:"))}">Afegir a l'iPhone / Mac</a><button class="b2" data-k="calnou">Canviar l'enllaç</button></div>
        <details style="margin-top:12px"><summary class="em" style="cursor:pointer">Com s'afegeix</summary><ol class="pasos">
          <li><b>iPhone o Mac:</b> obre aquesta pàgina al mateix aparell i prem «Afegir a l'iPhone / Mac» → «Subscriure's». O bé Ajustes → Calendario → Cuentas → Añadir cuenta → Otra → Añadir calendario suscrito, i enganxa l'enllaç.</li>
          <li><b>Google Calendar:</b> a l'ordinador, calendar.google.com → «Otros calendarios» (+) → «Desde URL» → enganxa l'enllaç.</li>
          <li>L'enllaç és privat: qui el tingui veu les dates. Si el comparteixes per error, prem «Canviar l'enllaç» i torna'l a afegir.</li></ol></details>
      </details></div>
      <div id="ajx" style="display:contents"></div>
      <div class="card"><h3>El hub com a app</h3>
        <p class="em">S'obre a pantalla completa, amb icona pròpia, com una app.</p>
        <ol class="pasos"><li><b>iPhone (Safari):</b> botó de compartir → «Añadir a pantalla de inicio».</li><li><b>Android (Chrome):</b> menú ⋮ → «Instalar aplicación».</li><li><b>Mac (Safari):</b> Archivo → «Añadir al Dock».</li></ol>
      </div>
      <div class="card"><h3>Pont de Google</h3>
        <p>${cor.connectat ? "Connectat a <b>pablo.anarte.film@gmail.com</b>." : "Encara no està connectat. Ves a la secció Correu."}</p>
        ${cor.connectat ? `<p class="em">Si et dic que he canviat el codi del pont: copia'l de nou, enganxa'l a script.google.com substituint-ho tot, desa, executa <b>configurar</b> (accepta els permisos nous) i a «Implementar → Gestionar implementaciones» edita la implementació i tria «Nueva versión». L'URL no canvia.</p><div class="ls"><button class="b2" data-k="codi">Copiar el codi del pont</button><button class="del" style="margin:0" data-k="desconnecta">Desconnectar</button></div>` : ""}
      </div></div>`;
    extra(cor);
  }
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    if (k === "baixa") setTimeout(() => { H.col("ajust", true).then(pintar) }, 1500);
    if (k === "drcp") { try { await navigator.clipboard.writeText(document.getElementById("dru").value); H.toast("Copiat") } catch (er) { document.getElementById("dru").select() } }
    if (k === "drnou" && confirm("L'enllaç actual deixarà de funcionar i l'hauràs de canviar a la drecera. Continuar?")) { await H.api("POST", "drecera", {}); pintar(); H.toast("Enllaç nou creat") }
    if (k === "calcp") { try { await navigator.clipboard.writeText(document.getElementById("calu").value); H.toast("Copiat") } catch (er) { document.getElementById("calu").select() } }
    if (k === "calnou" && confirm("L'enllaç actual deixarà de funcionar i l'hauràs de tornar a afegir al mòbil. Continuar?")) { await H.api("POST", "calendari", {}); pintar(); H.toast("Enllaç nou creat") }
    if (k === "codi") { const t = await (await fetch("/pont-gmail.gs")).text(); try { await navigator.clipboard.writeText(t); H.toast("Codi copiat") } catch (er) { H.toast("No s'ha pogut copiar") } }
    if (k === "desconnecta" && confirm("Desconnectar el correu del hub? Podràs tornar-lo a connectar quan vulguis.")) { await H.api("DELETE", "correu/config"); H.toast("Desconnectat"); location.reload() }
    if (k === "gcal") {
      const s = document.getElementById("gcs"); s.textContent = "Sincronitzant…"; b.disabled = true;
      try { const r = await H.api("POST", "correu/calendari", {}); s.textContent = r.ocupat ? "Ja s'està sincronitzant; torna-ho a provar d'aquí a un minut." : `Fet: ${r.aGoogle || 0} canvis cap a Google i ${r.alHub || 0} cap al hub.`; H.col("ajust", true); if (r.alHub) H.col("tarea", true) }
      catch (er) { s.textContent = er && er.error === "accio" ? "Cal actualitzar el pont de Google (mira «Pont de Google»)." : "No s'ha pogut: " + ((er && er.error) || "error") }
      b.disabled = false;
    }
    if (k === "drive") {
      const s = document.getElementById("drv"); s.textContent = "Fent la còpia…"; b.disabled = true;
      try { const r = await H.api("POST", "correu/copia", {}); s.innerHTML = `Desada: <a class="ln" target="_blank" rel="noopener" href="${E(r.url)}">${E(r.nom)}</a>`; H.col("ajust", true) }
      catch (er) { s.textContent = er && er.error === "accio" ? "Cal actualitzar el pont de Google (mira «Pont de Google», aquí al costat)." : "No s'ha pogut: " + ((er && er.error) || "error") }
      b.disabled = false;
    }
  });
  el.addEventListener("change", async e => {
    const t = e.target; if (t.dataset.k !== "restaura" || !t.files[0]) return;
    let c; try { c = JSON.parse(await t.files[0].text()) } catch (er) { t.value = ""; return H.toast("Aquest arxiu no es pot llegir") }
    if (c.hub !== "pablo-hub" || !Array.isArray(c.docs)) { t.value = ""; return H.toast("Aquest arxiu no és una còpia del hub") }
    if (!confirm(`Restaurar la còpia del ${new Date(c.data).toLocaleString("ca-ES")} (${c.docs.length} elements)?\n\nEs recuperen els elements de la còpia i se substitueixen les versions actuals d'aquests mateixos elements. El que s'hagi creat després de la còpia no s'esborra.`)) { t.value = ""; return }
    try { const r = await H.api("POST", "copia", c); H.toast(`Restaurats ${r.n} elements` + (r.descartats ? ` (${r.descartats} descartats perquè estaven malmesos)` : "")); setTimeout(() => location.reload(), 900) } catch (er) { H.toast((er && er.error) || "No s'ha pogut restaurar") }
    t.value = "";
  });
  // ---------- targetes noves: resum diari, objectius, vigilant de convocatòries i dades de facturació ----------
  const VIGILA = [
    ["Residencias Academia de Cine", "https://www.residenciasacademiadecine.com/residencias/"],
    ["Rueda (Academia de Cine)", "https://www.academiadecine.com/programa-rueda/"],
    ["Convocatòries de l'Academia de Cine", "https://www.academiadecine.com/convocatorias/"],
    ["Ikusmira Berriak", "https://ikusmiraberriak.eu/"],
    ["La Incubadora (ECAM)", "https://www.ecam-industria.es/"],
    ["Berlinale Talents", "https://www.berlinale-talents.de/bt/page/c/apply"],
    ["Ajudes ICAA (Spain Audiovisual Hub)", "https://spainaudiovisualhub.digital.gob.es/ca/financiacion-y-ayudas"],
    ["ICEC (ajuts audiovisuals)", "https://icec.gencat.cat/"]
  ];
  const aj = async id => (await H.col("ajust")).find(x => x.id === id);
  async function extra(cor) {
    const box = document.getElementById("ajx"); if (!box) return;
    let [ob, vg, fc] = await Promise.all([aj("ajust:objectius"), aj("ajust:vigila"), aj("ajust:factura")]);
    if (!vg) { vg = { id: "ajust:vigila", llista: VIGILA.map(([nom, url], i) => ({ id: "v" + i, nom, url })) }; H.put(vg, 1) }
    ob = ob || {}; fc = fc || {};
    const ps = (await H.col("proyecto")).filter(p => (["Llarg", "Curt"].includes(p.categoria) && H.meu(p)) || p.id === ob.escriptura);
    const inp = (k, l, o, t = "text", ph = "") => `<div style="flex:1;min-width:140px"><label>${l}</label><input data-o="${k}" type="${t}" value="${E(o[k] ?? "")}" placeholder="${E(ph)}"></div>`;
    const finp = (k, l, t = "text", ph = "") => `<div style="flex:1;min-width:160px"><label>${l}</label><input data-fc="${k}" type="${t}" value="${E(fc[k] ?? "")}" placeholder="${E(ph)}"></div>`;
    box.innerHTML = `
      <div class="card"><h3>Resum d'avui per correu</h3>
        <p class="em" style="margin-top:0">Cada dia cap a les <b>8:30</b> t'arriba un correu amb només el que és d'avui: classes (amb el material), reunions, rodatges, tasques, terminis que acaben avui o d'aquí a 2 i 7 dies, seguiments que toquen, factures per reclamar, novetats de convocatòries i avisos de festivals. Si un dia no hi ha res, no s'envia.</p>
        ${cor.connectat ? `<div class="ls"><button class="b2" data-k="diari">Enviar-me'l ara</button><span id="diaris" class="em"></span></div>` : `<p class="em">Va pel pont de Google: primer connecta el correu.</p>`}
      </div>
      <div class="card"><h3>Objectius</h3>
        <div class="ls" style="gap:12px;align-items:flex-end">${inp("contactes", "Contactes nous per setmana", ob, "number", "10")}${inp("pagines", "Pàgines de guió per setmana", ob, "number", "7")}</div>
        <label>Guió que estàs escrivint</label><select data-o="escriptura"><option value="">— Cap —</option>${ps.map(p => `<option value="${p.id}" ${p.id === ob.escriptura ? "selected" : ""}>${E(p.titulo || "")}</option>`).join("")}</select>
        <p class="em" style="margin:8px 0 0">Es veuen a Avui amb el progrés de la setmana.</p>
      </div>
      <div class="card"><h3>Vigilant de convocatòries</h3>
        <p class="em" style="margin-top:0">Cada dilluns el pont mira aquestes pàgines. Si canvia el que diuen de dates, bases o inscripcions, t'avisa a Avui i al resum del dia.</p>
        ${(vg.llista || []).map(x => `<div class="r"><i class="dot" style="background:${x.error ? "#ff3b30" : x.canvi ? "#ff9f0a" : "#30b27a"}"></i><a class="g" href="${E(x.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><b>${E(x.nom)}</b><small>${E(x.error ? "No s'ha pogut llegir: " + x.error : x.canvi ? "Ha canviat el " + H.fecha(x.canvi) : x.revisat ? "Revisada el " + H.fecha(x.revisat) : "Encara no revisada")}</small></a><button class="x" data-k="vgtreu" data-id="${E(x.id)}" title="Treure">×</button></div>`).join("")}
        <div class="ls" style="margin-top:10px;gap:8px"><input id="vgn" placeholder="Nom" style="flex:1;min-width:120px"><input id="vgu" placeholder="https://…" style="flex:2;min-width:180px"><button class="b2" data-k="vgafeg">Afegir</button></div>
        ${cor.connectat ? `<div class="ls" style="margin-top:10px"><button class="b2" data-k="vigila">Revisar-les ara</button><span id="vgs" class="em"></span></div>` : ""}
      </div>
      <div class="card"><h3>Dades per a les factures</h3>
        <p class="em" style="margin-top:0">Surten a les factures que fas des de Diners. Només es guarden al teu hub.</p>
        <div class="ls" style="gap:12px">${finp("nom", "Nom i cognoms")}${finp("nif", "NIF")}</div>
        <div class="ls" style="gap:12px">${finp("adreca", "Adreça fiscal")}</div>
        <div class="ls" style="gap:12px">${finp("email", "Correu", "email", "pablo.anarte.film@gmail.com")}${finp("tel", "Telèfon", "tel")}</div>
        <div class="ls" style="gap:12px">${finp("iban", "IBAN")}</div>
        <div class="ls" style="gap:12px">${finp("iva", "IVA per defecte (%)", "number", "0")}${finp("irpf", "IRPF per defecte (%)", "number", "15")}</div>
        <div class="ls" style="gap:12px">${finp("prefix", "Prefix del número", "text", "2026-")}${finp("seguent", "Següent número", "number", "1")}</div>
      </div>`;
  }
  el.addEventListener("input", async e => {
    const t = e.target;
    if (t.dataset.o !== undefined) { const o = (await aj("ajust:objectius")) || { id: "ajust:objectius" }; o[t.dataset.o] = t.type === "number" ? (t.value === "" ? "" : +t.value) : t.value; H.put(o) }
    if (t.dataset.fc !== undefined) { const o = (await aj("ajust:factura")) || { id: "ajust:factura" }; o[t.dataset.fc] = t.type === "number" ? (t.value === "" ? "" : +t.value) : t.value; H.put(o) }
  });
  el.addEventListener("change", async e => { const t = e.target; if (t.tagName === "SELECT" && t.dataset.o !== undefined) { const o = (await aj("ajust:objectius")) || { id: "ajust:objectius" }; o[t.dataset.o] = t.value; H.put(o, 1) } });
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    const cp = async (fi, txt) => { try { await navigator.clipboard.writeText(txt); H.toast("Copiat") } catch (er) { prompt("Copia l'enllaç:", txt) } };
    if (k === "drcpx" || k === "drcpv" || k === "drcpu") { const u = (document.getElementById("dru") || {}).value || ""; return cp(0, k === "drcpu" ? u : u.replace(/\?u=$/, k === "drcpx" ? "?x=" : "?v=")) }
    if (k === "diari" || k === "vigila") {
      const st = document.getElementById(k === "diari" ? "diaris" : "vgs"); st.textContent = "Un moment…"; b.disabled = true;
      try { const r = await H.api("POST", "correu/" + k, {}); st.textContent = k === "diari" ? (r.buit ? "Avui no hi ha res, no s'ha enviat." : "Enviat. Mira el correu.") : `Fet: ${r.revisades || 0} pàgines revisades.`; if (k === "vigila") setTimeout(pintar, 800) }
      catch (er) { st.textContent = er && er.error === "accio" ? "Cal actualitzar el pont de Google (mira «Pont de Google»)." : "No s'ha pogut: " + ((er && er.error) || "error") }
      b.disabled = false; return;
    }
    if (k === "vgafeg") { const n = document.getElementById("vgn").value.trim(), u = document.getElementById("vgu").value.trim(); if (!/^https?:\/\//.test(u)) return H.toast("Posa l'adreça sencera (https://…)"); const v = (await aj("ajust:vigila")) || { id: "ajust:vigila", llista: [] }; v.llista = (v.llista || []).concat({ id: "v" + Date.now().toString(36), nom: n || u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0], url: u }); await H.put(v, 1); return pintar() }
    if (k === "vgtreu") { const v = await aj("ajust:vigila"); if (!v) return; v.llista = v.llista.filter(x => x.id !== b.dataset.id); await H.put(v, 1); return pintar() }
  });
  window.addEventListener("hub-sec", e => { if (e.detail === "ajustos") pintar() });
  if (!el.hidden) pintar();
})();
