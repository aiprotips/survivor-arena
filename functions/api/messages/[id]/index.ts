/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../../_shared/access";
import { json, methodNotAllowed, missingDatabase } from "../../../_shared/http";
import { markInboxMessageRead, markPopupMessageSeen } from "../../../_shared/messages";

type Env = {
  DB: D1Database;
};

function getId(params: { id?: string | string[] }) {
  const value = params.id;

  return Array.isArray(value) ? value[0] : value;
}

export const onRequestPatch: PagesFunction<Env> = async ({ env, params, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const messageId = getId(params);
  if (!messageId) {
    return json({ message: "Messaggio non valido.", ok: false }, { status: 400 });
  }

  await markInboxMessageRead(env.DB, {
    messageId,
    userId: auth.user.id,
  });

  return json({
    ok: true,
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, params, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const messageId = getId(params);
  if (!messageId) {
    return json({ message: "Messaggio non valido.", ok: false }, { status: 400 });
  }

  await markPopupMessageSeen(env.DB, {
    messageId,
    userId: auth.user.id,
  });

  return json({
    ok: true,
  });
};

export const onRequestGet = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
