/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../../_shared/access";
import {
  deleteTournament,
  getArenaError,
  getTournamentBundle,
  parseTournamentInput,
  updateTournament,
} from "../../../../_shared/arena";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../../_shared/http";

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

  try {
    const tournament = await getTournamentBundle(
      context.env.DB,
      getParam(context.params.id),
    );

    return json({ ok: true, tournament });
  } catch (error) {
    const arenaError = getArenaError(error);

    return json({ message: arenaError.message, ok: false }, { status: arenaError.status });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(context.request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  try {
    const tournament = await updateTournament(
      context.env.DB,
      getParam(context.params.id),
      parseTournamentInput(body),
      auth.user.id,
    );

    return json({ ok: true, tournament });
  } catch (error) {
    const arenaError = getArenaError(error);

    return json({ message: arenaError.message, ok: false }, { status: arenaError.status });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  try {
    await deleteTournament(context.env.DB, getParam(context.params.id), auth.user.id);

    return json({ ok: true });
  } catch (error) {
    const arenaError = getArenaError(error);

    return json({ message: arenaError.message, ok: false }, { status: arenaError.status });
  }
};

export const onRequestPost = methodNotAllowed;
