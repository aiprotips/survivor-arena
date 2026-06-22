/// <reference types="@cloudflare/workers-types" />

import { hashPassword } from "./crypto";
import { ensureAdminControlSchema } from "./admin-control-schema";

export type UserRecord = {
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string;
  email: string;
  id: string;
  last_login_at: string | null;
  password_hash: string;
  phone: string;
  role: "user" | "admin";
  status: "active" | "blocked";
  updated_at: string;
  user_code: string;
  username: string;
};

export type PublicUser = {
  blocked_at: string | null;
  blocked_reason: string | null;
  email: string;
  id: string;
  phone: string;
  role: "user" | "admin";
  status: "active" | "blocked";
  user_code: string;
  username: string;
};

export type CreateUserInput = {
  email: string;
  password: string;
  phone: string;
  username: string;
};

export type CreateUserWithHashInput = {
  email: string;
  passwordHash: string;
  phone: string;
  username: string;
};

const userCodeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function createUserCodeSuffix() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));

  return Array.from(
    bytes,
    (byte) => userCodeAlphabet[byte % userCodeAlphabet.length],
  ).join("");
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    blocked_at: user.blocked_at,
    blocked_reason: user.blocked_reason,
    email: user.email,
    id: user.id,
    phone: user.phone,
    role: user.role,
    status: user.status,
    user_code: user.user_code,
    username: user.username,
  };
}

export async function findUserByIdentifier(db: D1Database, identifier: string) {
  await ensureAdminControlSchema(db);

  return db
    .prepare(
      `SELECT id, user_code, username, email, phone, password_hash, role,
        COALESCE(status, 'active') AS status, blocked_at, blocked_reason,
        created_at, updated_at, last_login_at
       FROM users
       WHERE email = ?1 OR username = ?1
       LIMIT 1`,
    )
    .bind(identifier)
    .first<UserRecord>();
}

export async function findUserByUniqueFields(
  db: D1Database,
  input: Pick<CreateUserInput, "email" | "phone" | "username">,
) {
  return db
    .prepare(
      `SELECT username, email, phone
       FROM users
       WHERE username = ?1 OR email = ?2 OR phone = ?3
       LIMIT 1`,
    )
    .bind(input.username, input.email, input.phone)
    .first<Pick<UserRecord, "email" | "phone" | "username">>();
}

async function createUniqueUserCode(db: D1Database) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `SA-${createUserCodeSuffix()}`;
    const existing = await db
      .prepare("SELECT id FROM users WHERE user_code = ? LIMIT 1")
      .bind(code)
      .first<{ id: string }>();

    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to generate a unique user code.");
}

export async function createUser(db: D1Database, input: CreateUserInput) {
  return createUserWithPasswordHash(db, {
    email: input.email,
    passwordHash: await hashPassword(input.password),
    phone: input.phone,
    username: input.username,
  });
}

export async function createUserWithPasswordHash(
  db: D1Database,
  input: CreateUserWithHashInput,
) {
  const now = new Date().toISOString();
  const user: Omit<UserRecord, "last_login_at" | "password_hash" | "role"> & {
    password_hash: string;
    role: "user";
  } = {
    blocked_at: null,
    blocked_reason: null,
    created_at: now,
    email: input.email,
    id: crypto.randomUUID(),
    password_hash: input.passwordHash,
    phone: input.phone,
    role: "user",
    status: "active",
    updated_at: now,
    user_code: await createUniqueUserCode(db),
    username: input.username,
  };

  await db
    .prepare(
      `INSERT INTO users (
        id, user_code, username, email, phone, password_hash, role, created_at, updated_at, last_login_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULL)`,
    )
    .bind(
      user.id,
      user.user_code,
      user.username,
      user.email,
      user.phone,
      user.password_hash,
      user.role,
      user.created_at,
      user.updated_at,
    )
    .run();

  return {
    created_at: user.created_at,
    email: user.email,
    id: user.id,
    last_login_at: null,
    password_hash: user.password_hash,
    phone: user.phone,
    role: user.role,
    status: user.status,
    updated_at: user.updated_at,
    user_code: user.user_code,
    username: user.username,
    blocked_at: user.blocked_at,
    blocked_reason: user.blocked_reason,
  } satisfies UserRecord;
}

export async function findUserById(db: D1Database, userId: string) {
  await ensureAdminControlSchema(db);

  return db
    .prepare(
      `SELECT id, user_code, username, email, phone, password_hash, role,
        COALESCE(status, 'active') AS status, blocked_at, blocked_reason,
        created_at, updated_at, last_login_at
       FROM users
       WHERE id = ?1
       LIMIT 1`,
    )
    .bind(userId)
    .first<UserRecord>();
}

export async function findUserByResetIdentifier(db: D1Database, identifier: string) {
  await ensureAdminControlSchema(db);

  return db
    .prepare(
      `SELECT id, user_code, username, email, phone, password_hash, role,
        COALESCE(status, 'active') AS status, blocked_at, blocked_reason,
        created_at, updated_at, last_login_at
       FROM users
       WHERE email = ?1 OR username = ?1 OR phone = ?1
       LIMIT 1`,
    )
    .bind(identifier)
    .first<UserRecord>();
}

export async function findUserByUsernameAndPhone(
  db: D1Database,
  input: {
    phone: string;
    username: string;
  },
) {
  await ensureAdminControlSchema(db);

  return db
    .prepare(
      `SELECT id, user_code, username, email, phone, password_hash, role,
        COALESCE(status, 'active') AS status, blocked_at, blocked_reason,
        created_at, updated_at, last_login_at
       FROM users
       WHERE username = ?1 AND phone = ?2
       LIMIT 1`,
    )
    .bind(input.username, input.phone)
    .first<UserRecord>();
}

export async function updateUserProfile(
  db: D1Database,
  input: {
    email: string;
    phone: string;
    userId: string;
    username: string;
  },
) {
  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE users
       SET username = ?1, email = ?2, phone = ?3, updated_at = ?4
       WHERE id = ?5`,
    )
    .bind(input.username, input.email, input.phone, now, input.userId)
    .run();

  return findUserById(db, input.userId);
}

export async function updateUserPassword(
  db: D1Database,
  input: {
    password: string;
    userId: string;
  },
) {
  const now = new Date().toISOString();

  await db
    .prepare("UPDATE users SET password_hash = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(await hashPassword(input.password), now, input.userId)
    .run();
}

export async function deleteUserSessions(db: D1Database, userId: string) {
  await db
    .prepare("DELETE FROM user_sessions WHERE user_id = ?1")
    .bind(userId)
    .run();
}

export async function updateLastLogin(db: D1Database, userId: string) {
  const now = new Date().toISOString();

  await db
    .prepare("UPDATE users SET last_login_at = ?1, updated_at = ?1 WHERE id = ?2")
    .bind(now, userId)
    .run();
}

export async function setUserAccessStatus(
  db: D1Database,
  input: {
    reason?: string;
    status: "active" | "blocked";
    userId: string;
  },
) {
  await ensureAdminControlSchema(db);

  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE users
       SET status = ?1,
           blocked_at = ?2,
           blocked_reason = ?3,
           updated_at = ?4
       WHERE id = ?5`,
    )
    .bind(
      input.status,
      input.status === "blocked" ? now : null,
      input.status === "blocked" ? input.reason?.trim() || null : null,
      now,
      input.userId,
    )
    .run();

  if (input.status === "blocked") {
    await deleteUserSessions(db, input.userId);
  }

  return findUserById(db, input.userId);
}
