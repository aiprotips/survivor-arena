ALTER TABLE teams ADD COLUMN short_name TEXT;
ALTER TABLE teams ADD COLUMN slug TEXT;
ALTER TABLE teams ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE teams ADD COLUMN source TEXT;

CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams (slug);
CREATE INDEX IF NOT EXISTS idx_teams_source ON teams (source);

ALTER TABLE friends_competitions ADD COLUMN fixture_competition_id TEXT;

ALTER TABLE friends_rounds ADD COLUMN fixture_competition_id TEXT;
ALTER TABLE friends_rounds ADD COLUMN fixture_matchday INTEGER;
