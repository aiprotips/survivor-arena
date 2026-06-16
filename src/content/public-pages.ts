import {
  CircleHelp,
  Cookie,
  Crown,
  FileText,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Swords,
  Trophy,
  UserPlus,
} from "lucide-react";
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
        icon: ShieldCheck,
        text: "Ogni round fai una scelta per ogni vita. Se la scelta supera il round, quella vita resta in gioco.",
        title: "Come si sopravvive?",
      },
      {
        icon: Trophy,
        text: "Sono il saldo interno dell'account e servono per partecipare alle dinamiche delle Arene quando saranno attive.",
        title: "A cosa servono le Coppe?",
      },
      {
        icon: Swords,
        text: "Ogni torneo è diviso in round. Resti dentro finché almeno una tua vita sopravvive.",
        title: "Come funzionano i tornei?",
      },
      {
        icon: MessageCircle,
        text: "Il bot ufficiale serve per verifica account e recupero password, così ricevi codici rapidi senza SMS a pagamento.",
        title: "A cosa serve Telegram?",
      },
      {
        icon: KeyRound,
        text: "Vai su Recupera Password, inserisci username e numero associato. Se tutto combacia, ricevi il codice tramite bot.",
        title: "Non riesco ad accedere: cosa faccio?",
      },
      {
        icon: UserPlus,
        text: "Bastano username, email, numero di telefono e una password sicura. La verifica Telegram arriverà al primo accesso.",
        title: "Cosa serve per creare un account?",
      },
      {
        icon: CircleHelp,
        text: "Sì, finché la deadline del round non è scaduta. Dopo il blocco, le scelte restano congelate.",
        title: "Posso cambiare scelta?",
      },
      {
        icon: FileText,
        text: "Dopo la chiusura delle scelte, la consultazione pubblica aiuta a rendere il round trasparente.",
        title: "Quando vedo le scelte degli altri?",
      },
    ],
    ctaHref: "/login",
    ctaLabel: "Entra nell'Arena",
    eyebrow: "Supporto",
    intro: "Le risposte essenziali per capire il gioco prima di entrare nell'Arena.",
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
    ctaHref: "/login",
    ctaLabel: "Entra nell'Arena",
    eyebrow: "Regole base",
    intro: "Survivor Arena è una competizione a vite: ogni scelta conta e ogni round può cambiare tutto.",
    title: "Come Funziona",
  },
  premi: {
    cards: [
      {
        icon: Trophy,
        text: "Questa sezione verrà definita con le regole ufficiali prima dell'apertura completa della piattaforma.",
        title: "Ricompense in definizione",
      },
      {
        icon: ShieldCheck,
        text: "Le informazioni pubbliche saranno aggiornate solo quando il sistema sarà pronto e verificato.",
        title: "Regole chiare",
      },
    ],
    ctaHref: "/login",
    ctaLabel: "Entra nell'Arena",
    eyebrow: "Sezione riservata",
    intro: "Le ricompense ufficiali saranno comunicate quando le Arene reali saranno aperte.",
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
