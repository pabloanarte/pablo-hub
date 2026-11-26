// Service worker del hub: perquè s'obri i es pugui fer servir sense connexió.
// - App («/» i els .js): primer la xarxa (així el que es publica surt de seguida); si en 3,5 s no respon, la còpia.
//   Si la pàgina s'ha obert des de la còpia, tota l'app d'aquella pàgina surt de la còpia (no barrejar versions).
// - Dades (/api/all, /api/col/<tipus>): igual (5 s) i es desa cada resposta. Sense xarxa, la còpia amb la cua aplicada.
// - Desar o esborrar (/api/doc/<id>): si la xarxa falla, a la cua (IndexedDB) i es contesta {ok:1, offline:1}.
//   Un error del servidor (5xx) no és «sense connexió»: es retorna tal qual perquè la pàgina avisi.
// - Sincronitzar: en tornar la connexió s'envia la cua. Si el document ha canviat en un altre aparell mentrestant,
//   es combinen camp per camp (fusiona); si tots dos han canviat el mateix text, es queden els dos, el de l'altre marcat.
//   Un esborrat d'un document que s'ha canviat en un altre aparell no s'aplica.
// - Arxius (/api/archivo/<id>): els que ja s'han obert sencers es desen (fins a 8 MB) i es poden obrir sense xarxa.
const APP = "hub-app-2", DADES = "hub-dades-2", ARX = "hub-arxius-2";
const T_APP = 3500, T_DADES = 5000, T_DESAR = 15000;
const MARCA = "\n\n— Versió d'un altre aparell —\n";
const deCopia = new Set(); // pàgines obertes des de la còpia

self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(APP).then(c => desa(c, "/"))) });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (![APP, DADES, ARX].includes(k)) await caches.delete(k);
  await self.clients.claim();
})()));

// ---------- IndexedDB: la cua de canvis (un element per document) ----------
let dbp;
const db = () => dbp || (dbp = new Promise((ok, ko) => {
  const r = indexedDB.open("hub-offline", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("cua", { keyPath: "id" });
  r.onsuccess = () => { r.result.onversionchange = () => { r.result.close(); dbp = null }; ok(r.result) };
  r.onerror = () => { dbp = null; ko(r.error) };
}));
const tx = async (mode, fn) => { const d = await db(); return new Promise((ok, ko) => { const t = d.transaction("cua", mode), s = t.objectStore("cua"); let out; const r = fn(s); if (r) r.onsuccess = () => out = r.result; t.oncomplete = () => ok(out); t.onerror = () => ko(t.error) }) };
const cua = () => tx("readonly", s => s.getAll()).then(l => (l || []).sort((a, b) => a.t - b.t));
const posa = it => tx("readwrite", s => s.put(it));
const treu = id => tx("readwrite", s => s.delete(id));
const llegeix = id => tx("readonly", s => s.get(id));

// ---------- utilitats ----------
const ambTemps = (p, ms) => new Promise((ok, ko) => { const t = setTimeout(() => ko(new Error("temps")), ms); p.then(v => { clearTimeout(t); ok(v) }, e => { clearTimeout(t); ko(e) }) });
// fetch que es cancel·la de debò si triga massa (perquè una petició vella no arribi després d'una de nova)
const fetchT = (u, o, ms) => { const a = new AbortController(), t = setTimeout(() => a.abort(), ms); return fetch(u, { credentials: "same-origin", ...o, signal: a.signal }).finally(() => clearTimeout(t)) };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "x-hub-sw": "1" } });
const senseXarxa = m => json({ error: m || "Sense connexió", offline: 1 }, 503);
const esJson = r => (r.headers.get("content-type") || "").includes("json");
const estable = o => JSON.stringify(o, (k, v) => v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).sort().reduce((x, k2) => (x[k2] = v[k2], x), {}) : v);
const igual = (a, b) => estable(a) === estable(b);
const clauDades = id => id.includes(":") ? "/api/col/" + id.split(":")[0] : "/api/all";
async function avisa(m) { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(m) }
let fila = Promise.resolve(); // les escriptures a la còpia de dades, d'una en una (si no, se'n perden)
const enFila = fn => (fila = fila.then(fn, fn));
async function desa(cache, url) { // escalfament: només si la resposta és bona i no és la pàgina d'entrar
  try { const r = await fetch(url, { credentials: "same-origin", cache: "no-cache" }); if (r.ok && !r.headers.get("x-hub-login") && !r.redirected) await cache.put(url, r) } catch (e) { }
}

