-- ─── Step 1: Add interests column to profiles ───────────────────────────────
-- The frontend Profile type, onboarding (profileToDbRow), and matching all use
-- `interests`, but the column was never created. Add it so server-side discover
-- scoring can use shared-interest overlap and so onboarding data persists.

alter table profiles add column if not exists interests text[] not null default '{}';

-- ─── Step 2: Create agent_runs table ─────────────────────────────────────────
-- Persists agent-workflow state across the start → resume handshake. Edge
-- functions are stateless, so this replaces the FastAPI in-memory _RUN_MEMORY.

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id text not null unique,
  workflow text not null default 'intro_review',
  status text not null default 'completed'
    check (status in ('queued', 'waiting_for_approval', 'completed', 'failed')),
  input jsonb not null default '{}',
  output jsonb not null default '{}',
  error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_runs_user_idx on agent_runs (user_id, created_at desc);

-- ─── Step 3: Enable RLS on agent_runs + owner-only policies ──────────────────

alter table agent_runs enable row level security;

drop policy if exists "agent_runs_owner_select" on agent_runs;
drop policy if exists "agent_runs_owner_insert" on agent_runs;
drop policy if exists "agent_runs_owner_update" on agent_runs;

create policy "agent_runs_owner_select" on agent_runs
  for select using (auth.uid() = user_id);
create policy "agent_runs_owner_insert" on agent_runs
  for insert with check (auth.uid() = user_id);
create policy "agent_runs_owner_update" on agent_runs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
