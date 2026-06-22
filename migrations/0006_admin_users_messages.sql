ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN blocked_at TEXT;
ALTER TABLE users ADD COLUMN blocked_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

CREATE TABLE IF NOT EXISTS admin_messages (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('inbox', 'popup', 'both')),
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'users')),
  created_by TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON admin_messages (created_at);

CREATE TABLE IF NOT EXISTS user_messages (
  id TEXT PRIMARY KEY NOT NULL,
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  read_at TEXT,
  popup_seen_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (message_id, user_id),
  FOREIGN KEY (message_id) REFERENCES admin_messages (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_messages_user ON user_messages (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_messages_unread ON user_messages (user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_user_messages_popup ON user_messages (user_id, popup_seen_at);
