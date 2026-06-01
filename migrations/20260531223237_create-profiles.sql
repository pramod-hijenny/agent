create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  bio text,
  interests text[],
  agent_persona text,
  created_at timestamp with time zone default now()
);
