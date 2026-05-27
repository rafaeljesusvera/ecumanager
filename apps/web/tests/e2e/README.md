# Tests E2E (Playwright)

Suite de tests end-to-end para `@equmanager/web`. Complementa al smoke
testing manual con `bro` (ver `BROWSER_TESTING.md` en la raíz).

## Ejecutar localmente

```bash
# 1. Tener el .env con SUPABASE_SERVICE_ROLE_KEY y DATABASE_URL
# 2. Instalar los browsers de Playwright (solo la primera vez)
pnpm --filter @equmanager/web exec playwright install chromium

# 3. Lanzar la suite (arranca pnpm dev solo)
pnpm --filter @equmanager/web test:e2e

# Modo UI interactivo
pnpm --filter @equmanager/web test:e2e:ui

# Solo un fichero
pnpm --filter @equmanager/web exec playwright test landing.spec.ts
```

## Contra producción

```bash
BASE_URL=https://equmanager.vercel.app \
  pnpm --filter @equmanager/web test:e2e -- --project=chromium landing.spec.ts
```

Cuando se define `BASE_URL`, Playwright **no** levanta dev server local.

## Estructura

- `landing.spec.ts` — Páginas públicas, navegación básica, redirect de protegidas.
- `owner-flow.spec.ts` — Signup → onboarding → caballo → autosave → eliminar con confirmación.
- `course-generator.spec.ts` — Genera sesiones por días de la semana.
- `badge-design.spec.ts` — Diseño de insignia con preview en vivo.

Cada test que necesita autenticación crea su propio usuario con email
único (`pw-...-${Date.now()}@equmanager.test`) para no chocar con
sesiones previas. Como signup usa la service role key, el usuario nace
verificado y la sesión queda lista en menos de un segundo.

## CI

Workflow en `.github/workflows/playwright.yml`. Variables que necesita:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`

Cárgalas como GitHub Secrets en la configuración del repo.

## Cuándo añadir un test

Cualquier comportamiento que se pueda romper en silencio: redirects
condicionales, flujos multi-página, server actions con efectos
secundarios. Si una regresión ya pasó una vez, escribe el test para que
no vuelva a pasar.
