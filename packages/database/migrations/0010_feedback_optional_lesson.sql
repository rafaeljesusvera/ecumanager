-- =============================================================================
-- 0010 — Feedback IA sin clase obligatoria
-- =============================================================================
-- Permite confirmar feedback desde la Bandeja IA aunque la nota de voz no
-- esté asociada a una clase concreta (entrenamientos informales, salida,
-- repaso fuera de calendario...). El alumno seguirá viéndolo en su panel.
-- =============================================================================

alter table public.lesson_feedback
  alter column lesson_id drop not null;
