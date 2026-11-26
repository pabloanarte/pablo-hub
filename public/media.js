// Imatges i vídeos de Recce i Referències (window.MED).
// Al hub es desa una còpia lleugera (imatge reduïda a 1600 px, JPEG; fotograma dels vídeos) al magatzem ARCHIVOS.
// L'original va al Drive del compte de mitjans, a través del pont del Drive (pont-drive.gs), si està connectat.
// Si el Drive no està connectat, el vídeo es desa al hub (fins a 25 MB) i la foto, reduïda.
window.MED = (() => {
  const E = s => String(s ?? "").replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const url = id => "/api/archivo/" + id;
  const MAXD = 35 * 1024 * 1024; // el que es pot enviar al Drive des del hub (més gran: directament al Drive)

  // ---------- Drive ----------
  let EST = null, eT = 0;
  async function drive(force) { if (EST && !force && Date.now() - eT < 60000) return EST; try { EST = await H.api("GET", "drive/estat"); eT = Date.now() } catch (e) { EST = EST || { connectat: false } } return EST }
  const b64 = f => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = ko; r.readAsDataURL(f) });

  // ---------- còpia lleugera ----------
  const carregaImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src });
  async function redueix(file, max = 1600) {
    const u = URL.createObjectURL(file);
    try {
      const im = await carregaImg(u), k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      return { blob: await new Promise(r => c.toBlob(r, "image/jpeg", .86)), w: im.naturalWidth, h: im.naturalHeight };
    } finally { URL.revokeObjectURL(u) }
  }
  // fotograma d'un vídeo (al segon 1 o a la meitat si és més curt)
  async function fotograma(file) {
    const u = URL.createObjectURL(file), v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = u;
    try {
      await new Promise((ok, ko) => { v.onloadedmetadata = ok; v.onerror = ko; setTimeout(ko, 15000) });
      v.currentTime = Math.min(1, (v.duration || 2) / 2); await new Promise((ok, ko) => { v.onseeked = ok; setTimeout(ok, 4000) });
      const k = Math.min(1, 1600 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement("canvas"); c.width = Math.round(v.videoWidth * k) || 1280; c.height = Math.round(v.videoHeight * k) || 720;
      c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
      return { blob: await new Promise(r => c.toBlob(r, "image/jpeg", .84)), dur: Math.round(v.duration || 0) };
    } catch (e) { return null } finally { URL.revokeObjectURL(u) }
  }
  const pujaHub = (blob, nom) => H.api("POST", "archivo?nombre=" + encodeURIComponent(nom), blob instanceof File ? blob : new File([blob], nom, { type: blob.type || "image/jpeg" }));

  // Puja un arxiu: còpia lleugera al hub i original al Drive (si n'hi ha). desti = {tipus:"recce"|"ref", proj, lloc}
  // Torna {img, video?, tipus:"Foto"|"Vídeo", nom, drive?:{id,url}, w, h, dur} o null
  async function puja(file, desti) {
    const esVideo = /^video\//.test(file.type) || /\.(mov|mp4|m4v|avi|mkv)$/i.test(file.name), esImg = /^image\//.test(file.type) || /\.(jpe?g|png|heic|webp|tiff?)$/i.test(file.name);
    if (!esVideo && !esImg) { H.toast(file.name + ": només fotos o vídeos"); return null }
    const d = await drive(), o = { nom: file.name, tipus: esVideo ? "Vídeo" : "Foto", data: H.today() };
    // 1) còpia lleugera
    try {
      if (esVideo) { const f = await fotograma(file); if (f) { o.img = (await pujaHub(f.blob, file.name.replace(/\.\w+$/, "") + ".jpg")).id; o.dur = f.dur } }
      else { let r = null; try { r = await redueix(file) } catch (e) { } if (r) { o.img = (await pujaHub(r.blob, file.name.replace(/\.\w+$/, "") + ".jpg")).id; o.w = r.w; o.h = r.h } else if (file.size <= 25 * 1024 * 1024) o.img = (await pujaHub(file, file.name)).id }
    } catch (e) { if (e && e.offline) { H.toast("Sense connexió: per pujar fotos cal internet"); return null } }
    // 2) original
    if (d.connectat && file.size <= MAXD) {
      try { const r = await H.api("POST", "drive/puja", { tipus: desti.tipus, proj: desti.proj || "", lloc: desti.lloc || "", nom: file.name, mime: file.type || "application/octet-stream", b64: await b64(file) }); if (r && r.id) o.drive = { id: r.id, url: r.url } } catch (e) { }
    }
    if (esVideo && !o.drive) {
      if (file.size <= 25 * 1024 * 1024) { try { o.video = (await pujaHub(file, file.name)).id } catch (e) { } }
      else if (!d.connectat) H.toast(file.name + " passa de 25 MB: connecta el Drive o puja'l directament a la carpeta del Drive");
      else H.toast(file.name + " és massa gran per enviar-lo des d'aquí: puja'l directament a la carpeta del Drive i arribarà sol");
    } else if (!o.drive && d.connectat && file.size > MAXD) H.toast(file.name + ": puja l'original directament a la carpeta del Drive");
    if (!o.img && !o.video && !o.drive) { H.toast("No s'ha pogut pujar " + file.name); return null }
    return o;
  }
  // esborra la còpia del hub (l'original del Drive va a la paperera del Drive)
  function esborra(x) { [x.img, x.video].filter(Boolean).forEach(id => H.api("DELETE", "archivo/" + id).catch(() => { })); if (x.drive && x.drive.id) H.api("POST", "drive/esborra", { id: x.drive.id }).catch(() => { }) }

  // miniatura (amb icona de vídeo)
  const mini = (x, attrs = "") => `<div class="mdth" ${attrs}>${x.img ? `<img src="${url(x.img)}" alt="" loading="lazy">` : `<span>${E(x.nom || "")}</span>`}${x.tipus === "Vídeo" ? `<i class="mdv">▶${x.dur ? " " + Math.floor(x.dur / 60) + ":" + String(x.dur % 60).padStart(2, "0") : ""}</i>` : x.tipus === "Visor" ? `<i class="mdv">visor</i>` : ""}</div>`;
  // reproductor o imatge gran
  const gran = x => x.video ? `<video controls playsinline preload="metadata" src="${url(x.video)}" poster="${x.img ? url(x.img) : ""}" style="width:100%;max-height:60vh;border-radius:10px;background:#000"></video>`
    : x.img ? `<img src="${url(x.img)}" alt="" style="width:100%;max-height:60vh;object-fit:contain;border-radius:10px;background:var(--soft);display:block">` : "";

  // ---------- triar imatges de les referències (per als dossiers) ----------
  // Torna una promesa amb la llista d'ids d'imatge triats. o = {proj, multi}
  function tria(o = {}) {
    return new Promise(async ok => {
      const [refs, rc, ps] = await Promise.all([H.col("ref"), H.col("recce"), H.col("proyecto")]);
      let font = o.proj ? "proj" : "tot", sel = [], fet = false;
      const del = refs.filter(r => r.img);
      const recce = o.proj ? ((rc.find(x => x.proyecto === o.proj) || {}).llocs || []).flatMap(l => (l.items || []).filter(x => x.img).map(x => ({ ...x, titulo: l.nom }))) : [];
      const pinta = () => {
        const l = font === "proj" ? del.filter(r => (r.proyectos || []).includes(o.proj)) : font === "recce" ? recce : del;
        H.sheet(`<h2 style="margin-top:0;font-size:20px;color:var(--ink);text-transform:none;letter-spacing:0">Triar de les referències</h2>
          <div class="seg">${o.proj ? `<button class="t ${font === "proj" ? "on" : ""}" data-mt="proj">D'aquest projecte</button>` : ""}${recce.length ? `<button class="t ${font === "recce" ? "on" : ""}" data-mt="recce">Recce</button>` : ""}<button class="t ${font === "tot" ? "on" : ""}" data-mt="tot">Tota la biblioteca</button></div>
          ${l.length ? `<div class="mdgr sm">${l.map(r => `<button class="mdpick ${sel.includes(r.img) ? "on" : ""}" data-mi="${r.img}" title="${E(r.titulo || r.nom || "")}">${mini(r)}</button>`).join("")}</div>` : `<p class="em">Aquí encara no hi ha imatges.${font === "proj" ? " Afegeix-les a la pestanya Referències del projecte." : ""}</p>`}
          <div class="sfoot stk"><small>${sel.length ? sel.length + (sel.length === 1 ? " triada" : " triades") : o.multi ? "Toca les que vulguis" : "Toca'n una"}</small><button class="b" data-mt="fet" ${sel.length ? "" : "disabled"}>Afegir</button></div>`, () => { box.removeEventListener("click", fn); ok(fet ? sel : []) });
      };
      const box = document.getElementById("hshc");
      const fn = e => {
        const b = e.target.closest("[data-mt],[data-mi]"); if (!b) return;
        if (b.dataset.mi) { const id = b.dataset.mi; if (!o.multi) { sel = [id]; fet = true; return H.cerrar() } sel = sel.includes(id) ? sel.filter(x => x !== id) : sel.concat(id); b.classList.toggle("on"); const s = box.querySelector(".stk small"); if (s) s.textContent = sel.length ? sel.length + (sel.length === 1 ? " triada" : " triades") : "Toca les que vulguis"; const f = box.querySelector('[data-mt="fet"]'); if (f) f.disabled = !sel.length; return }
        if (b.dataset.mt === "fet") { fet = true; return H.cerrar() }
        font = b.dataset.mt; pinta();
      };
      box.addEventListener("click", fn);
      pinta();
    });
  }
  return { url, drive, puja, esborra, mini, gran, tria, redueix };
})();
