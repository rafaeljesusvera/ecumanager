-- =============================================================================
-- 0004 — Vínculos entre perfiles (cuentas vinculadas estilo Google)
-- =============================================================================
-- Permite que una persona logueada con una sola cuenta Supabase pueda asumir
-- otros perfiles a los que está vinculado (sus hijos, su madre, una persona
-- a la que asiste...). El "perfil activo" se guarda en cookie httpOnly desde
-- la app, no en la base de datos.
-- =============================================================================

-- Enums (idempotente)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_link_relation') then
    create type profile_link_relation as enum (
      'self', 'padre', 'madre', 'tutor', 'conyuge',
      'hijo', 'hija', 'secretaria', 'asistente', 'otro'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'profile_link_status') then
    create type profile_link_status as enum ('activa', 'pendiente', 'revocada');
  end if;
end $$;

create table if not exists public.profile_links (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  target_profile_id uuid references public.profiles(id) on delete cascade,
  rider_id uuid references public.riders(id) on delete cascade,
  relation profile_link_relation not null,
  label text,
  status profile_link_status not null default 'activa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_links_target_or_rider check (
    target_profile_id is not null or rider_id is not null
  )
);

create index if not exists profile_links_owner_idx
  on public.profile_links(owner_profile_id);

create unique index if not exists profile_links_owner_target_unique
  on public.profile_links(owner_profile_id, target_profile_id)
  where target_profile_id is not null;

create unique index if not exists profile_links_owner_rider_unique
  on public.profile_links(owner_profile_id, rider_id)
  where rider_id is not null;

-- Trigger updated_at (lo aplica el bucle genérico del 0000, pero la tabla
-- es nueva: lo creamos aquí explícitamente por si la migración 0000 ya corrió).
drop trigger if exists set_updated_at on public.profile_links;
create trigger set_updated_at
  before update on public.profile_links
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS: cada usuario gestiona SUS propios vínculos.
-- -----------------------------------------------------------------------------
alter table public.profile_links enable row level security;

drop policy if exists "profile_links_owner_read" on public.profile_links;
create policy "profile_links_owner_read" on public.profile_links
  for select using (owner_profile_id = auth.uid());

drop policy if exists "profile_links_owner_write" on public.profile_links;
create policy "profile_links_owner_write" on public.profile_links
  for all using (owner_profile_id = auth.uid())
  with check (owner_profile_id = auth.uid());

-- El perfil "target" puede ver los vínculos en los que aparece (para saber
-- quién le está gestionando) y revocarlos si quiere.
drop policy if exists "profile_links_target_read" on public.profile_links;
create policy "profile_links_target_read" on public.profile_links
  for select using (target_profile_id = auth.uid());
