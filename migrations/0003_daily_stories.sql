-- One durable, globally shared set of three AI-written adventures per UTC date.
-- The day PRIMARY KEY is the cost/concurrency gate: the first claimant owns the
-- only generation attempt; every other visitor reads the same cached result.
-- If unavailable or failed, the existing deterministic authored rotation remains.
CREATE TABLE IF NOT EXISTS daily_story_sets (
  day TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'failed')),
  stories_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS daily_story_sets_status_idx ON daily_story_sets(status);
