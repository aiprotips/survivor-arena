/// <reference types="@cloudflare/workers-types" />

import { normalizePhone, normalizeUsername, validatePhone, validateUsername } from "../../src/lib/auth-validation";
import {
  createTelegramLinkRequest,
  createPasswordResetCode,
  getTelegramLinkForUser,
} from "../_shared/account-flows";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../_shared/http";
import { createTelegramStartUrl, sendTelegramMessage, type TelegramEnv } from "../_shared/telegram";
import { findUserByUsernameAndPhone, toPublicUser } from "../_shared/users";

type Env = TelegramEnv & {
  DB: D1Database;
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const body = await readJsonObject(request);
  const username = normalizeUsername(body?.username ?? body?.identifier);
  const phone = normalizePhone(body?.phone);

  const usernameError = validateUsername(username);
  if (usernameError) {
    return json(
      {
        field: "username",
        message: usernameError,
        ok: false,
      },
      { status: 400 },
    );
  }

  const phoneError = validatePhone(phone);
  if (phoneError) {
    return json(
      {
        field: "phone",
        message: phoneError,
        ok: false,
      },
      { status: 400 },
    );
  }

  const user = await findUserByUsernameAndPhone(env.DB, {
    phone,
    username,
  });

  if (!user) {
    return json(
      {
        field: "username",
        message: "Username e numero di telefono non corrispondono.",
        ok: false,
      },
      { status: 404 },
    );
  }

  const telegramLink = await getTelegramLinkForUser(env.DB, user.id);

  if (!telegramLink) {
    const linkCode = await createTelegramLinkRequest(env.DB, user.id, "password_reset");

    return json(
      {
        message: "Telegram non è ancora collegato. Apri il bot, premi Avvia e riceverai il codice di recupero.",
        ok: true,
        requiresTelegramStart: true,
        telegramBotUsername: env.TELEGRAM_BOT_USERNAME || "survivalarena_bot",
        telegramStartUrl: createTelegramStartUrl(env, linkCode),
      },
      { status: 200 },
    );
  }

  try {
    const code = await createPasswordResetCode(env.DB, toPublicUser(user));

    await sendTelegramMessage(env, {
      chatId: telegramLink.telegram_chat_id,
      text: `Recupero password Survivor Arena: ${code}\n\nInseriscilo sul sito per creare una nuova password. Il codice scade tra 10 minuti.`,
    });

    return json({
      debugCode: env.TELEGRAM_DEBUG_CODES === "1" ? code : undefined,
      ok: true,
      message: "Codice inviato su Telegram.",
    });
  } catch {
    return json(
      {
        message: "Invio Telegram non riuscito. Riprova tra poco.",
        ok: false,
      },
      { status: 500 },
    );
  }
};

export const onRequestGet = methodNotAllowed;
