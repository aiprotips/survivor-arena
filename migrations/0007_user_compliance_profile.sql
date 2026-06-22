ALTER TABLE users ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE users ADD COLUMN terms_version TEXT;
ALTER TABLE users ADD COLUMN privacy_accepted_at TEXT;
ALTER TABLE users ADD COLUMN privacy_version TEXT;
ALTER TABLE users ADD COLUMN cookie_policy_accepted_at TEXT;
ALTER TABLE users ADD COLUMN cookie_policy_version TEXT;
ALTER TABLE users ADD COLUMN pending_phone TEXT;
ALTER TABLE users ADD COLUMN pending_phone_code_hash TEXT;
ALTER TABLE users ADD COLUMN pending_phone_requested_at TEXT;
ALTER TABLE users ADD COLUMN pending_phone_expires_at TEXT;

CREATE INDEX IF NOT EXISTS idx_users_pending_phone ON users (pending_phone);
