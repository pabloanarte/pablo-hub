// Contraseña del hub. Se define en Cloudflare: proyecto pablo-hub → Settings → Variables → HUB_PASSWORD.
// El dispositivo la recuerda 30 días (DIAS). Al cambiar la contraseña, todos los dispositivos tienen que volver a ponerla.
const DIAS = 30;

export async function onRequest({ request, env, next }) {
  const pw = env.HUB_PASSWORD;
  if (!pw) return next(); // sin contraseña configurada: abierto (la sección Mi web no funciona hasta configurarla)
  const token = await hash(pw);
  const url = new URL(request.url);

  if (url.pathname === "/entrar" && request.method === "POST") {
    const f = await request.formData();
    if (f.get("pw") === pw) return new Response(null, { status: 303, headers: { location: "/", "set-cookie": `hub=${token}; Path=/; Max-Age=${DIAS * 86400}; HttpOnly; Secure; SameSite=Lax` } });
    return login(true);
  }
  if (url.pathname === "/salir") return new Response(null, { status: 303, headers: { location: "/", "set-cookie": "hub=; Path=/; Max-Age=0" } });

  const c = (request.headers.get("cookie") || "").match(/(?:^|;\s*)hub=([a-f0-9]+)/);
  if (c && c[1] === token) return next();
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
    { status: error ? 401 : 200, headers: { "content-type": "text/html; charset=utf-8" } });
}
