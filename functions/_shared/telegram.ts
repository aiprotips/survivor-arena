/// <reference types="@cloudflare/workers-types" />

import { createRandomToken, sha256Hex } from "./crypto";

export type TelegramEnv = {
  PUBLIC_SITE_URL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_DEBUG_CODES?: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_TEST_MODE?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
};

export type TelegramMessageUser = {
  first_name?: string;
  id: number;
  last_name?: string;
  username?: string;
};

export type TelegramWebhookUpdate = {
  message?: {
    chat: {
      id: number;
    };
    from?: TelegramMessageUser;
    text?: string;
  };
};

export const defaultTelegramBotUsername = "survivalarena_bot";

export function getTelegramBotUsername(env: TelegramEnv) {
  return env.TELEGRAM_BOT_USERNAME || defaultTelegramBotUsername;
}

export function createTelegramStartUrl(env: TelegramEnv, linkCode: string) {
  return `https://t.me/${getTelegramBotUsername(env)}?start=${encodeURIComponent(linkCode)}`;
}

export function createOtpCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const value = new DataView(bytes.buffer).getUint32(0);

  return String(value % 1_000_000).padStart(6, "0");
}

export function createTelegramLinkCode() {
  return createRandomToken(12).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 18);
}

export async function hashVerificationCode(code: string) {
  return sha256Hex(code.trim());
}

export function getSiteUrl(request: Request, env: TelegramEnv) {
  if (env.PUBLIC_SITE_URL) {
    return env.PUBLIC_SITE_URL.replace(/\/+$/, "");
  }

  const url = new URL(request.url);

  return url.origin;
}

export async function sendTelegramMessage(
  env: TelegramEnv,
  input: {
    chatId: string;
    replyMarkup?: unknown;
    text: string;
  },
) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    if (env.TELEGRAM_TEST_MODE === "1") {
      return;
    }

    throw new Error("Telegram bot token non configurato.");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      body: JSON.stringify({
        chat_id: input.chatId,
        disable_web_page_preview: true,
        reply_markup: input.replyMarkup,
        text: input.text,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Invio messaggio Telegram non riuscito.");
  }
}

export function verifyTelegramWebhookSecret(request: Request, env: TelegramEnv) {
  if (!env.TELEGRAM_WEBHOOK_SECRET) {
    return true;
  }

  return request.headers.get("X-Telegram-Bot-Api-Secret-Token") === env.TELEGRAM_WEBHOOK_SECRET;
}
