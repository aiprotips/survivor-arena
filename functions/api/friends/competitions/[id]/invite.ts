/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../../../_shared/access";
import { getFriendsError, inviteFriend } from "../../../../_shared/friends";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../../_shared/http";

type Env = {
  DB: D1Database;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(context.request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  try {
    const competition = await inviteFriend(context.env.DB, {
      competitionId: getParam(context.params.id),
      identifier: String(body.identifier ?? ""),
      organizerId: auth.user.id,
    });

    return json({ competition, ok: true }, { status: 201 });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
