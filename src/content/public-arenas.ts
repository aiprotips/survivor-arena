import type { PublicHomeImageSlot } from "@/content/home";

export const publicArenasImages = {
  finalCta: {
    alt: "Trofeo in uno stadio illuminato per la sfida finale.",
    objectPosition: "center center",
    opacity: 0.78,
    src: "/assets/dashboard-hero-trophy.png",
  },
  hero: {
    alt: "Arena privata con luci blu e oro.",
    objectPosition: "center center",
    opacity: 0.92,
    src: "/assets/dashboard-hero-banners.png",
  },
  privateArena: {
    alt: "Ingresso riservato a una arena privata.",
    objectPosition: "center center",
    opacity: 0.76,
    src: "/assets/dashboard-hero-tunnel.png",
  },
} satisfies Record<string, PublicHomeImageSlot>;

export const arenaHowItWorksSteps = [
  {
    copy: "Scegli nome, regole e numero di round.",
    icon: "shield",
    number: "01",
    title: "Crea la tua Arena",
  },
  {
    copy: "Condividi il link e invita solo chi vuoi tu.",
    icon: "users",
    number: "02",
    title: "Invita i tuoi amici",
  },
  {
    copy: "Decidi deadline, match e modalita di sfida.",
    icon: "calendar",
    number: "03",
    title: "Imposta i round",
  },
  {
    copy: "Gioca, supera gli avversari e resta l'ultimo in vita.",
    icon: "trophy",
    number: "04",
    title: "Diventa il campione",
  },
] as const;

export const arenaPrivatePoints = [
  "Solo amici nella tua arena",
  "Accesso esclusivo",
  "Nessun estraneo, solo competizione vera",
] as const;
