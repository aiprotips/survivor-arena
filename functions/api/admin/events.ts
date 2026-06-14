/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../_shared/access";
import { listArenaEvents } from "../../_shared/arena";
import { json, methodNotAllowed, missingDatabase } from "../../_shared/http";

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const url = new URL(request.url);

  return json({
    events: await listArenaEvents(env.DB, {
      eventType: url.searchParams.get("event") ?? undefined,
      query: url.searchParams.get("q") ?? undefined,
      tournamentId: url.searchParams.get("tournamentId") ?? undefined,
    }),
    ok: true,
  });
};

export const onRequestPost = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
