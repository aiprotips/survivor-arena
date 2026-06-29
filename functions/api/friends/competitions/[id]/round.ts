/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../../../_shared/access";
import { getFriendsError, lockFriendsRound, openFriendsRound, updateFriendsRound } from "../../../../_shared/friends";
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
  const action = String(body?.action ?? "");

  try {
    const competition = action === "lock"
      ? await lockFriendsRound(context.env.DB, getParam(context.params.id), auth.user.id)
      : await openFriendsRound(context.env.DB, getParam(context.params.id), auth.user.id);

    return json({ competition, ok: true });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
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
    const competition = await updateFriendsRound(context.env.DB, {
      competitionId: getParam(context.params.id),
      deadlineAt: typeof body.deadlineAt === "string" ? body.deadlineAt : null,
      organizerId: auth.user.id,
      roundId: String(body.roundId ?? body.round_id ?? ""),
    });

    return json({ competition, ok: true });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
