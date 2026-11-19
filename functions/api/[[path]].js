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
      const t = decodeURIComponent(p.slice(4));
      const { results } = await db.prepare("SELECT id,data FROM docs WHERE id LIKE ?1").bind(t + ":%").all();
      return j(results.map(r => ({ ...JSON.parse(r.data), id: r.id })));
    }
    if (p.startsWith("doc/")) {
      const id = decodeURIComponent(p.slice(4));
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
    if (p.startsWith("public/")) return publica(p, request, env, db, j);
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
