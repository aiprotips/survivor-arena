export const heroImages = {
  desktop: "/assets/hero-desktop.jpg",
  mobile: "/assets/hero-mobile.jpg",
} as const;

export const homeStats = [
  {
    icon: "trophy",
    label: "Arene Attive",
    value: "12",
  },
  {
    icon: "users",
    label: "Utenti Attivi",
    value: "8.732",
  },
  {
    icon: "prize",
    label: "Coppe in Palio",
    value: "125.000 Coppe",
  },
  {
    icon: "crown",
    label: "Vincitori Totali",
    value: "342",
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
