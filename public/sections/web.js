// Mi web: edita pabloanarte.com (archivo public/contenido.json del repositorio pabloanarte-web).
// Los cambios se guardan aquí y se publican con el botón "Publicar"; la web se actualiza en 1–2 minutos.
(() => {
  const { E, toast } = H, el = document.getElementById("s-web");
  const WEB = "https://pabloanarte.com";
  let W = null, sha = "", sucio = false, tab = "ficcion", abierto = null;
  const CP = {
    ficcion: [["titulo", "Título"], ["tipo", "Tipo (cortometraje, largometraje…)"], ["rol", "Rol (guion, dirección…)"], ["nota", "Nota (en distribución, en desarrollo…)"], ["video", "Vídeo: enlace de Vimeo, YouTube o Google Drive, o sube el archivo", "vid"], ["poster", "Póster (imagen si no hay vídeo, o portada del vídeo)", "img"]],
    videoclips: [["titulo", "Título"], ["artista", "Artista"], ["video", "Vídeo: enlace de Vimeo, YouTube o Google Drive, o sube el archivo", "vid"], ["poster", "Póster (imagen si no hay vídeo, o portada del vídeo)", "img"]]
  };
  const TABS = [["ficcion", "Ficción"], ["videoclips", "Videoclips"], ["textos", "Textos"], ["media", "Vídeo y foto"], ["redes", "Redes"]];

  async function cargar() {
    el.innerHTML = `<p class="em">Cargando la web…</p>`;
    try { const r = await H.api("GET", "web"); W = r.data; sha = r.sha; sucio = false; pintar() }
    catch (e) {
      el.innerHTML = `<p class="em">${e && e.error === "sin-token" ? "Falta conectar el hub con GitHub (variable GITHUB_TOKEN en Cloudflare)." : e && e.error === "sin-contraseña" ? "Por seguridad, esta sección solo funciona cuando el hub tiene contraseña (variable HUB_PASSWORD en Cloudflare)." : "No se pudo cargar la web."}</p><button class="t" data-k="rec">Reintentar</button>`;
    }
  }
  function marca() { sucio = true; el.querySelector("#wpub").hidden = false }

  function pintar() {
    const lista = k => (W[k] || []).map((p, i) => `<div class="r"><div class="g" data-k="ed" data-i="${i}"><b>${E(p.titulo || "Sin título")}</b><small>${E(k === "videoclips" ? p.artista || "" : [p.tipo, p.nota].filter(Boolean).join(" · "))}${p.video || p.vimeo ? "" : p.poster ? " · póster" : " · sin vídeo"}</small></div><button class="t" data-k="sube" data-i="${i}" ${i ? "" : "disabled"}>↑</button><button class="t" data-k="baja" data-i="${i}" ${i < W[k].length - 1 ? "" : "disabled"}>↓</button></div>`).join("") + `<div class="bar" style="margin-top:14px"><button class="b" data-k="add">+ Añadir proyecto</button></div>`;
    const inp = (ruta, v, ph = "") => `<input data-w="${ruta}" value="${E(v)}" placeholder="${E(ph)}">`;
    const arch = (ruta, v, acc, carp, nota) => `<div class="r" style="cursor:default"><div class="g"><b>${E(v || "—")}</b>${nota ? `<small>${E(nota)}</small>` : ""}</div>${v ? `<a class="ln" target="_blank" rel="noopener" href="${WEB}/${E(v)}">Ver</a>` : ""}<label class="b" style="margin:0;color:#fff;font-size:14px">Cambiar<input type="file" accept="${acc}" data-up="${ruta}" data-c="${carp}" hidden></label></div>`;
    let h = "";
    if (tab === "ficcion" || tab === "videoclips") h = lista(tab);
    if (tab === "textos") h = `<label>Nombres del menú</label>` + ["ficcion", "videoclips", "sobre_mi", "contacto"].map(k => inp("menu." + k, W.menu[k])).join("") +
      `<label>Sobre mí (deja una línea en blanco entre párrafos)</label><textarea data-w="sobre_mi" rows="14">${E((W.sobre_mi || []).join("\n\n"))}</textarea>` +
      `<label>Email de contacto</label>` + inp("email", W.email);
    if (tab === "media") h = `<label>Vídeo de fondo · ordenador</label>` + arch("video.escritorio", W.video.escritorio, "video/mp4", "assets", "MP4, sin sonido, menos de 25 MB") +
      `<label>Vídeo de fondo · móvil</label>` + arch("video.movil", W.video.movil, "video/mp4", "assets", "Versión vertical o más ligera") +
      `<label>Imagen mientras carga el vídeo</label>` + arch("video.poster", W.video.poster, "image/*", "assets") +
      `<label>Foto de sobre mí</label>` + arch("foto", W.foto, "image/*", "img");
    if (tab === "redes") h = `<label>Vimeo</label>${inp("redes.vimeo", W.redes.vimeo)}<label>IMDb</label>${inp("redes.imdb", W.redes.imdb)}<label>Instagram</label>${inp("redes.instagram", W.redes.instagram)}<small>Si dejas uno vacío, su icono desaparece de la web.</small>`;
    el.innerHTML = `<div class="tabs">${TABS.map(([k, l]) => `<button class="t ${k === tab ? "on" : ""}" data-k="tab" data-v="${k}">${l}</button>`).join("")}<span style="flex:1"></span><a class="ln" style="align-self:center" href="${WEB}" target="_blank" rel="noopener">Ver la web ↗</a></div>
      <div class="split"><div class="form">${h}</div><div class="card"><h3>Vista previa</h3><iframe src="${WEB}${tab === "ficcion" ? "/#fiction" : tab === "videoclips" ? "/#videoclips" : tab === "textos" ? "/#about" : ""}" style="width:100%;aspect-ratio:16/10;border:1px solid var(--bd);border-radius:10px" loading="lazy"></iframe><small>Muestra la web publicada. Los cambios aparecen 1–2 minutos después de publicar.</small></div></div>
      <div id="wpub" class="pub" ${sucio ? "" : "hidden"}><span>Cambios sin publicar</span><button class="b" data-k="pub" style="background:#fff;color:#000">Publicar</button></div>`;
  }

  function editar(i) {
    const k = tab, p = W[k][i]; abierto = { k, i };
    H.sheet(CP[k].map(([f, l, up]) => `<label>${l}</label>` + (up ? `<div class="row"><input data-p="${f}" value="${E(p[f] || (f === "video" ? p.vimeo || "" : ""))}" placeholder="${up === "vid" ? "https://vimeo.com/… · https://youtu.be/…" : "Sin póster"}"><label class="t" style="margin:0">Subir<input type="file" accept="${up === "vid" ? "video/mp4,video/quicktime,video/webm" : "image/*"}" data-pup="${f}" data-c="${up === "vid" ? "assets" : "img"}" hidden></label></div>${up === "vid" ? "<small>Archivos de vídeo: máximo 25 MB. Para cortos completos, mejor un enlace de Vimeo, YouTube o Drive.</small>" : ""}` : `<input data-p="${f}" value="${E(p[f] || "")}">`)).join("") +
      `<button class="del" data-k="wdel">Quitar de la web</button>`, () => { abierto = null; pintar() });
  }

  async function subir(file, carpeta) {
    if (file.size > 25 * 1024 * 1024) { toast("El archivo pasa de 25 MB. Comprímelo antes."); return "" }
    toast("Subiendo…");
    const r = await fetch(`/api/web/subir?carpeta=${carpeta}&nombre=${encodeURIComponent(file.name)}`, { method: "POST", body: file });
    const d = await r.json().catch(() => ({})); if (!r.ok) { toast(d.error || "No se pudo subir"); return "" }
    toast("Subido. Dale a Publicar para usarlo."); return d.ruta;
  }
  const setRuta = (o, ruta, v) => { const ks = ruta.split("."); let x = o; ks.slice(0, -1).forEach(k => x = x[k] = x[k] || {}); x[ks.at(-1)] = v };

  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b || b.disabled) return; const k = b.dataset.k, L = W && W[tab], i = +b.dataset.i;
    if (k === "rec") cargar();
    if (k === "tab") { tab = b.dataset.v; pintar() }
    if (k === "ed") editar(i);
    if (k === "sube" || k === "baja") { const j = k === "sube" ? i - 1 : i + 1;[L[i], L[j]] = [L[j], L[i]]; marca(); pintar() }
    if (k === "add") { L.push(tab === "videoclips" ? { titulo: "", artista: "", video: "", poster: "" } : { titulo: "", tipo: "cortometraje", rol: "guion, dirección", video: "", poster: "", nota: "" }); marca(); editar(L.length - 1) }
    if (k === "pub") {
      b.disabled = true; b.textContent = "Publicando…";
      try { const r = await H.api("PUT", "web", { data: W, sha }); sha = r.sha; sucio = false; pintar(); toast("Publicado. La web se actualiza en 1–2 minutos.") }
      catch (err) { b.disabled = false; b.textContent = "Publicar"; toast(err && err.error === "conflicto" ? "La web cambió desde otro sitio. Recarga la sección." : "No se pudo publicar") }
    }
  });
  el.addEventListener("input", e => {
    const t = e.target, r = t.dataset.w; if (!r) return;
    setRuta(W, r, r === "sobre_mi" ? t.value.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean) : t.value); marca();
  });
  el.addEventListener("change", async e => {
    const t = e.target; if (!t.dataset.up || !t.files[0]) return;
    const ruta = await subir(t.files[0], t.dataset.c); if (ruta) { setRuta(W, t.dataset.up, ruta); marca(); pintar() }
  });
  const sh = document.getElementById("hsh");
  sh.addEventListener("input", e => { const t = e.target; if (!abierto || !t.dataset.p) return; const p = W[abierto.k][abierto.i]; p[t.dataset.p] = t.value.trim(); if (t.dataset.p === "video") delete p.vimeo; marca() });
  sh.addEventListener("change", async e => {
    const t = e.target; if (!abierto || !t.dataset.pup || !t.files[0]) return;
    const ruta = await subir(t.files[0], t.dataset.c || "img"); if (ruta) { W[abierto.k][abierto.i][t.dataset.pup] = ruta; t.closest(".row").querySelector("input[data-p]").value = ruta; marca() }
  });
  sh.addEventListener("click", e => {
    if (!abierto || !e.target.closest('[data-k="wdel"]') || !confirm("¿Quitar este proyecto de la web?")) return;
    W[abierto.k].splice(abierto.i, 1); marca(); H.cerrar();
  });
  window.addEventListener("beforeunload", e => { if (sucio) { e.preventDefault(); e.returnValue = "" } });
  cargar();
})();
