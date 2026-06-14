/// <reference types="@cloudflare/workers-types" />

type Env = {
  DB: D1Database;
};

type HealthRow = {
  ok: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) {
    return Response.json(
      {
        ok: false,
        binding: "DB",
        database: "survivor-arena-db",
        error: "D1 binding DB is not available.",
      },
      { status: 500 },
    );
  }

  try {
    const row = await env.DB.prepare("SELECT 1 AS ok").first<HealthRow>();

    return Response.json({
      ok: row?.ok === 1,
      binding: "DB",
      database: "survivor-arena-db",
      result: row,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        binding: "DB",
        database: "survivor-arena-db",
        error: error instanceof Error ? error.message : "Unknown D1 error.",
      },
      { status: 500 },
    );
  }
};
