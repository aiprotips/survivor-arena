/// <reference types="@cloudflare/workers-types" />

import { sha256Hex } from "./crypto";
import { json } from "./http";

type RateLimitOptions = {
  identifier?: string;
  limit: number;
  scope: string;
  windowSeconds: number;
};

type RateLimitRow = {
  count: number;
  reset_at: string;
};

let rateLimitSchemaReady: Promise<void> | null = null;

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim();

  return request.headers.get("CF-Connecting-IP") ?? forwardedFor ?? "unknown";
}

async function ensureRateLimitSchema(db: D1Database) {
  rateLimitSchemaReady ??= db
    .prepare(
      `CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        reset_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    )
    .run()
    .then(async () => {
      await db
        .prepare("CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits (reset_at)")
        .run();
    })
    .catch((error) => {
      rateLimitSchemaReady = null;
      throw error;
    });

  await rateLimitSchemaReady;
}

export async function enforceRateLimit(
  db: D1Database,
  request: Request,
  options: RateLimitOptions,
) {
  await ensureRateLimitSchema(db);

  const now = new Date();
  const nowIso = now.toISOString();
  const resetAt = new Date(now.getTime() + options.windowSeconds * 1000).toISOString();
  const identity = options.identifier?.trim().toLowerCase() || getClientIp(request);
  const key = `${options.scope}:${await sha256Hex(identity)}`;

  await db
    .prepare("DELETE FROM rate_limits WHERE reset_at <= ?1")
    .bind(nowIso)
    .run();

  const row = await db
    .prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?1 LIMIT 1")
    .bind(key)
    .first<RateLimitRow>();

  if (!row) {
    await db
      .prepare(
        "INSERT INTO rate_limits (key, count, reset_at, updated_at) VALUES (?1, 1, ?2, ?3)",
      )
      .bind(key, resetAt, nowIso)
      .run();

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (new Date(row.reset_at).getTime() <= now.getTime()) {
    await db
      .prepare("UPDATE rate_limits SET count = 1, reset_at = ?1, updated_at = ?2 WHERE key = ?3")
      .bind(resetAt, nowIso, key)
      .run();

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (row.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((new Date(row.reset_at).getTime() - now.getTime()) / 1000),
      ),
    };
  }

  await db
    .prepare("UPDATE rate_limits SET count = count + 1, updated_at = ?1 WHERE key = ?2")
    .bind(nowIso, key)
    .run();

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return json(
    {
      message: "Troppi tentativi. Riprova tra poco.",
      ok: false,
    },
    {
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
      status: 429,
    },
  );
}
