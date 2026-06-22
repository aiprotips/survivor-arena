/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../_shared/access";
import { getWalletBalance, listUserMovements } from "../../_shared/arena";
import { json, methodNotAllowed, missingDatabase } from "../../_shared/http";

type Env = {
  DB: D1Database;
};

type ArenaSummaryRow = {
  alive_lives: number | null;
  deadline_at: string | null;
  eliminated_lives: number | null;
  entry_cost: number;
  pending_choices: number | null;
  prize_pool: number;
  registration_id: string;
  registration_status: string;
  round_number: number;
  round_status: string | null;
  total_lives: number | null;
  tournament_id: string;
  tournament_name: string;
  tournament_status: string;
};

function isMissingSchema(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return message.includes("no such table") || message.includes("no such column");
}

async function listUserArenaSummaries(db: D1Database, userId: string) {
  try {
    const rows = await db
      .prepare(
        `SELECT
          r.id AS registration_id,
          r.status AS registration_status,
          t.id AS tournament_id,
          t.name AS tournament_name,
          t.status AS tournament_status,
          t.current_round_number AS round_number,
          t.entry_cost,
          t.prize_pool,
          rd.deadline_at,
          rd.status AS round_status,
          COUNT(l.id) AS total_lives,
          COALESCE(SUM(CASE WHEN l.status = 'ALIVE' THEN 1 ELSE 0 END), 0) AS alive_lives,
          COALESCE(SUM(CASE WHEN l.status = 'ELIMINATED' THEN 1 ELSE 0 END), 0) AS eliminated_lives,
          COALESCE(SUM(CASE WHEN l.status = 'ALIVE' AND rd.status = 'OPEN' AND s.id IS NULL THEN 1 ELSE 0 END), 0) AS pending_choices
         FROM tournament_registrations r
         INNER JOIN tournaments t ON t.id = r.tournament_id
         LEFT JOIN tournament_rounds rd ON rd.tournament_id = t.id AND rd.round_number = t.current_round_number
         LEFT JOIN tournament_lives l ON l.registration_id = r.id
         LEFT JOIN life_selections s ON s.life_id = l.id AND s.round_id = rd.id
         WHERE r.user_id = ?1
           AND r.status != 'LEFT'
           AND t.status IN ('ACTIVE', 'LOCKED', 'COMPLETED')
         GROUP BY r.id, t.id, rd.id
         ORDER BY
          CASE WHEN t.status IN ('ACTIVE', 'LOCKED') THEN 0 ELSE 1 END,
          COALESCE(rd.deadline_at, t.updated_at) ASC
         LIMIT 12`,
      )
      .bind(userId)
      .all<ArenaSummaryRow>();

    return (rows.results ?? []).map((row) => {
      const totalLives = row.total_lives ?? 0;
      const aliveLives = row.alive_lives ?? 0;

      return {
        alive_lives: aliveLives,
        deadline_at: row.deadline_at,
        eliminated_lives: row.eliminated_lives ?? 0,
        entry_cost: row.entry_cost,
        pending_choices: row.pending_choices ?? 0,
        prize_pool: row.prize_pool,
        progress_percent: totalLives > 0 ? Math.round((aliveLives / totalLives) * 100) : 0,
        registration_id: row.registration_id,
        registration_status: row.registration_status,
        round_label: `Round ${row.round_number}`,
        round_status: row.round_status,
        total_lives: totalLives,
        tournament_id: row.tournament_id,
        tournament_name: row.tournament_name,
        tournament_status: row.tournament_status,
      };
    });
  } catch (error) {
    if (isMissingSchema(error)) {
      return [];
    }

    throw error;
  }
}

async function getUserRank(db: D1Database, userId: string, balance: number) {
  try {
    const row = await db
      .prepare(
        `SELECT COUNT(*) + 1 AS rank
         FROM users u
         LEFT JOIN user_wallets w ON w.user_id = u.id
         WHERE u.role = 'user'
           AND COALESCE(w.balance, 0) > ?1`,
      )
      .bind(balance)
      .first<{ rank: number }>();

    return row?.rank ?? null;
  } catch (error) {
    if (isMissingSchema(error)) {
      return null;
    }

    throw error;
  }
}

