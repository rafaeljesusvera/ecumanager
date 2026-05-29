-- =============================================================================
-- 0005 — Fecha de nacimiento del alumno
-- =============================================================================
-- Permite saber la edad real (no solo la categoría) para cumplir reglamento
-- de competición y para regalar la insignia de cumpleaños.
-- =============================================================================

alter table public.riders add column if not exists birthdate date;
