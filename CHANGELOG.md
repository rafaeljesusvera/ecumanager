# Changelog

Todos los cambios relevantes a este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y
el versionado [SemVer](https://semver.org/lang/es/).

A partir del primer release, las entradas se generan automáticamente con
[Changesets](https://github.com/changesets/changesets).

## [Unreleased]

### Añadido
- Estructura monorepo (pnpm workspaces + Turborepo).
- Paquetes `@equmanager/domain`, `@equmanager/database`, `@equmanager/auth`,
  `@equmanager/ui`, `@equmanager/api`, `@equmanager/config`.
- Schema relacional completo (Drizzle ORM) con 12 tablas e índices.
- Migración SQL inicial con Row‑Level Security para todas las tablas.
- Script de migración de datos legacy (`migrate-legacy.ts`).
- Script de seed para desarrollo.
- App web Next.js 15: landing, login, signup, dashboard y tablas (caballos,
  jinetes) leyendo datos reales de la BD.
- App móvil (esqueleto Expo).
- CI con GitHub Actions: lint, typecheck, build, tests.
- Workflow de Release con Changesets.
- Plantillas de issues y PRs, CONTRIBUTING, LICENSE (MIT).

### Movido
- Prototipo HTML original a `legacy/equmanager.html`.
