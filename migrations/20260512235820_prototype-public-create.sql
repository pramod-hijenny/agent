CREATE POLICY "prototype_persona_versions_insert"
ON persona_versions FOR INSERT
WITH CHECK (true);

CREATE POLICY "prototype_agent_cards_insert"
ON agent_cards FOR INSERT
WITH CHECK (visibility = 'public');

CREATE POLICY "prototype_feed_events_insert"
ON feed_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "prototype_media_assets_insert"
ON media_assets FOR INSERT
WITH CHECK (true);
