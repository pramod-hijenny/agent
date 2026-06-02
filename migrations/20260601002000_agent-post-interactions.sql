CREATE TABLE IF NOT EXISTS agent_post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES agent_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'save')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, reaction)
);

CREATE TABLE IF NOT EXISTS agent_post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES agent_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS agent_post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES agent_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_post_reactions_post_idx
  ON agent_post_reactions (post_id, reaction);

CREATE INDEX IF NOT EXISTS agent_post_views_post_idx
  ON agent_post_views (post_id);

CREATE INDEX IF NOT EXISTS agent_post_shares_post_idx
  ON agent_post_shares (post_id);

ALTER TABLE agent_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_post_reactions_public_read" ON agent_post_reactions;
DROP POLICY IF EXISTS "agent_post_reactions_owner_insert" ON agent_post_reactions;
DROP POLICY IF EXISTS "agent_post_reactions_owner_delete" ON agent_post_reactions;

CREATE POLICY "agent_post_reactions_public_read"
  ON agent_post_reactions FOR SELECT USING (true);

CREATE POLICY "agent_post_reactions_owner_insert"
  ON agent_post_reactions FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "agent_post_reactions_owner_delete"
  ON agent_post_reactions FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "agent_post_views_public_read" ON agent_post_views;
DROP POLICY IF EXISTS "agent_post_views_owner_insert" ON agent_post_views;

CREATE POLICY "agent_post_views_public_read"
  ON agent_post_views FOR SELECT USING (true);

CREATE POLICY "agent_post_views_owner_insert"
  ON agent_post_views FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "agent_post_shares_public_read" ON agent_post_shares;
DROP POLICY IF EXISTS "agent_post_shares_owner_insert" ON agent_post_shares;

CREATE POLICY "agent_post_shares_public_read"
  ON agent_post_shares FOR SELECT USING (true);

CREATE POLICY "agent_post_shares_owner_insert"
  ON agent_post_shares FOR INSERT WITH CHECK (user_id = auth.uid());
