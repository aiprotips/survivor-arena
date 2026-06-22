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
  phone_verified_at: string | null;
  role: "admin" | "user";
  status: "active" | "blocked";
  telegram_username: string | null;
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
        u.id,
        u.user_code,
        u.username,
        u.email,
        u.phone,
        u.role,
        COALESCE(u.status, 'active') AS status,
        u.blocked_at,
        u.blocked_reason,
        u.created_at,
        u.updated_at,
        u.last_login_at,
        tl.phone_verified_at,
        tl.telegram_username
       FROM users u
       LEFT JOIN telegram_links tl ON tl.user_id = u.id
       WHERE ?1 = '%%'
          OR u.username LIKE ?1
          OR u.email LIKE ?1
          OR u.phone LIKE ?1
          OR u.user_code LIKE ?1
          OR tl.telegram_username LIKE ?1
       ORDER BY u.created_at DESC
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
