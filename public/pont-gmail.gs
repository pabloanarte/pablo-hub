// Pont entre el hub PABLO i Gmail (pablo.anarte.film@gmail.com). També desa cada dilluns una còpia del hub al Drive.
const HUB = "https://pablo-hub.pages.dev";
// S'enganxa a script.google.com amb aquest compte. Instruccions a la secció "Correu" del hub.
// El hub hi parla des del servidor amb una clau; sense la clau no respon res.

function configurar() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty("CLAU")) p.setProperty("CLAU", Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, ""));
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("enviaProgramats").timeBased().everyMinutes(5).create(); // enviaments programats
  ScriptApp.newTrigger("copiaDrive").timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create(); // còpia del hub cada dilluns
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

const ACCIONS = {
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
      GmailApp.search("from:(" + g + ") newer_than:120d", 0, 100).forEach(t => t.getMessages().forEach(m => { const k = adreça(m.getFrom()); const d = m.getDate().toISOString(); if (cs.indexOf(k) >= 0 && (!de[k] || de[k] < d)) de[k] = d }));
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
