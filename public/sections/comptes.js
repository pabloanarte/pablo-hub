// Diners → Comptes personals: despeses, ingressos, despeses fixes (abans «subscripcions») i límits mensuals per categoria.
// Documents: "fin:AAAA-MM" (moviments del mes, {movs:[{id,data,concepte,import,cat}]}, import negatiu = despesa),
// "fin:subs" (despeses fixes: lloguer, gimnàs, subscripcions…, {l:[{id,nom,import,per,data,cat,actiu}]}), "fin:config" ({limits:{cat:n}, regles:{clau:cat}}).
// Les feines cobrades (Diners → Feines) compten soles com a ingressos del mes en què es cobren (net d'IVA i IRPF).
(() => {
  const { E } = H, el = document.getElementById("s-comptes");
  const DESP = ["Casa", "Menjar", "Restaurants i bars", "Transport", "Subscripcions", "Material de cinema", "Oci i cultura", "Roba", "Salut", "Viatges", "Formació", "Impostos i autònoms", "Regals", "Altres"];
  const ING = ["Feines", "Docència", "Premis i ajuts", "Altres ingressos"];
  const COL = { "Casa": "#5e5ce6", "Menjar": "#30b27a", "Restaurants i bars": "#ff9f0a", "Transport": "#0a84ff", "Subscripcions": "#af52de", "Material de cinema": "#3b4a5a", "Oci i cultura": "#ff375f", "Roba": "#bf8040", "Salut": "#32ade6", "Viatges": "#00a6a6", "Formació": "#8e6e00", "Impostos i autònoms": "#8e8e93", "Regals": "#e64a19", "Altres": "#b0b0b8", "Feines": "#30b27a", "Docència": "#0a84ff", "Premis i ajuts": "#ff9f0a", "Altres ingressos": "#8e8e93" };
  // Categoria automàtica pel concepte (la de l'usuari mana: quan canvies la categoria d'un moviment, s'aprèn)
  const AUTO = [["Menjar", /mercadona|caprabo|bon ?preu|lidl|aldi|consum|condis|carrefour|dia %|supermerc|esclat|ametller|veritas|fruiter|forn |panader/],
    ["Restaurants i bars", /restaur|bar |cafe|cafè|glovo|just ?eat|uber ?eats|deliveroo|burger|mcdonald|telepizza|kebab|sushi|pizzer|cervese/],
    ["Transport", /renfe|tmb|fgc|rodalies|uber|cabify|bolt|bicing|repsol|gasolin|cepsa|galp|parking|aparcament|autopista|peatge|t-mobilitat|taxi|bla ?bla/],
    ["Subscripcions", /netflix|spotify|hbo|filmin|mubi|disney|prime video|apple\.com|icloud|adobe|youtube|chatgpt|openai|anthropic|claude|dropbox|frame\.io|vimeo|wordpress|cloudflare|google one|patreon|movistar|vodafone|orange|digi|o2 /],
    ["Casa", /lloguer|alquiler|endesa|iberdrola|naturgy|holaluz|aigües|agbar|aigua|comunitat|ikea|leroy|bauhaus|assegurança llar/],
    ["Material de cinema", /b&h|bhphoto|fotocasion|fnac|mediamarkt|rent ?a ?cam|ovide|cámara|camara|objectiu|lloguer de material|aputure|godox|sennheiser|blackmagic/],
    ["Oci i cultura", /cine|cinema|yelmo|verdi|filmoteca|teatre|teatro|entrades|ticket|museu|museo|llibre|llibreria|casa del libro|concert|festival/],
    ["Roba", /zara|h&m|uniqlo|pull ?&? ?bear|bershka|mango|decathlon|primark|vinted/],
    ["Salut", /farmàcia|farmacia|dentista|clínica|clinica|metge|fisio|òptica|optica|gimn|gym|dir |holmes/],
    ["Viatges", /vueling|ryanair|iberia|easyjet|booking|airbnb|hotel|ouigo|iryo|alsa/],
    ["Impostos i autònoms", /seguretat social|seguridad social|tgss|hisenda|hacienda|aeat|agencia tributaria|autònom|autonom|gestor/],
    ["Formació", /escac|curs|curso|udemy|domestika|masterclass|matrícula|matricula/]];
  const AUTOI = [["Docència", /escac|cinebase|docència|docencia|taller|clase|classe/], ["Premis i ajuts", /premi|premio|ajut|ayuda|subvenc|beca|icec|icaa/], ["Feines", /nòmina|nomina|transferencia|transferència|factura|pago|pagament/]];
  const num = v => { let s = String(v ?? "").replace(/[\s€]/g, "").replace(/\u2212/g, "-"); if (/^[\d.,]+-$/.test(s)) s = "-" + s.slice(0, -1); if (!s) return 0; if (s.includes(",")) s = s.replace(/\.(?=\d{3}(\D|$))/g, "").replace(/,(?=\d{3}(\D|$))/g, s.indexOf(",") < s.lastIndexOf(".") ? "" : ",").replace(",", "."); else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ""); return +s || 0 };
  const eur = (n, signe) => (signe && n > 0 ? "+" : "") + (n < 0 ? "−" : "") + Math.abs(Math.round(n * 100) / 100).toLocaleString("ca-ES", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
  const MESOS = ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
  const nomMes = m => { const [a, n] = m.split("-"); const x = MESOS[+n - 1]; return x[0].toUpperCase() + x.slice(1) + " " + a };
  const mesDe = (m, k) => { let [a, n] = m.split("-").map(Number); n += k; while (n < 1) { n += 12; a-- } while (n > 12) { n -= 12; a++ } return a + "-" + String(n).padStart(2, "0") };
  const uid = () => Math.random().toString(36).slice(2, 9);
  const BUIDES = new Set(["compra", "compras", "tarj", "tarjeta", "targeta", "pago", "pagament", "pagaments", "recibo", "rebut", "adeudo", "cargo", "transferencia", "transferència", "transf", "trf", "bizum", "de", "del", "la", "el", "en", "a", "con", "amb", "visa", "mastercard", "debito", "credito", "contactless", "apple", "pay", "google", "op", "ref", "sl", "sa", "s"]);
  const clau = t => String(t || "").toLowerCase().replace(/[x*]{3,}\w*/g, " ").replace(/\d+/g, " ").replace(/[^\p{L} ]/gu, " ").split(" ").filter(w => w.length > 1 && !BUIDES.has(w)).slice(0, 2).join(" ");
  let mes = H.today().slice(0, 7), vista = "mes", ver = 0, cfg = null, subs = null;

  const doc = async (id, def) => (await H.col("fin")).find(x => x.id === id) || Object.assign({ id }, def);
  function categoria(concepte, imp) {
    const k = clau(concepte); if (cfg && cfg.regles && cfg.regles[k]) return cfg.regles[k];
    const t = " " + String(concepte || "").toLowerCase() + " ", l = imp > 0 ? AUTOI : AUTO;
    return (l.find(([, re]) => re.test(t)) || [imp > 0 ? "Altres ingressos" : "Altres"])[0];
  }
  // Subscripcions que es cobren en un mes (mensuals sempre; trimestrals i anuals segons la data de renovació)
  function subsDelMes(m) {
    return (subs.l || []).filter(s => num(s.import)).flatMap(s => {
      const ini = (s.data || "").slice(0, 7); if (ini && ini > m) return [];
      if (s.actiu === false && (!s.fi || m > s.fi)) return [];
      const ult = new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate(), dia = String(Math.min(+(s.data || "").slice(8, 10) || 1, ult)).padStart(2, "0"), per = s.per || "Mensual";
      const toca = per === "Mensual" || !ini || (() => { const [a1, m1] = ini.split("-").map(Number), [a2, m2] = m.split("-").map(Number), d = (a2 - a1) * 12 + m2 - m1; return d % (per === "Anual" ? 12 : 3) === 0 })();
      return toca ? [{ id: "s-" + s.id, sub: s.id, data: m + "-" + dia, concepte: s.nom || "Despesa fixa", import: -Math.abs(num(s.import)), cat: s.cat || "Subscripcions" }] : [];
    });
  }
  const mensual = s => Math.abs(num(s.import)) / ({ Mensual: 1, Trimestral: 3, Anual: 12 }[s.per || "Mensual"]);
  // Feines cobrades aquest mes, en net (base + IVA − IRPF)
  async function feinesDelMes(m) {
    const [fs, aj] = await Promise.all([H.col("feina"), H.col("ajust")]), f = aj.find(x => x.id === "ajust:factura") || {};
    const pc = (v, def) => v === "" || v == null ? +def || 0 : +v;
    return fs.filter(d => d.estado === "Cobrat" && (d.cobrament || d.fin || d.ini || "").startsWith(m)).map(d => {
      const base = +d.total || (+d.tarifa || 0) * (+d.jornades || 0), iva = pc(d.iva, f.iva === "" || f.iva == null ? 0 : f.iva), irpf = pc(d.irpf, f.irpf === "" || f.irpf == null ? 15 : f.irpf);
      return { id: "f-" + d.id, feina: d.id, data: d.cobrament || d.fin || d.ini, concepte: [d.rol, d.titulo].filter(Boolean).join(" · ") || "Feina", import: base * (1 + iva / 100 - irpf / 100), cat: d.rol === "Docència" ? "Docència" : "Feines" };
    }).filter(x => x.import);
  }
  async function movsDe(m) { const d = await doc("fin:" + m, { movs: [] }); return { d, l: (d.movs || []).concat(subsDelMes(m), await feinesDelMes(m)) } }

  // ---------- pintar ----------
  async function pinta() {
    if (el.hidden) return; const v = ++ver;
    [cfg, subs] = await Promise.all([doc("fin:config", { limits: {}, regles: {} }), doc("fin:subs", { l: [] })]); if (v !== ver) return;
    const seg = `<div class="tabs" style="margin:0 0 16px"><button class="t ${vista === "mes" ? "on" : ""}" data-c="vista" data-v="mes">Mes</button><button class="t ${vista === "any" ? "on" : ""}" data-c="vista" data-v="any">Any</button><button class="t ${vista === "subs" ? "on" : ""}" data-c="vista" data-v="subs">Despeses fixes</button></div>`;
    if (vista === "subs") return pintaSubs(seg);
    if (vista === "any") return pintaAny(seg, v);
    const { l } = await movsDe(mes); if (v !== ver) return;
    const ing = l.filter(x => x.import > 0).reduce((a, x) => a + x.import, 0), des = -l.filter(x => x.import < 0).reduce((a, x) => a + x.import, 0), sm = (subs.l || []).filter(s => s.actiu !== false).reduce((a, s) => a + mensual(s), 0);
    const perCat = {}; l.filter(x => x.import < 0).forEach(x => perCat[x.cat || "Altres"] = (perCat[x.cat || "Altres"] || 0) - x.import);
    Object.keys(cfg.limits || {}).forEach(c => { if (num(cfg.limits[c]) && !(c in perCat)) perCat[c] = 0 });
    const cats = Object.entries(perCat).sort((a, b) => b[1] - a[1]), max = Math.max(1, ...cats.map(([c, n]) => Math.max(n, num((cfg.limits || {})[c]))));
    const avui = H.today(), dies = mes === avui.slice(0, 7) ? +avui.slice(8, 10) : 0, totalDies = new Date(+mes.slice(0, 4), +mes.slice(5, 7), 0).getDate();
    el.innerHTML = seg + `<div class="bar" style="gap:8px"><button class="b2" data-c="mes" data-v="-1" aria-label="Mes anterior">‹</button><b style="font-size:17px;min-width:150px;text-align:center">${nomMes(mes)}</b><button class="b2" data-c="mes" data-v="1" aria-label="Mes següent">›</button><span style="flex:1"></span><button class="b2" data-c="importa">Importar del banc</button><button class="b2" data-c="nou" data-v="ing">+ Ingrés</button><button class="b" data-c="nou" data-v="des">+ Despesa</button></div>
      <div class="kpi" style="grid-template-columns:repeat(4,1fr)"><div><b>${eur(ing)}</b><small>Ingressos</small></div><div><b>${eur(des)}</b><small>Despeses${dies && des ? ` · ${eur(des / dies)}/dia` : ""}</small></div>
      <div><b class="${ing - des < 0 ? "vm" : "vd"}">${eur(ing - des, 1)}</b><small>${ing - des < 0 ? "Has gastat més del que ha entrat" : "Estalvi del mes"}</small></div><div><b>${eur(sm)}</b><small>Despeses fixes al mes</small></div></div>
      <div class="cmpt"><div class="card"><h3>On se'n va<a data-c="limits">Límits</a></h3>${cats.length ? cats.map(([c, n]) => { const lim = num((cfg.limits || {})[c]), pas = lim && n > lim, prev = dies && lim && !pas && n / dies * totalDies > lim;
        return `<div class="cbar" data-c="filtra" data-v="${E(c)}"><div class="ct"><span><i class="dot" style="background:${COL[c] || "#b0b0b8"}"></i>${E(c)}</span><b class="${pas ? "vm" : ""}">${eur(n)}${lim ? `<small> de ${eur(lim)}</small>` : ""}</b></div><div class="cb"><i style="width:${n / max * 100}%;background:${pas ? "#ff3b30" : COL[c] || "#b0b0b8"}"></i>${lim ? `<u style="left:${lim / max * 100}%"></u>` : ""}</div>${pas ? `<small class="vm">${eur(n - lim)} per sobre del límit</small>` : prev ? `<small style="color:#ff9f0a">A aquest ritme, acabaràs el mes per sobre del límit</small>` : ""}</div>` }).join("") : `<p class="em" style="margin:0">Encara no hi ha despeses aquest mes.</p>`}</div>
      <div class="card"><h3>Moviments <span class="em" style="margin:0;font-weight:400;font-size:13px">${l.length}</span>${filtre ? `<a data-c="filtra" data-v="">Treure el filtre «${E(filtre)}»</a>` : ""}</h3><div id="cmov">${llista(l)}</div></div></div>`;
  }
  let filtre = "";
  function llista(l) {
    const v = l.filter(x => !filtre || (x.cat || "") === filtre).sort((a, b) => (b.data || "").localeCompare(a.data || "") || (a.concepte || "").localeCompare(b.concepte || ""));
    if (!v.length) return `<p class="em" style="margin:0">Cap moviment${filtre ? " d'aquesta categoria" : ""}. Afegeix-ne amb «+ Despesa» o importa'ls del banc.</p>`;
    return v.map(x => `<div class="r cmr" data-c="obre" data-v="${x.id}"><i class="dot" style="background:${COL[x.cat] || "#b0b0b8"}"></i><div class="g"><b>${E(x.concepte || "Sense concepte")}</b><small>${E([x.data && H.fecha(x.data), x.cat, x.sub && "despesa fixa", x.feina && "automàtic"].filter(Boolean).join(" · "))}</small></div><b class="cimp ${x.import > 0 ? "vd" : ""}">${eur(x.import, 1)}</b></div>`).join("");
  }
  async function pintaAny(seg, v) {
    const any = mes.slice(0, 4), ms = Array.from({ length: 12 }, (_, i) => any + "-" + String(i + 1).padStart(2, "0")).filter(m => m <= H.today().slice(0, 7) || any < H.today().slice(0, 4));
    const ds = await Promise.all(ms.map(movsDe)); if (v !== ver) return;
    const r = ms.map((m, i) => { const l = ds[i].l; return { m, ing: l.filter(x => x.import > 0).reduce((a, x) => a + x.import, 0), des: -l.filter(x => x.import < 0).reduce((a, x) => a + x.import, 0), l } });
    const ti = r.reduce((a, x) => a + x.ing, 0), td = r.reduce((a, x) => a + x.des, 0), mx = Math.max(1, ...r.map(x => Math.max(x.ing, x.des)));
    const pc = {}; r.forEach(x => x.l.filter(y => y.import < 0).forEach(y => pc[y.cat || "Altres"] = (pc[y.cat || "Altres"] || 0) - y.import));
    const cats = Object.entries(pc).sort((a, b) => b[1] - a[1]), mc = Math.max(1, ...cats.map(c => c[1]));
    el.innerHTML = seg + `<div class="bar" style="gap:8px"><button class="b2" data-c="any" data-v="-1">‹</button><b style="font-size:17px;min-width:80px;text-align:center">${any}</b><button class="b2" data-c="any" data-v="1">›</button></div>
      <div class="kpi" style="grid-template-columns:repeat(3,1fr)"><div><b>${eur(ti)}</b><small>Ingressos el ${any}</small></div><div><b>${eur(td)}</b><small>Despeses · ${eur(td / Math.max(1, r.filter(x => x.l.length).length))} al mes</small></div><div><b class="${ti - td < 0 ? "vm" : "vd"}">${eur(ti - td, 1)}</b><small>Estalvi</small></div></div>
      <div class="cmpt"><div class="card"><h3>Mes a mes</h3><div class="cany">${r.map(x => `<div class="cm" data-c="anames" data-v="${x.m}" title="${nomMes(x.m)}"><div class="cc"><i style="height:${x.ing / mx * 100}%;background:#30b27a"></i><i style="height:${x.des / mx * 100}%;background:#ff9f0a"></i></div><small>${["gen", "febr", "març", "abr", "maig", "juny", "jul", "ag", "set", "oct", "nov", "des"][+x.m.slice(5) - 1]}</small></div>`).join("")}</div><div class="lg" style="margin:8px 0 0"><span><i style="background:#30b27a"></i>Ingressos</span><span><i style="background:#ff9f0a"></i>Despeses</span></div></div>
      <div class="card"><h3>Per categoria</h3>${cats.length ? cats.map(([c, n]) => `<div class="cbar"><div class="ct"><span><i class="dot" style="background:${COL[c] || "#b0b0b8"}"></i>${E(c)}</span><b>${eur(n)}<small> · ${eur(n / Math.max(1, r.filter(x => x.l.length).length))}/mes</small></b></div><div class="cb"><i style="width:${n / mc * 100}%;background:${COL[c] || "#b0b0b8"}"></i></div></div>`).join("") : `<p class="em" style="margin:0">Encara no hi ha despeses aquest any.</p>`}</div></div>`;
  }
  function pintaSubs(seg) {
    const l = subs.l || [], act = l.filter(s => s.actiu !== false), sm = act.reduce((a, s) => a + mensual(s), 0), avui = H.today();
    const propera = s => { if (!s.data) return ""; let d = s.data; const pas = { Mensual: 1, Trimestral: 3, Anual: 12 }[s.per || "Mensual"]; let g = 0; while (d < avui && g++ < 600) d = mesDe(d.slice(0, 7), pas) + d.slice(7); return d };
    el.innerHTML = seg + `<div class="bar"><span style="flex:1"></span><button class="b" data-c="nousub">+ Despesa fixa</button></div>
      <div class="kpi" style="grid-template-columns:repeat(3,1fr)"><div><b>${eur(sm)}</b><small>Al mes</small></div><div><b>${eur(sm * 12)}</b><small>A l'any</small></div><div><b>${act.length}</b><small>Actives</small></div></div>
      <div class="card"><h3>Despeses fixes</h3>${l.length ? l.slice().sort((a, b) => (b.actiu !== false) - (a.actiu !== false) || mensual(b) - mensual(a)).map(s => { const pr = propera(s);
        return `<div class="r cmr" data-c="obresub" data-v="${s.id}" style="${s.actiu === false ? "opacity:.5" : ""}"><i class="dot" style="background:${COL[s.cat || "Subscripcions"] || "#af52de"}"></i><div class="g"><b>${E(s.nom || "Sense nom")}</b><small>${E([s.per || "Mensual", s.cat && s.cat !== "Subscripcions" && s.cat, s.actiu === false ? "cancel·lada" : pr && "propera: " + H.fecha(pr) + (pr.slice(0, 4) !== avui.slice(0, 4) ? " de " + pr.slice(0, 4) : "")].filter(Boolean).join(" · "))}</small></div><b class="cimp">${eur(Math.abs(num(s.import)))}${(s.per || "Mensual") !== "Mensual" ? `<small> · ${eur(mensual(s))}/mes</small>` : ""}</b></div>` }).join("")
        : `<p class="em" style="margin:0">Apunta aquí el lloguer, el gimnàs, el mòbil, Netflix, Adobe… Es compten soles cada mes a les despeses.</p>`}</div>`;
  }

  // ---------- fitxes (full lateral) ----------
  const opts = (l, v) => l.map(o => `<option ${o === v ? "selected" : ""}>${E(o)}</option>`).join("");
  async function fitxa(x, ingres) {
    const real = !x.sub && !x.feina, imp = Math.abs(num(x.import));
    if (!real) return H.sheet(`<h2 style="margin-top:0">${E(x.concepte)}</h2><p class="em" style="margin-top:0">${x.sub ? "Ve d'una despesa fixa. Per canviar-la, ves a la pestanya Despeses fixes." : "Ve d'una feina cobrada (Diners → Feines i factures), en net d'IVA i IRPF."}</p><p style="font-size:22px;font-weight:600">${eur(x.import, 1)}</p><button class="b2" data-c="${x.sub ? "anasubs" : "anafeines"}">${x.sub ? "Obrir les subscripcions" : "Obrir les feines"}</button>`);
    H.sheet(`<h2 style="margin-top:0">${x.id ? (ingres ? "Ingrés" : "Despesa") : ingres ? "Nou ingrés" : "Nova despesa"}</h2>
      <label>Import (€)</label><input id="cf-imp" inputmode="decimal" value="${imp || ""}" placeholder="0,00" class="big" style="font-size:22px;font-weight:600">
      <label>Concepte</label><input id="cf-con" value="${E(x.concepte || "")}" placeholder="${ingres ? "P. ex. classe a ESCAC" : "P. ex. Mercadona"}">
      <div class="g2"><div><label>Data</label><input id="cf-dat" type="date" value="${E(x.data || H.today())}"></div><div><label>Categoria</label><select id="cf-cat">${opts(ingres ? ING : DESP, x.cat || (ingres ? "Altres ingressos" : "Altres"))}</select></div></div>
      <label>Notes</label><input id="cf-not" value="${E(x.notes || "")}">
      <div class="sfoot">${x.id ? `<button class="del" data-c="delmov" data-v="${x.id}" data-m="${(x.data || "").slice(0, 7)}">Esborrar</button>` : "<span></span>"}<button class="b" data-c="desamov" data-v="${x.id || ""}" data-m="${(x.data || "").slice(0, 7)}" data-i="${ingres ? 1 : 0}">Desar</button></div>`);
    const c = document.getElementById("cf-con"), cat = document.getElementById("cf-cat"); let tocada = !!x.id;
    cat.onchange = () => tocada = true; c.oninput = () => { if (!tocada) cat.value = categoria(c.value, ingres ? 1 : -1) };
    setTimeout(() => document.getElementById(x.id ? "cf-con" : "cf-imp").focus(), 50);
  }
  async function desaMov(b) {
    const g = id => document.getElementById(id).value, imp = num(g("cf-imp")); if (!imp) return H.toast("Posa l'import");
    const ingres = b.dataset.i === "1", data = g("cf-dat") || H.today(), m = data.slice(0, 7), vell = b.dataset.v;
    const x = { id: vell || uid(), data, concepte: g("cf-con").trim(), import: ingres ? Math.abs(imp) : -Math.abs(imp), cat: g("cf-cat"), notes: g("cf-not").trim() };
    if (vell) { const d0 = await doc("fin:" + b.dataset.m, { movs: [] }), ant = (d0.movs || []).find(y => y.id === vell); d0.movs = (d0.movs || []).filter(y => y.id !== vell); await H.put(d0, 1); }
    if (x.concepte && x.cat !== categoria(x.concepte, x.import)) aprèn(x.concepte, x.cat);
    const d = await doc("fin:" + m, { movs: [] }); d.movs = (d.movs || []).concat(x); await H.put(d, 1);
    H.cerrar(); mes = m; H.toast("Desat"); pinta();
  }
  async function aprèn(concepte, cat) { if (!clau(concepte)) return; cfg.regles = Object.assign({}, cfg.regles, { [clau(concepte)]: cat }); await H.put(cfg, 1) }
  function fitxaSub(s) {
    s = s || { per: "Mensual", cat: "Casa", data: H.today() };
    H.sheet(`<h2 style="margin-top:0">${s.id ? "Despesa fixa" : "Nova despesa fixa"}</h2>
      <label>Nom</label><input id="cs-nom" value="${E(s.nom || "")}" placeholder="P. ex. lloguer, gimnàs, Spotify">
      <div class="g2"><div><label>Import (€)</label><input id="cs-imp" inputmode="decimal" value="${s.import ? Math.abs(num(s.import)) : ""}" placeholder="0,00"></div><div><label>Cada quan</label><select id="cs-per">${opts(["Mensual", "Trimestral", "Anual"], s.per)}</select></div>
      <div><label>Data del primer cobrament (o del darrer)</label><input id="cs-dat" type="date" value="${E(s.data || "")}"></div><div><label>Categoria</label><select id="cs-cat">${opts(DESP, s.cat || "Casa")}</select></div></div>
      <label class="ck" style="margin-top:14px"><input type="checkbox" id="cs-act" ${s.actiu === false ? "" : "checked"}> Activa</label><small>Si la cancel·les o s'acaba, desmarca-la: deixa de comptar però en queda el registre.</small>
      <div class="sfoot">${s.id ? `<button class="del" data-c="delsub" data-v="${s.id}">Esborrar</button>` : "<span></span>"}<button class="b" data-c="desasub" data-v="${s.id || ""}">Desar</button></div>`);
    setTimeout(() => document.getElementById("cs-nom").focus(), 50);
  }
  function fitxaLimits() {
    H.sheet(`<h2 style="margin-top:0">Límits mensuals</h2><p class="em" style="margin-top:0">Quant vols gastar com a màxim cada mes en cada categoria. Deixa-ho buit si no hi vols límit.</p>` +
      DESP.map(c => `<div class="colr"><em class="dot" style="display:inline-block;background:${COL[c]}"></em><span>${E(c)}</span><input class="cn" data-lim="${E(c)}" inputmode="decimal" value="${E((cfg.limits || {})[c] || "")}" placeholder="—" style="max-width:110px;text-align:right"> €</div>`).join("") +
      `<div class="sfoot"><span></span><button class="b" data-c="desalim">Desar</button></div>`);
  }

  // ---------- importar del banc (CSV o Excel exportat de la web del banc, o enganxat) ----------
  function importa() {
    H.sheet(`<h2 style="margin-top:0">Importar moviments del banc</h2><p class="em" style="margin-top:0">Descarrega els moviments des de la web o l'app del banc (CSV o Excel) i puja l'arxiu, o copia la taula i enganxa-la. Reconec les columnes de data, concepte i import, poso la categoria i no duplico els que ja hi són.</p>
      <label class="b2" style="display:inline-flex;align-items:center">Triar l'arxiu (CSV o Excel)<input type="file" id="ci-f" accept=".csv,.txt,.xlsx,.xls" hidden></label>
      <label>O enganxa-ho aquí</label><textarea id="ci-t" rows="6" placeholder="Data · Concepte · Import"></textarea><button class="b2" data-c="ciparse" style="margin-top:8px">Llegir</button><div id="ci-r"></div>`);
  }
  const files = txt => { const ls = txt.replace(/\r/g, "").split("\n").filter(x => x.trim()); const sep = ["\t", ";", ","].map(s => [s, ls.slice(0, 10).reduce((a, l) => a + (l.split(s).length - 1), 0)]).sort((a, b) => b[1] - a[1])[0][0]; return ls.map(l => { const o = []; let c = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === sep && !q) { o.push(c.trim()); c = "" } else c += ch } o.push(c.trim()); return o }) };
  function data(v) {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    const s = String(v || "").trim(); let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0];
    m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/); if (m) return (m[3].length === 2 ? "20" + m[3] : m[3]) + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
    if (/^\d{5}$/.test(s)) return new Date(Date.UTC(1899, 11, 30) + +s * 864e5).toISOString().slice(0, 10);
    return "";
  }
  function interpreta(rows) {
    const nrm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
    let h = rows.findIndex(r => r.some(c => /^(fecha|data|date|f\. ?valor|fecha valor|fecha operacion|f\. ?operacion)/.test(nrm(c))) && r.some(c => /(importe|import|amount|cantidad|cargo|abono)/.test(nrm(c))));
    let id = -1, ic = -1, ii = -1, icar = -1, iab = -1;
    if (h >= 0) { const c = rows[h].map(nrm); id = c.findIndex(x => /^(fecha operacion|f\. ?operacion|fecha|data|date)/.test(x)); ic = c.findIndex(x => /(concepto|concepte|descripcion|descripcio|description|detalle|movimiento|beneficiario)/.test(x)); ii = c.findIndex(x => /^(importe|import|amount|cantidad)/.test(x)); icar = c.findIndex(x => /cargo|debit/.test(x)); iab = c.findIndex(x => /abono|credit/.test(x)) }
    else { h = -1; const r = rows.find(r => r.some(c => data(c)) && r.some(c => /\d[.,]\d{2}$/.test(String(c)))); if (!r) return []; id = r.findIndex(c => data(c)); const dec = c => /^-?\d[\d.,]*[.,]\d{2}-?$/.test(String(c).replace(/[\s€\u2212]/g, "")), cols = r.map((c, i) => i).filter(i => dec(r[i])), neg = cols.find(i => rows.some(x => /^[-\u2212]|-$/.test(String(x[i] || "").trim()))); ii = neg ?? cols[0]; ic = r.findIndex((c, i) => i !== id && i !== ii && /[a-z]/i.test(String(c))) }
    return rows.slice(h + 1).map(r => { const d = data(r[id]); let imp = ii >= 0 ? num(r[ii]) : num(r[iab]) - Math.abs(num(r[icar])); let con = String(ic >= 0 ? r[ic] : "").replace(/\s+/g, " ").trim(); if (con && con === con.toUpperCase() && /[A-ZÀ-Ú]{3}/.test(con)) con = con.toLowerCase().replace(/(^|[\s.\-\/])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()); return d && imp ? { data: d, concepte: con, import: imp } : null }).filter(Boolean);
  }
  let pendents = [];
  async function mostra(l) {
    const box = document.getElementById("ci-r"); if (!box) return;
    if (!l.length) { box.innerHTML = `<p class="em">No he trobat moviments. Comprova que hi hagi columnes de data i d'import.</p>`; return }
    const ms = [...new Set(l.map(x => x.data.slice(0, 7)))], ds = await Promise.all(ms.map(m => doc("fin:" + m, { movs: [] }))), ja = new Set(ds.flatMap(d => (d.movs || []).map(x => x.data + "|" + Math.round(num(x.import) * 100) + "|" + clau(x.concepte))));
    const virt = (await Promise.all(ms.map(async m => subsDelMes(m).concat(await feinesDelMes(m))))).flat();
    const igual = x => virt.find(v => v.data.slice(0, 7) === x.data.slice(0, 7) && (v.sub ? Math.abs(Math.abs(v.import) - Math.abs(x.import)) < .02 && x.import < 0 : Math.abs(v.import - x.import) < 1 && x.import > 0));
    pendents = l.map(x => { const v = igual(x); return Object.assign(x, { cat: categoria(x.concepte, x.import), dup: ja.has(x.data + "|" + Math.round(x.import * 100) + "|" + clau(x.concepte)), ja: v ? (v.sub ? "ja comptat com a despesa fixa (" + v.concepte + ")" : "ja comptat com a feina cobrada") : "" }) });
    const nous = pendents.filter(x => !x.dup && !x.ja);
    box.innerHTML = `<h2>${nous.length} moviments nous${pendents.length - nous.length ? ` · ${pendents.length - nous.length} ja hi eren (desmarcats)` : ""}</h2><div style="max-height:46vh;overflow:auto">` + pendents.map((x, i) => `<div class="r cmr" style="cursor:default;${x.dup || x.ja ? "opacity:.45" : ""}"><input type="checkbox" data-ci="${i}" ${x.dup || x.ja ? "" : "checked"} style="width:18px;height:18px;margin:0"><div class="g"><b>${E(x.concepte || "—")}</b><small>${E([H.fecha(x.data), x.dup ? "ja importat" : x.ja].filter(Boolean).join(" · "))}</small></div><select data-cic="${i}" style="width:150px;flex:none;height:34px!important;font-size:13px">${opts(x.import > 0 ? ING : DESP, x.cat)}</select><b class="cimp ${x.import > 0 ? "vd" : ""}">${eur(x.import, 1)}</b></div>`).join("") + `</div><button class="b" data-c="cidesa" style="margin-top:12px;width:100%" ${nous.length ? "" : "disabled"}>${nous.length ? "Importar els marcats" : "No hi ha res de nou per importar"}</button>`;
  }
  const hsh = document.getElementById("hsh");
  hsh.addEventListener("change", async e => {
    const t = e.target;
    if (t.id === "ci-f" && t.files[0]) {
      const f = t.files[0];
      try {
        if (/\.xlsx?$/i.test(f.name)) { const X = await (window.ExcelJS ? Promise.resolve(window.ExcelJS) : new Promise((ok, ko) => { const sc = document.createElement("script"); sc.src = "/vendor/exceljs.min.js"; sc.onload = () => ok(window.ExcelJS); sc.onerror = ko; document.head.appendChild(sc) })), wb = new X.Workbook(); await wb.xlsx.load(await f.arrayBuffer()); const ws = wb.worksheets[0], rows = []; ws.eachRow(r => rows.push(r.values.slice(1).map(v => v && v.text != null ? v.text : v && v.result != null ? v.result : v))); mostra(interpreta(rows)) }
        else { const buf = await f.arrayBuffer(); let txt = new TextDecoder("utf-8").decode(buf); if (txt.includes("�")) txt = new TextDecoder("windows-1252").decode(buf); mostra(interpreta(files(txt))) }
      } catch (err) { H.toast("No he pogut llegir l'arxiu") }
    }
    if (t.dataset.cic != null) pendents[+t.dataset.cic].cat = t.value;
  });
  hsh.addEventListener("click", async e => {
    const b = e.target.closest("[data-c]"); if (!b) return; const c = b.dataset.c;
    if (c === "ciparse") return mostra(interpreta(files(document.getElementById("ci-t").value)));
    if (c === "cidesa") {
      const sel = pendents.filter((x, i) => document.querySelector(`[data-ci="${i}"]`)?.checked); if (!sel.length) return H.toast("No n'hi ha cap de marcat");
      const per = {}; sel.forEach(x => (per[x.data.slice(0, 7)] = per[x.data.slice(0, 7)] || []).push({ id: uid(), data: x.data, concepte: x.concepte, import: x.import, cat: x.cat }));
      for (const m of Object.keys(per)) { const d = await doc("fin:" + m, { movs: [] }); d.movs = (d.movs || []).concat(per[m]); await H.put(d, 1) }
      sel.forEach(x => { if (clau(x.concepte) && x.cat !== categoria(x.concepte, x.import)) cfg.regles = Object.assign({}, cfg.regles, { [clau(x.concepte)]: x.cat }) }); await H.put(cfg, 1);
      H.cerrar(); mes = Object.keys(per).sort().at(-1); vista = "mes"; H.toast(sel.length + " moviments importats"); return pinta();
    }
    if (c === "desamov") return desaMov(b);
    if (c === "delmov" && confirm("Esborrar aquest moviment?")) { const d = await doc("fin:" + b.dataset.m, { movs: [] }); d.movs = (d.movs || []).filter(x => x.id !== b.dataset.v); await H.put(d, 1); H.cerrar(); return pinta() }
    if (c === "desasub") {
      const g = id => document.getElementById(id), id = b.dataset.v || uid(), ant = (subs.l || []).find(x => x.id === id) || {}, s = { id, nom: g("cs-nom").value.trim(), import: num(g("cs-imp").value), per: g("cs-per").value, data: g("cs-dat").value, cat: g("cs-cat").value, actiu: g("cs-act").checked };
      if (!s.actiu) s.fi = ant.actiu === false && ant.fi ? ant.fi : mesDe(H.today().slice(0, 7), -1);
      if (!s.nom || !s.import) return H.toast("Posa el nom i l'import");
      subs.l = (subs.l || []).filter(x => x.id !== id).concat(s); await H.put(subs, 1); H.cerrar(); return pinta();
    }
    if (c === "delsub" && confirm("Esborrar aquesta despesa fixa? Si només l'has cancel·lada o s'ha acabat, millor desmarca «Activa».")) { subs.l = (subs.l || []).filter(x => x.id !== b.dataset.v); await H.put(subs, 1); H.cerrar(); return pinta() }
    if (c === "desalim") { const l = {}; document.querySelectorAll("[data-lim]").forEach(i => { const n = num(i.value); if (n) l[i.dataset.lim] = n }); cfg.limits = l; await H.put(cfg, 1); H.cerrar(); return pinta() }
    if (c === "anasubs") { H.cerrar(); vista = "subs"; return pinta() }
    if (c === "anafeines") { H.cerrar(); return hubShow("feines") }
  });

  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-c]"); if (!b) return; const c = b.dataset.c, v = b.dataset.v;
    if (c === "vista") { vista = v; filtre = ""; return pinta() }
    if (c === "mes") { mes = mesDe(mes, +v); filtre = ""; return pinta() }
    if (c === "any") { mes = (+mes.slice(0, 4) + +v) + mes.slice(4); return pinta() }
    if (c === "anames") { mes = v; vista = "mes"; return pinta() }
    if (c === "nou") return fitxa({}, v === "ing");
    if (c === "obre") { const { l } = await movsDe(mes), x = l.find(y => y.id === v); return x && fitxa(x, x.import > 0) }
    if (c === "filtra") { filtre = filtre === v ? "" : v; return pinta() }
    if (c === "limits") return fitxaLimits();
    if (c === "importa") return importa();
    if (c === "nousub") return fitxaSub();
    if (c === "obresub") return fitxaSub((subs.l || []).find(s => s.id === v));
  });
  window.addEventListener("hub-sec", e => { if (e.detail === "comptes") pinta() });
  H.onChange(() => { if (!el.hidden) pinta() });
  window.CMPT = { categoria, interpreta, files, num };
})();
