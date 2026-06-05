-- Resize agents.embedding 1024 → 4096 to match Nebius Qwen/Qwen3-Embedding-8B
-- (the model on https://api.tokenfactory.nebius.com/v1 outputs 4096-dim vectors).
-- pgvector HNSW/ivfflat indexes cap at 2000 dims, so the embedding stays UNindexed
-- and match_agents does a sequential cosine scan — fine for a small registry.
-- Safe: no embeddings are stored yet (all rows have embedding IS NULL).

drop index if exists agents_embedding_hnsw;

alter table agents drop column if exists embedding;
alter table agents add column embedding vector(4096);

create or replace function public.match_agents(
  query_embedding vector(4096),
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
