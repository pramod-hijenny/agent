CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS persona_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  persona_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT DEFAULT 'initial',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_cards (
  agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'public',
  status TEXT NOT NULL DEFAULT 'active',
  persona_version_id UUID REFERENCES persona_versions(id),
  memory_graph_id TEXT DEFAULT '',
  capabilities JSONB NOT NULL DEFAULT '{
    "can_search_agents": true,
    "can_join_compatibility_chats": true,
    "can_dm": false,
    "can_publish": false,
    "requires_intro_approval": true
  }'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  public_social_traits TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT 'now',
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  members INTEGER NOT NULL DEFAULT 0,
  signal TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_artifacts (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID,
  source_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE CASCADE,
  candidate_agent JSONB NOT NULL,
  compatibility_score NUMERIC NOT NULL DEFAULT 0,
  shared_interests TEXT[] NOT NULL DEFAULT '{}',
  conversation_summary TEXT NOT NULL DEFAULT '',
  risks TEXT[] NOT NULL DEFAULT '{}',
  suggested_intro TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'needs_review',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id UUID NOT NULL,
  requested_by_agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  summary_for_user TEXT NOT NULL,
  data_to_share JSONB NOT NULL DEFAULT '{}'::jsonb,
  destination TEXT DEFAULT '',
  state TEXT NOT NULL DEFAULT 'pending',
  scope TEXT NOT NULL DEFAULT 'one_time',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  agent_id UUID REFERENCES agent_cards(agent_id) ON DELETE SET NULL,
  bucket TEXT NOT NULL DEFAULT 'persona-media',
  object_key TEXT NOT NULL,
  url TEXT NOT NULL,
  content_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE persona_versions ENABLE ROW LEVEL SECURITY;

ALTER TABLE agent_cards ENABLE ROW LEVEL SECURITY;

ALTER TABLE feed_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

ALTER TABLE match_artifacts ENABLE ROW LEVEL SECURITY;

ALTER TABLE consent_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_owner_all" ON profiles FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "persona_versions_owner_all" ON persona_versions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "agent_cards_public_read" ON agent_cards FOR SELECT USING (visibility = 'public' OR owner_user_id = auth.uid());

CREATE POLICY "agent_cards_owner_write" ON agent_cards FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "feed_events_public_read" ON feed_events FOR SELECT USING (true);

CREATE POLICY "communities_public_read" ON communities FOR SELECT USING (true);

CREATE POLICY "match_artifacts_owner_all" ON match_artifacts FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "consent_requests_owner_all" ON consent_requests FOR ALL USING (subject_user_id = auth.uid()) WITH CHECK (subject_user_id = auth.uid());

CREATE POLICY "media_assets_owner_all" ON media_assets FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
