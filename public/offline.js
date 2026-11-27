// Sense connexió: registra el service worker (sw.js), mostra l'estat a la capçalera (#offl)
// i, quan hi ha xarxa, desa l'app i les dades perquè el hub es pugui fer servir sense.
window.OFF = (() => {
  const sw = navigator.serviceWorker;
  if (!sw) return { pendents: () => 0 };
  // dades que es desen per tenir-les sense xarxa (les reunions, projectes, contactes… tot el que és text)
  const TIPUS = ["reunion", "tarea", "proyecto", "idea", "persona", "ajust", "convocatoria", "curs", "visionat", "feina", "dev", "desg", "gt", "pdr", "sb", "pres", "pre", "post", "deck", "fin", "ref", "recce"];
  let n = 0, sense = !navigator.onLine, sinc = false, avisat = false, errAbans = 0;
  const el = document.getElementById("offl");

  function pinta() {
    if (!el) return;
    const curt = matchMedia("(max-width:700px)").matches; // al mòbil, més curt
    const t = sinc ? "Sincronitzant…" : !sense && !n && nova ? "Versió nova · actualitzar" : sense ? "Sense connexió" + (n ? " · " + n + (curt ? "" : (n > 1 ? " canvis" : " canvi") + " en aquest aparell") : "") : n ? n + (curt ? " per pujar" : (n > 1 ? " canvis" : " canvi") + " per pujar") : "";
    el.textContent = t; el.hidden = !t;
    el.classList.toggle("on", sense);
    el.classList.toggle("sinc", sinc);
    el.classList.toggle("nova", nova && !sense && !n && !sinc);
    el.title = nova && !sense && !n ? "Hi ha una versió nova del hub. Toca per carregar-la." : sense ? "Pots continuar treballant: el que desis es guarda en aquest aparell i es puja quan torni la connexió amb el hub obert." : n ? "Toca per pujar-los ara" : "";
  }
  const envia = m => sw.controller && sw.controller.postMessage(m);
  const sincronitza = () => { if (navigator.onLine) envia({ t: "sincronitza" }) };

  sw.addEventListener("message", e => {
    const m = e.data || {};
    if (m.t === "estat") n = m.n;
    if (m.t === "cua") { n = m.n; if (m.sense) { sense = true; if (!avisat) { avisat = true; H.toast("Sense connexió: desat en aquest aparell") } } }
    if (m.t === "offline") sense = true;
    if (m.t === "enlinia") sense = false;
    if (m.t === "sincronitza") sinc = true;
    if (m.t === "sincronitzat") {
      sinc = false; n = m.n;
      if (m.fets || m.noEsborrats) { sense = false; avisat = false }
      const t = [];
      if (m.marcats) t.push(m.marcats > 1 ? m.marcats + " documents s'havien canviat també en un altre aparell: s'han combinat i el text nou de l'altre aparell surt marcat" : "Un document s'havia canviat també en un altre aparell: s'ha combinat i el text nou de l'altre aparell surt marcat");
      else if (m.combinats) t.push("Combinat amb els canvis d'un altre aparell");
      if (m.noEsborrats) t.push(m.noEsborrats > 1 ? m.noEsborrats + " documents no s'han esborrat perquè s'havien canviat en un altre aparell" : "Un document no s'ha esborrat perquè s'havia canviat en un altre aparell");
      if (m.rebutjats) t.push(m.rebutjats > 1 ? m.rebutjats + " canvis no s'han pogut desar" : "Un canvi no s'ha pogut desar");
      if (m.errors && m.errors !== errAbans) t.push(m.errors > 1 ? m.errors + " canvis no s'han pogut pujar; es tornarà a provar" : "Un canvi no s'ha pogut pujar; es tornarà a provar");
      errAbans = m.errors || 0;
      if (t.length) H.toast(t.join(". ")); else if (m.fets) H.toast("Canvis sincronitzats");
      if (m.marcats || m.combinats || m.noEsborrats) recarrega();
    }
    if (m.t === "login") { sinc = false; H.toast("Torna a entrar per pujar els canvis desats en aquest aparell") }
    pinta();
  });
  async function recarrega() { // torna a llegir les dades (per veure el que s'ha combinat) i redibuixa
    await Promise.all(TIPUS.map(t => H.col(t, 1).catch(() => { })));
    H.refrescaContactes && H.refrescaContactes();
  }
  addEventListener("online", () => { sense = false; pinta(); setTimeout(sincronitza, 800) });
  addEventListener("offline", () => { sense = true; pinta() });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { envia({ t: "estat" }); sincronitza() } });
  setInterval(() => { if (n && !document.hidden) sincronitza() }, 30000);
  if (el) el.addEventListener("click", () => { if (nova && !n && navigator.onLine) return actualitza(); if (navigator.onLine) sincronitza(); else H.toast(el.title) });

  // tancar la sessió: avisa si queden canvis per pujar i esborra la còpia de les dades d'aquest aparell
  document.addEventListener("click", async e => {
    const b = e.target.closest && e.target.closest(".out"); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!navigator.onLine) return H.toast("Per tancar la sessió cal connexió");
    if (n && !await H.confirma(n + (n > 1 ? " canvis encara no s'han pujat" : " canvi encara no s'ha pujat") + ". Si tanques la sessió es perdran. Vols tancar-la igualment?", { ok: "Tancar la sessió", perill: true })) return;
    // el service worker esborra la cua i les còpies (i s'espera, com a molt 3 s)
    await new Promise(ok => { const c = new MessageChannel(); c.port1.onmessage = ok; setTimeout(ok, 3000); if (sw.controller) sw.controller.postMessage({ t: "surt" }, [c.port2]); else ok() });
    location.href = "/salir";
  }, true);

  function escalfa() { // l'app (tots els .js carregats, icones) i les dades principals
    if (!navigator.onLine || !sw.controller) return;
    const app = performance.getEntriesByType("resource").map(r => new URL(r.name)).filter(u => u.origin === location.origin && !u.pathname.startsWith("/api/")).map(u => u.pathname);
    ["/lib.js", "/hub.js", "/offline.js", "/manifest.webmanifest", "/icona-192.png", "/icona-180.png", "/vendor/exceljs.min.js", "/vendor/jszip.min.js", "/vendor/html-to-image.js", "/vendor/pdf.min.mjs", "/vendor/pdf.worker.min.mjs"].forEach(u => app.push(u));
    envia({ t: "escalfa", app: [...new Set(app)], dades: ["/api/all"].concat(TIPUS.map(t => "/api/col/" + t)) });
  }

  sw.register("/sw.js").then(() => sw.ready).then(() => {
    const go = () => { envia({ t: "estat" }); sincronitza(); setTimeout(escalfa, 4000) };
    sw.controller ? go() : sw.addEventListener("controllerchange", go, { once: true });
  }).catch(() => { });
  // ---------- versió nova publicada ----------
  // L'app instal·lada (Dock, pantalla d'inici) es queda oberta i no recarrega mai sola. Es mira l'ETag de cada arxiu
  // de l'app (petició HEAD, sense baixar res): en tornar a l'app, si alguna cosa ha canviat, es recarrega; mentre
  // s'hi està treballant, només surt l'avís «Versió nova» a la capçalera (tocar-lo recarrega).
  const fitxers = () => [...new Set(["/"].concat(performance.getEntriesByType("resource").map(r => new URL(r.name)).filter(u => u.origin === location.origin && !u.pathname.startsWith("/api/") && /\.(js|mjs|css|html)$/.test(u.pathname)).map(u => u.pathname)))];
  const empremta = async () => (await Promise.all(fitxers().map(u => fetch(u, { method: "HEAD", cache: "no-cache", credentials: "same-origin" }).then(r => r.ok && !r.headers.get("x-hub-login") ? u + "=" + (r.headers.get("etag") || r.headers.get("last-modified") || "") : null).catch(() => null)))).filter(Boolean);
  let base = null, nova = false, ultima = 0, amagada = 0;
  async function revisa(alTornar) {
    if (!navigator.onLine || Date.now() - ultima < (alTornar ? 5000 : 60000)) return; ultima = Date.now();
    const e = await empremta(); if (!e.length) return;
    if (!base) { base = new Map(e.map(x => x.split("="))); return }
    const canvi = e.some(x => { const [u, v] = x.split("="); return base.has(u) ? base.get(u) !== v : false });
    if (!canvi) return;
    const ocupat = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || !!document.querySelector(".hdlg,.hsel");
    if (alTornar && !ocupat && !document.querySelector("#hsh:not([hidden])")) return actualitza();
    nova = true; pinta();
  }
  async function actualitza(forcar) {
    if (n && !await H.confirma("Actualitzar ara? Hi ha canvis sense pujar; es conserven igualment.")) return;
    try {
      if (forcar && sw.controller) await new Promise(ok => { const c = new MessageChannel(); c.port1.onmessage = ok; setTimeout(ok, 3000); sw.controller.postMessage({ t: "actualitza" }, [c.port2]) });
      const r = await sw.getRegistration(); r && await r.update();
    } catch (e) { }
    location.reload();
  }
  // quan s'instal·la un service worker nou, la pàgina es recarrega una vegada per fer servir l'app nova
  let teniaSW = !!sw.controller, recarregant = false;
  sw.addEventListener("controllerchange", () => { if (teniaSW && !recarregant && !n) { recarregant = true; location.reload() } teniaSW = true });
  setTimeout(() => revisa(), 8000); // la primera, per saber com és ara
  setInterval(() => { if (!document.hidden) revisa() }, 10 * 60000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) amagada = Date.now(); else if (amagada && Date.now() - amagada > 20000) revisa(true) });
  addEventListener("focus", () => { if (amagada && Date.now() - amagada > 20000) { amagada = 0; revisa(true) } });
  addEventListener("blur", () => { amagada = Date.now() });

  // que el navegador no esborri les dades desades si en necessita l'espai
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist() } catch (e) { }
  pinta();
  return { pendents: () => n, sense: () => sense, actualitza };
})();
