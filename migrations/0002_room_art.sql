-- Separate global image-inference budget; protects the small playtest allowance.
CREATE TABLE IF NOT EXISTS art_daily_budget (
  day TEXT PRIMARY KEY,
  calls INTEGER NOT NULL DEFAULT 0 CHECK (calls >= 0)
);

-- Unique signed ticket ID prevents duplicate calls from reloads and repeated clicks.
CREATE TABLE IF NOT EXISTS art_jobs (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  room_index INTEGER NOT NULL CHECK (room_index BETWEEN 0 AND 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  object_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS art_jobs_day_idx ON art_jobs(day);
