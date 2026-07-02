/// <reference types="@cloudflare/workers-types" />

import { requireAdmin } from "../../../_shared/access";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../_shared/http";
import { ensurePlatformSchema } from "../../../_shared/platform";

type Env = {
  DB: D1Database;
};

const IMAGE_SETTINGS_KEY = "admin_image_settings";
const MAX_SETTINGS_BYTES = 48_000;

async function getImageSettings(db: D1Database) {
  await ensurePlatformSchema(db);

  const row = await db
    .prepare("SELECT value FROM app_settings WHERE key = ?1 LIMIT 1")
    .bind(IMAGE_SETTINGS_KEY)
    .first<{ value: string }>();

  if (!row?.value) {
    return null;
  }

  try {
    return JSON.parse(row.value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function saveImageSettings(db: D1Database, settings: Record<string, unknown>) {
  await ensurePlatformSchema(db);

  const value = JSON.stringify(settings);
  if (value.length > MAX_SETTINGS_BYTES) {
    throw new Error("Configurazione immagini troppo grande.");
  }

  await db
    .prepare(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(IMAGE_SETTINGS_KEY, value, new Date().toISOString())
    .run();

  return settings;
}

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
    settings: await getImageSettings(env.DB),
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
    const savedSettings = await saveImageSettings(env.DB, settings as Record<string, unknown>);

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
