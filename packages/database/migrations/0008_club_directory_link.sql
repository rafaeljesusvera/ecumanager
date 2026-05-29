-- =============================================================================
-- 0008 — Vínculo club operativo ↔ directorio público
-- =============================================================================
-- Una hípica operativa en Equmanager puede "reclamar" su entrada del padrón
-- (RFHE / autonómicas). El vínculo es opcional: un club puede operar sin
-- estar federado. Un directory_club solo puede ser reclamado por UN club
-- operativo a la vez (unique parcial).
-- =============================================================================

alter table public.clubs
  add column if not exists directory_club_id uuid
  references public.directory_clubs(id) on delete set null;

create unique index if not exists clubs_directory_club_unique
  on public.clubs(directory_club_id)
  where directory_club_id is not null;

create index if not exists clubs_directory_idx
  on public.clubs(directory_club_id);
