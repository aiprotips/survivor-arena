/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../_shared/access";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../_shared/http";

type Env = {
  DB: D1Database;
};

type AdminMessageSummary = {
  body: string;
  created_at: string;
  delivery_mode: "both" | "inbox" | "popup";
  id: string;
  popup_seen_count: number;
  read_count: number;
  recipient_count: number;
  target_type: "all" | "users";
  title: string;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeDeliveryMode(value: unknown) {
  const mode = cleanText(value);

  return mode === "popup" || mode === "both" ? mode : "inbox";
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const rows = await env.DB
    .prepare(
      `SELECT
        m.id,
        m.title,
        m.body,
        m.delivery_mode,
        m.target_type,
        m.created_at,
        COUNT(um.id) AS recipient_count,
        SUM(CASE WHEN um.read_at IS NOT NULL THEN 1 ELSE 0 END) AS read_count,
        SUM(CASE WHEN um.popup_seen_at IS NOT NULL THEN 1 ELSE 0 END) AS popup_seen_count
       FROM admin_messages m
       LEFT JOIN user_messages um ON um.message_id = m.id
       GROUP BY m.id
       ORDER BY m.created_at DESC
       LIMIT 80`,
    )
    .all<AdminMessageSummary>();

  return json({
    messages: rows.results ?? [],
    ok: true,
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  const title = cleanText(body?.title);
  const messageBody = cleanText(body?.body);
  const deliveryMode = normalizeDeliveryMode(body?.deliveryMode ?? body?.delivery_mode);
  const targetUserIds = Array.isArray(body?.targetUserIds)
    ? body.targetUserIds.map((id) => cleanText(id)).filter(Boolean)
    : [];
  const targetType = targetUserIds.length > 0 ? "users" : "all";

  if (title.length < 3) {
    return json({ field: "title", message: "Inserisci un titolo valido.", ok: false }, { status: 400 });
  }

  if (messageBody.length < 5) {
    return json({ field: "body", message: "Inserisci un messaggio valido.", ok: false }, { status: 400 });
  }

  const now = new Date().toISOString();
  const messageId = crypto.randomUUID();

  await env.DB
    .prepare(
      `INSERT INTO admin_messages (
        id, title, body, delivery_mode, target_type, created_by, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
    .bind(messageId, title, messageBody, deliveryMode, targetType, auth.user.id, now)
    .run();

  let recipients: Array<{ id: string }> = [];

  if (targetType === "all") {
    const rows = await env.DB
      .prepare(
        `SELECT id
         FROM users
         WHERE role = 'user' AND COALESCE(status, 'active') = 'active'`,
      )
      .all<{ id: string }>();

    recipients = rows.results ?? [];
  } else {
    const uniqueIds = Array.from(new Set(targetUserIds));
    for (const userId of uniqueIds) {
      const row = await env.DB
        .prepare("SELECT id FROM users WHERE id = ?1 LIMIT 1")
        .bind(userId)
        .first<{ id: string }>();

      if (row) {
        recipients.push(row);
      }
    }
  }

  for (const recipient of recipients) {
    await env.DB
      .prepare(
        `INSERT OR IGNORE INTO user_messages (
          id, message_id, user_id, read_at, popup_seen_at, created_at
        ) VALUES (?1, ?2, ?3, NULL, NULL, ?4)`,
      )
      .bind(crypto.randomUUID(), messageId, recipient.id, now)
      .run();
  }

  return json(
    {
      message: {
        body: messageBody,
        created_at: now,
        delivery_mode: deliveryMode,
        id: messageId,
        recipient_count: recipients.length,
        target_type: targetType,
        title,
      },
      ok: true,
    },
    { status: 201 },
  );
};

export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
