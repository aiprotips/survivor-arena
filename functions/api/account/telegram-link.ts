/// <reference types="@cloudflare/workers-types" />

import {
  createTelegramLinkRequest,
  getTelegramLinkForUser,
  type TelegramLinkPurpose,
} from "../../_shared/account-flows";
import { requireUser } from "../../_shared/access";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../_shared/http";
import { createTelegramStartUrl, type TelegramEnv } from "../../_shared/telegram";

type Env = TelegramEnv & {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const telegramLink = await getTelegramLinkForUser(env.DB, auth.user.id);

  return json({
    isLinked: !!telegramLink,
    isVerified: !!telegramLink?.phone_verified_at,
    ok: true,
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  const requestedPurpose = String(body?.purpose ?? "verify");
  const purpose: TelegramLinkPurpose =
    requestedPurpose === "password_reset" ? "password_reset" : "verify";
  const linkCode = await createTelegramLinkRequest(env.DB, auth.user.id, purpose);

  return json({
    ok: true,
    purpose,
    telegramBotUsername: env.TELEGRAM_BOT_USERNAME || "survivalarena_bot",
    telegramStartUrl: createTelegramStartUrl(env, linkCode),
  });
};

export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
