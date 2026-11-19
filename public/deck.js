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
    llista: { nom: "Llista de punts", camps: [["titol", "Títol", "text"], ["punts", "Un punt per línia", "area"]] },
    dades: { nom: "Fitxa / xifres", camps: [["titol", "Títol", "text"], ["items", "Dades (etiqueta i valor)", "items"]] },
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
.dk .pal{display:flex;flex:1;gap:0}.dk .pal div{flex:1;display:flex;align-items:flex-end;padding:24px;font-size:20px;font-family:'IBM Plex Mono',monospace}
.dk .cal{display:flex;flex-direction:column;gap:calc(22px*var(--fit,1))}.dk .cal .fs{display:grid;grid-template-columns:34% 1fr;align-items:center;gap:24px;font-size:calc(26px*var(--fl))}.dk .cal .bb{height:calc(36px*var(--fit,1));background:var(--ac);border-radius:3px}
/* variants per estil (també a l'interior, no només a la portada) */
.dk.th-editorial h2{font-size:calc(96px*var(--fit,1));letter-spacing:-.05em;line-height:.9}.dk.th-editorial .num{top:84px;bottom:auto}
.dk.th-cinema h2{letter-spacing:.06em;font-size:calc(52px*var(--fit,1))}.dk.th-cinema .p{padding-top:calc(var(--H)*.12)}.dk.th-cinema .num{color:#777}
.dk.th-tipografic h2{font-size:calc(120px*var(--fit,1));line-height:.84}.dk.th-tipografic .p::after{content:"";position:absolute;width:40px;height:40px;border-radius:50%;background:var(--ac);right:112px;top:96px}
.dk.th-analogic .im:not(.ph):not(.ct){border:14px solid #fbf6ec;box-shadow:0 6px 24px rgba(59,47,36,.18)}.dk.th-analogic h2{font-style:normal;letter-spacing:-.01em}
.dk.th-moodboard .grid{gap:8px}.dk.th-moodboard h2{font-size:calc(30px*var(--fit,1));letter-spacing:.16em;text-transform:uppercase;font-weight:500}.dk.th-moodboard .p{padding-top:64px}.dk.th-moodboard .it .im,.dk.th-moodboard .im:not(.ph){border-radius:0}.dk.th-moodboard p{max-width:1000px}
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
      case "llista": c = P(`<h2>${E(s.titol)}</h2><ul style="margin:0;padding-left:1.1em;max-width:1200px">${String(s.punts || "").split("\n").filter(x => x.trim()).map(x => `<li>${E(x.replace(/^[-•*]\s*/, ""))}</li>`).join("")}</ul>`); break;
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
      default: c = P("");
    }
    return wrap(c + (d.estil === "tipografic" && s.tipus !== "pagina" ? "" : "") + n);
    function wrap(inner) { return `<div lang="ca" class="dk th-${d.estil || "minim"}${t.franges ? " franges" : ""}${t.tt === "lowercase" ? " lc" : ""}" style="width:${w}px;height:${h}px;${vars}">${inner}</div>` }
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
    (root.classList && root.classList.contains("dk") ? [root] : [...root.querySelectorAll(".dk")]).forEach(dk => {
      const p = dk.querySelector(".p") || dk, blocs = [p, ...p.querySelectorAll("div")], txt = [...dk.querySelectorAll("h1,h2,p,li,b,.it span,.dad span")];
      const sobra = () => { if (blocs.some(x => x.scrollHeight > x.clientHeight + 3 || x.scrollWidth > x.clientWidth + 3)) return true; const r = dk.getBoundingClientRect(), k = r.width / dk.offsetWidth || 1; return txt.some(t => { const q = t.getBoundingClientRect(); return q.height && (q.top < r.top + 24 * k || q.bottom > r.bottom - 24 * k) }) };
      let f = 1; dk.style.setProperty("--fit", f);
      while (sobra() && f > .5) { f = Math.round((f - .06) * 100) / 100; dk.style.setProperty("--fit", f) }
    });
  }
  return { ajusta, W, FORMATS, FONTS, ESTILS, TIPUS, mida, ratio, tema, dibuixa, escalada, paleta, contrast, lum, injecta, E };
})();
