-- =============================================================================
-- 0011 — Rol provider + mensajería interna + red social básica
-- =============================================================================

-- 1. Rol "provider" (veterinario, herrador, dentista, etc.)
alter type club_role add value if not exists 'provider';

-- Postgres no permite create type IF NOT EXISTS; lo envolvemos en DO.
do $$ begin
  if not exists (select 1 from pg_type where typname = 'provider_specialty') then
    create type provider_specialty as enum (
      'veterinario', 'herrador', 'dentista', 'fisio', 'nutricion',
      'transporte', 'seguros', 'otros'
    );
  end if;
end $$;

create table if not exists public.provider_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  specialty provider_specialty not null,
  business_name text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, specialty)
);

drop trigger if exists set_updated_at on public.provider_profiles;
create trigger set_updated_at
  before update on public.provider_profiles
  for each row execute function public.set_updated_at();

alter table public.provider_profiles enable row level security;

drop policy if exists "provider_profiles_self_rw" on public.provider_profiles;
create policy "provider_profiles_self_rw" on public.provider_profiles
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "provider_profiles_clubmates_read" on public.provider_profiles;
create policy "provider_profiles_clubmates_read" on public.provider_profiles
  for select using (
    exists (
      select 1
      from public.club_members cm1
      join public.club_members cm2 on cm1.club_id = cm2.club_id
      where cm1.profile_id = auth.uid()
        and cm2.profile_id = provider_profiles.profile_id
    )
  );

-- =============================================================================
-- 2. Mensajería interna
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'message_thread_kind') then
    create type message_thread_kind as enum ('direct', 'broadcast');
  end if;
end $$;

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  kind message_thread_kind not null default 'direct',
  title text,
  created_by uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_threads_club_idx on public.message_threads(club_id);
create index if not exists message_threads_last_idx on public.message_threads(last_message_at desc);

drop trigger if exists set_updated_at on public.message_threads;
create trigger set_updated_at
  before update on public.message_threads
  for each row execute function public.set_updated_at();

create table if not exists public.thread_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  muted boolean not null default false,
  unique (thread_id, profile_id)
);
create index if not exists thread_participants_profile_idx on public.thread_participants(profile_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_thread_created_idx on public.messages(thread_id, created_at desc);

alter table public.message_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;

-- Solo participantes ven el hilo y los mensajes
drop policy if exists "threads_participant_read" on public.message_threads;
create policy "threads_participant_read" on public.message_threads
  for select using (
    exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = message_threads.id
        and tp.profile_id = auth.uid()
    )
  );

drop policy if exists "threads_authenticated_create" on public.message_threads;
create policy "threads_authenticated_create" on public.message_threads
  for insert with check (auth.uid() is not null);

drop policy if exists "participants_self_read" on public.thread_participants;
create policy "participants_self_read" on public.thread_participants
  for select using (
    exists (
      select 1 from public.thread_participants my
      where my.thread_id = thread_participants.thread_id
        and my.profile_id = auth.uid()
    )
  );

drop policy if exists "participants_creator_write" on public.thread_participants;
create policy "participants_creator_write" on public.thread_participants
  for insert with check (auth.uid() is not null);

drop policy if exists "participants_self_update" on public.thread_participants;
create policy "participants_self_update" on public.thread_participants
  for update using (profile_id = auth.uid());

drop policy if exists "messages_participant_read" on public.messages;
create policy "messages_participant_read" on public.messages
  for select using (
    exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = messages.thread_id
        and tp.profile_id = auth.uid()
    )
  );

drop policy if exists "messages_participant_write" on public.messages;
create policy "messages_participant_write" on public.messages
  for insert with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = messages.thread_id
        and tp.profile_id = auth.uid()
    )
  );

-- =============================================================================
-- 3. Red social básica: connections + posts + likes
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'connection_status') then
    create type connection_status as enum ('pendiente', 'aceptada', 'bloqueada');
  end if;
end $$;

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status connection_status not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> recipient_id),
  unique (requester_id, recipient_id)
);
create index if not exists connections_recipient_idx on public.connections(recipient_id, status);

drop trigger if exists set_updated_at on public.connections;
create trigger set_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

alter table public.connections enable row level security;

drop policy if exists "connections_self_read" on public.connections;
create policy "connections_self_read" on public.connections
  for select using (
    requester_id = auth.uid() or recipient_id = auth.uid()
  );

drop policy if exists "connections_requester_write" on public.connections;
create policy "connections_requester_write" on public.connections
  for insert with check (requester_id = auth.uid());

drop policy if exists "connections_self_update" on public.connections;
create policy "connections_self_update" on public.connections
  for update using (
    requester_id = auth.uid() or recipient_id = auth.uid()
  );

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  body text not null,
  photo_url text,
  created_at timestamptz not null default now()
);
create index if not exists social_posts_author_idx on public.social_posts(author_id, created_at desc);
create index if not exists social_posts_created_idx on public.social_posts(created_at desc);

create table if not exists public.social_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

alter table public.social_posts enable row level security;
alter table public.social_likes enable row level security;

-- Posts: visible para conexiones aceptadas y para clubmates del autor.
drop policy if exists "social_posts_connections_read" on public.social_posts;
create policy "social_posts_connections_read" on public.social_posts
  for select using (
    author_id = auth.uid()
    or exists (
      select 1 from public.connections c
      where c.status = 'aceptada'
        and (
          (c.requester_id = auth.uid() and c.recipient_id = social_posts.author_id)
          or (c.recipient_id = auth.uid() and c.requester_id = social_posts.author_id)
        )
    )
    or exists (
      select 1 from public.club_members cm1
      join public.club_members cm2 on cm1.club_id = cm2.club_id
      where cm1.profile_id = auth.uid()
        and cm2.profile_id = social_posts.author_id
    )
  );

drop policy if exists "social_posts_self_write" on public.social_posts;
create policy "social_posts_self_write" on public.social_posts
  for all using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "social_likes_self_rw" on public.social_likes;
create policy "social_likes_self_rw" on public.social_likes
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "social_likes_visible_read" on public.social_likes;
create policy "social_likes_visible_read" on public.social_likes
  for select using (true);
