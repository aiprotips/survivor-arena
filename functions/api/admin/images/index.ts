/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../_shared/access";
import { getStoredImageSettings, saveStoredImageSettings } from "../../../_shared/image-settings";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../_shared/http";

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const auth = await requireAdmin(env.DB, request);
  if (!auth.user) {
    return auth.response;
  }

  return json({
    ok: true,
    settings: await getStoredImageSettings(env.DB),
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
  const settings = body?.settings;

  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return json({ message: "Configurazione immagini non valida.", ok: false }, { status: 400 });
  }

  try {
    const savedSettings = await saveStoredImageSettings(env.DB, settings as Record<string, unknown>);

    return json({
      ok: true,
      settings: savedSettings,
    });
  } catch (error) {
    return json(
      {
        message: error instanceof Error ? error.message : "Impossibile salvare le immagini.",
        ok: false,
      },
      { status: 400 },
    );
  }
};

export const onRequestPatch = methodNotAllowed;
export const onRequestDelete = methodNotAllowed;
