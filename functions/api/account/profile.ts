/// <reference types="@cloudflare/workers-types" />

import {
  normalizeEmail,
  normalizePhone,
  normalizeUsername,
  validateEmail,
  validatePhone,
  validateUsername,
} from "../../../src/lib/auth-validation";
import { requireUser } from "../../_shared/access";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../_shared/http";
import { toPublicUser, updateUserProfile } from "../../_shared/users";

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

  const values = {
    email: normalizeEmail(body.email),
    phone: normalizePhone(body.phone),
    username: normalizeUsername(body.username),
  };
  const usernameError = validateUsername(values.username);
  const emailError = validateEmail(values.email);
  const phoneError = validatePhone(values.phone);

  if (usernameError) {
    return json({ field: "username", message: usernameError, ok: false }, { status: 400 });
  }

  if (emailError) {
    return json({ field: "email", message: emailError, ok: false }, { status: 400 });
  }

  if (phoneError) {
    return json({ field: "phone", message: phoneError, ok: false }, { status: 400 });
  }

  const duplicate = await env.DB
    .prepare(
      `SELECT username, email, phone
       FROM users
       WHERE id != ?1 AND (username = ?2 OR email = ?3 OR phone = ?4)
       LIMIT 1`,
    )
    .bind(auth.user.id, values.username, values.email, values.phone)
    .first<{ email: string; phone: string; username: string }>();

  if (duplicate) {
    const field =
      duplicate.username.toLowerCase() === values.username.toLowerCase()
        ? "username"
        : duplicate.email.toLowerCase() === values.email.toLowerCase()
          ? "email"
          : "phone";

    return json(
      {
        field,
        message:
          field === "username"
            ? "Username già esistente."
            : field === "email"
              ? "Email già registrata."
              : "Numero di telefono già registrato.",
        ok: false,
      },
      { status: 409 },
    );
  }

  if (values.phone !== auth.user.phone) {
    return json(
      {
        field: "phone",
        message: "Per cambiare numero devi completare la verifica Telegram.",
        ok: false,
        requiresPhoneVerification: true,
      },
      { status: 409 },
    );
  }

  try {
    const user = await updateUserProfile(env.DB, {
      ...values,
      userId: auth.user.id,
    });

    if (!user) {
      return json({ message: "Utente non trovato.", ok: false }, { status: 404 });
    }

    return json({
      ok: true,
      user: toPublicUser(user),
    });
  } catch {
    return json(
      {
        message: "Profilo non aggiornato. Riprova tra poco.",
        ok: false,
      },
      { status: 500 },
    );
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestPost = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
