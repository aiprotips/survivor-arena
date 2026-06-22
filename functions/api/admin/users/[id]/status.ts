/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../../_shared/access";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../../_shared/http";
import { findUserById, setUserAccessStatus, toPublicUser } from "../../../../_shared/users";

type Env = {
  DB: D1Database;
};

function getId(params: { id?: string | string[] }) {
  const value = params.id;

  return Array.isArray(value) ? value[0] : value;
}

export const onRequestPatch: PagesFunction<Env> = async ({ env, params, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const userId = getId(params);
  const target = userId ? await findUserById(env.DB, userId) : null;
  if (!target) {
    return json({ message: "Utente non trovato.", ok: false }, { status: 404 });
  }

  const body = await readJsonObject(request);
  const status = String(body?.status ?? "");
  if (status !== "active" && status !== "blocked") {
    return json({ message: "Stato utente non valido.", ok: false }, { status: 400 });
  }

  if (target.id === auth.user.id && status === "blocked") {
    return json(
      {
        message: "Non puoi bloccare il tuo stesso account admin.",
        ok: false,
      },
      { status: 409 },
    );
  }

  const updated = await setUserAccessStatus(env.DB, {
    reason: String(body?.reason ?? ""),
    status,
    userId: target.id,
  });

  if (!updated) {
    return json({ message: "Utente non aggiornato.", ok: false }, { status: 404 });
  }

  return json({
    ok: true,
    user: toPublicUser(updated),
  });
};

export const onRequestGet = methodNotAllowed;
export const onRequestPost = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
