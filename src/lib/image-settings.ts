import type { CSSProperties } from "react";

export type AdminImageSectionKey =
  | "welcome"
  | "tournament"
  | "quickJoin"
  | "quickCreate"
  | "siteBackground";

export type AdminImageBehavior = "fixed" | "randomOnCreate" | "rotate";

export type AdminImageAsset = {
  id: string;
  label: string;
  local?: boolean;
  src: string;
};

export type AdminImageSectionState = {
  behavior: AdminImageBehavior;
  customAssets: AdminImageAsset[];
  hiddenAssetIds: string[];
  objectPosition: string;
  opacity: number;
  selectedAssetId: string;
  zoom: number;
};

export type AdminImageSettings = Partial<Record<AdminImageSectionKey, Partial<AdminImageSectionState>>>;

export type HydratedAdminImageSettings = Record<AdminImageSectionKey, AdminImageSectionState>;

type ImageSectionDefaults = {
  defaultBehavior: AdminImageBehavior;
  defaultOpacity: number;
  defaultPosition: string;
  defaultZoom: number;
  staticAssets: AdminImageAsset[];
};

export const projectImageAssets: Record<string, AdminImageAsset[]> = {
  action: [
    { id: "action-logo", label: "Emblema Survivor", src: "/assets/survivor-arena-logo.png" },
    { id: "action-trophy", label: "Trofeo arena", src: "/assets/gold-trophy-arena.jpg" },
    { id: "action-stadium", label: "Stadio premium", src: "/assets/arena-stadium.jpg" },
  ],
  arena: [
    { id: "arena-stadium", label: "Stadio premium", src: "/assets/arena-stadium.jpg" },
    { id: "arena-trophy", label: "Trofeo arena", src: "/assets/gold-trophy-arena.jpg" },
    { id: "arena-hero", label: "Hero Survivor", src: "/assets/survivor-arena-hero.jpg" },
    { id: "arena-desktop", label: "Hero desktop", src: "/assets/hero-desktop.jpg" },
  ],
  dashboard: [
    { id: "welcome-banners", label: "Ingresso arena", src: "/assets/dashboard-hero-banners.png" },
    { id: "welcome-trophy", label: "Trofeo centrale", src: "/assets/dashboard-hero-trophy.png" },
    { id: "welcome-tunnel", label: "Tunnel arena", src: "/assets/dashboard-hero-tunnel.png" },
    { id: "welcome-stadium", label: "Stadio aperto", src: "/assets/dashboard-hero-stadium.png" },
  ],
};

export const imageSectionDefaults: Record<AdminImageSectionKey, ImageSectionDefaults> = {
  quickCreate: {
    defaultBehavior: "fixed",
    defaultOpacity: 38,
    defaultPosition: "center center",
    defaultZoom: 115,
    staticAssets: [...projectImageAssets.action, ...projectImageAssets.dashboard],
  },
  quickJoin: {
    defaultBehavior: "fixed",
    defaultOpacity: 34,
    defaultPosition: "center center",
    defaultZoom: 115,
    staticAssets: [...projectImageAssets.action, ...projectImageAssets.dashboard],
  },
  siteBackground: {
    defaultBehavior: "fixed",
    defaultOpacity: 18,
    defaultPosition: "center center",
    defaultZoom: 100,
    staticAssets: [...projectImageAssets.arena, ...projectImageAssets.dashboard],
  },
  tournament: {
    defaultBehavior: "randomOnCreate",
    defaultOpacity: 78,
    defaultPosition: "center center",
    defaultZoom: 108,
    staticAssets: [...projectImageAssets.arena, ...projectImageAssets.dashboard],
  },
  welcome: {
    defaultBehavior: "rotate",
    defaultOpacity: 82,
    defaultPosition: "center center",
    defaultZoom: 100,
    staticAssets: projectImageAssets.dashboard,
  },
};

const imageSectionKeys = Object.keys(imageSectionDefaults) as AdminImageSectionKey[];

export function createDefaultImageState(): HydratedAdminImageSettings {
  return imageSectionKeys.reduce(
    (state, key) => {
      const section = imageSectionDefaults[key];

      return {
        ...state,
        [key]: {
          behavior: section.defaultBehavior,
          customAssets: [],
          hiddenAssetIds: [],
          objectPosition: section.defaultPosition,
          opacity: section.defaultOpacity,
          selectedAssetId: section.staticAssets[0]?.id ?? "",
          zoom: section.defaultZoom,
        },
      };
    },
    {} as HydratedAdminImageSettings,
  );
}

