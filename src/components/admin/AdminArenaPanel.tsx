"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Crown,
  ImageIcon,
  Plus,
  Search,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import {
  formatCups,
  formatDeadline,
  fromDateTimeLocal,
  isDeadlinePassed,
  toDateTimeLocal,
  type ArenaMatch,
  type ArenaTournament,
  type MatchResult,
} from "@/lib/arena-client";
import { cn } from "@/lib/cn";

type AdminUser = {
  cup_balance: number;
  email: string;
  id: string;
  role: string;
  user_code: string;
  username: string;
};

type SessionResponse =
  | {
      ok: true;
      user: AdminUser;
    }
  | {
      message: string;
      ok: false;
    };

type TournamentsResponse =
  | {
      ok: true;
      tournaments: ArenaTournament[];
    }
  | {
      message: string;
      ok: false;
    };

type TournamentResponse =
  | {
      ok: true;
      tournament: ArenaTournament;
    }
  | {
      message: string;
      ok: false;
    };

type Participant = {
  alive_lives: number;
  eliminated_lives: number;
  email: string;
  id: string;
  joined_at: string;
  lives: Array<{
    id: string;
    life_number: number;
    selections: Array<{
      round_id: string;
      selected_team: string;
      status: string;
    }>;
    status: string;
  }>;
  status: string;
  total_lives: number;
  user_code: string;
  username: string;
};

type EventLog = {
  created_at: string;
  email: string | null;
  event_type: string;
  id: string;
  message: string;
  tournament_name: string | null;
  username: string | null;
};

type Team = {
  created_at: string;
  created_by: string | null;
  id: string;
  logo_url: string | null;
  name: string;
  normalized_name: string;
  updated_at: string;
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

type TeamResponse =
  | {
      ok: true;
      team: Team;
    }
  | {
      message: string;
      ok: false;
    };

type AdminPanelKey = "create" | "manage" | "teams" | "participants" | "events";

type TournamentForm = {
  description: string;
  entryCost: string;
  extraLifeCost: string;
  initialLives: string;
  maxLivesPerUser: string;
  maxParticipants: string;
  name: string;
  prizePoolPercentage: string;
  rules: string;
  unlimitedLives: boolean;
  unlimitedParticipants: boolean;
};

const emptyTournamentForm: TournamentForm = {
  description: "",
  entryCost: "100",
  extraLifeCost: "50",
  initialLives: "1",
  maxLivesPerUser: "5",
  maxParticipants: "100",
  name: "",
  prizePoolPercentage: "80",
  rules: "",
  unlimitedLives: false,
  unlimitedParticipants: false,
};

const resultLabels: Record<MatchResult, string> = {
  AWAY_WIN: "Vittoria Trasferta",
  CANCELLED: "Annullato",
  DRAW: "Pareggio",
  HOME_WIN: "Vittoria Casa",
  PENDING: "Da inserire",
  POSTPONED: "Rinviato",
};

const resultOptions: MatchResult[] = [
  "HOME_WIN",
  "DRAW",
  "AWAY_WIN",
  "POSTPONED",
  "CANCELLED",
];

const adminTabs: Array<{
  icon: LucideIcon;
  key: AdminPanelKey;
  label: string;
}> = [
  {
    icon: Plus,
    key: "create",
    label: "Crea torneo",
  },
  {
    icon: Swords,
    key: "manage",
    label: "Gestisci",
  },
  {
    icon: ImageIcon,
    key: "teams",
    label: "Squadre",
  },
  {
    icon: Users,
    key: "participants",
    label: "Partecipanti",
  },
  {
    icon: ClipboardList,
    key: "events",
    label: "Registro eventi",
  },
];

async function fetchJson<TResponse>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const data = (await response.json()) as TResponse;

  return {
    data,
    response,
  };
}

function getCurrentRound(tournament: ArenaTournament | null) {
  return tournament?.rounds.find(
    (round) => round.round_number === tournament.current_round_number,
  ) ?? null;
}

function buildTournamentPayload(form: TournamentForm) {
  return {
    description: form.description,
    entryCost: Number(form.entryCost),
    extraLifeCost: Number(form.extraLifeCost),
    initialLives: Number(form.initialLives),
    maxLivesPerUser: Number(form.maxLivesPerUser),
    maxParticipants: Number(form.maxParticipants),
    name: form.name,
    prizePoolPercentage: Number(form.prizePoolPercentage),
    rules: form.rules,
    unlimitedLives: form.unlimitedLives,
    unlimitedParticipants: form.unlimitedParticipants,
  };
}

