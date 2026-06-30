"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, Heart, Lock, Plus, Shield, Swords, Trophy, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AccountUser } from "@/components/account/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import { StatCard } from "@/components/account/StatCard";
import { cn } from "@/lib/cn";
import { formatDeadline, fromDateTimeLocal, isDeadlinePassed, toDateTimeLocal, type MatchResult } from "@/lib/arena-client";

type Team = {
  id: string;
  logo_url: string | null;
  name: string;
};

type FriendsMatch = {
  away_team: string;
  away_team_id: string;
  away_team_logo_url: string | null;
  home_team: string;
  home_team_id: string;
  home_team_logo_url: string | null;
  id: string;
  is_active: number;
  result: MatchResult;
  round_id: string;
};

type FriendsRound = {
  calculated_at: string | null;
  deadline_at: string | null;
  id: string;
  matches: FriendsMatch[];
  round_number: number;
  status: "PENDING" | "OPEN" | "LOCKED" | "CALCULATED";
};

type FriendsSelection = {
  cycle_number: number;
  id: string;
  match_id: string;
  round_id: string;
  selected_team: string;
  selected_team_id: string;
  status: string;
};

type FriendsLife = {
  id: string;
  life_number: number;
  selections: FriendsSelection[];
  status: "ALIVE" | "ELIMINATED" | "WINNER";
};

type FriendsParticipant = {
  alive_lives: number;
  eliminated_lives: number;
  email: string;
  id: string;
  lives: FriendsLife[];
  status: string;
  total_lives: number;
  user_id: string;
  username: string;
};

type FriendsCompetition = {
  can_join: boolean;
  completed_at: string | null;
  current_round: FriendsRound | null;
  current_round_number: number;
  description: string | null;
  events: Array<{
    created_at: string;
    event_type: string;
    id: string;
    message: string;
    username: string | null;
  }>;
  id: string;
  invitation_count: number;
  invite_code: string;
  is_owner: boolean;
  is_participant: boolean;
  name: string;
  owner_username?: string;
  participant: FriendsParticipant | null;
  participants: FriendsParticipant[];
  public_choices: Array<{
    life_number: number;
    selected_team: string;
    status: string;
    username: string;
  }>;
  rounds: FriendsRound[];
  rules: string | null;
  status: "PENDING" | "ACTIVE" | "LOCKED" | "COMPLETED" | "CANCELLED";
};

