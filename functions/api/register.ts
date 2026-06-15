/// <reference types="@cloudflare/workers-types" />

import {
  passwordRequirementLabels,
  validateRegistrationValues,
  type RegisterField,
} from "../../src/lib/auth-validation";
import { createPendingRegistration } from "../_shared/account-flows";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../_shared/http";
import { createTelegramStartUrl, getSiteUrl, type TelegramEnv } from "../_shared/telegram";
import { findUserByUniqueFields } from "../_shared/users";

type Env = TelegramEnv & {
  DB: D1Database;
  TELEGRAM_DEBUG_CODES?: string;
};

const duplicateMessages: Record<"email" | "phone" | "username", string> = {
  email: "Email già registrata.",
  phone: "Numero di telefono già registrato.",
  username: "Username già esistente.",
};

function passwordDetails() {
  return [
    passwordRequirementLabels.length,
    passwordRequirementLabels.uppercase,
    passwordRequirementLabels.lowercase,
    passwordRequirementLabels.number,
    passwordRequirementLabels.special,
  ];
}

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

  const validation = validateRegistrationValues({
    confirmPassword: String(body.confirmPassword ?? ""),
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
    phone: String(body.phone ?? ""),
    username: String(body.username ?? ""),
  });

  if (!validation.isValid) {
    const field = Object.keys(validation.errors)[0] as RegisterField;
    const message = validation.errors[field] ?? "Dati registrazione non validi.";

    return json(
      {
        details: field === "password" ? passwordDetails() : undefined,
        field,
        message,
        ok: false,
      },
      { status: 400 },
    );
  }

  const existingUser = await findUserByUniqueFields(env.DB, validation.values);

  if (existingUser) {
    const field: "email" | "phone" | "username" =
      existingUser.username.toLowerCase() === validation.values.username.toLowerCase()
        ? "username"
        : existingUser.email.toLowerCase() === validation.values.email.toLowerCase()
          ? "email"
          : "phone";

    return json(
      {
        field,
        message: duplicateMessages[field],
        ok: false,
      },
      { status: 409 },
    );
  }

  try {
    const pending = await createPendingRegistration(env.DB, validation.values);
    const siteUrl = getSiteUrl(request, env);

    return json(
      {
        ok: true,
        expiresAt: pending.pending.expires_at,
        registrationId: pending.pending.id,
        telegramBotUsername: env.TELEGRAM_BOT_USERNAME || "survivalarena_bot",
        telegramStartUrl: createTelegramStartUrl(env, pending.linkCode),
        verificationUrl: `${siteUrl}/register/`,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("unique")) {
      return json(
        {
          message: "Account già registrato con questi dati.",
          ok: false,
        },
        { status: 409 },
      );
    }

    return json(
      {
        message: "Registrazione non riuscita. Riprova tra poco.",
        ok: false,
      },
      { status: 500 },
    );
  }
};

export const onRequestGet = methodNotAllowed;
