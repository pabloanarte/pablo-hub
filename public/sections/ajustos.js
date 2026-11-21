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
      <div class="card"><h3>Drecera d'Instagram (iPhone)</h3>
        <p class="em">Quan escriguis a algú per Instagram per feina: al seu perfil, ⋯ → «Compartir este perfil» → «Contactat al hub». Si ja és a Contactes, queda marcat com a contactat avui; si no, s'hi afegeix.</p>
        <input readonly value="${E(dr.url || "")}" id="dru" style="font-size:13px">
        <div class="ls" style="margin-top:8px"><button class="b" data-k="drcp">Copiar l'enllaç</button><button class="b2" data-k="drnou">Canviar l'enllaç</button></div>
        <details style="margin-top:12px"><summary class="em" style="cursor:pointer">Com es crea la drecera (un sol cop)</summary><ol class="pasos">
          <li>Copia l'enllaç d'aquí dalt i envia-te'l a l'iPhone (o obre aquesta pàgina a l'iPhone i copia'l allà).</li>
          <li>App <b>Atajos</b> → <b>+</b>. Posa-li de nom <b>Contactat al hub</b>.</li>
          <li>Toca la <b>ⓘ</b> de baix → activa <b>«Mostrar en la hoja para compartir»</b>.</li>
          <li>Afegeix l'acció <b>«Obtener contenido de URL»</b>. A la URL enganxa l'enllaç (acaba en <b>?u=</b>) i, just a continuació, toca <b>«Entrada del atajo»</b> perquè s'hi afegeixi el perfil.</li>
          <li>Afegeix l'acció <b>«Mostrar notificación»</b> i, com a text, tria <b>«Contenidos de la URL»</b>. Desa.</li>
          <li>Prova-ho: a Instagram, a un perfil → ⋯ → «Compartir este perfil» → «Contactat al hub» (si no surt, a «Más» o a «Editar acciones»). Hauries de veure «✓ … contactat avui».</li>
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
      <div class="card"><h3>Calendari al mòbil (només lectura)</h3>
        <p class="em">Tasques, reunions, classes, dates límit i festivals, jornades de rodatge i feines, al calendari del teu iPhone o de Google. S'actualitza sol (cada hora, aproximadament). Només s'hi veuen, no s'hi editen.</p>
        <input readonly value="${E(cal.url || "")}" id="calu" style="font-size:13px">
        <div class="ls" style="margin-top:8px"><button class="b" data-k="calcp">Copiar l'enllaç</button><a class="b2" href="${E((cal.url || "").replace(/^https?:/, "webcal:"))}">Afegir a l'iPhone / Mac</a><button class="b2" data-k="calnou">Canviar l'enllaç</button></div>
        <details style="margin-top:12px"><summary class="em" style="cursor:pointer">Com s'afegeix</summary><ol class="pasos">
          <li><b>iPhone o Mac:</b> obre aquesta pàgina al mateix aparell i prem «Afegir a l'iPhone / Mac» → «Subscriure's». O bé Ajustes → Calendario → Cuentas → Añadir cuenta → Otra → Añadir calendario suscrito, i enganxa l'enllaç.</li>
          <li><b>Google Calendar:</b> a l'ordinador, calendar.google.com → «Otros calendarios» (+) → «Desde URL» → enganxa l'enllaç.</li>
          <li>L'enllaç és privat: qui el tingui veu les dates. Si el comparteixes per error, prem «Canviar l'enllaç» i torna'l a afegir.</li></ol></details>
      </div>
      <div class="card"><h3>El hub com a app</h3>
        <p class="em">S'obre a pantalla completa, amb icona pròpia, com una app.</p>
        <ol class="pasos"><li><b>iPhone (Safari):</b> botó de compartir → «Añadir a pantalla de inicio».</li><li><b>Android (Chrome):</b> menú ⋮ → «Instalar aplicación».</li><li><b>Mac (Safari):</b> Archivo → «Añadir al Dock».</li></ol>
      </div>
      <div class="card"><h3>Pont de Google</h3>
        <p>${cor.connectat ? "Connectat a <b>pablo.anarte.film@gmail.com</b>." : "Encara no està connectat. Ves a la secció Correu."}</p>
        ${cor.connectat ? `<p class="em">Si et dic que he canviat el codi del pont: copia'l de nou, enganxa'l a script.google.com substituint-ho tot, desa, executa <b>configurar</b> (accepta els permisos nous) i a «Implementar → Gestionar implementaciones» edita la implementació i tria «Nueva versión». L'URL no canvia.</p><div class="ls"><button class="b2" data-k="codi">Copiar el codi del pont</button><button class="del" style="margin:0" data-k="desconnecta">Desconnectar</button></div>` : ""}
      </div></div>`;
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
  window.addEventListener("hub-sec", e => { if (e.detail === "ajustos") pintar() });
  if (!el.hidden) pintar();
})();
