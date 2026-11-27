// Contraseña del hub. Se define en Cloudflare: proyecto pablo-hub → Settings → Variables → HUB_PASSWORD.
// El dispositivo la recuerda 30 días (DIAS) desde la última vez que se abre el hub (se renueva cada día al abrirlo; importante para usarlo sin conexión). Al cambiar la contraseña, todos los dispositivos tienen que volver a ponerla.
const DIAS = 30;

export async function onRequest({ request, env, next }) {
  const pw = env.HUB_PASSWORD;
  if (!pw) return next(); // sin contraseña configurada: abierto (la sección Mi web no funciona hasta configurarla)
  const token = await hash(pw);
  const url = new URL(request.url);
  // pàgines i dades públiques dels dossiers compartits
  if (/^\/d\/[a-z0-9]{8,24}$/.test(url.pathname) || url.pathname.startsWith("/api/public/") || url.pathname.startsWith("/api/ical/") || url.pathname.startsWith("/api/drecera/") || url.pathname === "/api/instagram/webhook" || url.pathname === "/privacitat" || url.pathname === "/privacitat.html" || url.pathname === "/api/pont/copia" || url.pathname === "/api/pont/cal" || url.pathname === "/api/pont/diari" || url.pathname === "/api/pont/vigila" || url.pathname === "/api/pontdrive" || /^\/(manifest\.webmanifest|icona-\d+\.png)$/.test(url.pathname) || url.pathname === "/deck.js" || url.pathname === "/sw.js") return next();

  if (url.pathname === "/entrar" && request.method === "POST") {
    const f = await request.formData();
    if (f.get("pw") === pw) return new Response(null, { status: 303, headers: { location: "/", "set-cookie": `hub=${token}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; Secure; SameSite=Lax` } });
    return login(true);
  }
  if (url.pathname === "/salir") { const h = new Headers({ location: "/" }); h.append("set-cookie", "hub=; Path=/; Max-Age=0"); h.append("set-cookie", "hubr=; Path=/; Max-Age=0"); return new Response(null, { status: 303, headers: h }) }

  const c = (request.headers.get("cookie") || "").match(/(?:^|;\s*)hub=([a-f0-9]+)/);
  if (c && c[1] === token) {
    // els scripts d'Apps Script (pont-*.gs) es veuen com a text al navegador, per copiar-los (no es descarreguen)
    if (/^\/pont-[a-z]+\.gs$/.test(url.pathname)) { const r = await next(), out = new Response(r.body, r); out.headers.set("content-type", "text/plain; charset=utf-8"); out.headers.set("content-disposition", "inline"); out.headers.set("cache-control", "no-store"); return out }
    // en obrir el hub es renova la galeta (un cop al dia, galeta «hubr»): així no caduca mentre es faci servir, també sense connexió
    if (request.method === "GET" && (request.headers.get("sec-fetch-mode") === "navigate" || (url.pathname === "/" && (request.headers.get("accept") || "").includes("text/html")))) {
      if (!/(?:^|;\s*)hubr=1/.test(request.headers.get("cookie") || "")) {
        const r = await next(), out = new Response(r.body, r);
        out.headers.append("set-cookie", `hub=${token}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; Secure; SameSite=Lax`);
        out.headers.append("set-cookie", "hubr=1; Path=/; Max-Age=86400; Secure; SameSite=Lax");
        return out;
      }
    }
    return next();
  }
  if (url.pathname.startsWith("/api/")) return new Response('{"error":"login"}', { status: 401, headers: { "content-type": "application/json" } });
  return login(false);
}

async function hash(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("pablo-hub|" + s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function login(error) {
  return new Response(`<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PABLO</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Helvetica,Arial,sans-serif;background:#fff;color:#000}
form{display:flex;flex-direction:column;gap:12px;width:260px;text-align:center}h1{font-size:34px;letter-spacing:5px;margin:0 0 10px}
input{font:inherit;font-size:16px;border:1px solid #e5e5ea;border-radius:12px;padding:12px;text-align:center}
button{font:inherit;border:0;background:#000;color:#fff;border-radius:12px;padding:12px;font-size:15px;cursor:pointer}p{color:#ff3b30;font-size:14px;margin:0}</style></head>
<body><form method="post" action="/entrar"><h1>PABLO</h1><input type="password" name="pw" placeholder="Contrasenya" autofocus autocomplete="current-password">${error ? "<p>Contrasenya incorrecta</p>" : ""}<button>Entrar</button></form></body></html>`,
    { status: error ? 401 : 200, headers: { "content-type": "text/html; charset=utf-8", "x-hub-login": "1", "cache-control": "no-store" } });
}
