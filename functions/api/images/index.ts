/// <reference types="@cloudflare/workers-types" />

import { getStoredImageSettings } from "../../_shared/image-settings";
import { json, missingDatabase } from "../../_shared/http";

type Env = {
  DB: D1Database;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  return json({
    ok: true,
    settings: await getStoredImageSettings(env.DB),
  });
};
