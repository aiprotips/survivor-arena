/// <reference types="@cloudflare/workers-types" />

import {
  attachTelegramToUser,
  attachTelegramToPendingRegistration,
  createPasswordResetCode,
  createPhoneVerificationCode,
  findTelegramLinkRequestByCode,
  findPendingRegistrationByLinkCode,
  isExpired,
} from "../../_shared/account-flows";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../_shared/http";
import {
  createOtpCode,
  getSiteUrl,
  verifyTelegramWebhookSecret,
  type TelegramEnv,
  type TelegramWebhookUpdate,
} from "../../_shared/telegram";
import { findUserById, toPublicUser } from "../../_shared/users";

type Env = TelegramEnv & {
  DB: D1Database;
};

function getStartCode(text: string) {
  const match = text.trim().match(/^\/start(?:@[\w_]+)?(?:\s+(.+))?$/i);

  return match?.[1]?.trim() ?? "";
}

function telegramMessageResponse(
  chatId: string,
  text: string,
  replyMarkup?: unknown,
) {
  return new Response(JSON.stringify({
    chat_id: chatId,
    disable_web_page_preview: true,
    method: "sendMessage",
    reply_markup: replyMarkup,
    text,
  }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
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
    const siteUrl = getSiteUrl(request, env);

    return telegramMessageResponse(
      chatId,
      "Ciao, questa è Survivor Arena. Cosa devi fare?\n\n- Verificare il telefono al primo login\n- Recuperare la password\n\nApri il percorso dal sito: ti riporterà qui con il link corretto.",
      {
        inline_keyboard: [
          [
            {
              text: "Verifica telefono",
              url: `${siteUrl}/login`,
            },
          ],
          [
            {
              text: "Recupero password",
              url: `${siteUrl}/forgot-password`,
            },
          ],
        ],
      },
    );
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

      if (linkRequest.purpose === "password_reset") {
        const user = await findUserById(env.DB, linkRequest.user_id);

        if (!user) {
          return telegramMessageResponse(
            chatId,
            "Account non trovato. Torna su Survivor Arena e ripeti la richiesta.",
          );
        }

        const code = await createPasswordResetCode(env.DB, toPublicUser(user));

        return telegramMessageResponse(
          chatId,
          `Codice recupero password Survivor Arena: ${code}\n\nInseriscilo sul sito per creare una nuova password. Il codice scade tra 10 minuti.`,
        );
      }

      const code = await createPhoneVerificationCode(env.DB, linkRequest.user_id);

      return telegramMessageResponse(
        chatId,
        `Codice verifica Survivor Arena: ${code}\n\nInseriscilo nella pagina di verifica account. Il codice scade tra 15 minuti.`,
      );
    }

    return telegramMessageResponse(
      chatId,
      "Questo link non è valido o è scaduto. Torna su Survivor Arena e richiedi un nuovo codice.",
    );
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

  return telegramMessageResponse(
    chatId,
    `Codice Survivor Arena: ${otpCode}\n\nInseriscilo nella pagina di registrazione. Il codice scade tra 15 minuti.`,
  );
};

export const onRequestGet = methodNotAllowed;
