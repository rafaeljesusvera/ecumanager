# @equmanager/database

Capa de persistencia: schema Drizzle, migraciones SQL y scripts.

## Aplicar el schema a Supabase

```bash
# Asegúrate de que DATABASE_URL apunta a tu proyecto Supabase
pnpm db:push
```

Esto crea/sincroniza las tablas en el schema `public`. **No aplica policies de RLS** — eso lo hace el SQL de migración.

## Aplicar policies RLS

Las policies y triggers viven en `migrations/0000_initial_rls.sql`. Tienes dos formas de aplicarlas:

**Opción A · desde el SQL Editor de Supabase (recomendada la primera vez):**

1. Abre tu proyecto en https://supabase.com/dashboard
2. SQL Editor → New query
3. Pega el contenido de `migrations/0000_initial_rls.sql`
4. Run

**Opción B · desde tu terminal:**

```bash
psql "$DATABASE_URL" -f migrations/0000_initial_rls.sql
```

El SQL es idempotente: puedes ejecutarlo varias veces sin romper nada.

## Inspeccionar la BD

```bash
pnpm db:studio
```

Abre Drizzle Studio en https://local.drizzle.studio.

## Migrar datos del prototipo

Si ya tenías datos en la tabla legacy `club_data` (un JSON por club):

```bash
pnpm --filter @equmanager/database tsx src/migrate-legacy.ts <club_code>
```

Donde `<club_code>` es el código que usabas en el prototipo (p. ej. `mi-club`). El script:

1. Lee la fila correspondiente de `club_data`.
2. Crea (o reusa) un club en la tabla `clubs` con el mismo slug.
3. Inserta cada caballo y jinete en sus respectivas tablas.
4. **No** importa clases todavía: requieren mapear `instructorId` a un profile real, que se hace cuando los usuarios estén creados en Supabase Auth.

## Seed de desarrollo

```bash
pnpm db:seed
```

Crea un club `demo` con 3 caballos, 2 jinetes y 2 insignias. Solo funciona si `NODE_ENV !== 'production'`.
