// Pont entre el hub PABLO i el Drive del compte de mitjans (Recce i Referències).
// S'enganxa a script.google.com amb el compte de Google on vulguis guardar les fotos i els vídeos
// (pot ser un compte nou, només per a això, perquè no s'ompli el de sempre). Instruccions a Configuració → Drive.
//
// Carpetes que crea al Drive d'aquest compte:
//   PABLO hub/Projectes/<projecte>/Recce/<localització>/        ← fotos i vídeos del recce (subcarpeta «Visor» per a ArriCam)
//   PABLO hub/Projectes/<projecte>/Referències/<etiqueta>/       ← referències del projecte (les subcarpetes són etiquetes)
//   PABLO hub/Referències (biblioteca)/<etiqueta>/                ← referències que no són de cap projecte
// Cada 10 minuts mira què hi ha de nou i ho envia al hub (una còpia lleugera, l'original es queda al Drive).
const HUB = "https://pablo-hub.pages.dev";
const ARREL = "PABLO hub", PROJ = "Projectes", BIB = "Referències (biblioteca)", RECCE = "Recce", REFS = "Referències";

function configurar() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty("CLAU")) p.setProperty("CLAU", Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, ""));
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sincronitza").timeBased().everyMinutes(10).create();
  arrel();
  UrlFetchApp.fetch("https://www.googleapis.com/drive/v3/about?fields=user", { headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  Logger.log("Clau per enganxar al hub (Configuració → Drive):\n" + p.getProperty("CLAU"));
}

function doGet(e) { return resposta(e.parameter || {}) }
function doPost(e) { return resposta(JSON.parse((e.postData && e.postData.contents) || "{}")) }
function resposta(q) {
  let r;
  try {
    const clau = PropertiesService.getScriptProperties().getProperty("CLAU");
    if (!clau || q.clau !== clau) r = { error: "clau" };
    else if (!Object.prototype.hasOwnProperty.call(ACCIONS, q.accio)) r = { error: "accio" };
    else { if (q.accio === "prova" && q.hub && /^https:\/\//.test(q.hub)) PropertiesService.getScriptProperties().setProperty("HUB", q.hub); r = ACCIONS[q.accio](q) } // l'adreça del hub només es fixa en connectar-lo
  } catch (e) { r = { error: String(e && e.message || e) } }
  return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
}
const ACCIONS = {
  prova: () => ({ ok: 1, compte: Session.getEffectiveUser().getEmail(), arrel: arrel().getUrl() }),
  // un arxiu pujat des del hub: va a la carpeta que toca i es marca com a vist (perquè no torni al hub)
  puja: q => {
    const f = carpetaDe(q.tipus, q.proj, q.titol, q.lloc);
    const fitxer = f.createFile(Utilities.newBlob(Utilities.base64Decode(q.b64), q.mime || "application/octet-stream", String(q.nom || "arxiu").slice(0, 200)));
    const v = vistos(); v[fitxer.getId()] = 1; desaVistos(v);
    return { id: fitxer.getId(), url: fitxer.getUrl() };
  },
  // a la paperera (només si és dins la carpeta del hub)
  esborra: q => { try { const f = DriveApp.getFileById(q.id); if (dinsArrel(f)) f.setTrashed(true) } catch (e) { } return { ok: 1 } },
  sincronitza: () => ({ ok: 1, nous: sincronitza() })
};

// ---------- carpetes ----------
function sub(pare, nom) { const it = pare.getFoldersByName(nom); return it.hasNext() ? it.next() : pare.createFolder(nom) }
function arrel() {
  const p = PropertiesService.getScriptProperties(), id = p.getProperty("ARREL_ID");
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f } catch (e) { } }
  const f = sub(DriveApp.getRootFolder(), ARREL); p.setProperty("ARREL_ID", f.getId()); return f;
}
function dinsArrel(f) { const a = arrel().getId(); let ps = f.getParents(), n = 0; while (ps.hasNext() && n++ < 8) { const x = ps.next(); if (x.getId() === a) return true; ps = x.getParents() } return false }
// carpeta del projecte (si se'n canvia el títol al hub, es canvia el nom de la carpeta)
function carpetaProjecte(pid, titol) {
  const p = PropertiesService.getScriptProperties(), k = "P_" + pid, id = p.getProperty(k), nom = String(titol || "Sense títol").slice(0, 120);
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) { if (titol && f.getName() !== nom) f.setName(nom); return f } } catch (e) { } }
  // carpeta pròpia encara que dos projectes es diguin igual: «Títol», «Títol (2)»…
  const pare = sub(arrel(), PROJ), usades = Object.keys(p.getProperties()).filter(x => x.indexOf("P_") === 0 && x !== k).map(x => p.getProperty(x));
  let f = null, n = 1;
  while (!f) { const nm = n === 1 ? nom : nom + " (" + n + ")", it = pare.getFoldersByName(nm); if (!it.hasNext()) f = pare.createFolder(nm); else { const x = it.next(); if (usades.indexOf(x.getId()) < 0) f = x; else n++ } }
  p.setProperty(k, f.getId()); return f;
}
function carpetaDe(tipus, pid, titol, lloc) {
  let f = tipus === "recce" ? sub(carpetaProjecte(pid, titol), RECCE) : pid ? sub(carpetaProjecte(pid, titol), REFS) : sub(arrel(), BIB);
  String(lloc || "").split("/").map(x => x.trim()).filter(Boolean).forEach(n => { f = sub(f, n.slice(0, 100)) });
  return f;
}

