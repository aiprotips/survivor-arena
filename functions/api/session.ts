/// <reference types="@cloudflare/workers-types" />

import { json, methodNotAllowed, missingDatabase } from "../_shared/http";
import { getSessionUser } from "../_shared/session";
import { getWalletBalance } from "../_shared/arena";

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const session = await getSessionUser(env.DB, request);

  if (!session) {
    return json(
      {
        message: "Sessione non valida.",
        ok: false,
      },
      { status: 401 },
    );
  }

  return json({
    ok: true,
    user: {
      ...session.user,
      cup_balance: await getWalletBalance(env.DB, session.user.id),
    },
  });
};

export const onRequestPost = methodNotAllowed;
