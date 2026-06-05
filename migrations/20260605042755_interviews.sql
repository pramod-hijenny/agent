-- ─── Interview (hiring use case): bounded agent-to-agent interview records ───
-- The hiring agent's owner drives the interview; both participants can read it.

create table if not exists interviews (
  id                 uuid primary key default gen_random_uuid(),
  hiring_agent_id    uuid not null references agents(id) on delete cascade,
  candidate_agent_id uuid not null references agents(id) on delete cascade,
  transcript         jsonb not null default '[]'::jsonb,
  scores             jsonb not null default '{}'::jsonb,
  state              text not null default 'in_progress'
                       check (state in ('in_progress', 'completed', 'abandoned')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists interviews_hiring_idx on interviews (hiring_agent_id, created_at desc);
create index if not exists interviews_candidate_idx on interviews (candidate_agent_id, created_at desc);

alter table interviews enable row level security;

drop policy if exists "interviews_participant_select" on interviews;
create policy "interviews_participant_select" on interviews for select using (
  (select auth.uid()) = public.agent_owner(hiring_agent_id)
  or (select auth.uid()) = public.agent_owner(candidate_agent_id)
);
drop policy if exists "interviews_hiring_insert" on interviews;
create policy "interviews_hiring_insert" on interviews for insert
  with check ((select auth.uid()) = public.agent_owner(hiring_agent_id));
drop policy if exists "interviews_hiring_update" on interviews;
create policy "interviews_hiring_update" on interviews for update
  using ((select auth.uid()) = public.agent_owner(hiring_agent_id))
  with check ((select auth.uid()) = public.agent_owner(hiring_agent_id));
