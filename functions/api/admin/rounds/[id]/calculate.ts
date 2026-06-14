/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../../_shared/access";
import { calculateRound, getArenaError, type MatchResult } from "../../../../_shared/arena";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../../_shared/http";

type Env = {
  DB: D1Database;
};

const allowedResults = new Set<MatchResult>([
  "HOME_WIN",
  "DRAW",
  "AWAY_WIN",
  "POSTPONED",
  "CANCELLED",
]);

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(context.request);
  if (!body || !Array.isArray(body.results)) {
    return json({ message: "Inserisci gli esiti degli incontri.", ok: false }, { status: 400 });
  }

  try {
    const results = body.results.map((item) => {
      const rawItem = item as Record<string, unknown>;
      const result = String(rawItem.result ?? "") as MatchResult;

      if (!allowedResults.has(result)) {
        throw {
          message: "Esito incontro non valido.",
          status: 400,
        };
      }

      return {
        matchId: String(rawItem.matchId ?? ""),
        result,
      };
    });

    const tournament = await calculateRound(context.env.DB, {
      adminId: auth.user.id,
      results,
      roundId: getParam(context.params.id),
    });

    return json({ ok: true, tournament });
  } catch (error) {
    const arenaError = getArenaError(error);

    return json({ message: arenaError.message, ok: false }, { status: arenaError.status });
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
