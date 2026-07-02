"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Flame, Heart, Lock, Shield, Sparkles, Users } from "lucide-react";
import { UserLayout } from "@/components/account/UserLayout";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
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

function formatGameCountdown(deadline: string | null, now: number) {
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

function getTeamInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SA";
}

function getSelectionVisual(life: ArenaLife, round: ArenaRound | null) {
  const selection = getSelectionForRound(life, round);
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

function getTeamKey(teamId: string | null, teamName: string) {
  return teamId || teamName.trim().toLowerCase();
}

function getLifeCycleSelections(life: ArenaLife | null) {
  if (!life) {
    return [];
  }

  return life.selections.filter((selection) => selection.cycle_number === life.current_cycle);
}

function isTeamUsedByLife(life: ArenaLife | null, round: ArenaRound | null, teamId: string | null, teamName: string) {
  if (!life || !round) {
    return false;
  }

  const teamKey = getTeamKey(teamId, teamName);

  return getLifeCycleSelections(life).some((selection) => {
    if (selection.round_id === round.id) {
      return false;
    }

    return getTeamKey(selection.selected_team_id, selection.selected_team) === teamKey;
  });
}

function buildPopularChoices(tournament: ArenaTournamentDetails, round: ArenaRound | null) {
  const choices = tournament.public_choices;
  const total = Math.max(choices.length, 1);
  const counts = new Map<string, { count: number; logoUrl: string | null; name: string }>();

  choices.forEach((choice) => {
    const match = round?.matches.find((item) => item.home_team === choice.selected_team || item.away_team === choice.selected_team);
    const logoUrl =
      choice.selected_team_id && match?.home_team_id === choice.selected_team_id
        ? match.home_team_logo_url
        : choice.selected_team_id && match?.away_team_id === choice.selected_team_id
          ? match.away_team_logo_url
          : choice.selected_team === match?.home_team
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
  const [choiceEffectKey, setChoiceEffectKey] = useState("");
  const [savedChoice, setSavedChoice] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedRoundId, setDismissedRoundId] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const currentRound = getCurrentRound(tournament);
  const aliveLives = useMemo(
    () => tournament?.user_lives.filter((life) => life.status === "ALIVE") ?? [],
    [tournament],
  );
  const selectedLife = aliveLives.find((life) => life.id === selectedLifeId) ?? aliveLives[0] ?? null;
  const choicesLocked = !!currentRound && (currentRound.status !== "OPEN" || isDeadlinePassed(currentRound.deadline_at));
  const latestCalculatedRound = tournament?.rounds.filter((round) => round.status === "CALCULATED").at(-1) ?? null;
  const shouldShowRoundSummary = !!latestCalculatedRound && dismissedRoundId !== latestCalculatedRound.id;
  const countdown = formatGameCountdown(currentRound?.deadline_at ?? null, now);
  const popularChoices = tournament && currentRound ? buildPopularChoices(tournament, currentRound) : [];

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

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  async function mutate(url: string, init?: RequestInit) {
    setMessage("");
    const data = await fetchJson<TournamentResponse>(url, init);

    if (!data.ok) {
      setMessage(data.message);
      return;
    }

    setTournament(data.tournament);
  }

  async function chooseTeam(match: ArenaMatch, selectedTeam: string, selectedTeamId: string | null) {
    if (!selectedLife) {
      setMessage("Seleziona prima una vita.");
      return;
    }

    const effectKey = `${match.id}:${selectedTeamId ?? selectedTeam}`;
    setChoiceEffectKey(effectKey);
    setSavedChoice(`Vita ${selectedLife.life_number}: ${selectedTeam}`);
    window.setTimeout(() => setChoiceEffectKey(""), 900);
    window.setTimeout(() => setSavedChoice(""), 2400);

    await mutate(`/api/arena/lives/${selectedLife.id}/choice`, {
      body: JSON.stringify({
        matchId: match.id,
        selectedTeamId,
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

      <section className="arena-game-hero">
        <div className="arena-game-hero-copy">
          <p className="user-page-kicker">Torneo</p>
          <h1>{tournament.name}</h1>
          <div className="arena-game-hero-badges">
            <span className="arena-game-state">
              <Sparkles aria-hidden="true" />
              {tournament.status === "ACTIVE" ? "In corso" : tournament.status}
            </span>
            <span className="arena-game-state arena-game-state-muted">Round {tournament.current_round_number}</span>
          </div>
        </div>
        <EpicCountdown countdown={countdown} deadline={formatDeadline(currentRound?.deadline_at ?? null)} round={tournament.current_round_number} />
        <div className="arena-game-hero-stats" aria-label="Riepilogo torneo">
          <span>
            <Users aria-hidden="true" />
            <strong>{tournament.participants}</strong>
            Partecipanti
          </span>
          <span>
            <Heart aria-hidden="true" />
            <strong>{aliveLives.length}</strong>
            Vite vive
          </span>
          <span>
            <Shield aria-hidden="true" />
            <strong>Round {tournament.current_round_number}</strong>
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

      {currentRound ? (
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

          {tournament.registration?.status === "ACTIVE" ? (
            <>
              <div className="arena-game-life-carousel" aria-label="Seleziona una vita">
                {tournament.user_lives.map((life) => {
                  const visual = getSelectionVisual(life, currentRound);

                  return (
                    <GameLifeButton
                      isSelected={life.id === selectedLife?.id}
                      key={life.id}
                      life={life}
                      onClick={() => setSelectedLifeId(life.id)}
                      visual={visual}
                    />
                  );
                })}
              </div>

              {!choicesLocked ? (
                <section className="arena-game-section arena-game-section-choices">
                  <div className="arena-section-heading">
                    <div>
                      <p className="user-page-kicker">Scelta partite</p>
                      <h2>{selectedLife ? `Scegli per questa vita` : "Seleziona una vita"}</h2>
                    </div>
                    {selectedLife ? <span className="ui-badge">Vita {selectedLife.life_number}</span> : null}
                  </div>
                  <div className="arena-game-match-list">
                  {currentRound.matches.map((match) => {
                    const selection = selectedLife ? getSelectionForRound(selectedLife, currentRound) : null;
                    const homeUsed = isTeamUsedByLife(selectedLife, currentRound, match.home_team_id, match.home_team);
                    const awayUsed = isTeamUsedByLife(selectedLife, currentRound, match.away_team_id, match.away_team);

                    return (
                      <article className={cn("arena-game-match-card", choiceEffectKey.startsWith(`${match.id}:`) && "arena-game-match-card-pop")} key={match.id}>
                        <GameTeamButton
                            choiceEffectKey={choiceEffectKey}
                            disabled={!match.is_selectable || !!match.is_locked || !selectedLife || homeUsed}
                            isSelected={
                              selection?.selected_team_id
                                ? selection.selected_team_id === match.home_team_id
                                : selection?.selected_team.toLowerCase() === match.home_team.toLowerCase()
                            }
                            isUsed={homeUsed}
                            logoUrl={match.home_team_logo_url}
                            onClick={() => chooseTeam(match, match.home_team, match.home_team_id)}
                            teamId={match.home_team_id}
                            team={match.home_team}
                          />
                          <span className="arena-game-vs">VS</span>
                          <GameTeamButton
                            choiceEffectKey={choiceEffectKey}
                            disabled={!match.is_selectable || !!match.is_locked || !selectedLife || awayUsed}
                            isSelected={
                              selection?.selected_team_id
                                ? selection.selected_team_id === match.away_team_id
                                : selection?.selected_team.toLowerCase() === match.away_team.toLowerCase()
                            }
                            isUsed={awayUsed}
                            logoUrl={match.away_team_logo_url}
                            onClick={() => chooseTeam(match, match.away_team, match.away_team_id)}
                            teamId={match.away_team_id}
                            team={match.away_team}
                          />
                      </article>
                    );
                  })}
                  </div>
                </section>
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
                  <TeamMark logoUrl={choice.logoUrl} name={choice.name} />
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

      {canManageEntry ? (
        <section className="arena-game-info-banner">
          <Flame aria-hidden="true" />
          <p>Fino alla deadline del primo round puoi aggiungere una vita o disiscriverti.</p>
          <div>
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
          </div>
        </section>
      ) : (
        <section className="arena-game-info-banner">
          <Flame aria-hidden="true" />
          <p>{choicesLocked ? "Le scelte sono chiuse: attendi il calcolo del round." : "Scegli con attenzione: ogni vita può cambiare il destino del torneo."}</p>
        </section>
      )}

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

function EpicCountdown({
  countdown,
  deadline,
  round,
}: {
  countdown: ReturnType<typeof formatGameCountdown>;
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

function TeamMark({ logoUrl, name }: { logoUrl: string | null; name: string }) {
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

function GameLifeButton({
  isSelected,
  life,
  onClick,
  visual,
}: {
  isSelected: boolean;
  life: ArenaLife;
  onClick: () => void;
  visual: ReturnType<typeof getSelectionVisual>;
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
        {visual ? <TeamMark logoUrl={visual.logoUrl} name={visual.name} /> : null}
      </span>
    </button>
  );
}

function GameTeamButton({
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
  teamId: string | null;
}) {
  const effectKey = teamId ?? team;
  const isBursting = choiceEffectKey.endsWith(`:${effectKey}`);

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
      <TeamMark logoUrl={logoUrl} name={team} />
      <span>{team}</span>
      {isSelected ? <CheckCircle2 aria-label="Squadra scelta" /> : null}
      {isUsed ? (
        <small>
          <Lock aria-hidden="true" />
          Già usata
        </small>
      ) : null}
      {isBursting ? <ChoiceParticles /> : null}
    </button>
  );
}

function ChoiceParticles() {
  return (
    <span className="arena-choice-particles" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, index) => (
        <i key={index} />
      ))}
    </span>
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
