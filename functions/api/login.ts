/// <reference types="@cloudflare/workers-types" />

import { normalizeEmail, validateLoginValues, type LoginField } from "../../src/lib/auth-validation";
import { getTelegramLinkForUser } from "../_shared/account-flows";
import { verifyPassword } from "../_shared/crypto";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../_shared/http";
import { createSession } from "../_shared/session";
import { findUserByIdentifier, toPublicUser, updateLastLogin } from "../_shared/users";

type Env = {
  DB: D1Database;
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const body = await readJsonObject(request);

  if (!body) {
    return json(
      {
        message: "Richiesta non valida.",
        ok: false,
      },
      { status: 400 },
    );
  }

  const validation = validateLoginValues({
    identifier: String(body.identifier ?? body.login ?? ""),
    password: String(body.password ?? ""),
  });

  if (!validation.isValid) {
    const field = Object.keys(validation.errors)[0] as LoginField;

    return json(
      {
        field,
        message: validation.errors[field] ?? "Dati di accesso non validi.",
        ok: false,
      },
      { status: 400 },
    );
  }

  const identifier = validation.values.identifier.includes("@")
    ? normalizeEmail(validation.values.identifier)
    : validation.values.identifier;
  const user = await findUserByIdentifier(env.DB, identifier);

  if (!user) {
    return json(
      {
        field: "identifier",
        message: "Account non trovato.",
        ok: false,
      },
      { status: 404 },
    );
  }

  if (user.status === "blocked") {
    return json(
      {
        field: "identifier",
        message: "Account bloccato. Contatta l'assistenza.",
        ok: false,
      },
      { status: 403 },
    );
  }

  const isPasswordValid = await verifyPassword(
    validation.values.password,
    user.password_hash,
  );

  if (!isPasswordValid) {
    return json(
      {
        field: "password",
        message: "Password errata.",
        ok: false,
      },
      { status: 401 },
    );
  }

  await updateLastLogin(env.DB, user.id);
  const sessionCookie = await createSession(env.DB, request, user.id);
  const telegramLink = user.role === "admin" ? null : await getTelegramLinkForUser(env.DB, user.id);
  const requiresTelegramVerification =
    user.role !== "admin" && (!telegramLink || !telegramLink.phone_verified_at);

  return json(
    {
      ok: true,
      redirectTo: user.role === "admin"
        ? "/admin"
        : requiresTelegramVerification
          ? "/verifica-telegram"
          : "/dashboard",
      requiresTelegramVerification,
      user: toPublicUser(user),
    },
    {
      headers: {
        "Set-Cookie": sessionCookie,
      },
      status: 200,
    },
  );
};

export const onRequestGet = methodNotAllowed;
