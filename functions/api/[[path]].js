// API del hub.
//  - Datos del hub: tabla docs de D1 (variable DB). Cada documento es un JSON con un id.
//    Contactos: ids "c_..." y "cfg". Resto de secciones: ids "tipo:xxxx" (p. ej. "reunion:abc").
//  - Archivos (audios, vídeos, imágenes de Proyectos…): Cloudflare KV (variable ARCHIVOS), máx. 25 MB cada uno.
//  - Web (pabloanarte.com): lee y escribe public/contenido.json en GitHub (variable GITHUB_TOKEN).
const REPO = "pabloanarte/pabloanarte-web", RAMA = "main";

export async function onRequest({ request, env, params }) {
  const p = (params.path || []).join("/"), m = request.method, db = env.DB;
  const j = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
  try {
    await db.prepare("CREATE TABLE IF NOT EXISTS docs(id TEXT PRIMARY KEY, data TEXT NOT NULL, updated INTEGER)").run();

    if (p === "all" && m === "GET") { // Contactos (todo lo que no lleva ":")
      const { results } = await db.prepare("SELECT id,data FROM docs WHERE id NOT LIKE '%:%'").all();
      const out = { contacts: [], cfg: {} };
      for (const r of results) { const o = JSON.parse(r.data); if (r.id === "cfg") out.cfg = o; else out.contacts.push({ ...o, id: r.id }) }
      return j(out);
    }
    if (p.startsWith("col/") && m === "GET") { // Colección de una sección: /api/col/reunion
      const t = decodeURIComponent(p.slice(4)); if (!/^[a-z]+$/.test(t) || t === "secret") return j({ error: "no" }, 403); // sense comodins de LIKE
      const { results } = await db.prepare("SELECT id,data FROM docs WHERE id LIKE ?1").bind(t + ":%").all();
      return j(results.map(r => ({ ...JSON.parse(r.data), id: r.id })));
    }
    if (p.startsWith("doc/")) {
      const id = decodeURIComponent(p.slice(4)); if (id.toLowerCase().startsWith("secret:")) return j({ error: "no" }, 403);
      if (m === "PUT") {
        const b = await request.text(); JSON.parse(b);
        await db.prepare("INSERT INTO docs(id,data,updated) VALUES(?1,?2,?3) ON CONFLICT(id) DO UPDATE SET data=?2,updated=?3").bind(id, b, Date.now()).run();
        return j({ ok: 1 });
      }
      if (m === "DELETE") { await db.prepare("DELETE FROM docs WHERE id=?1").bind(id).run(); return j({ ok: 1 }) }
    }
    if (p === "web" || p.startsWith("web/")) return web(p, m, request, env, j);
    if (p === "archivo" || p.startsWith("archivo/")) return archivo(p, m, request, env, j);
    if (p === "importar" && m === "GET") return importar(request);
    if (p.startsWith("correu/")) return correu(p.slice(7), m, request, db, j);
    if (p.startsWith("public/")) return publica(p, request, env, db, j);
    if (p === "copia") return copia(m, request, db, j);
    if (p === "pont/copia" && m === "POST") return pontCopia(request, db, j);
    if (p.startsWith("ical/")) return ical(decodeURIComponent(p.slice(5)), db);
    if (p === "calendari" ) return calCfg(m, request, db, j);
    return j({ error: "not found" }, 404);
  } catch (e) { return j({ error: String(e.message || e) }, 500) }
}

