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
let accountFlowSchemaReady: Promise<void> | null = null;

export type TelegramLinkPurpose = "account" | "password_reset" | "verify";

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

export type TelegramLinkRow = {
  phone_verified_at: string | null;
  telegram_chat_id: string;
  verification_code_hash: string | null;
  verification_code_sent_at: string | null;
};

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

async function applyAccountFlowSchema(db: D1Database) {
  await runSchemaStatement(
    db,
    `CREATE TABLE IF NOT EXISTS telegram_links (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      telegram_chat_id TEXT NOT NULL UNIQUE,
      telegram_username TEXT,
      telegram_first_name TEXT,
      telegram_last_name TEXT,
      linked_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
  );
  await runSchemaStatement(db, "CREATE INDEX IF NOT EXISTS idx_telegram_links_user ON telegram_links (user_id)");
  await runSchemaStatement(db, "CREATE INDEX IF NOT EXISTS idx_telegram_links_chat ON telegram_links (telegram_chat_id)");

  await runSchemaStatement(
    db,
    `CREATE TABLE IF NOT EXISTS telegram_link_requests (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      link_code_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
  );
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_telegram_link_requests_user ON telegram_link_requests (user_id, expires_at)",
  );
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_telegram_link_requests_code ON telegram_link_requests (link_code_hash)",
  );

  await runSchemaStatement(
    db,
    `CREATE TABLE IF NOT EXISTS pending_registrations (
      id TEXT PRIMARY KEY NOT NULL,
      username TEXT NOT NULL COLLATE NOCASE,
      email TEXT NOT NULL COLLATE NOCASE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      link_code_hash TEXT NOT NULL UNIQUE,
      otp_code_hash TEXT,
      telegram_chat_id TEXT,
      telegram_username TEXT,
      telegram_first_name TEXT,
      telegram_last_name TEXT,
      otp_sent_at TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT
    )`,
  );
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_pending_registrations_link_code ON pending_registrations (link_code_hash)",
  );
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires_at ON pending_registrations (expires_at)",
  );

  await runSchemaStatement(
    db,
    `CREATE TABLE IF NOT EXISTS password_reset_codes (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
  );
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user ON password_reset_codes (user_id, expires_at)",
  );
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_password_reset_codes_hash ON password_reset_codes (code_hash)",
  );

  await runSchemaStatement(db, "ALTER TABLE telegram_links ADD COLUMN phone_verified_at TEXT");
  await runSchemaStatement(db, "ALTER TABLE telegram_links ADD COLUMN verification_code_hash TEXT");
  await runSchemaStatement(db, "ALTER TABLE telegram_links ADD COLUMN verification_code_sent_at TEXT");
  await runSchemaStatement(db, "ALTER TABLE telegram_link_requests ADD COLUMN purpose TEXT DEFAULT 'account'");
  await runSchemaStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_telegram_links_verified ON telegram_links (user_id, phone_verified_at)",
  );

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
      "INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0004_create_telegram_account_flows.sql')",
    );
    await runSchemaStatement(
      db,
      "INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0005_first_login_telegram_verification.sql')",
    );
  } catch {
    // The user-facing flow must not fail if Cloudflare protects migration metadata.
  }
}

export async function ensureAccountFlowSchema(db: D1Database) {
  accountFlowSchemaReady ??= applyAccountFlowSchema(db).catch((error) => {
    accountFlowSchemaReady = null;
    throw error;
  });

  await accountFlowSchemaReady;
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function isExpired(value: string) {
  return Date.parse(value) <= Date.now();
}

export async function cleanupExpiredAccountFlows(db: D1Database) {
  await ensureAccountFlowSchema(db);

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
  await ensureAccountFlowSchema(db);

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
  await ensureAccountFlowSchema(db);

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
  await ensureAccountFlowSchema(db);

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
  await ensureAccountFlowSchema(db);

  return db
    .prepare(
      `SELECT telegram_chat_id, phone_verified_at, verification_code_hash, verification_code_sent_at
       FROM telegram_links
       WHERE user_id = ?1
       LIMIT 1`,
    )
    .bind(userId)
    .first<TelegramLinkRow>();
}

export async function createTelegramLinkRequest(
  db: D1Database,
  userId: string,
  purpose: TelegramLinkPurpose = "account",
) {
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
        id, user_id, link_code_hash, created_at, expires_at, consumed_at, purpose
      ) VALUES (?1, ?2, ?3, ?4, ?5, NULL, ?6)`,
    )
    .bind(
      crypto.randomUUID(),
      userId,
      await hashVerificationCode(linkCode),
      now,
      minutesFromNow(registrationTtlMinutes),
      purpose,
    )
    .run();

  return linkCode;
}

export async function findTelegramLinkRequestByCode(db: D1Database, linkCode: string) {
  await ensureAccountFlowSchema(db);

  return db
    .prepare(
      `SELECT id, user_id, expires_at, COALESCE(purpose, 'account') AS purpose
       FROM telegram_link_requests
       WHERE link_code_hash = ?1 AND consumed_at IS NULL
       LIMIT 1`,
    )
    .bind(await hashVerificationCode(linkCode))
    .first<{
      expires_at: string;
      id: string;
      purpose: TelegramLinkPurpose;
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
  await ensureAccountFlowSchema(db);

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

export async function createPhoneVerificationCode(db: D1Database, userId: string) {
  await cleanupExpiredAccountFlows(db);

  const code = createOtpCode();
  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE telegram_links
       SET verification_code_hash = ?1,
           verification_code_sent_at = ?2,
           updated_at = ?2
       WHERE user_id = ?3`,
    )
    .bind(await hashVerificationCode(code), now, userId)
    .run();

  return code;
}

export async function verifyPhoneVerificationCode(
  db: D1Database,
  input: {
    code: string;
    userId: string;
  },
) {
  const link = await getTelegramLinkForUser(db, input.userId);

  if (!link) {
    throw {
      message: "Apri prima il bot Telegram per ricevere il codice.",
      status: 409,
    };
  }

  if (!link.verification_code_hash) {
    throw {
      message: "Richiedi prima un codice OTP su Telegram.",
      status: 409,
    };
  }

  if (!link.verification_code_sent_at) {
    throw {
      message: "Codice OTP non disponibile. Richiedine uno nuovo.",
      status: 409,
    };
  }

  const sentAt = Date.parse(link.verification_code_sent_at);
  if (Number.isNaN(sentAt) || sentAt + registrationTtlMinutes * 60_000 <= Date.now()) {
    throw {
      message: "Codice OTP scaduto. Richiedine uno nuovo.",
      status: 410,
    };
  }

  if ((await hashVerificationCode(input.code)) !== link.verification_code_hash) {
    throw {
      message: "Codice OTP non valido.",
      status: 400,
    };
  }

  const now = new Date().toISOString();

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
