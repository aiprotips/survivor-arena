/// <reference types="@cloudflare/workers-types" />

import { normalizeEmail, normalizePhone } from "../../src/lib/auth-validation";
import {
  createPasswordResetCode,
  getTelegramLinkForUser,
} from "../_shared/account-flows";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../_shared/http";
import { sendTelegramMessage, type TelegramEnv } from "../_shared/telegram";
import { findUserByResetIdentifier, toPublicUser } from "../_shared/users";

type Env = TelegramEnv & {
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

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const body = await readJsonObject(request);
  const identifier = normalizeResetIdentifier(body?.identifier);

  if (!identifier) {
    return json(
      {
        field: "identifier",
        message: "Inserisci email, username o telefono.",
        ok: false,
      },
      { status: 400 },
    );
  }

  const user = await findUserByResetIdentifier(env.DB, identifier);

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

  const telegramLink = await getTelegramLinkForUser(env.DB, user.id);

  if (!telegramLink) {
    return json(
      {
        message: "Telegram non è ancora collegato a questo account.",
        ok: false,
      },
      { status: 409 },
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
