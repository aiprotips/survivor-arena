/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../_shared/access";
import { listPublicTournaments } from "../../_shared/arena";
import { json, methodNotAllowed, missingDatabase } from "../../_shared/http";

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  return json({
    ok: true,
    tournaments: await listPublicTournaments(env.DB, auth.user.id),
  });
};

export const onRequestPost = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
