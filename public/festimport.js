// Importar inscripcions de FilmFreeway i Festhome a Festivals:
//  1) llegint els avisos que aquestes plataformes envien al Gmail (via el pont de Google),
//  2) enganxant la llista «My Submissions» copiada de la web o pujant l'arxiu exportat (CSV o Excel).
// Sempre es proposa i Pablo revisa i accepta cada canvi; no es canvia res sol.
window.FIMP = (() => {
  const { E } = H;
  const EST = ["Presentat", "Seleccionat", "Premiat", "Rebutjat", "Per presentar", "Descartat"];
  const RANG = { "Per presentar": 0, "Presentat": 1, "Descartat": 2, "Rebutjat": 3, "Seleccionat": 4, "Premiat": 5 }; // mai es baixa d'un estat més avançat
  // ----- estat a partir del text (anglès, castellà, català i alguna forma francesa/italiana) -----
  const PROMO = /newsletter|butllet[ií]|bolet[ií]n|year in review|meet the (winners|festivals?)|recommended|recomendad|recomanat|\btips (for|to|on)\b|webinar|weekly|digest|monthly|mensual|setmanal|semanal|you should submit|submit to these|festivals (we think|you('ll| will) love|for you)|final deadline|deadline (tomorrow|today)|\bdeadline for\b|last call|el plazo|termina mañana|acaba demà|el termini|discount|descuento|descompte|% off|sale\b|deadline (is )?(approaching|extended|has passed|passed)|last chance|[uú]ltima oportunidad|new festivals|nuevos festivales|festivales (abiertos|recomendados)|open (for )?submissions|call for entries|convocatoria abierta|filmfreeway (awards|festival awards)|survey|encuesta/i;
  const SEL_F = /official selection|has been (officially )?selected|have been selected|been accepted|selected for|selecci[oó]n oficial|selecci[oó] oficial|ha sido seleccionad|han sido seleccionad|ha resultado seleccionad|ha estat seleccionad|ha quedat seleccionad|s[ée]lection officielle|selezione ufficiale|sele[cç][aã]o oficial|award winner|has won|ha ganado|ha guanyat|finalist|finalista|honou?rable mention|menci[oó]n (de honor|especial)|menci[oó] (d'honor|especial)|nominated|nominad/i;
  const REB_F = /not (been )?selected|not been accepted|were not able to (include|select)|unable to (include|select)|could not (include|select)|no ha sido seleccionad|no ha resultado seleccionad|no ha estat seleccionad|no ha quedat seleccionad|no seleccionad|n'a pas [ée]t[ée] s[ée]lectionn|non [èe] stat[oa] selezionat|not part of (our|the) (official )?selection|no forma parte de la selecci/i;
  const PRE_F = /submission (confirmation|received|complete|completed|successful)|successfully submitted|thank you for (your )?submi|thanks for submitting|you (have )?submitted|has been submitted|was received|new submission|receipt|payment (received|confirmation)|inscripci[oó]n (realizada|completada|confirmada|recibida)|gracias por (tu|su) inscripci|ha sido inscrit|inscrita (en|correctamente)|pago (realizado|confirmado)|inscripci[oó] (realitzada|completada|confirmada|rebuda)|gr[àa]cies per (la teva|la vostra) inscripci|ha estat inscrit|pagament (realitzat|confirmat)/i;
  const ACT = /(?:updated to|changed to|status:|estado:|ha cambiado a|ha canviat a|estat:)\s*:?\s*["«]?([a-záéíóúàèòç ]{4,30})/i;
  const deParaula = w => /not selected|no seleccionad|rejected|rechazad|rebutjad|declined/i.test(w) ? "Rebutjat" : /withdrawn|retirad/i.test(w) ? "Descartat" : /winner|ganador|guanyador|premiad|premiat|awarded/i.test(w) ? "Premiat" : /selected|seleccionad|finalist|finalista|mention|menci/i.test(w) ? "Seleccionat" : /undecided|consideration|consideraci[oó]|pending|pendent|pendiente|received|recibid|rebut|rebuda|submitted|inscrit|in review|en revisi/i.test(w) ? "Presentat" : "";
  function estatDe(t) {
    t = String(t || ""); const a = t.match(ACT);
    if (a) { const e = deParaula(a[1]); if (e) return e }
    if (REB_F.test(t)) return "Rebutjat";
    if (/award winner|has won|ha ganado|ha guanyat|winner of|ganador del|guanyador del|premiad[ao] (con|amb)|ha sido premiad|ha estat premiat/i.test(t)) return "Premiat";
    if (SEL_F.test(t)) return "Seleccionat";
    if (PRE_F.test(t)) return "Presentat";
    return "";
  }
  const premiCru = t => (String(t).match(/(semi-?finalist|semifinalista|finalist|finalista|honou?rable mention|menci[oó]n? (de honor|d'honor|especial)|award winner|best [a-z ]{3,30}|millor [a-zàèéíòóúç ]{3,30}|mejor [a-záéíóú ]{3,30}|(gran )?premi[oa]? [a-zàèéíòóúç ]{3,30})/i) || [])[0] || "";
  // en català: «Finalist» → «Finalista», etc.; els noms de premis concrets es deixen com venen
  const premiDe = t => { const p = premiCru(t).trim(); return /^semi-?final/i.test(p) ? "Semifinalista" : /^final/i.test(p) ? "Finalista" : /^honou?rable mention|^menci/i.test(p) ? "Menció d'honor" : /^award winner$/i.test(p) ? "Premiat" : p };
  const net = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b(festival|film|films|international|internacional|de|del|la|el|of|the|cine|cinema|fest|\d{4})\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  const semblant = (a, b) => { const x = net(a), y = net(b); return x && y && (x === y || (x.length > 4 && y.includes(x)) || (y.length > 4 && x.includes(y))) };
  // dates: "12/03/2026" és dia/mes (Europa); la resta, com les entengui el navegador
  const dia = s => { s = String(s || "").trim(); const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/); if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` } const d = new Date(s); return isNaN(d) ? "" : new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) };

  // ----- nom del festival -----
  const neteja = f => String(f || "").replace(/\s+(was|has been|is|ha sido|ha estat|has|have|ha cambiado|ha canviat)\b.*$/i, "").replace(/\s*[|(].*$/, "").replace(/\s+[–—-]\s+.*$/, "").replace(/[.!¡¿?,:;]+$/, "").replace(/^(the|el|la|els|les)\s+/i, "").replace(/\s+(19|20)\d{2}$/, "").replace(/\s+/g, " ").trim();
  function festivalDe(assumpte, cos) {
    const t = String(assumpte || "").replace(/^((re|fwd?|rv|fw)\s*:\s*)+/i, "").trim(), c = String(cos || "");
    const KW = "submission status update|submission confirmation|submission received|status update|inscripci[oó] rebuda|inscripci[oó]n recibida|notificaci[oó] del|notificaci[oó]n del|notificaci[oó]|notificaci[oó]n|resoluci[oó]|submission|official selection|selecci[oó]n oficial|selecci[oó] oficial|notification|decision|status update|results?|resultado de la selecci[oó]n|resolució de la selecci[oó]|resoluci[oó]n|receipt|filmfreeway receipt|inscripci[oó]n realizada|inscripci[oó] realitzada|inscripci[oó]n|inscripci[oó]|selecci[oó]n|selecci[oó]|update";
    const pats = [
      new RegExp(`^(?:${KW})\\s*(?:to|for|from|at|in|en|a|al|de|del|per|para)?\\s*[:–—-]\\s*(.+)$`, "i"),   // "Official Selection - X", "Receipt: X"
      new RegExp(`^(?:${KW})\\s+(?:to|for|from|at|in|en|a|al|de|del|per|para)\\s+(.+)$`, "i"),           // "Notification from X"
      /(?:submission|submitted)\s+to\s+(.+)$/i,
      /official selection\s+(?:at|for|in|of)\s+(?:the\s+)?(.+)$/i,
      /(?:inscripci[oó]n?|selecci[oó]n?|participaci[oó]n?)\s+(?:en|a|al|del|de la|de)\s+(?:el\s+|la\s+)?(?!tu\b|la teva\b)(.+)$/i,                                                          // "Your submission to X was received"
      /(?:selected|accepted)\s+(?:for|at|in|by)\s+(?:the\s+)?(.+)$/i,
      /(?:seleccionad[ao]|inscrit[ao]|seleccionat|inscrita)\s+(?:en|a|al|para|per|por)\s+(?:el\s+|la\s+)?(.+)$/i,
      /^(.+?)\s+[–—-]\s+(?:submission|official|notification|selection|inscripci|selecci|resultado|decision|status)/i
    ];
    const generic = f => /filmfreeway|festhome|^(your|tu|la teva|su|el estado|the status)\b|ha cambiado|has changed|ha canviat/i.test(f);
    for (const p of pats) { const m = t.match(p); if (m && m[1]) { const f = neteja(m[1]); if (f.length > 2 && f.length < 90 && !generic(f)) return f } }
    const b = c.match(/(?:[Ss]ubmitted to:?|selected (?:for|at|by)|official selection (?:of|at)|submission to|inscrita en|inscripci[oó]n en|inscripci[oó] a|seleccionada (?:en|para|por)|seleccionat a|inscrit a|[Ss]ubmission to:?)\s+(?:the\s+|el\s+|la\s+)?([A-ZÀ-Ý0-9][^.,!\n]{2,80})/);
    return b ? neteja(b[1]) : neteja(t).slice(0, 80);
  }
  async function projecteDe(text) {
    const p = H.projecteDe((await H.col("proyecto")).filter(H.meu), text);
    return p ? p.id : "";
  }

  // Avís de FilmFreeway «X has updated the Judging Status of your submission P to ESTAT.»
  // Si no diu l'estat (correu automàtic sense «to …»), és un «Not Selected»: FilmFreeway només amaga el resultat quan és negatiu.
  function filmfreeway(t) {
    t = String(t || "").replace(/\s+/g, " ");
    const m = t.match(/^(.*?)\s*has updated the judging status of your submission\s*(.*?)(?:\s+to\s+([^.!\n]{2,40}))?[.!]/i);
    if (!m) return null;
    const festival = neteja(m[1].split(/notify you that|congratulations!?|dear [^,]{1,40},|hello [^,]{1,40},|hi [^,]{1,40},/i).pop().trim());
    const nou = (m[3] || "").trim();
    const estado = nou ? deParaula(nou) || (/consideration|review|pending|undecided/i.test(nou) ? "Presentat" : "") : "Rebutjat";
    return { festival, proj: m[2].trim(), estado, premi: estado === "Premiat" ? (/award winner/i.test(nou) ? "" : nou) : estado === "Seleccionat" && !/^selected$/i.test(nou) ? premiDe(nou) || nou : "", cru: nou || "sense estat (no seleccionat)" };
  }
  // «A message from X»: missatge lliure del festival; només se'n treu el nom i, si de cas, l'estat queda en dubte
  const missatgeDe = a => (String(a || "").match(/^(?:re:\s*)?a message from\s+(.+)$/i) || [])[1];

  // ---------- 1) correu ----------
  async function delCorreu(dies) {
    const r = await H.api("GET", "correu/festivals?dies=" + (dies || 730));
    const aj = (await H.col("ajust")).find(x => x.id === "ajust:festmail") || { id: "ajust:festmail", vistos: [] };
    const nous = r.missatges.filter(m => !aj.vistos.includes(m.id)).sort((a, b) => a.data.localeCompare(b.data));
    const out = [];
    for (const m of nous) {
      if (PROMO.test(m.assumpte)) continue;
      const font = /festhome/i.test(m.de) ? "Festhome" : "FilmFreeway", ff = filmfreeway(m.cos);
      if (ff && ff.festival && ff.estado) {
        out.push({ mid: m.id, font, festival: ff.festival, proyecto: (await projecteDe(ff.proj + " " + m.assumpte)) || (await projecteDe(m.cos)), estado: ff.estado, premi: ff.premi, dubte: false, data: dia(m.data), resum: `${ff.festival} → ${ff.cru}` });
        continue;
      }
      const msg = missatgeDe(m.assumpte);
      if (msg) {
        const e = estatDe(m.cos.slice(0, 1200));
        if (e) out.push({ mid: m.id, font, festival: neteja(msg), proyecto: await projecteDe(m.assumpte + " " + m.cos), estado: e, premi: "", dubte: true, data: dia(m.data), resum: "Missatge del festival (revisa'l): " + m.cos.slice(0, 140) });
        continue;
      }
      const est = estatDe(m.assumpte) || estatDe(m.cos.slice(0, 1200));
      const dubte = !est;
      if (dubte && !/submi|inscrip|selec|status|estado|estat|decision|resultado|resultat/i.test(m.assumpte)) continue;
      out.push({ mid: m.id, font: /festhome/i.test(m.de) ? "Festhome" : "FilmFreeway", festival: festivalDe(m.assumpte, m.cos), proyecto: await projecteDe(m.assumpte + " " + m.cos), estado: est || "Presentat", premi: ["Seleccionat", "Premiat"].includes(est) ? premiDe(m.assumpte + " " + m.cos.slice(0, 600)) : "", dubte, data: dia(m.data), resum: m.assumpte });
    }
    return { props: out, aj, total: nous.length };
  }

  // ---------- 2) enganxar la llista ----------
  const COLS = { festival: /^(festival|festival name|festival title|event|event name|evento|esdeveniment|convocatoria|nombre del festival)$/i, proyecto: /^(project|project title|project name|proyecto|projecte|pel[ií]cula|pel·l[ií]cula|film|film title|obra|t[ií]tulo|t[ií]tol)$/i, data: /^(date|fecha|data|submitted|date submitted|submission date|submitted on|fecha de inscripci[oó]n)$/i, estat: /^(status|estado|estat|submission status)$/i, jutjat: /^(judging status|judging|decision|decisi[oó]n|resultado|resultat|selecci[oó]n)$/i, cost: /^(fee|entry fee|submission fee|fee paid|amount|amount paid|price|tarifa|cuota|precio|preu|import)$/i };
  async function deText(text) {
    const ps = (await H.col("proyecto")).filter(H.meu), out = [];
    const prj = t => { const p = H.projecteDe(ps, t); return p ? p.id : "" };
    const afegeix = (festival, projecte, data, ...estats) => {
      const w = estats.filter(Boolean).join(" "), e = estats.map(x => deParaula(x || "")).filter(Boolean).sort((a, b) => RANG[b] - RANG[a])[0];
      festival = neteja(festival); if (!festival || !e) return;
      out.push({ font: "Llista", festival, proyecto: prj(projecte) || prj(festival), estado: e, premi: ["Seleccionat", "Premiat"].includes(e) ? premiDe(w) : "", data: dia(data), resum: [festival, projecte, w].filter(Boolean).join(" · ") });
    };
    const ls = String(text).split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    // a) taula amb tabuladors (el més habitual en copiar una taula d'una web)
    if (ls.some(l => l.includes("\t"))) {
      const fs = ls.map(l => l.split("\t").map(x => x.trim()));
      const hi = fs.findIndex(f => f.some(c => COLS.festival.test(c)) && f.some(c => COLS.estat.test(c) || COLS.jutjat.test(c)));
      const cap = hi >= 0 ? fs[hi] : ["Festival", "Project", "Category", "Date", "Status", "Judging Status"].slice(0, fs[0].length);
      const ix = k => cap.findIndex(c => COLS[k].test(c));
      fs.slice(hi + 1).forEach(f => { if (f.length < 2) return; const g = k => ix(k) >= 0 ? f[ix(k)] : "", n = out.length; afegeix(g("festival") || f[0], g("proyecto"), g("data"), g("jutjat"), g("estat")); const c = parseFloat(String(g("cost")).replace(/[^\d.,]/g, "").replace(",", ".")); if (out.length > n && c > 0) out[n].cost = c });
    } else {
      // b) una cel·la per línia: si hi ha capçalera, es tallen les files segons el nombre de columnes
      const hi = ls.findIndex(l => COLS.festival.test(l));
      let cap = [];
      const esCap = l => Object.values(COLS).some(r => r.test(l)) || /^(category|categor[ií]a|categoria|fee|tarifa|preu|precio)$/i.test(l);
      if (hi >= 0) for (let k = hi; k < ls.length && esCap(ls[k]); k++) cap.push(ls[k]);
      if (cap.length >= 3) {
        const ix = k => cap.findIndex(c => COLS[k].test(c)), cos = ls.slice(hi + cap.length);
        for (let k = 0; k + cap.length <= cos.length; k += cap.length) { const f = cos.slice(k, k + cap.length), g = c => ix(c) >= 0 ? f[ix(c)] : ""; afegeix(g("festival") || f[0], g("proyecto"), g("data"), g("jutjat"), g("estat")) }
      } else {
        // c) sense capçalera: cada línia d'estat tanca un bloc; el festival és la primera línia útil del bloc
        const esEst = l => l.length < 40 && !!deParaula(l) && !/festival|fest\b|film/i.test(l);
        const SOROLL = /^(\$|€|usd|eur)|^\d+([.,]\d+)?\s*(€|\$|usd|eur)?$|^(view|edit|withdraw|retirar|ver|details|detalles|completed|completad[ao]|in consideration|my submissions|mis inscripciones|submissions)$/i;
        const CAT = /^(short|shorts|short film|feature|feature film|documentary|animation|music video|student|experimental|horror|fantasy|corto|cortometraje|cortometrajes|largometraje|documental|animaci[oó]n|videoclip|ficci[oó]n|fiction|competition|competici[oó]n)\b/i;
        let ini = 0;
        ls.forEach((l, i) => {
          if (!esEst(l)) return;
          const bloc = ls.slice(Math.max(ini, i - 8), i); ini = i + 1;
          const seg = ls[i + 1] && esEst(ls[i + 1]) ? ls[i + 1] : ""; if (seg) ini = i + 2; // "Status" + "Judging Status" seguits
          const p = bloc.find(x => prj(x)), data = bloc.find(x => /\d{4}/.test(x) && dia(x)) || "";
          const f = bloc.find(x => !SOROLL.test(x) && !CAT.test(x) && x !== p && x !== data && x.length > 2 && !esEst(x));
          if (f) afegeix(f, p, data, seg, l);
        });
      }
    }
    return { props: out };
  }

  const marcats = l => { const n = l.filter(p => p.on).length; return n === 1 ? "1 marcat" : n + " marcats" };
  // ---------- revisió ----------
  let PLAT = ["FilmFreeway", "Festhome"];
  // uneix duplicats, busca si ja hi són i calcula què canviaria (sense pintar res)
  async function prepara(props) {
    const cs = await H.col("convocatoria"), ps = await H.col("proyecto");
    await H.llistes(); PLAT = H.opsDe({ llista: "fest_plat", op: ["FilmFreeway", "Festhome"] });
    // dins la mateixa tanda, el mateix festival i pel·lícula és una sola proposta (es queda l'estat més avançat)
    const uni = [];
    props.forEach(p => { const u = uni.find(x => semblant(x.festival, p.festival) && (!x.proyecto || !p.proyecto || x.proyecto === p.proyecto)); if (!u) return uni.push({ ...p, mids: p.mid ? [p.mid] : [] }); if (p.mid) u.mids.push(p.mid); if (RANG[p.estado] > RANG[u.estado]) { u.estado = p.estado; u.resum = p.resum; u.dubte = p.dubte } u.proyecto = u.proyecto || p.proyecto; u.premi = u.premi || p.premi; if ((p.data || "") > (u.data || "")) u.data = p.data });
    props = uni;
    props.forEach(p => {
      const c = cs.find(c => c.tipo !== "Lab / residència" && semblant(c.titulo, p.festival) && (!p.proyecto || !c.proyecto || c.proyecto === p.proyecto));
      p.cid = c ? c.id : ""; p.ja = c;
      if (c && RANG[p.estado] < RANG[c.estado || "Per presentar"]) { p.estado = c.estado; p.baixa = 1 } // mai es rebaixa
      if (!p.plat && /^(FilmFreeway|Festhome)$/.test(p.font)) p.plat = p.font;
      p.canvis = !c || c.estado !== p.estado || (p.premi && !c.premi) || (p.proyecto && !c.proyecto) || (p.cost && !c.cost) || (p.plat && !c.plataforma);
      p.on = p.canvis && !p.dubte;
    });
    return { props, cs, ps };
  }
  async function revisa(props0, origen, aj) {
    const pr = await prepara(props0), cs = pr.cs, ps = pr.ps; let props = pr.props;
    const fila = (p, i) => `<div class="fip ${p.on ? "" : "fio"}" id="fip${i}"><label class="ck" style="margin:0"><input type="checkbox" data-fi="${i}" ${p.on ? "checked" : ""}></label>
      <div class="g"><div class="ls"><input data-fv="festival" data-i="${i}" value="${E(p.festival)}" style="flex:2;min-width:160px;font-weight:700"><select data-fv="proyecto" data-i="${i}" style="flex:1;min-width:140px"><option value="">— Projecte —</option>${ps.map(x => `<option value="${x.id}" ${x.id === p.proyecto ? "selected" : ""}>${E(x.titulo || "")}</option>`).join("")}</select><select data-fv="plat" data-i="${i}" style="width:auto"><option value="">— Plataforma —</option>${PLAT.concat(p.plat && !PLAT.includes(p.plat) ? [p.plat] : []).map(x => `<option ${x === p.plat ? "selected" : ""}>${E(x)}</option>`).join("")}</select><select data-fv="estado" data-i="${i}" style="width:auto">${EST.map(e => `<option ${e === p.estado ? "selected" : ""}>${e}</option>`).join("")}</select></div>
      <small>${E(p.font)}${p.data ? " · " + H.fecha(p.data) : ""} · ${p.ja ? `ja hi és (${E(p.ja.estado || "")})${p.canvis ? " → s'actualitzarà" : ", sense canvis"}${p.baixa ? " (un avís antic no rebaixa l'estat)" : ""}` : "es crearà nova"}${p.premi ? " · premi: " + E(p.premi) : ""}${p.cost ? " · " + p.cost + " €" : ""}${p.dubte ? ' · <b style="color:#ff9f0a">no he entès l\'estat: revisa\'l</b>' : ""} · <span class="mut">${E(p.resum.slice(0, 90))}</span></small></div></div>`;
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Revisa abans d'importar</h2>
      <p class="em">${props.length ? "Marca el que vols importar. Pots corregir el nom del festival, la pel·lícula i l'estat." : origen === "correu" ? "No hi ha avisos nous de FilmFreeway ni de Festhome." : "No he trobat cap inscripció en el text enganxat. Prova de copiar tota la taula de «My Submissions»."}</p>
      <div id="fil">${props.map(fila).join("")}</div>
      <div class="sfoot"><span class="em">${marcats(props)}</span><button class="b" data-fk="ok" ${props.length ? "" : "disabled"}>Importar els marcats</button></div>`);
    const box = document.getElementById("hshc");
    box.oninput = box.onchange = e => { const t = e.target; if (t.dataset.fv) props[+t.dataset.i][t.dataset.fv] = t.value; if (t.dataset.fi) { props[+t.dataset.fi].on = t.checked; const r = document.getElementById("fip" + t.dataset.fi); r && r.classList.toggle("fio", !t.checked) } const n = box.querySelector(".sfoot .em"); if (n) n.textContent = marcats(props) };
    box.onclick = async e => {
      if (!e.target.closest('[data-fk="ok"]')) return;
      let nous = 0, act = 0;
      for (const p of props.filter(p => p.on && p.festival.trim())) {
        const c = p.cid && cs.find(x => x.id === p.cid);
        if (c) { Object.assign(c, { estado: p.estado }, p.proyecto && !c.proyecto ? { proyecto: p.proyecto } : {}, p.premi && !c.premi ? { premi: p.premi } : {}, p.cost && !c.cost ? { cost: p.cost } : {}, p.plat && !c.plataforma ? { plataforma: p.plat } : {}); H.put(c); act++ }
        else { H.put({ id: H.uid("convocatoria"), titulo: p.festival.trim(), tipo: "Festival", estado: p.estado, proyecto: p.proyecto, premi: p.premi || "", cost: p.cost || "", plataforma: p.plat || "", notas: "Importat de " + (p.font === "Llista" ? "la llista enganxada" : p.font === "Arxiu" ? "l'arxiu exportat" : p.font) + (p.data ? " (" + p.data + ")" : "") }, 1); nous++ }
      }
      // es donen per vistos els avisos importats i els que no aportaven res; els desmarcats amb canvis tornaran a sortir
      if (aj) { aj.vistos = [...new Set(aj.vistos.concat(props.filter(p => p.on || !p.canvis).flatMap(p => p.mids || [])))].slice(-3000); H.put(aj, 1) }
      H.cerrar(); H.toast(`${nous} noves, ${act} actualitzades`);
    };
  }

  async function obre() {
    let corOk = false; try { corOk = (await H.api("GET", "correu/config")).connectat } catch (e) { }
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">FilmFreeway i Festhome</h2>
      <div class="card" style="margin:12px 0"><h3>Des del correu</h3><p class="em">Llegeix els avisos que FilmFreeway i Festhome t'envien a pablo.anarte.film@gmail.com (inscripcions, seleccions i rebutjos dels últims dos anys) i et proposa els canvis. Els avisos ja revisats no tornen a sortir.</p>
        <button class="b" data-fk="mail" ${corOk ? "" : "disabled"}>Buscar avisos nous</button>${corOk ? "" : `<p class="em" style="color:#ff3b30">Cal connectar el correu (secció Correu).</p>`}<span id="fist" class="em" style="margin-left:10px"></span></div>
      <div class="card" style="margin-bottom:12px"><h3>Des d'un arxiu</h3><p class="em">A FilmFreeway, «Submissions» → «Export Submissions» → Date Range «All», CSV → «Export Data». Puja aquí l'arxiu (CSV o Excel). També serveix una llista teva de Numbers o Excel exportada, amb una fila de títols.</p>
        <label class="b" style="display:inline-flex;cursor:pointer;color:#fff">Triar l'arxiu<input type="file" id="fiarx" accept=".csv,.tsv,.txt,.xlsx" hidden></label><span id="fiax" class="em" style="margin-left:10px"></span></div>
      <div class="card"><h3>Enganxar la llista</h3><p class="em">A FilmFreeway, ves a «Submissions» (o a Festhome, «Mis inscripciones»), selecciona tota la llista, copia-la i enganxa-la aquí.</p>
        <textarea id="fitx" rows="8" placeholder="Enganxa aquí la llista copiada…"></textarea><button class="b2" data-fk="txt" style="margin-top:8px">Llegir la llista</button></div>`);
    const box = document.getElementById("hshc");
    document.getElementById("fiarx").onchange = async e => {
      const f = e.target.files[0]; if (!f) return; const st = document.getElementById("fiax"); st.textContent = "Llegint " + f.name + "…";
      try {
        const fulls = await IMP.llegir(f), rows = (fulls.find(x => x.rows && x.rows.length) || {}).rows || [];
        const t = rows.map(r => r.map(c => String(c ?? "").replace(/[\t\r\n]+/g, " ").trim()).join("\t")).join("\n");
        const props = (await deText(t)).props;
        if (!props.length) { st.textContent = "No hi he trobat inscripcions. Comprova que l'arxiu tingui les columnes Festival i Status."; e.target.value = ""; return }
        const pl = /festhome/i.test(f.name + t.slice(0, 3000)) ? "Festhome" : /filmfreeway/i.test(f.name + t.slice(0, 3000)) ? "FilmFreeway" : ""; props.forEach(p => { p.font = "Arxiu"; p.plat = pl }); revisa(props, "arxiu");
      } catch (er) { st.textContent = "No s'ha pogut llegir l'arxiu."; e.target.value = "" }
    };
    box.onclick = async e => {
      const b = e.target.closest("[data-fk]"); if (!b) return;
      if (b.dataset.fk === "mail") {
        document.getElementById("fist").textContent = "Llegint el correu…"; b.disabled = true;
        try { const r = await delCorreu(); revisa(r.props, "correu", r.aj) }
        catch (er) { b.disabled = false; document.getElementById("fist").textContent = er && er.error === "accio" ? "Cal actualitzar el pont de Google (Configuració → Pont de Google)." : "No s'ha pogut llegir: " + ((er && er.error) || "error") }
      }
      if (b.dataset.fk === "txt") { const t = document.getElementById("fitx").value; if (!t.trim()) return H.toast("Enganxa la llista primer"); const pl = /festhome|mis inscripciones/i.test(t) ? "Festhome" : /filmfreeway|my submissions|judging status/i.test(t) ? "FilmFreeway" : ""; revisa((await deText(t)).props.map(p => Object.assign(p, { plat: pl })), "text") }
    };
  }
  // per a Avui: avisos nous dels últims dies que canviarien alguna cosa (sense obrir res)
  async function pendents(dies) { const r = await delCorreu(dies || 21); const pr = await prepara(r.props); return { r, n: pr.props.filter(p => p.canvis).length, props: pr.props.filter(p => p.canvis) } }
  const revisaCorreu = r => revisa(r.props, "correu", r.aj);
  return { llegeix: filmfreeway, obre, pendents, revisaCorreu, _t: { estatDe, festivalDe, deText, PROMO } };
})();
