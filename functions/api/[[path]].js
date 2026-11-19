// API del hub.
//  - Datos del hub: tabla docs de D1 (variable DB). Cada documento es un JSON con un id.
//    Contactos: ids "c_..." y "cfg". Resto de secciones: ids "tipo:xxxx" (p. ej. "reunion:abc").
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
    if (buf.length > 25 * 1024 * 1024) return j({ error: "El archivo pasa de 25 MB" }, 413);
    const ruta = `${carpeta}/${Date.now().toString(36)}-${nombre}`;
    const r = await gh("public/" + ruta, { method: "PUT", body: JSON.stringify({ message: "Hub: subir " + ruta, content: b64(buf), branch: RAMA }) });
    if (!r.ok) return j({ error: "github " + r.status }, 502);
    return j({ ruta });
  }
  return j({ error: "not found" }, 404);
}
function b64(bytes) { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s) }
function deB64(t) { const s = atob(t.replace(/\s/g, "")); return new TextDecoder().decode(Uint8Array.from(s, c => c.charCodeAt(0))) }
