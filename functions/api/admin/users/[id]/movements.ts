/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../../_shared/access";
import { getWalletBalance, listUserMovements } from "../../../../_shared/arena";
import { json, methodNotAllowed, missingDatabase } from "../../../../_shared/http";
import { findUserById, toPublicUser } from "../../../../_shared/users";

type Env = {
  DB: D1Database;
};

function getId(params: { id?: string | string[] }) {
  const value = params.id;

  return Array.isArray(value) ? value[0] : value;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, params, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const userId = getId(params);
  const target = userId ? await findUserById(env.DB, userId) : null;
  if (!target) {
    return json({ message: "Utente non trovato.", ok: false }, { status: 404 });
  }

  return json({
    balance: await getWalletBalance(env.DB, target.id),
    movements: await listUserMovements(env.DB, target.id),
    ok: true,
    user: toPublicUser(target),
  });
};

export const onRequestPost = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
