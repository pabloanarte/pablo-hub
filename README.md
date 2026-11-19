# PABLO hub
Hub personal de Pablo Anarte. Cloudflare Pages (proyecto pablo-hub, carpeta de salida `public`, sin build) + base de datos D1 (variable `DB`).

## Archivos
- `public/index.html`: estructura (cabecera, contenido a pantalla completa, menú lateral derecho) y estilos.
- `public/hub.js`: lista de secciones. **Añadir una sección = una línea aquí + un archivo en `public/sections/`.**
- `public/lib.js`: herramientas comunes (`window.H`). `H.coleccion({...})` crea una sección de lista completa a partir de su lista de campos.
- `public/rodaje.js` (`window.R`): escalas y colores, pegar desde Sheets, exportar PDF (imprimir) y Excel (ExcelJS en `public/vendor/`).
- `public/crono.js` (`window.Crono`): cronograma Gantt; `sections/preproduccion.js` y `postproduccion.js` solo definen departamentos y plantilla.
- `sections/guiones.js`: guiones técnicos (doc `gt:` con escenas y planos). `sections/planes.js`: planes de rodaje (doc `pdr:` con jornadas y filas; generador desde un GT agrupando por set → eje → escala, con cambios de set, comida y wrap).
- `public/sections/`: inicio (resumen), tareas (con calendario), contactos, reuniones, proyectos, festivales, brainstorm, web.
- `functions/_middleware.js`: contraseña del hub (variable `HUB_PASSWORD`; se recuerda 30 días por dispositivo).
- `functions/api/[[path]].js`: API. Datos en la tabla `docs` (se crea sola). Contactos: ids `c_…` y `cfg`; resto: `tipo:xxxx` (tarea, reunion, proyecto, convocatoria, idea, pre, post, gt, pdr).
  `/api/web`: lee y publica `public/contenido.json` del repo `pabloanarte/pabloanarte-web` (variable `GITHUB_TOKEN`).

## Variables en Cloudflare (pablo-hub → Settings → Variables and Secrets)
- `HUB_PASSWORD`: contraseña de entrada.
- `ARCHIVOS` (enlace KV, en Bindings): almacén de los archivos que se suben a Proyectos y Brainstorm (máx. 25 MB cada uno).
- `GITHUB_TOKEN`: token de GitHub con permiso Contents (lectura y escritura) solo en `pabloanarte-web`.

## Probar en local
`npx wrangler pages dev public --d1 DB=local --kv ARCHIVOS --binding HUB_PASSWORD=prueba GITHUB_TOKEN=x`
