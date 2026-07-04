// Generated from the Serie A Enilive 2026/2027 calendar sources.
// Official calendar PDF: https://images.legaseriea.it/image/private/fl_attachment/prd/blpfycdm1ozusg4otblb.pdf
// Text schedule used for deterministic import: https://www.calciatori-online.com/calcio/20260608-calendario-serie-a-2026-2027.php

export type AutomaticFixtureTeamSeed = {
  active: boolean;
  id: string;
  logoUrl: string;
  name: string;
  shortName: string;
  slug: string;
};

export type AutomaticFixtureMatchSeed = {
  awayTeamSlug: string;
  homeTeamSlug: string;
};

export type AutomaticFixtureMatchdaySeed = {
  label: string;
  matches: readonly AutomaticFixtureMatchSeed[];
  number: number;
  sourceDate: string | null;
};

export type AutomaticFixtureCompetitionSeed = {
  country: string;
  id: string;
  matchdays: readonly AutomaticFixtureMatchdaySeed[];
  name: string;
  season: string;
  sourceName: string;
  sourceUrl: string;
  teams: readonly AutomaticFixtureTeamSeed[];
};

export const serieA2026Teams = [
  {
    id: "serie-a-2026-2027-atalanta",
    name: "Atalanta",
    shortName: "Atalanta",
    slug: "atalanta",
    logoUrl: "/assets/serie-a-2026-2027/atalanta.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-bologna",
    name: "Bologna",
    shortName: "Bologna",
    slug: "bologna",
    logoUrl: "/assets/serie-a-2026-2027/bologna.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-cagliari",
    name: "Cagliari",
    shortName: "Cagliari",
    slug: "cagliari",
    logoUrl: "/assets/serie-a-2026-2027/cagliari.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-como",
    name: "Como",
    shortName: "Como",
    slug: "como",
    logoUrl: "/assets/serie-a-2026-2027/como.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-fiorentina",
    name: "Fiorentina",
    shortName: "Fiorentina",
    slug: "fiorentina",
    logoUrl: "/assets/serie-a-2026-2027/fiorentina.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-frosinone",
    name: "Frosinone",
    shortName: "Frosinone",
    slug: "frosinone",
    logoUrl: "/assets/serie-a-2026-2027/frosinone.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-genoa",
    name: "Genoa",
    shortName: "Genoa",
    slug: "genoa",
    logoUrl: "/assets/serie-a-2026-2027/genoa.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-inter",
    name: "Inter",
    shortName: "Inter",
    slug: "inter",
    logoUrl: "/assets/serie-a-2026-2027/inter.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-juventus",
    name: "Juventus",
    shortName: "Juventus",
    slug: "juventus",
    logoUrl: "/assets/serie-a-2026-2027/juventus.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-lazio",
    name: "Lazio",
    shortName: "Lazio",
    slug: "lazio",
    logoUrl: "/assets/serie-a-2026-2027/lazio.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-lecce",
    name: "Lecce",
    shortName: "Lecce",
    slug: "lecce",
    logoUrl: "/assets/serie-a-2026-2027/lecce.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-milan",
    name: "Milan",
    shortName: "Milan",
    slug: "milan",
    logoUrl: "/assets/serie-a-2026-2027/milan.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-monza",
    name: "Monza",
    shortName: "Monza",
    slug: "monza",
    logoUrl: "/assets/serie-a-2026-2027/monza.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-napoli",
    name: "Napoli",
    shortName: "Napoli",
    slug: "napoli",
    logoUrl: "/assets/serie-a-2026-2027/napoli.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-parma",
    name: "Parma",
    shortName: "Parma",
    slug: "parma",
    logoUrl: "/assets/serie-a-2026-2027/parma.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-roma",
    name: "Roma",
    shortName: "Roma",
    slug: "roma",
    logoUrl: "/assets/serie-a-2026-2027/roma.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-sassuolo",
    name: "Sassuolo",
    shortName: "Sassuolo",
    slug: "sassuolo",
    logoUrl: "/assets/serie-a-2026-2027/sassuolo.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-torino",
    name: "Torino",
    shortName: "Torino",
    slug: "torino",
    logoUrl: "/assets/serie-a-2026-2027/torino.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-udinese",
    name: "Udinese",
    shortName: "Udinese",
    slug: "udinese",
    logoUrl: "/assets/serie-a-2026-2027/udinese.svg",
    active: true
  },
  {
    id: "serie-a-2026-2027-venezia",
    name: "Venezia",
    shortName: "Venezia",
    slug: "venezia",
    logoUrl: "/assets/serie-a-2026-2027/venezia.svg",
    active: true
  }
] as const satisfies readonly AutomaticFixtureTeamSeed[];

