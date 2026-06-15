/// <reference types="@cloudflare/workers-types" />

import { hashPassword } from "./crypto";
import {
  createUserWithPasswordHash,
  findUserByUniqueFields,
  type PublicUser,
  toPublicUser,
} from "./users";
import {
  createOtpCode,
  createTelegramLinkCode,
  hashVerificationCode,
} from "./telegram";

const registrationTtlMinutes = 15;
const passwordResetTtlMinutes = 10;

type TelegramProfile = {
  chatId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

export type PendingRegistrationRow = {
  consumed_at: string | null;
  created_at: string;
  email: string;
  expires_at: string;
  id: string;
  otp_code_hash: string | null;
  otp_sent_at: string | null;
  password_hash: string;
  phone: string;
  telegram_chat_id: string | null;
  telegram_first_name: string | null;
  telegram_last_name: string | null;
  telegram_username: string | null;
  username: string;
};

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function isExpired(value: string) {
  return Date.parse(value) <= Date.now();
}

export async function cleanupExpiredAccountFlows(db: D1Database) {
  const now = new Date().toISOString();

  await db
    .prepare("DELETE FROM pending_registrations WHERE expires_at <= ?1 OR consumed_at IS NOT NULL")
    .bind(now)
    .run();
  await db
    .prepare("DELETE FROM password_reset_codes WHERE expires_at <= ?1 OR consumed_at IS NOT NULL")
    .bind(now)
    .run();
  await db
    .prepare("DELETE FROM telegram_link_requests WHERE expires_at <= ?1 OR consumed_at IS NOT NULL")
    .bind(now)
    .run();
}

export async function createPendingRegistration(
  db: D1Database,
  input: {
    email: string;
    password: string;
    phone: string;
    username: string;
  },
) {
  await cleanupExpiredAccountFlows(db);

  const now = new Date().toISOString();
  const linkCode = createTelegramLinkCode();

  await db
    .prepare(
      `DELETE FROM pending_registrations
       WHERE consumed_at IS NULL
         AND (username = ?1 OR email = ?2 OR phone = ?3)`,
    )
    .bind(input.username, input.email, input.phone)
    .run();

  await db
    .prepare(
      `INSERT INTO pending_registrations (
        id, username, email, phone, password_hash, link_code_hash, otp_code_hash,
        created_at, expires_at, consumed_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7, ?8, NULL)`,
    )
    .bind(
      crypto.randomUUID(),
      input.username,
      input.email,
      input.phone,
      await hashPassword(input.password),
      await hashVerificationCode(linkCode),
      now,
      minutesFromNow(registrationTtlMinutes),
    )
    .run();

  const pending = await db
    .prepare(
      `SELECT id, username, email, phone, password_hash, otp_code_hash, telegram_chat_id,
        telegram_username, telegram_first_name, telegram_last_name, otp_sent_at,
        created_at, expires_at, consumed_at
       FROM pending_registrations
       WHERE link_code_hash = ?1
       LIMIT 1`,
    )
    .bind(await hashVerificationCode(linkCode))
    .first<PendingRegistrationRow>();

  if (!pending) {
    throw new Error("Registrazione temporanea non creata.");
  }

  return {
    linkCode,
    pending,
  };
}

export async function findPendingRegistrationById(db: D1Database, registrationId: string) {
  return db
    .prepare(
      `SELECT id, username, email, phone, password_hash, otp_code_hash, telegram_chat_id,
        telegram_username, telegram_first_name, telegram_last_name, otp_sent_at,
        created_at, expires_at, consumed_at
       FROM pending_registrations
       WHERE id = ?1
       LIMIT 1`,
    )
    .bind(registrationId)
    .first<PendingRegistrationRow>();
}

export async function findPendingRegistrationByLinkCode(db: D1Database, linkCode: string) {
  return db
    .prepare(
      `SELECT id, username, email, phone, password_hash, otp_code_hash, telegram_chat_id,
        telegram_username, telegram_first_name, telegram_last_name, otp_sent_at,
        created_at, expires_at, consumed_at
       FROM pending_registrations
       WHERE link_code_hash = ?1 AND consumed_at IS NULL
       LIMIT 1`,
    )
    .bind(await hashVerificationCode(linkCode))
    .first<PendingRegistrationRow>();
}

export async function attachTelegramToPendingRegistration(
  db: D1Database,
  input: TelegramProfile & {
    otpCode: string;
    registrationId: string;
  },
) {
  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE pending_registrations
       SET telegram_chat_id = ?1,
           telegram_username = ?2,
           telegram_first_name = ?3,
           telegram_last_name = ?4,
           otp_sent_at = ?5,
           otp_code_hash = ?6
       WHERE id = ?7 AND consumed_at IS NULL`,
    )
    .bind(
      input.chatId,
      input.username ?? null,
      input.firstName ?? null,
      input.lastName ?? null,
      now,
      await hashVerificationCode(input.otpCode),
      input.registrationId,
    )
    .run();
}

export async function confirmPendingRegistration(
  db: D1Database,
  input: {
    otpCode: string;
    registrationId: string;
  },
) {
  await cleanupExpiredAccountFlows(db);

  const pending = await findPendingRegistrationById(db, input.registrationId);

  if (!pending || pending.consumed_at || isExpired(pending.expires_at)) {
    throw {
      message: "Codice scaduto. Ripeti la registrazione.",
      status: 410,
    };
  }

  if (!pending.telegram_chat_id) {
    throw {
      message: "Apri prima il bot Telegram per ricevere il codice.",
      status: 409,
    };
  }

  if (!pending.otp_code_hash) {
    throw {
      message: "Apri il bot Telegram per generare il codice OTP.",
      status: 409,
    };
  }

  if ((await hashVerificationCode(input.otpCode)) !== pending.otp_code_hash) {
    throw {
      message: "Codice OTP non valido.",
      status: 400,
    };
  }

  const existing = await findUserByUniqueFields(db, pending);

  if (existing) {
    throw {
      message: "Account già registrato con questi dati.",
      status: 409,
    };
  }

  const existingTelegramLink = await db
    .prepare(
      `SELECT user_id
       FROM telegram_links
       WHERE telegram_chat_id = ?1
       LIMIT 1`,
    )
    .bind(pending.telegram_chat_id)
    .first<{ user_id: string }>();

  if (existingTelegramLink) {
    throw {
      message: "Questo Telegram è già collegato a un altro account.",
      status: 409,
    };
  }

  const user = await createUserWithPasswordHash(db, {
    email: pending.email,
    passwordHash: pending.password_hash,
    phone: pending.phone,
    username: pending.username,
  });
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO telegram_links (
        id, user_id, telegram_chat_id, telegram_username, telegram_first_name,
        telegram_last_name, linked_at, updated_at
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7
      )
      ON CONFLICT(user_id) DO UPDATE SET
        telegram_chat_id = excluded.telegram_chat_id,
        telegram_username = excluded.telegram_username,
        telegram_first_name = excluded.telegram_first_name,
        telegram_last_name = excluded.telegram_last_name,
        updated_at = excluded.updated_at`,
    )
    .bind(
      crypto.randomUUID(),
      user.id,
      pending.telegram_chat_id,
      pending.telegram_username,
      pending.telegram_first_name,
      pending.telegram_last_name,
      now,
    )
    .run();

  await db
    .prepare("UPDATE pending_registrations SET consumed_at = ?1 WHERE id = ?2")
    .bind(now, pending.id)
    .run();

  return toPublicUser(user);
}

