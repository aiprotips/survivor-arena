/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../_shared/access";
import {
  getFriendsError,
  listUnviewedFriendsUserUpdates,
  markFriendsUserUpdatesViewed,
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
      ok: true,
      updates: await listUnviewedFriendsUserUpdates(env.DB, auth.user.id),
    });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ env, request }) => {
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
    const rawIds = Array.isArray(body.ids) ? body.ids : [];
    await markFriendsUserUpdatesViewed(env.DB, {
      competitionId: typeof body.competitionId === "string" ? body.competitionId : null,
      ids: rawIds.filter((id): id is string => typeof id === "string"),
      userId: auth.user.id,
    });

    return json({ ok: true });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestPost = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