self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (u.origin !== location.origin) return; // fora del hub (YouTube, Open-Meteo…)
  const p = u.pathname;
  if (["/entrar", "/salir", "/sw.js", "/privacitat", "/privacitat.html"].includes(p) || p.startsWith("/auth/") || p.startsWith("/d/") || p.startsWith("/api/public/")) return;
  if (p.startsWith("/api/")) {
    if (r.method === "GET" && (p === "/api/all" || p.startsWith("/api/col/"))) return e.respondWith(dades(r, u, x => e.waitUntil(x)));
    if (r.method === "GET" && /^\/api\/archivo\/[^/]+$/.test(p)) return e.respondWith(arxiu(r, e));
    if ((r.method === "PUT" || r.method === "DELETE") && p.startsWith("/api/doc/")) return e.respondWith(escriu(r, decodeURIComponent(p.slice(9)), e));
    return e.respondWith(fetch(r).catch(() => senseXarxa()));
  }
  if (r.method !== "GET") return;
  if (r.mode === "navigate") { if (p === "/" || p === "/index.html") e.respondWith(app(e, true)); return } // altres pàgines: el navegador
  e.respondWith(app(e, false));
});

// ---------- app ----------
async function app(e, nav) {
  const r = e.request, clau = nav ? "/" : r.url.split("#")[0];
  // la xarxa comença ja, i la còpia s'actualitza encara que es respongui amb la còpia
  const xarxa = fetch(r).then(res => {
    const tipus = res.headers.get("content-type") || "";
    const bona = res.ok && !res.headers.get("x-hub-login") && !(r.destination === "script" && tipus.includes("html")) && !(nav && !tipus.includes("html"));
    return { res, copia: bona ? res.clone() : null };
  });
  e.waitUntil(xarxa.then(async x => { if (x.copia) await (await caches.open(APP)).put(clau, x.copia) }).catch(() => { }));
  const c = await caches.open(APP);
  if (!nav && deCopia.has(e.clientId)) { const v = await c.match(clau); if (v) return v }
  try { const x = await ambTemps(xarxa, T_APP); if (nav) deCopia.delete(e.resultingClientId); return x.res } catch (err) {
    const v = await c.match(clau, { ignoreSearch: nav });
    if (v) { if (nav && e.resultingClientId) deCopia.add(e.resultingClientId); return v }
    return xarxa.then(x => x.res).catch(() => nav ? new Response("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'><title>PABLO</title><body style='font-family:-apple-system,sans-serif;padding:40px;text-align:center'><h1 style='letter-spacing:5px'>PABLO</h1><p>Sense connexió. Obre el hub un cop amb internet perquè es pugui fer servir sense.</p>", { headers: { "content-type": "text/html; charset=utf-8" } }) : Response.error());
  }
}

