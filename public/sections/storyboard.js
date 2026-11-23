// Storyboard: vinyetes dibuixades (iPad i Pencil), amb elements bàsics (monigotes, cotxe, porta…) que es poden moure,
// escalar, girar i voltejar, foto o vídeo de fons, i l'animàtic («Veure muntat») amb el guió passant per sota.
// Vinculat al guió tècnic (una vinyeta per pla; la descripció i l'escala són les del guió tècnic) i al desglossament (text del guió).
// La imatge final de cada vinyeta va també a la columna «Imatge» del guió tècnic i del pla de rodatge.
(() => {
  const { E } = H, el = document.getElementById("s-storyboard");
  let doc = null, ver = 0, GTD = null, DSG = null;
  const save = () => { doc.mod = Date.now(); return H.put(doc) };
  const uid = () => Math.random().toString(36).slice(2, 9);
  const RATIOS = [["2.39", "2,39:1 (panoràmic)", 2.39], ["1.85", "1,85:1", 1.85], ["16:9", "16:9", 16 / 9], ["4:3", "4:3", 4 / 3], ["1:1", "1:1", 1], ["9:16", "9:16 (vertical)", 9 / 16]];
  const rat = () => (RATIOS.find(r => r[0] === (doc && doc.ratio)) || RATIOS[2])[2];
  const url = id => "/api/archivo/" + id;

  // ---------- dades del guió tècnic ----------
  const plans = () => GTD ? GTD.escenas.flatMap(e => e.planos.map(p => ({ e, p }))) : [];
  const plaDe = v => v.pla && plans().find(x => x.p.id === v.pla);
  const info = v => { const x = plaDe(v); return x ? { esc: x.e.num || "", num: x.p.num || "", escala: x.p.escala || "", desc: x.p.desc || x.p.accion || "", camp: x.p.desc || !x.p.accion ? "desc" : "accion", lloc: [x.e.intext, x.e.lugar, x.e.momento].filter(Boolean).join(". ") } : { esc: v.esc || "", num: v.num || "", escala: v.escala || "", desc: v.desc || "", lloc: "" } };
  async function carrega() {
    const [gs, ds] = await Promise.all([H.col("gt"), H.col("desg")]);
    GTD = doc.gt ? gs.find(g => g.id === doc.gt) || null : null;
    DSG = doc.desg ? ds.find(d => d.id === doc.desg) || null : null;
  }
  // crea les vinyetes que falten (una per pla) i les posa en l'ordre del guió tècnic; les soltes queden al final
  function sincronitza() {
    if (!GTD) return 0;
    // només afegeix els plans que falten (darrere el pla anterior del guió tècnic); l'ordre que hagis fet a mà es manté
    let n = 0; const ps = plans(), oc = doc.ocults || [];
    ps.forEach(({ p }, j) => {
      if (oc.includes(p.id) || doc.vin.some(v => v.pla === p.id)) return;
      let pos = -1; for (let q = j - 1; q >= 0 && pos < 0; q--) pos = doc.vin.findIndex(v => v.pla === ps[q].p.id);
      doc.vin.splice(pos < 0 ? (j === 0 ? 0 : doc.vin.length) : pos + 1, 0, { id: uid(), pla: p.id, dur: 3 }); n++;
    });
    return n;
  }

  // ---------- llista de storyboards ----------
  async function lista() {
    const v = ++ver, [ls0, ps, gs] = await Promise.all([H.col("sb"), H.col("proyecto"), H.col("gt")]); if (v !== ver) return; doc = null;
    const ls = ls0.filter(H.dePj), gp = gs.filter(H.dePj);
    el.innerHTML = `<div class="bar"><span class="em">Dibuixa cada pla, afegeix-hi fotos o vídeos i mira-ho muntat amb el guió.</span><span style="flex:1"></span><button class="b" data-k="nou">+ Storyboard</button></div>
      ${ls.length ? ls.sort((a, b) => (b.mod || 0) - (a.mod || 0)).map(d => { const p = ps.find(x => x.id === d.proyecto), g = gs.find(x => x.id === d.gt), im = (d.vin || []).filter(x => x.img).slice(0, 1);
        return `<div class="r sbl" data-k="obre" data-id="${d.id}"><div class="sbm">${im.map(x => `<img src="${url(x.img)}" alt="">`).join("")}</div><div class="g"><b>${E(d.titulo || "Sense títol")}</b><small>${E([p && p.titulo, (d.vin || []).length + " vinyetes", g ? "Guió tècnic: " + (g.titulo || "sense títol") : ""].filter(Boolean).join(" · "))}</small></div></div>` }).join("")
        : `<div class="em" style="padding:30px 0">Encara no hi ha cap storyboard.${gp.length ? " El més ràpid és crear-lo a partir del guió tècnic: et farà una vinyeta per pla." : ""}</div>`}`;
  }
  async function nou() {
    const gs = (await H.col("gt")).filter(H.dePj), ds = (await H.col("desg")).filter(H.dePj);
    H.sheet(`<h2 style="margin-top:4px">Nou storyboard</h2>
      <label>Títol</label><input id="sbt" placeholder="Títol">
      <label>Guió tècnic</label><select id="sbg"><option value="">— Cap (vinyetes soltes) —</option>${gs.map(g => `<option value="${g.id}">${E(g.titulo || "Sense títol")}</option>`).join("")}</select>
      <label>Guió (desglossament) per veure'l passar a l'animàtic</label><select id="sbd"><option value="">— Cap —</option>${ds.map(d => `<option value="${d.id}">${E(d.titulo || "Sense títol")}</option>`).join("")}</select>
      <label>Format</label><select id="sbr">${RATIOS.map(r => `<option value="${r[0]}" ${r[0] === "16:9" ? "selected" : ""}>${r[1]}</option>`).join("")}</select>
      <div class="sfoot"><span></span><button class="b" id="sbok">Crear</button></div>`);
    if (gs.length) document.getElementById("sbg").value = gs[0].id;
    if (ds.length) document.getElementById("sbd").value = ds[0].id;
    document.getElementById("sbok").onclick = async () => {
      const g = gs.find(x => x.id === document.getElementById("sbg").value);
      doc = { id: H.uid("sb"), titulo: document.getElementById("sbt").value.trim() || (g ? g.titulo || "" : "") || "Storyboard", proyecto: H.pj() && H.pj() !== "-" ? H.pj() : (g && g.proyecto) || "", gt: g ? g.id : "", desg: document.getElementById("sbd").value, ratio: document.getElementById("sbr").value, vin: [], mod: Date.now() };
      await carrega(); if (!sincronitza()) doc.vin.push({ id: uid(), dur: 3 });
      await save(); H.cerrar(); pinta();
    };
  }
  async function obre(id) { ++ver; doc = (await H.col("sb")).find(x => x.id === id); if (!doc) return lista(); doc.vin = doc.vin || []; await carrega(); if (sincronitza()) save(); pinta() }

  // ---------- vinyetes ----------
  async function pinta() {
    const [gs, ds] = await Promise.all([H.col("gt"), H.col("desg")]), gp = gs.filter(g => H.dePj(g) || g.id === doc.gt), dp = ds.filter(d => H.dePj(d) || d.id === doc.desg);
    const r = rat(), tot = doc.vin.reduce((a, v) => a + (+v.dur || 0), 0);
    let escAnt = null;
    el.innerHTML = `<div class="bar tb"><button class="b2" data-k="torna">← Storyboards</button><input data-d="titulo" value="${E(doc.titulo || "")}" placeholder="Títol" style="max-width:280px;font-weight:700">
        <select data-d="ratio" style="width:auto">${RATIOS.map(x => `<option value="${x[0]}" ${x[0] === (doc.ratio || "16:9") ? "selected" : ""}>${x[1]}</option>`).join("")}</select><span style="flex:1"></span>
        <button class="b2" data-k="pdf">PDF</button><button class="b" data-k="mira" ${doc.vin.length ? "" : "disabled"}>Veure muntat</button></div>
      <div class="ls" style="gap:10px;margin:0 0 12px;align-items:flex-end">
        <div style="flex:1;min-width:200px"><label>Guió tècnic</label><select data-d="gt"><option value="">— Cap —</option>${gp.map(g => `<option value="${g.id}" ${g.id === doc.gt ? "selected" : ""}>${E(g.titulo || "Sense títol")}</option>`).join("")}</select></div>
        <div style="flex:1;min-width:200px"><label>Guió per a l'animàtic (desglossament)</label><select data-d="desg"><option value="">— Cap —</option>${dp.map(d => `<option value="${d.id}" ${d.id === doc.desg ? "selected" : ""}>${E(d.titulo || "Sense títol")}</option>`).join("")}</select></div>
        <span class="em" style="padding-bottom:10px">${doc.vin.length} ${doc.vin.length === 1 ? "vinyeta" : "vinyetes"} · ${Math.floor(tot / 60)}:${String(Math.round(tot % 60)).padStart(2, "0")}</span></div>
      ${(doc.ocults || []).length ? `<p class="em" style="margin:0 0 12px">${doc.ocults.length} ${doc.ocults.length === 1 ? "pla amagat" : "plans amagats"} del guió tècnic. <a href="#" data-k="torna-plans" style="color:#000">Tornar-los a mostrar</a></p>` : ""}
      ${DSG && !DSG.escenes.some(e => e.text) ? `<p class="em" style="margin:0 0 12px">Aquest desglossament es va fer abans que el hub guardés el text del guió. Torna a pujar-hi el PDF (Desglossament → nou) perquè el guió passi per sota a l'animàtic.</p>` : ""}
      <div class="sbg" style="--r:${r}">${doc.vin.map((v, i) => { const f = info(v), cap = f.esc !== escAnt && f.esc ? `<h3 class="sbh">Escena ${E(f.esc)}${f.lloc ? " · " + E(f.lloc) : ""}</h3>` : ""; escAnt = f.esc;
        return cap + `<div class="sbc" data-i="${i}"><div class="sbi" data-k="edita" data-i="${i}">${v.img ? `<img src="${url(v.img)}" alt="">` : `<span>Toca per dibuixar</span>`}${v.video || v.vurl ? `<i class="sbv">vídeo</i>` : ""}</div>
          <div class="sbn"><b>${f.esc ? E(f.esc) + "." : ""}${E(f.num || String(i + 1))}</b>${f.escala ? `<span class="pill">${E(f.escala)}</span>` : ""}<span style="flex:1"></span><input type="number" min="0.5" step="0.5" data-v="dur" data-i="${i}" value="${E(v.dur ?? 3)}" title="Durada a l'animàtic (segons)"><small>s</small>
            <button class="t" data-k="esq" data-i="${i}" ${i ? "" : "disabled"} title="Moure a l'esquerra">‹</button><button class="t" data-k="dre" data-i="${i}" ${i < doc.vin.length - 1 ? "" : "disabled"} title="Moure a la dreta">›</button><button class="x" data-k="treu" data-i="${i}" title="Esborrar la vinyeta">×</button></div>
          <textarea rows="2" data-v="desc" data-i="${i}" placeholder="Acció / descripció${v.pla ? " (és la del guió tècnic)" : ""}">${E(f.desc)}</textarea>
          <textarea rows="1" data-v="dial" data-i="${i}" placeholder="Diàleg o so">${E(v.dial || "")}</textarea></div>` }).join("")}
        <button class="sbc sbadd" data-k="afegeix"><span>+ Vinyeta</span></button></div>`;
  }

  // ---------- editor de vinyeta (pantalla completa) ----------
  // Elements: dibuixats en una caixa de 100 d'alt centrada a (0,0); s'escalen, giren i volteja.
  const EL = {
    dret: ["Persona dreta", `<circle cx="0" cy="-38" r="10"/><path d="M0-28V12M0-18l-16 18M0-18l16 18M0 12l-12 38M0 12l12 38"/>`],
    camina: ["Persona caminant", `<circle cx="2" cy="-38" r="10"/><path d="M0-28l-3 40M-1-18l-14 14 6 12M-1-18l15 10 8 12M-3 12l-16 36M-3 12l14 18-2 20"/>`],
    corre: ["Persona corrent", `<circle cx="8" cy="-36" r="10"/><path d="M4-26l-10 34M2-16l-18 6-6 14M2-16l18 10 10-8M-6 8l-20 18-10 4M-6 8l18 14-4 26"/>`],
    seu: ["Persona asseguda", `<circle cx="-6" cy="-38" r="10"/><path d="M-6-28v34h26v40M-6-18l14 14 14-4M-6 6v2"/><path d="M-18 8h44M-18 8v42M26 8v42" opacity=".45"/>`],
    esquena: ["Persona d'esquena", `<circle cx="0" cy="-38" r="10" fill="currentColor"/><path d="M0-28V12M0-18l-14 22M0-18l14 22M0 12l-10 38M0 12l10 38"/>`],
    cap: ["Cap (primer pla)", `<ellipse cx="0" cy="-6" rx="30" ry="38"/><path d="M30-8l10 8-10 4M-30 34c10 10 50 10 60 0M-8 50v-14h16v14"/><circle cx="12" cy="-12" r="3" fill="currentColor"/>`],
    duet: ["Dues persones", `<circle cx="-18" cy="-38" r="9"/><path d="M-18-29V10M-18-19l-12 16M-18-19l12 16M-18 10l-10 38M-18 10l10 38"/><circle cx="18" cy="-36" r="9"/><path d="M18-27V10M18-17l-12 16M18-17l12 16M18 10l-10 38M18 10l10 38"/>`],
    cotxe: ["Cotxe", `<path d="M-48 18v-16l10-4 12-18h40l16 18 14 4v16z"/><circle cx="-26" cy="20" r="9"/><circle cx="28" cy="20" r="9"/><path d="M-22-2l8-14h14v14zM6-16h14l12 14H6z"/>`],
    porta: ["Porta", `<rect x="-20" y="-50" width="40" height="100"/><circle cx="12" cy="4" r="3" fill="currentColor"/>`],
    finestra: ["Finestra", `<rect x="-30" y="-30" width="60" height="60"/><path d="M0-30v60M-30 0h60"/>`],
    taula: ["Taula", `<path d="M-45-6h90M-38-6v40M38-6v40"/>`],
    cadira: ["Cadira", `<path d="M-14-46v80M-14 4h30v30M-14 4"/>`],
    llit: ["Llit", `<path d="M-50 20V-16M-50 4h100v16M50 4V-4M-50-6h22v10"/>`],
    arbre: ["Arbre", `<circle cx="0" cy="-20" r="28"/><path d="M0 8v42"/>`],
    edifici: ["Edifici", `<rect x="-28" y="-50" width="56" height="100"/><path d="M-16-36h8M8-36h8M-16-16h8M8-16h8M-16 4h8M8 4h8M-6 50V30h12v20"/>`],
    sol: ["Sol / llum", `<circle cx="0" cy="0" r="16"/><path d="M0-30v-12M0 30v12M-30 0h-12M30 0h12M-22-22l-8-8M22 22l8 8M-22 22l-8 8M22-22l8-8"/>`],
    fletxa: ["Fletxa (moviment)", `<path d="M-46 0h86M24-16l18 16-18 16"/>`],
    corba: ["Fletxa corba", `<path d="M-40 20C-30-30 30-30 40 10M28 0l12 12 6-16"/>`],
    zoom: ["Zoom / travelling", `<rect x="-46" y="-30" width="92" height="60" stroke-dasharray="6 5"/><rect x="-22" y="-14" width="44" height="28"/><path d="M-46-30l24 16M46-30l-24 16M-46 30l-24-16M46 30l-24-16" transform="scale(1)"/>`],
    marc: ["Marc (enquadrament)", `<rect x="-48" y="-30" width="96" height="60" stroke-dasharray="8 6"/>`]
  };
  let ED = null, PEN = false; try { PEN = localStorage.getItem("sb-pen") === "1" } catch (e) { }
  const SVGNS = "http://www.w3.org/2000/svg";
  const objSVG = (o, W, H_) => { const k = (o.s || 30) / 100 * H_ / 100; return `<g transform="translate(${o.x / 100 * W} ${o.y / 100 * H_}) rotate(${o.r || 0}) scale(${(o.f ? -1 : 1) * k} ${k})" fill="none" stroke="${o.c || "#000"}" color="${o.c || "#000"}" stroke-width="${(H_ / 220) / Math.max(k, .05)}" stroke-linecap="round" stroke-linejoin="round">${(EL[o.t] || EL.dret)[1]}</g>` };

  async function edita(i) {
    const v = doc.vin[i], f = info(v), r = rat(), W = 1600, Hh = Math.round(W / r);
    const ov = document.createElement("div"); ov.className = "sbed";
    ov.innerHTML = `<div class="sbtop"><button class="b2" data-e="tanca">Cancel·lar</button><b class="sbtt">${f.esc ? "Esc. " + E(f.esc) + " · " : ""}Pla ${E(f.num || String(i + 1))}${f.escala ? " · " + E(f.escala) : ""}</b><span style="flex:1"></span>
        <button class="t" data-e="desfer" title="Desfer">↶</button><button class="t" data-e="refer" title="Refer">↷</button><button class="b" data-e="desa">Desar</button></div>
      <div class="sbtools">
        <div class="seg">${[["llapis", "Llapis"], ["retol", "Retolador"], ["gris", "Ombra"], ["goma", "Goma"], ["mou", "Moure"]].map(([k, l]) => `<button class="t" data-e="eina" data-v="${k}">${l}</button>`).join("")}</div>
        <div class="sbcol">${["#000000", "#8e8e93", "#ff3b30", "#0a84ff", "#ffffff"].map(c => `<button data-e="color" data-v="${c}" style="background:${c}" title="Color"></button>`).join("")}</div>
        <input type="range" min="1" max="40" value="4" data-e="gruix" title="Gruix">
        <label class="b2" style="cursor:pointer">Foto<input type="file" accept="image/*" data-e="foto" hidden></label>
        <label class="b2" style="cursor:pointer">Vídeo<input type="file" accept="video/*" data-e="video" hidden></label>
        <button class="b2" data-e="buida">Esborrar dibuix</button>
      </div>
      <div class="sbwrap"><div class="sbstage" style="aspect-ratio:${W}/${Hh}">
        ${v.foto ? `<img class="sbfoto" src="${url(v.foto)}" alt="">` : ""}
        <svg class="sbobj" viewBox="0 0 ${W} ${Hh}" xmlns="${SVGNS}"></svg>
        <canvas class="sbdib" width="${W}" height="${Hh}"></canvas>
        <svg class="sbsel" viewBox="0 0 ${W} ${Hh}" xmlns="${SVGNS}"></svg>
      </div><div class="sbobjbar" hidden><button class="b2" data-e="volteja">Voltejar</button><button class="b2" data-e="dup">Duplicar</button><button class="b2" data-e="davant">Davant</button><button class="b2" data-e="darrere">Darrere</button><button class="b2" data-e="esborra" style="color:#ff3b30">Esborrar</button></div></div>
      <div class="sbpal">${Object.entries(EL).map(([k, [l, p]]) => `<button data-e="posa" data-v="${k}" title="${E(l)}"><svg viewBox="-55 -55 110 110" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${p}</svg><small>${E(l)}</small></button>`).join("")}</div>
      <div class="sbmeta">${v.video || v.vurl ? `<span class="em">Vídeo: ${v.video ? "pujat" : E(v.vurl)} <button class="x" data-e="treuvideo" title="Treure el vídeo">×</button></span>` : `<input data-e="vurl" placeholder="…o enllaç a un vídeo (Drive, Vimeo)" value="">`}${v.foto ? `<button class="b2" data-e="treufoto">Treure la foto</button>` : ""}</div>`;
    document.body.appendChild(ov); document.body.style.overflow = "hidden";
    const cv = ov.querySelector(".sbdib"), cx = cv.getContext("2d"), so = ov.querySelector(".sbobj"), ss = ov.querySelector(".sbsel"), bar = ov.querySelector(".sbobjbar");
    ED = { i, v, ov, eina: "llapis", color: "#000000", gruix: 4, objs: JSON.parse(JSON.stringify(v.objs || [])), sel: -1, pila: [], refer: [], foto: v.foto || "", video: v.video || "", vurl: v.vurl || "", canviat: false, penVist: PEN, nous: [], vdur: 0 };
    if (v.dib) { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => { if (!ED) return; const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = Hh; tmp.getContext("2d").drawImage(cv, 0, 0); cx.clearRect(0, 0, W, Hh); cx.drawImage(im, 0, 0, W, Hh); cx.drawImage(tmp, 0, 0); ED.pila = [estat(1)] }; im.src = url(v.dib) } else ED.pila = [estat()];
    // coordenades: local de l'element (caixa de 100) ↔ usuari de l'escena (W × Hh)
    const kk = o => (o.s || 30) / 100 * Hh / 100;
    function aUsuari(o, lx, ly) { const k = kk(o), a = (o.r || 0) * Math.PI / 180, x = lx * k * (o.f ? -1 : 1), y = ly * k; return { x: o.x / 100 * W + x * Math.cos(a) - y * Math.sin(a), y: o.y / 100 * Hh + x * Math.sin(a) + y * Math.cos(a) } }
    function aLocal(o, ux, uy) { const k = kk(o), a = -(o.r || 0) * Math.PI / 180, dx = ux - o.x / 100 * W, dy = uy - o.y / 100 * Hh; return { x: (dx * Math.cos(a) - dy * Math.sin(a)) / k * (o.f ? -1 : 1), y: (dx * Math.sin(a) + dy * Math.cos(a)) / k } }
    // l'escena ocupa tot l'espai disponible mantenint el format
    const st = ov.querySelector(".sbstage"), wr = ov.querySelector(".sbwrap");
    const ajusta = () => { const aw = wr.clientWidth - 28, ah = wr.clientHeight - 12, w = Math.min(aw, ah * W / Hh); st.style.width = w + "px"; st.style.height = w * Hh / W + "px" };
    ajusta(); const rob = new ResizeObserver(ajusta); rob.observe(wr);
    function estat(px) { return { px: px ? cx.getImageData(0, 0, W, Hh) : (ED.pila.at(-1) || {}).px || cx.getImageData(0, 0, W, Hh), objs: JSON.stringify(ED.objs) } }
    // desfer: els canvis d'elements no copien els píxels (comparteixen la darrera còpia); màxim 15 passos i 6 còpies de píxels
    const desa = px => { ED.pila.push(estat(px)); while (ED.pila.length > 15 || new Set(ED.pila.map(x => x.px)).size > 6) ED.pila.shift(); ED.refer = []; ED.canviat = true };
    const torna = s => { cx.putImageData(s.px, 0, 0); ED.objs = JSON.parse(s.objs); ED.sel = -1; dibObjs() };
    function dibObjs() {
      so.innerHTML = ED.objs.map(o => objSVG(o, W, Hh)).join("");
      const o = ED.objs[ED.sel]; bar.hidden = !o;
      if (!o) { ss.innerHTML = ""; return }
      const g = so.children[ED.sel].getBBox(), pt = (x, y) => aUsuari(o, x, y);
      const rr = 22 * W / Math.max(st.clientWidth, 1);
      const c = [pt(g.x, g.y), pt(g.x + g.width, g.y), pt(g.x + g.width, g.y + g.height), pt(g.x, g.y + g.height)], top = pt(g.x + g.width / 2, g.y), dalt = pt(g.x + g.width / 2, g.y - rr * 2.6 / kk(o));
      ss.innerHTML = `<polygon points="${c.map(p => p.x + "," + p.y).join(" ")}" fill="none" stroke="#0a84ff" stroke-width="3" stroke-dasharray="10 8"/><line x1="${top.x}" y1="${top.y}" x2="${dalt.x}" y2="${dalt.y}" stroke="#0a84ff" stroke-width="3"/>
        <circle data-h="gira" cx="${dalt.x}" cy="${dalt.y}" r="${rr}" fill="#fff" stroke="#0a84ff" stroke-width="${rr / 5}"/><circle data-h="mida" cx="${c[2].x}" cy="${c[2].y}" r="${rr}" fill="#0a84ff"/>
        <circle data-h="gira" cx="${dalt.x}" cy="${dalt.y}" r="${rr * 2}" fill="transparent"/><circle data-h="mida" cx="${c[2].x}" cy="${c[2].y}" r="${rr * 2}" fill="transparent"/>`;
    }
    const eina = k => { ED.eina = k; ov.querySelectorAll('[data-e="eina"]').forEach(b => b.classList.toggle("on", b.dataset.v === k)); ss.style.pointerEvents = k === "mou" ? "auto" : "none"; cv.style.pointerEvents = k === "mou" ? "none" : "auto"; if (k !== "mou") { ED.sel = -1; dibObjs() } };
    const color = c => { ED.color = c; ov.querySelectorAll('[data-e="color"]').forEach(b => b.classList.toggle("on", b.dataset.v === c)) };
    eina("llapis"); color("#000000"); dibObjs();
    const loc = (e, el2) => { const b = el2.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * Hh] };

    // dibuix amb pressió del Pencil; el dit no dibuixa si ja s'ha fet servir el llapis (per recolzar la mà)
    let traç = null;
    cv.addEventListener("pointerdown", e => {
      if (e.pointerType === "pen" && !ED.penVist) { ED.penVist = PEN = true; try { localStorage.setItem("sb-pen", "1") } catch (er) { } } if (e.pointerType === "touch" && ED.penVist) return;
      if (traç) return;
      e.preventDefault(); cv.setPointerCapture(e.pointerId); traç = { id: e.pointerId, p: loc(e, cv) };
    });
    cv.addEventListener("pointermove", e => {
      if (!traç || e.pointerId !== traç.id) return;
      (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).forEach(ev => {
        const q = loc(ev, cv), pr = ev.pointerType === "pen" || ev.pressure && ev.pressure !== .5 ? ev.pressure || .5 : .5, k = ED.eina, g = ED.gruix * W / 800;
        cx.save(); cx.lineCap = cx.lineJoin = "round";
        if (k === "goma") { cx.globalCompositeOperation = "destination-out"; cx.lineWidth = g * 4 }
        else if (k === "gris") { cx.globalAlpha = .16; cx.strokeStyle = ED.color; cx.lineWidth = g * 5 }
        else { cx.strokeStyle = ED.color; cx.lineWidth = k === "retol" ? g * 1.8 : g * (.25 + pr * 1.3) }
        cx.beginPath(); cx.moveTo(...traç.p); cx.lineTo(...q); cx.stroke(); cx.restore(); traç.p = q;
      });
    });
    const fi = e => { if (traç && e.pointerId === traç.id) { traç = null; desa(1) } };
    cv.addEventListener("pointerup", fi); cv.addEventListener("pointercancel", fi);

    // moure / escalar / girar elements
    let ar = null;
    ss.addEventListener("pointerdown", e => {
      if (ar || (e.pointerType === "touch" && ED.penVist)) return;
      e.preventDefault(); const [x, y] = loc(e, ss), h = e.target.dataset && e.target.dataset.h;
      if (h && ED.sel >= 0) { const o = ED.objs[ED.sel]; ar = { id: e.pointerId, m: h, o, x0: x, y0: y, s0: o.s || 30, r0: o.r || 0, cx: o.x / 100 * W, cy: o.y / 100 * Hh }; ar.a0 = Math.atan2(y - ar.cy, x - ar.cx) * 180 / Math.PI; ss.setPointerCapture(e.pointerId); return }
      // tria l'element de més amunt que hi ha sota el dit
      let tr = -1; [...so.children].forEach((g, k) => { const b = g.getBBox(), lp = aLocal(ED.objs[k], x, y), m = 8; if (lp.x >= b.x - m && lp.x <= b.x + b.width + m && lp.y >= b.y - m && lp.y <= b.y + b.height + m) tr = k });
      ED.sel = tr; dibObjs();
      if (tr >= 0) { const o = ED.objs[tr]; ar = { id: e.pointerId, m: "mou", o, x0: x, y0: y, ox: o.x, oy: o.y }; ss.setPointerCapture(e.pointerId) }
    });
    ss.addEventListener("pointermove", e => {
      if (!ar || e.pointerId !== ar.id) return; const [x, y] = loc(e, ss), o = ar.o;
      if (ar.m === "mou") { o.x = ar.ox + (x - ar.x0) / W * 100; o.y = ar.oy + (y - ar.y0) / Hh * 100 }
      if (ar.m === "mida") { const d0 = Math.hypot(ar.x0 - ar.cx, ar.y0 - ar.cy), d1 = Math.hypot(x - ar.cx, y - ar.cy); o.s = Math.max(4, Math.min(400, ar.s0 * d1 / Math.max(d0, 1))) }
      if (ar.m === "gira") { let a = ar.r0 + Math.atan2(y - ar.cy, x - ar.cx) * 180 / Math.PI - ar.a0; if (Math.abs(a % 90) < 5 || Math.abs(a % 90) > 85) a = Math.round(a / 90) * 90; o.r = Math.round(a) }
      dibObjs();
    });
    const fa = e => { if (ar && e.pointerId === ar.id) { ar = null; desa() } }; ss.addEventListener("pointerup", fa); ss.addEventListener("pointercancel", fa);

    ov.addEventListener("input", e => { const t = e.target; if (t.dataset.e === "gruix") ED.gruix = +t.value; if (t.dataset.e === "vurl") { ED.vurl = t.value.trim(); ED.canviat = true } });
    ov.addEventListener("change", async e => {
      const t = e.target; if (!t.files || !t.files[0]) return; const fl = t.files[0];
      if (fl.size > 25 * 1024 * 1024) return H.toast("Passa de 25 MB: millor posa-hi un enllaç");
      H.toast("Pujant…");
      try { const a = await H.api("POST", "archivo?nombre=" + encodeURIComponent(fl.name), fl); ED.nous.push(a.id); ED.canviat = true;
        if (t.dataset.e === "foto") { ED.foto = a.id; let im = ov.querySelector(".sbfoto"); if (!im) { im = document.createElement("img"); im.className = "sbfoto"; ov.querySelector(".sbstage").prepend(im) } im.src = url(a.id) }
        if (t.dataset.e === "video") { ED.video = a.id; ED.vurl = ""; const vt = document.createElement("video"); vt.preload = "metadata"; vt.onloadedmetadata = () => { if (ED && isFinite(vt.duration)) ED.vdur = Math.max(1, Math.round(vt.duration * 2) / 2) }; vt.src = URL.createObjectURL(fl); ov.querySelector(".sbmeta").innerHTML = `<span class="em">Vídeo pujat: es veurà a l'animàtic.</span>` }
        H.toast("Fet") } catch (er) { H.toast("No s'ha pogut pujar") }
    });
    ov.addEventListener("click", async e => {
      const b = e.target.closest("[data-e]"); if (!b || b.tagName === "INPUT") return; const k = b.dataset.e;
      if (k === "eina") eina(b.dataset.v);
      if (k === "color") { color(b.dataset.v); if (ED.sel >= 0) { ED.objs[ED.sel].c = b.dataset.v; dibObjs(); desa() } }
      if (k === "posa") { ED.objs.push({ t: b.dataset.v, x: 50, y: 55, s: ["cap"].includes(b.dataset.v) ? 70 : ["marc", "zoom"].includes(b.dataset.v) ? 80 : 40, r: 0, f: false, c: ED.color === "#ffffff" ? "#000000" : ED.color }); eina("mou"); ED.sel = ED.objs.length - 1; dibObjs(); desa() }
      const o = ED.objs[ED.sel];
      if (o && k === "volteja") { o.f = !o.f; dibObjs(); desa() }
      if (o && k === "dup") { ED.objs.push({ ...o, x: o.x + 4, y: o.y + 4 }); ED.sel = ED.objs.length - 1; dibObjs(); desa() }
      if (o && k === "esborra") { ED.objs.splice(ED.sel, 1); ED.sel = -1; dibObjs(); desa() }
      if (o && k === "davant") { ED.objs.push(ED.objs.splice(ED.sel, 1)[0]); ED.sel = ED.objs.length - 1; dibObjs(); desa() }
      if (o && k === "darrere") { ED.objs.unshift(ED.objs.splice(ED.sel, 1)[0]); ED.sel = 0; dibObjs(); desa() }
      if (k === "desfer" && ED.pila.length > 1) { ED.refer.push(ED.pila.pop()); torna(ED.pila.at(-1)) }
      if (k === "refer" && ED.refer.length) { const s = ED.refer.pop(); ED.pila.push(s); torna(s) }
      if (k === "buida" && confirm("Esborrar tot el dibuix (els elements es queden)?")) { cx.clearRect(0, 0, W, Hh); desa(1) }
      if (k === "treufoto") { ED.foto = ""; const im = ov.querySelector(".sbfoto"); im && im.remove(); b.remove(); ED.canviat = true }
      if (k === "treuvideo") { ED.video = ""; ED.vurl = ""; ov.querySelector(".sbmeta").innerHTML = `<input data-e="vurl" placeholder="…o enllaç a un vídeo (Drive, Vimeo)" value="">`; ED.canviat = true }
      if (k === "tanca") { if (ED.canviat && !confirm("Sortir sense desar els canvis?")) return; ED.nous.forEach(id => H.api("DELETE", "archivo/" + id).catch(() => { })); tanca() }
      if (k === "desa") { b.disabled = true; b.textContent = "Desant…"; try { await desaVinyeta(cv, W, Hh) ; tanca(); pinta() } catch (er) { b.disabled = false; b.textContent = "Desar"; H.toast("No s'ha pogut desar") } }
    });
    function tanca() { rob.disconnect(); ov.remove(); document.body.style.overflow = ""; ED = null }
  }

  // imatge final = foto + elements + dibuix; es puja la imatge final (JPEG) i la capa de dibuix (PNG, per tornar-la a editar)
  async function desaVinyeta(cv, W, Hh) {
    const v = ED.v, out = document.createElement("canvas"); out.width = W; out.height = Hh; const o = out.getContext("2d");
    o.fillStyle = "#fff"; o.fillRect(0, 0, W, Hh);
    if (ED.foto) { const im = await carregaImg(url(ED.foto)); if (im) { const k = Math.max(W / im.width, Hh / im.height); o.drawImage(im, (W - im.width * k) / 2, (Hh - im.height * k) / 2, im.width * k, im.height * k) } }
    if (ED.objs.length) { const svg = `<svg xmlns="${SVGNS}" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}">${ED.objs.map(x => objSVG(x, W, Hh)).join("")}</svg>`, im = await carregaImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)); im && o.drawImage(im, 0, 0) }
    o.drawImage(cv, 0, 0);
    const blob = (c, t, q) => new Promise(r => c.toBlob(r, t, q));
    const buit = !cv.getContext("2d").getImageData(0, 0, W, Hh).data.some((x, i) => i % 4 === 3 && x);
    const [fin, dib] = await Promise.all([H.api("POST", "archivo?nombre=vinyeta.jpg", await blob(out, "image/jpeg", .85)), buit ? null : H.api("POST", "archivo?nombre=dibuix.png", await blob(cv, "image/png"))]);
    const ant = v.img, vells = [v.img, v.dib, v.foto !== ED.foto && v.foto, v.video !== ED.video && v.video].concat(ED.nous.filter(id => id !== ED.foto && id !== ED.video)).filter(Boolean);
    Object.assign(v, { img: fin.id, dib: dib ? dib.id : "", objs: ED.objs, foto: ED.foto, video: ED.video, vurl: ED.vurl });
    if (ED.vdur && (!v.dur || v.dur === 3)) v.dur = ED.vdur;
    doc.mod = Date.now(); await H.put(doc, 1);
    await posaAlGuio(v, ant);
    [...new Set(vells)].forEach(id => id !== v.foto && id !== v.video && H.api("DELETE", "archivo/" + id).catch(() => { }));
    H.toast("Vinyeta desada");
  }
  const carregaImg = src => new Promise(r => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => r(i); i.onerror = () => r(null); i.src = src });
  // la imatge de la vinyeta passa a la columna «Imatge» del guió tècnic i del pla de rodatge (si no n'hi havia una altra posada a mà)
  async function posaAlGuio(v, ant) {
    if (!v.pla) return canviaImg(ant, v.img);
    const toca = f => !f.img || f.imgSb || (ant && f.img === ant), fs = [];
    const g = (await H.col("gt")).find(x => x.id === doc.gt), x = g && g.escenas.flatMap(e => e.planos).find(p => p.id === v.pla);
    if (x && toca(x)) { x.img = v.img; x.imgSb = 1; g.mod = Date.now(); fs.push(H.put(g, 1)) }
    (await H.col("pdr")).forEach(pl => { let c = false; (pl.dias || []).forEach(d => (d.filas || []).forEach(f => { if (f.ref === v.pla && toca(f)) { f.img = v.img; f.imgSb = 1; c = true } })); if (c) fs.push(H.put(pl, 1)) });
    await Promise.all(fs); if (ant) await canviaImg(ant, v.img);
  }
  // on hi hagi la imatge antiga (guió tècnic o pla de rodatge), posa-hi la nova (o treu-la)
  async function canviaImg(ant, nova) {
    if (!ant) return; const fs = [];
    (await H.col("gt")).forEach(g => { let c = false; g.escenas.forEach(e => e.planos.forEach(p => { if (p.img === ant) { if (nova) p.img = nova; else { delete p.img; delete p.imgSb } c = true } })); if (c) fs.push(H.put(g, 1)) });
    (await H.col("pdr")).forEach(pl => { let c = false; (pl.dias || []).forEach(d => (d.filas || []).forEach(f => { if (f.img === ant) { f.img = nova || ""; if (!nova) delete f.imgSb; c = true } })); if (c) fs.push(H.put(pl, 1)) });
    await Promise.all(fs);
  }

  // ---------- animàtic: la imatge a dalt i el guió passant per sota ----------
  const IC = { play: `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>`, pausa: `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>`, ant: `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 4h2v16H6zM20 4L9 12l11 8z" fill="currentColor"/></svg>`, seg: `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M16 4h2v16h-2zM4 4l11 8-11 8z" fill="currentColor"/></svg>` };
  function mira(ini = 0) {
    const vs = doc.vin, r = rat(), escs = DSG ? DSG.escenes.filter(e => e.text && e.text.length) : [];
    // el text del guió: les escenes en l'ordre de les vinyetes (i, si no n'hi ha, la descripció dels plans)
    const ordreEsc = [...new Set(vs.map(v => info(v).esc).filter(Boolean))], usades = ordreEsc.map(n => escs.find(e => String(e.num) === String(n))).filter(Boolean);
    const txt = usades.length ? usades.map(e => `<div class="anesc" data-esc="${E(e.num)}">${e.text.map(([s, t], k) => `<div class="anl" data-k="${k}" style="padding-left:${Math.min(s, 40)}ch${k === 0 ? ";font-weight:700" : ""}">${E(t) || "&nbsp;"}</div>`).join("")}</div>`).join("")
      : vs.map((v, k) => { const f = info(v); return `<div class="anesc" data-vk="${k}"><div class="anl" style="font-weight:700">${E([f.esc && "ESC. " + f.esc, "PLA " + (f.num || k + 1), f.escala].filter(Boolean).join(" · "))}</div><div class="anl">${E(f.desc)}</div>${v.dial ? `<div class="anl" style="padding-left:10ch">${E(v.dial)}</div>` : ""}<div class="anl">&nbsp;</div></div>` }).join("");
    const ov = document.createElement("div"); ov.className = "anim";
    const tot = vs.reduce((a, v) => a + (+v.dur || 3), 0);
    ov.innerHTML = `<div class="antop"><button class="b2" data-a="tanca">Tancar</button><b>${E(doc.titulo || "")}</b><span style="flex:1"></span><span class="antm"></span></div>
      <div class="anvis"><div class="anfr" style="--r:${r}"></div></div>
      <div class="ancap"></div>
      <div class="anbar">${vs.map((v, k) => `<i data-a="salta" data-k="${k}" style="flex:${+v.dur || 3}"></i>`).join("")}</div>
      <div class="anctl"><button class="t" data-a="ant" title="Pla anterior">${IC.ant}</button><button class="b" data-a="play" title="Reproduir / pausa">${IC.play}</button><button class="t" data-a="seg" title="Pla següent">${IC.seg}</button>
        ${usades.length ? `<span class="em anpista" style="margin-left:10px">En pausa, toca una línia per fer que el pla comenci allà.</span>` : `<span class="em" style="margin-left:10px">${DSG ? "El desglossament no té el text del guió: torna a pujar-hi el PDF." : "Tria un desglossament perquè hi passi el guió."}</span>`}</div>
      <div class="anscr"><div class="anpap">${txt}<div style="height:60vh"></div></div></div>`;
    document.body.appendChild(ov); document.body.style.overflow = "hidden";
    const fr = ov.querySelector(".anfr"), cap = ov.querySelector(".ancap"), scr = ov.querySelector(".anscr"), segs = [...ov.querySelectorAll(".anbar i")], tm = ov.querySelector(".antm");
    // on comença cada vinyeta dins el text (px): l'àncora triada a mà o un repartiment proporcional dins la seva escena
    const inicis = () => vs.map((v, k) => {
      const f = info(v), bloc = usades.length ? ov.querySelector(`.anesc[data-esc="${CSS.escape(String(f.esc))}"]`) : ov.querySelector(`.anesc[data-vk="${k}"]`);
      if (!bloc) return null;
      if (usades.length && v.linia != null) { const l = bloc.querySelector(`.anl[data-k="${v.linia}"]`); if (l) return l.offsetTop - 40 }
      const germans = vs.map((w, j) => [w, j]).filter(([w]) => info(w).esc === f.esc), pos = germans.findIndex(([, j]) => j === k);
      return bloc.offsetTop - 40 + (usades.length ? bloc.offsetHeight * Math.max(0, pos) / Math.max(1, germans.length) : 0);
    });
    let k = ini, t0 = 0, tA = 0, jugant = false, raf = 0, IN = [];
    const incrusta = u => { let m; if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return "https://player.vimeo.com/video/" + m[1] + "?autoplay=1&muted=1&controls=0"; if ((m = u.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/))) return "https://www.youtube.com/embed/" + m[1] + "?autoplay=1&mute=1&controls=0"; if ((m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/))) return "https://drive.google.com/file/d/" + m[1] + "/preview"; return "" };
    let kVist = -1;
    const mostra = () => {
      const v = vs[k], f = info(v);
      if (kVist !== k) { kVist = k; const em = v.vurl && incrusta(v.vurl);
        fr.innerHTML = v.video ? `<video src="${url(v.video)}" playsinline muted ${jugant ? "autoplay" : ""}></video>` : em ? `<iframe src="${E(em)}" allow="autoplay; fullscreen" style="width:100%;height:100%;border:0"></iframe>` : v.img ? `<img src="${url(v.img)}" alt="">` : `<span class="em">Sense dibuix</span>` }
      cap.innerHTML = `<b>${f.esc ? "Esc. " + E(f.esc) + " · " : ""}Pla ${E(f.num || String(k + 1))}</b>${f.escala ? " · " + E(f.escala) : ""}${f.desc ? ` — ${E(f.desc)}` : ""}${v.dial ? `<br><i style="font-style:normal">«${E(v.dial)}»</i>` : ""}`;
      segs.forEach((s, j) => s.classList.toggle("on", j <= k));
      ov.querySelector('[data-a="play"]').innerHTML = jugant ? IC.pausa : IC.play; ov.classList.toggle("jugant", jugant);
      tm.textContent = temps(vs.slice(0, k).reduce((s, v) => s + (+v.dur || 3), 0)) + " / " + temps(tot);
      ov.querySelectorAll(".anl.on").forEach(x => x.classList.remove("on")); pas.act = null;
    };
    const temps = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const pas = now => {
      const d = (+vs[k].dur || 3) * 1000, p = Math.min(1, (now - t0) / d);
      const a = IN[k], b = IN.slice(k + 1).find(x => x != null && x >= (a ?? 0));
      if (a != null) { scr.scrollTop = b != null ? a + (b - a) * p : a; const y = scr.scrollTop + 40, ls = scr.querySelectorAll(".anl"); let act = null; for (const l of ls) { if (l.offsetTop <= y) act = l; else break } if (act !== pas.act) { pas.act && pas.act.classList.remove("on"); act && act.classList.add("on"); pas.act = act } }
      tm.textContent = temps(vs.slice(0, k).reduce((s, v) => s + (+v.dur || 3), 0) + p * d / 1000) + " / " + temps(tot);
      if (p >= 1) { if (k < vs.length - 1) { k++; t0 = now; mostra() } else { jugant = false; mostra(); return } }
      if (jugant) raf = requestAnimationFrame(pas);
    };
    const juga = () => { if (k === vs.length - 1 && tA >= (+vs[k].dur || 3) * 1000 - 50) { k = 0; tA = 0; kVist = -1 } jugant = true; IN = inicis(); t0 = performance.now() - tA; mostra(); const vd = fr.querySelector("video"); vd && vd.play().catch(() => { }); raf = requestAnimationFrame(pas) };
    const para = () => { jugant = false; cancelAnimationFrame(raf); tA = performance.now() - t0; mostra(); const vd = fr.querySelector("video"); vd && vd.pause() };
    const ves = j => { k = Math.max(0, Math.min(vs.length - 1, j)); tA = 0; const vd0 = fr.querySelector("video"); if (vd0 && kVist === k) vd0.currentTime = 0; t0 = performance.now(); IN = inicis(); if (IN[k] != null) scr.scrollTop = IN[k]; mostra(); if (jugant) { const vd = fr.querySelector("video"); vd && vd.play().catch(() => { }) } };
    ov.addEventListener("click", e => {
      const b = e.target.closest("[data-a]"), l = e.target.closest(".anl[data-k]");
      if (l && !jugant && usades.length) { const bloc = l.closest(".anesc"); if (info(vs[k]).esc === bloc.dataset.esc) { vs[k].linia = +l.dataset.k; save(); IN = inicis(); scr.scrollTop = IN[k]; H.toast("El pla comença aquí") } else H.toast("Aquesta línia és d'una altra escena"); return }
      if (!b) return; const a = b.dataset.a;
      if (a === "tanca") { cancelAnimationFrame(raf); ov.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", tecla) }
      if (a === "play") jugant ? para() : juga();
      if (a === "ant") ves(k - 1); if (a === "seg") ves(k + 1); if (a === "salta") ves(+b.dataset.k);
    });
    const tecla = e => { if (e.key === " ") { e.preventDefault(); jugant ? para() : juga() } if (e.key === "ArrowRight") ves(k + 1); if (e.key === "ArrowLeft") ves(k - 1); if (e.key === "Escape") ov.querySelector('[data-a="tanca"]').click() };
    document.addEventListener("keydown", tecla);
    requestAnimationFrame(() => { IN = inicis(); ves(k) });
  }

  // ---------- PDF: 6 vinyetes per pàgina ----------
  function pdf() {
    const vs = doc.vin, pags = []; for (let i = 0; i < vs.length; i += 6) pags.push(vs.slice(i, i + 6));
    const r = rat();
    R.pdf(`<div style="font-family:Helvetica,Arial,sans-serif;color:#000">${pags.map((pg, n) => `<div style="${n ? "page-break-before:always;" : ""}padding:4mm">
      <div style="display:flex;justify-content:space-between;font-size:10pt;margin-bottom:4mm"><b>${E(doc.titulo || "Storyboard")}</b><span>${n + 1} / ${pags.length}</span></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6mm">${pg.map(v => { const f = info(v); return `<div style="break-inside:avoid">
        <div style="aspect-ratio:${r};border:1px solid #000;overflow:hidden;display:flex;align-items:center;justify-content:center">${v.img ? `<img src="${url(v.img)}" style="width:100%;height:100%;object-fit:cover">` : ""}</div>
        <div style="font-size:9pt;margin-top:2mm"><b>${f.esc ? E(f.esc) + "." : ""}${E(f.num || "")}</b>${f.escala ? " · " + E(f.escala) : ""} · ${E(v.dur ?? 3)} s</div>
        <div style="font-size:9pt;margin-top:1mm">${E(f.desc)}</div>${v.dial ? `<div style="font-size:9pt;margin-top:1mm;color:#444">«${E(v.dial)}»</div>` : ""}</div>` }).join("")}</div></div>`).join("")}</div>`, true);
  }

  // ---------- esdeveniments ----------
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b) return; if (b.tagName === "A") e.preventDefault(); const k = b.dataset.k, i = +b.dataset.i;
    if (k === "nou") return nou();
    if (k === "obre") return obre(b.dataset.id);
    if (k === "torna") return lista();
    if (!doc) return;
    if (k === "edita") return edita(i);
    if (k === "mira") return mira(0);
    if (k === "pdf") return pdf();
    if (k === "afegeix") { doc.vin.push({ id: uid(), dur: 3, esc: doc.vin.length ? info(doc.vin.at(-1)).esc : "" }); save(); pinta(); return }
    if (k === "torna-plans") { doc.ocults = []; sincronitza(); save(); pinta(); return }
    if (k === "esq" || k === "dre") { const j = k === "esq" ? i - 1 : i + 1;[doc.vin[i], doc.vin[j]] = [doc.vin[j], doc.vin[i]]; save(); pinta() }
    if (k === "treu") { if (!confirm("Esborrar aquesta vinyeta?" + (doc.vin[i].pla ? " (El pla del guió tècnic es queda.)" : ""))) return; const v = doc.vin.splice(i, 1)[0]; if (v.pla) doc.ocults = (doc.ocults || []).concat(v.pla);
      await save(); await canviaImg(v.img, ""); [v.img, v.dib, v.foto, v.video].filter(Boolean).forEach(id => H.api("DELETE", "archivo/" + id).catch(() => { })); pinta() }
  });
  el.addEventListener("change", async e => {
    const t = e.target; if (!doc) return;
    if (t.dataset.d) { doc[t.dataset.d] = t.value; if (t.dataset.d === "gt" || t.dataset.d === "desg") { await carrega(); if (t.dataset.d === "gt" && sincronitza()) H.toast("Vinyetes afegides per als plans nous") } save(); pinta() }
  });
  el.addEventListener("input", e => {
    const t = e.target; if (!doc) return; const i = +t.dataset.i, v = doc.vin[i];
    if (t.dataset.d === "titulo") { doc.titulo = t.value; save() }
    if (!v || !t.dataset.v) return;
    if (t.dataset.v === "dur") { if (t.value !== "" && +t.value > 0) { v.dur = +t.value; save() } }
    if (t.dataset.v === "dial") { v.dial = t.value; save() }
    if (t.dataset.v === "desc") { const x = plaDe(v); if (x) { x.p[info(v).camp] = t.value; GTD.mod = Date.now(); clearTimeout(t._g); t._g = setTimeout(() => H.put(GTD), 500) } else { v.desc = t.value; save() } }
  });
  window.addEventListener("hub-sec", e => { if (e.detail === "storyboard") { if (doc && !H.dePj(doc)) doc = null; doc ? obre(doc.id) : lista() } });
  window.SB = { obre, lista };
  if (!el.hidden) lista();
})();
