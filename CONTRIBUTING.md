# Contribuir a Equmanager

¡Gracias por querer mejorar Equmanager! Este documento explica el flujo de trabajo.

## Requisitos

- **Node.js 20+**
- **pnpm 9+** (`corepack enable && corepack prepare pnpm@latest --activate`)
- Una cuenta gratuita de **Supabase** para variables de entorno
- Git con tu identidad configurada

## Setup

```bash
git clone https://github.com/USER/equmanager.git
cd equmanager
pnpm install
cp .env.example .env
# Rellena .env con credenciales de Supabase
pnpm db:push       # aplica schema Drizzle
pnpm db:seed       # opcional, datos demo
pnpm dev
```

## Estructura

Consulta el [README principal](./README.md#-arquitectura) y los ADRs en [`docs/adr/`](./docs/adr).

## Flujo de trabajo

1. **Crea una rama desde `main`** con prefijo según tipo:
   - `feat/...` nueva funcionalidad
   - `fix/...` corrección de bug
   - `chore/...` mantenimiento (deps, scripts, refactor sin cambio funcional)
   - `docs/...` solo documentación
2. **Haz commits siguiendo [Conventional Commits](https://www.conventionalcommits.org/)**:
   ```
   feat(web): añadir tabla de jinetes con filtros
   fix(database): índice faltante en lessons.club_id
   docs(readme): aclarar pasos de setup
   ```
3. **Si tu cambio afecta a un paquete que se versiona**, añade un changeset:
   ```bash
   pnpm changeset
   ```
   Elige el bump (patch / minor / major) y describe el cambio en una frase.
4. **Abre el PR** con la plantilla rellena. CI debe pasar en verde.
5. **Squash & merge** al cerrar (lo configura el repo).

## Convenciones de código

- TypeScript en **modo estricto**. Sin `any` salvo justificación en comentario.
- Tipos compartidos viven en `@equmanager/domain`. No los dupliques en `apps/`.
- Acceso a BD desde apps **solo** via `@equmanager/api` (cuando exista, fase 4) o RPC directo a Supabase.
- Componentes UI compartidos en `@equmanager/ui`. Específicos de una app, en `apps/<app>/src/components`.
- Nada de claves secretas commiteadas. Si necesitas una nueva variable, añádela a `.env.example` con valor en blanco y documenta.

## Migraciones de BD

- El schema vive en `packages/database/src/schema/`.
- Para cambios estructurales: edita el schema → `pnpm db:generate` → revisa el SQL → commit.
- Para cambios que requieren SQL crudo (policies RLS, funciones, triggers): añade un archivo en `packages/database/migrations/NNNN_description.sql`.

## Tests

- Unit: `vitest`, archivos `*.test.ts` junto al código.
- E2E: `playwright` (cuando se añada en fase 8), en `apps/web/e2e/`.

## ¿Dudas?

Abre una Discussion en GitHub.
