// Fitxa del projecte: valoració (diners, portfolio, contactes, aprenentatge → nota sobre 10), fee amb modalitat,
// i passos per fase amb barra de progrés. Alguns passos es marquen sols quan el hub ja té la cosa feta (auto).
// Dades al projecte: p.val {diners, portfolio, contactes, aprenentatge} (0–5), p.fee (€), p.feeTipus, p.passos [{id, fase, t, ok, auto}].
window.PAS = (() => {
  const E = s => String(s ?? "").replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const VAL = [["diners", "Diners"], ["portfolio", "Portfolio"], ["contactes", "Contactes"], ["aprenentatge", "Aprenentatge"]];
  const FEE = ["Gangster", "Factura", "Alta", "Sense fee"];
  const nota = p => { const v = p.val || {}; const s = VAL.reduce((a, [k]) => a + (+v[k] || 0), 0); return s / 2 }; // 4 × 5 = 20 → /10
  const valorat = p => VAL.some(([k]) => +(p.val || {})[k]);
  const fmtNota = n => String(Math.round(n * 10) / 10).replace(".", ",") + "/10";
  const eur = n => (+n).toLocaleString("ca-ES", { maximumFractionDigits: 2 }) + " €";
  const feeTxt = p => p.feeTipus === "Sense fee" ? "Sense fee" : +p.fee ? eur(p.fee) : "";

  // ---------- plantilles de passos ----------
  // [fase, text, auto]
  const DIR_CURT = [
    ["Desenvolupament", "Guió", "guio"], ["Desenvolupament", "Dossier", "dossier"], ["Desenvolupament", "Referències", "refs"], ["Desenvolupament", "Pressupost", "pres"], ["Desenvolupament", "Finançament i convocatòries", "conv"],
    ["Preproducció", "Desglossament", "desg"], ["Preproducció", "Càsting"], ["Preproducció", "Recce", "recce"], ["Preproducció", "Equip tècnic", "equip"], ["Preproducció", "Guió tècnic", "gt"], ["Preproducció", "Pla de rodatge", "pdr"],
    ["Rodatge", "Fulls de citació", "citacio"], ["Rodatge", "Rodatge fet", "rodat"],
    ["Postproducció", "Muntatge"], ["Postproducció", "Color"], ["Postproducció", "So i mescla"], ["Postproducció", "Música"], ["Postproducció", "Crèdits"], ["Postproducció", "Còpia final"],
    ["Distribució", "Festivals", "festivals"], ["Distribució", "Estrena"]
  ];
  const DIR_VC = [
    ["Preproducció", "Briefing amb l'artista", "brief"], ["Preproducció", "Concepte i tractament"], ["Preproducció", "Referències", "refs"], ["Preproducció", "Dossier", "dossier"], ["Preproducció", "Pressupost", "pres"], ["Preproducció", "Recce", "recce"], ["Preproducció", "Equip tècnic", "equip"], ["Preproducció", "Guió tècnic", "gt"], ["Preproducció", "Pla de rodatge", "pdr"],
    ["Rodatge", "Material confirmat"], ["Rodatge", "Fulls de citació", "citacio"], ["Rodatge", "Rodatge fet", "rodat"],
    ["Postproducció", "Muntatge"], ["Postproducció", "Color"], ["Postproducció", "So i mescla"], ["Postproducció", "Grafisme i crèdits"], ["Postproducció", "Lliurament"],
    ["Finances", "Fee acordat", "fee"], ["Finances", "Factura", "facturat"], ["Finances", "Cobrat", "cobrat"]
  ];
  const EQUIP = [
    ["Preproducció", "Llegir el guió"], ["Preproducció", "Desglossament", "desg"], ["Preproducció", "Pla de rodatge", "pdr"], ["Preproducció", "Reunions de preproducció"],
    ["Rodatge", "Fulls de citació", "citacio"], ["Rodatge", "Rodatge fet", "rodat"],
    ["Finances", "Fee acordat", "fee"], ["Finances", "Factura", "facturat"], ["Finances", "Cobrat", "cobrat"]
  ];
  // les fases anteriors a l'estat del projecte surten fetes (un projecte en postproducció ja ha rodat)
  const ORD = ["Desenvolupament", "Preproducció", "Rodatge", "Postproducció", "Distribució"], ORDE = { "Idea": 0, "Desenvolupament": 0, "Finançament": 0, "Preproducció": 1, "Rodatge": 2, "Postproducció": 3, "Distribució": 4, "Acabat": 5 };
  const plantilla = p => { const ea = ORDE[p.estado] ?? 0; return (!H.meu(p) ? EQUIP : ["Videoclip", "Publicitat"].includes(p.categoria) ? DIR_VC.filter(x => p.categoria === "Videoclip" || x[2] !== "brief") : DIR_CURT).map(([fase, t, auto]) => ({ id: uid(), fase, t, ...(auto ? { auto } : {}), ...(ORD.includes(fase) && ORD.indexOf(fase) < ea ? { ok: true } : {}) })) };
  const llista = p => Array.isArray(p.passos) ? p.passos : plantilla(p);
  const fases = l => [...new Set(l.map(x => x.fase))];

  // ---------- el que el hub ja sap (per als passos automàtics) ----------
  let CTX = null, cT = 0;
  async function ctx(force) {
    if (CTX && !force && Date.now() - cT < 4000) return CTX;
    const T = ["gt", "pdr", "deck", "desg", "ref", "recce", "pres", "feina", "convocatoria", "dev"], ls = await Promise.all(T.map(t => H.col(t).catch(() => [])));
    CTX = Object.fromEntries(T.map((t, i) => [t, ls[i]])); cT = Date.now(); return CTX;
  }
  const suf = p => p.id.split(":")[1];
  const AUTO = {
    guio: (p, c) => ((c.dev.find(x => x.id === "dev:" + suf(p)) || {}).versions || []).some(v => (v.tipus || "Guió") === "Guió" && v.arxiu),
    dossier: (p, c) => c.deck.some(x => x.proyecto === p.id && (x.slides || []).length),
    refs: (p, c) => c.ref.some(x => (x.proyectos || []).includes(p.id)),
    pres: (p, c) => c.pres.some(x => x.id === "pres:" + suf(p) && (x.partides || []).length),
    conv: (p, c) => c.convocatoria.some(x => x.proyecto === p.id && x.estado && x.estado !== "Per presentar" && x.estado !== "Descartat"),
    festivals: (p, c) => c.convocatoria.some(x => x.proyecto === p.id && ["Presentat", "Seleccionat", "Premiat", "Rebutjat"].includes(x.estado)),
    desg: (p, c) => !!p.desg || c.desg.some(x => x.proyecto === p.id),
    recce: (p, c) => c.recce.some(x => x.id === "recce:" + suf(p) && (x.llocs || []).some(l => (l.items || []).length)),
    equip: p => (p.equip || []).length > 0,
    gt: (p, c) => c.gt.some(x => x.proyecto === p.id),
    pdr: (p, c) => c.pdr.some(x => x.proyecto === p.id && (x.dias || []).length),
    citacio: (p, c) => c.pdr.some(x => x.proyecto === p.id && (x.dias || []).some(d => d.citacio)),
    rodat: (p, c) => { const ds = c.pdr.filter(x => x.proyecto === p.id).flatMap(x => (x.dias || []).map(d => d.fecha)).filter(Boolean); return ds.length > 0 && ds.every(d => d < H.today()) },
    brief: p => window.BRIEF ? Object.values(p.brief || {}).filter(x => String(x || "").trim()).length >= 3 : false,
    fee: p => !!(p.feeTipus && (p.feeTipus === "Sense fee" || +p.fee)),
    facturat: (p, c) => p.feeTipus === "Sense fee" ? false : c.feina.some(x => x.proyecto === p.id && ["Facturat", "Cobrat"].includes(x.estado)),
    cobrat: (p, c) => p.feeTipus === "Sense fee" ? false : c.feina.some(x => x.proyecto === p.id && x.estado === "Cobrat")
  };
  const fet = (x, p, c) => !!x.ok || !!(x.auto && c && AUTO[x.auto] && (() => { try { return AUTO[x.auto](p, c) } catch (e) { return false } })());
  // passos que no toquen (p. ex. factura i cobrament si és «Sense fee»)
  const compta = (x, p) => !(p.feeTipus === "Sense fee" && ["facturat", "cobrat"].includes(x.auto));
  function progres(p, c) { const l = llista(p).filter(x => compta(x, p)), n = l.filter(x => fet(x, p, c)).length; return { n, tot: l.length, f: l.length ? n / l.length : 0 } }
  // fase on és ara: la primera que no està acabada
  function faseActual(p, c) { const l = llista(p).filter(x => compta(x, p)); return fases(l).find(f => l.filter(x => x.fase === f).some(x => !fet(x, p, c))) || "Acabat" }

  // ---------- targetes (Resum del projecte) ----------
  const obert = {}; // fases plegades/desplegades (per projecte, només en aquesta sessió)
  function cardValora(p, feines) {
    const v = p.val || {}, n = nota(p);
    const cob = feines.filter(x => x.proyecto === p.id);
    return `<div class="card pfx"><h3>Valorar<span class="pnota">${valorat(p) ? fmtNota(n) : "—"}</span></h3>
      <div class="pval">${VAL.map(([k, l]) => `<div class="pvr"><span>${l}</span><div class="pvq">${[1, 2, 3, 4, 5].map(i => `<button class="${i <= (+v[k] || 0) ? "on" : ""}" data-pas="val" data-v="${k}" data-i="${i}" aria-label="${l} ${i} de 5" title="${i} de 5"></button>`).join("")}</div></div>`).join("")}</div>
      <h3 style="margin-top:18px">Diners</h3>
      <div class="pfee"><div class="pfin"><input id="pfee" inputmode="decimal" placeholder="Fee" value="${E(p.fee || "")}" ${p.feeTipus === "Sense fee" ? "disabled" : ""}><span>€</span></div>
        <select id="pfeet">${["", ...FEE].map(o => `<option value="${o}" ${o === (p.feeTipus || "") ? "selected" : ""}>${o || "Modalitat…"}</option>`).join("")}</select></div>
      ${cob.map(x => `<div class="r" data-pas="feina" data-id="${x.id}"><i class="dot" style="background:${{ "Pressupostat": "#8e8e93", "Confirmat": "#0a84ff", "Fet": "#ff9f0a", "Facturat": "#af52de", "Cobrat": "#30b27a" }[x.estado] || "#c7c7cc"}"></i><div class="g"><b>${E(x.titulo || "Cobrament")}</b><small>${E([x.estado, (+x.total || (+x.tarifa || 0) * (+x.jornades || 0)) ? eur(+x.total || (+x.tarifa || 0) * (+x.jornades || 0)) : "", x.factura && "Factura " + x.factura].filter(Boolean).join(" · "))}</small></div></div>`).join("")}
      ${p.feeTipus === "Sense fee" ? "" : `<button class="b2" data-pas="cobra" style="margin-top:10px">+ Cobrament</button>`}</div>`;
  }
  function cardPassos(p, c) {
    const l = llista(p), pr = progres(p, c), fs = fases(l), act = faseActual(p, c);
    const oberta = f => obert[p.id + f] ?? f === act;
    return `<div class="card pps" style="grid-column:1/-1"><h3>Passos<span class="ppn">${pr.n}/${pr.tot}</span></h3>
      <div class="pbar big"><i style="width:${Math.round(pr.f * 100)}%"></i></div>
      ${fs.map(f => { const lf = l.filter(x => x.fase === f), cl = lf.filter(x => compta(x, p)), n = cl.filter(x => fet(x, p, c)).length, ob = oberta(f);
        return `<div class="pfs ${ob ? "ob" : ""}"><button class="pfh" data-pas="fase" data-v="${E(f)}" aria-expanded="${ob}"><span class="pchev">›</span><b>${E(f)}</b><span class="pbar"><i style="width:${cl.length ? Math.round(n / cl.length * 100) : 0}%"></i></span><span class="ppn">${n}/${cl.length}</span></button>
        ${ob ? `<div class="pfb">${lf.length > 1 ? `<label class="ck pall"><input type="checkbox" data-pas="tots" data-v="${E(f)}" ${cl.every(x => fet(x, p, c)) ? "checked" : ""}> Completar tots</label>` : ""}
          ${lf.map(x => { const a = x.auto && !x.ok && fet(x, p, c), no = !compta(x, p); return `<div class="pst ${fet(x, p, c) ? "ok" : ""} ${no ? "no" : ""}"><input type="checkbox" data-pas="ok" data-id="${x.id}" ${fet(x, p, c) ? "checked" : ""} ${a ? "disabled" : ""}><span>${E(x.t)}${a ? ` <small class="pau">fet al hub</small>` : no ? ` <small class="pau">no cal (sense fee)</small>` : ""}</span><button class="x" data-pas="treu" data-id="${x.id}" title="Treure aquest pas" aria-label="Treure">×</button></div>` }).join("")}
          <div class="row pnou"><input placeholder="Afegir un pas…" data-pas="nou" data-v="${E(f)}"><button class="b2" data-pas="afegeix" data-v="${E(f)}" aria-label="Afegir">+</button></div></div>` : ""}</div>` }).join("")}
      <div class="ls" style="margin-top:10px"><button class="t" data-pas="fasenova">+ Fase</button>${Array.isArray(p.passos) ? `<button class="t" data-pas="reset" style="background:none;color:var(--mut)">Tornar a la plantilla</button>` : ""}</div></div>`;
  }

  // ---------- esdeveniments (dins el Resum) ----------
  function connecta(el, doc, repinta) {
    const fixa = p => { if (!Array.isArray(p.passos)) p.passos = plantilla(p) };
    el.addEventListener("click", async e => {
      const b = e.target.closest("[data-pas]"); if (!b || b.tagName === "INPUT" && b.type !== "checkbox") return;
      const k = b.dataset.pas; if (["ok", "tots", "nou"].includes(k)) return; // els checkbox van per «change»
      const p = await doc(); if (!p) return;
      if (k === "val") { const v = p.val = p.val || {}, i = +b.dataset.i; v[b.dataset.v] = v[b.dataset.v] === i ? i - 1 : i; await H.put(p, 1); return repinta() }
      if (k === "fase") { const f = b.dataset.v, c = await ctx(), act = faseActual(p, c); obert[p.id + f] = !(obert[p.id + f] ?? f === act); return repinta() }
      if (k === "treu") { fixa(p); const x = p.passos.find(y => y.id === b.dataset.id); if (x && x.auto && !confirm("Aquest pas es marca sol quan el fas al hub. Treure'l igualment?")) return; p.passos = p.passos.filter(y => y.id !== b.dataset.id); await H.put(p, 1); return repinta() }
      if (k === "afegeix") { const i = b.parentNode.querySelector("input"), t = i.value.trim(); if (!t) return i.focus(); fixa(p); const f = b.dataset.v, ult = p.passos.map(x => x.fase).lastIndexOf(f); p.passos.splice(ult + 1, 0, { id: uid(), fase: f, t }); await H.put(p, 1); await repinta(); const ni = el.querySelector(`input[data-pas="nou"][data-v="${CSS.escape(f)}"]`); ni && ni.focus(); return }
      if (k === "fasenova") { const f = (prompt("Nom de la fase nova") || "").trim(); if (!f) return; fixa(p); const t = (prompt("Primer pas de «" + f + "»") || "").trim() || "Pas"; p.passos.push({ id: uid(), fase: f, t }); obert[p.id + f] = true; await H.put(p, 1); return repinta() }
      if (k === "reset") { if (!confirm("Tornar als passos de la plantilla? Es perdran els passos afegits i el que hagis marcat a mà.")) return; delete p.passos; await H.put(p, 1); return repinta() }
      if (k === "feina") return H.abrir("feina", b.dataset.id);
      if (k === "cobra") {
        const rol = H.rols(p), r = rol.includes("Ajudant de direcció") && !H.meu(p) ? "Ajudant de direcció" : rol.includes("Script") && !H.meu(p) ? "Script" : "Direcció";
        const d = { id: H.uid("feina"), titulo: p.titulo || "", rol: r, estado: "Confirmat", proyecto: p.id, ...(+p.fee ? { total: +p.fee } : {}) };
        await H.put(d, 1); H.toast("Cobrament creat a Diners"); repinta(); return H.abrir("feina", d.id);
      }
    });
    el.addEventListener("change", async e => {
      const t = e.target; if (!t.dataset.pas && t.id !== "pfee" && t.id !== "pfeet") return;
      const p = await doc(); if (!p) return;
      if (t.id === "pfee") { const n = parseFloat(String(t.value).replace(/\./g, "").replace(",", ".")); p.fee = isNaN(n) ? "" : n; await H.put(p, 1); return repinta() }
      if (t.id === "pfeet") { p.feeTipus = t.value; await H.put(p, 1); return repinta() }
      if (t.dataset.pas === "ok") { fixa(p); const x = p.passos.find(y => y.id === t.dataset.id); if (x) x.ok = t.checked; await H.put(p, 1); return repinta() }
      if (t.dataset.pas === "tots") { fixa(p); const c = await ctx(); p.passos.filter(x => x.fase === t.dataset.v).forEach(x => { if (t.checked) x.ok = true; else if (!(x.auto && fet({ auto: x.auto }, p, c))) x.ok = false }); await H.put(p, 1); return repinta() }
    });
    el.addEventListener("keydown", e => { const t = e.target; if (t.dataset && t.dataset.pas === "nou" && e.key === "Enter") { e.preventDefault(); t.parentNode.querySelector('[data-pas="afegeix"]').click() } });
  }
  return { VAL, FEE, nota, valorat, fmtNota, feeTxt, eur, llista, plantilla, progres, faseActual, ctx, fet, cardValora, cardPassos, connecta };
})();
