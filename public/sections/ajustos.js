// Configuració: còpia de seguretat, calendari al mòbil, hub com a app i pont de Google.
(() => {
  const { E } = H, el = document.getElementById("s-ajustos");
  const fa = s => { if (!s) return "mai"; const d = Math.floor((Date.now() - new Date(s)) / 864e5); return d <= 0 ? "avui" : d === 1 ? "ahir" : `fa ${d} dies` };
  async function pintar() {
    const [a, cal, cor, gc, dr] = await Promise.all([H.col("ajust").then(l => l.find(x => x.id === "ajust:copia") || {}), H.api("GET", "calendari").catch(() => ({})), H.api("GET", "correu/config").catch(() => ({})), H.col("ajust").then(l => l.find(x => x.id === "ajust:gcal") || {}), H.api("GET", "drecera").catch(() => ({}))]);
    RES = { "Còpia de seguretat": "Última: " + fa(a.ultima), "Dreceres de l'iPhone": dr.url ? "Instagram, Ha respost, Siri i visionats" : "Encara no has creat l'enllaç", "Google Calendar (editable)": cor.connectat ? (gc.ultima ? "Sincronitzat el " + new Date(gc.ultima).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Encara no s'ha sincronitzat") : "Cal connectar el correu", "Calendari al mòbil (només lectura)": "Ja no cal amb Google Calendar", "El hub com a app": "Instal·lar-lo a l'iPhone, Android o Mac", "Pont de Google": cor.connectat ? "Connectat" : "No connectat", "Resum d'avui per correu": cor.connectat ? "Cada dia a les 8:30" : "Cal connectar el correu" };
    const drv = await H.api("GET", "drive/estat").catch(() => ({}));
    RES["Drive (Recce i Referències)"] = drv.connectat ? "Connectat" + (drv.compte ? " · " + drv.compte : "") + (drv.ultim ? " · revisat " + new Date(drv.ultim).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "") : "No connectat";
    el.innerHTML = `<div class="cfg">${driveCard(drv)}
      <div class="card"><h3>Còpia de seguretat</h3>
        <p>Última còpia: <b>${fa(a.ultima)}</b>${a.on === "drive" ? " (al Drive)" : a.on ? " (descarregada)" : ""}.</p>
        <p class="em">Tot el que hi ha al hub (contactes, projectes, guions, plans, dossiers…) en un sol arxiu. Els arxius pujats (fotos, vídeos) es queden al servidor i no hi van inclosos.</p>
        <div class="ls"><a class="b" href="/api/copia" download data-k="baixa">Descarregar còpia</a><label class="b2" style="cursor:pointer">Restaurar una còpia…<input type="file" accept=".json,application/json" data-k="restaura" hidden></label></div>
        <h2 style="margin-top:22px">Al Drive, cada dilluns</h2>
        ${cor.connectat ? `<p class="em">El pont de Google desa una còpia a la carpeta «Còpies PABLO hub» del teu Drive cada dilluns a les 7 i guarda les 12 últimes.</p><div class="ls"><button class="b2" data-k="drive">Fer-ne una ara al Drive</button><span id="drv" class="em"></span></div>` : `<p class="em">Quan connectis el correu (secció Correu), també es farà una còpia setmanal al teu Drive.</p>`}
      </div>
      <div class="card"><h3>Dreceres de l'iPhone</h3>
        <p class="em" style="margin-top:0">Quatre dreceres per a l'app <b>Atajos</b>. Totes fan servir el mateix enllaç secret, amb un final diferent:</p>
        <div class="m"><b>Contactat al hub</b> (Instagram): acaba en <code>?u=</code> <button class="b2" data-k="drcpu" style="margin-left:6px">Copiar</button></div>
        <div class="m"><b>Ha respost al hub</b> (Instagram): acaba en <code>?r=1&amp;u=</code> <button class="b2" data-k="drcpr" style="margin-left:6px">Copiar</button></div>
        <div class="m"><b>Apunta al hub</b> (Siri): acaba en <code>?x=</code> <button class="b2" data-k="drcpx" style="margin-left:6px">Copiar</button></div>
        <div class="m"><b>Guardar visionat</b> (YouTube o Vimeo): acaba en <code>?v=</code> <button class="b2" data-k="drcpv" style="margin-left:6px">Copiar</button></div>
        <details style="margin-top:10px"><summary class="em" style="cursor:pointer">«Apunta al hub» amb Siri</summary><ol class="pasos">
          <li>Atajos → <b>+</b> → nom <b>Apunta al hub</b> (és el que diràs a Siri: «Oye Siri, apunta al hub»).</li>
          <li>Acció <b>«Dictar texto»</b>.</li>
          <li>Acció <b>«Codificar URL»</b> amb <b>«Texto dictado»</b> (així els espais i els accents arriben bé).</li>
          <li>Acció <b>«Texto»</b>: enganxa l'enllaç que acaba en <b>?x=</b> i, just darrere, toca <b>«Texto codificado»</b> (o «URL codificada») a la tira de sobre el teclat.</li>
          <li>Acció <b>«Abrir URL»</b> amb <b>«Texto»</b>. Desa.</li>
          <li>El que dictis queda com a tasca per avui. Si comences per «idea…», va a Idees.</li></ol></details>
        <details style="margin-top:8px"><summary class="em" style="cursor:pointer">«Ha respost al hub» quan et contesten per Instagram</summary><ol class="pasos">
          <li>Fes un duplicat de «Contactat al hub» (mantén-la premuda → «Duplicar») i posa-li de nom <b>Ha respost al hub</b>.</li>
          <li>On hi ha l'enllaç (el bloc <b>«Texto»</b>, o «Abrir URL» si el vas posar allà), canvia el final <b>?u=</b> per <b>?r=1&amp;u=</b>. La burbuja «Direcciones URL» es queda darrere.</li>
          <li>Quan algú et contesti: al seu perfil, ⋯ → «Compartir este perfil» → «Ha respost al hub». Passa a «Ha respost» i deixa de sortir als seguiments.</li></ol></details>
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
        <details style="margin:0 0 12px"><summary class="em" style="cursor:pointer;margin:0">Veure-ho tot al Calendari de l'iPhone i el Mac (Apple)</summary><ol class="pasos">
          <li>iPhone: <b>Configuració → Apps → Calendari → Comptes → Afegeix un compte → Google</b> i entra amb pablo.anarte.film@gmail.com. Activa <b>Calendaris</b>. (Al Mac: Calendari → Configuració → Comptes → +.)</li>
          <li>Ara el Calendari d'Apple mostra els calendaris de Google, també «PABLO hub», i el que hi creïs o canviïs arriba a Google i a l'inici del hub.</li>
          <li>Perquè el que apuntes a l'iPhone vagi sempre a Google: <b>Configuració → Apps → Calendari → Calendari per omissió</b> → un calendari de Google.</li>
          <li>Els calendaris d'iCloud que ja tens no passen sols a Google. Si en vols veure un al hub: a l'app Calendari, ⓘ del calendari → <b>Calendari públic</b> → comparteix l'enllaç, i a Google Calendar (web) → Altres calendaris → <b>Des d'un URL</b>.</li></ol></details>
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
      <div class="card"><h3>Calendari al mòbil (només lectura)</h3><p class="em">Ja no cal si fas servir Google Calendar. Queda aquí per si mai el necessites.</p>
        <p class="em">Tasques, reunions, classes, dates límit i festivals, jornades de rodatge i feines, al calendari del teu iPhone o de Google. S'actualitza sol (cada hora, aproximadament). Només s'hi veuen, no s'hi editen.</p>
        <input readonly value="${E(cal.url || "")}" id="calu" style="font-size:13px">
        <div class="ls" style="margin-top:8px"><button class="b" data-k="calcp">Copiar l'enllaç</button><a class="b2" href="${E((cal.url || "").replace(/^https?:/, "webcal:"))}">Afegir a l'iPhone / Mac</a><button class="b2" data-k="calnou">Canviar l'enllaç</button></div>
        <details style="margin-top:12px"><summary class="em" style="cursor:pointer">Com s'afegeix</summary><ol class="pasos">
          <li><b>iPhone o Mac:</b> obre aquesta pàgina al mateix aparell i prem «Afegir a l'iPhone / Mac» → «Subscriure's». O bé Ajustes → Calendario → Cuentas → Añadir cuenta → Otra → Añadir calendario suscrito, i enganxa l'enllaç.</li>
          <li><b>Google Calendar:</b> a l'ordinador, calendar.google.com → «Otros calendarios» (+) → «Desde URL» → enganxa l'enllaç.</li>
          <li>L'enllaç és privat: qui el tingui veu les dates. Si el comparteixes per error, prem «Canviar l'enllaç» i torna'l a afegir.</li></ol></details>
      </div>
      <div id="ajx" style="display:contents"></div>
      <div class="card"><h3>El hub com a app</h3>
        <p class="em">S'obre a pantalla completa, amb icona pròpia, com una app.</p>
        <ol class="pasos"><li><b>iPhone o iPad (Safari):</b> botó de compartir → «Añadir a pantalla de inicio».</li><li><b>Android (Chrome):</b> menú ⋮ → «Instalar aplicación».</li><li><b>Mac (Safari):</b> Archivo → «Añadir al Dock».</li><li><b>Ordinador (Chrome):</b> icona d'instal·lar a la barra d'adreces.</li></ol>
        <h4 style="margin:22px 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut)">Sense connexió</h4>
        <p class="em" style="margin-top:0">Cada cop que obres el hub amb internet, es desa una còpia en aquest aparell. Sense connexió s'obre igual, amb les dades d'aquella última vegada, i el que escriguis (reunions, tasques, idees, projectes, contactes…) es guarda aquí i es puja quan tornes a tenir connexió amb el hub obert. A dalt surt «Sense connexió» i quants canvis queden per pujar.</p>
        <p class="em">Sense connexió no funcionen el correu, Instagram, pujar arxius ni la web. Si un mateix document s'ha canviat també en un altre aparell, es combinen; si tots dos han canviat el mateix text, es queden els dos i el de l'altre aparell surt marcat. Millor instal·lat com a app: a Safari, si no s'obre en uns dies, el navegador pot esborrar la còpia i els canvis que encara no s'hagin pujat. En tancar la sessió s'esborra tot el que s'ha desat en aquest aparell.</p>
        <p class="em">L'app es posa al dia sola quan hi tornes després d'haver-la deixat una estona. Si mai no veus un canvi que t'han dit que ja està publicat:</p>
        <button class="b2" data-k="forca">Forçar l'actualització</button>
      </div>
      <div class="card"><h3>Pont de Google</h3>
        <p>${cor.connectat ? "Connectat a <b>pablo.anarte.film@gmail.com</b>." : "Encara no està connectat. Ves a la secció Correu."}</p>
        ${cor.connectat ? `<p class="em">Si et dic que he canviat el codi del pont: copia'l de nou, enganxa'l a script.google.com substituint-ho tot, desa, executa <b>configurar</b> (accepta els permisos nous) i a «Implementar → Gestionar implementaciones» edita la implementació i tria «Nueva versión». L'URL no canvia.</p><div class="ls"><button class="b2" data-k="codi">Copiar el codi del pont</button><button class="del" style="margin:0" data-k="desconnecta">Desconnectar</button></div>` : ""}
      </div></div>`;
    plega(); extra(cor);
  }
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    if (k === "forca") { if (window.OFF && OFF.actualitza) return OFF.actualitza(true); return location.reload() }
    if (k === "baixa") setTimeout(() => { H.col("ajust", true).then(pintar) }, 1500);
    if (k === "drcp") { try { await navigator.clipboard.writeText(document.getElementById("dru").value); H.toast("Copiat") } catch (er) { document.getElementById("dru").select() } }
    if (k === "drnou" && await H.confirma("L'enllaç actual deixarà de funcionar i l'hauràs de canviar a la drecera. Continuar?")) { await H.api("POST", "drecera", {}); pintar(); H.toast("Enllaç nou creat") }
    if (k === "calcp") { try { await navigator.clipboard.writeText(document.getElementById("calu").value); H.toast("Copiat") } catch (er) { document.getElementById("calu").select() } }
    if (k === "calnou" && await H.confirma("L'enllaç actual deixarà de funcionar i l'hauràs de tornar a afegir al mòbil. Continuar?")) { await H.api("POST", "calendari", {}); pintar(); H.toast("Enllaç nou creat") }
    if (k === "codi") { const t = await (await fetch("/pont-gmail.gs")).text(); try { await navigator.clipboard.writeText(t); H.toast("Codi copiat") } catch (er) { H.toast("No s'ha pogut copiar") } }
    if (k === "desconnecta" && await H.confirma("Desconnectar el correu del hub? Podràs tornar-lo a connectar quan vulguis.")) { await H.api("DELETE", "correu/config"); H.toast("Desconnectat"); location.reload() }
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
    if (!await H.confirma(`Restaurar la còpia del ${new Date(c.data).toLocaleString("ca-ES")} (${c.docs.length} elements)?\n\nEs recuperen els elements de la còpia i se substitueixen les versions actuals d'aquests mateixos elements. El que s'hagi creat després de la còpia no s'esborra.`)) { t.value = ""; return }
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
  // Drive del compte de mitjans (pont-drive.gs): on es guarden els originals del Recce i les Referències
  function driveCard(d) {
    return `<div class="card"><h3>Drive (Recce i Referències)</h3>
      ${d.connectat ? `<p>Connectat${d.compte ? ` amb <b>${E(d.compte)}</b>` : ""}.${d.arrel ? ` <a href="${E(d.arrel)}" target="_blank" rel="noopener">Obrir la carpeta «PABLO hub»</a>` : ""}</p>
        <p class="em">Cada projecte té al Drive una carpeta amb <b>Recce</b> (una subcarpeta per localització; dins, «Visor» per a les fotos d'ArriCam) i <b>Referències</b> (les subcarpetes són etiquetes). El que hi pugis des del mòbil arriba al hub sol cada 10 minuts; el que pugis des del hub també hi queda guardat.</p>
        <div class="ls"><button class="b2" data-dk="sync">Sincronitzar ara</button><button class="b2" data-dk="desc">Desconnectar</button></div>`
      : `<p class="em" style="margin-top:0">Els originals de les fotos i els vídeos del recce i de les referències es poden guardar al Drive d'un altre compte de Google (per no omplir el de pablo.anarte.film). Al hub hi queda una còpia lleugera.</p>
        <ol class="pasos">
          <li>Crea un compte de Google nou (p. ex. pablo.anarte.media@gmail.com) i entra-hi a <a href="https://script.google.com" target="_blank" rel="noopener">script.google.com</a> → <b>Nou projecte</b>.</li>
          <li>Esborra el que hi ha i enganxa-hi el text de <a href="/pont-drive.gs" target="_blank">pont-drive.gs</a>. Desa.</li>
          <li>A dalt, tria la funció <b>configurar</b> → <b>Executa</b> → accepta els permisos. Al registre surt la <b>clau</b>.</li>
          <li><b>Implementa</b> → Nova implementació → Aplicació web. Executa com a: <b>Jo</b>. Qui hi té accés: <b>Qualsevol usuari</b>. Copia l'URL (acaba en /exec).</li>
          <li>Enganxa aquí l'URL i la clau.</li></ol>
        <label>URL de l'aplicació web</label><input id="dvu" placeholder="https://script.google.com/macros/s/…/exec">
        <label>Clau</label><input id="dvk" placeholder="La clau del registre">
        <div class="ls" style="margin-top:10px"><button class="b" data-dk="con">Connectar</button><span id="dvm" class="em"></span></div>`}</div>`;
  }
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-dk]"); if (!b) return; const k = b.dataset.dk;
    if (k === "con") { const m = document.getElementById("dvm"); m.textContent = "Provant…"; try { await H.api("POST", "drive/config", { url: document.getElementById("dvu").value.trim(), clau: document.getElementById("dvk").value.trim() }); H.toast("Drive connectat"); pintar() } catch (er) { m.textContent = (er && er.error) || "No s'ha pogut connectar" } }
    if (k === "desc" && await H.confirma("Desconnectar el Drive? Les fotos que ja hi ha al hub no es toquen.")) { await H.api("DELETE", "drive/config"); pintar() }
    if (k === "sync") { b.disabled = true; b.textContent = "Sincronitzant…"; try { const r = await H.api("POST", "drive/sincronitza", {}); H.toast(r.nous ? r.nous + (r.nous === 1 ? " arxiu nou" : " arxius nous") : "Tot al dia") } catch (er) { H.toast("Drive: " + ((er && er.error) || "no respon")) } b.disabled = false; b.textContent = "Sincronitzar ara" }
  });
  // Configuració com els Ajustos del Mac: a l'esquerra la llista per grups (amb cercador i l'estat de cada cosa),
  // a la dreta l'apartat triat. En mòbil, primer la llista i, en tocar-ne un, l'apartat amb «‹ Configuració».
  // Cada targeta (.card amb <h3>) és un apartat; el títol del <h3> és la clau (RES = resum de sota el nom).
  let RES = {}, SEL = "", DET = false, Q = "";
  try { SEL = localStorage.getItem("cfg-sel") || "" } catch (e) { }
  const GR = [
    ["Connexions", ["Pont de Google", "Google Calendar (editable)", "Drive (Recce i Referències)", "Instagram (missatges)"]],
    ["Cada dia i cada setmana", ["Resum d'avui per correu", "Objectius", "Vigilant de convocatòries"]],
    ["Diners", ["Dades per a les factures"]],
    ["iPhone i Mac", ["Dreceres de l'iPhone", "El hub com a app", "Calendari al mòbil (només lectura)"]],
    ["Les teves dades", ["Còpia de seguretat"]]
  ];
  const NOM = { "Pont de Google": "Correu (pont de Google)", "Google Calendar (editable)": "Google Calendar", "Drive (Recce i Referències)": "Drive de fotos i vídeos", "Instagram (missatges)": "Instagram", "Resum d'avui per correu": "Resum diari per correu", "Calendari al mòbil (només lectura)": "Calendari al mòbil (antic)" };
  const ICF = { "Pont de Google": "M3 6h18v12H3z M3 7l9 6 9-6", "Google Calendar (editable)": "M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5", "Drive (Recce i Referències)": "M3 7h7l2 2h9v10H3z", "Instagram (missatges)": "M4 4h16v16H4z M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M16.5 7h.01", "Resum d'avui per correu": "M12 7v5l3 2 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "Objectius": "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z M12 11h.01", "Vigilant de convocatòries": "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "Dades per a les factures": "M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6", "Dreceres de l'iPhone": "M7 2h10v20H7z M11 18h2", "El hub com a app": "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z", "Calendari al mòbil (només lectura)": "M4 6h16v14H4z M4 10h16", "Còpia de seguretat": "M12 3v12 M7 10l5 5 5-5 M4 17v3h16v-3" };
  const estat = t => { const r = RES[t] || ""; if (/No connectat|Cal connectar/.test(r)) return "off"; if (/avís|amb canvis|Encara no|Última: mai|Última: fa \d{2,} dies/.test(r)) return "av"; return /^Connectat|^Sincronitzat|^Última: (avui|ahir|fa [1-9] dies)|^Cada dia|^Instagram, /.test(r) ? "ok" : "" };
  const norm = x => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function plega() {
    const cont = el.querySelector(".cfg"); if (!cont) return;
    let w = el.querySelector(".cfgw");
    if (!w) { w = document.createElement("div"); w.className = "cfgw"; w.innerHTML = `<nav class="cfgn" aria-label="Apartats de Configuració"><input class="cfgq" type="search" placeholder="Cercar a Configuració…" aria-label="Cercar a Configuració" value="${E(Q)}"><div class="cfgl"></div></nav><div class="cfgd"><button class="cfgback" data-cfgb>‹ Configuració</button></div>`; cont.before(w) }
    const det = w.querySelector(".cfgd");
    [...cont.querySelectorAll(".card")].forEach(c => {
      if (c.dataset.t) return; const h = c.querySelector(":scope > h3"); if (!h) return;
      const t = h.textContent.trim(); c.dataset.t = t;
      h.outerHTML = `<div class="cfgh"><h2>${E(NOM[t] || t)}</h2><small data-res>${E(RES[t] || "")}</small></div>`;
      det.appendChild(c);
    });
    cont.hidden = true;
    const cards = [...det.querySelectorAll(".card[data-t]")], hi = t => cards.some(c => c.dataset.t === t);
    cards.forEach(c => { const r = c.querySelector("[data-res]"); if (r) r.textContent = RES[c.dataset.t] || "" });
    const tots = GR.flatMap(g => g[1]).filter(hi).concat(cards.map(c => c.dataset.t).filter(t => !GR.some(g => g[1].includes(t))));
    if (!hi(SEL)) SEL = tots[0] || "";
    llista(w, cards, tots);
    cards.forEach(c => c.hidden = c.dataset.t !== SEL);
    w.classList.toggle("det", DET);
  }
  function llista(w, cards, tots) {
    const q = norm(Q), coincideix = t => !q || norm((NOM[t] || t) + " " + t + " " + (RES[t] || "") + " " + ((cards.find(c => c.dataset.t === t) || {}).textContent || "")).includes(q);
    const item = t => `<button class="cfgi ${t === SEL ? "on" : ""}" data-cfg="${E(t)}" ${t === SEL ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICF[t] || "M4 4h16v16H4z"}"/></svg><span><b>${E(NOM[t] || t)}</b>${RES[t] ? `<small>${E(RES[t])}</small>` : ""}</span>${estat(t) ? `<i class="cfgst ${estat(t)}" title="${estat(t) === "ok" ? "Funciona" : estat(t) === "off" ? "No connectat" : "Mira-ho"}"></i>` : ""}<em>›</em></button>`;
    const grups = GR.map(([g, ts]) => [g, ts.filter(t => tots.includes(t) && coincideix(t))]).concat([["Altres", tots.filter(t => !GR.some(g => g[1].includes(t)) && coincideix(t))]]).filter(g => g[1].length);
    w.querySelector(".cfgl").innerHTML = grups.length ? grups.map(([g, ts]) => `<div class="cfgg"><h4>${E(g)}</h4>${ts.map(item).join("")}</div>`).join("") : `<p class="em" style="padding:8px 12px">No hi ha res amb «${E(Q)}».</p>`;
  }
  const tria = t => { SEL = t; DET = true; try { localStorage.setItem("cfg-sel", t) } catch (e) { } plega(); const d = el.querySelector(".cfgd"); if (d && matchMedia("(max-width:760px)").matches) window.scrollTo(0, 0) };
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-cfg]"); if (b) return tria(b.dataset.cfg);
    if (e.target.closest("[data-cfgb]")) { DET = false; plega(); window.scrollTo(0, 0) }
  });
  el.addEventListener("input", e => { if (!e.target.classList.contains("cfgq")) return; Q = e.target.value; const w = el.querySelector(".cfgw"); if (w) { const cards = [...w.querySelectorAll(".cfgd .card[data-t]")]; llista(w, cards, cards.map(c => c.dataset.t).sort((a, b) => GR.flatMap(g => g[1]).indexOf(a) - GR.flatMap(g => g[1]).indexOf(b))) } });
  el.addEventListener("keydown", e => { if (!e.target.classList.contains("cfgq")) return; if (e.key === "Enter") { const f = el.querySelector(".cfgl [data-cfg]"); if (f) tria(f.dataset.cfg) } if (e.key === "Escape" && Q) { e.target.value = Q = ""; e.target.dispatchEvent(new Event("input", { bubbles: true })) } });
  async function extra(cor) {
    const box = document.getElementById("ajx"); if (!box) return;
    let [ob, vg, fc, ig] = await Promise.all([aj("ajust:objectius"), aj("ajust:vigila"), aj("ajust:factura"), H.api("GET", "instagram/estat").catch(() => ({}))]);
    if (!vg) { vg = { id: "ajust:vigila", llista: VIGILA.map(([nom, url], i) => ({ id: "v" + i, nom, url })) }; H.put(vg, 1) }
    ob = ob || {}; fc = fc || {};
    const ps = (await H.col("proyecto")).filter(p => H.meu(p) || p.id === ob.escriptura).sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
    const inp = (k, l, o, t = "text", ph = "") => `<div style="flex:1;min-width:140px"><label>${l}</label><input data-o="${k}" type="${t}" value="${E(o[k] ?? "")}" placeholder="${E(ph)}"></div>`;
    const finp = (k, l, t = "text", ph = "") => `<div style="flex:1;min-width:160px"><label>${l}</label><input data-fc="${k}" type="${t}" value="${E(fc[k] ?? "")}" placeholder="${E(ph)}"></div>`;
    const vl = vg.llista || [];
    Object.assign(RES, { "Objectius": `${ob.contactes || 10} contactes i ${ob.pagines || 7} pàgines per setmana`, "Vigilant de convocatòries": `${vl.length} ${vl.length === 1 ? "pàgina" : "pàgines"}${vl.some(x => x.canvi && !x.vist) ? " · " + vl.filter(x => x.canvi && !x.vist).length + " amb canvis" : ""}`, "Dades per a les factures": fc.nom ? `${fc.nom} · IVA ${fc.iva === "" || fc.iva == null ? 0 : fc.iva} % · IRPF ${fc.irpf === "" || fc.irpf == null ? 15 : fc.irpf} %` : "Encara sense dades" });
    RES["Instagram (missatges)"] = ig.connectat ? (ig.error ? "Connectat, amb un avís" : "Connectat" + (ig.usuari ? " · @" + ig.usuari : "")) : "No connectat";
    const hora = t => t ? new Date(t).toLocaleString("ca-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "mai";
    box.innerHTML = `
      <div class="card"><h3>Instagram (missatges)</h3>
        <p class="em" style="margin-top:0">Quan algú que és a <b>Contactes</b> (pel seu @) t'escriu per Instagram, passa sol a «Ha respost» i el missatge s'afegeix a la seva fitxa. El que tu li envies queda als enviaments. Els xats de qualsevol altra persona no es guarden enlloc.</p>
        ${ig.connectat ? `<p style="margin-bottom:4px">Connectat${ig.usuari ? ` a <b>@${E(ig.usuari)}</b>` : ""}. Avisos en directe: <b>${ig.subscrit ? "activats" : "no activats"}</b>.</p>
          <p class="em" style="margin-top:0">Últim missatge d'un contacte: ${hora(ig.ultim)} · Última revisió: ${hora(ig.revisat)}${ig.error ? `<br><span style="color:#ff3b30">${E(ig.error)}</span>` : ""}</p>
          <p class="em">Amb això ja no cal la drecera «Ha respost al hub» per als missatges d'Instagram.</p>
          <div class="ls"><button class="b2" data-k="igrev">Revisar ara</button>${ig.subscrit ? "" : `<button class="b2" data-k="igsub">Activar els avisos</button>`}<button class="del" data-k="igdes">Desconnectar</button><span id="igs" class="em"></span></div>`
        : `${ig.clau ? "" : `<p class="em" style="color:#ff3b30">Falta la clau secreta de l'app a Cloudflare (<code>IG_APP_SECRET</code>).</p>`}<div class="ls"><a class="b" href="/api/instagram/inici">Connectar Instagram</a></div>`}
        <details style="margin-top:12px"><summary class="em" style="cursor:pointer">Dades per al webhook de Meta</summary>
          <label>Callback URL</label><div class="ls"><input readonly value="${E(ig.webhook || "")}" style="font-size:13px;flex:1"><button class="b2" data-k="igcp" data-v="${E(ig.webhook || "")}">Copiar</button></div>
          <label>Verify token</label><div class="ls"><input readonly value="${E(ig.vt || "")}" style="font-size:13px;flex:1"><button class="b2" data-k="igcp" data-v="${E(ig.vt || "")}">Copiar</button></div>
        </details>
      </div>
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
    plega();
  }
  el.addEventListener("input", async e => {
    const t = e.target;
    if (t.dataset.o !== undefined) { const o = (await aj("ajust:objectius")) || { id: "ajust:objectius" }; o[t.dataset.o] = t.type === "number" ? (t.value === "" ? "" : +t.value) : t.value; H.put(o) }
    if (t.dataset.fc !== undefined) { const o = (await aj("ajust:factura")) || { id: "ajust:factura" }; o[t.dataset.fc] = t.type === "number" ? (t.value === "" ? "" : +t.value) : t.value; H.put(o) }
  });
  el.addEventListener("change", async e => { const t = e.target; if (t.tagName === "SELECT" && t.dataset.o !== undefined) { const o = (await aj("ajust:objectius")) || { id: "ajust:objectius" }; o[t.dataset.o] = t.value; H.put(o, 1) } });
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    const cp = async (fi, txt) => { try { await navigator.clipboard.writeText(txt); H.toast("Copiat") } catch (er) { await H.pregunta("Copia l'enllaç:", txt) } };
    if (k === "drcpr") { const u = (document.getElementById("dru") || {}).value || ""; return cp(0, u.replace(/\?u=$/, "?r=1&u=")) }
    if (k === "drcpx" || k === "drcpv" || k === "drcpu") { const u = (document.getElementById("dru") || {}).value || ""; return cp(0, k === "drcpu" ? u : u.replace(/\?u=$/, k === "drcpx" ? "?x=" : "?v=")) }
    if (k === "diari" || k === "vigila") {
      const st = document.getElementById(k === "diari" ? "diaris" : "vgs"); st.textContent = "Un moment…"; b.disabled = true;
      try { const r = await H.api("POST", "correu/" + k, {}); st.textContent = k === "diari" ? (r.buit ? "Avui no hi ha res, no s'ha enviat." : "Enviat. Mira el correu.") : `Fet: ${r.revisades || 0} pàgines revisades.`; if (k === "vigila") setTimeout(pintar, 800) }
      catch (er) { st.textContent = er && er.error === "accio" ? "Cal actualitzar el pont de Google (mira «Pont de Google»)." : "No s'ha pogut: " + ((er && er.error) || "error") }
      b.disabled = false; return;
    }
    if (k === "vgafeg") { const n = document.getElementById("vgn").value.trim(), u = document.getElementById("vgu").value.trim(); if (!/^https?:\/\//.test(u)) return H.toast("Posa l'adreça sencera (https://…)"); const v = (await aj("ajust:vigila")) || { id: "ajust:vigila", llista: [] }; v.llista = (v.llista || []).concat({ id: "v" + Date.now().toString(36), nom: n || u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0], url: u }); await H.put(v, 1); return pintar() }
    if (k === "igcp") return cp(0, b.dataset.v || "");
    if (k === "igrev" || k === "igsub") {
      const st = document.getElementById("igs"); st.textContent = "Un moment…"; b.disabled = true;
      try { const r = await H.api("POST", k === "igrev" ? "instagram/revisa" : "instagram/subscriu", {}); st.textContent = k === "igrev" ? (r.n ? `Fet: ${r.n} ${r.n === 1 ? "contacte actualitzat" : "contactes actualitzats"}.` : "Fet: res de nou.") : "Avisos activats."; setTimeout(pintar, 1200) }
      catch (er) { st.textContent = "No s'ha pogut: " + ((er && er.error) || "error") }
      b.disabled = false; return;
    }
    if (k === "igdes") { if (!await H.confirma("Desconnectar Instagram del hub? Els missatges ja guardats es queden a cada contacte.")) return; await H.api("POST", "instagram/desconnecta", {}); H.toast("Desconnectat"); return pintar() }
    if (k === "vgtreu") { const v = await aj("ajust:vigila"); if (!v) return; v.llista = v.llista.filter(x => x.id !== b.dataset.id); await H.put(v, 1); return pintar() }
  });
  window.addEventListener("hub-sec", e => { if (e.detail === "ajustos") { DET = false; pintar() } }); // en tornar-hi, primer la llista (mòbil)
  if (!el.hidden) pintar();
})();
