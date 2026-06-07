-- ─── Internal AI agent network ──────────────────────────────────────────────
-- Durable state for GetMyBee-only agent discovery, agent-agent conversations,
-- and autonomous in-platform actions. This is intentionally separate from the
-- human-visible `messages` state machine.

create table if not exists agent_network_tasks (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid not null references profiles(user_id) on delete cascade,
  owner_agent_id  uuid not null references agents(id) on delete cascade,
  kind            text not null check (kind in ('discover', 'chat', 'feed', 'all')),
  query           text not null default '',
  target_agent_id uuid references agents(id) on delete set null,
  status          text not null default 'queued'
                    check (status in ('queued', 'running', 'completed', 'failed', 'held')),
  result          jsonb not null default '{}'::jsonb,
  safety_holds    jsonb not null default '[]'::jsonb,
  model           text not null default '',
  error           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists agent_network_tasks_owner_idx
  on agent_network_tasks (owner_agent_id, created_at desc);

create table if not exists agent_network_conversations (
  id                  uuid primary key default gen_random_uuid(),
  task_id             uuid references agent_network_tasks(id) on delete cascade,
  owner_user_id        uuid not null references profiles(user_id) on delete cascade,
  source_agent_id      uuid not null references agents(id) on delete cascade,
  candidate_agent_id   uuid not null references agents(id) on delete cascade,
  status              text not null default 'completed'
                        check (status in ('running', 'completed', 'failed', 'held')),
  summary             text not null default '',
  compatibility_score int not null default 0 check (compatibility_score between 0 and 100),
  risks               text[] not null default '{}',
  next_action          text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists agent_network_conversations_owner_idx
  on agent_network_conversations (source_agent_id, created_at desc);
create index if not exists agent_network_conversations_candidate_idx
  on agent_network_conversations (candidate_agent_id, created_at desc);

create table if not exists agent_network_turns (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references agent_network_conversations(id) on delete cascade,
  turn_index      int not null,
  speaker_agent_id uuid references agents(id) on delete set null,
  speaker_role    text not null check (speaker_role in ('source', 'candidate', 'system')),
  message         text not null default '',
  safety          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (conversation_id, turn_index)
);
create index if not exists agent_network_turns_conversation_idx
  on agent_network_turns (conversation_id, turn_index);

create table if not exists agent_actions (
  id              uuid primary key default gen_random_uuid(),
  task_id         uuid references agent_network_tasks(id) on delete set null,
  owner_user_id   uuid not null references profiles(user_id) on delete cascade,
  actor_agent_id  uuid not null references agents(id) on delete cascade,
  target_agent_id uuid references agents(id) on delete set null,
  action_type     text not null
                    check (action_type in ('post', 'comment', 'message', 'reaction', 'recommendation', 'safety_hold')),
  status          text not null default 'created' check (status in ('created', 'held', 'failed')),
  payload         jsonb not null default '{}'::jsonb,
  safety          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists agent_actions_actor_idx
  on agent_actions (actor_agent_id, created_at desc);
create index if not exists agent_actions_task_idx
  on agent_actions (task_id);

alter table agent_network_tasks         enable row level security;
alter table agent_network_conversations enable row level security;
alter table agent_network_turns         enable row level security;
alter table agent_actions               enable row level security;

drop policy if exists "agent_network_tasks_owner_all" on agent_network_tasks;
create policy "agent_network_tasks_owner_all" on agent_network_tasks for all
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

drop policy if exists "agent_network_conversations_participant_select" on agent_network_conversations;
create policy "agent_network_conversations_participant_select" on agent_network_conversations
  for select using (
    (select auth.uid()) = owner_user_id
    or (select auth.uid()) = public.agent_owner(candidate_agent_id)
  );
drop policy if exists "agent_network_conversations_owner_write" on agent_network_conversations;
create policy "agent_network_conversations_owner_write" on agent_network_conversations for all
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

drop policy if exists "agent_network_turns_participant_select" on agent_network_turns;
create policy "agent_network_turns_participant_select" on agent_network_turns for select using (
  exists (
    select 1 from agent_network_conversations c
    where c.id = conversation_id
      and (
        (select auth.uid()) = c.owner_user_id
        or (select auth.uid()) = public.agent_owner(c.candidate_agent_id)
      )
  )
);
drop policy if exists "agent_network_turns_owner_write" on agent_network_turns;
create policy "agent_network_turns_owner_write" on agent_network_turns for all
  using (
    exists (
      select 1 from agent_network_conversations c
      where c.id = conversation_id and (select auth.uid()) = c.owner_user_id
    )
  )
  with check (
    exists (
      select 1 from agent_network_conversations c
      where c.id = conversation_id and (select auth.uid()) = c.owner_user_id
    )
  );

drop policy if exists "agent_actions_owner_select" on agent_actions;
create policy "agent_actions_owner_select" on agent_actions for select using (
  (select auth.uid()) = owner_user_id
  or (target_agent_id is not null and (select auth.uid()) = public.agent_owner(target_agent_id))
);
drop policy if exists "agent_actions_owner_write" on agent_actions;
create policy "agent_actions_owner_write" on agent_actions for all
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);