type FriendsResponse =
  | {
      competitions: FriendsCompetition[];
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

type FriendsSingleResponse =
  | {
      competition: FriendsCompetition;
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

type TeamsResponse =
  | {
      ok: true;
      teams: Team[];
    }
  | {
      message: string;
      ok: false;
    };

type DraftMatch = {
  awayTeamId: string;
  homeTeamId: string;
  isActive: boolean;
};

const resultOptions: Array<{ label: string; value: MatchResult }> = [
  { label: "Vittoria Casa", value: "HOME_WIN" },
  { label: "Pareggio", value: "DRAW" },
  { label: "Vittoria Trasferta", value: "AWAY_WIN" },
  { label: "Rinviato", value: "POSTPONED" },
  { label: "Annullato", value: "CANCELLED" },
];

const emptyMatch: DraftMatch = {
  awayTeamId: "",
  homeTeamId: "",
  isActive: true,
};

async function fetchJson<TResponse>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  return (await response.json()) as TResponse;
}

type FriendsPageView = "manager" | "manager-detail" | "tournament-detail" | "tournaments";

function isFinishedCompetition(competition: FriendsCompetition) {
  return competition.status === "COMPLETED" || competition.status === "CANCELLED";
}

function getCurrentRound(competition: FriendsCompetition) {
  return competition.rounds.find((round) => round.round_number === competition.current_round_number) ?? competition.current_round;
}

function getSelectionStats(competitions: FriendsCompetition[]) {
  const teamCounts = new Map<string, number>();
  let selections = 0;
  let firstPlaces = 0;
  let aliveLives = 0;

  competitions.forEach((competition) => {
    const lives = competition.participant?.lives ?? [];

    if (lives.some((life) => life.status === "WINNER")) {
      firstPlaces += 1;
    }

    lives.forEach((life) => {
      if (life.status === "ALIVE" || life.status === "WINNER") {
        aliveLives += 1;
      }

      life.selections.forEach((selection) => {
        selections += 1;
        teamCounts.set(selection.selected_team, (teamCounts.get(selection.selected_team) ?? 0) + 1);
      });
    });
  });

  const favoriteTeam = Array.from(teamCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Nessuna";

  return {
    aliveLives,
    favoriteTeam,
    firstPlaces,
    selections,
  };
}

function useFriendsData(loadTeams = true) {
  const [competitions, setCompetitions] = useState<FriendsCompetition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const selected = competitions.find((competition) => competition.id === selectedId) ?? competitions[0] ?? null;

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      const competitionData = await fetchJson<FriendsResponse>("/api/friends/competitions");
      const teamData = loadTeams ? await fetchJson<TeamsResponse>("/api/friends/teams") : null;

      if (!isMounted) {
        return;
      }

      if (competitionData.ok) {
        setCompetitions(competitionData.competitions);
        setSelectedId((current) => current || competitionData.competitions[0]?.id || "");
      } else {
        setMessage(competitionData.message);
      }

      if (teamData) {
        if (teamData.ok) {
          setTeams(teamData.teams);
        } else {
          setMessage(teamData.message);
        }
      }

      setIsLoading(false);
    }

    loadInitialData().catch(() => {
      if (isMounted) {
        setMessage("Modalità Friends non disponibile. Riprova tra poco.");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [loadTeams]);

  async function mutate(url: string, init?: RequestInit) {
    setMessage("");
    const data = await fetchJson<FriendsSingleResponse>(url, init);

    if (!data.ok) {
      setMessage(data.message);
      return null;
    }

    setCompetitions((current) => {
      const exists = current.some((competition) => competition.id === data.competition.id);
      const next = exists
        ? current.map((competition) => (competition.id === data.competition.id ? data.competition : competition))
        : [data.competition, ...current];

      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setSelectedId(data.competition.id);

    return data.competition;
  }

  return {
    competitions,
    isLoading,
    message,
    mutate,
    selected,
    selectedId,
    setMessage,
    setSelectedId,
    teams,
  };
}

export function FriendsDashboardContent({ user }: { user: AccountUser }) {
  const { competitions, isLoading, message, mutate } = useFriendsData(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const activeCompetitions = competitions.filter((competition) => !isFinishedCompetition(competition));
  const finishedCompetitions = competitions.filter(isFinishedCompetition);
  const stats = getSelectionStats(competitions);

  return (
    <div className="dashboard-page-content">
      <section className="dashboard-hero-card" aria-labelledby="friends-dashboard-title">
        <div className="dashboard-hero-copy">
          <p className="user-page-kicker">Modalità Friends</p>
          <h1 id="friends-dashboard-title">Benvenuto, {user.username}</h1>
          <p>Qui vedi i tornei in corso, le tue scelte e gli inviti privati tra amici.</p>
        </div>

        <div className="dashboard-hero-status" aria-label="Tornei Friends in corso">
          <span>Tornei in corso</span>
          <strong>{activeCompetitions.length}</strong>
        </div>
      </section>

      {message ? (
        <div className="auth-form-message auth-form-message-error" role="alert">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <section className="dashboard-panel">
          <p>Caricamento dati Friends...</p>
        </section>
      ) : null}

      <section className="user-stat-grid dashboard-stat-grid" aria-label="Statistiche Friends">
        <StatCard icon={<Trophy aria-hidden="true" className="user-stat-svg" />} label="Volte primo" tone="gold" value={String(stats.firstPlaces)} />
        <StatCard icon={<Swords aria-hidden="true" className="user-stat-svg" />} label="Scelte effettuate" value={String(stats.selections)} />
        <StatCard icon={<Heart aria-hidden="true" className="user-stat-svg" />} label="Vite vive" value={String(stats.aliveLives)} />
        <StatCard icon={<Shield aria-hidden="true" className="user-stat-svg" />} label="Squadra più scelta" value={stats.favoriteTeam} />
      </section>

      <div className="dashboard-layout-grid">
        <div className="dashboard-main-stack">
          <section className="dashboard-panel">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">In gioco</p>
                <h2>Tornei in corso</h2>
              </div>
              <ButtonLink className="dashboard-section-link" href="/tornei" variant="secondary">
                Vedi tornei
              </ButtonLink>
            </div>

            {!isLoading && activeCompetitions.length > 0 ? (
              <div className="friends-tournament-grid">
                {activeCompetitions.slice(0, 4).map((competition) => (
                  <FriendsTournamentCard competition={competition} key={competition.id} />
                ))}
              </div>
            ) : !isLoading ? (
              <DashboardEmpty
                text="Quando riceverai un invito o entrerai in una competizione, la vedrai qui."
                title="Nessun torneo in corso"
              />
            ) : null}
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">Archivio</p>
                <h2>Tornei conclusi</h2>
              </div>
            </div>

            {!isLoading && finishedCompetitions.length > 0 ? (
              <div className="friends-tournament-grid">
                {finishedCompetitions.slice(0, 5).map((competition) => (
                  <FriendsTournamentCard competition={competition} key={competition.id} />
                ))}
              </div>
            ) : !isLoading ? (
              <p className="admin-muted">Nessun torneo concluso.</p>
            ) : null}
          </section>
        </div>

        <aside className="dashboard-side-stack">
          <section className="dashboard-panel">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">Azioni rapide</p>
                <h2>Friends</h2>
              </div>
            </div>
            <div className="friends-quick-actions">
              <Button onClick={() => setIsJoinOpen(true)} type="button">
                Partecipa a una competizione
              </Button>
              <ButtonLink href="/tornei" variant="secondary">
                Apri Tornei
              </ButtonLink>
            </div>
          </section>
        </aside>
      </div>

      {isJoinOpen ? (
        <JoinInviteModal
          mutate={mutate}
          onClose={() => setIsJoinOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function FriendsPage({
  competitionId,
  user,
  view = "tournaments",
}: {
  competitionId?: string;
  user: AccountUser;
  view?: FriendsPageView;
}) {
  const { competitions, isLoading, message, mutate, selected, teams } = useFriendsData(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const activeCompetitions = competitions.filter((competition) => !isFinishedCompetition(competition));
  const finishedCompetitions = competitions.filter(isFinishedCompetition);
  const ownedCompetitions = competitions.filter((competition) => competition.is_owner);
  const isManager = view === "manager";
  const isManagerDetail = view === "manager-detail";
  const isTournamentDetail = view === "tournament-detail";
  const detailCompetition = competitionId
    ? competitions.find((competition) => competition.id === competitionId && (!isManagerDetail || competition.is_owner)) ?? null
    : selected;
  const pageTitle = isManager || isManagerDetail ? "Area Manager" : isTournamentDetail ? detailCompetition?.name ?? "Torneo" : "Tornei";
  const pageCopy = isManager
    ? "Crea competizioni e apri il pannello dedicato di ogni torneo."
    : isManagerDetail
      ? "Gestisci inviti, partecipanti, vite, round e risultati di questa competizione."
      : isTournamentDetail
        ? "Dettaglio torneo Friends, scelte e storico della competizione."
        : "Tutti i tornei Friends a cui sei invitato o iscritto, separati tra in corso e conclusi.";

  return (
    <div className="dashboard-page-content">
      <header className="user-page-intro">
        <p className="user-page-kicker">Modalità Friends</p>
        <h1>{pageTitle}</h1>
        <p>{pageCopy}</p>
        <PremiumDivider />
      </header>

      {message ? (
        <div className="auth-form-message auth-form-message-error" role="alert">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <Card className="dashboard-panel">
          <p>Caricamento Friends...</p>
        </Card>
      ) : null}

      {isManagerDetail || isTournamentDetail ? (
        <FriendsDetailView
          backHref={isManagerDetail ? "/area-manager" : "/tornei"}
          backLabel={isManagerDetail ? "Torna all'Area Manager" : "Torna ai Tornei"}
          competition={detailCompetition}
          isLoading={isLoading}
          mutate={mutate}
          showManagerTools={isManagerDetail}
          teams={teams}
          user={user}
        />
      ) : isManager ? (
        <ManagerView
          competitions={ownedCompetitions}
          onCreate={() => setIsCreateOpen(true)}
        />
      ) : (
        <TournamentsView
          activeCompetitions={activeCompetitions}
          finishedCompetitions={finishedCompetitions}
          onJoin={() => setIsJoinOpen(true)}
        />
      )}

      {isCreateOpen ? (
        <CreateCompetitionModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={mutate}
          teams={teams}
        />
      ) : null}

      {isJoinOpen ? (
        <JoinInviteModal
          mutate={mutate}
          onClose={() => setIsJoinOpen(false)}
        />
      ) : null}
    </div>
  );
}

function FriendsDetailView({
  backHref,
  backLabel,
  competition,
  isLoading,
  mutate,
  showManagerTools,
  teams,
  user,
}: {
  backHref: string;
  backLabel: string;
  competition: FriendsCompetition | null;
  isLoading: boolean;
  mutate: (url: string, init?: RequestInit) => Promise<FriendsCompetition | null>;
  showManagerTools: boolean;
  teams: Team[];
  user: AccountUser;
}) {
  if (!competition && isLoading) {
    return null;
  }

  if (!competition) {
    return (
      <section className="dashboard-panel">
        <h2>Torneo non disponibile</h2>
        <p className="admin-muted">Non hai accesso a questa competizione oppure non esiste più.</p>
        <ButtonLink href={backHref} variant="secondary">
          {backLabel}
        </ButtonLink>
      </section>
    );
  }

  return (
    <div className="dashboard-main-stack">
      <div>
        <ButtonLink href={backHref} variant="secondary">
          {backLabel}
        </ButtonLink>
      </div>
      <FriendsCompetitionPanel
        competition={competition}
        mutate={mutate}
        showManagerTools={showManagerTools}
        teams={teams}
        user={user}
      />
    </div>
  );
}

function TournamentsView({
  activeCompetitions,
  finishedCompetitions,
  onJoin,
}: {
  activeCompetitions: FriendsCompetition[];
  finishedCompetitions: FriendsCompetition[];
  onJoin: () => void;
}) {
  return (
    <div className="dashboard-main-stack">
      <section className="dashboard-panel">
        <div className="dashboard-section-heading">
          <div>
            <p className="user-page-kicker">In corso</p>
            <h2>Tornei in corso</h2>
            <p className="admin-muted">Solo competizioni a cui puoi partecipare, sei iscritto o sei invitato.</p>
          </div>
          <Button onClick={onJoin} type="button" variant="secondary">
            Partecipa con codice
          </Button>
        </div>

        {activeCompetitions.length > 0 ? (
          <div className="friends-horizontal-list">
            {activeCompetitions.map((competition) => (
              <FriendsTournamentRow
                actionLabel={competition.can_join ? "Accetta invito" : "Apri torneo"}
                competition={competition}
                href={`/tornei/dettaglio?id=${competition.id}`}
                key={competition.id}
              />
            ))}
          </div>
        ) : (
          <DashboardEmpty
            text="Qui appariranno solo i tornei Friends in cui sei invitato, iscritto o organizzatore."
            title="Nessun torneo in corso"
          />
        )}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-section-heading">
          <div>
            <p className="user-page-kicker">Archivio</p>
            <h2>Tornei conclusi</h2>
            <p className="admin-muted">Storico delle competizioni terminate, con round disputati e riepilogo scelte.</p>
          </div>
        </div>

        {finishedCompetitions.length > 0 ? (
          <div className="friends-horizontal-list">
            {finishedCompetitions.map((competition) => (
              <FriendsTournamentRow
                actionLabel="Rivedi le scelte"
                competition={competition}
                href={`/tornei/dettaglio?id=${competition.id}`}
                key={competition.id}
              />
            ))}
          </div>
        ) : (
          <p className="admin-muted">Nessun torneo concluso.</p>
        )}
      </section>
    </div>
  );
}

function ManagerView({
  competitions,
  onCreate,
}: {
  competitions: FriendsCompetition[];
  onCreate: () => void;
}) {
  return (
    <div className="dashboard-main-stack">
      <section className="dashboard-panel">
        <div className="dashboard-section-heading">
          <div>
            <p className="user-page-kicker">Manager</p>
            <h2>Le competizioni che gestisci</h2>
            <p className="admin-muted">Crea nuove competizioni e apri il pannello dedicato per gestire inviti, vite e round.</p>
          </div>
          <Button onClick={onCreate} type="button">
            Crea competizione
          </Button>
        </div>

        {competitions.length > 0 ? (
          <div className="friends-horizontal-list">
            {competitions.map((competition) => (
              <FriendsTournamentRow
                actionLabel="Gestisci"
                competition={competition}
                href={`/area-manager/torneo?id=${competition.id}`}
                key={competition.id}
              />
            ))}
          </div>
        ) : (
          <DashboardEmpty
            text="Premi Crea competizione per aprire il wizard e preparare una nuova sfida privata."
            title="Nessuna competizione creata"
          />
        )}
      </section>
    </div>
  );
}

function CreateCompetitionModal({
  onClose,
  onCreate,
  teams,
}: {
  onClose: () => void;
  onCreate: (url: string, init?: RequestInit) => Promise<FriendsCompetition | null>;
  teams: Team[];
}) {
  async function create(url: string, init?: RequestInit) {
    const competition = await onCreate(url, init);

    if (competition) {
      onClose();
    }

    return competition;
  }

  return (
    <div className="arena-modal-backdrop" role="presentation">
      <Card aria-modal="true" className="arena-modal-card friends-create-modal" role="dialog">
        <button aria-label="Chiudi creazione competizione" className="admin-modal-close" onClick={onClose} type="button">
          ×
        </button>
        <CreateFriendsWizard onCreate={create} teams={teams} />
      </Card>
    </div>
  );
}

function JoinInviteModal({
  mutate,
  onClose,
}: {
  mutate: (url: string, init?: RequestInit) => Promise<FriendsCompetition | null>;
  onClose: () => void;
}) {
  const [inviteCode, setInviteCode] = useState("");

  async function join() {
    const updated = await mutate("/api/friends/join", {
      body: JSON.stringify({ inviteCode }),
      method: "POST",
    });

    if (updated) {
      setInviteCode("");
      onClose();
    }
  }

  return (
    <div className="arena-modal-backdrop" role="presentation">
      <Card aria-modal="true" className="arena-modal-card" role="dialog">
        <button aria-label="Chiudi invito" className="admin-modal-close" onClick={onClose} type="button">
          ×
        </button>
        <p className="user-page-kicker">Invito Friends</p>
        <h2>Partecipa a una competizione</h2>
        <p className="admin-muted">Inserisci il codice che hai ricevuto dall&apos;organizzatore.</p>
        <input
          className="ui-input"
          onChange={(event) => setInviteCode(event.target.value)}
          placeholder="FR-ABCDEFGH"
          value={inviteCode}
        />
        <div className="arena-modal-actions">
          <Button onClick={() => void join()} type="button">
            Entra
          </Button>
          <Button onClick={onClose} type="button" variant="secondary">
            Annulla
          </Button>
        </div>
      </Card>
    </div>
  );
}

function FriendsTournamentRow({
  actionLabel,
  competition,
  href,
}: {
  actionLabel: string;
  competition: FriendsCompetition;
  href: string;
}) {
  const currentRound = getCurrentRound(competition);
  const statusLabel = isFinishedCompetition(competition) ? "Concluso" : competition.can_join ? "Invito" : "In corso";
  const roundsPlayed = competition.rounds.filter((round) => round.status === "CALCULATED").length;

  return (
    <Link className="friends-tournament-row" href={href}>
      <span className="dashboard-action-icon">
        <Trophy aria-hidden="true" />
      </span>
      <span className="friends-tournament-row-main">
        <strong>{competition.name}</strong>
        <small>{competition.description || "Competizione Friends privata"}</small>
      </span>
      <span>
        <small>Stato</small>
        <strong>{statusLabel}</strong>
      </span>
      <span>
        <small>Round disputati</small>
        <strong>{roundsPlayed}</strong>
      </span>
      <span>
        <small>Deadline</small>
        <strong>{formatDeadline(currentRound?.deadline_at ?? null)}</strong>
      </span>
      <em>{actionLabel}</em>
    </Link>
  );
}

function FriendsTournamentCard({
  competition,
  href,
  isSelected,
  onSelect,
}: {
  competition: FriendsCompetition;
  href?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const currentRound = getCurrentRound(competition);
  const role = competition.is_owner ? "Organizzatore" : competition.can_join ? "Invito ricevuto" : "Partecipante";

  const content = (
    <>
      <div className="dashboard-arena-top">
        <span className="dashboard-arena-status">{role}</span>
        <span>{competition.status}</span>
      </div>
      <div className="dashboard-arena-copy">
        <h3>{competition.name}</h3>
        <p>{competition.description || `Round ${competition.current_round_number}`}</p>
      </div>
      <div className="dashboard-arena-meta">
        <div>
          <Clock3 aria-hidden="true" className="dashboard-small-icon" />
          <span>{formatDeadline(currentRound?.deadline_at ?? null)}</span>
        </div>
        <div>
          <UsersRound aria-hidden="true" className="dashboard-small-icon" />
          <span>{competition.participants.length} partecipanti</span>
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link className="dashboard-arena-card friends-tournament-card" href={href}>
        {content}
      </Link>
    );
  }

  if (onSelect) {
    return (
      <button
        className={cn("dashboard-arena-card friends-tournament-card", isSelected && "user-nav-link-active")}
        onClick={onSelect}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <article className="dashboard-arena-card friends-tournament-card">
      {content}
    </article>
  );
}

function DashboardEmpty({ text, title }: { text: string; title: string }) {
  return (
    <div className="dashboard-empty-state">
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function CreateFriendsWizard({
  onCreate,
  teams,
}: {
  onCreate: (url: string, init?: RequestInit) => Promise<FriendsCompetition | null>;
  teams: Team[];
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState({
    deadline: "",
    description: "",
    name: "",
    rules: "",
  });
  const [matches, setMatches] = useState<DraftMatch[]>([{ ...emptyMatch }]);

  async function submit() {
    const competition = await onCreate("/api/friends/competitions", {
      body: JSON.stringify({
        deadlineAt: fromDateTimeLocal(draft.deadline),
        description: draft.description,
        matches,
        name: draft.name,
        rules: draft.rules,
      }),
      method: "POST",
    });

    if (competition) {
      setStep(1);
      setDraft({
        deadline: "",
        description: "",
        name: "",
        rules: "",
      });
      setMatches([{ ...emptyMatch }]);
    }
  }

  return (
    <section className="friends-wizard-panel">
      <div className="dashboard-section-heading">
        <div>
          <p className="user-page-kicker">Wizard Friends</p>
          <h2>Crea competizione</h2>
        </div>
        <span className="ui-badge ui-badge-gold">Step {step}/5</span>
      </div>

      {step === 1 ? (
        <div className="admin-form-grid">
          <label>
            Nome competizione
            <input
              className="ui-input"
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Derby tra amici"
              value={draft.name}
            />
          </label>
          <label>
            Descrizione
            <textarea
              className="ui-input"
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="Sfida privata del weekend"
              value={draft.description}
            />
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <label>
          Regolamento libero
          <textarea
            className="ui-input"
            onChange={(event) => setDraft((current) => ({ ...current, rules: event.target.value }))}
            placeholder="Scrivi qui le regole concordate con gli amici."
            value={draft.rules}
          />
        </label>
      ) : null}

      {step === 3 ? (
        <div className="admin-stack">
          {matches.map((match, index) => (
            <div className="admin-form-grid" key={`draft-match-${index}`}>
              <TeamSelect
                label="Squadra casa"
                onChange={(value) =>
                  setMatches((current) =>
                    current.map((item, itemIndex) => itemIndex === index ? { ...item, homeTeamId: value } : item),
                  )
                }
                teams={teams}
                value={match.homeTeamId}
              />
              <TeamSelect
                label="Squadra trasferta"
                onChange={(value) =>
                  setMatches((current) =>
                    current.map((item, itemIndex) => itemIndex === index ? { ...item, awayTeamId: value } : item),
                  )
                }
                teams={teams}
                value={match.awayTeamId}
              />
              <label className="admin-checkbox-row">
                <input
                  checked={match.isActive}
                  onChange={(event) =>
                    setMatches((current) =>
                      current.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: event.target.checked } : item),
                    )
                  }
                  type="checkbox"
                />
                Match attivo
              </label>
            </div>
          ))}
          <Button
            onClick={() => setMatches((current) => [...current, { ...emptyMatch }])}
            type="button"
            variant="secondary"
          >
            <Plus aria-hidden="true" className="admin-button-icon" />
            Aggiungi match
          </Button>
        </div>
      ) : null}

      {step === 4 ? (
        <label>
          Deadline scelte
          <input
            className="ui-input"
            onChange={(event) => setDraft((current) => ({ ...current, deadline: event.target.value }))}
            type="datetime-local"
            value={draft.deadline}
          />
        </label>
      ) : null}

      {step === 5 ? (
        <div className="admin-tool-card">
          <h3>{draft.name || "Competizione Friends"}</h3>
          <p className="admin-muted">{draft.description || "Pronta per partire."}</p>
          <p className="admin-muted">
            La competizione verrà creata attiva subito. Sarà visibile solo a te, agli utenti invitati e ai partecipanti.
          </p>
        </div>
      ) : null}

      <div className="arena-modal-actions">
        <Button disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))} type="button" variant="secondary">
          Indietro
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep((current) => Math.min(5, current + 1))} type="button">
            Continua
          </Button>
        ) : (
          <Button onClick={() => void submit()} type="button">
            Crea competizione
          </Button>
        )}
      </div>
    </section>
  );
}

function FriendsCompetitionPanel({
  competition,
  mutate,
  showManagerTools = true,
  teams,
  user,
}: {
  competition: FriendsCompetition;
  mutate: (url: string, init?: RequestInit) => Promise<FriendsCompetition | null>;
  showManagerTools?: boolean;
  teams: Team[];
  user: AccountUser;
}) {
  const currentRound = competition.rounds.find((round) => round.round_number === competition.current_round_number) ?? null;
  const participant = competition.participant;
  const aliveLives = participant?.lives.filter((life) => life.status === "ALIVE") ?? [];
  const [selectedLifeId, setSelectedLifeId] = useState("");
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [deadlineEdits, setDeadlineEdits] = useState<Record<string, string>>({});
  const [newMatch, setNewMatch] = useState<DraftMatch>({ ...emptyMatch });
  const [results, setResults] = useState<Record<string, MatchResult>>({});
  const selectedLife = aliveLives.find((life) => life.id === selectedLifeId) ?? aliveLives[0] ?? null;
  const choicesLocked = !currentRound || currentRound.status !== "OPEN" || isDeadlinePassed(currentRound.deadline_at);
  const deadline = currentRound ? deadlineEdits[currentRound.id] ?? toDateTimeLocal(currentRound.deadline_at) : "";

  async function choose(match: FriendsMatch, teamId: string) {
    if (!selectedLife) {
      return;
    }

    await mutate(`/api/friends/lives/${selectedLife.id}/choice`, {
      body: JSON.stringify({
        matchId: match.id,
        selectedTeamId: teamId,
      }),
      method: "POST",
    });
  }

  return (
    <Card className="dashboard-panel">
      <div className="dashboard-section-heading">
        <div>
          <p className="user-page-kicker">{competition.is_owner ? "Dashboard organizzatore" : "Competizione Friends"}</p>
          <h2>{competition.name}</h2>
          <p className="admin-muted">{competition.description || "Competizione privata tra amici."}</p>
        </div>
        <span className="ui-badge ui-badge-gold">{competition.status}</span>
      </div>

      <section className="arena-summary-grid" aria-label="Riepilogo Friends">
        <Summary icon={UsersRound} label="Partecipanti" value={String(competition.participants.length)} />
        <Summary icon={Heart} label="Vite vive" value={String(competition.participants.reduce((sum, item) => sum + item.alive_lives, 0))} />
        <Summary icon={Clock3} label="Deadline" value={formatDeadline(currentRound?.deadline_at ?? null)} />
        <Summary icon={Shield} label="Codice invito" value={competition.invite_code} />
      </section>

      {competition.can_join ? (
        <div className="admin-tool-card">
          <strong>Hai ricevuto un invito</strong>
          <p className="admin-muted">Entra nella competizione per ricevere le vite assegnate.</p>
          <div className="arena-modal-actions">
            <Button onClick={() => mutate(`/api/friends/competitions/${competition.id}`, { method: "POST" })} type="button">
              Accetta invito
            </Button>
            <Button
              onClick={async () => {
                await fetch(`/api/friends/competitions/${competition.id}/decline`, {
                  credentials: "include",
                  method: "POST",
                });
                window.location.reload();
              }}
              type="button"
              variant="secondary"
            >
              Declina
            </Button>
          </div>
        </div>
      ) : null}

      {competition.rules ? (
        <div className="admin-tool-card">
          <strong>Regolamento</strong>
          <p>{competition.rules}</p>
        </div>
      ) : null}

      {competition.is_owner && showManagerTools ? (
        <div className="dashboard-main-stack">
          <section className="admin-tool-card">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">Centro gestione</p>
                <h3>Organizza la competizione</h3>
              </div>
            </div>
            <p className="admin-muted">
              Invita amici, assegna vite e gestisci il round corrente da un unico pannello. Gli invitati riceveranno un messaggio nella Posta.
            </p>
          </section>

          <section className="admin-tool-card">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">Inviti</p>
                <h3>Invita amici</h3>
              </div>
            </div>
            <p className="admin-muted">Cerca per username o email. Se l&apos;utente esiste, riceverà un invito con Accetta/Declina nella Posta.</p>
            <div className="admin-form-grid">
              <input
                className="ui-input"
                onChange={(event) => setInviteIdentifier(event.target.value)}
                placeholder="Username o email"
                value={inviteIdentifier}
              />
              <Button
                onClick={async () => {
                  const updated = await mutate(`/api/friends/competitions/${competition.id}/invite`, {
                    body: JSON.stringify({ identifier: inviteIdentifier }),
                    method: "POST",
                  });
                  if (updated) {
                    setInviteIdentifier("");
                  }
                }}
                type="button"
              >
                Invita
              </Button>
            </div>
          </section>

          <section className="admin-tool-card">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">Partecipanti</p>
                <h3>Gestione vite</h3>
              </div>
            </div>
            <div className="admin-user-movement-list">
              {competition.participants.map((item) => (
                <article className="admin-user-movement-row" key={item.id}>
                  <span>{item.username}</span>
                  <strong>
                    {item.alive_lives} vive / {item.eliminated_lives} eliminate
                  </strong>
                  <ParticipantControls
                    currentLives={item.total_lives}
                    disabled={item.user_id === user.id}
                    key={`${item.id}-${item.total_lives}`}
                    onRemove={() =>
                      mutate(`/api/friends/competitions/${competition.id}/participants`, {
                        body: JSON.stringify({ participantId: item.id }),
                        method: "DELETE",
                      })
                    }
                    onSetLives={(lives) =>
                      mutate(`/api/friends/competitions/${competition.id}/participants`, {
                        body: JSON.stringify({ lives, participantId: item.id }),
                        method: "PATCH",
                      })
                    }
                  />
                </article>
              ))}
            </div>
          </section>

          {currentRound ? (
            <section className="admin-tool-card">
              <div className="dashboard-section-heading">
                <div>
                  <p className="user-page-kicker">Round corrente</p>
                  <h3>Round {currentRound.round_number}</h3>
                </div>
                <span className="ui-badge">{currentRound.status}</span>
              </div>

              <div className="friends-management-step">
                <strong>1. Deadline e stato scelte</strong>
                <p className="admin-muted">Aggiorna la scadenza o blocca le scelte quando vuoi chiudere il round.</p>
              <div className="admin-form-grid">
                <input
                  className="ui-input"
                  onChange={(event) => {
                    if (!currentRound) {
                      return;
                    }

                    setDeadlineEdits((current) => ({
                      ...current,
                      [currentRound.id]: event.target.value,
                    }));
                  }}
                  type="datetime-local"
                  value={deadline}
                />
                <Button
                  onClick={() =>
                    mutate(`/api/friends/competitions/${competition.id}/round`, {
                      body: JSON.stringify({
                        deadlineAt: fromDateTimeLocal(deadline),
                        roundId: currentRound.id,
                      }),
                      method: "PATCH",
                    })
                  }
                  type="button"
                  variant="secondary"
                >
                  Aggiorna deadline
                </Button>
              </div>

              <div className="arena-modal-actions">
                <Button
                  onClick={() =>
                    mutate(`/api/friends/competitions/${competition.id}/round`, {
                      body: JSON.stringify({ action: "open" }),
                      method: "POST",
                    })
                  }
                  type="button"
                  variant="secondary"
                >
                  Riapri scelte
                </Button>
                <Button
                  onClick={() =>
                    mutate(`/api/friends/competitions/${competition.id}/round`, {
                      body: JSON.stringify({ action: "lock" }),
                      method: "POST",
                    })
                  }
                  type="button"
                >
                  Blocca scelte
                </Button>
              </div>
              </div>

              <div className="friends-management-step">
                <strong>2. Match e risultati</strong>
                <p className="admin-muted">Imposta l&apos;esito di ogni match prima di calcolare il round.</p>
              <div className="admin-stack">
                {currentRound.matches.map((match) => (
                  <article className="arena-match-choice-card" key={match.id}>
                    <div className="arena-match-title">
                      <strong>{match.home_team}</strong>
                      <span>vs</span>
                      <strong>{match.away_team}</strong>
                    </div>
                    <select
                      className="admin-select"
                      onChange={(event) =>
                        setResults((current) => ({
                          ...current,
                          [match.id]: event.target.value as MatchResult,
                        }))
                      }
                      value={results[match.id] ?? match.result}
                    >
                      <option value="PENDING">Risultato</option>
                      {resultOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
              </div>

              <div className="friends-management-step">
                <strong>3. Aggiungi match</strong>
              <div className="admin-form-grid">
                <TeamSelect label="Casa" onChange={(value) => setNewMatch((current) => ({ ...current, homeTeamId: value }))} teams={teams} value={newMatch.homeTeamId} />
                <TeamSelect label="Trasferta" onChange={(value) => setNewMatch((current) => ({ ...current, awayTeamId: value }))} teams={teams} value={newMatch.awayTeamId} />
                <Button
                  onClick={() =>
                    mutate(`/api/friends/competitions/${competition.id}/matches`, {
                      body: JSON.stringify({
                        ...newMatch,
                        roundId: currentRound.id,
                      }),
                      method: "POST",
                    })
                  }
                  type="button"
                  variant="secondary"
                >
                  Aggiungi match
                </Button>
              </div>
              </div>

              <div className="friends-management-step">
                <strong>4. Calcolo round</strong>
                <p className="admin-muted">Quando tutti gli esiti sono pronti, il sistema aggiorna vite vive, vite eliminate e storico.</p>
              <Button
                onClick={() =>
                  mutate(`/api/friends/rounds/${currentRound.id}/calculate`, {
                    body: JSON.stringify({
                      results: currentRound.matches.map((match) => ({
                        matchId: match.id,
                        result: results[match.id] ?? match.result,
                      })),
                    }),
                    method: "POST",
                  })
                }
                type="button"
                variant="gold"
              >
                Calcola Round
              </Button>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {participant && currentRound ? (
        <section className="arena-round-panel">
          <div className="arena-section-heading">
            <div>
              <p className="user-page-kicker">Le tue vite</p>
              <h2>Round {currentRound.round_number}</h2>
            </div>
            {choicesLocked ? (
              <span className="arena-locked-pill">
                <Lock aria-hidden="true" />
                Scelte bloccate
              </span>
            ) : null}
          </div>

          <div className="arena-life-selector">
            {participant.lives.map((life) => {
              const selection = life.selections.find((item) => item.round_id === currentRound.id);

              return (
                <button
                  className={cn("arena-life-chip", selectedLife?.id === life.id && "arena-life-chip-active", life.status !== "ALIVE" && "arena-life-chip-dead")}
                  disabled={life.status !== "ALIVE"}
                  key={life.id}
                  onClick={() => setSelectedLifeId(life.id)}
                  type="button"
                >
                  <Heart aria-hidden="true" />
                  <span>Vita {life.life_number}</span>
                  {selection ? <strong>{selection.selected_team}</strong> : null}
                </button>
              );
            })}
          </div>

          {!choicesLocked ? (
            <div className="arena-match-choice-grid">
              {currentRound.matches.map((match) => {
                const selection = selectedLife?.selections.find((item) => item.round_id === currentRound.id);

                return (
                  <article className="arena-match-choice-card" key={match.id}>
                    <div className="arena-match-title">
                      <strong>{match.home_team}</strong>
                      <span>vs</span>
                      <strong>{match.away_team}</strong>
                    </div>
                    <div className="arena-team-actions">
                      <TeamButton
                        disabled={!match.is_active}
                        isSelected={selection?.selected_team_id === match.home_team_id}
                        logoUrl={match.home_team_logo_url}
                        onClick={() => choose(match, match.home_team_id)}
                        team={match.home_team}
                      />
                      <TeamButton
                        disabled={!match.is_active}
                        isSelected={selection?.selected_team_id === match.away_team_id}
                        logoUrl={match.away_team_logo_url}
                        onClick={() => choose(match, match.away_team_id)}
                        team={match.away_team}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <Card className="arena-locked-card">
              <Lock aria-hidden="true" />
              <h3>Round in corso</h3>
              <p>Le scelte sono bloccate. Puoi consultare le scelte pubbliche.</p>
            </Card>
          )}
        </section>
      ) : null}

      {competition.public_choices.length > 0 ? (
        <section className="arena-public-choices">
          <div className="arena-section-heading">
            <div>
              <p className="user-page-kicker">Trasparenza</p>
              <h2>Scelte pubbliche</h2>
            </div>
          </div>
          <div className="arena-public-list">
            {competition.public_choices.map((choice) => (
              <article key={`${choice.username}-${choice.life_number}-${choice.selected_team}`}>
                <strong>{choice.username}</strong>
                <span>Vita {choice.life_number}</span>
                <em>{choice.selected_team}</em>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="admin-tool-card">
        <div className="dashboard-section-heading">
          <div>
            <p className="user-page-kicker">Storico</p>
            <h3>Eventi</h3>
          </div>
        </div>
        <div className="dashboard-movement-list">
          {competition.events.length > 0 ? (
            competition.events.map((event) => (
              <article className="dashboard-movement-row" key={event.id}>
                <span>{new Date(event.created_at).toLocaleString("it-IT")}</span>
                <strong>{event.message}</strong>
              </article>
            ))
          ) : (
            <p className="admin-muted">Nessun evento registrato.</p>
          )}
        </div>
      </section>
    </Card>
  );
}

function ParticipantControls({
  currentLives,
  disabled,
  onRemove,
  onSetLives,
}: {
  currentLives: number;
  disabled: boolean;
  onRemove: () => Promise<FriendsCompetition | null>;
  onSetLives: (lives: number) => Promise<FriendsCompetition | null>;
}) {
  const [value, setValue] = useState(String(currentLives));

  return (
    <span className="admin-user-row-actions">
      <input
        className="ui-input"
        min={0}
        onChange={(event) => setValue(event.target.value)}
        type="number"
        value={value}
      />
      <button className="admin-user-action-button" onClick={() => onSetLives(Number(value))} type="button">
        Salva vite
      </button>
      <button className="admin-user-action-button admin-user-action-button-secondary" disabled={disabled} onClick={onRemove} type="button">
        Rimuovi
      </button>
    </span>
  );
}

function TeamSelect({
  label,
  onChange,
  teams,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  teams: Team[];
  value: string;
}) {
  return (
    <label>
      {label}
      <select className="admin-select" onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">Seleziona squadra</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="arena-summary-card">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TeamButton({
  disabled,
  isSelected,
  logoUrl,
  onClick,
  team,
}: {
  disabled: boolean;
  isSelected: boolean;
  logoUrl: string | null;
  onClick: () => void;
  team: string;
}) {
  return (
    <button
      className={cn("arena-team-button", isSelected && "arena-team-button-selected")}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="arena-team-logo" src={logoUrl} />
      ) : (
        <span className="arena-team-logo-placeholder">{team.slice(0, 2).toUpperCase()}</span>
      )}
      <span>{team}</span>
      {isSelected ? <CheckCircle2 aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
    </button>
  );
}
