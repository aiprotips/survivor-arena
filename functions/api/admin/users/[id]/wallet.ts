/// <reference types="@cloudflare/workers-types" />

import {
  changeWalletBalance,
  getArenaError,
  getWalletBalance,
  listUserMovements,
} from "../../../../_shared/arena";
import { requireAdmin } from "../../../../_shared/access";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../../_shared/http";
import { findUserById } from "../../../../_shared/users";

type Env = {
  DB: D1Database;
};

function getId(params: { id?: string | string[] }) {
  const value = params.id;

  return Array.isArray(value) ? value[0] : value;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, params, request }) => {
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
  const amount = Number(body?.amount ?? 0);
  const reason = String(body?.reason ?? "").trim();

  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount === 0) {
    return json(
      {
        message: "Inserisci un importo intero diverso da zero.",
        ok: false,
      },
      { status: 400 },
    );
  }

  try {
    const description = `${amount > 0 ? "Deposito" : "Prelievo"} admin${reason ? `: ${reason}` : ""}`;

    await changeWalletBalance(env.DB, {
      amount,
      description,
      movementType: "ADMIN_ADJUSTMENT",
      userId: target.id,
    });

    return json({
      balance: await getWalletBalance(env.DB, target.id),
      movements: await listUserMovements(env.DB, target.id),
      ok: true,
    });
  } catch (error) {
    const arenaError = getArenaError(error, "Operazione saldo non riuscita.");

    return json(
      {
        message: arenaError.message,
        ok: false,
      },
      { status: arenaError.status },
    );
  }
};

export const onRequestGet = methodNotAllowed;
export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
