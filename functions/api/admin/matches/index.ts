/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../_shared/access";
import { addMatch, getArenaError } from "../../../_shared/arena";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../_shared/http";

type Env = {
  DB: D1Database;
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  try {
    const tournament = await addMatch(env.DB, {
      adminId: auth.user.id,
      awayTeam: String(body.awayTeam ?? ""),
      homeTeam: String(body.homeTeam ?? ""),
      isLocked: body.isLocked === true,
      isSelectable: body.isSelectable !== false,
      roundId: String(body.roundId ?? ""),
    });

    return json({ ok: true, tournament }, { status: 201 });
  } catch (error) {
    const arenaError = getArenaError(error);

    return json({ message: arenaError.message, ok: false }, { status: arenaError.status });
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
