/// <reference types="@cloudflare/workers-types" />

import {
  createOtpCode,
  hashVerificationCode,
  sendTelegramMessage,
  type TelegramEnv,
} from "./telegram";
import { getTelegramLinkForUser } from "./account-flows";

export const legalPolicyVersion = "2026-06-22";

const phoneChangeTtlMinutes = 10;
let userComplianceSchemaReady: Promise<void> | null = null;

async function runSchemaStatement(db: D1Database, sql: string) {
  try {
    await db.prepare(sql).run();
  } catch (error) {
    const message = [
      error instanceof Error ? error.message : "",
      typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "",
      typeof error === "object" && error && "cause" in error
        ? String(error.cause)
        : "",
      String(error),
    ].join(" ").toLowerCase();

    if (
      message.includes("duplicate column") ||
      message.includes("already exists")
    ) {
      return;
    }

    throw error;
  }
}

async function applyUserComplianceSchema(db: D1Database) {
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN terms_accepted_at TEXT");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN terms_version TEXT");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN privacy_accepted_at TEXT");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN privacy_version TEXT");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN cookie_policy_accepted_at TEXT");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN cookie_policy_version TEXT");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN pending_phone TEXT");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN pending_phone_code_hash TEXT");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN pending_phone_requested_at TEXT");
  await runSchemaStatement(db, "ALTER TABLE users ADD COLUMN pending_phone_expires_at TEXT");
  await runSchemaStatement(db, "CREATE INDEX IF NOT EXISTS idx_users_pending_phone ON users (pending_phone)");

  try {
    await runSchemaStatement(
      db,
      `CREATE TABLE IF NOT EXISTS d1_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );
    await runSchemaStatement(
      db,
      "INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0007_user_compliance_profile.sql')",
    );
  } catch {
    // Migration metadata is best-effort during runtime schema recovery.
  }
}

export async function ensureUserComplianceSchema(db: D1Database) {
  userComplianceSchemaReady ??= applyUserComplianceSchema(db).catch((error) => {
    userComplianceSchemaReady = null;
    throw error;
  });

  await userComplianceSchemaReady;
}

export async function recordLegalAcceptance(db: D1Database, userId: string) {
  await ensureUserComplianceSchema(db);

  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE users
       SET terms_accepted_at = ?1,
           terms_version = ?2,
           privacy_accepted_at = ?1,
           privacy_version = ?2,
           cookie_policy_accepted_at = ?1,
           cookie_policy_version = ?2,
           updated_at = ?1
       WHERE id = ?3`,
    )
    .bind(now, legalPolicyVersion, userId)
    .run();
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function toFlowError(message: string, status = 400, extra?: Record<string, unknown>) {
  return {
    ...extra,
    message,
    status,
  };
}

export async function requestPhoneChangeVerification(
  db: D1Database,
  env: TelegramEnv,
  input: {
    newPhone: string;
    userId: string;
  },
) {
  await ensureUserComplianceSchema(db);

  const link = await getTelegramLinkForUser(db, input.userId);

  if (!link) {
    throw toFlowError(
      "Collega Telegram prima di cambiare numero.",
      409,
      { requiresTelegramLink: true },
    );
  }

  const duplicate = await db
    .prepare("SELECT id FROM users WHERE id != ?1 AND phone = ?2 LIMIT 1")
    .bind(input.userId, input.newPhone)
    .first<{ id: string }>();

  if (duplicate) {
    throw toFlowError("Numero di telefono già registrato.", 409, { field: "phone" });
  }

  const code = createOtpCode();
  const now = new Date().toISOString();
  const expiresAt = minutesFromNow(phoneChangeTtlMinutes);

  await db
    .prepare(
      `UPDATE users
       SET pending_phone = ?1,
           pending_phone_code_hash = ?2,
           pending_phone_requested_at = ?3,
           pending_phone_expires_at = ?4,
           updated_at = ?3
       WHERE id = ?5`,
    )
    .bind(
      input.newPhone,
      await hashVerificationCode(code),
      now,
      expiresAt,
      input.userId,
    )
    .run();

  await sendTelegramMessage(env, {
    chatId: link.telegram_chat_id,
    text: `Codice cambio telefono Survivor Arena: ${code}\n\nInseriscilo nel popup sul sito per confermare il nuovo numero. Il codice scade tra ${phoneChangeTtlMinutes} minuti.`,
  });

  return {
    expiresAt,
  };
}

export async function confirmPhoneChangeVerification(
  db: D1Database,
  input: {
    code: string;
    userId: string;
  },
) {
  await ensureUserComplianceSchema(db);

  const pending = await db
    .prepare(
      `SELECT pending_phone, pending_phone_code_hash, pending_phone_expires_at
       FROM users
       WHERE id = ?1
       LIMIT 1`,
    )
    .bind(input.userId)
    .first<{
      pending_phone: string | null;
      pending_phone_code_hash: string | null;
      pending_phone_expires_at: string | null;
    }>();

  if (!pending?.pending_phone || !pending.pending_phone_code_hash) {
    throw toFlowError("Richiedi prima il codice di verifica per il nuovo numero.", 409);
  }

  if (!pending.pending_phone_expires_at || Date.parse(pending.pending_phone_expires_at) <= Date.now()) {
    throw toFlowError("Codice scaduto. Richiedine uno nuovo.", 410);
  }

  if ((await hashVerificationCode(input.code)) !== pending.pending_phone_code_hash) {
    throw toFlowError("Codice OTP non valido.", 400);
  }

  const duplicate = await db
    .prepare("SELECT id FROM users WHERE id != ?1 AND phone = ?2 LIMIT 1")
    .bind(input.userId, pending.pending_phone)
    .first<{ id: string }>();

  if (duplicate) {
    throw toFlowError("Numero di telefono già registrato.", 409, { field: "phone" });
  }

  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE users
       SET phone = ?1,
           pending_phone = NULL,
           pending_phone_code_hash = NULL,
           pending_phone_requested_at = NULL,
           pending_phone_expires_at = NULL,
           updated_at = ?2
       WHERE id = ?3`,
    )
    .bind(pending.pending_phone, now, input.userId)
    .run();

  await db
    .prepare(
      `UPDATE telegram_links
       SET phone_verified_at = ?1,
           verification_code_hash = NULL,
           verification_code_sent_at = NULL,
           updated_at = ?1
       WHERE user_id = ?2`,
    )
    .bind(now, input.userId)
    .run();

  return {
    phone: pending.pending_phone,
    verifiedAt: now,
  };
}

