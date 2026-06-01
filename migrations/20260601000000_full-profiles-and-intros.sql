-- ─── Step 1: Add missing columns to profiles ─────────────────────────────────

alter table profiles
  add column if not exists user_id uuid unique references auth.users(id) on delete cascade;
alter table profiles add column if not exists full_name text not null default '';
alter table profiles add column if not exists community_id text not null default 'demo';
alter table profiles add column if not exists city text not null default '';
alter table profiles add column if not exists profession text not null default '';
alter table profiles add column if not exists company text not null default '';
alter table profiles add column if not exists role text not null default 'Founder';
alter table profiles add column if not exists stage text not null default '';
alter table profiles add column if not exists avatar_color text not null default 'from-sky-400 to-indigo-400';
alter table profiles add column if not exists skills text[] not null default '{}';
alter table profiles add column if not exists goals text[] not null default '{}';
alter table profiles add column if not exists current_ask text not null default '';
alter table profiles add column if not exists offering text not null default '';
alter table profiles add column if not exists availability text not null default '';
alter table profiles add column if not exists likes text not null default '';
alter table profiles add column if not exists dislikes text not null default '';
alter table profiles add column if not exists topics_enjoy text not null default '';
alter table profiles add column if not exists topics_avoid text not null default '';
alter table profiles add column if not exists agent jsonb not null default '{}';
alter table profiles add column if not exists permissions jsonb not null default '{}';
alter table profiles add column if not exists updated_at timestamptz not null default now();

-- ─── Step 2: Enable RLS on profiles + add policies ──────────────────────────

alter table profiles enable row level security;

drop policy if exists "profiles_public_select" on profiles;
drop policy if exists "profiles_owner_insert" on profiles;
drop policy if exists "profiles_owner_update" on profiles;
drop policy if exists "profiles_owner_delete" on profiles;

create policy "profiles_public_select" on profiles for select using (true);
create policy "profiles_owner_insert" on profiles for insert with check (auth.uid() = user_id);
create policy "profiles_owner_update" on profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_owner_delete" on profiles for delete using (auth.uid() = user_id);

-- ─── Step 3: Create intro_requests table ─────────────────────────────────────

create table if not exists intro_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_profile_id uuid not null references profiles(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  transcript jsonb,
  summary jsonb,
  created_at timestamptz not null default now()
);

create index if not exists intro_requests_from_user_idx on intro_requests (from_user_id, created_at desc);
create index if not exists intro_requests_to_profile_idx on intro_requests (to_profile_id, status);

alter table intro_requests enable row level security;

drop policy if exists "intro_requests_participant_select" on intro_requests;
drop policy if exists "intro_requests_owner_insert" on intro_requests;
drop policy if exists "intro_requests_owner_update" on intro_requests;

create policy "intro_requests_participant_select" on intro_requests
  for select using (
    auth.uid() = from_user_id or
    exists (select 1 from profiles where id = to_profile_id and user_id = auth.uid())
  );
create policy "intro_requests_owner_insert" on intro_requests
  for insert with check (auth.uid() = from_user_id);
create policy "intro_requests_owner_update" on intro_requests
  for update using (
    auth.uid() = from_user_id or
    exists (select 1 from profiles where id = to_profile_id and user_id = auth.uid())
  );