// ---------- Web ----------
async function web(p, m, request, env, j) {
  if (!env.GITHUB_TOKEN) return j({ error: "sin-token" }, 503);
  if (!env.HUB_PASSWORD) return j({ error: "sin-contraseña" }, 503);
  const gh = (ruta, o = {}) => fetch(`https://api.github.com/repos/${REPO}/contents/${ruta}`, {
    ...o, headers: { authorization: "Bearer " + env.GITHUB_TOKEN, accept: "application/vnd.github+json", "user-agent": "pablo-hub", "content-type": "application/json" }
  });
  const RUTA = "public/contenido.json";

  if (p === "web" && m === "GET") {
    const r = await gh(RUTA + "?ref=" + RAMA); if (!r.ok) return j({ error: "github " + r.status }, 502);
    const f = await r.json();
    return j({ data: JSON.parse(deB64(f.content)), sha: f.sha });
  }
  if (p === "web" && m === "PUT") {
    const { data, sha } = await request.json();
    const r = await gh(RUTA, { method: "PUT", body: JSON.stringify({ message: "Hub: actualizar contenido de la web", content: b64(new TextEncoder().encode(JSON.stringify(data, null, 2) + "\n")), sha, branch: RAMA }) });
    if (r.status === 409) return j({ error: "conflicto" }, 409);
    if (!r.ok) return j({ error: "github " + r.status }, 502);
    return j({ sha: (await r.json()).content.sha });
  }
  if (p === "web/subir" && m === "POST") { // ?carpeta=assets|img&nombre=archivo.ext  (cuerpo = el archivo)
    const u = new URL(request.url), carpeta = u.searchParams.get("carpeta") === "assets" ? "assets" : "img";
    const nombre = (u.searchParams.get("nombre") || "archivo").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9.]+/g, "-");
    const buf = new Uint8Array(await request.arrayBuffer());
    if (buf.length > 25 * 1024 * 1024) return j({ error: "L'arxiu passa de 25 MB" }, 413);
    const ruta = `${carpeta}/${Date.now().toString(36)}-${nombre}`;
    const r = await gh("public/" + ruta, { method: "PUT", body: JSON.stringify({ message: "Hub: subir " + ruta, content: b64(buf), branch: RAMA }) });
    if (!r.ok) return j({ error: "github " + r.status }, 502);
    return j({ ruta });
  }
  return j({ error: "not found" }, 404);
}
function b64(bytes) { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s) }
function deB64(t) { const s = atob(t.replace(/\s/g, "")); return new TextDecoder().decode(Uint8Array.from(s, c => c.charCodeAt(0))) }

