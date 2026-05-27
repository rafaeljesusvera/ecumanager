# ADR 0001 · Stack tecnológico y estructura de monorepo

- **Fecha:** 2026‑05‑24
- **Estado:** Aceptado
- **Decisores:** equipo Equmanager

## Contexto

Equmanager partió como un único archivo HTML que servía React + Tailwind por CDN, con Babel compilando JSX en el navegador y Supabase como única dependencia de backend. Funciona, pero presenta limitaciones serias para crecer:

1. **Sin tipado.** Sin TypeScript, los refactors son frágiles.
2. **Sin separación de capas.** Lógica de UI, acceso a datos y reglas de negocio comparten archivo.
3. **Sin auth real.** El "código de club" en localStorage no es autenticación.
4. **Modelo de datos plano.** Un único JSON por club bloquea queries eficientes, integridad referencial y RLS por entidad.
5. **Imposible compartir código** entre el panel web y una futura app móvil.
6. **Sin CI/CD** ni mecanismo de release reproducible.

## Decisión

Adoptamos:

- **Monorepo** con `pnpm` workspaces y **Turborepo** para orquestar tasks con caché.
- **TypeScript estricto** en todo el código.
- **Next.js 15** (App Router) para el panel web; **Expo + React Native** para móvil.
- **Drizzle ORM** sobre **Postgres de Supabase** como base de datos relacional, con migraciones versionadas y **Row‑Level Security** activado en cada tabla.
- **Zod** como fuente única de verdad para validación y tipos compartidos (`@equmanager/domain`).
- **Supabase Auth** (email/password + magic link) como sistema de autenticación real, sustituyendo al "código de club".
- **tRPC** para la capa API (Fase 4), permitiendo llamadas tipadas end‑to‑end entre web/mobile/server.
- **Changesets** para versionado SemVer automatizado de los paquetes.
- **GitHub Actions** para CI: lint, typecheck, build, tests en cada PR.

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| Mantener el HTML monolítico modularizado | No resuelve el tipado ni la compartición de código con móvil. |
| Vite + React + TS sin monorepo | Suficiente para una app, insuficiente cuando aparece la app móvil. |
| Prisma en vez de Drizzle | Más popular, pero más pesado en cold starts y peor con edge runtime; Drizzle se ajusta mejor a Supabase + Vercel. |
| Migrar a Postgres propio (Neon, Railway) en lugar de Supabase | Implicaría reescribir storage y auth. Supabase ya cubre las tres patas (BD + Auth + Storage). |
| GraphQL en vez de tRPC | Más infra a mantener; tRPC encaja mejor en un monorepo TypeScript end‑to‑end. |

## Consecuencias

**Positivas**
- Tipos compartidos en todo el sistema → refactors seguros.
- RLS por fila → mismas garantías de seguridad que un backend custom.
- Mismo lenguaje y mismas validaciones en web, móvil y servidor.
- Releases reproducibles y trazables via Changesets + CI.

**Negativas / costes**
- Curva de aprendizaje inicial para quien no haya tocado monorepos.
- Mayor tiempo de bootstrap del entorno local (varios paquetes, BD, migraciones).
- Drizzle es más nuevo que Prisma: comunidad menor, aunque ya estable.

## Plan de migración

Ver el [README · sección Estado](../../README.md#-estado-del-proyecto) para el desglose de fases. El prototipo HTML original permanece operativo en [`legacy/`](../../legacy) durante toda la transición.
