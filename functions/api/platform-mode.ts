/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../_shared/access";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../_shared/http";
import { getPlatformMode, parsePlatformMode, setPlatformMode } from "../_shared/platform";

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  return json({
    mode: await getPlatformMode(env.DB),
    ok: true,
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  const mode = parsePlatformMode(body?.mode);

  if (!mode) {
    return json({ message: "Modalità non valida.", ok: false }, { status: 400 });
  }

  return json({
    mode: await setPlatformMode(env.DB, mode),
    ok: true,
  });
};

export const onRequestPatch = onRequestPost;
export const onRequestDelete = methodNotAllowed;
