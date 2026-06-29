/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../../../_shared/access";
import { calculateFriendsRound, getFriendsError } from "../../../../_shared/friends";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../../_shared/http";
import type { MatchResult } from "../../../../_shared/arena";

type Env = {
  DB: D1Database;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(context.request);
  if (!body || !Array.isArray(body.results)) {
    return json({ message: "Risultati non validi.", ok: false }, { status: 400 });
  }

  try {
    const results = body.results as Array<Record<string, unknown>>;
    const competition = await calculateFriendsRound(context.env.DB, {
      organizerId: auth.user.id,
      results: results.map((result) => ({
        matchId: String(result?.matchId ?? result?.match_id ?? ""),
        result: String(result?.result ?? "PENDING") as MatchResult,
      })),
      roundId: getParam(context.params.id),
    });

    return json({ competition, ok: true });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
