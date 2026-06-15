CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_teams_name ON teams (normalized_name);

ALTER TABLE tournament_matches ADD COLUMN home_team_id TEXT REFERENCES teams (id) ON DELETE SET NULL;
ALTER TABLE tournament_matches ADD COLUMN away_team_id TEXT REFERENCES teams (id) ON DELETE SET NULL;
ALTER TABLE life_selections ADD COLUMN selected_team_id TEXT REFERENCES teams (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tournament_matches_home_team ON tournament_matches (home_team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_away_team ON tournament_matches (away_team_id);
CREATE INDEX IF NOT EXISTS idx_life_selections_selected_team ON life_selections (selected_team_id);
