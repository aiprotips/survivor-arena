/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../_shared/access";
import { getWalletBalance } from "../../../_shared/arena";
import { json, methodNotAllowed, missingDatabase } from "../../../_shared/http";

type Env = {
  DB: D1Database;
};

type AdminUserRow = {
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string;
  email: string;
  id: string;
  last_login_at: string | null;
  phone: string;
  role: "admin" | "user";
  status: "active" | "blocked";
  updated_at: string;
  user_code: string;
  username: string;
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const filter = `%${query}%`;
  const rows = await env.DB
    .prepare(
      `SELECT
        id,
        user_code,
        username,
        email,
        phone,
        role,
        COALESCE(status, 'active') AS status,
        blocked_at,
        blocked_reason,
        created_at,
        updated_at,
        last_login_at
       FROM users
       WHERE ?1 = '%%'
          OR username LIKE ?1
          OR email LIKE ?1
          OR phone LIKE ?1
          OR user_code LIKE ?1
       ORDER BY created_at DESC
       LIMIT 1000`,
    )
    .bind(filter)
    .all<AdminUserRow>();

  const users = await Promise.all(
    (rows.results ?? []).map(async (user) => ({
      ...user,
      cup_balance: await getWalletBalance(env.DB, user.id),
    })),
  );

  return json({
    ok: true,
    users,
  });
};

export const onRequestPost = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
