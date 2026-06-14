/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../../../_shared/access";
import { buyExtraLife, getArenaError } from "../../../../_shared/arena";
import { json, methodNotAllowed, missingDatabase } from "../../../../_shared/http";

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

  try {
    const tournament = await buyExtraLife(
      context.env.DB,
      getParam(context.params.id),
      auth.user.id,
    );

    return json({ ok: true, tournament });
  } catch (error) {
    const arenaError = getArenaError(error);

    return json({ message: arenaError.message, ok: false }, { status: arenaError.status });
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
