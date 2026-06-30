"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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
  MailOpen,
  ShieldCheck,
  Swords,
  Timer,
  TrendingUp,
} from "lucide-react";
import { ArenaListContent } from "@/components/arena/ArenaListContent";
import { FriendsDashboardContent, FriendsPage } from "@/components/friends/FriendsPage";
import { PlaceholderCard } from "@/components/account/PlaceholderCard";
import { StatCard } from "@/components/account/StatCard";
import { UserLayout } from "@/components/account/UserLayout";
import type { AccountUser, UserAreaPageKey } from "@/components/account/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import { TelegramIcon } from "@/components/ui/TelegramIcon";
import { getPasswordRequirements } from "@/lib/auth-validation";
import { formatCups } from "@/lib/arena-client";

type UserAreaPageProps = {
  friendsCompetitionId?: string;
  page: UserAreaPageKey;
};

export function UserAreaPage({ friendsCompetitionId, page }: UserAreaPageProps) {
  return (
    <UserLayout currentPage={page}>
      {(user) => {
        if (user.platform_mode === "FRIENDS" && ["arena", "arene", "classifiche", "movimenti", "premi"].includes(page)) {
          return <FriendsPage user={user} />;
        }

        switch (page) {
          case "friends":
          case "tornei":
            return user.platform_mode === "FRIENDS" ? <FriendsPage user={user} view="tournaments" /> : <DashboardPage user={user} />;
          case "area-manager":
            return user.platform_mode === "FRIENDS"
              ? <FriendsPage competitionId={friendsCompetitionId} user={user} view={friendsCompetitionId ? "manager-detail" : "manager"} />
              : <DashboardPage user={user} />;
          case "friends-tournament":
            return user.platform_mode === "FRIENDS"
              ? <FriendsPage competitionId={friendsCompetitionId} user={user} view="tournament-detail" />
              : <DashboardPage user={user} />;
          case "arene":
            return <ArenePage />;
          case "classifiche":
            return <ClassifichePage />;
          case "premi":
            return <PremiPage user={user} />;
          case "profilo":
            return <ProfiloPage user={user} />;
          case "movimenti":
            return <MovimentiPage />;
          case "posta":
            return <PostaPage />;
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

type DashboardArena = {
  alive_lives: number;
  deadline_at: string | null;
  eliminated_lives: number;
  entry_cost: number;
  pending_choices: number;
  prize_pool: number;
  progress_percent: number;
  registration_id: string;
  registration_status: string;
  round_label: string;
  round_status: string | null;
  total_lives: number;
  tournament_id: string;
  tournament_name: string;
  tournament_status: string;
};

type DashboardAction = {
  label: string;
  meta: string;
  tone: "gold" | "neutral";
  type: "choice" | "deadline" | "result";
};

type DashboardData = {
  actions: DashboardAction[];
  arenas: DashboardArena[];
  movements: MovementRow[];
  position: {
    correct_rate: number | null;
    rank: number | null;
    weekly_delta: number;
  };
  stats: {
    active_arenas: number;
    available_cups: number;
    won_arenas: number;
  };
};

type DashboardResponse =
  | {
      dashboard: DashboardData;
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

function DashboardPage({ user }: { user: AccountUser }) {
  return user.platform_mode === "FRIENDS" ? <FriendsDashboard user={user} /> : <CoppeDashboardPage user={user} />;
}

function CoppeDashboardPage({ user }: { user: AccountUser }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const response = await fetch("/api/account/dashboard", {
        credentials: "include",
      });
      const data = (await response.json()) as DashboardResponse;

      if (!isMounted) {
        return;
      }

      if (data.ok) {
        setDashboard(data.dashboard);
      } else {
        setMessage(data.message);
      }

      setIsLoading(false);
    }

    loadDashboard().catch(() => {
      if (isMounted) {
        setMessage("Dashboard non disponibile. Riprova tra poco.");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      icon: Gem,
      label: "Coppe disponibili",
      tone: "gold" as const,
      value: formatCups(dashboard?.stats.available_cups ?? user.cup_balance ?? 0),
    },
    {
      icon: Swords,
      label: "Arene attive",
      value: String(dashboard?.stats.active_arenas ?? 0),
    },
    {
      icon: Crown,
      label: "Arene vinte",
      tone: "gold" as const,
      value: String(dashboard?.stats.won_arenas ?? 0),
    },
    {
      icon: BarChart3,
      label: "Posizione classifica",
      value: dashboard?.position.rank ? `#${dashboard.position.rank}` : "N/D",
    },
  ];

  const arenas = dashboard?.arenas ?? [];
  const actions = dashboard?.actions ?? [];
  const movements = dashboard?.movements ?? [];
  const position = {
    choices: dashboard?.position.correct_rate === null || dashboard?.position.correct_rate === undefined
      ? "N/D"
      : `${dashboard.position.correct_rate}%`,
    progress: dashboard?.position.weekly_delta
      ? `${dashboard.position.weekly_delta > 0 ? "+" : ""}${formatCups(dashboard.position.weekly_delta)}`
      : "0 Coppe",
    rank: dashboard?.position.rank ? `#${dashboard.position.rank}` : "N/D",
    text: dashboard?.position.rank
      ? `Saldo reale: ${formatCups(dashboard.stats.available_cups)}`
      : "Partecipa a un'Arena per entrare in classifica",
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
          <strong>{formatCups(dashboard?.stats.available_cups ?? user.cup_balance ?? 0)}</strong>
        </div>
      </section>

      {message ? (
        <div className="auth-form-message auth-form-message-error" role="alert">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <section className="dashboard-panel">
          <p>Caricamento dati reali...</p>
        </section>
      ) : null}

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

            {!isLoading && arenas.length > 0 ? (
              <div className="dashboard-arena-list">
                {arenas.map((arena) => (
                  <article className="dashboard-arena-card" key={arena.registration_id}>
                    <div className="dashboard-arena-top">
                      <span className="dashboard-arena-status">
                        {arena.pending_choices > 0 ? "Scelta richiesta" : arena.tournament_status}
                      </span>
                      <span>{formatCups(arena.entry_cost)}</span>
                    </div>

                    <div className="dashboard-arena-copy">
                      <h3>{arena.tournament_name}</h3>
                      <p>{arena.round_label}</p>
                    </div>

                    <div className="dashboard-arena-meta">
                      <div>
                        <Clock3 aria-hidden="true" className="dashboard-small-icon" />
                        <span>Scadenza: {formatDashboardDeadline(arena.deadline_at)}</span>
                      </div>
                      <div className="dashboard-progress" aria-label={`Vite vive ${arena.progress_percent}%`}>
                        <span style={{ width: `${arena.progress_percent}%` }} />
                      </div>
                    </div>

                    <ButtonLink className="dashboard-arena-button" href={`/arena?id=${arena.tournament_id}`}>
                      Vai all&apos;Arena
                      <ArrowUpRight aria-hidden="true" className="dashboard-button-icon" />
                    </ButtonLink>
                  </article>
                ))}
              </div>
            ) : !isLoading ? (
              <DashboardEmptyState
                cta="Scopri le Arene"
                href="/arene"
                text="Non stai partecipando a nessuna Arena. Quando entrerai in gioco, le tue competizioni appariranno qui."
                title="Nessuna Arena attiva"
              />
            ) : null}
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

            {!isLoading && movements.length > 0 ? (
              <div className="dashboard-movement-list">
                {movements.map((movement) => (
                  <article className="dashboard-movement-row" key={movement.id}>
                    <span>
                      {movement.amount > 0 ? "+" : ""}
                      {formatCups(movement.amount)}
                    </span>
                    <strong>{movement.description}</strong>
                  </article>
                ))}
              </div>
            ) : !isLoading ? (
              <DashboardEmptyState
                text="Non ci sono ancora movimenti. Le iscrizioni, i bonus e le ricompense verranno tracciati qui."
                title="Nessun movimento"
              />
            ) : null}
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

            {!isLoading && actions.length > 0 ? (
              <div className="dashboard-action-list">
                {actions.map((action) => {
                  const Icon =
                    action.type === "choice"
                      ? AlertCircle
                      : action.type === "result"
                        ? Gift
                        : Timer;

                  return (
                    <article className="dashboard-action-item" key={`${action.label}-${action.meta}`}>
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
            ) : !isLoading ? (
              <DashboardEmptyState
                text="Non hai azioni urgenti. Quando una scelta sarà richiesta, la vedrai subito qui."
                title="Tutto sotto controllo"
              />
            ) : null}
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

function FriendsDashboard({ user }: { user: AccountUser }) {
  return <FriendsDashboardContent user={user} />;
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

function formatDashboardDeadline(value: string | null) {
  if (!value) {
    return "Da impostare";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Da impostare";
  }

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function ArenePage() {
  return <ArenaListContent />;
}

function ClassifichePage() {
  const [leaderboards, setLeaderboards] = useState<LeaderboardsData | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboards() {
      const response = await fetch("/api/account/leaderboards", {
        credentials: "include",
      });
      const data = (await response.json()) as LeaderboardsResponse;

      if (!isMounted) {
        return;
      }

      if (data.ok) {
        setLeaderboards(data.leaderboards);
      } else {
        setMessage(data.message);
      }

      setIsLoading(false);
    }

    loadLeaderboards().catch(() => {
      if (isMounted) {
        setMessage("Classifiche non disponibili. Riprova tra poco.");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const sections = [
    {
      key: "global" as const,
      title: "Classifica globale",
    },
    {
      key: "weekly" as const,
      title: "Classifica settimanale",
    },
    {
      key: "monthly" as const,
      title: "Classifica mensile",
    },
  ];

  return (
    <>
      <PageIntro
        eyebrow="Prestigio"
        subtitle="Classifiche calcolate sui dati reali degli account e dei movimenti Coppe."
        title="Classifiche"
      />

      {message ? (
        <div className="auth-form-message auth-form-message-error" role="alert">
          {message}
        </div>
      ) : null}

      <section className="user-section-grid" aria-label="Classifiche reali">
        {sections.map((section) => {
          const rows = leaderboards?.[section.key] ?? [];

          return (
            <PlaceholderCard eyebrow="Live" key={section.key} title={section.title}>
              {isLoading ? (
                <p>Caricamento classifica...</p>
              ) : rows.length > 0 ? (
                <div className="user-ranking-list">
                  {rows.map((row) => (
                    <div className="user-ranking-row" key={`${section.key}-${row.user_code}`}>
                      <span>{row.position}</span>
                      <strong>{row.username}</strong>
                      <em>{formatCups(row.score)}</em>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Non ci sono ancora dati reali per questa classifica.</p>
              )}
            </PlaceholderCard>
          );
        })}
      </section>
    </>
  );
}

type LeaderboardEntry = {
  position: number;
  score: number;
  user_code: string;
  username: string;
};

type LeaderboardsData = {
  global: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
};

type LeaderboardsResponse =
  | {
      leaderboards: LeaderboardsData;
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

function PremiPage({ user }: { user: AccountUser }) {
  return (
    <>
      <PageIntro
        eyebrow="Ricompense"
        subtitle="Qui vedrai solo saldo e premi reali quando saranno disponibili sul tuo account."
        title="Premi"
      />

      <section className="user-summary-panel" aria-label="Saldo coppe">
        <div>
          <span>Saldo Coppe</span>
          <strong>{formatCups(user.cup_balance ?? 0)}</strong>
        </div>
      </section>

      <section className="user-section-grid" aria-label="Premi reali">
        <PlaceholderCard eyebrow="Account" meta="Nessun premio disponibile" title="Premi disponibili">
          <p>Al momento non ci sono premi reali disponibili per il tuo account.</p>
        </PlaceholderCard>
        <PlaceholderCard eyebrow="Storico" meta="Nessun riscatto registrato" title="Premi riscattati">
          <p>Quando riscatterai un premio reale, verrà mostrato qui.</p>
        </PlaceholderCard>
      </section>
    </>
  );
}

type PhoneChangeResponse =
  | {
      expiresAt?: string;
      message: string;
      ok: true;
      phone?: string;
    }
  | {
      field?: string;
      message: string;
      ok: false;
      requiresTelegramLink?: boolean;
      telegramAppStartUrl?: string;
      telegramBotUsername?: string;
      telegramStartUrl?: string;
    };

function ProfiloPage({ user }: { user: AccountUser }) {
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({
    email: user.email,
    phone: user.phone,
    username: user.username,
  });
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneModal, setPhoneModal] = useState<{
    appStartUrl?: string;
    botUsername?: string;
    message: string;
    phone: string;
    startUrl?: string;
    status: "code" | "telegram";
  } | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);

  async function saveProfile(nextForm = form) {
    const response = await fetch("/api/account/profile", {
      body: JSON.stringify(nextForm),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });
    const data = (await response.json()) as
      | {
          ok: true;
          user: AccountUser;
        }
      | {
          message: string;
          ok: false;
          requiresPhoneVerification?: boolean;
        };

    if (!data.ok) {
      throw new Error(data.message);
    }

    setProfile({
      ...profile,
      ...data.user,
    });
    setForm({
      email: data.user.email,
      phone: data.user.phone,
      username: data.user.username,
    });

    return data.user;
  }

  async function startPhoneVerification() {
    const response = await fetch("/api/account/phone-change", {
      body: JSON.stringify({ phone: form.phone }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const data = (await response.json()) as PhoneChangeResponse;

    if (!data.ok) {
      if (data.requiresTelegramLink) {
        setPhoneModal({
          appStartUrl: data.telegramAppStartUrl,
          botUsername: data.telegramBotUsername,
          message: data.message,
          phone: form.phone,
          startUrl: data.telegramStartUrl,
          status: "telegram",
        });
        return;
      }

      throw new Error(data.message);
    }

    setPhoneModal({
      message: data.message,
      phone: form.phone,
      status: "code",
    });
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      if (form.phone !== profile.phone) {
        await startPhoneVerification();
        return;
      }

      await saveProfile();
      setMessage("Profilo aggiornato correttamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aggiornamento profilo non riuscito. Riprova tra poco.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmPhoneChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsPhoneSubmitting(true);

    try {
      const response = await fetch("/api/account/phone-change", {
        body: JSON.stringify({ code: phoneCode }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const data = (await response.json()) as PhoneChangeResponse;

      if (!data.ok) {
        setMessage(data.message);
        return;
      }

      const nextForm = {
        ...form,
        phone: data.phone ?? form.phone,
      };
      await saveProfile(nextForm);
      setPhoneCode("");
      setPhoneModal(null);
      setMessage("Numero verificato e profilo aggiornato correttamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verifica telefono non riuscita. Riprova tra poco.");
    } finally {
      setIsPhoneSubmitting(false);
    }
  }

  async function retryPhoneVerification() {
    setMessage("");
    setIsPhoneSubmitting(true);

    try {
      await startPhoneVerification();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Codice non inviato. Riprova tra poco.");
    } finally {
      setIsPhoneSubmitting(false);
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="Account"
        subtitle="Gestisci i dati principali del tuo account Survivor Arena."
        title="Profilo"
      />

      <section className="user-detail-card user-form-card" aria-label="Dati profilo">
        {message ? (
          <p
            className={`auth-form-message ${
              message.includes("correttamente")
                ? "auth-form-message-success"
                : "auth-form-message-error"
            }`}
            role="alert"
          >
            {message}
          </p>
        ) : null}

        <form className="user-account-form" onSubmit={updateProfile}>
          <div className="ui-field">
            <label className="ui-field-label" htmlFor="profile-username">
              Username
            </label>
            <input
              className="ui-input"
              id="profile-username"
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
              value={form.username}
            />
          </div>

          <div className="ui-field">
            <label className="ui-field-label" htmlFor="profile-email">
              Email
            </label>
            <input
              className="ui-input"
              id="profile-email"
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              type="email"
              value={form.email}
            />
          </div>

          <div className="ui-field">
            <label className="ui-field-label" htmlFor="profile-phone">
              Telefono
            </label>
            <input
              className="ui-input"
              id="profile-phone"
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              type="tel"
              value={form.phone}
            />
          </div>

          <div className="user-detail-row user-code-row">
            <span>Codice utente</span>
            <strong>{profile.user_code}</strong>
          </div>

          <Button className="user-form-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "SALVATAGGIO..." : "SALVA MODIFICHE"}
          </Button>
        </form>
      </section>

      {phoneModal ? (
        <div className="auth-modal-backdrop user-phone-modal" role="presentation">
          <Card
            aria-labelledby="phone-change-title"
            aria-modal="true"
            className="auth-modal-card"
            role="dialog"
          >
            <span className="auth-telegram-emblem" aria-hidden="true">
              <TelegramIcon className="auth-telegram-emblem-icon" />
            </span>
            <div className="auth-modal-copy">
              <p className="auth-kicker">Verifica telefono</p>
              <h2 className="auth-modal-title" id="phone-change-title">
                Conferma il nuovo numero
              </h2>
              <p className="auth-modal-text">{phoneModal.message}</p>
            </div>

            {phoneModal.status === "telegram" ? (
              <div className="auth-telegram-panel">
                <p>
                  Apri il bot Telegram, premi Avvia e poi torna qui per richiedere
                  il codice del nuovo numero.
                </p>
                {phoneModal.appStartUrl || phoneModal.startUrl ? (
                  <a
                    className="ui-button ui-button-primary auth-telegram-button"
                    href={phoneModal.appStartUrl || phoneModal.startUrl}
                  >
                    <TelegramIcon className="auth-telegram-button-icon" />
                    Apri Telegram
                  </a>
                ) : null}
                {phoneModal.startUrl ? (
                  <ButtonLink
                    className="auth-inline-link"
                    href={phoneModal.startUrl}
                    rel="noreferrer"
                    target="_blank"
                    variant="secondary"
                  >
                    Apri via web @{phoneModal.botUsername}
                  </ButtonLink>
                ) : null}
                <Button
                  disabled={isPhoneSubmitting}
                  onClick={() => void retryPhoneVerification()}
                  type="button"
                  variant="secondary"
                >
                  {isPhoneSubmitting ? "CONTROLLO..." : "Ho collegato Telegram"}
                </Button>
              </div>
            ) : (
              <form className="auth-form" onSubmit={confirmPhoneChange}>
                <div className="ui-field">
                  <label className="ui-field-label" htmlFor="profile-phone-code">
                    Codice OTP
                  </label>
                  <input
                    autoComplete="one-time-code"
                    className="ui-input"
                    id="profile-phone-code"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) =>
                      setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Inserisci il codice Telegram"
                    value={phoneCode}
                  />
                </div>
                <Button className="auth-submit-button" disabled={isPhoneSubmitting} type="submit">
                  {isPhoneSubmitting ? "VERIFICA..." : "CONFERMA NUMERO"}
                </Button>
              </form>
            )}

            <Button
              onClick={() => {
                setPhoneCode("");
                setPhoneModal(null);
                setForm((current) => ({ ...current, phone: profile.phone }));
              }}
              type="button"
              variant="secondary"
            >
              Annulla
            </Button>
          </Card>
        </div>
      ) : null}
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

type UserInboxMessage = {
  body: string;
  created_at: string;
  delivery_mode: "both" | "inbox" | "popup";
  id: string;
  read_at: string | null;
  title: string;
};

function PostaPage() {
  const [messages, setMessages] = useState<UserInboxMessage[]>([]);
  const [activeMessageId, setActiveMessageId] = useState("");
  const [mailActionMessage, setMailActionMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      const response = await fetch("/api/messages", {
        credentials: "include",
      });
      const data = (await response.json()) as
        | {
            messages: UserInboxMessage[];
            ok: true;
            unread_count: number;
          }
        | {
            message: string;
            ok: false;
          };

      if (!isMounted) {
        return;
      }

      if (data.ok) {
        setMessages(data.messages);
        setActiveMessageId(data.messages[0]?.id ?? "");
      }

      setIsLoading(false);
    }

    loadMessages().catch(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function openMessage(message: UserInboxMessage) {
    setMailActionMessage("");
    setActiveMessageId(message.id);

    if (message.read_at) {
      return;
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === message.id
          ? {
              ...item,
              read_at: new Date().toISOString(),
            }
          : item,
      ),
    );

    await fetch(`/api/messages/${message.id}`, {
      credentials: "include",
      method: "PATCH",
    }).catch(() => undefined);
  }

  const activeMessage = messages.find((message) => message.id === activeMessageId) ?? messages[0] ?? null;
  const unreadCount = messages.filter((message) => !message.read_at).length;
  const friendsInviteMatch = activeMessage?.body.match(/\[friends-invite:([^\]]+)\]/);
  const friendsInviteId = friendsInviteMatch?.[1] ?? "";
  const activeMessageBody = activeMessage ? activeMessage.body.replace(/\n?\[friends-invite:[^\]]+\]/, "").trim() : "";

  async function handleFriendsInvite(action: "accept" | "decline") {
    if (!friendsInviteId || !activeMessage) {
      return;
    }

    setMailActionMessage("");

    const response = await fetch(
      action === "accept"
        ? `/api/friends/competitions/${friendsInviteId}`
        : `/api/friends/competitions/${friendsInviteId}/decline`,
      {
        credentials: "include",
        method: "POST",
      },
    );
    const data = (await response.json()) as { message?: string; ok: boolean };

    if (!data.ok) {
      setMailActionMessage(data.message ?? "Invito non aggiornato. Riprova tra poco.");
      return;
    }

    await fetch(`/api/messages/${activeMessage.id}`, {
      credentials: "include",
      method: "PATCH",
    }).catch(() => undefined);

    if (action === "accept") {
      window.location.href = "/tornei";
      return;
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === activeMessage.id
          ? {
              ...message,
              read_at: message.read_at ?? new Date().toISOString(),
            }
          : message,
      ),
    );
    setMailActionMessage("Invito declinato.");
  }

  return (
    <>
      <PageIntro
        eyebrow="Comunicazioni"
        subtitle="Messaggi ufficiali inviati dallo staff Survivor Arena."
        title="Posta"
      />

      <section className="user-inbox-layout" aria-label="Posta utente">
        <div className="user-inbox-list">
          {isLoading ? (
            <div className="user-detail-card user-inbox-empty">
              <strong>Caricamento posta...</strong>
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => (
              <button
                className={`user-inbox-row ${activeMessage?.id === message.id ? "user-inbox-row-active" : ""}`}
                key={message.id}
                onClick={() => void openMessage(message)}
                type="button"
              >
                <span className="user-inbox-row-icon">
                  <MailOpen aria-hidden="true" />
                </span>
                <span>
                  <strong>{message.title}</strong>
                  <small>{new Date(message.created_at).toLocaleDateString("it-IT")}</small>
                </span>
                {!message.read_at ? <em>Nuovo</em> : null}
              </button>
            ))
          ) : (
            <div className="user-detail-card user-inbox-empty">
              <strong>Nessun messaggio</strong>
              <p>Quando lo staff invierà comunicazioni, le troverai qui.</p>
            </div>
          )}
        </div>

        <article className="user-detail-card user-inbox-detail">
          {activeMessage ? (
            <>
              <div className="user-form-heading">
                <MailOpen aria-hidden="true" className="user-setting-icon" />
                <div>
                  <p className="user-page-kicker">{activeMessage.read_at ? "Letto" : "Nuovo messaggio"}</p>
                  <h2>{activeMessage.title}</h2>
                </div>
              </div>
              <p>{activeMessageBody}</p>
              {friendsInviteId ? (
                <div className="arena-modal-actions">
                  <Button onClick={() => void handleFriendsInvite("accept")} type="button">
                    Accetta invito
                  </Button>
                  <Button onClick={() => void handleFriendsInvite("decline")} type="button" variant="secondary">
                    Declina
                  </Button>
                </div>
              ) : null}
              {mailActionMessage ? (
                <p className="auth-form-message auth-form-message-success">{mailActionMessage}</p>
              ) : null}
              <span>
                {new Date(activeMessage.created_at).toLocaleString("it-IT", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </>
          ) : (
            <>
              <div className="user-form-heading">
                <MailOpen aria-hidden="true" className="user-setting-icon" />
                <div>
                  <p className="user-page-kicker">Posta</p>
                  <h2>Tutto in ordine</h2>
                </div>
              </div>
              <p>Non hai comunicazioni da leggere.</p>
            </>
          )}
        </article>
      </section>

      {unreadCount > 0 ? (
        <p className="user-inbox-footnote">{unreadCount} messaggi ancora da leggere.</p>
      ) : null}
    </>
  );
}

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
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: "",
    currentPassword: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [telegramState, setTelegramState] = useState<{
    appStartUrl: string;
    botUsername: string;
    isLinked: boolean;
    startUrl: string;
  }>({
    appStartUrl: "",
    botUsername: "SurvivorArena_bot",
    isLinked: false,
    startUrl: "",
  });
  const [telegramMessage, setTelegramMessage] = useState("");
  const requirements = getPasswordRequirements(passwordForm.password);
  const settings = [
    {
      icon: ShieldCheck,
      text: "Proteggi il tuo account e mantieni aggiornate le credenziali.",
      title: "Sicurezza account",
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

  useEffect(() => {
    let isMounted = true;

    async function loadTelegramStatus() {
      const response = await fetch("/api/account/telegram-link", {
        credentials: "include",
      });
      const data = (await response.json()) as
        | {
            isLinked: boolean;
            ok: true;
          }
        | {
            ok: false;
          };

      if (isMounted && data.ok) {
        setTelegramState((current) => ({
          ...current,
          isLinked: data.isLinked,
        }));
      }
    }

    loadTelegramStatus().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  async function createTelegramLink() {
    setTelegramMessage("");

    try {
      const response = await fetch("/api/account/telegram-link", {
        credentials: "include",
        method: "POST",
      });
      const data = (await response.json()) as
        | {
            ok: true;
            telegramAppStartUrl?: string;
            telegramBotUsername: string;
            telegramStartUrl: string;
          }
        | {
            message: string;
            ok: false;
          };

      if (!data.ok) {
        setTelegramMessage(data.message);
        return;
      }

      setTelegramState({
        appStartUrl: data.telegramAppStartUrl || "",
        botUsername: data.telegramBotUsername,
        isLinked: false,
        startUrl: data.telegramStartUrl,
      });
      setTelegramMessage("Apri il bot e premi Avvia per completare il collegamento.");
      window.location.href = data.telegramAppStartUrl || data.telegramStartUrl;
    } catch {
      setTelegramMessage("Collegamento Telegram non disponibile. Riprova tra poco.");
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/password", {
        body: JSON.stringify(passwordForm),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const data = (await response.json()) as
        | {
            message: string;
            ok: true;
          }
        | {
            message: string;
            ok: false;
          };

      if (!data.ok) {
        setMessage(data.message);
        return;
      }

      setPasswordForm({
        confirmPassword: "",
        currentPassword: "",
        password: "",
      });
      setMessage(data.message);
    } catch {
      setMessage("Cambio password non riuscito. Riprova tra poco.");
    } finally {
      setIsSubmitting(false);
    }
  }

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

      <section className="user-detail-card user-form-card" aria-label="Telegram sicurezza">
        <div className="user-form-heading">
          <ShieldCheck aria-hidden="true" className="user-setting-icon" />
          <div>
            <p className="user-page-kicker">Telegram</p>
            <h2>Sicurezza account</h2>
          </div>
        </div>

        <p className="user-form-copy">
          {telegramState.isLinked
            ? "Telegram è collegato. Puoi usarlo per recuperare la password."
            : "Collega Telegram per OTP e recupero password senza SMS."}
        </p>

        {telegramMessage ? (
          <p className="auth-form-message auth-form-message-success" role="alert">
            {telegramMessage}
          </p>
        ) : null}

        <div className="user-telegram-actions">
          <Button onClick={createTelegramLink} type="button" variant="secondary">
            {telegramState.isLinked ? "Rigenera collegamento" : "Collega Telegram"}
          </Button>
          {telegramState.startUrl ? (
            <a
              className="ui-button ui-button-primary w-full sm:w-auto"
              href={telegramState.appStartUrl || telegramState.startUrl}
            >
              Apri app Telegram
            </a>
          ) : null}
          {telegramState.startUrl ? (
            <ButtonLink href={telegramState.startUrl} rel="noreferrer" target="_blank">
              Apri via web @{telegramState.botUsername}
            </ButtonLink>
          ) : null}
        </div>
      </section>

      <section className="user-detail-card user-form-card" aria-label="Cambio password">
        <div className="user-form-heading">
          <KeyRound aria-hidden="true" className="user-setting-icon" />
          <div>
            <p className="user-page-kicker">Sicurezza</p>
            <h2>Cambia password</h2>
          </div>
        </div>

        {message ? (
          <p
            className={`auth-form-message ${
              message.includes("correttamente")
                ? "auth-form-message-success"
                : "auth-form-message-error"
            }`}
            role="alert"
          >
            {message}
          </p>
        ) : null}

        <form className="user-account-form" onSubmit={updatePassword}>
          <div className="ui-field">
            <label className="ui-field-label" htmlFor="settings-current-password">
              Password attuale
            </label>
            <input
              autoComplete="current-password"
              className="ui-input"
              id="settings-current-password"
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
              type="password"
              value={passwordForm.currentPassword}
            />
          </div>

          <div className="ui-field">
            <label className="ui-field-label" htmlFor="settings-new-password">
              Nuova password
            </label>
            <input
              autoComplete="new-password"
              className="ui-input"
              id="settings-new-password"
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              type="password"
              value={passwordForm.password}
            />
            <ul className="auth-password-requirements" aria-label="Requisiti password">
              {requirements.map((requirement) => (
                <li
                  className={`auth-password-requirement ${
                    requirement.isMet ? "auth-password-requirement-met" : ""
                  }`}
                  key={requirement.id}
                >
                  <span aria-hidden="true">{requirement.isMet ? "✓" : "•"}</span>
                  {requirement.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="ui-field">
            <label className="ui-field-label" htmlFor="settings-confirm-password">
              Conferma password
            </label>
            <input
              autoComplete="new-password"
              className="ui-input"
              id="settings-confirm-password"
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              type="password"
              value={passwordForm.confirmPassword}
            />
          </div>

          <Button className="user-form-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "AGGIORNAMENTO..." : "AGGIORNA PASSWORD"}
          </Button>
        </form>
      </section>
    </>
  );
}
