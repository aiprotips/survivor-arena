"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Info, Shield, Trophy, Users } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import {
  formatCups,
  formatDeadline,
  type ArenaTournament,
} from "@/lib/arena-client";

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

export function ArenaListContent() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<ArenaTournament[]>([]);
  const [selectedInfo, setSelectedInfo] = useState<ArenaTournament | null>(null);
  const [selectedJoin, setSelectedJoin] = useState<ArenaTournament | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTournaments() {
      const data = await fetchJson<TournamentsResponse>("/api/arena/tournaments");

      if (!isMounted) {
        return;
      }

      if (data.ok) {
        setTournaments(data.tournaments);
      } else {
        setMessage(data.message);
      }

      setIsLoading(false);
    }

    loadTournaments().catch(() => {
      if (isMounted) {
        setMessage("Arene non disponibili. Riprova tra poco.");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function joinTournament(tournament: ArenaTournament) {
    setMessage("");
    const data = await fetchJson<TournamentResponse>(
      `/api/arena/tournaments/${tournament.id}/join`,
      { method: "POST" },
    );

    if (!data.ok) {
      setMessage(data.message);
      return;
    }

    router.push(`/arena?id=${tournament.id}`);
  }

  return (
    <>
      <header className="user-page-intro">
        <p className="user-page-kicker">Competizione</p>
        <h1>Arene</h1>
        <p>Iscriviti ai tornei pubblicati e gestisci le tue vite round dopo round.</p>
        <PremiumDivider />
      </header>

      {message ? (
        <div className="auth-form-message auth-form-message-error" role="alert">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <Card className="arena-empty-card">
          <p>Caricamento Arene...</p>
        </Card>
      ) : tournaments.length > 0 ? (
        <section className="arena-card-grid" aria-label="Arene pubblicate">
          {tournaments.map((tournament) => {
            const currentRound = tournament.current_round;
            const maxParticipants = tournament.unlimited_participants
              ? "Illimitati"
              : tournament.max_participants ?? "-";

            return (
              <article className="arena-user-card" key={tournament.id}>
                <div className="arena-card-top">
                  <span className="ui-badge ui-badge-gold">{tournament.status}</span>
                  <button
                    aria-label={`Info ${tournament.name}`}
                    className="arena-info-button"
                    onClick={() => setSelectedInfo(tournament)}
                    type="button"
                  >
                    <Info aria-hidden="true" />
                  </button>
                </div>

                <div className="arena-user-card-copy">
                  <h2>{tournament.name}</h2>
                  <p>{tournament.description || "Arena Survivor pubblicata."}</p>
                </div>

                <div className="arena-user-metrics">
                  <Metric icon={Trophy} label="Costo" value={formatCups(tournament.entry_cost)} />
                  <Metric icon={Shield} label="Vite incluse" value={String(tournament.initial_lives)} />
                  <Metric icon={Users} label="Partecipanti" value={`${tournament.participants}/${maxParticipants}`} />
                  <Metric icon={Trophy} label="Montepremi" value={formatCups(tournament.prize_pool)} />
                </div>

                <div className="arena-deadline-pill">
                  <Clock3 aria-hidden="true" />
                  <span>{formatDeadline(currentRound?.deadline_at ?? null)}</span>
                </div>

                {tournament.is_joined ? (
                  <ButtonLink href={`/arena?id=${tournament.id}`}>Apri Arena</ButtonLink>
                ) : (
                  <Button onClick={() => setSelectedJoin(tournament)} type="button">
                    Iscriviti
                  </Button>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <Card className="arena-empty-card">
          <h2>Nessuna Arena pubblicata</h2>
          <p>Quando l&apos;admin pubblicherà un torneo, lo vedrai qui.</p>
        </Card>
      )}

      {selectedInfo ? (
        <ArenaInfoModal onClose={() => setSelectedInfo(null)} tournament={selectedInfo} />
      ) : null}

      {selectedJoin ? (
        <ArenaJoinModal
          onClose={() => setSelectedJoin(null)}
          onConfirm={() => joinTournament(selectedJoin)}
          tournament={selectedJoin}
        />
      ) : null}
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ArenaInfoModal({
  onClose,
  tournament,
}: {
  onClose: () => void;
  tournament: ArenaTournament;
}) {
  const currentRound = tournament.current_round;

  return (
    <div className="arena-modal-backdrop" role="presentation">
      <Card aria-modal="true" className="arena-modal-card" role="dialog">
        <p className="user-page-kicker">Regolamento</p>
        <h2>{tournament.name}</h2>
        <p>{tournament.rules || tournament.description || "Regolamento in preparazione."}</p>
        <div className="arena-modal-list">
          <span>Costo: {formatCups(tournament.entry_cost)}</span>
          <span>Vite incluse: {tournament.initial_lives}</span>
          <span>Vite extra: {formatCups(tournament.extra_life_cost)}</span>
          <span>Deadline: {formatDeadline(currentRound?.deadline_at ?? null)}</span>
          <span>Montepremi: {formatCups(tournament.prize_pool)}</span>
          <span>Regola eliminazione: sopravvive solo la vita che sceglie una squadra vincente.</span>
        </div>
        <Button onClick={onClose} type="button" variant="secondary">
          Chiudi
        </Button>
      </Card>
    </div>
  );
}

function ArenaJoinModal({
  onClose,
  onConfirm,
  tournament,
}: {
  onClose: () => void;
  onConfirm: () => void;
  tournament: ArenaTournament;
}) {
  return (
    <div className="arena-modal-backdrop" role="presentation">
      <Card aria-modal="true" className="arena-modal-card" role="dialog">
        <p className="user-page-kicker">Iscrizione</p>
        <h2>Vuoi iscriverti a questo torneo?</h2>
        <p>{tournament.name}</p>
        <div className="arena-modal-list">
          <span>Costo: {formatCups(tournament.entry_cost)}</span>
          <span>Vite incluse: {tournament.initial_lives}</span>
        </div>
        <div className="arena-modal-actions">
          <Button onClick={onClose} type="button" variant="secondary">
            Annulla
          </Button>
          <Button onClick={onConfirm} type="button">
            Conferma
          </Button>
        </div>
      </Card>
    </div>
  );
}
