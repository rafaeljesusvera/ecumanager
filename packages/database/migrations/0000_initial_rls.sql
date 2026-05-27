-- =============================================================================
-- Equmanager · Migración inicial: setup, RLS policies y triggers
-- =============================================================================
-- Este archivo se aplica DESPUÉS de drizzle-kit push (que crea las tablas).
-- Idempotente: usa "IF NOT EXISTS" donde puede.
--
-- Roles de Supabase implicados:
--   - anon: usuarios no autenticados (debe ver casi nada)
--   - authenticated: usuarios logueados (RLS decide qué)
--   - service_role: backend admin (bypass total de RLS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FK de profiles -> auth.users (no se puede declarar desde Drizzle porque
--    el schema "auth" es gestionado por Supabase)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Trigger: al crear un auth.user, crea automáticamente un profile.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. Trigger: updated_at automático en todas las tablas que lo tengan
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'updated_at'
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at
         before update on public.%I
         for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Helper: ¿el usuario actual es miembro de este club?
-- -----------------------------------------------------------------------------
create or replace function public.is_club_member(target_club_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.club_members
    where club_id = target_club_id
      and profile_id = auth.uid()
  );
$$;

create or replace function public.club_role(target_club_id uuid)
returns club_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.club_members
  where club_id = target_club_id
    and profile_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_club_admin(target_club_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.club_members
    where club_id = target_club_id
      and profile_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

-- -----------------------------------------------------------------------------
-- 5. Activar RLS en todas las tablas
-- -----------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.clubs            enable row level security;
alter table public.club_members     enable row level security;
alter table public.horses           enable row level security;
alter table public.horse_owners     enable row level security;
alter table public.riders           enable row level security;
alter table public.lessons          enable row level security;
alter table public.lesson_objectives enable row level security;
alter table public.lesson_attendees enable row level security;
alter table public.badges           enable row level security;
alter table public.rider_badges     enable row level security;
alter table public.audit_log        enable row level security;

-- -----------------------------------------------------------------------------
-- 6. Policies: profiles
--    Cada usuario ve y edita SOLO su propio perfil.
--    Los miembros de su club pueden ver su nombre y avatar.
-- -----------------------------------------------------------------------------
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_clubmates_read" on public.profiles;
create policy "profiles_clubmates_read" on public.profiles
  for select using (
    exists (
      select 1 from public.club_members cm1
      join public.club_members cm2 on cm1.club_id = cm2.club_id
      where cm1.profile_id = auth.uid()
        and cm2.profile_id = public.profiles.id
    )
  );

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 7. Policies: clubs
--    Visible para sus miembros. Editable solo por owner/admin.
-- -----------------------------------------------------------------------------
drop policy if exists "clubs_member_read" on public.clubs;
create policy "clubs_member_read" on public.clubs
  for select using (public.is_club_member(id));

drop policy if exists "clubs_admin_update" on public.clubs;
create policy "clubs_admin_update" on public.clubs
  for update using (public.is_club_admin(id));

drop policy if exists "clubs_authenticated_insert" on public.clubs;
create policy "clubs_authenticated_insert" on public.clubs
  for insert with check (auth.uid() is not null);

-- -----------------------------------------------------------------------------
-- 8. Policies: club_members
-- -----------------------------------------------------------------------------
drop policy if exists "club_members_read" on public.club_members;
create policy "club_members_read" on public.club_members
  for select using (public.is_club_member(club_id));

drop policy if exists "club_members_admin_write" on public.club_members;
create policy "club_members_admin_write" on public.club_members
  for all using (public.is_club_admin(club_id))
  with check (public.is_club_admin(club_id));

-- -----------------------------------------------------------------------------
-- 9. Policies genéricas para tablas con club_id: lectura para miembros,
--    escritura para admins. Aplicado a: horses, riders, lessons, badges.
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array['horses', 'riders', 'lessons', 'badges']
  loop
    execute format($f$
      drop policy if exists "%1$s_member_read" on public.%1$I;
      create policy "%1$s_member_read" on public.%1$I
        for select using (public.is_club_member(club_id));

      drop policy if exists "%1$s_admin_write" on public.%1$I;
      create policy "%1$s_admin_write" on public.%1$I
        for all using (public.is_club_admin(club_id))
        with check (public.is_club_admin(club_id));
    $f$, tbl);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 10. Policies para tablas hijas (sin club_id directo): heredan vía join.
-- -----------------------------------------------------------------------------
drop policy if exists "horse_owners_read" on public.horse_owners;
create policy "horse_owners_read" on public.horse_owners
  for select using (
    exists (
      select 1 from public.horses h
      where h.id = horse_owners.horse_id
        and public.is_club_member(h.club_id)
    )
  );
drop policy if exists "horse_owners_admin_write" on public.horse_owners;
create policy "horse_owners_admin_write" on public.horse_owners
  for all using (
    exists (
      select 1 from public.horses h
      where h.id = horse_owners.horse_id
        and public.is_club_admin(h.club_id)
    )
  );

drop policy if exists "lesson_objectives_read" on public.lesson_objectives;
create policy "lesson_objectives_read" on public.lesson_objectives
  for select using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_objectives.lesson_id
        and public.is_club_member(l.club_id)
    )
  );
drop policy if exists "lesson_objectives_admin_write" on public.lesson_objectives;
create policy "lesson_objectives_admin_write" on public.lesson_objectives
  for all using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_objectives.lesson_id
        and public.is_club_admin(l.club_id)
    )
  );

drop policy if exists "lesson_attendees_read" on public.lesson_attendees;
create policy "lesson_attendees_read" on public.lesson_attendees
  for select using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_attendees.lesson_id
        and public.is_club_member(l.club_id)
    )
  );
drop policy if exists "lesson_attendees_admin_write" on public.lesson_attendees;
create policy "lesson_attendees_admin_write" on public.lesson_attendees
  for all using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_attendees.lesson_id
        and public.is_club_admin(l.club_id)
    )
  );

drop policy if exists "rider_badges_read" on public.rider_badges;
create policy "rider_badges_read" on public.rider_badges
  for select using (
    exists (
      select 1 from public.riders r
      where r.id = rider_badges.rider_id
        and public.is_club_member(r.club_id)
    )
  );
drop policy if exists "rider_badges_admin_write" on public.rider_badges;
create policy "rider_badges_admin_write" on public.rider_badges
  for all using (
    exists (
      select 1 from public.riders r
      where r.id = rider_badges.rider_id
        and public.is_club_admin(r.club_id)
    )
  );

-- -----------------------------------------------------------------------------
-- 11. audit_log: solo lectura para admins, escritura solo por backend
-- -----------------------------------------------------------------------------
drop policy if exists "audit_log_admin_read" on public.audit_log;
create policy "audit_log_admin_read" on public.audit_log
  for select using (
    club_id is null and auth.uid() is not null
    or public.is_club_admin(club_id)
  );
-- No se define policy de INSERT: solo service_role escribirá (bypass RLS).