// ---------- dades ----------
async function dades(r, u, espera) {
  const clau = u.pathname;
  const xarxa = fetch(r).then(async res => {
    if (!res.ok || !esJson(res)) return res; // 401 (cal tornar a entrar) i errors passen tal qual
    const d = aplicaCua(clau, await res.json(), await cua().catch(() => [])); // canvis que encara no han pujat
    await enFila(async () => (await caches.open(DADES)).put(clau, json(d)));
    return json(d);
  });
  espera(xarxa.then(res => res.ok ? Promise.all([sincronitza(), avisa({ t: "enlinia" })]) : null).catch(() => { }));
  try { return await ambTemps(xarxa, T_DADES) } catch (err) {
    const v = await (await caches.open(DADES)).match(clau);
    if (v) { avisa({ t: "offline" }); return json(aplicaCua(clau, await v.json(), await cua().catch(() => []))) }
    return xarxa.catch(() => senseXarxa("Sense connexió i sense còpia d'aquestes dades"));
  }
}
function aplicaCua(clau, d, l) { for (const it of l) if (clauDades(it.id) === clau) d = aplica(d, it); return d }
function aplica(d, it) { // corregeix una resposta de /api/col/x o /api/all amb un canvi
  const doc = it.m === "PUT" ? { ...JSON.parse(it.body), id: it.id } : null;
  const posa1 = l => { const r = l.filter(x => x.id !== it.id); if (doc) { const i = l.findIndex(x => x.id === it.id); i >= 0 ? r.splice(i, 0, doc) : r.push(doc) } return r };
  if (Array.isArray(d)) return posa1(d);
  if (it.id === "cfg") return { ...d, cfg: doc ? JSON.parse(it.body) : {} };
  return { ...d, contacts: posa1(d.contacts || []) };
}
const corregeix = it => enFila(async () => { // aplica un canvi a la còpia desada
  const c = await caches.open(DADES), clau = clauDades(it.id), v = await c.match(clau);
  if (v) await c.put(clau, json(aplica(await v.json(), it)));
}).catch(() => { });
async function versioDesada(id) { // el document tal com era a la còpia, abans de canviar-lo sense xarxa
  const v = await (await caches.open(DADES)).match(clauDades(id)); if (!v) return null;
  const d = await v.json();
  if (id === "cfg") return d.cfg ? JSON.stringify(d.cfg) : null;
  const x = (Array.isArray(d) ? d : d.contacts || []).find(y => y.id === id); if (!x) return null;
  const { id: _, ...o } = x; return JSON.stringify(o);
}

// ---------- desar ----------
const perDoc = new Map(); // els desats d'un mateix document, d'un en un (perquè un de vell no trepitgi un de nou)
function escriu(r, id, e) {
  const ant = perDoc.get(id) || Promise.resolve(), p = ant.then(() => escriu1(r, id, e), () => escriu1(r, id, e));
  const fi = p.catch(() => { }); perDoc.set(id, fi); fi.then(() => { if (perDoc.get(id) === fi) perDoc.delete(id) });
  return p;
}
async function escriu1(r, id, e) {
  const body = r.method === "PUT" ? await r.text() : null;
  const it = { id, m: r.method, body, t: Date.now() };
  const abans = await llegeix(id).catch(() => null);
  let sense = false;
  if (!abans) { // si ja hi ha canvis d'aquest document a la cua, aquest va darrere
    try {
      const res = await fetchT(r.url, { method: r.method, headers: { "content-type": r.headers.get("content-type") || "application/json" }, body }, T_DESAR);
      if (res.status !== 401) { if (res.ok) await corregeix(it); return res } // 5xx i 4xx: la pàgina diu «No s'ha pogut desar»
      // 401: cal tornar a entrar. Es desa a la cua perquè no es perdi; la pàgina anirà a la d'entrar
      it.base = await versioDesada(id).catch(() => null); await posa(it); await corregeix(it);
      return res;
    } catch (err) { sense = true }
  }
  it.base = abans ? abans.base : await versioDesada(id).catch(() => null);
  it.t = abans ? abans.t : it.t; // conserva l'ordre del primer canvi
  await posa(it); await corregeix(it);
  try { await self.registration.sync.register("cua") } catch (err) { } // Chrome: ho envia sol quan torni la xarxa
  avisa({ t: "cua", n: (await cua()).length, sense });
  if (abans) e.waitUntil(sincronitza()); // potser ja torna a haver-hi xarxa
  return json({ ok: 1, offline: 1 });
}

