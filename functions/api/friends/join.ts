/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../_shared/access";
import { getFriendsError, joinFriendsCompetitionByCode } from "../../_shared/friends";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../_shared/http";
import { enforceRateLimit, rateLimitResponse } from "../../_shared/rate-limit";

type Env = {
  DB: D1Database;
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  const inviteCode = String(body.inviteCode ?? body.invite_code ?? "");
  const limit = await enforceRateLimit(env.DB, request, {
    identifier: `${auth.user.id}:${inviteCode}`,
    limit: 20,
    scope: "friends:join",
    windowSeconds: 10 * 60,
  });

  if (!limit.allowed) {
    return rateLimitResponse(limit.retryAfterSeconds);
  }

  try {
    const competition = await joinFriendsCompetitionByCode(env.DB, inviteCode, auth.user.id);

    return json({ competition, ok: true });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
