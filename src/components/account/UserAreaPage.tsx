"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  Crown,
  Gem,
  Gift,
  KeyRound,
  Lock,
  ShieldCheck,
  Swords,
  Timer,
  TrendingUp,
} from "lucide-react";
import { ArenaListContent } from "@/components/arena/ArenaListContent";
import { PlaceholderCard } from "@/components/account/PlaceholderCard";
import { StatCard } from "@/components/account/StatCard";
import { UserLayout } from "@/components/account/UserLayout";
import type { AccountUser, UserAreaPageKey } from "@/components/account/types";
import { ButtonLink } from "@/components/ui/Button";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import { formatCups } from "@/lib/arena-client";

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
  const isDemoUser = user.username.toLowerCase() === "lorenzop96";
  const stats = [
    {
      icon: Gem,
      label: "Coppe disponibili",
      tone: "gold" as const,
      value: formatCups(user.cup_balance ?? 0),
    },
    {
      icon: Swords,
      label: "Arene attive",
      value: isDemoUser ? "3" : "0",
    },
    {
      icon: Crown,
      label: "Arene vinte",
      tone: "gold" as const,
      value: "0",
    },
    {
      icon: BarChart3,
      label: "Posizione classifica",
      value: isDemoUser ? "#128" : "N/D",
    },
  ];

  const arenas = isDemoUser
    ? [
        {
          deadline: "1 giorno 12 ore",
          entry: "250 Coppe",
          progress: "40%",
          progressClassName: "dashboard-progress-40",
          status: "Scelta richiesta",
          title: "Arena Champions",
          turn: "Turno 4 di 10",
        },
        {
          deadline: "2 giorni 04 ore",
          entry: "150 Coppe",
          progress: "20%",
          progressClassName: "dashboard-progress-20",
          status: "In corso",
          title: "Survivor Cup",
          turn: "Turno 2 di 8",
        },
        {
          deadline: "5 giorni 18 ore",
          entry: "100 Coppe",
          progress: "10%",
          progressClassName: "dashboard-progress-10",
          status: "In arrivo",
          title: "Legends Arena",
          turn: "Turno 1 di 10",
        },
      ]
    : [];

  const actions = isDemoUser
    ? [
        {
          icon: AlertCircle,
          label: "Devi effettuare una scelta",
          meta: "Arena Champions",
        },
        {
          icon: Timer,
          label: "Arena in scadenza",
          meta: "1 giorno 12 ore",
        },
        {
          icon: Gift,
          label: "Premio disponibile",
          meta: "Ricompensa demo",
        },
      ]
    : [];

  const movements = isDemoUser
    ? [
        ["+500 Coppe", "Vittoria Arena Champions"],
        ["-100 Coppe", "Iscrizione Survivor Cup"],
        ["+250 Coppe", "Bonus classifica"],
        ["-50 Coppe", "Ingresso Legends Arena"],
      ]
    : [];

  const position = isDemoUser
    ? {
        choices: "72%",
        progress: "+18%",
        rank: "#128",
        text: "+12 posizioni negli ultimi 7 giorni",
      }
    : {
        choices: "0%",
        progress: "0%",
        rank: "N/D",
        text: "Partecipa a un'Arena per entrare in classifica",
      };

  return (
    <div className="dashboard-page-content">
      <section className="dashboard-hero-card" aria-labelledby="dashboard-title">
        <div className="dashboard-hero-copy">
          <p className="user-page-kicker">Dashboard</p>
          <h1 id="dashboard-title">Benvenuto, {user.username}</h1>
          <p>Continua la tua scalata verso la vetta.</p>
        </div>

        <div className="dashboard-hero-status" aria-label="Riepilogo rapido">
          <span>Saldo Coppe</span>
          <strong>{formatCups(user.cup_balance ?? 0)}</strong>
        </div>
      </section>

      <section className="user-stat-grid dashboard-stat-grid" aria-label="Statistiche principali">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <StatCard
              icon={<Icon aria-hidden="true" className="user-stat-svg" />}
              key={stat.label}
              label={stat.label}
              tone={stat.tone}
              value={stat.value}
            />
          );
        })}
      </section>

      <div className="dashboard-layout-grid">
        <div className="dashboard-main-stack">
          <section className="dashboard-panel dashboard-arenas-panel" aria-labelledby="my-arenas-title">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">In gioco</p>
                <h2 id="my-arenas-title">Le mie Arene</h2>
              </div>
              <ButtonLink className="dashboard-section-link" href="/arene" variant="secondary">
                Vedi tutte
              </ButtonLink>
            </div>

            {arenas.length > 0 ? (
              <div className="dashboard-arena-list">
                {arenas.map((arena) => (
                  <article className="dashboard-arena-card" key={arena.title}>
                    <div className="dashboard-arena-top">
                      <span className="dashboard-arena-status">{arena.status}</span>
                      <span>{arena.entry}</span>
                    </div>

                    <div className="dashboard-arena-copy">
                      <h3>{arena.title}</h3>
                      <p>{arena.turn}</p>
                    </div>

                    <div className="dashboard-arena-meta">
                      <div>
                        <Clock3 aria-hidden="true" className="dashboard-small-icon" />
                        <span>Scadenza: {arena.deadline}</span>
                      </div>
                      <div className="dashboard-progress" aria-label={`Avanzamento ${arena.progress}`}>
                        <span className={arena.progressClassName} />
                      </div>
                    </div>

                    <ButtonLink className="dashboard-arena-button" href="/arene">
                      Vai all&apos;Arena
                      <ArrowUpRight aria-hidden="true" className="dashboard-button-icon" />
                    </ButtonLink>
                  </article>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                cta="Scopri le Arene"
                href="/arene"
                text="Non stai partecipando a nessuna Arena. Quando entrerai in gioco, le tue competizioni appariranno qui."
                title="Nessuna Arena attiva"
              />
            )}
          </section>

          <section className="dashboard-panel dashboard-movements-panel" aria-labelledby="recent-movements-title">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">Storico</p>
                <h2 id="recent-movements-title">Ultimi Movimenti</h2>
              </div>
              <ButtonLink className="dashboard-section-link" href="/movimenti" variant="secondary">
                Visualizza tutti
              </ButtonLink>
            </div>

            {movements.length > 0 ? (
              <div className="dashboard-movement-list">
                {movements.map(([amount, label]) => (
                  <article className="dashboard-movement-row" key={label}>
                    <span>{amount}</span>
                    <strong>{label}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                text="Non ci sono ancora movimenti. Le iscrizioni, i bonus e le ricompense verranno tracciati qui."
                title="Nessun movimento"
              />
            )}
          </section>
        </div>

        <aside className="dashboard-side-stack" aria-label="Riepiloghi dashboard">
          <section className="dashboard-panel" aria-labelledby="next-actions-title">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">Priorità</p>
                <h2 id="next-actions-title">Prossime Azioni</h2>
              </div>
            </div>

            {actions.length > 0 ? (
              <div className="dashboard-action-list">
                {actions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <article className="dashboard-action-item" key={action.label}>
                      <span className="dashboard-action-icon">
                        <Icon aria-hidden="true" className="dashboard-small-icon" />
                      </span>
                      <div>
                        <strong>{action.label}</strong>
                        <p>{action.meta}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <DashboardEmptyState
                text="Non hai azioni urgenti. Quando una scelta sarà richiesta, la vedrai subito qui."
                title="Tutto sotto controllo"
              />
            )}
          </section>

          <section className="dashboard-panel dashboard-position-panel" aria-labelledby="position-title">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">Andamento</p>
                <h2 id="position-title">La tua posizione</h2>
              </div>
            </div>

            <div className="dashboard-position-card">
              <span className="dashboard-position-rank">{position.rank}</span>
              <div>
                <strong>Globale</strong>
                <p>{position.text}</p>
              </div>
            </div>

            <div className="dashboard-position-metrics">
              <div>
                <TrendingUp aria-hidden="true" className="dashboard-small-icon" />
                <span>Progressione</span>
                <strong>{position.progress}</strong>
              </div>
              <div>
                <CheckCircle2 aria-hidden="true" className="dashboard-small-icon" />
                <span>Scelte corrette</span>
                <strong>{position.choices}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DashboardEmptyState({
  cta,
  href,
  text,
  title,
}: {
  cta?: string;
  href?: string;
  text: string;
  title: string;
}) {
  return (
    <div className="dashboard-empty-state">
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
      {cta && href ? (
        <ButtonLink className="dashboard-empty-link" href={href} variant="secondary">
          {cta}
        </ButtonLink>
      ) : null}
    </div>
  );
}

function ArenePage() {
  return <ArenaListContent />;
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

type MovementRow = {
  amount: number;
  balance_after: number;
  created_at: string;
  description: string;
  id: string;
  movement_type: string;
};

function MovimentiPage() {
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMovements() {
      const response = await fetch("/api/arena/movements", {
        credentials: "include",
      });
      const data = (await response.json()) as
        | {
            movements: MovementRow[];
            ok: true;
          }
        | {
            message: string;
            ok: false;
          };

      if (!isMounted) {
        return;
      }

      if (data.ok) {
        setMovements(data.movements);
      }

      setIsLoading(false);
    }

    loadMovements().catch(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <PageIntro
        eyebrow="Storico"
        subtitle="Movimenti Coppe generati da iscrizioni, vite extra, rimborsi e premi."
        title="Lista Movimenti"
      />

      <section className="user-detail-card" aria-label="Movimenti account">
        {isLoading ? (
          <div className="user-detail-row">
            <span>Caricamento</span>
            <strong>Recupero movimenti...</strong>
          </div>
        ) : movements.length > 0 ? (
          movements.map((movement) => (
            <div className="user-detail-row" key={movement.id}>
              <span>{movement.description}</span>
              <strong>
                {movement.amount > 0 ? "+" : ""}
                {formatCups(movement.amount)} • saldo {formatCups(movement.balance_after)}
              </strong>
            </div>
          ))
        ) : (
          <div className="user-detail-row">
            <span>Nessun movimento</span>
            <strong>Le attività Arena compariranno qui.</strong>
          </div>
        )}
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
