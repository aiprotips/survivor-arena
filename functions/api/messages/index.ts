/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../_shared/access";
import { json, methodNotAllowed, missingDatabase } from "../../_shared/http";
import { getUnreadMessageCount, listInboxMessages } from "../../_shared/messages";

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

  return json({
    messages: await listInboxMessages(env.DB, auth.user.id),
    ok: true,
    unread_count: await getUnreadMessageCount(env.DB, auth.user.id),
  });
};

export const onRequestPost = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
