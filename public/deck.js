// Decks: estils, formats i dibuix de diapositives (window.DK). El fa servir l'editor del hub i la pàgina pública /d/…
window.DK = (() => {
  const E = s => String(s ?? "").replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const W = 1600; // amplada base de totes les diapositives (px)

  // ---------- formats ----------
  const FORMATS = [["16:9", 16 / 9], ["2.39:1", 2.39], ["1.85:1", 1.85], ["4:3", 4 / 3], ["1:1", 1], ["4:5", 4 / 5], ["9:16", 9 / 16], ["A4 horitzontal", 297 / 210], ["A4 vertical", 210 / 297]];
  const ratio = d => { if (d.ratio === "propi") return Math.max(.3, Math.min(4, (+d.rw || 16) / (+d.rh || 9))); return (FORMATS.find(f => f[0] === d.ratio) || FORMATS[0])[1] };
  const mida = d => { const r = ratio(d), w = r >= 1 ? W : 1000; return [w, Math.round(w / r)] };

  // ---------- tipografies (Google Fonts + del sistema) ----------
  const FONTS = { "Helvetica": "Helvetica, Arial, sans-serif", "Inter": "'Inter', Helvetica, sans-serif", "Space Grotesk": "'Space Grotesk', Helvetica, sans-serif", "Playfair Display": "'Playfair Display', Georgia, serif", "DM Serif Display": "'DM Serif Display', Georgia, serif", "Georgia": "Georgia, 'Times New Roman', serif", "IBM Plex Mono": "'IBM Plex Mono', 'Courier New', monospace" };
  const GF = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&family=Space+Grotesk:wght@400;700&family=Playfair+Display:wght@400;700&family=DM+Serif+Display&family=IBM+Plex+Mono:wght@400;700&display=swap";

  // ---------- estils de base ----------
  const ESTILS = {
    minim: { nom: "Mínim blanc", bg: "#ffffff", fg: "#000000", mut: "#6e6e73", ac: "#000000", font: "Helvetica", tt: "lowercase", tw: 400, ts: 1, ls: "-0.02em" },
    cinema: { nom: "Cinema negre", bg: "#0b0b0b", fg: "#ffffff", mut: "#a1a1a6", ac: "#ffffff", font: "Helvetica", tt: "uppercase", tw: 700, ts: 1.1, ls: "-0.01em", franges: 1 },
    editorial: { nom: "Editorial", bg: "#f4f1ea", fg: "#1a1a1a", mut: "#6b6459", ac: "#1a1a1a", font: "Helvetica", tt: "lowercase", tw: 700, ts: 1.35, ls: "-0.045em", regla: 1 },
    moodboard: { nom: "Moodboard", bg: "#ffffff", fg: "#111111", mut: "#6e6e73", ac: "#111111", font: "Helvetica", tt: "none", tw: 700, ts: .95, ls: "-0.02em", mosaic: 1 },
    tipografic: { nom: "Tipogràfic", bg: "#e8e6e1", fg: "#111111", mut: "#55524d", ac: "#d93a1f", font: "Inter", tt: "uppercase", tw: 800, ts: 1.7, ls: "-0.05em", punt: 1 },
    analogic: { nom: "Analògic càlid", bg: "#efe6d6", fg: "#3b2f24", mut: "#7a6a58", ac: "#a8743f", font: "Georgia", tt: "lowercase", tw: 400, ts: 1, ls: "-0.01em" }
  };
  const tema = d => ({ ...ESTILS[d.estil] || ESTILS.minim, ...(d.tema || {}) });

  // ---------- tipus de diapositiva i els seus camps ----------
  // Cada camp: [clau, etiqueta, tipus] — tipus: text, area, img, imgs, items (llista de {nom, text, img}), colors, punts, url
  const TIPUS = {
    portada: { nom: "Portada", camps: [["titol", "Títol", "text"], ["subtitol", "Subtítol", "text"], ["peu", "Peu (autor, any…)", "text"], ["img", "Imatge", "img"]] },
    seccio: { nom: "Separador de secció", camps: [["titol", "Títol", "text"], ["num", "Número", "text"]] },
    text: { nom: "Text", camps: [["titol", "Títol", "text"], ["text", "Text", "area"]] },
    cita: { nom: "Cita gran", camps: [["text", "Cita", "area"], ["autor", "Autor", "text"]] },
    imatge: { nom: "Imatge a sang", camps: [["img", "Imatge", "img"], ["peu", "Peu", "text"]] },
    imatgetext: { nom: "Imatge + text", camps: [["titol", "Títol", "text"], ["text", "Text", "area"], ["img", "Imatge", "img"], ["costat", "Imatge a la dreta", "check"]] },
    moodboard: { nom: "Moodboard", camps: [["titol", "Títol", "text"], ["imgs", "Imatges (2 a 9)", "imgs"]] },
    personatges: { nom: "Personatges", camps: [["titol", "Títol", "text"], ["items", "Personatges", "items"]] },
    equip: { nom: "Equip", camps: [["titol", "Títol", "text"], ["items", "Persones (nom, rol, foto)", "items"]] },
    laurels: { nom: "Llorers (festivals i premis)", camps: [["titol", "Títol", "text"], ["items", "Festivals (nom i secció o premi)", "items"]] },
    llista: { nom: "Llista de punts", camps: [["titol", "Títol", "text"], ["punts", "Un punt per línia", "area"]] },
    dades: { nom: "Fitxa / xifres", camps: [["titol", "Títol", "text"], ["items", "Dades (etiqueta i valor)", "items"]] },
    fitxa: { nom: "Fitxa tècnica", camps: [["titol", "Títol", "text"], ["items", "Dades (etiqueta i valor)", "items"], ["espais", "Espais (nom i càmera)", "items"]] },
    paleta: { nom: "Paleta de color", camps: [["titol", "Títol", "text"], ["colors", "Colors (un per línia, #hex)", "area"], ["auto", "Treure-la de les imatges del dossier", "check"]] },
    calendari: { nom: "Calendari", camps: [["titol", "Títol", "text"], ["items", "Fases (nom i dates)", "items"]] },
    video: { nom: "Vídeo", camps: [["titol", "Títol", "text"], ["url", "Enllaç (Vimeo, YouTube…)", "text"], ["img", "Fotograma", "img"]] },
    contacte: { nom: "Contacte", camps: [["titol", "Títol", "text"], ["text", "Dades de contacte", "area"]] },
    pagina: { nom: "Pàgina importada", camps: [["img", "Pàgina", "img"]] }
  };

  // ---------- CSS comú (s'injecta un sol cop) ----------
  const CSS = `
.dk{position:relative;overflow:hidden;background:var(--bg);color:var(--fg);font-family:var(--ff);box-sizing:border-box;-webkit-font-smoothing:antialiased}
.dk *{box-sizing:border-box}.dk .p{position:absolute;inset:0;padding:96px 112px;display:flex;flex-direction:column}
.dk h1,.dk h2{margin:0;font-weight:var(--tw);text-transform:var(--tt);letter-spacing:var(--ls);line-height:.98;color:inherit;font-family:inherit}
.dk h1{font-size:calc(112px*var(--ts)*var(--fit,1))}.dk h2{font-size:calc(64px*var(--ts)*var(--fit,1));margin-bottom:calc(40px*var(--fit,1))}
.dk{--fl:max(var(--fit,1),.75)}.dk p,.dk li{font-size:calc(30px*var(--fl));line-height:1.45;margin:0 0 calc(18px*var(--fit,1));color:inherit}.dk .mut{color:var(--mut)}.dk .sm{font-size:calc(22px*var(--fl))}
.dk ul{list-style:none;padding:0;margin:0}.dk li{padding-left:1.1em;text-indent:-1.1em}.dk li::before{content:"—";display:inline-block;width:1.1em;text-indent:0;color:var(--mut)}
.dk.lc .sub,.dk.lc .dad span,.dk.lc .peu{text-transform:lowercase;letter-spacing:0}
.dk .im{background:#cfc8bd center/cover no-repeat}.dk .im.ct{background-size:contain;background-color:transparent}
.dk .ph{display:flex;align-items:center;justify-content:center;color:var(--mut);font-size:22px;border:2px dashed currentColor;opacity:.45}
.dk .num{position:absolute;right:112px;bottom:56px;font-size:20px;color:var(--mut);z-index:4}
.dk .peu{position:absolute;left:112px;bottom:56px;font-size:20px;color:var(--mut)}
.dk.th-editorial .p::before{content:"";position:absolute;left:112px;right:112px;top:64px;border-top:2px solid var(--fg)}
.dk.franges .fr{position:absolute;left:0;right:0;background:#000;z-index:3}
.dk .ac{color:var(--ac)}.dk .punt{position:absolute;width:48px;height:48px;border-radius:50%;background:var(--ac);right:112px;top:96px}
.dk .grid{display:grid;gap:16px;flex:1;min-height:0}.dk .grid>div{min-height:0}
.dk .items{display:grid;gap:40px;flex:1;align-content:start}.dk .it .im{aspect-ratio:1;border-radius:2px;margin-bottom:20px}
.dk .it .im{width:100%;aspect-ratio:4/3;max-height:calc(var(--H)*.36*var(--fit,1))}
.dk .it b{display:block;font-size:calc(30px*var(--fit,1))}.dk .it span{display:block;font-size:calc(24px*var(--fl));color:var(--mut);line-height:1.35;margin-top:6px}
.dk .dad{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:calc(48px*var(--fit,1)) 64px}.dk .dad b{display:block;font-size:calc(52px*var(--fit,1));font-weight:var(--tw);letter-spacing:-.02em;overflow-wrap:normal;hyphens:auto}.dk .dad span{font-size:calc(20px*var(--fl));color:var(--mut);text-transform:uppercase;letter-spacing:.08em}
.dk .ftx{display:grid;gap:calc(72px*var(--fit,1));flex:1;min-height:0;align-content:start}.dk .ftd{display:grid;grid-template-columns:1fr 1fr;gap:calc(36px*var(--fit,1)) 48px;align-content:start}.dk .ftd span{display:block;font-size:calc(20px*var(--fl));color:var(--mut);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}.dk .ftd b{display:block;font-size:calc(46px*var(--fit,1));font-weight:var(--tw);line-height:1.15;overflow-wrap:anywhere}.dk .fte{display:flex;flex-direction:column;gap:calc(28px*var(--fit,1))}.dk .fte>div{border-top:2px solid var(--fg);padding-top:calc(14px*var(--fit,1))}.dk .fte b{display:block;font-size:calc(38px*var(--fit,1));margin-bottom:8px}.dk .fte p{font-size:calc(28px*var(--fl));color:var(--mut);margin:0}
.dk .pal{display:flex;flex:1;gap:0}.dk .pal div{flex:1;display:flex;align-items:flex-end;padding:24px;font-size:20px;font-family:'IBM Plex Mono',monospace}
.dk .lau{display:grid;gap:calc(40px*var(--fit,1)) 48px;align-content:center;flex:1}.dk .lau>div{display:flex;align-items:center;justify-content:center;gap:6px}.dk .lb{height:calc(200px*var(--fit,1));flex:none;color:var(--fg)}.dk .lr{transform:scaleX(-1)}.dk .lt{text-align:center;max-width:300px;min-width:0;flex:0 1 300px;overflow-wrap:break-word}.dk .lt b{display:block;font-size:calc(34px*var(--fl));line-height:1.15;text-transform:var(--tt)}.dk .lt i{display:block;font-style:normal;font-weight:700;font-size:calc(16px*var(--fl));color:var(--fg);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}.dk .lt span{display:block;font-size:calc(19px*var(--fl));color:var(--mut);margin-top:6px;text-transform:uppercase;letter-spacing:.08em}
.dk .cal{display:flex;flex-direction:column;gap:calc(22px*var(--fit,1))}.dk .cal .fs{display:grid;grid-template-columns:34% 1fr;align-items:center;gap:24px;font-size:calc(26px*var(--fl))}.dk .cal .bb{height:calc(36px*var(--fit,1));background:var(--ac);border-radius:3px}
/* variants per estil (també a l'interior, no només a la portada) */
.dk.th-editorial h2{font-size:calc(96px*var(--fit,1));letter-spacing:-.05em;line-height:.9}.dk.th-editorial .num{top:84px;bottom:auto}
.dk.th-cinema h2{letter-spacing:.06em;font-size:calc(52px*var(--fit,1))}.dk.th-cinema .p{padding-top:calc(var(--H)*.12)}.dk.th-cinema .num{color:#777}
.dk.th-tipografic h2{font-size:calc(120px*var(--fit,1));line-height:.84}.dk.th-tipografic .p::after{content:"";position:absolute;width:40px;height:40px;border-radius:50%;background:var(--ac);right:112px;top:96px}
.dk.th-analogic .im:not(.ph):not(.ct){border:14px solid #fbf6ec;box-shadow:0 6px 24px rgba(59,47,36,.18)}.dk.th-analogic h2{font-style:normal;letter-spacing:-.01em}
.dk.th-moodboard .grid{gap:8px}.dk.th-moodboard h2{font-size:calc(30px*var(--fit,1));letter-spacing:.16em;text-transform:uppercase;font-weight:500}.dk.th-moodboard .p{padding-top:64px}.dk.th-moodboard .it .im,.dk.th-moodboard .im:not(.ph){border-radius:0}.dk.th-moodboard p{max-width:1000px}
.dk .el{position:absolute;box-sizing:border-box;margin:0}.dk .elt{white-space:pre-wrap;overflow-wrap:break-word}.dk .eli{overflow:hidden}.dk .elib{position:absolute;inset:0;background-repeat:no-repeat}
.dk .elph{display:flex;align-items:center;justify-content:center;border:2px dashed var(--mut);color:var(--mut);opacity:.6;font-size:22px;font-family:Helvetica,Arial,sans-serif}.dk .els svg{display:block;overflow:visible}
.dk .play{width:120px;height:120px;border-radius:50%;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}.dk .play::after{content:"";border-left:40px solid #fff;border-top:24px solid transparent;border-bottom:24px solid transparent;margin-left:10px}
`;
  function injecta() {
    if (document.getElementById("dk-css")) return;
    const st = document.createElement("style"); st.id = "dk-css"; st.textContent = CSS; document.head.appendChild(st);
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = GF; l.crossOrigin = "anonymous"; document.head.appendChild(l);
  }

  // ---------- dibuix ----------
  // o.img(id) → URL de la imatge (al hub /api/archivo/…, a la pàgina pública /api/public/arxiu/…)
  function dibuixa(d, s, o = {}) {
    injecta();
    const [w, h] = mida(d), t = tema(d), url = o.img || (id => "/api/archivo/" + id), vert = h > w;
    const TON = ["#cfc6b8", "#8d9aa6", "#b49a7c", "#6f7c6a", "#d9cfbf", "#4f5a63", "#a7a29a"]; let ti = 0;
    const im = (id, cls = "", st = "") => id ? `<div class="im ${cls}" style="background-image:url('${url(id)}');${st}"></div>` : o.mostra ? `<div class="im ${cls}" style="background:${TON[ti++ % TON.length]};${st}"></div>` : o.final ? `<div class="im ${cls}" style="${st};background:none"></div>` : `<div class="im ph ${cls}" style="${st}">imatge</div>`;
    const vars = `--bg:${t.bg};--fg:${t.fg};--mut:${t.mut};--ac:${t.ac};--ff:${FONTS[t.font] || FONTS.Helvetica};--tt:${t.tt};--tw:${t.tw};--ts:${t.ts * (vert ? .85 : 1)};--ls:${t.ls};--H:${h}px`;
    const n = o.n ? `<div class="num">${o.n}</div>` : "", pc = (s.titolPeu === false || !d.titol) ? "" : "";
    const frang = t.franges ? `<div class="fr" style="top:0;height:${Math.round(h * .09)}px"></div><div class="fr" style="bottom:0;height:${Math.round(h * .05)}px"></div>` : "";
    const P = (inner, extra = "") => `<div class="p" style="${extra}">${inner}</div>`;
    const tx = v => E(v || "").replace(/\n/g, "<br>");
    let c = "";
    switch (s.tipus) {
      case "portada":
        if (d.estil === "cinema") c = im(s.img, "", "position:absolute;inset:0") + `<div style="position:absolute;inset:0;background:linear-gradient(transparent 40%,rgba(0,0,0,.65))"></div>` + frang + P(`<div style="margin-top:auto;position:relative;z-index:4;padding-bottom:${Math.round(h * .05)}px"><h1>${E(s.titol)}</h1><p class="mut sub" style="margin-top:20px">${E(s.subtitol)}</p><p class="sm mut sub">${E(s.peu)}</p></div>`);
        else if (d.estil === "tipografic") c = `<div class="punt"></div>` + P(`<h1 style="font-size:calc(150px*var(--ts)*var(--fit,1));line-height:.82;max-width:85%">${E(s.titol)}</h1><div style="margin-top:auto;text-align:right"><p class="sm sub">${E(s.subtitol)}</p><p class="sm mut sub">${E(s.peu)}</p></div>`);
        else if (d.estil === "moodboard") { const al = (d._imgs || []).filter(x => x !== s.img), TB = ["#cfc6b8", "#8d9aa6", "#b49a7c", "#6f7c6a", "#d9cfbf", "#4f5a63"]; c = `<div style="position:absolute;inset:12px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:1fr 1fr;gap:8px">${[0, 1, 2, 3, 4, 5, 6].map(i => `<div style="${i === 2 ? "grid-row:span 2;" : ""}position:relative">${i === 2 ? im(s.img, "", "position:absolute;inset:0") : al[i > 2 ? i - 1 : i] ? im(al[i > 2 ? i - 1 : i], "", "position:absolute;inset:0") : `<div style="position:absolute;inset:0;background:${TB[i % 6]}"></div>`}${i === 2 ? `<div style="position:absolute;left:28px;right:28px;bottom:28px;color:#fff;z-index:2;text-shadow:0 1px 12px rgba(0,0,0,.35)"><h1 style="font-size:calc(64px*var(--ts)*var(--fit,1))">${E(s.titol)}</h1><p class="sm sub" style="margin-top:12px">${E(s.subtitol)}</p></div>` : ""}</div>`).join("")}</div>` }
        else if (d.estil === "editorial") c = P(`<div style="display:flex;justify-content:space-between;margin-top:8px" class="sm"><span>${String(o.n || 1).padStart(2, "0")}</span><span class="sub">${E(s.peu)}</span></div><div style="display:flex;gap:64px;flex:1;margin-top:48px;min-height:0;flex-direction:${vert ? "column" : "row"}"><div style="flex:1;display:flex;flex-direction:column;min-height:0"><h1 style="font-size:calc(150px*var(--ts)*var(--fit,1));line-height:.86">${E(s.titol)}</h1><p class="sub" style="margin-top:auto;padding-top:40px;max-width:520px">${E(s.subtitol)}</p></div>${im(s.img, "", `flex:0 0 ${vert ? "40%" : "42%"}`)}</div>`);
        else if (d.estil === "analogic") c = P(`<div style="display:flex;gap:80px;flex:1;min-height:0;align-items:stretch">${im(s.img, "", "flex:0 0 44%")}<div style="flex:1;display:flex;flex-direction:column;justify-content:center"><h1 style="font-size:calc(84px*var(--ts)*var(--fit,1))">${E(s.titol)}</h1><p class="sub" style="margin-top:32px;max-width:560px">${E(s.subtitol)}</p><p class="sm mut sub" style="margin-top:auto">${E(s.peu)}</p></div></div>`);
        else c = P(`<p class="sm sub">${E(s.peu)}</p><div style="display:flex;gap:80px;flex:1;min-height:0;align-items:flex-end;flex-direction:${vert ? "column-reverse" : "row"}"><div style="flex:1"><h1>${E(s.titol)}</h1><p class="mut sub" style="margin-top:24px">${E(s.subtitol)}</p></div>${im(s.img, "", vert ? "width:100%;flex:1" : "flex:0 0 36%;height:78%;align-self:flex-start")}</div>`);
        return wrap(c);
      case "seccio": c = P(`<div style="margin:auto 0"><p class="mut" style="font-size:40px">${E(s.num)}</p><h1>${E(s.titol)}</h1></div>`); break;
      case "text": c = P(`<h2>${E(s.titol)}</h2><div style="column-count:${vert ? 1 : (String(s.text || "").length > 900 ? 2 : 1)};column-gap:80px;max-width:${String(s.text || "").length > 900 || vert ? "100%" : "1050px"}">${String(s.text || "").split(/\n\s*\n/).map(p => `<p>${tx(p)}</p>`).join("")}</div>`); break;
      case "cita": c = P(`<div style="margin:auto 0;max-width:1200px"><p style="font-size:calc(60px*var(--ts)*var(--fit,1));line-height:1.15;letter-spacing:var(--ls)">«${tx(s.text)}»</p><p class="mut" style="margin-top:32px">${E(s.autor)}</p></div>`); break;
      case "imatge": c = im(s.img, "", "position:absolute;inset:0") + frang + (s.peu ? `<div class="peu" style="z-index:4;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.6)">${E(s.peu)}</div>` : ""); return wrap(c);
      case "imatgetext": c = P(`<div style="display:flex;gap:80px;flex:1;min-height:0;flex-direction:${vert ? "column" : s.costat ? "row" : "row-reverse"}">${im(s.img, "", `flex:0 0 ${vert ? "45%" : "48%"}`)}<div style="flex:1;display:flex;flex-direction:column;justify-content:center"><h2>${E(s.titol)}</h2>${String(s.text || "").split(/\n\s*\n/).map(p => `<p>${tx(p)}</p>`).join("")}</div></div>`); break;
      case "moodboard": {
        const l = (s.imgs || []).slice(0, 9), k = Math.max(l.length, 2), cols = vert ? 2 : k <= 2 ? 2 : k <= 4 ? 2 : k <= 6 ? 3 : 3, rows = Math.ceil(k / cols);
        c = P(`${s.titol ? `<h2>${E(s.titol)}</h2>` : ""}<div class="grid" style="grid-template-columns:repeat(${vert ? 2 : k === 3 ? 3 : k === 4 ? 4 : cols},1fr);grid-template-rows:repeat(${vert ? Math.ceil(k / 2) : k <= 4 ? 1 : rows},1fr)">${(l.length ? l : [null, null]).map(id => im(id)).join("")}</div>`, s.titol ? "" : "padding:16px"); break;
      }
      case "personatges": case "equip": {
        const l = s.items || [], k = Math.max(1, l.length), cols = Math.min(vert ? 2 : 4, k);
        c = P(`<h2>${E(s.titol)}</h2><div class="items" style="grid-template-columns:repeat(${cols},1fr)">${l.map(x => `<div class="it">${s.tipus === "equip" || x.img ? im(x.img, "", s.tipus === "equip" ? "border-radius:50%;width:70%" : "") : ""}<b>${E(x.nom)}</b><span>${tx(x.text)}</span></div>`).join("")}</div>`); break;
      }
      case "laurels": {
        // branca de llorer dibuixada (fulles en arc); la dreta és la mateixa girada
        // branca de llorer: arc a l'esquerra (de baix a dalt) amb fulles alternes; la dreta és la mateixa girada
        const N = 8, cx = 62, cy = 60, r = 46, pt = t => { const a = (250 - 135 * t) * Math.PI / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a), a] };
        const fulles = Array.from({ length: N }, (_, i) => { const t = (i + .6) / N, [x, y, a] = pt(t), sgn = i % 2 ? 1 : -1, tang = -(a * 180 / Math.PI) + 180, rot = tang + sgn * 38, sz = 1 - t * .35; return `<ellipse cx="${(x + sgn * 4 * Math.cos(a)).toFixed(1)}" cy="${(y - sgn * 4 * Math.sin(a)).toFixed(1)}" rx="${(3.6 * sz).toFixed(1)}" ry="${(9 * sz).toFixed(1)}" transform="rotate(${rot.toFixed(0)} ${(x + sgn * 4 * Math.cos(a)).toFixed(1)} ${(y - sgn * 4 * Math.sin(a)).toFixed(1)})"/>` }).join("");
        const [x0, y0] = pt(0), [x1, y1] = pt(1);
        const br = `<svg viewBox="0 0 50 112" class="lb"><path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="currentColor" stroke-width="1.6"/><g fill="currentColor">${fulles}</g></svg>`;
        const ls = s.items || [], cols = ls.length > 6 ? 4 : ls.length === 4 ? 2 : ls.length > 2 ? 3 : Math.max(ls.length, 1);
        c = P(`${s.titol ? `<h2>${E(s.titol)}</h2>` : ""}<div class="lau" style="grid-template-columns:repeat(${cols},1fr)">${ls.map(x => `<div>${br}<div class="lt">${x.premi || /premi|millor|mejor|best|award|guanyador|ganador|winner|menció|mención|biznaga|goya|gaudí/i.test(x.text || "") ? `<i>${E(String(x.text).split(" · ")[0])}</i><b>${E(x.nom)}</b><span>${E(String(x.text).split(" · ").slice(1).join(" · "))}</span>` : `<b>${E(x.nom)}</b><span>${String(x.text || "").split(" · ").map(t => `<span style="white-space:nowrap;display:inline">${E(t)}</span>`).join(" · ")}</span>`}</div>${br.replace('class="lb"', 'class="lb lr"')}</div>`).join("")}</div>`); break;
      }
      case "llista": c = P(`<h2>${E(s.titol)}</h2><ul style="margin:0;padding-left:1.1em;max-width:1200px">${String(s.punts || "").split("\n").filter(x => x.trim()).map(x => `<li>${E(x.replace(/^[-•*]\s*/, ""))}</li>`).join("")}</ul>`); break;
      case "fitxa": { const es = (s.espais || []).filter(x => x.nom || x.text), ds = (s.items || []).filter(x => x.nom || x.text);
        c = P(`<h2>${E(s.titol)}</h2><div class="ftx" style="grid-template-columns:${es.length && ds.length && !vert ? "minmax(0,1fr) minmax(0,1.25fr)" : "1fr"}">${ds.length ? `<div class="ftd">${ds.map(x => `<div><span>${E(x.nom)}</span><b>${E(x.text)}</b></div>`).join("")}</div>` : ""}${es.length ? `<div class="fte">${es.map(x => `<div><b>${E(x.nom)}</b><p>${tx(x.text)}</p></div>`).join("")}</div>` : ""}</div>`); break }
      case "dades": c = P(`<h2>${E(s.titol)}</h2><div class="dad">${(s.items || []).map(x => `<div><span>${E(x.nom)}</span><b>${E(x.text)}</b></div>`).join("")}</div>`); break;
      case "paleta": {
        const cols = (s.auto && d._pal && d._pal.length ? d._pal : String(s.colors || "").split(/[\n,\s]+/).filter(x => /^#?[0-9a-f]{3,8}$/i.test(x)).map(x => (x[0] === "#" ? x : "#" + x).toLowerCase())).filter((x, i, a) => a.indexOf(x) === i).slice(0, 8);
        c = P(`${s.titol ? `<h2>${E(s.titol)}</h2>` : ""}<div class="pal">${(cols.length ? cols : ["#cfc8bd", "#8d9aa6", "#3b2f24"]).map(x => `<div style="background:${E(x)};color:${lum(x) > .5 ? "#000" : "#fff"}">${E(x.toUpperCase())}</div>`).join("")}</div>`); break;
      }
      case "calendari": {
        const l = (s.items || []).map(x => { const m = String(x.text || "").match(/\d{4}-\d{2}-\d{2}/g) || [], a = x.a || m[0], b = x.b || m[1] || a; return { ...x, a, b: b && a && b < a ? a : b } }), ds = l.filter(x => x.a);
        const a = ds.length ? ds.reduce((m, x) => x.a < m ? x.a : m, ds[0].a) : null, b = ds.length ? ds.reduce((m, x) => x.b > m ? x.b : m, ds[0].b) : null, tot = a ? Math.max(1, (new Date(b) - new Date(a)) / 864e5 + 1) : 1;
        c = P(`<h2>${E(s.titol)}</h2><div class="cal">${l.map(x => `<div class="fs"><span>${E(x.nom)}</span><div style="position:relative;height:calc(36px*var(--fit,1))">${x.a ? `<div class="bb" style="position:absolute;left:${(new Date(x.a) - new Date(a)) / 864e5 / tot * 100}%;width:${Math.max(1.5, ((new Date(x.b) - new Date(x.a)) / 864e5 + 1) / tot * 100)}%;top:0;bottom:0"></div>` : `<span class="mut sm">${E(x.text)}</span>`}</div></div>`).join("")}</div>${a ? `<p class="sm mut" style="margin-top:auto;padding-top:calc(24px*var(--fit,1))">${new Date(a).toLocaleDateString("ca-ES", { month: "long", year: "numeric" })} — ${new Date(b).toLocaleDateString("ca-ES", { month: "long", year: "numeric" })}</p>` : ""}`); break;
      }
      case "video": c = P(`${s.titol ? `<h2>${E(s.titol)}</h2>` : ""}<div style="flex:1;position:relative;min-height:0">${im(s.img, "", "position:absolute;inset:0")}<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div class="play"></div></div></div>${s.url ? `<p class="sm mut" style="margin-top:20px"><a href="${E(/^https?:\/\//.test(s.url) ? s.url : /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(s.url) ? "https://" + s.url : "#")}" target="_blank" rel="noopener" style="color:inherit">${E(s.url.replace(/^https?:\/\/(www\.)?/, ""))}</a></p>` : ""}`); break;
      case "contacte": c = P(`<div style="margin:auto 0"><h1 style="font-size:calc(96px*var(--ts)*var(--fit,1))">${E(s.titol)}</h1><p style="margin-top:40px;font-size:calc(36px*var(--fit,1));line-height:1.5">${tx(s.text)}</p></div>`); break;
      case "pagina": c = im(s.img, "ct", "position:absolute;inset:0;background-color:transparent"); return wrap(c, 1);
      case "lliure": return `<div lang="ca" class="dk ll" style="width:${w}px;height:${h}px;${vars};background:${E(s.bg || t.bg)}">${(s.els || []).map(e => elHTML(e, { ...o, url })).join("")}</div>`;
      default: c = P("");
    }
    return wrap(c + (d.estil === "tipografic" && s.tipus !== "pagina" ? "" : "") + n);
    function wrap(inner) { return `<div lang="ca" class="dk th-${d.estil || "minim"}${t.franges ? " franges" : ""}${t.tt === "lowercase" ? " lc" : ""}" style="width:${w}px;height:${h}px;${vars}">${inner}</div>` }
  }

  // ---------- diapositiva lliure (tipus «lliure»): elements posats a mà, com a Canva ----------
  // Element: {id, t: text|num|img|forma|svg, x, y, w, h, r (graus), op (0–1), lk (bloquejat)}
  //  text/num: text, ff (font-family CSS), fs, fw, it, col, al, tt, ls (px), lh (× fs), sh (text-shadow), cols, href
  //  img: img (id), fit (cover|contain), px, py (% enquadrament), zm (zoom ≥ 1), rad, bd (vora CSS), sh (ombra CSS)
  //  forma: bg (color o degradat CSS), rad, bd · svg: svg (codi), col
  const cssc = v => String(v ?? "").replace(/[;"<>{}]/g, "");
  function elHTML(e, o = {}) {
    const url = o.url || (id => "/api/archivo/" + id), tx = e.t === "text" || e.t === "num";
    const b = `left:${+e.x || 0}px;top:${+e.y || 0}px;width:${Math.max(1, +e.w || 1)}px;${tx ? "" : `height:${Math.max(1, +e.h || 1)}px;`}${e.r ? `transform:rotate(${+e.r}deg);` : ""}${e.op != null && e.op < 1 ? `opacity:${+e.op};` : ""}`;
    const id = `data-e="${E(e.id)}"`;
    if (tx) {
      const st = `${b}font-family:${cssc(e.ff) || "inherit"};font-size:${+e.fs || 30}px;font-weight:${cssc(e.fw) || 400};font-style:${e.it ? "italic" : "normal"};color:${cssc(e.col) || "inherit"};text-align:${cssc(e.al) || "left"};text-transform:${cssc(e.tt) || "none"};letter-spacing:${+e.ls || 0}px;${e.nw ? "white-space:pre;" : ""}line-height:${+e.lh || 1.2};${e.sh ? `text-shadow:${cssc(e.sh)};` : ""}${+e.cols > 1 ? `column-count:${+e.cols};column-gap:${Math.round((+e.fs || 30) * 2.5)}px;` : ""}`;
      const c = e.t === "num" ? E(o.n || "") : E(e.text || "");
      return `<div class="el elt" ${id} style="${st}">${e.href && o.final ? `<a href="${E(e.href)}" target="_blank" rel="noopener" style="color:inherit">${c}</a>` : c}</div>`;
    }
    if (e.t === "img") {
      const rad = e.rad ? `border-radius:${cssc(e.rad)}${/^\d+(\.\d+)?$/.test(e.rad) ? "px" : ""};` : "", bd = e.bd ? `border:${cssc(e.bd)};` : "", sh = e.sh ? `box-shadow:${cssc(e.sh)};` : "";
      if (!e.img) return o.final ? `<div class="el" ${id} style="${b}"></div>` : `<div class="el eli elph" ${id} style="${b}${rad}">imatge</div>`;
      const px = e.px ?? 50, py = e.py ?? 50, zm = Math.max(1, +e.zm || 1);
      return `<div class="el eli" ${id} style="${b}${rad}${bd}${sh}"><div class="elib" style="background-image:url('${url(e.img)}');background-size:${e.fit === "contain" ? "contain" : "cover"};background-position:${px}% ${py}%;${zm > 1 ? `transform:scale(${zm});transform-origin:${px}% ${py}%;` : ""}"></div></div>`;
    }
    if (e.t === "forma") return `<div class="el" ${id} style="${b}background:${cssc(e.bg) || "#000"};${e.rad ? `border-radius:${cssc(e.rad)}${/^\d+(\.\d+)?$/.test(e.rad) ? "px" : ""};` : ""}${e.bd ? `border:${cssc(e.bd)};` : ""}"></div>`;
    if (e.t === "svg") return `<div class="el els" ${id} style="${b}color:${cssc(e.col) || "inherit"}">${String(e.svg || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+="[^"]*"/gi, "")}</div>`;
    return "";
  }

  // Converteix una diapositiva de maqueta en una de lliure: la dibuixa fora de pantalla i en mesura cada text, imatge i forma.
  async function aLliure(d, s, o = {}) {
    injecta();
    const box = document.createElement("div"); box.style.cssText = "position:fixed;left:-30000px;top:0;pointer-events:none"; document.body.appendChild(box);
    try {
      box.innerHTML = dibuixa(d, s, { img: o.img, n: o.n || 1 });
      try { await document.fonts.ready } catch (e) { } await new Promise(r => setTimeout(r, 40)); ajusta(box);
      const root = box.firstElementChild, R0 = root.getBoundingClientRect(), els = [], t = tema(d), cs = (n, p) => getComputedStyle(n, p);
      const nid = () => Math.random().toString(36).slice(2, 9), rd = v => Math.round(v * 10) / 10;
      const rc = r => ({ x: rd(r.left - R0.left), y: rd(r.top - R0.top), w: rd(r.width), h: rd(r.height) });
      const vis = r => r.w > .5 && r.h > .5 && r.x < R0.width && r.y < R0.height && r.x + r.w > 0 && r.y + r.h > 0;
      const color = c => c && !/rgba\([^)]*,\s*0\)|transparent/.test(c);
      const idDe = u => (String(u).match(/archivo\/([^/?#"')]+)/) || [])[1] || "";
      const txt = n => { let out = ""; n.childNodes.forEach(c => { if (c.nodeType === 3) out += c.nodeValue.replace(/\s+/g, " "); else if (c.nodeName === "BR") out += "\n"; else if (c.nodeType === 1) { const bl = /block|flex|grid|list-item/.test(cs(c).display); if (bl && out && !out.endsWith("\n")) out += "\n"; out += txt(c); if (bl) out += "\n" } }); return out };
      const neta = s => s.split("\n").map(x => x.replace(/\s+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
      const rad = st => { const v = parseFloat(st.borderTopLeftRadius) || 0; return /%/.test(st.borderTopLeftRadius) ? st.borderTopLeftRadius : v };
      const vores = (st, r, z) => { // vores d'un sol costat (p. ex. la línia de dalt) → formes primes
        const tot = ["Top", "Right", "Bottom", "Left"].map(k => [k, parseFloat(st["border" + k + "Width"]) || 0, st["border" + k + "Style"], st["border" + k + "Color"]]);
        if (tot.every(x => x[1] === tot[0][1] && x[2] === tot[0][2] && x[3] === tot[0][3]) && tot[0][1]) return `${tot[0][1]}px ${tot[0][2]} ${tot[0][3]}`;
        tot.forEach(([k, wv, sv, cv]) => { if (!wv || sv === "none" || !color(cv)) return; const f = { id: nid(), t: "forma", bg: cv, x: r.x, y: r.y, w: r.w, h: r.h }; if (k === "Top") f.h = wv; if (k === "Bottom") { f.y = r.y + r.h - wv; f.h = wv } if (k === "Left") f.w = wv; if (k === "Right") { f.x = r.x + r.w - wv; f.w = wv } z.push(f) });
        return "";
      };
      const pseudo = (n, which) => { // ::before / ::after posats en absolut (línia de l'estil Editorial, punt del Tipogràfic)
        const p = cs(n, which); if (!p || p.content === "none" || p.content === "normal" || p.position !== "absolute") return;
        const R = n.getBoundingClientRect(), w = parseFloat(p.width) || 0, h = parseFloat(p.height) || 0, bt = parseFloat(p.borderTopWidth) || 0;
        let x = parseFloat(p.left), y = parseFloat(p.top); if (isNaN(x)) x = R.width - (parseFloat(p.right) || 0) - w; if (isNaN(y)) y = R.height - (parseFloat(p.bottom) || 0) - h;
        const f = { id: nid(), t: "forma", x: rd(R.left - R0.left + x), y: rd(R.top - R0.top + y), w: rd(w), h: rd(h || bt), bg: color(p.backgroundColor) ? p.backgroundColor : p.borderTopColor };
        if (rad(p)) f.rad = rad(p); if (f.w > .5 && f.h > .5) els.push(f);
      };
      const walk = n => {
        for (const c of n.children) {
          const st = cs(c); if (st.display === "none" || st.visibility === "hidden" || +st.opacity === 0) continue;
          const r = rc(c.getBoundingClientRect());
          if (c.tagName.toLowerCase() === "svg") { if (vis(r)) { const gira = /matrix\(-1/.test(st.transform); els.push({ id: nid(), t: "svg", ...r, col: st.color, svg: c.outerHTML.replace(/\sclass="[^"]*"/, "").replace(/<svg/, `<svg width="100%" height="100%" preserveAspectRatio="none"${gira ? ' style="transform:scaleX(-1)"' : ""}`) }) } continue }
          if (c.classList.contains("im")) {
            if (!vis(r)) continue; const u = (st.backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1];
            const e = { id: nid(), t: "img", ...r, img: u ? idDe(u) : "", fit: st.backgroundSize === "contain" ? "contain" : "cover" };
            if (rad(st)) e.rad = rad(st); const bd = vores(st, r, []); if (bd) e.bd = bd; if (st.boxShadow && st.boxShadow !== "none") e.sh = st.boxShadow;
            if (!u && !c.classList.contains("ph") && color(st.backgroundColor)) { els.push({ id: e.id, t: "forma", ...r, bg: st.backgroundColor }); continue }
            els.push(e); continue;
          }
          // fons de color o degradat → forma (abans que el que porta a dins)
          const grad = /gradient/.test(st.backgroundImage);
          if (vis(r) && (color(st.backgroundColor) || grad)) { const f = { id: nid(), t: "forma", ...r, bg: grad ? st.backgroundImage : st.backgroundColor }; if (rad(st)) f.rad = rad(st); els.push(f) }
          if (vis(r)) { const z = []; const bd = vores(st, r, z); if (bd) els.push({ id: nid(), t: "forma", ...r, bg: "transparent", bd, ...(rad(st) ? { rad: rad(st) } : {}) }); els.push(...z) }
          pseudo(c, "::before");
          const directe = [...c.childNodes].some(x => x.nodeType === 3 && x.nodeValue.trim()), cols = +st.columnCount > 1;
          if (c.classList.contains("num") || directe || cols) {
            const fs = parseFloat(st.fontSize) || 30, lhp = st.lineHeight === "normal" ? null : parseFloat(st.lineHeight);
            let text = neta(txt(c)); if (c.tagName === "LI") text = "— " + text;
            if (!text && !c.classList.contains("num")) continue;
            const rg = document.createRange(); rg.selectNodeContents(c); const rr = rg.getBoundingClientRect(), r1 = [...rg.getClientRects()][0] || rr;
            const pad = ["Top", "Right", "Bottom", "Left"].some(k => parseFloat(st["padding" + k])), li = c.tagName === "LI", bloc = li || (/block|flex|grid/.test(st.display) && !pad && !color(st.backgroundColor) && !parseFloat(st.textIndent));
            const unaLinia = rr.height < (lhp || r1.height) * 1.5;
            let g; if (bloc) g = { ...r, w: rd(r.w + (unaLinia ? Math.max(6, fs * .4) : 2)) }; else { const lh = lhp || r1.height, x = rc(rr); g = { x: x.x, y: rd(x.y - Math.max(0, (lh - r1.height) / 2)), w: rd(x.w + Math.max(6, fs * .4)), h: x.h } }
            const e = { id: nid(), t: c.classList.contains("num") ? "num" : "text", ...g, text, ff: st.fontFamily, fs: rd(fs), fw: st.fontWeight, col: st.color, al: st.textAlign === "start" ? "left" : st.textAlign === "end" ? "right" : st.textAlign, tt: st.textTransform, ls: st.letterSpacing === "normal" ? 0 : rd(parseFloat(st.letterSpacing)), lh: lhp ? Math.round(lhp / fs * 100) / 100 : 1.2 };
            if (unaLinia && !cols) e.nw = 1; if (st.fontStyle === "italic") e.it = 1; if (st.textShadow && st.textShadow !== "none") e.sh = st.textShadow; if (cols) e.cols = +st.columnCount;
            const a = c.tagName === "A" ? c : c.querySelector("a"); if (a && a.getAttribute("href") && a.getAttribute("href") !== "#") e.href = a.getAttribute("href");
            if (e.t === "num") e.text = "";
            if (vis(g) || e.t === "num") els.push(e);
          } else walk(c);
          pseudo(c, "::after");
        }
      };
      walk(root);
      const { orig, ...net } = s;
      return { id: s.id, tipus: "lliure", bg: t.bg, els, orig: JSON.parse(JSON.stringify(net)), ...(s.amaga ? { amaga: true } : {}) };
    } finally { box.remove() }
  }
  function lum(hex) { const h = String(hex).replace("#", ""), f = h.length === 3 ? h.split("").map(x => x + x).join("") : h.slice(0, 6), [r, g, b] = [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b }
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) };

  // Mostra una diapositiva escalada dins d'un contenidor de l'amplada donada
  function escalada(d, s, ample, o) { const [w, h] = mida(d), k = ample / w; return `<div class="dkw" style="width:${ample}px;height:${Math.round(h * k)}px;overflow:hidden;position:relative"><div style="transform:scale(${k});transform-origin:0 0;position:absolute;top:0;left:0">${dibuixa(d, s, o)}</div></div>` }

  // Paleta automàtica a partir d'imatges (quantització simple)
  async function paleta(urls, n = 6) {
    const px = [];
    for (const u of urls.slice(0, 12)) {
      try { const im = new Image(); im.crossOrigin = "anonymous"; im.src = u; await im.decode(); const c = document.createElement("canvas"); c.width = 48; c.height = 48; const x = c.getContext("2d"); x.drawImage(im, 0, 0, 48, 48); const dt = x.getImageData(0, 0, 48, 48).data; for (let i = 0; i < dt.length; i += 16) px.push([dt[i], dt[i + 1], dt[i + 2]]) } catch (e) { }
    }
    if (!px.length) return [];
    let cen = px.filter((_, i) => i % Math.ceil(px.length / n) === 0).slice(0, n);
    for (let it = 0; it < 8; it++) { const g = cen.map(() => [0, 0, 0, 0]); px.forEach(p => { let b = 0, bd = 1e9; cen.forEach((c, i) => { const dd = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2; if (dd < bd) { bd = dd; b = i } }); g[b][0] += p[0]; g[b][1] += p[1]; g[b][2] += p[2]; g[b][3]++ }); cen = g.map((x, i) => x[3] ? [x[0] / x[3], x[1] / x[3], x[2] / x[3]] : cen[i]) }
    const u = []; cen.forEach(c => { if (!u.some(x => Math.hypot(x[0] - c[0], x[1] - c[1], x[2] - c[2]) < 28)) u.push(c) });
    return u.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2])).map(c => "#" + c.map(v => Math.round(v).toString(16).padStart(2, "0")).join(""));
  }
  // Redueix la mida del text (variable --fit) fins que tot hi cap. Es crida després d'inserir les diapositives al DOM.
  function ajusta(root) {
    (root.classList && root.classList.contains("dk") ? [root] : [...root.querySelectorAll(".dk")]).filter(dk => !dk.classList.contains("ll")).forEach(dk => {
      const p = dk.querySelector(".p") || dk, blocs = [p, ...p.querySelectorAll("div")], txt = [...dk.querySelectorAll("h1,h2,p,li,b,.it span,.dad span")];
      const sobra = () => { if (blocs.some(x => x.scrollHeight > x.clientHeight + 3 || x.scrollWidth > x.clientWidth + 3)) return true; const r = dk.getBoundingClientRect(), k = r.width / dk.offsetWidth || 1; return txt.some(t => { const q = t.getBoundingClientRect(); return q.height && (q.top < r.top + 24 * k || q.bottom > r.bottom - 24 * k) }) };
      let f = 1; dk.style.setProperty("--fit", f);
      while (sobra() && f > .5) { f = Math.round((f - .06) * 100) / 100; dk.style.setProperty("--fit", f) }
    });
  }
  return { ajusta, W, FORMATS, FONTS, ESTILS, TIPUS, mida, ratio, tema, dibuixa, escalada, paleta, contrast, lum, injecta, E, elHTML, aLliure };
})();