export function AdminArenaPanel() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [tournaments, setTournaments] = useState<ArenaTournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [events, setEvents] = useState<EventLog[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantQuery, setParticipantQuery] = useState("");
  const [eventQuery, setEventQuery] = useState("");
  const [activePanel, setActivePanel] = useState<AdminPanelKey>("create");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const selectedTournament = useMemo(
    () => tournaments.find((tournament) => tournament.id === selectedTournamentId) ?? tournaments[0] ?? null,
    [selectedTournamentId, tournaments],
  );

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      const session = await fetchJson<SessionResponse>("/api/session");

      if (!isMounted) {
        return;
      }

      if (!session.data.ok) {
        router.replace("/login");
        return;
      }

      if (session.data.user.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setUser(session.data.user);
      const tournamentsResponse = await fetchJson<TournamentsResponse>("/api/admin/tournaments");

      if (tournamentsResponse.data.ok) {
        setTournaments(tournamentsResponse.data.tournaments);
        setSelectedTournamentId(tournamentsResponse.data.tournaments[0]?.id || "");
      } else {
        setMessage(tournamentsResponse.data.message);
      }

      const teamsResponse = await fetchJson<TeamsResponse>("/api/admin/teams");

      if (teamsResponse.data.ok) {
        setTeams(teamsResponse.data.teams);
      } else {
        setMessage(teamsResponse.data.message);
      }

      const eventsResponse = await fetchJson<
        | {
            events: EventLog[];
            ok: true;
          }
        | {
            message: string;
            ok: false;
          }
      >("/api/admin/events");

      if (eventsResponse.data.ok) {
        setEvents(eventsResponse.data.events);
      }

      setIsLoading(false);
    }

    boot().catch(() => {
      if (isMounted) {
        setMessage("Pannello admin non disponibile. Riprova tra poco.");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function loadEvents(query = eventQuery) {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }

    const { data } = await fetchJson<
      | {
          events: EventLog[];
          ok: true;
        }
      | {
          message: string;
          ok: false;
        }
    >(`/api/admin/events${params.toString() ? `?${params}` : ""}`);

    if (data.ok) {
      setEvents(data.events);
    } else {
      setMessage(data.message);
    }
  }

  async function loadParticipants(tournamentId = selectedTournament?.id, query = participantQuery) {
    if (!tournamentId) {
      return;
    }

    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }

    const { data } = await fetchJson<
      | {
          ok: true;
          participants: Participant[];
        }
      | {
          message: string;
          ok: false;
        }
    >(`/api/admin/tournaments/${tournamentId}/participants${params.toString() ? `?${params}` : ""}`);

    if (data.ok) {
      setParticipants(data.participants);
    } else {
      setMessage(data.message);
    }
  }

  async function loadTeams() {
    const { data } = await fetchJson<TeamsResponse>("/api/admin/teams");

    if (data.ok) {
      setTeams(data.teams);
    } else {
      setMessage(data.message);
    }
  }

  async function mutateTeam(url: string, init?: RequestInit) {
    setMessage("");
    const { data, response } = await fetchJson<TeamResponse | { ok: true } | { message: string; ok: false }>(url, init);

    if (!data.ok) {
      setMessage(data.message);
      return null;
    }

    await loadTeams();

    if (response.status === 201 || "team" in data) {
      return "team" in data ? data.team : null;
    }

    return null;
  }

  async function mutateTournament(
    url: string,
    init?: RequestInit,
    options: {
      keepPanel?: AdminPanelKey;
    } = {},
  ) {
    setMessage("");
    const { data } = await fetchJson<TournamentResponse>(url, init);

    if (!data.ok) {
      setMessage(data.message);
      return null;
    }

    setTournaments((current) => {
      const exists = current.some((tournament) => tournament.id === data.tournament.id);
      const next = exists
        ? current.map((tournament) => (tournament.id === data.tournament.id ? data.tournament : tournament))
        : [data.tournament, ...current];

      return next.sort((left, right) => right.id.localeCompare(left.id));
    });
    setSelectedTournamentId(data.tournament.id);
    setActivePanel(options.keepPanel ?? "manage");
    await loadEvents();

    return data.tournament;
  }

  async function handleLogout() {
    await fetch("/api/logout", {
      credentials: "include",
      method: "POST",
    });
    router.replace("/");
  }

  if (isLoading || !user) {
    return (
      <main className="user-page">
        <section className="user-loading-shell">
          <Card className="user-loading-card">
            <p>{message || "Caricamento pannello admin..."}</p>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="user-page admin-page">
      <header className="admin-header">
        <BrandLogo />
        <div className="admin-header-copy">
          <span>Admin Arena</span>
          <strong>{user.username}</strong>
        </div>
        <button className="admin-logout-button" onClick={handleLogout} type="button">
          Logout
        </button>
      </header>

      <section className="admin-shell">
        <header className="admin-hero">
          <p className="user-page-kicker">Pannello Admin</p>
          <h1>ADMIN ARENA</h1>
          <p>Gestisci tornei, round, vite, scelte e registro eventi da un unico pannello.</p>
          <PremiumDivider />
        </header>

        {message ? (
          <div className="auth-form-message auth-form-message-error" role="alert">
            {message}
          </div>
        ) : null}

        <nav className="admin-tabs" aria-label="Sezioni admin">
          {adminTabs.map(({ icon: Icon, key, label }) => (
            <button
              className={cn("admin-tab", activePanel === key && "admin-tab-active")}
              key={key}
              onClick={() => {
                setActivePanel(key);
                if (key === "participants") {
                  void loadParticipants();
                }
                if (key === "teams") {
                  void loadTeams();
                }
                if (key === "events") {
                  void loadEvents();
                }
              }}
              type="button"
            >
              <Icon aria-hidden="true" className="admin-tab-icon" />
              {label}
            </button>
          ))}
        </nav>

        <div className="admin-layout-grid">
          <TournamentSidebar
            onSelect={(id) => {
              setSelectedTournamentId(id);
              setActivePanel("manage");
              void loadParticipants(id);
            }}
            selectedTournamentId={selectedTournament?.id ?? ""}
            tournaments={tournaments}
          />

          <div className="admin-main-panel">
            {activePanel === "create" ? (
              <CreateTournamentWizard
                onCreate={async (form) => {
                  const tournament = await mutateTournament("/api/admin/tournaments", {
                    body: JSON.stringify(buildTournamentPayload(form)),
                    method: "POST",
                  });

                  if (tournament) {
                    setMessage("Torneo creato in stato PENDING. Ora configura il Round 1.");
                  }
                }}
              />
            ) : null}

            {activePanel === "manage" ? (
              <TournamentManager
                key={`${selectedTournament?.id ?? "empty"}-${getCurrentRound(selectedTournament)?.id ?? "none"}-${getCurrentRound(selectedTournament)?.updated_at ?? "fresh"}`}
                onMutate={mutateTournament}
                teams={teams}
                tournament={selectedTournament}
              />
            ) : null}

            {activePanel === "teams" ? (
              <TeamsPanel
                onMutate={mutateTeam}
                teams={teams}
              />
            ) : null}

            {activePanel === "participants" ? (
              <ParticipantsPanel
                onSearch={(query) => {
                  setParticipantQuery(query);
                  void loadParticipants(selectedTournament?.id, query);
                }}
                participants={participants}
                query={participantQuery}
                tournament={selectedTournament}
              />
            ) : null}

            {activePanel === "events" ? (
              <EventsPanel
                events={events}
                onSearch={(query) => {
                  setEventQuery(query);
                  void loadEvents(query);
                }}
                query={eventQuery}
              />
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function TournamentSidebar({
  onSelect,
  selectedTournamentId,
  tournaments,
}: {
  onSelect: (id: string) => void;
  selectedTournamentId: string;
  tournaments: ArenaTournament[];
}) {
  const groups = [
    ["Pending", tournaments.filter((tournament) => tournament.status === "PENDING")],
    ["In corso", tournaments.filter((tournament) => tournament.status === "ACTIVE" || tournament.status === "LOCKED")],
    ["Conclusi", tournaments.filter((tournament) => tournament.status === "COMPLETED")],
  ] as const;

  return (
    <aside className="admin-sidebar">
      {groups.map(([label, items]) => (
        <section className="admin-sidebar-section" key={label}>
          <h2>{label}</h2>
          {items.length > 0 ? (
            <div className="admin-tournament-list">
              {items.map((tournament) => (
                <button
                  className={cn(
                    "admin-tournament-item",
                    selectedTournamentId === tournament.id && "admin-tournament-item-active",
                  )}
                  key={tournament.id}
                  onClick={() => onSelect(tournament.id)}
                  type="button"
                >
                  <span>{tournament.name}</span>
                  <small>
                    {formatCups(tournament.prize_pool)} • Round {tournament.current_round_number}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <p>Nessun torneo.</p>
          )}
        </section>
      ))}
    </aside>
  );
}

function CreateTournamentWizard({
  onCreate,
}: {
  onCreate: (form: TournamentForm) => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<TournamentForm>(emptyTournamentForm);
  const sitePercentage = Math.max(0, 100 - Number(form.prizePoolPercentage || 0));

  function updateField(field: keyof TournamentForm) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target;
      setForm((current) => ({
        ...current,
        [field]: target instanceof HTMLInputElement && target.type === "checkbox"
          ? target.checked
          : target.value,
      }));
    };
  }

  return (
    <Card className="admin-card">
      <div className="admin-card-heading">
        <p className="user-page-kicker">Crea torneo</p>
        <h2>Wizard torneo</h2>
        <p>Step {step} di 2</p>
      </div>

      {step === 1 ? (
        <form
          className="admin-form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setStep(2);
          }}
        >
          <AdminField label="Nome torneo">
            <input className="ui-input" onChange={updateField("name")} value={form.name} />
          </AdminField>
          <AdminField label="Descrizione">
            <textarea className="admin-textarea" onChange={updateField("description")} value={form.description} />
          </AdminField>
          <AdminField label="Regolamento popup">
            <textarea className="admin-textarea" onChange={updateField("rules")} value={form.rules} />
          </AdminField>
          <AdminField label="Costo iscrizione (Coppe)">
            <input className="ui-input" min="0" onChange={updateField("entryCost")} type="number" value={form.entryCost} />
          </AdminField>
          <AdminField label="Vite iniziali incluse">
            <input className="ui-input" min="1" onChange={updateField("initialLives")} type="number" value={form.initialLives} />
          </AdminField>
          <AdminField label="Costo vita extra">
            <input className="ui-input" min="0" onChange={updateField("extraLifeCost")} type="number" value={form.extraLifeCost} />
          </AdminField>
          <AdminField label="Numero massimo vite per utente">
            <input
              className="ui-input"
              disabled={form.unlimitedLives}
              min="1"
              onChange={updateField("maxLivesPerUser")}
              type="number"
              value={form.maxLivesPerUser}
            />
          </AdminField>
          <AdminField label="Numero massimo partecipanti">
            <input
              className="ui-input"
              disabled={form.unlimitedParticipants}
              min="1"
              onChange={updateField("maxParticipants")}
              type="number"
              value={form.maxParticipants}
            />
          </AdminField>
          <label className="admin-check">
            <input checked={form.unlimitedParticipants} onChange={updateField("unlimitedParticipants")} type="checkbox" />
            Partecipanti illimitati
          </label>
          <label className="admin-check">
            <input checked={form.unlimitedLives} onChange={updateField("unlimitedLives")} type="checkbox" />
            Vite illimitate
          </label>
          <AdminField label="Percentuale montepremi">
            <input
              className="ui-input"
              max="100"
              min="0"
              onChange={updateField("prizePoolPercentage")}
              type="number"
              value={form.prizePoolPercentage}
            />
          </AdminField>
          <div className="admin-split-preview">
            <strong>{Number(form.prizePoolPercentage || 0)}% montepremi</strong>
            <span>{sitePercentage}% sito</span>
          </div>
          <Button className="admin-wide-button" type="submit">
            Continua
          </Button>
        </form>
      ) : (
        <div className="admin-confirm-panel">
          <div>
            <p className="user-page-kicker">Conferma</p>
            <h3>{form.name || "Nuovo torneo"}</h3>
            <p>
              Iscrizione {formatCups(Number(form.entryCost || 0))}, {form.initialLives} vite incluse,
              {` ${form.prizePoolPercentage}%`} al montepremi e {sitePercentage}% al sito.
            </p>
          </div>
          <div className="admin-actions-row">
            <Button onClick={() => setStep(1)} type="button" variant="secondary">
              Indietro
            </Button>
            <Button onClick={() => onCreate(form)} type="button">
              Salva torneo
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function TournamentManager({
  onMutate,
  teams,
  tournament,
}: {
  onMutate: (url: string, init?: RequestInit, options?: { keepPanel?: AdminPanelKey }) => Promise<ArenaTournament | null>;
  teams: Team[];
  tournament: ArenaTournament | null;
}) {
  const [matchForm, setMatchForm] = useState({
    awayTeamId: "",
    homeTeamId: "",
    isLocked: false,
    isSelectable: true,
  });
  const currentRound = getCurrentRound(tournament);
  const [deadline, setDeadline] = useState(() => toDateTimeLocal(currentRound?.deadline_at ?? null));
  const [results, setResults] = useState<Record<string, MatchResult>>(() =>
    Object.fromEntries(
      (currentRound?.matches ?? []).map((match) => [
        match.id,
        match.result === "PENDING" ? "HOME_WIN" : match.result,
      ]),
    ),
  );

  if (!tournament) {
    return (
      <Card className="admin-card">
        <p>Nessun torneo selezionato.</p>
      </Card>
    );
  }

  const canCalculate =
    currentRound &&
    currentRound.matches.length > 0 &&
    (currentRound.status === "LOCKED" ||
      isDeadlinePassed(currentRound.deadline_at) ||
      tournament.status === "LOCKED");

  return (
    <div className="admin-stack">
      <Card className="admin-card admin-tournament-summary">
        <div>
          <p className="user-page-kicker">{tournament.status}</p>
          <h2>{tournament.name}</h2>
          <p>{tournament.description || "Nessuna descrizione."}</p>
        </div>
        <div className="admin-summary-grid">
          <AdminMetric icon={Trophy} label="Montepremi" value={formatCups(tournament.prize_pool)} />
          <AdminMetric icon={Users} label="Partecipanti" value={String(tournament.participants)} />
          <AdminMetric icon={Crown} label="Vite vive" value={String(tournament.alive_lives ?? 0)} />
          <AdminMetric icon={Shield} label="Sito" value={formatCups(tournament.site_pool)} />
        </div>
      </Card>

      {currentRound ? (
        <Card className="admin-card">
          <div className="admin-card-heading">
            <p className="user-page-kicker">Configurazione Round</p>
            <h2>Round {currentRound.round_number}</h2>
            <p>
              Stato {currentRound.status} • Deadline {formatDeadline(currentRound.deadline_at)}
            </p>
          </div>

          <form
            className="admin-inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onMutate(
                `/api/admin/tournaments/${tournament.id}/round`,
                {
                  body: JSON.stringify({
                    deadlineAt: fromDateTimeLocal(deadline),
                    roundId: currentRound.id,
                  }),
                  method: "PATCH",
                },
                { keepPanel: "manage" },
              );
            }}
          >
            <AdminField label="Deadline round">
              <input className="ui-input" onChange={(event) => setDeadline(event.target.value)} type="datetime-local" value={deadline} />
            </AdminField>
            <Button className="admin-inline-button" type="submit">
              Salva deadline
            </Button>
          </form>

          <form
            className="admin-form-grid admin-match-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onMutate(
                "/api/admin/matches",
                {
                  body: JSON.stringify({
                    ...matchForm,
                    roundId: currentRound.id,
                  }),
                  method: "POST",
                },
                { keepPanel: "manage" },
              ).then((updated) => {
                if (updated) {
                  setMatchForm({
                    awayTeamId: "",
                    homeTeamId: "",
                    isLocked: false,
                    isSelectable: true,
                  });
                }
              });
            }}
          >
            <AdminField label="Squadra casa">
              <TeamSelect
                onChange={(value) => setMatchForm((current) => ({ ...current, homeTeamId: value }))}
                teams={teams}
                value={matchForm.homeTeamId}
              />
            </AdminField>
            <AdminField label="Squadra trasferta">
              <TeamSelect
                onChange={(value) => setMatchForm((current) => ({ ...current, awayTeamId: value }))}
                teams={teams}
                value={matchForm.awayTeamId}
              />
            </AdminField>
            <label className="admin-check">
              <input
                checked={matchForm.isSelectable}
                onChange={(event) => setMatchForm((current) => ({ ...current, isSelectable: event.target.checked }))}
                type="checkbox"
              />
              Selezionabile
            </label>
            <label className="admin-check">
              <input
                checked={matchForm.isLocked}
                onChange={(event) => setMatchForm((current) => ({ ...current, isLocked: event.target.checked }))}
                type="checkbox"
              />
              Bloccato
            </label>
            <Button className="admin-wide-button" type="submit">
              Aggiungi incontro
            </Button>
          </form>

          <div className="admin-match-list">
            {currentRound.matches.map((match) => (
              <MatchEditor key={`${match.id}-${match.updated_at}`} match={match} onMutate={onMutate} teams={teams} />
            ))}
          </div>

          <div className="admin-actions-row">
            {tournament.status === "PENDING" ? (
              <Button onClick={() => onMutate(`/api/admin/tournaments/${tournament.id}/publish`, { method: "POST" })} type="button">
                Pubblica torneo
              </Button>
            ) : null}

            {tournament.status === "ACTIVE" && currentRound.status === "PENDING" ? (
              <Button onClick={() => onMutate(`/api/admin/tournaments/${tournament.id}/open-round`, { method: "POST" })} type="button">
                Apri Round {currentRound.round_number}
              </Button>
            ) : null}

            {tournament.status === "ACTIVE" && currentRound.status === "OPEN" ? (
              <Button onClick={() => onMutate(`/api/admin/tournaments/${tournament.id}/lock`, { method: "POST" })} type="button" variant="secondary">
                Blocca scelte ora
              </Button>
            ) : null}
          </div>

          {canCalculate ? (
            <form
              className="admin-calculate-panel"
              onSubmit={(event) => {
                event.preventDefault();
                void onMutate(
                  `/api/admin/rounds/${currentRound.id}/calculate`,
                  {
                    body: JSON.stringify({
                      results: currentRound.matches.map((match) => ({
                        matchId: match.id,
                        result: results[match.id] ?? "HOME_WIN",
                      })),
                    }),
                    method: "POST",
                  },
                  { keepPanel: "manage" },
                );
              }}
            >
              <p className="user-page-kicker">Calcolo Round</p>
              {currentRound.matches.map((match) => (
                <label className="admin-result-row" key={match.id}>
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
                    value={results[match.id] ?? "HOME_WIN"}
                  >
                    {resultOptions.map((result) => (
                      <option key={result} value={result}>
                        {resultLabels[result]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <Button type="submit" variant="gold">
                Calcola Round
              </Button>
            </form>
          ) : null}
        </Card>
      ) : null}

      <Card className="admin-card">
        <div className="admin-card-heading">
          <p className="user-page-kicker">Storico Round</p>
          <h2>Round configurati</h2>
        </div>
        <div className="admin-round-history">
          {tournament.rounds.map((round) => (
            <details key={round.id}>
              <summary>
                Round {round.round_number} • {round.status} • {formatDeadline(round.deadline_at)}
              </summary>
              <div className="admin-history-matches">
                {round.matches.length > 0 ? (
                  round.matches.map((match) => (
                    <span key={match.id}>
                      {match.home_team} vs {match.away_team} • {resultLabels[match.result]}
                    </span>
                  ))
                ) : (
                  <span>Nessun match configurato.</span>
                )}
              </div>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MatchEditor({
  match,
  onMutate,
  teams,
}: {
  match: ArenaMatch;
  onMutate: (url: string, init?: RequestInit, options?: { keepPanel?: AdminPanelKey }) => Promise<ArenaTournament | null>;
  teams: Team[];
}) {
  const [draft, setDraft] = useState({
    awayTeamId: match.away_team_id ?? "",
    homeTeamId: match.home_team_id ?? "",
    isLocked: match.is_locked === 1,
    isSelectable: match.is_selectable === 1,
  });

  return (
    <article className="admin-match-row">
      <div className="admin-match-fields">
        <TeamSelect
          legacyLabel={match.home_team}
          onChange={(value) => setDraft((current) => ({ ...current, homeTeamId: value }))}
          teams={teams}
          value={draft.homeTeamId}
        />
        <TeamSelect
          legacyLabel={match.away_team}
          onChange={(value) => setDraft((current) => ({ ...current, awayTeamId: value }))}
          teams={teams}
          value={draft.awayTeamId}
        />
      </div>
      <div className="admin-match-flags">
        <label>
          <input checked={draft.isSelectable} onChange={(event) => setDraft((current) => ({ ...current, isSelectable: event.target.checked }))} type="checkbox" />
          Selezionabile
        </label>
        <label>
          <input checked={draft.isLocked} onChange={(event) => setDraft((current) => ({ ...current, isLocked: event.target.checked }))} type="checkbox" />
          Bloccato
        </label>
      </div>
      <div className="admin-actions-row admin-row-actions">
        <Button
          onClick={() =>
            onMutate(
              `/api/admin/matches/${match.id}`,
              {
                body: JSON.stringify(draft),
                method: "PATCH",
              },
              { keepPanel: "manage" },
            )
          }
          type="button"
        >
          Salva
        </Button>
        <Button
          onClick={() =>
            onMutate(
              `/api/admin/matches/${match.id}`,
              {
                method: "DELETE",
              },
              { keepPanel: "manage" },
            )
          }
          type="button"
          variant="secondary"
        >
          Rimuovi
        </Button>
      </div>
    </article>
  );
}

function TeamSelect({
  legacyLabel,
  onChange,
  teams,
  value,
}: {
  legacyLabel?: string;
  onChange: (value: string) => void;
  teams: Team[];
  value: string;
}) {
  return (
    <select
      className="admin-select"
      disabled={teams.length === 0}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">
        {legacyLabel ? `Seleziona squadra per ${legacyLabel}` : "Seleziona squadra"}
      </option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
        </option>
      ))}
    </select>
  );
}

function TeamsPanel({
  onMutate,
  teams,
}: {
  onMutate: (url: string, init?: RequestInit) => Promise<Team | null>;
  teams: Team[];
}) {
  const [draft, setDraft] = useState({
    logoUrl: "",
    name: "",
  });
  const [localMessage, setLocalMessage] = useState("");

  function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLocalMessage("Seleziona un file immagine.");
      return;
    }

    if (file.size > 160_000) {
      setLocalMessage("Logo troppo pesante. Usa un file sotto 160 KB oppure un URL immagine.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({
        ...current,
        logoUrl: typeof reader.result === "string" ? reader.result : "",
      }));
      setLocalMessage("");
    };
    reader.readAsDataURL(file);
  }

  async function createTeamFromDraft() {
    const team = await onMutate("/api/admin/teams", {
      body: JSON.stringify({
        logoUrl: draft.logoUrl,
        name: draft.name,
      }),
      method: "POST",
    });

    if (team) {
      setDraft({
        logoUrl: "",
        name: "",
      });
      setLocalMessage("");
    }
  }

  return (
    <div className="admin-stack">
      <Card className="admin-card">
        <div className="admin-card-heading">
          <p className="user-page-kicker">Catalogo squadre</p>
          <h2>Aggiungi squadra</h2>
          <p>Le squadre salvate qui saranno disponibili nella configurazione dei match.</p>
        </div>

        {localMessage ? (
          <div className="auth-form-message auth-form-message-error" role="alert">
            {localMessage}
          </div>
        ) : null}

        <form
          className="admin-form-grid admin-team-form"
          onSubmit={(event) => {
            event.preventDefault();
            void createTeamFromDraft();
          }}
        >
          <AdminField label="Nome squadra">
            <input
              className="ui-input"
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Juventus"
              value={draft.name}
            />
          </AdminField>
          <AdminField label="Logo squadra">
            <input
              className="ui-input"
              onChange={(event) => setDraft((current) => ({ ...current, logoUrl: event.target.value }))}
              placeholder="URL immagine oppure carica un file"
              value={draft.logoUrl.startsWith("data:image/") ? "Logo caricato da file" : draft.logoUrl}
            />
          </AdminField>
          <AdminField label="Carica scudetto">
            <input accept="image/*" className="ui-input" onChange={handleLogoFile} type="file" />
          </AdminField>
          <div className="admin-team-preview">
            <TeamLogo logoUrl={draft.logoUrl} name={draft.name || "Team"} />
            <div>
              <span>Anteprima</span>
              <strong>{draft.name || "Nome squadra"}</strong>
            </div>
          </div>
          <Button className="admin-wide-button" type="submit">
            Aggiungi squadra
          </Button>
        </form>
      </Card>

      <Card className="admin-card">
        <div className="admin-card-heading">
          <p className="user-page-kicker">Squadre salvate</p>
          <h2>Catalogo</h2>
        </div>
        <div className="admin-team-list">
          {teams.length > 0 ? (
            teams.map((team) => (
              <TeamEditor key={team.id} onMutate={onMutate} team={team} />
            ))
          ) : (
            <p className="admin-muted">Nessuna squadra salvata.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function TeamEditor({
  onMutate,
  team,
}: {
  onMutate: (url: string, init?: RequestInit) => Promise<Team | null>;
  team: Team;
}) {
  const [draft, setDraft] = useState({
    logoUrl: team.logo_url ?? "",
    name: team.name,
  });

  return (
    <article className="admin-team-row">
      <div className="admin-team-identity">
        <TeamLogo logoUrl={team.logo_url} name={team.name} />
        <div>
          <strong>{team.name}</strong>
          <span>ID interno: {team.id}</span>
        </div>
      </div>
      <div className="admin-team-edit-grid">
        <input
          className="ui-input"
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          value={draft.name}
        />
        <input
          className="ui-input"
          onChange={(event) => setDraft((current) => ({ ...current, logoUrl: event.target.value }))}
          placeholder="Logo URL"
          value={draft.logoUrl.startsWith("data:image/") ? "Logo caricato da file" : draft.logoUrl}
        />
      </div>
      <div className="admin-actions-row admin-row-actions">
        <Button
          onClick={() =>
            onMutate(`/api/admin/teams/${team.id}`, {
              body: JSON.stringify(draft),
              method: "PATCH",
            })
          }
          type="button"
        >
          Salva
        </Button>
        <Button
          onClick={() =>
            onMutate(`/api/admin/teams/${team.id}`, {
              method: "DELETE",
            })
          }
          type="button"
          variant="secondary"
        >
          Rimuovi
        </Button>
      </div>
    </article>
  );
}

function TeamLogo({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  return logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={`Logo ${name}`} className="admin-team-logo" src={logoUrl} />
  ) : (
    <span className="admin-team-logo admin-team-logo-placeholder">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function ParticipantsPanel({
  onSearch,
  participants,
  query,
  tournament,
}: {
  onSearch: (query: string) => void;
  participants: Participant[];
  query: string;
  tournament: ArenaTournament | null;
}) {
  return (
    <Card className="admin-card">
      <div className="admin-card-heading">
        <p className="user-page-kicker">Partecipanti</p>
        <h2>{tournament?.name ?? "Nessun torneo"}</h2>
      </div>
      <SearchBox onSearch={onSearch} placeholder="Cerca username o email" query={query} />
      <div className="admin-participant-list">
        {participants.length > 0 ? (
          participants.map((participant) => (
            <details className="admin-participant-card" key={participant.id}>
              <summary>
                <span>{participant.username}</span>
                <strong>
                  {participant.total_lives} vite • {participant.alive_lives} vive •{" "}
                  {participant.eliminated_lives} eliminate
                </strong>
              </summary>
              <div className="admin-participant-detail">
                <p>{participant.email}</p>
                <p>Codice utente: {participant.user_code}</p>
                <div className="admin-life-history">
                  {participant.lives.map((life) => (
                    <article key={life.id}>
                      <strong>
                        Vita {life.life_number} • {life.status}
                      </strong>
                      {life.selections.length > 0 ? (
                        life.selections.map((selection) => (
                          <span key={`${life.id}-${selection.round_id}`}>
                            {selection.selected_team} • {selection.status}
                          </span>
                        ))
                      ) : (
                        <span>Nessuna scelta registrata.</span>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </details>
          ))
        ) : (
          <p className="admin-muted">Nessun partecipante trovato.</p>
        )}
      </div>
    </Card>
  );
}

function EventsPanel({
  events,
  onSearch,
  query,
}: {
  events: EventLog[];
  onSearch: (query: string) => void;
  query: string;
}) {
  return (
    <Card className="admin-card">
      <div className="admin-card-heading">
        <p className="user-page-kicker">Registro eventi</p>
        <h2>Eventi Arena</h2>
      </div>
      <SearchBox onSearch={onSearch} placeholder="Cerca torneo, utente, email o evento" query={query} />
      <div className="admin-event-list">
        {events.length > 0 ? (
          events.map((event) => (
            <article className="admin-event-row" key={event.id}>
              <span>{event.event_type}</span>
              <strong>{event.message}</strong>
              <p>
                {event.tournament_name ?? "Sistema"} • {event.username ?? event.email ?? "Admin"} •{" "}
                {formatDeadline(event.created_at)}
              </p>
            </article>
          ))
        ) : (
          <p className="admin-muted">Nessun evento trovato.</p>
        )}
      </div>
    </Card>
  );
}

function SearchBox({
  onSearch,
  placeholder,
  query,
}: {
  onSearch: (query: string) => void;
  placeholder: string;
  query: string;
}) {
  const [value, setValue] = useState(query);

  return (
    <form
      className="admin-search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value);
      }}
    >
      <Search aria-hidden="true" className="admin-search-icon" />
      <input className="ui-input" onChange={(event) => setValue(event.target.value)} placeholder={placeholder} value={value} />
      <Button className="admin-search-button" type="submit">
        Cerca
      </Button>
    </form>
  );
}

function AdminField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="ui-field">
      <span className="ui-field-label">{label}</span>
      {children}
    </label>
  );
}

function AdminMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="admin-metric">
      <Icon aria-hidden="true" className="admin-metric-icon" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
