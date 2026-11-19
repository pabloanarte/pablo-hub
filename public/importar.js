// Importar guions tècnics i plans de rodatge des de PDF, Excel (.xlsx), CSV/TSV o un enllaç de Google Sheets (window.IMP).
// Tot acaba en una taula de files (array d'arrays de text) que després es converteix a la plantilla del hub.
window.IMP = (() => {
  // ---------- lectors ----------
  function csv(t) {
    const sep = (t.split("\n")[0].match(/\t/g) || []).length > (t.split("\n")[0].match(/;/g) || []).length ? "\t" : (t.split("\n")[0].match(/;/g) || []).length > (t.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
    const out = []; let row = [], f = "", q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++ } else if (c === '"') q = false; else f += c; continue }
      if (c === '"') q = true; else if (c === sep) { row.push(f); f = "" } else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(f); out.push(row); row = []; f = "" } else f += c;
    }
    if (f || row.length) { row.push(f); out.push(row) }
    return out;
  }
  let pdfjs;
  async function pdf(buf) {
    pdfjs = pdfjs || await import("/vendor/pdf.min.mjs"); pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
    const doc = await pdfjs.getDocument({ data: buf }).promise, linies = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const pg = await doc.getPage(n), tc = await pg.getTextContent(), its = tc.items.filter(i => i.str.trim()).map(i => ({ x: i.transform[4], y: i.transform[5], w: i.width, s: i.str.trim() }));
      its.sort((a, b) => b.y - a.y || a.x - b.x);
      for (const it of its) { const l = linies.length && linies[linies.length - 1]; if (l && l.pag === n && Math.abs(l.y - it.y) < 3.5) l.its.push(it); else linies.push({ pag: n, y: it.y, its: [it] }) }
    }
    return linies; // es converteixen a files quan es coneix la capçalera
  }
  // Converteix línies de PDF en files. Les cel·les poden ocupar diverses línies (centrades verticalment):
  // cada fila s'ancora a la columna clau (pla o hora) i el text del voltant s'assigna a l'àncora més propera.
  const BANDA_RX = /^(set\b|set:|wrap|recollida|dinar|comida|lunch|esmorzar|desayuno|sopar|cena|crew call|talent call|call\b|citaci|ready to shoot|scen\s*e|escena|esc\.?\s*\d|sc\.?\s*\d|\d{1,2}[:.]\d{2}(\s*-\s*\d{1,2}[:.]\d{2})?\s+[A-ZÀ-Ú])/i;
  function pdfAFiles(linies, esCap, clau) {
    const hi = linies.findIndex(l => esCap(l.its.map(i => i.s)) >= 3);
    if (hi < 0) return linies.map(l => ({ banda: l.its.map(i => i.s).join(" ") }));
    const cap = linies[hi].its.slice().sort((a, b) => a.x - b.x), cen = cap.map(c => c.x + c.w / 2), capT = cap.map(c => c.s);
    const col = it => { const x = it.x + it.w / 2; let k = 0, d = 1e9; cen.forEach((c, i) => { const e = Math.abs(c - x); if (e < d) { d = e; k = i } }); return k };
    const kcs = [].concat(clau(capT.map(c => c.toLowerCase()))).filter(k => k >= 0), kc = kcs[0];
    const out = linies.slice(0, hi).map(l => ({ banda: l.its.map(i => i.s).join(" ") }));
    out.push(capT);
    const bandes = [], items = [];
    for (const l of linies.slice(hi + 1)) {
      if (esCap(l.its.map(i => i.s)) >= 3) continue; // capçalera repetida
      const t = l.its.map(i => i.s).join(" ");
      if (l.its.length <= 2 && BANDA_RX.test(t) && !(kc >= 0 && l.its.some(i => col(i) === kc && /\d/.test(i.s) && !/[:.]\d{2}\s+[A-Z]/.test(t)))) { bandes.push({ pag: l.pag, y: l.y, t }); continue }
      l.its.forEach(i => items.push({ ...i, pag: l.pag, c: col(i) }));
    }
    // àncores: elements a la columna clau
    const anc = [];
    const cand = items.filter(i => kcs.includes(i.c) && i.s.trim() && i.s.trim() !== "-" || (i.c === kc && i.s.trim()));
    // un text sense xifres just a sobre d'un altre de la mateixa columna (p. ex. "SCEN" / "E: 01") no obre fila pròpia
    cand.filter(i => /\d/.test(i.s) || !cand.some(o => o !== i && o.pag === i.pag && o.c === i.c && i.y - o.y > 0 && i.y - o.y < 16)).forEach(i => { if (!anc.some(a => a.pag === i.pag && Math.abs(a.y - i.y) < 5)) anc.push({ pag: i.pag, y: i.y, cel: cap.map(() => []) }) });
    const entre = (pag, y1, y2) => bandes.some(b => b.pag === pag && b.y < Math.max(y1, y2) && b.y > Math.min(y1, y2));
    for (const it of items) {
      let best = null, d = 1e9;
      for (const a of anc) { if (a.pag !== it.pag || entre(it.pag, it.y, a.y)) continue; const e = Math.abs(a.y - it.y); if (e < d) { d = e; best = a } }
      if (!best || d > 60) { best = { pag: it.pag, y: it.y, cel: cap.map(() => []), orfe: 1 }; anc.push(best) }
      best.cel[it.c].push(it);
    }
    const tot = anc.map(a => ({ pag: a.pag, y: a.y, fila: a.cel.map(c => c.sort((p, q) => q.y - p.y || p.x - q.x).map(i => i.s).join(" ")) })).concat(bandes.map(b => ({ pag: b.pag, y: b.y, banda: b.t })));
    tot.sort((a, b) => a.pag - b.pag || b.y - a.y);
    tot.forEach(x => out.push(x.banda != null ? { banda: x.banda } : x.fila));
    return out;
  }
  async function xlsx(buf) {
    const X = await (window.ExcelJS ? Promise.resolve(window.ExcelJS) : new Promise((ok, ko) => { const s = document.createElement("script"); s.src = "/vendor/exceljs.min.js"; s.onload = () => ok(window.ExcelJS); s.onerror = ko; document.head.appendChild(s) }));
    const wb = new X.Workbook(); await wb.xlsx.load(buf); const fulls = [];
    wb.eachSheet(ws => { const rows = []; ws.eachRow({ includeEmpty: false }, r => { const a = []; r.eachCell({ includeEmpty: true }, (c, i) => { a[i - 1] = String(c.text ?? "").trim() }); rows.push(Array.from(a, x => x || "")) }); fulls.push({ nom: ws.name, rows }) });
    return fulls;
  }
  // Retorna una llista de "fulls": [{nom, rows}] o, per a PDF, [{nom, linies}]
  async function llegir(font) {
    if (typeof font === "string") { // enllaç de Google Sheets
      const r = await fetch("/api/importar?url=" + encodeURIComponent(font)), t = await r.text();
      if (!r.ok) throw new Error(t || "No s'ha pogut llegir el full");
      return [{ nom: "Google Sheets", rows: csv(t) }];
    }
    const nom = font.name.toLowerCase(), buf = await font.arrayBuffer();
    if (nom.endsWith(".pdf")) return [{ nom: font.name, linies: await pdf(buf) }];
    if (nom.endsWith(".xlsx") || nom.endsWith(".xlsm")) return xlsx(buf);
    return [{ nom: font.name, rows: csv(new TextDecoder().decode(buf)) }];
  }
  const files = (full, esCap, clau) => full.linies ? pdfAFiles(full.linies, esCap, clau || (() => 0)) : full.rows;
  const net = s => String(s || "").trim();

  // ---------- guió tècnic ----------
  const cGT = cs => { const l = cs.map(c => net(c).toLowerCase()); return R.compta(l) };
  function aGT(fulls) {
    const escenes = []; let cur = null;
    const nova = (num, extra = {}) => { cur = escenes.find(e => e.num === num); if (!cur) { cur = { id: R.uid(), num, intext: "", lugar: "", momento: "", planos: [], ...extra }; escenes.push(cur) } };
    for (const full of fulls) {
      const rs = files(full, cGT, cab => { const m = R.mapa(cab); return m.num != null ? m.num : 0 }); const hi = rs.findIndex(r => Array.isArray(r) && cGT(r) >= 3); if (hi < 0) continue;
      const mapa = R.mapa(rs[hi].map(c => net(c).toLowerCase()));
      for (const r of rs.slice(hi + 1)) {
        const vals = Array.isArray(r) ? r.map(net) : [net(r.banda)], plens = vals.filter(Boolean);
        if (!plens.length) continue;
        // banda d'escena: "ESC 3 · INT. CASA - DIA" o "SC 3 ..." en una sola cel·la
        const be = plens.join(" ").replace(/^S\s*C\s*E\s*N\s*E/i, "SCENE").match(/^(?:esc(?:ena)?|sc(?:ene)?|seq)\s*\.?\s*:?\s*(\d+[a-z]?)\b\s*[·.\-:|]?\s*(.*)$/i);
        if (be) { let resta = be[2]; const pg = resta.match(/(\d+\/\d+|\d+(?:[.,]\d+)?)\s*P[ÀÁA]G\.?\s*(.*)$/i); if (pg) resta = resta.slice(0, pg.index).trim(); const ie = resta.match(/^(INT\.?\/EXT|INT|EXT)\.?\s*/i), lm = resta.replace(/^(INT\.?\/EXT|INT|EXT)\.?\s*/i, "").split(/\s+[-–·]\s+/); nova(be[1], { intext: ie ? ie[1].toUpperCase().replace(".", "") : "", lugar: (lm[0] || "").trim(), momento: (lm[1] || "").trim(), paginas: pg ? pg[1] : "", sinopsis: pg ? pg[2].trim() : "" }); continue }
        if (!Array.isArray(r)) continue;
        const o = { id: R.uid() }; for (const [k, i] of Object.entries(mapa)) if (k !== "img") o[k] = net(r[i]);
        if (!o.num && !o.desc && !o.sujeto && !o.escala) continue;
        if (o.esc && !/\d/.test(o.esc)) { o.notas = [o.esc, o.notas].filter(Boolean).join(" "); delete o.esc }
        const n = o.esc || (cur ? cur.num : "1"); delete o.esc;
        if (!cur || cur.num !== n) nova(n, { intext: (o.intext || "").toUpperCase().replace(/\./g, ""), lugar: o.set || "" });
        delete o.intext; if (o.escala) o.escala = R.escNorm(o.escala) || o.escala; if (o.dur) o.dur = String(parseInt(o.dur) || ""); if (!o.set) o.set = cur.lugar || "";
        cur.planos.push(o);
      }
    }
    return escenes;
  }

  // ---------- pla de rodatge ----------
  const CAB_PDR = { hora: ["hora", "time"], num: ["pla", "pl.", "plano", "shot", "pl", "nº", "#"], esc: ["esc", "esc.", "escena", "sc", "scene"], escala: ["escala", "valor", "valor de pl", "shot size"], angulo: ["angulació", "angulación", "ang. vertical", "angle", "angulacio"], posicion: ["ang. horitzontal", "ang. horizontal", "posició", "posición"], desc: ["descripció", "descripción", "description", "acció", "acción"], mov: ["mov. de càmera", "mov. càmera", "mov. cámara", "mov. de cámara", "moviment", "movimiento", "movement", "mov"], personajes: ["personatges", "personajes", "characters", "subjecte", "sujeto"], vestuario: ["vestuari", "vestuario", "wardrobe"], notas: ["fx/notes", "fx / notes", "fx / notas", "notes", "notas", "observacions"], dur: ["durada", "duración", "dur", "dur.", "durada (min)", "duration"] };
  const cPDR = cs => { let n = 0; const l = cs.map(c => net(c).toLowerCase()); for (const ls of Object.values(CAB_PDR)) if (l.some(c => ls.includes(c))) n++; return n };
  const rang = s => { const m = String(s || "").match(/(\d{1,2})[:.h](\d{2})(?:\s*[-–a]\s*(\d{1,2})[:.h](\d{2}))?/); return m ? [+m[1] * 60 + +m[2], m[3] ? +m[3] * 60 + +m[4] : null] : null };
  function aDia(full) {
    const rs = files(full, cPDR, cab => [cab.findIndex(c => c === "hora" || c === "time"), cab.findIndex(c => ["pla", "pl.", "plano", "shot"].includes(c))]), hi = rs.findIndex(r => Array.isArray(r) && cPDR(r) >= 3), d = { id: R.uid(), fecha: "", calls: "", ready: "", filas: [] };
    const capL = hi >= 0 ? rs[hi].map(c => net(c).toLowerCase()) : [], mapa = {};
    capL.forEach((c, i) => { for (const [k, ls] of Object.entries(CAB_PDR)) if (!(k in mapa) && ls.includes(c)) { mapa[k] = i; break } });
    const calls = [];
    // abans de la capçalera: títol, data, citacions i ready to shoot
    rs.slice(0, Math.max(0, hi)).forEach(r => { const t = (Array.isArray(r) ? r.join(" ") : r.banda).trim(); if (/^set\s*:/i.test(t)) d.filas.push({ id: R.uid(), tipo: "set", texto: t.replace(/^set\s*:\s*/i, "") }); else if (/ready to shoot/i.test(t)) { const h = rang(t); if (h) d.ready = R.aHora(h[0]).padStart(5, "0") } else if (/call|citaci/i.test(t)) calls.push(t); const f = t.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/); if (f && !d.fecha) d.fecha = `${f[3].length === 2 ? "20" + f[3] : f[3]}-${f[2].padStart(2, "0")}-${f[1].padStart(2, "0")}` });
    let t0 = null;
    for (const r of rs.slice(hi + 1)) {
      const vals = Array.isArray(r) ? r.map(net) : [net(r.banda)], plens = vals.filter(Boolean), txt = plens.join(" ");
      if (!plens.length) continue;
      const esBanda = !Array.isArray(r) || (plens.length <= 2 && !(mapa.num != null && vals[mapa.num] && /^\d/.test(vals[mapa.num])));
      if (esBanda) {
        const h = rang(txt), sense = txt.replace(/(\d{1,2})[:.h](\d{2})(\s*[-–a]\s*(\d{1,2})[:.h](\d{2}))?/, "").replace(/^[\s·:-]+|[\s·:-]+$/g, "");
        if (/ready to shoot/i.test(txt)) { if (h) d.ready = R.aHora(h[0]).padStart(5, "0"); continue }
        if (/call|citaci/i.test(txt)) { calls.push(txt); continue }
        if (/^set\b|^set:/i.test(sense)) { d.filas.push({ id: R.uid(), tipo: "set", texto: sense.replace(/^set\s*:?\s*/i, "") }); continue }
        if (/wrap/i.test(sense)) { d.filas.push({ id: R.uid(), tipo: "wrap", texto: "WRAP" }); continue }
        if (/dinar|comida|lunch|esmorzar|desayuno|breakfast|sopar|cena/i.test(sense)) { d.filas.push({ id: R.uid(), tipo: "comida", texto: sense.toUpperCase(), dur: h && h[1] ? h[1] - h[0] : 60, fija: h ? R.aHora(h[0]) : "" }); continue }
        if (sense) d.filas.push({ id: R.uid(), tipo: "proceso", texto: sense, dur: h && h[1] ? h[1] - h[0] : 30 });
        continue;
      }
      const g = k => { const v = mapa[k] != null ? vals[mapa[k]] || "" : ""; return v === "-" ? "" : v }, h = rang(g("hora"));
      if (h && t0 == null) t0 = h[0];
      const dur = parseInt(g("dur")) || (h && h[1] ? h[1] - h[0] : null);
      if (!g("num") && !g("escala") && g("desc") && g("desc") === g("desc").toUpperCase()) { d.filas.push({ id: R.uid(), tipo: "proceso", texto: g("desc"), dur, _ini: h && h[0] }); continue }
      d.filas.push({ id: R.uid(), _ini: h && h[0], tipo: "plano", num: g("num"), esc: g("esc"), escala: R.escNorm(g("escala")) || g("escala"), angulo: g("angulo"), posicion: g("posicion"), desc: g("desc"), mov: g("mov"), personajes: g("personajes"), vestuario: g("vestuario"), notas: g("notas"), dur });
    }
    // durades que falten: fins a l'inici de la fila següent
    d.filas.forEach((f, i) => { if (f.dur == null && ["plano", "proceso"].includes(f.tipo)) { const n = d.filas.slice(i + 1).find(x => x._ini != null); f.dur = f._ini != null && n ? Math.max(5, n._ini - f._ini) : f.tipo === "proceso" ? 30 : 20 } });
    // si el primer element comença abans del "ready to shoot" (p. ex. muntatges), el pla comença a aquella hora
    if (t0 != null && (!d.ready || R.aMin(d.ready) > t0)) d.readyReal = d.ready;
    d.filas.forEach(f => delete f._ini);
    if (t0 != null) d.ready = R.aHora(t0).padStart(5, "0");
    d.calls = calls.join("\n");
    if (!d.filas.some(f => f.tipo === "wrap")) d.filas.push({ id: R.uid(), tipo: "wrap", texto: "WRAP" });
    return d;
  }

  // ---------- diàleg comú ----------
  // tipus: "gt" o "pdr". fet(resultat) rep les escenes (gt) o les jornades (pdr).
  function dialeg(tipus, fet) {
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">Importar ${tipus === "gt" ? "un guió tècnic" : "un pla de rodatge"}</h2>
      <p class="em" style="margin-top:0">Puja un PDF, un Excel (.xlsx) o un CSV${tipus === "pdr" ? " (pots pujar-ne un per jornada, en ordre)" : ""}, o enganxa l'enllaç d'un full de Google Sheets compartit com a «Qualsevol amb l'enllaç». El converteixo a la plantilla del hub i després el pots retocar.</p>
      <label class="b" style="display:inline-flex;cursor:pointer;color:#fff">Triar arxius<input type="file" id="imp-f" accept=".pdf,.xlsx,.csv,.tsv,.txt" ${tipus === "pdr" ? "multiple" : ""} hidden></label>
      <label>O enllaç de Google Sheets</label><div class="row"><input id="imp-u" placeholder="https://docs.google.com/spreadsheets/d/…"><button class="b2" id="imp-ub">Importar</button></div>
      <p class="em" id="imp-st"></p>`);
    const st = t => { const e = document.getElementById("imp-st"); if (e) e.textContent = t };
    const fer = async fonts => {
      try {
        st("Llegint…"); const fulls = []; for (const f of fonts) fulls.push(...await llegir(f));
        if (tipus === "gt") { const e = aGT(fulls); if (!e.length || !e.some(x => x.planos.length)) return st("No he trobat cap taula de plans. Comprova que l'arxiu té una fila de capçalera (Pla, Escala, Descripció…)."); H.cerrar(); fet(e) }
        else { const ds = fulls.map(aDia).filter(d => d.filas.some(f => f.tipo === "plano")); if (!ds.length) return st("No he trobat cap taula de plans. Comprova que l'arxiu té una fila de capçalera (Hora, Pla, Escala, Descripció…)."); H.cerrar(); fet(ds) }
      } catch (e) { st("No s'ha pogut llegir: " + (e.message || e)) }
    };
    document.getElementById("imp-f").onchange = e => e.target.files.length && fer([...e.target.files]);
    document.getElementById("imp-ub").onclick = () => { const u = document.getElementById("imp-u").value.trim(); if (u) fer([u]) };
  }
  return { llegir, aGT, aDia, dialeg, csv };
})();
