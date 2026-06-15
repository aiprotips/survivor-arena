/// <reference types="@cloudflare/workers-types" />

import { validateConfirmPassword, validatePassword } from "../../../src/lib/auth-validation";
import { requireUser } from "../../_shared/access";
import { verifyPassword } from "../../_shared/crypto";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../_shared/http";
import { findUserById, updateUserPassword } from "../../_shared/users";

type Env = {
  DB: D1Database;
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

  const currentPassword = String(body.currentPassword ?? "");
  const password = String(body.password ?? "");
  const confirmPassword = String(body.confirmPassword ?? "");

  if (!currentPassword) {
    return json({ field: "currentPassword", message: "Password attuale obbligatoria.", ok: false }, { status: 400 });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return json({ field: "password", message: passwordError, ok: false }, { status: 400 });
  }

  const confirmError = validateConfirmPassword(password, confirmPassword);
  if (confirmError) {
    return json({ field: "confirmPassword", message: confirmError, ok: false }, { status: 400 });
  }

  const user = await findUserById(env.DB, auth.user.id);

  if (!user) {
    return json({ message: "Utente non trovato.", ok: false }, { status: 404 });
  }

  const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);

  if (!isCurrentPasswordValid) {
    return json({ field: "currentPassword", message: "Password attuale errata.", ok: false }, { status: 401 });
  }

  await updateUserPassword(env.DB, {
    password,
    userId: user.id,
  });

  return json({
    ok: true,
    message: "Password aggiornata correttamente.",
  });
};

export const onRequestGet = methodNotAllowed;
export const onRequestPost = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
