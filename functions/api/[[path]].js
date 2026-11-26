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
        let b = await request.text(); JSON.parse(b);
        if (id.startsWith("c_")) b = await igConserva(db, id, b); // no perdre missatges d'Instagram arribats amb la fitxa oberta
        await db.prepare("INSERT INTO docs(id,data,updated) VALUES(?1,?2,?3) ON CONFLICT(id) DO UPDATE SET data=?2,updated=?3").bind(id, b, Date.now()).run();
        return j({ ok: 1 });
      }
      if (m === "DELETE") { await db.prepare("DELETE FROM docs WHERE id=?1").bind(id).run(); return j({ ok: 1 }) }
      if (m === "GET") { const r = await db.prepare("SELECT data,updated FROM docs WHERE id=?1").bind(id).first(); return r ? j({ data: JSON.parse(r.data), updated: r.updated }) : j({ error: "no" }, 404) } // per sincronitzar els canvis fets sense connexió
    }
    if (p === "web" || p.startsWith("web/")) return web(p, m, request, env, j);
    if (p === "archivo" || p.startsWith("archivo/")) return archivo(p, m, request, env, j);
    if (p === "importar" && m === "GET") return importar(request);
    if (p === "oembed" && m === "GET") return oembed(request, j);
    if (p.startsWith("correu/")) return correu(p.slice(7), m, request, db, j);
    if (p.startsWith("public/arxiu/")) { const [, , id, sig] = p.split("/"); if (!id || !sig || sig !== await signa(db, id)) return new Response("No", { status: 404 }); return archivo("archivo/" + id, "GET", request, env, j) }
    if (p === "arxius-publics" && m === "POST") { const b = await request.json().catch(() => ({})), o = {}, base = new URL(request.url).origin; for (const id of (b.ids || []).slice(0, 100)) if (/^[a-z0-9]{6,40}$/.test(id)) o[id] = base + "/api/public/arxiu/" + id + "/" + await signa(db, id); return j(o) }
    if (p === "pont/diari" && m === "POST") return pontDiari(request, db, j);
    if (p === "pont/vigila") return pontVigila(m, request, db, j);
    if (p.startsWith("public/")) return publica(p, request, env, db, j);
    if (p === "copia") return copia(m, request, db, j);
    if (p === "pont/copia" && m === "POST") return pontCopia(request, db, j);
    if (p === "pont/cal" && m === "POST") return pontCal(request, db, j);
    if (p.startsWith("ical/")) return ical(decodeURIComponent(p.slice(5)), db);
    if (p === "calendari" ) return calCfg(m, request, db, j);
    if (p === "drecera" && (m === "GET" || m === "POST")) return dreceraCfg(m, request, db, j);
    if (p.startsWith("drecera/")) return drecera(decodeURIComponent(p.slice(8)), request, db);
    if (p.startsWith("instagram/")) return instagram(p.slice(10), m, request, env, db, j);
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
// Títol, autor i miniatura d'un vídeo de YouTube o Vimeo (només aquests dos llocs)
async function oembed(request, j) {
  let u; try { u = new URL(new URL(request.url).searchParams.get("url") || "") } catch (e) { return j({ error: "url" }, 400) }
  const h = u.hostname.replace(/^(www|m)\./, "");
  const api = /^(youtube\.com|youtu\.be)$/.test(h) ? "https://www.youtube.com/oembed?format=json&url=" : /^(vimeo\.com|player\.vimeo\.com)$/.test(h) ? "https://vimeo.com/api/oembed.json?width=640&url=" : "";
  if (!api || !/^https?:$/.test(u.protocol)) return j({ error: "plataforma" }, 400);
  let o; try { const r = await fetch(api + encodeURIComponent(u.href), { headers: { "user-agent": "Mozilla/5.0 (pablo-hub)" } }); if (!r.ok) return j({ error: "no", status: r.status }, 404); o = await r.json() } catch (e) { return j({ error: "xarxa" }, 502) }
  return j({ titol: String(o.title || ""), autor: String(o.author_name || ""), thumb: /^https:\/\//.test(o.thumbnail_url || "") ? o.thumbnail_url : "", durada: +o.duration || 0 });
}
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
  const q = new URL(request.url).searchParams;
  // imatge d'una cel·la =IMAGE("url"): es passa pel servidor perquè el navegador no la pot baixar d'un altre domini
  if (q.get("img")) {
    const iu = q.get("img"); if (!/^https:\/\//i.test(iu)) return new Response("no", { status: 400 });
    let r; try { r = await fetch(iu, { redirect: "follow" }) } catch (e) { return new Response("no", { status: 502 }) }
    const ct = r.headers.get("content-type") || ""; if (!r.ok || !/^image\//i.test(ct)) return new Response("no", { status: 400 });
    const b = await r.arrayBuffer(); if (b.byteLength > 15e6) return new Response("massa gran", { status: 413 });
    return new Response(b, { headers: { "content-type": ct } });
  }
  const u = q.get("url") || "", id = (u.match(/\/spreadsheets\/d\/([\w-]+)/) || [])[1], gid = (u.match(/[#&?]gid=(\d+)/) || [])[1] || "0";
  if (!id) return new Response("Aquest enllaç no és d'un full de Google Sheets", { status: 400 });
  if (q.get("format") === "xlsx") { // tot el llibre, amb les imatges
    let r; try { r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`, { redirect: "follow" }) } catch (e) { return new Response("no", { status: 502 }) }
    const ct = r.headers.get("content-type") || ""; if (!r.ok || /html/i.test(ct)) return new Response("No puc llegir el full. Comparteix-lo com a «Qualsevol persona amb l'enllaç» (lector).", { status: 400 });
    return new Response(r.body, { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } });
  }
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
  if (!["llista", "fil", "programats", "envia", "cancela", "resum", "copia", "festivals", "calendari", "vigila", "diari", "full"].includes(accio)) return j({ error: "no" }, 404);
  // el que envia o cancel·la només per POST amb JSON (un enllaç o un formulari d'una altra web no ho pot fer)
  if (["envia", "cancela", "resum", "copia", "calendari", "vigila", "diari", "full"].includes(accio) && (m !== "POST" || (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json")) return j({ error: "no" }, 405);
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
// Sincronització amb Google Calendar, feta pel pont de Google cada 10 minuts (o des de Configuració).
// Crida 1 (cos buit): el pont rep els esdeveniments del hub i els uid que ja hi havia a Google l'última vegada.
// Crida 2: el pont envia el que s'ha canviat, creat o esborrat a Google; el hub ho aplica i desa els uid vistos.
async function pontCal(request, db, j) {
  const r = await db.prepare("SELECT data FROM docs WHERE id='secret:correu'").first(), cfg = r ? JSON.parse(r.data) : null;
  const clau = request.headers.get("x-clau") || "";
  if (!cfg || !cfg.clau || clau.length !== cfg.clau.length || !igual(clau, cfg.clau)) return j({ error: "no" }, 403);
  const b = await request.json().catch(() => ({})) || {};
  const get = async id => { const x = await db.prepare("SELECT data FROM docs WHERE id=?1").bind(id).first(); return x ? JSON.parse(x.data) : null };
  const put = (id, o) => db.prepare("INSERT INTO docs(id,data,updated) VALUES(?1,?2,?3) ON CONFLICT(id) DO UPDATE SET data=?2,updated=?3").bind(id, JSON.stringify(o), Date.now()).run();
  const st = (await get("ajust:gcal")) || {};
  const iso = d => /^\d{8}$/.test(d || "") ? d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6, 8) : "";
  const hm = h => /^\d{2}:\d{2}$/.test(h || "") ? h : "";
  const suma = (h, min) => { if (!hm(h) || !(min > 0)) return ""; const t = (+h.slice(0, 2) * 60 + +h.slice(3, 5) + min) % 1440; return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0") };
  const treu = (t, pre) => String(t || "").replace(pre, "").trim();
  const fets = [], creats = [];
  if (Array.isArray(b.canvis)) for (const c of b.canvis.slice(0, 300)) {
    const u = String(c.uid || ""), d = iso(c.d); if (!d) continue;
    try {
      let m;
      if ((m = u.match(/^(tarea:[\w-]+)$/))) { const o = await get(m[1]); if (!o) continue; o.fecha = d; if (c.titol) o.titulo = treu(c.titol, /^☐\s*/).slice(0, 300); if (c.desc !== undefined) o.notas = String(c.desc).slice(0, 5000); await put(m[1], o) }
      else if ((m = u.match(/^(reunion:[\w-]+)$/))) { const o = await get(m[1]); if (!o) continue; o.fecha = d; o.hora = hm(c.hora); o.durada = c.durada > 0 && c.durada < 1440 ? Math.round(c.durada) : 60; if (c.titol) o.titulo = treu(c.titol, /^Reunió:\s*/).slice(0, 300); if (c.lloc !== undefined) o.lugar = String(c.lloc).slice(0, 300); if (c.desc !== undefined) o.apuntes = String(c.desc).slice(0, 5000); await put(m[1], o) }
      else if ((m = u.match(/^(convocatoria:[\w-]+)-(l|e)$/))) { const o = await get(m[1]); if (!o) continue; o[m[2] === "l" ? "limite" : "evento"] = d; await put(m[1], o) }
      else if ((m = u.match(/^(pdr:[\w-]+)-(\d+)$/))) { const o = await get(m[1]); if (!o || !Array.isArray(o.dias) || !o.dias[+m[2]]) continue; o.dias[+m[2]].fecha = d; await put(m[1], o) }
      else if ((m = u.match(/^(curs:[\w-]+)-([\w-]+)$/))) { const o = await get(m[1]); const x = o && Array.isArray(o.setmanes) && o.setmanes.find((y, i) => y && (y.id || String(i)) === m[2]); if (!x) continue; x.data = d; x.hora = hm(c.hora); x.horafi = suma(c.hora, c.durada); if (c.desc !== undefined) x.notes = String(c.desc).slice(0, 5000); await put(m[1], o) }
      else if ((m = u.match(/^(feina:[\w-]+)$/))) { const o = await get(m[1]); if (!o) continue; o.ini = d; o.fin = iso(c.fi) || ""; await put(m[1], o) }
      else continue;
      fets.push(u);
    } catch (e) { }
  }
  if (Array.isArray(b.esborrats)) for (const u of b.esborrats.slice(0, 100)) {
    if (/^reunion:[\w-]+$/.test(u)) await db.prepare("DELETE FROM docs WHERE id=?1").bind(u).run();
    else if (/^tarea:[\w-]+$/.test(u)) { const o = await get(u); if (o) { o.hecha = true; await put(u, o) } }
  }
  // esdeveniments creats directament al calendari de Google: amb hora → reunió; de dia sencer → tasca
  if (Array.isArray(b.nous)) for (const n of b.nous.slice(0, 50)) {
    const d = iso(n.d); if (!d) { creats.push(""); continue }
    const gid = String(n.gid || "").slice(0, 300);
    // si ja s'havia creat (la resposta anterior es va perdre), es torna el mateix
    if (gid) { const ja = await db.prepare("SELECT id FROM docs WHERE (id LIKE 'reunion:%' OR id LIKE 'tarea:%') AND json_extract(data,'$.gcal')=?1").bind(gid).first(); if (ja) { creats.push(ja.id); continue } }
    const id = (hm(n.hora) ? "reunion:" : "tarea:") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const titol = String(n.titol || "").slice(0, 300), desc = String(n.desc || "").slice(0, 5000), lloc = String(n.lloc || "").slice(0, 300);
    await put(id, hm(n.hora) ? { titulo: titol, fecha: d, hora: n.hora, durada: n.durada > 0 && n.durada < 1440 ? Math.round(n.durada) : 60, lugar: lloc, apuntes: desc, gcal: gid } : { titulo: titol, fecha: d, notas: [desc, lloc].filter(Boolean).join("\n"), gcal: gid });
    creats.push(id);
  }
  if (Array.isArray(b.vistos)) { st.vistos = b.vistos.filter(x => typeof x === "string" && x.length < 200).slice(0, 3000); st.ultima = Date.now(); await put("ajust:gcal", st) }
  const avui = new Date(), lim = (n) => new Date(avui.getTime() + n * 864e5).toISOString().slice(0, 10).replace(/-/g, "");
  const ev = (await esdeveniments(db)).filter(e => (/^\d{4}-\d{2}-\d{2}$/.test(e.fi || "") && e.fi.replace(/-/g, "") > e.d ? e.fi.replace(/-/g, "") : e.d) >= lim(-62) && e.d <= lim(1827)).map(e => ({ ...e, esb: /^(tarea|reunion):/.test(e.uid) }));
  return j({ ev, vistos: st.vistos || [], fets, creats });
}
// Drecera de l'iPhone: des d'un perfil d'Instagram, Compartir → «Contactat al hub». Enllaç secret a secret:drecera.
async function dreceraCfg(m, request, db, j) {
  const r = await db.prepare("SELECT data FROM docs WHERE id='secret:drecera'").first();
  let tok = r ? JSON.parse(r.data).token : "";
  if (!tok || m === "POST") {
    tok = [...crypto.getRandomValues(new Uint8Array(20))].map(b => b.toString(16).padStart(2, "0")).join("");
    await db.prepare("INSERT INTO docs(id,data,updated) VALUES('secret:drecera',?1,?2) ON CONFLICT(id) DO UPDATE SET data=?1,updated=?2").bind(JSON.stringify({ token: tok }), Date.now()).run();
  }
  return j({ url: new URL(request.url).origin + "/api/drecera/" + tok + "?u=" });
}
async function drecera(t, request, db) {
  // al navegador (drecera amb «Abrir URL»): una pantalla senzilla; a «Obtener contenido de URL»: text per a la notificació
  const html = /text\/html/.test(request.headers.get("accept") || "");
  const txt = (s, st = 200) => html
    ? new Response(`<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PABLO</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Helvetica,Arial,sans-serif;background:#fff;color:#000;text-align:center;padding:24px;box-sizing:border-box}h1{font-size:26px;line-height:1.3;margin:0 0 12px}p{color:#8e8e93;font-size:16px;margin:0}</style></head><body><div><h1>${s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</h1><p>${st === 200 ? "Ja pots tornar a Instagram." : ""}</p></div></body></html>`, { status: st, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } })
    : new Response(s, { status: st, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  const r = await db.prepare("SELECT data FROM docs WHERE id='secret:drecera'").first(); if (!r) return txt("no", 404);
  const tok = JSON.parse(r.data).token; if (!tok || t.length !== tok.length || !igual(t, tok)) return txt("no", 404);
  const q = new URL(request.url).searchParams; let u = q.get("u") || "";
  if (request.method === "POST") { const b = await request.text(); try { const o = JSON.parse(b); u = o.u || o.url || u } catch (e) { u = b || u } }
  const avuiM = diaMadrid();
  // «Apunta al hub» (Siri): ?x=text → tasca per avui; si comença per «idea», va a Idees
  if (q.get("x") !== null) {
    let x = String(q.get("x") || "").trim().slice(0, 300); if (!x) return txt("No ha arribat cap text.", 400);
    const idea = /^idea[\s,:.-]+/i.test(x); x = x.replace(/^(idea|tasca)[\s,:.-]+/i, "").trim(); if (!x) return txt("No ha arribat cap text.", 400); x = x[0].toUpperCase() + x.slice(1);
    const id = (idea ? "idea:" : "tarea:") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await db.prepare("INSERT INTO docs(id,data,updated) VALUES(?1,?2,?3)").bind(id, JSON.stringify(idea ? { titulo: x, fecha: avuiM, texto: "" } : { titulo: x, fecha: avuiM, hecha: false, proyecto: "" }), Date.now()).run();
    return txt(idea ? `✓ Idea apuntada: ${x}` : `✓ Tasca per avui: ${x}`);
  }
  // «Guardar visionat» (des de YouTube o Vimeo): ?v=enllaç
  if (q.get("v") !== null) {
    let v = String(q.get("v") || ""); try { v = decodeURIComponent(v) } catch (e) { }
    const mu = v.match(/https?:\/\/[^\s]+/); if (!mu || !/(youtube\.com|youtu\.be|vimeo\.com)/i.test(mu[0])) return txt("Ha de ser un enllaç de YouTube o Vimeo." + (v ? " He rebut: " + v.slice(0, 160) : ""), 400);
    const url = mu[0];
    const { results: vs } = await db.prepare("SELECT data FROM docs WHERE id LIKE 'visionat:%'").all();
    const idv = s => (s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/) || s.match(/vimeo\.com\/(?:video\/)?(\d+)/) || [])[1] || s;
    if (vs.some(r => { try { return idv(JSON.parse(r.data).url || "") === idv(url) } catch (e) { return false } })) return txt("Aquest vídeo ja és a Visionats.");
    let meta = {};
    try { const api = /vimeo/i.test(url) ? "https://vimeo.com/api/oembed.json?url=" : "https://www.youtube.com/oembed?format=json&url="; const rr = await fetch(api + encodeURIComponent(url)); if (rr.ok) meta = await rr.json() } catch (e) { }
    const yt = (url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/) || [])[1];
    const d = { titulo: String(meta.title || "").slice(0, 200), url, autor: String(meta.author_name || "").slice(0, 120), thumb: meta.thumbnail_url || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : ""), durada: +meta.duration || 0, exercici: [], nivell: [], notas: "" };
    const id = "visionat:" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await db.prepare("INSERT INTO docs(id,data,updated) VALUES(?1,?2,?3)").bind(id, JSON.stringify(d), Date.now()).run();
    return txt(`✓ Guardat a Visionats${d.titulo ? ": " + d.titulo : ""}. Tria-li l'exercici al hub.`);
  }
  // el que arribi (també codificat, o enganxat a la resta de l'adreça si no ve dins de «u»)
  let tot = String(u) + " " + new URL(request.url).search;
  for (let i = 0; i < 3; i++) { try { const d = decodeURIComponent(tot); if (d === tot) break; tot = d } catch (e) { break } }
  u = String(u).trim();
  // perfil a partir de l'enllaç compartit (instagram.com/usuari?igsh=…, instagram.com/_u/usuari) o de @usuari
  const m = tot.match(/instagram\.com\/(?:_u\/)?(?!p\/|reel\/|reels\/|stories\/|explore\/|tv\/|share\/)([A-Za-z0-9._]{1,30})/i) || u.match(/^@?([A-Za-z0-9._]{1,30})$/);
  if (!m) return txt("No és un perfil d'Instagram. Comparteix-lo des del perfil (⋯ → «Compartir este perfil»)." + (u ? " He rebut: " + u.slice(0, 160) : " No ha arribat cap enllaç."), 400);
  const usr = m[1].toLowerCase(), norm = s => String(s || "").toLowerCase().replace(/^.*instagram\.com\//, "").replace(/[/?#].*$/, "").replace(/^@/, "").trim();
  const avui = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  const { results } = await db.prepare("SELECT id,data FROM docs WHERE id LIKE 'c\\_%' ESCAPE '\\'").all();
  const tipus = ["Productora", "Artista", "Mànager"].includes(q.get("t")) ? q.get("t") : "";
  const resp = q.get("r") !== null; // «Ha respost al hub»: ?r=1&u=perfil
  let c = null;
  for (const x of results) { try { const o = JSON.parse(x.data); if (norm(o.ig) === usr) { c = { ...o, id: x.id }; break } } catch (e) { } }
  if (c && resp) {
    const ja = c.estado === "Ha respost"; c.estado = "Ha respost"; if (tipus && !c.tipo) c.tipo = tipus;
    if (!c.resp) c.resp = avui; // no esborrar el que hagi arribat per Instagram
    await db.prepare("UPDATE docs SET data=?1,updated=?2 WHERE id=?3").bind(JSON.stringify(c), Date.now(), c.id).run();
    return txt(ja ? `${c.nombre || "@" + usr} ja estava com a «Ha respost»` : `✓ ${c.nombre || "@" + usr}: ha respost`);
  }
  if (c) {
    const msgs = Array.isArray(c.msgs) ? c.msgs : [];
    if (!msgs.some(x => x && x.d === avui && x.v === "Instagram")) msgs.push({ d: avui, v: "Instagram", t: "" });
    c.msgs = msgs; if ((c.estado || "Pendent") === "Pendent") c.estado = "Contactat"; if (tipus && !c.tipo) c.tipo = tipus;
    await db.prepare("UPDATE docs SET data=?1,updated=?2 WHERE id=?3").bind(JSON.stringify(c), Date.now(), c.id).run();
    return txt(`✓ ${c.nombre || "@" + usr}: contactat avui`);
  }
  const id = "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const n = { id, nombre: "@" + usr, persona: "", tipo: tipus || "Artista", estado: resp ? "Ha respost" : "Contactat", motivos: [], email: "", ig: "@" + usr, tel: "", web: "", dir: "", man: "", manId: "", notas: "Afegit des de la drecera d'Instagram.", msgs: resp ? [] : [{ d: avui, v: "Instagram", t: "" }], ...(resp ? { resp: avui } : {}) };
  await db.prepare("INSERT INTO docs(id,data,updated) VALUES(?1,?2,?3)").bind(id, JSON.stringify(n), Date.now()).run();
  return txt(resp ? `✓ @${usr} afegit a Contactes com a «Ha respost»` : `✓ @${usr} afegit a Contactes com a contactat avui`);
}
// ---------- enllaços públics d'arxius (material per als alumnes, resum diari) ----------
async function signa(db, id) {
  let r = await db.prepare("SELECT data FROM docs WHERE id='secret:arxius'").first(), k = r ? JSON.parse(r.data).k : "";
  if (!k) { k = [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, "0")).join(""); await db.prepare("INSERT INTO docs(id,data,updated) VALUES('secret:arxius',?1,?2) ON CONFLICT(id) DO NOTHING").bind(JSON.stringify({ k }), Date.now()).run(); r = await db.prepare("SELECT data FROM docs WHERE id='secret:arxius'").first(); k = JSON.parse(r.data).k }
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(k), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sg = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("arxiu:" + id));
  return [...new Uint8Array(sg)].slice(0, 12).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function clauPont(request, db) {
  const r = await db.prepare("SELECT data FROM docs WHERE id='secret:correu'").first(), cfg = r ? JSON.parse(r.data) : null, clau = request.headers.get("x-clau") || "";
  return !!(cfg && cfg.clau && clau.length === cfg.clau.length && igual(clau, cfg.clau));
}
const diaMadrid = (d = new Date()) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const sumaDies = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) };

// ---------- resum diari (el pont l'envia per correu cap a les 8:30): només el que és d'avui ----------
async function pontDiari(request, db, j) {
  if (!await clauPont(request, db)) return j({ error: "no" }, 403);
  const b = await request.json().catch(() => ({})) || {};
  const avui = diaMadrid(), base = new URL(request.url).origin;
  const { results } = await db.prepare("SELECT id,data FROM docs WHERE id LIKE 'tarea:%' OR id LIKE 'reunion:%' OR id LIKE 'curs:%' OR id LIKE 'pdr:%' OR id LIKE 'feina:%' OR id LIKE 'convocatoria:%' OR id LIKE 'proyecto:%' OR id LIKE 'visionat:%' OR id = 'ajust:vigila' OR id = 'ajust:objectius' OR id = 'fin:subs' OR substr(id,1,2)='c_'").all();
  const D = {}; for (const r of results) { try { const o = JSON.parse(r.data); o.id = r.id; const t = r.id.startsWith("c_") ? "c" : r.id.split(":")[0]; (D[t] = D[t] || []).push(o) } catch (e) { } }
  const L = t => D[t] || [], esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const pn = id => (L("proyecto").find(x => x.id === id) || {}).titulo || "";
  const secs = [];
  const sec = (t, files) => { if (files.length) secs.push(`<h3 style="font-size:15px;margin:22px 0 8px">${esc(t)}</h3>` + files.map(f => `<div style="padding:6px 0;border-bottom:1px solid #eee">${f}</div>`).join("")) };
  // agenda d'avui, per hores
  const ag = [];
  L("reunion").filter(x => x.fecha === avui).forEach(x => ag.push([x.hora || "", `<b>Reunió: ${esc(x.titulo)}</b>${x.lugar ? " · " + esc(x.lugar) : ""}${x.proyecto ? " · " + esc(pn(x.proyecto)) : ""}`]));
  for (const c of L("curs")) for (const s of (Array.isArray(c.setmanes) ? c.setmanes : [])) if (s && s.data === avui) {
    const mats = [];
    for (const a of (s.arxius || [])) mats.push(`<a href="${base}/api/public/arxiu/${a.id}/${await signa(db, a.id)}">${esc(a.nombre)}</a>`);
    for (const vid of (s.vis || [])) { const v = L("visionat").find(x => x.id === vid); if (v) mats.push(`<a href="${esc(v.url)}">${esc(v.titulo || "Visionat")}</a>`) }
    ag.push([s.hora || "", `<b>Classe: ${esc(c.titulo)}</b>${s.horafi ? ` · fins a les ${esc(s.horafi)}` : ""}${c.centre ? " · " + esc(c.centre) : ""}${s.tema ? `<br>${esc(s.tema)}` : ""}${mats.length ? `<br><span style="color:#666">Material:</span> ${mats.join(" · ")}` : ""}`]);
  }
  L("pdr").forEach(x => (x.dias || []).forEach((d, i) => { if (d && d.fecha === avui) ag.push([(String(d.calls || "").match(/\d{1,2}:\d{2}/) || [""])[0], `<b>Rodatge: ${esc(x.titulo || pn(x.proyecto) || "Pla de rodatge")}</b> · jornada ${i + 1}${d.calls ? " · " + esc(d.calls) : ""}`]) }));
  L("feina").filter(x => x.ini === avui && x.estado !== "Pressupostat").forEach(x => ag.push(["", `<b>Comença la feina: ${esc(x.titulo)}</b>${x.productora ? " · " + esc(x.productora) : ""}`]));
  L("convocatoria").filter(x => x.evento === avui && ["Seleccionat", "Premiat", "Presentat"].includes(x.estado)).forEach(x => ag.push(["", `<b>Festival: ${esc(x.titulo)}</b>${x.proyecto ? " · " + esc(pn(x.proyecto)) : ""}`]));
  sec("Agenda", ag.sort((a, b) => (a[0] || "99").localeCompare(b[0] || "99")).map(x => (x[0] ? `<span style="display:inline-block;min-width:52px;color:#666">${esc(x[0])}</span>` : "") + x[1]));
  sec("Tasques per avui", L("tarea").filter(x => !x.hecha && x.fecha === avui).map(x => esc(x.titulo) + (x.proyecto ? ` <span style="color:#666">· ${esc(pn(x.proyecto))}</span>` : "")));
  // terminis: avui, i avisos a 2 i 7 dies
  const ter = [];
  L("convocatoria").filter(x => (!x.estado || x.estado === "Per presentar") && x.limite).forEach(x => {
    const n = x.limite === avui ? 0 : x.limite === sumaDies(avui, 2) ? 2 : x.limite === sumaDies(avui, 7) ? 7 : -1;
    if (n >= 0) ter.push(`<b>${esc(x.titulo)}</b>${x.proyecto ? " · " + esc(pn(x.proyecto)) : ""} · ${n === 0 ? "<b style=\"color:#d70015\">el termini acaba avui</b>" : `falten ${n} dies (${esc(x.limite.split("-").reverse().join("/"))})`}`);
  });
  sec("Terminis", ter);
  // seguiments que toquen avui (7 dies sense resposta)
  const seg = L("c").filter(c => c.estado === "Contactat" && Array.isArray(c.msgs) && c.msgs.length > 0 && c.msgs.length < 3 && c.msgs[c.msgs.length - 1].d === sumaDies(avui, -7));
  sec("Toca fer seguiment", seg.map(c => `<b>${esc(c.nombre)}</b>${c.persona ? " · " + esc(c.persona) : ""} · li vas escriure fa 7 dies per ${esc(c.msgs[c.msgs.length - 1].v || "missatge")}`));
  // cobraments: fa 30 dies de la factura
  sec("Per reclamar", L("feina").filter(x => x.estado === "Facturat" && x.facturat && x.facturat <= sumaDies(avui, -30) && (x.facturat === sumaDies(avui, -30) || new Date(avui).getUTCDay() === 1)).map(x => `<b>${esc(x.titulo)}</b>${x.productora ? " · " + esc(x.productora) : ""} · factura ${esc(x.factura || "")} del ${esc(x.facturat.split("-").reverse().join("/"))}, encara per cobrar`));
  // convocatòries vigilades que han canviat avui
  const vg = (L("ajust").find(x => x.id === "ajust:vigila") || {}).llista || [];
  sec("Convocatòries amb novetats", vg.filter(x => x.canvi === avui).map(x => `<a href="${esc(x.url)}"><b>${esc(x.nom)}</b></a> ha canviat la seva pàgina`));
  // despeses fixes trimestrals o anuals: avís 7 dies abans i el dia abans
  const subs = ((L("fin").find(x => x.id === "fin:subs") || {}).l || []).filter(x => x && x.actiu !== false && /^\d{4}-\d\d-\d\d$/.test(x.data || "") && ["Trimestral", "Anual"].includes(x.per));
  const mesos = (d, m) => { const [a, mm, dd] = d.split("-").map(Number), t = a * 12 + mm - 1 + m, y = Math.floor(t / 12), mo = t % 12 + 1, mx = new Date(Date.UTC(y, mo, 0)).getUTCDate(); return `${y}-${String(mo).padStart(2, "0")}-${String(Math.min(dd, mx)).padStart(2, "0")}` };
  const propera = x => { let d = x.data, k = 0; const pas = x.per === "Anual" ? 12 : 3; while (d < avui && k < 2400) { k += pas; d = mesos(x.data, k) } return d };
  sec("Renovacions", subs.map(x => [x, propera(x)]).filter(([, d]) => d === sumaDies(avui, 7) || d === sumaDies(avui, 1)).map(([x, d]) => `<b>${esc(x.nom)}</b> · ${esc(x.per.toLowerCase())}, ${esc((Math.abs(+String(x.import).replace(",", ".") || 0)).toLocaleString("ca-ES", { maximumFractionDigits: 2 }))} € · es cobra ${d === sumaDies(avui, 1) ? "<b>demà</b>" : "el " + esc(d.split("-").reverse().join("/"))}. Si no la vols, cancel·la-la abans.`));
  // els dilluns, la setmana sencera (de demà a diumenge)
  if (new Date(avui + "T12:00:00Z").getUTCDay() === 1) {
    const fi = sumaDies(avui, 6), dins = d => d && d > avui && d <= fi, dia = d => new Date(d + "T12:00:00Z").toLocaleDateString("ca-ES", { weekday: "short", day: "numeric", timeZone: "UTC" });
    const st = [];
    L("reunion").filter(x => dins(x.fecha)).forEach(x => st.push([x.fecha + (x.hora || ""), `${dia(x.fecha)}${x.hora ? " " + esc(x.hora) : ""} · Reunió: <b>${esc(x.titulo)}</b>${x.proyecto ? " · " + esc(pn(x.proyecto)) : ""}`]));
    L("pdr").forEach(x => (x.dias || []).forEach((d, i) => { const h = (String(d && d.calls || "").match(/\d{1,2}:\d{2}/) || [""])[0]; if (d && dins(d.fecha)) st.push([d.fecha + h, `${dia(d.fecha)}${h ? " " + esc(h) : ""} · Rodatge: <b>${esc(x.titulo || pn(x.proyecto) || "Pla de rodatge")}</b>, jornada ${i + 1}`]) }));
    for (const c of L("curs")) for (const s2 of (Array.isArray(c.setmanes) ? c.setmanes : [])) if (s2 && dins(s2.data)) st.push([s2.data + (s2.hora || ""), `${dia(s2.data)}${s2.hora ? " " + esc(s2.hora) : ""} · Classe: <b>${esc(c.titulo)}</b>${s2.tema ? " · " + esc(s2.tema) : ""}`]);
    L("convocatoria").filter(x => (!x.estado || x.estado === "Per presentar") && dins(x.limite)).forEach(x => st.push([x.limite, `${dia(x.limite)} · Acaba el termini: <b>${esc(x.titulo)}</b>${x.proyecto ? " · " + esc(pn(x.proyecto)) : ""}`]));
    L("feina").filter(x => dins(x.ini) && x.estado !== "Pressupostat").forEach(x => st.push([x.ini, `${dia(x.ini)} · Comença la feina: <b>${esc(x.titulo)}</b>${x.productora ? " · " + esc(x.productora) : ""}`]));
    L("convocatoria").filter(x => ["Seleccionat", "Premiat", "Presentat"].includes(x.estado) && dins(x.evento)).forEach(x => st.push([x.evento, `${dia(x.evento)} · Festival: <b>${esc(x.titulo)}</b>${x.proyecto ? " · " + esc(pn(x.proyecto)) : ""}`]));
    L("tarea").filter(x => !x.hecha && dins(x.fecha)).forEach(x => st.push([x.fecha, `${dia(x.fecha)} · ${esc(x.titulo)}${x.proyecto ? ` <span style="color:#666">· ${esc(pn(x.proyecto))}</span>` : ""}`]));
    sec("Aquesta setmana", st.sort((a, b) => a[0].localeCompare(b[0])).map(x => x[1]));
    const pend = L("c").filter(c => c.estado === "Contactat" && Array.isArray(c.msgs) && c.msgs.length > 0 && c.msgs.length < 3 && c.msgs[c.msgs.length - 1].d <= sumaDies(avui, -7)).length;
    const ret = L("tarea").filter(x => !x.hecha && x.fecha && x.fecha < avui).length;
    sec("Pendent", [pend && `${pend} ${pend === 1 ? "contacte espera" : "contactes esperen"} un seguiment`, ret && `${ret} ${ret === 1 ? "tasca endarrerida" : "tasques endarrerides"}`].filter(Boolean));
  }
  if (b.festivals > 0) sec("Festivals", [`${b.festivals} ${b.festivals === 1 ? "avís nou" : "avisos nous"} de FilmFreeway o Festhome. Obre Avui al hub per confirmar-los.`]);
  const nom = new Date().toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;color:#000;max-width:600px;font-size:15px;line-height:1.5"><h2 style="font-size:22px;margin:0 0 4px">${esc(nom[0].toUpperCase() + nom.slice(1))}</h2>${secs.join("")}<p style="margin-top:26px"><a href="${base}" style="color:#000">Obrir el hub</a></p></div>`;
  return j({ buit: !secs.length, assumpte: "Avui · " + nom, html });
}

// ---------- vigilant de convocatòries: el pont revisa les pàgines un cop per setmana ----------
async function pontVigila(m, request, db, j) {
  if (!await clauPont(request, db)) return j({ error: "no" }, 403);
  const r = await db.prepare("SELECT data FROM docs WHERE id='ajust:vigila'").first(), v = r ? JSON.parse(r.data) : { llista: [] };
  if (m === "GET") return j({ llista: (v.llista || []).map(x => ({ id: x.id, url: x.url })) });
  const b = await request.json().catch(() => ({})) || {}, avui = diaMadrid();
  for (const x of (b.resultats || [])) {
    const e = (v.llista || []).find(y => y.id === x.id); if (!e) continue;
    e.revisat = avui;
    if (x.err) { e.error = String(x.err).slice(0, 120); continue }
    delete e.error;
    if (x.hash && e.hash && x.hash !== e.hash) { e.canvi = avui; e.vist = false }
    if (x.hash) e.hash = x.hash; if (x.extracte) e.extracte = String(x.extracte).slice(0, 600);
  }
  // es torna a llegir just abans de desar perquè no es perdi una pàgina afegida o treta mentre el pont revisava
  const r2 = await db.prepare("SELECT data FROM docs WHERE id='ajust:vigila'").first(), v2 = r2 ? JSON.parse(r2.data) : { llista: [] };
  v2.llista = (v2.llista || []).map(y => { const e = (v.llista || []).find(z => z.id === y.id && z.url === y.url); return e ? { ...y, revisat: e.revisat, error: e.error, hash: e.hash, canvi: e.canvi, vist: e.vist, extracte: e.extracte } : y });
  v2.id = "ajust:vigila";
  await db.prepare("INSERT INTO docs(id,data,updated) VALUES('ajust:vigila',?1,?2) ON CONFLICT(id) DO UPDATE SET data=?1,updated=?2").bind(JSON.stringify(v2), Date.now()).run();
  return j({ ok: 1 });
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
// Esdeveniments del hub per al calendari (iCal i Google Calendar). esb = es pot esborrar des de Google.
async function esdeveniments(db) {
  const { results } = await db.prepare("SELECT id,data FROM docs WHERE id LIKE 'tarea:%' OR id LIKE 'reunion:%' OR id LIKE 'convocatoria:%' OR id LIKE 'pdr:%' OR id LIKE 'feina:%' OR id LIKE 'proyecto:%' OR id LIKE 'curs:%'").all();
  const D = results.map(x => ({ ...JSON.parse(x.data), id: x.id })), T = k => D.filter(x => x.id.startsWith(k + ":"));
  const proj = Object.fromEntries(T("proyecto").map(p => [p.id, p.titulo || ""]));
  const ev = [], dia = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s.replace(/-/g, "") : null;
  const add = (uid, d, titol, o = {}) => { if (!dia(d)) return; ev.push({ uid, d: dia(d), titol, ...o }) };
  T("tarea").filter(x => !x.hecha).forEach(x => add(x.id, x.fecha, "☐ " + (x.titulo || "Tasca"), { desc: x.notas }));
  T("reunion").forEach(x => add(x.id, x.fecha, "Reunió: " + (x.titulo || ""), { hora: x.hora, durada: x.durada > 0 && x.durada < 1440 ? x.durada : 60, lloc: x.lugar, desc: x.apuntes }));
  T("convocatoria").forEach(x => { add(x.id + "-l", x.limite, "Límit: " + (x.titulo || ""), { desc: [x.web, x.notas].filter(Boolean).join("\n") }); if (x.evento) add(x.id + "-e", x.evento, (x.titulo || "Festival") + (x.lugar ? " (" + x.lugar + ")" : ""), {}) });
  T("pdr").forEach(x => (Array.isArray(x.dias) ? x.dias : []).forEach((d, i) => add(x.id + "-" + i, d.fecha, `Rodatge ${proj[x.proyecto] || x.titulo || ""} · jornada ${i + 1}`, { desc: d.calls })));
  T("curs").forEach(x => (Array.isArray(x.setmanes) ? x.setmanes : []).forEach((s, i) => s && add(x.id + "-" + (s.id || i), s.data, `Classe: ${x.titulo || ""}${s.tema ? " · " + s.tema : ""}`, { hora: s.hora, durada: /^\d\d:\d\d$/.test(s.hora || "") && /^\d\d:\d\d$/.test(s.horafi || "") && s.horafi > s.hora ? (+s.horafi.slice(0, 2) * 60 + +s.horafi.slice(3, 5)) - (+s.hora.slice(0, 2) * 60 + +s.hora.slice(3, 5)) : 60, lloc: x.centre, desc: s.notes })));
  T("feina").forEach(x => { add(x.id, x.ini, `${x.rol || "Feina"}: ${x.titulo || ""}`, { fi: x.fin, lloc: x.productora }) });
  return ev;
}
async function ical(t, db) {
  const no = () => new Response("not found", { status: 404 });
  const r = await db.prepare("SELECT data FROM docs WHERE id='secret:ical'").first(); if (!r) return no();
  const tok = JSON.parse(r.data).token; t = t.replace(/\.ics$/, "");
  if (!tok || t.length !== tok.length || !igual(t, tok)) return no();
  const ev = await esdeveniments(db);
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

// ---------- Instagram (missatges de feina) ----------
// Connexió amb la API d'Instagram amb inici de sessió unificat (app de Meta «PABLO Hub»). El token es guarda a D1 (secret:instagram) i no surt mai cap al navegador.
// Filtre: només es desa res si el missatge és d'algú que ja és a Contactes (pel seu @ o per l'igsid ja vinculat). La resta es descarta sense guardar-ne res.
// Variables a Cloudflare: IG_APP_SECRET (clau secreta de l'app de Meta). Opcionals: IG_APP_ID, IG_CONFIG_ID.
const IGV = "v26.0", IGG = "https://graph.facebook.com/" + IGV;
async function igS(db) { const r = await db.prepare("SELECT data FROM docs WHERE id='secret:instagram'").first(); return r ? JSON.parse(r.data) : {} }
async function igPut(db, s) { await db.prepare("INSERT INTO docs(id,data,updated) VALUES('secret:instagram',?1,?2) ON CONFLICT(id) DO UPDATE SET data=?1,updated=?2").bind(JSON.stringify(s), Date.now()).run() }
const aleat = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, "0")).join("");
async function igFetch(url, o = {}, tok) { const r = await fetch(url, tok ? { ...o, headers: { ...(o.headers || {}), authorization: "Bearer " + tok } } : o); let d = {}; try { d = await r.json() } catch (e) { } if (!r.ok || d.error) throw new Error((d.error && (d.error.message || d.error.type)) || "HTTP " + r.status); return d }

async function instagram(p, m, request, env, db, j) {
  const url = new URL(request.url), q = url.searchParams, origen = url.origin;
  const APP = env.IG_APP_ID || "1504064994909783", CONF = env.IG_CONFIG_ID || "2328571327936139", retorn = origen + "/auth/instagram/callback";
  const pagina = (t, ok) => new Response(`<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PABLO</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,Helvetica,Arial,sans-serif;background:#f5f4f1;color:#1c1c1e;text-align:center;padding:24px;box-sizing:border-box}h1{font-size:24px;line-height:1.3;margin:0 0 12px}p{color:#8e8e93;font-size:15px;margin:0 0 18px}a{display:inline-block;background:#1c1c1e;color:#fff;text-decoration:none;border-radius:12px;padding:11px 18px}</style></head><body><div><h1>${t.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</h1><p>${ok ? "Ja pots tancar aquesta pestanya." : "Torna-ho a provar des de Configuració."}</p><a href="/">Tornar al hub</a></div></body></html>`, { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  let s = await igS(db);

  // --- webhook (públic: el middleware el deixa passar; la signatura demostra que ve de Meta) ---
  if (p === "webhook" && m === "GET") {
    if (q.get("hub.mode") === "subscribe" && s.vt && q.get("hub.verify_token") === s.vt) return new Response(q.get("hub.challenge") || "", { headers: { "content-type": "text/plain" } });
    return new Response("no", { status: 403 });
  }
  if (p === "webhook" && m === "POST") {
    const cos = await request.text();
    if (!env.IG_APP_SECRET) return new Response("sense clau", { status: 503 });
    const sig = (request.headers.get("x-hub-signature-256") || "").replace(/^sha256=/, "");
    const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.IG_APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const bo = [...new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(cos)))].map(b => b.toString(16).padStart(2, "0")).join("");
    if (sig.length !== bo.length || !igual(sig, bo)) return new Response("signatura", { status: 403 });
    // amb la signatura bona es respon sempre «ok», perquè Meta no reintenti sense fi
    try {
      const b = JSON.parse(cos), evs = [], ll = v => Array.isArray(v) ? v : [];
      for (const en of ll(b.entry)) for (const x of ll(en && en.messaging)) {
        const mm = x && x.message; if (!mm || mm.is_deleted || mm.is_unsupported) continue;
        const echo = !!mm.is_echo, peer = String((echo ? (x.recipient || {}).id : (x.sender || {}).id) || "");
        if (!peer || peer === String(s.ig)) continue;
        evs.push({ peer, mid: mm.mid, text: mm.text || igAdjunt(ll(mm.attachments)[0]), ts: +x.timestamp || Date.now(), echo });
      }
      if (evs.length && s.token) { const n = await igProcessa(db, s, evs); if (n) { s = await igS(db); s.ultim = Date.now(); await igPut(db, s) } }
    } catch (e) { }
    return new Response("ok");
  }

  // --- la resta, només amb la contrasenya del hub (ho fa el middleware) ---
  if (p === "estat" && m === "GET") {
    if (!s.vt) { s.vt = aleat(16); await igPut(db, s) }
    return j({ connectat: !!s.token, usuari: s.usuari || "", ig: s.ig || "", subscrit: !!s.subscrit, error: s.error || "", ultim: s.ultim || 0, revisat: s.revisat || 0, webhook: origen + "/api/instagram/webhook", vt: s.vt, clau: !!env.IG_APP_SECRET, retorn });
  }
  if (p === "inici" && m === "GET") {
    if (!env.IG_APP_SECRET) return pagina("Falta la clau secreta de l'app (IG_APP_SECRET) a Cloudflare.", false);
    s.state = aleat(16); s.stateT = Date.now(); await igPut(db, s);
    const u = `https://www.facebook.com/${IGV}/dialog/oauth?client_id=${APP}&config_id=${CONF}&redirect_uri=${encodeURIComponent(retorn)}&response_type=code&override_default_response_type=true&state=${s.state}`;
    return new Response(null, { status: 302, headers: { location: u } });
  }
  if (p === "callback" && m === "GET") {
    if (q.get("error")) return pagina("No s'ha connectat: " + (q.get("error_description") || q.get("error")), false);
    const st = q.get("state") || "", code = q.get("code") || "";
    if (!s.state || st !== s.state || Date.now() - (s.stateT || 0) > 30 * 60e3) return pagina("L'enllaç ha caducat. Torna a prémer «Connectar Instagram».", false);
    if (!code) return pagina("Meta no ha enviat el codi.", false);
    let tk;
    const base = `${IGG}/oauth/access_token?client_id=${APP}&client_secret=${encodeURIComponent(env.IG_APP_SECRET || "")}&code=${encodeURIComponent(code)}`;
    try { tk = await igFetch(base + "&redirect_uri=" + encodeURIComponent(retorn)) } catch (e) { try { tk = await igFetch(base) } catch (e2) { return pagina("Meta no ha donat el token (resposta de Meta: " + e.message + ")", false) } }
    const token = tk.access_token; if (!token) return pagina("Meta no ha donat el token.", false);
    let ig = "", usuari = "";
    try { const a = await igFetch(`${IGG}/me/assigned_instagram_accounts?fields=id,username`, {}, token); const x = (a.data || [])[0] || {}; ig = x.id || ""; usuari = x.username || "" } catch (e) { }
    if (ig && !usuari) { try { usuari = (await igFetch(`${IGG}/${ig}?fields=username`, {}, token)).username || "" } catch (e) { } }
    if (!ig) return pagina("Connectat, però no trobo cap compte d'Instagram compartit. Torna-ho a provar i tria @pabloanarte.", false);
    s = { ...s, token, ig, usuari, connectat: Date.now(), error: "" }; delete s.state; delete s.stateT;
    try { await igFetch(`${IGG}/${ig}/subscribed_apps?subscribed_fields=messages`, { method: "POST" }, token); s.subscrit = 1 } catch (e) { s.subscrit = 0; s.error = "No s'han pogut activar els avisos (resposta de Meta: " + e.message + ")" }
    await igPut(db, s);
    return pagina(`✓ Instagram connectat${usuari ? " (@" + usuari + ")" : ""}`, true);
  }
  if (p === "subscriu" && m === "POST") {
    if (!s.token) return j({ error: "no connectat" }, 400);
    try { await igFetch(`${IGG}/${s.ig}/subscribed_apps?subscribed_fields=messages`, { method: "POST" }, s.token); s.subscrit = 1; s.error = ""; await igPut(db, s); return j({ ok: 1 }) }
    catch (e) { s.subscrit = 0; s.error = "No s'han pogut activar els avisos (resposta de Meta: " + e.message + ")"; await igPut(db, s); return j({ error: e.message }, 502) }
  }
  if (p === "desconnecta" && m === "POST") { await igPut(db, { vt: s.vt }); return j({ ok: 1 }) }
  if (p === "revisa" && m === "POST") {
    if (!s.token) return j({ error: "no connectat" }, 400);
    const b = await request.json().catch(() => ({}));
    if (b.auto && Date.now() - (s.revisat || 0) < 15 * 60e3) return j({ ok: 1, n: 0, saltat: 1 });
    s.revisat = Date.now(); await igPut(db, s);
    try { const n = await igRevisa(db, s); if (s.error) { s = await igS(db); s.error = ""; await igPut(db, s) } return j({ ok: 1, n }) }
    catch (e) { s = await igS(db); s.error = "No s'ha pogut revisar (resposta de Meta: " + e.message + ")"; await igPut(db, s); return j({ error: e.message }, 502) }
  }
  return j({ error: "not found" }, 404);
}

// En desar un contacte des del navegador, es conserva el que el webhook hi ha posat mentrestant (igsid, igmids, respostes i enviaments d'Instagram)
async function igConserva(db, id, b) {
  try {
    const r = await db.prepare("SELECT data FROM docs WHERE id=?1").bind(id).first(); if (!r) return b;
    const a = JSON.parse(r.data), n = JSON.parse(b); if (!a.igmids && !a.igsid) return b;
    if (a.igsid && !n.igsid) n.igsid = a.igsid;
    const nm = Array.isArray(n.igmids) ? n.igmids : [], am = Array.isArray(a.igmids) ? a.igmids : [];
    const nous = am.some(x => !nm.includes(x)); n.igmids = [...new Set(nm.concat(am))].slice(-100);
    if (!nous) return JSON.stringify(n);
    const linies = String(a.resp || "").split("\n\n").filter(l => / · Instagram: /.test(l) && !String(n.resp || "").includes(l));
    if (linies.length) n.resp = (n.resp ? n.resp + "\n\n" : "") + linies.join("\n\n");
    const ms = Array.isArray(n.msgs) ? n.msgs : [];
    for (const x of Array.isArray(a.msgs) ? a.msgs : []) if (x && x.v === "Instagram" && x.t && !ms.some(y => y && y.d === x.d && y.v === "Instagram" && y.t === x.t)) ms.push(x);
    n.msgs = ms.sort((x, y) => String(x.d).localeCompare(String(y.d)));
    if (a.respIG && a.respIG !== n.respIG) { n.respIG = a.respIG; if (a.estado === "Ha respost" && (!n.estado || n.estado === "Pendent" || n.estado === "Contactat")) n.estado = "Ha respost" }
    return JSON.stringify(n);
  } catch (e) { return b }
}

const igAdjunt = a => "[" + (({ image: "foto", video: "vídeo", audio: "àudio", file: "arxiu", share: "publicació compartida", story_mention: "menció a la història", reel: "reel", ig_reel: "reel", animated_image: "gif" })[a && a.type] || (a ? "adjunt" : "missatge")) + "]";
// Busca el @ d'un remitent (igsid → username) amb el token
async function igUsuari(s, igsid) {
  try { return String((await igFetch(`${IGG}/${igsid}?fields=username`, {}, s.token)).username || "").toLowerCase() } catch (e) { return "" }
}
const igNorm = v => String(v || "").toLowerCase().replace(/^.*instagram\.com\//, "").replace(/[/?#].*$/, "").replace(/^@/, "").trim();

// evs: [{peer (igsid de l'altra persona), usuari?, mid, text, ts, echo (l'he enviat jo)}]. Torna quants contactes han canviat.
async function igProcessa(db, s, evs) {
  const { results } = await db.prepare("SELECT id,data FROM docs WHERE id LIKE 'c\\_%' ESCAPE '\\'").all();
  const cs = []; for (const x of results) { try { cs.push({ ...JSON.parse(x.data), id: x.id }) } catch (e) { } }
  const perSid = new Map(cs.filter(c => c.igsid).map(c => [String(c.igsid), c])), perUsr = new Map(cs.filter(c => igNorm(c.ig)).map(c => [igNorm(c.ig), c]));
  if (!perUsr.size && !perSid.size) return 0;
  const usrs = new Map(), canviats = new Set(); let nous = 0;
  evs.sort((a, b) => a.ts - b.ts);
  for (const ev of evs) {
    let c = perSid.get(ev.peer);
    if (!c) {
      let u = ev.usuari ? igNorm(ev.usuari) : usrs.get(ev.peer);
      if (u === undefined) { u = await igUsuari(s, ev.peer); usrs.set(ev.peer, u) }
      c = u ? perUsr.get(u) : null;
      if (!c) continue; // no és a Contactes: no es guarda res
      c.igsid = ev.peer; perSid.set(ev.peer, c); canviats.add(c);
    }
    const mids = Array.isArray(c.igmids) ? c.igmids : [];
    if (ev.mid && mids.includes(ev.mid)) continue;
    if (ev.mid) { mids.push(ev.mid); c.igmids = mids.slice(-100) }
    const d = diaMadrid(new Date(ev.ts)), t = String(ev.text || "").slice(0, 2000);
    if (ev.echo) {
      const msgs = Array.isArray(c.msgs) ? c.msgs : [];
      const dia = msgs.find(x => x && x.d === d && x.v === "Instagram"); // un sol enviament per dia, amb tots els textos
      if (!dia) msgs.push({ d, v: "Instagram", t }); else if (!dia.t) dia.t = t; else if (!dia.t.split(" / ").includes(t)) dia.t = (dia.t + " / " + t).slice(0, 4000);
      c.msgs = msgs.sort((a, b) => String(a.d).localeCompare(String(b.d)));
      if (!c.estado || c.estado === "Pendent") c.estado = "Contactat";
    } else {
      const primer = (Array.isArray(c.msgs) ? c.msgs : []).map(x => x && x.d).filter(Boolean).sort()[0];
      if ((!c.estado || c.estado === "Pendent" || c.estado === "Contactat") && (!primer || d >= primer)) c.estado = "Ha respost";
      c.resp = (c.resp ? c.resp + "\n\n" : "") + `${d} · Instagram: ${t}`;
      if (!c.respIG || d > c.respIG) c.respIG = d;
    }
    canviats.add(c); nous++;
  }
  for (const c of canviats) { const { id, ...o } = c; await db.prepare("UPDATE docs SET data=?1,updated=?2 WHERE id=?3").bind(JSON.stringify({ ...o, id }), Date.now(), id).run() }
  return nous;
}

// Revisió de reserva (per si algun avís del webhook no arriba): converses recents (missatges de l'últim mes), però només les de gent que és a Contactes.
async function igRevisa(db, s) {
  const { results } = await db.prepare("SELECT data FROM docs WHERE id LIKE 'c\\_%' ESCAPE '\\'").all();
  const usrs = new Set(), sids = new Set();
  for (const x of results) { try { const o = JSON.parse(x.data); if (igNorm(o.ig)) usrs.add(igNorm(o.ig)); if (o.igsid) sids.add(String(o.igsid)) } catch (e) { } }
  if (!usrs.size && !sids.size) return 0;
  const jo = String(s.usuari || "").toLowerCase();
  const d = await igFetch(`${IGG}/${s.ig}/conversations?platform=instagram&limit=40&fields=participants,updated_time,messages.limit(15){id,from,to,message,created_time}`, {}, s.token);
  const evs = [];
  for (const cv of d.data || []) {
    const altre = ((cv.participants || {}).data || []).find(x => String(x.id) !== String(s.ig) && String(x.username || "").toLowerCase() !== jo);
    if (!altre || !(sids.has(String(altre.id)) || usrs.has(igNorm(altre.username)))) continue; // només contactes
    for (const mm of (cv.messages || {}).data || []) {
      if (Date.parse(mm.created_time) < Date.now() - 30 * 864e5) continue; // només l'últim mes
      const echo = String((mm.from || {}).id) === String(s.ig) || String((mm.from || {}).username || "").toLowerCase() === jo;
      evs.push({ peer: String(altre.id), usuari: altre.username || "", mid: mm.id, text: mm.message || igAdjunt({}), ts: Date.parse(mm.created_time) || Date.now(), echo });
    }
  }
  return evs.length ? igProcessa(db, s, evs) : 0;
}
