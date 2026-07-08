/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../_shared/access";
import { json, missingDatabase } from "../_shared/http";

type Env = {
  DB: D1Database;
};

type HealthRow = {
  ok: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  try {
    const row = await env.DB.prepare("SELECT 1 AS ok").first<HealthRow>();

    if (row?.ok !== 1) {
      return json(
        {
          binding: "DB",
          message: "Controllo database non riuscito.",
          ok: false,
        },
        { status: 500 },
      );
    }

    return json({
      binding: "DB",
      ok: true,
    });
  } catch {
    return json(
      {
        ok: false,
        binding: "DB",
        message: "Controllo database non riuscito.",
      },
      { status: 500 },
    );
  }
};