// ---------- sincronitzar ----------
// Combina camp per camp respecte de com era abans (base): el que només ha canviat un aparell es queda.
// Si tots dos han canviat el mateix camp: llistes → les d'aquest aparell més el que l'altre hi ha afegit i sense el que
// l'altre n'ha tret; text llarg → el d'aquest aparell i, marcades, les línies noves de l'altre; la resta → aquest aparell
// (llevat de l'estat «Ha respost» d'un contacte, que posa Instagram i no s'ha de perdre).
const clau1 = x => x && typeof x === "object" && x.id != null ? "id:" + x.id : estable(x);
function fusiona(base, srv, meu) {
  const o = {}; let marcat = false;
  for (const k of new Set([...Object.keys(srv), ...Object.keys(meu)])) {
    const b = base[k], s = srv[k], m = meu[k];
    let v;
    if (igual(m, b)) v = s; else if (igual(s, b) || igual(s, m)) v = m;
    else if (Array.isArray(m) && Array.isArray(s)) {
      const kb = new Set((Array.isArray(b) ? b : []).map(clau1)), ks = new Set(s.map(clau1)), km = new Set(m.map(clau1));
      v = m.filter(x => !(kb.has(clau1(x)) && !ks.has(clau1(x)))).concat(s.filter(x => !kb.has(clau1(x)) && !km.has(clau1(x))));
    } else if (typeof m === "string" && typeof s === "string" && (m.length > 60 || s.length > 60 || /\n/.test(m + s))) {
      const ja = new Set(m.split("\n").concat(typeof b === "string" ? b.split("\n") : []));
      const noves = s.split("\n").filter(l => l.trim() && !ja.has(l)).join("\n"); // línies que només ha escrit l'altre aparell
      v = noves ? (marcat = true, m + MARCA + noves) : m;
    } else v = k === "estado" && s === "Ha respost" ? s : m;
    if (v !== undefined) o[k] = v;
  }
  return { doc: o, marcat };
}
const net = o => { if (!o || typeof o !== "object") return o; const { id, ...r } = o; return r }; // l'id no compta (Contactes el desa dins)
const xarxaCaiguda = e => e && (e.name === "AbortError" || e.name === "TypeError");
let enMarxa = null;
function sincronitza() { return enMarxa || (enMarxa = envia().finally(() => enMarxa = null)) }
async function envia() {
  const l = await cua().catch(() => []); if (!l.length) return;
  const r = { fets: 0, combinats: 0, marcats: 0, noEsborrats: 0, errors: 0, rebutjats: 0 };
  avisa({ t: "sincronitza", n: l.length });
  for (const it of l) {
    try {
      const ara = await fetchT("/api/doc/" + encodeURIComponent(it.id), { cache: "no-store" }, T_DESAR);
      if (ara.status === 401) { avisa({ t: "login" }); break }
      if (!ara.ok && ara.status !== 404) { r.errors++; continue } // error del servidor amb aquest document: es torna a provar més tard, sense parar la resta
      const servidor = net(ara.ok && esJson(ara) ? (await ara.json()).data ?? null : null);
      const meu0 = it.body ? JSON.parse(it.body) : null, meu = net(meu0), base = net(it.base ? JSON.parse(it.base) : null);
      const canviat = servidor && base && !igual(servidor, base) && !igual(servidor, meu);
      let envio = it.body;
      if (canviat && it.m === "DELETE") { // l'han canviat en un altre aparell: no s'esborra i torna a sortir
        await treu(it.id); await corregeix({ id: it.id, m: "PUT", body: JSON.stringify(servidor) }); r.noEsborrats++; continue;
      }
      if (canviat) { const f = fusiona(base, servidor, meu); if (meu0 && meu0.id != null) f.doc.id = meu0.id; envio = JSON.stringify(f.doc); f.marcat ? r.marcats++ : r.combinats++ }
      const res = await fetchT("/api/doc/" + encodeURIComponent(it.id), { method: it.m, headers: { "content-type": "application/json" }, body: envio }, T_DESAR);
      if (res.status === 401) { avisa({ t: "login" }); break }
      if (res.status >= 500) { r.errors++; continue }
      if (envio !== it.body) await corregeix({ id: it.id, m: "PUT", body: envio });
      // si mentre s'enviava s'hi ha afegit un canvi nou d'aquest document, es queda a la cua (amb la base nova)
      const ara2 = await llegeix(it.id).catch(() => null);
      if (ara2 && ara2.body === it.body && ara2.m === it.m) await treu(it.id);
      else if (ara2) await posa({ ...ara2, base: envio });
      if (res.ok) r.fets++; else r.rebutjats++; // 4xx: el servidor no l'accepta; es treu de la cua
    } catch (e) { if (xarxaCaiguda(e)) break; r.errors++ } // sense xarxa una altra vegada: ja es tornarà a provar
  }
  avisa({ t: "sincronitzat", ...r, n: (await cua().catch(() => [])).length });
}
self.addEventListener("sync", e => { if (e.tag === "cua") e.waitUntil(sincronitza()) });

