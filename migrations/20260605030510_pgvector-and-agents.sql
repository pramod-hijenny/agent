-- ─── Pillar 1: Agent Registry + pgvector (Discovery foundation) ──────────────
-- Moves agent persona out of the profiles.agent JSONB into a first-class
-- `agents` table with a pgvector embedding for semantic discovery. The frontend
-- `Profile.agent` shape is preserved by the auth.ts mapper (joins profiles+agents).
-- EMBED_DIM = 1024 (Nebius Qwen/Qwen3-Embedding-8B). This literal must match the
-- edge-layer embedding model + match_agents(); a vector column's dimension cannot
-- be ALTERed in place, so a model swap = new column + full re-embed.

create extension if not exists vector;

-- profiles.user_id was declared `unique` via `add column if not exists` in an
-- earlier migration, but the column already existed so the constraint was never
-- created. agents.user_id (and the PostgREST profiles→agents embed) need it.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass and conname = 'profiles_user_id_key'
  ) then
    alter table profiles add constraint profiles_user_id_key unique (user_id);
  end if;
end $$;

create table if not exists agents (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references profiles(user_id) on delete cascade,
  name               text not null default '',
  persona_tone       text not null default 'Friendly'
                       check (persona_tone in ('Friendly','Professional','Direct','Warm','Curious')),
  agent_intro        text not null default '',
  mission            text not null default '',
  goals              text[] not null default '{}',
  interests          text[] not null default '{}',
  skills             text[] not null default '{}',
  intent             text not null default '',
  memory             text[] not null default '{}',
  agent_mode_enabled boolean not null default false,
  embedding          vector(1024),
  embedding_model    text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists agents_user_idx on agents (user_id);

-- ─── Backfill existing profiles' agent JSONB → agents rows ───────────────────
insert into agents (user_id, name, persona_tone, agent_intro, mission, goals,
                    interests, skills, intent, memory, agent_mode_enabled)
select
  p.user_id,
  coalesce(p.agent->>'agent_name', '')                                        as name,
  coalesce(nullif(p.agent->>'tone',''), 'Friendly')                          as persona_tone,
  coalesce(p.agent->>'agent_intro', '')                                      as agent_intro,
  coalesce(p.agent->>'current_mission', '')                                  as mission,
  coalesce(p.goals, '{}')                                                    as goals,
  coalesce(p.interests, '{}')                                                as interests,
  coalesce(p.skills, '{}')                                                   as skills,
  coalesce(p.current_ask, '')                                                as intent,
  coalesce(
    array(select jsonb_array_elements_text(
      case when jsonb_typeof(p.agent->'memory') = 'array'
           then p.agent->'memory' else '[]'::jsonb end)), '{}')             as memory,
  (coalesce(p.agent->>'status','paused') = 'active')                        as agent_mode_enabled
from profiles p
where p.user_id is not null
on conflict (user_id) do nothing;

-- ─── RLS: public read (discovery), owner-only write ──────────────────────────
alter table agents enable row level security;

drop policy if exists "agents_public_select" on agents;
drop policy if exists "agents_owner_insert"  on agents;
drop policy if exists "agents_owner_update"  on agents;
drop policy if exists "agents_owner_delete"  on agents;

create policy "agents_public_select" on agents for select using (true);
create policy "agents_owner_insert" on agents for insert with check ((select auth.uid()) = user_id);
create policy "agents_owner_update" on agents for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "agents_owner_delete" on agents for delete using ((select auth.uid()) = user_id);

-- ─── agent_id → owning user_id (SECURITY DEFINER, recursion-safe) ────────────
-- Used by every cross-agent RLS policy in later migrations. SECURITY DEFINER
-- bypasses agents' RLS so policies on messages/screening_log/etc. never recurse.
create or replace function public.agent_owner(p_agent_id uuid)
returns uuid language sql stable security definer
set search_path = public as $$
  select user_id from agents where id = p_agent_id;
$$;

-- ─── Semantic discovery: HNSW cosine index + match_agents RPC ────────────────
create index if not exists agents_embedding_hnsw
  on agents using hnsw (embedding vector_cosine_ops);

create or replace function public.match_agents(
  query_embedding vector(1024),
  exclude_agent   uuid default null,
  k               int  default 10
) returns table (agent_id uuid, similarity float)
language sql stable security definer
set search_path = public as $$
  select a.id, 1 - (a.embedding <=> query_embedding) as similarity
  from agents a
  where a.embedding is not null
    and (exclude_agent is null or a.id <> exclude_agent)
  order by a.embedding <=> query_embedding
  limit greatest(k, 1);
$$;
