/// <reference types="@cloudflare/workers-types" />

import { verifyPhoneVerificationCode } from "../../_shared/account-flows";
import { requireUser } from "../../_shared/access";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../_shared/http";

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
    message: "Verifica Telegram non riuscita. Riprova tra poco.",
    status: 500,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  const code = String(body?.code ?? body?.otpCode ?? "").trim();

  if (!code) {
    return json(
      {
        field: "code",
        message: "Inserisci il codice OTP ricevuto su Telegram.",
        ok: false,
      },
      { status: 400 },
    );
  }

  try {
    await verifyPhoneVerificationCode(env.DB, {
      code,
      userId: auth.user.id,
    });

    return json({
      message: "Account verificato correttamente.",
      ok: true,
    });
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
