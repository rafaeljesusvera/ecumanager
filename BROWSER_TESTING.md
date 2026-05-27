# Browser Testing en Equmanager

Guía para probar Equmanager en un navegador real con la CLI [`bro`](https://github.com/scorredoira/bro). Este documento sustituye al genérico de Golfmanager V3 y deja por escrito todo lo específico de este proyecto: stack Next.js + Supabase, roles multi-perfil y server actions.

## Propósito: probar como un usuario real

`bro` simula a una persona usando la app: clica botones, rellena inputs, sube fotos, abre menús. El objetivo no es golpear APIs ni manipular la BD directamente, sino verificar el flujo de UI tal como lo vive el alumno, el propietario o el mozo.

**Sí hacer**

- `bro click`, `bro fill`, `bro select`, `bro navigate`
- `bro screenshot` y `bro snapshot` para "ver" lo que ve el usuario
- `wait <texto>` para esperar a que aparezca contenido SSR

**No hacer**

- `bro js fetch(...)` para llamar a endpoints internos
- `psql` desde un test para preparar datos: usa el seed inicial y crea/edita todo lo demás a través de la UI
- `exec curl` contra una server action

**Si un escenario no se alcanza desde la UI**, o falta una feature o no entiendes aún el flujo. Habla con el usuario antes de inventar shortcuts.

**Mantén este documento actualizado.** Cuando descubras una rareza, un truco o un selector útil, añádelo. Es la única fuente de verdad de pruebas en navegador del proyecto.

## La CLI `bro`

`bro` controla Chrome vía Chrome DevTools Protocol. Localiza elementos por el árbol de accesibilidad (compatible con Radix/shadcn), con un autoretry de 3 s y matching insensible a mayúsculas (exacto primero, sub-cadena después). Cada `bro open` lanza un Chrome aislado con su propio perfil en `/tmp/bro-chrome-<port>/`.

```bash
bro [--port PORT] [--headless] [-w N] <comando> [args...]
```

Flags globales:

- `--port PORT` — Chrome concreto (por defecto 9222)
- `--headless` — sin ventana
- `-w N` — workers paralelos para `bro test`

Instalación: `go install github.com/scorredoira/bro@latest`. En este equipo ya está en `~/go/bin/bro`.

## Prerrequisitos

### Dev server Next.js

Las pruebas se ejecutan contra el dev server local. Puerto por defecto: `3000`.

```bash
# Lanzar en background sobreviviendo al shell
pnpm --filter @equmanager/web dev > /tmp/equmanager-dev.log 2>&1 &
```

```bash
# Comprobar
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# 200 → arriba
```

```bash
# Parar
pkill -f "next dev"
```

> Si haces cambios en server actions, **recarga la página con `bro reload`** después de salvar. Next.js suele recompilar automáticamente; si algo no se actualiza, fuerza el reload.

### Variables de entorno

El dev server lee `.env` en la raíz del repo. Necesitas como mínimo `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` y `NEXT_PUBLIC_APP_URL`. Sin la service role key fallan signup, impersonación y subida a Storage.

### Datos demo

Para que la UI no esté vacía, ejecuta el seed (idempotente, sólo siembra si el club tiene <5 caballos):

```bash
set -a && source .env && set +a
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/seed-demo.sql
```

### Credenciales de prueba

A diferencia de Golfmanager (con `sim addtenant`), aquí los usuarios se crean **desde el propio signup de la app**:

1. Abre `bro open http://localhost:3000/signup`
2. Rellena nombre, email y password (mín. 8 caracteres)
3. El server action usa `SUPABASE_SERVICE_ROLE_KEY` para crear el usuario con `email_confirm: true` y le abre sesión, llevándole a `/onboarding`
4. Elige perfil (propietario hípica, propietario caballo, alumno o mozo) y o crea club o se une a uno por slug

Para resetear contraseñas o crear cuentas en lote sin pasar por la UI, usa el panel de Supabase o el script:

```sql
-- Asegurarse de que un email existe como user confirmado (Supabase Auth)
-- (manual desde el panel, no hay CLI nativa)
```

> **No hay `sim run user`** en este proyecto. Si el signup falla, abre Supabase → Authentication → Users.

## Referencia de comandos

### Sesión

```bash
bro open [url]                # Lanza Chrome, imprime el puerto
bro --port $PORT close        # Mata esa instancia
```

### Navegación

```bash
bro navigate <url>            # Ir a URL (alias: nav)
bro reload                    # Recargar
bro back / bro forward        # Historial
bro resize <w> <h>            # Tamaño ventana
```

### Inspección

```bash
bro snapshot                  # Árbol de accesibilidad (interactivos)
bro snapshot --verbose        # Todo el árbol
bro screenshot [path]         # PNG (default /tmp/bro.png)
bro screenshot --full <path>  # Página completa
bro url                       # URL actual
bro html                      # HTML
```

`snapshot` muestra `[nodeID] role "name"`. Útil para descubrir qué se llama qué y depurar selectores.

### Interacción

```bash
bro click <texto>                     # Click por texto visible
bro click --css <sel> [text]          # Por selector CSS, opcional filtro de texto
bro click --css <sel> --index N       # Nº N (0-based) que casa
bro click --id <id>                   # Por DOM id
bro dblclick <texto>                  # Doble click
bro fill <label> <valor>              # Rellenar input por label/placeholder/aria-label
bro select <label> <valor>            # Dropdown (nativo o custom)
bro type <texto>                      # Teclear en el elemento enfocado
bro press <key>                       # Enter, Tab, Escape, Backspace...
bro hover <texto>                     # Hover
bro upload <css-sel> <fichero>        # Subir archivo
bro texts --css <sel> [--limit N]     # Listar textos de elementos
```

**Prioridad de localización**: `--css` → `--id` → texto en el árbol de accesibilidad (exacto primero, luego sub-cadena, insensible).

### Esperas

```bash
bro wait <texto>              # Espera a que aparezca (10s por defecto)
bro wait --gone <texto>       # A que desaparezca
bro wait --url <patrón>       # A que la URL contenga algo
bro wait --timeout 30s <txt>  # Custom timeout
```

Sondeo cada 300 ms. Matching insensible.

### Pestañas

```bash
bro pages                     # Lista de pestañas abiertas
bro page <índice>             # Cambia a una
bro newpage [url]             # Nueva
bro closepage                 # Cierra la actual
```

### Diálogos JS

```bash
bro dialog accept [texto]     # Acepta el próximo alert/confirm/prompt
bro dialog dismiss            # Lo descarta
```

### Debug

```bash
bro console                   # Mensajes de consola (instala hook la 1ª vez)
bro network                   # Últimas 50 requests
bro js <código>               # Ejecuta JS en la página (sólo para asserts/lecturas)
```

## Patrones específicos de Equmanager

### Autenticación

Equmanager usa cookies de Supabase. **Después de hacer login, `bro` mantiene la sesión** mientras no cierres el puerto. Si abres una segunda instancia con otro `--port`, será una sesión limpia.

```bash
bro open http://localhost:3000/login
bro fill Email developer1@golfmanager.com
bro fill Contraseña tu-password
bro click Entrar
bro wait Inicio                       # /app cargado
```

### Onboarding

Después del signup el usuario aterriza en `/onboarding`. Elegir rol:

```bash
bro click "Soy propietario de hípica"      # Crea club
bro fill "Nombre de la hípica" "Club Demo"
bro click "Crear hípica y entrar"
```

Para un alumno que se une con código existente:

```bash
bro click "Soy alumno o corredor"
bro fill "Código de la hípica" "valdebebas"
bro select "Voy a entrar como" "Alumno / corredor"
bro click "Unirme a la hípica"
```

### Sidebar y nav móvil

La sidebar de escritorio sólo aparece en `md+`. En tamaños móviles hay un drawer al pulsar el icono de hamburguesa en el topbar. Para abrirlo desde bro con la ventana redimensionada:

```bash
bro resize 414 800
bro click Abrir\ menú        # aria-label del botón hamburguesa
bro wait "Cerrar sesión"     # menú visible
```

### CreatePanel (formularios colapsables)

Por defecto el formulario "Nuevo X" está oculto. Hay que pulsar primero el botón:

```bash
bro click "Nuevo caballo"          # Abre el panel
bro fill Nombre "Sultán II"
bro select Tipo caballo
bro click "Crear y abrir ficha"    # Crea y redirige a /app/horses/[id]
```

Si la lista está vacía, el panel sale abierto por defecto y este paso no hace falta.

### AutoSaveForm (fichas de detalle)

En `/app/horses/[id]` y similares no hay botón "Guardar". Cada vez que un input pierde foco con cambios, se guarda solo y aparece un toast "Guardando…" → "Guardado":

```bash
bro fill Nombre "Sultán Renamed"
bro press Tab                       # Provoca blur → autosave
bro wait Guardado                   # toast inferior derecha
```

> El componente hace debounce de 200 ms y nunca lanza dos guardados en paralelo, así que si quieres encadenar varios cambios, espera al "Guardado" antes del siguiente blur, o el segundo se procesará después del primero por cola interna.

### ConfirmDeleteButton

Cualquier botón de eliminar abre un modal con confirmación antes de invocar la server action:

```bash
bro click "Eliminar caballo"        # Abre el modal
bro wait "Sí, eliminar"             # Modal visible
bro click "Sí, eliminar"
bro wait --url "/app/horses"        # Redirige a la lista
```

Para cancelar: `bro press Escape` o `bro click Cancelar`.

### PhotoUpload (Supabase Storage)

El componente `PhotoUpload` esconde un `<input type="file">` detrás de un label. Para subirlo con bro:

```bash
bro upload 'input[type="file"][accept*="image"]' /tmp/sample.jpg
bro wait Subiendo                   # opcional, suele ser corto
bro wait --gone Subiendo
```

La URL pública queda en un `<input type="hidden" name="photoUrl">`, así que un envío posterior persiste la foto sin más.

### Bandeja IA

Para procesar una nota de voz desde la UI:

```bash
bro nav http://localhost:3000/app/ai
bro fill Transcripción "Hoy Lucía con Sultán muy buen ritmo, dadle insignia de progreso."
bro click "Analizar con IA"
bro wait "lista para revision"       # estado tras parsear (o "error" si Anthropic no responde)
bro click "Confirmar y enviar"
bro wait "Feedback enviado"
```

Sin `ANTHROPIC_API_KEY`, el sistema usa el fallback heurístico — los matches se hacen por coincidencia de nombre en la transcripción.

### Generador automático de sesiones (cursos)

```bash
bro nav http://localhost:3000/app/courses/<id>
bro fill Inicio 2026-06-03
bro fill Fin 2026-07-22
bro fill Hora 17:30
bro click M                          # día Martes (chip)
bro click J                          # día Jueves
bro wait "Se crearán"                # preview
bro click "Generar"
bro wait "sesiones generada"         # confirmación
```

### Impersonación

```bash
bro nav http://localhost:3000/app/riders/<id>
bro click "Ver Equmanager como"
bro wait "Estás viendo Equmanager"   # banner ámbar
# ...prueba el flujo del alumno...
bro click "Volver a"
```

Sólo funciona si el alumno tiene `profile_id` (es decir, se registró). Si no, el botón aparece pero al hacer click vuelve con error en query string.

## Roles relevantes para QA

| Rol | Acceso a |
|-----|----------|
| `owner` / `admin` | Todo lo de `/app/horses`, `/app/riders`, `/app/courses`, `/app/lessons`, `/app/events`, `/app/news`, `/app/bonos`, `/app/badges`, `/app/ai` |
| `instructor` | Igual que owner para las áreas de gestión (no ve facturación) |
| `groom` | `/app/groom` y sub-rutas, no ve `/app/horses` |
| `horse_owner` | `/app/horse-owner` con caballos donde aparece como propietario |
| `rider` | `/app/me/*` (clases, caballos, eventos, bonos, insignias) |

Un mismo usuario puede tener varios roles en clubs distintos. La sidebar muestra todas las secciones que aplican.

## Sembrar y resetear datos

```bash
# Aplicar/refrescar seed demo (Valdebebas + Prueba Estefi)
set -a && source .env && set +a
psql "$DATABASE_URL" -f scripts/seed-demo.sql

# Resetear todo de un club (vacía datos pero conserva membresías)
psql "$DATABASE_URL" <<'SQL'
DELETE FROM horses WHERE club_id = (SELECT id FROM clubs WHERE slug='valdebebas');
DELETE FROM riders WHERE club_id = (SELECT id FROM clubs WHERE slug='valdebebas');
SQL
```

> Usar SQL para reset es válido (es setup), pero **una vez que estés probando, navega y opera sólo desde la UI**.

## Recetas habituales

### Crear curso con generador

```bash
bro open http://localhost:3000/app/courses
bro click "Nuevo curso"
bro fill Título "Iniciación al salto"
bro select Disciplina salto
bro fill Precio 240
bro click "Crear y abrir ficha"
bro wait "Datos del curso"
# generador
bro fill Inicio 2026-06-03
bro fill Fin 2026-07-22
bro click M
bro click J
bro click "Generar"
bro wait "sesiones generada"
```

### Comprar bono como rider

Cambia a un usuario rider primero (signup nuevo o impersonación):

```bash
bro nav http://localhost:3000/app/me/bonos
bro click "Comprar"
bro wait "Bono"
bro wait --url "/app/me/bonos"
```

El pago es simulado (`stripe_fake`); aparece un toast `Pago confirmado` y la compra se añade a "Mis bonos".

### Subir foto a un caballo

```bash
bro nav http://localhost:3000/app/horses/<id>
bro upload 'input[type="file"][accept*="image"]' /tmp/sultan.jpg
bro wait --gone Subiendo
bro press Tab                  # forza autosave del form
bro wait Guardado
bro reload
bro wait Sultán                # foto cargada
```

## Modo headless y CI

Para correr sin ventana:

```bash
bro --headless open http://localhost:3000
```

Si quieres una suite reproducible en CI, mira la sección "Playwright" en el README — `bro` es ideal para "explorar/depurar a mano desde shell" y para que el agente compruebe flujos puntuales, pero **no sustituye a una suite paralela en GitHub Actions**. Para CI recomendamos Playwright (ver `apps/web/tests/`).

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `bro: no element matching "X"` | Usa `bro snapshot` para ver qué hay realmente; comprueba que la ruta cargó (`bro url`) |
| Tarda en aparecer | El primer `pnpm dev` compila bajo demanda. La 1ª carga de una ruta puede tardar 2-5 s; usa `bro wait` |
| El formulario "no guarda" | Revisa que has cambiado un input (sin cambios no dispara guardado). Mira `bro console` |
| `Failed to upload` en PhotoUpload | Falta `SUPABASE_SERVICE_ROLE_KEY` o el bucket `equmanager` está mal configurado |
| Sigue logueado del test anterior | `bro close` cierra ese puerto; `bro open` con otro puerto da sesión limpia |
| Cambios en server actions no se reflejan | `bro reload` después de salvar el archivo |

## Convenciones para tests `.bro`

Si en algún momento añadimos suite con archivos `.bro`, el patrón estándar es:

```bro
# tests/horse-crud.bro
freeport
exec pnpm --filter @equmanager/web dev --port $PORT
wait --url /
open http://localhost:$PORT/login
fill Email developer1@golfmanager.com
fill Contraseña 1234
click Entrar
wait Inicio
nav /app/horses
click "Nuevo caballo"
fill Nombre "Test horse"
click "Crear y abrir ficha"
wait "Datos generales"
```

Cada test arranca su propio dev server en un puerto libre (`freeport` + `exec`), de modo que se pueden lanzar en paralelo con `bro test -w 4`.
