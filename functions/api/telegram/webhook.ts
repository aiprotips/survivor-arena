/// <reference types="@cloudflare/workers-types" />

import {
  attachTelegramToUser,
  attachTelegramToPendingRegistration,
  findTelegramLinkRequestByCode,
  findPendingRegistrationByLinkCode,
  isExpired,
} from "../../_shared/account-flows";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../_shared/http";
import {
  createOtpCode,
  getTelegramBotUsername,
  sendTelegramMessage,
  verifyTelegramWebhookSecret,
  type TelegramEnv,
  type TelegramWebhookUpdate,
} from "../../_shared/telegram";

type Env = TelegramEnv & {
  DB: D1Database;
};

function getStartCode(text: string) {
  const match = text.trim().match(/^\/start(?:@[\w_]+)?(?:\s+(.+))?$/i);

  return match?.[1]?.trim() ?? "";
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  if (!verifyTelegramWebhookSecret(request, env)) {
    return json({ message: "Webhook Telegram non autorizzato.", ok: false }, { status: 401 });
  }

  const body = (await readJsonObject(request)) as TelegramWebhookUpdate | null;
  const message = body?.message;
  const chatId = message?.chat?.id ? String(message.chat.id) : "";
  const text = message?.text ?? "";

  if (!chatId) {
    return json({ ok: true });
  }

  const linkCode = getStartCode(text);

  if (!linkCode) {
    await sendTelegramMessage(env, {
      chatId,
      text: `Ciao, questa è Survivor Arena. Per collegare il conto, apri il link dal sito e premi Avvia su @${getTelegramBotUsername(env)}.`,
    });

    return json({ ok: true });
  }

  const pending = await findPendingRegistrationByLinkCode(env.DB, linkCode);

  if (!pending || pending.consumed_at || isExpired(pending.expires_at)) {
    const linkRequest = await findTelegramLinkRequestByCode(env.DB, linkCode);

    if (linkRequest && !isExpired(linkRequest.expires_at)) {
      await attachTelegramToUser(env.DB, {
        chatId,
        firstName: message?.from?.first_name,
        lastName: message?.from?.last_name,
        requestId: linkRequest.id,
        userId: linkRequest.user_id,
        username: message?.from?.username,
      });

      await sendTelegramMessage(env, {
        chatId,
        text: "Telegram collegato correttamente al tuo account Survivor Arena.",
      });

      return json({ ok: true });
    }

    await sendTelegramMessage(env, {
      chatId,
      text: "Questo link non è valido o è scaduto. Torna su Survivor Arena e ripeti la registrazione.",
    });

    return json({ ok: true });
  }

  const otpCode = createOtpCode();

  await attachTelegramToPendingRegistration(env.DB, {
    chatId,
    firstName: message?.from?.first_name,
    lastName: message?.from?.last_name,
    otpCode,
    registrationId: pending.id,
    username: message?.from?.username,
  });

  await sendTelegramMessage(env, {
    chatId,
    text: `Codice Survivor Arena: ${otpCode}\n\nInseriscilo nella pagina di registrazione. Il codice scade tra 15 minuti.`,
  });

  return json({
    debugOtp: env.TELEGRAM_DEBUG_CODES === "1" ? otpCode : undefined,
    ok: true,
  });
};

export const onRequestGet = methodNotAllowed;
