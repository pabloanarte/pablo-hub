// La cançó d'un videoclip, al Resum del projecte (window.CAN). Reproductor propi amb la forma d'ona.
// Dades: p.canco {id, nom, tipo, size, dur, ones:[0–100 × 120]}; l'àudio va al magatzem (/api/archivo, màx. 25 MB).
// La forma d'ona es calcula un sol cop en pujar-la (Web Audio) i es desa amb el projecte, per no haver de baixar l'arxiu per veure-la.
// L'àudio és un sol element per a tot el hub: si el Resum es torna a pintar, la cançó continua sonant.
window.CAN = (() => {
  const E = H.E, N = 120;
  const au = new Audio(); au.preload = "metadata";
  let pid = "", raf = 0;
  const es = p => p && p.categoria === "Videoclip";
  // la cançó, si encara hi és (si era un arxiu del projecte i s'ha esborrat des d'Arxius, ja no)
  const cc = p => p && p.canco && !(p.canco.deArxius && !(p.archivos || []).some(a => a.id === p.canco.id)) ? p.canco : null;
  const mm = s => { s = Math.max(0, Math.floor(+s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") };
  const mida = n => n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(1).replace(".", ",") + " MB";
  const ICP = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>`, ICS = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>`;

  // forma d'ona: 120 barres (0–100) a partir de l'arxiu
  async function ones(file) {
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return { ones: [], dur: 0 };
      const cx = new C(), buf = await new Promise((ok, ko) => { const p = cx.decodeAudioData(file, ok, ko); p && p.then && p.then(ok, ko) });
      const ch = buf.getChannelData(0), ch2 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null, pas = Math.floor(ch.length / N) || 1, out = [];
      for (let i = 0; i < N; i++) { let s = 0, n = 0; for (let j = i * pas; j < (i + 1) * pas && j < ch.length; j += 16) { const v = ch2 ? (Math.abs(ch[j]) + Math.abs(ch2[j])) / 2 : Math.abs(ch[j]); s += v * v; n++ } out.push(Math.sqrt(s / (n || 1))) }
      const max = Math.max(...out) || 1; cx.close && cx.close();
      return { ones: out.map(v => Math.max(4, Math.round(Math.pow(v / max, .8) * 100))), dur: Math.round(buf.duration) };
    } catch (e) { return { ones: [], dur: 0 } }
  }

  function card(p) {
    const c = cc(p), auds = (p.archivos || []).filter(a => /^audio\//.test(a.tipo || ""));
    if (!c) return `<div class="card cnc cncb" style="grid-column:1/-1"><h3>Cançó</h3>
      <p class="em" style="margin:0 0 12px">Puja la cançó del videoclip per escoltar-la des d'aquí (MP3, WAV, M4A… fins a 25 MB).</p>
      <div class="ls" style="align-items:center"><label class="b" style="cursor:pointer">Pujar la cançó<input type="file" accept="audio/*,.mp3,.wav,.m4a,.aif,.aiff,.flac" data-cnc="puja" hidden></label>
      ${auds.map(a => `<button class="b2" data-cnc="usa" data-id="${E(a.id)}">Fer servir «${E(a.nombre)}»</button>`).join("")}</div></div>`;
    const o = (c.ones && c.ones.length ? c.ones : Array(N).fill(30));
    return `<div class="card cnc" style="grid-column:1/-1" data-pid="${E(p.id)}">
      <div class="cncr">
        <button class="cncp" data-cnc="play" aria-label="Reproduir">${ICP}</button>
        <div class="cncm">
          <div class="cnct"><b title="${E(c.nom)}">${E((c.nom || "Cançó").replace(/\.[a-z0-9]{2,4}$/i, ""))}</b><span class="cncd"><span data-cnc="t">0:00</span> / <span data-cnc="dur">${mm(c.dur)}</span></span></div>
          <div class="cncw" data-cnc="ona" role="slider" tabindex="0" aria-label="Posició de la cançó" aria-valuemin="0" aria-valuemax="${Math.round(c.dur || 0)}" aria-valuenow="0">${o.map(v => `<i style="height:${v}%"></i>`).join("")}</div>
        </div>
        <details class="cncmes"><summary aria-label="Més opcions">···</summary><div>
          <label class="t" style="cursor:pointer">Canviar la cançó<input type="file" accept="audio/*,.mp3,.wav,.m4a,.aif,.aiff,.flac" data-cnc="puja" hidden></label>
          <a class="t" href="/api/archivo/${E(c.id)}" download="${E(c.nom || "canco")}">Descarregar${c.size ? " · " + mida(c.size) : ""}</a>
          <button class="t" data-cnc="treu" style="color:#ff3b30">Treure</button></div></details>
      </div></div>`;
  }

  // ---------- reproductor ----------
  const box = () => document.querySelector(`#s-projecte .cnc[data-pid="${CSS.escape(pid)}"]`);
  function pintaEstat() {
    const b = box(); if (!b) return;
    const d = au.duration && isFinite(au.duration) ? au.duration : 0, f = d ? au.currentTime / d : 0;
    const bars = b.querySelectorAll(".cncw i"), n = Math.round(f * bars.length);
    bars.forEach((x, i) => x.classList.toggle("on", i < n));
    b.querySelector('[data-cnc="t"]').textContent = mm(au.currentTime);
    if (d) b.querySelector('[data-cnc="dur"]').textContent = mm(d);
    const w = b.querySelector(".cncw"); w.setAttribute("aria-valuenow", Math.round(au.currentTime)); w.setAttribute("aria-valuetext", mm(au.currentTime));
    const pl = b.querySelector(".cncp"), son = !au.paused; pl.innerHTML = son ? ICS : ICP; pl.setAttribute("aria-label", son ? "Pausa" : "Reproduir"); b.classList.toggle("sona", son);
  }
  const bucle = () => { pintaEstat(); if (!au.paused) raf = requestAnimationFrame(bucle) };
  ["play", "pause", "ended", "loadedmetadata", "seeked"].forEach(t => au.addEventListener(t, () => { cancelAnimationFrame(raf); bucle() }));
  au.addEventListener("error", () => { if (au.src && pid) H.toast("No s'ha pogut carregar la cançó") });
  function carrega(p) { const src = "/api/archivo/" + p.canco.id; if (pid !== p.id || !au.src.endsWith(src)) { au.pause(); pid = p.id; au.src = src } }
  const salta = (b, x) => { const w = b.querySelector(".cncw"), r = w.getBoundingClientRect(), d = au.duration && isFinite(au.duration) ? au.duration : 0; if (!d) return; au.currentTime = Math.max(0, Math.min(1, (x - r.left) / r.width)) * d; pintaEstat() };

  // després de pintar el Resum
  function ajusta(el, p) {
    if (!es(p) || !cc(p)) { if (pid === (p && p.id)) { au.pause(); au.removeAttribute("src"); pid = "" } return }
    if (pid !== p.id) { au.pause(); pid = p.id; au.src = "/api/archivo/" + p.canco.id }
    pintaEstat();
  }
  document.addEventListener("click", e => document.querySelectorAll(".cncmes[open]").forEach(d => { if (!d.contains(e.target) || e.target.closest(".cncmes>div .t:not(label)")) d.open = false }));
  // deixar de sonar en sortir del projecte
  addEventListener("hub-sec", () => setTimeout(() => { if (pid && H.pj() !== pid && !au.paused) au.pause() }, 0));

  function connecta(el, doc, repinta) {
    let arr = null;
    el.addEventListener("click", async e => {
      const b = e.target.closest("[data-cnc]"); if (!b || !b.closest(".cnc")) return;
      const k = b.dataset.cnc, p = await doc(); if (!p) return;
      if (k === "play") { carrega(p); if (au.paused) au.play().catch(() => H.toast("No s'ha pogut reproduir")); else au.pause(); return }
      if (k === "usa") { const a = (p.archivos || []).find(x => x.id === b.dataset.id); if (!a) return; H.toast("Llegint la cançó…"); let w = { ones: [], dur: 0 }; try { w = await ones(await (await fetch("/api/archivo/" + a.id)).arrayBuffer()) } catch (er) { } p.canco = { id: a.id, nom: a.nombre, tipo: a.tipo, size: a.size, dur: w.dur, ones: w.ones, deArxius: 1 }; await H.put(p, 1); return repinta() }
      if (k === "treu") {
        if (!await H.confirma("Treure la cançó d'aquest videoclip?", { ok: "Treure" })) return;
        const c = p.canco; au.pause(); au.removeAttribute("src"); pid = ""; delete p.canco;
        if (c && !c.deArxius && !(p.archivos || []).some(a => a.id === c.id)) H.api("DELETE", "archivo/" + c.id).catch(() => { });
        await H.put(p, 1); return repinta();
      }
    });
    el.addEventListener("change", async e => {
      const t = e.target; if (t.dataset.cnc !== "puja" || !t.files.length) return;
      const f = t.files[0], p = await doc(); if (!p) return;
      if (!/^audio\//.test(f.type) && !/\.(mp3|wav|m4a|aiff?|flac|aac|ogg)$/i.test(f.name)) return H.toast("Ha de ser un arxiu d'àudio");
      if (f.size > 25 * 1024 * 1024) return H.toast("Passa de 25 MB. Prova amb un MP3.");
      H.toast("Pujant " + f.name + "…");
      try {
        const [a, w] = await Promise.all([H.api("POST", "archivo?nombre=" + encodeURIComponent(f.name), f), f.arrayBuffer().then(ones)]);
        const vella = p.canco; if (vella && !vella.deArxius && !(p.archivos || []).some(x => x.id === vella.id)) H.api("DELETE", "archivo/" + vella.id).catch(() => { });
        if (pid === p.id) { au.pause(); pid = "" }
        p.canco = { id: a.id, nom: a.nombre || f.name, tipo: a.tipo || f.type, size: a.size || f.size, dur: w.dur, ones: w.ones };
        await H.put(p, 1); H.toast("Cançó pujada"); repinta();
      } catch (er) { H.toast(er && er.error === "sin-archivos" ? "Falta el magatzem d'arxius" : er && er.offline ? "Sense connexió: puja-la quan tornis a tenir xarxa" : "No s'ha pogut pujar") }
    });
    // saltar: clic o arrossegar per la forma d'ona; fletxes ± 5 s, Espai per reproduir/aturar
    el.addEventListener("pointerdown", async e => {
      const w = e.target.closest(".cncw"); if (!w) return; const b = w.closest(".cnc"); arr = b; try { w.setPointerCapture(e.pointerId) } catch (er) { }
      const p = await doc(); if (!p || !p.canco) return; carrega(p);
      const fes = () => salta(b, e.clientX); if (au.readyState >= 1) fes(); else au.addEventListener("loadedmetadata", fes, { once: true });
    });
    el.addEventListener("pointermove", e => { if (arr && e.buttons) salta(arr, e.clientX) });
    el.addEventListener("pointerup", () => { arr = null });
    el.addEventListener("keydown", async e => {
      const w = e.target.closest && e.target.closest(".cncw"); if (!w || ![" ", "Enter", "ArrowRight", "ArrowLeft", "Home"].includes(e.key)) return; e.preventDefault();
      const p = await doc(); if (!p || !p.canco) return; carrega(p);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { au.currentTime = Math.max(0, au.currentTime + (e.key === "ArrowRight" ? 5 : -5)); pintaEstat() }
      else if (e.key === " " || e.key === "Enter") { au.paused ? au.play().catch(() => { }) : au.pause() }
      else if (e.key === "Home") { au.currentTime = 0; pintaEstat() }
    });
  }
  return { es, card, ajusta, connecta };
})();
