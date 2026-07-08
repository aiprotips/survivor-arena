import type { CSSProperties } from "react";

export type AdminImageSectionKey =
  | "welcome"
  | "tournament"
  | "quickJoin"
  | "quickCreate"
  | "siteBackground"
  | "publicHomeHero"
  | "publicHomePrivate"
  | "publicHomeFinal"
  | "publicArenasHero"
  | "publicArenasPrivate"
  | "publicArenasFinal";

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
  publicHome: [
    { id: "public-home-hero-trophy", label: "Home hero trofeo", src: "/assets/dashboard-hero-trophy.png" },
    { id: "public-home-private-banners", label: "Home arene private", src: "/assets/dashboard-hero-banners.png" },
    { id: "public-home-final-stadium", label: "Home CTA stadio", src: "/assets/dashboard-hero-stadium.png" },
  ],
  publicArenas: [
    { id: "public-arenas-hero-banners", label: "Arene hero ingresso", src: "/assets/dashboard-hero-banners.png" },
    { id: "public-arenas-private-tunnel", label: "Arene private tunnel", src: "/assets/dashboard-hero-tunnel.png" },
    { id: "public-arenas-final-trophy", label: "Arene CTA trofeo", src: "/assets/dashboard-hero-trophy.png" },
  ],
};

function prioritizeAsset(assets: AdminImageAsset[], assetId: string) {
  const selected = assets.find((asset) => asset.id === assetId);

  return selected ? [selected, ...assets.filter((asset) => asset.id !== assetId)] : assets;
}

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
  publicHomeHero: {
    defaultBehavior: "fixed",
    defaultOpacity: 94,
    defaultPosition: "center center",
    defaultZoom: 100,
    staticAssets: [
      ...prioritizeAsset(projectImageAssets.publicHome, "public-home-hero-trophy"),
      ...projectImageAssets.dashboard,
      ...projectImageAssets.arena,
    ],
  },
  publicHomePrivate: {
    defaultBehavior: "fixed",
    defaultOpacity: 74,
    defaultPosition: "center center",
    defaultZoom: 100,
    staticAssets: [
      ...prioritizeAsset(projectImageAssets.publicHome, "public-home-private-banners"),
      ...projectImageAssets.dashboard,
      ...projectImageAssets.arena,
    ],
  },
  publicHomeFinal: {
    defaultBehavior: "fixed",
    defaultOpacity: 78,
    defaultPosition: "center center",
    defaultZoom: 100,
    staticAssets: [
      ...prioritizeAsset(projectImageAssets.publicHome, "public-home-final-stadium"),
      ...projectImageAssets.dashboard,
      ...projectImageAssets.arena,
    ],
  },
  publicArenasHero: {
    defaultBehavior: "fixed",
    defaultOpacity: 92,
    defaultPosition: "center center",
    defaultZoom: 100,
    staticAssets: [
      ...prioritizeAsset(projectImageAssets.publicArenas, "public-arenas-hero-banners"),
      ...projectImageAssets.dashboard,
      ...projectImageAssets.arena,
    ],
  },
  publicArenasPrivate: {
    defaultBehavior: "fixed",
    defaultOpacity: 76,
    defaultPosition: "center center",
    defaultZoom: 100,
    staticAssets: [
      ...prioritizeAsset(projectImageAssets.publicArenas, "public-arenas-private-tunnel"),
      ...projectImageAssets.dashboard,
      ...projectImageAssets.arena,
    ],
  },
  publicArenasFinal: {
    defaultBehavior: "fixed",
    defaultOpacity: 78,
    defaultPosition: "center center",
    defaultZoom: 100,
    staticAssets: [
      ...prioritizeAsset(projectImageAssets.publicArenas, "public-arenas-final-trophy"),
      ...projectImageAssets.dashboard,
      ...projectImageAssets.arena,
    ],
  },
};

const imageSectionKeys = Object.keys(imageSectionDefaults) as AdminImageSectionKey[];

export function createDefaultImageState(): HydratedAdminImageSettings {
  return imageSectionKeys.reduce(
    (state, key) => {
      const section = imageSectionDefaults[key];
      const defaultAssetId = key === "quickJoin" || key === "quickCreate" ? "" : (section.staticAssets[0]?.id ?? "");

      return {
        ...state,
        [key]: {
          behavior: section.defaultBehavior,
          customAssets: [],
          hiddenAssetIds: [],
          objectPosition: section.defaultPosition,
          opacity: section.defaultOpacity,
          selectedAssetId: defaultAssetId,
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

function cleanString(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

function normalizeAssetId(value: unknown) {
  const id = cleanString(value, 80);

  return /^[A-Za-z0-9_-]+$/.test(id) ? id : "";
}

function normalizeImageSrc(value: unknown) {
  const src = cleanString(value, 240);

  if (
    !src.startsWith("/assets/") ||
    src.includes("..") ||
    src.includes("//") ||
    /["'\\\s]/.test(src) ||
    !/\.(avif|gif|jpe?g|png|svg|webp)$/i.test(src)
  ) {
    return "";
  }

  return src;
}

function normalizeObjectPosition(value: unknown, fallback: string) {
  const position = cleanString(value, 48);

  return /^[A-Za-z0-9.% -]+$/.test(position) ? position : fallback;
}

function toSavedAsset(asset: unknown): AdminImageAsset | null {
  if (!asset || typeof asset !== "object") {
    return null;
  }

  const candidate = asset as Partial<AdminImageAsset>;
  const id = normalizeAssetId(candidate.id);
  const label = cleanString(candidate.label, 80);
  const src = normalizeImageSrc(candidate.src);

  if (!id || label.length < 1 || !src) {
    return null;
  }

  return {
    id,
    label,
    local: candidate.local === true,
    src,
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

  if (key === "quickJoin" || key === "quickCreate") {
    return assets.find((asset) => asset.id === state.selectedAssetId);
  }

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
      ? saved.hiddenAssetIds
        .map(normalizeAssetId)
        .filter(Boolean)
      : [];
    const selectedAssetId = normalizeAssetId(saved?.selectedAssetId);
    const sectionState: AdminImageSectionState = {
      behavior: isAdminImageBehavior(saved?.behavior) ? saved.behavior : defaults[key].behavior,
      customAssets,
      hiddenAssetIds,
      objectPosition: normalizeObjectPosition(saved?.objectPosition, defaults[key].objectPosition),
      opacity: typeof saved?.opacity === "number" ? Math.min(100, Math.max(0, saved.opacity)) : defaults[key].opacity,
      selectedAssetId: selectedAssetId || defaults[key].selectedAssetId,
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
    [`--${prefix}-bg`]: image.asset ? `url("${image.asset.src}")` : "linear-gradient(135deg, transparent, transparent)",
    [`--${prefix}-bg-opacity`]: String(image.state.opacity / 100),
    [`--${prefix}-bg-position`]: image.state.objectPosition,
    [`--${prefix}-bg-size`]: `${image.state.zoom}%`,
  } as CSSProperties;
}
