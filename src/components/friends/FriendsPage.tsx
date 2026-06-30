"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, Heart, Lock, Plus, Shield, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AccountUser } from "@/components/account/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
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

export function FriendsPage({ user }: { user: AccountUser }) {
  const [competitions, setCompetitions] = useState<FriendsCompetition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const selected = competitions.find((competition) => competition.id === selectedId) ?? competitions[0] ?? null;

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      const [competitionData, teamData] = await Promise.all([
        fetchJson<FriendsResponse>("/api/friends/competitions"),
        fetchJson<TeamsResponse>("/api/friends/teams"),
      ]);

      if (!isMounted) {
        return;
      }

      if (competitionData.ok) {
        setCompetitions(competitionData.competitions);
        setSelectedId((current) => current || competitionData.competitions[0]?.id || "");
      } else {
        setMessage(competitionData.message);
      }

      if (teamData.ok) {
        setTeams(teamData.teams);
      } else {
        setMessage(teamData.message);
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
  }, []);

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

  return (
    <div className="dashboard-page-content">
      <header className="user-page-intro">
        <p className="user-page-kicker">Modalità Friends</p>
        <h1>Competizioni private</h1>
        <p>Crea sfide tra amici, invita solo chi vuoi e gestisci vite, round e risultati senza Coppe o premi.</p>
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

      <div className="dashboard-layout-grid">
        <div className="dashboard-main-stack">
          <CreateFriendsWizard onCreate={mutate} teams={teams} />

          {selected ? (
            <FriendsCompetitionPanel
              competition={selected}
              mutate={mutate}
              teams={teams}
              user={user}
            />
          ) : (
            <Card className="dashboard-panel">
              <h2>Nessuna competizione Friends</h2>
              <p className="admin-muted">Crea una competizione o attendi un invito da un amico.</p>
            </Card>
          )}
        </div>

        <aside className="dashboard-side-stack">
          <Card className="dashboard-panel">
            <div className="dashboard-section-heading">
              <div>
                <p className="user-page-kicker">Le tue sfide</p>
                <h2>Friends</h2>
              </div>
            </div>

            <div className="admin-tool-card">
              <strong>Hai un codice invito?</strong>
              <div className="admin-form-grid">
                <input
                  className="ui-input"
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder="FR-ABCDEFGH"
                  value={inviteCode}
                />
                <Button
                  onClick={async () => {
                    const updated = await mutate("/api/friends/join", {
                      body: JSON.stringify({ inviteCode }),
                      method: "POST",
                    });
                    if (updated) {
                      setInviteCode("");
                    }
                  }}
                  type="button"
                  variant="secondary"
                >
                  Entra
                </Button>
              </div>
            </div>

            <div className="dashboard-action-list">
              {competitions.length > 0 ? (
                competitions.map((competition) => (
                  <button
                    className={cn("dashboard-action-item", selected?.id === competition.id && "user-nav-link-active")}
                    key={competition.id}
                    onClick={() => setSelectedId(competition.id)}
                    type="button"
                  >
                    <span className="dashboard-action-icon">
                      <UsersRound aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{competition.name}</strong>
                      <p>
                        {competition.is_owner ? "Organizzatore" : competition.can_join ? "Invito ricevuto" : "Partecipante"} •{" "}
                        {competition.status}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="admin-muted">Nessuna competizione da mostrare.</p>
              )}
            </div>
          </Card>
        </aside>
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
    <Card className="dashboard-panel">
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
    </Card>
  );
}

function FriendsCompetitionPanel({
  competition,
  mutate,
  teams,
  user,
}: {
  competition: FriendsCompetition;
  mutate: (url: string, init?: RequestInit) => Promise<FriendsCompetition | null>;
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

      {competition.is_owner ? (
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
