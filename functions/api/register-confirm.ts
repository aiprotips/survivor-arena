/// <reference types="@cloudflare/workers-types" />

import { confirmPendingRegistration } from "../_shared/account-flows";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../_shared/http";

type Env = {
  DB: D1Database;
};

function getFlowError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    "status" in error
  ) {
    return error as {
      message: string;
      status: number;
    };
  }

  return {
    message: "Conferma registrazione non riuscita. Riprova tra poco.",
    status: 500,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const body = await readJsonObject(request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  try {
    const user = await confirmPendingRegistration(env.DB, {
      otpCode: String(body.otpCode ?? ""),
      registrationId: String(body.registrationId ?? ""),
    });

    return json({ ok: true, user }, { status: 201 });
  } catch (error) {
    const flowError = getFlowError(error);

    return json(
      {
        message: flowError.message,
        ok: false,
      },
      { status: flowError.status },
    );
  }
};

export const onRequestGet = methodNotAllowed;
