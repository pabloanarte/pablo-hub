// Pont entre el hub PABLO i Gmail (pablo.anarte.film@gmail.com). També desa cada dilluns una còpia del hub al Drive
// i manté el calendari «PABLO hub» de Google Calendar sincronitzat amb el hub en els dos sentits.
const HUB = "https://pablo-hub.pages.dev";
// S'enganxa a script.google.com amb aquest compte. Instruccions a la secció "Correu" del hub.
// El hub hi parla des del servidor amb una clau; sense la clau no respon res.

function configurar() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty("CLAU")) p.setProperty("CLAU", Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, ""));
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("enviaProgramats").timeBased().everyMinutes(5).create(); // enviaments programats
  ScriptApp.newTrigger("copiaDrive").timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create(); // còpia del hub cada dilluns
  ScriptApp.newTrigger("sincronitzaCal").timeBased().everyMinutes(10).create(); // calendari «PABLO hub» a Google Calendar
  CalendarApp.getDefaultCalendar();
  DriveApp.getRootFolder();
  GmailApp.getInboxUnreadCount();
  Logger.log("Clau per enganxar al hub:\n" + p.getProperty("CLAU"));
}

function doGet(e) { return resposta(e.parameter || {}) }
function doPost(e) { return resposta(JSON.parse((e.postData && e.postData.contents) || "{}")) }

function resposta(q) {
  let r;
  try {
    const clau = PropertiesService.getScriptProperties().getProperty("CLAU");
    if (!clau || q.clau !== clau) r = { error: "clau" };
    else if (!Object.prototype.hasOwnProperty.call(ACCIONS, q.accio)) r = { error: "accio" };
    else r = ACCIONS[q.accio](q);
  } catch (err) { r = { error: String(err && err.message || err) } }
  return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
}

