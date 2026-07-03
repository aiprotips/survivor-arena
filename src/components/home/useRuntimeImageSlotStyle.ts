"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicHomeImageSlot } from "@/content/home";
import { getPublicHomeImageStyle } from "@/components/home/imageSlotStyle";
import {
  getImageForSection,
  hydrateImageSettings,
  type AdminImageSectionKey,
  type AdminImageSettings,
  type HydratedAdminImageSettings,
} from "@/lib/image-settings";

type ImageSettingsResponse =
  | {
      ok: true;
      settings: AdminImageSettings | null;
    }
  | {
      ok: false;
      message: string;
    };

let cachedImageSettings: HydratedAdminImageSettings | null = null;
let pendingImageSettings: Promise<HydratedAdminImageSettings> | null = null;

async function loadImageSettings() {
  if (cachedImageSettings) {
    return cachedImageSettings;
  }

  pendingImageSettings ??= fetch("/api/images", {
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) {
        return hydrateImageSettings(null);
      }

      const data = (await response.json()) as ImageSettingsResponse;

      return hydrateImageSettings(data.ok ? data.settings : null);
    })
    .catch(() => hydrateImageSettings(null))
    .then((settings) => {
      cachedImageSettings = settings;
      pendingImageSettings = null;

      return settings;
    });

  return pendingImageSettings;
}

export function useRuntimeImageSlotStyle(
  prefix: string,
  sectionKey: AdminImageSectionKey,
  fallback: PublicHomeImageSlot,
  seed = sectionKey,
) {
  const [settings, setSettings] = useState<HydratedAdminImageSettings>(() => cachedImageSettings ?? hydrateImageSettings(null));

  useEffect(() => {
    let isMounted = true;

    loadImageSettings().then((nextSettings) => {
      if (isMounted) {
        setSettings(nextSettings);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(() => {
    const runtimeImage = getImageForSection(settings, sectionKey, seed);

    return getPublicHomeImageStyle(prefix, {
      alt: fallback.alt,
      objectPosition: runtimeImage.state.objectPosition || fallback.objectPosition,
      opacity: runtimeImage.state.opacity / 100,
      src: runtimeImage.asset?.src ?? fallback.src,
      zoom: runtimeImage.state.zoom,
    });
  }, [fallback, prefix, sectionKey, seed, settings]);
}
