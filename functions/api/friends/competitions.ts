/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../_shared/access";
import {
  createFriendsCompetition,
  getFriendsError,
  listFriendsCompetitions,
  parseFriendsCompetitionInput,
} from "../../_shared/friends";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../_shared/http";

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

  try {
    return json({
      competitions: await listFriendsCompetitions(env.DB, auth.user.id),
      ok: true,
    });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  try {
    const competition = await createFriendsCompetition(env.DB, parseFriendsCompetitionInput(body), auth.user.id);

    return json({ competition, ok: true }, { status: 201 });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
