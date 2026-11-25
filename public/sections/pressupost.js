// Pressupost d'un projecte (pestanya «Pressupost» dins el projecte). Un document "pres:<id del projecte>":
// partides per capítols (quantitat × dies/unitats × preu = previst; real gastat; pagat), imprevistos en %, i finançament.
(() => {
  const { E } = H, el = document.getElementById("s-pressupost");
  const CAP = ["Guió i drets", "Repartiment", "Equip tècnic", "Art i vestuari", "Localitzacions", "Material i lloguers", "Transport i dietes", "Postproducció", "Música i so", "Assegurances i permisos", "Festivals i distribució", "Altres"];
  // Partides de partida segons el tipus de projecte (es poden esborrar o afegir-ne)
  const PLANT = {
    base: { "Repartiment": ["Protagonistes", "Secundaris", "Figuració"], "Equip tècnic": ["Direcció de fotografia", "Ajudant de càmera", "Gaffer / elèctric", "So directe", "Direcció d'art", "Maquillatge i perruqueria", "Ajudant de direcció", "Producció"], "Art i vestuari": ["Atrezzo", "Vestuari"], "Localitzacions": ["Lloguer de localitzacions"], "Material i lloguers": ["Càmera i òptiques", "Llum i maquinària", "So"], "Transport i dietes": ["Furgoneta i benzina", "Càtering i dietes"], "Postproducció": ["Muntatge", "Etalonatge", "Mescla de so"], "Música i so": ["Música original o drets"], "Assegurances i permisos": ["Assegurança de rodatge", "Permisos de rodatge"] },
    curt: { "Guió i drets": ["Guió"], "Festivals i distribució": ["Inscripcions a festivals", "Subtítols i DCP"] },
    videoclip: {}
  };
  const FT = ["Aportació pròpia", "Subvenció", "Patrocini", "Crowdfunding", "Coproducció", "Productora", "Altres"], FE = ["Previst", "Sol·licitat", "Concedit", "Cobrat"];
  const FC = { "Previst": "#8e8e93", "Sol·licitat": "#ff9f0a", "Concedit": "#0a84ff", "Cobrat": "#30b27a" };
  const num = v => { let s = String(v ?? "").replace(/[\s€]/g, ""); if (!s) return 0; if (s.includes(",")) s = s.replace(/\.(?=\d{3}(\D|$))/g, "").replace(/,(?=\d{3}(\D|$))/g, s.indexOf(",") < s.lastIndexOf(".") ? "" : ",").replace(",", "."); else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ""); return +s || 0 };
  const eur = n => (Math.round(n * 100) / 100).toLocaleString("ca-ES", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
  const uid = () => Math.random().toString(36).slice(2, 9);
  const prev = x => (x.q === "" || x.q == null ? 1 : num(x.q)) * (x.u === "" || x.u == null ? 1 : num(x.u)) * num(x.preu);
  let p = null, d = null, ver = 0;
  const save = () => H.put(d);

  function plantilla(cat) {
    const t = Object.assign({}, PLANT.base, ["Llarg", "Curt"].includes(cat) ? PLANT.curt : PLANT.videoclip), l = [];
    CAP.forEach(c => (t[c] || []).forEach(n => l.push({ id: uid(), cap: c, concepte: n })));
    return l;
  }
  async function pinta() {
    const pid = H.pj(); if (el.hidden) return;
    if (!pid || pid === "-") { el.innerHTML = `<p class="em">El pressupost es fa dins de cada projecte: obre un projecte i ves a la pestanya «Pressupost».</p>`; return }
    const v = ++ver, [ps, ds] = await Promise.all([H.col("proyecto"), H.col("pres")]); if (v !== ver) return;
    p = ps.find(x => x.id === pid); if (!p) return;
    const id = "pres:" + pid.split(":")[1]; d = ds.find(x => x.id === id);
    if (!d) { el.innerHTML = `<div class="card" style="max-width:560px"><h3>Encara no hi ha pressupost</h3><p class="em" style="margin-top:0">Començo amb les partides habituals ${({ Llarg: "d'un llargmetratge", Curt: "d'un curtmetratge", Videoclip: "d'un videoclip", Publicitat: "d'una peça de publicitat" })[p.categoria] || "d'un projecte"} (sense imports). Després pots esborrar-ne, afegir-ne i posar-hi els preus.</p><div class="ls"><button class="b" data-k="crea">Crear el pressupost</button><button class="b2" data-k="creabuit">Començar en blanc</button></div></div>`; return }
    const caps = CAP.concat([...new Set(d.partides.map(x => x.cap).concat(d.capsBuits || []))].filter(c => !CAP.includes(c)));
    const fila = x => `<tr class="pr" data-id="${x.id}"><td><input class="cel" data-f="concepte" value="${E(x.concepte || "")}" placeholder="Concepte"></td>
      <td><input class="cel nm" data-f="q" value="${E(x.q ?? "")}" placeholder="1" inputmode="decimal"></td><td><input class="cel nm" data-f="u" value="${E(x.u ?? "")}" placeholder="1" inputmode="decimal"></td>
      <td><input class="cel nm" data-f="preu" value="${E(x.preu ?? "")}" placeholder="—" inputmode="decimal"></td><td class="tot" data-tot="${x.id}">${prev(x) ? eur(prev(x)) : ""}</td>
      <td><input class="cel nm" data-f="real" value="${E(x.real ?? "")}" placeholder="—" inputmode="decimal"></td><td class="pg"><input type="checkbox" data-k="pagat" ${x.pagat ? "checked" : ""} title="Pagat"></td>
      <td><input class="cel" data-f="notes" value="${E(x.notes || "")}" placeholder=""></td><td class="acc"><button data-k="del" title="Esborrar">×</button></td></tr>`;
    el.innerHTML = `<div id="prsum"></div>
      <div class="bar tb" style="flex-wrap:wrap"><button class="b2" data-k="addcap">+ Capítol</button><span style="flex:1"></span>${R.selLang()}<button class="b2" data-k="pdf">PDF</button><button class="b2" data-k="xls">Excel</button></div>
      <div class="shw" style="max-height:none"><table class="gt pres"><colgroup><col style="width:34%"><col style="width:7%"><col style="width:8%"><col style="width:10%"><col style="width:11%"><col style="width:10%"><col style="width:5%"><col style="width:13%"><col style="width:2%"></colgroup>
      <thead><tr><th>Concepte</th><th class="n">Quant.</th><th class="n">Dies / u.</th><th class="n">Preu</th><th class="n">Previst</th><th class="n">Real</th><th style="text-align:center">Pagat</th><th>Notes</th><th></th></tr></thead><tbody>` +
      caps.filter(c => d.partides.some(x => x.cap === c) || (d.capsBuits || []).includes(c)).map(c => `<tr class="pcap"><td colspan="4"><b>${E(c)}</b></td><td class="tot" data-sc="${E(c)}"></td><td class="tot" data-capr="${E(c)}"></td><td colspan="2"><button class="addrow" data-k="add" data-cap="${E(c)}">+ partida</button></td><td></td></tr>` + d.partides.filter(x => x.cap === c).map(fila).join("")).join("") +
      `</tbody></table></div>
      <div class="ls" style="margin:12px 0 0;gap:12px"><label class="ck" style="margin:0">Imprevistos <input data-d="impr" value="${E(d.impr ?? 10)}" inputmode="decimal" style="width:64px;margin:0 4px"> % sobre el previst</label></div>
      <h2>Finançament</h2>
      <div class="shw" style="max-height:none"><table class="gt pres"><colgroup><col style="width:34%"><col style="width:18%"><col style="width:14%"><col style="width:16%"><col style="width:16%"><col style="width:2%"></colgroup>
      <thead><tr><th>D'on surt</th><th>Tipus</th><th class="n">Import</th><th>Estat</th><th>Notes</th><th></th></tr></thead><tbody>` +
      (d.fin || []).map(f => `<tr class="pr" data-fid="${f.id}"><td><input class="cel" data-g="font" value="${E(f.font || "")}" placeholder="P. ex. ICEC, aportació pròpia…"></td><td><select class="cel" data-g="tipus">${FT.map(o => `<option ${o === f.tipus ? "selected" : ""}>${o}</option>`).join("")}</select></td>
        <td><input class="cel nm" data-g="import" value="${E(f.import ?? "")}" inputmode="decimal" placeholder="0"></td><td><select class="cel" data-g="estat" style="color:${FC[f.estat || "Previst"]};font-weight:600">${FE.map(o => `<option ${o === (f.estat || "Previst") ? "selected" : ""}>${o}</option>`).join("")}</select></td>
        <td><input class="cel" data-g="notes" value="${E(f.notes || "")}"></td><td class="acc"><button data-k="delf" title="Esborrar">×</button></td></tr>`).join("") +
      `<tr><td colspan="6"><button class="addrow" data-k="addf">+ font de finançament</button></td></tr></tbody></table></div>
      <div class="gtfoot"><span class="lg" style="margin:0">Els imports admeten «1.200,50» o «1200.5». Previst = quantitat × dies o unitats × preu.</span><button class="del" data-k="delpres">Eliminar el pressupost</button></div>`;
    sumes();
  }
  // Totals: per capítol, resum de dalt (sense tornar a pintar la taula, per no perdre el cursor)
  function sumes() {
    if (!d) return;
    const pr = d.partides.reduce((a, x) => a + prev(x), 0), im = pr * num(d.impr ?? 10) / 100, tp = pr + im;
    const re = d.partides.reduce((a, x) => a + num(x.real), 0), pag = d.partides.filter(x => x.pagat).reduce((a, x) => a + (num(x.real) || prev(x)), 0);
    const fi = (d.fin || []).filter(f => f.estat === "Concedit" || f.estat === "Cobrat").reduce((a, f) => a + num(f.import), 0), fp = (d.fin || []).reduce((a, f) => a + num(f.import), 0);
    const falta = tp - fi;
    el.querySelectorAll("[data-sc]").forEach(t => { const s = d.partides.filter(x => x.cap === t.dataset.sc).reduce((a, x) => a + prev(x), 0); t.textContent = s ? eur(s) : "" });
    el.querySelectorAll("[data-capr]").forEach(t => { const s = d.partides.filter(x => x.cap === t.dataset.capr).reduce((a, x) => a + num(x.real), 0); t.textContent = s ? eur(s) : "" });
    const box = el.querySelector("#prsum"); if (!box) return;
    box.innerHTML = `<div class="kpi" style="grid-template-columns:repeat(4,1fr)"><div><b>${eur(tp)}</b><small>Previst${im ? ` (amb ${eur(im)} d'imprevistos)` : ""}</small></div>
      <div><b class="${re > tp && tp ? "vm" : ""}">${eur(re)}</b><small>Gastat${tp ? ` · ${Math.round(re / tp * 100)} %` : ""}${pag ? ` · ${eur(pag)} pagat` : ""}</small></div>
      <div><b>${eur(fi)}</b><small>Finançament assegurat${fp > fi ? ` · ${eur(fp - fi)} per confirmar` : ""}</small></div>
      <div><b class="${falta > 0 ? "vm" : "vd"}">${eur(Math.abs(falta))}</b><small>${falta > 0 ? "Falta per finançar" : "Sobra"}</small></div></div>
      ${tp ? `<div class="prbar" title="Gastat sobre previst"><i style="width:${Math.min(100, re / tp * 100)}%;background:${re > tp ? "#ff3b30" : "#34c759"}"></i></div>` : ""}`;
  }
  const fila = t => d.partides.find(x => x.id === t.closest("tr").dataset.id);
  const font = t => (d.fin || []).find(x => x.id === t.closest("tr").dataset.fid);

  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
    if (k === "crea" || k === "creabuit") { d = { id: "pres:" + p.id.split(":")[1], proyecto: p.id, titulo: "Pressupost · " + (p.titulo || ""), partides: k === "crea" ? plantilla(p.categoria) : [], fin: [], impr: 10, capsBuits: k === "crea" ? [] : ["Equip tècnic"] }; await H.put(d, 1); return pinta() }
    if (!d) return;
    if (k === "add") { const x = { id: uid(), cap: b.dataset.cap, concepte: "" }; const ul = d.partides.map(y => y.cap).lastIndexOf(b.dataset.cap); d.partides.splice(ul + 1, 0, x); save(); pinta(); setTimeout(() => el.querySelector(`tr[data-id="${x.id}"] input`)?.focus(), 30) }
    if (k === "del") { const x = fila(b); if ((x.concepte || x.preu || x.real) && !confirm("Esborrar aquesta partida?")) return; d.partides = d.partides.filter(y => y !== x); if (!d.partides.some(y => y.cap === x.cap)) d.capsBuits = [...new Set((d.capsBuits || []).concat(x.cap))]; save(); pinta() }
    if (k === "pagat") { fila(b).pagat = b.checked; save(); sumes() }
    if (k === "addcap") { const n = prompt("Nom del capítol nou (o un dels habituals: " + CAP.join(", ") + ")"); if (!n || !n.trim()) return; d.capsBuits = [...new Set((d.capsBuits || []).concat(n.trim()))]; save(); pinta() }
    if (k === "addf") { d.fin = (d.fin || []).concat({ id: uid(), tipus: "Aportació pròpia", estat: "Previst" }); save(); pinta(); setTimeout(() => el.querySelectorAll("tr[data-fid] input")[(d.fin.length - 1) * 3]?.focus(), 30) }
    if (k === "delf" && confirm("Esborrar aquesta font de finançament?")) { const f = font(b); d.fin = d.fin.filter(y => y !== f); save(); pinta() }
    if (k === "delpres" && confirm("Eliminar tot el pressupost d'aquest projecte? No es pot desfer.")) { await H.del(d); d = null; pinta() }
    if (k === "pdf") exportaPDF();
    if (k === "xls") exportaExcel();
  });
  el.addEventListener("input", e => {
    const t = e.target; if (!d) return;
    if (t.dataset.f) { const x = fila(t); x[t.dataset.f] = t.value; save(); const c = el.querySelector(`[data-tot="${x.id}"]`); if (c) c.textContent = prev(x) ? eur(prev(x)) : ""; sumes() }
    if (t.dataset.g && t.tagName === "INPUT") { font(t)[t.dataset.g] = t.value; save(); sumes() }
    if (t.dataset.d) { d[t.dataset.d] = t.value; save(); sumes() }
  });
  el.addEventListener("change", e => { const t = e.target; if (d && t.dataset.g && t.tagName === "SELECT") { font(t)[t.dataset.g] = t.value; save(); if (t.dataset.g === "estat") t.style.color = FC[t.value]; sumes() } });

  // ---------- exportar ----------
  const files = () => {
    const caps = [...new Set(CAP.concat(d.partides.map(x => x.cap)))].filter(c => d.partides.some(x => x.cap === c)), o = [];
    caps.forEach(c => { const l = d.partides.filter(x => x.cap === c); o.push({ cap: c, prev: l.reduce((a, x) => a + prev(x), 0), real: l.reduce((a, x) => a + num(x.real), 0) }); l.forEach(x => o.push({ x })) });
    return o;
  };
  const tots = () => { const pr = d.partides.reduce((a, x) => a + prev(x), 0), im = pr * num(d.impr ?? 10) / 100; return { pr, im, tp: pr + im, re: d.partides.reduce((a, x) => a + num(x.real), 0) } };
  const T = { ca: ["Pressupost", "Concepte", "Quant.", "Dies / u.", "Preu", "Previst", "Real", "Notes", "Subtotal", "Imprevistos", "Total", "Finançament", "Font", "Tipus", "Import", "Estat"], es: ["Presupuesto", "Concepto", "Cant.", "Días / u.", "Precio", "Previsto", "Real", "Notas", "Subtotal", "Imprevistos", "Total", "Financiación", "Fuente", "Tipo", "Importe", "Estado"], en: ["Budget", "Item", "Qty.", "Days / units", "Rate", "Estimated", "Actual", "Notes", "Subtotal", "Contingency", "Total", "Financing", "Source", "Type", "Amount", "Status"] };
  const t = i => (T[R.lang()] || T.ca)[i], q = v => v === "" || v == null ? "" : v;
  function exportaPDF() {
    const { pr, im, tp, re } = tots(), th = "background:#f0f0f2;text-align:left";
    R.pdf(`<div class="pz"><h1>${E(t(0))} · ${E(p.titulo || "")}</h1><p>${E(H.fecha(H.today()))}</p><table><thead><tr>${[1, 2, 3, 4, 5, 6, 7].map(i => `<th style="${th}">${t(i)}</th>`).join("")}</tr></thead><tbody>` +
      files().map(f => f.cap ? `<tr><td colspan="4" class="band" style="background:#3b4a5a;color:#fff;text-align:left">${E(R.tv(f.cap))}</td><td class="band" style="background:#3b4a5a;color:#fff">${eur(f.prev)}</td><td class="band" style="background:#3b4a5a;color:#fff">${f.real ? eur(f.real) : ""}</td><td class="band" style="background:#3b4a5a"></td></tr>`
        : `<tr><td style="text-align:left">${E(f.x.concepte || "")}</td><td>${E(q(f.x.q))}</td><td>${E(q(f.x.u))}</td><td>${num(f.x.preu) ? eur(num(f.x.preu)) : ""}</td><td>${prev(f.x) ? eur(prev(f.x)) : ""}</td><td>${num(f.x.real) ? eur(num(f.x.real)) : ""}</td><td style="text-align:left">${E(f.x.notes || "")}</td></tr>`).join("") +
      `<tr><td colspan="4" style="text-align:right;font-weight:700">${t(8)}</td><td style="font-weight:700">${eur(pr)}</td><td style="font-weight:700">${re ? eur(re) : ""}</td><td></td></tr>` +
      (im ? `<tr><td colspan="4" style="text-align:right">${t(9)} (${num(d.impr)} %)</td><td>${eur(im)}</td><td colspan="2"></td></tr>` : "") +
      `<tr><td colspan="4" style="text-align:right;font-weight:700;font-size:9px">${t(10)}</td><td style="font-weight:700;font-size:9px">${eur(tp)}</td><td colspan="2"></td></tr></tbody></table>` +
      ((d.fin || []).length ? `<h1 style="margin-top:14px;font-size:13px">${t(11)}</h1><table><thead><tr>${[12, 13, 14, 15].map(i => `<th style="${th}">${t(i)}</th>`).join("")}</tr></thead><tbody>${d.fin.map(f => `<tr><td style="text-align:left">${E(f.font || "")}</td><td>${E(R.tv(f.tipus || ""))}</td><td>${num(f.import) ? eur(num(f.import)) : ""}</td><td>${E(R.tv(f.estat || ""))}</td></tr>`).join("")}</tbody></table>` : "") + `</div>`, false);
  }
  function exportaExcel() {
    const { pr, im, tp } = tots();
    const fs = files().map(f => f.cap ? { banda: `${R.tv(f.cap)} · ${eur(f.prev)}`, color: "#3b4a5a", blanco: 1 } : { celdas: [f.x.concepte || "", q(f.x.q), q(f.x.u), num(f.x.preu) || "", prev(f.x) || "", num(f.x.real) || "", f.x.notes || ""] });
    fs.push({ celdas: [t(8), "", "", "", pr, "", ""] }); if (im) fs.push({ celdas: [`${t(9)} (${num(d.impr)} %)`, "", "", "", im, "", ""] }); fs.push({ celdas: [t(10), "", "", "", tp, "", ""], color: "#f0f0f2" });
    const fulls = [{ nombre: t(0), titulo: t(0) + " · " + (p.titulo || "").toUpperCase(), cols: [{ l: t(1), w: 40, izq: 1 }, { l: t(2), w: 8 }, { l: t(3), w: 10 }, { l: t(4), w: 12 }, { l: t(5), w: 13 }, { l: t(6), w: 12 }, { l: t(7), w: 30, izq: 1 }], filas: fs }];
    if ((d.fin || []).length) fulls.push({ nombre: t(11), titulo: t(11) + " · " + (p.titulo || "").toUpperCase(), cols: [{ l: t(12), w: 40, izq: 1 }, { l: t(13), w: 20 }, { l: t(14), w: 14 }, { l: t(15), w: 14 }], filas: d.fin.map(f => ({ celdas: [f.font || "", R.tv(f.tipus || ""), num(f.import) || "", R.tv(f.estat || "")] })) });
    R.excel(t(0) + " " + (p.titulo || ""), fulls);
  }

  window.addEventListener("hub-sec", e => { if (e.detail === "pressupost") pinta() });
  H.onChange(() => { if (!el.hidden && !el.contains(document.activeElement)) pinta() });
})();
