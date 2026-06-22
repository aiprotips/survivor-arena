/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../_shared/access";
import { json, methodNotAllowed, missingDatabase } from "../../_shared/http";

type Env = {
  DB: D1Database;
};

type LeaderboardRow = {
  balance?: number;
  points?: number;
  user_code: string;
  username: string;
};

function isMissingSchema(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return message.includes("no such table") || message.includes("no such column");
}

async function getGlobalLeaderboard(db: D1Database) {
  try {
    const rows = await db
      .prepare(
        `SELECT u.username, u.user_code, COALESCE(w.balance, 0) AS balance
         FROM users u
         LEFT JOIN user_wallets w ON w.user_id = u.id
         WHERE u.role = 'user'
         ORDER BY COALESCE(w.balance, 0) DESC, u.username ASC
         LIMIT 20`,
      )
      .all<LeaderboardRow>();

    return (rows.results ?? []).map((row, index) => ({
      position: index + 1,
      score: row.balance ?? 0,
      user_code: row.user_code,
      username: row.username,
    }));
  } catch (error) {
    if (isMissingSchema(error)) {
      return [];
    }

    throw error;
  }
}

async function getMovementLeaderboard(db: D1Database, days: number) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
    const rows = await db
      .prepare(
        `SELECT u.username, u.user_code, COALESCE(SUM(wm.amount), 0) AS points
         FROM users u
         INNER JOIN wallet_movements wm ON wm.user_id = u.id
         WHERE u.role = 'user' AND wm.created_at >= ?1
         GROUP BY u.id, u.username, u.user_code
         HAVING points != 0
         ORDER BY points DESC, u.username ASC
         LIMIT 20`,
      )
      .bind(since)
      .all<LeaderboardRow>();

    return (rows.results ?? []).map((row, index) => ({
      position: index + 1,
      score: row.points ?? 0,
      user_code: row.user_code,
      username: row.username,
    }));
  } catch (error) {
    if (isMissingSchema(error)) {
      return [];
    }

    throw error;
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const [global, weekly, monthly] = await Promise.all([
    getGlobalLeaderboard(env.DB),
    getMovementLeaderboard(env.DB, 7),
    getMovementLeaderboard(env.DB, 30),
  ]);

  return json({
    leaderboards: {
      global,
      monthly,
      weekly,
    },
    ok: true,
  });
};

export const onRequestPost = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;