const adreça = s => ((String(s || "").match(/<([^>]+)>/) || [])[1] || String(s || "")).trim().toLowerCase();
const nom = s => String(s || "").replace(/<[^>]+>/, "").replace(/"/g, "").trim() || adreça(s);

function resumFil(t) {
  const ms = t.getMessages(), u = ms[ms.length - 1];
  return {
    id: t.getId(), assumpte: t.getFirstMessageSubject(), n: ms.length, data: t.getLastMessageDate().toISOString(),
    nollegit: t.isUnread(), entrada: t.isInInbox(), destacat: t.hasStarredMessages(),
    de: nom(u.getFrom()), deA: adreça(u.getFrom()), a: u.getTo(),
    participants: [...new Set(ms.flatMap(m => [m.getFrom(), m.getTo(), m.getCc()].join(",").split(",")).map(adreça).filter(Boolean))],
    resum: u.getPlainBody().replace(/\s+/g, " ").slice(0, 180)
  };
}

// respostes automàtiques (fora de l'oficina, vacances…): no compten com a resposta
const AUTO = /(out of office|fuera de la oficina|fora de l'oficina|automatic reply|auto-?reply|respuesta autom|resposta autom|r[ée]ponse automatique|absence|vacaciones|vacances|delivery status|undeliverable|no se ha podido entregar)/i;
const ACCIONS = {
  calendari: () => sincronitzaCal(),
  vigila: () => vigila(),
  // «Enviar-me'l ara»: compta com el resum del dia (no n'arribarà un altre a les 8:30)
  diari: () => { const r = resumDiari(); if (r && !r.buit) PropertiesService.getScriptProperties().setProperty("RESUM_DIA", Utilities.formatDate(new Date(), "Europe/Madrid", "yyyy-MM-dd")); return r },
  // llista de fils: q amb la sintaxi de Gmail (in:inbox, in:sent, from:…)
  llista(q) {
    const max = Math.min(+q.max || 30, 60);
    return { fils: GmailApp.search(q.q || "in:inbox", +q.inici || 0, max).map(resumFil) };
  },
  // un fil sencer
  fil(q) {
    const t = GmailApp.getThreadById(q.id); if (!t) return { error: "no trobat" };
    if (q.llegit) t.markRead();
    return {
      id: t.getId(), assumpte: t.getFirstMessageSubject(),
      missatges: t.getMessages().map(m => ({
        id: m.getId(), de: m.getFrom(), rt: m.getReplyTo(), a: m.getTo(), cc: m.getCc(), data: m.getDate().toISOString(),
        cos: m.getPlainBody().slice(0, 60000), adjunts: m.getAttachments().map(a => ({ nom: a.getName(), mida: a.getSize() }))
      }))
    };
  },
  // enviar ara o programar (quan = data ISO)
  envia(q) {
    if (q.quan && new Date(q.quan) > new Date(Date.now() + 60000)) {
      // es desa com a esborrany de Gmail (sense límit de llargada) i només l'hora va a les propietats
      const dr = esborrany(q), id = "P_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      PropertiesService.getScriptProperties().setProperty(id, JSON.stringify({ d: dr.getId(), a: q.a, assumpte: (q.assumpte || "").slice(0, 200), resum: String(q.cos || "").replace(/\s+/g, " ").slice(0, 200), quan: q.quan, intents: 0 }));
      return { ok: 1, programat: id };
    }
    enviaAra(q); return { ok: 1 };
  },
  programats() {
    const p = PropertiesService.getScriptProperties().getProperties();
    return { llista: Object.keys(p).filter(k => k.indexOf("P_") === 0).map(k => Object.assign({ id: k }, JSON.parse(p[k]))).sort((a, b) => a.quan < b.quan ? -1 : 1) };
  },
  // avisos de FilmFreeway i Festhome (inscripcions i decisions dels festivals)
  festivals(q) {
    const out = [];
    GmailApp.search("from:(filmfreeway.com OR festhome.com) -category:promotions -category:social newer_than:" + Math.min(+q.dies || 365, 1500) + "d", 0, 300).forEach(t => t.getMessages().forEach(m => {
      if (!/filmfreeway|festhome/i.test(m.getFrom())) return;
      out.push({ id: m.getId(), data: m.getDate().toISOString(), de: m.getFrom(), assumpte: m.getSubject(), cos: m.getPlainBody().replace(/\s+/g, " ").slice(0, 2500) });
    }));
    return { missatges: out };
  },
  copia() { const f = copiaDrive(); return { ok: 1, url: f.getUrl(), nom: f.getName() } },
  cancela(q) {
    const ps = PropertiesService.getScriptProperties(), v = String(q.id).indexOf("P_") === 0 && ps.getProperty(q.id);
    if (v) { try { GmailApp.getDraft(JSON.parse(v).d).deleteDraft() } catch (e) { } ps.deleteProperty(q.id) }
    return { ok: 1 };
  },
  // per a Inici: últim correu rebut de cada contacte i últim enviat a cada un
  resum(q) {
    const cs = (q.correus || []).map(x => String(x).toLowerCase()).filter(x => /@/.test(x)).slice(0, 150), de = {}, a = {};
    for (let i = 0; i < cs.length; i += 30) {
      const g = cs.slice(i, i + 30).join(" OR ");
      GmailApp.search("from:(" + g + ") newer_than:120d", 0, 100).forEach(t => t.getMessages().forEach(m => { const k = adreça(m.getFrom()); const d = m.getDate().toISOString(); if (AUTO.test(m.getSubject() || "")) return; if (cs.indexOf(k) >= 0 && (!de[k] || de[k] < d)) de[k] = d }));
      GmailApp.search("in:sent to:(" + g + ") newer_than:365d", 0, 100).forEach(t => t.getMessages().forEach(m => { const d = m.getDate().toISOString(); m.getTo().split(",").map(adreça).forEach(k => { if (cs.indexOf(k) >= 0 && (!a[k] || a[k] < d)) a[k] = d }) }));
    }
    return { de, a, nollegits: GmailApp.getInboxUnreadCount() };
  }
};

// a qui es respon dins d'un fil: l'últim missatge de l'altra persona (si l'últim és meu, reply aniria cap a mi)
function aQui(q) {
  const t = q.fil && GmailApp.getThreadById(q.fil); if (!t) return null;
  const jo = Session.getEffectiveUser().getEmail().toLowerCase(), ms = t.getMessages().filter(m => adreça(m.getFrom()) !== jo);
  return ms.length ? ms[ms.length - 1] : null;
}
const opcions = q => { const o = { name: "Pablo Anarte" }; if (q.cc) o.cc = q.cc; if (q.bcc) o.bcc = q.bcc; if (q.html) o.htmlBody = q.html; return o };
function esborrany(q) {
  const m = aQui(q), o = opcions(q);
  return m ? m.createDraftReply(q.cos || "", o) : GmailApp.createDraft(q.a, q.assumpte || "", q.cos || "", o);
}
function enviaAra(q) {
  const m = aQui(q);
  if (m) { m.reply(q.cos, opcions(q)); return }
  GmailApp.sendEmail(q.a, q.assumpte || "", q.cos || "", opcions(q));
}

// Cada 5 minuts: envia el que toca. Si un enviament falla 3 cops, es queda aturat amb l'error a la llista.
function enviaProgramats() {
  try { feinesPeriodiques() } catch (e) { } // resum de les 8:30 i vigilant de convocatòries
  const lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) return;
  try {
    const ps = PropertiesService.getScriptProperties(), p = ps.getProperties(), ara = new Date();
    Object.keys(p).filter(k => k.indexOf("P_") === 0).forEach(k => {
      const q = JSON.parse(p[k]);
      if (new Date(q.quan) > ara || q.intents >= 3) return;
      try { GmailApp.getDraft(q.d).send(); ps.deleteProperty(k) }
      catch (e) { q.intents = (q.intents || 0) + 1; q.error = String(e.message || e); ps.setProperty(k, JSON.stringify(q)) }
    });
  } finally { lock.releaseLock() }
}

// Còpia de seguretat del hub a la carpeta "Còpies PABLO hub" del Drive (es guarden les 12 últimes)
function copiaDrive() {
  const clau = PropertiesService.getScriptProperties().getProperty("CLAU");
  const r = UrlFetchApp.fetch(HUB + "/api/pont/copia", { method: "post", headers: { "x-clau": clau }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error("El hub no ha donat la còpia (" + r.getResponseCode() + ")");
  const it = DriveApp.getFoldersByName("Còpies PABLO hub"), dir = it.hasNext() ? it.next() : DriveApp.createFolder("Còpies PABLO hub");
  const nom = "pablo-hub-" + Utilities.formatDate(new Date(), "Europe/Madrid", "yyyy-MM-dd_HH-mm") + ".json";
  const f = dir.createFile(nom, r.getContentText(), "application/json");
  const fs = []; const all = dir.getFiles(); while (all.hasNext()) fs.push(all.next());
  fs.filter(x => /^pablo-hub-.*\.json$/.test(x.getName())).sort((a, b) => b.getDateCreated() - a.getDateCreated()).slice(12).forEach(x => x.setTrashed(true));
  return f;
}

// ---------- Google Calendar ----------
// Calendari «PABLO hub»: el hub hi posa classes, reunions, rodatges, feines, tasques i dates de festivals.
// Si mous o edites un esdeveniment aquí, el canvi torna al hub. Si en crees un de nou en aquest calendari,
// al hub surt com a reunió (amb hora) o com a tasca (de dia sencer). Si tots dos canvien alhora, mana el hub.
const ZONA = "Europe/Madrid";
const DIES_ENRERE = 60, DIES_ENDAVANT = 1825; // finestra que es sincronitza (ha de coincidir amb el hub)
function calHub() {
  const p = PropertiesService.getScriptProperties(), id = p.getProperty("CAL_ID");
  let c = id ? CalendarApp.getCalendarById(id) : null, nou = false;
  if (!c) { c = CalendarApp.createCalendar("PABLO hub", { timeZone: ZONA }); p.setProperty("CAL_ID", c.getId()); nou = true }
  return { c: c, nou: nou };
}
function cridaCal(cos) {
  const clau = PropertiesService.getScriptProperties().getProperty("CLAU");
  const r = UrlFetchApp.fetch(HUB + "/api/pont/cal", { method: "post", contentType: "application/json", payload: JSON.stringify(cos || {}), headers: { "x-clau": clau }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error("El hub no respon (" + r.getResponseCode() + ")");
  return JSON.parse(r.getContentText());
}
// Hores: a Madrid. Dies sencers: a la zona del projecte d'Apps Script (així no es mouen d'un dia).
function zonaDia() { return Session.getScriptTimeZone() || ZONA }
function dataHora(d, h) { return Utilities.parseDate(d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6, 8) + " " + h, ZONA, "yyyy-MM-dd HH:mm") }
function dataDia(d) { return Utilities.parseDate(d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6, 8) + " 12:00", zonaDia(), "yyyy-MM-dd HH:mm") }
function fmtCal(dt, f, z) { return Utilities.formatDate(dt, z || ZONA, f) }
// "petjada" curta d'un esdeveniment (igual vingui del hub o de Google) per saber qui l'ha canviat
function petjada(o) {
  const t = JSON.stringify([o.titol || "", o.d, o.hora || "", o.hora ? (o.durada || 60) : (o.fi || ""), o.lloc || "", String(o.desc || "").slice(0, 1500)]);
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, t, Utilities.Charset.UTF_8));
}
function normHub(e) {
  const h = /^\d{1,2}:\d{2}$/.test(e.hora || "") ? ("0" + e.hora).slice(-5) : "", fi = String(e.fi || "").replace(/-/g, "");
  return { titol: e.titol || "", d: e.d, hora: h, durada: h ? (e.durada || 60) : 0, fi: !h && /^\d{8}$/.test(fi) && fi > e.d ? fi : "", lloc: e.lloc || "", desc: String(e.desc || "").slice(0, 1500) };
}
function deGoogle(g) {
  const tot = g.isAllDayEvent();
  const o = { titol: g.getTitle(), d: "", hora: "", durada: 0, fi: "", lloc: g.getLocation() || "", desc: String(g.getDescription() || "").slice(0, 1500), gid: g.getId() };
  if (!tot) { const ini = g.getStartTime(); o.d = fmtCal(ini, "yyyyMMdd"); o.hora = fmtCal(ini, "HH:mm"); o.durada = Math.round((g.getEndTime() - ini) / 60000) }
  else { o.d = fmtCal(g.getAllDayStartDate(), "yyyyMMdd", zonaDia()); const f = fmtCal(new Date(g.getAllDayEndDate().getTime() - 12 * 3600e3), "yyyyMMdd", zonaDia()); if (f > o.d) o.fi = f }
  return o;
}
function posaCal(c, g, e) {
  if (e.hora) {
    const ini = dataHora(e.d, e.hora), fi = new Date(ini.getTime() + (e.durada || 60) * 60000);
    if (!g) g = c.createEvent(e.titol, ini, fi); else g.setTime(ini, fi);
  } else {
    const ini = dataDia(e.d), fi = e.fi ? new Date(dataDia(e.fi).getTime() + 864e5) : null;
    if (!g) g = fi ? c.createAllDayEvent(e.titol, ini, fi) : c.createAllDayEvent(e.titol, ini);
    else if (fi) g.setAllDayDates(ini, fi); else g.setAllDayDate(ini);
  }
  if (g.getTitle() !== e.titol) g.setTitle(e.titol);
  if ((g.getLocation() || "") !== e.lloc) g.setLocation(e.lloc);
  if (String(g.getDescription() || "") !== e.desc) g.setDescription(e.desc);
  return g;
}
function sincronitzaCal() {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) return { ocupat: 1 };
  try {
    const k = calHub(), c = k.c, r = cridaCal({}), ara = Date.now(), DIA = 864e5;
    const gs = c.getEvents(new Date(ara - (DIES_ENRERE + 2) * DIA), new Date(ara + (DIES_ENDAVANT + 2) * DIA)), perUid = {}, sense = [];
    gs.forEach(g => {
      const u = g.getTag("hub");
      if (u) { if (!perUid[u]) perUid[u] = g; else if (!g.isRecurringEvent()) g.deleteEvent() }
      else if (!g.isRecurringEvent()) sense.push(g);
    });
    // només es considera esborrat a Google el que és clarament dins la finestra (no el que hi entra o en surt avui)
    const dins = d => d >= fmtCal(new Date(ara - (DIES_ENRERE - 5) * DIA), "yyyyMMdd") && d <= fmtCal(new Date(ara + (DIES_ENDAVANT - 5) * DIA), "yyyyMMdd");
    const abans = {}; (r.vistos || []).forEach(u => abans[u] = 1);
    const falten = (r.ev || []).filter(e => abans[e.uid] && !perUid[e.uid] && e.esb && dins(e.d)).map(e => e.uid);
    // si en falten molts de cop (calendari esborrat o refet, error de Google…), no s'esborra res al hub: es tornen a crear
    const segur = !k.nou && falten.length <= 5;
    const hub = {}, canvis = [], esborrats = [], nous = [], nousG = [], marques = [];
    let posats = 0;
    (r.ev || []).forEach(e => {
      hub[e.uid] = 1;
      const h = normHub(e), ph = petjada(h), g = perUid[e.uid];
      if (!g) {
        if (segur && falten.indexOf(e.uid) >= 0) { esborrats.push(e.uid); return } // esborrat a Google: es treu també del hub
        const n = posaCal(c, null, h); n.setTag("hub", e.uid); n.setTag("h", ph); perUid[e.uid] = n; posats++; return;
      }
      const og = deGoogle(g), pg = petjada(og), ant = g.getTag("h") || "";
      if (pg !== ant && ph === ant) { canvis.push(Object.assign({ uid: e.uid }, og)); marques.push([g, pg]) } // canviat a Google
      else if (ph !== ant) { posaCal(c, g, h); g.setTag("h", ph); posats++ } // canviat al hub
    });
    Object.keys(perUid).forEach(u => { if (!hub[u]) { try { perUid[u].deleteEvent() } catch (er) { } delete perUid[u] } });
    sense.forEach(g => { nous.push(deGoogle(g)); nousG.push(g) });
    const r2 = cridaCal({ canvis: canvis, esborrats: esborrats, nous: nous, vistos: Object.keys(perUid) });
    // les marques es posen només quan el hub ja ho ha desat (si falla, el proper cicle ho torna a enviar)
    marques.forEach(m => m[0].setTag("h", m[1]));
    (r2.creats || []).forEach((u, i) => { if (u && nousG[i]) { nousG[i].setTag("hub", u); nousG[i].setTag("h", "") } });
    return { ok: 1, alHub: canvis.length + nous.length + esborrats.length, aGoogle: posats, protegits: segur ? 0 : falten.length };
  } finally { lock.releaseLock() }
}

