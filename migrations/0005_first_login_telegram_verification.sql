ALTER TABLE telegram_links ADD COLUMN phone_verified_at TEXT;
ALTER TABLE telegram_links ADD COLUMN verification_code_hash TEXT;
ALTER TABLE telegram_links ADD COLUMN verification_code_sent_at TEXT;

ALTER TABLE telegram_link_requests ADD COLUMN purpose TEXT DEFAULT 'account';

CREATE INDEX IF NOT EXISTS idx_telegram_links_verified ON telegram_links (user_id, phone_verified_at);
