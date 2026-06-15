/// <reference types="@cloudflare/workers-types" />

import {
  normalizeEmail,
  normalizePhone,
  validateConfirmPassword,
  validatePassword,
} from "../../src/lib/auth-validation";
import { consumePasswordResetCode } from "../_shared/account-flows";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../_shared/http";
import {
  deleteUserSessions,
  findUserByResetIdentifier,
  updateUserPassword,
} from "../_shared/users";

type Env = {
  DB: D1Database;
};

function normalizeResetIdentifier(value: unknown) {
  const identifier = String(value ?? "").trim();

  if (identifier.includes("@")) {
    return normalizeEmail(identifier);
  }

  if (/^[+0-9\s().-]+$/.test(identifier)) {
    return normalizePhone(identifier);
  }

  return identifier;
}

function getFlowError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    "status" in error
  ) {
    return error as {
      message: string;
      status: number;
    };
  }

  return {
    message: "Reset password non riuscito. Riprova tra poco.",
    status: 500,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const body = await readJsonObject(request);
  const identifier = normalizeResetIdentifier(body?.identifier);
  const code = String(body?.code ?? "").trim();
  const password = String(body?.password ?? "");
  const confirmPassword = String(body?.confirmPassword ?? "");

  if (!identifier) {
    return json({ field: "identifier", message: "Account obbligatorio.", ok: false }, { status: 400 });
  }

  if (!code) {
    return json({ field: "code", message: "Codice obbligatorio.", ok: false }, { status: 400 });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return json({ field: "password", message: passwordError, ok: false }, { status: 400 });
  }

  const confirmError = validateConfirmPassword(password, confirmPassword);
  if (confirmError) {
    return json({ field: "confirmPassword", message: confirmError, ok: false }, { status: 400 });
  }

  const user = await findUserByResetIdentifier(env.DB, identifier);

  if (!user) {
    return json({ field: "identifier", message: "Account non trovato.", ok: false }, { status: 404 });
  }

  try {
    await consumePasswordResetCode(env.DB, {
      code,
      userId: user.id,
    });
    await updateUserPassword(env.DB, {
      password,
      userId: user.id,
    });
    await deleteUserSessions(env.DB, user.id);

    return json({
      ok: true,
      message: "Password aggiornata. Ora puoi accedere.",
    });
  } catch (error) {
    const flowError = getFlowError(error);

    return json({ message: flowError.message, ok: false }, { status: flowError.status });
  }
};

export const onRequestGet = methodNotAllowed;
