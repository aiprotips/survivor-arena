CREATE TABLE IF NOT EXISTS telegram_links (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE,
  telegram_chat_id TEXT NOT NULL UNIQUE,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  linked_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_telegram_links_user ON telegram_links (user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_links_chat ON telegram_links (telegram_chat_id);

CREATE TABLE IF NOT EXISTS telegram_link_requests (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  link_code_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_requests_user ON telegram_link_requests (user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_telegram_link_requests_code ON telegram_link_requests (link_code_hash);

CREATE TABLE IF NOT EXISTS pending_registrations (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  link_code_hash TEXT NOT NULL UNIQUE,
  otp_code_hash TEXT,
  telegram_chat_id TEXT,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  otp_sent_at TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pending_registrations_link_code ON pending_registrations (link_code_hash);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires_at ON pending_registrations (expires_at);

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user ON password_reset_codes (user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_hash ON password_reset_codes (code_hash);
