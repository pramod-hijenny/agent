-- ─── Pillar 3 (Interaction): messages state machine + screening_log ──────────
-- DESTRUCTIVE: drops the vestigial unused chat tables from the abandoned
-- "social-network-rebuild" (zero frontend usage) so the spec `messages` table can
-- own that name. This discards seed data only (messages ~10, conversations ~5,
-- negotiation_turns ~210, agent_tasks ~10).
drop table if exists negotiation_turns cascade;
drop table if exists agent_tasks        cascade;
drop table if exists messages           cascade;
drop table if exists conversations      cascade;

create table if not exists messages (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'dm' check (kind in ('intro', 'dm')),
  from_agent_id  uuid not null references agents(id) on delete cascade,
  to_agent_id    uuid not null references agents(id) on delete cascade,
  body           text not null default '',
  context        jsonb not null default '{}'::jsonb,
  state          text not null default 'requested'
                   check (state in ('requested', 'screened', 'approved', 'delivered', 'declined')),
  decline_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists messages_to_state_idx on messages (to_agent_id, state);
create index if not exists messages_from_idx on messages (from_agent_id, created_at desc);

create table if not exists screening_log (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  decision   text not null check (decision in ('pass', 'decline')),
  reason     text not null default '',
  model      text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists screening_log_message_idx on screening_log (message_id);

-- message_id → recipient/sender owning user (SECURITY DEFINER, recursion-safe).
create or replace function public.message_recipient_user(p_message_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select public.agent_owner(m.to_agent_id) from messages m where m.id = p_message_id;
$$;
create or replace function public.message_sender_user(p_message_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select public.agent_owner(m.from_agent_id) from messages m where m.id = p_message_id;
$$;

alter table messages      enable row level security;
alter table screening_log enable row level security;

-- Either participant reads; sender inserts (must start 'requested'); recipient drives state.
drop policy if exists "messages_participant_select" on messages;
create policy "messages_participant_select" on messages for select using (
  (select auth.uid()) = public.agent_owner(from_agent_id)
  or (select auth.uid()) = public.agent_owner(to_agent_id)
);
drop policy if exists "messages_sender_insert" on messages;
create policy "messages_sender_insert" on messages for insert with check (
  (select auth.uid()) = public.agent_owner(from_agent_id) and state = 'requested'
);
drop policy if exists "messages_recipient_update" on messages;
create policy "messages_recipient_update" on messages for update
  using ((select auth.uid()) = public.agent_owner(to_agent_id))
  with check ((select auth.uid()) = public.agent_owner(to_agent_id));
-- Sender may also update their own message while it is still 'requested' (edit-on-approve).
drop policy if exists "messages_sender_update_requested" on messages;
create policy "messages_sender_update_requested" on messages for update
  using ((select auth.uid()) = public.agent_owner(from_agent_id) and state in ('requested', 'screened'))
  with check ((select auth.uid()) = public.agent_owner(from_agent_id));

-- screening_log: recipient writes; both participants read.
drop policy if exists "screening_log_recipient_write" on screening_log;
create policy "screening_log_recipient_write" on screening_log for insert
  with check ((select auth.uid()) = public.message_recipient_user(message_id));
drop policy if exists "screening_log_participant_select" on screening_log;
create policy "screening_log_participant_select" on screening_log for select using (
  (select auth.uid()) = public.message_recipient_user(message_id)
  or (select auth.uid()) = public.message_sender_user(message_id)
);
