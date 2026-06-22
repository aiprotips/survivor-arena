/// <reference types="@cloudflare/workers-types" />

import { createRandomToken, sha256Hex } from "./crypto";
import { ensureAdminControlSchema } from "./admin-control-schema";
import type { PublicUser } from "./users";

const sessionCookieName = "sa_session";
const sessionDurationSeconds = 60 * 60 * 24 * 7;

type SessionUserRow = PublicUser & {
  session_id: string;
};

function isHttpsRequest(request: Request) {
  return new URL(request.url).protocol === "https:";
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return "";
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

function buildCookie(
  request: Request,
  value: string,
  options: {
    expires?: Date;
    maxAge: number;
  },
) {
  const parts = [
    `${sessionCookieName}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${options.maxAge}`,
  ];

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (isHttpsRequest(request)) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export async function createSession(db: D1Database, request: Request, userId: string) {
  const token = createRandomToken();
  const tokenHash = await sha256Hex(token);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + sessionDurationSeconds * 1000);

  await db
    .prepare(
      `INSERT INTO user_sessions (id, user_id, token_hash, created_at, expires_at)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
    )
    .bind(
      crypto.randomUUID(),
      userId,
      tokenHash,
      createdAt.toISOString(),
      expiresAt.toISOString(),
    )
    .run();

  return buildCookie(request, token, {
    expires: expiresAt,
    maxAge: sessionDurationSeconds,
  });
}

export function expireSessionCookie(request: Request) {
  return buildCookie(request, "", {
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function getSessionUser(db: D1Database, request: Request) {
  const token = getCookieValue(request, sessionCookieName);

  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const now = new Date().toISOString();

  await ensureAdminControlSchema(db);

  await db
    .prepare("DELETE FROM user_sessions WHERE expires_at <= ?1")
    .bind(now)
    .run();

  const row = await db
    .prepare(
      `SELECT
        s.id AS session_id,
        u.id,
        u.user_code,
        u.username,
        u.email,
        u.phone,
        u.role,
        COALESCE(u.status, 'active') AS status,
        u.blocked_at,
        u.blocked_reason
       FROM user_sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?1 AND s.expires_at > ?2
       LIMIT 1`,
    )
    .bind(tokenHash, now)
    .first<SessionUserRow>();

  if (!row) {
    return null;
  }

  if (row.status === "blocked") {
    await db
      .prepare("DELETE FROM user_sessions WHERE id = ?1")
      .bind(row.session_id)
      .run();

    return null;
  }

  return {
    sessionId: row.session_id,
    user: {
      blocked_at: row.blocked_at,
      blocked_reason: row.blocked_reason,
      email: row.email,
      id: row.id,
      phone: row.phone,
      role: row.role,
      status: row.status,
      user_code: row.user_code,
      username: row.username,
    },
  };
}

export async function deleteCurrentSession(db: D1Database, request: Request) {
  const token = getCookieValue(request, sessionCookieName);

  if (!token) {
    return;
  }

  await db
    .prepare("DELETE FROM user_sessions WHERE token_hash = ?1")
    .bind(await sha256Hex(token))
    .run();
}
