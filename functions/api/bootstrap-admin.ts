/// <reference types="@cloudflare/workers-types" />

import { hashPassword } from "../_shared/crypto";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../_shared/http";

type Env = {
  DB: D1Database;
};

const adminUsername = "valenzo";
const userCodeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function createUserCodeSuffix() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));

  return Array.from(
    bytes,
    (byte) => userCodeAlphabet[byte % userCodeAlphabet.length],
  ).join("");
}

async function createUniqueUserCode(db: D1Database) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `SA-${createUserCodeSuffix()}`;
    const existing = await db
      .prepare("SELECT id FROM users WHERE user_code = ?1 LIMIT 1")
      .bind(code)
      .first<{ id: string }>();

    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to generate a unique user code.");
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const body = await readJsonObject(request);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password) {
    return json({ message: "Password mancante.", ok: false }, { status: 400 });
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  const existing = await env.DB
    .prepare("SELECT id, user_code FROM users WHERE username = ?1 LIMIT 1")
    .bind(adminUsername)
    .first<{ id: string; user_code: string }>();

  const userId = existing?.id ?? crypto.randomUUID();
  const userCode = existing?.user_code ?? await createUniqueUserCode(env.DB);

  if (existing) {
    await env.DB
      .prepare(
        `UPDATE users
         SET password_hash = ?1,
             role = 'admin',
             updated_at = ?2
         WHERE id = ?3`,
      )
      .bind(passwordHash, now, userId)
      .run();
  } else {
    await env.DB
      .prepare(
        `INSERT INTO users (
          id, user_code, username, email, phone, password_hash, role, created_at, updated_at, last_login_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'admin', ?7, ?7, NULL)`,
      )
      .bind(
        userId,
        userCode,
        adminUsername,
        `valenzo-admin-${Date.now()}@survivor-arena.com`,
        `+3900${Date.now()}`,
        passwordHash,
        now,
      )
      .run();
  }

  await env.DB
    .prepare("DELETE FROM user_sessions WHERE user_id = ?1")
    .bind(userId)
    .run();

  await env.DB
    .prepare(
      `INSERT OR IGNORE INTO user_wallets (user_id, balance, created_at, updated_at)
       VALUES (?1, 0, ?2, ?2)`,
    )
    .bind(userId, now)
    .run();

  return json({
    ok: true,
    role: "admin",
    user_code: userCode,
    username: adminUsername,
  });
};

export const onRequestGet = methodNotAllowed;
