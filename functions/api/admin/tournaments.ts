/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../_shared/access";
import {
  createTournament,
  getArenaError,
  listAdminTournaments,
  parseTournamentInput,
} from "../../_shared/arena";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../_shared/http";

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

  return json({
    ok: true,
    tournaments: await listAdminTournaments(env.DB),
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  try {
    const tournament = await createTournament(
      env.DB,
      parseTournamentInput(body),
      auth.user.id,
    );

    return json({ ok: true, tournament }, { status: 201 });
  } catch (error) {
    const arenaError = getArenaError(error);

    return json(
      {
        message: arenaError.message,
        ok: false,
      },
      { status: arenaError.status },
    );
  }
};

export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
