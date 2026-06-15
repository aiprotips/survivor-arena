import { CircleHelp, Cookie, Crown, FileText, ShieldCheck, Swords, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PublicInfoPageContent = {
  cards: Array<{
    icon: LucideIcon;
    text: string;
    title: string;
  }>;
  ctaHref?: string;
  ctaLabel?: string;
  eyebrow: string;
  intro: string;
  title: string;
};

export const publicPages = {
  cookie: {
    cards: [
      {
        icon: Cookie,
        text: "Useremo solo cookie tecnici necessari al funzionamento dell'account e della sessione.",
        title: "Cookie tecnici",
      },
      {
        icon: ShieldCheck,
        text: "Eventuali strumenti analytics verranno aggiunti solo con consenso e informativa chiara.",
        title: "Controllo trasparente",
      },
    ],
    eyebrow: "Preferenze",
    intro: "Informativa cookie provvisoria in attesa della versione legale completa.",
    title: "Cookie",
  },
  faq: {
    cards: [
      {
        icon: CircleHelp,
        text: "Scegli una squadra per ogni vita. Se la squadra vince, quella vita resta in gioco.",
        title: "Come si sopravvive?",
      },
      {
        icon: Trophy,
        text: "Le Coppe sono il credito interno usato per iscrizioni, vite extra e premi futuri.",
        title: "Cosa sono le Coppe?",
      },
      {
        icon: ShieldCheck,
        text: "Il recupero password e la verifica account passano dal bot Telegram ufficiale.",
        title: "Perché Telegram?",
      },
    ],
    ctaHref: "/login",
    ctaLabel: "Crea account",
    eyebrow: "Supporto",
    intro: "Le risposte essenziali per iniziare a capire Survivor Arena.",
    title: "FAQ",
  },
  howItWorks: {
    cards: [
      {
        icon: Swords,
        text: "Entri in un'Arena, ricevi le vite previste e fai una scelta per ogni vita.",
        title: "1. Entra",
      },
      {
        icon: ShieldCheck,
        text: "Ogni vita ha il suo storico: una vita non può ripetere la stessa squadra nel ciclo corrente.",
        title: "2. Sopravvivi",
      },
      {
        icon: Crown,
        text: "Quando resta un solo sopravvissuto, il torneo si chiude e assegna le Coppe.",
        title: "3. Vinci",
      },
    ],
    ctaHref: "/register",
    ctaLabel: "Entra nell'Arena",
    eyebrow: "Regole base",
    intro: "Survivor Arena è una competizione a vite: ogni scelta conta e ogni round può cambiare tutto.",
    title: "Come Funziona",
  },
  premi: {
    cards: [
      {
        icon: Trophy,
        text: "Ogni torneo genera un montepremi in Coppe, mai in denaro.",
        title: "Montepremi Coppe",
      },
      {
        icon: Crown,
        text: "I vincitori ricevono Coppe e riconoscimenti che saranno visibili nell'area personale.",
        title: "Prestigio",
      },
      {
        icon: ShieldCheck,
        text: "Il catalogo premi verrà attivato in una fase successiva, sempre dentro l'ecosistema Coppe.",
        title: "Premi futuri",
      },
    ],
    ctaHref: "/register",
    ctaLabel: "Registrati",
    eyebrow: "Ricompense",
    intro: "In Survivor Arena non si parla di soldi: tutto gira intorno alle Coppe.",
    title: "Premi",
  },
  privacy: {
    cards: [
      {
        icon: ShieldCheck,
        text: "I dati account vengono usati per login, sicurezza e gestione delle Arene.",
        title: "Dati account",
      },
      {
        icon: FileText,
        text: "La privacy policy definitiva verrà completata prima dell'apertura pubblica su larga scala.",
        title: "Documento legale",
      },
    ],
    eyebrow: "Trasparenza",
    intro: "Informativa privacy provvisoria per la prima versione di Survivor Arena.",
    title: "Privacy",
  },
  terms: {
    cards: [
      {
        icon: FileText,
        text: "Le condizioni complete verranno definite prima del lancio pubblico definitivo.",
        title: "Termini in preparazione",
      },
      {
        icon: Trophy,
        text: "Le Arene usano Coppe interne e regole di sopravvivenza definite dall'admin.",
        title: "Regole di gioco",
      },
    ],
    eyebrow: "Regole",
    intro: "Termini e condizioni provvisori della piattaforma.",
    title: "Termini e Condizioni",
  },
} satisfies Record<string, PublicInfoPageContent>;
