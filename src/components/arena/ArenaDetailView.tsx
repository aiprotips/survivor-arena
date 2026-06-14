"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock3, Heart, Lock, Search, Shield, Trophy, Users } from "lucide-react";
import { UserLayout } from "@/components/account/UserLayout";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  formatCups,
  formatDeadline,
  isDeadlinePassed,
  type ArenaLife,
  type ArenaMatch,
  type ArenaRound,
  type ArenaTournamentDetails,
} from "@/lib/arena-client";
import { cn } from "@/lib/cn";

type TournamentResponse =
  | {
      ok: true;
      tournament: ArenaTournamentDetails;
    }
  | {
      message: string;
      ok: false;
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

function getCurrentRound(tournament: ArenaTournamentDetails | null) {
  return tournament?.rounds.find(
    (round) => round.round_number === tournament.current_round_number,
  ) ?? null;
}

function getSelectionForRound(life: ArenaLife, round: ArenaRound | null) {
  if (!round) {
    return null;
  }

  return life.selections.find((selection) => selection.round_id === round.id) ?? null;
}

export function ArenaDetailView() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("id") ?? "";

  return (
    <UserLayout currentPage="arena">
      {() => <ArenaDetailContent tournamentId={tournamentId} />}
    </UserLayout>
  );
}

