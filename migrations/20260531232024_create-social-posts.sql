-- Social posts ingested from external platforms (LinkedIn first, X/others later)
-- via rtrvr.ai browser automation.

create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('linkedin', 'twitter', 'x', 'instagram', 'tiktok', 'youtube')),
  external_post_id text not null,
  author_name text,
  author_handle text,
  author_avatar_url text,
  content text,
  post_url text,
  posted_at timestamptz,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  reposts integer not null default 0,
  media_urls text[] not null default '{}',
  raw jsonb,
  fetched_at timestamptz not null default now(),
  unique (user_id, platform, external_post_id)
);

create index if not exists social_posts_user_platform_idx
  on social_posts (user_id, platform, posted_at desc nulls last);

create index if not exists social_posts_engagement_idx
  on social_posts (user_id, (likes + comments + shares + reposts) desc);

alter table social_posts enable row level security;

drop policy if exists "social_posts_owner_select" on social_posts;
drop policy if exists "social_posts_owner_insert" on social_posts;
drop policy if exists "social_posts_owner_update" on social_posts;
drop policy if exists "social_posts_owner_delete" on social_posts;

create policy "social_posts_owner_select" on social_posts
  for select using (auth.uid() = user_id);

create policy "social_posts_owner_insert" on social_posts
  for insert with check (auth.uid() = user_id);

create policy "social_posts_owner_update" on social_posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "social_posts_owner_delete" on social_posts
  for delete using (auth.uid() = user_id);

-- Per-run audit so the dashboard can show "last synced X min ago" and surface errors.
create table if not exists social_sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  status text not null check (status in ('running', 'success', 'error')),
  post_count integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists social_sync_runs_user_idx
  on social_sync_runs (user_id, started_at desc);

alter table social_sync_runs enable row level security;

drop policy if exists "social_sync_runs_owner_select" on social_sync_runs;
drop policy if exists "social_sync_runs_owner_insert" on social_sync_runs;
drop policy if exists "social_sync_runs_owner_update" on social_sync_runs;

create policy "social_sync_runs_owner_select" on social_sync_runs
  for select using (auth.uid() = user_id);

create policy "social_sync_runs_owner_insert" on social_sync_runs
  for insert with check (auth.uid() = user_id);

create policy "social_sync_runs_owner_update" on social_sync_runs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
