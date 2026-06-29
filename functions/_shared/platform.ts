/// <reference types="@cloudflare/workers-types" />

export type PlatformMode = "COPPE" | "FRIENDS";

function nowIso() {
  return new Date().toISOString();
}

let platformSchemaReady = false;

export async function ensurePlatformSchema(db: D1Database) {
  if (platformSchemaReady) {
    return;
  }

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    )
    .run();

  await db
    .prepare("INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('platform_mode', 'COPPE', ?1)")
    .bind(nowIso())
    .run();

  platformSchemaReady = true;
}

export async function getPlatformMode(db: D1Database): Promise<PlatformMode> {
  await ensurePlatformSchema(db);

  const row = await db
    .prepare("SELECT value FROM app_settings WHERE key = 'platform_mode' LIMIT 1")
    .first<{ value: string }>();

  return row?.value === "FRIENDS" ? "FRIENDS" : "COPPE";
}

export async function setPlatformMode(db: D1Database, mode: PlatformMode) {
  await ensurePlatformSchema(db);

  await db
    .prepare(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ('platform_mode', ?1, ?2)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(mode, nowIso())
    .run();

  return mode;
}

export function parsePlatformMode(value: unknown): PlatformMode | null {
  return value === "COPPE" || value === "FRIENDS" ? value : null;
}
