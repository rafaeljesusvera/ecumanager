<div align="center">

# 🏇 Equmanager

**Sistema de gestión integral para clubes ecuestres**

Gestiona caballos, jinetes, clases, insignias y la operativa diaria de un club hípico desde un panel web y una app móvil.

[![CI](https://github.com/USER/equmanager/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/equmanager/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## ✨ Estado del proyecto

Equmanager está en migración desde un prototipo HTML monolítico hacia una arquitectura profesional, escalable y multi‑plataforma. El prototipo original sigue disponible en [`legacy/`](./legacy) y operativo mientras avanza la migración.

| Fase | Estado | Descripción |
|------|:------:|-------------|
| 0 · Higiene del repo | ✅ | README, LICENSE, plantillas, labels |
| 1 · Monorepo | ✅ | pnpm workspaces + Turborepo |
| 2 · Schema BD | ✅ | Drizzle ORM + migraciones + RLS |
| 3 · Auth real | 🚧 | Supabase Auth (email + magic link) |
| 4 · API tRPC | 🚧 | Routers tipados end‑to‑end |
| 5 · Panel web | 🚧 | Next.js 15 + shadcn/ui |
| 6 · App móvil | ⏳ | Expo + NativeWind |
| 7 · CI/CD | ✅ | GitHub Actions + Vercel |
| 8 · Observabilidad | ⏳ | Sentry + logs estructurados |

## 🏗️ Arquitectura

```
equmanager/
├── apps/
│   ├── web/              Next.js 15 · panel admin y app pública
│   └── mobile/           Expo · app jinetes / club
├── packages/
│   ├── ui/               Componentes compartidos (web)
│   ├── database/         Schema Drizzle + migraciones
│   ├── api/              Routers tRPC
│   ├── auth/             Wrapper de Supabase Auth
│   ├── domain/           Tipos y lógica de negocio pura (Zod)
│   └── config/           Configs compartidas (TS, ESLint, Tailwind)
├── legacy/               Prototipo HTML original (operativo)
└── docs/                 Documentación de arquitectura y ADRs
```

### Stack

| Capa | Tecnología |
|------|------------|
| Lenguaje | TypeScript 5.6 (modo estricto) |
| Web | Next.js 15 · React 19 · Tailwind CSS 4 · shadcn/ui |
| Móvil | Expo 52 · React Native · NativeWind |
| API | tRPC 11 · Zod |
| ORM | Drizzle |
| Base de datos | Postgres (Supabase) con Row‑Level Security |
| Auth | Supabase Auth |
| Estado servidor | TanStack Query |
| Tests | Vitest · Playwright |
| Monorepo | pnpm workspaces · Turborepo |
| CI/CD | GitHub Actions · Vercel · EAS |
| Versionado | Changesets (SemVer) |

## 🚀 Inicio rápido

```bash
# Requisitos: Node 20+, pnpm 9+
corepack enable

# Clonar e instalar
git clone https://github.com/USER/equmanager.git
cd equmanager
pnpm install

# Variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# Base de datos: aplicar migraciones
pnpm db:push

# Arrancar todo en modo dev
pnpm dev
```

El panel web queda en http://localhost:3000.

## 📜 Scripts principales

| Comando | Acción |
|---------|--------|
| `pnpm dev` | Arranca web + mobile en paralelo |
| `pnpm build` | Build de producción de todos los paquetes |
| `pnpm lint` | ESLint en todo el monorepo |
| `pnpm typecheck` | TypeScript en todo el monorepo |
| `pnpm test` | Vitest |
| `pnpm db:push` | Aplica el schema a la BD |
| `pnpm db:studio` | Abre Drizzle Studio |
| `pnpm changeset` | Crea un changeset para release |

## 🤝 Contribuir

Lee [CONTRIBUTING.md](./CONTRIBUTING.md) para flujo de trabajo, convenciones de commit y proceso de release.

## 📄 Licencia

[MIT](./LICENSE) · © Equmanager
