/// <reference types="@cloudflare/workers-types" />

import { hydrateImageSettings, type AdminImageSettings } from "../../src/lib/image-settings";
import { ensurePlatformSchema } from "./platform";

export const IMAGE_SETTINGS_KEY = "admin_image_settings";

const MAX_SETTINGS_BYTES = 48_000;

export async function getStoredImageSettings(db: D1Database) {
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

export async function saveStoredImageSettings(db: D1Database, settings: Record<string, unknown>) {
  await ensurePlatformSchema(db);

  const sanitizedSettings = hydrateImageSettings(settings as AdminImageSettings);
  const value = JSON.stringify(sanitizedSettings);
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

  return sanitizedSettings;
}