// ---------- Feines periòdiques (van amb l'activador de cada 5 minuts) ----------
// Resum d'avui per correu a les 8:30 (hora de Madrid) i, els dilluns a partir de les 8, revisió de les convocatòries vigilades.
function feinesPeriodiques() {
  const p = PropertiesService.getScriptProperties(), ara = new Date();
  const dia = Utilities.formatDate(ara, "Europe/Madrid", "yyyy-MM-dd"), hm = Utilities.formatDate(ara, "Europe/Madrid", "HH:mm"), dsem = Utilities.formatDate(ara, "Europe/Madrid", "u");
  // el vigilant va primer (dilluns a partir de les 8:00) perquè els canvis surtin al resum de les 8:30
  if (dsem === "1" && hm >= "08:00" && p.getProperty("VIGILA_DIA") !== dia) { p.setProperty("VIGILA_DIA", dia); try { vigila() } catch (e) { } }
  // el dia només es marca com a fet quan el resum ha sortit bé; si falla, ho torna a provar al cap de 5 minuts (fins a les 13:00)
  if (hm >= "08:30" && hm < "13:00" && p.getProperty("RESUM_DIA") !== dia) {
    const lk = LockService.getUserLock(); if (!lk.tryLock(1000)) return; // si ja n'hi ha un enviant-se, no en surten dos
    try { if (p.getProperty("RESUM_DIA") !== dia) { resumDiari(); p.setProperty("RESUM_DIA", dia) } } finally { lk.releaseLock() }
  }
}
function cridaHub(ruta, cos) {
  const clau = PropertiesService.getScriptProperties().getProperty("CLAU");
  const o = { headers: { "x-clau": clau }, muteHttpExceptions: true };
  if (cos) { o.method = "post"; o.contentType = "application/json"; o.payload = JSON.stringify(cos) }
  const r = UrlFetchApp.fetch(HUB + ruta, o);
  if (r.getResponseCode() !== 200) throw new Error("El hub no respon (" + r.getResponseCode() + ")");
  return JSON.parse(r.getContentText());
}
// Envia't el resum d'avui (si no hi ha res d'avui, no s'envia)
function resumDiari() {
  const n = GmailApp.search("from:(filmfreeway.com OR festhome.com) -category:promotions -category:social newer_than:1d", 0, 50).length;
  const r = cridaHub("/api/pont/diari", { festivals: n });
  if (r.buit) return { ok: 1, buit: 1 };
  GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), r.assumpte, "Obre aquest correu amb format per veure el resum.", { htmlBody: r.html, name: "PABLO hub" });
  return { ok: 1 };
}
// Mira si han canviat les pàgines de les convocatòries (només el text que parla de dates, bases o inscripcions)
function vigila() {
  const l = cridaHub("/api/pont/vigila").llista || [], res = [];
  l.forEach(x => {
    try {
      const t = UrlFetchApp.fetch(x.url, { muteHttpExceptions: true, followRedirects: true, headers: { "user-agent": "Mozilla/5.0 (PABLO hub)" } });
      if (t.getResponseCode() >= 400) return res.push({ id: x.id, err: "La pàgina respon " + t.getResponseCode() });
      const txt = t.getContentText().replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, " ").replace(/<[^>]+>/g, "\n").replace(/&nbsp;/g, " ").replace(/&[a-z]+;|&#\d+;/gi, " ");
      const rel = txt.split(/\n+/).map(s => s.replace(/\s+/g, " ").trim()).filter(s => s.length > 3 && /(20\d\d|convocat|bases|plazo|termini|inscrip|deadline|applica|call for|abiert|obert|solicitud|sol·licitud)/i.test(s)).join(" | ").slice(0, 20000);
      res.push({ id: x.id, hash: Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, rel, Utilities.Charset.UTF_8)), extracte: rel.slice(0, 600) });
    } catch (e) { res.push({ id: x.id, err: String(e && e.message || e).slice(0, 100) }) }
  });
  cridaHub("/api/pont/vigila", { resultats: res });
  return { ok: 1, revisades: res.length };
}
