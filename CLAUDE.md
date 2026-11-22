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
- Projectes: camp `poster` (una imatge al magatzem `ARCHIVOS`; camp `archivos` amb `unic:1`) i llista en graella de cartells (`cartell:1` a `H.coleccion`). Camp `altres` (altres títols separats per comes, p. ex. «Rave To The Grave» = «Rave Hasta Que Acabe»). `H.titols(p)` i `H.projecteDe(projectes, text)` reconeixen el projecte per qualsevol dels seus títols; els fa servir l'importador de festivals.
- `sections/festivales.js`: convocatòries agrupades per estat (per presentar, sense decidir, premiats, seleccionats, rebutjats, descartats) amb el projecte a cada fitxa; camps `plataforma` (pills amb llista `fest_plat`: FilmFreeway, Festhome i les que s'hi afegeixin; migració única `ajust:migplat`), `classe` (Categoria A/B, De gènere), `necessitats` i `enviat` (pills `multi:1`; `opsDoc` fa que «Ja enviat» només mostri el que demanen) i `necnotes`. També a «Recorregut per projecte», seleccions, premis, estrenes i taxes de cada film; posa els llorers (diapositiva `laurels`) als dossiers del projecte.
- `festimport.js` (`window.FIMP`): importa inscripcions de FilmFreeway i Festhome a Festivals, llegint els seus avisos al Gmail (acció `festivals` del pont), l'arxiu exportat de FilmFreeway (CSV o Excel, amb la taxa) o una llista enganxada; sempre amb revisió abans d'importar. Els avisos ja revisats es guarden a `ajust:festmail`.
- `vcard.js` (`window.VCF`): importa contactes del mòbil (.vcf de l'iPhone, Mac, Google o Android, també vCard 2.1 amb quoted-printable) a Contactes → Dades, amb revisió, tipus i estat triables i sense duplicar (per correu, telèfon o nom; als que ja hi són només s'hi afegeix el que els falti).
- Drecera d'Instagram (iPhone, app Atajos): `GET /api/drecera/<token>?u=<enllaç del perfil>` (token a `secret:drecera`, es crea/canvia a Configuració via `/api/drecera`). Marca el contacte amb aquest @ com a contactat avui (`msgs` amb `v:"Instagram"`) o el crea (tipus Artista per defecte, o `&t=`). Respon text per a la notificació.
- `citacio.js` (`window.CIT`): full de citació d'una jornada del pla de rodatge (es desa a `dias[i].citacio`), tot editable; PDF i enviament per correu en còpia oculta (HTML) o programat. Previsió del temps amb Open-Meteo.
- `sections/desglossament.js` (doc `desg:`): desglossament d'un guió en PDF (escenes, set, moment, pàgines en vuitens, personatges) i creació del guió tècnic (`GT.nou`).
- `sections/desenvolupament.js` (doc `dev:<id projecte>`): versions, lectures i llistes de documents per convocatòria.
- `sections/docencia.js` (`window.DOC`): Docència. Cursos (doc `curs:` amb `setmanes` = sessions amb data, hora d'inici i final (`hora`, `horafi`), tema, PDF al magatzem, visionats i notes; surten a l'iCal) i Visionats (doc `visionat:` amb enllaç de Vimeo/YouTube, miniatura via `/api/oembed`, exercicis de la llista `doc_ex`, nivell `doc_niv` i anotacions; reproductor a la fitxa via l'opció `cap` de `H.editar`).
- `sections/persones.js` (doc `persona:`): equip i repartiment. `sections/feines.js` (doc `feina:`): feines i cobraments.
- Google Calendar (bidireccional): el pont (`sincronitzaCal` a `pont-gmail.gs`, cada 10 min o «Sincronitzar ara» via `correu/calendari`) manté el calendari «PABLO hub» (`CAL_ID` a les propietats del script) amb els esdeveniments de `esdeveniments()` (els mateixos de l'iCal). Crida dues vegades a `/api/pont/cal` (clau del pont): rep `ev` i `vistos`, i envia `canvis`, `esborrats`, `nous` (amb `gid` per no duplicar) i `vistos`. Etiquetes a Google: `hub`=uid, `h`=MD5 de la petjada. Mana el hub si tots dos canvien; no s'esborra res del hub si el calendari és nou o en falten més de 5. Estat a `ajust:gcal`.
- `sections/ajustos.js` (secció «Configuració»): còpia de seguretat (`/api/copia` GET/POST; el pont de Google la desa al Drive cada dilluns via `/api/pont/copia` amb la clau del pont), calendari per subscriure's (`/api/ical/<token>.ics`, token a `secret:ical`), instal·lar com a app (`manifest.webmanifest`).
- `functions/_middleware.js`: contraseña del hub (variable `HUB_PASSWORD`; se recuerda 30 días por dispositivo).
- `functions/api/[[path]].js`: API. Datos en la tabla `docs` (se crea sola). Contactos: ids `c_…` y `cfg`; resto: `tipo:xxxx` (tarea, reunion, proyecto, convocatoria, idea, pre, post, gt, pdr, deck, desg, dev, persona, feina, ajust). Els `secret:` no surten mai cap al navegador.
  `/api/web`: lee y publica `public/contenido.json` del repo `pabloanarte/pabloanarte-web` (variable `GITHUB_TOKEN`).

## Variables en Cloudflare (pablo-hub → Settings → Variables and Secrets)
- `HUB_PASSWORD`: contraseña de entrada.
- `ARCHIVOS` (enlace KV, en Bindings): almacén de los archivos que se suben a Proyectos y Brainstorm (máx. 25 MB cada uno).
- `GITHUB_TOKEN`: token de GitHub con permiso Contents (lectura y escritura) solo en `pabloanarte-web`.

## Probar en local
`npx wrangler pages dev public --d1 DB=local --kv ARCHIVOS --binding HUB_PASSWORD=prueba GITHUB_TOKEN=x`

## Estructura (nov. 2026)
- Menú: Avui, Agenda (tasques + reunions), Gent (contactes + equip), Projectes, Correu, Docència, Diners; a sota pabloanarte.com i Configuració. `hub.js` té `GRUPS`, pestanyes de projecte `PTABS` (resum, desenvolupament, dossiers, preproducció, guió i pla, postproducció, festivals, equip, arxius) i `HUB.obreProjecte(id, pt)`. `H.pj()`/`H.dePj(d)` filtren pel projecte obert; `sections/projecte.js` fa Resum, Equip (`p.equip`) i Arxius. Mòbil: barra inferior i botó + (afegir ràpid).
- Avui (`sections/inicio.js`): recordatoris de terminis (avui, 2 i 7 dies), novetats de festivals del Gmail (`FIMP.pendents`, aplicar amb `FIMP.revisaCorreu`), seguiments amb el missatge ja escrit (`CONT.plantilla`, `CONT.registraIG`), «Ha respost» automàtic quan algú respon per correu, contactes nous de la setmana contra l'objectiu, classes d'avui i demà amb material, escriptura (`ajust:escriptura` log `{proj,d,p}`), factures per reclamar (Facturat fa 30 dies, camp `facturat`) i convocatòries vigilades amb canvis.
- Configuració: objectius (`ajust:objectius`: contactes, pagines, escriptura), vigilant (`ajust:vigila.llista`), dades de factura (`ajust:factura`: nom, nif, adreca, email, tel, iban, iva, irpf, prefix, seguent), dreceres `?u=` (Instagram), `?x=` (Apunta al hub, tasca d'avui o idea) i `?v=` (visionat).
- Resum diari: el pont (`feinesPeriodiques` dins `enviaProgramats`) l'envia un cop al dia a partir de les 8:30 (hora de Madrid) amb `/api/pont/diari`; només coses d'avui. El vigilant corre els dilluns via `/api/pont/vigila`. Enllaços públics signats als arxius: `/api/arxius-publics` → `/api/public/arxiu/<id>/<sig>`.
- Diners: acció «Fer la factura (PDF)» (numerada, IVA i IRPF). IVA per defecte 0 % (canviable a Configuració o a cada feina).
