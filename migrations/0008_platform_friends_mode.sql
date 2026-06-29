CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO app_settings (key, value, updated_at)
VALUES ('platform_mode', 'COPPE', CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS friends_competitions (
  id TEXT PRIMARY KEY NOT NULL,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'LOCKED', 'COMPLETED', 'CANCELLED')),
  current_round_number INTEGER NOT NULL DEFAULT 1 CHECK (current_round_number >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_friends_competitions_owner ON friends_competitions (owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_competitions_invite_code ON friends_competitions (invite_code);

CREATE TABLE IF NOT EXISTS friends_rounds (
  id TEXT PRIMARY KEY NOT NULL,
  competition_id TEXT NOT NULL,
  round_number INTEGER NOT NULL CHECK (round_number >= 1),
  deadline_at TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'OPEN', 'LOCKED', 'CALCULATED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  calculated_at TEXT,
  UNIQUE (competition_id, round_number),
  FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_friends_rounds_competition ON friends_rounds (competition_id, round_number);

CREATE TABLE IF NOT EXISTS friends_matches (
  id TEXT PRIMARY KEY NOT NULL,
  competition_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  result TEXT NOT NULL DEFAULT 'PENDING' CHECK (result IN ('PENDING', 'HOME_WIN', 'DRAW', 'AWAY_WIN', 'POSTPONED', 'CANCELLED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE CASCADE,
  FOREIGN KEY (round_id) REFERENCES friends_rounds (id) ON DELETE CASCADE,
  FOREIGN KEY (home_team_id) REFERENCES teams (id) ON DELETE RESTRICT,
  FOREIGN KEY (away_team_id) REFERENCES teams (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_friends_matches_round ON friends_matches (round_id);

CREATE TABLE IF NOT EXISTS friends_invitations (
  id TEXT PRIMARY KEY NOT NULL,
  competition_id TEXT NOT NULL,
  invited_user_id TEXT,
  invited_username TEXT,
  invited_email TEXT,
  created_at TEXT NOT NULL,
  accepted_at TEXT,
  FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE CASCADE,
  FOREIGN KEY (invited_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_friends_invitations_competition ON friends_invitations (competition_id);
CREATE INDEX IF NOT EXISTS idx_friends_invitations_user ON friends_invitations (invited_user_id);
CREATE INDEX IF NOT EXISTS idx_friends_invitations_lookup ON friends_invitations (invited_username, invited_email);

CREATE TABLE IF NOT EXISTS friends_participants (
  id TEXT PRIMARY KEY NOT NULL,
  competition_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REMOVED', 'ELIMINATED', 'WINNER')),
  joined_at TEXT NOT NULL,
  removed_at TEXT,
  UNIQUE (competition_id, user_id),
  FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_friends_participants_competition ON friends_participants (competition_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_participants_user ON friends_participants (user_id, status);

CREATE TABLE IF NOT EXISTS friends_lives (
  id TEXT PRIMARY KEY NOT NULL,
  participant_id TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  life_number INTEGER NOT NULL CHECK (life_number >= 1),
  status TEXT NOT NULL DEFAULT 'ALIVE' CHECK (status IN ('ALIVE', 'ELIMINATED', 'WINNER')),
  current_cycle INTEGER NOT NULL DEFAULT 1 CHECK (current_cycle >= 1),
  created_at TEXT NOT NULL,
  eliminated_at TEXT,
  UNIQUE (participant_id, life_number),
  FOREIGN KEY (participant_id) REFERENCES friends_participants (id) ON DELETE CASCADE,
  FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_friends_lives_participant ON friends_lives (participant_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_lives_competition ON friends_lives (competition_id, status);

CREATE TABLE IF NOT EXISTS friends_selections (
  id TEXT PRIMARY KEY NOT NULL,
  life_id TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  selected_team_id TEXT NOT NULL,
  selected_team TEXT NOT NULL,
  selected_side TEXT NOT NULL CHECK (selected_side IN ('HOME', 'AWAY')),
  cycle_number INTEGER NOT NULL CHECK (cycle_number >= 1),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SURVIVED', 'ELIMINATED', 'VOID')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (life_id) REFERENCES friends_lives (id) ON DELETE CASCADE,
  FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE CASCADE,
  FOREIGN KEY (round_id) REFERENCES friends_rounds (id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES friends_matches (id) ON DELETE CASCADE,
  FOREIGN KEY (selected_team_id) REFERENCES teams (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_friends_selections_life ON friends_selections (life_id, round_id);
CREATE INDEX IF NOT EXISTS idx_friends_selections_round ON friends_selections (round_id);

CREATE TABLE IF NOT EXISTS friends_events (
  id TEXT PRIMARY KEY NOT NULL,
  competition_id TEXT,
  user_id TEXT,
  participant_id TEXT,
  life_id TEXT,
  round_id TEXT,
  match_id TEXT,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (participant_id) REFERENCES friends_participants (id) ON DELETE SET NULL,
  FOREIGN KEY (life_id) REFERENCES friends_lives (id) ON DELETE SET NULL,
  FOREIGN KEY (round_id) REFERENCES friends_rounds (id) ON DELETE SET NULL,
  FOREIGN KEY (match_id) REFERENCES friends_matches (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_friends_events_competition ON friends_events (competition_id, created_at);
CREATE INDEX IF NOT EXISTS idx_friends_events_user ON friends_events (user_id, created_at);