export function isAdminImageBehavior(value: unknown): value is AdminImageBehavior {
  return value === "fixed" || value === "randomOnCreate" || value === "rotate";
}

function toSavedAsset(asset: unknown): AdminImageAsset | null {
  if (!asset || typeof asset !== "object") {
    return null;
  }

  const candidate = asset as Partial<AdminImageAsset>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.label !== "string" ||
    typeof candidate.src !== "string" ||
    !candidate.src.startsWith("/")
  ) {
    return null;
  }

  return {
    id: candidate.id,
    label: candidate.label,
    local: candidate.local === true,
    src: candidate.src,
  };
}

export function getSectionAssets(key: AdminImageSectionKey, state: AdminImageSectionState) {
  const section = imageSectionDefaults[key];

  return [
    ...section.staticAssets.filter((asset) => !state.hiddenAssetIds.includes(asset.id)),
    ...state.customAssets.filter((asset) => !asset.local),
  ];
}

export function getSelectedImageAsset(key: AdminImageSectionKey, state: AdminImageSectionState) {
  const assets = getSectionAssets(key, state);

  return assets.find((asset) => asset.id === state.selectedAssetId) ?? assets[0] ?? imageSectionDefaults[key].staticAssets[0];
}

export function hydrateImageSettings(settings: AdminImageSettings | null): HydratedAdminImageSettings {
  const defaults = createDefaultImageState();

  if (!settings) {
    return defaults;
  }

  return imageSectionKeys.reduce((state, key) => {
    const saved = settings[key];
    const customAssets = Array.isArray(saved?.customAssets)
      ? saved.customAssets.map(toSavedAsset).filter((asset): asset is AdminImageAsset => Boolean(asset))
      : [];
    const hiddenAssetIds = Array.isArray(saved?.hiddenAssetIds)
      ? saved.hiddenAssetIds.filter((assetId): assetId is string => typeof assetId === "string")
      : [];
    const sectionState: AdminImageSectionState = {
      behavior: isAdminImageBehavior(saved?.behavior) ? saved.behavior : defaults[key].behavior,
      customAssets,
      hiddenAssetIds,
      objectPosition: typeof saved?.objectPosition === "string" ? saved.objectPosition : defaults[key].objectPosition,
      opacity: typeof saved?.opacity === "number" ? Math.min(100, Math.max(0, saved.opacity)) : defaults[key].opacity,
      selectedAssetId: typeof saved?.selectedAssetId === "string" ? saved.selectedAssetId : defaults[key].selectedAssetId,
      zoom: typeof saved?.zoom === "number" ? Math.min(160, Math.max(100, saved.zoom)) : defaults[key].zoom,
    };
    const selectedAsset = getSelectedImageAsset(key, sectionState);

    return {
      ...state,
      [key]: {
        ...sectionState,
        selectedAssetId: selectedAsset?.id ?? defaults[key].selectedAssetId,
      },
    };
  }, defaults);
}

export function getImageRotationAssets(settings: HydratedAdminImageSettings, key: AdminImageSectionKey) {
  const state = settings[key];

  if (state.behavior === "fixed") {
    return [getSelectedImageAsset(key, state)].filter((asset): asset is AdminImageAsset => Boolean(asset));
  }

  return getSectionAssets(key, state);
}

function stableIndex(seed: string, total: number) {
  if (total <= 1) {
    return 0;
  }

  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) % total;
}

export function getImageForSection(
  settings: HydratedAdminImageSettings,
  key: AdminImageSectionKey,
  seed: string = key,
) {
  const state = settings[key];
  const assets = getImageRotationAssets(settings, key);

  if (state.behavior === "fixed") {
    return {
      asset: getSelectedImageAsset(key, state),
      state,
    };
  }

  return {
    asset: assets[stableIndex(seed, assets.length)] ?? getSelectedImageAsset(key, state),
    state,
  };
}

export function getImageCssVariables(
  prefix: string,
  image: ReturnType<typeof getImageForSection>,
) {
  return {
    [`--${prefix}-bg`]: `url("${image.asset?.src ?? "/assets/arena-stadium.jpg"}")`,
    [`--${prefix}-bg-opacity`]: String(image.state.opacity / 100),
    [`--${prefix}-bg-position`]: image.state.objectPosition,
    [`--${prefix}-bg-size`]: `${image.state.zoom}%`,
  } as CSSProperties;
}
