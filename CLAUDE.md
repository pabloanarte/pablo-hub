# PABLO hub
Hub personal de Pablo Anarte. Cloudflare Pages (proyecto pablo-hub, carpeta de salida `public`, sin build) + base de datos D1 (variable `DB`).

## Archivos
- `public/index.html`: estructura (cabecera, contenido a pantalla completa, menú lateral derecho) y estilos.
- `public/hub.js`: lista de secciones. **Añadir una sección = una línea aquí + un archivo en `public/sections/`.**
- `public/lib.js`: herramientas comunes (`window.H`). `H.coleccion({...})` crea una sección de lista completa a partir de su lista de campos.
- `public/rodaje.js` (`window.R`): escalas y colores, pegar desde Sheets, exportar PDF (imprimir) y Excel (ExcelJS en `public/vendor/`).
- `public/crono.js` (`window.Crono`): cronograma Gantt; `sections/preproduccion.js` y `postproduccion.js` solo definen departamentos y plantilla.
- `sections/guiones.js`: guiones técnicos (doc `gt:` con escenas y planos). `sections/planes.js`: planes de rodaje (doc `pdr:` con jornadas y filas; generador desde un GT agrupando por set → eje → escala, con cambios de set, comida y wrap).
- `public/sections/`: inicio (resumen), tareas (con calendario), contactos, reuniones, proyectos, festivales, brainstorm, web, decks.
- `public/importar.js` (`window.IMP`): importa guiones técnicos y planes de rodaje desde PDF (pdf.js en `public/vendor/`), Excel, CSV o un enlace de Google Sheets (`/api/importar`) y los convierte a la plantilla del hub.
- `public/deck.js` (`window.DK`): dibuja las diapositivas de los dossiers (formatos, 6 estilos, 16 maquetas, ajuste automático del texto, paleta). `sections/decks.js`: editor, asistente por categorías, revisión de diseño, importar un PDF propio, exportar PDF/PNG/JPEG y compartir.
- `functions/d/[token].js`: página pública de un dossier compartido (`/d/<token>`, con contraseña opcional). Datos por `/api/public/deck/<token>`; las diapositivas ocultas nunca salen.
- `sections/correu.js`: Gmail de pablo.anarte.film@gmail.com (llegir, respondre, escriure, programar). Passa per `/api/correu/…` cap a un pont d'Apps Script (`public/pont-gmail.gs`, enganxat al compte de Google com a aplicació web). L'URL i la clau del pont es guarden a D1 amb id `secret:correu`, que l'API no deixa llegir mai des del navegador. Els enviaments programats els fa el pont cada 5 minuts.
- `sections/festivales.js`: convocatòries i, a «Recorregut per pel·lícula», seleccions, premis, estrenes i taxes de cada film; posa els llorers (diapositiva `laurels`) als dossiers del projecte.
- `citacio.js` (`window.CIT`): full de citació d'una jornada del pla de rodatge (es desa a `dias[i].citacio`), tot editable; PDF i enviament per correu en còpia oculta (HTML) o programat. Previsió del temps amb Open-Meteo.
- `sections/desglossament.js` (doc `desg:`): desglossament d'un guió en PDF (escenes, set, moment, pàgines en vuitens, personatges) i creació del guió tècnic (`GT.nou`).
- `sections/desenvolupament.js` (doc `dev:<id projecte>`): versions, lectures i llistes de documents per convocatòria.
- `sections/persones.js` (doc `persona:`): equip i repartiment. `sections/feines.js` (doc `feina:`): feines i cobraments.
- `sections/ajustos.js`: còpia de seguretat (`/api/copia` GET/POST; el pont de Google la desa al Drive cada dilluns via `/api/pont/copia` amb la clau del pont), calendari per subscriure's (`/api/ical/<token>.ics`, token a `secret:ical`), instal·lar com a app (`manifest.webmanifest`).
- `functions/_middleware.js`: contraseña del hub (variable `HUB_PASSWORD`; se recuerda 30 días por dispositivo).
- `functions/api/[[path]].js`: API. Datos en la tabla `docs` (se crea sola). Contactos: ids `c_…` y `cfg`; resto: `tipo:xxxx` (tarea, reunion, proyecto, convocatoria, idea, pre, post, gt, pdr, deck, desg, dev, persona, feina, ajust). Els `secret:` no surten mai cap al navegador.
  `/api/web`: lee y publica `public/contenido.json` del repo `pabloanarte/pabloanarte-web` (variable `GITHUB_TOKEN`).

## Variables en Cloudflare (pablo-hub → Settings → Variables and Secrets)
- `HUB_PASSWORD`: contraseña de entrada.
- `ARCHIVOS` (enlace KV, en Bindings): almacén de los archivos que se suben a Proyectos y Brainstorm (máx. 25 MB cada uno).
- `GITHUB_TOKEN`: token de GitHub con permiso Contents (lectura y escritura) solo en `pabloanarte-web`.

## Probar en local
`npx wrangler pages dev public --d1 DB=local --kv ARCHIVOS --binding HUB_PASSWORD=prueba GITHUB_TOKEN=x`
