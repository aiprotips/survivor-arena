/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../../_shared/access";
import { getArenaError, updateRoundSettings } from "../../../../_shared/arena";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../../_shared/http";

type Env = {
  DB: D1Database;
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(context.request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  try {
    const tournament = await updateRoundSettings(context.env.DB, {
      adminId: auth.user.id,
      deadlineAt: typeof body.deadlineAt === "string" && body.deadlineAt ? body.deadlineAt : null,
      roundId: String(body.roundId ?? ""),
    });

    return json({ ok: true, tournament });
  } catch (error) {
    const arenaError = getArenaError(error);

    return json({ message: arenaError.message, ok: false }, { status: arenaError.status });
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestPost = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