// ---------- Archivos ----------
async function archivo(p, m, request, env, j) {
  const kv = env.ARCHIVOS; if (!kv) return j({ error: "sin-archivos" }, 503);
  if (p === "archivo" && m === "POST") { // ?nombre=cancion.mp3 (cuerpo = el archivo)
    const u = new URL(request.url), nombre = (u.searchParams.get("nombre") || "archivo").slice(0, 120);
    const tipo = request.headers.get("content-type") || "application/octet-stream", buf = await request.arrayBuffer();
    if (buf.byteLength > 25 * 1024 * 1024) return j({ error: "L'arxiu passa de 25 MB" }, 413);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await kv.put("f:" + id, buf, { metadata: { nombre, tipo, size: buf.byteLength } });
    return j({ id, nombre, tipo, size: buf.byteLength });
  }
  const id = p.slice(8);
  if (m === "DELETE") { await kv.delete("f:" + id); return j({ ok: 1 }) }
  if (m === "GET") {
    const { value, metadata } = await kv.getWithMetadata("f:" + id, "arrayBuffer");
    if (!value) return new Response("No encontrado", { status: 404 });
    const h = { "content-type": metadata.tipo, "accept-ranges": "bytes", "cache-control": "private, max-age=31536000", "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(metadata.nombre)}` };
    const r = (request.headers.get("range") || "").match(/bytes=(\d*)-(\d*)/), n = value.byteLength;
    if (r) { const a = r[1] ? +r[1] : n - +r[2], b = r[1] && r[2] ? Math.min(+r[2], n - 1) : n - 1; return new Response(value.slice(a, b + 1), { status: 206, headers: { ...h, "content-range": `bytes ${a}-${b}/${n}`, "content-length": String(b - a + 1) } }) }
    return new Response(value, { headers: { ...h, "content-length": String(n) } });
  }
  return j({ error: "not found" }, 404);
}

// ---------- Importar un full de Google Sheets (compartit amb enllaç) com a CSV ----------
async function importar(request) {
  const u = new URL(request.url).searchParams.get("url") || "", id = (u.match(/\/spreadsheets\/d\/([\w-]+)/) || [])[1], gid = (u.match(/[#&?]gid=(\d+)/) || [])[1] || "0";
  if (!id) return new Response("Aquest enllaç no és d'un full de Google Sheets", { status: 400 });
  let r; try { r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`, { redirect: "follow" }) } catch (e) { return new Response("No puc connectar amb Google Sheets ara mateix. Torna-ho a provar d'aquí a una estona.", { status: 502 }) }
  const t = await r.text();
  if (!r.ok || /^\s*<!DOCTYPE html|<html/i.test(t)) return new Response("No puc llegir el full. Comparteix-lo com a «Qualsevol persona amb l'enllaç» (lector).", { status: 400 });
  return new Response(t, { headers: { "content-type": "text/csv; charset=utf-8" } });
}

// ---------- Dossiers compartits (sense contrasenya del hub) ----------
async function publica(p, request, env, db, j) {
  const [, tipus, token, fid] = p.split("/"), pw = new URL(request.url).searchParams.get("pw") || "";
  if (!/^[a-z0-9]{8,24}$/.test(token || "")) return j({ error: "no" }, 404);
  const r = await db.prepare("SELECT data FROM docs WHERE id LIKE 'deck:%' AND data LIKE ?1").bind('%"token":"' + token + '"%').first();
  const d = r && JSON.parse(r.data), c = d && d.compartir;
  if (!c || !c.actiu || c.token !== token) return j({ error: "no" }, 404);
  if (c.pw && c.pw !== pw) { await new Promise(r => setTimeout(r, 1200)); return j({ error: "pw" }, 401) } // frena els intents a l'engròs
  const vis = (d.slides || []).filter(s => !s.amaga); // les diapositives amagades no surten mai a l'enllaç públic
  if (tipus === "deck") { const { dades, compartir, proyecto, plantilla, titolMa, mod, ...o } = d; return j({ ...o, slides: vis, baixar: c.baixar !== false }) }
  if (tipus === "arxiu" && fid && JSON.stringify(vis).includes('"' + fid + '"')) {
    const r = await archivo("archivo/" + fid, "GET", request, env, j), h = new Headers(r.headers);
    h.set("cache-control", "private, max-age=600"); // si es desactiva l'enllaç, deixa de veure's aviat
    return new Response(r.body, { status: r.status, headers: h });
  }
  return j({ error: "no" }, 404);
}

// ---------- Correu (Gmail, a través del pont d'Apps Script de pablo.anarte.film@gmail.com) ----------
// L'adreça del pont i la clau es guarden a D1 (id "secret:correu"), que mai surt cap al navegador.
async function correu(accio, m, request, db, j) {
  const r = await db.prepare("SELECT data FROM docs WHERE id='secret:correu'").first(), cfg = r ? JSON.parse(r.data) : null;
  if (accio === "config") {
    if (m === "GET") return j({ connectat: !!(cfg && cfg.url && cfg.clau) });
    if (m === "DELETE") { await db.prepare("DELETE FROM docs WHERE id='secret:correu'").run(); return j({ ok: 1 }) }
    const { url, clau } = await request.json();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url || "")) return j({ error: "L'adreça ha de ser la de l'aplicació web d'Apps Script (acaba en /exec)." }, 400);
    const prova = await pont({ url, clau }, { accio: "programats" });
    if (prova.error) return j({ error: prova.error === "clau" ? "La clau no coincideix amb la del pont." : "El pont no respon: " + prova.error }, 400);
    await db.prepare("INSERT INTO docs(id,data,updated) VALUES('secret:correu',?1,?2) ON CONFLICT(id) DO UPDATE SET data=?1,updated=?2").bind(JSON.stringify({ url, clau }), Date.now()).run();
    return j({ ok: 1 });
  }
  if (!cfg) return j({ error: "config" }, 503);
  if (!["llista", "fil", "programats", "envia", "cancela", "resum", "copia", "festivals"].includes(accio)) return j({ error: "no" }, 404);
  // el que envia o cancel·la només per POST amb JSON (un enllaç o un formulari d'una altra web no ho pot fer)
  if (["envia", "cancela", "resum", "copia"].includes(accio) && (m !== "POST" || (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json")) return j({ error: "no" }, 405);
  const q = m === "GET" ? Object.fromEntries(new URL(request.url).searchParams) : await request.json();
  const { clau, ...o } = await pont(cfg, { ...q, accio }); // la clau no surt mai cap al navegador
  return j(o, o.error ? (o.error === "clau" ? 409 : 502) : 200); // 401 faria tornar a demanar la contrasenya del hub
}
async function pont(cfg, q) {
  try {
    const r = await fetch(cfg.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...q, clau: cfg.clau }), redirect: "follow" });
    const t = await r.text();
    try { return JSON.parse(t) } catch (e) { return { error: /<html|<!DOCTYPE/i.test(t) ? "Google ha tornat una pàgina en lloc de dades: revisa que el pont estigui implementat per a «Qualsevol usuari»." : "resposta estranya" } }
  } catch (e) { return { error: "no puc connectar amb Google" } }
}

// ---------- Còpia de seguretat ----------
// GET: totes les dades (sense secrets) en un JSON. POST: restaura una còpia (afegeix o substitueix documents; no esborra res).
async function totesDades(db) {
  const { results } = await db.prepare("SELECT id,data,updated FROM docs WHERE id NOT LIKE 'secret:%'").all();
  // les contrasenyes dels enllaços públics dels dossiers no surten de la base de dades
  const net = (id, o) => { if (id.startsWith("deck:") && o.compartir) { const { pw, ...c } = o.compartir; o.compartir = { ...c, pw: pw ? "(oculta)" : "" } } return o };
  return { hub: "pablo-hub", versio: 1, data: new Date().toISOString(), docs: results.map(r => ({ id: r.id, data: net(r.id, JSON.parse(r.data)), updated: r.updated })) };
}
async function marcaCopia(db, on) {
  const r = await db.prepare("SELECT data FROM docs WHERE id='ajust:copia'").first(), o = r ? JSON.parse(r.data) : {};
  o.ultima = new Date().toISOString(); o.on = on;
  await db.prepare("INSERT INTO docs(id,data,updated) VALUES('ajust:copia',?1,?2) ON CONFLICT(id) DO UPDATE SET data=?1,updated=?2").bind(JSON.stringify(o), Date.now()).run();
}
async function copia(m, request, db, j) {
  if (m === "GET") { const c = await totesDades(db); await marcaCopia(db, "descarregada"); return new Response(JSON.stringify(c), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="pablo-hub-${c.data.slice(0, 10)}.json"` } }) }
  if (m === "POST") {
    if ((request.headers.get("content-type") || "").split(";")[0].trim() !== "application/json") return j({ error: "no" }, 405);
    const c = await request.json();
    if (c.hub !== "pablo-hub" || !Array.isArray(c.docs)) return j({ error: "Aquest arxiu no és una còpia del hub." }, 400);
    const ok = c.docs.filter(d => d && typeof d.id === "string" && /^[\w:-]+$/.test(d.id) && !d.id.toLowerCase().startsWith("secret:") && d.data && typeof d.data === "object" && !Array.isArray(d.data) && formaBona(d.id, d.data));
    // l'estat de compartir dels dossiers no es recupera de la còpia: es manté l'actual (o queda desactivat)
    for (const d of ok.filter(d => d.id.startsWith("deck:"))) { const r = await db.prepare("SELECT data FROM docs WHERE id=?1").bind(d.id).first(); const ara = r ? JSON.parse(r.data).compartir : null; if (ara) d.data.compartir = ara; else if (d.data.compartir) d.data.compartir = { ...d.data.compartir, actiu: false, pw: "" } }
    for (let i = 0; i < ok.length; i += 50) await db.batch(ok.slice(i, i + 50).map(d => db.prepare("INSERT INTO docs(id,data,updated) VALUES(?1,?2,?3) ON CONFLICT(id) DO UPDATE SET data=?2,updated=?3").bind(d.id, JSON.stringify(d.data), Date.now())));
    return j({ ok: 1, n: ok.length, descartats: c.docs.length - ok.length });
  }
  return j({ error: "no" }, 405);
}
// Comprova que els documents amb llistes internes (plans, guions, dossiers) tinguin la forma que el hub espera
function formaBona(id, o) {
  const obj = x => x && typeof x === "object" && !Array.isArray(x), llista = (l, f) => Array.isArray(l) && l.every(x => obj(x) && (!f || f(x)));
  if (id.startsWith("pdr:")) return llista(o.dias, d => llista(d.filas));
  if (id.startsWith("gt:")) return llista(o.escenas, e => e.planos === undefined || llista(e.planos));
  if (id.startsWith("deck:")) return llista(o.slides);
  if (id.startsWith("desg:")) return llista(o.escenes);
  return true;
}
// El pont de Google (el mateix del correu) demana la còpia cada setmana i la desa al Drive de Pablo.
async function pontCopia(request, db, j) {
  const r = await db.prepare("SELECT data FROM docs WHERE id='secret:correu'").first(), cfg = r ? JSON.parse(r.data) : null;
  const clau = request.headers.get("x-clau") || "";
  if (!cfg || !cfg.clau || clau.length !== cfg.clau.length || !igual(clau, cfg.clau)) return j({ error: "no" }, 403);
  const c = await totesDades(db); await marcaCopia(db, "drive"); return j(c);
}
function igual(a, b) { let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0 }

// ---------- Calendari per subscriure's (iPhone, Google Calendar) ----------
async function calCfg(m, request, db, j) {
  const r = await db.prepare("SELECT data FROM docs WHERE id='secret:ical'").first();
  let tok = r ? JSON.parse(r.data).token : "";
  if (!tok || m === "POST") { // POST = enllaç nou (l'antic deixa de funcionar)
    tok = [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, "0")).join("");
    await db.prepare("INSERT INTO docs(id,data,updated) VALUES('secret:ical',?1,?2) ON CONFLICT(id) DO UPDATE SET data=?1,updated=?2").bind(JSON.stringify({ token: tok }), Date.now()).run();
  }
  return j({ url: new URL(request.url).origin + "/api/ical/" + tok + ".ics" });
}
async function ical(t, db) {
  const no = () => new Response("not found", { status: 404 });
  const r = await db.prepare("SELECT data FROM docs WHERE id='secret:ical'").first(); if (!r) return no();
  const tok = JSON.parse(r.data).token; t = t.replace(/\.ics$/, "");
  if (!tok || t.length !== tok.length || !igual(t, tok)) return no();
  const { results } = await db.prepare("SELECT id,data FROM docs WHERE id LIKE 'tarea:%' OR id LIKE 'reunion:%' OR id LIKE 'convocatoria:%' OR id LIKE 'pdr:%' OR id LIKE 'feina:%' OR id LIKE 'proyecto:%'").all();
  const D = results.map(x => ({ ...JSON.parse(x.data), id: x.id })), T = k => D.filter(x => x.id.startsWith(k + ":"));
  const proj = Object.fromEntries(T("proyecto").map(p => [p.id, p.titulo || ""]));
  const ev = [], dia = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s.replace(/-/g, "") : null;
  const add = (uid, d, titol, o = {}) => { if (!dia(d)) return; ev.push({ uid, d: dia(d), titol, ...o }) };
  T("tarea").filter(x => !x.hecha).forEach(x => add(x.id, x.fecha, "☐ " + (x.titulo || "Tasca"), { desc: x.notas }));
  T("reunion").forEach(x => add(x.id, x.fecha, "Reunió: " + (x.titulo || ""), { hora: x.hora, durada: 60, lloc: x.lugar, desc: x.apuntes }));
  T("convocatoria").forEach(x => { add(x.id + "-l", x.limite, "Límit: " + (x.titulo || ""), { desc: [x.web, x.notas].filter(Boolean).join("\n") }); if (x.evento) add(x.id + "-e", x.evento, (x.titulo || "Festival") + (x.lugar ? " (" + x.lugar + ")" : ""), {}) });
  T("pdr").forEach(x => (Array.isArray(x.dias) ? x.dias : []).forEach((d, i) => add(x.id + "-" + i, d.fecha, `Rodatge ${proj[x.proyecto] || x.titulo || ""} · jornada ${i + 1}`, { desc: d.calls })));
  T("feina").forEach(x => { add(x.id, x.ini, `${x.rol || "Feina"}: ${x.titulo || ""}`, { fi: x.fin, lloc: x.productora }) });
  const esc = s => String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, m => "\\" + m);
  const ara = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const seg = d => { const x = new Date(Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8) + 1)); return x.toISOString().slice(0, 10).replace(/-/g, "") };
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//pablo-hub//CA", "CALSCALE:GREGORIAN", "X-WR-CALNAME:PABLO hub", "X-WR-TIMEZONE:Europe/Madrid", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  for (const e of ev) {
    L.push("BEGIN:VEVENT", "UID:" + e.uid + "@pablo-hub", "DTSTAMP:" + ara, "SUMMARY:" + esc(e.titol));
    if (e.hora && /^\d{1,2}:\d{2}$/.test(e.hora)) { const [h, mi] = e.hora.split(":").map(Number), fi = h * 60 + mi + (e.durada || 60), p2 = n => String(n).padStart(2, "0"); L.push(`DTSTART;TZID=Europe/Madrid:${e.d}T${p2(h)}${p2(mi)}00`, `DTEND;TZID=Europe/Madrid:${fi >= 1440 ? seg(e.d) : e.d}T${p2(Math.floor(fi / 60) % 24)}${p2(fi % 60)}00`) } // si acaba passada la mitjanit, l'endemà
    else L.push("DTSTART;VALUE=DATE:" + e.d, "DTEND;VALUE=DATE:" + seg(dia(e.fi) && dia(e.fi) >= e.d ? dia(e.fi) : e.d));
    if (e.lloc) L.push("LOCATION:" + esc(e.lloc)); if (e.desc) L.push("DESCRIPTION:" + esc(String(e.desc).slice(0, 1500)));
    L.push("END:VEVENT");
  }
  L.push("END:VCALENDAR");
  const plega = l => { const o = []; let x = l; while (new TextEncoder().encode(x).length > 74) { let n = 70; while (new TextEncoder().encode(x.slice(0, n)).length > 74) n--; o.push(x.slice(0, n)); x = " " + x.slice(n) } o.push(x); return o.join("\r\n") };
  return new Response(L.map(plega).join("\r\n") + "\r\n", { headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "private, max-age=600" } });
}
