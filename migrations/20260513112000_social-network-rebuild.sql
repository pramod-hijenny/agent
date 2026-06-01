CREATE TABLE IF NOT EXISTS agent_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID,
  author_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public',
  tags TEXT[] NOT NULL DEFAULT '{}',
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES agent_posts(id) ON DELETE CASCADE,
  author_user_id UUID,
  author_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID,
  follower_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE CASCADE,
  followed_agent_id UUID NOT NULL REFERENCES agent_cards(agent_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_user_id, followed_agent_id),
  UNIQUE(follower_agent_id, followed_agent_id)
);

CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_agent_id UUID NOT NULL REFERENCES agent_cards(agent_id) ON DELETE CASCADE,
  target_agent_id UUID NOT NULL REFERENCES agent_cards(agent_id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'superlike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_agent_id, target_agent_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID,
  owner_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE SET NULL,
  counterparty_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('human_agent', 'agent_agent', 'intro')),
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('human', 'agent', 'system')),
  sender_user_id UUID,
  sender_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID,
  source_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'agent_search',
  user_query TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES agent_tasks(id) ON DELETE CASCADE,
  owner_user_id UUID,
  source_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE CASCADE,
  candidate_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed',
  summary TEXT NOT NULL DEFAULT '',
  compatibility_score NUMERIC NOT NULL DEFAULT 0,
  risks TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS negotiation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES agent_negotiations(id) ON DELETE CASCADE,
  turn_index INTEGER NOT NULL,
  speaker_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE SET NULL,
  speaker_handle TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(negotiation_id, turn_index)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_posts ENABLE ROW LEVEL SECURITY;

ALTER TABLE agent_comments ENABLE ROW LEVEL SECURITY;

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

ALTER TABLE agent_negotiations ENABLE ROW LEVEL SECURITY;

ALTER TABLE negotiation_turns ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_posts_public_read" ON agent_posts;

CREATE POLICY "agent_posts_public_read" ON agent_posts FOR SELECT USING (visibility = 'public' OR author_user_id = auth.uid());

DROP POLICY IF EXISTS "agent_posts_owner_write" ON agent_posts;

CREATE POLICY "agent_posts_owner_write" ON agent_posts FOR ALL USING (author_user_id = auth.uid()) WITH CHECK (author_user_id = auth.uid());

DROP POLICY IF EXISTS "agent_comments_public_read" ON agent_comments;

CREATE POLICY "agent_comments_public_read" ON agent_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "agent_comments_owner_write" ON agent_comments;

CREATE POLICY "agent_comments_owner_write" ON agent_comments FOR ALL USING (author_user_id = auth.uid()) WITH CHECK (author_user_id = auth.uid());

DROP POLICY IF EXISTS "follows_owner_all" ON follows;

CREATE POLICY "follows_owner_all" ON follows FOR ALL USING (follower_user_id = auth.uid()) WITH CHECK (follower_user_id = auth.uid());

DROP POLICY IF EXISTS "swipes_owner_all" ON swipes;

CREATE POLICY "swipes_owner_all" ON swipes FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "conversations_owner_all" ON conversations;

CREATE POLICY "conversations_owner_all" ON conversations FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "messages_owner_read" ON messages;

CREATE POLICY "messages_owner_read" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.owner_user_id = auth.uid())
);

DROP POLICY IF EXISTS "messages_owner_write" ON messages;

CREATE POLICY "messages_owner_write" ON messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.owner_user_id = auth.uid())
);

DROP POLICY IF EXISTS "agent_tasks_owner_all" ON agent_tasks;

CREATE POLICY "agent_tasks_owner_all" ON agent_tasks FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "agent_negotiations_owner_all" ON agent_negotiations;

CREATE POLICY "agent_negotiations_owner_all" ON agent_negotiations FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "negotiation_turns_owner_read" ON negotiation_turns;

CREATE POLICY "negotiation_turns_owner_read" ON negotiation_turns FOR SELECT USING (
  EXISTS (SELECT 1 FROM agent_negotiations n WHERE n.id = negotiation_id AND n.owner_user_id = auth.uid())
);

DROP POLICY IF EXISTS "notifications_owner_all" ON notifications;

CREATE POLICY "notifications_owner_all" ON notifications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
