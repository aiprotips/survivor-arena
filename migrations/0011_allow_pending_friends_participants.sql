PRAGMA foreign_keys=off;

DROP TABLE IF EXISTS friends_participants_pending_migration;

CREATE TABLE friends_participants_pending_migration (
  id TEXT PRIMARY KEY NOT NULL,
  competition_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'REMOVED', 'ELIMINATED', 'WINNER')),
  joined_at TEXT NOT NULL,
  removed_at TEXT,
  UNIQUE (competition_id, user_id),
  FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

INSERT INTO friends_participants_pending_migration (
  id,
  competition_id,
  user_id,
  status,
  joined_at,
  removed_at
)
SELECT
  id,
  competition_id,
  user_id,
  status,
  joined_at,
  removed_at
FROM friends_participants;

DROP TABLE friends_participants;

ALTER TABLE friends_participants_pending_migration RENAME TO friends_participants;

CREATE INDEX IF NOT EXISTS idx_friends_participants_competition
  ON friends_participants (competition_id, status);

CREATE INDEX IF NOT EXISTS idx_friends_participants_user
  ON friends_participants (user_id, status);

PRAGMA foreign_keys=on;
