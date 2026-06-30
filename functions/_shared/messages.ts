/// <reference types="@cloudflare/workers-types" />

import { ensureAdminControlSchema } from "./admin-control-schema";

export type AdminMessageRow = {
  body: string;
  created_at: string;
  created_by: string | null;
  delivery_mode: "both" | "inbox" | "popup";
  id: string;
  read_at: string | null;
  popup_seen_at: string | null;
  title: string;
};

export async function getUnreadMessageCount(db: D1Database, userId: string) {
  await ensureAdminControlSchema(db);

  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM user_messages um
       INNER JOIN admin_messages m ON m.id = um.message_id
       WHERE um.user_id = ?1
         AND um.read_at IS NULL
         AND m.delivery_mode IN ('inbox', 'both')`,
    )
    .bind(userId)
    .first<{ count: number }>();

  return row?.count ?? 0;
}

export async function listInboxMessages(db: D1Database, userId: string) {
  await ensureAdminControlSchema(db);

  const rows = await db
    .prepare(
      `SELECT
        m.id,
        m.title,
        m.body,
        m.delivery_mode,
        m.created_by,
        m.created_at,
        um.read_at,
        um.popup_seen_at
       FROM user_messages um
       INNER JOIN admin_messages m ON m.id = um.message_id
       WHERE um.user_id = ?1
         AND m.delivery_mode IN ('inbox', 'both')
       ORDER BY m.created_at DESC
       LIMIT 120`,
    )
    .bind(userId)
    .all<AdminMessageRow>();

  return rows.results ?? [];
}

export async function listPendingPopupMessages(db: D1Database, userId: string) {
  await ensureAdminControlSchema(db);

  const rows = await db
    .prepare(
      `SELECT
        m.id,
        m.title,
        m.body,
        m.delivery_mode,
        m.created_by,
        m.created_at,
        um.read_at,
        um.popup_seen_at
       FROM user_messages um
       INNER JOIN admin_messages m ON m.id = um.message_id
       WHERE um.user_id = ?1
         AND um.popup_seen_at IS NULL
         AND m.delivery_mode IN ('popup', 'both')
       ORDER BY m.created_at ASC
       LIMIT 5`,
    )
    .bind(userId)
    .all<AdminMessageRow>();

  return rows.results ?? [];
}

export async function markInboxMessageRead(
  db: D1Database,
  input: {
    messageId: string;
    userId: string;
  },
) {
  await ensureAdminControlSchema(db);

  await db
    .prepare(
      `UPDATE user_messages
       SET read_at = COALESCE(read_at, ?1)
       WHERE user_id = ?2 AND message_id = ?3`,
    )
    .bind(new Date().toISOString(), input.userId, input.messageId)
    .run();
}

export async function markPopupMessageSeen(
  db: D1Database,
  input: {
    messageId: string;
    userId: string;
  },
) {
  await ensureAdminControlSchema(db);

  await db
    .prepare(
      `UPDATE user_messages
       SET popup_seen_at = COALESCE(popup_seen_at, ?1)
       WHERE user_id = ?2 AND message_id = ?3`,
    )
    .bind(new Date().toISOString(), input.userId, input.messageId)
    .run();
}

export async function createUserInboxMessage(
  db: D1Database,
  input: {
    body: string;
    createdBy?: string | null;
    title: string;
    userId: string;
  },
) {
  await ensureAdminControlSchema(db);

  const now = new Date().toISOString();
  const messageId = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO admin_messages (
        id, title, body, delivery_mode, target_type, created_by, created_at
      ) VALUES (?1, ?2, ?3, 'inbox', 'users', ?4, ?5)`,
    )
    .bind(messageId, input.title, input.body, input.createdBy ?? null, now)
    .run();

  await db
    .prepare(
      `INSERT OR IGNORE INTO user_messages (
        id, message_id, user_id, read_at, popup_seen_at, created_at
      ) VALUES (?1, ?2, ?3, NULL, NULL, ?4)`,
    )
    .bind(crypto.randomUUID(), messageId, input.userId, now)
    .run();

  return messageId;
}