async function getWonArenaCount(db: D1Database, userId: string) {
  try {
    const row = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM tournament_registrations
         WHERE user_id = ?1 AND status = 'WINNER'`,
      )
      .bind(userId)
      .first<{ count: number }>();

    return row?.count ?? 0;
  } catch (error) {
    if (isMissingSchema(error)) {
      return 0;
    }

    throw error;
  }
}

async function getChoiceStats(db: D1Database, userId: string) {
  try {
    const row = await db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN s.status = 'SURVIVED' THEN 1 ELSE 0 END), 0) AS survived,
           COALESCE(SUM(CASE WHEN s.status IN ('SURVIVED', 'ELIMINATED') THEN 1 ELSE 0 END), 0) AS total
         FROM life_selections s
         INNER JOIN tournament_lives l ON l.id = s.life_id
         WHERE l.user_id = ?1`,
      )
      .bind(userId)
      .first<{ survived: number; total: number }>();

    return {
      correctRate: row?.total ? Math.round((row.survived / row.total) * 100) : null,
      total: row?.total ?? 0,
    };
  } catch (error) {
    if (isMissingSchema(error)) {
      return {
        correctRate: null,
        total: 0,
      };
    }

    throw error;
  }
}

async function getWeeklyCupDelta(db: D1Database, userId: string) {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();
    const row = await db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS delta
         FROM wallet_movements
         WHERE user_id = ?1 AND created_at >= ?2`,
      )
      .bind(userId, since)
      .first<{ delta: number }>();

    return row?.delta ?? 0;
  } catch (error) {
    if (isMissingSchema(error)) {
      return 0;
    }

    throw error;
  }
}

function formatDeadlineCountdown(value: string | null) {
  if (!value) {
    return null;
  }

  const diff = Date.parse(value) - Date.now();
  if (Number.isNaN(diff)) {
    return null;
  }

  if (diff <= 0) {
    return "Deadline scaduta";
  }

  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return `${days} giorni ${String(remainingHours).padStart(2, "0")} ore`;
  }

  return `${Math.max(1, hours)} ore`;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const [balance, arenas, wonArenas, choiceStats, weeklyDelta, movements] = await Promise.all([
    getWalletBalance(env.DB, auth.user.id),
    listUserArenaSummaries(env.DB, auth.user.id),
    getWonArenaCount(env.DB, auth.user.id),
    getChoiceStats(env.DB, auth.user.id),
    getWeeklyCupDelta(env.DB, auth.user.id),
    listUserMovements(env.DB, auth.user.id),
  ]);
  const rank = await getUserRank(env.DB, auth.user.id, balance);

  const actions = arenas.flatMap((arena) => {
    const result: Array<{
      label: string;
      meta: string;
      tone: "gold" | "neutral";
      type: "choice" | "deadline" | "result";
    }> = [];
    const countdown = formatDeadlineCountdown(arena.deadline_at);

    if (arena.pending_choices > 0) {
      result.push({
        label: arena.pending_choices === 1 ? "Devi effettuare una scelta" : "Devi effettuare più scelte",
        meta: arena.tournament_name,
        tone: "gold",
        type: "choice",
      });
    }

    if (countdown && arena.tournament_status !== "COMPLETED") {
      result.push({
        label: countdown === "Deadline scaduta" ? "Scelte chiuse" : "Arena in scadenza",
        meta: `${arena.tournament_name} · ${countdown}`,
        tone: "neutral",
        type: "deadline",
      });
    }

    if (arena.registration_status === "WINNER") {
      result.push({
        label: "Vittoria registrata",
        meta: arena.tournament_name,
        tone: "gold",
        type: "result",
      });
    }

    return result;
  }).slice(0, 5);

  return json({
    dashboard: {
      actions,
      arenas,
      movements: movements.slice(0, 5),
      position: {
        correct_rate: choiceStats.correctRate,
        rank,
        weekly_delta: weeklyDelta,
      },
      stats: {
        active_arenas: arenas.filter((arena) =>
          arena.registration_status === "ACTIVE" && arena.tournament_status !== "COMPLETED"
        ).length,
        available_cups: balance,
        won_arenas: wonArenas,
      },
    },
    ok: true,
  });
};

export const onRequestPost = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;

