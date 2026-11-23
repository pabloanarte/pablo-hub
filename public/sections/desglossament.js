// Desglossament de guió: es puja el guió en PDF i surten les escenes (INT/EXT, set, moment, pàgines en vuitens, personatges).
// Tot és editable. Des d'aquí es pot crear el guió tècnic i veure el resum per set i per personatge (per al pressupost i el pla).
(() => {
  const { E } = H, el = document.getElementById("s-desglossament");
  let doc = null, vista = "esc", ver = 0;
  const save = () => H.put(doc);
  const CAMPS = [["num", "Esc.", 5], ["intext", "INT/EXT", 7], ["set", "Set", 16], ["moment", "Moment", 8], ["pag", "Pàg.", 6], ["pers", "Personatges", 18], ["atrezzo", "Atrezzo", 12], ["vestuari", "Vestuari / maquillatge", 12], ["notes", "Notes (FX, vehicles, animals…)", 16]];
  const vuitens = n => { if (!n) return "0"; const e = Math.max(1, Math.round(n * 8)), p = Math.floor(e / 8), r = e % 8; return (p ? p + (r ? " " : "") : "") + (r ? r + "/8" : "") };
  // "1 4/8", "3/8", "1/2", "1.5", "1,5" → pàgines
  const aNum = s => { s = String(s || "").trim().replace(",", "."); let m; if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return +m[1] + m[2] / m[3]; if ((m = s.match(/^(\d+)\/(\d+)$/))) return m[1] / m[2]; return parseFloat(s) || 0 };

  // ---------- llegir el guió ----------
  const NUM = "\\d+[A-Z]?(?:\\s*[+\\/-]\\s*\\d+[A-Z]?)*"; // «7», «7A», «7+8»
  const HEAD = /^\s*(\d+[A-Z]?(?:\s*[+\/-]\s*\d+[A-Z]?)*[.)]?\s+)?(INT\.?\s*\/\s*EXT|EXT\.?\s*\/\s*INT|I\/E|INT|EXT)[.\s:]/i;
  const TRANS = /^(CORTE A|CORTA A|FUNDIDO|FUNDE|CUT TO|FADE|DISSOLVE|ENCADENA|TALL A|FOS|CONTINUAR|CONTINUA|CONTINÚA|\(?CONT|FIN\b|THE END)/i;
  async function llegeix(file) {
    const pdfjs = await import("/vendor/pdf.min.mjs"); pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise, pags = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const pg = await pdf.getPage(n), vp = pg.getViewport({ scale: 1 }), tc = await pg.getTextContent(), ls = [];
      tc.items.filter(i => i.str.trim()).forEach(i => { const y = i.transform[5], x = i.transform[4]; let l = ls.find(l => Math.abs(l.y - y) < 3); if (!l) ls.push(l = { y, x, t: [] }); l.t.push([x, i.str, i.width || 0, Math.abs(i.transform[0]) || 12]); l.x = Math.min(l.x, x) });
      // alguns PDF (p. ex. els exportats des de l'iPhone o l'iPad) donen cada lletra per separat: s'ajunten per posició,
      // i només hi va un espai quan hi ha un buit real entre lletres
      ls.forEach(l => { let s = "", fi = null; l.t.sort((a, b) => a[0] - b[0]).forEach(([x, t, w, f]) => { if (fi != null && x - fi > f * .22 && !/\s$/.test(s) && !/^\s/.test(t)) s += " "; s += t; fi = x + (w || t.length * f * .6) }); l.s = s.replace(/\s+/g, " ").trim();
        // trossos separats per un buit gran (diàleg doble a dues columnes)
        l.segs = []; let cur = null, fi2 = null; l.t.forEach(([x, t, w, f]) => { if (!cur || x - fi2 > f * 2.5) l.segs.push(cur = { x, s: "" }); else if (x - fi2 > f * .22 && !/\s$/.test(cur.s)) cur.s += " "; cur.s += t; fi2 = x + (w || t.length * f * .6) }); l.segs.forEach(g => g.s = g.s.replace(/\s+/g, " ").trim()) });
      ls.sort((a, b) => b.y - a.y);
      // treu el número de pàgina (una línia curta només amb números a dalt o a baix)
      pags.push({ alt: vp.height, ls: ls.filter((l, i) => !((i === 0 || i === ls.length - 1) && /^\d{1,3}\.?$/.test(l.s))) });
    }
    return pags;
  }
  function desglossa(pags) {
    const tots = pags.flatMap(p => p.ls), marge = tots.length ? tots.map(l => l.x).sort((a, b) => a - b)[Math.floor(tots.length * .1)] : 0;
    const esc = []; let cur = null;
    pags.forEach((p, pi) => {
      const util = p.alt * .84; // alçada útil aproximada d'una pàgina de guió
      p.ls.forEach((l, li) => {
        const seg = p.ls[li + 1], alt = seg ? l.y - seg.y : 14;
        if (HEAD.test(l.s)) {
          const t = l.s.replace(/^\s*\d+[A-Z]?(?:\s*[+\/-]\s*\d+[A-Z]?)*[.)]?\s+/, "").replace(/\s+\d+[A-Z]?(?:\s*[+\/-]\s*\d+[A-Z]?)*\.?\s*$/, ""), m = t.match(/^(INT\.?\s*\/\s*EXT|EXT\.?\s*\/\s*INT|I\/E|INT|EXT)[.\s:]*(.*)$/i);
          const parts = (m ? m[2] : t).split(/\s+[-–—]\s+/), num = ((l.s.match(/^\s*(\d+[A-Z]?(?:\s*[+\/-]\s*\d+[A-Z]?)*)/) || [])[1] || "").replace(/\s+/g, "");
          cur = { id: R.uid(), num: num || String(esc.length + 1), intext: m ? m[1].toUpperCase().replace(/\s/g, "").replace(/\.$/, "").replace(/\./g, ".") : "", set: (parts.length > 1 ? parts.slice(0, -1).join(" - ") : parts[0]).trim(), moment: parts.length > 1 ? parts.at(-1).trim() : "", pag: 0, pers: [], atrezzo: "", vestuari: "", notes: "", pagina: pi + 1 };
          cur.text = [[0, l.s]];
          esc.push(cur);
        } else if (cur) {
          // text del guió per a l'animàtic del storyboard: [sagnat en caràcters, línia]; línia buida quan hi ha salt de paràgraf
          const ant = li ? p.ls[li - 1] : null; if (ant && ant.y - l.y > 20) cur.text.push([0, ""]);
          cur.text.push([Math.max(0, Math.round((l.x - marge) / 7.2)), (l.segs && l.segs.length > 1 ? l.segs.map(g => g.s).join("      ") : l.s)]);
          (l.segs && l.segs.length > 1 ? l.segs : [l]).forEach(g => {
            const net = g.s.replace(/\s*\((CONT['’]?D?|CONT\.|V\.?O\.?|O\.?S\.?|OFF|O\.?C\.?|CONTINUA|CONTINÚA|CONT)\)\s*/gi, "").trim();
            if (g.x - marge > 70 && net === net.toUpperCase() && /[A-ZÀ-Ý]/.test(net) && net.split(" ").length <= 4 && !TRANS.test(net) && !/^\(/.test(net) && !/[.!?]$/.test(net)) { if (!cur.pers.includes(net)) cur.pers.push(net) }
          });
        }
        if (cur) cur.pag += Math.min(alt, 40) / util;
      });
    });
    return esc.map(e => { const o = { ...e, pag: vuitens(e.pag), pers: e.pers.join(", ") }; o._a = { intext: o.intext, set: o.set, moment: o.moment, pag: o.pag, pers: o.pers }; return o });
  }

  // Empremta d'una escena (capçalera i text): serveix per saber si ha canviat respecte del guió tècnic
  const firma = e => { const t = [e.num, e.intext, e.set, e.moment, (e.text || []).map(x => x[1]).join("\n")].join("|"); let h = 5381; for (let i = 0; i < t.length; i++) h = (h * 33 ^ t.charCodeAt(i)) >>> 0; return h.toString(36) };
  // Què ha canviat entre el desglossament i un guió tècnic vinculat
  function diferencies(gt, d) {
    const ref = new Set(gt.escenas.map(e => e.dsg).filter(Boolean));
    return {
      nous: d.escenes.filter(e => !ref.has(e.id) && !(gt.ignora || []).includes(e.id)),
      canvis: gt.escenas.filter(e => e.dsg && d.escenes.some(x => x.id === e.dsg && firma(x) !== e.pet)),
      fora: gt.escenas.filter(e => e.dsg && !e.fora && !d.escenes.some(x => x.id === e.dsg))
    };
  }
  // El guió és el tronc del projecte: quan se'n puja una versió (al Resum o a Desenvolupament) es torna a desglossar sol.
  // Si el projecte ja tenia desglossament, s'hi conserva el que s'hagi escrit a mà (atrezzo, vestuari, notes).
  async function desdePDF(f, pid, nom) {
    const pags = await llegeix(f), escenes = desglossa(pags);
    if (!escenes.length) throw new Error("No he trobat capçaleres d'escena (INT./EXT.)");
    const p = (await H.col("proyecto")).find(x => x.id === pid);
    const dsg = await H.col("desg");
    let d = (p && p.desg && dsg.find(x => x.id === p.desg)) || dsg.filter(x => x.proyecto === pid).sort((a, b) => (b.mod || 0) - (a.mod || 0))[0];
    if (d) {
      const usats = new Set();
      escenes.forEach(e => { const v = d.escenes.find(o => !usats.has(o) && o.num === e.num && (o.set || "").toLowerCase() === (e.set || "").toLowerCase()) || d.escenes.find(o => !usats.has(o) && o.num === e.num); if (!v) return; usats.add(v); e.id = v.id;
        ["atrezzo", "vestuari", "notes"].forEach(k => { if (v[k]) e[k] = v[k] });
        // el que hagis corregit a mà (set, moment, pàgines, personatges) es manté si el guió no ho ha canviat
        ["intext", "set", "moment", "pag", "pers"].forEach(k => { if (v._a ? v[k] !== v._a[k] : false) e[k] = v[k] }) });
      // les escenes afegides a mà (sense lectura automàtica) es queden
      d.escenes = escenes.concat(d.escenes.filter(o => !o._a && !usats.has(o))); d.mod = Date.now();
    } else d = { id: H.uid("desg"), proyecto: pid, titulo: nom || (p && p.titulo) || "Guió", escenes, mod: Date.now() };
    await H.put(d, 1);
    if (p && p.desg !== d.id) { p.desg = d.id; await H.put(p, 1) }
    // guions tècnics fets d'aquest desglossament que ara tenen escenes per revisar
    const gts = (await H.col("gt")).filter(g => g.desg === d.id), revisar = gts.reduce((a, g) => { const x = diferencies(g, d); return a + x.nous.length + x.canvis.length + x.fora.length }, 0);
    return { d, pagines: pags.length, revisar };
  }

  // ---------- llista ----------
  async function lista(auto) {
    const v = ++ver, [ds0, ps] = await Promise.all([H.col("desg"), H.col("proyecto")]); if (v !== ver) return; const ds = ds0.filter(H.dePj); doc = null;
    const pj = ps.find(x => x.id === H.pj()); if (auto && pj && pj.desg && ds.some(x => x.id === pj.desg)) return obre(pj.desg);
    // dins un projecte: els guions ja pujats (Resum o Desenvolupament) es poden desglossar directament
    const enPj = pj && H.pj() !== "-", dev = enPj ? (await H.col("dev")).find(x => x.id === "dev:" + pj.id.split(":")[1]) : null; if (v !== ver) return;
    const gs = ((dev && dev.versions) || []).filter(x => x.tipus === "Guió" && x.arxiu).sort((a, b) => (b.data || "").localeCompare(a.data || "") || String(b.versio || "").localeCompare(String(a.versio || ""), undefined, { numeric: true }));
    const triar = gs.length ? `<h2 style="margin:4px 0 6px">Guions del projecte</h2><div style="margin-bottom:22px">${gs.map((g, i) => `<div class="r"><i class="dot" style="background:${i ? "var(--mut)" : "#30b27a"}"></i><div class="g"><b>${E(g.versio || "Guió")}${i ? "" : " · la més nova"}</b><small>${E([g.data && H.fecha ? H.fecha(g.data) : g.data, g.pag && g.pag + " pàg.", g.arxiu.nombre].filter(Boolean).join(" · "))}</small></div><button class="${i ? "b2" : "b"}" data-k="dver" data-a="${E(g.arxiu.id)}" data-n="${E(g.arxiu.nombre || "guio.pdf")}" data-v="${E(g.versio || "")}">Desglossar</button></div>`).join("")}</div>${ds.length ? `<h2 style="margin:0 0 6px">Desglossaments</h2>` : ""}` : "";
    const txt = !enPj ? "Puja el guió en PDF (format estàndard) i en sortiran les escenes desglossades." : gs.length ? "Tria quina versió del guió vols desglossar." : "Encara no hi ha cap guió en aquest projecte. Puja'l al Resum del projecte o aquí mateix.";
    el.innerHTML = `<div class="bar"><span class="em">${txt}</span><span style="flex:1"></span><label class="${enPj && gs.length ? "b2" : "b"}" style="cursor:pointer">${enPj ? (gs.length ? "Pujar una versió nova (PDF)" : "Pujar el guió (PDF)") : "Desglossar un guió (PDF)"}<input type="file" accept=".pdf,application/pdf" data-k="pdf" hidden></label></div>${triar}
      ${ds.length ? ds.sort((a, b) => (b.mod || 0) - (a.mod || 0)).map(d => { const p = ps.find(x => x.id === d.proyecto); return `<div class="r" data-k="obre" data-id="${d.id}"><i class="dot" style="background:#ff9f0a"></i><div class="g"><b>${E(d.titulo || "Sense títol")}</b><small>${[p && p.titulo, d.escenes.length + " escenes", vuitens(d.escenes.reduce((a, e) => a + aNum(e.pag), 0)) + " pàg.", new Set(d.escenes.map(e => e.set)).size + " sets"].filter(Boolean).map(E).join(" · ")}</small></div></div>` }).join("") : (gs.length ? "" : `<p class="em">Encara no hi ha cap desglossament.</p>`)}`;
  }
  async function obre(id) { ++ver; doc = (await H.col("desg")).find(x => x.id === id); if (doc) pinta() }

  // ---------- editor ----------
  function resum(k) {
    const g = {};
    doc.escenes.forEach(e => (k === "set" ? [e.set || "—"] : String(e.pers || "").split(",").map(x => x.trim()).filter(Boolean)).forEach(c => { const o = g[c] = g[c] || { esc: [], pag: 0, dia: 0, nit: 0, pers: new Set() }; o.esc.push(e.num); o.pag += aNum(e.pag); if (/NIT|NOCHE|NIGHT|ATARD|CAPVESP|DUSK|ANOCHE/i.test(e.moment)) o.nit++; else o.dia++; String(e.pers || "").split(",").map(x => x.trim()).filter(Boolean).forEach(p => o.pers.add(p)) }));
    return Object.entries(g).sort((a, b) => b[1].pag - a[1].pag);
  }
  async function pinta() {
    const ps = (await H.col("proyecto")).filter(p => H.meu(p) || p.id === doc.proyecto), tot = doc.escenes.reduce((a, e) => a + aNum(e.pag), 0);
    el.innerHTML = `<div class="bar tb"><button class="b2" data-k="torna">← Desglossaments</button><input data-d="titulo" value="${E(doc.titulo || "")}" placeholder="Títol" style="max-width:320px;font-weight:700"><select data-d="proyecto" style="width:auto"><option value="">Sense projecte</option>${ps.map(p => `<option value="${p.id}" ${p.id === doc.proyecto ? "selected" : ""}>${E(p.titulo || "")}</option>`).join("")}</select><span style="flex:1"></span><button class="b2" data-k="pdfx">PDF</button><button class="b" data-k="gt">Crear el guió tècnic</button></div>
      <div class="kpi" style="grid-template-columns:repeat(4,1fr);margin:6px 0 14px"><div><b>${doc.escenes.length}</b><small>Escenes</small></div><div><b>${vuitens(tot)}</b><small>Pàgines</small></div><div><b>${new Set(doc.escenes.map(e => e.set)).size}</b><small>Sets</small></div><div><b>${resum("pers").length}</b><small>Personatges</small></div></div>
      <div class="seg" style="margin-bottom:12px">${[["esc", "Escenes"], ["set", "Per set"], ["pers", "Per personatge"]].map(([k, l]) => `<button class="t ${vista === k ? "on" : ""}" data-k="vis" data-v="${k}">${l}</button>`).join("")}</div>
      ${vista === "esc" ? `<p class="em" style="margin:0 0 8px">Revisa-ho: la lectura del PDF és automàtica i els noms de personatge o les pàgines poden necessitar algun retoc. Les pàgines van en vuitens (1 4/8 = pàgina i mitja).</p>
        <div class="cits"><table class="ctab dsg"><thead><tr>${CAMPS.map(([, l, w]) => `<th style="width:${w}%">${l}</th>`).join("")}<th style="width:34px"></th></tr></thead><tbody>${doc.escenes.map((e, i) => `<tr style="${/NIT|NOCHE|NIGHT|ATARD|CAPVESP|DUSK|ANOCHE/i.test(e.moment) ? "background:#e6ebfa" : /EXT/i.test(e.intext) ? "background:#fff3d6" : ""}">${CAMPS.map(([f]) => `<td><textarea rows="1" data-i="${i}" data-f="${f}">${E(e[f] || "")}</textarea></td>`).join("")}<td><button class="x" data-k="treu" data-i="${i}" title="Treure l'escena">×</button></td></tr>`).join("")}</tbody></table></div>
        <div class="ls" style="margin-top:8px"><button class="b2" data-k="afegeix">+ Escena</button><span class="lg" style="margin:0"><span><i style="background:#fff;border:1px solid #c7c7cc;width:12px;height:12px"></i>Interior de dia</span><span><i style="background:#fff3d6;border:1px solid #c7c7cc;width:12px;height:12px"></i>Exterior de dia</span><span><i style="background:#e6ebfa;border:1px solid #c7c7cc;width:12px;height:12px"></i>Nit o capvespre</span></span></div>`
      : `<div class="cits"><table class="ctab"><thead><tr><th style="width:26%">${vista === "set" ? "Set" : "Personatge"}</th><th>Escenes</th><th style="width:10%">Pàgines</th><th style="width:12%">Dia / nit</th>${vista === "set" ? "<th>Personatges</th>" : ""}</tr></thead><tbody>${resum(vista).map(([k, o]) => `<tr><td style="padding:8px 6px"><b>${E(k)}</b></td><td style="padding:8px 6px">${E(o.esc.join(", "))}</td><td style="padding:8px 6px">${vuitens(o.pag)}</td><td style="padding:8px 6px">${o.dia} / ${o.nit}</td>${vista === "set" ? `<td style="padding:8px 6px">${E([...o.pers].join(", "))}</td>` : ""}</tr>`).join("")}</tbody></table></div>`}
      <div class="ls" style="margin:22px 0 40px"><button class="del" style="margin:0" data-k="esborra">Eliminar el desglossament</button></div>`;
    el.querySelectorAll(".dsg textarea").forEach(alca);
  }
  const alca = t => { t.style.height = "auto"; t.style.height = t.scrollHeight + "px" };

  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    if (k === "obre") return obre(b.dataset.id);
    if (k === "dver") {
      b.disabled = true; b.textContent = "Desglossant…";
      try {
        const r0 = await fetch("/api/archivo/" + encodeURIComponent(b.dataset.a)); if (!r0.ok) throw new Error("arxiu");
        const f = new File([await r0.blob()], b.dataset.n, { type: "application/pdf" }), pid = H.pj(), p = (await H.col("proyecto")).find(x => x.id === pid);
        const r = await desdePDF(f, pid, ((p && p.titulo) || "Guió") + (b.dataset.v ? " " + b.dataset.v : ""));
        H.toast(`${r.d.escenes.length} escenes desglossades${r.revisar ? ` · el guió tècnic té ${r.revisar} ${r.revisar === 1 ? "canvi" : "canvis"} per revisar` : ""}`); doc = r.d; vista = "esc"; return pinta();
      } catch (er) { b.disabled = false; b.textContent = "Desglossar"; return H.toast(er && /capçaleres/.test(er.message) ? "No he trobat capçaleres d'escena (INT./EXT.). És un guió en format estàndard?" : er && er.message === "arxiu" ? "No he pogut obrir l'arxiu del guió" : "No s'ha pogut llegir el PDF") }
    }
    if (!doc) return;
    if (k === "torna") return lista();
    if (k === "vis") { vista = b.dataset.v; pinta() }
    if (k === "treu" && confirm("Treure aquesta escena del desglossament?")) { doc.escenes.splice(+b.dataset.i, 1); save(); pinta() }
    if (k === "afegeix") { doc.escenes.push({ id: R.uid(), num: String(doc.escenes.length + 1), intext: "INT", set: "", moment: "", pag: "1/8", pers: "", atrezzo: "", vestuari: "", notes: "" }); save(); pinta() }
    if (k === "esborra" && confirm("Eliminar aquest desglossament?")) { await H.del(doc); lista() }
    if (k === "gt") {
      if (!window.GT || !GT.nou) return H.toast("No s'ha pogut obrir Guions tècnics");
      const escenes = doc.escenes.map(x => ({ id: R.uid(), dsg: x.id, pet: firma(x), num: x.num, intext: x.intext, lugar: x.set, momento: x.moment, paginas: x.pag, notas: [x.pers && "Personatges: " + x.pers, x.atrezzo && "Atrezzo: " + x.atrezzo, x.vestuari && "Vestuari: " + x.vestuari, x.notes].filter(Boolean).join("\n"), planos: [] }));
      GT.nou(escenes, doc.titulo, doc.proyecto, doc.id);
    }
    if (k === "pdfx") R.pdf(`<div class="pz"><h1>${E(doc.titulo || "Desglossament")}</h1><p>${doc.escenes.length} escenes · ${vuitens(doc.escenes.reduce((a, e) => a + aNum(e.pag), 0))} pàgines</p><table><tr>${CAMPS.map(([, l]) => `<th>${l}</th>`).join("")}</tr>${doc.escenes.map(e => `<tr>${CAMPS.map(([f]) => `<td>${E(e[f] || "")}</td>`).join("")}</tr>`).join("")}</table></div>`);
  });
  el.addEventListener("input", e => {
    const t = e.target; if (!doc) return;
    if (t.dataset.f) { doc.escenes[+t.dataset.i][t.dataset.f] = t.value; alca(t); doc.mod = Date.now(); save() }
    if (t.dataset.d) { doc[t.dataset.d] = t.value; save() }
  });
  el.addEventListener("change", async e => {
    const t = e.target;
    if (t.dataset.d === "proyecto") { doc.proyecto = t.value; save() }
    if (t.dataset.k !== "pdf" || !t.files[0]) return;
    const f = t.files[0]; H.toast("Llegint el guió…");
    try {
      if (H.pj() && H.pj() !== "-" && window.PJ) { t.value = ""; const r = await PJ.pujaGuio(H.pj(), f); if (r && r.d) { doc = r.d; vista = "esc"; pinta() } return }
      const escenes = desglossa(await llegeix(f));
      if (!escenes.length) { t.value = ""; return H.toast("No he trobat capçaleres d'escena (INT./EXT.). És un guió en format estàndard?") }
      const d = { id: H.uid("desg"), proyecto: H.pj() === "-" ? "" : H.pj(), titulo: f.name.replace(/\.pdf$/i, "").replace(/^[0-9a-f]{8}-/, "").replace(/_+/g, " "), escenes, mod: Date.now() };
      await H.put(d, 1); doc = d; vista = "esc"; pinta(); H.toast(escenes.length + " escenes trobades");
    } catch (er) { H.toast(er && /capçaleres/.test(er.message) ? "No he trobat capçaleres d'escena (INT./EXT.). És un guió en format estàndard?" : "No s'ha pogut llegir el PDF") }
    t.value = "";
  });
  // en entrar: dins un projecte s'obre el seu desglossament (i es torna a llegir per si s'ha pujat un guió nou)
  window.addEventListener("hub-sec", e => { if (e.detail !== "desglossament") return; if (doc && H.dePj(doc)) return obre(doc.id); lista(true) });
  window.DESG = { obre, desdePDF, firma, diferencies };
  if (!el.hidden) lista(true);
})();