// ---------- el que ja s'ha enviat al hub ----------
function arxiuVistos() { const a = arrel(), it = a.getFilesByName(".vistos.json"); return it.hasNext() ? it.next() : a.createFile(".vistos.json", "{}", "application/json") }
function vistos() { try { return JSON.parse(arxiuVistos().getBlob().getDataAsString() || "{}") } catch (e) { return {} } }
function desaVistos(v) { arxiuVistos().setContent(JSON.stringify(v)) }

// ---------- sincronitzar (cada 10 minuts) ----------
function cridaHub(cos) {
  const p = PropertiesService.getScriptProperties(), hub = p.getProperty("HUB") || HUB;
  const r = UrlFetchApp.fetch(hub + "/api/pontdrive", { method: "post", contentType: "application/json", payload: JSON.stringify(cos), headers: { "x-clau": p.getProperty("CLAU") }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error("El hub ha respost " + r.getResponseCode() + ": " + r.getContentText().slice(0, 200));
  return JSON.parse(r.getContentText());
}
function sincronitza() {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return 0;
  const t0 = Date.now(); let nous = 0;
  try {
    const ps = cridaHub({ pas: "projectes" }).projectes || [], carp = {}, llocs = [];
    ps.forEach(p => {
      const pf = carpetaProjecte(p.id, p.titol), rc = sub(pf, RECCE), rf = sub(pf, REFS);
      carp[p.id] = { recce: rc.getUrl(), refs: rf.getUrl() };
      llocs.push(["recce", p.id, rc], ["ref", p.id, rf]);
    });
    const bib = sub(arrel(), BIB); llocs.push(["ref", "", bib]);
    cridaHub({ pas: "carpetes", carpetes: carp, biblioteca: bib.getUrl(), arrel: arrel().getUrl() });
    const v = vistos();
    for (const [tipus, pid, f] of llocs) {
      for (const [fitxer, cami] of arxius(f, "", 0)) {
        if (Date.now() - t0 > 4.5 * 60 * 1000) { desaVistos(v); return nous } // Google talla als 6 minuts: la resta, la propera vegada
        const id = fitxer.getId(); if (v[id]) continue;
        const mime = fitxer.getMimeType(); if (!/^(image|video)\//.test(mime)) { v[id] = 1; continue }
        const pv = previsualitza(fitxer);
        if (!pv && /^video\//.test(mime) && Date.now() - fitxer.getDateCreated().getTime() < 24 * 3600 * 1000) continue; // el Drive encara està processant el vídeo
        const r = cridaHub({ pas: "nou", tipus, proj: pid, lloc: cami, nom: fitxer.getName(), mime, id, url: fitxer.getUrl(), data: Utilities.formatDate(fitxer.getDateCreated(), "Europe/Madrid", "yyyy-MM-dd"), b64: pv ? pv.b64 : "", previewMime: pv ? pv.mime : "", dur: pv ? pv.dur : 0 });
        if (r.ok) { v[id] = 1; if (!r.ja) nous++ }
      }
    }
    desaVistos(v);
  } finally { lock.releaseLock() }
  return nous;
}
// arxius d'una carpeta i de les seves subcarpetes (fins a 3 nivells), amb el camí de subcarpetes («Bar/Visor»)
function arxius(f, cami, n) {
  const out = [], it = f.getFiles(); while (it.hasNext()) { const x = it.next(); if (x.getName() !== ".vistos.json") out.push([x, cami]) }
  if (n < 3) { const fs = f.getFolders(); while (fs.hasNext()) { const s = fs.next(); out.push.apply(out, arxius(s, cami ? cami + "/" + s.getName() : s.getName(), n + 1)) } }
  return out;
}
// còpia lleugera: la miniatura del Drive a 1600 px (també dels vídeos i de les fotos HEIC de l'iPhone)
function previsualitza(fitxer) {
  const tok = ScriptApp.getOAuthToken(), h = { Authorization: "Bearer " + tok };
  try {
    const m = JSON.parse(UrlFetchApp.fetch("https://www.googleapis.com/drive/v3/files/" + fitxer.getId() + "?fields=thumbnailLink,videoMediaMetadata", { headers: h, muteHttpExceptions: true }).getContentText());
    const dur = m.videoMediaMetadata && m.videoMediaMetadata.durationMillis ? Math.round(+m.videoMediaMetadata.durationMillis / 1000) : 0;
    if (m.thumbnailLink) {
      const r = UrlFetchApp.fetch(m.thumbnailLink.replace(/=s\d+$/, "=s1600"), { headers: h, muteHttpExceptions: true });
      if (r.getResponseCode() === 200) { const b = r.getBlob(); return { b64: Utilities.base64Encode(b.getBytes()), mime: b.getContentType() || "image/jpeg", dur } }
    }
    if (/^image\/(jpeg|png|webp)$/.test(fitxer.getMimeType()) && fitxer.getSize() < 5 * 1024 * 1024) return { b64: Utilities.base64Encode(fitxer.getBlob().getBytes()), mime: fitxer.getMimeType(), dur: 0 };
  } catch (e) { }
  return null;
}
