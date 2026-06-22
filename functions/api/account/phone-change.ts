/// <reference types="@cloudflare/workers-types" />

import { normalizePhone, validatePhone } from "../../../src/lib/auth-validation";
import { createTelegramLinkRequest } from "../../_shared/account-flows";
import { requireUser } from "../../_shared/access";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../_shared/http";
import {
  createTelegramAppStartUrl,
  createTelegramStartUrl,
  getTelegramBotUsername,
  type TelegramEnv,
} from "../../_shared/telegram";
import {
  confirmPhoneChangeVerification,
  requestPhoneChangeVerification,
} from "../../_shared/user-compliance";

type Env = TelegramEnv & {
  DB: D1Database;
};

function getFlowError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    "status" in error &&
    typeof error.message === "string" &&
    typeof error.status === "number"
  ) {
    return error as {
      field?: string;
      message: string;
      requiresTelegramLink?: boolean;
      status: number;
    };
  }

  return {
    message: "Verifica telefono non riuscita. Riprova tra poco.",
    status: 500,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  const phone = normalizePhone(body?.phone);
  const phoneError = validatePhone(phone);

  if (phoneError) {
    return json({ field: "phone", message: phoneError, ok: false }, { status: 400 });
  }

  if (phone === auth.user.phone) {
    return json({
      message: "Questo numero è già associato al tuo account.",
      ok: true,
    });
  }

  try {
    const result = await requestPhoneChangeVerification(env.DB, env, {
      newPhone: phone,
      userId: auth.user.id,
    });

    return json({
      expiresAt: result.expiresAt,
      message: "Codice inviato sul bot Telegram.",
      ok: true,
    });
  } catch (error) {
    const flowError = getFlowError(error);

    if (flowError.requiresTelegramLink) {
      const linkCode = await createTelegramLinkRequest(env.DB, auth.user.id, "verify");

      return json(
        {
          message: flowError.message,
          ok: false,
          requiresTelegramLink: true,
          telegramAppStartUrl: createTelegramAppStartUrl(env, linkCode),
          telegramBotUsername: getTelegramBotUsername(env),
          telegramStartUrl: createTelegramStartUrl(env, linkCode),
        },
        { status: flowError.status },
      );
    }

    return json(
      {
        field: flowError.field,
        message: flowError.message,
        ok: false,
      },
      { status: flowError.status },
    );
  }
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
  const code = String(body?.code ?? "").trim();

  if (!code) {
    return json(
      { field: "code", message: "Inserisci il codice OTP ricevuto su Telegram.", ok: false },
      { status: 400 },
    );
  }

  try {
    const result = await confirmPhoneChangeVerification(env.DB, {
      code,
      userId: auth.user.id,
    });

    return json({
      message: "Numero verificato e aggiornato correttamente.",
      ok: true,
      phone: result.phone,
    });
  } catch (error) {
    const flowError = getFlowError(error);

    return json(
      {
        field: flowError.field,
        message: flowError.message,
        ok: false,
      },
      { status: flowError.status },
    );
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;