export const serieA2026Matchdays = [
  {
    number: 1,
    label: "Giornata 1",
    sourceDate: "23 agosto 2026",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "lecce"
      }
    ]
  },
  {
    number: 2,
    label: "Giornata 2",
    sourceDate: "30 agosto 2026",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "torino"
      }
    ]
  },
  {
    number: 3,
    label: "Giornata 3",
    sourceDate: "6 settembre 2026",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "lazio"
      }
    ]
  },
  {
    number: 4,
    label: "Giornata 4",
    sourceDate: "13 settembre 2026",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "fiorentina"
      }
    ]
  },
  {
    number: 5,
    label: "Giornata 5",
    sourceDate: "20 settembre 2026",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "lazio"
      }
    ]
  },
  {
    number: 6,
    label: "Giornata 6",
    sourceDate: "11 ottobre 2026",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "udinese"
      }
    ]
  },
  {
    number: 7,
    label: "Giornata 7",
    sourceDate: "18 ottobre 2026",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "napoli"
      }
    ]
  },
  {
    number: 8,
    label: "Giornata 8",
    sourceDate: "25 ottobre 2026",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "milan"
      }
    ]
  },
  {
    number: 9,
    label: "Giornata 9",
    sourceDate: "28 ottobre 2026",
    matches: [
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "inter"
      }
    ]
  },
  {
    number: 10,
    label: "Giornata 10",
    sourceDate: "1 novembre 2026",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "roma"
      }
    ]
  },
  {
    number: 11,
    label: "Giornata 11",
    sourceDate: "8 novembre 2026",
    matches: [
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "udinese"
      }
    ]
  },
  {
    number: 12,
    label: "Giornata 12",
    sourceDate: "22 novembre 2026",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "genoa"
      }
    ]
  },
  {
    number: 13,
    label: "Giornata 13",
    sourceDate: "29 novembre 2026",
    matches: [
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "bologna"
      }
    ]
  },
  {
    number: 14,
    label: "Giornata 14",
    sourceDate: "6 dicembre 2026",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "sassuolo"
      }
    ]
  },
  {
    number: 15,
    label: "Giornata 15",
    sourceDate: "13 dicembre 2026",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "frosinone"
      }
    ]
  },
  {
    number: 16,
    label: "Giornata 16",
    sourceDate: "20 dicembre 2026",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "monza"
      }
    ]
  },
  {
    number: 17,
    label: "Giornata 17",
    sourceDate: "3 gennaio 2027",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "atalanta"
      }
    ]
  },
  {
    number: 18,
    label: "Giornata 18",
    sourceDate: "6 gennaio 2027",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "roma"
      }
    ]
  },
  {
    number: 19,
    label: "Giornata 19",
    sourceDate: "10 gennaio 2027",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "napoli"
      }
    ]
  },
  {
    number: 20,
    label: "Giornata 20",
    sourceDate: "17 gennaio 2027",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "frosinone"
      }
    ]
  },
  {
    number: 21,
    label: "Giornata 21",
    sourceDate: "24 gennaio 2027",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "udinese"
      }
    ]
  },
  {
    number: 22,
    label: "Giornata 22",
    sourceDate: "31 gennaio 2027",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "bologna"
      }
    ]
  },
  {
    number: 23,
    label: "Giornata 23",
    sourceDate: "7 febbraio 2027",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "genoa"
      }
    ]
  },
  {
    number: 24,
    label: "Giornata 24",
    sourceDate: "14 febbraio 2027",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "venezia"
      }
    ]
  },
  {
    number: 25,
    label: "Giornata 25",
    sourceDate: "21 febbraio 2027",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "cagliari"
      }
    ]
  },
  {
    number: 26,
    label: "Giornata 26",
    sourceDate: "28 febbraio 2027",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "fiorentina"
      }
    ]
  },
  {
    number: 27,
    label: "Giornata 27",
    sourceDate: "7 marzo 2027",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "inter"
      }
    ]
  },
  {
    number: 28,
    label: "Giornata 28",
    sourceDate: "14 marzo 2027",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "atalanta"
      }
    ]
  },
  {
    number: 29,
    label: "Giornata 29",
    sourceDate: "21 marzo 2027",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "torino"
      }
    ]
  },
  {
    number: 30,
    label: "Giornata 30",
    sourceDate: "4 aprile 2027",
    matches: [
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "parma"
      }
    ]
  },
  {
    number: 31,
    label: "Giornata 31",
    sourceDate: "11 aprile 2027",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "monza"
      }
    ]
  },
  {
    number: 32,
    label: "Giornata 32",
    sourceDate: "18 aprile 2027",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "juventus"
      }
    ]
  },
  {
    number: 33,
    label: "Giornata 33",
    sourceDate: "25 aprile 2027",
    matches: [
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "torino"
      }
    ]
  },
  {
    number: 34,
    label: "Giornata 34",
    sourceDate: "2 maggio 2027",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "genoa"
      }
    ]
  },
  {
    number: 35,
    label: "Giornata 35",
    sourceDate: "9 maggio 2027",
    matches: [
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "milan"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "como"
      }
    ]
  },
  {
    number: 36,
    label: "Giornata 36",
    sourceDate: "16 maggio 2027",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "inter"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "venezia"
      }
    ]
  },
  {
    number: 37,
    label: "Giornata 37",
    sourceDate: "23 maggio 2027",
    matches: [
      {
        homeTeamSlug: "atalanta",
        awayTeamSlug: "lecce"
      },
      {
        homeTeamSlug: "fiorentina",
        awayTeamSlug: "monza"
      },
      {
        homeTeamSlug: "frosinone",
        awayTeamSlug: "cagliari"
      },
      {
        homeTeamSlug: "genoa",
        awayTeamSlug: "bologna"
      },
      {
        homeTeamSlug: "inter",
        awayTeamSlug: "lazio"
      },
      {
        homeTeamSlug: "parma",
        awayTeamSlug: "juventus"
      },
      {
        homeTeamSlug: "roma",
        awayTeamSlug: "como"
      },
      {
        homeTeamSlug: "torino",
        awayTeamSlug: "napoli"
      },
      {
        homeTeamSlug: "udinese",
        awayTeamSlug: "sassuolo"
      },
      {
        homeTeamSlug: "venezia",
        awayTeamSlug: "milan"
      }
    ]
  },
  {
    number: 38,
    label: "Giornata 38",
    sourceDate: "30 maggio 2027",
    matches: [
      {
        homeTeamSlug: "bologna",
        awayTeamSlug: "parma"
      },
      {
        homeTeamSlug: "cagliari",
        awayTeamSlug: "roma"
      },
      {
        homeTeamSlug: "como",
        awayTeamSlug: "genoa"
      },
      {
        homeTeamSlug: "juventus",
        awayTeamSlug: "frosinone"
      },
      {
        homeTeamSlug: "lazio",
        awayTeamSlug: "fiorentina"
      },
      {
        homeTeamSlug: "lecce",
        awayTeamSlug: "venezia"
      },
      {
        homeTeamSlug: "milan",
        awayTeamSlug: "udinese"
      },
      {
        homeTeamSlug: "monza",
        awayTeamSlug: "torino"
      },
      {
        homeTeamSlug: "napoli",
        awayTeamSlug: "atalanta"
      },
      {
        homeTeamSlug: "sassuolo",
        awayTeamSlug: "inter"
      }
    ]
  }
] as const satisfies readonly AutomaticFixtureMatchdaySeed[];

