/// <reference types="@cloudflare/workers-types" />

let adminControlSchemaReady: Promise<void> | null = null;

async function runSchemaStatement(db: D1Database, sql: string) {
  try {
    await db.prepare(sql).run();
  } catch (error) {
    const message = [
      error instanceof Error ? error.message : "",
      typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "",
      typeof error === "object" && error && "cause" in error
        ? String(error.cause)
        : "",
      String(error),
    ].join(" ").toLowerCase();

    if (
      message.includes("duplicate column") ||
      message.includes("already exists")
    ) {
      return;
    }

    throw error;
  }
}

async function applyAdminControlSchema(db: D1Database) {
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN blocked_at TEXT");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN blocked_reason TEXT");
  await runSchemaStatement(db, "CREATE INDEX IF NOT EXISTS idx_users_status ON users (status)");

  await runSchemaStatement(
    db,
    `CREATE TABLE IF NOT EXISTS admin_messages (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('inbox', 'popup', 'both')),
      target_type TEXT NOT NULL CHECK (target_type IN ('all', 'users')),
      created_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
    )`,
  );
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON admin_messages (created_at)",
  );

  await runSchemaStatement(
    db,
    `CREATE TABLE IF NOT EXISTS user_messages (
      id TEXT PRIMARY KEY NOT NULL,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      read_at TEXT,
      popup_seen_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (message_id, user_id),
      FOREIGN KEY (message_id) REFERENCES admin_messages (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
  );
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_user_messages_user ON user_messages (user_id, created_at)",
  );
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_user_messages_unread ON user_messages (user_id, read_at)",
  );
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_user_messages_popup ON user_messages (user_id, popup_seen_at)",
  );

  try {
    await runSchemaStatement(
      db,
      `CREATE TABLE IF NOT EXISTS d1_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );
    await runSchemaStatement(
      db,
      "INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0006_admin_users_messages.sql')",
    );
  } catch {
    // Cloudflare migration metadata is best-effort during runtime schema recovery.
  }
}

export async function ensureAdminControlSchema(db: D1Database) {
  adminControlSchemaReady ??= applyAdminControlSchema(db).catch((error) => {
    adminControlSchemaReady = null;
    throw error;
  });

  await adminControlSchemaReady;
}
