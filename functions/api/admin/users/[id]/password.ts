/// <reference types="@cloudflare/workers-types" />

import { validateConfirmPassword, validatePassword } from "../../../../../src/lib/auth-validation";
import { requireAdmin } from "../../../../_shared/access";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../../_shared/http";
import {
  deleteUserSessions,
  findUserById,
  updateUserPassword,
} from "../../../../_shared/users";

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

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const userId = getId(params);
  const target = userId ? await findUserById(env.DB, userId) : null;
  if (!target) {
    return json({ message: "Utente non trovato.", ok: false }, { status: 404 });
  }

  const body = await readJsonObject(request);
  const password = String(body?.password ?? "");
  const confirmPassword = String(body?.confirmPassword ?? body?.password ?? "");
  const passwordError = validatePassword(password);
  if (passwordError) {
    return json({ field: "password", message: passwordError, ok: false }, { status: 400 });
  }

  const confirmError = validateConfirmPassword(password, confirmPassword);
  if (confirmError) {
    return json({ field: "confirmPassword", message: confirmError, ok: false }, { status: 400 });
  }

  await updateUserPassword(env.DB, {
    password,
    userId: target.id,
  });
  await deleteUserSessions(env.DB, target.id);

  return json({
    message: "Password utente aggiornata.",
    ok: true,
  });
};

export const onRequestGet = methodNotAllowed;
export const onRequestPost = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
