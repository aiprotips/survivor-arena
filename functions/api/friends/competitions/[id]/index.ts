/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../../../_shared/access";
import { getFriendsCompetitionBundle, getFriendsError, joinFriendsCompetition } from "../../../../_shared/friends";
import { json, methodNotAllowed, missingDatabase } from "../../../../_shared/http";

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

  const auth = await requireUser(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  try {
    const competition = await getFriendsCompetitionBundle(context.env.DB, getParam(context.params.id), auth.user.id);

    return json({ competition, ok: true });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  try {
    const competition = await joinFriendsCompetition(context.env.DB, getParam(context.params.id), auth.user.id);

    return json({ competition, ok: true });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
