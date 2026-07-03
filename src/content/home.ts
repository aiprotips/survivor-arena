export const heroImages = {
  desktop: "/assets/hero-desktop.jpg",
  mobile: "/assets/hero-mobile.jpg",
} as const;

export type PublicHomeImageSlot = {
  alt: string;
  objectPosition: string;
  opacity: number;
  src: string;
};

export const publicHomeImages = {
  hero: {
    alt: "Trofeo dorato in uno stadio illuminato.",
    objectPosition: "center center",
    opacity: 0.94,
    src: "/assets/dashboard-hero-trophy.png",
  },
  privateArena: {
    alt: "Ingresso premium di una arena privata.",
    objectPosition: "center center",
    opacity: 0.74,
    src: "/assets/dashboard-hero-banners.png",
  },
  finalCta: {
    alt: "Arena notturna pronta per la sfida finale.",
    objectPosition: "center center",
    opacity: 0.78,
    src: "/assets/dashboard-hero-stadium.png",
  },
} as const;

export const howItWorksSteps = [
  {
    copy: "Apri una sfida privata e prepara il campo per il tuo gruppo.",
    icon: "users",
    number: "01",
    title: "Crea la tua Arena",
  },
  {
    copy: "Condividi l'invito e porta dentro solo chi vuoi davvero sfidare.",
    icon: "trophy",
    number: "02",
    title: "Invita gli amici",
  },
  {
    copy: "Ogni round conta. Una scelta alla volta, fino all'ultimo rimasto.",
    icon: "crown",
    number: "03",
    title: "Sopravvivi",
  },
] as const;

export const homeStats = [
  {
    icon: "trophy",
    label: "Arene create",
    value: "2.453",
  },
  {
    icon: "users",
    label: "Utenti",
    value: "18.752",
  },
  {
    icon: "zap",
    label: "Round giocati",
    value: "236.812",
  },
  {
    icon: "crown",
    label: "Competizioni concluse",
    value: "5.981",
  },
] as const;

export const tournaments = [
  {
    title: "Arena Champions",
    highlight: "Facsimile torneo",
    highlightLabel: "Anteprima",
    status: "Demo",
    image: "/assets/gold-trophy-arena.jpg",
  },
  {
    title: "Survivor Cup",
    highlight: "Apertura demo",
    highlightLabel: "Anteprima",
    status: "In arrivo",
    image: "/assets/gold-trophy-arena.jpg",
  },
  {
    title: "Legends Arena",
    highlight: "Invito demo",
    highlightLabel: "Anteprima",
    status: "In arrivo",
    image: "/assets/gold-trophy-arena.jpg",
  },
] as const;
