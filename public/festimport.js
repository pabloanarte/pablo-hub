// Importar inscripcions de FilmFreeway i Festhome a Festivals:
//  1) llegint els avisos que aquestes plataformes envien al Gmail (via el pont de Google),
//  2) enganxant la llista «My Submissions» copiada de la web.
// Sempre es proposa i Pablo revisa i accepta cada canvi; no es canvia res sol.
window.FIMP = (() => {
  const { E } = H;
  const EST = ["Presentat", "Seleccionat", "Rebutjat", "Per presentar"];
  // paraules que delaten l'estat (anglès, castellà, català, francès, italià, portuguès)
  const SEL = /official selection|has been selected|have been selected|been accepted|is selected|selected for|selecci[oó]n oficial|ha sido seleccionad|han sido seleccionad|seleccionad[ao]s? (en|para|por)|ha estat seleccionad|selecci[oó] oficial|award winner|winner|ganador|guanyador|finalist|finalista|semi-?finalist|semifinalista|nominat|congratulations|felicidades|enhorabuena|felicitats|s[ée]lection officielle|selezione ufficiale|sele[cç][aã]o oficial/i;
  const REB = /not been selected|not selected|were not able to|unable to (include|select)|regret|unfortunately|no ha sido seleccionad|no ha resultado seleccionad|no ha estat seleccionad|lamentablemente|lamentamos|desafortunadamente|malauradament|no seleccionad|not accepted|declined/i;
  const PRE = /submission (confirmation|received|complete|successful)|successfully submitted|thank you for (your )?submi|thanks for submitting|you submitted|has been submitted|new submission|inscripci[oó]n (realizada|completada|confirmada|recibida)|gracias por (tu|su) inscripci|tu pel[ií]cula ha sido inscrita|ha sido inscrit|inscrita en|has inscrit|pago (realizado|confirmado)|payment (received|confirmation)|receipt/i;
  const estatDe = t => REB.test(t) ? "Rebutjat" : SEL.test(t) ? "Seleccionat" : PRE.test(t) ? "Presentat" : "";
  const net = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b(festival|film|films|international|internacional|de|del|la|el|of|the|cine|cinema|cinema|fest|\d{4})\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  const semblant = (a, b) => { const x = net(a), y = net(b); return x && y && (x === y || (x.length > 4 && y.includes(x)) || (y.length > 4 && x.includes(y))) };
  const dia = s => { const d = new Date(s); return isNaN(d) ? "" : new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) };

  // nom del festival a partir de l'assumpte o del cos del correu
  function festivalDe(assumpte, cos) {
    const t = assumpte.replace(/^(re|fwd?|rv):\s*/i, "");
    const pats = [
      /(?:submission (?:confirmation|received)|submitted|submission)\s*(?:to|for|[-–:])\s*(?:the\s+)?(.+?)(?:\s*[-–|(]|$)/i,
      /(?:official selection|selected)\s*(?:at|for|in|[-–:])\s*(?:the\s+)?(.+?)(?:\s*[-–|(]|$)/i,
      /(?:notification|decision|update|results?)\s*(?:from|for|[-–:])\s*(?:the\s+)?(.+?)(?:\s*[-–|(]|$)/i,
      /(?:inscripci[oó]n|selecci[oó]n|seleccionad[ao])\s*(?:en|a|para|al|[-–:])\s*(?:el\s+)?(.+?)(?:\s*[-–|(]|$)/i,
      /^(.+?)\s*[-–|:]\s*(?:submission|official|notification|selection|inscripci|selecci|resultado|decision)/i
    ];
    for (const p of pats) { const m = t.match(p); if (m && m[1] && m[1].length > 2 && m[1].length < 90) return m[1].replace(/[.!]+$/, "").trim() }
    const c = cos.match(/(?:submitted to|selected (?:for|at)|official selection (?:of|at)|inscrita en|seleccionada (?:en|para)|submission to)\s+(?:the\s+)?([A-Z][^.,!\n]{3,80})/);
    return c ? c[1].trim() : t.slice(0, 80);
  }
  async function projecteDe(text) {
    const ps = await H.col("proyecto"), t = String(text).toLowerCase();
    const p = ps.filter(p => p.titulo && p.titulo.length > 2 && t.includes(p.titulo.toLowerCase())).sort((a, b) => b.titulo.length - a.titulo.length)[0];
    return p ? p.id : "";
  }

  // ---------- 1) correu ----------
  async function delCorreu() {
    const r = await H.api("GET", "correu/festivals?dies=730");
    const aj = (await H.col("ajust")).find(x => x.id === "ajust:festmail") || { id: "ajust:festmail", vistos: [] };
    const nous = r.missatges.filter(m => !aj.vistos.includes(m.id)).sort((a, b) => a.data.localeCompare(b.data));
    const out = [];
    for (const m of nous) {
      const txt = m.assumpte + " " + m.cos, est = estatDe(m.assumpte) || estatDe(m.cos.slice(0, 900));
      if (!est) continue; // butlletins, promocions i altres avisos que no són d'una inscripció
      out.push({ mid: m.id, font: /festhome/i.test(m.de) ? "Festhome" : "FilmFreeway", festival: festivalDe(m.assumpte, m.cos), proyecto: await projecteDe(txt), estado: est || "Presentat", dubte: !est, data: dia(m.data), resum: m.assumpte });
    }
    return { props: out, aj, total: nous.length };
  }

  // ---------- 2) enganxar la llista ----------
  const ESTL = [[/award winner|winner|ganador|guanyador|premiad/i, "Seleccionat", "Premiat"], [/finalist|finalista|semi-?finalist|semifinalista|nominee|nominad/i, "Seleccionat", ""], [/not selected|no seleccionad|rejected|rechazad|declined/i, "Rebutjat", ""], [/^selected$|official selection|seleccionad[ao]$|selecci[oó]n oficial|selected/i, "Seleccionat", ""], [/undecided|in consideration|pending|pendiente|en revisi[oó]n|received|recibida|submitted|inscrita|en curso/i, "Presentat", ""]];
  async function deText(text) {
    const ls = String(text).split(/\n/).map(x => x.trim()).filter(Boolean), ps = await H.col("proyecto"), out = [];
    const esSoroll = l => /^(\$|€|usd|eur|\d+([.,]\d+)?\s*(€|\$|usd|eur)?$)/i.test(l) || /^(view|edit|withdraw|retirar|ver|details|detalles|judging status|status|estado|project|proyecto|festival|category|categor[ií]a|date|fecha|fee|tarifa|tracking|submitted on|deadline)s?:?$/i.test(l) || /^\w{3,9}\.? \d{1,2},? \d{4}$|^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(l);
    const CAT = /^(short|shorts|short film|feature|feature film|documentary|animation|music video|student|experimental|horror|fantasy|corto|cortometraje|cortometrajes|largometraje|documental|animaci[oó]n|videoclip|ficci[oó]n|fiction|competition|competici[oó]n)\b/i;
    const esEst = l => l.length < 40 && ESTL.some(([re]) => re.test(l));
    let ini = 0;
    ls.forEach((l, i) => {
      const e = esEst(l) && ESTL.find(([re]) => re.test(l)); if (!e) return;
      const bloc = ls.slice(Math.max(ini, i - 8), i); ini = i + 1; // de l'estat anterior fins a aquest
      const p = ps.find(p => p.titulo && bloc.some(x => x.toLowerCase().includes(p.titulo.toLowerCase())));
      const data = (bloc.find(x => /\d{4}/.test(x) && !isNaN(new Date(x))) || "");
      const festi = bloc.find(x => !esSoroll(x) && !CAT.test(x) && !(p && x.toLowerCase().includes(p.titulo.toLowerCase())) && x.length > 3 && !/^my submissions|^mis inscripciones|^submissions$/i.test(x));
      if (festi) out.push({ font: "Llista", festival: festi.replace(/\s*[-–|].*$/, "").trim(), proyecto: p ? p.id : "", estado: e[1], premi: e[2], data: data ? dia(data) : "", resum: l });
    });
    // sense duplicats dins la mateixa llista
    return { props: out.filter((x, i) => out.findIndex(y => semblant(y.festival, x.festival) && y.proyecto === x.proyecto) === i) };
  }

  // ---------- revisió ----------
  async function revisa(props, origen, aj) {
    const cs = await H.col("convocatoria"), ps = await H.col("proyecto");
    props.forEach(p => { const c = cs.find(c => c.tipo !== "Lab / residència" && semblant(c.titulo, p.festival) && (!p.proyecto || !c.proyecto || c.proyecto === p.proyecto)); p.cid = c ? c.id : ""; p.on = !c || c.estado !== p.estado || (p.premi && !c.premi); p.ja = c });
    const fila = (p, i) => `<div class="fip ${p.on ? "" : "fio"}"><label class="ck" style="margin:0"><input type="checkbox" data-fi="${i}" ${p.on ? "checked" : ""}></label>
      <div class="g"><div class="ls"><input data-fv="festival" data-i="${i}" value="${E(p.festival)}" style="flex:2;min-width:160px;font-weight:700"><select data-fv="proyecto" data-i="${i}" style="flex:1;min-width:140px"><option value="">— Pel·lícula —</option>${ps.map(x => `<option value="${x.id}" ${x.id === p.proyecto ? "selected" : ""}>${E(x.titulo || "")}</option>`).join("")}</select><select data-fv="estado" data-i="${i}" style="width:auto">${EST.map(e => `<option ${e === p.estado ? "selected" : ""}>${e}</option>`).join("")}</select></div>
      <small>${E(p.font)}${p.data ? " · " + H.fecha(p.data) : ""} · ${p.ja ? `ja hi és (${E(p.ja.estado || "")})${p.on ? " → s'actualitzarà" : ", sense canvis"}` : "es crearà nova"}${p.dubte ? ' · <b style="color:#ff9f0a">revisa l\'estat</b>' : ""} · <span class="mut">${E(p.resum.slice(0, 90))}</span></small></div></div>`;
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Revisa abans d'importar</h2>
      <p class="em">${props.length ? "Marca el que vols importar. Pots corregir el nom del festival, la pel·lícula i l'estat." : origen === "correu" ? "No hi ha avisos nous de FilmFreeway ni de Festhome." : "No he trobat cap inscripció en el text enganxat. Prova de copiar tota la taula de «My Submissions»."}</p>
      <div id="fil">${props.map(fila).join("")}</div>
      <div class="sfoot"><span class="em">${props.filter(p => p.on).length} marcats</span><button class="b" data-fk="ok" ${props.length ? "" : "disabled"}>Importar els marcats</button></div>`);
    const box = document.getElementById("hshc");
    box.oninput = box.onchange = e => { const t = e.target; if (t.dataset.fv) props[+t.dataset.i][t.dataset.fv] = t.value; if (t.dataset.fi) props[+t.dataset.fi].on = t.checked; const n = box.querySelector(".sfoot .em"); if (n) n.textContent = props.filter(p => p.on).length + " marcats" };
    box.onclick = async e => {
      if (!e.target.closest('[data-fk="ok"]')) return;
      let nous = 0, act = 0;
      for (const p of props.filter(p => p.on && p.festival.trim())) {
        const c = p.cid && cs.find(x => x.id === p.cid);
        if (c) { Object.assign(c, { estado: p.estado }, p.proyecto ? { proyecto: p.proyecto } : {}, p.premi && !c.premi ? { premi: p.premi } : {}, !c.tasa ? { tasa: p.font === "Llista" ? "" : p.font } : {}); H.put(c); act++ }
        else { H.put({ id: H.uid("convocatoria"), titulo: p.festival.trim(), tipo: "Festival", estado: p.estado, proyecto: p.proyecto, premi: p.premi || "", tasa: p.font === "Llista" ? "" : p.font, notas: "Importat de " + (p.font === "Llista" ? "la llista enganxada" : p.font) + (p.data ? " (" + p.data + ")" : "") }, 1); nous++ }
      }
      if (aj) { aj.vistos = [...new Set(aj.vistos.concat(props.map(p => p.mid).filter(Boolean)))].slice(-3000); H.put(aj, 1) }
      H.cerrar(); H.toast(`${nous} noves, ${act} actualitzades`);
    };
  }

  async function obre() {
    let corOk = false; try { corOk = (await H.api("GET", "correu/config")).connectat } catch (e) { }
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">FilmFreeway i Festhome</h2>
      <div class="card" style="margin:12px 0"><h3>Des del correu</h3><p class="em">Llegeix els avisos que FilmFreeway i Festhome t'envien a pablo.anarte.film@gmail.com (inscripcions, seleccions i rebutjos dels últims dos anys) i et proposa els canvis. Els avisos ja revisats no tornen a sortir.</p>
        <button class="b" data-fk="mail" ${corOk ? "" : "disabled"}>Buscar avisos nous</button>${corOk ? "" : `<p class="em" style="color:#ff3b30">Cal connectar el correu (secció Correu).</p>`}<span id="fist" class="em" style="margin-left:10px"></span></div>
      <div class="card"><h3>Enganxar la llista</h3><p class="em">A FilmFreeway, ves a «Submissions» (o a Festhome, «Mis inscripciones»), selecciona tota la llista, copia-la i enganxa-la aquí.</p>
        <textarea id="fitx" rows="8" placeholder="Enganxa aquí la llista copiada…"></textarea><button class="b2" data-fk="txt" style="margin-top:8px">Llegir la llista</button></div>`);
    const box = document.getElementById("hshc");
    box.onclick = async e => {
      const b = e.target.closest("[data-fk]"); if (!b) return;
      if (b.dataset.fk === "mail") {
        document.getElementById("fist").textContent = "Llegint el correu…"; b.disabled = true;
        try { const r = await delCorreu(); revisa(r.props, "correu", r.aj) }
        catch (er) { b.disabled = false; document.getElementById("fist").textContent = er && er.error === "accio" ? "Cal actualitzar el pont de Google (Ajustos → Pont de Google)." : "No s'ha pogut llegir: " + ((er && er.error) || "error") }
      }
      if (b.dataset.fk === "txt") { const t = document.getElementById("fitx").value; if (!t.trim()) return H.toast("Enganxa la llista primer"); revisa((await deText(t)).props, "text") }
    };
  }
  return { obre, _t: { estatDe, festivalDe, deText } };
})();
