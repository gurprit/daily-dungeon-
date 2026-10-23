-- Server-side limit on total AI calls across all Cloudflare locations.
-- Each request reserves its slot before inference, even if the LLM fails.
CREATE TABLE IF NOT EXISTS ai_daily_budget (
  day TEXT PRIMARY KEY,
  calls INTEGER NOT NULL DEFAULT 0 CHECK (calls >= 0)
);
