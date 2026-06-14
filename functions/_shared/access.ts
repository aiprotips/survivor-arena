/// <reference types="@cloudflare/workers-types" />

import { json } from "./http";
import { getSessionUser } from "./session";
import type { PublicUser } from "./users";

export type AuthenticatedUser = PublicUser;

export async function requireUser(db: D1Database, request: Request) {
  const session = await getSessionUser(db, request);

  if (!session) {
    return {
      response: json(
        {
          message: "Sessione non valida.",
          ok: false,
        },
        { status: 401 },
      ),
      user: null,
    };
  }

  return {
    response: null,
    user: session.user,
  };
}

export async function requireAdmin(db: D1Database, request: Request) {
  const auth = await requireUser(db, request);

  if (!auth.user) {
    return auth;
  }

  if (auth.user.role !== "admin") {
    return {
      response: json(
        {
          message: "Accesso admin richiesto.",
          ok: false,
        },
        { status: 403 },
      ),
      user: null,
    };
  }

  return auth;
}
