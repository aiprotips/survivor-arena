/// <reference types="@cloudflare/workers-types" />

import { json, methodNotAllowed, missingDatabase } from "../_shared/http";
import { deleteCurrentSession, expireSessionCookie } from "../_shared/session";

type Env = {
  DB: D1Database;
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  await deleteCurrentSession(env.DB, request);

  return json(
    {
      ok: true,
    },
    {
      headers: {
        "Set-Cookie": expireSessionCookie(request),
      },
    },
  );
};

export const onRequestGet = methodNotAllowed;
