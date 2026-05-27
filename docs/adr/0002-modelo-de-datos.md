# ADR 0002 · Modelo de datos relacional y RLS

- **Fecha:** 2026‑05‑24
- **Estado:** Aceptado

## Contexto

El prototipo guardaba todo en una tabla `club_data` con dos columnas relevantes: `club_code` y un campo `data jsonb` gigante que contenía caballos, jinetes, clases, insignias e imágenes. Esto facilitó el arranque, pero impide:

- Indexar por entidad o filtrar eficientemente.
- Aplicar permisos a nivel de fila (un jinete no puede ver los datos confidenciales de otro).
- Validar integridad referencial (un objetivo de clase apunta a una clase existente).
- Hacer joins y agregaciones (contar clases del último mes, etc.).

## Decisión

Normalizar el modelo en 12 tablas:

```
clubs · profiles · club_members
horses · horse_owners
riders · lessons · lesson_objectives · lesson_attendees
badges · rider_badges · audit_log
```

Reglas:

1. **Identificadores UUID** generados en Postgres (`gen_random_uuid()`).
2. **`club_id` propagado** en cada tabla de primer nivel para filtrado y RLS sencillos.
3. **FKs explícitas** con `on delete cascade` cuando el hijo no tiene sentido sin el padre; `on delete set null` cuando puede quedar huérfano legítimamente (p. ej. `lesson_attendees.horse_id`).
4. **Índices** en todas las FKs y en pares (`club_id`, `<sort_field>`) usados frecuentemente.
5. **Triggers de `updated_at` automático** en cada tabla con esa columna.

## RLS

Cada tabla activa Row‑Level Security. Helpers SQL:

- `is_club_member(uuid)` — el usuario actual pertenece al club.
- `is_club_admin(uuid)` — el usuario actual es owner o admin del club.
- `club_role(uuid)` — devuelve el rol enum.

Patrón general:
- Tablas con `club_id`: lectura para miembros, escritura para admins.
- Tablas hijas sin `club_id`: la policy hace join al padre y delega en su `club_id`.
- `audit_log`: solo lectura para admins; solo el backend (service role) escribe.

## Consecuencias

- Migrar los datos actuales requiere un script dedicado (`migrate-legacy.ts`).
- Cualquier cliente con la `anon key` solo puede ver lo que RLS le permite, lo que nos permite usar Supabase directamente desde el navegador sin un backend intermedio.
- Cuando aparezca tRPC (Fase 4), las queries seguirán pasando por RLS, pero podremos añadir reglas adicionales en el servidor.
