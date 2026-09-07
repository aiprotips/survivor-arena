CREATE TABLE IF NOT EXISTS friends_life_round_results (
  id TEXT PRIMARY KEY NOT NULL,
  competition_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  life_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  life_number INTEGER NOT NULL CHECK (life_number >= 1),
  selected_team_id TEXT,
  selected_team TEXT,
  selected_side TEXT CHECK (selected_side IS NULL OR selected_side IN ('HOME', 'AWAY')),
  match_id TEXT,
  match_label TEXT,
  match_result TEXT CHECK (match_result IS NULL OR match_result IN ('PENDING', 'HOME_WIN', 'DRAW', 'AWAY_WIN', 'POSTPONED', 'CANCELLED')),
  outcome TEXT NOT NULL CHECK (outcome IN ('SURVIVED', 'ELIMINATED', 'VOID', 'NO_CHOICE')),
  remaining_lives_after_round INTEGER NOT NULL DEFAULT 0 CHECK (remaining_lives_after_round >= 0),
  created_at TEXT NOT NULL,
  UNIQUE (round_id, life_id),
  FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE CASCADE,
  FOREIGN KEY (round_id) REFERENCES friends_rounds (id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES friends_participants (id) ON DELETE CASCADE,
  FOREIGN KEY (life_id) REFERENCES friends_lives (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES friends_matches (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_friends_life_round_results_competition
  ON friends_life_round_results (competition_id, round_id);

CREATE INDEX IF NOT EXISTS idx_friends_life_round_results_life
  ON friends_life_round_results (life_id, round_id);

CREATE TABLE IF NOT EXISTS friends_user_updates (
  id TEXT PRIMARY KEY NOT NULL,
  competition_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  participant_id TEXT,
  round_id TEXT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detail_json TEXT,
  created_at TEXT NOT NULL,
  viewed_at TEXT,
  FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES friends_participants (id) ON DELETE SET NULL,
  FOREIGN KEY (round_id) REFERENCES friends_rounds (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_friends_user_updates_user_viewed
  ON friends_user_updates (user_id, viewed_at, created_at);

CREATE INDEX IF NOT EXISTS idx_friends_user_updates_competition_user
  ON friends_user_updates (competition_id, user_id, created_at);
