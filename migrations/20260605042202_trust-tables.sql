-- ─── Pillar 4 (Trust): agent_rules, allowlist, reputation + bump_reputation ──
-- Owner-scoped rules/allowlist; reputation is public-read but only mutated by the
-- SECURITY DEFINER bump_reputation RPC (no client write). Cross-agent RLS uses
-- the agent_owner() helper from the agents migration (recursion-safe).

create table if not exists agent_rules (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid not null references agents(id) on delete cascade,
  rule_text  text not null,
  action     text not null default 'decline' check (action in ('decline', 'allow')),
  created_at timestamptz not null default now()
);
create index if not exists agent_rules_agent_idx on agent_rules (agent_id);

create table if not exists allowlist (
  agent_id        uuid not null references agents(id) on delete cascade,
  allowed_user_id uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (agent_id, allowed_user_id)
);

create table if not exists reputation (
  agent_id   uuid primary key references agents(id) on delete cascade,
  score      int not null default 50,
  signals    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table agent_rules enable row level security;
alter table allowlist   enable row level security;
alter table reputation  enable row level security;

drop policy if exists "agent_rules_owner_all" on agent_rules;
create policy "agent_rules_owner_all" on agent_rules for all
  using ((select auth.uid()) = public.agent_owner(agent_id))
  with check ((select auth.uid()) = public.agent_owner(agent_id));

drop policy if exists "allowlist_owner_all" on allowlist;
create policy "allowlist_owner_all" on allowlist for all
  using ((select auth.uid()) = public.agent_owner(agent_id))
  with check ((select auth.uid()) = public.agent_owner(agent_id));

-- reputation: public read (trust badge); no client write policy → only the RPC mutates it.
drop policy if exists "reputation_public_select" on reputation;
create policy "reputation_public_select" on reputation for select using (true);

-- Clamped reputation delta + signal counter; lazily creates the row.
create or replace function public.bump_reputation(p_agent_id uuid, p_delta int, p_signal text)
returns int language plpgsql security definer set search_path = public as $$
declare new_score int;
begin
  insert into reputation (agent_id) values (p_agent_id) on conflict (agent_id) do nothing;
  update reputation
     set score = greatest(0, least(100, score + p_delta)),
         signals = jsonb_set(signals, array[p_signal],
                     to_jsonb(coalesce((signals->>p_signal)::int, 0) + 1), true),
         updated_at = now()
   where agent_id = p_agent_id
   returning score into new_score;
  return new_score;
end;
$$;
