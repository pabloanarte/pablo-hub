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
      <div class="ls" style="margin-top:14px"><button class="b2" data-bfk="copia">Copiar</button><button class="b2" data-bfk="edita">Editar les preguntes</button></div>
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