export async function getTelegramLinkForUser(db: D1Database, userId: string) {
  return db
    .prepare(
      `SELECT telegram_chat_id
       FROM telegram_links
       WHERE user_id = ?1
       LIMIT 1`,
    )
    .bind(userId)
    .first<{ telegram_chat_id: string }>();
}

export async function createTelegramLinkRequest(db: D1Database, userId: string) {
  await cleanupExpiredAccountFlows(db);

  const now = new Date().toISOString();
  const linkCode = createTelegramLinkCode();

  await db
    .prepare("UPDATE telegram_link_requests SET consumed_at = ?1 WHERE user_id = ?2 AND consumed_at IS NULL")
    .bind(now, userId)
    .run();

  await db
    .prepare(
      `INSERT INTO telegram_link_requests (
        id, user_id, link_code_hash, created_at, expires_at, consumed_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, NULL)`,
    )
    .bind(
      crypto.randomUUID(),
      userId,
      await hashVerificationCode(linkCode),
      now,
      minutesFromNow(registrationTtlMinutes),
    )
    .run();

  return linkCode;
}

export async function findTelegramLinkRequestByCode(db: D1Database, linkCode: string) {
  return db
    .prepare(
      `SELECT id, user_id, expires_at
       FROM telegram_link_requests
       WHERE link_code_hash = ?1 AND consumed_at IS NULL
       LIMIT 1`,
    )
    .bind(await hashVerificationCode(linkCode))
    .first<{
      expires_at: string;
      id: string;
      user_id: string;
    }>();
}

