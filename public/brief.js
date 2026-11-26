// Briefing amb l'artista (projectes de tipus Videoclip): les preguntes de la reunió i les respostes, al Resum del projecte.
// Preguntes: doc `ajust:brief` {preg:[{id,t}]} (editables, iguals per a tots els videoclips; si no n'hi ha, DEF).
// Respostes: al projecte, `p.brief` {id de la pregunta: text}. Es desa mentre s'escriu, també sense connexió (sw.js).
window.BRIEF = (() => {
  const E = s => H.E(s);
  const DEF = [
    ["genere", "Gènere?"],
    ["canco", "De què va la cançó? Què vols que transmeti?"],
    ["refmus", "Referències de la música?"],
    ["refvc", "Videoclips que t'agradin?"],
    ["idea", "Tens alguna idea o imatge al cap?"],
    ["estetica", "Estètica: colors, roba, llocs que t'agradin?"],
    ["sortir", "Voleu sortir vosaltres? Us fa res sortir?"],
    ["format", "Format: horitzontal, vertical, versions curtes per a xarxes?"],
    ["material", "Material que tinguis (tant de llum com de so)"],
    ["aporta", "Què podeu aportar: llocs, amics, cotxes, roba…?"],
    ["presu", "Pressupost"],
    ["dates", "Dates? Aprox?"],
    ["llanc", "Quan surt la cançó?"],
    ["master", "Tens la cançó acabada (màster) per al playback?"],
    ["decideix", "Qui més decideix (mànager, segell)? Amb qui parlo?"]
  ].map(([id, t]) => ({ id, t }));
  async function doc() { const a = await H.col("ajust"); return a.find(x => x.id === "ajust:brief") }
  async function preguntes() { const d = await doc(); return d && Array.isArray(d.preg) ? d.preg : DEF }
  const respostes = (p, pr) => pr.filter(q => ((p.brief || {})[q.id] || "").trim()).length;

  // Targeta per al Resum del projecte
  function card(p, pr) {
    const r = p.brief || {}, n = respostes(p, pr);
    return `<div class="card" id="brief" style="grid-column:1/-1">
      <div class="ls" style="justify-content:space-between;align-items:baseline;margin:0"><h3 style="margin:0">Briefing amb l'artista</h3><span class="em">${n} de ${pr.length}</span></div>
      <div class="bfq">${pr.map(q => `<div><label for="bf-${E(q.id)}">${E(q.t)}</label><textarea id="bf-${E(q.id)}" data-bf="${E(q.id)}" rows="1">${E(r[q.id] || "")}</textarea></div>`).join("")}</div>
      <div class="ls" style="margin-top:14px"><button class="b2" data-bfk="copia">Copiar</button><button class="b2" data-bfk="edita">Editar les preguntes</button><button class="b2" data-bfk="pres">Al pressupost</button></div>
    </div>`;
  }
  const creix = t => { t.style.height = "auto"; t.style.height = t.scrollHeight + 2 + "px" };
  function ajusta(arrel) { (arrel || document).querySelectorAll("textarea[data-bf]").forEach(creix) }

  // Text per copiar (WhatsApp, correu, notes): pregunta i resposta; sense respostes, només les preguntes
  function text(p, pr) { const r = p.brief || {}; return (p.titulo ? p.titulo + "\n\n" : "") + pr.map(q => q.t + ((r[q.id] || "").trim() ? "\n" + r[q.id].trim() : "")).join("\n\n") }

  // Editor de preguntes: una fila per pregunta (cada una guarda el seu id, així en canviar el text no es perd cap resposta)
  const fila = q => `<div class="bfrow" data-id="${E(q.id)}"><input value="${E(q.t)}" placeholder="Pregunta"><button class="b2" data-bfk="amunt" title="Amunt" aria-label="Amunt">↑</button><button class="b2" data-bfk="avall" title="Avall" aria-label="Avall">↓</button><button class="b2" data-bfk="treu" title="Treure" aria-label="Treure">✕</button></div>`;
  let alDesar = null;
  async function editaPreguntes(fet) {
    const pr = await preguntes();
    H.sheet(`<h2>Preguntes del briefing</h2><p class="em" style="margin-top:0">Són les mateixes per a tots els videoclips. Pots canviar el text sense perdre les respostes que ja tens.</p>
      <div id="bfpreg">${pr.map(fila).join("")}</div>
      <button class="b2" data-bfk="afegeix" style="margin-top:4px">+ Afegir una pregunta</button>
      <div class="sfoot"><button class="b2" data-bfk="def">Tornar a les de sempre</button><button class="b" data-bfk="desa">Desar</button></div>`);
    alDesar = fet;
  }
  document.getElementById("hsh").addEventListener("click", async e => {
    const b = e.target.closest("[data-bfk]"), box = document.getElementById("bfpreg"); if (!b || !box) return;
    const k = b.dataset.bfk, r = b.closest(".bfrow");
    if (k === "amunt" && r.previousElementSibling) return r.previousElementSibling.before(r);
    if (k === "avall" && r.nextElementSibling) return r.nextElementSibling.after(r);
    if (k === "treu") return r.remove();
    if (k === "afegeix") { box.insertAdjacentHTML("beforeend", fila({ id: "q" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: "" })); return box.lastElementChild.querySelector("input").focus() }
    if (k === "def") { if (confirm("Tornar a les preguntes de sempre? Les que hagis afegit desapareixen de la llista (les respostes no s'esborren).")) box.innerHTML = DEF.map(fila).join(""); return }
    if (k !== "desa") return;
    const preg = [...box.querySelectorAll(".bfrow")].map(x => ({ id: x.dataset.id, t: x.querySelector("input").value.trim() })).filter(q => q.t);
    const d = (await doc()) || { id: "ajust:brief" }; d.preg = preg; await H.put(d, 1);
    H.cerrar(); H.toast("Preguntes desades"); alDesar && alDesar();
  });

  // Briefing → pressupost del projecte: el crea (partides de videoclip) si no n'hi ha, posa el que diu l'artista que hi ha
  // de pressupost com a font de finançament (id "brief", s'actualitza si es torna a passar) i el material i el que aporten a les notes.
  // la xifra més alta del text («entre 800 i 1.000» → 1000); «2k», «3 mil»; els anys sols (2026) no compten
  const xifra = t => { let m = 0; String(t || "").replace(/(\d[\d.,]*)(\s*(?:k|mil)(?![a-zà-ú]))?(\s*(?:€|eur))?/gi, (_, n, k, e) => { n = n.replace(/[.,]+$/, ""); if (!k && !e && /^(19|20)\d\d$/.test(n)) return; let s = n.replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", "."); const v = (+s || 0) * (k ? 1000 : 1); if (v > m) m = v }); return m };
  async function alPressupost(p) {
    if (!p) return; const r = p.brief || {}, id = "pres:" + p.id.split(":")[1];
    let d = (await H.col("pres")).find(x => x.id === id);
    if (!d) d = { id, proyecto: p.id, titulo: "Pressupost · " + (p.titulo || ""), partides: window.PRES ? PRES.plantilla(p.categoria) : [], fin: [], impr: 10 };
    const imp = xifra(r.presu), nota = [r.material && "Material: " + r.material.trim(), r.aporta && "Aporten: " + r.aporta.trim()].filter(Boolean).join(" · ");
    if (imp || (r.presu || "").trim()) {
      const f = (d.fin = d.fin || []).find(x => x.id === "brief") || (d.fin.push({ id: "brief", font: "Artista", tipus: "Altres", estat: "Previst" }), d.fin.at(-1));
      // si l'import o les notes s'han canviat a mà al pressupost, no es toquen
      if (imp && (!f.import || f.import === f.brImp)) { f.import = imp; f.brImp = imp }
      const nt = "Del briefing: " + (r.presu || "").trim(); if (!f.notes || f.notes === f.brNotes) { f.notes = nt; f.brNotes = nt }
    }
    if (nota) { const x = d.partides.find(y => y.brief) || (d.partides.push({ id: Math.random().toString(36).slice(2, 9), cap: "Material i lloguers", concepte: "Material de l'artista", brief: 1 }), d.partides.at(-1)); if (!x.notes || x.notes === x.brNotes) { x.notes = x.brNotes = nota.slice(0, 400) } }
    await H.put(d, 1);
    H.toast(imp ? `Pressupost de l'artista: ${imp.toLocaleString("ca-ES")} €` : (r.presu || nota) ? "Passat al pressupost" : "Encara no hi ha respostes de pressupost ni de material");
    window.HUB && HUB.obreProjecte(p.id, "pressupost");
  }
  // Ho fa servir projecte.js: desa en escriure, copia i edita
  function connecta(el, doc, pintar) {
    el.addEventListener("input", async e => {
      const t = e.target; if (!t.dataset || !t.dataset.bf) return; creix(t);
      const p = await doc(); if (!p) return;
      p.brief = Object.assign({}, p.brief, { [t.dataset.bf]: t.value });
      H.put(p);
      const pr = await preguntes(), c = el.querySelector("#brief .em"); if (c) c.textContent = respostes(p, pr) + " de " + pr.length;
    });
    el.addEventListener("click", async e => {
      const b = e.target.closest("[data-bfk]"); if (!b) return;
      if (b.dataset.bfk === "edita") return editaPreguntes(pintar);
      if (b.dataset.bfk === "pres") return alPressupost(await doc());
      if (b.dataset.bfk === "copia") {
        // el text es fa amb el que hi ha a la pantalla, sense esperes, perquè Safari ho compti com a part del toc
        const c = b.closest("#brief"), tit = (document.getElementById("stitle") || {}).textContent || "";
        const t = (tit ? tit + "\n\n" : "") + [...c.querySelectorAll("textarea[data-bf]")].map(x => { const l = c.querySelector(`label[for="${x.id}"]`).textContent, v = x.value.trim(); return l + (v ? "\n" + v : "") }).join("\n\n");
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(() => H.toast("Copiat"), () => H.toast("No s'ha pogut copiar"));
        else H.toast("No s'ha pogut copiar");
      }
    });
  }
  // és un videoclip? (el tipus es pot haver reanomenat: «Videoclips», «Vídeo musical»…; sense tipus, pel títol)
  const es = p => !!p && (/v[ií]deo ?clip|v[ií]deo musical|music video/i.test(p.categoria || "") || (!p.categoria && /v[ií]deo ?clip/i.test(p.titulo || "")));
  return { es, preguntes, card, ajusta, connecta, text, DEF };
})();
