CREATE TABLE IF NOT EXISTS launch_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  primary_goal TEXT NOT NULL DEFAULT '',
  referral_source TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'invited', 'approved', 'archived')),
  source TEXT NOT NULL DEFAULT 'landing',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT launch_waitlist_email_not_blank CHECK (length(trim(email)) > 3),
  CONSTRAINT launch_waitlist_email_lowercase CHECK (email = lower(email))
);

CREATE UNIQUE INDEX IF NOT EXISTS launch_waitlist_email_unique
ON launch_waitlist (lower(email));

CREATE INDEX IF NOT EXISTS launch_waitlist_created_at_idx
ON launch_waitlist (created_at DESC);

ALTER TABLE launch_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "launch_waitlist_public_insert" ON launch_waitlist;

CREATE POLICY "launch_waitlist_public_insert"
ON launch_waitlist FOR INSERT
WITH CHECK (
  status = 'new'
  AND source = 'landing'
  AND email = lower(email)
  AND email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
);
