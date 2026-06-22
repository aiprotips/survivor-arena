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
  sections?: Array<{
    items?: string[];
    text?: string;
    title: string;
  }>;
  title: string;
};

export const publicPages = {
  cookie: {
    cards: [
      {
        icon: Cookie,
        text: "Usiamo cookie tecnici e strumenti equivalenti necessari per login, sicurezza e sessione.",
        title: "Cookie tecnici",
      },
      {
        icon: ShieldCheck,
        text: "Analytics, profilazione o marketing verranno attivati solo se necessari, dichiarati e soggetti a consenso quando richiesto.",
        title: "Niente sorprese",
      },
    ],
    sections: [
      {
        text: "I cookie sono piccole informazioni salvate dal browser o strumenti tecnici equivalenti. In questa fase Survivor Arena usa esclusivamente strumenti necessari a far funzionare il sito, mantenere la sessione, proteggere l'account e ricordare preferenze tecniche essenziali.",
        title: "Cosa sono e perché li usiamo",
      },
      {
        items: [
          "Cookie di sessione e autenticazione: permettono di restare collegati in modo sicuro.",
          "Cookie di sicurezza: aiutano a prevenire abusi, accessi non autorizzati e richieste anomale.",
          "Cookie tecnici di preferenza: possono memorizzare scelte strettamente necessarie al funzionamento del servizio.",
        ],
        title: "Categorie attualmente previste",
      },
      {
        text: "Al momento non utilizziamo cookie di profilazione pubblicitaria. Se in futuro saranno introdotti strumenti analytics avanzati, marketing o profilazione, aggiorneremo questa informativa e mostreremo un sistema di scelta chiaro prima dell'attivazione, quando previsto dalla normativa.",
        title: "Analytics e profilazione",
      },
      {
        text: "Puoi gestire o cancellare i cookie dalle impostazioni del browser. La disattivazione dei cookie tecnici può impedire il login o il corretto funzionamento dell'area utente.",
        title: "Gestione dal browser",
      },
    ],
    eyebrow: "Preferenze",
    intro: "Informativa sui cookie e sugli strumenti tecnici usati da Survivor Arena.",
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
        text: "Trattiamo i dati necessari per creare account, gestire accessi, sicurezza, Arene e comunicazioni di servizio.",
        title: "Dati account",
      },
      {
        icon: FileText,
        text: "Puoi chiedere accesso, rettifica, cancellazione, limitazione, opposizione e portabilità nei casi previsti.",
        title: "Diritti utente",
      },
    ],
    sections: [
      {
        text: "Questa informativa spiega come Survivor Arena tratta i dati personali raccolti tramite sito, account, aree riservate, bot Telegram e funzioni collegate. Per richieste privacy puoi scrivere a assistenza.arenasurvivor@gmail.com.",
        title: "Titolare e contatti",
      },
      {
        items: [
          "Dati account: username, email, numero di telefono, codice utente, password in forma hashata.",
          "Dati di sicurezza: sessioni, ultimo accesso, stato account, eventi tecnici e log essenziali.",
          "Dati di gioco: iscrizioni alle Arene, vite, scelte, risultati, movimenti Coppe e classifiche.",
          "Dati Telegram: identificativo chat, username Telegram e codici OTP necessari a verifica telefono e recupero password.",
        ],
        title: "Dati trattati",
      },
      {
        items: [
          "Esecuzione del servizio: creare account, consentire login, gestire Arene, Coppe, movimenti e classifiche.",
          "Sicurezza: prevenire abusi, verificare il telefono, recuperare password e proteggere gli account.",
          "Obblighi legali e tutela dei diritti: conservare evidenze minime e gestire contestazioni.",
          "Comunicazioni di servizio: inviare messaggi importanti nell'area utente o tramite pop-up al login.",
        ],
        title: "Finalità e basi giuridiche",
      },
      {
        text: "La password non viene mai salvata in chiaro. I codici OTP hanno durata limitata. I dati sono conservati per il tempo necessario a fornire il servizio, rispettare obblighi legali, prevenire abusi e difendere diritti. Quando un dato non serve più, viene eliminato o anonimizzato dove possibile.",
        title: "Sicurezza e conservazione",
      },
      {
        text: "Il servizio può usare fornitori tecnici come Cloudflare per hosting, database e sicurezza, e Telegram per invio OTP tramite bot. Alcuni fornitori possono trattare dati fuori dallo Spazio Economico Europeo secondo le proprie condizioni e garanzie applicabili.",
        title: "Fornitori e trasferimenti",
      },
      {
        text: "Puoi esercitare i diritti previsti dal GDPR scrivendo a assistenza.arenasurvivor@gmail.com. Hai inoltre diritto di proporre reclamo all'autorità di controllo competente.",
        title: "Diritti dell'interessato",
      },
    ],
    eyebrow: "Trasparenza",
    intro: "Informativa sul trattamento dei dati personali per account, sicurezza e utilizzo della piattaforma.",
    title: "Privacy",
  },
  terms: {
    cards: [
      {
        icon: FileText,
        text: "Creando un account accetti le regole della piattaforma, il comportamento corretto e l'uso lecito del servizio.",
        title: "Accordo utente",
      },
      {
        icon: Trophy,
        text: "Le Arene seguono regole pubblicate dall'admin: iscrizione, vite, scelte, deadline, calcolo round e movimenti Coppe.",
        title: "Regole Arene",
      },
    ],
    sections: [
      {
        text: "Questi Termini regolano l'accesso e l'uso di Survivor Arena. Usando il sito dichiari di aver letto e accettato Termini, Privacy Policy e Cookie Policy. Per assistenza puoi scrivere a assistenza.arenasurvivor@gmail.com.",
        title: "Ambito del servizio",
      },
      {
        items: [
          "Devi fornire dati corretti e mantenere sicure le credenziali.",
          "Non puoi usare account altrui, creare automatismi abusivi, manipolare scelte, classifiche o flussi di gioco.",
          "L'accesso può essere sospeso o bloccato in caso di uso scorretto, tentativi di frode, abuso tecnico o violazione dei Termini.",
        ],
        title: "Account e responsabilità",
      },
      {
        items: [
          "Ogni Arena può avere costo di iscrizione, vite iniziali, vite extra, deadline, regole e stato pubblico.",
          "Le scelte sono modificabili solo fino alla deadline o fino al blocco manuale delle scelte.",
          "Il calcolo dei round segue i risultati inseriti dall'admin e le regole di sopravvivenza definite per l'Arena.",
          "Storico, movimenti e classifiche sono registrati per trasparenza e controllo del gioco.",
        ],
        title: "Funzionamento delle Arene",
      },
      {
        text: "Le Coppe rappresentano un saldo interno alla piattaforma e vengono usate per iscrizioni, movimenti e meccaniche previste dalle Arene. Eventuali premi, ricompense o diverse modalità saranno validi solo se pubblicati in modo chiaro nelle regole ufficiali della piattaforma o della singola Arena.",
        title: "Coppe, ricompense e premi",
      },
      {
        text: "Survivor Arena può aggiornare funzioni, regole, pagine o contenuti per migliorare il servizio, correggere errori, aumentare sicurezza o rispettare obblighi normativi. Le modifiche importanti saranno comunicate con mezzi ragionevoli.",
        title: "Aggiornamenti",
      },
      {
        text: "Il servizio viene fornito con ragionevole cura tecnica. Non garantiamo assenza assoluta di interruzioni, errori o indisponibilità dovute a manutenzione, fornitori terzi, rete, forza maggiore o problemi non controllabili.",
        title: "Disponibilità e limitazioni",
      },
    ],
    eyebrow: "Regole",
    intro: "Condizioni d'uso della piattaforma, account, Arene, Coppe e comunicazioni ufficiali.",
    title: "Termini e Condizioni",
  },
} satisfies Record<string, PublicInfoPageContent>;