// ---------- arxius ----------
async function arxiu(r, e) {
  const c = await caches.open(ARX), rang = r.headers.get("range"), v = await c.match(r.url);
  if (v) return rang ? tros(v, rang) : v; // cada arxiu té el seu id i no canvia mai
  if (rang) return fetch(r).catch(() => senseXarxa()); // àudio i vídeo en streaming: només amb xarxa si no s'han desat sencers
  try {
    const res = await fetch(r), mida = +res.headers.get("content-length") || 0;
    if (res.status === 200 && mida && mida < 8e6) e.waitUntil(c.put(r.url, res.clone()).catch(() => { }));
    return res;
  } catch (err) { return senseXarxa() }
}
async function tros(v, rang) { // resposta 206 a partir de l'arxiu desat (Safari ho demana per a àudio i vídeo)
  const b = await v.blob(), m = /bytes=(\d*)-(\d*)/.exec(rang) || [];
  const a = m[1] ? +m[1] : Math.max(0, b.size - +m[2]);
  let z = m[1] && m[2] ? +m[2] : b.size - 1;
  if (!(a >= 0) || a >= b.size) return new Response(null, { status: 416, headers: { "content-range": "bytes */" + b.size } });
  z = Math.min(z, b.size - 1);
  return new Response(b.slice(a, z + 1), { status: 206, headers: { "content-type": v.headers.get("content-type") || "", "content-range": `bytes ${a}-${z}/${b.size}`, "content-length": String(z - a + 1), "accept-ranges": "bytes" } });
}

// ---------- missatges de la pàgina ----------
self.addEventListener("message", e => {
  const m = e.data || {};
  if (m.t === "sincronitza") e.waitUntil(sincronitza());
  if (m.t === "estat") e.waitUntil(cua().then(l => e.source && e.source.postMessage({ t: "estat", n: l.length })).catch(() => { }));
  if (m.t === "surt") e.waitUntil((async () => { // tancar la sessió: fora la cua i totes les còpies
    try { const d = await dbp; d && d.close() } catch (err) { } dbp = null;
    await new Promise(ok => { const q = indexedDB.deleteDatabase("hub-offline"); q.onsuccess = q.onerror = q.onblocked = ok });
    for (const k of await caches.keys()) if (k.startsWith("hub-")) await caches.delete(k);
    e.ports[0] && e.ports[0].postMessage("ok");
  })());
  if (m.t === "escalfa") e.waitUntil((async () => { // desa l'app i les dades per tenir-les sense xarxa
    const c = await caches.open(APP);
    for (const u of m.app || []) if (!(await c.match(u))) await desa(c, u);
    for (const u of m.dades || []) { try { await dades(new Request(u, { credentials: "same-origin" }), new URL(u, location.origin), x => x) } catch (err) { } }
  })());
});
