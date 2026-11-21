// Configuració: còpia de seguretat, calendari al mòbil, hub com a app i pont de Google.
(() => {
  const { E } = H, el = document.getElementById("s-ajustos");
  const fa = s => { if (!s) return "mai"; const d = Math.floor((Date.now() - new Date(s)) / 864e5); return d <= 0 ? "avui" : d === 1 ? "ahir" : `fa ${d} dies` };
  async function pintar() {
    const [a, cal, cor] = await Promise.all([H.col("ajust").then(l => l.find(x => x.id === "ajust:copia") || {}), H.api("GET", "calendari").catch(() => ({})), H.api("GET", "correu/config").catch(() => ({}))]);
    el.innerHTML = `<div class="dash" style="grid-template-columns:repeat(auto-fill,minmax(min(380px,100%),1fr))">
      <div class="card"><h3>Còpia de seguretat</h3>
        <p>Última còpia: <b>${fa(a.ultima)}</b>${a.on === "drive" ? " (al Drive)" : a.on ? " (descarregada)" : ""}.</p>
        <p class="em">Tot el que hi ha al hub (contactes, projectes, guions, plans, dossiers…) en un sol arxiu. Els arxius pujats (fotos, vídeos) es queden al servidor i no hi van inclosos.</p>
        <div class="ls"><a class="b" href="/api/copia" download data-k="baixa">Descarregar còpia</a><label class="b2" style="cursor:pointer">Restaurar una còpia…<input type="file" accept=".json,application/json" data-k="restaura" hidden></label></div>
        <h2 style="margin-top:22px">Al Drive, cada dilluns</h2>
        ${cor.connectat ? `<p class="em">El pont de Google desa una còpia a la carpeta «Còpies PABLO hub» del teu Drive cada dilluns a les 7 i guarda les 12 últimes.</p><div class="ls"><button class="b2" data-k="drive">Fer-ne una ara al Drive</button><span id="drv" class="em"></span></div>` : `<p class="em">Quan connectis el correu (secció Correu), també es farà una còpia setmanal al teu Drive.</p>`}
      </div>
      <div class="card"><h3>Calendari al mòbil</h3>
        <p class="em">Tasques, reunions, dates límit i festivals, jornades de rodatge i feines, al calendari del teu iPhone o de Google. S'actualitza sol (cada hora, aproximadament). Només s'hi veuen, no s'hi editen.</p>
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
    if (k === "calcp") { try { await navigator.clipboard.writeText(document.getElementById("calu").value); H.toast("Copiat") } catch (er) { document.getElementById("calu").select() } }
    if (k === "calnou" && confirm("L'enllaç actual deixarà de funcionar i l'hauràs de tornar a afegir al mòbil. Continuar?")) { await H.api("POST", "calendari", {}); pintar(); H.toast("Enllaç nou creat") }
    if (k === "codi") { const t = await (await fetch("/pont-gmail.gs")).text(); try { await navigator.clipboard.writeText(t); H.toast("Codi copiat") } catch (er) { H.toast("No s'ha pogut copiar") } }
    if (k === "desconnecta" && confirm("Desconnectar el correu del hub? Podràs tornar-lo a connectar quan vulguis.")) { await H.api("DELETE", "correu/config"); H.toast("Desconnectat"); location.reload() }
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
