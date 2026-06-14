/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../_shared/access";
import { listUserMovements } from "../../_shared/arena";
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
    movements: await listUserMovements(env.DB, auth.user.id),
    ok: true,
  });
};

export const onRequestPost = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
