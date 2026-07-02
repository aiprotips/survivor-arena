"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clipboard,
  Clock3,
  Heart,
  History,
  ListChecks,
  Lock,
  Minus,
  Pencil,
  Plus,
  Search,
  Share2,
  Shield,
  Swords,
  Trash2,
  Trophy,
  UserPlus,
  UsersRound,
} from "lucide-react";
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
  status: "ACTIVE" | "PENDING" | "REMOVED" | "ELIMINATED" | "WINNER";
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

type FriendsMutate = (url: string, init?: RequestInit) => Promise<FriendsCompetition | null>;

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

function getTeamInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SA";
}

function formatFriendsGameCountdown(deadline: string | null, now: number) {
  if (!deadline) {
    return {
      days: "--",
      hours: "--",
      label: "Deadline da impostare",
      minutes: "--",
      seconds: "--",
      tone: "idle" as const,
    };
  }

  const diff = Date.parse(deadline) - now;

  if (diff <= 0) {
    return {
      days: "00",
      hours: "00",
      label: "Scelte chiuse",
      minutes: "00",
      seconds: "00",
      tone: "locked" as const,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const label = days > 0
    ? `${days}g ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`
    : `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  const tone = diff <= 10_000 ? "pulse" : diff <= 3_600_000 ? "danger" : diff <= 86_400_000 ? "warning" : "normal";

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    label,
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    tone,
  };
}

function getFriendsLifeSelection(life: FriendsLife, round: FriendsRound | null) {
  if (!round) {
    return null;
  }

  return life.selections.find((selection) => selection.round_id === round.id) ?? null;
}

function getFriendsSelectionVisual(life: FriendsLife, round: FriendsRound | null) {
  const selection = getFriendsLifeSelection(life, round);
  const match = selection && round ? round.matches.find((item) => item.id === selection.match_id) : null;
  const logoUrl =
    selection?.selected_team_id && match?.home_team_id === selection.selected_team_id
      ? match.home_team_logo_url
      : selection?.selected_team_id && match?.away_team_id === selection.selected_team_id
        ? match.away_team_logo_url
        : selection?.selected_team.toLowerCase() === match?.home_team.toLowerCase()
          ? match?.home_team_logo_url ?? null
          : selection?.selected_team.toLowerCase() === match?.away_team.toLowerCase()
            ? match?.away_team_logo_url ?? null
            : null;

  return selection
    ? {
        logoUrl: logoUrl ?? null,
        name: selection.selected_team,
        selection,
      }
    : null;
}

function getFriendsTeamKey(teamId: string, teamName: string) {
  return teamId || teamName.trim().toLowerCase();
}

function getFriendsCurrentCycle(life: FriendsLife | null) {
  if (!life || life.selections.length === 0) {
    return 1;
  }

  return Math.max(...life.selections.map((selection) => selection.cycle_number));
}

function getFriendsLifeCycleSelections(life: FriendsLife | null) {
  if (!life) {
    return [];
  }

  const cycle = getFriendsCurrentCycle(life);

  return life.selections.filter((selection) => selection.cycle_number === cycle);
}

function isFriendsTeamUsedByLife(life: FriendsLife | null, round: FriendsRound | null, teamId: string, teamName: string) {
  if (!life || !round) {
    return false;
  }

  const teamKey = getFriendsTeamKey(teamId, teamName);

  return getFriendsLifeCycleSelections(life).some((selection) => {
    if (selection.round_id === round.id) {
      return false;
    }

    return getFriendsTeamKey(selection.selected_team_id, selection.selected_team) === teamKey;
  });
}

function buildFriendsPopularChoices(competition: FriendsCompetition, round: FriendsRound | null) {
  const choices = competition.public_choices;
  const total = Math.max(choices.length, 1);
  const counts = new Map<string, { count: number; logoUrl: string | null; name: string }>();

  choices.forEach((choice) => {
    const match = round?.matches.find((item) => item.home_team === choice.selected_team || item.away_team === choice.selected_team);
    const logoUrl =
      choice.selected_team === match?.home_team
        ? match?.home_team_logo_url ?? null
        : choice.selected_team === match?.away_team
          ? match?.away_team_logo_url ?? null
          : null;
    const current = counts.get(choice.selected_team) ?? { count: 0, logoUrl, name: choice.selected_team };

    counts.set(choice.selected_team, {
      ...current,
      count: current.count + 1,
      logoUrl: current.logoUrl ?? logoUrl,
    });
  });

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      percent: Math.round((item.count / total) * 100),
    }));
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

  if (showManagerTools) {
    return (
      <FriendsManagerCompetitionView
        backHref={backHref}
        competition={competition}
        mutate={mutate}
        teams={teams}
        user={user}
      />
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

type FriendsManagerModal =
  | { type: "add-participant" }
  | { type: "add-match" }
  | { type: "deadline" }
  | { action: "lock" | "open"; type: "round-status" }
  | { type: "calculate" }
  | { type: "history" }
  | { participant: FriendsParticipant; type: "approve-participant" }
  | { participant: FriendsParticipant; type: "edit-lives" }
  | { participant: FriendsParticipant; type: "remove-participant" }
  | { type: "delete" }
  | null;

function FriendsManagerCompetitionView({
  backHref,
  competition,
  mutate,
  teams,
  user,
}: {
  backHref: string;
  competition: FriendsCompetition;
  mutate: FriendsMutate;
  teams: Team[];
  user: AccountUser;
}) {
  const [modal, setModal] = useState<FriendsManagerModal>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [now, setNow] = useState(0);
  const currentRound = getCurrentRound(competition);
  const stats = getFriendsManagerStats(competition, currentRound);

  useEffect(() => {
    window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  async function copyInviteCode() {
    await navigator.clipboard?.writeText(competition.invite_code);
    setCopyMessage("Codice copiato");
    window.setTimeout(() => setCopyMessage(""), 1800);
  }

  async function shareInvite() {
    const text = `Invito a ${competition.name}. Codice: ${competition.invite_code}`;

    if (navigator.share) {
      await navigator.share({
        text,
        title: "Survivor Arena Friends",
      });
      return;
    }

    await copyInviteCode();
  }

  async function deleteCompetition() {
    const response = await fetch(`/api/friends/competitions/${competition.id}`, {
      credentials: "include",
      method: "DELETE",
    });
    const payload = await response.json() as { ok: boolean };

    if (payload.ok) {
      window.location.href = "/area-manager";
    }
  }

  return (
    <div className="dashboard-main-stack friends-manager-page">
      <nav className="friends-manager-breadcrumb" aria-label="Percorso">
        <Link href={backHref}>← Torna indietro</Link>
        <span>/</span>
        <Link href="/area-manager">Area Manager</Link>
        <span>/</span>
        <strong>{competition.name}</strong>
      </nav>

      <CompetitionSummaryCard
        competition={competition}
        countdown={formatCountdown(currentRound?.deadline_at ?? null, now)}
        currentRound={currentRound}
        onCopy={() => void copyInviteCode()}
        onShare={() => void shareInvite()}
        stats={stats}
      />
      {copyMessage ? <p className="friends-manager-copy-message">{copyMessage}</p> : null}

      <div className="friends-manager-control-grid">
        <QuickActionsCard
          currentRound={currentRound}
          onAddMatch={() => setModal({ type: "add-match" })}
          onAddParticipant={() => setModal({ type: "add-participant" })}
          onCalculate={() => setModal({ type: "calculate" })}
          onChangeDeadline={() => setModal({ type: "deadline" })}
          onDelete={() => setModal({ type: "delete" })}
          onHistory={() => setModal({ type: "history" })}
          onToggleChoices={() => setModal({ action: currentRound?.status === "OPEN" ? "lock" : "open", type: "round-status" })}
        />
        <RoundStatusCard currentRound={currentRound} stats={stats} />
        <CurrentRoundCard competition={competition} currentRound={currentRound} isPreview />
      </div>

      <InfoBanner currentRound={currentRound} />

      <ParticipantsManagerCard
        competition={competition}
        mutate={mutate}
        onAdd={() => setModal({ type: "add-participant" })}
        onApprove={(participant) => setModal({ participant, type: "approve-participant" })}
        onEditLives={(participant) => setModal({ participant, type: "edit-lives" })}
        onRemove={(participant) => setModal({ participant, type: "remove-participant" })}
        user={user}
      />

      <ManagerEventsCard competition={competition} />

      {modal?.type === "add-participant" ? (
        <AddParticipantModal competition={competition} mutate={mutate} onClose={() => setModal(null)} />
      ) : null}

      {modal?.type === "add-match" && currentRound ? (
        <AddMatchModal competition={competition} currentRound={currentRound} mutate={mutate} onClose={() => setModal(null)} teams={teams} />
      ) : null}

      {modal?.type === "deadline" && currentRound ? (
        <DeadlineModal competition={competition} currentRound={currentRound} mutate={mutate} onClose={() => setModal(null)} />
      ) : null}

      {modal?.type === "round-status" && currentRound ? (
        <ConfirmActionModal
          confirmLabel={modal.action === "lock" ? "Blocca scelte" : "Riapri scelte"}
          message={modal.action === "lock" ? "Vuoi bloccare immediatamente le scelte?" : "Vuoi riaprire le scelte per questo round?"}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const updated = await mutate(`/api/friends/competitions/${competition.id}/round`, {
              body: JSON.stringify({ action: modal.action }),
              method: "POST",
            });

            if (updated) {
              setModal(null);
            }
          }}
          tone="normal"
          title={modal.action === "lock" ? "Blocca scelte" : "Riapri scelte"}
        />
      ) : null}

      {modal?.type === "calculate" && currentRound ? (
        <CalculateRoundModal
          competition={competition}
          currentRound={currentRound}
          mutate={mutate}
          onClose={() => setModal(null)}
        />
      ) : null}

      {modal?.type === "history" ? (
        <HistoryRoundModal competition={competition} onClose={() => setModal(null)} />
      ) : null}

      {modal?.type === "edit-lives" ? (
        <EditLivesModal competition={competition} mutate={mutate} onClose={() => setModal(null)} participant={modal.participant} />
      ) : null}

      {modal?.type === "approve-participant" ? (
        <ConfirmActionModal
          confirmLabel="Accetta"
          message={`Vuoi accettare ${modal.participant.username} nella competizione? Partirà con le vite assegnate e potrà giocare dal round corrente.`}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const updated = await mutate(`/api/friends/competitions/${competition.id}/participants`, {
              body: JSON.stringify({ action: "approve", participantId: modal.participant.id }),
              method: "PATCH",
            });

            if (updated) {
              setModal(null);
            }
          }}
          tone="normal"
          title="Accetta partecipante"
        />
      ) : null}

      {modal?.type === "remove-participant" ? (
        <ConfirmActionModal
          confirmLabel="Elimina"
          message={`Vuoi rimuovere ${modal.participant.username} dalla competizione? Le sue vite verranno eliminate.`}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            const updated = await mutate(`/api/friends/competitions/${competition.id}/participants`, {
              body: JSON.stringify({ participantId: modal.participant.id }),
              method: "DELETE",
            });

            if (updated) {
              setModal(null);
            }
          }}
          tone="danger"
          title="Rimuovi partecipante"
        />
      ) : null}

      {modal?.type === "delete" ? (
        <ConfirmActionModal
          confirmLabel="Elimina"
          message="Vuoi eliminare definitivamente questa competizione? Questa azione non può essere annullata."
          onClose={() => setModal(null)}
          onConfirm={deleteCompetition}
          tone="danger"
          title="Elimina competizione"
        />
      ) : null}
    </div>
  );
}

function CompetitionSummaryCard({
  competition,
  countdown,
  currentRound,
  onCopy,
  onShare,
  stats,
}: {
  competition: FriendsCompetition;
  countdown: string;
  currentRound: FriendsRound | null;
  onCopy: () => void;
  onShare: () => void;
  stats: FriendsManagerStats;
}) {
  return (
    <Card className="friends-manager-summary">
      <div className="friends-manager-summary-top">
        <div className="friends-manager-title-block">
          <span className="friends-manager-trophy">
            <Trophy aria-hidden="true" />
          </span>
          <span>
            <span className="ui-badge ui-badge-gold">{competition.status === "ACTIVE" ? "IN CORSO" : competition.status}</span>
            <h1>{competition.name}</h1>
            <p>{competition.description || "Competizione privata tra amici."}</p>
          </span>
        </div>

        <div className="friends-manager-invite-box">
          <span>Codice invito</span>
          <strong>{competition.invite_code}</strong>
          <div>
            <button className="friends-manager-small-button" onClick={onCopy} type="button">
              <Clipboard aria-hidden="true" />
              Copia codice
            </button>
            <button className="friends-manager-small-button friends-manager-small-button-primary" onClick={onShare} type="button">
              <Share2 aria-hidden="true" />
              Condividi invito
            </button>
          </div>
        </div>
      </div>

      <div className="friends-manager-stats-row" aria-label="Riepilogo competizione">
        <ManagerStat label="Round corrente" value={currentRound ? `Round ${currentRound.round_number}` : "Da creare"} />
        <ManagerStat label="Partecipanti" value={String(getConfirmedFriendsParticipants(competition).length)} />
        <ManagerStat label="Vite totali" value={String(stats.totalLives)} />
        <ManagerStat label="Vite vive" value={String(stats.aliveLives)} />
        <ManagerStat label="Deadline" value={formatDeadline(currentRound?.deadline_at ?? null)} detail={countdown} />
      </div>
    </Card>
  );
}

function ManagerStat({ detail, label, value }: { detail?: string; label: string; value: string }) {
  return (
    <span className="friends-manager-stat">
      <small>{label}</small>
      <strong>{value}</strong>
      {detail ? <em>{detail}</em> : null}
    </span>
  );
}

function QuickActionsCard({
  currentRound,
  onAddMatch,
  onAddParticipant,
  onCalculate,
  onChangeDeadline,
  onDelete,
  onHistory,
  onToggleChoices,
}: {
  currentRound: FriendsRound | null;
  onAddMatch: () => void;
  onAddParticipant: () => void;
  onCalculate: () => void;
  onChangeDeadline: () => void;
  onDelete: () => void;
  onHistory: () => void;
  onToggleChoices: () => void;
}) {
  return (
    <Card className="friends-manager-card">
      <div className="friends-manager-card-heading">
        <span className="user-page-kicker">Gestione</span>
        <h2>Azioni rapide</h2>
        <p className="admin-muted">Tutte le operazioni si aprono in popup guidati, senza cambiare schermata.</p>
      </div>
      <div className="friends-manager-action-list">
        <button className="friends-manager-action" onClick={onAddParticipant} type="button">
          <UserPlus aria-hidden="true" />
          Aggiungi partecipante
        </button>
        <button className="friends-manager-action" disabled={!currentRound} onClick={onChangeDeadline} type="button">
          <Clock3 aria-hidden="true" />
          Modifica Deadline
        </button>
        <button className="friends-manager-action" disabled={!currentRound} onClick={onAddMatch} type="button">
          <Plus aria-hidden="true" />
          Aggiungi Match
        </button>
        <button className="friends-manager-action" disabled={!currentRound} onClick={onToggleChoices} type="button">
          <Lock aria-hidden="true" />
          {currentRound?.status === "OPEN" ? "Blocca Scelte" : "Riapri Scelte"}
        </button>
        <button className="friends-manager-action" disabled={!currentRound} onClick={onCalculate} type="button">
          <ListChecks aria-hidden="true" />
          Calcola Round
        </button>
        <button className="friends-manager-action" onClick={onHistory} type="button">
          <History aria-hidden="true" />
          Storico Round
        </button>
        <button className="friends-manager-action friends-manager-action-danger" onClick={onDelete} type="button">
          <Trash2 aria-hidden="true" />
          Elimina Competizione
        </button>
      </div>
    </Card>
  );
}

function RoundStatusCard({
  currentRound,
  stats,
}: {
  currentRound: FriendsRound | null;
  stats: FriendsManagerStats;
}) {
  const steps = ["Scelte aperte", "Deadline", "Calcolo round", "Nuovo round"];
  const activeStep = getTimelineStep(currentRound);

  return (
    <Card className="friends-manager-card">
      <div className="friends-manager-card-heading">
        <span className="user-page-kicker">Stato</span>
        <h2>Riepilogo rapido</h2>
      </div>
      <div className="friends-manager-mini-stats">
        <ManagerStat label="Vite sopravvissute" value={String(stats.aliveLives)} />
        <ManagerStat label="Vite eliminate" value={String(stats.eliminatedLives)} />
        <ManagerStat label="Vite senza scelta" value={String(stats.withoutChoice)} />
        <ManagerStat label="Match del round" value={String(stats.matchCount)} />
      </div>
      <div className="friends-manager-timeline" aria-label="Timeline round">
        {steps.map((step) => (
          <span className={cn("friends-manager-timeline-step", step === activeStep && "friends-manager-timeline-step-active")} key={step}>
            {step}
          </span>
        ))}
      </div>
    </Card>
  );
}

function CurrentRoundCard({
  competition,
  currentRound,
  isPreview = false,
}: {
  competition: FriendsCompetition;
  currentRound: FriendsRound | null;
  isPreview?: boolean;
}) {
  const matches = currentRound?.matches ?? [];

  return (
    <Card className="friends-manager-card">
      <div className="friends-manager-card-heading friends-manager-card-heading-row">
        <span>
          <span className="user-page-kicker">Partite</span>
          <h2>Round corrente</h2>
        </span>
        {currentRound ? <span className="ui-badge">{currentRound.status}</span> : null}
      </div>

      {matches.length > 0 ? (
        <div className="friends-manager-match-list">
          {matches.slice(0, isPreview ? 4 : matches.length).map((match, index) => (
            <article className="friends-manager-match-row" key={match.id}>
              <span className="friends-manager-match-index">{index + 1}</span>
              <div className="friends-manager-match-teams">
                <MatchTeamLabel logoUrl={match.home_team_logo_url} name={match.home_team} />
                <span className="friends-manager-match-vs">vs</span>
                <MatchTeamLabel logoUrl={match.away_team_logo_url} name={match.away_team} />
              </div>
              <span className="friends-manager-match-status">{match.is_active ? "Aperto" : "Bloccato"}</span>
              <small className="friends-manager-match-count">{getMatchChoiceCount(competition, currentRound!.id, match.id)}/{getConfirmedFriendsParticipants(competition).length}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="admin-muted">Nessun match configurato per il round corrente.</p>
      )}

      {isPreview && matches.length > 4 ? <span className="friends-manager-muted-link">Visualizza tutti i match</span> : null}
    </Card>
  );
}

function MatchTeamLabel({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  return (
    <span className="friends-manager-team-pill">
      <span
        className={cn("friends-manager-team-logo", logoUrl && "friends-manager-team-logo-image")}
        style={logoUrl ? { backgroundImage: `url("${logoUrl}")` } : undefined}
        aria-hidden="true"
      >
        {logoUrl ? null : <span>{getTeamInitials(name)}</span>}
      </span>
      <strong className="friends-manager-team-name">{name}</strong>
    </span>
  );
}

function InfoBanner({ currentRound }: { currentRound: FriendsRound | null }) {
  const message =
    currentRound?.status === "OPEN"
      ? "Le scelte sono aperte. I partecipanti possono effettuare o modificare le proprie scelte fino alla deadline."
      : currentRound?.status === "LOCKED"
        ? "Le scelte sono bloccate. Ora puoi verificare i risultati e calcolare il round."
        : "Configura il round corrente e guida la competizione passo dopo passo.";

  return (
    <div className="friends-manager-info-banner">
      <Shield aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

function ParticipantsManagerCard({
  competition,
  mutate,
  onAdd,
  onApprove,
  onEditLives,
  onRemove,
  user,
}: {
  competition: FriendsCompetition;
  mutate: FriendsMutate;
  onAdd: () => void;
  onApprove: (participant: FriendsParticipant) => void;
  onEditLives: (participant: FriendsParticipant) => void;
  onRemove: (participant: FriendsParticipant) => void;
  user: AccountUser;
}) {
  const [query, setQuery] = useState("");
  const participants = getVisibleFriendsParticipants(competition).filter((participant) => {
    const haystack = `${participant.username} ${participant.email}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <Card className="friends-manager-section-card">
      <div className="dashboard-section-heading">
        <div>
          <p className="user-page-kicker">Gestione utenti</p>
          <h2>Partecipanti</h2>
          <p className="admin-muted">Una riga per partecipante. Le azioni aprono popup dedicati.</p>
        </div>
        <button className="friends-manager-small-button friends-manager-small-button-primary" onClick={onAdd} type="button">
          <UserPlus aria-hidden="true" />
          Aggiungi partecipante
        </button>
      </div>

      <label className="friends-manager-search">
        <Search aria-hidden="true" />
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca username o email"
          value={query}
        />
      </label>

      <div className="friends-manager-participant-list">
        {participants.length > 0 ? (
          participants.map((participant) => (
            <article className="friends-manager-participant-row" key={participant.id}>
              <span>
                <strong>{participant.username}</strong>
                <small>{participant.email}</small>
                <em className={cn("friends-manager-participant-status", participant.status === "PENDING" && "friends-manager-participant-status-pending")}>
                  {getParticipantStatusLabel(participant.status)}
                </em>
              </span>
              <span>
                <small>Vite totali</small>
                <strong>{participant.total_lives}</strong>
              </span>
              <span>
                <small>Vive</small>
                <strong>{participant.alive_lives}</strong>
              </span>
              <span>
                <small>Eliminate</small>
                <strong>{participant.eliminated_lives}</strong>
              </span>
              <ParticipantCompactActions
                onAddLife={() =>
                  void mutate(`/api/friends/competitions/${competition.id}/participants`, {
                    body: JSON.stringify({ lives: participant.total_lives + 1, participantId: participant.id }),
                    method: "PATCH",
                  })
                }
                onApprove={() => onApprove(participant)}
                onEdit={() => onEditLives(participant)}
                onRemove={() => onRemove(participant)}
                onSubtractLife={() =>
                  void mutate(`/api/friends/competitions/${competition.id}/participants`, {
                    body: JSON.stringify({ lives: Math.max(0, participant.total_lives - 1), participantId: participant.id }),
                    method: "PATCH",
                  })
                }
                participant={participant}
                user={user}
              />
            </article>
          ))
        ) : (
          <DashboardEmpty text="Nessun partecipante trovato con questa ricerca." title="Lista vuota" />
        )}
      </div>
    </Card>
  );
}

function ParticipantCompactActions({
  onAddLife,
  onApprove,
  onEdit,
  onRemove,
  onSubtractLife,
  participant,
  user,
}: {
  onAddLife: () => void;
  onApprove: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onSubtractLife: () => void;
  participant: FriendsParticipant;
  user: AccountUser;
}) {
  return (
    <span className="friends-manager-row-actions">
      {participant.status === "PENDING" ? (
        <button aria-label={`Accetta ${participant.username}`} className="friends-manager-icon-positive" onClick={onApprove} type="button">
          <CheckCircle2 aria-hidden="true" />
        </button>
      ) : null}
      <button aria-label={`Modifica vite di ${participant.username}`} onClick={onEdit} type="button">
        <Pencil aria-hidden="true" />
      </button>
      <button aria-label={`Aggiungi una vita a ${participant.username}`} onClick={onAddLife} type="button">
        <Plus aria-hidden="true" />
      </button>
      <button aria-label={`Togli una vita a ${participant.username}`} disabled={participant.total_lives <= 0} onClick={onSubtractLife} type="button">
        <Minus aria-hidden="true" />
      </button>
      <button
        aria-label={`Rimuovi ${participant.username}`}
        className="friends-manager-icon-danger"
        disabled={participant.user_id === user.id}
        onClick={onRemove}
        type="button"
      >
        <Trash2 aria-hidden="true" />
      </button>
    </span>
  );
}

function ManagerEventsCard({ competition }: { competition: FriendsCompetition }) {
  return (
    <Card className="friends-manager-section-card friends-manager-events-card">
      <div className="dashboard-section-heading">
        <div>
          <p className="user-page-kicker">Attività</p>
          <h2>Ultime operazioni</h2>
          <p className="admin-muted">Un riepilogo rapido di quello che è successo nella competizione.</p>
        </div>
      </div>
      <div className="dashboard-movement-list">
        {competition.events.length > 0 ? (
          competition.events.slice(0, 5).map((event) => (
            <article className="dashboard-movement-row" key={event.id}>
              <span>{new Date(event.created_at).toLocaleString("it-IT")}</span>
              <strong>{event.message}</strong>
            </article>
          ))
        ) : (
          <p className="admin-muted">Nessuna operazione registrata.</p>
        )}
      </div>
    </Card>
  );
}

function ManagerModalShell({
  children,
  kicker,
  onClose,
  title,
}: {
  children: ReactNode;
  kicker: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="arena-modal-backdrop" role="presentation">
      <Card aria-modal="true" className="arena-modal-card friends-manager-modal" role="dialog">
        <button aria-label="Chiudi" className="modal-close-button" onClick={onClose} type="button">
          ×
        </button>
        <p className="user-page-kicker">{kicker}</p>
        <h2>{title}</h2>
        {children}
      </Card>
    </div>
  );
}

function AddParticipantModal({
  competition,
  mutate,
  onClose,
}: {
  competition: FriendsCompetition;
  mutate: FriendsMutate;
  onClose: () => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const updated = await mutate(`/api/friends/competitions/${competition.id}/participants`, {
      body: JSON.stringify({
        identifier,
        lives: 1,
      }),
      method: "POST",
    });

    if (updated) {
      onClose();
    } else {
      setError("Partecipante non aggiunto. Controlla username/email.");
    }
  }

  return (
    <ManagerModalShell kicker="Partecipanti" onClose={onClose} title="Aggiungi partecipante">
      <div className="friends-manager-form-grid">
        <label>
          Username o Email
          <input className="ui-input" onChange={(event) => setIdentifier(event.target.value)} placeholder="username o email" value={identifier} />
        </label>
        <p className="friends-manager-form-note">Il partecipante verrà aggiunto in attesa con 1 vita. Potrai accettarlo e modificare le vite dalla lista.</p>
      </div>
      {error ? <p className="friends-manager-danger-note">{error}</p> : null}
      <div className="arena-modal-actions">
        <Button onClick={onClose} type="button" variant="secondary">
          Annulla
        </Button>
        <Button disabled={identifier.trim().length < 3} onClick={() => void submit()} type="button">
          Conferma
        </Button>
      </div>
    </ManagerModalShell>
  );
}

function AddMatchModal({
  competition,
  currentRound,
  mutate,
  onClose,
  teams,
}: {
  competition: FriendsCompetition;
  currentRound: FriendsRound;
  mutate: FriendsMutate;
  onClose: () => void;
  teams: Team[];
}) {
  const [newMatch, setNewMatch] = useState<DraftMatch>({ ...emptyMatch });

  async function submit() {
    const updated = await mutate(`/api/friends/competitions/${competition.id}/matches`, {
      body: JSON.stringify({
        ...newMatch,
        roundId: currentRound.id,
      }),
      method: "POST",
    });

    if (updated) {
      onClose();
    }
  }

  return (
    <ManagerModalShell kicker="Round corrente" onClose={onClose} title="Aggiungi Match">
      <div className="friends-manager-form-grid">
        <TeamSelect label="Squadra Casa" onChange={(value) => setNewMatch((current) => ({ ...current, homeTeamId: value }))} teams={teams} value={newMatch.homeTeamId} />
        <TeamSelect label="Squadra Trasferta" onChange={(value) => setNewMatch((current) => ({ ...current, awayTeamId: value }))} teams={teams} value={newMatch.awayTeamId} />
      </div>
      <div className="arena-modal-actions">
        <Button onClick={onClose} type="button" variant="secondary">
          Annulla
        </Button>
        <Button disabled={!newMatch.homeTeamId || !newMatch.awayTeamId || newMatch.homeTeamId === newMatch.awayTeamId} onClick={() => void submit()} type="button">
          Aggiungi
        </Button>
      </div>
    </ManagerModalShell>
  );
}

function DeadlineModal({
  competition,
  currentRound,
  mutate,
  onClose,
}: {
  competition: FriendsCompetition;
  currentRound: FriendsRound;
  mutate: FriendsMutate;
  onClose: () => void;
}) {
  const [deadline, setDeadline] = useState(toDateTimeLocal(currentRound.deadline_at));

  async function submit() {
    const updated = await mutate(`/api/friends/competitions/${competition.id}/round`, {
      body: JSON.stringify({
        deadlineAt: fromDateTimeLocal(deadline),
        roundId: currentRound.id,
      }),
      method: "PATCH",
    });

    if (updated) {
      onClose();
    }
  }

  return (
    <ManagerModalShell kicker="Deadline" onClose={onClose} title="Modifica Deadline">
      <div className="friends-manager-form-grid">
        <label>
          Data e ora
          <input className="ui-input" onChange={(event) => setDeadline(event.target.value)} type="datetime-local" value={deadline} />
        </label>
      </div>
      <div className="arena-modal-actions">
        <Button onClick={onClose} type="button" variant="secondary">
          Annulla
        </Button>
        <Button disabled={!deadline} onClick={() => void submit()} type="button">
          Salva
        </Button>
      </div>
    </ManagerModalShell>
  );
}

function EditLivesModal({
  competition,
  mutate,
  onClose,
  participant,
}: {
  competition: FriendsCompetition;
  mutate: FriendsMutate;
  onClose: () => void;
  participant: FriendsParticipant;
}) {
  const [lives, setLives] = useState(String(participant.total_lives));

  async function submit() {
    const updated = await mutate(`/api/friends/competitions/${competition.id}/participants`, {
      body: JSON.stringify({
        lives: Number(lives),
        participantId: participant.id,
      }),
      method: "PATCH",
    });

    if (updated) {
      onClose();
    }
  }

  return (
    <ManagerModalShell kicker="Vite partecipante" onClose={onClose} title={`Modifica ${participant.username}`}>
      <div className="friends-manager-form-grid">
        <label>
          Numero vite
          <input className="ui-input" min={0} onChange={(event) => setLives(event.target.value)} type="number" value={lives} />
        </label>
      </div>
      <div className="arena-modal-actions">
        <Button onClick={onClose} type="button" variant="secondary">
          Annulla
        </Button>
        <Button disabled={Number(lives) < 0} onClick={() => void submit()} type="button">
          Salva
        </Button>
      </div>
    </ManagerModalShell>
  );
}

function ConfirmActionModal({
  confirmLabel,
  message,
  onClose,
  onConfirm,
  title,
  tone,
}: {
  confirmLabel: string;
  message: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  tone: "danger" | "normal";
}) {
  return (
    <ManagerModalShell kicker={tone === "danger" ? "Conferma richiesta" : "Operazione"} onClose={onClose} title={title}>
      <p className="admin-muted">{message}</p>
      <div className="arena-modal-actions">
        <Button onClick={onClose} type="button" variant="secondary">
          Annulla
        </Button>
        <Button onClick={() => void onConfirm()} type="button" variant={tone === "danger" ? "gold" : "primary"}>
          {confirmLabel}
        </Button>
      </div>
    </ManagerModalShell>
  );
}

function HistoryRoundModal({ competition, onClose }: { competition: FriendsCompetition; onClose: () => void }) {
  const [selectedRoundId, setSelectedRoundId] = useState(competition.rounds[0]?.id ?? "");
  const selectedRound = competition.rounds.find((round) => round.id === selectedRoundId) ?? competition.rounds[0] ?? null;

  return (
    <ManagerModalShell kicker="Storico" onClose={onClose} title="Storico Round">
      <div className="friends-history-layout friends-history-layout-modal">
        <div className="friends-history-round-list">
          {competition.rounds.map((round) => (
            <button
              className={cn("friends-history-round-button", selectedRound?.id === round.id && "friends-history-round-button-active")}
              key={round.id}
              onClick={() => setSelectedRoundId(round.id)}
              type="button"
            >
              <History aria-hidden="true" />
              Round {round.round_number}
              <span>{round.status}</span>
            </button>
          ))}
        </div>

        {selectedRound ? (
          <div className="friends-history-detail">
            <h3>Round {selectedRound.round_number}</h3>
            <CurrentRoundCard competition={competition} currentRound={selectedRound} />
            <div className="friends-life-history-list">
              {competition.participants.filter((participant) => participant.status !== "REMOVED").map((participant) => (
                <article key={participant.id}>
                  <strong>{participant.username}</strong>
                  {participant.lives.map((life) => {
                    const selection = life.selections.find((item) => item.round_id === selectedRound.id);

                    return (
                      <span key={life.id}>
                        Vita {life.life_number}: {selection ? `${selection.selected_team} - ${selection.status}` : "nessuna scelta"} ({life.status})
                      </span>
                    );
                  })}
                </article>
              ))}
            </div>
          </div>
        ) : (
          <DashboardEmpty text="Nessun round disponibile nello storico." title="Storico vuoto" />
        )}
      </div>
    </ManagerModalShell>
  );
}

function CalculateRoundModal({
  competition,
  currentRound,
  mutate,
  onClose,
}: {
  competition: FriendsCompetition;
  currentRound: FriendsRound;
  mutate: FriendsMutate;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [results, setResults] = useState<Record<string, MatchResult>>(() =>
    Object.fromEntries(currentRound.matches.map((match) => [match.id, match.result])),
  );
  const preview = buildRoundPreview(competition, currentRound, results);
  const canConfirm = currentRound.matches.every((match) => {
    const result = results[match.id];
    return result && result !== "PENDING";
  });

  async function calculate() {
    const updated = await mutate(`/api/friends/rounds/${currentRound.id}/calculate`, {
      body: JSON.stringify({
        results: currentRound.matches.map((match) => ({
          matchId: match.id,
          result: results[match.id] ?? match.result,
        })),
      }),
      method: "POST",
    });

    if (updated) {
      onClose();
    }
  }

  return (
    <div className="arena-modal-backdrop" role="presentation">
      <Card aria-modal="true" className="arena-modal-card friends-calculate-modal" role="dialog">
        <button aria-label="Chiudi" className="modal-close-button" onClick={onClose} type="button">
          ×
        </button>
        <p className="user-page-kicker">Calcolo guidato</p>
        <h2>Calcola Round {currentRound.round_number}</h2>
        <div className="friends-calculate-steps" aria-label="Step calcolo round">
          {[1, 2, 3].map((item) => (
            <span className={cn(item === step && "friends-calculate-step-active")} key={item}>
              {item}
            </span>
          ))}
        </div>

        {step === 1 ? (
          <div className="friends-calculate-panel">
            <h3>Inserisci risultati</h3>
            <div className="friends-calculate-results">
              {currentRound.matches.map((match) => (
                <label key={match.id}>
                  <span>
                    {match.home_team} vs {match.away_team}
                  </span>
                  <select
                    className="admin-select"
                    onChange={(event) =>
                      setResults((current) => ({
                        ...current,
                        [match.id]: event.target.value as MatchResult,
                      }))
                    }
                    value={results[match.id] ?? "PENDING"}
                  >
                    <option value="PENDING">Risultato</option>
                    {resultOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="friends-calculate-panel">
            <h3>Anteprima calcolo</h3>
            <p className="admin-muted">Anteprima basata sulle scelte registrate e sui risultati inseriti.</p>
            <div className="friends-manager-mini-stats">
              <ManagerStat label="Sopravvivono" value={String(preview.survived)} />
              <ManagerStat label="Eliminate" value={String(preview.eliminated)} />
              <ManagerStat label="Senza scelta" value={String(preview.withoutChoice)} />
              <ManagerStat label="Esito" value={preview.willFinish ? "Competizione conclusa" : "Nuovo round"} />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="friends-calculate-panel">
            <h3>Conferma calcolo</h3>
            <p className="admin-muted">Dopo la conferma il sistema aggiorna vite, storico e stato della competizione.</p>
            {!canConfirm ? <p className="friends-manager-danger-note">Inserisci un risultato per tutti i match prima di confermare.</p> : null}
          </div>
        ) : null}

        <div className="arena-modal-actions">
          <Button disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))} type="button" variant="secondary">
            Indietro
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((current) => Math.min(3, current + 1))} type="button">
              Continua
            </Button>
          ) : (
            <Button disabled={!canConfirm} onClick={() => void calculate()} type="button" variant="gold">
              Conferma e calcola round
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

type FriendsManagerStats = {
  aliveLives: number;
  eliminatedLives: number;
  matchCount: number;
  totalLives: number;
  withoutChoice: number;
};

function getFriendsManagerStats(competition: FriendsCompetition, currentRound: FriendsRound | null): FriendsManagerStats {
  const participants = getConfirmedFriendsParticipants(competition);
  const lives = participants.flatMap((participant) => participant.lives);
  const aliveLives = lives.filter((life) => life.status === "ALIVE");
  const withoutChoice = currentRound
    ? aliveLives.filter((life) => !life.selections.some((selection) => selection.round_id === currentRound.id)).length
    : 0;

  return {
    aliveLives: participants.reduce((sum, participant) => sum + participant.alive_lives, 0),
    eliminatedLives: participants.reduce((sum, participant) => sum + participant.eliminated_lives, 0),
    matchCount: currentRound?.matches.length ?? 0,
    totalLives: participants.reduce((sum, participant) => sum + participant.total_lives, 0),
    withoutChoice,
  };
}

function getMatchChoiceCount(competition: FriendsCompetition, roundId: string, matchId: string) {
  return getConfirmedFriendsParticipants(competition).reduce((sum, participant) => {
    return (
      sum +
      participant.lives.filter((life) =>
        life.selections.some((selection) => selection.round_id === roundId && selection.match_id === matchId),
      ).length
    );
  }, 0);
}

function getVisibleFriendsParticipants(competition: FriendsCompetition) {
  return competition.participants.filter((participant) => participant.status !== "REMOVED");
}

function getConfirmedFriendsParticipants(competition: FriendsCompetition) {
  return getVisibleFriendsParticipants(competition).filter((participant) => participant.status !== "PENDING");
}

function getParticipantStatusLabel(status: FriendsParticipant["status"]) {
  if (status === "PENDING") {
    return "In attesa";
  }

  if (status === "WINNER") {
    return "Vincitore";
  }

  if (status === "ELIMINATED") {
    return "Eliminato";
  }

  return "Confermato";
}

function getTimelineStep(currentRound: FriendsRound | null) {
  if (!currentRound) {
    return "Scelte aperte";
  }

  if (currentRound.status === "CALCULATED") {
    return "Nuovo round";
  }

  if (currentRound.status === "LOCKED") {
    return "Calcolo round";
  }

  if (isDeadlinePassed(currentRound.deadline_at)) {
    return "Deadline";
  }

  return "Scelte aperte";
}

function formatCountdown(deadline: string | null, now: number) {
  if (!deadline) {
    return "Countdown da impostare";
  }

  if (now <= 0) {
    return "Countdown attivo";
  }

  const diff = Date.parse(deadline) - now;

  if (diff <= 0) {
    return "Deadline scaduta";
  }

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function buildRoundPreview(
  competition: FriendsCompetition,
  currentRound: FriendsRound,
  results: Record<string, MatchResult>,
) {
  let survived = 0;
  let eliminated = 0;
  let withoutChoice = 0;

  getConfirmedFriendsParticipants(competition).forEach((participant) => {
    participant.lives
      .filter((life) => life.status === "ALIVE")
      .forEach((life) => {
        const selection = life.selections.find((item) => item.round_id === currentRound.id);

        if (!selection) {
          withoutChoice += 1;
          return;
        }

        const match = currentRound.matches.find((item) => item.id === selection.match_id);
        const result = results[selection.match_id] ?? match?.result ?? "PENDING";
        const isVoid = result === "POSTPONED" || result === "CANCELLED";
        const winsHome = result === "HOME_WIN" && selection.selected_team_id === match?.home_team_id;
        const winsAway = result === "AWAY_WIN" && selection.selected_team_id === match?.away_team_id;

        if (isVoid || winsHome || winsAway) {
          survived += 1;
        } else {
          eliminated += 1;
        }
      });
  });

  return {
    eliminated,
    survived,
    willFinish: survived <= 1,
    withoutChoice,
  };
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
  const isPendingParticipant = participant?.status === "PENDING";
  const aliveLives = participant && !isPendingParticipant ? participant.lives.filter((life) => life.status === "ALIVE") : [];
  const [selectedLifeId, setSelectedLifeId] = useState("");
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [deadlineEdits, setDeadlineEdits] = useState<Record<string, string>>({});
  const [newMatch, setNewMatch] = useState<DraftMatch>({ ...emptyMatch });
  const [results, setResults] = useState<Record<string, MatchResult>>({});
  const [choiceEffectKey, setChoiceEffectKey] = useState("");
  const [savedChoice, setSavedChoice] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const selectedLife = aliveLives.find((life) => life.id === selectedLifeId) ?? aliveLives[0] ?? null;
  const choicesLocked = !currentRound || currentRound.status !== "OPEN" || isDeadlinePassed(currentRound.deadline_at);
  const deadline = currentRound ? deadlineEdits[currentRound.id] ?? toDateTimeLocal(currentRound.deadline_at) : "";
  const countdown = formatFriendsGameCountdown(currentRound?.deadline_at ?? null, now);
  const popularChoices = currentRound ? buildFriendsPopularChoices(competition, currentRound) : [];

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  async function choose(match: FriendsMatch, teamId: string) {
    if (!selectedLife) {
      return;
    }

    const selectedTeam = teamId === match.home_team_id ? match.home_team : teamId === match.away_team_id ? match.away_team : "";
    const effectKey = `${match.id}:${teamId}`;
    setChoiceEffectKey(effectKey);
    setSavedChoice(`Vita ${selectedLife.life_number}: ${selectedTeam}`);
    window.setTimeout(() => setChoiceEffectKey(""), 900);
    window.setTimeout(() => setSavedChoice(""), 2400);

    await mutate(`/api/friends/lives/${selectedLife.id}/choice`, {
      body: JSON.stringify({
        matchId: match.id,
        selectedTeamId: teamId,
      }),
      method: "POST",
    });
  }

  if (!showManagerTools) {
    return (
      <div className="arena-detail-page">
        <section className="arena-game-hero">
          <div className="arena-game-hero-copy">
            <p className="user-page-kicker">Torneo Friends</p>
            <h1>{competition.name}</h1>
            <div className="arena-game-hero-badges">
              <span className="arena-game-state">
                <Trophy aria-hidden="true" />
                {competition.status === "ACTIVE" ? "In corso" : competition.status}
              </span>
              <span className="arena-game-state arena-game-state-muted">
                Codice {competition.invite_code}
              </span>
            </div>
          </div>
          <FriendsEpicCountdown countdown={countdown} deadline={formatDeadline(currentRound?.deadline_at ?? null)} round={currentRound?.round_number ?? competition.current_round_number} />
          <div className="arena-game-hero-stats" aria-label="Riepilogo torneo">
            <span>
              <UsersRound aria-hidden="true" />
              <strong>{getConfirmedFriendsParticipants(competition).length}</strong>
              Partecipanti
            </span>
            <span>
              <Heart aria-hidden="true" />
              <strong>{aliveLives.length}</strong>
              Vite vive
            </span>
            <span>
              <Shield aria-hidden="true" />
              <strong>{currentRound ? `Round ${currentRound.round_number}` : "Da creare"}</strong>
              In gioco
            </span>
          </div>
        </section>

        {savedChoice ? (
          <div className="arena-choice-toast" role="status">
            <CheckCircle2 aria-hidden="true" />
            Scelta salvata · {savedChoice}
          </div>
        ) : null}

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

        {isPendingParticipant ? (
          <div className="admin-tool-card">
            <strong>Partecipazione in attesa</strong>
            <p className="admin-muted">La tua richiesta è arrivata all&apos;organizzatore. Potrai giocare appena verrà confermata.</p>
          </div>
        ) : null}

        {participant && currentRound ? (
          <section className="arena-game-section">
            <div className="arena-section-heading">
              <div>
                <p className="user-page-kicker">Le tue vite</p>
                <h2>{selectedLife ? `Scegli per Vita ${selectedLife.life_number}` : "Scegli quale vita giocare"}</h2>
              </div>
              {choicesLocked ? (
                <span className="arena-locked-pill">
                  <Lock aria-hidden="true" />
                  Scelte bloccate
                </span>
              ) : null}
            </div>

            <div className="arena-game-life-carousel">
              {participant.lives.map((life) => (
                <FriendsGameLifeButton
                  isSelected={selectedLife?.id === life.id}
                  key={life.id}
                  life={life}
                  onClick={() => setSelectedLifeId(life.id)}
                  visual={getFriendsSelectionVisual(life, currentRound)}
                />
              ))}
            </div>

            {!choicesLocked ? (
              <section className="arena-game-section arena-game-section-choices">
                <div className="arena-section-heading">
                  <div>
                    <p className="user-page-kicker">Scelta partite</p>
                    <h2>{selectedLife ? "Scegli per questa vita" : "Seleziona una vita"}</h2>
                  </div>
                  {selectedLife ? <span className="ui-badge">Vita {selectedLife.life_number}</span> : null}
                </div>
                <div className="arena-game-match-list">
                  {currentRound.matches.map((match) => {
                    const selection = selectedLife ? getFriendsLifeSelection(selectedLife, currentRound) : null;
                    const homeUsed = isFriendsTeamUsedByLife(selectedLife, currentRound, match.home_team_id, match.home_team);
                    const awayUsed = isFriendsTeamUsedByLife(selectedLife, currentRound, match.away_team_id, match.away_team);

                    return (
                      <article className={cn("arena-game-match-card", choiceEffectKey.startsWith(`${match.id}:`) && "arena-game-match-card-pop")} key={match.id}>
                        <FriendsGameTeamButton
                          choiceEffectKey={choiceEffectKey}
                          disabled={!match.is_active || !selectedLife || homeUsed}
                          isSelected={selection?.selected_team_id === match.home_team_id}
                          isUsed={homeUsed}
                          logoUrl={match.home_team_logo_url}
                          onClick={() => choose(match, match.home_team_id)}
                          team={match.home_team}
                          teamId={match.home_team_id}
                        />
                        <span className="arena-game-vs">VS</span>
                        <FriendsGameTeamButton
                          choiceEffectKey={choiceEffectKey}
                          disabled={!match.is_active || !selectedLife || awayUsed}
                          isSelected={selection?.selected_team_id === match.away_team_id}
                          isUsed={awayUsed}
                          logoUrl={match.away_team_logo_url}
                          onClick={() => choose(match, match.away_team_id)}
                          team={match.away_team}
                          teamId={match.away_team_id}
                        />
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : (
              <Card className="arena-locked-card">
                <Lock aria-hidden="true" />
                <h3>Round in corso</h3>
                <p>Le scelte sono bloccate. Puoi consultare le scelte pubbliche.</p>
              </Card>
            )}
          </section>
        ) : null}

        <section className="arena-game-section">
          <div className="arena-section-heading">
            <div>
              <p className="user-page-kicker">Tendenza round</p>
              <h2>Scelte più gettonate</h2>
            </div>
          </div>
          {choicesLocked ? (
            <div className="arena-popular-track" aria-label="Scelte più gettonate">
              {popularChoices.length > 0 ? (
                popularChoices.map((choice) => (
                  <article className="arena-popular-card" key={choice.name}>
                    <FriendsTeamMark logoUrl={choice.logoUrl} name={choice.name} />
                    <strong>{choice.name}</strong>
                    <span>{choice.percent}%</span>
                    <i style={{ inlineSize: `${choice.percent}%` }} />
                  </article>
                ))
              ) : (
                <p className="arena-game-muted">Nessuna statistica disponibile per questo round.</p>
              )}
            </div>
          ) : (
            <div className="arena-popular-locked">
              <Lock aria-hidden="true" />
              <p>Le statistiche saranno disponibili dopo la deadline.</p>
            </div>
          )}
        </section>

        {competition.rules ? (
          <section className="arena-game-info-banner">
            <Swords aria-hidden="true" />
            <p>{competition.rules}</p>
          </section>
        ) : (
          <section className="arena-game-info-banner">
            <Swords aria-hidden="true" />
            <p>{choicesLocked ? "Le scelte sono chiuse: attendi il risultato del round." : "Scegli bene: nelle Friends ogni vita racconta la sua storia."}</p>
          </section>
        )}
      </div>
    );
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

      {isPendingParticipant ? (
        <div className="admin-tool-card">
          <strong>Partecipazione in attesa</strong>
          <p className="admin-muted">La tua richiesta è arrivata all&apos;organizzatore. Potrai giocare appena verrà confermata.</p>
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

function FriendsTeamMark({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("arena-team-mark", logoUrl && "arena-team-mark-image")}
      style={logoUrl ? { backgroundImage: `url("${logoUrl}")` } : undefined}
    >
      {logoUrl ? null : <em>{getTeamInitials(name)}</em>}
    </span>
  );
}

function FriendsEpicCountdown({
  countdown,
  deadline,
  round,
}: {
  countdown: ReturnType<typeof formatFriendsGameCountdown>;
  deadline: string;
  round: number;
}) {
  const countdownValue = countdown.days !== "00"
    ? `${countdown.days} : ${countdown.hours} : ${countdown.minutes} : ${countdown.seconds}`
    : `${countdown.hours} : ${countdown.minutes} : ${countdown.seconds}`;

  return (
    <div className={cn("arena-game-countdown", `arena-game-countdown-${countdown.tone}`)} aria-live="polite">
      <span>Deadline Round {round}</span>
      <strong className="arena-game-countdown-timer" key={countdown.label}>{countdownValue}</strong>
      <small>{deadline}</small>
    </div>
  );
}

function FriendsGameLifeButton({
  isSelected,
  life,
  onClick,
  visual,
}: {
  isSelected: boolean;
  life: FriendsLife;
  onClick: () => void;
  visual: ReturnType<typeof getFriendsSelectionVisual>;
}) {
  return (
    <button
      aria-label={`Vita ${life.life_number}${visual ? `, scelta ${visual.name}` : ", da scegliere"}`}
      className={cn(
        "arena-game-life-card",
        isSelected && "arena-game-life-card-selected",
        visual && "arena-game-life-card-picked",
        life.status !== "ALIVE" && "arena-game-life-card-dead",
      )}
      disabled={life.status !== "ALIVE"}
      onClick={onClick}
      type="button"
    >
      <span className="arena-game-life-pair" aria-hidden="true">
        <span className="arena-game-heart">
          <Heart />
        </span>
        {visual ? <FriendsTeamMark logoUrl={visual.logoUrl} name={visual.name} /> : null}
      </span>
    </button>
  );
}

function FriendsGameTeamButton({
  choiceEffectKey,
  disabled,
  isSelected,
  isUsed,
  logoUrl,
  onClick,
  team,
  teamId,
}: {
  choiceEffectKey: string;
  disabled: boolean;
  isSelected: boolean;
  isUsed: boolean;
  logoUrl: string | null;
  onClick: () => void;
  team: string;
  teamId: string;
}) {
  const isBursting = choiceEffectKey.endsWith(`:${teamId}`);

  return (
    <button
      aria-label={isUsed ? `${team} già usata da questa vita` : `Scegli ${team}`}
      className={cn(
        "arena-game-team-button",
        isSelected && "arena-game-team-button-selected",
        isUsed && "arena-game-team-button-used",
        isBursting && "arena-game-team-button-burst",
      )}
      disabled={disabled}
      onClick={onClick}
      title={isUsed ? "Già usata da questa vita" : undefined}
      type="button"
    >
      <FriendsTeamMark logoUrl={logoUrl} name={team} />
      <span>{team}</span>
      {isSelected ? <CheckCircle2 aria-label="Squadra scelta" /> : null}
      {isUsed ? (
        <small>
          <Lock aria-hidden="true" />
          Già usata
        </small>
      ) : null}
      {isBursting ? <FriendsChoiceParticles /> : null}
    </button>
  );
}

function FriendsChoiceParticles() {
  return (
    <span className="arena-choice-particles" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, index) => (
        <i key={index} />
      ))}
    </span>
  );
}
