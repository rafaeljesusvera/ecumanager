-- =============================================================================
-- 0006 — Directorio público de clubes hípicos (RFHE + autonómicas)
-- =============================================================================
-- Tabla SEPARADA de `clubs`: sirve solo como "yellow pages" para autocompletar
-- el onboarding. Una entrada aquí no implica que el club esté usando la app.
--
-- Se alimenta via script de ingesta desde dataset oficial. Lectura pública.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'spain_federation') then
    create type spain_federation as enum (
      'rfhe',
      'andalucia', 'aragon', 'asturias', 'baleares', 'canarias',
      'cantabria', 'castilla_leon', 'castilla_la_mancha', 'cataluna',
      'ceuta', 'extremadura', 'galicia', 'madrid', 'melilla',
      'murcia', 'navarra', 'pais_vasco', 'la_rioja', 'valencia'
    );
  end if;
end $$;

create table if not exists public.directory_clubs (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  federation spain_federation not null,
  name text not null,
  search_slug text not null,
  province text,
  city text,
  address text,
  postal_code text,
  phone text,
  email text,
  website text,
  latitude text,
  longitude text,
  source_url text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists directory_clubs_external_unique
  on public.directory_clubs(federation, external_id);

create index if not exists directory_clubs_province_idx
  on public.directory_clubs(province);

create index if not exists directory_clubs_search_slug_idx
  on public.directory_clubs(search_slug);

-- Trigger updated_at
drop trigger if exists set_updated_at on public.directory_clubs;
create trigger set_updated_at
  before update on public.directory_clubs
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS: lectura pública (es información de yellow pages). Escritura solo
-- service_role (la ingesta corre con service key).
-- -----------------------------------------------------------------------------
alter table public.directory_clubs enable row level security;

drop policy if exists "directory_clubs_public_read" on public.directory_clubs;
create policy "directory_clubs_public_read" on public.directory_clubs
  for select using (true);

-- No se define INSERT/UPDATE/DELETE: solo service_role escribe.
