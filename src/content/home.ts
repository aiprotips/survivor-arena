export const homeStats = [
  {
    icon: "A",
    label: "Arene attive",
    value: "12",
  },
  {
    icon: "U",
    label: "Utenti attivi",
    value: "8.732",
  },
  {
    icon: "€",
    label: "Montepremi totale",
    value: "€125.000",
  },
  {
    icon: "V",
    label: "Vincitori totali",
    value: "342",
  },
] as const;

export const tournaments = [
  {
    title: "Arena Champions",
    prize: "€25.000",
    participants: "1.245 / 2.000",
    status: "In corso",
    image: "/assets/gold-trophy-arena.jpg",
    buttonLabel: "Partecipa",
  },
  {
    title: "Survivor Cup",
    prize: "€15.000",
    participants: "840 / 1.500",
    status: "In arrivo",
    image: "/assets/arena-stadium.jpg",
    buttonLabel: "Scopri di più",
  },
  {
    title: "Legends Arena",
    prize: "€10.000",
    participants: "520 / 1.000",
    status: "In arrivo",
    image: "/assets/gold-trophy-arena.jpg",
    buttonLabel: "Scopri di più",
  },
] as const;