export async function attachTelegramToUser(
  db: D1Database,
  input: TelegramProfile & {
    requestId?: string;
    userId: string;
  },
) {
  const existingTelegramLink = await db
    .prepare(
      `SELECT user_id
       FROM telegram_links
       WHERE telegram_chat_id = ?1 AND user_id != ?2
       LIMIT 1`,
    )
    .bind(input.chatId, input.userId)
    .first<{ user_id: string }>();

  if (existingTelegramLink) {
    throw {
      message: "Questo Telegram è già collegato a un altro account.",
      status: 409,
    };
  }

  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO telegram_links (
        id, user_id, telegram_chat_id, telegram_username, telegram_first_name,
        telegram_last_name, linked_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)
      ON CONFLICT(user_id) DO UPDATE SET
        telegram_chat_id = excluded.telegram_chat_id,
        telegram_username = excluded.telegram_username,
        telegram_first_name = excluded.telegram_first_name,
        telegram_last_name = excluded.telegram_last_name,
        updated_at = excluded.updated_at`,
    )
    .bind(
      crypto.randomUUID(),
      input.userId,
      input.chatId,
      input.username ?? null,
      input.firstName ?? null,
      input.lastName ?? null,
      now,
    )
    .run();

  if (input.requestId) {
    await db
      .prepare("UPDATE telegram_link_requests SET consumed_at = ?1 WHERE id = ?2")
      .bind(now, input.requestId)
      .run();
  }
}

export async function createPasswordResetCode(db: D1Database, user: PublicUser) {
  await cleanupExpiredAccountFlows(db);

  const code = createOtpCode();
  const now = new Date().toISOString();

  await db
    .prepare("UPDATE password_reset_codes SET consumed_at = ?1 WHERE user_id = ?2 AND consumed_at IS NULL")
    .bind(now, user.id)
    .run();

  await db
    .prepare(
      `INSERT INTO password_reset_codes (
        id, user_id, code_hash, created_at, expires_at, consumed_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, NULL)`,
    )
    .bind(
      crypto.randomUUID(),
      user.id,
      await hashVerificationCode(code),
      now,
      minutesFromNow(passwordResetTtlMinutes),
    )
    .run();

  return code;
}

export async function consumePasswordResetCode(
  db: D1Database,
  input: {
    code: string;
    userId: string;
  },
) {
  await cleanupExpiredAccountFlows(db);

  const codeHash = await hashVerificationCode(input.code);
  const row = await db
    .prepare(
      `SELECT id, expires_at
       FROM password_reset_codes
       WHERE user_id = ?1 AND code_hash = ?2 AND consumed_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(input.userId, codeHash)
    .first<{ expires_at: string; id: string }>();

  if (!row || isExpired(row.expires_at)) {
    throw {
      message: "Codice non valido o scaduto.",
      status: 400,
    };
  }

  await db
    .prepare("UPDATE password_reset_codes SET consumed_at = ?1 WHERE id = ?2")
    .bind(new Date().toISOString(), row.id)
    .run();
}