function ArenaDetailContent({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [tournament, setTournament] = useState<ArenaTournamentDetails | null>(null);
  const [selectedLifeId, setSelectedLifeId] = useState("");
  const [publicQuery, setPublicQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedRoundId, setDismissedRoundId] = useState("");

  const currentRound = getCurrentRound(tournament);
  const aliveLives = useMemo(
    () => tournament?.user_lives.filter((life) => life.status === "ALIVE") ?? [],
    [tournament],
  );
  const selectedLife = aliveLives.find((life) => life.id === selectedLifeId) ?? aliveLives[0] ?? null;
  const choicesLocked = !!currentRound && (currentRound.status !== "OPEN" || isDeadlinePassed(currentRound.deadline_at));
  const latestCalculatedRound = tournament?.rounds.filter((round) => round.status === "CALCULATED").at(-1) ?? null;
  const shouldShowRoundSummary = !!latestCalculatedRound && dismissedRoundId !== latestCalculatedRound.id;

  const filteredPublicChoices = useMemo(() => {
    const query = publicQuery.trim().toLowerCase();

    if (!query || !tournament) {
      return tournament?.public_choices ?? [];
    }

    return tournament.public_choices.filter(
      (choice) =>
        choice.username.toLowerCase().includes(query) ||
        choice.email.toLowerCase().includes(query) ||
        choice.selected_team.toLowerCase().includes(query),
    );
  }, [publicQuery, tournament]);

  useEffect(() => {
    if (!tournamentId) {
      router.replace("/arene");
      return;
    }

    let isMounted = true;

    async function loadInitialTournament() {
      setIsLoading(true);
      setMessage("");

      const data = await fetchJson<TournamentResponse>(`/api/arena/tournaments/${tournamentId}`);

      if (!isMounted) {
        return;
      }

      if (data.ok) {
        setTournament(data.tournament);
      } else {
        setMessage(data.message);
      }

      setIsLoading(false);
    }

    void loadInitialTournament();

    return () => {
      isMounted = false;
    };
  }, [tournamentId, router]);

  async function mutate(url: string, init?: RequestInit) {
    setMessage("");
    const data = await fetchJson<TournamentResponse>(url, init);

    if (!data.ok) {
      setMessage(data.message);
      return;
    }

    setTournament(data.tournament);
  }

  async function chooseTeam(match: ArenaMatch, selectedTeam: string) {
    if (!selectedLife) {
      setMessage("Seleziona prima una vita.");
      return;
    }

    await mutate(`/api/arena/lives/${selectedLife.id}/choice`, {
      body: JSON.stringify({
        matchId: match.id,
        selectedTeam,
      }),
      method: "POST",
    });
  }

  if (isLoading) {
    return (
      <Card className="arena-empty-card">
        <p>Caricamento torneo...</p>
      </Card>
    );
  }

  if (!tournament) {
    return (
      <Card className="arena-empty-card">
        <h1>Arena non disponibile</h1>
        <p>{message || "Torneo non trovato."}</p>
        <ButtonLink href="/arene" variant="secondary">
          Torna alle Arene
        </ButtonLink>
      </Card>
    );
  }

  const canManageEntry =
    tournament.current_round_number === 1 &&
    currentRound?.status === "OPEN" &&
    !isDeadlinePassed(currentRound.deadline_at);

  return (
    <div className="arena-detail-page">
      {message ? (
        <div className="auth-form-message auth-form-message-error" role="alert">
          {message}
        </div>
      ) : null}

      <section className="arena-detail-hero">
        <div>
          <p className="user-page-kicker">Arena in corso</p>
          <h1>{tournament.name}</h1>
          <p>{tournament.description || "Sopravvivi turno dopo turno."}</p>
        </div>
        <div className="arena-detail-actions">
          {canManageEntry ? (
            <>
              <Button onClick={() => mutate(`/api/arena/tournaments/${tournament.id}/buy-life`, { method: "POST" })} type="button">
                Aggiungi vita
              </Button>
              <button
                className="arena-leave-button"
                onClick={() => mutate(`/api/arena/tournaments/${tournament.id}/leave`, { method: "POST" })}
                type="button"
              >
                Disiscriviti
              </button>
            </>
          ) : null}
        </div>
      </section>

      <section className="arena-summary-grid" aria-label="Riepilogo torneo">
        <SummaryMetric icon={Trophy} label="Costo" value={formatCups(tournament.entry_cost)} />
        <SummaryMetric icon={Heart} label="Vite vive" value={String(aliveLives.length)} />
        <SummaryMetric icon={Trophy} label="Montepremi" value={formatCups(tournament.prize_pool)} />
        <SummaryMetric icon={Users} label="Partecipanti" value={String(tournament.participants)} />
        <SummaryMetric icon={Clock3} label="Deadline" value={formatDeadline(currentRound?.deadline_at ?? null)} />
        <SummaryMetric icon={Shield} label="Round" value={`Round ${tournament.current_round_number}`} />
      </section>

      {currentRound ? (
        <section className="arena-round-panel">
          <div className="arena-section-heading">
            <div>
              <p className="user-page-kicker">Round corrente</p>
              <h2>Round {currentRound.round_number}</h2>
            </div>
            {choicesLocked ? (
              <span className="arena-locked-pill">
                <Lock aria-hidden="true" />
                Scelte bloccate
              </span>
            ) : null}
          </div>

          {tournament.registration?.status === "ACTIVE" ? (
            <>
              <div className="arena-life-selector" aria-label="Seleziona una vita">
                {tournament.user_lives.map((life) => {
                  const selection = getSelectionForRound(life, currentRound);

                  return (
                    <button
                      className={cn(
                        "arena-life-chip",
                        life.id === selectedLife?.id && "arena-life-chip-active",
                        life.status !== "ALIVE" && "arena-life-chip-dead",
                      )}
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
                    const selection = selectedLife ? getSelectionForRound(selectedLife, currentRound) : null;

                    return (
                      <article className="arena-match-choice-card" key={match.id}>
                        <div className="arena-match-title">
                          <strong>{match.home_team}</strong>
                          <span>vs</span>
                          <strong>{match.away_team}</strong>
                        </div>
                        <div className="arena-team-actions">
                          <TeamButton
                            disabled={!match.is_selectable || !!match.is_locked}
                            isSelected={selection?.selected_team.toLowerCase() === match.home_team.toLowerCase()}
                            onClick={() => chooseTeam(match, match.home_team)}
                            team={match.home_team}
                          />
                          <TeamButton
                            disabled={!match.is_selectable || !!match.is_locked}
                            isSelected={selection?.selected_team.toLowerCase() === match.away_team.toLowerCase()}
                            onClick={() => chooseTeam(match, match.away_team)}
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
                  <h3>Round {currentRound.round_number} in corso</h3>
                  <p>Le scelte sono bloccate. Ora puoi consultare le scelte pubbliche.</p>
                </Card>
              )}
            </>
          ) : (
            <Card className="arena-empty-card">
              <h2>Non sei iscritto a questa Arena</h2>
              <ButtonLink href="/arene">Torna alle Arene</ButtonLink>
            </Card>
          )}
        </section>
      ) : null}

      {choicesLocked ? (
        <section className="arena-public-choices">
          <div className="arena-section-heading">
            <div>
              <p className="user-page-kicker">Trasparenza</p>
              <h2>Scelte pubbliche</h2>
            </div>
          </div>
          <label className="arena-public-search">
            <Search aria-hidden="true" />
            <input
              className="ui-input"
              onChange={(event) => setPublicQuery(event.target.value)}
              placeholder="Cerca utenti o squadre"
              value={publicQuery}
            />
          </label>
          <div className="arena-public-list">
            {filteredPublicChoices.length > 0 ? (
              filteredPublicChoices.map((choice) => (
                <article key={`${choice.username}-${choice.life_number}-${choice.selected_team}`}>
                  <strong>{choice.username}</strong>
                  <span>Vita {choice.life_number}</span>
                  <em>{choice.selected_team}</em>
                </article>
              ))
            ) : (
              <p>Nessuna scelta pubblica disponibile.</p>
            )}
          </div>
        </section>
      ) : null}

      {shouldShowRoundSummary && latestCalculatedRound ? (
        <RoundSummaryModal
          lives={tournament.user_lives}
          onClose={() => setDismissedRoundId(latestCalculatedRound.id)}
          round={latestCalculatedRound}
          tournamentStatus={tournament.status}
        />
      ) : null}
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <article className="arena-summary-card">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function TeamButton({
  disabled,
  isSelected,
  onClick,
  team,
}: {
  disabled: boolean;
  isSelected: boolean;
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
      <span>{team}</span>
      {isSelected ? <em aria-label="Squadra scelta" /> : null}
    </button>
  );
}

function RoundSummaryModal({
  lives,
  onClose,
  round,
  tournamentStatus,
}: {
  lives: ArenaLife[];
  onClose: () => void;
  round: ArenaRound;
  tournamentStatus: string;
}) {
  const roundSelections = lives
    .map((life) => ({
      life,
      selection: life.selections.find((item) => item.round_id === round.id) ?? null,
    }))
    .filter((item) => item.selection);
  const aliveLives = lives.filter((life) => life.status === "ALIVE" || life.status === "WINNER");

  return (
    <div className="arena-modal-backdrop" role="presentation">
      <Card aria-modal="true" className="arena-modal-card" role="dialog">
        <p className="user-page-kicker">Riepilogo Round {round.round_number}</p>
        <h2>
          {tournamentStatus === "COMPLETED"
            ? aliveLives.length > 0
              ? "Complimenti, torneo concluso"
              : "Torneo concluso"
            : `Vai al Round ${round.round_number + 1}`}
        </h2>
        <div className="arena-modal-list">
          {roundSelections.length > 0 ? (
            roundSelections.map(({ life, selection }) => (
              <span key={life.id}>
                Vita {life.life_number} - {selection?.selected_team} - {selection?.status}
              </span>
            ))
          ) : (
            <span>Nessuna scelta nel round.</span>
          )}
        </div>
        <Button onClick={onClose} type="button">
          Continua
        </Button>
      </Card>
    </div>
  );
}
