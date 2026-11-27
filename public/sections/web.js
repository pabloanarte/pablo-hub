// Mi web: edita pabloanarte.com (archivo public/contenido.json del repositorio pabloanarte-web).
// Los cambios se guardan aquí y se publican con el botón "Publicar"; la web se actualiza en 1–2 minutos.
(() => {
  const { E, toast } = H, el = document.getElementById("s-web");
  const WEB = "https://pabloanarte.com";
  let prev = "pc", W = null, sha = "", sucio = false, tab = "ficcion", abierto = null;
  const CP = {
    ficcion: [["titulo", "Títol"], ["tipo", "Tipus, tal com surt a la web (p. ex. cortometraje)"], ["rol", "Rol, tal com surt a la web (p. ex. guion, dirección)"], ["nota", "Nota, tal com surt a la web (p. ex. actualmente en distribución)"], ["video", "Vídeo: enllaç de Vimeo, YouTube o Google Drive, o puja l'arxiu", "vid"], ["poster", "Pòster (imatge si no hi ha vídeo, o portada del vídeo)", "img"]],
    videoclips: [["titulo", "Títol"], ["artista", "Artista"], ["video", "Vídeo: enllaç de Vimeo, YouTube o Google Drive, o puja l'arxiu", "vid"], ["poster", "Pòster (imatge si no hi ha vídeo, o portada del vídeo)", "img"]]
  };
  const TABS = [["ficcion", "Ficció"], ["videoclips", "Videoclips"], ["textos", "Textos"], ["media", "Vídeo i foto"], ["redes", "Xarxes"]];

  async function cargar() {
    el.innerHTML = `<p class="em">Carregant la web…</p>`;
    try { const r = await H.api("GET", "web"); W = r.data; sha = r.sha; sucio = false; pintar() }
    catch (e) {
      el.innerHTML = `<p class="em">${e && e.error === "sin-token" ? "Falta connectar el hub amb GitHub (variable GITHUB_TOKEN a Cloudflare)." : e && e.error === "sin-contraseña" ? "Per seguretat, aquesta secció només funciona quan el hub té contrasenya (variable HUB_PASSWORD a Cloudflare)." : "No s'ha pogut carregar la web."}</p><button class="t" data-k="rec">Tornar-ho a provar</button>`;
    }
  }
  function marca() { sucio = true; el.querySelector("#wpub").hidden = false }

  function pintar() {
    const lista = k => (W[k] || []).map((p, i) => `<div class="r" data-ix="${i}"><span class="arr" title="Arrossega per canviar l'ordre">⠿</span><div class="g" data-k="ed" data-i="${i}"><b>${E(p.titulo || "Sense títol")}</b><small>${E(k === "videoclips" ? p.artista || "" : [p.tipo, p.nota].filter(Boolean).join(" · "))}${p.video || p.vimeo ? "" : p.poster ? " · pòster" : " · sense vídeo"}</small></div><button class="t" data-k="sube" data-i="${i}" ${i ? "" : "disabled"}>↑</button><button class="t" data-k="baja" data-i="${i}" ${i < W[k].length - 1 ? "" : "disabled"}>↓</button></div>`).join("") + `<div class="bar" style="margin-top:14px"><button class="b" data-k="add">+ ${tab === "videoclips" ? "Afegir videoclip" : "Afegir projecte"}</button></div>`;
    const inp = (ruta, v, ph = "") => `<input data-w="${ruta}" value="${E(v)}" placeholder="${E(ph)}">`;
    const arch = (ruta, v, acc, carp, nota) => `<div class="r" style="cursor:default"><div class="g"><b>${E(v || "—")}</b>${nota ? `<small>${E(nota)}</small>` : ""}</div>${v ? `<a class="ln" target="_blank" rel="noopener" href="${WEB}/${E(v)}">Veure</a>` : ""}<label class="b" style="margin:0;color:#fff;font-size:14px">Canviar<input type="file" accept="${acc}" data-up="${ruta}" data-c="${carp}" hidden></label></div>`;
    let h = "";
    if (tab === "ficcion" || tab === "videoclips") h = lista(tab);
    if (tab === "textos") h = `<h2>Noms del menú</h2>` + [["ficcion", "Ficció"], ["videoclips", "Videoclips"], ["sobre_mi", "Sobre mi"], ["contacto", "Contacte"]].map(([k, l]) => `<label>Botó «${l}»</label>` + inp("menu." + k, W.menu[k])).join("") +
      `<label>Sobre mi (deixa una línia en blanc entre paràgrafs)</label><textarea data-w="sobre_mi" rows="14">${E((W.sobre_mi || []).join("\n\n"))}</textarea>` +
      `<label>Email de contacte</label>` + inp("email", W.email);
    if (tab === "media") h = `<label>Vídeo de fons · ordinador</label>` + arch("video.escritorio", W.video.escritorio, "video/mp4", "assets", "MP4, sense so, menys de 25 MB") +
      `<label>Vídeo de fons · mòbil</label>` + arch("video.movil", W.video.movil, "video/mp4", "assets", "Versió vertical o més lleugera") +
      `<label>Imatge mentre carrega el vídeo</label>` + arch("video.poster", W.video.poster, "image/*", "assets") +
      `<label>Foto de sobre mi</label>` + arch("foto", W.foto, "image/*", "img");
    if (tab === "redes") h = `<label>Vimeo</label>${inp("redes.vimeo", W.redes.vimeo)}<label>IMDb</label>${inp("redes.imdb", W.redes.imdb)}<label>Instagram</label>${inp("redes.instagram", W.redes.instagram)}<small>Si en deixes un de buit, la seva icona desapareix de la web.</small>`;
    el.innerHTML = `<div class="tabs">${TABS.map(([k, l]) => `<button class="t ${k === tab ? "on" : ""}" data-k="tab" data-v="${k}">${l}</button>`).join("")}<span style="flex:1"></span><a class="ln" style="align-self:center" href="${WEB}" target="_blank" rel="noopener">Veure la web ↗</a></div>
      <div class="split"><div class="form">${h}</div><div class="card prevc"><h3>Previsualització<span class="seg" style="margin:0 0 0 auto"><button class="t ${prev === "pc" ? "on" : ""}" data-k="prev" data-v="pc">Ordinador</button><button class="t ${prev === "mob" ? "on" : ""}" data-k="prev" data-v="mob">Mòbil</button></span></h3><div class="pv ${prev}"><iframe src="${WEB}${tab === "ficcion" ? "/#fiction" : tab === "videoclips" ? "/#videoclips" : tab === "textos" ? "/#about" : ""}" loading="lazy" title="Previsualització"></iframe></div><small>Mostra la web publicada. Els canvis apareixen 1–2 minuts després de publicar.</small></div></div>
      <div id="wpub" class="pub" ${sucio ? "" : "hidden"}><span>Canvis sense publicar</span><button class="b" data-k="pub" style="background:#fff;color:#000">Publicar</button></div>`;
    escala();
  }

  // la previsualització es renderitza a mida real (1440×900 o 390×844) i s'escala a l'amplada de la targeta
  new ResizeObserver(() => escala()).observe(el);
  function escala() { const v = el.querySelector(".pv"), f = v && v.querySelector("iframe"); if (!f) return; const [w, h] = prev === "mob" ? [390, 844] : [1440, 900], k = Math.min(1, v.clientWidth / w); f.style.width = w + "px"; f.style.height = h + "px"; f.style.transform = `scale(${k})`; v.style.height = h * k + "px" }
  function editar(i) {
    const k = tab, p = W[k][i]; abierto = { k, i };
    H.sheet(`<h2 style="margin-top:0;font-size:20px;color:#000;text-transform:none;letter-spacing:0">${E(p.titulo || (k === "videoclips" ? "Nou videoclip" : "Nou projecte"))}</h2>` + CP[k].map(([f, l, up]) => `<label>${l}</label>` + (up ? `<div class="row"><input data-p="${f}" value="${E(p[f] || (f === "video" ? p.vimeo || "" : ""))}" placeholder="${up === "vid" ? "https://vimeo.com/… · https://youtu.be/…" : "Sense pòster"}"><label class="b2" style="margin:0;height:40px">Pujar<input type="file" accept="${up === "vid" ? "video/mp4,video/quicktime,video/webm" : "image/*"}" data-pup="${f}" data-c="${up === "vid" ? "assets" : "img"}" hidden></label></div>${up === "vid" ? "<small>Arxius de vídeo: màxim 25 MB. Per a curts sencers, millor un enllaç de Vimeo, YouTube o Drive.</small>" : ""}` : `<input data-p="${f}" value="${E(p[f] || "")}">`)).join("") +
      `<div class="sfoot"><button class="del" data-k="wdel">Treure de la web</button><button class="b" data-k="wfet">Fet</button></div><small>Els canvis es veuran a la web quan premis «Publicar».</small>`, () => { const a = abierto; abierto = null; if (a && W[a.k][a.i] && !W[a.k][a.i].titulo) { W[a.k].splice(a.i, 1) } pintar() });
  }

  async function subir(file, carpeta) {
    if (file.size > 25 * 1024 * 1024) { toast("L'arxiu passa de 25 MB. Comprimeix-lo abans."); return "" }
    toast("Pujant…");
    const r = await fetch(`/api/web/subir?carpeta=${carpeta}&nombre=${encodeURIComponent(file.name)}`, { method: "POST", body: file });
    const d = await r.json().catch(() => ({})); if (!r.ok) { toast(d.error || "No s'ha pogut pujar"); return "" }
    toast("Pujat. Prem Publicar per fer-lo servir."); return d.ruta;
  }
  const setRuta = (o, ruta, v) => { const ks = ruta.split("."); let x = o; ks.slice(0, -1).forEach(k => x = x[k] = x[k] || {}); x[ks.at(-1)] = v };

  // canviar l'ordre arrossegant (ratolí i dit) per la nansa ⠿
  el.addEventListener("pointerdown", e => {
    const h = e.target.closest(".arr"); if (!h || e.button > 0) return;
    const row = h.closest(".r[data-ix]"), L = W && W[tab]; if (!row || !L) return;
    e.preventDefault(); h.setPointerCapture(e.pointerId);
    const from = +row.dataset.ix, altres = [...row.parentElement.querySelectorAll(".r[data-ix]")].filter(r => r !== row);
    let y0 = e.clientY, sc0 = window.scrollY, to = from, roda = 0, yAra = e.clientY;
    row.classList.add("arrs");
    const marcaLloc = () => {
      row.style.transform = `translateY(${yAra - y0 + window.scrollY - sc0}px)`;
      to = altres.filter(r => { const b = r.getBoundingClientRect(); return yAra > b.top + b.height / 2 }).length;
      altres.forEach((r, n) => { r.classList.toggle("dst", n === to); r.classList.toggle("dsb", to === altres.length && n === altres.length - 1) });
    };
    const mou = ev => { yAra = ev.clientY; marcaLloc() };
    // si s'acosta a dalt o a baix de la pantalla, la pàgina es desplaça sola
    roda = setInterval(() => { const v = yAra < 70 ? -12 : yAra > innerHeight - 70 ? 12 : 0; if (v) { window.scrollBy(0, v); marcaLloc() } }, 30);
    const fi = () => {
      clearInterval(roda); h.removeEventListener("pointermove", mou); h.removeEventListener("pointerup", fi); h.removeEventListener("pointercancel", fi);
      row.classList.remove("arrs"); row.style.transform = ""; altres.forEach(r => r.classList.remove("dst", "dsb"));
      if (to !== from) { L.splice(to, 0, L.splice(from, 1)[0]); marca(); pintar() }
    };
    h.addEventListener("pointermove", mou); h.addEventListener("pointerup", fi); h.addEventListener("pointercancel", fi);
  });
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-k]"); if (!b || b.disabled) return; const k = b.dataset.k, L = W && W[tab], i = +b.dataset.i;
    if (k === "rec") cargar();
    if (k === "tab") { tab = b.dataset.v; pintar() }
    if (k === "prev") { prev = b.dataset.v; pintar() }
    if (k === "ed") editar(i);
    if (k === "sube" || k === "baja") { const j = k === "sube" ? i - 1 : i + 1;[L[i], L[j]] = [L[j], L[i]]; marca(); pintar() }
    if (k === "add") { L.push(tab === "videoclips" ? { titulo: "", artista: "", video: "", poster: "" } : { titulo: "", tipo: "cortometraje", rol: "guion, dirección", video: "", poster: "", nota: "" }); editar(L.length - 1) }
    if (k === "pub") {
      b.disabled = true; b.textContent = "Publicant…";
      try { const r = await H.api("PUT", "web", { data: W, sha }); sha = r.sha; sucio = false; pintar(); toast("Publicat. La web s'actualitza en 1–2 minuts.") }
      catch (err) { b.disabled = false; b.textContent = "Publicar"; toast(err && err.error === "conflicto" ? "La web ha canviat des d'un altre lloc. Torna a carregar la secció." : "No s'ha pogut publicar") }
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
  sh.addEventListener("click", async e => {
    if (abierto && e.target.closest('[data-k="wfet"]')) return H.cerrar();
    if (!abierto || !e.target.closest('[data-k="wdel"]') || !await H.confirma("Treure aquest projecte de la web?")) return;
    W[abierto.k].splice(abierto.i, 1); marca(); H.cerrar();
  });
  window.addEventListener("beforeunload", e => { if (sucio) { e.preventDefault(); e.returnValue = "" } });
  cargar();
})();