export const automaticFixtureCompetitions = [
  {
    country: "Italia",
    id: "serie-a-2026-2027",
    matchdays: serieA2026Matchdays,
    name: "Serie A 2026-2027",
    season: "2026-2027",
    sourceName: "Calendario Serie A Enilive 2026/2027",
    sourceUrl: "https://www.calciatori-online.com/calcio/20260608-calendario-serie-a-2026-2027.php",
    teams: serieA2026Teams,
  },
] as const satisfies readonly AutomaticFixtureCompetitionSeed[];

export const automaticFixtureTeamSeeds = automaticFixtureCompetitions.flatMap((competition) =>
  competition.teams.map((team) => ({
    ...team,
    sourceCompetitionId: competition.id,
  })),
);

export function listAutomaticFixtureCompetitions() {
  return automaticFixtureCompetitions.map((competition) => ({
    country: competition.country,
    id: competition.id,
    matchdays: competition.matchdays.map((matchday) => ({
      label: matchday.label,
      matchCount: matchday.matches.length,
      number: matchday.number,
      sourceDate: matchday.sourceDate,
    })),
    name: competition.name,
    season: competition.season,
    sourceName: competition.sourceName,
    sourceUrl: competition.sourceUrl,
  }));
}

export function getAutomaticFixtureCompetition(competitionId: string) {
  return automaticFixtureCompetitions.find((competition) => competition.id === competitionId) ?? null;
}

export function getAutomaticFixtureMatchday(competitionId: string, matchdayNumber: number) {
  const competition = getAutomaticFixtureCompetition(competitionId);

  if (!competition) {
    return null;
  }

  const matchday = competition.matchdays.find((item) => item.number === matchdayNumber) ?? null;

  return matchday ? { competition, matchday } : null;
}

export function getNextAutomaticFixtureMatchday(competitionId: string | null, matchdayNumber: number | null) {
  if (!competitionId || !matchdayNumber) {
    return null;
  }

  return getAutomaticFixtureMatchday(competitionId, matchdayNumber + 1);
}
