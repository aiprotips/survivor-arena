"use client";

import {
  Bell,
  Crown,
  Gem,
  KeyRound,
  Lock,
  Medal,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { PlaceholderCard } from "@/components/account/PlaceholderCard";
import { StatCard } from "@/components/account/StatCard";
import { UserLayout } from "@/components/account/UserLayout";
import type { AccountUser, UserAreaPageKey } from "@/components/account/types";
import { PremiumDivider } from "@/components/ui/PremiumDivider";

type UserAreaPageProps = {
  page: UserAreaPageKey;
};

export function UserAreaPage({ page }: UserAreaPageProps) {
  return (
    <UserLayout currentPage={page}>
      {(user) => {
        switch (page) {
          case "arene":
            return <ArenePage />;
          case "classifiche":
            return <ClassifichePage />;
          case "premi":
            return <PremiPage />;
          case "profilo":
            return <ProfiloPage user={user} />;
          case "movimenti":
            return <MovimentiPage />;
          case "impostazioni":
            return <ImpostazioniPage />;
          case "dashboard":
          default:
            return <DashboardPage user={user} />;
        }
      }}
    </UserLayout>
  );
}

function PageIntro({
  eyebrow,
  subtitle,
  title,
}: {
  eyebrow: string;
  subtitle: string;
  title: string;
}) {
  return (
    <header className="user-page-intro">
      <p className="user-page-kicker">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <PremiumDivider />
    </header>
  );
}

function DashboardPage({ user }: { user: AccountUser }) {
  return (
    <>
      <PageIntro
        eyebrow="Area personale"
        subtitle="Accesso effettuato correttamente. Le funzioni avanzate arriveranno nelle prossime fasi."
        title={`Benvenuto, ${user.username}`}
      />

      <section className="user-summary-panel" aria-label="Riepilogo account">
        <div>
          <span>Saldo Coppe</span>
          <strong>0 Coppe</strong>
        </div>
        <div>
          <span>Codice utente</span>
          <strong>{user.user_code}</strong>
        </div>
      </section>

      <section className="user-stat-grid" aria-label="Statistiche demo">
        <StatCard
          icon={<Trophy aria-hidden="true" className="user-stat-svg" />}
          label="Arene attive"
          value="2"
        />
        <StatCard
          icon={<Crown aria-hidden="true" className="user-stat-svg" />}
          label="Arene vinte"
          tone="gold"
          value="0"
        />
        <StatCard
          icon={<Medal aria-hidden="true" className="user-stat-svg" />}
          label="Posizione classifica"
          value="#128"
        />
        <StatCard
          icon={<Gem aria-hidden="true" className="user-stat-svg" />}
          label="Coppe disponibili"
          tone="gold"
          value="0"
        />
      </section>
    </>
  );
}

function ArenePage() {
  return (
    <>
      <PageIntro
        eyebrow="Competizione"
        subtitle="Anteprima delle aree che ospiteranno le future sfide Survivor Arena."
        title="Arene"
      />

      <section className="user-section-grid" aria-label="Arene demo">
        <PlaceholderCard eyebrow="Demo" meta="Apertura prossimamente" title="Arene disponibili">
          <p>Arena Champions, Survivor Cup e Legends Arena saranno elencate qui.</p>
        </PlaceholderCard>
        <PlaceholderCard eyebrow="Demo" meta="Nessuna arena attiva" title="Le mie Arene">
          <p>Le competizioni a cui parteciperai compariranno in questa sezione.</p>
        </PlaceholderCard>
        <PlaceholderCard eyebrow="Demo" meta="Archivio non ancora attivo" title="Arene concluse">
          <p>Lo storico delle arene completate verrà mostrato quando la logica sarà pronta.</p>
        </PlaceholderCard>
      </section>
    </>
  );
}

function ClassifichePage() {
  const rows = [
    ["1", "Survivor_One", "2.450"],
    ["2", "TheLastOne", "2.150"],
    ["3", "ArenaKing", "1.890"],
  ];

  return (
    <>
      <PageIntro
        eyebrow="Prestigio"
        subtitle="Classifiche demo per preparare la futura esperienza competitiva."
        title="Classifiche"
      />

      <section className="user-section-grid" aria-label="Classifiche demo">
        {["Classifica globale", "Classifica settimanale", "Classifica mensile"].map((title) => (
          <PlaceholderCard eyebrow="Demo" key={title} title={title}>
            <div className="user-ranking-list">
              {rows.map(([position, name, points]) => (
                <div className="user-ranking-row" key={`${title}-${position}`}>
                  <span>{position}</span>
                  <strong>{name}</strong>
                  <em>{points} Coppe</em>
                </div>
              ))}
            </div>
          </PlaceholderCard>
        ))}
      </section>
    </>
  );
}

function PremiPage() {
  return (
    <>
      <PageIntro
        eyebrow="Ricompense"
        subtitle="Area demo dedicata al saldo Coppe e ai premi futuri."
        title="Premi"
      />

      <section className="user-summary-panel" aria-label="Saldo coppe">
        <div>
          <span>Saldo Coppe</span>
          <strong>0 Coppe</strong>
        </div>
      </section>

      <section className="user-section-grid" aria-label="Premi demo">
        <PlaceholderCard eyebrow="Demo" meta="Catalogo in arrivo" title="Premi disponibili">
          <p>Qui verranno mostrati badge, coppe speciali e ricompense riscattabili.</p>
        </PlaceholderCard>
        <PlaceholderCard eyebrow="Demo" meta="Nessun premio riscattato" title="Premi riscattati">
          <p>Lo storico dei premi riscattati sarà disponibile nelle prossime versioni.</p>
        </PlaceholderCard>
      </section>
    </>
  );
}

function ProfiloPage({ user }: { user: AccountUser }) {
  const profileItems = [
    ["Username", user.username],
    ["Email", user.email],
    ["Telefono", user.phone],
    ["Codice utente", user.user_code],
  ];

  return (
    <>
      <PageIntro
        eyebrow="Account"
        subtitle="Dati principali del tuo profilo. La modifica arriverà in una fase successiva."
        title="Profilo"
      />

      <section className="user-detail-card" aria-label="Dati profilo">
        {profileItems.map(([label, value]) => (
          <div className="user-detail-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
    </>
  );
}

function MovimentiPage() {
  const movements = [
    ["Iscrizione Arena Champions", "- 250 Coppe"],
    ["Accredito Coppe", "+ 1.000 Coppe"],
    ["Riscatto Premio", "- 500 Coppe"],
    ["Bonus classifica", "+ 300 Coppe"],
  ];

  return (
    <>
      <PageIntro
        eyebrow="Storico"
        subtitle="Lista demo dei futuri movimenti account."
        title="Lista Movimenti"
      />

      <section className="user-detail-card" aria-label="Movimenti demo">
        {movements.map(([label, value]) => (
          <div className="user-detail-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
    </>
  );
}

function ImpostazioniPage() {
  const settings = [
    {
      icon: ShieldCheck,
      text: "Gestione sicurezza account in preparazione.",
      title: "Sicurezza account",
    },
    {
      icon: KeyRound,
      text: "Cambio password non ancora attivo.",
      title: "Cambia password",
    },
    {
      icon: Bell,
      text: "Preferenze notifiche disponibili in futuro.",
      title: "Notifiche",
    },
    {
      icon: Lock,
      text: "Impostazioni generali placeholder.",
      title: "Preferenze",
    },
  ];

  return (
    <>
      <PageIntro
        eyebrow="Controllo"
        subtitle="Impostazioni placeholder per preparare la struttura dell’account."
        title="Impostazioni"
      />

      <section className="user-section-grid" aria-label="Impostazioni demo">
        {settings.map((item) => {
          const Icon = item.icon;

          return (
            <PlaceholderCard key={item.title} title={item.title}>
              <div className="user-setting-row">
                <Icon aria-hidden="true" className="user-setting-icon" />
                <p>{item.text}</p>
              </div>
            </PlaceholderCard>
          );
        })}
      </section>
    </>
  );
}
