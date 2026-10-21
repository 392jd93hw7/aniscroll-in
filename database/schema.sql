-- Aniscroll cloud library schema for Clerk-authenticated users.
-- The API also creates this table if missing.
CREATE TABLE IF NOT EXISTS aniscroll_user_library (
  clerk_user_id TEXT NOT NULL,
  collection TEXT NOT NULL CHECK (collection IN ('watchlist', 'history')),
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clerk_user_id, collection)
);
CREATE INDEX IF NOT EXISTS aniscroll_user_library_updated_at_idx ON aniscroll_user_library (updated_at DESC);
