/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../../_shared/access";
import { getArenaError, listParticipants } from "../../../../_shared/arena";
import { json, methodNotAllowed, missingDatabase } from "../../../../_shared/http";

type Env = {
  DB: D1Database;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  const url = new URL(context.request.url);

  try {
    const participants = await listParticipants(
      context.env.DB,
      getParam(context.params.id),
      url.searchParams.get("q") ?? "",
    );

    return json({ ok: true, participants });
  } catch (error) {
    const arenaError = getArenaError(error);

    return json({ message: arenaError.message, ok: false }, { status: arenaError.status });
  }
};

export const onRequestPost = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
